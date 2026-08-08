# Firebase + Google Play Billing — guia de configuração (Premium do Orbi)

Arquitetura escolhida:

- **Google Play Billing** é a **fonte oficial** da compra (valida compra, renovação,
  cancelamento e período de teste).
- Após validar, o status (Premium / em teste / data de expiração) é **sincronizado
  no Firebase (Firestore)**, ligado ao `uid` da conta Google.
- **Login com Google é obrigatório** para sincronizar e restaurar a assinatura ao
  trocar de aparelho ou reinstalar.

```
┌──────────┐  compra   ┌────────────────────┐
│   App    │──────────▶│ Google Play Billing│  (fonte da verdade)
│ (Android)│◀──────────│  compra + trial    │
└────┬─────┘  token    └─────────┬──────────┘
     │ envia purchaseToken+uid   │ RTDN (Pub/Sub) em renovação/cancelamento
     ▼                           ▼
┌───────────────────────────────────────────┐
│ Cloud Functions (backend confiável)        │
│  • valida token na Play Developer API      │
│  • grava status em users/{uid} no Firestore│
└─────────────────────┬─────────────────────┘
                       ▼
                 ┌───────────┐   app lê o status (tempo real)
                 │ Firestore │◀──────────────────────────────
                 └───────────┘
```

> ⚠️ **Regra de ouro:** o app NUNCA decide sozinho se é Premium. Quem escreve o
> status Premium no Firestore é **só o backend (Cloud Functions)**, depois de
> validar na Play. O app apenas **lê**. Isso evita fraude (usuário editar o
> próprio status).

---

## 0. Decisão de empacotamento (antes de tudo)

O app hoje é um site (Vite + React). Para usar o **Play Billing**, ele precisa
virar um app Android. Dois caminhos:

- **Capacitor** (recomendado): empacota o web app como app Android nativo e
  permite usar um plugin de compras. Mais controle, funciona bem com assinaturas.
- **TWA / Bubblewrap**: mais simples, mas o Billing dentro de TWA usa a *Digital
  Goods API* e tem mais limitações para assinatura + trial.

Este guia assume **Capacitor** (mais robusto para assinaturas). A parte de
Firebase abaixo é a mesma nos dois casos.

Opcional, mas vale saber: **RevenueCat** faz a ponte com o Play Billing, valida no
servidor e ainda tem integração pronta com Firebase — economiza muito do trabalho
de servidor descrito nas seções 5–7. Se um dia quiser simplificar, é o atalho.

---

## 1. Confirmar / criar o projeto no Firebase Console

1. Acesse <https://console.firebase.google.com>.
2. Se o projeto **`meu-app-calendario`** já existe (foi usado no backend de
   feriados), **use ele**. Senão, clique **Adicionar projeto** e crie.
3. Confirme o plano de faturamento: para usar **Cloud Functions que chamam a Play
   Developer API** e **Pub/Sub**, o projeto precisa estar no plano **Blaze**
   (pago por uso; tem cota grátis generosa). Menu ⚙️ → **Uso e faturamento**.

---

## 2. Registrar os apps no projeto

Você terá dois "apps" dentro do mesmo projeto Firebase:

### 2a. App Web (para o front-end pegar as credenciais)
1. Firebase Console → ⚙️ **Configurações do projeto** → aba **Geral** → **Seus
   apps** → ícone **</>** (Web).
2. Apelido: `orbi-web`. Registrar.
3. Copie o objeto de config (`apiKey`, `authDomain`, etc.) — vamos jogar nas
   variáveis `VITE_FIREBASE_*` (ver seção 8).

### 2b. App Android (quando empacotar com Capacitor)
1. Mesmo lugar → ícone **Android**.
2. **Nome do pacote** (applicationId), ex.: `com.seunome.orbi` — anote, será o
   mesmo no Play Console.
3. Baixe o **`google-services.json`** e coloque em `android/app/` do projeto
   Capacitor.
4. **SHA-1 e SHA-256**: gere as assinaturas do app (debug e release) e cadastre
   aqui — são **obrigatórias** para o login com Google funcionar no Android.
   - Debug: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
   - Release: use as do **App signing** do Play Console (Play gerencia a chave).

---

## 3. Authentication — login com Google (obrigatório)

1. Firebase Console → **Authentication** → **Começar**.
2. Aba **Sign-in method** → habilite **Google** → salve.
3. Defina o e-mail de suporte do projeto.
4. (Android) O login usa o `google-services.json` + os SHA cadastrados no passo 2b.
5. (Web, para testar no navegador) Em **Authentication → Settings → Authorized
   domains**, confirme que `localhost` está lá.

No app, o login já está "encaixado" no stub `src/lib/auth.js` — depois é só trocar
o corpo das funções pelas do Firebase (passo 9).

---

## 4. Firestore — banco e modelo de dados

1. Firebase Console → **Firestore Database** → **Criar banco** → modo
   **Produção** → região **`southamerica-east1`** (mesma das functions).

### Modelo de dados sugerido

```
users/{uid}
  email: string
  nome: string
  criadoEm: timestamp
  premium: {
    ativo: boolean            // true se Premium (assinatura válida ou em teste)
    origem: "trial" | "assinatura"
    plano: "mensal" | "anual" | null
    expiraEm: timestamp | null   // fim do ciclo/trial
    status: "active" | "in_trial" | "canceled" | "expired" | "grace_period"
    atualizadoEm: timestamp
    purchaseToken: string     // token da Play (usado pelo backend p/ revalidar)
  }
```

### Regras de segurança (Firestore Rules)

O cliente **lê** o próprio documento, mas **não pode escrever** o campo `premium`
(só o backend via Admin SDK escreve). Substitua o conteúdo de `firestore.rules`
mantendo o bloqueio atual do cache de feriados:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Cada usuário lê o próprio doc; escrita de perfil limitada, nunca 'premium'.
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow create, update: if request.auth != null
        && request.auth.uid == uid
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['premium']);
      // 'premium' só é escrito pelo Admin SDK (Cloud Functions), que ignora estas regras.
    }

    // Cache de feriados: continua só via Cloud Function.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Depois: `firebase deploy --only firestore:rules`.

---

## 5. Play Console — criar as assinaturas e a oferta de teste

1. <https://play.google.com/console> → crie o app (mesmo `applicationId` do passo 2b).
2. **Monetizar → Produtos → Assinaturas** → crie o produto:
   - `orbi_premium` (uma assinatura com dois **base plans**), ou dois produtos.
3. **Base plans**:
   - `mensal` — R$ 12,90 / mês.
   - `anual` — R$ 89,90 / ano.
4. **Oferta (offer)** de **teste grátis de 7 dias** vinculada aos base plans
   (free trial de 7 dias). O trial passa a ser gerido pela **Play**, não pelo app.
5. Anote os IDs (product id / base plan id / offer id) — o app usa na compra.

> A partir daqui, o "trial de 7 dias" real vem da Play. O trial local que está no
> app hoje (`src/lib/premium.js`) vira só um *fallback* enquanto o usuário não
> loga / antes de integrar o Billing.

---

## 6. Play Developer API — validação servidor-a-servidor

Para o backend validar o `purchaseToken`:

1. **Google Cloud Console** (mesmo projeto do Firebase) → **APIs e serviços** →
   ative a **Google Play Android Developer API**.
2. Crie (ou reuse) uma **Service Account** → gere uma chave JSON.
3. **Play Console → Configurações → Acesso à API** → vincule o projeto Google
   Cloud e **conceda acesso à service account** (permissão para ver dados
   financeiros / gerenciar pedidos).
4. No backend, a validação usa o endpoint
   `purchases.subscriptionsv2.get` (biblioteca `googleapis`, `androidpublisher`).

---

## 7. RTDN — notificações de renovação/cancelamento (Pub/Sub)

Para o Firebase saber quando renovou, cancelou, entrou em período de carência etc.
**sem o app abrir**:

1. **Google Cloud → Pub/Sub** → crie um **tópico**, ex.: `play-rtdn`.
2. **Play Console → Monetizar → Configuração de monetização → Notificações
   em tempo real do desenvolvedor** → cole o nome do tópico.
3. Crie uma **Cloud Function** acionada por esse tópico (trigger Pub/Sub) que:
   - lê a notificação, pega o `purchaseToken`,
   - revalida na Play Developer API,
   - atualiza `users/{uid}.premium` no Firestore.

---

## 8. Cloud Functions a criar (backend)

No diretório `functions/` (já existe, gen2, nodejs20, região `southamerica-east1`):

- **`vincularCompra`** (HTTPS chamável, exige login): recebe `purchaseToken` +
  `productId` do app após a compra, valida na Play Developer API e grava
  `users/{uid}.premium`. É o que **liga a compra ao usuário**.
- **`rtdnHandler`** (Pub/Sub, tópico `play-rtdn`): trata renovação/cancelamento e
  atualiza o Firestore (seção 7).
- **`restaurarAssinatura`** (HTTPS chamável, opcional): revalida a assinatura atual
  do usuário logado (útil ao reinstalar).

Dependências novas em `functions/package.json`: `googleapis` (Play Developer API).
Segredos (não no código):

```
firebase functions:secrets:set PLAY_SERVICE_ACCOUNT   # JSON da service account (seção 6)
```

---

## 9. Variáveis do front-end (`.env.local`)

Do passo 2a, preencha (e adicione ao `.env.example` sem os valores reais):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=meu-app-calendario.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=meu-app-calendario
VITE_FIREBASE_STORAGE_BUCKET=meu-app-calendario.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> A `apiKey` do Firebase Web **não é segredo** (pode ir para o app); a segurança
> vem das **Firestore Rules** + validação no backend.

---

## 10. Ligar o app (o que muda no código — fase 2)

Tudo já está preparado para essa troca:

- `src/lib/auth.js` → trocar o stub por `firebase/auth` (signInWithPopup /
  onAuthStateChanged / signOut / deleteUser). Ao logar, criar/atualizar
  `users/{uid}`.
- `src/lib/premium.js` → em vez de ler o trial do localStorage, **ouvir
  `users/{uid}.premium` no Firestore** (onSnapshot) e derivar `ehPremium()`,
  `estado()`, `diasRestantes()` daí. O localStorage vira só cache offline.
- `src/lib/PremiumContext.jsx` → já centraliza o estado; passa a reagir ao snapshot
  do Firestore. O paywall, o selo ✨ e o gating de temas **não mudam**.
- Botão **Assinar** → dispara o fluxo de compra do Play Billing (plugin), e no
  sucesso chama a Cloud Function `vincularCompra`.

---

## Checklist rápido

- [ ] Projeto no Blaze (seção 1)
- [ ] App Web registrado + config copiada (2a)
- [ ] App Android registrado + `google-services.json` + SHA-1/256 (2b)
- [ ] Authentication com Google habilitado (3)
- [ ] Firestore criado + regras publicadas (4)
- [ ] Assinaturas mensal/anual + oferta de 7 dias no Play Console (5)
- [ ] Play Developer API ativada + service account com acesso (6)
- [ ] Tópico Pub/Sub `play-rtdn` + RTDN configurado (7)
- [ ] Cloud Functions `vincularCompra` / `rtdnHandler` (8)
- [ ] `.env.local` com `VITE_FIREBASE_*` (9)
```

# Publicação na Google Play Store — Orbi

Auditoria e preparação do app (`com.orbit.calendario`, Capacitor + Vite + React).
Data da auditoria: 2026-08-04.

---

## ✅ O que já foi implementado neste commit

| Item | Arquivo | Status |
|------|---------|--------|
| Config de Release + assinatura via `keystore.properties` | `android/app/build.gradle` | ✅ |
| Modelo de credenciais de assinatura | `android/keystore.properties.example` | ✅ |
| ProGuard/R8 (minify + shrinkResources + regras) | `android/app/build.gradle`, `android/app/proguard-rules.pro` | ✅ |
| Config de Android App Bundle (splits) | `android/app/build.gradle` (`bundle { }`) | ✅ |
| Remoção de logs de debug no bundle de produção | `vite.config.js` (`esbuild.pure/drop`) | ✅ |
| Segredos fora do Git (keystore, `google-services.json`, `CHAVE API.txt`) | `.gitignore` | ✅ |
| `versionName` normalizado para `1.0.0` | `android/app/build.gradle` | ✅ |
| Ícones adaptativos (background + foreground, `anydpi-v26`) | `res/mipmap-anydpi-v26/*` | ✅ já existia |
| Splash Screen (`Theme.SplashScreen` + `splash.png`) | `res/values/styles.xml` | ✅ já existia |
| Nenhum `console.*` no código-fonte JS | `src/**` | ✅ verificado |

> **Nada de APK/AAB foi gerado** — conforme solicitado.

---

## ⛔ Bloqueadores obrigatórios antes de publicar

Estes itens **não podem ser feitos só por código** — exigem ações suas / no Google
Play Console e Firebase.

### Fingerprints da upload key (keystore `orbit-release.jks`, alias `orbit`)
> Usados no Firebase (login Google) e onde a Play pedir. Não são secretos.
> **SHA-1:** `05:E6:F4:FC:91:10:7A:7A:84:41:5D:F8:44:49:78:59:51:F4:FA:43`
> **SHA-256:** `5C:55:E7:92:17:38:E5:7F:2C:DC:04:73:C6:4F:2C:40:E6:11:92:3F:34:B0:FF:1D:66:7C:00:0B:8D:E9:83:CE`
>
> ⚠️ Ao ativar o **Play App Signing**, o Google gera OUTRA chave (a de assinatura
> final). Depois do 1º upload, pegue a SHA-1/SHA-256 dela no Play Console
> (Configuração → Assinatura de apps) e **adicione também no Firebase**.

### 1. Gerar o keystore de release (assinatura)  ✅ FEITO
```bash
cd android
keytool -genkey -v -keystore orbit-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias orbit
```
Depois crie `android/keystore.properties` a partir do `.example` e preencha as senhas.
- **Guarde o `.jks` + senhas com backup seguro.** Perder = nunca mais atualizar o app.
- Recomendado: ativar **Play App Signing** (o Google guarda a chave de assinatura final;
  seu keystore vira apenas a "upload key").

### 2. Google Play Billing (assinatura Premium) — via RevenueCat

**Código já implementado** (`@revenuecat/purchases-capacitor`):
- `src/lib/billing.js` — wrapper do RevenueCat (configure, offerings, compra,
  restaurar, login/logout por uid, listener). Só ativa no app + com a chave.
- `src/lib/premium.js` — usa o entitlement `premium` do RevenueCat como fonte da
  verdade; trial local de 7 dias mantido; `assinar()` agora é assíncrono (compra
  real); `cancelarAssinatura()` abre a página de assinaturas da Play; `restaurar()`.
- `src/lib/auth.js` — liga/desliga a conta RevenueCat ao uid do Firebase.
- Sem `VITE_REVENUECAT_ANDROID_KEY` o app cai no modo local (não cobra) — dev/web ok.

**Falta você fazer (painéis):**
1. Criar conta no **RevenueCat** → novo projeto → adicionar app **Google Play**
   (pacote `com.orbit.calendario`). Precisa vincular a **conta de serviço do
   Google Play** (RevenueCat gera as credenciais / você concede acesso no Play).
2. No **Play Console → Monetização → Produtos → Assinaturas**, criar:
   - `orbi_mensal` (R$ 12,90/mês)
   - `orbi_anual` (R$ 89,90/ano)
   - Em cada uma, criar a **oferta de teste grátis de 7 dias** (free trial).
   > Requer o app já criado no Play Console e um build enviado a uma faixa (ex.:
   > teste interno) — por isso o teste real do billing acontece junto do Passo 7.
3. No RevenueCat: criar o **entitlement `premium`**, criar/importar os produtos,
   e montar uma **Offering** "current" com os pacotes **Mensal** e **Anual**.
4. Copiar a **Public app key (Google)** do RevenueCat para `VITE_REVENUECAT_ANDROID_KEY`
   no `.env.local`.
5. (Opcional, recomendado) Ativar no RevenueCat as **Real-time Developer
   Notifications** do Google para manter o estado da assinatura em dia.

> A permissão `com.android.vending.BILLING` é adicionada automaticamente pelo
> plugin (merge do manifest).

### 3. Login com Google em Release — **quebra hoje**
`src/lib/auth.js` usa `signInWithPopup`, que **não funciona no WebView do Capacitor**
(sem janela popup). Em release o login com Google falha.

Solução recomendada — autenticação nativa:
```bash
npm i @capacitor-firebase/authentication
npx cap sync android
```
- Trocar `entrarComGoogle()` por `FirebaseAuthentication.signInWithGoogle()`.
- No `Firebase Console → Authentication`, habilitar o provedor Google.
- Cadastrar as **SHA-1 e SHA-256** (upload key **e** a chave do Play App Signing)
  em *Project settings → Your apps → Android*:
  ```bash
  keytool -list -v -keystore android/orbit-release.jks -alias orbit
  ```
- Baixar o `google-services.json` atualizado (ver item 4).

### 4. Firebase de produção (`google-services.json` ausente)
O `android/app/build.gradle` já aplica o plugin `google-services` **se** o arquivo existir.
- Baixe `google-services.json` do Firebase Console (app Android `com.orbit.calendario`)
  e coloque em `android/app/google-services.json` (já está no `.gitignore`).
- Confirme que as variáveis `VITE_FIREBASE_*` de produção estão no ambiente de build.
- Publique as `firestore.rules` de produção: `firebase deploy --only firestore:rules`.
- Faça deploy da Cloud Function de feriados: `firebase deploy --only functions`.

---

## 🔧 Compatibilidade Android 13 / 14 / 15

- `minSdk 24`, `compileSdk 36`, `targetSdk 36` — cobre Android 13, 14 e 15.
  > A partir de 31/08/2025 o Play exige **targetSdk ≥ 35 (Android 15)**. `36` atende.
- **Android 13+ (POST_NOTIFICATIONS):** o plugin `@capacitor/local-notifications`
  já faz o merge da permissão e o código pede em runtime (`pedirPermissao`). ✅
- **Alarmes exatos (Android 13/14):** os lembretes usam `allowWhileIdle`. Se o Play
  cobrar a permissão `SCHEDULE_EXACT_ALARM`, avalie:
  - usar `USE_EXACT_ALARM` (permitido para apps de calendário/alarme — **este é**),
    **ou** migrar para alarme inexato para evitar a declaração de política.
- **Edge-to-edge (Android 15):** apps com target 35+ ganham layout edge-to-edge por
  padrão. Teste a WebView para o conteúdo não ficar sob a status/navigation bar.

**Ação:** após `npx cap sync`, verifique o manifest final em
`android/app/build/intermediates/merged_manifests/` para confirmar as permissões
realmente incluídas.

---

## 🔐 Permissões

Declaradas explicitamente: apenas `INTERNET` (`AndroidManifest.xml`). As demais
(`POST_NOTIFICATIONS`, `VIBRATE`, `RECEIVE_BOOT_COMPLETED`, `SCHEDULE_EXACT_ALARM`)
vêm do merge do plugin de notificações e **são usadas**. Billing adicionará
`com.android.vending.BILLING`. Não há permissões supérfluas a remover.

---

## 📋 Políticas da Play Store — checklist

- [x] **Política de Privacidade** criada em `site/politica-privacidade.html`.
      - Falta: substituir `SEU-EMAIL-DE-CONTATO` por um e-mail de suporte real.
      - Publicar: `firebase deploy --only hosting` → URL:
        `https://meu-app-calendario.web.app/privacidade`
- [ ] **Data safety form** no Play Console. Mapeamento real deste app:
      - **Dados coletados:** Nome, E-mail (login Google); foto de perfil; ID de
        usuário; info de compra/assinatura (via Google Play/RevenueCat).
      - **NÃO coletados na nuvem:** eventos, objetivos, categorias — ficam só no
        aparelho (localStorage).
      - **Criptografia em trânsito:** sim (HTTPS/Firebase).
      - **Usuário pode pedir exclusão:** sim (ver abaixo).
- [x] **Exclusão de conta:** `deletarConta()` no app remove o perfil da nuvem; a
      política descreve o processo e um e-mail de contato (exigência do Play).
- [ ] **Assinaturas:** o paywall já informa preço/período/renovação e "gerenciar
      assinatura" abre a página da Play. Repetir esses termos na ficha da loja.
- [ ] Questionário de **classificação etária**.
- [ ] **Público-alvo:** não direcionado a crianças (política já declara ≥13).
- [ ] Ficha da loja: descrição, screenshots (telefone), ícone 512×512 (já existe
      em `public/icone-app-512.png`), feature graphic 1024×500.

---

## 🚀 Como gerar o AAB (quando liberar)

```bash
# 1. Build web + sync
npm run build
npx cap sync android

# 2. Bundle assinado de release
cd android
./gradlew bundleRelease        # Windows: .\gradlew.bat bundleRelease
# Saída: android/app/build/outputs/bundle/release/app-release.aab
```
Faça upload do `.aab` numa faixa de teste (interno/fechado) **antes** da produção.

---

## Resumo do que ainda falta (ordem sugerida)

1. ✅ Gerar keystore + `keystore.properties`.
2. ✅ Adicionar `google-services.json` (login Google nativo já corrigido em `auth.js`
   via `@capacitor-firebase/authentication`; `variables.gradle` com `rgcfaIncludeGoogle=true`).
3. ✅ Billing via RevenueCat implementado no código (`billing.js` + `premium.js`).
4. ⏳ Criar conta/entitlement no RevenueCat + produtos de assinatura no Play Console
   + preencher `VITE_REVENUECAT_ANDROID_KEY`.
5. ⏳ Política de privacidade + Data safety + classificação.
6. ⏳ Testar em Android 13/14/15 (notificações, alarmes, edge-to-edge, widgets) — inclui
   validar o login Google nativo em release.
7. ⏳ Gerar AAB assinado e subir em faixa de teste.

# Orbi — Guia de submissão na Play Store (respostas prontas)

Documento para preencher a **ficha da loja e as declarações** no Google Play Console.
Complementa o `PUBLICACAO-PLAYSTORE.md` (que cobre a parte técnica: keystore, AAB,
Firebase, RevenueCat). Aqui está tudo que você **responde/cola** nos formulários.

- **App:** Orbi
- **Pacote (Application ID):** `com.orbit.calendario`
- **E-mail de contato:** orbitbyadvance@gmail.com
- **URL da política de privacidade:** `https://meu-app-calendario.web.app/privacidade`
  (publique antes com `firebase deploy --only hosting`)
- **Versão:** versionName `1.0.0`, versionCode `1`

---

## ⚠️ 0. Leia primeiro (conta nova = teste fechado obrigatório)

Contas de desenvolvedor **pessoais** criadas recentemente precisam, antes de liberar a
**produção**, rodar um **teste fechado com no mínimo 20 testers por 14 dias seguidos**.
Só depois o botão de "Produção" é liberado. Planeje: junte ~20 pessoas (e-mails Google)
para o teste fechado desde já. (Contas de **organização** costumam não ter essa regra.)

Ordem prática recomendada:
1. Criar o app no Console → preencher ficha + Data Safety + classificação (este doc).
2. Subir o AAB numa faixa de **Teste fechado**.
3. Rodar os 14 dias com 20 testers.
4. Liberar produção.

---

## 1. Criar app (tela "Criar app")

| Campo | Resposta |
|-------|----------|
| Nome do app | **Orbi** (ou "Orbi: Agenda e Sua História" — máx. 30 caracteres) |
| Idioma padrão | Português (Brasil) – pt-BR |
| App ou jogo | **App** |
| Gratuito ou pago | **Gratuito** (com compras no app — assinatura) |
| Declarações | Aceitar as diretrizes do programa para desenvolvedores e leis de exportação dos EUA |

---

## 2. Ficha da loja principal (Store listing)

**Nome do app (máx. 30):**
```
Orbi: Agenda e Sua História
```

**Descrição curta (máx. 80):**
```
Organize seus dias e construa a linha do tempo da sua vida.
```

**Descrição completa (máx. 4000):**
```
O Orbi é mais do que uma agenda. Além de organizar seus compromissos do dia a dia, ele guarda os momentos que marcaram a sua vida — e transforma tudo isso numa linha do tempo que cresce com você.

ORGANIZE O SEU PRESENTE
• Calendário mensal e agenda diária, simples e bonitos
• Compromissos, eventos e aniversários com lembretes
• Categorias (etiquetas) coloridas para separar trabalho, estudos, saúde e mais
• Lembretes locais que funcionam mesmo offline
• Vários temas para deixar o app com a sua cara

GUARDE A SUA HISTÓRIA
• Registre "momentos de vida": nascimento, formatura, casamento, primeiro emprego, viagens e conquistas
• Veja tudo numa linha do tempo — a sua Minha História
• Mapa da Vida: uma visão geral das áreas e marcos da sua trajetória
• Retrospectiva do ano: um resumo afetivo de tudo que você viveu e organizou

FUNCIONA DO SEU JEITO
• Sem cadastro e offline por padrão — seus dados ficam no seu aparelho
• Se quiser, entre com o Google para salvar sua história na nuvem e acessá-la em outro aparelho
• Lembrete do seu aniversário, todo ano

PREMIUM
Recursos como a Minha História, o Mapa da Vida e todos os temas fazem parte do Orbi Premium, com 7 dias grátis. A assinatura é mensal ou anual, renova automaticamente e pode ser cancelada a qualquer momento na Google Play.

O Orbi resolve o seu presente, preserva o seu passado e mostra a sua trajetória. Comece a construir a sua história hoje.
```

**Outros campos da ficha:**
| Campo | Resposta |
|-------|----------|
| Categoria do app | **Produtividade** (alternativa: Estilo de vida) |
| Tags | calendário, agenda, planner, lembretes, organização |
| E-mail de contato | orbitbyadvance@gmail.com |
| Site (opcional) | `https://meu-app-calendario.web.app` |
| Telefone (opcional) | deixar em branco se não quiser expor |

---

## 3. Recursos gráficos (assets)

| Asset | Requisito | Status |
|-------|-----------|--------|
| Ícone do app | 512×512 PNG (32-bit, com alpha) | ✅ `public/icone-app-512.png` |
| Feature graphic | 1024×500 PNG/JPG | ⛔ **criar** (banner de destaque) |
| Screenshots de celular | 2 a 8 imagens, PNG/JPG, lado 320–3840px | ⛔ **gerar** |
| Screenshots de tablet 7"/10" | opcional | — |

**Como gerar os screenshots (rápido):**
1. `npm run build && npm run preview` (ou o dev server) e abra no celular/emulador, ou
2. use o próprio aparelho com o app instalado e tire prints das telas mais bonitas:
   Calendário, Agenda, Minha História (com momentos), Mapa da Vida, Retrospectiva.

Sugestão de 5 screenshots: **Calendário → Agenda → Minha História → Mapa da Vida → Retrospectiva.**
Para o **feature graphic**, um fundo na cor do app com o logo (montanha dourada) + o texto
"Organize seus dias. Construa sua história." funciona bem.

---

## 4. Segurança dos dados (Data safety) — RESPOSTAS

> Regra do Google: "coleta" = dado que **sai do aparelho**. Sem login, o Orbi não
> coleta nada (tudo é local). Com login (opcional), os dados abaixo vão para o Firebase.
> Por isso marque a coleta como **opcional**.

**Perguntas gerais:**
- O app coleta ou compartilha dados do usuário? **Sim**
- Todos os dados são **criptografados em trânsito**? **Sim**
- O usuário pode **solicitar a exclusão** dos dados? **Sim** (excluir conta no app + e-mail de contato)

**Tipos de dados coletados** (todos: coleta **opcional**, **não** compartilhados com terceiros,
finalidades **Funcionalidade do app** e **Gerenciamento da conta**):

| Categoria | Tipo | Observação |
|-----------|------|-----------|
| Informações pessoais | Nome | do login Google |
| Informações pessoais | Endereço de e-mail | do login Google |
| Informações pessoais | IDs do usuário | uid da conta |
| Informações pessoais | Outras informações | **data de nascimento** e **cidade** (quando informadas) |
| Fotos e vídeos | Fotos | **apenas a foto de perfil do Google** (avatar). Se preferir não declarar Fotos, mova o avatar para "Informações pessoais → Outras" |
| Atividade no app | Outro conteúdo gerado pelo usuário | **momentos de vida**, objetivos, notas |
| Agenda | Eventos da agenda | os compromissos do calendário |
| Informações financeiras | Histórico de compras | estado da assinatura (via Google Play / RevenueCat) |

**Compartilhamento:** Nenhum. Firebase e RevenueCat são **processadores** (prestadores de
serviço) que tratam os dados em seu nome — não é "compartilhamento" na definição do Google.

**Finalidades marcadas:** Funcionalidade do app; Gerenciamento da conta.
**NÃO marcar:** Análise, Publicidade/marketing, Personalização, Fraude/segurança.

---

## 5. Classificação de conteúdo (questionário IARC) — RESPOSTAS

Categoria do questionário: **Aplicativo (Referência, notícias ou educação → "Outro/Utilitário")**.

| Pergunta | Resposta |
|----------|----------|
| Contém violência? | Não |
| Contém conteúdo sexual/nudez? | Não |
| Contém linguagem imprópria/palavrões? | Não |
| Referências a drogas, álcool ou tabaco? | Não |
| Simula jogos de azar / apostas? | Não |
| Contém conteúdo assustador? | Não |
| O app compartilha a **localização** do usuário? | Não |
| Permite que usuários **interajam/se comuniquem** entre si (chat, fórum)? | Não |
| Permite compartilhar conteúdo gerado pelo usuário publicamente? | Não |
| Oferece **compras digitais**? | **Sim** (assinatura) |
| Coleta/compartilha dados pessoais com terceiros? | Não (só processadores; ver Data safety) |

Resultado esperado: **Livre / Classificação para todos (3+)**.

---

## 6. Público-alvo e conteúdo (Target audience)

| Campo | Resposta |
|-------|----------|
| Faixas etárias-alvo | **18 e mais** (recomendado para simplificar). Se quiser incluir 13–17, o app é adequado, mas entra no programa "Famílias" com regras extras |
| O app é direcionado a crianças? | **Não** |
| Apela involuntariamente a crianças? | Não (design e conteúdo adultos/neutros) |

> A política de privacidade já declara "não direcionado a menores de 13 anos".

---

## 7. Demais declarações

| Seção | Resposta |
|-------|----------|
| **Anúncios** | O app **não contém anúncios** |
| **Acesso ao app** (App access) | Todas as funcionalidades essenciais estão disponíveis **sem login/restrição** (o app funciona 100% local). Login com Google e Premium são **opcionais**. Sem credenciais de teste necessárias (login é via conta Google do próprio revisor; Premium é testável via *license testing* da Play) |
| **Exclusão de dados** (Data deletion) | Como o app permite criar conta (login Google), o Google pede como excluir. Respostas: exclusão **dentro do app** (Mais → conta → excluir conta) **e** URL para solicitar exclusão = a própria política `https://meu-app-calendario.web.app/privacidade` (descreve o processo + e-mail orbitbyadvance@gmail.com) |
| **App de notícias** | Não |
| **App de COVID-19 / rastreamento** | Não |
| **Recursos governamentais** | Não |
| **Recursos financeiros** | Não (assinatura de app ≠ produto financeiro) |
| **Saúde** | Não |
| **Conteúdo gerado por IA** | Não |
| **Público de dados sensíveis / SDKs** | Nenhum SDK de anúncios; só Firebase + RevenueCat |

---

## 8. Assinaturas (Monetização) — resumo

Detalhes técnicos no `PUBLICACAO-PLAYSTORE.md` (seção 2). No Console → **Monetização →
Produtos → Assinaturas**, crie:

| Produto (ID) | Preço | Período | Oferta |
|--------------|-------|---------|--------|
| `orbi_mensal` | R$ 12,90 | mensal | teste grátis 7 dias |
| `orbi_anual` | R$ 89,90 | anual | teste grátis 7 dias |

O paywall do app já informa preço, período e renovação, e o "gerenciar assinatura"
abre a página da Play — repita esses termos na ficha, como o Google exige.

---

## 9. Checklist final antes de enviar

- [ ] Publicar a política: `firebase deploy --only hosting` → confirmar `…/privacidade` abre
- [ ] Publicar as regras: `firebase deploy --only firestore:rules`
- [ ] Criar app no Console + ficha (seções 1–3)
- [ ] Feature graphic 1024×500 + 2–8 screenshots
- [ ] Data safety (seção 4) — **conferir que bate com a política atualizada**
- [ ] Classificação de conteúdo (seção 5)
- [ ] Público-alvo (seção 6) + demais declarações (seção 7)
- [ ] Criar as 2 assinaturas + ofertas de trial (seção 8)
- [ ] Gerar AAB assinado (ver `PUBLICACAO-PLAYSTORE.md`) e subir em **Teste fechado**
- [ ] Rodar 20 testers por 14 dias (conta nova) → liberar Produção

---

## 10. Nota importante sobre o sync (privacidade x realidade)

A política e o Data safety foram **atualizados** para refletir que, com login, o Orbi
agora sincroniza na nuvem: **momentos de vida, eventos, objetivos, categorias, data de
nascimento e cidade**. Antes o texto dizia que esses dados "nunca saíam do aparelho" —
o que deixou de ser verdade na versão com sincronização. Garanta que as respostas do
Data safety continuem batendo com a política a cada mudança futura, senão a Play pode
reprovar por inconsistência.

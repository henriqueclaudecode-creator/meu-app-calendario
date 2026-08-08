# Backend de feriados (Firebase)

Fluxo: **app → Cloud Function `feriados` → cache no Firestore → Feriados API**.
O app nunca chama a Feriados API direto; a chave fica só no servidor e o cache
faz cada combinação (escopo + chave + ano) bater na API uma única vez.

> ⚠️ **Plano Blaze necessário.** Cloud Functions só fazem chamadas externas
> (para a feriadosapi.com) no plano **Blaze** (pré-pago). O plano gratuito Spark
> bloqueia. O custo real deste uso é praticamente zero (o cache faz pouquíssimas
> chamadas), mas exige cadastrar um cartão.

## Deploy (uma vez)

Pré-requisito: [Firebase CLI](https://firebase.google.com/docs/cli) (`npm i -g firebase-tools`).

```bash
# 1. Login
firebase login

# 2. Apontar para o seu projeto (troque no .firebaserc ou use --project)
#    Crie o projeto em https://console.firebase.google.com e ative o Firestore.
firebase use SEU_PROJECT_ID

# 3. Instalar as dependências da function
cd functions && npm install && cd ..

# 4. Guardar a chave da Feriados API como secret (NÃO vai para o código)
firebase functions:secrets:set FERIADOS_API_KEY
#    (cole o token quando pedir)

# 5. Publicar regras do Firestore + a function
firebase deploy --only firestore:rules,functions
```

Ao terminar, o CLI mostra a **URL da function**, algo como:
`https://southamerica-east1-SEU-PROJETO.cloudfunctions.net/feriados`

## Ligar o app ao backend

No `.env.local` da raiz (copie de `.env.example`):

```
VITE_FERIADOS_FN_URL=https://southamerica-east1-SEU-PROJETO.cloudfunctions.net/feriados
```

Sem essa variável, o app funciona só com os feriados **nacionais offline**
(`src/lib/feriadosNacionais.js`). Com ela, passa a pegar estaduais/municipais
via cache.

## Testar

```bash
curl "https://southamerica-east1-SEU-PROJETO.cloudfunctions.net/feriados?ano=2026&uf=SP"
```

Resposta: `{ escopo, chave, ano, origem: "api"|"cache", dados: [{ data, nome, tipo, bancario }] }`.
A primeira chamada vem com `origem: "api"`; as seguintes, `"cache"`.
Passe `&forcar=1` para forçar a atualização de uma combinação.

## Estrutura no Firestore

Coleção `holidays`, um doc por combinação (id = `escopo_chave_ano`):

```
holidays/nacional_-_2026
holidays/estadual_SP_2026
holidays/municipal_3550308_2026
  → { escopo, chave, ano, dados: [...], atualizado_em }
```

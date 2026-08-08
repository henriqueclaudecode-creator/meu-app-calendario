# Widgets de tela inicial (Android)

Documentação da camada de widgets nativos do Orbit: como a ponte de dados
funciona, o que cada widget faz e como manter/estender. Referência para quando
formos empacotar e publicar na Play Store.

## Visão geral

O app é um projeto **web (Vite + React)** empacotado como app Android via
**Capacitor**. Widgets de tela inicial são **código nativo** (Kotlin + XML) — não
dá para fazê-los em React. Eles vivem em `android/app/src/main/`.

Como o WebView e os widgets são processos separados, eles não compartilham o
`localStorage`. A comunicação é feita por **SharedPreferences**, usando o
**Capacitor Preferences** como ponte.

```
┌─────────────────────────┐        SharedPreferences         ┌────────────────────┐
│  App web (React/WebView) │  ──"CapacitorStorage"─────────▶  │  Widgets nativos    │
│  src/lib/widget.js       │      (chaves widget_*)           │  *.kt lêem e pintam │
│  Preferences.set(...)    │                                  │                    │
│  WidgetBridge.refresh() ─┼──────── plugin nativo ──────────▶│  atualizarTodos()   │
└─────────────────────────┘                                  └────────────────────┘
```

## A ponte de dados

### Lado web — `src/lib/widget.js`

`publicarWidget(eventos, categorias, { premium })` é chamada sempre que os eventos
são carregados/alterados (nas telas `Calendario.jsx` e `Agenda.jsx`, dentro de
`carregar()`). Ela:

1. Calcula os dados de cada widget e grava um JSON via
   `Preferences.set({ key, value })`. Chaves publicadas:
   - `widget_proximo`   → próximo evento
   - `widget_contagem`  → contagem regressiva (até 2 eventos)
   - `widget_calendario`→ grade do mês (42 células com chips)
   - `widget_agenda`    → eventos de hoje (widget grátis)
2. Chama `WidgetBridge.refresh()` para os widgets se atualizarem **na hora**.
   Fora do app nativo (navegador), a chamada falha e é ignorada.

> A flag `premium` recebida é do usuário. No payload gravamos `premium: !premium`
> (ou seja, `true` = **não** assinante), que é o que liga o selo "🔒 Recurso
> Premium" nos widgets pagos.

### Lado nativo — leitura

Cada widget lê de:

```kotlin
context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
       .getString("widget_<nome>", null)
```

O Capacitor Preferences grava, no Android, no arquivo SharedPreferences chamado
`CapacitorStorage`, com a chave sem prefixo. (Na web ele usa `localStorage` com a
chave prefixada `CapacitorStorage.<chave>` — por isso os testes no navegador
mostram esse prefixo.)

### Atualização instantânea — `WidgetPlugin.kt`

Plugin Capacitor local (`@CapacitorPlugin(name = "WidgetBridge")`), registrado em
`MainActivity.java` com `registerPlugin(WidgetPlugin.class)`. O método `refresh()`
dispara `atualizarTodos()` de cada provider (um broadcast `APPWIDGET_UPDATE`).

Além disso, cada widget tem `updatePeriodMillis = 1800000` (30 min), então o
sistema também os atualiza periodicamente mesmo sem o app aberto.

## Os widgets

| Widget | Provider (.kt) | Layout | Info XML | Coleção? | Plano |
|---|---|---|---|---|---|
| Agenda de Hoje | `AgendaWidget` | `widget_agenda` | `widget_agenda_info` | Sim (`AgendaWidgetService`) | 🆓 Grátis |
| Próximo Evento | `ProximoEventoWidget` | `widget_proximo_evento` | `widget_proximo_evento_info` | Não | 🔒 Premium |
| Contagem Regressiva | `ContagemWidget` | `widget_contagem` | `widget_contagem_info` | Não | 🔒 Premium |
| Calendário mensal | `CalendarioWidget` | `widget_calendario` | `widget_calendario_info` | Sim (`CalendarioWidgetService`) | 🔒 Premium |

Widgets com "coleção" (lista/grade) usam um `RemoteViewsService` + `Factory` que
constrói cada item; o provider chama `setRemoteAdapter` + `notifyAppWidgetViewDataChanged`.

### Formato dos payloads (JSON)

**`widget_proximo`**
```json
{ "vazio": false, "hora": "14:00", "titulo": "Consulta médica",
  "local": "Saúde", "cor": "#3B82F6", "contagem": "Em 38 minutos",
  "data": "Hoje, 4 de ago.", "premium": false }
```
Quando não há próximo evento: `{ "vazio": true, "premium": <bool> }`.

**`widget_contagem`**
```json
{ "itens": [ { "titulo": "Prova", "dias": 45, "unidade": "dias",
               "data": "18 de setembro de 2025", "cor": "#2563EB" } ],
  "premium": false }
```
Base: eventos **favoritos** futuros; sem favoritos, cai para os próximos eventos.
Até 2 itens.

**`widget_calendario`**
```json
{ "mes": "Ago 2026", "premium": false,
  "celulas": [ { "dia": 4, "noMes": true, "dom": false, "hoje": true,
                 "chips": [ { "t": "Título", "cor": "#8c6a43" } ], "extra": 1 } ] }
```
42 células (grade completa do mês). `dom` marca domingo; `noMes` distingue os dias
de fora; `extra` é o "+N" quando há mais de 2 eventos no dia.

**`widget_agenda`** (grátis)
```json
{ "data": "4 de ago • Seg", "rodape": "5 eventos hoje",
  "itens": [ { "hora": "09:00", "titulo": "Academia", "sub": "Smart Fit",
               "cor": "#3B82F6" } ] }
```

## Identidade visual

Recursos compartilhados em `android/app/src/main/res/`:

- **Cores**: `values/colors.xml` (claro) e `values-night/colors.xml` (escuro),
  prefixo `orbit_*`. Espelham `src/lib/tema.js`. O tema segue o do sistema.
- **Cartões**: `drawable/widget_card_bg.xml` (raio 24dp, superfície + borda
  discreta). `widget_card_soft_bg.xml` para blocos internos.
- **Destaque**: só o dia atual e a contagem usam o azul principal
  (`orbit_accent`). As cores de categoria entram discretas (texto dos chips,
  pontinhos, tint de ícone), "quase misturadas ao fundo".
- **Selo Premium**: `TextView` id `tv_premium` em cada widget pago, exibido só
  quando `premium == true` no payload.

## Como testar

```bash
npm run build          # gera dist/
npx cap sync android   # copia web + plugins para android/
npx cap open android   # abre no Android Studio
```

No Android Studio: rode no emulador/celular, **abra o app uma vez** (para publicar
os dados), depois adicione os widgets pela tela inicial (segurar na home →
Widgets → Orbit). Ao criar/editar eventos, os widgets atualizam na hora.

## Como adicionar um novo widget (resumo)

1. `res/layout/widget_novo.xml` + (se for lista/grade) `..._item.xml`.
2. `res/xml/widget_novo_info.xml` (`AppWidgetProviderInfo`).
3. `NovoWidget.kt` (`AppWidgetProvider`) — ler de `CapacitorStorage`, pintar.
   Se for coleção, criar também `NovoWidgetService.kt` + `Factory`.
4. Registrar `<receiver>` (e `<service>` se coleção) no `AndroidManifest.xml`.
5. Publicar a chave `widget_novo` em `src/lib/widget.js` e disparar no `refresh`
   do `WidgetPlugin.kt` se quiser atualização instantânea.
6. String de descrição em `res/values/strings.xml`.

## Pendências / notas

- **Compilação**: os arquivos Kotlin/XML ainda não foram compilados aqui — validar
  o build no Android Studio.
- **Ícones por categoria**: hoje os widgets usam um ícone genérico tingido com a
  cor da categoria. Mapear ícones por categoria (halter, laptop, estetoscópio…)
  exigiria um vetor por categoria em `res/drawable/`.
- **Feriados** não entram no widget de calendário (só eventos) — dá para adicionar
  publicando-os junto no payload `widget_calendario`.

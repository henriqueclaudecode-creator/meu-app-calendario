# Eventos — locais e convites (sem custo, sem backend)

Os "Eventos" (convidados, local, anexos) funcionam **de graça e sem servidor**.
Não precisa de cartão, chave de API nem configuração. Como funciona cada parte:

## Busca de locais — OpenStreetMap

- O campo **Local** busca no **Nominatim (OpenStreetMap)**, direto do app.
- Ao digitar 3+ letras, aparecem sugestões (nome, endereço, cidade).
- O botão 🗺️ **Abrir no mapa** usa as coordenadas do lugar escolhido.
- Código: [`src/lib/mapas.js`](src/lib/mapas.js).
- Sem chave e sem servidor. Só peça bom senso no volume (o serviço é gratuito e
  mantido pela comunidade); por isso a busca só dispara depois que o usuário
  para de digitar.

## Convites — compartilhar (.ics)

- Em vez de enviar e-mail sozinho (o que exigiria servidor + serviço pago), o
  app **gera o convite no formato de calendário (.ics)** e abre a **tela de
  compartilhar do celular** (WhatsApp, e-mail, Telegram…).
- O convidado toca no arquivo e o evento entra **direto na agenda** dele
  (Google Agenda / Apple Calendar / Outlook entendem `.ics`).
- No computador, se não houver "compartilhar", o app **baixa o `.ics`** para você
  anexar onde quiser.
- Botão **Compartilhar convite** dentro de Evento → Mais opções → Convidados.
- Código: [`src/lib/convites.js`](src/lib/convites.js).

## Anexos

- Hoje ficam guardados no aparelho. Enviá-los junto do convite exigiria subir os
  arquivos para algum armazenamento — fica como próximo passo, se você quiser.

## E se um dia quiser o envio 100% automático?

Aí sim precisaria de um servidor + serviço de e-mail (e, no caso do Google Maps,
de uma conta de cobrança). Não é necessário para o app funcionar — o caminho
grátis acima cobre o uso do dia a dia.

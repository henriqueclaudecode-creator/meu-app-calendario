// Convites no lado do app — GRÁTIS, sem servidor.
//
// Em vez de enviar e-mail sozinho (o que exigiria servidor + serviço pago), o
// app gera o convite no formato de calendário (.ics) e abre a tela de
// compartilhar do celular (WhatsApp, e-mail, etc.). O convidado toca no arquivo
// e ele entra direto na agenda dele.

// Sempre disponível (usa recursos do próprio aparelho/navegador).
export const convitesDisponivel = () => true;

// Compartilha o convite do evento. Tenta, em ordem:
//   1) compartilhar o .ics + os anexos, tudo junto (celular);
//   2) compartilhar só o .ics (se o aparelho não deixar mandar todos os arquivos);
//   3) compartilhar um texto com os dados (sem anexar arquivo);
//   4) baixar o .ics (navegador no computador).
// Retorna 'compartilhado' | 'baixado'.
export async function compartilharConvite(evento) {
  const ics = montarIcs(evento);
  const nomeArq = `${(evento.titulo || 'convite').replace(/[^\w\- ]+/g, '').trim() || 'convite'}.ics`;
  const arquivoIcs = new File([ics], nomeArq, { type: 'text/calendar' });
  const resumo = textoConvite(evento);

  // Anexos do evento (guardados como data URL) viram arquivos reais.
  const anexos = (evento.anexos ?? []).map(anexoParaArquivo).filter(Boolean);
  const comAnexos = [arquivoIcs, ...anexos];

  // 1) Compartilhar tudo junto (convite + anexos).
  if (navigator.canShare && navigator.canShare({ files: comAnexos })) {
    try {
      await navigator.share({ files: comAnexos, title: evento.titulo || 'Convite', text: resumo });
      return 'compartilhado';
    } catch (e) {
      if (e?.name === 'AbortError') return 'compartilhado'; // o usuário fechou a folha
    }
  }

  // 2) Compartilhar só o convite (quando não dá pra mandar todos os arquivos).
  if (navigator.canShare && navigator.canShare({ files: [arquivoIcs] })) {
    try {
      await navigator.share({ files: [arquivoIcs], title: evento.titulo || 'Convite', text: resumo });
      return 'compartilhado';
    } catch (e) {
      if (e?.name === 'AbortError') return 'compartilhado';
    }
  }

  // 3) Compartilhar só o texto (quando o aparelho não deixa anexar arquivo).
  if (navigator.share) {
    try {
      await navigator.share({ title: evento.titulo || 'Convite', text: resumo });
      return 'compartilhado';
    } catch (e) {
      if (e?.name === 'AbortError') return 'compartilhado';
    }
  }

  // 4) Baixar o .ics (computador). Os anexos podem ser baixados pelo próprio card.
  baixar(arquivoIcs);
  return 'baixado';
}

// Converte um anexo salvo ({ nome, tipo, dados: dataURL }) em File.
function anexoParaArquivo(anexo) {
  try {
    const [cabecalho, base64] = String(anexo.dados).split(',');
    const tipo = anexo.tipo || (cabecalho.match(/data:(.*?);/)?.[1]) || 'application/octet-stream';
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new File([bytes], anexo.nome || 'anexo', { type: tipo });
  } catch {
    return null;
  }
}

// Abre/baixa um arquivo (usado no fallback do computador e ao tocar num anexo).
export function baixar(arquivo) {
  const url = URL.createObjectURL(arquivo);
  const a = document.createElement('a');
  a.href = url;
  a.download = arquivo.name || 'arquivo';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Abre um anexo salvo (data URL) — para o usuário ver/baixar dentro do app.
export function abrirAnexo(anexo) {
  const arq = anexoParaArquivo(anexo);
  if (arq) baixar(arq);
}

// Texto curto e legível do convite (usado na folha de compartilhar).
function textoConvite(evento) {
  const linhas = [`📅 ${evento.titulo || 'Evento'}`, quando(evento)];
  if (evento.local) linhas.push(`📍 ${[evento.local.nome, evento.local.endereco].filter(Boolean).join(' — ')}`);
  if (evento.notas) linhas.push('', evento.notas);
  if (evento.participantes?.length) linhas.push('', `Convidados: ${evento.participantes.join(', ')}`);
  return linhas.filter((l) => l !== undefined).join('\n');
}

function quando(evento) {
  const [a, m, d] = String(evento.data || '').split('-');
  if (!a) return '';
  const data = `${d}/${m}/${a}`;
  if (evento.inicio) return `🕒 ${data} · ${evento.inicio}${evento.fim ? ` – ${evento.fim}` : ''}`;
  return `🕒 ${data} · dia todo`;
}

// Monta o arquivo iCalendar (.ics) do evento.
function montarIcs(evento) {
  const uid = `${evento.id || Date.now()}@orbi`;
  const dt = (iso, hora) => {
    const [a, m, d] = String(iso).split('-');
    if (hora) { const [h, min] = hora.split(':'); return `${a}${m}${d}T${h}${min}00`; }
    return `${a}${m}${d}`;
  };
  const inicio = evento.inicio
    ? `DTSTART:${dt(evento.data, evento.inicio)}`
    : `DTSTART;VALUE=DATE:${dt(evento.data)}`;
  const fim = evento.fim
    ? `DTEND:${dt(evento.data, evento.fim)}`
    : (evento.inicio ? `DTEND:${dt(evento.data, evento.inicio)}` : `DTEND;VALUE=DATE:${dt(evento.data)}`);
  const convidados = (evento.participantes ?? [])
    .map((e) => `ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${e}`)
    .join('\r\n');
  const loc = evento.local
    ? `LOCATION:${esc([evento.local.nome, evento.local.endereco].filter(Boolean).join(', '))}`
    : '';
  const carimbo = `${dt(new Date().toISOString().slice(0, 10))}T000000Z`;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Orbi//Calendario//PT', 'METHOD:REQUEST',
    'BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${carimbo}`,
    inicio, fim, `SUMMARY:${esc(evento.titulo || 'Evento')}`,
    evento.notas ? `DESCRIPTION:${esc(evento.notas)}` : '',
    loc, convidados,
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

function esc(s) {
  return String(s).replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
}

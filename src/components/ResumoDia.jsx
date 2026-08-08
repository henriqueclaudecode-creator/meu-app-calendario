// A faixa de resumo do topo (estudos hoje · próximo simulado · dias até a prova).
// Usada na Agenda. Calcula tudo a partir da lista de eventos.

import { hojeISO, diasEntre } from '../lib/datas';
import { CATEGORIAS } from '../lib/eventoCategorias';
import { IconeCategoria } from './EventoCategoria';
import { cores, sombra, raioGrande } from '../lib/tema';

function ResumoDia({ eventos = [] }) {
  const hoje = hojeISO();
  const estudosHoje = eventos.filter((e) => e.data === hoje && e.categoria === 'estudo').length;
  const proxSimulado = eventos
    .filter((e) => e.categoria === 'simulado' && e.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))[0];
  const proxProva = eventos
    .filter((e) => e.categoria === 'prova' && e.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))[0];

  const simuladoQuando = proxSimulado ? textoQuando(diasEntre(hoje, proxSimulado.data)) : 'nenhum';
  const provaDias = proxProva ? diasEntre(hoje, proxProva.data) : null;

  return (
    <div style={estilos.resumo}>
      <Item
        cor={CATEGORIAS.estudo.cor} bg="var(--resumo-estudo-bg, #eff6ff)"
        icone={<IconeCategoria categoria="estudo" tamanho={20} cor="var(--resumo-estudo-icone, #2563eb)" />}
        numero={`${estudosHoje} ${estudosHoje === 1 ? 'estudo' : 'estudos'}`} legenda="hoje"
      />
      <div style={estilos.divisor} />
      <Item
        cor={CATEGORIAS.simulado.cor} bg="var(--resumo-simulado-bg, #fff3e9)"
        icone={<IconeCategoria categoria="simulado" tamanho={20} cor="var(--resumo-simulado-icone, #f97316)" />}
        numero="Simulado" legenda={simuladoQuando}
      />
      <div style={estilos.divisor} />
      <Item
        cor={CATEGORIAS.prova.cor} bg="var(--resumo-prova-bg, #fdeced)"
        icone={<IconeCategoria categoria="prova" tamanho={20} cor="var(--resumo-prova-icone, #e5484d)" />}
        numero="Prova" legenda={provaDias != null ? `em ${provaDias} dias` : 'nenhuma'} destaque
      />
    </div>
  );
}

function textoQuando(d) {
  if (d <= 0) return 'hoje';
  if (d === 1) return 'amanhã';
  return `em ${d} dias`;
}

function Item({ cor, bg, icone, numero, legenda, destaque }) {
  return (
    <div style={estilos.card}>
      <span style={{ ...estilos.icone, background: bg }}>{icone}</span>
      <span style={estilos.texto}>
        <span style={{ ...estilos.numero, color: `var(--resumo-num-cor, ${cor})` }}>{numero}</span>
        <span style={{ ...estilos.legenda, ...(destaque ? { color: cor, fontWeight: 700 } : null) }}>{legenda}</span>
      </span>
    </div>
  );
}

const estilos = {
  resumo: {
    display: 'flex', alignItems: 'stretch',
    background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raioGrande,
    boxShadow: sombra, padding: '13px 2px', marginBottom: 16,
  },
  divisor: { width: 1, background: cores.borda, margin: '4px 0', flexShrink: 0 },
  card: { flex: 1, display: 'flex', alignItems: 'center', gap: 7, padding: '2px 5px', minWidth: 0 },
  icone: { flexShrink: 0, width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  texto: { display: 'flex', flexDirection: 'column', minWidth: 0, textAlign: 'left' },
  numero: { fontSize: 13, fontWeight: 800, lineHeight: 1.25, letterSpacing: -0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  legenda: { fontSize: 11.5, color: cores.textoSuave, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};

export default ResumoDia;

// Busca de eventos — modal que abre pela lupa. Pesquisa no MÁXIMO de campos:
// título, notas, nome da etiqueta, data (vários formatos), dia da semana,
// horário, repetição e "favorito". Tocar num resultado abre a edição.

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { listarEventos } from '../db/eventos';
import { listarCategorias } from '../db/categorias';
import { hojeISO } from '../lib/datas';
import { IconeCat } from './IconeCat';
import NovoEvento from './NovoEvento';
import { cores, raio } from '../lib/tema';

const COR_NEUTRA = cores.textoApagado;
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const REP = { diario: 'todos os dias diário', semanal: 'todas as semanas semanal', mensal: 'todos os meses mensal', anual: 'todos os anos anual', personalizado: 'personalizado' };

function dataLocal(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}
function norm(s) {
  return (s ?? '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function rotuloData(iso) {
  const d = dataLocal(iso);
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export default function BuscaEventos({ onFechar, onMudou }) {
  const [q, setQ] = useState('');
  const [eventos, setEventos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [editar, setEditar] = useState(null);

  async function carregar() {
    try {
      const [lista, cats] = await Promise.all([listarEventos(), listarCategorias()]);
      setEventos(lista);
      setCategorias(cats);
    } catch { setEventos([]); }
  }
  useEffect(() => { carregar(); }, []);

  const etiquetaDe = (e) => categorias.find((c) => c.id === e.categoriaId) ?? null;
  const corDe = (e) => e.cor ?? etiquetaDe(e)?.cor ?? COR_NEUTRA;

  const indexados = useMemo(() => eventos.map((e) => {
    const et = etiquetaDe(e);
    const d = dataLocal(e.data);
    const campos = [
      e.titulo, e.notas, et?.nome, e.data, rotuloData(e.data),
      MESES[d.getMonth()], DIAS[d.getDay()], e.inicio, e.fim,
      e.favorito ? 'favorito' : '', REP[e.repetir] ?? '',
    ];
    return { e, texto: norm(campos.filter(Boolean).join(' ')) };
  }), [eventos, categorias]);

  const termo = norm(q.trim());
  const resultados = termo
    ? indexados
      .filter((x) => termo.split(/\s+/).every((w) => x.texto.includes(w)))
      .map((x) => x.e)
      .sort((a, b) => a.data.localeCompare(b.data) || (a.inicio ?? '').localeCompare(b.inicio ?? ''))
    : [];

  return createPortal(
    <div style={estilos.fundo} className="modalFundo" role="dialog" aria-modal="true" aria-label="Pesquisar eventos">
      <div style={estilos.painel}>
        <div style={estilos.topo}>
          <span style={estilos.lupa} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cores.textoApagado} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
          </span>
          <input
            value={q}
            autoFocus
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar por título, etiqueta, nota, data…"
            style={estilos.input}
          />
          <button style={estilos.fechar} onClick={onFechar} aria-label="Fechar">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cores.textoSuave} strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div style={estilos.lista}>
          {!termo ? (
            <p style={estilos.dica}>Digite para pesquisar seus compromissos.</p>
          ) : resultados.length === 0 ? (
            <p style={estilos.dica}>Nenhum evento encontrado para “{q.trim()}”.</p>
          ) : (
            resultados.map((e) => {
              const et = etiquetaDe(e);
              const cor = corDe(e);
              return (
                <button key={e.id} style={estilos.item} onClick={() => setEditar(e)}>
                  <span style={{ ...estilos.itemIcone, background: cor }}>
                    <IconeCat id={et?.icone ?? 'calendario'} tamanho={18} cor="#fff" strokeWidth={2} />
                  </span>
                  <div style={estilos.itemTexto}>
                    <div style={estilos.itemTitulo}>{e.favorito && <span style={estilos.estrela}>★</span>}{e.titulo}</div>
                    <div style={estilos.itemSub}>
                      {rotuloData(e.data)}{e.inicio ? ` · ${e.inicio}` : ''}{et ? ` · ${et.nome}` : ''}
                    </div>
                    {e.notas && <div style={estilos.itemNota}>{e.notas}</div>}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {editar && (
        <NovoEvento
          evento={editar}
          dataInicial={editar.data ?? hojeISO()}
          onSalvo={async () => { await carregar(); onMudou?.(); }}
          onFechar={() => setEditar(null)}
        />
      )}
    </div>,
    document.body,
  );
}

const estilos = {
  fundo: { position: 'fixed', inset: 0, zIndex: 350, background: cores.bg, display: 'flex', flexDirection: 'column' },
  painel: { width: '100%', maxWidth: 'var(--app-max, 560px)', margin: '0 auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', padding: '0 12px' },
  topo: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 4px', position: 'relative' },
  lupa: { flexShrink: 0, display: 'flex' },
  input: { flex: 1, minWidth: 0, border: 'none', background: 'transparent', color: cores.texto, fontSize: 16, outline: 'none', fontFamily: 'inherit' },
  fechar: { flexShrink: 0, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 },

  lista: { flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 20 },
  dica: { color: cores.textoSuave, fontSize: 14, textAlign: 'center', padding: '32px 20px', lineHeight: 1.5 },

  item: { width: '100%', boxSizing: 'border-box', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raio, padding: '11px 13px', marginBottom: 8 },
  itemIcone: { flexShrink: 0, width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  itemTexto: { minWidth: 0, flex: 1 },
  itemTitulo: { fontSize: 14.5, fontWeight: 700, color: cores.texto, letterSpacing: -0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  estrela: { color: '#f59e0b', marginRight: 4 },
  itemSub: { fontSize: 12.5, color: cores.textoSuave, marginTop: 2, fontWeight: 500 },
  itemNota: { fontSize: 12, color: cores.textoApagado, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
};

// Seletor de hora no estilo do app, no lugar do <input type="time"> nativo (que
// abre o relógio do sistema e destoa de tudo).
//
// Um botão mostra a hora atual; ao tocar, abre um painel com duas colunas —
// horas (00–23) e minutos (de 5 em 5). Tocar num número atualiza na hora.

import { useEffect, useRef, useState } from 'react';
import { cores, sombraForte, raio, raioPequeno } from '../lib/tema';

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTOS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

function SeletorHora({ valor, onMudar, placeholder = '--:--' }) {
  const [aberto, setAberto] = useState(false);
  const [h, m] = valor && valor.includes(':') ? valor.split(':') : ['', ''];
  const colHoras = useRef(null);
  const colMinutos = useRef(null);

  // Ao abrir, rola cada coluna até o valor escolhido — senão a hora atual podia
  // ficar fora de vista no meio de uma lista longa.
  useEffect(() => {
    if (!aberto) return;
    colHoras.current?.querySelector('[data-sel="true"]')?.scrollIntoView({ block: 'center' });
    colMinutos.current?.querySelector('[data-sel="true"]')?.scrollIntoView({ block: 'center' });
  }, [aberto]);

  function escolher(novaH, novoM) {
    onMudar(`${novaH ?? h ?? '00'}:${novoM ?? m ?? '00'}`);
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setAberto((o) => !o)}
        style={estilos.gatilho}
        aria-haspopup="dialog"
        aria-expanded={aberto}
      >
        <span style={valor ? estilos.valor : estilos.placeholder}>{valor || placeholder}</span>
        <span style={estilos.relogio}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </span>
      </button>

      {aberto && (
        <>
          <div style={estilos.fundo} onClick={() => setAberto(false)} />
          <div style={estilos.painel} role="dialog" aria-label="Escolher hora">
            <div ref={colHoras} className="sem-barra" style={estilos.coluna}>
              <div style={estilos.colTitulo}>Hora</div>
              {HORAS.map((hh) => (
                <button
                  key={hh}
                  data-sel={hh === h}
                  onClick={() => escolher(hh, m || '00')}
                  style={{ ...estilos.opcao, ...(hh === h ? estilos.opcaoAtiva : null) }}
                >
                  {hh}
                </button>
              ))}
            </div>
            <div style={estilos.divisor} />
            <div ref={colMinutos} className="sem-barra" style={estilos.coluna}>
              <div style={estilos.colTitulo}>Min</div>
              {MINUTOS.map((mm) => (
                <button
                  key={mm}
                  data-sel={mm === m}
                  onClick={() => escolher(h || '00', mm)}
                  style={{ ...estilos.opcao, ...(mm === m ? estilos.opcaoAtiva : null) }}
                >
                  {mm}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const estilos = {
  gatilho: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: raioPequeno,
    border: `1px solid ${cores.borda}`, background: cores.superficie, cursor: 'pointer',
    fontFamily: 'inherit',
  },
  valor: { fontSize: 14, fontWeight: 700, color: cores.texto },
  placeholder: { fontSize: 14, fontWeight: 600, color: cores.textoApagado },
  relogio: { display: 'flex', color: cores.textoApagado },

  fundo: { position: 'fixed', inset: 0, zIndex: 40 },
  painel: {
    position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 41,
    display: 'flex', width: 176, height: 208,
    background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: raio,
    boxShadow: sombraForte, padding: 5, boxSizing: 'border-box',
  },
  coluna: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 },
  colTitulo: {
    position: 'sticky', top: 0, background: cores.superficie,
    fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
    color: cores.textoApagado, textAlign: 'center', padding: '2px 0 5px',
  },
  divisor: { width: 1, background: cores.borda, margin: '4px 2px' },
  opcao: {
    flexShrink: 0, padding: '7px 0', border: 'none', borderRadius: raioPequeno,
    background: 'transparent', color: cores.texto, fontSize: 14, fontWeight: 600,
    cursor: 'pointer',
  },
  opcaoAtiva: { background: cores.acento, color: cores.textoClaro, fontWeight: 700 },
};

export default SeletorHora;

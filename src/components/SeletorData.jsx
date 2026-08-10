// Botão de calendário + o calendário em si.
//
// O seletor nativo do navegador (input type="date") não aceita CSS: a
// aparência dele vem do sistema operacional, então não havia como deixá-lo com
// a cara do app. Por isso o calendário é desenhado aqui.
//
// Ele é aberto num portal para o body: a coluna onde o botão fica tem
// `overflow: hidden` e o container das colunas rola na horizontal — qualquer
// popover renderizado lá dentro seria cortado.

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  hojeISO,
  partesISO,
  montarISO,
  diasNoMes,
  diaSemanaDoPrimeiro,
  formatarDiaMes,
  NOMES_MESES,
  ABREV_DIAS_SEMANA,
} from '../lib/datas';
import { cores, sombraForte, raio, raioGrande, raioPequeno, transicao } from '../lib/tema';

// A semana começa na segunda, como no resto do app.
const ORDEM_SEMANA = [0, 1, 2, 3, 4, 5, 6]; // domingo primeiro

export function IconeCalendario({ tamanho = 16 }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="3.5" />
      <path d="M3 10h18" />
      <path d="M8 2.5v4M16 2.5v4" strokeLinecap="round" />
      <circle cx="8.5" cy="14.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="14.5" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Seta({ direcao }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={direcao === 'anterior' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  );
}

function Calendario({ valor, max, onEscolher, onFechar }) {
  // Mês exibido; começa no mês da data já escolhida.
  const inicial = partesISO(valor || hojeISO());
  const [ano, setAno] = useState(inicial.ano);
  const [mes, setMes] = useState(inicial.mes);

  useEffect(() => {
    function aoTeclar(e) {
      if (e.key === 'Escape') onFechar();
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [onFechar]);

  function mudarMes(passo) {
    const novo = new Date(ano, mes - 1 + passo, 1);
    setAno(novo.getFullYear());
    setMes(novo.getMonth() + 1);
  }

  const hoje = hojeISO();
  const total = diasNoMes(ano, mes);
  // Quantas casas vazias antes do dia 1, com a semana começando no domingo.
  const vazias = diaSemanaDoPrimeiro(ano, mes);
  const celulas = [
    ...Array.from({ length: vazias }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  // Só bloqueia o avanço quando o mês seguinte inteiro passa do limite.
  const proximoMesPassaDoLimite = max && montarISO(ano, mes, 1) >= max.slice(0, 7) + '-01'
    ? montarISO(mes === 12 ? ano + 1 : ano, mes === 12 ? 1 : mes + 1, 1) > max
    : false;

  return createPortal(
    <div style={estilos.fundo} onClick={onFechar} role="presentation">
      <div
        style={estilos.painel}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Escolher a data do estudo"
      >
        <div style={estilos.cabecalho}>
          <button onClick={() => mudarMes(-1)} style={estilos.navMes} aria-label="Mês anterior">
            <Seta direcao="anterior" />
          </button>
          <span style={estilos.tituloMes}>
            {NOMES_MESES[mes - 1]} {ano}
          </span>
          <button
            onClick={() => mudarMes(1)}
            disabled={proximoMesPassaDoLimite}
            style={{ ...estilos.navMes, ...(proximoMesPassaDoLimite ? estilos.navMesDesativada : null) }}
            aria-label="Próximo mês"
          >
            <Seta direcao="proximo" />
          </button>
        </div>

        <div style={estilos.grade}>
          {/* Três letras em vez de uma: as iniciais teriam repetições
              ("D S T Q Q S S") — dois S e dois Q, ilegível. */}
          {ORDEM_SEMANA.map((d) => (
            <div key={d} style={estilos.nomeDia}>
              {ABREV_DIAS_SEMANA[d].slice(0, 3)}
            </div>
          ))}

          {celulas.map((dia, i) => {
            if (dia === null) return <div key={`v${i}`} />;
            const iso = montarISO(ano, mes, dia);
            const selecionado = iso === valor;
            const ehHoje = iso === hoje;
            const bloqueado = max && iso > max;
            return (
              <button
                key={iso}
                onClick={() => !bloqueado && onEscolher(iso)}
                disabled={bloqueado}
                aria-label={iso}
                aria-current={ehHoje ? 'date' : undefined}
                style={{
                  ...estilos.dia,
                  ...(ehHoje && !selecionado ? estilos.diaHoje : null),
                  ...(selecionado ? estilos.diaSelecionado : null),
                  ...(bloqueado ? estilos.diaBloqueado : null),
                }}
              >
                {dia}
              </button>
            );
          })}
        </div>

        <div style={estilos.rodape}>
          <button onClick={() => onEscolher(hoje)} style={estilos.botaoHoje}>
            Hoje
          </button>
          <button onClick={onFechar} style={estilos.botaoFechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// O que a tela usa: o botão, e o calendário só quando aberto.
function SeletorData({ valor, onMudar, max }) {
  const [aberto, setAberto] = useState(false);
  const ehHoje = valor === hojeISO();

  function escolher(iso) {
    onMudar(iso);
    setAberto(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        style={{ ...estilos.gatilho, ...(ehHoje ? null : estilos.gatilhoAtivo) }}
        title={`Estudado em ${formatarDiaMes(valor)} — clique para escolher outra data`}
        aria-label="Escolher a data do estudo"
      >
        <IconeCalendario />
        {!ehHoje && <span>{formatarDiaMes(valor)}</span>}
      </button>

      {aberto && (
        <Calendario
          valor={valor}
          max={max}
          onEscolher={escolher}
          onFechar={() => setAberto(false)}
        />
      )}
    </>
  );
}

const estilos = {
  // Caixinha levantada igual à do botão de adicionar, ao lado do qual ele mora
  // dentro do campo de novo assunto: os dois têm de se ler como o mesmo tipo
  // de peça. O relevo vem da borda de baixo mais forte e da sombra curta.
  //
  // Sem data escolhida é um quadrado; com data, o rótulo entra ao lado e ele
  // cresce — por isso largura mínima em vez de fixa.
  gatilho: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flexShrink: 0,
    minWidth: 32,
    height: 32,
    padding: '0 8px',
    borderRadius: raioPequeno,
    border: `1px solid ${cores.borda}`,
    borderBottomColor: cores.bordaForte,
    background: cores.superficie2,
    color: cores.textoApagado,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(15, 37, 71, 0.08)',
    transition: transicao,
  },
  gatilhoAtivo: {
    background: cores.acentoBg,
    borderColor: cores.acentoClaro,
    color: cores.acento,
  },
  fundo: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'rgba(15, 37, 71, 0.38)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  painel: {
    width: '100%',
    maxWidth: 320,
    boxSizing: 'border-box',
    background: cores.superficie,
    borderRadius: raioGrande,
    boxShadow: sombraForte,
    padding: 16,
  },
  cabecalho: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tituloMes: {
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: -0.2,
    color: cores.texto,
  },
  navMes: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    border: 'none',
    borderRadius: raioPequeno,
    background: cores.superficie2,
    color: cores.acento,
    cursor: 'pointer',
  },
  navMesDesativada: {
    color: cores.bordaForte,
    cursor: 'default',
  },
  grade: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 2,
  },
  nomeDia: {
    textAlign: 'center',
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: 0.3,
    color: cores.textoApagado,
    paddingBottom: 6,
  },
  dia: {
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '50%',
    background: 'transparent',
    color: cores.texto,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
  diaHoje: {
    color: cores.acento,
    fontWeight: 800,
    background: cores.acentoBg,
  },
  diaSelecionado: {
    background: cores.acento,
    color: cores.textoClaro,
    fontWeight: 700,
  },
  diaBloqueado: {
    color: cores.bordaForte,
    cursor: 'default',
  },
  rodape: {
    display: 'flex',
    gap: 8,
    marginTop: 14,
  },
  botaoHoje: {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: raio,
    background: cores.acento,
    color: cores.textoClaro,
    fontSize: 13.5,
    fontWeight: 700,
    cursor: 'pointer',
  },
  botaoFechar: {
    flex: 1,
    padding: '10px',
    border: `1px solid ${cores.borda}`,
    borderRadius: raio,
    background: cores.superficie,
    color: cores.textoSuave,
    fontSize: 13.5,
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export default SeletorData;

// Contexto Premium — dá a qualquer tela o estado da assinatura e a função de
// abrir o paywall, sem precisar passar props por toda a árvore.
//
// Também mantém o tema coerente com o acesso: usuário fora do Premium sempre vê
// o tema Padrão (mesmo que tenha escolhido outro durante o teste); ao assinar,
// o tema salvo volta.

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as P from './premium';
import { aplicarTema, lerTema } from './aparencia';
import PaywallSheet from '../components/PaywallSheet';

const Ctx = createContext(null);
export const usePremium = () => useContext(Ctx);

function sincronizarTema() {
  aplicarTema(P.ehPremium() ? lerTema() : 'light');
}

export function PremiumProvider({ children }) {
  const [, setTick] = useState(0);
  const [paywall, setPaywall] = useState(null); // null | { saudacaoFim }

  useEffect(() => {
    P.iniciarTrialSeNecessario();
    P.iniciarBillingSeNecessario();
    sincronizarTema();
    const off = P.observar(() => { sincronizarTema(); setTick((t) => t + 1); });
    // Mensagem única de fim de teste (só a 1ª vez após expirar).
    if (P.deveMostrarBoasVindasFim()) {
      P.marcarBoasVindasFimVista();
      setPaywall({ saudacaoFim: true });
    }
    return off;
  }, []);

  const abrirPaywall = useCallback((opts = {}) => setPaywall({ saudacaoFim: !!opts.saudacaoFim }), []);
  const fechar = useCallback(() => setPaywall(null), []);

  const valor = {
    premium: P.ehPremium(),
    estado: P.estado(),
    diasRestantes: P.diasRestantes(),
    plano: P.planoAtual(),
    abrirPaywall,
  };

  return (
    <Ctx.Provider value={valor}>
      {children}
      {paywall && (
        <PaywallSheet
          saudacaoFim={paywall.saudacaoFim}
          onFechar={fechar}
          onAssinar={async (pl) => { const r = await P.assinar(pl); if (r?.ok || r?.cancelado) fechar(); }}
        />
      )}
    </Ctx.Provider>
  );
}

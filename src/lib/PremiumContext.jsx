// Contexto Premium — dá a qualquer tela o estado da assinatura e a função de
// abrir o paywall, sem precisar passar props por toda a árvore.
//
// Também mantém o tema coerente com o acesso: usuário fora do Premium sempre vê
// o tema Padrão (mesmo que tenha escolhido outro durante o teste); ao assinar,
// o tema salvo volta.

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as P from './premium';
import { observarAuth } from './auth';
import { aplicarTema, lerTema } from './aparencia';
import PaywallSheet from '../components/PaywallSheet';

const Ctx = createContext(null);
export const usePremium = () => useContext(Ctx);

function sincronizarTema() {
  aplicarTema(P.ehPremium() ? lerTema() : 'light');
}

export function PremiumProvider({ children }) {
  const [, setTick] = useState(0);
  const [paywall, setPaywall] = useState(null); // null | {}

  useEffect(() => {
    P.iniciarBillingSeNecessario();
    sincronizarTema();
    const off = P.observar(() => { sincronizarTema(); setTick((t) => t + 1); });
    // Informa ao Premium o email do usuário logado (para a lista de vitalícios).
    const offAuth = observarAuth((u) => P.definirEmailAtual(u?.email ?? null));
    return () => { off(); offAuth(); };
  }, []);

  const abrirPaywall = useCallback(() => setPaywall({}), []);
  const fechar = useCallback(() => setPaywall(null), []);

  const valor = {
    premium: P.ehPremium(),
    estado: P.estado(),
    plano: P.planoAtual(),
    abrirPaywall,
  };

  return (
    <Ctx.Provider value={valor}>
      {children}
      {paywall && (
        <PaywallSheet
          onFechar={fechar}
          onAssinar={async (pl) => { const r = await P.assinar(pl); if (r?.ok || r?.cancelado) fechar(); }}
        />
      )}
    </Ctx.Provider>
  );
}

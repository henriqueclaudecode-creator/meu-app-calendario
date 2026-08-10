import { useState } from 'react';
import Calendario from './screens/Calendario';
import Agenda from './screens/Agenda';
import MapaVida from './screens/MapaVida';
import MinhaHistoria from './screens/MinhaHistoria';
import Mais from './screens/Mais';
import Onboarding from './screens/Onboarding';
import MenuLateral from './components/MenuLateral';
import { usePremium } from './lib/PremiumContext';
import { onboardingConcluido } from './lib/perfil';

const TELAS = {
  calendario: Calendario,
  agenda: Agenda,
  mapa: MapaVida,
  historia: MinhaHistoria,
  mais: Mais,
};

export default function App() {
  const [aba, setAba] = useState('calendario');
  const [menuAberto, setMenuAberto] = useState(false);
  const [mostrarOnboarding, setMostrarOnboarding] = useState(() => !onboardingConcluido());
  const { premium } = usePremium() ?? {};
  const Tela = TELAS[aba] ?? Calendario;

  const abrirMenu = () => setMenuAberto(true);

  if (mostrarOnboarding) {
    return <Onboarding onConcluir={() => setMostrarOnboarding(false)} />;
  }

  return (
    <>
      <Tela onAbrirMenu={abrirMenu} />
      {menuAberto && (
        <MenuLateral
          ativa={aba}
          premium={premium}
          onNavegar={(id) => setAba(id)}
          onFechar={() => setMenuAberto(false)}
        />
      )}
    </>
  );
}

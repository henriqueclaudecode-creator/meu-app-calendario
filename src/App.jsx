import { useState } from 'react';
import Calendario from './screens/Calendario';
import Agenda from './screens/Agenda';
import MapaVida from './screens/MapaVida';
import MinhaHistoria from './screens/MinhaHistoria';
import Mais from './screens/Mais';
import BarraNavegacao from './components/BarraNavegacao';

const TELAS = {
  calendario: Calendario,
  agenda: Agenda,
  mapa: MapaVida,
  historia: MinhaHistoria,
  mais: Mais,
};

export default function App() {
  const [aba, setAba] = useState('calendario');
  const Tela = TELAS[aba] ?? Calendario;

  return (
    <>
      <BarraNavegacao ativa={aba} onMudar={setAba} />
      <Tela />
    </>
  );
}

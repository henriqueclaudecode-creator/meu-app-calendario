// Dados de exemplo, semeados UMA vez no primeiro uso, para o app já abrir com o
// calendário preenchido em vez de vazio. Depois disso o usuário manda no
// conteúdo: pode apagar tudo que não volta a semear.
//
// Tudo é montado relativo a HOJE. As etiquetas (categorias) são criadas primeiro
// e os compromissos referenciam o id delas.

import { hojeISO, adicionarDias } from './datas';

// v2: modelo novo (etiquetas + categoriaId). Bump força re-semear sobre o
// exemplo antigo, que usava categorias fixas de estudo.
const FLAG = 'calendario.seed.v2';

export function semearSePreciso() {
  if (localStorage.getItem(FLAG)) return;

  const hoje = hojeISO();
  const d = (n) => adicionarDias(hoje, n);

  // Etiquetas de exemplo (tons terrosos).
  const estudos = cat('Estudos', 'livro', '#8c6a43');
  const trabalho = cat('Trabalho', 'trabalho', '#35576b');
  const saude = cat('Saúde', 'academia', '#7c3143');
  const pessoal = cat('Pessoal', 'coracao', '#4c5d38');
  const categorias = [estudos, trabalho, saude, pessoal];

  const eventos = [
    ev(hoje, estudos.id, 'Direito Constitucional', '09:00', '11:00', 'Capítulos 1 a 3'),
    ev(hoje, estudos.id, 'Língua Portuguesa', '14:00', '16:00', ''),
    ev(hoje, trabalho.id, 'Reunião com equipe', '19:00', '20:00', ''),
    ev(d(1), estudos.id, 'Simulado Cebraspe', '19:00', '22:00', 'Direito Administrativo'),
    ev(d(2), saude.id, 'Academia', '18:30', '19:30', ''),
    ev(d(3), estudos.id, 'Raciocínio Lógico', '08:00', '10:00', ''),
    ev(d(4), pessoal.id, 'Aniversário da mãe', null, null, ''),
    ev(d(5), trabalho.id, 'Entrega do relatório', '15:00', '16:00', ''),
    ev(d(7), estudos.id, 'Simulado Geral', '09:00', '12:00', ''),
    ev(d(9), saude.id, 'Corrida no parque', '06:30', '07:30', ''),
    ev(d(12), pessoal.id, 'Troca de óleo', '14:00', '15:00', ''),
    ev(d(15), estudos.id, 'Revisão temática', '19:00', '21:00', ''),
  ];

  localStorage.setItem('calendario.categorias', JSON.stringify(categorias));
  localStorage.setItem('calendario.eventos', JSON.stringify(eventos));
  localStorage.removeItem('calendario.objetivos'); // recurso antigo, não faz mais parte
  localStorage.setItem(FLAG, '1');
}

function cat(nome, icone, cor) {
  return {
    id: `cat_seed_${Math.random().toString(36).slice(2, 9)}`,
    nome, icone, cor, criado_em: Date.now(),
  };
}

function ev(data, categoriaId, titulo, inicio, fim, notas) {
  return {
    id: `ev_seed_${Math.random().toString(36).slice(2, 9)}`,
    data, categoriaId, titulo, inicio, fim, lembrete: '10min', notas: notas ?? '', criado_em: Date.now(),
  };
}

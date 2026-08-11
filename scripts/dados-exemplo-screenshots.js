// Dados de exemplo para SCREENSHOTS da Play Store.
//
// Popula o app com uma vida fictícia bonita: perfil, 5 categorias, 27 eventos
// de agosto/2026 (para a constelação do Mapa da Vida) e 7 momentos de vida ao
// longo dos anos (para a Minha História e os "Marcos da vida"). Também destrava
// o Premium no modo local (stub dev/web) para as telas Premium aparecerem.
//
// COMO USAR:
//   1. Rode o app no navegador (npm run dev) e abra-o.
//   2. Abra o Console do navegador (F12 → aba Console).
//   3. Cole TODO o conteúdo deste arquivo e aperte Enter.
//   4. A página recarrega sozinha com os dados. Tire os prints.
//
// Para LIMPAR depois: no Console, rode  localStorage.clear()  e recarregue.

(function () {
  const now = Date.now();

  localStorage.setItem('orbi.plano', 'anual'); // destrava Premium (stub local)
  localStorage.setItem('calendario.tema', 'light'); // troque para 'dark' ou 'black' se quiser
  localStorage.setItem('calendario.perfil', JSON.stringify({
    nascimento: '1999-01-22', cidade: 'Recife', onboardingFeito: true,
  }));

  // Categorias (etiquetas) — viram os "planetas" do Mapa da Vida.
  const cats = [
    { id: 'cat_trab', nome: 'Trabalho', icone: 'trabalho', cor: '#35576b', criado_em: now },
    { id: 'cat_est',  nome: 'Estudos',  icone: 'livro',    cor: '#8c6a43', criado_em: now },
    { id: 'cat_sau',  nome: 'Saúde',    icone: 'academia', cor: '#b0563c', criado_em: now },
    { id: 'cat_fam',  nome: 'Família',  icone: 'coracao',  cor: '#bf9540', criado_em: now },
    { id: 'cat_laz',  nome: 'Lazer',    icone: 'lazer',    cor: '#2f6b6b', criado_em: now },
  ];
  localStorage.setItem('calendario.categorias', JSON.stringify(cats));

  // Eventos espalhados em agosto/2026, com pesos diferentes por categoria.
  const plano = [['cat_trab', 10], ['cat_est', 7], ['cat_sau', 4], ['cat_fam', 3], ['cat_laz', 3]];
  const titulos = {
    cat_trab: ['Reunião', 'Trabalho', 'Projeto', 'Entrega', 'Planejamento'],
    cat_est:  ['Estudar', 'Aula', 'Leitura', 'Revisão', 'Curso'],
    cat_sau:  ['Academia', 'Consulta', 'Corrida', 'Yoga'],
    cat_fam:  ['Almoço em família', 'Aniversário', 'Visita'],
    cat_laz:  ['Cinema', 'Show', 'Passeio'],
  };
  const evs = [];
  let dia = 1;
  for (const [cid, n] of plano) {
    for (let i = 0; i < n; i++) {
      const d = ((dia++ % 26) + 1);
      const h = 8 + (i % 10);
      evs.push({
        id: 'ev_' + cid + '_' + i,
        data: '2026-08-' + String(d).padStart(2, '0'),
        categoriaId: cid,
        titulo: titulos[cid][i % titulos[cid].length],
        tipo: 'compromisso',
        inicio: String(h).padStart(2, '0') + ':00',
        fim: String(h + 1).padStart(2, '0') + ':00',
        favorito: false,
        criado_em: now,
      });
    }
  }
  localStorage.setItem('calendario.eventos', JSON.stringify(evs));

  // Momentos de vida ao longo dos anos.
  const moms = [
    { id: 'm1', titulo: 'Meu nascimento',       data: '1999-01-22', categoria: 'familia',    descricao: 'Nasci em Recife.', criado_em: 1 },
    { id: 'm2', titulo: 'Primeiro emprego',     data: '2017-03-01', categoria: 'carreira',   descricao: '', criado_em: 2 },
    { id: 'm3', titulo: 'Formatura',            data: '2019-12-15', categoria: 'estudos',    descricao: 'Conclusão da faculdade.', criado_em: 3 },
    { id: 'm4', titulo: 'Casamento',            data: '2021-11-09', categoria: 'familia',    descricao: '', criado_em: 4 },
    { id: 'm5', titulo: 'Primeira casa',        data: '2023-04-20', categoria: 'conquistas', descricao: '', criado_em: 5 },
    { id: 'm6', titulo: 'Viagem internacional', data: '2025-07-10', categoria: 'viagens',    descricao: 'Primeira vez fora do país.', criado_em: 6 },
    { id: 'm7', titulo: 'Nova cidade',          data: '2026-06-01', categoria: 'viagens',    descricao: '', criado_em: 7 },
  ];
  localStorage.setItem('calendario.momentos', JSON.stringify(moms));

  location.reload();
})();

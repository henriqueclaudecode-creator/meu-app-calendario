// Feriados NACIONAIS do Brasil, calculados 100% offline — sem API, sem backend.
//
// São poucas datas por ano e todas determináveis: as fixas por lei e as móveis
// derivadas da Páscoa. Isso é o "cache" levado ao extremo: nenhuma requisição é
// gasta para o que nunca muda. A API/backend fica reservada ao que varia de
// verdade (feriados estaduais e municipais).

// Domingo de Páscoa pelo algoritmo de Meeus/Butcher (calendário gregoriano).
function pascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31); // 3 = março, 4 = abril
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function iso(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function somarDias(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Lista dos feriados nacionais de um ano: [{ data: 'AAAA-MM-DD', nome, movel }].
export function feriadosNacionais(ano) {
  const dom = pascoa(ano);
  const fixos = [
    ['01-01', 'Confraternização Universal'],
    ['04-21', 'Tiradentes'],
    ['05-01', 'Dia do Trabalho'],
    ['09-07', 'Independência do Brasil'],
    ['10-12', 'Nossa Senhora Aparecida'],
    ['11-02', 'Finados'],
    ['11-15', 'Proclamação da República'],
    ['11-20', 'Consciência Negra'], // nacional desde 2024 (Lei 14.759/2023)
    ['12-25', 'Natal'],
  ].map(([md, nome]) => ({ data: `${ano}-${md}`, nome, movel: false }));

  const moveis = [
    { data: iso(somarDias(dom, -47)), nome: 'Carnaval', movel: true },
    { data: iso(somarDias(dom, -2)), nome: 'Sexta-feira Santa', movel: true },
    { data: iso(somarDias(dom, 60)), nome: 'Corpus Christi', movel: true },
  ];

  return [...fixos, ...moveis].sort((a, b) => a.data.localeCompare(b.data));
}

// Mapa { 'AAAA-MM-DD': nome } dos feriados nacionais do ano — cômodo para a grade.
export function mapaFeriadosNacionais(ano) {
  const mapa = {};
  for (const f of feriadosNacionais(ano)) mapa[f.data] = f.nome;
  return mapa;
}

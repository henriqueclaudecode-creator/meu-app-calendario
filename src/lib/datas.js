// Ferramentas de data do app.
//
// Guardamos datas como texto 'AAAA-MM-DD' (ex.: '2026-07-05'). Todas as contas
// são feitas no fuso do próprio aparelho (horário local), para "amanhã" ser
// realmente o dia seguinte para o usuário, sem confusão de fuso.

// Converte um objeto Date para o texto 'AAAA-MM-DD' (usando a data local).
function paraISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// Data de hoje, como 'AAAA-MM-DD'.
export function hojeISO() {
  return paraISO(new Date());
}

// Soma (ou subtrai, se n for negativo) dias a uma data 'AAAA-MM-DD'.
export function adicionarDias(iso, n) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setDate(data.getDate() + n);
  return paraISO(data);
}

// Amanhã, como 'AAAA-MM-DD'.
export function amanhaISO() {
  return adicionarDias(hojeISO(), 1);
}

// Formata 'AAAA-MM-DD' para 'DD/MM' (jeito que o brasileiro lê).
export function formatarDiaMes(iso) {
  if (!iso) return '';
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

// Formata 'AAAA-MM-DD' para 'DD/MM/AAAA', com o ano em quatro dígitos.
// Usado na data de estudo do cartão: ela não muda mais depois de criada e
// pode ser de anos atrás, então ali o ano evita a dúvida que 'DD/MM' deixa.
export function formatarDataCompleta(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Dias da semana, na mesma ordem/índice do Date.getDay() (0=domingo).
export const NOMES_DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
// Todas com 3 letras: a régua de dias é uma grade de 7 colunas iguais, e um
// rótulo mais largo que os outros desalinhava a linha inteira.
export const ABREV_DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Dia da semana de hoje (0=domingo ... 6=sábado), no fuso local do aparelho.
export function diaDaSemanaHoje() {
  return new Date().getDay();
}

export const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Quebra 'AAAA-MM-DD' em números. Nunca usar new Date('AAAA-MM-DD') para isto:
// essa forma é lida como UTC e, em fusos negativos (o Brasil inteiro), volta o
// dia anterior.
export function partesISO(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return { ano, mes, dia };
}

// Monta 'AAAA-MM-DD' a partir dos números (mes de 1 a 12).
export function montarISO(ano, mes, dia) {
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

// Quantos dias separam duas datas 'AAAA-MM-DD' (b - a), no fuso local.
export function diasEntre(aIso, bIso) {
  const [a1, m1, d1] = aIso.split('-').map(Number);
  const [a2, m2, d2] = bIso.split('-').map(Number);
  return Math.round((new Date(a2, m2 - 1, d2) - new Date(a1, m1 - 1, d1)) / 86400000);
}

// Quantos dias tem o mês (mes de 1 a 12). O dia 0 do mês seguinte é o último
// dia deste mês.
export function diasNoMes(ano, mes) {
  return new Date(ano, mes, 0).getDate();
}

// Dia da semana do primeiro dia do mês (0=domingo ... 6=sábado).
export function diaSemanaDoPrimeiro(ano, mes) {
  return new Date(ano, mes - 1, 1).getDay();
}

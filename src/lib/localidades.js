// Estados e capitais do Brasil — dados estáticos, para o seletor de localidade.
// Os feriados estaduais precisam da UF; os das capitais, do código IBGE do
// município (o plano gratuito da Feriados API cobre nacionais + estaduais + as
// 27 capitais).

export const UFS = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];

// Capital de cada UF, com o código IBGE do município.
export const CAPITAIS = {
  AC: { ibge: '1200401', nome: 'Rio Branco' },
  AL: { ibge: '2704302', nome: 'Maceió' },
  AP: { ibge: '1600303', nome: 'Macapá' },
  AM: { ibge: '1302603', nome: 'Manaus' },
  BA: { ibge: '2927408', nome: 'Salvador' },
  CE: { ibge: '2304400', nome: 'Fortaleza' },
  DF: { ibge: '5300108', nome: 'Brasília' },
  ES: { ibge: '3205309', nome: 'Vitória' },
  GO: { ibge: '5208707', nome: 'Goiânia' },
  MA: { ibge: '2111300', nome: 'São Luís' },
  MT: { ibge: '5103403', nome: 'Cuiabá' },
  MS: { ibge: '5002704', nome: 'Campo Grande' },
  MG: { ibge: '3106200', nome: 'Belo Horizonte' },
  PA: { ibge: '1501402', nome: 'Belém' },
  PB: { ibge: '2507507', nome: 'João Pessoa' },
  PR: { ibge: '4106902', nome: 'Curitiba' },
  PE: { ibge: '2611606', nome: 'Recife' },
  PI: { ibge: '2211001', nome: 'Teresina' },
  RJ: { ibge: '3304557', nome: 'Rio de Janeiro' },
  RN: { ibge: '2408102', nome: 'Natal' },
  RS: { ibge: '4314902', nome: 'Porto Alegre' },
  RO: { ibge: '1100205', nome: 'Porto Velho' },
  RR: { ibge: '1400100', nome: 'Boa Vista' },
  SC: { ibge: '4205407', nome: 'Florianópolis' },
  SP: { ibge: '3550308', nome: 'São Paulo' },
  SE: { ibge: '2800308', nome: 'Aracaju' },
  TO: { ibge: '1721000', nome: 'Palmas' },
};

export function nomeUF(sigla) {
  return UFS.find((u) => u.sigla === sigla)?.nome ?? sigla;
}

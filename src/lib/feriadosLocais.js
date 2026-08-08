// Feriados por localidade, calculados OFFLINE — nacionais + estaduais + capitais.
//
// Os NACIONAIS (em feriadosNacionais.js) são exatos e completos. Os ESTADUAIS e
// os das CAPITAIS abaixo são os PRINCIPAIS e mais estabelecidos de cada lugar —
// uma base offline sólida para o escopo do plano gratuito (nacionais + estaduais
// + 27 capitais). Feriados menos comuns e os facultativos ficam para a API
// completar quando o backend estiver ligado (aí a API vira a fonte da verdade e
// esta tabela vira só o fallback).
//
// Formato: cada entrada é { md: 'MM-DD', nome }. Só datas fixas — as poucas
// móveis municipais (ex.: Círio) a API resolve.

import { feriadosNacionais } from './feriadosNacionais';

// Principais feriados estaduais, por UF. (ES, GO, MT, MG, RN, SC não têm um
// feriado civil estadual obrigatório consolidado — ou ele coincide com um
// nacional — por isso não aparecem aqui; a API preenche se houver.)
const ESTADUAIS = {
  AC: [
    { md: '01-20', nome: 'Dia do Evangélico' },
    { md: '06-15', nome: 'Aniversário do Acre' },
    { md: '09-05', nome: 'Dia da Amazônia' },
    { md: '11-23', nome: 'Assinatura do Tratado de Petrópolis' },
  ],
  AL: [
    { md: '06-24', nome: 'São João' },
    { md: '06-29', nome: 'São Pedro' },
    { md: '09-16', nome: 'Emancipação Política de Alagoas' },
  ],
  AP: [
    { md: '03-19', nome: 'São José' },
    { md: '09-13', nome: 'Criação do Território Federal do Amapá' },
  ],
  AM: [
    { md: '09-05', nome: 'Elevação do Amazonas à categoria de província' },
    { md: '12-08', nome: 'Nossa Senhora da Conceição' },
  ],
  BA: [{ md: '07-02', nome: 'Independência da Bahia' }],
  CE: [
    { md: '03-19', nome: 'São José' },
    { md: '03-25', nome: 'Data Magna do Ceará' },
  ],
  DF: [{ md: '11-30', nome: 'Dia do Evangélico' }],
  MA: [{ md: '07-28', nome: 'Adesão do Maranhão à Independência' }],
  MS: [{ md: '10-11', nome: 'Criação do Estado de Mato Grosso do Sul' }],
  PA: [{ md: '08-15', nome: 'Adesão do Grão-Pará à Independência' }],
  PB: [{ md: '08-05', nome: 'Fundação do Estado da Paraíba' }],
  PR: [{ md: '12-19', nome: 'Emancipação Política do Paraná' }],
  PE: [
    { md: '03-06', nome: 'Data Magna de Pernambuco' },
    { md: '06-24', nome: 'São João' },
  ],
  PI: [
    { md: '03-13', nome: 'Batalha do Jenipapo' },
    { md: '10-19', nome: 'Dia do Piauí' },
  ],
  RJ: [{ md: '04-23', nome: 'São Jorge' }],
  RS: [{ md: '09-20', nome: 'Revolução Farroupilha' }],
  RO: [{ md: '01-04', nome: 'Criação do Estado de Rondônia' }],
  RR: [{ md: '10-05', nome: 'Criação do Estado de Roraima' }],
  SP: [{ md: '07-09', nome: 'Revolução Constitucionalista de 1932' }],
  SE: [{ md: '07-08', nome: 'Emancipação Política de Sergipe' }],
  TO: [{ md: '10-05', nome: 'Criação do Estado do Tocantins' }],
};

// Principais feriados municipais das capitais, pelo código IBGE.
const CAPITAIS_FERIADOS = {
  '3550308': [{ md: '01-25', nome: 'Aniversário de São Paulo' }],
  '3304557': [
    { md: '01-20', nome: 'São Sebastião' },
    { md: '03-01', nome: 'Aniversário do Rio de Janeiro' },
  ],
  '3106200': [
    { md: '08-15', nome: 'Assunção de Nossa Senhora' },
    { md: '12-12', nome: 'Aniversário de Belo Horizonte' },
  ],
  '5208707': [
    { md: '05-24', nome: 'Nossa Senhora Auxiliadora' },
    { md: '10-24', nome: 'Aniversário de Goiânia' },
  ],
  '1302603': [{ md: '10-24', nome: 'Aniversário de Manaus' }],
  '1501402': [{ md: '01-12', nome: 'Aniversário de Belém' }],
  '2304400': [{ md: '04-13', nome: 'Aniversário de Fortaleza' }],
  '4314902': [{ md: '02-02', nome: 'Nossa Senhora dos Navegantes' }],
  '4106902': [{ md: '09-08', nome: 'Nossa Senhora da Luz dos Pinhais' }],
};

// Todos os feriados aplicáveis a uma localidade, no ano. Junta nacionais +
// estaduais (se uf) + municipais da capital (se municipio). Sem duplicar datas
// (nacional tem prioridade sobre estadual, e este sobre municipal).
export function feriadosLocais(ano, { uf, municipio } = {}) {
  const lista = feriadosNacionais(ano).map((f) => ({ ...f, tipo: 'NACIONAL' }));

  if (uf && ESTADUAIS[uf]) {
    for (const { md, nome } of ESTADUAIS[uf]) {
      lista.push({ data: `${ano}-${md}`, nome, tipo: 'ESTADUAL', movel: false });
    }
  }
  if (municipio && CAPITAIS_FERIADOS[municipio]) {
    for (const { md, nome } of CAPITAIS_FERIADOS[municipio]) {
      lista.push({ data: `${ano}-${md}`, nome, tipo: 'MUNICIPAL', movel: false });
    }
  }

  const vistos = new Set();
  const saida = [];
  for (const f of lista.sort((a, b) => a.data.localeCompare(b.data))) {
    if (vistos.has(f.data)) continue;
    vistos.add(f.data);
    saida.push(f);
  }
  return saida;
}

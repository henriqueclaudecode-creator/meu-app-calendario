// Feriados no lado do app.
//
// Regra de ouro: o app NUNCA chama a Feriados API direto — chama a nossa Cloud
// Function no Firebase, que tem o cache (Firestore) e guarda a chave da API.
//
// Resiliência: se o backend não estiver configurado ou fora do ar, caímos no
// cálculo offline dos feriados NACIONAIS, para o calendário nunca ficar sem eles.

import { feriadosLocais } from '../lib/feriadosLocais';

// URL da Cloud Function `feriados` (ex.: https://southamerica-east1-SEU-PROJETO.cloudfunctions.net/feriados)
const FN_URL = import.meta.env.VITE_FERIADOS_FN_URL;

// Busca feriados de um ano. Opções: { uf, municipio } — sem nenhum, vêm os
// nacionais. Retorna [{ data: 'AAAA-MM-DD', nome, tipo, bancario }].
export async function buscarFeriados(ano, { uf, municipio } = {}) {
  const offline = () => feriadosLocais(ano, { uf, municipio });
  const soNacional = !uf && !municipio;

  // Base offline (nacionais + estaduais + capitais). Sem backend, é o que temos;
  // e nacionais nunca custam requisição — sempre offline.
  if (soNacional || !FN_URL) return offline();

  try {
    const params = new URLSearchParams({ ano: String(ano) });
    if (municipio) params.set('municipio', municipio);
    else if (uf) params.set('uf', uf);

    const resp = await fetch(`${FN_URL}?${params}`);
    if (!resp.ok) throw new Error(`feriados ${resp.status}`);
    const corpo = await resp.json();
    const dados = corpo.dados ?? [];
    return dados.length ? dados : offline();
  } catch {
    // Backend indisponível: cai na base offline.
    return offline();
  }
}

// Mapa { 'AAAA-MM-DD': nome } — cômodo para pintar a grade do mês.
export async function mapaFeriados(ano, opcoes) {
  const mapa = {};
  for (const f of await buscarFeriados(ano, opcoes)) mapa[f.data] = f.nome;
  return mapa;
}

// Backend de feriados — Cloud Function (2ª geração) + Firestore como cache.
//
// O app chama ESTA function, nunca a Feriados API direto. A chave da API fica
// num secret do Google, e o cache no Firestore faz cada combinação
// (escopo + chave + ano) bater na API uma única vez.
//
// Fluxo:
//   1. Lê os parâmetros (ano; opcional uf ou municipio).
//   2. Procura no Firestore. Achou? Devolve na hora (origem: "cache").
//   3. Não achou? Chama a Feriados API, grava e devolve (origem: "api").

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

// Chave da Feriados API. Definida com:
//   firebase functions:secrets:set FERIADOS_API_KEY
const FERIADOS_API_KEY = defineSecret('FERIADOS_API_KEY');

const API_BASE = 'https://feriadosapi.com';

exports.feriados = onRequest(
  { cors: true, region: 'southamerica-east1', secrets: [FERIADOS_API_KEY] },
  async (req, res) => {
    try {
      const ano = Number(req.query.ano);
      const uf = (req.query.uf ? String(req.query.uf) : '').toUpperCase();
      const municipio = req.query.municipio ? String(req.query.municipio) : '';
      const forcar = req.query.forcar === '1';

      if (!ano || ano < 2000 || ano > 2100) {
        res.status(400).json({ erro: 'Parâmetro "ano" inválido.' });
        return;
      }

      const escopo = municipio ? 'municipal' : uf ? 'estadual' : 'nacional';
      const chave = municipio || uf || '';
      const docId = `${escopo}_${chave || '-'}_${ano}`;
      const ref = db.collection('holidays').doc(docId);

      // 2. Cache primeiro.
      if (!forcar) {
        const snap = await ref.get();
        if (snap.exists) {
          res.json({ escopo, chave, ano, origem: 'cache', dados: snap.data().dados });
          return;
        }
      }

      // 3. Miss: busca na API, grava, devolve.
      const dados = await buscarNaApi({ ano, uf, municipio });
      await ref.set({ escopo, chave, ano, dados, atualizado_em: FieldValue.serverTimestamp() });
      res.json({ escopo, chave, ano, origem: 'api', dados });
    } catch (e) {
      res.status(500).json({ erro: String(e?.message ?? e) });
    }
  },
);

// ---------------------------------------------------------------------------
// Adaptador da Feriados API (https://feriadosapi.com).
//   nacional  → /api/v1/feriados/nacionais?ano=
//   estadual  → /api/v1/feriados/estado/{uf}?ano=   (traz estaduais + nacionais)
//   municipal → /api/v1/feriados/cidade/{ibge}?ano= (traz municipais + estaduais + nacionais)
// Auth: header Authorization: Bearer <token>.
// Resposta: { feriados: [{ data: 'DD/MM/YYYY', nome, tipo, bancario }] }.
// Saída padronizada: [{ data: 'AAAA-MM-DD', nome, tipo, bancario }].
// ---------------------------------------------------------------------------
async function buscarNaApi({ ano, uf, municipio }) {
  const token = FERIADOS_API_KEY.value();
  if (!token) throw new Error('FERIADOS_API_KEY não configurada.');

  let caminho;
  if (municipio) caminho = `/api/v1/feriados/cidade/${encodeURIComponent(municipio)}`;
  else if (uf) caminho = `/api/v1/feriados/estado/${encodeURIComponent(uf)}`;
  else caminho = `/api/v1/feriados/nacionais`;

  const resp = await fetch(`${API_BASE}${caminho}?ano=${ano}&limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`Feriados API respondeu ${resp.status}`);
  const bruto = await resp.json();

  const lista = Array.isArray(bruto?.feriados) ? bruto.feriados : [];
  return lista.map((f) => ({
    data: brParaIso(String(f.data ?? '')),
    nome: String(f.nome ?? ''),
    tipo: String(f.tipo ?? ''),
    bancario: Boolean(f.bancario),
  }));
}

// 'DD/MM/YYYY' -> 'AAAA-MM-DD'. Aceita já-ISO sem estragar.
function brParaIso(data) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
  const m = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : data;
}

// Busca de locais no lado do app — GRÁTIS, sem servidor e sem chave.
//
// Usa o Nominatim (OpenStreetMap), que é público. O app chama direto. Para
// respeitar o uso justo do serviço, a busca é chamada com "debounce" na tela
// (só depois que o usuário para de digitar) e limitada a poucos resultados.

const BASE = 'https://nominatim.openstreetmap.org/search';

// A busca está sempre disponível (não depende de backend).
export const buscaLocalDisponivel = () => true;

// Busca lugares por texto (estabelecimento, endereço, shopping…).
// Retorna [{ nome, endereco, cidade, lat, lng }].
export async function buscarLocais(consulta) {
  const q = (consulta ?? '').trim();
  if (q.length < 3) return [];
  try {
    const params = new URLSearchParams({
      q,
      format: 'jsonv2',
      addressdetails: '1',
      limit: '8',
      'accept-language': 'pt-BR',
      countrycodes: 'br',
    });
    const resp = await fetch(`${BASE}?${params}`, { headers: { Accept: 'application/json' } });
    if (!resp.ok) throw new Error(`nominatim ${resp.status}`);
    const lista = await resp.json();
    return (Array.isArray(lista) ? lista : []).map(mapear);
  } catch {
    return [];
  }
}

function mapear(item) {
  const a = item.address ?? {};
  const cidade = a.city || a.town || a.village || a.municipality || a.county || '';
  const uf = siglaEstado(a.state);
  const nome = item.name && item.name.trim()
    ? item.name.trim()
    : String(item.display_name ?? '').split(',')[0].trim();
  return {
    nome,
    endereco: String(item.display_name ?? ''),
    cidade: cidade ? (uf ? `${cidade} - ${uf}` : cidade) : (a.state ?? ''),
    lat: item.lat != null ? Number(item.lat) : null,
    lng: item.lon != null ? Number(item.lon) : null,
  };
}

// Monta a URL para abrir um local no app de mapas (usa coordenadas quando há).
export function urlMapa(local) {
  if (!local) return null;
  if (local.lat != null && local.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${local.lat},${local.lng}`;
  }
  const q = [local.nome, local.endereco, local.cidade].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

// Nome do estado (Nominatim devolve por extenso) -> sigla (UF).
const ESTADOS = {
  'acre': 'AC', 'alagoas': 'AL', 'amapá': 'AP', 'amazonas': 'AM', 'bahia': 'BA',
  'ceará': 'CE', 'distrito federal': 'DF', 'espírito santo': 'ES', 'goiás': 'GO',
  'maranhão': 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS', 'minas gerais': 'MG',
  'pará': 'PA', 'paraíba': 'PB', 'paraná': 'PR', 'pernambuco': 'PE', 'piauí': 'PI',
  'rio de janeiro': 'RJ', 'rio grande do norte': 'RN', 'rio grande do sul': 'RS',
  'rondônia': 'RO', 'roraima': 'RR', 'santa catarina': 'SC', 'são paulo': 'SP',
  'sergipe': 'SE', 'tocantins': 'TO',
};
function siglaEstado(nome) {
  if (!nome) return '';
  return ESTADOS[String(nome).toLowerCase()] ?? '';
}

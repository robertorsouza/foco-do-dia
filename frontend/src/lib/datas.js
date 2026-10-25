/**
 * Datas no formato do backend: 'AAAA-MM-DD', sempre no fuso do usuário.
 * O "hoje" oficial vem do servidor (GET /hoje), nunca do relógio do aparelho,
 * para que o app e a API concordem sobre a virada do dia.
 */

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const INICIAIS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function partes(data) {
  const [a, m, d] = data.split('-').map(Number);
  return { a, m, d, semana: new Date(Date.UTC(a, m - 1, d)).getUTCDay() };
}

/** '2026-10-25' → 'Domingo, 25 de outubro' */
export function dataPorExtenso(data) {
  const { m, d, semana } = partes(data);
  return `${DIAS[semana]}, ${d} de ${MESES[m - 1]}`;
}

/** '2026-10-25' → '25/10' */
export function dataCurta(data) {
  const { m, d } = partes(data);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

/** Inicial do dia da semana, para o gráfico semanal. */
export function inicialDaSemana(data) {
  return INICIAIS[partes(data).semana];
}

/** '19 a 25 de outubro' ou '28 de setembro a 4 de outubro' */
export function intervalo(inicio, fim) {
  const i = partes(inicio);
  const f = partes(fim);
  if (i.m === f.m) return `${i.d} a ${f.d} de ${MESES[f.m - 1]}`;
  return `${i.d} de ${MESES[i.m - 1]} a ${f.d} de ${MESES[f.m - 1]}`;
}

export function somarDias(data, dias) {
  const { a, m, d } = partes(data);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** Título curto: Hoje, Ontem ou a data. */
export function nomeDoDia(data, hoje) {
  if (data === hoje) return 'Hoje';
  if (data === somarDias(hoje, -1)) return 'Ontem';
  if (data === somarDias(hoje, 1)) return 'Amanhã';
  return dataPorExtenso(data).split(',')[0];
}

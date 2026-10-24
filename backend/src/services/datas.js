/**
 * Funções de data no fuso horário do usuário.
 *
 * O servidor pode rodar em qualquer fuso (o Render usa UTC), mas os turnos
 * seguem o relógio de quem usa o app. Por isso toda conta de "hoje" e de
 * "que horas são" passa por aqui.
 *
 * As datas circulam como texto no formato AAAA-MM-DD, o mesmo do PostgreSQL.
 */

/**
 * Data local (AAAA-MM-DD) de um instante, no fuso informado.
 * @param {Date} agora
 * @param {string} fuso Ex.: "America/Sao_Paulo"
 * @returns {string}
 */
export function dataLocal(agora, fuso) {
  // O locale "en-CA" formata como AAAA-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(agora);
}

/**
 * Minutos desde a meia-noite local (0 a 1439).
 * @param {Date} agora
 * @param {string} fuso
 * @returns {number}
 */
export function minutosLocal(agora, fuso) {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: fuso,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(agora);
  const valor = (tipo) => Number(partes.find((p) => p.type === tipo).value);
  return valor('hour') * 60 + valor('minute');
}

/**
 * Soma (ou subtrai) dias de uma data AAAA-MM-DD.
 * Usa meio-dia UTC para não sofrer com horário de verão.
 * @param {string} data
 * @param {number} dias
 * @returns {string}
 */
export function somarDias(data, dias) {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Diferença em dias inteiros entre duas datas AAAA-MM-DD (fim - inicio).
 * @param {string} inicio
 * @param {string} fim
 * @returns {number}
 */
export function diasEntre(inicio, fim) {
  const ms = new Date(`${fim}T12:00:00Z`) - new Date(`${inicio}T12:00:00Z`);
  return Math.round(ms / 86_400_000);
}

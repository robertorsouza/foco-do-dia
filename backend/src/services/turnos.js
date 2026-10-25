/**
 * Regras de negócio dos turnos (RN-03, RN-04, RN-10, RN-11).
 *
 * Funções puras: recebem dados e devolvem resultados, sem banco nem rede.
 * Por isso são fáceis de testar e a decisão de alertar é previsível (ADR-003).
 */
import { somarDias } from './datas.js';

export const TURNOS = ['manha', 'tarde', 'noite'];

const NOME_DO_TURNO = { manha: 'A manhã', tarde: 'A tarde', noite: 'A noite' };

/** RN-03: fim de cada turno, em minutos desde a meia-noite (12h, 18h, 23h). */
export const FIM_DO_TURNO = { manha: 12 * 60, tarde: 18 * 60, noite: 23 * 60 };

/** RN-04: o alerta dispara nos 15 minutos finais do turno. */
export const ANTECEDENCIA_DO_ALERTA = 15;

/**
 * RN-03: turno correspondente a um horário.
 * Depois das 23h ainda é noite: o dia só vira à meia-noite.
 * @param {number} minutos Minutos desde a meia-noite.
 * @returns {'manha'|'tarde'|'noite'}
 */
export function turnoDoMinuto(minutos) {
  if (minutos < FIM_DO_TURNO.manha) return 'manha';
  if (minutos < FIM_DO_TURNO.tarde) return 'tarde';
  return 'noite';
}

/**
 * RN-10: urgentes primeiro, mantendo a ordem original entre iguais.
 * Não altera a lista recebida.
 * @template {{prioridade: string}} T
 * @param {T[]} atividades
 * @returns {T[]}
 */
export function ordenarPorPrioridade(atividades) {
  const peso = (a) => (a.prioridade === 'urgente' ? 0 : 1);
  return [...atividades].sort((a, b) => peso(a) - peso(b));
}

/**
 * Texto do alerta: curto, acolhedor, uma pergunta só (RNF-01).
 * @param {'manha'|'tarde'|'noite'} turno
 * @param {number} quantidade Pendências no turno.
 * @returns {string}
 */
export function mensagemDoAlerta(turno, quantidade) {
  const falta = quantidade === 1 ? 'Falta 1. Já fez?' : `Faltam ${quantidade}. Já fez alguma?`;
  return `${NOME_DO_TURNO[turno]} está acabando. ${falta}`;
}

/**
 * RN-04 + RN-10: decide se é hora de alertar sobre a troca de turno.
 * Alerta somente nos 15 minutos finais do turno atual e somente se houver
 * pendências nele. As urgentes vêm primeiro.
 * @param {number} minutos Minutos desde a meia-noite (horário local).
 * @param {Array<{turno: string, status: string, prioridade: string}>} atividades Atividades do dia.
 * @returns {{alertar: boolean, turno: string, pendencias: object[], mensagem?: string}}
 */
export function deveAlertar(minutos, atividades) {
  const turno = turnoDoMinuto(minutos);
  const inicioDaJanela = FIM_DO_TURNO[turno] - ANTECEDENCIA_DO_ALERTA;
  const naJanela = minutos >= inicioDaJanela && minutos < FIM_DO_TURNO[turno];

  const pendencias = ordenarPorPrioridade(
    atividades.filter((a) => a.turno === turno && a.status === 'pendente'),
  );

  if (!naJanela || pendencias.length === 0) {
    return { alertar: false, turno, pendencias: [] };
  }
  return {
    alertar: true,
    turno,
    pendencias,
    mensagem: mensagemDoAlerta(turno, pendencias.length),
  };
}

/**
 * HU-05: turno seguinte; depois da noite vem a manhã do dia seguinte.
 * @param {'manha'|'tarde'|'noite'} turno
 * @param {string} data AAAA-MM-DD
 * @returns {{turno: string, data: string}}
 */
export function proximoTurno(turno, data) {
  const indice = TURNOS.indexOf(turno);
  if (indice === TURNOS.length - 1) return { turno: 'manha', data: somarDias(data, 1) };
  return { turno: TURNOS[indice + 1], data };
}

/**
 * RN-11: destino sugerido para uma pendência ao fechar o dia.
 * Urgente → amanhã de manhã. Normal → amanhã, no mesmo turno.
 * @param {{turno: string, prioridade: string}} atividade
 * @param {string} data Data do dia que está sendo fechado.
 * @returns {{destino: 'amanha', data: string, turno: string}}
 */
export function destinoSugerido(atividade, data) {
  return {
    destino: 'amanha',
    data: somarDias(data, 1),
    turno: atividade.prioridade === 'urgente' ? 'manha' : atividade.turno,
  };
}

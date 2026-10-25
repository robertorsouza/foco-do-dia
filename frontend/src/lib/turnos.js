/**
 * Textos dos turnos e destinos. As regras (o que pode ou não) ficam no backend;
 * aqui só decidimos quais opções mostrar, para não oferecer algo que a API recusaria.
 */

export const TURNOS = ['manha', 'tarde', 'noite'];

export const NOME = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };
export const FAIXA = { manha: 'até 12h', tarde: '12h às 18h', noite: '18h às 23h' };
const NO_TURNO = { manha: 'de manhã', tarde: 'à tarde', noite: 'à noite' };
const PROXIMO = { manha: 'tarde', tarde: 'noite', noite: 'manha' };

/** Turno atual pelo horário local do aparelho (só para destacar "AGORA"). */
export function turnoAtual(agora = new Date()) {
  const h = agora.getHours();
  if (h < 12) return 'manha';
  if (h < 18) return 'tarde';
  return 'noite';
}

/** "Vai para a noite" / "Vai para amanhã de manhã" */
export function textoProximoTurno(turno) {
  if (turno === 'noite') return 'Amanhã de manhã';
  return `Vai para a ${NOME[PROXIMO[turno]].toLowerCase()}`;
}

export function textoAmanha(turno) {
  return `Amanhã ${NO_TURNO[turno]}`;
}

/** Aviso depois de mover. */
export function avisoMovida(destino, turno) {
  if (destino === 'amanha') return `Foi para amanhã ${NO_TURNO[turno]}.`;
  if (turno === 'noite') return 'Foi para amanhã de manhã.';
  return `Foi para a ${NOME[PROXIMO[turno]].toLowerCase()}.`;
}

/**
 * Opções ao fechar o dia (RN-07): "próximo turno" só existe para a noite,
 * porque manhã e tarde cairiam no próprio dia que está sendo fechado.
 * "Em aberto" é não mandar destino: a API coloca em Atividades pendentes.
 */
export function opcoesDeFechamento(atividade, sugestao) {
  const opcoes = [
    {
      chave: 'amanha',
      rotulo: textoAmanha(sugestao.turno),
      destino: { destino: 'amanha', turno: sugestao.turno },
    },
  ];
  if (atividade.turno === 'noite' && sugestao.turno !== 'manha') {
    opcoes.push({
      chave: 'proximo_turno',
      rotulo: 'Próximo turno',
      destino: { destino: 'proximo_turno' },
    });
  }
  opcoes.push({ chave: 'em_aberto', rotulo: 'Em aberto', destino: null });
  opcoes.push({
    chave: 'deixar_de_lado',
    rotulo: 'Deixar de lado',
    destino: { destino: 'deixar_de_lado' },
  });
  return opcoes;
}

/** Rótulo do status no histórico (dia fechado ou passado). */
export const ROTULO_STATUS = {
  feita: 'feita',
  pendente: 'pendente',
  movida: 'foi movida',
  em_aberto: 'em aberto',
  deixada_de_lado: 'deixada de lado',
};

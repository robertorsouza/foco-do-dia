/**
 * Regras das atividades: criar, concluir, editar, excluir e mover.
 */
import * as repo from '../db/repositorio.js';
import { proximoTurno, ordenarPorPrioridade } from './turnos.js';
import { somarDias, diasEntre } from './datas.js';
import { ErroDeNegocio, naoEncontrada } from './erros.js';
import { garantirDia } from './diasService.js';

/** HU-01: cria uma atividade no turno escolhido (status pendente). */
export async function criarAtividade(db, { titulo, turno, prioridade, data }, hoje) {
  const dataDaAtividade = data ?? hoje;
  await garantirDia(db, dataDaAtividade, hoje);
  return repo.inserirAtividade(db, { data: dataDaAtividade, titulo, turno, prioridade });
}

/**
 * HU-02 / HU-03: edita título, turno ou prioridade, ou alterna feita ↔ pendente.
 * Outros status mudam só pelas ações de mover, deixar de lado e fechar o dia.
 */
export async function atualizarAtividade(db, id, campos) {
  const atividade = await repo.buscarAtividade(db, id);
  if (!atividade) throw naoEncontrada();
  if (!['pendente', 'feita'].includes(atividade.status)) {
    throw new ErroDeNegocio(409, 'Essa atividade já saiu do dia e não pode ser editada aqui.');
  }
  return repo.atualizarAtividade(db, id, campos);
}

/** HU-03: exclui uma atividade. */
export async function excluirAtividade(db, id) {
  if (!(await repo.excluirAtividade(db, id))) throw naoEncontrada();
}

/**
 * Calcula para onde a atividade vai (HU-05, HU-06, HU-11).
 * Atividades "em_aberto" usam hoje como referência para "amanhã".
 */
function calcularDestino(atividade, escolha, hoje) {
  if (escolha.destino === 'proximo_turno') return proximoTurno(atividade.turno, atividade.data);

  const base = atividade.status === 'em_aberto' ? hoje : atividade.data;
  const data = escolha.destino === 'amanha' ? somarDias(base, 1) : escolha.data;
  if (data < hoje) throw new ErroDeNegocio(422, 'Escolha hoje ou uma data futura.');
  return { data, turno: escolha.turno ?? atividade.turno };
}

/**
 * Aplica um destino: mover (próximo turno, amanhã, outra data) ou deixar de lado.
 * Ao mover, a original fica "movida" e uma cópia nasce no destino apontando
 * para ela (origem_id), preservando o histórico para os relatórios.
 */
export async function aplicarDestino(db, atividade, escolha, hoje) {
  if (escolha.destino === 'deixar_de_lado') {
    return repo.atualizarAtividade(db, atividade.id, { status: 'deixada_de_lado' });
  }
  const { data, turno } = calcularDestino(atividade, escolha, hoje);
  await garantirDia(db, data, hoje);
  await repo.atualizarAtividade(db, atividade.id, { status: 'movida' });
  return repo.inserirAtividade(db, {
    data,
    turno,
    titulo: atividade.titulo,
    prioridade: atividade.prioridade,
    origemId: atividade.id,
  });
}

/** HU-05 / HU-11: move uma atividade pendente ou em aberto. */
export async function moverAtividade(db, id, escolha, hoje) {
  return repo.emTransacao(db, async (tx) => {
    const atividade = await repo.buscarAtividade(tx, id);
    if (!atividade) throw naoEncontrada();
    if (!['pendente', 'em_aberto'].includes(atividade.status)) {
      throw new ErroDeNegocio(409, 'Só dá para mover atividades que ainda não foram feitas.');
    }
    return aplicarDestino(tx, atividade, escolha, hoje);
  });
}

/** HU-06: deixa uma atividade de lado, sem culpa. */
export async function deixarDeLado(db, id, hoje) {
  const atividade = await repo.buscarAtividade(db, id);
  if (!atividade) throw naoEncontrada();
  if (!['pendente', 'em_aberto'].includes(atividade.status)) {
    throw new ErroDeNegocio(409, 'Essa atividade já foi resolvida.');
  }
  return aplicarDestino(db, atividade, { destino: 'deixar_de_lado' }, hoje);
}

/**
 * HU-11 / RN-12: seção "Atividades pendentes", separada dos turnos.
 * Cada item mostra desde quando está pendente e há quantos dias.
 */
export async function listarPendencias(db, hoje) {
  const emAberto = await repo.listarPorStatus(db, 'em_aberto');
  return ordenarPorPrioridade(emAberto).map((a) => ({
    ...a,
    pendente_desde: a.data,
    dias_pendente: diasEntre(a.data, hoje),
  }));
}

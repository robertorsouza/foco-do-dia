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
  if (dataDaAtividade < hoje) throw new ErroDeNegocio(422, 'Escolha hoje ou uma data futura.');
  await garantirDia(db, dataDaAtividade, hoje, { paraEscrita: true });
  return repo.inserirAtividade(db, { data: dataDaAtividade, titulo, turno, prioridade });
}

/**
 * HU-02 / HU-03: edita título, turno ou prioridade, ou alterna feita ↔ pendente.
 * Outros status mudam só pelas ações de mover, deixar de lado e fechar o dia.
 */
export async function atualizarAtividade(db, id, campos, hoje) {
  const atividade = await repo.buscarAtividade(db, id);
  if (!atividade) throw naoEncontrada();
  if (!['pendente', 'feita'].includes(atividade.status)) {
    throw new ErroDeNegocio(409, 'Essa atividade já saiu do dia e não pode ser editada aqui.');
  }
  // Dias passados já foram fechados: editar ali criaria pendências fora do fluxo.
  if (atividade.data < hoje) {
    throw new ErroDeNegocio(
      409,
      'Esse dia já foi fechado. Para retomar, crie a atividade de novo.',
    );
  }
  // Voltar para pendente num dia de hoje já fechado reabre o dia.
  if (campos.status === 'pendente')
    await garantirDia(db, atividade.data, hoje, { paraEscrita: true });
  return repo.atualizarAtividade(db, id, campos);
}

/**
 * HU-03: exclui uma atividade de hoje em diante, pendente ou feita.
 * Atividades de dias passados, movidas, deixadas de lado ou em aberto fazem parte
 * do histórico usado nos relatórios (RN-13). Para tirar uma pendência da seção
 * "Atividades pendentes", use "deixar de lado".
 */
export async function excluirAtividade(db, id, hoje) {
  const atividade = await repo.buscarAtividade(db, id);
  if (!atividade) throw naoEncontrada();
  const permitida = ['pendente', 'feita'].includes(atividade.status) && atividade.data >= hoje;
  const excluida =
    permitida &&
    (await repo.excluirAtividade(db, id, {
      statusPermitidos: ['pendente', 'feita'],
      aPartirDe: hoje,
    }));
  if (!excluida) {
    throw new ErroDeNegocio(
      409,
      'Essa atividade faz parte do histórico e não pode ser excluída. Você pode deixá-la de lado.',
    );
  }
}

/**
 * Calcula para onde a atividade vai (HU-05, HU-06, HU-11).
 * Atividades "em_aberto" usam hoje como referência para "amanhã".
 */
export function calcularDestino(atividade, escolha, hoje) {
  if (escolha.destino === 'proximo_turno') {
    const destino = proximoTurno(atividade.turno, atividade.data);
    if (atividade.status === 'em_aberto' || destino.data < hoje) {
      throw new ErroDeNegocio(422, 'Para essa atividade, escolha amanhã ou outra data.');
    }
    return destino;
  }

  const base = atividade.status === 'em_aberto' ? hoje : atividade.data;
  const data = escolha.destino === 'amanha' ? somarDias(base, 1) : escolha.data;
  if (data < hoje) throw new ErroDeNegocio(422, 'Escolha hoje ou uma data futura.');
  return { data, turno: escolha.turno ?? atividade.turno };
}

/**
 * Aplica um destino: mover (próximo turno, amanhã, outra data) ou deixar de lado.
 * Ao mover, a original fica "movida" e uma cópia nasce no destino apontando
 * para ela (origem_id), preservando o histórico para os relatórios.
 *
 * O status é trocado de forma condicional (só se ainda estiver pendente ou em
 * aberto): com dois toques quase simultâneos, só o primeiro vale.
 *
 * @param {{diaSendoFechado?: string}} [opcoes] Ao fechar um dia, o destino não pode
 *   cair nesse mesmo dia, senão o dia seria reaberto durante o próprio fechamento.
 */
export async function aplicarDestino(db, atividade, escolha, hoje, opcoes = {}) {
  const origens = ['pendente', 'em_aberto'];
  const jaResolvida = () =>
    new ErroDeNegocio(409, 'Essa atividade já foi resolvida. Atualize a tela.');

  if (escolha.destino === 'deixar_de_lado') {
    const resultado = await repo.transicionarStatus(db, atividade.id, origens, 'deixada_de_lado');
    if (!resultado) throw jaResolvida();
    return resultado;
  }

  const { data, turno } = calcularDestino(atividade, escolha, hoje);
  if (opcoes.diaSendoFechado && data === opcoes.diaSendoFechado) {
    throw new ErroDeNegocio(422, 'Ao fechar o dia, escolha amanhã, outra data ou deixar de lado.');
  }
  if (!(await repo.transicionarStatus(db, atividade.id, origens, 'movida'))) throw jaResolvida();
  await garantirDia(db, data, hoje, { paraEscrita: true });
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

/**
 * HU-05: desfaz um movimento logo depois de feito (mover não pede confirmação).
 * Apaga a cópia e devolve a original para "pendente", sem deixar rastro no histórico.
 * Só vale enquanto a cópia ainda está pendente e a original é de hoje em diante.
 */
export async function desfazerMovimento(db, idDaCopia, hoje) {
  const naoDa = () => new ErroDeNegocio(409, 'Não dá mais para desfazer esse movimento.');
  return repo.emTransacao(db, async (tx) => {
    const copia = await repo.buscarAtividade(tx, idDaCopia);
    if (!copia) throw naoEncontrada();
    const original = copia.origem_id ? await repo.buscarAtividade(tx, copia.origem_id) : null;
    // Valida tudo antes de gravar: o banco de teste não desfaz transações.
    if (!original || original.status !== 'movida' || original.data < hoje) throw naoDa();
    if (copia.status !== 'pendente') throw naoDa();

    const apagou = await repo.excluirAtividade(tx, copia.id, {
      statusPermitidos: ['pendente'],
      aPartirDe: hoje,
    });
    if (!apagou) throw naoDa();
    await garantirDia(tx, original.data, hoje, { paraEscrita: true });
    const devolvida = await repo.transicionarStatus(tx, original.id, ['movida'], 'pendente');
    if (!devolvida) throw naoDa();
    return devolvida;
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

/** HU-09: cria uma atividade fixa e a inclui nos próximos dias já existentes. */
export async function criarFixa(db, dados, hoje) {
  const fixa = await repo.inserirFixa(db, dados);
  for (const data of await repo.listarDiasAbertosDepoisDe(db, hoje)) {
    if (!(await repo.existeTituloNoDia(db, data, fixa.titulo))) {
      await repo.inserirAtividade(db, { data, ...dados, fixaId: fixa.id });
    }
  }
  return fixa;
}

/** HU-09: desativa uma fixa e tira as cópias ainda pendentes dos próximos dias. */
export async function desativarFixa(db, id, hoje) {
  if (!(await repo.desativarFixa(db, id))) {
    throw new ErroDeNegocio(404, 'Não encontramos essa atividade fixa.');
  }
  await repo.removerCopiasFuturasDaFixa(db, id, hoje);
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

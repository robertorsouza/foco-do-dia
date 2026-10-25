/**
 * Regras do dia: abertura, fechamento sem bloqueio (RN-07) e fechamento automático.
 */
import * as repo from '../db/repositorio.js';
import { ordenarPorPrioridade, destinoSugerido, TURNOS } from './turnos.js';
import { aplicarDestino } from './atividadesService.js';
import { ErroDeNegocio } from './erros.js';

/** Status que aparecem nos turnos do dia. Os demais saem dos turnos (RN-12). */
const VISIVEIS_NOS_TURNOS = ['pendente', 'feita'];

/**
 * Garante que o dia exista. Ao criar um dia de hoje em diante,
 * inclui as atividades fixas ativas (HU-09).
 */
export async function garantirDia(db, data, hoje) {
  const criado = await repo.criarDiaSeNaoExiste(db, data);
  if (criado && data >= hoje) {
    const fixas = await repo.listarFixasAtivas(db);
    for (const fixa of fixas) {
      await repo.inserirAtividade(db, { data, ...fixa, fixaId: fixa.id });
    }
  }
}

/** Progresso "x de y" de uma lista de atividades visíveis. */
function progresso(atividades) {
  return {
    feitas: atividades.filter((a) => a.status === 'feita').length,
    total: atividades.length,
  };
}

/**
 * HU-01 / HU-08: o dia com atividades agrupadas por turno, urgentes no topo.
 */
export async function obterDia(db, data, hoje) {
  await garantirDia(db, data, hoje);
  const dia = await repo.buscarDia(db, data);
  const visiveis = (await repo.listarAtividadesDoDia(db, data)).filter((a) =>
    VISIVEIS_NOS_TURNOS.includes(a.status),
  );

  const turnos = {};
  const progressoPorTurno = {};
  for (const turno of TURNOS) {
    const doTurno = visiveis.filter((a) => a.turno === turno);
    turnos[turno] = ordenarPorPrioridade(doTurno);
    progressoPorTurno[turno] = progresso(doTurno);
  }

  return {
    data,
    fechado: Boolean(dia.fechado_em),
    turnos,
    progresso: { ...progressoPorTurno, dia: progresso(visiveis) },
  };
}

/** HU-06 / RN-11: pendências do dia com destino sugerido, urgentes no topo. */
export async function sugestoesDeFechamento(db, data) {
  const pendentes = (await repo.listarAtividadesDoDia(db, data)).filter(
    (a) => a.status === 'pendente',
  );
  return ordenarPorPrioridade(pendentes).map((a) => ({
    atividade: a,
    sugestao: destinoSugerido(a, data),
  }));
}

/**
 * RN-07: fecha o dia sem nunca bloquear.
 * Pendências com destino escolhido seguem para ele; as demais viram "em_aberto"
 * e vão para a seção "Atividades pendentes" (RN-12).
 * @param {Array<{id:number, destino:string, data?:string, turno?:string}>} destinos
 */
export async function fecharDia(db, data, destinos, hoje) {
  const dia = await repo.buscarDia(db, data);
  if (!dia) throw new ErroDeNegocio(404, 'Esse dia ainda não tem atividades.');
  if (dia.fechado_em) throw new ErroDeNegocio(409, 'Esse dia já foi fechado.');

  return repo.emTransacao(db, async (tx) => {
    const pendentes = (await repo.listarAtividadesDoDia(tx, data)).filter(
      (a) => a.status === 'pendente',
    );
    const escolhas = new Map(destinos.map((d) => [d.id, d]));
    const resumo = { movidas: 0, deixadas_de_lado: 0, em_aberto: 0 };

    for (const atividade of pendentes) {
      const escolha = escolhas.get(atividade.id);
      if (escolha) {
        await aplicarDestino(tx, atividade, escolha, hoje);
        resumo[escolha.destino === 'deixar_de_lado' ? 'deixadas_de_lado' : 'movidas'] += 1;
      } else {
        await repo.atualizarAtividade(tx, atividade.id, { status: 'em_aberto' });
        resumo.em_aberto += 1;
      }
    }
    await repo.marcarDiaFechado(tx, data);
    return resumo;
  });
}

/**
 * Fechamento automático "preguiçoso" (docs/arquitetura.md, 6.2): na primeira
 * requisição de um novo dia, fecha os dias anteriores que ficaram abertos.
 * Funciona mesmo com o servidor gratuito dormindo, sem tarefa agendada.
 */
export async function fecharDiasAnteriores(db, hoje) {
  const abertos = await repo.listarDiasAbertosAntesDe(db, hoje);
  for (const data of abertos) {
    await fecharDia(db, data, [], hoje);
  }
  return abertos.length;
}

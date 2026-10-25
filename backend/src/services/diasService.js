/**
 * Regras do dia: abertura, fechamento sem bloqueio (RN-07) e fechamento automático.
 */
import * as repo from '../db/repositorio.js';
import { ordenarPorPrioridade, destinoSugerido, TURNOS } from './turnos.js';
import { aplicarDestino, calcularDestino } from './atividadesService.js';
import { ErroDeNegocio } from './erros.js';

/** Status que aparecem nos turnos do dia. Os demais saem dos turnos (RN-12). */
const VISIVEIS_NOS_TURNOS = ['pendente', 'feita'];

/**
 * Garante que o dia exista. Ao criar um dia de hoje em diante,
 * inclui as atividades fixas ativas (HU-09).
 *
 * Em escritas (nova atividade ou atividade movida para cá), um dia de hoje em
 * diante que já estava fechado é reaberto: assim a nova pendência não fica
 * presa e passa pelo fechamento normal (RN-07).
 */
export async function garantirDia(db, data, hoje, { paraEscrita = false } = {}) {
  const criado = await repo.criarDiaSeNaoExiste(db, data);
  if (criado && data >= hoje) {
    const fixas = await repo.listarFixasAtivas(db);
    for (const fixa of fixas) {
      await repo.inserirAtividade(db, { data, ...fixa, fixaId: fixa.id });
    }
  }
  if (!criado && paraEscrita && data >= hoje) await repo.reabrirDia(db, data);
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
  if (data > hoje) throw new ErroDeNegocio(422, 'Só dá para fechar hoje ou dias anteriores.');
  const dia = await repo.buscarDia(db, data);
  if (!dia) throw new ErroDeNegocio(404, 'Esse dia ainda não tem atividades.');

  // Valida todos os destinos antes de gravar qualquer coisa: um destino inválido
  // recusa o fechamento inteiro, sem deixar o dia pela metade.
  const escolhasAntes = new Map(destinos.map((d) => [d.id, d]));
  for (const atividade of await repo.listarAtividadesDoDia(db, data)) {
    const escolha = escolhasAntes.get(atividade.id);
    if (!escolha || atividade.status !== 'pendente' || escolha.destino === 'deixar_de_lado')
      continue;
    if (calcularDestino(atividade, escolha, hoje).data === data) {
      throw new ErroDeNegocio(
        422,
        'Ao fechar o dia, escolha amanhã, outra data ou deixar de lado.',
      );
    }
  }

  return repo.emTransacao(db, async (tx) => {
    // Reivindica o fechamento primeiro: se duas requisições chegarem juntas,
    // só uma fecha o dia e a outra recebe 409.
    if (!(await repo.reivindicarFechamento(tx, data))) {
      throw new ErroDeNegocio(409, 'Esse dia já foi fechado.');
    }
    const pendentes = (await repo.listarAtividadesDoDia(tx, data)).filter(
      (a) => a.status === 'pendente',
    );
    const escolhas = new Map(destinos.map((d) => [d.id, d]));
    const resumo = { movidas: 0, deixadas_de_lado: 0, em_aberto: 0 };

    for (const atividade of pendentes) {
      const escolha = escolhas.get(atividade.id);
      if (escolha) {
        await aplicarDestino(tx, atividade, escolha, hoje, { diaSendoFechado: data });
        resumo[escolha.destino === 'deixar_de_lado' ? 'deixadas_de_lado' : 'movidas'] += 1;
      } else {
        if (await repo.transicionarStatus(tx, atividade.id, ['pendente'], 'em_aberto')) {
          resumo.em_aberto += 1;
        }
      }
    }
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
    try {
      await fecharDia(db, data, [], hoje);
    } catch (erro) {
      // Outra requisição fechou o mesmo dia ao mesmo tempo: o resultado é o mesmo.
      // Qualquer outro erro continua sendo lançado.
      if (!(erro instanceof ErroDeNegocio && erro.status === 409)) throw erro;
      console.info(`[dias] ${data} já tinha sido fechado por outra requisição.`);
    }
  }
  return abertos.length;
}

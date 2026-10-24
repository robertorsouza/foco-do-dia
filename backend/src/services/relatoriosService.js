/**
 * Relatórios do dia (HU-07 a HU-10) e da semana (HU-11).
 */
import * as repo from '../db/repositorio.js';
import { TURNOS, ordenarPorPrioridade } from './turnos.js';
import { somarDias, diasEntre, dataLocal } from './datas.js';
import { gerarSugestoesIA } from '../ai/relatorioIA.js';

/** RN-08: feita em 3 ou mais dos últimos 7 dias. */
export const MINIMO_DE_DIAS_PARA_FIXA = 3;

const normalizar = (titulo) => titulo.trim().toLocaleLowerCase('pt-BR');

/**
 * Uma atividade movida dentro do mesmo dia (ex.: manhã → tarde) gera uma cópia
 * no mesmo dia. Para não contar a mesma tarefa duas vezes, a original sai da conta.
 */
export function semDuplicatasDeMovimento(atividades) {
  const movidasNoMesmoDia = new Set(
    atividades.filter((a) => a.origem_id).map((a) => `${a.origem_id}|${a.data}`),
  );
  return atividades.filter((a) => !movidasNoMesmoDia.has(`${a.id}|${a.data}`));
}

function percentual(feitas, total) {
  return total === 0 ? 0 : Math.round((feitas / total) * 100);
}

/** Mensagem padrão, usada quando a IA não está disponível. Acolhedora, sem cobrança. */
export function mensagemPadrao(feitas, total) {
  if (total === 0) return 'Dia livre. Que tal planejar só uma coisa para amanhã?';
  if (feitas === 0) return 'Hoje foi puxado. Amanhã é uma nova chance.';
  return `Você concluiu ${feitas} de ${total} hoje. Cada uma conta.`;
}

/**
 * RN-08: atividades feitas em pelo menos 3 dias distintos da janela,
 * que ainda não são fixas. Sugere o turno em que mais aparecem.
 */
export function sugerirFixas(atividadesDaJanela, fixasAtivas) {
  const jaFixas = new Set(fixasAtivas.map((f) => normalizar(f.titulo)));
  const grupos = new Map();

  for (const a of atividadesDaJanela.filter((x) => x.status === 'feita')) {
    const chave = normalizar(a.titulo);
    if (jaFixas.has(chave)) continue;
    const grupo = grupos.get(chave) ?? { titulo: a.titulo, dias: new Set(), turnos: {} };
    grupo.dias.add(a.data);
    grupo.turnos[a.turno] = (grupo.turnos[a.turno] ?? 0) + 1;
    grupos.set(chave, grupo);
  }

  return [...grupos.values()]
    .filter((g) => g.dias.size >= MINIMO_DE_DIAS_PARA_FIXA)
    .map((g) => ({
      titulo: g.titulo,
      turno: Object.entries(g.turnos).sort((x, y) => y[1] - x[1])[0][0],
      dias: g.dias.size,
    }));
}

/**
 * HU-07: relatório do dia. Começa pelo que foi feito.
 * Números e regras saem do banco; a IA só complementa (HU-10).
 */
export async function relatorioDiario({ db, ia, relogio, fuso }, data) {
  const doDia = semDuplicatasDeMovimento(await repo.listarAtividadesDoDia(db, data));
  const janela = await repo.listarAtividadesEntre(db, somarDias(data, -6), data);
  const amanha = await repo.listarAtividadesDoDia(db, somarDias(data, 1));

  const porTurno = {};
  for (const turno of TURNOS) {
    const doTurno = doDia.filter((a) => a.turno === turno);
    porTurno[turno] = {
      feitas: doTurno.filter((a) => a.status === 'feita'),
      nao_feitas: ordenarPorPrioridade(doTurno.filter((a) => a.status !== 'feita')),
    };
  }

  const feitas = doDia.filter((a) => a.status === 'feita').length;
  const total = doDia.length;

  // Sugestões da IA: em cache para dias passados (não mudam mais).
  const dia = await repo.buscarDia(db, data);
  const diaEncerrado = data < dataLocal(relogio(), fuso);
  let ia_sugestoes = diaEncerrado ? dia?.sugestoes_ia : null;
  if (!ia_sugestoes && total > 0) {
    ia_sugestoes = await gerarSugestoesIA(ia, doDia, janela);
    if (ia_sugestoes && diaEncerrado && dia) await repo.salvarSugestoesIA(db, data, ia_sugestoes);
  }

  return {
    data,
    contagem: { feitas, total, percentual: percentual(feitas, total) },
    mensagem: ia_sugestoes?.mensagem ?? mensagemPadrao(feitas, total),
    por_turno: porTurno,
    plano_amanha: ordenarPorPrioridade(
      amanha.filter((a) => a.origem_id && a.status === 'pendente'),
    ),
    sugestoes_fixas: sugerirFixas(janela, await repo.listarFixasAtivas(db)),
    parecidas: ia_sugestoes?.parecidas ?? [],
    ia_disponivel: Boolean(ia_sugestoes),
  };
}

/**
 * HU-11: relatório semanal com % de conclusão por dia e o bloco
 * "Atividades pendentes" agrupado por dia e turno, urgentes no topo.
 */
export async function relatorioSemanal(db, inicio, hoje) {
  const fim = somarDias(inicio, 6);
  const atividades = semDuplicatasDeMovimento(await repo.listarAtividadesEntre(db, inicio, fim));

  const dias = Array.from({ length: 7 }, (_, i) => {
    const data = somarDias(inicio, i);
    const doDia = atividades.filter((a) => a.data === data);
    const feitas = doDia.filter((a) => a.status === 'feita').length;
    return { data, feitas, total: doDia.length, percentual: percentual(feitas, doDia.length) };
  });

  // Ordem: dia, depois turno, depois urgentes no topo (RN-10).
  const peso = (a) => (a.prioridade === 'urgente' ? 0 : 1);
  const pendencias = atividades
    .filter((a) => a.status === 'em_aberto')
    .sort(
      (a, b) =>
        a.data.localeCompare(b.data) ||
        TURNOS.indexOf(a.turno) - TURNOS.indexOf(b.turno) ||
        peso(a) - peso(b),
    )
    .map((a) => ({ ...a, dias_pendente: diasEntre(a.data, hoje) }));

  return { inicio, fim, dias, pendencias };
}

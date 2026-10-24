/**
 * Rotas da API (camada routes/): recebe a requisição, valida a entrada,
 * chama o serviço e devolve a resposta. Nenhuma regra de negócio aqui.
 * Contrato completo em docs/arquitetura.md, seção 5.
 */
import { Router } from 'express';
import { z } from 'zod';
import * as e from './esquemas.js';
import { validar } from './validar.js';
import * as atividades from '../services/atividadesService.js';
import * as dias from '../services/diasService.js';
import { alertaDeAgora } from '../services/alertasService.js';
import * as relatorios from '../services/relatoriosService.js';
import * as repo from '../db/repositorio.js';
import { dataLocal, minutosLocal } from '../services/datas.js';

/**
 * @param {{db: import('pg').Pool, relogio: () => Date, fuso: string, ia: object|null}} ctx
 */
export function criarRotas(ctx) {
  const { db, relogio, fuso } = ctx;
  const hoje = () => dataLocal(relogio(), fuso);
  const router = Router();

  // Fechamento automático preguiçoso dos dias anteriores (RN-07).
  router.use(async (_req, _res, next) => {
    try {
      await dias.fecharDiasAnteriores(db, hoje());
      next();
    } catch (erro) {
      next(erro);
    }
  });

  // ---- Dia ----
  router.get('/hoje', async (_req, res) => {
    res.json(await dias.obterDia(db, hoje(), hoje()));
  });

  router.get('/dias/:data', async (req, res) => {
    res.json(await dias.obterDia(db, validar(e.data, req.params.data), hoje()));
  });

  router.get('/dias/:data/sugestoes-fechamento', async (req, res) => {
    res.json(await dias.sugestoesDeFechamento(db, validar(e.data, req.params.data)));
  });

  router.post('/dias/:data/fechar', async (req, res) => {
    const data = validar(e.data, req.params.data);
    const { destinos } = validar(e.fechamento, req.body ?? {});
    res.json(await dias.fecharDia(db, data, destinos, hoje()));
  });

  // ---- Atividades ----
  router.post('/atividades', async (req, res) => {
    const dados = validar(e.novaAtividade, req.body);
    res.status(201).json(await atividades.criarAtividade(db, dados, hoje()));
  });

  router.patch('/atividades/:id', async (req, res) => {
    const id = validar(e.id, req.params.id);
    res.json(await atividades.atualizarAtividade(db, id, validar(e.edicaoDeAtividade, req.body)));
  });

  router.delete('/atividades/:id', async (req, res) => {
    await atividades.excluirAtividade(db, validar(e.id, req.params.id));
    res.status(204).end();
  });

  router.post('/atividades/:id/mover', async (req, res) => {
    const id = validar(e.id, req.params.id);
    res.json(await atividades.moverAtividade(db, id, validar(e.destino, req.body), hoje()));
  });

  router.post('/atividades/:id/deixar-de-lado', async (req, res) => {
    res.json(await atividades.deixarDeLado(db, validar(e.id, req.params.id), hoje()));
  });

  // ---- Pendências (seção separada dos turnos, RN-12) ----
  router.get('/pendencias', async (_req, res) => {
    res.json(await atividades.listarPendencias(db, hoje()));
  });

  // ---- Alertas ----
  router.get('/alertas/agora', async (_req, res) => {
    const agora = relogio();
    res.json(await alertaDeAgora(db, dataLocal(agora, fuso), minutosLocal(agora, fuso)));
  });

  // ---- Relatórios ----
  router.get('/relatorios/diario/:data', async (req, res) => {
    const data = validar(e.data, req.params.data);
    res.json(await relatorios.relatorioDiario(ctx, data));
  });

  router.get('/relatorios/semanal', async (req, res) => {
    const inicio = validar(z.object({ inicio: e.data }), req.query).inicio;
    res.json(await relatorios.relatorioSemanal(db, inicio, hoje()));
  });

  // ---- Atividades fixas ----
  router.get('/fixas', async (_req, res) => {
    res.json(await repo.listarFixasAtivas(db));
  });

  router.post('/fixas', async (req, res) => {
    res.status(201).json(await repo.inserirFixa(db, validar(e.novaFixa, req.body)));
  });

  router.delete('/fixas/:id', async (req, res) => {
    const removida = await repo.desativarFixa(db, validar(e.id, req.params.id));
    res.status(removida ? 204 : 404).end();
  });

  return router;
}

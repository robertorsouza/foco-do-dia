/**
 * Montagem da aplicação Express.
 * As dependências (banco, relógio, cliente de IA) são injetadas, o que permite
 * testar tudo sem rede e com um horário controlado.
 */
import express from 'express';
import cors from 'cors';
import { criarRotas } from './routes/index.js';
import { ErroDeNegocio } from './services/erros.js';
import { opcoesDeCors, exigirCodigoDeAcesso } from './seguranca.js';

/**
 * @param {{db: import('pg').Pool, relogio?: () => Date, fuso?: string, ia?: object|null,
 *          origensPermitidas?: string, codigoDeAcesso?: string}} opcoes
 */
export function criarApp({
  db,
  relogio = () => new Date(),
  fuso = 'America/Sao_Paulo',
  ia = null,
  origensPermitidas,
  codigoDeAcesso,
}) {
  const app = express();
  app.disable('x-powered-by');
  // CORS fechado por padrão: só os domínios do frontend chamam a API (arquitetura, seção 7).
  app.use(cors(opcoesDeCors(origensPermitidas)));
  app.use(express.json({ limit: '20kb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api', exigirCodigoDeAcesso(codigoDeAcesso), criarRotas({ db, relogio, fuso, ia }));

  app.use((_req, res) => res.status(404).json({ erro: 'Endereço não encontrado.' }));

  // Tratamento central de erros: mensagem curta para o usuário, detalhe só no log.
  app.use((erro, _req, res, _next) => {
    if (erro instanceof ErroDeNegocio) return res.status(erro.status).json({ erro: erro.message });
    if (erro.type === 'entity.parse.failed') {
      return res.status(400).json({ erro: 'Não entendemos os dados enviados.' });
    }
    console.error('[erro]', erro);
    return res.status(500).json({ erro: 'Algo deu errado. Tente de novo em instantes.' });
  });

  return app;
}

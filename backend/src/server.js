/**
 * Ponto de entrada: lê a configuração das variáveis de ambiente e sobe o servidor.
 */
import { criarApp } from './app.js';
import { criarPool } from './db/pool.js';
import { criarClienteIA } from './ai/clienteIA.js';
import { verificarConfiguracaoDeProducao } from './seguranca.js';

verificarConfiguracaoDeProducao(process.env);

const porta = Number(process.env.PORT ?? 3000);
const app = criarApp({
  db: criarPool(process.env.DATABASE_URL, process.env.DB_SSL),
  fuso: process.env.TZ_APP ?? 'America/Sao_Paulo',
  ia: criarClienteIA({ apiKey: process.env.LLM_API_KEY, modelo: process.env.LLM_MODEL }),
  origensPermitidas: process.env.FRONTEND_URL,
  codigoDeAcesso: process.env.APP_ACCESS_TOKEN,
});

app.listen(porta, () => console.log(`Foco do Dia API em http://localhost:${porta}`));

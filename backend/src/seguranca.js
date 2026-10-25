/**
 * Proteções de acesso à API (revisão de segurança do PR #1).
 *
 * 1. CORS "fechado por padrão": só os domínios listados em FRONTEND_URL podem
 *    chamar a API pelo navegador. Sem lista, nenhum site externo pode.
 * 2. Código de acesso: o MVP tem um único usuário e não tem login (fora do
 *    escopo). Para a API publicada não ficar aberta a qualquer pessoa, toda
 *    chamada precisa do código definido em APP_ACCESS_TOKEN. A pessoa digita o
 *    código uma vez no app; ele não fica embutido no código do frontend.
 */
import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Opções de CORS a partir de uma lista separada por vírgulas.
 * @param {string|undefined} origens Ex.: "https://foco-do-dia.vercel.app,http://localhost:5173"
 */
export function opcoesDeCors(origens) {
  const lista = (origens ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  // origin: false → o navegador bloqueia qualquer site (fail-closed).
  return { origin: lista.length > 0 ? lista : false };
}

/** Compara dois textos em tempo constante (não revela o código por tempo de resposta). */
function iguais(a, b) {
  const hash = (t) => createHash('sha256').update(t).digest();
  return timingSafeEqual(hash(a), hash(b));
}

/**
 * Middleware que exige `Authorization: Bearer <código>`.
 * Sem código configurado (desenvolvimento local e testes), libera o acesso.
 * @param {string|undefined} codigo Valor de APP_ACCESS_TOKEN.
 */
export function exigirCodigoDeAcesso(codigo) {
  return (req, res, next) => {
    if (!codigo) return next();
    const enviado = (req.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (enviado && iguais(enviado, codigo)) return next();
    return res.status(401).json({ erro: 'Código de acesso inválido.' });
  };
}

/**
 * Impede subir em produção sem as proteções configuradas.
 * Melhor o servidor não iniciar do que iniciar aberto.
 * @param {NodeJS.ProcessEnv} env
 */
export function verificarConfiguracaoDeProducao(env) {
  if (env.NODE_ENV !== 'production') return;
  const faltando = ['FRONTEND_URL', 'APP_ACCESS_TOKEN', 'DATABASE_URL'].filter((v) => !env[v]);
  if (faltando.length > 0) {
    throw new Error(`Configuração de produção incompleta. Defina: ${faltando.join(', ')}.`);
  }
  if (env.APP_ACCESS_TOKEN.length < 12) {
    throw new Error('APP_ACCESS_TOKEN deve ter pelo menos 12 caracteres.');
  }
}

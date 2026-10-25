/**
 * Cliente HTTP da API do Foco do Dia.
 *
 * - Envia o código de acesso em `Authorization: Bearer` (RNF-10).
 * - Devolve as mensagens de erro da API como estão: as regras de "pode / não pode"
 *   moram no backend, e o frontend só exibe (docs/jornadas.md).
 * - Avisa quando uma resposta demora: no plano gratuito do Render o servidor
 *   dorme e a primeira requisição do dia pode levar até 1 minuto.
 */

export class ErroDaApi extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

export const MENSAGEM_SEM_CONEXAO = 'Sem conexão. Suas mudanças não foram salvas; tente de novo.';
const MENSAGEM_GENERICA = 'Algo deu errado. Tente de novo em instantes.';

/**
 * @param {{
 *   baseURL: string,
 *   obterCodigo: () => string | null,
 *   aoNaoAutorizar?: () => void,
 *   aoDemorar?: (demorando: boolean) => void,
 *   fetch?: typeof fetch,
 *   esperaParaAvisarMs?: number,
 * }} opcoes
 */
export function criarCliente({
  baseURL,
  obterCodigo,
  aoNaoAutorizar = () => {},
  aoDemorar = () => {},
  fetch: buscar = (...args) => globalThis.fetch(...args),
  esperaParaAvisarMs = 2500,
}) {
  let emAndamento = 0;
  let avisando = false;

  async function pedir(metodo, caminho, corpo, { codigo } = {}) {
    const headers = { Accept: 'application/json' };
    const codigoUsado = codigo ?? obterCodigo();
    if (codigoUsado) headers.Authorization = `Bearer ${codigoUsado}`;
    if (corpo !== undefined) headers['Content-Type'] = 'application/json';

    emAndamento += 1;
    const aviso = setTimeout(() => {
      if (!avisando) {
        avisando = true;
        aoDemorar(true);
      }
    }, esperaParaAvisarMs);

    let resposta;
    try {
      resposta = await buscar(`${baseURL}/api${caminho}`, {
        method: metodo,
        headers,
        body: corpo === undefined ? undefined : JSON.stringify(corpo),
      });
    } catch {
      throw new ErroDaApi(0, MENSAGEM_SEM_CONEXAO);
    } finally {
      clearTimeout(aviso);
      emAndamento -= 1;
      if (emAndamento === 0 && avisando) {
        avisando = false;
        aoDemorar(false);
      }
    }

    if (resposta.status === 204) return null;
    const dados = await resposta.json().catch(() => null);
    if (!resposta.ok) {
      if (resposta.status === 401 && !codigo) aoNaoAutorizar();
      throw new ErroDaApi(resposta.status, dados?.erro ?? MENSAGEM_GENERICA);
    }
    return dados;
  }

  return {
    get: (caminho, opcoes) => pedir('GET', caminho, undefined, opcoes),
    post: (caminho, corpo = {}) => pedir('POST', caminho, corpo),
    patch: (caminho, corpo) => pedir('PATCH', caminho, corpo),
    delete: (caminho) => pedir('DELETE', caminho),
  };
}

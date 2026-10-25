import { ErroDeNegocio } from '../services/erros.js';

/**
 * Valida um valor com um esquema Zod. Se for inválido, devolve 422 com a
 * primeira mensagem, curta e legível.
 */
export function validar(esquema, valor) {
  const resultado = esquema.safeParse(valor);
  if (!resultado.success) {
    throw new ErroDeNegocio(422, resultado.error.issues[0]?.message ?? 'Dados inválidos.');
  }
  return resultado.data;
}

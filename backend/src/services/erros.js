/** Erro de regra de negócio, com status HTTP e mensagem curta para o usuário. */
export class ErroDeNegocio extends Error {
  /**
   * @param {number} status Código HTTP (ex.: 404, 409, 422).
   * @param {string} mensagem Texto curto e acolhedor, exibido na tela.
   */
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

export const naoEncontrada = () => new ErroDeNegocio(404, 'Não encontramos essa atividade.');

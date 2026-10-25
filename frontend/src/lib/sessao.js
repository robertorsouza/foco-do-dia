/**
 * Código de acesso salvo no aparelho (RNF-10). O armazenamento do navegador pode
 * falhar (aba anônima, bloqueio de dados): nesse caso o código vale só enquanto
 * a aba estiver aberta.
 */
const CHAVE = 'foco-do-dia:codigo';
let emMemoria = null;

export function lerCodigo() {
  try {
    return localStorage.getItem(CHAVE) ?? emMemoria;
  } catch {
    return emMemoria;
  }
}

export function salvarCodigo(codigo) {
  emMemoria = codigo;
  try {
    localStorage.setItem(CHAVE, codigo);
  } catch {
    // Sem armazenamento: segue só em memória.
  }
}

export function apagarCodigo() {
  emMemoria = null;
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // Nada a fazer.
  }
}

/** Lembra que o alerta de um turno já foi dispensado hoje ("Agora não"). */
const dispensados = new Set();

export function alertaDispensado(data, turno) {
  const chave = `foco-do-dia:alerta:${data}:${turno}`;
  try {
    return sessionStorage.getItem(chave) === '1';
  } catch {
    return dispensados.has(chave);
  }
}

export function dispensarAlerta(data, turno) {
  const chave = `foco-do-dia:alerta:${data}:${turno}`;
  try {
    sessionStorage.setItem(chave, '1');
  } catch {
    // Sem armazenamento: vale só enquanto a aba estiver aberta.
    dispensados.add(chave);
  }
}

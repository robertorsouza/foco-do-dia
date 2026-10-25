/**
 * Cliente da API de IA (camada ai/), isolado do resto do sistema.
 * Se trocarmos de provedor, só este arquivo muda (docs/arquitetura.md, seção 3).
 */
import Anthropic from '@anthropic-ai/sdk';

/** RNF-06: o relatório não espera a IA mais do que isso. */
export const TEMPO_LIMITE_MS = 10_000;

/**
 * Cria o cliente. Sem chave, devolve null e o app segue sem sugestões (RNF-05).
 * Sem novas tentativas: o limite de 10 s vale para a espera total, não por tentativa.
 * @param {{apiKey?: string, modelo?: string, baseURL?: string, tempoLimiteMs?: number}} config
 * @returns {{gerar: (sistema: string, usuario: string) => Promise<string>} | null}
 */
export function criarClienteIA({ apiKey, modelo, baseURL, tempoLimiteMs = TEMPO_LIMITE_MS }) {
  if (!apiKey) return null;
  const anthropic = new Anthropic({ apiKey, baseURL, timeout: tempoLimiteMs, maxRetries: 0 });

  return {
    async gerar(sistema, usuario) {
      const resposta = await anthropic.messages.create({
        model: modelo || 'claude-haiku-5-5',
        max_tokens: 600,
        temperature: 0.2,
        system: sistema,
        messages: [{ role: 'user', content: usuario }],
      });
      return resposta.content
        .filter((bloco) => bloco.type === 'text')
        .map((bloco) => bloco.text)
        .join('');
    },
  };
}

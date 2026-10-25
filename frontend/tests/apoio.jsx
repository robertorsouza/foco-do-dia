/**
 * API falsa para os testes de tela: responde como o backend, registra as chamadas
 * e permite trocar respostas por teste. Assim os testes conferem o que o
 * frontend ENVIA (método, caminho, corpo) e o que ele MOSTRA.
 */
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import App from '../src/App.jsx';

export const HOJE = '2026-10-25';

export const atividade = (id, titulo, turno, extras = {}) => ({
  id,
  data: HOJE,
  titulo,
  turno,
  prioridade: 'normal',
  status: 'pendente',
  origem_id: null,
  fixa_id: null,
  ...extras,
});

export function diaCom(lista, { fechado = false } = {}) {
  const turnos = { manha: [], tarde: [], noite: [] };
  for (const a of lista) turnos[a.turno].push(a);
  const conta = (l) => ({ feitas: l.filter((a) => a.status === 'feita').length, total: l.length });
  return {
    data: HOJE,
    fechado,
    turnos,
    progresso: {
      manha: conta(turnos.manha),
      tarde: conta(turnos.tarde),
      noite: conta(turnos.noite),
      dia: conta(lista),
    },
  };
}

export const relatorioVazio = (extras = {}) => ({
  data: HOJE,
  contagem: { feitas: 0, total: 0, percentual: 0 },
  mensagem: 'Dia livre. Que tal planejar só uma coisa para amanhã?',
  por_turno: {
    manha: { feitas: [], nao_feitas: [] },
    tarde: { feitas: [], nao_feitas: [] },
    noite: { feitas: [], nao_feitas: [] },
  },
  plano_amanha: [],
  sugestoes_fixas: [],
  parecidas: [],
  ia_disponivel: false,
  ...extras,
});

/**
 * @param {Record<string, any | ((req) => any)>} rotas  'GET /hoje' → corpo ou função.
 *   Uma função pode lançar {status, erro} para simular erro da API.
 */
export function criarApiFalsa(rotas = {}) {
  const padrao = {
    'GET /hoje': diaCom([]),
    'GET /pendencias': [],
    'GET /alertas/agora': { data: HOJE, alertar: false, turno: 'manha', pendencias: [] },
  };
  const tabela = { ...padrao, ...rotas };
  const chamadas = [];
  const fetch = vi.fn(async (url, opcoes) => {
    const caminho = url.replace(/^.*\/api/, '');
    const req = {
      metodo: opcoes.method,
      caminho,
      corpo: opcoes.body ? JSON.parse(opcoes.body) : undefined,
      codigo: opcoes.headers.Authorization?.replace('Bearer ', ''),
    };
    chamadas.push(req);
    const chave = Object.keys(tabela).find((k) => {
      const [m, padraoCaminho] = k.split(' ');
      return (
        m === req.metodo &&
        // Só nos testes: os padrões são as chaves fixas da tabela acima.
        // eslint-disable-next-line security/detect-non-literal-regexp
        new RegExp(`^${padraoCaminho.replace(/:\w+/g, '[^/?]+')}$`).test(caminho.split('?')[0])
      );
    });
    if (!chave)
      return {
        status: 404,
        ok: false,
        json: async () => ({ erro: `Sem rota falsa: ${req.metodo} ${caminho}` }),
      };
    try {
      const valor = typeof tabela[chave] === 'function' ? tabela[chave](req) : tabela[chave];
      if (valor === null) return { status: 204, ok: true, json: async () => null };
      return { status: 200, ok: true, json: async () => valor };
    } catch (falha) {
      return { status: falha.status, ok: false, json: async () => ({ erro: falha.erro }) };
    }
  });
  return {
    fetch,
    chamadas,
    definir: (chave, valor) => (tabela[chave] = valor),
    feitas: (metodo, prefixo) =>
      chamadas.filter((c) => c.metodo === metodo && c.caminho.startsWith(prefixo)),
  };
}

export function abrirApp(api, { rota = '/hoje', logado = true } = {}) {
  window.location.hash = rota;
  if (logado) localStorage.setItem('foco-do-dia:codigo', 'codigo-certo');
  return render(<App baseURL="https://api.teste" fetch={api.fetch} />);
}

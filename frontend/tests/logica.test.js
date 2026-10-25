// Testes da lógica de apoio do frontend: datas, textos de turno e cliente da API.
import { describe, it, expect, vi } from 'vitest';
import { dataPorExtenso, dataCurta, intervalo, somarDias, nomeDoDia } from '../src/lib/datas.js';
import { opcoesDeFechamento, avisoMovida, textoProximoTurno } from '../src/lib/turnos.js';
import { criarCliente, ErroDaApi, MENSAGEM_SEM_CONEXAO } from '../src/api/cliente.js';

describe('datas', () => {
  it('escreve a data por extenso em português', () => {
    expect(dataPorExtenso('2026-10-25')).toBe('Domingo, 25 de outubro');
    expect(dataCurta('2026-10-04')).toBe('04/10');
  });
  it('soma dias atravessando o mês', () => {
    expect(somarDias('2026-10-31', 1)).toBe('2026-11-01');
  });
  it('monta intervalos no mesmo mês e entre meses', () => {
    expect(intervalo('2026-10-19', '2026-10-25')).toBe('19 a 25 de outubro');
    expect(intervalo('2026-09-28', '2026-10-04')).toBe('28 de setembro a 4 de outubro');
  });
  it('chama ontem de "Ontem"', () => {
    expect(nomeDoDia('2026-10-24', '2026-10-25')).toBe('Ontem');
    expect(nomeDoDia('2026-10-22', '2026-10-25')).toBe('Quinta');
  });
});

describe('RN-07: opções ao fechar o dia', () => {
  const sugestao = (turno) => ({ destino: 'amanha', turno });
  it('manhã e tarde não oferecem "próximo turno" (cairia no mesmo dia)', () => {
    const chaves = opcoesDeFechamento({ turno: 'tarde' }, sugestao('tarde')).map((o) => o.chave);
    expect(chaves).toEqual(['amanha', 'em_aberto', 'deixar_de_lado']);
  });
  it('a noite oferece "próximo turno" (amanhã de manhã)', () => {
    const chaves = opcoesDeFechamento({ turno: 'noite' }, sugestao('noite')).map((o) => o.chave);
    expect(chaves).toContain('proximo_turno');
  });
  it('urgente da noite já sugere amanhã de manhã: não repete a opção', () => {
    const chaves = opcoesDeFechamento({ turno: 'noite' }, sugestao('manha')).map((o) => o.chave);
    expect(chaves).not.toContain('proximo_turno');
  });
  it('"em aberto" não manda destino: a API coloca em Atividades pendentes', () => {
    const op = opcoesDeFechamento({ turno: 'manha' }, sugestao('manha'));
    expect(op.find((o) => o.chave === 'em_aberto').destino).toBeNull();
  });
});

describe('textos de movimento', () => {
  it('descreve o destino em linguagem simples', () => {
    expect(avisoMovida('proximo_turno', 'manha')).toBe('Foi para a tarde.');
    expect(avisoMovida('proximo_turno', 'noite')).toBe('Foi para amanhã de manhã.');
    expect(avisoMovida('amanha', 'tarde')).toBe('Foi para amanhã à tarde.');
    expect(textoProximoTurno('tarde')).toBe('Vai para a noite');
  });
});

describe('cliente da API', () => {
  const resposta = (status, corpo) => ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => corpo,
  });

  it('envia o código de acesso no cabeçalho Authorization', async () => {
    const fetch = vi.fn().mockResolvedValue(resposta(200, { ok: true }));
    const http = criarCliente({ baseURL: 'https://api', obterCodigo: () => 'segredo', fetch });
    await http.get('/hoje');
    expect(fetch).toHaveBeenCalledWith('https://api/api/hoje', expect.anything());
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer segredo');
  });

  it('devolve a mensagem de erro da API, sem inventar regra', async () => {
    const fetch = vi.fn().mockResolvedValue(resposta(409, { erro: 'Essa já foi resolvida.' }));
    const http = criarCliente({ baseURL: '', obterCodigo: () => null, fetch });
    await expect(http.delete('/atividades/1')).rejects.toMatchObject({
      status: 409,
      message: 'Essa já foi resolvida.',
    });
  });

  it('código recusado (401) avisa o app para voltar à tela de acesso', async () => {
    const aoNaoAutorizar = vi.fn();
    const fetch = vi.fn().mockResolvedValue(resposta(401, { erro: 'Código de acesso inválido.' }));
    const http = criarCliente({ baseURL: '', obterCodigo: () => 'x', aoNaoAutorizar, fetch });
    await expect(http.get('/hoje')).rejects.toBeInstanceOf(ErroDaApi);
    expect(aoNaoAutorizar).toHaveBeenCalledOnce();
  });

  it('ao testar um código novo, o 401 não derruba a sessão', async () => {
    const aoNaoAutorizar = vi.fn();
    const fetch = vi.fn().mockResolvedValue(resposta(401, { erro: 'x' }));
    const http = criarCliente({ baseURL: '', obterCodigo: () => null, aoNaoAutorizar, fetch });
    await expect(http.get('/hoje', { codigo: 'tentativa' })).rejects.toThrow();
    expect(aoNaoAutorizar).not.toHaveBeenCalled();
  });

  it('sem rede, avisa que nada foi salvo', async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const http = criarCliente({ baseURL: '', obterCodigo: () => null, fetch });
    await expect(http.post('/atividades', {})).rejects.toMatchObject({
      status: 0,
      message: MENSAGEM_SEM_CONEXAO,
    });
  });

  it('avisa quando o servidor demora (servidor gratuito acordando)', async () => {
    vi.useFakeTimers();
    let responder;
    const fetch = vi.fn(() => new Promise((ok) => (responder = ok)));
    const aoDemorar = vi.fn();
    const http = criarCliente({ baseURL: '', obterCodigo: () => null, aoDemorar, fetch });
    const pedido = http.get('/hoje');
    await vi.advanceTimersByTimeAsync(3000);
    expect(aoDemorar).toHaveBeenLastCalledWith(true);
    responder(resposta(200, {}));
    await pedido;
    expect(aoDemorar).toHaveBeenLastCalledWith(false);
    vi.useRealTimers();
  });
});

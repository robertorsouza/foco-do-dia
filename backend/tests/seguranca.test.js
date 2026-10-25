// Correções da revisão de segurança do PR #1 (Copilot Chat, prompt P-05).
// Cada bloco corresponde a um item da revisão.
import { describe, it, expect } from 'vitest';
import { criarAmbiente } from './apoio.js';
import { configurarSsl } from '../src/db/pool.js';
import { verificarConfiguracaoDeProducao } from '../src/seguranca.js';

const AGORA = '2026-10-25T10:00:00-03:00';

describe('Item 1: TLS do banco verifica o certificado por padrão', () => {
  it('fora do localhost, verifica o certificado', () => {
    expect(configurarSsl('postgresql://u:s@dpg-123.render.com/db')).toEqual({
      rejectUnauthorized: true,
    });
  });
  it('no localhost, não usa TLS', () => {
    expect(configurarSsl('postgresql://u:s@localhost:5432/db')).toBe(false);
  });
  it('só desliga a verificação se pedido explicitamente', () => {
    expect(configurarSsl('postgresql://u:s@host/db', 'no-verify')).toEqual({
      rejectUnauthorized: false,
    });
  });
});

describe('Item 2: CORS fechado por padrão', () => {
  it('sem FRONTEND_URL, nenhum site externo recebe permissão', async () => {
    const amb = criarAmbiente({ agora: AGORA });
    const r = await amb.api().get('/api/health').set('Origin', 'https://site-malicioso.com');
    expect(r.headers['access-control-allow-origin']).toBeUndefined();
  });
  it('o domínio do frontend recebe permissão; outros não', async () => {
    const amb = criarAmbiente({
      agora: AGORA,
      origensPermitidas: 'https://foco-do-dia.vercel.app, http://localhost:5173',
    });
    const ok = await amb.api().get('/api/health').set('Origin', 'https://foco-do-dia.vercel.app');
    expect(ok.headers['access-control-allow-origin']).toBe('https://foco-do-dia.vercel.app');
    const negado = await amb.api().get('/api/health').set('Origin', 'https://outro.com');
    expect(negado.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('Item 3: código de acesso para a API publicada', () => {
  const codigo = 'codigo-secreto-123';

  it('sem o código, responde 401 e não mostra dados', async () => {
    const amb = criarAmbiente({ agora: AGORA, codigoDeAcesso: codigo });
    await amb.pronto();
    const r = await amb.api().get('/api/hoje');
    expect(r.status).toBe(401);
    expect(r.body).toEqual({ erro: 'Código de acesso inválido.' });
  });

  it('com código errado, responde 401', async () => {
    const amb = criarAmbiente({ agora: AGORA, codigoDeAcesso: codigo });
    await amb.pronto();
    const r = await amb.api().get('/api/hoje').set('Authorization', 'Bearer errado');
    expect(r.status).toBe(401);
  });

  it('com o código certo, funciona', async () => {
    const amb = criarAmbiente({ agora: AGORA, codigoDeAcesso: codigo });
    await amb.pronto();
    const r = await amb.api().get('/api/hoje').set('Authorization', `Bearer ${codigo}`);
    expect(r.status).toBe(200);
  });

  it('a verificação de saúde continua aberta (usada pelo Render)', async () => {
    const amb = criarAmbiente({ agora: AGORA, codigoDeAcesso: codigo });
    expect((await amb.api().get('/api/health')).status).toBe(200);
  });
});

describe('Produção não sobe aberta', () => {
  const base = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://x',
    FRONTEND_URL: 'https://foco-do-dia.vercel.app',
    APP_ACCESS_TOKEN: 'codigo-secreto-123',
  };
  it('aceita configuração completa', () => {
    expect(() => verificarConfiguracaoDeProducao(base)).not.toThrow();
  });
  it('recusa sem código de acesso ou sem CORS', () => {
    expect(() => verificarConfiguracaoDeProducao({ ...base, APP_ACCESS_TOKEN: '' })).toThrow(
      /APP_ACCESS_TOKEN/,
    );
    expect(() => verificarConfiguracaoDeProducao({ ...base, FRONTEND_URL: undefined })).toThrow(
      /FRONTEND_URL/,
    );
  });
  it('recusa código curto demais', () => {
    expect(() => verificarConfiguracaoDeProducao({ ...base, APP_ACCESS_TOKEN: 'curto' })).toThrow(
      /12 caracteres/,
    );
  });
  it('em desenvolvimento, não exige nada', () => {
    expect(() => verificarConfiguracaoDeProducao({ NODE_ENV: 'development' })).not.toThrow();
  });
});

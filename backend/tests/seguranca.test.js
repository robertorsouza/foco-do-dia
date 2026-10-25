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

// Auditoria de segurança complementar (testes de ataque com o servidor rodando).
describe('Auditoria: entradas malformadas não viram erro 500', () => {
  async function ambiente() {
    const amb = criarAmbiente({ agora: AGORA });
    await amb.pronto();
    return amb;
  }

  it('data que não existe no calendário responde 422', async () => {
    const amb = await ambiente();
    const r = await amb.api().get('/api/dias/2026-02-31');
    expect(r.status).toBe(422);
    expect(r.body.erro).toBe('Essa data não existe.');
  });

  it('identificador gigante responde 422', async () => {
    const amb = await ambiente();
    expect((await amb.api().delete('/api/atividades/99999999999')).status).toBe(422);
  });

  it('corpo grande demais responde 413', async () => {
    const amb = await ambiente();
    const r = await amb
      .api()
      .post('/api/atividades')
      .send({ titulo: 'a'.repeat(50_000), turno: 'manha' });
    expect(r.status).toBe(413);
  });

  it('mensagens de validação em português e acolhedoras', async () => {
    const amb = await ambiente();
    const r = await amb.api().post('/api/atividades').send({ titulo: 'x', turno: 'madrugada' });
    expect(r.body.erro).toBe('Escolha manhã, tarde ou noite.');
  });

  it('campos extras são ignorados: não dá para criar já como feita', async () => {
    const amb = await ambiente();
    const r = await amb
      .api()
      .post('/api/atividades')
      .send({ titulo: 'x', turno: 'manha', status: 'feita', id: 999 });
    expect(r.body.status).toBe('pendente');
    expect(r.body.id).not.toBe(999);
  });
});

describe('Auditoria: cabeçalhos e limites', () => {
  it('envia cabeçalhos de segurança HTTP e esconde a tecnologia', async () => {
    const amb = criarAmbiente({ agora: AGORA });
    const r = await amb.api().get('/api/health');
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['strict-transport-security']).toBeDefined();
    expect(r.headers['x-powered-by']).toBeUndefined();
  });

  it('bloqueia quem erra o código de acesso muitas vezes', async () => {
    const amb = criarAmbiente({ agora: AGORA, codigoDeAcesso: 'codigo-secreto-123' });
    for (let i = 0; i < 10; i++) {
      await amb.api().get('/api/hoje').set('Authorization', 'Bearer chute');
    }
    const r = await amb.api().get('/api/hoje').set('Authorization', 'Bearer codigo-secreto-123');
    expect(r.status).toBe(429);
    expect(r.body.erro).toMatch(/Muitas tentativas/);
  });
});

// Revisão de QA do PR #2 (Copilot Chat, prompt P-08), item 2.
describe('Limite geral de requisições', () => {
  it('uso real do frontend (alerta a cada minuto + ações) não é bloqueado', async () => {
    const amb = criarAmbiente({ agora: AGORA });
    await amb.pronto();
    // 15 min de uso intenso: 15 consultas de alerta + 60 ações e recargas.
    for (let i = 0; i < 75; i++) {
      expect((await amb.api().get('/api/alertas/agora')).status).toBe(200);
    }
  });

  it('a requisição 301 em 15 minutos recebe 429', async () => {
    const amb = criarAmbiente({ agora: AGORA });
    await amb.pronto();
    for (let i = 0; i < 300; i++) await amb.api().get('/api/fixas');
    const r = await amb.api().get('/api/fixas');
    expect(r.status).toBe(429);
    expect(r.body.erro).toMatch(/Muitas requisições/);
  }, 30_000);
});

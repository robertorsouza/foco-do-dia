// Testes das jornadas (docs/jornadas.md): o que o usuário vê, o que pode e o que não pode.
// Cada bloco cita a jornada (J1…J9) e a regra que verifica.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { abrirApp, atividade, criarApiFalsa, diaCom, relatorioVazio, HOJE } from './apoio.jsx';

const usuario = () => userEvent.setup();

beforeEach(() => {
  vi.useRealTimers();
});

describe('J1: entrar no app', () => {
  it('código errado mostra o aviso e não entra', async () => {
    const api = criarApiFalsa({
      'GET /hoje': (req) => {
        if (req.codigo !== 'certo') throw { status: 401, erro: 'Código de acesso inválido.' };
        return diaCom([]);
      },
    });
    abrirApp(api, { logado: false });
    const u = usuario();
    await u.type(screen.getByLabelText('Código de acesso'), 'errado');
    await u.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(
      await screen.findByText('Esse código não confere. Confira e tente de novo.'),
    ).toBeVisible();
    expect(localStorage.getItem('foco-do-dia:codigo')).toBeNull();
  });

  it('muitas tentativas (429) pausa a tela por 15 minutos', async () => {
    const api = criarApiFalsa({
      'GET /hoje': () => {
        throw { status: 429, erro: 'Muitas tentativas.' };
      },
    });
    abrirApp(api, { logado: false });
    const u = usuario();
    await u.type(screen.getByLabelText('Código de acesso'), 'qualquer');
    await u.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Muitas tentativas')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Tente de novo em 15 minutos' })).toBeDisabled();
  });

  it('código certo é salvo no aparelho e abre o dia', async () => {
    const api = criarApiFalsa();
    abrirApp(api, { logado: false });
    const u = usuario();
    await u.type(screen.getByLabelText('Código de acesso'), 'certo');
    await u.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('heading', { name: 'Hoje' })).toBeVisible();
    expect(localStorage.getItem('foco-do-dia:codigo')).toBe('certo');
  });

  it('se o código mudar no servidor, volta para a tela de código com explicação', async () => {
    const api = criarApiFalsa({
      'GET /hoje': () => {
        throw { status: 401, erro: 'Código de acesso inválido.' };
      },
    });
    abrirApp(api);
    expect(
      await screen.findByText('Seu código mudou. Digite o novo para continuar.'),
    ).toBeVisible();
  });
});

describe('J2 e J3: planejar e fazer', () => {
  it('estado vazio acolhe o primeiro dia', async () => {
    abrirApp(criarApiFalsa());
    expect(await screen.findByText('Seu dia está em branco.')).toBeVisible();
  });

  it('adicionar envia título, turno, urgência e a data de hoje', async () => {
    const api = criarApiFalsa({ 'POST /atividades': atividade(9, 'Pagar luz', 'tarde') });
    abrirApp(api);
    const u = usuario();
    const campo = await screen.findByLabelText('O que você precisa fazer?');
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeDisabled(); // título vazio
    await u.type(campo, 'Pagar luz');
    const form = screen.getByRole('form', { name: 'Adicionar atividade' });
    await u.click(within(form).getByRole('button', { name: 'Tarde' }));
    await u.click(within(form).getByRole('button', { name: 'Urgente' }));
    await u.click(screen.getByRole('button', { name: 'Adicionar' }));
    await waitFor(() => expect(api.feitas('POST', '/atividades')).toHaveLength(1));
    expect(api.feitas('POST', '/atividades')[0].corpo).toEqual({
      titulo: 'Pagar luz',
      turno: 'tarde',
      prioridade: 'urgente',
      data: HOJE,
    });
  });

  it('marcar como feita não pede confirmação', async () => {
    const api = criarApiFalsa({
      'GET /hoje': diaCom([atividade(1, 'Ler', 'manha')]),
      'PATCH /atividades/:id': {},
    });
    abrirApp(api);
    await usuario().click(await screen.findByRole('checkbox', { name: /Marcar como feita: Ler/ }));
    await waitFor(() =>
      expect(api.feitas('PATCH', '/atividades/1')[0].corpo).toEqual({ status: 'feita' }),
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('numa atividade feita, o menu não oferece "levar" (API não deixa mover feitas)', async () => {
    abrirApp(
      criarApiFalsa({ 'GET /hoje': diaCom([atividade(1, 'Ler', 'manha', { status: 'feita' })]) }),
    );
    await usuario().click(await screen.findByRole('button', { name: 'Ler' }));
    const menu = screen.getByRole('dialog');
    expect(within(menu).queryByText('Levar para amanhã')).toBeNull();
    expect(within(menu).getByText('Desmarcar')).toBeVisible();
  });

  it('excluir só acontece depois do "Sim, excluir"', async () => {
    const api = criarApiFalsa({
      'GET /hoje': diaCom([atividade(1, 'Mercado', 'tarde')]),
      'DELETE /atividades/:id': null,
    });
    abrirApp(api);
    const u = usuario();
    await u.click(await screen.findByRole('button', { name: 'Mercado' }));
    await u.click(screen.getByRole('button', { name: /^Excluir/ }));
    expect(screen.getByRole('dialog', { name: 'Excluir "Mercado"?' })).toBeVisible();
    expect(api.feitas('DELETE', '/atividades')).toHaveLength(0);
    await u.click(screen.getByRole('button', { name: 'Sim, excluir' }));
    await waitFor(() => expect(api.feitas('DELETE', '/atividades/1')).toHaveLength(1));
  });

  it('"Cancelar" não exclui', async () => {
    const api = criarApiFalsa({ 'GET /hoje': diaCom([atividade(1, 'Mercado', 'tarde')]) });
    abrirApp(api);
    const u = usuario();
    await u.click(await screen.findByRole('button', { name: 'Mercado' }));
    await u.click(screen.getByRole('button', { name: /^Excluir/ }));
    await u.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(api.feitas('DELETE', '/atividades')).toHaveLength(0);
  });

  it('levar para amanhã move e avisa para onde foi', async () => {
    const api = criarApiFalsa({
      'GET /hoje': diaCom([atividade(1, 'Mercado', 'tarde')]),
      'POST /atividades/:id/mover': {},
    });
    abrirApp(api);
    const u = usuario();
    await u.click(await screen.findByRole('button', { name: 'Mercado' }));
    await u.click(screen.getByRole('button', { name: /Levar para amanhã/ }));
    expect(await screen.findByText('Foi para amanhã à tarde.')).toBeVisible();
    expect(api.feitas('POST', '/atividades/1/mover')[0].corpo).toEqual({ destino: 'amanha' });
  });

  it('quando a API recusa, mostra a mensagem dela (a regra mora no backend)', async () => {
    const api = criarApiFalsa({
      'GET /hoje': diaCom([atividade(1, 'Mercado', 'tarde')]),
      'POST /atividades/:id/mover': () => {
        throw { status: 409, erro: 'Essa atividade já foi resolvida. Atualize a tela.' };
      },
    });
    abrirApp(api);
    const u = usuario();
    await u.click(await screen.findByRole('button', { name: 'Mercado' }));
    await u.click(screen.getByRole('button', { name: /Levar para o próximo turno/ }));
    expect(
      await screen.findByText('Essa atividade já foi resolvida. Atualize a tela.'),
    ).toBeVisible();
  });

  it('título com HTML aparece como texto, nunca como HTML (XSS)', async () => {
    const titulo = '<img src=x onerror="alert(1)">';
    abrirApp(criarApiFalsa({ 'GET /hoje': diaCom([atividade(1, titulo, 'manha')]) }));
    expect(await screen.findByRole('button', { name: titulo })).toBeVisible();
    expect(document.querySelector('img')).toBeNull();
  });
});

describe('J4: alerta de fim de turno', () => {
  const comAlerta = () =>
    criarApiFalsa({
      'GET /hoje': diaCom([atividade(1, 'Pagar luz', 'manha', { prioridade: 'urgente' })]),
      'GET /alertas/agora': {
        data: HOJE,
        alertar: true,
        turno: 'manha',
        mensagem: 'A manhã está acabando. Falta 1. Já fez?',
        pendencias: [atividade(1, 'Pagar luz', 'manha', { prioridade: 'urgente' })],
      },
      'POST /atividades/:id/mover': {},
    });

  it('mostra a frase do backend com as pendências', async () => {
    abrirApp(comAlerta());
    const alerta = await screen.findByRole('dialog', {
      name: 'A manhã está acabando. Falta 1. Já fez?',
    });
    expect(within(alerta).getByText('Pagar luz')).toBeVisible();
  });

  it('"Agora não" fecha e não volta a perguntar no mesmo turno', async () => {
    const api = comAlerta();
    const { unmount } = abrirApp(api);
    await usuario().click(await screen.findByRole('button', { name: 'Agora não' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    unmount();
    abrirApp(api);
    await screen.findByRole('heading', { name: 'Hoje' });
    await waitFor(() => expect(api.feitas('GET', '/alertas/agora').length).toBeGreaterThan(1));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('"Levar para a tarde" move as pendências para o próximo turno', async () => {
    const api = comAlerta();
    abrirApp(api);
    await usuario().click(await screen.findByRole('button', { name: 'Levar para a tarde' }));
    await waitFor(() =>
      expect(api.feitas('POST', '/atividades/1/mover')[0].corpo).toEqual({
        destino: 'proximo_turno',
      }),
    );
  });
});

describe('J5: fechar o dia', () => {
  const sugestoes = [
    {
      atividade: atividade(1, 'Revisar', 'tarde', { prioridade: 'urgente' }),
      sugestao: { destino: 'amanha', data: '2026-10-26', turno: 'manha' },
    },
    {
      atividade: atividade(2, 'Ler', 'noite'),
      sugestao: { destino: 'amanha', data: '2026-10-26', turno: 'noite' },
    },
  ];
  const criar = () =>
    criarApiFalsa({
      'GET /hoje': diaCom([atividade(1, 'Revisar', 'tarde'), atividade(2, 'Ler', 'noite')]),
      'GET /dias/:data/sugestoes-fechamento': sugestoes,
      'POST /dias/:data/fechar': { movidas: 1, deixadas_de_lado: 0, em_aberto: 1 },
    });

  it('RN-07: "próximo turno" só aparece para a noite', async () => {
    abrirApp(criar(), { rota: '/fechar' });
    const revisar = await screen.findByRole('group', { name: 'Destino de Revisar' });
    const ler = screen.getByRole('group', { name: 'Destino de Ler' });
    expect(within(revisar).queryByText('Próximo turno')).toBeNull();
    expect(within(ler).getByText('Próximo turno')).toBeVisible();
  });

  it('pergunta antes de fechar e envia os destinos; "em aberto" vai sem destino', async () => {
    const api = criar();
    abrirApp(api, { rota: '/fechar' });
    const u = usuario();
    const ler = await screen.findByRole('group', { name: 'Destino de Ler' });
    await u.click(within(ler).getByRole('button', { name: 'Em aberto' }));
    await u.click(screen.getByRole('button', { name: 'Fechar o dia' }));
    expect(screen.getByRole('dialog', { name: 'Fechar o dia?' })).toBeVisible();
    expect(api.feitas('POST', '/dias')).toHaveLength(0);
    await u.click(screen.getByRole('button', { name: 'Sim, fechar' }));
    await waitFor(() => expect(api.feitas('POST', `/dias/${HOJE}/fechar`)).toHaveLength(1));
    expect(api.feitas('POST', `/dias/${HOJE}/fechar`)[0].corpo).toEqual({
      destinos: [{ id: 1, destino: 'amanha', turno: 'manha' }],
    });
  });

  it('"Agora não" volta para Hoje sem fechar', async () => {
    const api = criar();
    abrirApp(api, { rota: '/fechar' });
    await usuario().click(await screen.findByRole('button', { name: 'Agora não' }));
    expect(window.location.hash).toBe('#/hoje');
    expect(api.feitas('POST', '/dias')).toHaveLength(0);
  });

  it('explica com calma o que acontece se não fechar', async () => {
    abrirApp(criar(), { rota: '/fechar' });
    expect(await screen.findByText(/Se preferir não fechar, fique tranquilo/)).toBeVisible();
  });
});

describe('J6: atividades pendentes', () => {
  const pend = (id, titulo, data) => ({
    ...atividade(id, titulo, 'tarde', { status: 'em_aberto', data }),
    pendente_desde: data,
    dias_pendente: 2,
  });

  it('mostra 3 de início e o resto a um toque', async () => {
    abrirApp(
      criarApiFalsa({
        'GET /pendencias': [1, 2, 3, 4, 5].map((i) => pend(i, `Pendência ${i}`, '2026-10-23')),
      }),
    );
    expect(await screen.findByText('Pendência 3')).toBeVisible();
    expect(screen.queryByText('Pendência 4')).toBeNull();
    await usuario().click(screen.getByRole('button', { name: 'Ver mais 2 pendências' }));
    expect(screen.getByText('Pendência 5')).toBeVisible();
  });

  it('trazer para hoje pergunta o turno e move para a data de hoje', async () => {
    const api = criarApiFalsa({
      'GET /pendencias': [pend(7, 'Dentista', '2026-10-24')],
      'POST /atividades/:id/mover': {},
    });
    abrirApp(api);
    const u = usuario();
    expect(await screen.findByText('Em aberto desde ontem')).toBeVisible();
    await u.click(screen.getByRole('button', { name: 'Trazer para hoje' }));
    const popup = screen.getByRole('dialog', { name: 'Em qual turno?' });
    await u.click(within(popup).getByRole('button', { name: 'Noite' }));
    await u.click(within(popup).getByRole('button', { name: 'Trazer para hoje' }));
    await waitFor(() =>
      expect(api.feitas('POST', '/atividades/7/mover')[0].corpo).toEqual({
        destino: 'data',
        data: HOJE,
        turno: 'noite',
      }),
    );
  });
});

describe('J7: dias passados são só consulta', () => {
  it('mostra o histórico e explica por que não dá para mudar', async () => {
    const relatorio = relatorioVazio({
      contagem: { feitas: 1, total: 2, percentual: 50 },
      por_turno: {
        manha: { feitas: [atividade(1, 'Estudar', 'manha', { status: 'feita' })], nao_feitas: [] },
        tarde: {
          feitas: [],
          nao_feitas: [atividade(2, 'Banco', 'tarde', { status: 'deixada_de_lado' })],
        },
        noite: { feitas: [], nao_feitas: [] },
      },
    });
    abrirApp(criarApiFalsa({ 'GET /relatorios/diario/:data': relatorio }), {
      rota: '/dia/2026-10-24',
    });
    expect(await screen.findByRole('heading', { name: 'Ontem' })).toBeVisible();
    expect(screen.getByText('deixada de lado')).toBeVisible();
    expect(screen.queryByRole('checkbox')).toBeNull();
    await usuario().click(screen.getByRole('button', { name: /Banco/ }));
    expect(screen.getByRole('dialog', { name: 'Essa já faz parte do histórico' })).toBeVisible();
  });
});

describe('J8: relatórios', () => {
  it('sem IA, usa a mensagem padrão do backend e a tela não quebra', async () => {
    abrirApp(
      criarApiFalsa({
        'GET /relatorios/diario/:data': relatorioVazio({
          contagem: { feitas: 4, total: 7, percentual: 57 },
          mensagem: 'Você concluiu 4 de 7 hoje. Cada uma conta.',
        }),
      }),
      { rota: '/relatorio' },
    );
    expect(await screen.findByText('Você concluiu 4 de 7 hoje. Cada uma conta.')).toBeVisible();
  });

  it('tornar fixa pede confirmação e só então cria a fixa', async () => {
    const api = criarApiFalsa({
      'GET /relatorios/diario/:data': relatorioVazio({
        sugestoes_fixas: [{ titulo: 'Ler', turno: 'noite', dias: 3 }],
      }),
      'POST /fixas': { id: 1 },
    });
    abrirApp(api, { rota: '/relatorio' });
    const u = usuario();
    await u.click(await screen.findByRole('button', { name: 'Tornar fixa' }));
    expect(screen.getByRole('dialog', { name: 'Tornar "Ler" fixa?' })).toBeVisible();
    expect(api.feitas('POST', '/fixas')).toHaveLength(0);
    await u.click(screen.getByRole('button', { name: 'Sim, tornar fixa' }));
    await waitFor(() =>
      expect(api.feitas('POST', '/fixas')[0].corpo).toEqual({ titulo: 'Ler', turno: 'noite' }),
    );
  });

  it('a semana pede os últimos 7 dias até hoje', async () => {
    const dias = Array.from({ length: 7 }, (_, i) => ({
      data: `2026-10-${19 + i}`,
      feitas: 1,
      total: 2,
      percentual: 50,
    }));
    const api = criarApiFalsa({
      'GET /relatorios/semanal': { inicio: '2026-10-19', fim: HOJE, dias, pendencias: [] },
    });
    abrirApp(api, { rota: '/semana' });
    expect(await screen.findByRole('heading', { name: 'Sua semana' })).toBeVisible();
    expect(await screen.findByText('7 de 14')).toBeVisible();
    expect(api.feitas('GET', '/relatorios/semanal')[0].caminho).toBe(
      '/relatorios/semanal?inicio=2026-10-19',
    );
  });
});

describe('J9: fixas', () => {
  it('mostra a chamada para a próxima versão', async () => {
    abrirApp(criarApiFalsa(), { rota: '/fixas' });
    expect(await screen.findByText('PRÓXIMA VERSÃO')).toBeVisible();
  });
});

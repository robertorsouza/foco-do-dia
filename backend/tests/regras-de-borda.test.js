// Revisão completa do backend (25/10): cenários de borda nas regras de negócio.
// Escritos antes da correção (TDD red): cada teste prova um bug encontrado na revisão.
import { describe, it, expect, beforeEach } from 'vitest';
import { criarAmbiente } from './apoio.js';

const HOJE = '2026-10-25';
let amb;
const api = () => amb.api();
const criar = (d) => api().post('/api/atividades').send(d);

beforeEach(async () => {
  amb = criarAmbiente({ agora: `${HOJE}T10:00:00-03:00` });
  await amb.pronto();
});

describe('Bug 1: atividade adicionada depois de fechar o dia ficava presa', () => {
  it('adicionar atividade em um dia já fechado reabre o dia', async () => {
    const { body: feita } = await criar({ titulo: 'Já feita', turno: 'manha' });
    await api().patch(`/api/atividades/${feita.id}`).send({ status: 'feita' });
    expect((await api().post(`/api/dias/${HOJE}/fechar`).send({})).status).toBe(200);
    await criar({ titulo: 'Lembrei depois', turno: 'noite' });

    const dia = await api().get('/api/hoje');
    expect(dia.body.fechado).toBe(false);

    // No dia seguinte, o fechamento automático leva a pendência para a seção certa.
    amb.irPara('2026-10-26T08:00:00-03:00');
    const pend = await api().get('/api/pendencias');
    expect(pend.body.map((p) => p.titulo)).toEqual(['Lembrei depois']);
  });

  it('mover uma pendência para um dia já fechado também reabre esse dia', async () => {
    const { body: a } = await criar({ titulo: 'Na seção', turno: 'manha' });
    await api().post(`/api/dias/${HOJE}/fechar`).send({}); // vira "em aberto"
    await api().post(`/api/atividades/${a.id}/mover`).send({ destino: 'data', data: HOJE });
    expect((await api().get('/api/hoje')).body.fechado).toBe(false);
  });
});

describe('Bug 2: editar atividade de um dia passado e fechado criava pendência presa', () => {
  it('não deixa desmarcar como feita uma atividade de dia passado já fechado', async () => {
    const { body: a } = await criar({ titulo: 'Feita ontem', turno: 'manha' });
    await api().patch(`/api/atividades/${a.id}`).send({ status: 'feita' });
    amb.irPara('2026-10-26T08:00:00-03:00');
    await api().get('/api/hoje'); // fecha o dia 25 automaticamente

    const r = await api().patch(`/api/atividades/${a.id}`).send({ status: 'pendente' });
    expect(r.status).toBe(409);
  });
});

describe('Bug 3: "próximo turno" a partir da seção de pendências ia para o passado', () => {
  it('recusa "próximo turno" para atividade em aberto e orienta a escolher outro destino', async () => {
    const { body: a } = await criar({ titulo: 'Antiga', turno: 'manha' });
    await api().post(`/api/dias/${HOJE}/fechar`).send({});
    amb.irPara('2026-10-28T08:00:00-03:00');

    const r = await api().post(`/api/atividades/${a.id}/mover`).send({ destino: 'proximo_turno' });
    expect(r.status).toBe(422);
    expect(r.body.erro).toMatch(/amanhã ou outra data/);
  });
});

describe('Bug 4: fechamento automático simultâneo devolvia erro ao usuário', () => {
  it('duas requisições ao mesmo tempo na virada do dia não falham', async () => {
    await criar({ titulo: 'A', turno: 'noite' });
    amb.irPara('2026-10-26T00:01:00-03:00');
    const [r1, r2] = await Promise.all([api().get('/api/hoje'), api().get('/api/hoje')]);
    expect([r1.status, r2.status]).toEqual([200, 200]);
    expect((await api().get('/api/pendencias')).body).toHaveLength(1);
  });
});

describe('Bug 5: datas fora do lugar', () => {
  it('não cria atividade em data passada', async () => {
    const r = await criar({ titulo: 'Passado', turno: 'manha', data: '2026-10-20' });
    expect(r.status).toBe(422);
  });

  it('não fecha um dia futuro', async () => {
    await criar({ titulo: 'Amanhã', turno: 'manha', data: '2026-10-26' });
    const r = await api().post('/api/dias/2026-10-26/fechar').send({});
    expect(r.status).toBe(422);
  });
});

// HU-05 (revisão do autor, 25/10): mover não pede confirmação, então precisa dar
// para desfazer logo em seguida, sem sujar o histórico. Testes escritos antes (TDD red).
import { describe, it, expect, beforeEach } from 'vitest';
import { criarAmbiente } from './apoio.js';

const HOJE = '2026-10-25';
const AMANHA = '2026-10-26';
let amb;
const api = () => amb.api();
const criar = (d) => api().post('/api/atividades').send(d);
const mover = (id, d) => api().post(`/api/atividades/${id}/mover`).send(d);
const desfazer = (id) => api().post(`/api/atividades/${id}/desfazer-movimento`);

beforeEach(async () => {
  amb = criarAmbiente({ agora: `${HOJE}T10:00:00-03:00` });
  await amb.pronto();
});

describe('desfazer um movimento', () => {
  it('volta a atividade para o turno de origem e apaga a cópia', async () => {
    const { body: a } = await criar({ titulo: 'Mercado', turno: 'tarde' });
    const { body: copia } = await mover(a.id, { destino: 'amanha' });

    const r = await desfazer(copia.id);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ id: a.id, status: 'pendente', turno: 'tarde', data: HOJE });

    const hoje = await api().get('/api/hoje');
    expect(hoje.body.turnos.tarde.map((x) => x.titulo)).toEqual(['Mercado']);
    const amanha = await api().get(`/api/dias/${AMANHA}`);
    expect(amanha.body.turnos.tarde).toHaveLength(0);
  });

  it('não deixa rastro no relatório: conta uma vez, como pendente', async () => {
    const { body: a } = await criar({ titulo: 'Ler', turno: 'manha' });
    const { body: copia } = await mover(a.id, { destino: 'proximo_turno' });
    await desfazer(copia.id);
    const rel = await api().get(`/api/relatorios/diario/${HOJE}`);
    expect(rel.body.contagem.total).toBe(1);
  });

  it('recusa se a cópia já foi feita (a pessoa seguiu em frente)', async () => {
    const { body: a } = await criar({ titulo: 'Ler', turno: 'manha' });
    const { body: copia } = await mover(a.id, { destino: 'proximo_turno' });
    await api().patch(`/api/atividades/${copia.id}`).send({ status: 'feita' });
    const r = await desfazer(copia.id);
    expect(r.status).toBe(409);
    expect(r.body.erro).toBe('Não dá mais para desfazer esse movimento.');
  });

  it('recusa numa atividade que não veio de um movimento', async () => {
    const { body: a } = await criar({ titulo: 'Ler', turno: 'manha' });
    expect((await desfazer(a.id)).status).toBe(409);
  });

  it('recusa desfazer duas vezes', async () => {
    const { body: a } = await criar({ titulo: 'Ler', turno: 'manha' });
    const { body: copia } = await mover(a.id, { destino: 'amanha' });
    await desfazer(copia.id);
    expect((await desfazer(copia.id)).status).toBe(404);
  });

  it('recusa se a origem é de um dia que já passou (RN-13)', async () => {
    const { body: a } = await criar({ titulo: 'Ler', turno: 'noite' });
    const { body: copia } = await mover(a.id, { destino: 'amanha' });
    amb.irPara(`${AMANHA}T08:00:00-03:00`);
    expect((await desfazer(copia.id)).status).toBe(409);
  });

  it('id inválido é recusado com 422', async () => {
    expect((await desfazer('abc')).status).toBe(422);
  });
});

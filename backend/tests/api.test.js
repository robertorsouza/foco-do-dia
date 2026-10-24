// Testes de integração da API: requisição HTTP → rotas → serviços → banco.
// Cada bloco cita a história de usuário (HU) ou regra (RN) que verifica.
import { describe, it, expect, beforeEach } from 'vitest';
import { criarAmbiente } from './apoio.js';

const HOJE = '2026-10-24';
let amb;
let api;

beforeEach(async () => {
  amb = criarAmbiente({ agora: `${HOJE}T09:00:00-03:00` });
  await amb.pronto();
  api = amb.api;
});

const criar = (dados) => api().post('/api/atividades').send(dados);

describe('saúde da API', () => {
  it('responde ok', async () => {
    const r = await api().get('/api/health');
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ status: 'ok' });
  });
});

describe('HU-01: adicionar atividade', () => {
  it('cria no turno escolhido, pendente e normal', async () => {
    const r = await criar({ titulo: 'Pagar boleto', turno: 'manha' });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({
      titulo: 'Pagar boleto',
      turno: 'manha',
      status: 'pendente',
      prioridade: 'normal',
      data: HOJE,
    });
  });

  it('recusa título vazio com mensagem curta e não salva nada', async () => {
    const r = await criar({ titulo: '   ', turno: 'manha' });
    expect(r.status).toBe(422);
    expect(r.body.erro).toBe('Dê um título para a atividade.');
    const dia = await api().get('/api/hoje');
    expect(dia.body.progresso.dia.total).toBe(0);
  });

  it('RN-02: recusa título com mais de 80 caracteres', async () => {
    const r = await criar({ titulo: 'x'.repeat(81), turno: 'tarde' });
    expect(r.status).toBe(422);
  });

  it('RN-01: recusa turno inexistente', async () => {
    expect((await criar({ titulo: 'Teste', turno: 'madrugada' })).status).toBe(422);
  });

  it('RN-10: urgente aparece no topo do turno', async () => {
    await criar({ titulo: 'Normal', turno: 'manha' });
    await criar({ titulo: 'Urgente', turno: 'manha', prioridade: 'urgente' });
    const dia = await api().get('/api/hoje');
    expect(dia.body.turnos.manha.map((a) => a.titulo)).toEqual(['Urgente', 'Normal']);
  });

  it('segurança: título com SQL é guardado como texto, sem executar nada', async () => {
    const titulo = "'); DROP TABLE atividades; --";
    const r = await criar({ titulo, turno: 'manha' });
    expect(r.status).toBe(201);
    const dia = await api().get('/api/hoje');
    expect(dia.body.turnos.manha[0].titulo).toBe(titulo);
  });
});

describe('HU-02: concluir atividade', () => {
  it('marca como feita e atualiza o progresso; tocar de novo volta a pendente', async () => {
    const { body: a } = await criar({ titulo: 'Tomar café', turno: 'manha' });
    await criar({ titulo: 'Ler', turno: 'manha' });

    await api().patch(`/api/atividades/${a.id}`).send({ status: 'feita' });
    let dia = await api().get('/api/hoje');
    expect(dia.body.progresso.manha).toEqual({ feitas: 1, total: 2 });

    await api().patch(`/api/atividades/${a.id}`).send({ status: 'pendente' });
    dia = await api().get('/api/hoje');
    expect(dia.body.progresso.manha).toEqual({ feitas: 0, total: 2 });
  });
});

describe('HU-03: editar e excluir', () => {
  it('edita título, turno e prioridade', async () => {
    const { body: a } = await criar({ titulo: 'Rascunho', turno: 'manha' });
    const r = await api()
      .patch(`/api/atividades/${a.id}`)
      .send({ titulo: 'Final', turno: 'noite', prioridade: 'urgente' });
    expect(r.body).toMatchObject({ titulo: 'Final', turno: 'noite', prioridade: 'urgente' });
  });

  it('exclui e some do dia', async () => {
    const { body: a } = await criar({ titulo: 'Apagar', turno: 'tarde' });
    expect((await api().delete(`/api/atividades/${a.id}`)).status).toBe(204);
    const dia = await api().get('/api/hoje');
    expect(dia.body.turnos.tarde).toHaveLength(0);
  });

  it('responde 404 para atividade inexistente', async () => {
    expect((await api().delete('/api/atividades/999')).status).toBe(404);
  });
});

describe('HU-04: alerta de troca de turno', () => {
  it('às 11h45 com pendências na manhã, alerta com urgente primeiro', async () => {
    await criar({ titulo: 'Normal', turno: 'manha' });
    await criar({ titulo: 'Urgente', turno: 'manha', prioridade: 'urgente' });
    amb.irPara(`${HOJE}T11:45:00-03:00`);
    const r = await api().get('/api/alertas/agora');
    expect(r.body.alertar).toBe(true);
    expect(r.body.mensagem).toBe('A manhã está acabando. Faltam 2. Já fez alguma?');
    expect(r.body.pendencias[0].titulo).toBe('Urgente');
  });

  it('às 11h45 sem pendências na manhã, não alerta', async () => {
    await criar({ titulo: 'Só à tarde', turno: 'tarde' });
    amb.irPara(`${HOJE}T11:45:00-03:00`);
    expect((await api().get('/api/alertas/agora')).body.alertar).toBe(false);
  });
});

describe('HU-05: mover para o próximo turno', () => {
  it('manhã → tarde, mantendo a prioridade; a original sai dos turnos', async () => {
    const { body: a } = await criar({ titulo: 'Ligar', turno: 'manha', prioridade: 'urgente' });
    const r = await api().post(`/api/atividades/${a.id}/mover`).send({ destino: 'proximo_turno' });
    expect(r.body).toMatchObject({
      turno: 'tarde',
      data: HOJE,
      prioridade: 'urgente',
      origem_id: a.id,
    });
    const dia = await api().get('/api/hoje');
    expect(dia.body.turnos.manha).toHaveLength(0);
    expect(dia.body.turnos.tarde).toHaveLength(1);
  });

  it('noite → manhã de amanhã', async () => {
    const { body: a } = await criar({ titulo: 'Ler', turno: 'noite' });
    const r = await api().post(`/api/atividades/${a.id}/mover`).send({ destino: 'proximo_turno' });
    expect(r.body).toMatchObject({ turno: 'manha', data: '2026-10-25' });
  });

  it('não move atividade já feita', async () => {
    const { body: a } = await criar({ titulo: 'Feito', turno: 'manha' });
    await api().patch(`/api/atividades/${a.id}`).send({ status: 'feita' });
    expect(
      (await api().post(`/api/atividades/${a.id}/mover`).send({ destino: 'amanha' })).status,
    ).toBe(409);
  });

  it('não move para data passada', async () => {
    const { body: a } = await criar({ titulo: 'X', turno: 'manha' });
    const r = await api()
      .post(`/api/atividades/${a.id}/mover`)
      .send({ destino: 'data', data: '2026-10-01' });
    expect(r.status).toBe(422);
  });
});

describe('HU-06: fechar o dia com ajuda, sem bloqueio', () => {
  it('sugere destino: urgente → amanhã de manhã, normal → mesmo turno', async () => {
    await criar({ titulo: 'Normal', turno: 'tarde' });
    await criar({ titulo: 'Urgente', turno: 'noite', prioridade: 'urgente' });
    const r = await api().get(`/api/dias/${HOJE}/sugestoes-fechamento`);
    expect(r.body[0].atividade.titulo).toBe('Urgente');
    expect(r.body[0].sugestao).toEqual({ destino: 'amanha', data: '2026-10-25', turno: 'manha' });
    expect(r.body[1].sugestao.turno).toBe('tarde');
  });

  it('aplica os destinos escolhidos e manda o resto para "em aberto" (RN-07)', async () => {
    const { body: a } = await criar({ titulo: 'Vai para amanhã', turno: 'manha' });
    const { body: b } = await criar({ titulo: 'Deixo de lado', turno: 'manha' });
    await criar({ titulo: 'Decido depois', turno: 'tarde' });

    const r = await api()
      .post(`/api/dias/${HOJE}/fechar`)
      .send({
        destinos: [
          { id: a.id, destino: 'amanha' },
          { id: b.id, destino: 'deixar_de_lado' },
        ],
      });
    expect(r.body).toEqual({ movidas: 1, deixadas_de_lado: 1, em_aberto: 1 });

    const pend = await api().get('/api/pendencias');
    expect(pend.body.map((p) => p.titulo)).toEqual(['Decido depois']);

    const amanha = await api().get('/api/dias/2026-10-25');
    expect(amanha.body.turnos.manha.map((x) => x.titulo)).toEqual(['Vai para amanhã']);
  });

  it('fechar sem escolher nada também funciona: nunca bloqueia', async () => {
    await criar({ titulo: 'A', turno: 'manha' });
    const r = await api().post(`/api/dias/${HOJE}/fechar`).send({});
    expect(r.status).toBe(200);
    expect(r.body.em_aberto).toBe(1);
  });

  it('não fecha o mesmo dia duas vezes', async () => {
    await criar({ titulo: 'A', turno: 'manha' });
    await api().post(`/api/dias/${HOJE}/fechar`).send({});
    expect((await api().post(`/api/dias/${HOJE}/fechar`).send({})).status).toBe(409);
  });

  it('fechamento automático: no dia seguinte, o dia anterior fecha sozinho', async () => {
    await criar({ titulo: 'Esquecida', turno: 'noite' });
    amb.irPara('2026-10-25T08:00:00-03:00');

    const hoje = await api().get('/api/hoje');
    expect(hoje.body.data).toBe('2026-10-25');
    expect(hoje.body.progresso.dia.total).toBe(0); // turnos começam limpos (RN-12)

    const ontem = await api().get(`/api/dias/${HOJE}`);
    expect(ontem.body.fechado).toBe(true);
    const pend = await api().get('/api/pendencias');
    expect(pend.body[0]).toMatchObject({ titulo: 'Esquecida', dias_pendente: 1 });
  });
});

describe('HU-11: seção "Atividades pendentes"', () => {
  it('dar destino tira da seção e leva para o dia escolhido', async () => {
    const { body: a } = await criar({ titulo: 'Pendente', turno: 'tarde' });
    await api().post(`/api/dias/${HOJE}/fechar`).send({});
    amb.irPara('2026-10-27T10:00:00-03:00');

    const r = await api().post(`/api/atividades/${a.id}/mover`).send({ destino: 'amanha' });
    expect(r.body).toMatchObject({ data: '2026-10-28', turno: 'tarde' });
    expect((await api().get('/api/pendencias')).body).toHaveLength(0);
  });

  it('relatório semanal mostra % por dia e o bloco de pendências', async () => {
    const { body: a } = await criar({ titulo: 'Feita', turno: 'manha' });
    await criar({ titulo: 'Não feita', turno: 'tarde', prioridade: 'urgente' });
    await api().patch(`/api/atividades/${a.id}`).send({ status: 'feita' });
    await api().post(`/api/dias/${HOJE}/fechar`).send({});

    const r = await api().get('/api/relatorios/semanal?inicio=2026-10-19');
    const sabado = r.body.dias.find((d) => d.data === HOJE);
    expect(sabado).toMatchObject({ feitas: 1, total: 2, percentual: 50 });
    expect(r.body.pendencias.map((p) => p.titulo)).toEqual(['Não feita']);
  });
});

describe('HU-09: atividades fixas', () => {
  it('uma fixa aparece sozinha nos próximos dias', async () => {
    await api().post('/api/fixas').send({ titulo: 'Tomar remédio', turno: 'manha' });
    const amanha = await api().get('/api/dias/2026-10-25');
    expect(amanha.body.turnos.manha.map((a) => a.titulo)).toEqual(['Tomar remédio']);
  });
});

// Testes escritos antes da implementação (TDD: Red → Green → Refactor).
// Cada teste cita a regra de negócio (RN) ou história (HU) que verifica.
import { describe, it, expect } from 'vitest';
import {
  turnoDoMinuto,
  deveAlertar,
  ordenarPorPrioridade,
  proximoTurno,
  destinoSugerido,
  mensagemDoAlerta,
} from '../src/services/turnos.js';
import { dataLocal, minutosLocal, somarDias } from '../src/services/datas.js';

const hora = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const atividade = (turno, extras = {}) => ({
  id: Math.floor(Math.random() * 1e6),
  titulo: 'Atividade',
  turno,
  prioridade: 'normal',
  status: 'pendente',
  ...extras,
});

describe('RN-03: em que turno estamos', () => {
  it('antes de 12h é manhã', () => {
    expect(turnoDoMinuto(hora('00:00'))).toBe('manha');
    expect(turnoDoMinuto(hora('11:59'))).toBe('manha');
  });
  it('de 12h a 17h59 é tarde', () => {
    expect(turnoDoMinuto(hora('12:00'))).toBe('tarde');
    expect(turnoDoMinuto(hora('17:59'))).toBe('tarde');
  });
  it('a partir de 18h é noite', () => {
    expect(turnoDoMinuto(hora('18:00'))).toBe('noite');
    expect(turnoDoMinuto(hora('23:59'))).toBe('noite');
  });
});

describe('HU-04 / RN-04: alerta de troca de turno', () => {
  it('alerta às 11h45 com pendências na manhã', () => {
    const r = deveAlertar(hora('11:45'), [atividade('manha'), atividade('manha')]);
    expect(r.alertar).toBe(true);
    expect(r.turno).toBe('manha');
    expect(r.pendencias).toHaveLength(2);
  });

  it('não alerta às 11h45 sem pendências na manhã', () => {
    const r = deveAlertar(hora('11:45'), [atividade('manha', { status: 'feita' })]);
    expect(r.alertar).toBe(false);
  });

  it('não alerta às 11h44 (fora da janela de 15 minutos)', () => {
    expect(deveAlertar(hora('11:44'), [atividade('manha')]).alertar).toBe(false);
  });

  it('não alerta às 12h00 pela manhã (o turno já virou)', () => {
    const r = deveAlertar(hora('12:00'), [atividade('manha')]);
    expect(r.alertar).toBe(false);
  });

  it('considera só as pendências do turno que está acabando', () => {
    const r = deveAlertar(hora('17:50'), [atividade('manha'), atividade('tarde')]);
    expect(r.turno).toBe('tarde');
    expect(r.pendencias).toHaveLength(1);
  });

  it('alerta às 22h45 para a noite', () => {
    expect(deveAlertar(hora('22:45'), [atividade('noite')]).alertar).toBe(true);
  });

  it('RN-10: cita as urgentes primeiro', () => {
    const r = deveAlertar(hora('11:50'), [
      atividade('manha', { titulo: 'Normal' }),
      atividade('manha', { titulo: 'Urgente', prioridade: 'urgente' }),
    ]);
    expect(r.pendencias[0].titulo).toBe('Urgente');
  });
});

describe('HU-04: texto do alerta, acolhedor e curto', () => {
  it('usa o plural com mais de uma pendência', () => {
    expect(mensagemDoAlerta('manha', 2)).toBe('A manhã está acabando. Faltam 2. Já fez alguma?');
  });
  it('usa o singular com uma pendência', () => {
    expect(mensagemDoAlerta('tarde', 1)).toBe('A tarde está acabando. Falta 1. Já fez?');
  });
  it('RNF-01: tem no máximo 15 palavras', () => {
    expect(mensagemDoAlerta('noite', 9).split(' ').length).toBeLessThanOrEqual(15);
  });
});

describe('RN-10: ordenação por prioridade', () => {
  it('coloca urgentes no topo e mantém a ordem original entre iguais', () => {
    const lista = [
      atividade('manha', { titulo: 'A' }),
      atividade('manha', { titulo: 'B', prioridade: 'urgente' }),
      atividade('manha', { titulo: 'C' }),
      atividade('manha', { titulo: 'D', prioridade: 'urgente' }),
    ];
    expect(ordenarPorPrioridade(lista).map((a) => a.titulo)).toEqual(['B', 'D', 'A', 'C']);
  });
  it('não altera a lista original', () => {
    const lista = [atividade('manha'), atividade('manha', { prioridade: 'urgente' })];
    ordenarPorPrioridade(lista);
    expect(lista[0].prioridade).toBe('normal');
  });
});

describe('HU-05: próximo turno', () => {
  it('manhã → tarde no mesmo dia', () => {
    expect(proximoTurno('manha', '2026-10-24')).toEqual({ turno: 'tarde', data: '2026-10-24' });
  });
  it('tarde → noite no mesmo dia', () => {
    expect(proximoTurno('tarde', '2026-10-24')).toEqual({ turno: 'noite', data: '2026-10-24' });
  });
  it('noite → manhã do dia seguinte', () => {
    expect(proximoTurno('noite', '2026-10-31')).toEqual({ turno: 'manha', data: '2026-11-01' });
  });
});

describe('RN-11: destino sugerido ao fechar o dia', () => {
  it('urgente vai para amanhã de manhã', () => {
    const d = destinoSugerido(atividade('noite', { prioridade: 'urgente' }), '2026-10-24');
    expect(d).toEqual({ destino: 'amanha', data: '2026-10-25', turno: 'manha' });
  });
  it('normal vai para amanhã, no mesmo turno', () => {
    const d = destinoSugerido(atividade('tarde'), '2026-10-24');
    expect(d).toEqual({ destino: 'amanha', data: '2026-10-25', turno: 'tarde' });
  });
});

describe('datas no fuso do usuário', () => {
  // 24/10/2026 às 02:30 UTC = 23/10/2026 às 23:30 em São Paulo (UTC-3)
  const agora = new Date('2026-10-24T02:30:00Z');
  it('calcula a data local', () => {
    expect(dataLocal(agora, 'America/Sao_Paulo')).toBe('2026-10-23');
  });
  it('calcula os minutos locais desde a meia-noite', () => {
    expect(minutosLocal(agora, 'America/Sao_Paulo')).toBe(23 * 60 + 30);
  });
  it('soma dias atravessando o mês', () => {
    expect(somarDias('2026-10-31', 1)).toBe('2026-11-01');
    expect(somarDias('2026-11-01', -1)).toBe('2026-10-31');
  });
});

/**
 * Esquemas de validação de entrada (Zod), o equivalente ao Pydantic do curso C4.
 * Toda entrada da API passa por aqui antes de chegar às regras de negócio.
 */
import { z } from 'zod';

export const turno = z.enum(['manha', 'tarde', 'noite'], {
  error: 'Escolha manhã, tarde ou noite.',
});
export const prioridade = z.enum(['normal', 'urgente'], {
  error: 'Prioridade: normal ou urgente.',
});

/** Data AAAA-MM-DD que existe no calendário (recusa 2026-02-31, por exemplo). */
export const data = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.')
  .refine(
    (v) => Number(v.slice(0, 4)) >= 2000 && Number(v.slice(0, 4)) <= 2100,
    'Use um ano entre 2000 e 2100.',
  )
  .refine((v) => new Date(`${v}T12:00:00Z`).toISOString().startsWith(v), 'Essa data não existe.');

/** Identificador: inteiro positivo dentro do limite da coluna INTEGER do PostgreSQL. */
export const id = z.coerce
  .number({ error: 'Identificador inválido.' })
  .int('Identificador inválido.')
  .min(1, 'Identificador inválido.')
  .max(2_147_483_647, 'Identificador inválido.');

const titulo = z
  .string()
  .trim()
  .min(1, 'Dê um título para a atividade.')
  .max(80, 'Use até 80 caracteres.')
  // Caracteres de controle (ex.: \u0000) são recusados pelo PostgreSQL.
  // eslint-disable-next-line no-control-regex
  .refine((v) => !/[\u0000-\u001F\u007F]/.test(v), 'Use só letras, números e pontuação.');

export const novaAtividade = z.object({
  titulo,
  turno,
  prioridade: prioridade.optional(),
  data: data.optional(),
});

export const edicaoDeAtividade = z
  .object({
    titulo: titulo.optional(),
    turno: turno.optional(),
    prioridade: prioridade.optional(),
    status: z.enum(['pendente', 'feita'], { error: 'Status: pendente ou feita.' }).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Nada para alterar.');

export const destino = z.discriminatedUnion(
  'destino',
  [
    z.object({ destino: z.literal('proximo_turno') }),
    z.object({ destino: z.literal('amanha'), turno: turno.optional() }),
    z.object({ destino: z.literal('data'), data, turno: turno.optional() }),
    z.object({ destino: z.literal('deixar_de_lado') }),
  ],
  { error: 'Escolha um destino: próximo turno, amanhã, outra data ou deixar de lado.' },
);

export const fechamento = z.object({
  destinos: z.array(z.intersection(z.object({ id }), destino)).default([]),
});

export const novaFixa = z.object({ titulo, turno, prioridade: prioridade.optional() });

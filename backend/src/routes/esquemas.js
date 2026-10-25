/**
 * Esquemas de validação de entrada (Zod), o equivalente ao Pydantic do curso C4.
 * Toda entrada da API passa por aqui antes de chegar às regras de negócio.
 */
import { z } from 'zod';

export const turno = z.enum(['manha', 'tarde', 'noite']);
export const prioridade = z.enum(['normal', 'urgente']);
export const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.');
export const id = z.coerce.number().int().positive();

const titulo = z
  .string()
  .trim()
  .min(1, 'Dê um título para a atividade.')
  .max(80, 'Use até 80 caracteres.');

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
    status: z.enum(['pendente', 'feita']).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Nada para alterar.');

export const destino = z.discriminatedUnion('destino', [
  z.object({ destino: z.literal('proximo_turno') }),
  z.object({ destino: z.literal('amanha'), turno: turno.optional() }),
  z.object({ destino: z.literal('data'), data, turno: turno.optional() }),
  z.object({ destino: z.literal('deixar_de_lado') }),
]);

export const fechamento = z.object({
  destinos: z.array(z.intersection(z.object({ id }), destino)).default([]),
});

export const novaFixa = z.object({ titulo, turno, prioridade: prioridade.optional() });

/**
 * HU-04: consulta feita pelo frontend a cada minuto.
 * Quem decide se alerta é a regra de negócio, não a IA (ADR-003).
 */
import * as repo from '../db/repositorio.js';
import { deveAlertar } from './turnos.js';

export async function alertaDeAgora(db, hoje, minutos) {
  const atividades = await repo.listarAtividadesDoDia(db, hoje);
  return { data: hoje, ...deveAlertar(minutos, atividades) };
}

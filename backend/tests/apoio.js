/**
 * Apoio aos testes de API: banco PostgreSQL em memória (pg-mem) e relógio controlável.
 * Assim `npm test` roda sem instalar banco e sem depender do horário real.
 */
import { readFileSync } from 'node:fs';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { criarApp } from '../src/app.js';

// Caminho fixo, relativo a este arquivo.
// eslint-disable-next-line security/detect-non-literal-fs-filename
const esquema = readFileSync(new URL('../src/db/schema.sql', import.meta.url), 'utf8');

/**
 * @param {{agora: string, ia?: object|null}} opcoes `agora` em ISO com fuso (ex.: 2026-10-24T09:00:00-03:00)
 */
export function criarAmbiente({ agora, ia = null }) {
  const { Pool } = newDb().adapters.createPg();
  const db = new Pool();
  const relogio = { agora: new Date(agora) };
  const app = criarApp({ db, ia, relogio: () => relogio.agora, fuso: 'America/Sao_Paulo' });

  return {
    db,
    api: () => request(app),
    pronto: () => db.query(esquema),
    /** Muda o horário "atual" do app. */
    irPara: (iso) => {
      relogio.agora = new Date(iso);
    },
  };
}

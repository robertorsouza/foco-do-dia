/**
 * Apoio aos testes de API.
 *
 * Dois bancos possíveis:
 * - padrão: PostgreSQL em memória (pg-mem), para `npm test` rodar sem instalar nada;
 * - com TEST_DATABASE_URL: PostgreSQL real, usado no CI. Cada ambiente ganha um
 *   schema próprio, então os testes não interferem entre si.
 *
 * A revisão independente mostrou que o pg-mem não reproduz tudo do PostgreSQL
 * (bloqueios em concorrência, ON CONFLICT). Por isso o CI roda a suíte nos dois.
 */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { newDb } from 'pg-mem';
import pg from 'pg';
import request from 'supertest';
import '../src/db/pool.js'; // registra a leitura de DATE como texto
import { criarApp } from '../src/app.js';

// Caminho fixo, relativo a este arquivo.
// eslint-disable-next-line security/detect-non-literal-fs-filename
const esquema = readFileSync(new URL('../src/db/schema.sql', import.meta.url), 'utf8');

export const BANCO_REAL = Boolean(process.env.TEST_DATABASE_URL);

function criarBanco() {
  if (!BANCO_REAL) {
    const { Pool } = newDb().adapters.createPg();
    return { db: new Pool(), preparar: (db) => db.query(esquema) };
  }
  const schema = `t_${randomUUID().replaceAll('-', '')}`;
  const db = new pg.Pool({
    connectionString: process.env.TEST_DATABASE_URL,
    options: `-c search_path=${schema}`,
    max: 5,
  });
  return {
    db,
    preparar: async (pool) => {
      await pool.query(`CREATE SCHEMA ${schema}`);
      await pool.query(esquema);
    },
  };
}

/**
 * @param {{agora: string, ia?: object|null, origensPermitidas?: string, codigoDeAcesso?: string}} opcoes
 *   `agora` em ISO com fuso (ex.: 2026-10-24T09:00:00-03:00)
 */
export function criarAmbiente({ agora, ia = null, ...seguranca }) {
  const { db, preparar } = criarBanco();
  const relogio = { agora: new Date(agora) };
  const app = criarApp({
    db,
    ia,
    relogio: () => relogio.agora,
    fuso: 'America/Sao_Paulo',
    ...seguranca,
  });

  return {
    db,
    api: () => request(app),
    pronto: () => preparar(db),
    /** Muda o horário "atual" do app. */
    irPara: (iso) => {
      relogio.agora = new Date(iso);
    },
  };
}

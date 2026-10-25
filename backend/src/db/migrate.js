/**
 * Cria as tabelas no banco. Uso: npm run migrate
 */
import { readFile } from 'node:fs/promises';
import { criarPool } from './pool.js';

// Caminho fixo, relativo a este arquivo: não vem de entrada do usuário.
// eslint-disable-next-line security/detect-non-literal-fs-filename
const esquema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
const pool = criarPool(process.env.DATABASE_URL, process.env.DB_SSL);
try {
  await pool.query(esquema);
  console.log('Banco atualizado.');
} finally {
  await pool.end();
}

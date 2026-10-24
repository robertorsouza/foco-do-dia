/**
 * Conexão com o PostgreSQL.
 * O endereço vem da variável de ambiente DATABASE_URL, nunca do código (RNF-03).
 */
import pg from 'pg';

// Colunas DATE chegam como texto AAAA-MM-DD, sem conversão de fuso.
pg.types.setTypeParser(1082, (valor) => valor);

/**
 * Cria o pool de conexões.
 * @param {string} databaseUrl
 * @returns {pg.Pool}
 */
export function criarPool(databaseUrl) {
  if (!databaseUrl) throw new Error('DATABASE_URL não configurada. Veja o .env.example.');
  const usaSsl = !/localhost|127\.0\.0\.1/.test(databaseUrl);
  return new pg.Pool({
    connectionString: databaseUrl,
    ssl: usaSsl ? { rejectUnauthorized: false } : false,
  });
}

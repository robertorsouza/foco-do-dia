/**
 * Conexão com o PostgreSQL.
 * O endereço vem da variável de ambiente DATABASE_URL, nunca do código (RNF-03).
 */
import pg from 'pg';

// Colunas DATE chegam como texto AAAA-MM-DD, sem conversão de fuso.
pg.types.setTypeParser(1082, (valor) => valor);

/**
 * Configuração de TLS da conexão (revisão de segurança do PR #1).
 *
 * Padrão seguro: fora do computador local, o certificado do servidor é
 * SEMPRE verificado (protege contra interceptação da conexão, MITM).
 * - DB_SSL=verify     → TLS com verificação (padrão em produção)
 * - DB_SSL=disable    → sem TLS (padrão só para localhost)
 * - DB_SSL=no-verify  → TLS sem verificar o certificado; uso excepcional e com aviso no log
 *
 * @param {string} databaseUrl
 * @param {string|undefined} modo Valor de DB_SSL.
 * @returns {false | {rejectUnauthorized: boolean}}
 */
export function configurarSsl(databaseUrl, modo) {
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(databaseUrl);
  const escolhido = modo || (local ? 'disable' : 'verify');

  if (escolhido === 'disable') return false;
  if (escolhido === 'no-verify') {
    console.warn(
      '[db] ATENÇÃO: certificado do banco NÃO está sendo verificado (DB_SSL=no-verify).',
    );
    return { rejectUnauthorized: false };
  }
  return { rejectUnauthorized: true };
}

/**
 * Cria o pool de conexões.
 * @param {string} databaseUrl
 * @param {string} [modoSsl] Valor de DB_SSL.
 * @returns {pg.Pool}
 */
export function criarPool(databaseUrl, modoSsl) {
  if (!databaseUrl) throw new Error('DATABASE_URL não configurada. Veja o .env.example.');
  return new pg.Pool({
    connectionString: databaseUrl,
    ssl: configurarSsl(databaseUrl, modoSsl),
  });
}

/**
 * Camada de acesso ao banco (db/).
 *
 * Todas as consultas são parametrizadas ($1, $2...): o valor digitado pelo
 * usuário entra como dado, nunca como comando SQL (proteção contra SQL injection).
 * Nenhuma regra de negócio mora aqui; ela fica em services/.
 */

const COLUNAS = `id, data, titulo, turno, prioridade, status, origem_id, fixa_id, criado_em`;

/** Normaliza DATE vindo do driver (texto ou Date) para AAAA-MM-DD. */
function paraData(valor) {
  return valor instanceof Date ? valor.toISOString().slice(0, 10) : valor;
}

function mapearAtividade(linha) {
  return linha && { ...linha, data: paraData(linha.data) };
}

/**
 * Executa várias operações numa transação: ou tudo grava, ou nada grava.
 * @template T
 * @param {import('pg').Pool} db
 * @param {(cliente: import('pg').PoolClient) => Promise<T>} trabalho
 * @returns {Promise<T>}
 */
export async function emTransacao(db, trabalho) {
  const cliente = await db.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await trabalho(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (erro) {
    await cliente.query('ROLLBACK');
    throw erro;
  } finally {
    cliente.release();
  }
}

// ---------- Dias ----------

/**
 * Cria o dia se ainda não existir. Retorna true se criou agora.
 * Consulta antes de inserir: o banco em memória dos testes (pg-mem) devolve a
 * linha mesmo quando o ON CONFLICT ignora a inserção, ao contrário do PostgreSQL.
 * O ON CONFLICT continua protegendo contra duas criações simultâneas.
 */
export async function criarDiaSeNaoExiste(db, data) {
  const existe = await db.query('SELECT 1 FROM dias WHERE data = $1', [data]);
  if (existe.rows.length > 0) return false;
  const r = await db.query(
    'INSERT INTO dias (data) VALUES ($1) ON CONFLICT (data) DO NOTHING RETURNING data',
    [data],
  );
  return r.rows.length > 0;
}

export async function buscarDia(db, data) {
  const r = await db.query('SELECT data, fechado_em, sugestoes_ia FROM dias WHERE data = $1', [
    data,
  ]);
  return r.rows[0] && { ...r.rows[0], data: paraData(r.rows[0].data) };
}

export async function listarDiasAbertosAntesDe(db, data) {
  const r = await db.query(
    'SELECT data FROM dias WHERE fechado_em IS NULL AND data < $1 ORDER BY data',
    [data],
  );
  return r.rows.map((l) => paraData(l.data));
}

/**
 * Marca o dia como fechado de forma atômica: só um processo consegue.
 * Retorna false se o dia já estava fechado (outra requisição chegou antes).
 */
export async function reivindicarFechamento(db, data) {
  const r = await db.query(
    'UPDATE dias SET fechado_em = now() WHERE data = $1 AND fechado_em IS NULL RETURNING data',
    [data],
  );
  return r.rows.length > 0;
}

/** Reabre um dia fechado (e descarta o cache de sugestões, que ficou desatualizado). */
export async function reabrirDia(db, data) {
  await db.query(
    'UPDATE dias SET fechado_em = NULL, sugestoes_ia = NULL WHERE data = $1 AND fechado_em IS NOT NULL',
    [data],
  );
}

export async function salvarSugestoesIA(db, data, sugestoes) {
  await db.query('UPDATE dias SET sugestoes_ia = $2 WHERE data = $1', [
    data,
    JSON.stringify(sugestoes),
  ]);
}

// ---------- Atividades ----------

export async function inserirAtividade(db, { data, titulo, turno, prioridade, origemId, fixaId }) {
  const r = await db.query(
    `INSERT INTO atividades (data, titulo, turno, prioridade, origem_id, fixa_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLUNAS}`,
    [data, titulo, turno, prioridade ?? 'normal', origemId ?? null, fixaId ?? null],
  );
  return mapearAtividade(r.rows[0]);
}

export async function buscarAtividade(db, id) {
  const r = await db.query(`SELECT ${COLUNAS} FROM atividades WHERE id = $1`, [id]);
  return mapearAtividade(r.rows[0]);
}

export async function listarAtividadesDoDia(db, data) {
  const r = await db.query(`SELECT ${COLUNAS} FROM atividades WHERE data = $1 ORDER BY id`, [data]);
  return r.rows.map(mapearAtividade);
}

export async function listarAtividadesEntre(db, inicio, fim) {
  const r = await db.query(
    `SELECT ${COLUNAS} FROM atividades WHERE data BETWEEN $1 AND $2 ORDER BY data, id`,
    [inicio, fim],
  );
  return r.rows.map(mapearAtividade);
}

export async function listarPorStatus(db, status) {
  const r = await db.query(
    `SELECT ${COLUNAS} FROM atividades WHERE status = $1 ORDER BY data, id`,
    [status],
  );
  return r.rows.map(mapearAtividade);
}

/** Gera "$3, $4, ..." para uma lista de valores a partir de uma posição. */
const marcadores = (lista, inicio) => lista.map((_, i) => `$${i + inicio}`).join(', ');

/**
 * Atualiza só os campos permitidos (lista fixa, não vinda do usuário).
 * Com `statusAtuais`, só atualiza se a atividade ainda estiver num desses status
 * (evita corrida entre dois toques quase simultâneos). Retorna null se não atualizou.
 */
export async function atualizarAtividade(db, id, campos, statusAtuais) {
  const permitidos = ['titulo', 'turno', 'prioridade', 'status'];
  const chaves = permitidos.filter((c) => campos[c] !== undefined);
  if (chaves.length === 0) return buscarAtividade(db, id);
  const atribuicoes = chaves.map((c, i) => `${c} = $${i + 2}`).join(', ');
  const valores = [id, ...chaves.map((c) => campos[c])];
  const condicao = statusAtuais
    ? ` AND status IN (${marcadores(statusAtuais, valores.length + 1)})`
    : '';
  const r = await db.query(
    `UPDATE atividades SET ${atribuicoes}, atualizado_em = now()
     WHERE id = $1${condicao} RETURNING ${COLUNAS}`,
    [...valores, ...(statusAtuais ?? [])],
  );
  return mapearAtividade(r.rows[0]) ?? null;
}

/**
 * Troca o status só se o atual for um dos esperados, numa única instrução.
 * É o que garante que dois toques simultâneos em "mover" não gerem duas cópias:
 * o segundo encontra o status já trocado e recebe null.
 */
export async function transicionarStatus(db, id, de, para) {
  return atualizarAtividade(db, id, { status: para }, de);
}

/** Exclui só se o status e a data permitirem (RN-13). Retorna false se não excluiu. */
export async function excluirAtividade(db, id, { statusPermitidos, aPartirDe }) {
  const r = await db.query(
    `DELETE FROM atividades WHERE id = $1 AND data >= $2
     AND status IN (${marcadores(statusPermitidos, 3)}) RETURNING id`,
    [id, aPartirDe, ...statusPermitidos],
  );
  return r.rows.length > 0;
}

/** Já existe, no dia, uma atividade visível com esse título (sem diferenciar maiúsculas)? */
export async function existeTituloNoDia(db, data, titulo) {
  const r = await db.query(
    `SELECT 1 FROM atividades WHERE data = $1 AND lower(titulo) = lower($2)
     AND status IN ('pendente', 'feita')`,
    [data, titulo],
  );
  return r.rows.length > 0;
}

/** Dias abertos a partir de uma data (exclusive). */
export async function listarDiasAbertosDepoisDe(db, data) {
  const r = await db.query(
    'SELECT data FROM dias WHERE data > $1 AND fechado_em IS NULL ORDER BY data',
    [data],
  );
  return r.rows.map((l) => paraData(l.data));
}

// ---------- Atividades fixas ----------

export async function listarFixasAtivas(db) {
  const r = await db.query(
    'SELECT id, titulo, turno, prioridade, ativa FROM atividades_fixas WHERE ativa = TRUE ORDER BY id',
  );
  return r.rows;
}

export async function inserirFixa(db, { titulo, turno, prioridade }) {
  const r = await db.query(
    `INSERT INTO atividades_fixas (titulo, turno, prioridade) VALUES ($1, $2, $3)
     RETURNING id, titulo, turno, prioridade, ativa`,
    [titulo, turno, prioridade ?? 'normal'],
  );
  return r.rows[0];
}

export async function desativarFixa(db, id) {
  const r = await db.query('UPDATE atividades_fixas SET ativa = FALSE WHERE id = $1 RETURNING id', [
    id,
  ]);
  return r.rows.length > 0;
}

/** Remove as cópias ainda pendentes de uma fixa nos dias depois de `data`. */
export async function removerCopiasFuturasDaFixa(db, fixaId, data) {
  await db.query(
    "DELETE FROM atividades WHERE fixa_id = $1 AND data > $2 AND status = 'pendente'",
    [fixaId, data],
  );
}

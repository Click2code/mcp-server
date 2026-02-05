import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  database: 'prior_auth_db',
  host: 'localhost',
  port: 5432,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

export async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 1000) {
    console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
  }
  return result;
}

export async function getClient() {
  return pool.connect();
}

export async function end() {
  return pool.end();
}

export default { query, getClient, end };

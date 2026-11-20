const { Pool } = require('pg');

const rawConnectionString = process.env.DATABASE_URL || '';

const isLocalDatabase = (url = '') =>
  url.includes('localhost') || url.includes('127.0.0.1');

const shouldUseSsl =
  Boolean(rawConnectionString) &&
  (process.env.NODE_ENV === 'production' ||
    rawConnectionString.includes('neon.tech') ||
    rawConnectionString.includes('sslmode=require') ||
    !isLocalDatabase(rawConnectionString));

function normalizeConnectionString(urlString) {
  if (!urlString) return undefined;
  try {
    const parsed = new URL(urlString);
    if (shouldUseSsl) {
      // Manejamos SSL explícitamente con { rejectUnauthorized: false } para evitar advertencias de pg
      parsed.searchParams.delete('sslmode');
    }
    return parsed.toString();
  } catch {
    return urlString;
  }
}

const pool = new Pool({
  connectionString: normalizeConnectionString(rawConnectionString),
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  keepAlive: true,
});

// Evita que una desconexión en reposo de Neon.tech cierre el servidor
pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err.message);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};

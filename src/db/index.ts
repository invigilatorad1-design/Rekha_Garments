import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import fs from 'fs';

export const createPool = () => {
  let host = process.env.SQL_HOST;

  if (host && host.startsWith('/app/cloudsql/')) {
    // If the local container-specific /app/cloudsql path doesn't exist (e.g. on deployed Cloud Run),
    // resolve it to the standard Cloud Run mount point /cloudsql/ for a seamless database connection.
    if (!fs.existsSync(host)) {
      const prodHost = host.replace(/^\/app\/cloudsql\//, '/cloudsql/');
      if (fs.existsSync(prodHost) || process.env.NODE_ENV === 'production') {
        console.log(`SQL_HOST path ${host} not found, resolving to production Cloud Run socket: ${prodHost}`);
        host = prodHost;
      }
    }
  }

  return new Pool({
    host,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  });
};

const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });
export { schema };

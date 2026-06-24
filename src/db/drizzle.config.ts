import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

let sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

if (!sqlHost) {
  throw new Error("SQL_HOST must be set in environment variables.");
}

// Map /app/cloudsql/ to /cloudsql/ if running in production Cloud Run where /app/cloudsql doesn't exist
if (sqlHost.startsWith('/app/cloudsql/')) {
  if (!fs.existsSync(sqlHost)) {
    const prodHost = sqlHost.replace(/^\/app\/cloudsql\//, '/cloudsql/');
    if (fs.existsSync(prodHost) || process.env.NODE_ENV === 'production') {
      console.log(`Drizzle config: SQL_HOST path ${sqlHost} not found, resolving to production Cloud Run socket: ${prodHost}`);
      sqlHost = prodHost;
    }
  }
}
if (!sqlDbName) {
  throw new Error("SQL_DB_NAME must be set in environment variables.");
}
if (!user) {
  throw new Error("SQL_ADMIN_USER or SQL_USER must be set in environment variables.");
}
if (!password) {
  throw new Error("SQL_ADMIN_PASSWORD or SQL_PASSWORD must be set in environment variables.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    host: sqlHost,
    user: user,
    password: password,
    database: sqlDbName,
    ssl: false,
  },
  verbose: true,
});

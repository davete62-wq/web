import pg from 'pg';
import { env } from '../config/env.js';

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000
});

export async function query(text, params = []) {
  const client = await pool.connect();
  try {
    await client.query('SELECT set_config($1, $2, false)', [
      'app.field_encryption_key',
      env.encryptionKey
    ]);
    return client.query(text, params);
  } finally {
    client.release();
  }
}

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT set_config($1, $2, true)', [
      'app.field_encryption_key',
      env.encryptionKey
    ]);
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

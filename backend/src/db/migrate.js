import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const migrationsDir = join(__dirname, '..', '..', 'migrations');
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    console.log(`Ejecutando ${file}...`);
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    await pool.query(sql);
  }

  console.log('Migración completada.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Error en la migración:', err);
  process.exit(1);
});

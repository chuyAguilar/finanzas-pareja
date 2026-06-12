import fs from 'fs';
import path from 'path';
import { pool } from './db';

async function migrate(): Promise<void> {
	const schemaPath = path.join(__dirname, 'schema.sql');
	const sql = fs.readFileSync(schemaPath, 'utf-8');

	console.log('[migrate] Ejecutando schema.sql contra la base de datos...');

	try {
		await pool.query(sql);
		console.log('[migrate] ✅ Migración completada exitosamente');
	} catch (err) {
		console.error('[migrate] ❌ Error al ejecutar la migración:', err);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

migrate();

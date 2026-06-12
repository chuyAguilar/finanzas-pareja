import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db';
import apiRouter from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
const corsOptions = {
	origin: allowedOriginsEnv && allowedOriginsEnv !== '*'
		? allowedOriginsEnv.split(',').map(o => o.trim())
		: '*'
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));

// ─── Rutas ───────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

/**
 * GET /health
 * Verifica la conexión a la base de datos.
 */
app.get('/health', async (_req, res) => {
	try {
		await pool.query('SELECT 1');
		res.json({ ok: true });
	} catch (err) {
		console.error('[health] Error al conectar a la BD:', err);
		res.status(503).json({ ok: false, error: 'No se pudo conectar a la base de datos' });
	}
});

// ─── Iniciar servidor ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
	console.log(`[server] Servidor corriendo en http://localhost:${PORT}`);
});

export default app;

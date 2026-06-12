import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../db';
import { mapUser, mapGroup } from '../utils/mappers';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

/**
 * POST /api/auth/login
 * Body: { idToken }
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
	const { idToken } = req.body;

	if (!idToken) {
		res.status(400).json({ error: 'idToken es requerido' });
		return;
	}

	// Decodificar el payload del idToken sin validar
	try {
		const parts = idToken.split('.');
		if (parts.length === 3) {
			const payloadBase64 = parts[1];
			const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
			const decodedPayload = JSON.parse(payloadJson);
			console.log('[auth/login] Decoded Token Payload -> aud:', decodedPayload.aud, 'iss:', decodedPayload.iss);
		} else {
			console.log('[auth/login] Token format is not standard JWT (does not contain 3 parts)');
		}
	} catch (decodeErr) {
		console.error('[auth/login] Failed to decode token payload:', decodeErr);
	}

	const clientIdEnv = process.env.GOOGLE_WEB_CLIENT_ID || '';
	console.log('[auth/login] GOOGLE_WEB_CLIENT_ID (first 12 chars):', clientIdEnv.substring(0, 12));

	try {
		// Verificar el idToken con Google
		const ticket = await client.verifyIdToken({
			idToken: idToken,
			audience: process.env.GOOGLE_WEB_CLIENT_ID,
		});

		const payload = ticket.getPayload();
		if (!payload) {
			res.status(401).json({ error: 'Token de Google no contiene payload' });
			return;
		}

		const googleId = payload.sub;
		const email = payload.email;
		const username = payload.name || email?.split('@')[0] || 'Usuario';
		const avatarUrl = payload.picture;

		if (!googleId || !email) {
			res.status(400).json({ error: 'El token de Google no contiene googleId o email' });
			return;
		}

		// 1. Buscar si el usuario ya existe
		let userQuery = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
		let user = userQuery.rows[0];

		if (!user) {
			// Crear un nuevo usuario
			const defaultColor = '#1899D5';
			const insertQuery = await pool.query(
				'INSERT INTO users (google_id, email, username, color, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
				[googleId, email, username, defaultColor, avatarUrl || null]
			);
			user = insertQuery.rows[0];
		}

		// 2. Buscar si pertenece a un grupo
		const groupQuery = await pool.query(
			`SELECT g.* FROM groups g
			 JOIN group_members gm ON g.id = gm.group_id
			 WHERE gm.user_id = $1
			 LIMIT 1`,
			[user.id]
		);

		let group = null;
		if (groupQuery.rows.length > 0) {
			const dbGroup = groupQuery.rows[0];
			// Obtener todos los miembros del grupo
			const membersQuery = await pool.query(
				`SELECT u.* FROM users u
				 JOIN group_members gm ON u.id = gm.user_id
				 WHERE gm.group_id = $1`,
				[dbGroup.id]
			);
			group = mapGroup(dbGroup, membersQuery.rows);
		}

		res.json({
			user: mapUser(user),
			group
		});
	} catch (err: any) {
		console.error('[auth/login] Error de verificación de Google Token (mensaje real):', err?.message || err);
		res.status(401).json({ error: 'Token de Google inválido o expirado' });
	}
});

export default router;

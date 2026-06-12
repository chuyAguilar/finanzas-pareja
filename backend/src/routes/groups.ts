import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { mapGroup } from '../utils/mappers';

const router = Router();

// Genera un código de grupo único de 6 caracteres alfanuméricos en mayúsculas sin 0, O, 1, I, L
function generateGroupCode(): string {
	const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
	let code = '';
	for (let i = 0; i < 6; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return code;
}

/**
 * POST /api/groups
 * Body: { userId, name? }
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
	const { userId, name } = req.body;

	if (!userId) {
		res.status(400).json({ error: 'userId es requerido' });
		return;
	}

	try {
		// Verificar que el usuario exista
		const userQuery = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
		if (userQuery.rows.length === 0) {
			res.status(404).json({ error: 'Usuario no encontrado' });
			return;
		}

		// Generar un código único
		let code = '';
		let isUnique = false;
		let attempts = 0;
		while (!isUnique && attempts < 10) {
			code = generateGroupCode();
			const checkQuery = await pool.query('SELECT 1 FROM groups WHERE code = $1', [code]);
			if (checkQuery.rows.length === 0) {
				isUnique = true;
			}
			attempts++;
		}

		if (!isUnique) {
			res.status(500).json({ error: 'No se pudo generar un código de grupo único, intente de nuevo' });
			return;
		}

		const groupName = name || 'Mi grupo';

		// Insertar el grupo
		const groupInsert = await pool.query(
			'INSERT INTO groups (code, name) VALUES ($1, $2) RETURNING *',
			[code, groupName]
		);
		const group = groupInsert.rows[0];

		// Unir al creador como miembro
		await pool.query(
			'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
			[group.id, userId]
		);

		// Obtener miembros (solo será el creador por ahora, pero consultamos para mantener consistencia)
		const membersQuery = await pool.query(
			`SELECT u.* FROM users u
			 JOIN group_members gm ON u.id = gm.user_id
			 WHERE gm.group_id = $1`,
			[group.id]
		);

		res.status(201).json(mapGroup(group, membersQuery.rows));
	} catch (err) {
		console.error('[groups/create] Error:', err);
		res.status(500).json({ error: 'Error interno del servidor al crear grupo' });
	}
});

/**
 * POST /api/groups/join
 * Body: { userId, code }
 */
router.post('/join', async (req: Request, res: Response): Promise<void> => {
	const { userId, code } = req.body;

	if (!userId || !code) {
		res.status(400).json({ error: 'userId y code son requeridos' });
		return;
	}

	const cleanCode = code.trim().toUpperCase();

	try {
		// Verificar que el usuario exista
		const userQuery = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
		if (userQuery.rows.length === 0) {
			res.status(404).json({ error: 'Usuario no encontrado' });
			return;
		}

		// Buscar el grupo por código (case-insensitive)
		const groupQuery = await pool.query(
			'SELECT * FROM groups WHERE UPPER(code) = UPPER($1)',
			[cleanCode]
		);
		if (groupQuery.rows.length === 0) {
			res.status(404).json({ error: 'Código de grupo inválido o grupo no encontrado' });
			return;
		}

		const group = groupQuery.rows[0];

		// Agregar al usuario al grupo
		await pool.query(
			'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
			[group.id, userId]
		);

		// Obtener todos los miembros del grupo
		const membersQuery = await pool.query(
			`SELECT u.* FROM users u
			 JOIN group_members gm ON u.id = gm.user_id
			 WHERE gm.group_id = $1`,
			[group.id]
		);

		res.json(mapGroup(group, membersQuery.rows));
	} catch (err) {
		console.error('[groups/join] Error:', err);
		res.status(500).json({ error: 'Error interno del servidor al unirse al grupo' });
	}
});

/**
 * GET /api/groups/user/:userId
 */
router.get('/user/:userId', async (req: Request, res: Response): Promise<void> => {
	const { userId } = req.params;

	try {
		// Buscar el grupo del usuario
		const groupQuery = await pool.query(
			`SELECT g.* FROM groups g
			 JOIN group_members gm ON g.id = gm.group_id
			 WHERE gm.user_id = $1
			 LIMIT 1`,
			[userId]
		);

		if (groupQuery.rows.length === 0) {
			res.json(null);
			return;
		}

		const group = groupQuery.rows[0];

		// Obtener todos los miembros
		const membersQuery = await pool.query(
			`SELECT u.* FROM users u
			 JOIN group_members gm ON u.id = gm.user_id
			 WHERE gm.group_id = $1`,
			[group.id]
		);

		res.json(mapGroup(group, membersQuery.rows));
	} catch (err) {
		console.error('[groups/getByUser] Error:', err);
		res.status(500).json({ error: 'Error interno del servidor al obtener el grupo del usuario' });
	}
});

export default router;

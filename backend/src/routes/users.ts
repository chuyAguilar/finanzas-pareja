import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { mapUser } from '../utils/mappers';

const router = Router();

/**
 * PATCH /api/users/:id
 * Body: { username?, color?, avatarUrl? }
 */
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
	const { id } = req.params;
	const { username, color, avatarUrl } = req.body;

	try {
		// Verificar si el usuario existe
		const userQuery = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
		if (userQuery.rows.length === 0) {
			res.status(404).json({ error: 'Usuario no encontrado' });
			return;
		}

		const fields: string[] = [];
		const values: any[] = [];
		let index = 1;

		if (username !== undefined) {
			fields.push(`username = $${index++}`);
			values.push(username);
		}
		if (color !== undefined) {
			fields.push(`color = $${index++}`);
			values.push(color);
		}
		if (avatarUrl !== undefined) {
			fields.push(`avatar_url = $${index++}`);
			values.push(avatarUrl);
		}

		if (fields.length === 0) {
			// No se enviaron campos para actualizar, retornar el usuario existente
			res.json(mapUser(userQuery.rows[0]));
			return;
		}

		values.push(id);
		const updateQuery = await pool.query(
			`UPDATE users SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
			values
		);

		res.json(mapUser(updateQuery.rows[0]));
	} catch (err) {
		console.error('[users/update] Error:', err);
		res.status(500).json({ error: 'Error interno del servidor al actualizar usuario' });
	}
});

export default router;

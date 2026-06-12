import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { mapTransaction } from '../utils/mappers';

const router = Router();

/**
 * GET /api/transactions
 * Query: groupId (required), month (optional, format: YYYY-MM)
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
	const { groupId, month } = req.query;

	if (!groupId) {
		res.status(400).json({ error: 'groupId es requerido' });
		return;
	}

	try {
		let queryText = `
			SELECT t.*, u.username, u.color
			FROM transactions t
			JOIN users u ON t.user_id = u.id
			WHERE t.group_id = $1
		`;
		const params: any[] = [groupId];

		if (month) {
			queryText += ` AND TO_CHAR(t.date, 'YYYY-MM') = $2`;
			params.push(month);
		}

		queryText += ` ORDER BY t.date DESC, t.created_at DESC`;

		const result = await pool.query(queryText, params);
		const transactions = result.rows.map(mapTransaction);
		res.json(transactions);
	} catch (err) {
		console.error('[transactions/list] Error:', err);
		res.status(500).json({ error: 'Error interno del servidor al obtener transacciones' });
	}
});

/**
 * GET /api/transactions/summary
 * Query: groupId (required), month (required, format: YYYY-MM)
 */
router.get('/summary', async (req: Request, res: Response): Promise<void> => {
	const { groupId, month } = req.query;

	if (!groupId || !month) {
		res.status(400).json({ error: 'groupId y month son requeridos' });
		return;
	}

	try {
		const queryText = `
			SELECT
				t.date::TEXT as date,
				SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
				SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expense,
				SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) as balance
			FROM transactions t
			WHERE t.group_id = $1 AND TO_CHAR(t.date, 'YYYY-MM') = $2
			GROUP BY t.date
			ORDER BY t.date ASC
		`;

		const result = await pool.query(queryText, [groupId, month]);
		const summary = result.rows.map(row => ({
			date: row.date,
			income: parseFloat(row.income || '0'),
			expense: parseFloat(row.expense || '0'),
			balance: parseFloat(row.balance || '0')
		}));

		res.json(summary);
	} catch (err) {
		console.error('[transactions/summary] Error:', err);
		res.status(500).json({ error: 'Error interno del servidor al obtener resumen' });
	}
});

/**
 * GET /api/transactions/day
 * Query: groupId (required), date (required, format: YYYY-MM-DD)
 */
router.get('/day', async (req: Request, res: Response): Promise<void> => {
	const { groupId, date } = req.query;

	if (!groupId || !date) {
		res.status(400).json({ error: 'groupId y date son requeridos' });
		return;
	}

	try {
		// 1. Obtener miembros del grupo
		const membersQuery = await pool.query(
			`SELECT u.id, u.username, u.color
			 FROM users u
			 JOIN group_members gm ON u.id = gm.user_id
			 WHERE gm.group_id = $1`,
			[groupId]
		);

		// 2. Obtener transacciones del día
		const transactionsQuery = await pool.query(
			`SELECT t.*, u.username, u.color
			 FROM transactions t
			 JOIN users u ON t.user_id = u.id
			 WHERE t.group_id = $1 AND t.date = $2
			 ORDER BY t.created_at DESC`,
			[groupId, date]
		);

		let incomeTotal = 0;
		let expenseTotal = 0;

		const mappedTxs = transactionsQuery.rows.map(row => {
			const tx = mapTransaction(row);
			if (tx) {
				if (tx.type === 'income') {
					incomeTotal += tx.amount;
				} else if (tx.type === 'expense') {
					expenseTotal += tx.amount;
				}
			}
			return tx;
		});

		const balance = incomeTotal - expenseTotal;

		const perUser = membersQuery.rows.map(user => {
			const userTxs = transactionsQuery.rows.filter(t => t.user_id === user.id);
			const income = userTxs
				.filter(t => t.type === 'income')
				.reduce((sum, t) => sum + parseFloat(t.amount), 0);
			const expense = userTxs
				.filter(t => t.type === 'expense')
				.reduce((sum, t) => sum + parseFloat(t.amount), 0);

			return {
				userId: user.id,
				username: user.username,
				color: user.color,
				income,
				expense
			};
		});

		res.json({
			balance,
			perUser,
			transactions: mappedTxs
		});
	} catch (err) {
		console.error('[transactions/day] Error:', err);
		res.status(500).json({ error: 'Error interno del servidor al obtener resumen diario' });
	}
});

/**
 * POST /api/transactions
 * Body: { groupId, userId, type, amount, description?, imageUrl?, date? }
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
	const { groupId, userId, type, amount, description, imageUrl, date } = req.body;

	if (!groupId || !userId || !type || amount === undefined) {
		res.status(400).json({ error: 'groupId, userId, type y amount son requeridos' });
		return;
	}

	if (type !== 'income' && type !== 'expense') {
		res.status(400).json({ error: 'type debe ser "income" o "expense"' });
		return;
	}

	const numericAmount = parseFloat(amount);
	if (isNaN(numericAmount) || numericAmount <= 0) {
		res.status(400).json({ error: 'amount debe ser un número positivo' });
		return;
	}

	const txDate = date || new Date().toISOString().split('T')[0];

	// Validar que la fecha no sea futura (con tolerancia de 1 día para diferencias de huso horario)
	const limitDate = new Date();
	limitDate.setDate(limitDate.getDate() + 1);
	const limitDateStr = limitDate.toISOString().split('T')[0];
	if (txDate > limitDateStr) {
		res.status(400).json({ error: 'No puedes registrar movimientos en fechas futuras' });
		return;
	}

	try {
		// Crear la transacción
		const insertResult = await pool.query(
			`INSERT INTO transactions (group_id, user_id, type, amount, description, image_url, date)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)
			 RETURNING *`,
			[groupId, userId, type, numericAmount, description || null, imageUrl || null, txDate]
		);

		const newTx = insertResult.rows[0];

		// Consultar de nuevo con JOIN para incluir username y color
		const joinedResult = await pool.query(
			`SELECT t.*, u.username, u.color
			 FROM transactions t
			 JOIN users u ON t.user_id = u.id
			 WHERE t.id = $1`,
			[newTx.id]
		);

		res.status(201).json(mapTransaction(joinedResult.rows[0]));
	} catch (err) {
		console.error('[transactions/create] Error:', err);
		res.status(500).json({ error: 'Error interno del servidor al registrar transacción' });
	}
});

/**
 * DELETE /api/transactions/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
	const { id } = req.params;

	try {
		const result = await pool.query(
			'DELETE FROM transactions WHERE id = $1 RETURNING *',
			[id]
		);

		if (result.rows.length === 0) {
			res.status(404).json({ error: 'Transacción no encontrada' });
			return;
		}

		res.json({ success: true, message: 'Transacción eliminada exitosamente' });
	} catch (err) {
		console.error('[transactions/delete] Error:', err);
		res.status(500).json({ error: 'Error interno del servidor al eliminar transacción' });
	}
});

export default router;

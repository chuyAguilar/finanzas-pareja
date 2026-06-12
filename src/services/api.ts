import { API_URL } from '../config';
import { Group, DaySummary, CreateTransactionData, Transaction, MonthSummaryDay, User } from '../types';

/**
 * Crea un nuevo grupo y asocia al usuario creador como miembro.
 */
export const createGroup = async (userId: string, name?: string): Promise<Group> => {
	const response = await fetch(`${API_URL}/api/groups`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ userId, name })
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || 'Error al crear el grupo');
	}

	return response.json();
};

/**
 * Une a un usuario a un grupo existente usando su código único.
 */
export const joinGroup = async (userId: string, code: string): Promise<Group> => {
	const response = await fetch(`${API_URL}/api/groups/join`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ userId, code })
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || 'Error al unirse al grupo');
	}

	return response.json();
};

/**
 * Obtiene el grupo al que pertenece el usuario, o null si no pertenece a ninguno.
 */
export const getGroupByUser = async (userId: string): Promise<Group | null> => {
	const response = await fetch(`${API_URL}/api/groups/user/${userId}`);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || 'Error al obtener el grupo del usuario');
	}

	return response.json();
};

/**
 * Obtiene el resumen del día para la pantalla principal.
 */
export const getDaySummary = async (groupId: string, date: string): Promise<DaySummary> => {
	const response = await fetch(`${API_URL}/api/transactions/day?groupId=${groupId}&date=${date}`);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || 'Error al obtener el resumen diario');
	}

	return response.json();
};

/**
 * Obtiene el resumen del mes para la pantalla de calendario.
 */
export const getMonthSummary = async (groupId: string, month: string): Promise<MonthSummaryDay[]> => {
	const response = await fetch(`${API_URL}/api/transactions/summary?groupId=${groupId}&month=${month}`);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || 'Error al obtener el resumen mensual');
	}

	return response.json();
};

/**
 * Registra una nueva transacción (ingreso o gasto).
 */
export const createTransaction = async (data: CreateTransactionData): Promise<Transaction> => {
	const response = await fetch(`${API_URL}/api/transactions`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || 'Error al guardar la transacción');
	}

	return response.json();
};

/**
 * Elimina una transacción por su ID.
 */
export const deleteTransaction = async (id: string): Promise<void> => {
	const response = await fetch(`${API_URL}/api/transactions/${id}`, {
		method: 'DELETE'
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || 'Error al eliminar la transacción');
	}
};

/**
 * Actualiza los datos del perfil de un usuario (username, color, avatarUrl).
 */
export const updateUser = async (
	id: string,
	data: { username?: string; color?: string; avatarUrl?: string }
): Promise<User> => {
	const response = await fetch(`${API_URL}/api/users/${id}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || 'Error al actualizar el usuario');
	}

	return response.json();
};


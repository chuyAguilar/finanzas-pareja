export const mapUser = (row: any) => {
	if (!row) return null;
	return {
		id: row.id,
		googleId: row.google_id,
		email: row.email,
		username: row.username,
		color: row.color,
		avatarUrl: row.avatar_url
	};
};

export const mapGroup = (row: any, members: any[] = []) => {
	if (!row) return null;
	return {
		id: row.id,
		code: row.code,
		name: row.name,
		members: members ? members.map(mapUser) : []
	};
};

export const mapTransaction = (row: any) => {
	if (!row) return null;
	return {
		id: row.id,
		groupId: row.group_id,
		userId: row.user_id,
		type: row.type,
		amount: typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount,
		description: row.description,
		imageUrl: row.image_url,
		date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date,
		createdAt: row.created_at,
		username: row.username,
		color: row.color
	};
};

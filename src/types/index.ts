// ─── Tipos principales de la aplicación ────────────────────────────────────

export interface User {
	id: string;
	googleId: string;
	username: string;
	color: string;
	avatarUrl: string;
}

export interface Group {
	id: string;
	code: string;
	name: string;
	members: User[];
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
	id: string;
	userId: string;
	groupId: string;
	type: TransactionType;
	amount: number;
	description?: string;
	imageUrl?: string;
	date: string; // ISO 8601
}

export interface CreateTransactionData {
	groupId: string;
	userId: string;
	type: TransactionType;
	amount: number;
	description?: string;
	imageUrl?: string;
	date?: string; // YYYY-MM-DD
}

export interface DaySummaryMember {
	userId: string;
	username: string;
	color: string;
	income: number;
	expense: number;
}

export interface DaySummary {
	balance: number;
	perUser: DaySummaryMember[];
	transactions: (Transaction & { username: string; color: string })[];
}

export interface MonthSummaryDay {
	date: string;
	income: number;
	expense: number;
	balance: number;
}


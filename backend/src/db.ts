import { Pool, types } from 'pg';
import dotenv from 'dotenv';

// NUMERIC (OID 1700) se devuelve como string por defecto — lo parseamos como number
types.setTypeParser(1700, (val: string) => parseFloat(val));

dotenv.config();

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL no está definida en las variables de entorno');
}

const isRailwayInternal = process.env.DATABASE_URL.includes('railway.internal');

export const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: isRailwayInternal ? false : {
		rejectUnauthorized: false,
	},
});

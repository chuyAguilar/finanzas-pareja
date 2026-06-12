import { SocialLogin } from '@capgo/capacitor-social-login';
import { GOOGLE_WEB_CLIENT_ID, API_URL } from '../config';
import { User, Group } from '../types';

export interface Session {
	user: User;
	group: Group | null;
}

export const initAuth = async (): Promise<void> => {
	try {
		await SocialLogin.initialize({
			google: {
				webClientId: GOOGLE_WEB_CLIENT_ID
			}
		});
	} catch (err) {
		console.error('[authService] Error al inicializar SocialLogin:', err);
	}
};

export const signInWithGoogle = async (): Promise<Session> => {
	const response = await SocialLogin.login({
		provider: 'google',
		options: {
			scopes: ['email', 'profile']
		}
	});

	if (response.result.responseType !== 'online') {
		throw new Error('El inicio de sesión de Google no devolvió datos online');
	}

	const idToken = response.result.idToken;

	if (!idToken) {
		throw new Error('No se pudo obtener el idToken de Google');
	}

	const apiResponse = await fetch(`${API_URL}/api/auth/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ idToken })
	});

	if (!apiResponse.ok) {
		const errorData = await apiResponse.json().catch(() => ({}));
		throw new Error(errorData.error || 'Error al autenticar con el servidor');
	}

	const sessionData: Session = await apiResponse.json();
	localStorage.setItem('session', JSON.stringify(sessionData));
	return sessionData;
};

export const signOut = async (): Promise<void> => {
	try {
		await SocialLogin.logout({ provider: 'google' });
	} catch (err) {
		console.warn('[authService] Error al cerrar sesión en Google:', err);
	}
	localStorage.removeItem('session');
};

export const getSession = (): Session | null => {
	const sessionStr = localStorage.getItem('session');
	if (!sessionStr) return null;
	try {
		return JSON.parse(sessionStr);
	} catch (err) {
		console.error('[authService] Error al parsear sesión:', err);
		return null;
	}
};

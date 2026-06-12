import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonContent, IonPage, IonLoading } from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
	const { user, group, loading, login } = useAuth();
	const history = useHistory();
	const [error, setError] = useState<string | null>(null);
	const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

	// Redirigir de forma automática si ya hay una sesión activa
	useEffect(() => {
		if (!loading && user) {
			if (group) {
				history.replace('/home');
			} else {
				history.replace('/pairing');
			}
		}
	}, [user, group, loading, history]);

	const handleGoogleLogin = async () => {
		setError(null);
		setIsLoggingIn(true);
		try {
			const session = await login();
			if (session.group) {
				history.replace('/home');
			} else {
				history.replace('/pairing');
			}
		} catch (err: any) {
			console.error('[LoginPage] Error al iniciar sesión:', err);
			setError(err.message || 'Error al conectar con Google. Por favor intenta de nuevo.');
		} finally {
			setIsLoggingIn(false);
		}
	};

	return (
		<IonPage>
			<IonContent scrollY={false}>
				<IonLoading isOpen={loading || isLoggingIn} message="Iniciando sesión..." />

				<div className="flex flex-col items-center justify-center min-h-full bg-slate-900 text-white p-6">
					{/* Logo / Ilustración simple */}
					<div className="mb-8 flex flex-col items-center">
						<div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4 animate-pulse">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="w-12 h-12 text-white"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h.007c.075 0 .115.086.07.14L3 5.25M3.75 4.5C3.75 5.625 4.875 6.75 6 6.75h12M3.75 4.5v10.5m16.5-10.5h-.008a.11.11 0 0 0-.07.14l.82 1.355c.046.076-.025.17-.11.14L20.25 6.75h-12c-1.125 0-2.25 1.125-2.25 2.25v6.75m14.25-10.5v10.5m-15 0a3 3 0 0 0-3 3v.75m18-3a3 3 0 0 0-3-3m-12 3v-.75m3-3h10.5a1.5 1.5 0 0 0 1.5-1.5V6.75M19.5 18.75a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3"
								/>
							</svg>
						</div>
						<h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
							finanzas-pareja
						</h1>
						<p className="text-slate-400 mt-2 text-center text-sm max-w-xs">
							Gestiona los ingresos y gastos compartidos con tu pareja en tiempo real
						</p>
					</div>

					{/* Contenido principal / Botón de Acción */}
					<div className="w-full max-w-sm bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-xl flex flex-col items-center">
						<button
							id="btn-google-login"
							onClick={handleGoogleLogin}
							disabled={loading || isLoggingIn}
							className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 hover:bg-slate-100 disabled:opacity-50 transition-all duration-300 font-semibold py-3.5 px-5 rounded-xl border border-slate-200 shadow-md transform hover:-translate-y-0.5 cursor-pointer"
						>
							{/* Icono de Google */}
							<svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									fill="#4285F4"
								/>
								<path
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									fill="#34A853"
								/>
								<path
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
									fill="#FBBC05"
								/>
								<path
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
									fill="#EA4335"
								/>
							</svg>
							<span>Continuar con Google</span>
						</button>

						{error && (
							<div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs text-center w-full">
								{error}
							</div>
						)}
					</div>
				</div>
			</IonContent>
		</IonPage>
	);
};

export default LoginPage;

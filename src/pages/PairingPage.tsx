import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/api';

const PairingPage: React.FC = () => {
	const { user, group, setGroup, loading: authLoading } = useAuth();
	const history = useHistory();

	const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
	
	// Crear grupo state
	const [groupName, setGroupName] = useState<string>('');
	const [createdGroup, setCreatedGroup] = useState<any>(null);
	const [isCreating, setIsCreating] = useState<boolean>(false);
	const [createError, setCreateError] = useState<string | null>(null);
	const [copied, setCopied] = useState<boolean>(false);

	// Unirme state
	const [joinCode, setJoinCode] = useState<string>('');
	const [isJoining, setIsJoining] = useState<boolean>(false);
	const [joinError, setJoinError] = useState<string | null>(null);

	// Redirigir si el usuario ya tiene un grupo asignado
	useEffect(() => {
		if (!authLoading && user && group) {
			history.replace('/home');
		}
	}, [user, group, authLoading, history]);

	// Limpiar estados al cambiar de pestaña
	useEffect(() => {
		setCreateError(null);
		setJoinError(null);
		setGroupName('');
		setJoinCode('');
		setCreatedGroup(null);
		setCopied(false);
	}, [activeTab]);

	const handleCreateGroup = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) return;

		setCreateError(null);
		setIsCreating(true);
		try {
			const name = groupName.trim() || 'Mi grupo';
			const newGroup = await apiService.createGroup(user.id, name);
			setCreatedGroup(newGroup);
		} catch (err: any) {
			console.error('[PairingPage] Error al crear grupo:', err);
			setCreateError(err.message || 'Ocurrió un error al crear el grupo.');
		} finally {
			setIsCreating(false);
		}
	};

	const handleJoinGroup = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) return;

		const cleanCode = joinCode.trim().toUpperCase();
		if (cleanCode.length !== 6) {
			setJoinError('El código debe ser de 6 caracteres.');
			return;
		}

		setJoinError(null);
		setIsJoining(true);
		try {
			const joinedGroup = await apiService.joinGroup(user.id, cleanCode);
			setGroup(joinedGroup);
			history.replace('/home');
		} catch (err: any) {
			console.error('[PairingPage] Error al unirse al grupo:', err);
			setJoinError(err.message || 'Código inválido o grupo no encontrado.');
		} finally {
			setIsJoining(false);
		}
	};

	const handleCopyCode = async () => {
		if (!createdGroup) return;
		try {
			await navigator.clipboard.writeText(createdGroup.code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Error al copiar al portapapeles:', err);
		}
	};

	const handleShareCode = async () => {
		if (!createdGroup) return;
		try {
			if (typeof navigator.share === 'function') {
				await navigator.share({
					title: 'Únete a mi grupo de finanzas',
					text: `¡Hola! Únete a mi grupo "${createdGroup.name}" en finanzas-pareja. Mi código de emparejamiento es: ${createdGroup.code}`,
					url: window.location.origin
				});
			} else {
				handleCopyCode();
			}
		} catch (err) {
			console.warn('Error al compartir código:', err);
		}
	};

	const handleCodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value.replace(/\s/g, '').toUpperCase();
		setJoinCode(val.slice(0, 6));
	};

	const handleContinue = () => {
		if (createdGroup) {
			setGroup(createdGroup);
			history.replace('/home');
		}
	};

	return (
		<IonPage>
			<IonContent scrollY={true}>
				<div className="flex flex-col items-center justify-center min-h-full bg-[#17597F] text-white p-6">
					
					{/* Encabezado */}
					<div className="mb-8 text-center">
						<h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-[#1899D5]">
							Emparejamiento
						</h1>
						<p className="text-slate-200 mt-2 text-sm max-w-xs mx-auto">
							Crea un grupo para compartir tus finanzas o únete a uno existente usando un código de invitación.
						</p>
					</div>

					{/* Tarjeta Principal - Glassmorphism */}
					<div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col">
						
						{/* Tabs / Selector de Segmento */}
						{!createdGroup && (
							<div className="flex bg-black/20 p-1 rounded-xl mb-6">
								<button
									onClick={() => setActiveTab('create')}
									className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 cursor-pointer ${
										activeTab === 'create'
											? 'bg-[#1899D5] text-white shadow'
											: 'text-slate-300 hover:text-white'
									}`}
								>
									Crear grupo
								</button>
								<button
									onClick={() => setActiveTab('join')}
									className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 cursor-pointer ${
										activeTab === 'join'
											? 'bg-[#A2308F] text-white shadow'
											: 'text-slate-300 hover:text-white'
									}`}
								>
									Unirme con código
								</button>
							</div>
						)}

						{/* Sección: Crear Grupo */}
						{activeTab === 'create' && (
							<div>
								{!createdGroup ? (
									<form onSubmit={handleCreateGroup} className="space-y-4">
										<div>
											<label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
												Nombre del grupo (Opcional)
											</label>
											<input
												type="text"
												value={groupName}
												onChange={(e) => setGroupName(e.target.value)}
												placeholder="Ej. Pareja A&B, Nuestro Hogar"
												className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-[#1899D5] transition-colors"
											/>
										</div>

										{createError && (
											<div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs text-center">
												{createError}
											</div>
										)}

										<button
											type="submit"
											disabled={isCreating}
											className="w-full py-3.5 bg-[#4BA32A] hover:bg-[#439225] disabled:opacity-50 font-bold rounded-xl transition-all duration-300 shadow flex items-center justify-center gap-2 cursor-pointer"
										>
											{isCreating ? (
												<>
													<IonSpinner name="crescent" className="w-5 h-5 text-white" />
													<span>Creando grupo...</span>
												</>
											) : (
												<span>Crear grupo</span>
											)}
										</button>
									</form>
								) : (
									<div className="text-center space-y-6">
										<div className="py-4 px-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
											<p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
												¡Grupo creado exitosamente!
											</p>
											<p className="text-slate-200 text-xs">
												Comparte este código con tu pareja o miembros del grupo.
											</p>
										</div>

										<div className="space-y-2">
											<p className="text-slate-300 text-xs uppercase tracking-wider font-semibold">
												Código de Invitación
											</p>
											<p className="text-5xl font-mono font-black tracking-widest text-white py-4 bg-black/25 rounded-2xl select-all select-none border border-white/5">
												{createdGroup.code}
											</p>
										</div>

										<div className="flex gap-3">
											<button
												onClick={handleCopyCode}
												className="flex-1 py-3 bg-[#1899D5] hover:bg-[#1587be] font-bold rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-2 cursor-pointer"
											>
												<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
													<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v10.5c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.375Z" />
												</svg>
												<span>{copied ? '¡Copiado!' : 'Copiar'}</span>
											</button>

											{typeof navigator.share === 'function' && (
												<button
													onClick={handleShareCode}
													className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-2 cursor-pointer"
												>
													<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
														<path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186.003-.004c.007-.008.016-.017.026-.026l3.52-2.112a2.25 2.25 0 1 1 1.072 1.79l-3.52 2.112a2.25 2.25 0 0 1-1.072-1.79m0 2.186.003.004c.007.008.016.017.026.026l3.52 2.112a2.25 2.25 0 1 0 1.072-1.79l-3.52-2.112a2.25 2.25 0 0 0-1.072 1.79Z" />
													</svg>
													<span>Compartir</span>
												</button>
											)}
										</div>

										<button
											onClick={handleContinue}
											className="w-full py-4 bg-[#4BA32A] hover:bg-[#439225] font-extrabold rounded-xl transition-all duration-300 shadow flex items-center justify-center gap-2 cursor-pointer mt-4"
										>
											<span>Continuar a Inicio</span>
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
												<path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
											</svg>
										</button>
									</div>
								)}
							</div>
						)}

						{/* Sección: Unirme con Código */}
						{activeTab === 'join' && (
							<form onSubmit={handleJoinGroup} className="space-y-5">
								<div>
									<label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
										Introduce el código de 6 caracteres
									</label>
									<input
										type="text"
										value={joinCode}
										onChange={handleCodeInputChange}
										placeholder="EJ. AB12CD"
										maxLength={6}
										className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3.5 text-center font-mono text-2xl font-bold tracking-widest text-white placeholder-slate-500 focus:outline-none focus:border-[#A2308F] transition-colors"
									/>
									{joinError && (
										<div className="mt-2 text-red-400 text-xs text-left pl-1">
											{joinError}
										</div>
									)}
								</div>

								<button
									type="submit"
									disabled={isJoining || joinCode.length !== 6}
									className="w-full py-3.5 bg-[#A2308F] hover:bg-[#8e297d] disabled:opacity-50 font-bold rounded-xl transition-all duration-300 shadow flex items-center justify-center gap-2 cursor-pointer"
								>
									{isJoining ? (
										<>
											<IonSpinner name="crescent" className="w-5 h-5 text-white" />
											<span>Uniéndome al grupo...</span>
										</>
									) : (
										<span>Unirme al grupo</span>
									)}
								</button>
							</form>
						)}
					</div>
				</div>
			</IonContent>
		</IonPage>
	);
};

export default PairingPage;

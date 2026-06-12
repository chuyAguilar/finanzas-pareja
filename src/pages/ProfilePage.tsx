import React, { useState, useRef } from 'react';
import {
	IonContent,
	IonPage,
	IonSpinner,
	IonToast,
	IonAlert
} from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/api';

// ─── Paleta de colores disponibles para el selector ──────────────────────────
const COLOR_PALETTE = [
	'#1899D5',
	'#A2308F',
	'#4BA32A',
	'#FF5733',
	'#F1C40F',
	'#9B59B6',
	'#E67E22',
	'#2ECC71',
	'#E74C3C',
	'#34495E'
];

// ─── Helper: iniciales a partir del nombre ────────────────────────────────────
const getInitials = (name: string): string => {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─── Helper: redimensionar imagen a 256x256 JPEG base64 ──────────────────────
const resizeImageToBase64 = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				const SIZE = 256;
				const canvas = document.createElement('canvas');
				canvas.width = SIZE;
				canvas.height = SIZE;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('No se pudo crear el contexto del canvas'));
					return;
				}
				// Recorte cuadrado centrado
				const minDim = Math.min(img.width, img.height);
				const sx = (img.width - minDim) / 2;
				const sy = (img.height - minDim) / 2;
				ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, SIZE, SIZE);
				resolve(canvas.toDataURL('image/jpeg', 0.8));
			};
			img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
			img.src = e.target?.result as string;
		};
		reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
		reader.readAsDataURL(file);
	});

// ─── Subcomponente Avatar ─────────────────────────────────────────────────────
const Avatar: React.FC<{
	avatarUrl?: string | null;
	name: string;
	color: string;
	size?: 'lg' | 'sm';
}> = ({ avatarUrl, name, color, size = 'lg' }) => {
	const dim = size === 'lg' ? 'w-24 h-24 text-3xl' : 'w-9 h-9 text-sm';
	if (avatarUrl) {
		return (
			<img
				src={avatarUrl}
				alt={name}
				className={`${dim} rounded-full object-cover border-2 border-white/20 shadow-lg flex-shrink-0`}
			/>
		);
	}
	return (
		<div
			className={`${dim} rounded-full flex items-center justify-center font-extrabold text-white border-2 border-white/20 shadow-lg flex-shrink-0`}
			style={{ backgroundColor: color }}
		>
			{getInitials(name)}
		</div>
	);
};

// ─── Componente Principal ─────────────────────────────────────────────────────
const ProfilePage: React.FC = () => {
	const { user, group, setUser, logout } = useAuth();

	// ── Estados de UI
	const [isSavingAvatar, setIsSavingAvatar] = useState(false);
	const [isSavingName, setIsSavingName] = useState(false);
	const [isSavingColor, setIsSavingColor] = useState<string | null>(null);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [showLogoutAlert, setShowLogoutAlert] = useState(false);

	// ── Edición de nombre inline
	const [editingName, setEditingName] = useState(false);
	const [nameInput, setNameInput] = useState(user?.username ?? '');

	// ── Copiar código
	const [copied, setCopied] = useState(false);

	// ── Toast
	const [toastMsg, setToastMsg] = useState<string | null>(null);

	// ── Input de archivo oculto
	const fileInputRef = useRef<HTMLInputElement>(null);

	if (!user) return null;

	// ── Handlers ──────────────────────────────────────────────────────────────

	const showToast = (msg: string) => setToastMsg(msg);

	const handleAvatarClick = () => fileInputRef.current?.click();

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		// Reset input para permitir re-subir el mismo archivo
		e.target.value = '';
		setIsSavingAvatar(true);
		try {
			const base64 = await resizeImageToBase64(file);
			const updated = await apiService.updateUser(user.id, { avatarUrl: base64 });
			setUser(updated);
			showToast('Foto de perfil actualizada ✓');
		} catch (err: any) {
			console.error('[ProfilePage] Error al subir avatar:', err);
			showToast('Error al actualizar la foto.');
		} finally {
			setIsSavingAvatar(false);
		}
	};

	const handleSaveName = async () => {
		const trimmed = nameInput.trim();
		if (!trimmed || trimmed === user.username) {
			setEditingName(false);
			setNameInput(user.username);
			return;
		}
		setIsSavingName(true);
		try {
			const updated = await apiService.updateUser(user.id, { username: trimmed });
			setUser(updated);
			setEditingName(false);
			showToast('Nombre actualizado ✓');
		} catch (err: any) {
			console.error('[ProfilePage] Error al actualizar nombre:', err);
			showToast('Error al actualizar el nombre.');
		} finally {
			setIsSavingName(false);
		}
	};

	const handleCancelName = () => {
		setEditingName(false);
		setNameInput(user.username);
	};

	const handleColorSelect = async (color: string) => {
		if (color === user.color) return;
		setIsSavingColor(color);
		try {
			const updated = await apiService.updateUser(user.id, { color });
			setUser(updated);
			showToast('Color actualizado ✓');
		} catch (err: any) {
			console.error('[ProfilePage] Error al actualizar color:', err);
			showToast('Error al actualizar el color.');
		} finally {
			setIsSavingColor(null);
		}
	};

	const handleCopyCode = async () => {
		if (!group) return;
		try {
			await navigator.clipboard.writeText(group.code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			showToast('No se pudo copiar el código.');
		}
	};

	const handleShareCode = async () => {
		if (!group) return;
		try {
			if (typeof navigator.share === 'function') {
				await navigator.share({
					title: 'Únete a mi grupo de finanzas',
					text: `¡Únete al grupo "${group.name}"! Código: ${group.code}`,
					url: window.location.origin
				});
			} else {
				handleCopyCode();
			}
		} catch {
			// ignorar cancelaciones del diálogo nativo
		}
	};

	const handleLogout = async () => {
		setIsLoggingOut(true);
		try {
			await logout();
			// Recarga completa: limpia estado del router de Ionic, caché de vistas
			// y contextos. Es el comportamiento correcto y esperado al cerrar sesión.
			window.location.href = '/login';
		} catch (err) {
			console.error('[ProfilePage] Error al cerrar sesión:', err);
			setIsLoggingOut(false);
		}
	};

	// ── Render ────────────────────────────────────────────────────────────────
	return (
		<IonPage>
			<IonContent scrollY={true}>
				<div className="min-h-full bg-[#17597F] text-white pb-28">

					{/* ── Encabezado Verde ── */}
					<div className="bg-[#4BA32A] text-white pt-10 pb-5 px-6 shadow-md">
						<h1 className="text-xl font-extrabold tracking-tight">Mi Perfil</h1>
						<p className="text-white/70 text-xs mt-0.5">Gestiona tu información personal y tu grupo</p>
					</div>

					<div className="px-4 pt-5 space-y-5">

						{/* ── SECCIÓN: MI PERFIL ── */}
						<div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl">
							<h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5">
								Mi Perfil
							</h2>

							{/* Avatar + botón cambiar foto */}
							<div className="flex flex-col items-center gap-3 mb-6">
								<div className="relative">
									<Avatar
										avatarUrl={user.avatarUrl}
										name={user.username}
										color={user.color}
										size="lg"
									/>
									{isSavingAvatar && (
										<div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
											<IonSpinner name="crescent" className="text-white w-6 h-6" />
										</div>
									)}
								</div>
								<button
									onClick={handleAvatarClick}
									disabled={isSavingAvatar}
									className="px-4 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-xs font-bold rounded-full transition-colors cursor-pointer"
								>
									{isSavingAvatar ? 'Subiendo...' : 'Cambiar foto'}
								</button>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={handleFileChange}
								/>
							</div>

							{/* Nombre de usuario editable */}
							<div className="mb-5">
								<p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
									Nombre de usuario
								</p>
								{editingName ? (
									<div className="flex gap-2 items-center">
										<input
											autoFocus
											type="text"
											value={nameInput}
											onChange={(e) => setNameInput(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter') handleSaveName();
												if (e.key === 'Escape') handleCancelName();
											}}
											className="flex-1 bg-slate-900/60 border border-slate-600 focus:border-[#1899D5] rounded-xl px-4 py-2.5 text-white text-sm font-semibold outline-none transition-colors"
										/>
										<button
											onClick={handleSaveName}
											disabled={isSavingName}
											className="px-3 py-2.5 bg-[#4BA32A] hover:bg-[#439225] disabled:opacity-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
										>
											{isSavingName ? <IonSpinner name="crescent" className="w-4 h-4" /> : '✓'}
										</button>
										<button
											onClick={handleCancelName}
											className="px-3 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors cursor-pointer"
										>
											✕
										</button>
									</div>
								) : (
									<div className="flex items-center justify-between gap-3">
										<span className="text-white font-semibold text-sm">{user.username}</span>
										<button
											onClick={() => {
												setNameInput(user.username);
												setEditingName(true);
											}}
											className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
											title="Editar nombre"
										>
											{/* Ícono lápiz SVG */}
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
												<path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
											</svg>
										</button>
									</div>
								)}
							</div>

							{/* Selector de color */}
							<div>
								<p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
									Color de identificación
								</p>
								<div className="flex flex-wrap gap-3">
									{COLOR_PALETTE.map((color) => {
										const isActive = color === user.color;
										const isSaving = isSavingColor === color;
										return (
											<button
												key={color}
												onClick={() => handleColorSelect(color)}
												disabled={isSavingColor !== null}
												title={color}
												className="relative w-9 h-9 rounded-full border-2 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center"
												style={{
													backgroundColor: color,
													borderColor: isActive ? 'white' : 'transparent',
													boxShadow: isActive ? '0 0 0 2px rgba(255,255,255,0.3)' : 'none'
												}}
											>
												{isSaving ? (
													<IonSpinner name="crescent" className="w-4 h-4 text-white" />
												) : isActive ? (
													<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-4 h-4 drop-shadow">
														<path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
													</svg>
												) : null}
											</button>
										);
									})}
								</div>
							</div>
						</div>

						{/* ── SECCIÓN: MI GRUPO ── */}
						{group ? (
							<div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl">
								<h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5">
									Mi Grupo
								</h2>

								{/* Nombre del grupo */}
								<p className="text-white font-extrabold text-lg mb-1">{group.name}</p>

								{/* Código de invitación */}
								<div className="mb-4">
									<p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
										Código de invitación
									</p>
									<p className="text-4xl font-mono font-black tracking-widest text-white py-3 bg-black/25 rounded-2xl text-center border border-white/5 select-all">
										{group.code}
									</p>
								</div>

								{/* Botones copiar / compartir */}
								<div className="flex gap-3 mb-5">
									<button
										id="btn-copy-code"
										onClick={handleCopyCode}
										className="flex-1 py-2.5 bg-[#1899D5] hover:bg-[#1587be] font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
									>
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
											<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v10.5c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.375Z" />
										</svg>
										<span>{copied ? '¡Copiado!' : 'Copiar código'}</span>
									</button>

									{typeof navigator.share === 'function' && (
										<button
											onClick={handleShareCode}
											className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
										>
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
												<path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186.003-.004c.007-.008.016-.017.026-.026l3.52-2.112a2.25 2.25 0 1 1 1.072 1.79l-3.52 2.112a2.25 2.25 0 0 1-1.072-1.79m0 2.186.003.004c.007.008.016.017.026.026l3.52 2.112a2.25 2.25 0 1 0 1.072-1.79l-3.52-2.112a2.25 2.25 0 0 0-1.072 1.79Z" />
											</svg>
											<span>Compartir</span>
										</button>
									)}
								</div>

								{/* Lista de miembros */}
								<div>
									<p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
										Miembros ({group.members.length})
									</p>
									<div className="space-y-2">
										{group.members.map((member) => (
											<div
												key={member.id}
												className="flex items-center gap-3 py-2.5 px-3 bg-black/15 rounded-xl"
											>
												<Avatar
													avatarUrl={member.avatarUrl}
													name={member.username}
													color={member.color}
													size="sm"
												/>
												<span className="font-semibold text-sm flex-1 truncate">
													{member.id === user.id ? `${member.username} (Tú)` : member.username}
												</span>
												<div
													className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0"
													style={{ backgroundColor: member.color }}
												/>
											</div>
										))}
									</div>
								</div>
							</div>
						) : (
							<div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-6 text-center">
								<p className="text-slate-400 text-sm">No perteneces a ningún grupo aún.</p>
							</div>
						)}

						{/* ── CERRAR SESIÓN ── */}
						<button
							id="btn-logout"
							onClick={() => setShowLogoutAlert(true)}
							disabled={isLoggingOut}
							className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 disabled:opacity-50 text-red-400 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
						>
							{isLoggingOut ? (
								<IonSpinner name="crescent" className="w-5 h-5" />
							) : (
								<>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
										<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
									</svg>
									<span>Cerrar sesión</span>
								</>
							)}
						</button>

					</div>
				</div>

				{/* ── Toast de confirmación ── */}
				<IonToast
					isOpen={toastMsg !== null}
					message={toastMsg ?? ''}
					duration={2500}
					position="bottom"
					onDidDismiss={() => setToastMsg(null)}
					style={{ '--background': '#1e3a4a', '--color': 'white', '--border-radius': '12px' }}
				/>

				{/* ── Alert de confirmación de cierre de sesión ── */}
				<IonAlert
					isOpen={showLogoutAlert}
					onDidDismiss={() => setShowLogoutAlert(false)}
					header="Cerrar sesión"
					message="¿Estás seguro de que quieres cerrar sesión?"
					buttons={[
						{
							text: 'Cancelar',
							role: 'cancel'
						},
						{
							text: 'Cerrar sesión',
							role: 'destructive',
							handler: handleLogout
						}
					]}
				/>

			</IonContent>
		</IonPage>
	);
};

export default ProfilePage;

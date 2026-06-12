import React, { useState, useRef } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { IonContent, IonPage, IonSpinner, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonToast } from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/api';

// Helper: redimensionar imagen a máx 1024px en su lado más largo, JPEG calidad 0.7, base64
const resizeTransactionImage = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				const MAX_SIZE = 1024;
				let width = img.width;
				let height = img.height;

				if (width > MAX_SIZE || height > MAX_SIZE) {
					if (width > height) {
						height = Math.round((height * MAX_SIZE) / width);
						width = MAX_SIZE;
					} else {
						width = Math.round((width * MAX_SIZE) / height);
						height = MAX_SIZE;
					}
				}

				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('No se pudo crear el contexto del canvas'));
					return;
				}
				ctx.drawImage(img, 0, 0, width, height);
				resolve(canvas.toDataURL('image/jpeg', 0.7));
			};
			img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
			img.src = e.target?.result as string;
		};
		reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
		reader.readAsDataURL(file);
	});

const TransactionFormPage: React.FC = () => {
	const { user, group } = useAuth();
	const location = useLocation();
	const history = useHistory();

	// Parsear query parameters (?type=income/expense&date=YYYY-MM-DD)
	const queryParams = new URLSearchParams(location.search);
	const type = (queryParams.get('type') as 'income' | 'expense') || 'income';
	const queryDate = queryParams.get('date') || new Date().toISOString().split('T')[0];

	// Form states
	const [amountStr, setAmountStr] = useState<string>('');
	const [description, setDescription] = useState<string>('');
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		e.target.value = ''; // Permite volver a seleccionar el mismo archivo
		setIsProcessingImage(true);
		setError(null);
		try {
			const base64 = await resizeTransactionImage(file);
			setImageUrl(base64);
		} catch (err: any) {
			console.error('[TransactionFormPage] Error al procesar imagen:', err);
			setError('No se pudo procesar la imagen seleccionada.');
		} finally {
			setIsProcessingImage(false);
		}
	};

	const handleRemoveImage = () => {
		setImageUrl(null);
	};

	// Determinar colores y textos por tipo
	const isIncome = type === 'income';
	const headerColorClass = isIncome ? 'bg-[#4BA32A]' : 'bg-[#A2308F]';
	const actionColorClass = isIncome ? 'bg-[#4BA32A] hover:bg-[#439225]' : 'bg-[#A2308F] hover:bg-[#8e297d]';
	const titleText = isIncome ? 'Nuevo Ingreso' : 'Nuevo Egreso';

	// Validar monto
	const numericAmount = parseFloat(amountStr);
	const isAmountValid = !isNaN(numericAmount) && numericAmount > 0;

	// Formatear fecha para mostrar
	const formatDateString = (dateStr: string) => {
		try {
			const [year, month, day] = dateStr.split('-').map(Number);
			// Usar UTC o constructor manual local para evitar descalces por zona horaria
			const dateObj = new Date(year, month - 1, day);
			return dateObj.toLocaleDateString('es-MX', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			});
		} catch (err) {
			return dateStr;
		}
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) {
			setError('No se pudo identificar la sesión de usuario activa.');
			return;
		}
		if (!group) {
			setError('No se encontró ningún grupo activo para este usuario.');
			return;
		}
		if (!isAmountValid) {
			setError('El monto ingresado debe ser mayor a cero.');
			return;
		}

		setError(null);
		setIsSaving(true);
		try {
			await apiService.createTransaction({
				groupId: group.id,
				userId: user.id,
				type,
				amount: numericAmount,
				description: description.trim() || undefined,
				imageUrl: imageUrl || undefined,
				date: queryDate
			});
			
			// Volver al home con el query param de la fecha para mantener la vista seleccionada
			history.replace(`/home?date=${queryDate}`);
		} catch (err: any) {
			console.error('[TransactionFormPage] Error al guardar transaccion:', err);
			setError(err.message || 'Error al guardar la transacción. Intenta de nuevo.');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar className={`${headerColorClass} text-white`}>
					<IonButtons slot="start">
						<IonBackButton defaultHref="/home" className="text-white" />
					</IonButtons>
					<IonTitle className="font-extrabold text-white">{titleText}</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent scrollY={true}>
				<div className="min-h-full bg-[#17597F] text-white p-6 flex flex-col justify-between">
					<form onSubmit={handleSave} className="space-y-6 flex-1 flex flex-col justify-between">
						
						<div className="space-y-6">
							{/* Mostrar fecha de la transacción */}
							<div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center">
								<span className="text-xs uppercase tracking-wider text-slate-300 font-bold">Fecha del Registro</span>
								<span className="text-sm font-semibold">{formatDateString(queryDate)}</span>
							</div>

							{/* Campo Monto - Tipo Calculadora */}
							<div className="bg-black/25 rounded-3xl p-6 border border-white/5 text-center flex flex-col items-center">
								<span className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-2">Monto de la Transacción</span>
								<div className="flex items-center justify-center w-full max-w-xs relative">
									<span className="text-4xl font-extrabold text-slate-300 mr-1">$</span>
									<input
										type="number"
										inputMode="decimal"
										step="any"
										value={amountStr}
										onChange={(e) => setAmountStr(e.target.value)}
										placeholder="0.00"
										className="w-full bg-transparent text-white text-5xl font-black text-center font-mono focus:outline-none placeholder-slate-600"
										autoFocus
										required
									/>
								</div>
							</div>

							{/* Campo Descripción */}
							<div>
								<label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
									Descripción / Nota (Opcional)
								</label>
								<textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Ej. Compras del súper, Cena aniversario, Pago de renta..."
									rows={3}
									className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:border-[#1899D5] transition-colors resize-none"
								/>
							</div>

							{/* Botón Adjuntar Imagen */}
							<div>
								<input
									type="file"
									accept="image/*"
									ref={fileInputRef}
									onChange={handleFileChange}
									style={{ display: 'none' }}
								/>
								
								{!imageUrl ? (
									<button
										type="button"
										onClick={() => fileInputRef.current?.click()}
										disabled={isProcessingImage}
										className="w-full py-3 bg-white/5 border border-dashed border-white/20 text-slate-300 hover:bg-white/10 active:bg-white/15 font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
									>
										{isProcessingImage ? (
											<>
												<IonSpinner name="crescent" className="w-5 h-5 text-white" />
												<span>Procesando imagen...</span>
											</>
										) : (
											<>
												<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
													<path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
													<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
												</svg>
												<span>Adjuntar imagen (opcional)</span>
											</>
										)}
									</button>
								) : (
									<div className="rounded-2xl overflow-hidden border border-white/10 bg-black/25 p-4 flex flex-col items-center gap-3 w-full">
										<img
											src={imageUrl}
											alt="Vista previa adjunto"
											className="max-h-48 w-auto object-contain rounded-xl"
										/>
										<button
											type="button"
											onClick={handleRemoveImage}
											className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
											title="Quitar imagen"
										>
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
												<path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
											</svg>
											<span>Quitar Imagen</span>
										</button>
									</div>
								)}
							</div>

							{error && (
								<div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs text-center">
									{error}
								</div>
							)}
						</div>

						{/* Botón de Guardar */}
						<div className="pt-6">
							<button
								type="submit"
								disabled={isSaving || !isAmountValid}
								className={`w-full py-4 ${actionColorClass} disabled:opacity-40 text-white font-extrabold rounded-2xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer`}
							>
								{isSaving ? (
									<>
										<IonSpinner name="crescent" className="w-5 h-5 text-white" />
										<span>Guardando transacción...</span>
									</>
								) : (
									<span>Guardar</span>
								)}
							</button>
						</div>
					</form>
				</div>
			</IonContent>
			<IonToast
				isOpen={!!error}
				message={error || ''}
				duration={3000}
				onDidDismiss={() => setError(null)}
				color="danger"
			/>
		</IonPage>
	);
};

export default TransactionFormPage;

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import {
	IonContent,
	IonPage,
	IonSpinner,
	IonRefresher,
	IonRefresherContent,
	IonFab,
	IonFabButton,
	IonIcon,
	IonList,
	IonItemSliding,
	IonItem,
	IonItemOptions,
	IonItemOption,
	IonAlert,
	IonModal,
	useIonViewWillEnter
} from '@ionic/react';
import { addOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/api';
import { DaySummary } from '../types';
import TransactionTypeModal from '../components/TransactionTypeModal';
import { addDays, todayStr } from '../utils/dates';

const HomePage: React.FC = () => {
	const { user, group } = useAuth();
	const location = useLocation();
	const history = useHistory();

	// Obtener fecha inicial (si viene de volver del formulario)
	const queryParams = new URLSearchParams(location.search);
	const initialDate = queryParams.get('date') || todayStr();

	// Estados
	const [selectedDate, setSelectedDate] = useState<string>(initialDate);
	const [summary, setSummary] = useState<DaySummary | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
	const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
	
	// Estado para confirmación de eliminación
	const [txToDelete, setTxToDelete] = useState<string | null>(null);
	const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false);

	// Fetch de datos
	const fetchSummary = useCallback(async (showSpinner = true) => {
		if (!group) return;
		if (showSpinner) setLoading(true);
		setError(null);
		try {
			const data = await apiService.getDaySummary(group.id, selectedDate);
			setSummary(data);
		} catch (err: any) {
			console.error('[HomePage] Error al obtener resumen diario:', err);
			setError(err.message || 'Error al conectar con el servidor.');
		} finally {
			setLoading(false);
		}
	}, [group, selectedDate]);

	// Cargar datos al cambiar fecha o grupo
	useEffect(() => {
		fetchSummary(true);
	}, [fetchSummary]);

	// Sincronizar fecha si cambia la URL (por ejemplo, al volver de crear transacciones con query param)
	useEffect(() => {
		const queryParams = new URLSearchParams(location.search);
		const dateParam = queryParams.get('date');
		if (dateParam && dateParam !== selectedDate) {
			setSelectedDate(dateParam);
		}
	}, [location.search, selectedDate]);

	// Guardar la referencia más reciente del fetchSummary para evitar cierres obsoletos (stale closures) en useIonViewWillEnter
	const fetchSummaryRef = useRef(fetchSummary);
	useEffect(() => {
		fetchSummaryRef.current = fetchSummary;
	}, [fetchSummary]);

	// Recargar datos cada vez que la vista entra (resuelve problemas de caché de páginas en Ionic)
	useIonViewWillEnter(() => {
		fetchSummaryRef.current(false);
	});

	// Recarga por pull-to-refresh
	const handleRefresh = async (e: CustomEvent) => {
		await fetchSummary(false);
		e.detail.complete();
	};

	// Aumentar o disminuir 1 día
	const handleNavigateDate = (days: number) => {
		const newDate = addDays(selectedDate, days);
		history.push(`/home?date=${newDate}`);
	};

	// Eliminar transacción
	const handleDeleteTx = async () => {
		if (!txToDelete) return;
		try {
			await apiService.deleteTransaction(txToDelete);
			setTxToDelete(null);
			fetchSummary(false);
		} catch (err: any) {
			console.error('[HomePage] Error al eliminar transaccion:', err);
			setError(err.message || 'Error al eliminar la transacción.');
		}
	};

	const formatCurrency = (val: number) => {
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN'
		}).format(val);
	};

	const formatDateHeader = (dateStr: string) => {
		try {
			const [year, month, day] = dateStr.split('-').map(Number);
			const dateObj = new Date(year, month - 1, day);
			return dateObj.toLocaleDateString('es-ES', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			});
		} catch (err) {
			return dateStr;
		}
	};

	return (
		<IonPage>
			{/* Encabezado Verde */}
			<div className="bg-[#4BA32A] text-white pt-10 pb-4 px-6 flex items-center justify-between shadow-md">
				<button
					onClick={() => handleNavigateDate(-1)}
					className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
				>
					<IonIcon icon={chevronBackOutline} className="w-5 h-5" />
				</button>
				<h2 className="text-lg font-extrabold capitalize">
					{formatDateHeader(selectedDate)}
				</h2>
				<button
					onClick={() => handleNavigateDate(1)}
					disabled={selectedDate >= todayStr()}
					className={`p-2 bg-white/10 rounded-full transition-colors ${selectedDate >= todayStr() ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20 cursor-pointer'}`}
				>
					<IonIcon icon={chevronForwardOutline} className="w-5 h-5" />
				</button>
			</div>

			<IonContent scrollY={true}>
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent pullingText="Desliza para actualizar" refreshingSpinner="crescent" />
				</IonRefresher>

				<div className="min-h-full bg-[#17597F] text-white p-6 pb-28">
					{loading && !summary ? (
						<div className="flex flex-col items-center justify-center py-20">
							<IonSpinner name="crescent" className="w-10 h-10 text-white mb-2" />
							<p className="text-slate-300 text-sm">Cargando transacciones...</p>
						</div>
					) : error ? (
						<div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm text-center mb-6">
							{error}
							<button onClick={() => fetchSummary(true)} className="block mx-auto mt-2 text-white underline text-xs">
								Intentar de nuevo
							</button>
						</div>
					) : (
						<>
							{/* Tarjeta de Balance Negra */}
							<div className="bg-black/80 text-white p-6 rounded-2xl shadow-xl border border-white/5 flex flex-col items-center justify-center mb-6">
								<span className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Balance Neto del Día</span>
								<h3 className={`text-3xl font-black ${(summary?.balance ?? 0) >= 0 ? 'text-[#4BA32A]' : 'text-red-400'}`}>
									{formatCurrency(summary?.balance ?? 0)}
								</h3>
							</div>

							{/* Grid de Miembros del Grupo */}
							<div className="grid grid-cols-2 gap-4 mb-6">
								{summary?.perUser.map((member) => (
									<div
										key={member.userId}
										style={{ backgroundColor: member.color }}
										className="rounded-2xl p-4 text-white shadow-lg flex flex-col justify-between aspect-video relative overflow-hidden"
									>
										<div className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-white/40" />
										<span className="font-extrabold text-sm tracking-tight mb-2 block truncate">
											{member.userId === user?.id ? 'Tú' : member.username}
										</span>
										<div className="space-y-0.5 text-xs">
											<div className="flex justify-between font-semibold">
												<span className="opacity-80">Ingresos:</span>
												<span>+{formatCurrency(member.income)}</span>
											</div>
											<div className="flex justify-between font-semibold">
												<span className="opacity-80">Egresos:</span>
												<span>-{formatCurrency(member.expense)}</span>
											</div>
										</div>
									</div>
								))}
							</div>

							{/* Lista de Transacciones */}
							<div className="space-y-3">
								<h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Movimientos del Día</h4>
								{summary?.transactions && summary.transactions.length > 0 ? (
									<div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
										<IonList className="bg-transparent p-0" style={{ background: 'transparent' }}>
											{summary.transactions.map((tx) => {
												const isOwn = tx.userId === user?.id;
												const isInc = tx.type === 'income';
												
												return (
													<IonItemSliding key={tx.id} disabled={!isOwn}>
														<IonItem
															className="bg-transparent text-white"
															style={{
																'--background': 'transparent',
																'--color': 'white',
																'--inner-padding-end': '0px',
																'--padding-start': '0px'
															}}
														>
															<div className="flex items-center justify-between w-full py-4 px-4 hover:bg-white/5 transition-colors border-b border-white/5">
																<div className="flex items-center gap-3">
																	{/* Círculo indicador de autor */}
																	<div
																		style={{ backgroundColor: tx.color }}
																		className="w-3.5 h-3.5 rounded-full border border-white/10 flex-shrink-0"
																		title={tx.username}
																	/>
																	<div className="flex flex-col">
																		<span className={`text-xs font-bold ${isOwn ? 'text-slate-300' : 'text-slate-400'}`}>
																			{tx.username}
																		</span>
																		<span className="text-sm font-semibold max-w-[150px] md:max-w-xs truncate">
																			{tx.description || <span className="text-slate-400 font-normal italic">Sin descripción</span>}
																		</span>
																	</div>
																</div>

																<div className="flex items-center gap-2">
																	{tx.imageUrl && (
																		<button
																			onClick={(e) => {
																				e.stopPropagation();
																				setSelectedImageUrl(tx.imageUrl || null);
																			}}
																			className="tx-thumbnail-btn w-8 h-8 rounded-lg overflow-hidden border border-white/20 flex-shrink-0 flex items-center justify-center bg-black/40 hover:opacity-80 transition-opacity mr-1 cursor-pointer"
																			title="Ver imagen adjunta"
																		>
																			<img src={tx.imageUrl} alt="Adjunto" className="w-full h-full object-cover" />
																		</button>
																	)}
																	<span className={`text-sm font-extrabold ${isInc ? 'text-[#4BA32A]' : 'text-red-400'}`}>
																		{isInc ? '+' : '-'}{formatCurrency(tx.amount)}
																	</span>
																	{/* Mostrar botón eliminar si es own y no deslizan */}
																	{isOwn && (
																		<button
																			onClick={() => {
																				setTxToDelete(tx.id);
																				setShowDeleteAlert(true);
																			}}
																			className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors cursor-pointer md:block hidden"
																		>
																			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
																				<path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
																			</svg>
																		</button>
																	)}
																</div>
															</div>
														</IonItem>

														{isOwn && (
															<IonItemOptions side="end">
																<IonItemOption
																	color="danger"
																	className="font-bold text-xs"
																	onClick={() => {
																		setTxToDelete(tx.id);
																		setShowDeleteAlert(true);
																	}}
																>
																	Eliminar
																</IonItemOption>
															</IonItemOptions>
														)}
													</IonItemSliding>
												);
											})}
										</IonList>
									</div>
								) : (
									<div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 text-center">
										<p className="text-slate-400 text-sm">No hay transacciones registradas en este día.</p>
									</div>
								)}
							</div>
						</>
					)}
				</div>

				{/* Botón FAB Flotante */}
				{selectedDate <= todayStr() && (
					<IonFab vertical="bottom" horizontal="center" slot="fixed" className="mb-4">
						<IonFabButton
							onClick={() => setIsSelectorOpen(true)}
							className="cursor-pointer"
							style={{
								'--background': '#1899D5',
								'--background-hover': '#1587be',
								'--color': 'white'
							}}
						>
							<IonIcon icon={addOutline} className="w-6 h-6 text-white" />
						</IonFabButton>
					</IonFab>
				)}

				{/* Selector Modal */}
				<TransactionTypeModal
					isOpen={isSelectorOpen}
					onClose={() => setIsSelectorOpen(false)}
					selectedDate={selectedDate}
				/>

				{/* Diálogo de Confirmación */}
				<IonAlert
					isOpen={showDeleteAlert}
					onDidDismiss={() => {
						setShowDeleteAlert(false);
						setTxToDelete(null);
					}}
					header="Confirmar eliminación"
					message="¿Estás seguro de que deseas eliminar esta transacción? Esta acción no se puede deshacer."
					buttons={[
						{
							text: 'Cancelar',
							role: 'cancel',
							cssClass: 'secondary'
						},
						{
							text: 'Eliminar',
							handler: handleDeleteTx
						}
					]}
				/>

				{/* Modal de Imagen Completa */}
				<IonModal
					isOpen={!!selectedImageUrl}
					onDidDismiss={() => setSelectedImageUrl(null)}
					id="image-preview-modal"
				>
					<IonPage className="bg-[#17597F]">
						<div className="bg-[#17597F] text-white pt-10 pb-4 px-6 flex items-center justify-between shadow-md">
							<h2 className="text-lg font-extrabold">Imagen Adjunta</h2>
							<button
								onClick={() => setSelectedImageUrl(null)}
								id="btn-close-modal-top"
								className="px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl font-bold text-sm transition-all cursor-pointer"
							>
								Cerrar
							</button>
						</div>
						<IonContent className="--background-color: #17597F" scrollY={true}>
							<div className="h-full bg-[#17597F] p-6 flex flex-col justify-between items-center">
								<div className="flex-1 flex items-center justify-center w-full max-h-[70vh] overflow-hidden my-auto">
									{selectedImageUrl && (
										<img
											src={selectedImageUrl}
											alt="Imagen adjunta completa"
											className="max-w-full max-h-full object-contain rounded-2xl border border-white/10 shadow-2xl"
										/>
									)}
								</div>
								<div className="w-full mt-6 pb-6">
									<button
										onClick={() => setSelectedImageUrl(null)}
										id="btn-close-modal-bottom"
										className="w-full py-4 bg-white/10 hover:bg-white/20 active:bg-white/30 font-extrabold rounded-2xl transition-all shadow-lg flex items-center justify-center cursor-pointer"
									>
										Cerrar
									</button>
								</div>
							</div>
						</IonContent>
					</IonPage>
				</IonModal>
			</IonContent>
		</IonPage>
	);
};

export default HomePage;

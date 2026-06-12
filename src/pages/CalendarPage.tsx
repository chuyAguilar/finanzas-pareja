import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import {
	IonContent,
	IonPage,
	IonSpinner,
	IonRefresher,
	IonRefresherContent,
	IonIcon,
	useIonViewWillEnter
} from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/api';
import { MonthSummaryDay } from '../types';
import {
	getDaysInMonth,
	getFirstDayOfWeekOffset,
	formatMonthYearHeader,
	todayStr
} from '../utils/dates';

/**
 * Format a numeric amount to an abbreviated format (e.g. 1500 to "$1.5k", -800 to "-$800")
 */
const formatAbbreviated = (amount: number, type?: 'income' | 'expense' | 'balance'): string => {
	const abs = Math.abs(amount);
	let formatted = '';
	if (abs >= 1000) {
		formatted = (abs / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
	} else {
		formatted = String(abs);
	}

	if (type === 'income') {
		return `+$${formatted}`;
	} else if (type === 'expense') {
		return `-$${formatted}`;
	} else {
		return `${amount < 0 ? '-' : ''}$${formatted}`;
	}
};

const CalendarPage: React.FC = () => {
	const { group } = useAuth();
	const history = useHistory();

	// Initialize with today's local year and month
	const [initYear, initMonth] = todayStr().split('-').map(Number);
	const [currentYear, setCurrentYear] = useState<number>(initYear);
	const [currentMonth, setCurrentMonth] = useState<number>(initMonth);

	const [summary, setSummary] = useState<MonthSummaryDay[] | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch monthly summary data
	const fetchSummary = useCallback(async (showSpinner = true) => {
		if (!group) return;
		if (showSpinner) setLoading(true);
		setError(null);
		try {
			const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
			const data = await apiService.getMonthSummary(group.id, monthStr);
			setSummary(data);
		} catch (err: any) {
			console.error('[CalendarPage] Error al obtener resumen mensual:', err);
			setError(err.message || 'Error al conectar con el servidor.');
		} finally {
			setLoading(false);
		}
	}, [group, currentYear, currentMonth]);

	// Fetch data when year, month or group changes
	useEffect(() => {
		fetchSummary(true);
	}, [fetchSummary]);

	// Keep a ref to fetchSummary to prevent closures issue in Ionic hooks
	const fetchSummaryRef = useRef(fetchSummary);
	useEffect(() => {
		fetchSummaryRef.current = fetchSummary;
	}, [fetchSummary]);

	// Refresh data whenever the view is displayed (e.g., when switching tabs)
	useIonViewWillEnter(() => {
		fetchSummaryRef.current(false);
	});

	// Pull to refresh handler
	const handleRefresh = async (e: CustomEvent) => {
		await fetchSummary(false);
		e.detail.complete();
	};

	// Navigate to adjacent months
	const handleNavigateMonth = (direction: number) => {
		setCurrentMonth((prevMonth) => {
			let nextMonth = prevMonth + direction;
			let nextYear = currentYear;
			if (nextMonth > 12) {
				nextMonth = 1;
				nextYear += 1;
			} else if (nextMonth < 1) {
				nextMonth = 12;
				nextYear -= 1;
			}
			setCurrentYear(nextYear);
			return nextMonth;
		});
	};

	// Go back to the current month of today
	const handleGoToToday = () => {
		const [tY, tM] = todayStr().split('-').map(Number);
		setCurrentYear(tY);
		setCurrentMonth(tM);
	};

	// Construct calendar cell coordinates for the 6-week grid (42 days)
	const cells = React.useMemo(() => {
		const list = [];
		const totalDays = getDaysInMonth(currentYear, currentMonth);
		const startOffset = getFirstDayOfWeekOffset(currentYear, currentMonth);

		// Previous month parameters
		const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
		const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
		const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

		// Next month parameters
		const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
		const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

		// 1. Fill trailing days of the previous month
		for (let i = startOffset - 1; i >= 0; i--) {
			const d = daysInPrevMonth - i;
			const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			list.push({
				dateStr,
				dayNum: d,
				isCurrentMonth: false
			});
		}

		// 2. Fill days of the current month
		for (let d = 1; d <= totalDays; d++) {
			const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			list.push({
				dateStr,
				dayNum: d,
				isCurrentMonth: true
			});
		}

		// 3. Fill leading days of the next month to reach 42 total cells
		const remaining = 42 - list.length;
		for (let d = 1; d <= remaining; d++) {
			const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			list.push({
				dateStr,
				dayNum: d,
				isCurrentMonth: false
			});
		}

		return list;
	}, [currentYear, currentMonth]);

	// Convert summary array to a quick lookup map (date string -> summary info)
	const summaryMap = React.useMemo(() => {
		const map = new Map<string, MonthSummaryDay>();
		if (summary) {
			summary.forEach((day) => {
				map.set(day.date, day);
			});
		}
		return map;
	}, [summary]);

	return (
		<IonPage>
			{/* Encabezado Verde */}
			<div className="bg-[#4BA32A] text-white pt-10 pb-4 px-6 flex items-center justify-between shadow-md">
				<button
					onClick={() => handleNavigateMonth(-1)}
					className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
				>
					<IonIcon icon={chevronBackOutline} className="w-5 h-5" />
				</button>
				<h2 className="text-lg font-extrabold capitalize">
					{formatMonthYearHeader(currentYear, currentMonth)}
				</h2>
				<div className="flex items-center gap-2">
					<button
						onClick={handleGoToToday}
						className="px-3 py-1 bg-white/15 hover:bg-white/25 text-xs font-bold rounded-full transition-colors cursor-pointer"
					>
						Hoy
					</button>
					<button
						onClick={() => handleNavigateMonth(1)}
						className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
					>
						<IonIcon icon={chevronForwardOutline} className="w-5 h-5" />
					</button>
				</div>
			</div>

			<IonContent scrollY={true}>
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent pullingText="Desliza para actualizar" refreshingSpinner="crescent" />
				</IonRefresher>

				<div className="min-h-full bg-[#17597F] text-white p-4 pb-28">
					{!group ? (
						<div className="flex flex-col items-center justify-center py-20 px-6 text-center">
							<p className="text-slate-300 mb-4">No perteneces a ningún grupo de gastos actualmente.</p>
							<button
								onClick={() => history.replace('/pairing')}
								className="px-6 py-2.5 bg-[#1899D5] text-white font-bold rounded-xl hover:bg-[#1587be] transition-colors cursor-pointer"
							>
								Ir a emparejamiento
							</button>
						</div>
					) : loading && !summary ? (
						<div className="flex flex-col items-center justify-center py-20">
							<IonSpinner name="crescent" className="w-10 h-10 text-white mb-2" />
							<p className="text-slate-300 text-sm">Cargando calendario...</p>
						</div>
					) : error ? (
						<div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm text-center mb-6">
							{error}
							<button
								onClick={() => fetchSummary(true)}
								className="block mx-auto mt-2 text-white underline text-xs cursor-pointer"
							>
								Intentar de nuevo
							</button>
						</div>
					) : (
						<>
							{/* Cabecera del Calendario LUN-DOM */}
							<div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-wider text-slate-400 py-2 border-b border-white/10 mb-2">
								<div>Lun</div>
								<div>Mar</div>
								<div>Mié</div>
								<div>Jue</div>
								<div>Vie</div>
								<div>Sáb</div>
								<div>Dom</div>
							</div>

							{/* Cuadrícula del Calendario */}
							<div className="grid grid-cols-7 gap-1.5">
								{cells.map((cell) => {
									const dayData = summaryMap.get(cell.dateStr);
									const isToday = cell.dateStr === todayStr();

									return (
										<div
											key={cell.dateStr}
											onClick={() => history.push(`/home?date=${cell.dateStr}`)}
											className={`rounded-xl p-1.5 min-h-[85px] flex flex-col justify-between transition-all cursor-pointer ${
												cell.isCurrentMonth
													? 'bg-white/5 border border-white/10 hover:bg-white/10'
													: 'opacity-35 text-slate-400 bg-black/10 border border-white/5 hover:bg-white/5'
											} ${isToday ? 'border-2 border-[#1899D5]' : ''}`}
										>
											{/* Día */}
											<div className="flex justify-end">
												{isToday ? (
													<span className="w-5.5 h-5.5 flex items-center justify-center rounded-full bg-[#1899D5] text-white font-extrabold text-[11px]">
														{cell.dayNum}
													</span>
												) : (
													<span className="text-[11px] font-bold opacity-80">
														{cell.dayNum}
													</span>
												)}
											</div>

											{/* Datos */}
											<div className="min-h-[42px] flex flex-col justify-end">
												{dayData && (
													<div className="flex flex-col items-stretch w-full text-left space-y-0.5 overflow-hidden">
														<div className="text-[9px] font-black text-white truncate">
															{formatAbbreviated(dayData.balance)}
														</div>
														{dayData.income > 0 && (
															<div className="text-[8px] font-extrabold text-[#4BA32A] truncate">
																{formatAbbreviated(dayData.income, 'income')}
															</div>
														)}
														{dayData.expense > 0 && (
															<div className="text-[8px] font-extrabold text-[#A2308F] truncate">
																{formatAbbreviated(dayData.expense, 'expense')}
															</div>
														)}
													</div>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</>
					)}
				</div>
			</IonContent>
		</IonPage>
	);
};

export default CalendarPage;

import React from 'react';
import { useHistory } from 'react-router-dom';
import { IonModal } from '@ionic/react';

interface TransactionTypeModalProps {
	isOpen: boolean;
	onClose: () => void;
	selectedDate: string; // YYYY-MM-DD
}

export const TransactionTypeModal: React.FC<TransactionTypeModalProps> = ({ isOpen, onClose, selectedDate }) => {
	const history = useHistory();

	const handleSelectType = (type: 'income' | 'expense') => {
		onClose();
		history.push(`/transaction/new?type=${type}&date=${selectedDate}`);
	};

	return (
		<IonModal
			isOpen={isOpen}
			onDidDismiss={onClose}
			initialBreakpoint={0.35}
			breakpoints={[0, 0.35]}
			handle={true}
			handleBehavior="cycle"
		>
			<div className="bg-slate-900 text-white p-4 pb-6 h-full flex flex-col justify-start rounded-t-3xl border-t border-slate-700/50">
				{/* Encabezado del modal */}
				<div className="text-center mb-4 mt-2">
					<h3 className="text-base font-bold text-slate-100">¿Qué quieres registrar?</h3>
					<p className="text-slate-400 text-xs mt-0.5">Selecciona el tipo de movimiento</p>
				</div>

				{/* Botones Grandes Apilados */}
				<div className="flex flex-col gap-2.5">
					{/* Botón Ingreso */}
					<button
						onClick={() => handleSelectType('income')}
						className="w-full py-3 rounded-xl border border-[#4BA32A]/30 bg-[#4BA32A]/15 hover:bg-[#4BA32A]/25 transition-all duration-300 flex items-center justify-center gap-3 text-white font-bold cursor-pointer"
					>
						<div className="w-7 h-7 rounded-full bg-[#4BA32A] flex items-center justify-center shadow shadow-[#4BA32A]/30">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-white">
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
							</svg>
						</div>
						<span className="text-sm">Ingreso</span>
					</button>

					{/* Botón Egreso */}
					<button
						onClick={() => handleSelectType('expense')}
						className="w-full py-3 rounded-xl border border-[#A2308F]/30 bg-[#A2308F]/15 hover:bg-[#A2308F]/25 transition-all duration-300 flex items-center justify-center gap-3 text-white font-bold cursor-pointer"
					>
						<div className="w-7 h-7 rounded-full bg-[#A2308F] flex items-center justify-center shadow shadow-[#A2308F]/30">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-white">
								<path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
							</svg>
						</div>
						<span className="text-sm">Egreso</span>
					</button>
				</div>
			</div>
		</IonModal>
	);
};

export default TransactionTypeModal;

/**
 * Helper utilities for safe local date manipulations (YYYY-MM-DD format).
 * Always works in local time to prevent timezone and UTC offsets from shifting dates.
 */

/**
 * Returns today's local date string in YYYY-MM-DD format.
 */
export const todayStr = (): string => {
	const today = new Date();
	const yyyy = today.getFullYear();
	const mm = String(today.getMonth() + 1).padStart(2, '0');
	const dd = String(today.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
};

/**
 * Adds or subtracts days to/from a YYYY-MM-DD date string.
 * Returns the result in YYYY-MM-DD format.
 */
export const addDays = (dateStr: string, days: number): string => {
	const [year, month, day] = dateStr.split('-').map(Number);
	// Create Date object in local time (never use new Date(string) as it parses UTC)
	const dateObj = new Date(year, month - 1, day);
	dateObj.setDate(dateObj.getDate() + days);

	const yyyy = dateObj.getFullYear();
	const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
	const dd = String(dateObj.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
};

/**
 * Returns the number of days in the specified month (1-indexed).
 */
export const getDaysInMonth = (year: number, month: number): number => {
	return new Date(year, month, 0).getDate();
};

/**
 * Returns the starting day of the week offset for the 1st of the month.
 * Monday is 0, Sunday is 6.
 */
export const getFirstDayOfWeekOffset = (year: number, month: number): number => {
	const firstDay = new Date(year, month - 1, 1).getDay(); // 0 = Sunday, 1 = Monday, ...
	return firstDay === 0 ? 6 : firstDay - 1;
};

/**
 * Returns the name of the month in Spanish (1-indexed).
 */
export const getMonthNameSpanish = (month: number): string => {
	const monthNames = [
		'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
		'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
	];
	return monthNames[month - 1] || '';
};

/**
 * Formats a year and month (1-indexed) into "Mes Año" in Spanish (e.g. "Junio 2026").
 */
export const formatMonthYearHeader = (year: number, month: number): string => {
	return `${getMonthNameSpanish(month)} ${year}`;
};


/** Shared school calendar rules for Raili's Friday-through-Tuesday schedule. */
export const FIRST_SCHOOL_DAY = new Date(2026, 9, 16);

const schoolWeekdays = new Set([0, 1, 2, 5, 6]);

export function isSchoolDay(date) {
	return schoolWeekdays.has(date.getDay());
}

export function getSchoolWeekStartDate(date = new Date()) {
	const weekStart = new Date(date);
	weekStart.setHours(0, 0, 0, 0);
	if (weekStart < FIRST_SCHOOL_DAY) {
		return new Date(FIRST_SCHOOL_DAY);
	}
	weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() - 5 + 7) % 7));
	return weekStart;
}

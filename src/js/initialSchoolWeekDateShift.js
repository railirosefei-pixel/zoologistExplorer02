/** Move legacy school-week records onto October 16–20 without moving canonical October 16 data. */
const initialSchoolWeekDateKeys = new Map([
	["2026-10-12", "2026-10-16"],
	["2026-10-13", "2026-10-17"],
	["2026-10-14", "2026-10-18"],
	["2026-10-15", "2026-10-19"],
	["2026-10-05", "2026-10-16"],
	["2026-10-06", "2026-10-17"],
	["2026-10-07", "2026-10-18"],
	["2026-10-08", "2026-10-19"],
	["2026-10-09", "2026-10-20"],
]);

/** Shift a legacy date to its October 16–20 counterpart when it does not overlap October 16. */
export function shiftInitialSchoolWeekDateKey(dateKey) {
	return initialSchoolWeekDateKeys.get(dateKey) ?? dateKey;
}

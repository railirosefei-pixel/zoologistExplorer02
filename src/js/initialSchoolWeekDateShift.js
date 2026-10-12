/** Map the original school week to its October 12 start date. */
const initialSchoolWeekDateKeys = new Map([
	["2026-10-05", "2026-10-12"],
	["2026-10-06", "2026-10-13"],
	["2026-10-07", "2026-10-14"],
	["2026-10-08", "2026-10-15"],
	["2026-10-09", "2026-10-16"],
]);

/** Shift a date in the original school week to its October 12–16 counterpart. */
export function shiftInitialSchoolWeekDateKey(dateKey) {
	return initialSchoolWeekDateKeys.get(dateKey) ?? dateKey;
}

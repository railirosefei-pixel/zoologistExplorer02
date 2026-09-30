/**
 * Ruler-calibrated physical-unit conversions for the text editor.
 *
 * The px-per-unit constants below were measured by the user with the
 * calibration bar and are intentionally hardcoded so that browser cache
 * deletion cannot reset them. CSS pixels only (no device-pixel math);
 * the app-wide zoom lock keeps CSS px aligned with the calibration.
 */

/** CSS pixels per physical inch (project calibration). */
export const PIXELS_PER_INCH = 109;

/** CSS pixels per physical centimeter (derived from the 109 px/in calibration). */
export const PIXELS_PER_CM = 109 / 2.54;

/** CSS pixels per physical millimeter (derived from the 109 px/in calibration). */
export const PIXELS_PER_MM = 109 / 25.4;

const PIXELS_PER_UNIT = {
	px: 1,
	in: PIXELS_PER_INCH,
	cm: PIXELS_PER_CM,
	mm: PIXELS_PER_MM,
};

/**
 * Convert a value in the given unit to CSS pixels.
 * Returns 0 for missing, non-numeric, or negative input.
 *
 * @param {string|number} value - Numeric amount in the given unit.
 * @param {"px"|"in"|"cm"|"mm"} unit - Measurement unit of the value.
 * @returns {number} The length in CSS pixels.
 */
export function convertToPixels(value, unit) {
	const amount = Number.parseFloat(value);
	if (!Number.isFinite(amount) || amount <= 0) {
		return 0;
	}
	const pixelsPerUnit = PIXELS_PER_UNIT[unit];
	if (!pixelsPerUnit) {
		return 0;
	}
	return amount * pixelsPerUnit;
}

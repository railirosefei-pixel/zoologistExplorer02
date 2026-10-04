/**
 * Saved paper-template entries for the Text Editor.
 *
 * Storage schema:
 * {
 *   id: "tpl-<timestamp>-<4 random digits>",
 *   name: "Template name",
 *   createdAt: "<ISO date>",
 *   template: {
 *     html: "...",
 *     widthValue: "8",
 *     widthUnit: "in",
 *     heightValue: "10",
 *     heightUnit: "in",
 *     marginValues: { top: "0", bottom: "0", left: "0", right: "0" },
 *     marginVisibility: true,
 *     isShell: false,
 *     fontFamily: "...",
 *     fontSize: "...",
 *     fontColor: "...",
 *     textAlign: "...",
 *     padding: "..."
 *   }
 * }
 */

export const TEMPLATES_STORAGE_KEY = "ze2.textEditor.savedTemplates";

/**
 * Load saved template entries from storage.
 * @param {Storage | null | undefined} [storage = globalThis.localStorage]
 * @returns {Array<object>}
 */
export function loadSavedTemplates(storage = globalThis.localStorage) {
	if (!storage || typeof storage.getItem !== "function") {
		return [];
	}

	try {
		const rawValue = storage.getItem(TEMPLATES_STORAGE_KEY);
		if (!rawValue) {
			return [];
		}

		const parsed = JSON.parse(rawValue);
		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed.filter((entry) => entry && typeof entry === "object");
	} catch {
		return [];
	}
}

/**
 * Persist the list of saved template entries.
 * @param {Array<object>} list
 * @param {Storage | null | undefined} [storage = globalThis.localStorage]
 * @returns {boolean}
 */
export function saveSavedTemplates(list, storage = globalThis.localStorage) {
	if (!storage || typeof storage.setItem !== "function") {
		return false;
	}

	try {
		storage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(list));
		return true;
	} catch {
		return false;
	}
}

/**
 * Add a template entry to the saved list and persist it.
 * @param {object} entry
 * @param {Storage | null | undefined} [storage = globalThis.localStorage]
 * @returns {Array<object>}
 */
export function addSavedTemplate(entry, storage = globalThis.localStorage) {
	const nextList = [...loadSavedTemplates(storage), entry];
	saveSavedTemplates(nextList, storage);
	return nextList;
}

/**
 * Create a unique template ID.
 * @returns {string}
 */
export function makeTemplateId() {
	const randomValue = globalThis.crypto.getRandomValues(new Uint32Array(1))[0] % 9000;
	return `tpl-${Date.now()}-${randomValue + 1000}`;
}

/**
 * Build a normalized saved-template record.
 * @param {string} name
 * @param {object} snapshot
 * @returns {{ id: string, name: string, createdAt: string, template: object }}
 */
export function buildTemplateEntry(name, snapshot) {
	return {
		id: makeTemplateId(),
		name,
		createdAt: new Date().toISOString(),
		template: snapshot,
	};
}

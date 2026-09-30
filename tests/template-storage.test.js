import test from "node:test";
import assert from "node:assert/strict";

import {
	TEMPLATES_STORAGE_KEY,
	addSavedTemplate,
	buildTemplateEntry,
	loadSavedTemplates,
	makeTemplateId,
} from "../src/js/templateStorage.js";

function createMemoryStorage() {
	const values = new Map();
	return {
		getItem(key) {
			return values.has(key) ? values.get(key) : null;
		},
		setItem(key, value) {
			values.set(key, String(value));
		},
		removeItem(key) {
			values.delete(key);
		},
		clear() {
			values.clear();
		},
	};
}

test("loadSavedTemplates returns an empty array for empty storage", () => {
	const storage = createMemoryStorage();
	assert.deepEqual(loadSavedTemplates(storage), []);
	assert.equal(storage.getItem(TEMPLATES_STORAGE_KEY), null);
});

test("addSavedTemplate appends entries while preserving order", () => {
	const storage = createMemoryStorage();
	const first = buildTemplateEntry("First", { html: "<p>One</p>", widthValue: "8" });
	const second = buildTemplateEntry("Second", { html: "<p>Two</p>", widthValue: "10" });

	const afterFirst = addSavedTemplate(first, storage);
	const afterSecond = addSavedTemplate(second, storage);

	assert.deepEqual(afterFirst, [first]);
	assert.deepEqual(afterSecond, [first, second]);
	const stored = JSON.parse(storage.getItem(TEMPLATES_STORAGE_KEY));
	assert.equal(stored.length, 2);
	assert.equal(stored[0].name, "First");
	assert.equal(stored[1].name, "Second");
});

test("loadSavedTemplates handles corrupt JSON gracefully", () => {
	const storage = createMemoryStorage();
	storage.setItem(TEMPLATES_STORAGE_KEY, "not valid json");
	assert.deepEqual(loadSavedTemplates(storage), []);
});

test("buildTemplateEntry preserves the snapshot fields and creates a valid template id", () => {
	const snapshot = {
		html: "<p>Alpha</p>",
		widthValue: "5",
		widthUnit: "in",
		heightValue: "8",
		heightUnit: "in",
		fontFamily: "Arial",
		fontSize: "18px",
		fontColor: "#123456",
		textAlign: "center",
		padding: "12px",
	};

	const entry = buildTemplateEntry("Alpha 5in", snapshot);
	assert.match(entry.id, /^tpl-\d+-\d{4}$/);
	assert.equal(entry.name, "Alpha 5in");
	assert.ok(entry.createdAt);
	assert.deepEqual(entry.template, snapshot);
	assert.equal(makeTemplateId().startsWith("tpl-"), true);
});

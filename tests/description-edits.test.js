import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { nextTick } from "vue";
import { compileScript, compileTemplate, parse } from "vue/compiler-sfc";
import { blockDescriptionStore } from "../src/js/blockDescriptionState.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
	return readFileSync(join(repoRoot, relativePath), "utf8");
}

async function createDescriptionEditsView(emit = () => {}) {
	const { descriptor } = parse(readSource("src/components/StudentEditsView.vue"));
	const compiled = compileScript(descriptor, { id: "description-edits-test" });
	const script = compiled.content
		.replace('"vue"', JSON.stringify(import.meta.resolve("vue")))
		.replace(
			'"../js/blockCompletionState.js"',
			JSON.stringify(new URL("../src/js/blockCompletionState.js", import.meta.url).href),
		)
		.replace(
			'"../js/blockDescriptionState.js"',
			JSON.stringify(new URL("../src/js/blockDescriptionState.js", import.meta.url).href),
		);
	const { default: component } = await import(
		`data:text/javascript;base64,${Buffer.from(script).toString("base64")}`
	);
	return component.setup({}, { expose() {}, emit });
}

test("StudentEditsView.vue contains all Blocks menu and Description Edits ids", () => {
	const source = readSource("src/components/StudentEditsView.vue");
	const requiredIds = [
		"blocks-menu-button",
		"blocks-menu-sidebar",
		"description-edits-button",
		"description-edits-position-wrapper",
		"description-edits-panel-container",
		"description-edits-text-box",
		"description-edits-controls-row",
		"play-by-play-edits-commit-button",
		"play-by-play-edits-date-dropdown-button",
		"play-by-play-edits-subject-dropdown-button",
		"play-by-play-edits-block-dropdown-button",
		"play-by-play-edits-history-dropdown-button",
		"play-by-play-edits-remove-button",
		"description-edits-commit-button",
		"description-edits-date-dropdown-button",
		"description-edits-subject-dropdown-button",
		"description-edits-block-dropdown-button",
		"description-edits-history-dropdown-button",
		"description-edits-month-dropdown-button",
		"description-edits-day-dropdown-button",
		"description-edits-year-dropdown-button",
		"play-by-play-edits-month-dropdown-button",
		"play-by-play-edits-day-dropdown-button",
		"play-by-play-edits-year-dropdown-button",
		"blocks-screen-home-button",
		"blocks-screen-back-button",
	];
	for (const id of requiredIds) {
		assert.ok(source.includes(`id="${id}"`), `missing id "${id}" in StudentEditsView.vue`);
	}
	assert.match(
		source,
		/blocks-screen-home-button[\s\S]*@click="handleStudentEditsScreenHome"/,
		"Blocks Home button must use the home handler",
	);
	assert.match(
		source.match(/<button\b[^>]*id="blocks-screen-back-button"[^>]*>/)?.[0] ?? "",
		/@click="handleBlocksScreenBack"/,
		"Blocks Back button must use its one-screen-back handler",
	);
});

test("Blocks Back closes one layer without invoking parent or Home navigation", async () => {
	const events = [];
	const view = await createDescriptionEditsView((event) => events.push(event));
	view.isBlocksMenuOpen.value = true;
	view.isDescriptionEditsOpen.value = true;
	view.descriptionEditsMode.value = "description";

	view.handleBlocksScreenBack();
	assert.equal(view.isDescriptionEditsOpen.value, false);
	assert.equal(view.descriptionEditsMode.value, null);
	assert.equal(view.isBlocksMenuOpen.value, true);

	view.isBlockEditsOpen.value = true;
	view.handleBlocksScreenBack();
	assert.equal(view.isBlockEditsOpen.value, false);
	assert.equal(view.isBlocksMenuOpen.value, true);

	view.handleBlocksScreenBack();
	assert.equal(view.isBlocksMenuOpen.value, false);
	assert.deepEqual(events, []);

	view.handleStudentEditsScreenClose();
	assert.deepEqual(events, ["back-to-parent-menu"]);
});

for (const { name, label, handler } of [
	{ name: "subject", label: "Subject options", handler: "handleDescriptionEditsSubjectSelect(subject)" },
	{ name: "block", label: "Block options", handler: "handleDescriptionEditsBlockSelect(blockOption)" },
	{ name: "history", label: "Description history options", handler: "handleDescriptionEditsHistorySelect(entry)" },
	{ name: "month", label: "Month options", handler: "handleDescriptionEditsMonthSelect(month)" },
	{ name: "day", label: "Day options", handler: "handleDescriptionEditsDaySelect(day)" },
	{ name: "year", label: "Year options", handler: "handleDescriptionEditsYearSelect(year)" },
]) {
	test(`${name} options use a separately named native button group without listbox semantics`, () => {
		const source = readSource("src/components/StudentEditsView.vue");
		const cssSource = readSource("src/css/input.css");
		const selector = `description-edits-${name}-options-list`;
		const group = source.match(new RegExp(`<fieldset\\s+[^>]*id="${selector}"[^>]*>[\\s\\S]*?</fieldset>`));
		assert.ok(group, `${selector} must be a native fieldset`);
		assert.ok(group[0].includes(`class="${selector}"`));
		const accessibleLabel = group[0].match(/:?aria-label="([^"]*)"/);
		assert.ok(accessibleLabel, `${selector} must have an accessible name`);
		assert.ok(accessibleLabel[1].includes(label));
		assert.ok(group[0].includes(`@click="${handler}"`));
		assert.doesNotMatch(group[0], /role="(?:listbox|option)"/);
		const styles = cssSource.match(new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`));
		assert.ok(styles, `${selector} must retain its own CSS rule`);
		assert.match(styles[1], /margin:\s*0;/);
		assert.match(styles[1], /padding:\s*0;/);
		assert.match(styles[1], /min-width:\s*0;/);
	});
}

test("Description and Play by Play menus own separate controls and option-menu identities", () => {
	const source = readSource("src/components/StudentEditsView.vue");
	const cssSource = readSource("src/css/input.css");
	const menuElements = [
		"date-subrow",
		"month-dropdown-wrapper", "month-dropdown-button", "month-options-list", "month-option-button",
		"day-dropdown-wrapper", "day-dropdown-button", "day-options-list", "day-option-button",
		"year-dropdown-wrapper", "year-dropdown-button", "year-options-list", "year-option-button",
		"subject-dropdown-wrapper", "subject-dropdown-button", "subject-options-list", "subject-option-button",
		"block-dropdown-wrapper", "block-dropdown-button", "block-options-list", "block-option-button",
		"history-dropdown-wrapper", "history-dropdown-button", "history-options-list", "history-option-button",
	];
	const findTagWithClass = (className) =>
		source.match(new RegExp(`<[^>]+class="${className}"[^>]*>`))?.[0] ?? "";
	for (const elementName of menuElements) {
		const descriptionTag = findTagWithClass(`description-edits-${elementName}`);
		const playByPlayTag = findTagWithClass(`play-by-play-edits-${elementName}`);
		for (const className of [`description-edits-${elementName}`, `play-by-play-edits-${elementName}`]) {
			assert.match(cssSource, new RegExp(`^\\.${className}\\s*\\{`, "m"), `${className} must own an independent style rule`);
		}
		assert.ok(descriptionTag, `Description ${elementName} must have its own identified element`);
		assert.ok(playByPlayTag, `Play by Play ${elementName} must have its own identified element`);
		for (const [tag, prefix] of [
			[descriptionTag, "description-edits"],
			[playByPlayTag, "play-by-play-edits"],
		]) {
			assert.match(tag, new RegExp(`:?id="[^"]*${prefix}-`));
			if (tag.startsWith("<button")) {
				assert.match(tag, new RegExp(`:?name="[^"]*${prefix}-`));
				assert.match(tag, new RegExp(`:?data-button-name="[^"]*${prefix}-`));
				assert.match(tag, /@click="handle[A-Za-z_$][\w$]*(?:\([^)]*\))?"/);
			}
		}
		assert.notEqual(descriptionTag, playByPlayTag, `${elementName} must not share markup identity`);
	}

	for (const control of ["commit", "load", "date-dropdown", "subject-dropdown", "block-dropdown", "history-dropdown", "remove"]) {
		const descriptionTag = source.match(new RegExp(`<button\\b[^>]*id="description-edits-${control}(?:-button)?"[^>]*>`))?.[0] ?? "";
		const playByPlayTag = source.match(new RegExp(`<button\\b[^>]*id="play-by-play-edits-${control}(?:-button)?"[^>]*>`))?.[0] ?? "";
		assert.ok(descriptionTag, `Description ${control} button must exist independently`);
		assert.ok(playByPlayTag, `Play by Play ${control} button must exist independently`);
		const descriptionHandler = descriptionTag.match(/@click="([^"]+)"/)?.[1];
		const playByPlayHandler = playByPlayTag.match(/@click="([^"]+)"/)?.[1];
		assert.ok(descriptionHandler, `Description ${control} button must call a named handler`);
		assert.ok(playByPlayHandler, `Play by Play ${control} button must call a named handler`);
		assert.notEqual(descriptionHandler, playByPlayHandler, `${control} buttons must call separate handlers`);
		for (const [tag, prefix] of [
			[descriptionTag, "description-edits"],
			[playByPlayTag, "play-by-play-edits"],
		]) {
			const className = tag.match(/class="([^"]+)"/)?.[1];
			assert.equal(className, `${prefix}-${control}-button`);
			assert.ok(tag.includes(`name="${prefix}-${control}-button"`));
			assert.ok(tag.includes(`data-button-name="${prefix}-${control}-button"`));
			assert.match(cssSource, new RegExp(`^\\.${className}\\s*\\{`, "m"));
		}
	}
});

test("Description Edits commit pipeline is wired in StudentEditsView.vue", () => {
	const source = readSource("src/components/StudentEditsView.vue");
	assert.match(
		source,
		/import \{ blockDescriptionStore \} from "\.\.\/js\/blockDescriptionState\.js";/,
		"must import blockDescriptionStore",
	);
	assert.match(
		source,
		/blockDescriptionStore\.commitDescription\(/,
		"commit handler must call commitDescription",
	);
	assert.match(
		source,
		/blockDescriptionStore\.getHistory\(\)/,
		"History list must render getHistory() entries",
	);
});

test("Description Load reopens saved text without writing until Save", async () => {
	const dateKey = "2026-09-11";
	const savedText = "Original description.\n\nKeep the spacing.";
	blockDescriptionStore.commitDescription({ dateKey, subjectKey: "math", blocks: [1], text: savedText });
	blockDescriptionStore.commitDescription({ dateKey, subjectKey: "math", blocks: [2], text: "Another block." });
	blockDescriptionStore.commitPlayByPlay({ dateKey, subjectKey: "math", blocks: [1], text: "Separate Play by Play." });
	const historyCount = blockDescriptionStore.getHistory().length;
	const view = await createDescriptionEditsView();
	view.descriptionEditsMode.value = "description";
	view.descriptionEditsSelectedMonth.value = new Date(2026, 8, 1);
	view.descriptionEditsSelectedDay.value = 11;
	view.descriptionEditsSelectedYear.value = 2026;
	view.descriptionEditsSelectedSubject.value = { key: "math", label: "Math" };
	view.descriptionEditsSelectedBlock.value = 1;
	view.descriptionEditsDraft.value = "Unrelated draft.";
	await nextTick();

	view.handleDescriptionEditsLoad();
	assert.equal(view.descriptionEditsLoadedFields.value[0].text, savedText);
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 1), savedText);
	assert.equal(blockDescriptionStore.getHistory().length, historyCount);
	view.descriptionEditsLoadedFields.value[0].text = "Edited description.";
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 1), savedText);
	await view.handleDescriptionEditsCommit();
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 1), "Edited description.");
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 2), "Another block.");
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "math", 1), "Separate Play by Play.");
	assert.equal(blockDescriptionStore.getHistory().length, historyCount + 1);

	view.descriptionEditsSelectedBlock.value = 2;
	await nextTick();
	view.handleDescriptionEditsLoad();
	assert.equal(view.descriptionEditsLoadedFields.value[0].text, "Another block.");
	view.descriptionEditsSelectedBlock.value = 1;
	await nextTick();
	view.handleDescriptionEditsLoad();
	assert.equal(view.descriptionEditsLoadedFields.value[0].text, "Edited description.");
	assert.equal(blockDescriptionStore.getHistory().length, historyCount + 1);
});

test("Description Commit keeps new-entry saving and requires complete Description selections", async () => {
	const view = await createDescriptionEditsView();
	const dateKey = "2026-09-12";
	view.descriptionEditsMode.value = "description";
	view.descriptionEditsSelectedMonth.value = new Date(2026, 8, 1);
	view.descriptionEditsSelectedDay.value = 12;
	view.descriptionEditsSelectedYear.value = 2026;
	view.descriptionEditsSelectedSubject.value = { key: "science", label: "Science" };
	view.descriptionEditsDraft.value = "New description.";
	await nextTick();
	view.handleDescriptionEditsCommit();
	assert.equal(blockDescriptionStore.getDescription(dateKey, "science", 1), null);
	view.descriptionEditsSelectedBlock.value = 1;
	view.descriptionEditsMode.value = "play-by-play";
	await nextTick();
	view.handleDescriptionEditsCommit();
	assert.equal(blockDescriptionStore.getDescription(dateKey, "science", 1), null);
	view.descriptionEditsMode.value = "description";
	await nextTick();
	view.handleDescriptionEditsLoad();
	assert.deepEqual(view.descriptionEditsLoadedFields.value, []);
	view.handleDescriptionEditsCommit();
	assert.equal(blockDescriptionStore.getDescription(dateKey, "science", 1), "New description.");
});

test("Play by Play Load independently reopens saved text and preserves it until Save", async () => {
	const dateKey = "2026-09-13";
	const savedText = "First step.\n\nKeep this blank line.";
	blockDescriptionStore.commitPlayByPlay({ dateKey, subjectKey: "math", blocks: [1], text: savedText });
	blockDescriptionStore.commitPlayByPlay({ dateKey, subjectKey: "math", blocks: [2], text: "Another block's steps." });
	blockDescriptionStore.commitDescription({ dateKey, subjectKey: "math", blocks: [1], text: "Separate description." });
	const historyCount = blockDescriptionStore.getHistory("play-by-play").length;
	const view = await createDescriptionEditsView();
	view.descriptionEditsMode.value = "play-by-play";
	view.descriptionEditsSelectedMonth.value = new Date(2026, 8, 1);
	view.descriptionEditsSelectedDay.value = 13;
	view.descriptionEditsSelectedYear.value = 2026;
	view.descriptionEditsSelectedSubject.value = { key: "math", label: "Math" };
	view.descriptionEditsSelectedBlock.value = 1;
	view.descriptionEditsDraft.value = "Unsaved Description draft.";
	view.descriptionEditsPlayByPlayDraft.value = "Unrelated Play by Play draft.";
	await nextTick();

	view.handlePlayByPlayEditsLoad();
	assert.equal(view.playByPlayEditsLoadedFields.value[0].text, savedText);
	assert.equal(view.descriptionEditsDraft.value, "Unsaved Description draft.");
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "math", 1), savedText);
	assert.equal(blockDescriptionStore.getHistory("play-by-play").length, historyCount);
	view.playByPlayEditsLoadedFields.value[0].text = "Edited steps.";
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "math", 1), savedText);
	await view.handlePlayByPlayEditsCommit();
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "math", 1), "Edited steps.");
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "math", 2), "Another block's steps.");
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 1), "Separate description.");
	assert.equal(blockDescriptionStore.getHistory("play-by-play").length, historyCount + 1);

	view.descriptionEditsSelectedBlock.value = 2;
	await nextTick();
	view.handlePlayByPlayEditsLoad();
	assert.equal(view.playByPlayEditsLoadedFields.value[0].text, "Another block's steps.");
	view.descriptionEditsSelectedBlock.value = 1;
	await nextTick();
	view.handlePlayByPlayEditsLoad();
	assert.equal(view.playByPlayEditsLoadedFields.value[0].text, "Edited steps.");
	assert.equal(blockDescriptionStore.getHistory("play-by-play").length, historyCount + 1);
});

test("Play by Play Commit keeps new-entry saving and requires complete Play by Play selections", async () => {
	const view = await createDescriptionEditsView();
	const dateKey = "2026-09-14";
	view.descriptionEditsMode.value = "play-by-play";
	view.descriptionEditsSelectedMonth.value = new Date(2026, 8, 1);
	view.descriptionEditsSelectedDay.value = 14;
	view.descriptionEditsSelectedYear.value = 2026;
	view.descriptionEditsSelectedSubject.value = { key: "science", label: "Science" };
	view.descriptionEditsPlayByPlayDraft.value = "New steps.";
	await nextTick();
	view.handlePlayByPlayEditsCommit();
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "science", 1), null);
	view.descriptionEditsSelectedBlock.value = 1;
	view.descriptionEditsMode.value = "description";
	await nextTick();
	view.handlePlayByPlayEditsCommit();
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "science", 1), null);
	view.descriptionEditsMode.value = "play-by-play";
	await nextTick();
	view.handlePlayByPlayEditsLoad();
	assert.deepEqual(view.playByPlayEditsLoadedFields.value, []);
	view.handlePlayByPlayEditsCommit();
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "science", 1), "New steps.");
});

test("Description Save control retains its own selector and handler", () => {
	const source = readSource("src/components/StudentEditsView.vue");
	const button = source.match(/<button\b[^>]*id="description-edits-commit-button"[^>]*>[\s\S]*?<\/button>/);
	assert.ok(button, "Description Save control must exist");
	assert.match(button[0], /class="description-edits-commit-button"/);
	assert.match(button[0], /aria-label="Save description"/);
	assert.match(button[0], /title="Save description"/);
	assert.match(button[0], /@click="handleDescriptionEditsCommit"/);
	assert.match(button[0], />\s*Save\s*<\/button>/);
});

test("Play by Play Save control retains its own selector and handler", () => {
	const source = readSource("src/components/StudentEditsView.vue");
	const button = source.match(/<button\b[^>]*id="play-by-play-edits-commit-button"[^>]*>[\s\S]*?<\/button>/);
	assert.ok(button, "Play by Play Save control must exist");
	assert.match(button[0], /class="play-by-play-edits-commit-button"/);
	assert.match(button[0], /aria-label="Save Play by Play"/);
	assert.match(button[0], /title="Save Play by Play"/);
	assert.match(button[0], /@click="handlePlayByPlayEditsCommit"/);
	assert.match(button[0], />\s*Save\s*<\/button>/);
});

test("Description and Play by Play Save controls use distinct read and save handlers", async () => {
	const source = readSource("src/components/StudentEditsView.vue");
	assert.match(source, /id="description-edits-commit-button"[^>]*@click="handleDescriptionEditsCommit"/);
	assert.match(source, /id="play-by-play-edits-commit-button"[^>]*@click="handlePlayByPlayEditsCommit"/);
	const view = await createDescriptionEditsView();
	assert.doesNotMatch(view.handleDescriptionEditsLoad.toString(), /getPlayByPlay\(|playByPlayEditsLoadedFields/);
	assert.doesNotMatch(view.handlePlayByPlayEditsLoad.toString(), /getDescription\(|descriptionEditsLoadedFields/);
	assert.match(view.handleDescriptionEditsLoad.toString(), /getDescription\(/);
	assert.match(view.handleDescriptionEditsCommit.toString(), /overwriteDescription\(/);
	assert.match(view.handleDescriptionEditsCommit.toString(), /commitDescription\(/);
	assert.doesNotMatch(view.handleDescriptionEditsCommit.toString(), /getPlayByPlay\(|commitPlayByPlay\(/);
	assert.match(view.handlePlayByPlayEditsLoad.toString(), /getPlayByPlay\(/);
	assert.match(view.handlePlayByPlayEditsCommit.toString(), /overwritePlayByPlay\(/);
	assert.match(view.handlePlayByPlayEditsCommit.toString(), /commitPlayByPlay\(/);
	assert.doesNotMatch(view.handlePlayByPlayEditsCommit.toString(), /getDescription\(|commitDescription\(/);
});

test("Description Load gates selections, groups identical saved blocks, and Save clears and focuses", async () => {
	const view = await createDescriptionEditsView();
	const dateKey = "2026-09-15";
	assert.equal(view.isDescriptionEditsLoadEnabled.value, false);
	view.handleDescriptionEditsLoad();
	assert.deepEqual(view.descriptionEditsLoadedFields.value, []);
	view.descriptionEditsMode.value = "description";
	view.descriptionEditsSelectedMonth.value = new Date(2026, 8, 1);
	view.descriptionEditsSelectedDay.value = 15;
	view.descriptionEditsSelectedYear.value = 2026;
	view.descriptionEditsSelectedSubject.value = { key: "math", label: "Math" };
	assert.equal(view.isDescriptionEditsLoadEnabled.value, false);
	view.descriptionEditsSelectedBlock.value = "all";
	blockDescriptionStore.commitDescription({ dateKey, subjectKey: "math", blocks: [1, 3], text: "Same\n\ntext." });
	assert.equal(view.isDescriptionEditsLoadEnabled.value, true);
	view.handleDescriptionEditsLoad();
	assert.deepEqual(view.descriptionEditsLoadedFields.value, [{ blocks: [1, 3], originalText: "Same\n\ntext.", text: "Same\n\ntext." }]);
	const historyCount = blockDescriptionStore.getHistory().length;
	await view.handleDescriptionEditsCommit();
	assert.equal(blockDescriptionStore.getHistory().length, historyCount);
	view.handleDescriptionEditsLoad();
	view.descriptionEditsLoadedFields.value[0].text = "Changed identical blocks.";
	let focused = false;
	let selection;
	view.descriptionEditsEditor.value = { focus() { focused = true; }, setSelectionRange(...range) { selection = range; }, scrollTop: 40, scrollLeft: 20 };
	await view.handleDescriptionEditsCommit();
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 1), "Changed identical blocks.");
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 3), "Changed identical blocks.");
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 2), null);
	assert.deepEqual(view.descriptionEditsLoadedFields.value, []);
	assert.equal(view.descriptionEditsDraft.value, "");
	assert.equal(view.descriptionEditsLoadedSelectionKey.value, null);
	assert.equal(focused, true);
	assert.deepEqual(selection, [0, 0]);
	assert.equal(view.descriptionEditsEditor.value.scrollTop, 0);
	assert.equal(view.descriptionEditsEditor.value.scrollLeft, 0);
});

test("Description Load has independent disabled styling, labeled editors, and a right-side overflow region", () => {
	const source = readSource("src/components/StudentEditsView.vue");
	const button = source.match(/<button\b[^>]*id="description-edits-load-button"[^>]*>[\s\S]*?<\/button>/);
	assert.ok(button);
	assert.match(button[0], /description-edits-load-button/);
	assert.match(button[0], /:disabled="!isDescriptionEditsLoadEnabled"/);
	assert.match(button[0], /@click="handleDescriptionEditsLoad"/);
	assert.match(readSource("src/css/input.css"), /\.description-edits-load-button:disabled\s*\{[^}]*background:\s*#d1d5db;[^}]*box-shadow:\s*none;/s);
	assert.match(source, /description-edits-workflow-row col-span-full grid grid-cols-7 items-center justify-center gap-4/);
	assert.match(source, /id="description-edits-loaded-scroll-region"[\s\S]*?ml-auto[\s\S]*?h-\[772px\][\s\S]*?overflow-y-scroll[\s\S]*?\[direction:ltr\]/);
	assert.match(source, /:for="`description-edits-loaded-text-\$\{field.blocks.join\('-'\)\}`"/);
	assert.match(source, /:id="`description-edits-loaded-text-\$\{field.blocks.join\('-'\)\}`"[\s\S]*?v-model="field.text"/);
	assert.match(source, /id="description-edits-text-box"\s+ref="descriptionEditsEditor"/);
});

test("Description All Blocks edits only changed original keys, including empty text", async () => {
	const view = await createDescriptionEditsView();
	const dateKey = "2026-09-16";
	view.descriptionEditsMode.value = "description";
	view.descriptionEditsSelectedMonth.value = new Date(2026, 8, 1);
	view.descriptionEditsSelectedDay.value = 16;
	view.descriptionEditsSelectedYear.value = 2026;
	view.descriptionEditsSelectedSubject.value = { key: "science", label: "Science" };
	view.descriptionEditsSelectedBlock.value = "all";
	for (const blockNumber of [1, 2, 3]) {
		blockDescriptionStore.commitDescription({ dateKey, subjectKey: "science", blocks: [blockNumber], text: `Description ${blockNumber}` });
	}
	blockDescriptionStore.commitDescription({ dateKey, subjectKey: "math", blocks: [2], text: "Other subject" });
	blockDescriptionStore.commitDescription({ dateKey: "2026-09-17", subjectKey: "science", blocks: [2], text: "Other date" });
	blockDescriptionStore.commitPlayByPlay({ dateKey, subjectKey: "science", blocks: [2], text: "Other content" });
	view.handleDescriptionEditsLoad();
	assert.deepEqual(view.descriptionEditsLoadedFields.value.map((field) => field.blocks), [[1], [2], [3]]);
	view.descriptionEditsLoadedFields.value[1].text = "Edited second block";
	assert.equal(blockDescriptionStore.getDescription(dateKey, "science", 2), "Description 2");
	const historyCount = blockDescriptionStore.getHistory().length;
	await view.handleDescriptionEditsCommit();
	assert.equal(blockDescriptionStore.getHistory().length, historyCount + 1);
	assert.equal(blockDescriptionStore.getDescription(dateKey, "science", 1), "Description 1");
	assert.equal(blockDescriptionStore.getDescription(dateKey, "science", 2), "Edited second block");
	assert.equal(blockDescriptionStore.getDescription(dateKey, "science", 3), "Description 3");
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 2), "Other subject");
	assert.equal(blockDescriptionStore.getDescription("2026-09-17", "science", 2), "Other date");
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "science", 2), "Other content");
	view.handleDescriptionEditsLoad();
	view.descriptionEditsLoadedFields.value[1].text = "";
	await view.handleDescriptionEditsCommit();
	assert.equal(blockDescriptionStore.getDescription(dateKey, "science", 2), "");
	view.handleDescriptionEditsLoad();
	view.descriptionEditsLoadedFields.value[0].text = "Discarded edit";
	view.descriptionEditsSelectedDay.value = 17;
	assert.deepEqual(view.descriptionEditsLoadedFields.value, []);
	assert.equal(blockDescriptionStore.getDescription(dateKey, "science", 1), "Description 1");
	view.handleDescriptionEditsLoad();
	view.handleDescriptionEditsHistorySelect({ text: "History draft" });
	assert.deepEqual(view.descriptionEditsLoadedFields.value, []);
	assert.equal(view.descriptionEditsLoadedSelectionKey.value, null);
	assert.equal(view.descriptionEditsDraft.value, "History draft");
});

test("Play by Play Load gates selections, groups identical saved blocks, and Save clears and focuses", async () => {
	const view = await createDescriptionEditsView();
	const dateKey = "2026-09-18";
	assert.equal(view.isPlayByPlayEditsLoadEnabled.value, false);
	view.handlePlayByPlayEditsLoad();
	assert.deepEqual(view.playByPlayEditsLoadedFields.value, []);
	view.descriptionEditsMode.value = "play-by-play";
	view.descriptionEditsSelectedMonth.value = new Date(2026, 8, 1);
	view.descriptionEditsSelectedDay.value = 18;
	view.descriptionEditsSelectedYear.value = 2026;
	view.descriptionEditsSelectedSubject.value = { key: "math", label: "Math" };
	assert.equal(view.isPlayByPlayEditsLoadEnabled.value, false);
	view.descriptionEditsSelectedBlock.value = "all";
	blockDescriptionStore.commitPlayByPlay({ dateKey, subjectKey: "math", blocks: [1, 3], text: "Same\n\nsteps." });
	assert.equal(view.isPlayByPlayEditsLoadEnabled.value, true);
	view.handlePlayByPlayEditsLoad();
	assert.deepEqual(view.playByPlayEditsLoadedFields.value, [{ blocks: [1, 3], originalText: "Same\n\nsteps.", text: "Same\n\nsteps." }]);
	const historyCount = blockDescriptionStore.getHistory("play-by-play").length;
	await view.handlePlayByPlayEditsCommit();
	assert.equal(blockDescriptionStore.getHistory("play-by-play").length, historyCount);
	view.handlePlayByPlayEditsLoad();
	view.playByPlayEditsLoadedFields.value[0].text = "Changed identical steps.";
	view.descriptionEditsDraft.value = "Separate Description draft";
	let focused = false;
	let selection;
	view.playByPlayEditsEditor.value = { focus() { focused = true; }, setSelectionRange(...range) { selection = range; }, scrollTop: 40, scrollLeft: 20 };
	await view.handlePlayByPlayEditsCommit();
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "math", 1), "Changed identical steps.");
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "math", 3), "Changed identical steps.");
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "math", 2), null);
	assert.deepEqual(view.playByPlayEditsLoadedFields.value, []);
	assert.equal(view.descriptionEditsPlayByPlayDraft.value, "");
	assert.equal(view.descriptionEditsDraft.value, "Separate Description draft");
	assert.equal(view.playByPlayEditsLoadedSelectionKey.value, null);
	assert.equal(focused, true);
	assert.deepEqual(selection, [0, 0]);
	assert.equal(view.playByPlayEditsEditor.value.scrollTop, 0);
	assert.equal(view.playByPlayEditsEditor.value.scrollLeft, 0);
});

test("Play by Play Load has independently disabled controls, labeled editors, and right-side scrolling", () => {
	const source = readSource("src/components/StudentEditsView.vue");
	const button = source.match(/<button\b[^>]*id="play-by-play-edits-load-button"[^>]*>[\s\S]*?<\/button>/);
	assert.ok(button);
	assert.match(button[0], /play-by-play-edits-load-button/);
	assert.match(button[0], /:disabled="!isPlayByPlayEditsLoadEnabled"/);
	assert.match(button[0], /@click="handlePlayByPlayEditsLoad"/);
	assert.match(readSource("src/css/input.css"), /\.play-by-play-edits-load-button:disabled\s*\{[^}]*background:\s*#d1d5db;[^}]*box-shadow:\s*none;/s);
	assert.match(source, /play-by-play-edits-workflow-row col-span-full grid grid-cols-7 items-center justify-center gap-4/);
	assert.match(source, /id="play-by-play-edits-loaded-scroll-region"[\s\S]*?ml-auto[\s\S]*?h-\[772px\][\s\S]*?overflow-y-scroll[\s\S]*?\[direction:ltr\]/);
	assert.match(source, /:for="`play-by-play-edits-loaded-text-\$\{field.blocks.join\('-'\)\}`"/);
	assert.match(source, /:id="`play-by-play-edits-loaded-text-\$\{field.blocks.join\('-'\)\}`"[\s\S]*?v-model="field.text"/);
	assert.match(source, /id="play-by-play-edits-text-box"\s+ref="playByPlayEditsEditor"/);
});

test("Play by Play All Blocks edits only changed original keys, including empty text", async () => {
	const view = await createDescriptionEditsView();
	const dateKey = "2026-09-19";
	view.descriptionEditsMode.value = "play-by-play";
	view.descriptionEditsSelectedMonth.value = new Date(2026, 8, 1);
	view.descriptionEditsSelectedDay.value = 19;
	view.descriptionEditsSelectedYear.value = 2026;
	view.descriptionEditsSelectedSubject.value = { key: "science", label: "Science" };
	view.descriptionEditsSelectedBlock.value = "all";
	for (const blockNumber of [1, 2, 3]) {
		blockDescriptionStore.commitPlayByPlay({ dateKey, subjectKey: "science", blocks: [blockNumber], text: `Steps ${blockNumber}` });
	}
	blockDescriptionStore.commitPlayByPlay({ dateKey, subjectKey: "math", blocks: [2], text: "Other subject steps" });
	blockDescriptionStore.commitPlayByPlay({ dateKey: "2026-09-20", subjectKey: "science", blocks: [2], text: "Other date steps" });
	blockDescriptionStore.commitDescription({ dateKey, subjectKey: "science", blocks: [2], text: "Other content description" });
	view.handlePlayByPlayEditsLoad();
	assert.deepEqual(view.playByPlayEditsLoadedFields.value.map((field) => field.blocks), [[1], [2], [3]]);
	view.playByPlayEditsLoadedFields.value[1].text = "Edited second steps";
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "science", 2), "Steps 2");
	const historyCount = blockDescriptionStore.getHistory("play-by-play").length;
	await view.handlePlayByPlayEditsCommit();
	assert.equal(blockDescriptionStore.getHistory("play-by-play").length, historyCount + 1);
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "science", 1), "Steps 1");
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "science", 2), "Edited second steps");
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "science", 3), "Steps 3");
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "math", 2), "Other subject steps");
	assert.equal(blockDescriptionStore.getPlayByPlay("2026-09-20", "science", 2), "Other date steps");
	assert.equal(blockDescriptionStore.getDescription(dateKey, "science", 2), "Other content description");
	view.handlePlayByPlayEditsLoad();
	view.playByPlayEditsLoadedFields.value[1].text = "";
	await view.handlePlayByPlayEditsCommit();
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "science", 2), "");
	view.handlePlayByPlayEditsLoad();
	view.playByPlayEditsLoadedFields.value[0].text = "Discarded steps";
	view.descriptionEditsSelectedDay.value = 20;
	assert.deepEqual(view.playByPlayEditsLoadedFields.value, []);
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "science", 1), "Steps 1");
	view.handlePlayByPlayEditsLoad();
	view.handlePlayByPlayEditsHistorySelect({ text: "History steps" });
	assert.deepEqual(view.playByPlayEditsLoadedFields.value, []);
	assert.equal(view.playByPlayEditsLoadedSelectionKey.value, null);
	assert.equal(view.descriptionEditsPlayByPlayDraft.value, "History steps");
});

test("Description overwrites persist only existing changed Description keys", () => {
	const dateKey = "2098-10-01";
	blockDescriptionStore.commitDescription({ dateKey, subjectKey: "art", blocks: [1, 2], text: "Original" });
	const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
	const writes = [];
	Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { setItem(key, value) { writes.push({ key, value }); } } });
	try {
		assert.equal(blockDescriptionStore.overwriteDescription({ dateKey, subjectKey: "art", blockNumber: 1, text: "Original" }), false);
		assert.equal(blockDescriptionStore.overwriteDescription({ dateKey, subjectKey: "art", blockNumber: 3, text: "Missing" }), false);
		assert.equal(writes.length, 0);
		assert.equal(blockDescriptionStore.overwriteDescription({ dateKey, subjectKey: "art", blockNumber: 1, text: "Edited" }), true);
		const saved = JSON.parse(writes.find(({ key }) => key === "zoologistExplorer02.blockDescriptions").value);
		assert.equal(saved[`${dateKey}::art::1`], "Edited");
		assert.equal(saved[`${dateKey}::art::2`], "Original");
		assert.equal(saved[`${dateKey}::art::3`], undefined);
		assert.ok(writes.every(({ key }) => key !== "zoologistExplorer02.blockPlayByPlay"));
		assert.equal(blockDescriptionStore.overwriteDescription({ dateKey, subjectKey: "art", blockNumber: 1, text: "" }), true);
		assert.equal(JSON.parse(writes.at(-1).value)[`${dateKey}::art::1`], "");
	} finally {
		if (previousStorage) {
			Object.defineProperty(globalThis, "localStorage", previousStorage);
		} else {
			delete globalThis.localStorage;
		}
	}
});

test("Play by Play overwrites persist only existing changed Play by Play keys", () => {
	const dateKey = "2098-10-02";
	blockDescriptionStore.commitPlayByPlay({ dateKey, subjectKey: "art", blocks: [1, 2], text: "Original steps" });
	const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
	const writes = [];
	Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { setItem(key, value) { writes.push({ key, value }); } } });
	try {
		assert.equal(blockDescriptionStore.overwritePlayByPlay({ dateKey, subjectKey: "art", blockNumber: 1, text: "Original steps" }), false);
		assert.equal(blockDescriptionStore.overwritePlayByPlay({ dateKey, subjectKey: "art", blockNumber: 3, text: "Missing steps" }), false);
		assert.equal(writes.length, 0);
		assert.equal(blockDescriptionStore.overwritePlayByPlay({ dateKey, subjectKey: "art", blockNumber: 1, text: "Edited steps" }), true);
		const saved = JSON.parse(writes.find(({ key }) => key === "zoologistExplorer02.blockPlayByPlay").value);
		assert.equal(saved[`${dateKey}::art::1`], "Edited steps");
		assert.equal(saved[`${dateKey}::art::2`], "Original steps");
		assert.equal(saved[`${dateKey}::art::3`], undefined);
		assert.ok(writes.every(({ key }) => key !== "zoologistExplorer02.blockDescriptions"));
		assert.equal(blockDescriptionStore.overwritePlayByPlay({ dateKey, subjectKey: "art", blockNumber: 1, text: "" }), true);
		assert.equal(JSON.parse(writes.at(-1).value)[`${dateKey}::art::1`], "");
	} finally {
		if (previousStorage) {
			Object.defineProperty(globalThis, "localStorage", previousStorage);
		} else {
			delete globalThis.localStorage;
		}
	}
});

test("Student Edits independent Load editors and controls compile as a Vue template", () => {
	const { descriptor } = parse(readSource("src/components/StudentEditsView.vue"));
	const compiled = compileTemplate({ source: descriptor.template.content, filename: "StudentEditsView.vue", id: "description-edits-template-test" });
	assert.deepEqual(compiled.errors, []);
});

test("Description Edits selection summary formats selected date, subject, and block", () => {
	const componentSource = readSource("src/components/StudentEditsView.vue");
	const cssSource = readSource("src/css/input.css");
	assert.match(
		componentSource,
		/isDescriptionEditsSelectionSummaryVisible = computed\(\(\) =>\s*Boolean\([\s\S]*descriptionEditsSelectedSubject\.value[\s\S]*descriptionEditsSelectedBlock\.value !== null[\s\S]*\)\)/,
		"summary must appear when a subject or block is selected",
	);
	assert.match(
		componentSource,
		/descriptionEditsSelectionDateLabel = computed\(\(\) =>[\s\S]*padStart\(2, "0"\)[\s\S]*slice\(-2\)[\s\S]*`\$\{month\}\/\$\{day\}\/\$\{year\}`/,
		"selected date must use mm/dd/yy formatting",
	);
	assert.match(
		componentSource,
		/description-edits-selection-date[\s\S]*Date: \{\{ descriptionEditsSelectionDateLabel \}\}[\s\S]*description-edits-selection-subject[\s\S]*Subject: \{\{ descriptionEditsSelectedSubject\.label \}\}[\s\S]*description-edits-selection-block[\s\S]*Block: \{/,
		"summary fields must appear in Date, Subject, Block order",
	);
	assert.match(
		cssSource,
		/\.description-edits-selection-summary\s*\{[^}]*gap:\s*16px;/s,
		"summary fields must have 16px gaps",
	);
});

test("Description and Play by Play keep independent selected dates", async () => {
	const view = await createDescriptionEditsView();
	view.descriptionEditsMode.value = "description";
	view.handleDescriptionEditsMonthSelect(new Date(2026, 8, 1));
	view.handleDescriptionEditsDaySelect(15);
	view.handleDescriptionEditsYearSelect(2026);

	view.descriptionEditsMode.value = "play-by-play";
	assert.equal(view.descriptionEditsSelectedMonth.value, null);
	assert.equal(view.descriptionEditsSelectedDay.value, null);
	assert.equal(view.descriptionEditsSelectedYear.value, null);
	view.handlePlayByPlayEditsMonthSelect(new Date(2026, 9, 1));
	view.handlePlayByPlayEditsDaySelect(26);
	view.handlePlayByPlayEditsYearSelect(2027);

	view.descriptionEditsMode.value = "description";
	assert.equal(view.descriptionEditsSelectedMonth.value.getMonth(), 8);
	assert.equal(view.descriptionEditsSelectedDay.value, 15);
	assert.equal(view.descriptionEditsSelectedYear.value, 2026);
	view.descriptionEditsMode.value = "play-by-play";
	assert.equal(view.descriptionEditsSelectedMonth.value.getMonth(), 9);
	assert.equal(view.descriptionEditsSelectedDay.value, 26);
	assert.equal(view.descriptionEditsSelectedYear.value, 2027);
});

test("Play by Play has distinct controls and a separate calendar data path", () => {
	const studentEditsSource = readSource("src/components/StudentEditsView.vue");
	const calendarSource = readSource("src/components/CalendarView.vue");
	assert.match(
		studentEditsSource,
		/v-if="descriptionEditsMode === 'description'"[\s\S]*description-edits-commit-button/,
		"Description toolbar must be mode-specific",
	);
	assert.match(
		studentEditsSource,
		/v-else-if="descriptionEditsMode === 'play-by-play'"[\s\S]*play-by-play-edits-commit-button/,
		"Play by Play toolbar must use distinct controls",
	);
	assert.match(studentEditsSource, /blockDescriptionStore\.commitPlayByPlay\(/);
	assert.match(calendarSource, /blockDescriptionStore\.getPlayByPlay\(/);
});

test("Description mode stays visually depressed while pressed", () => {
	const studentEditsSource = readSource("src/components/StudentEditsView.vue");
	const cssSource = readSource("src/css/input.css");
	assert.match(
		studentEditsSource,
		/class="description-edits-description-button"[\s\S]*:aria-pressed="descriptionEditsMode === 'description'"[\s\S]*@click="handleDescriptionEditsModeToggle\('description'\)"/,
		"Description button must expose its toggled mode as aria-pressed",
	);
	assert.match(
		cssSource,
		/\.description-edits-description-button\[aria-pressed="true"\]\s*\{[^}]*transform:\s*translateY\(3px\)[^}]*background:[^}]*box-shadow:[^}]*0 0 12px 5px rgba\(255, 113, 0, 0\.95\)/s,
		"pressed Description button must remain depressed with a bright orange glow",
	);
});

test("Play by Play mode stays visually depressed while pressed", () => {
	const studentEditsSource = readSource("src/components/StudentEditsView.vue");
	const cssSource = readSource("src/css/input.css");
	assert.match(
		studentEditsSource,
		/class="description-edits-play-by-play-button"[\s\S]*:aria-pressed="descriptionEditsMode === 'play-by-play'"[\s\S]*@click="handleDescriptionEditsModeToggle\('play-by-play'\)"/,
		"Play by Play button must expose its toggled mode as aria-pressed",
	);
	assert.match(
		cssSource,
		/\.description-edits-play-by-play-button\[aria-pressed="true"\]\s*\{[^}]*transform:\s*translateY\(3px\)[^}]*background:[^}]*box-shadow:[^}]*0 0 12px 5px rgba\(255, 225, 0, 0\.98\)/s,
		"pressed Play by Play button must remain depressed with a bright yellow glow",
	);
});

test("Description Edits Remove targets only the selected date, subject, and blocks", () => {
	const source = readSource("src/components/StudentEditsView.vue");
	assert.match(
		source,
		/description-edits-remove-button[\s\S]*@click="handleDescriptionEditsRemove"/,
		"Remove button must invoke the selected-description removal handler",
	);
	assert.match(
		source,
		/blockDescriptionStore\.removeDescriptions\(/,
		"removal handler must call removeDescriptions",
	);

	const dateKey = "2099-12-31";
	blockDescriptionStore.commitDescription({
		dateKey,
		subjectKey: "math",
		blocks: [1, 2, 3],
		text: "selected date math",
	});
	blockDescriptionStore.commitDescription({
		dateKey,
		subjectKey: "science",
		blocks: [2],
		text: "same date, other subject",
	});
	blockDescriptionStore.commitDescription({
		dateKey: "2099-12-30",
		subjectKey: "math",
		blocks: [2],
		text: "other date, same subject",
	});

	assert.equal(
		blockDescriptionStore.removeDescriptions({ dateKey, subjectKey: "math", blocks: [2] }),
		true,
	);
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 1), "selected date math");
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 2), null);
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 3), "selected date math");
	assert.equal(
		blockDescriptionStore.getDescription(dateKey, "science", 2),
		"same date, other subject",
	);
	assert.equal(
		blockDescriptionStore.getDescription("2099-12-30", "math", 2),
		"other date, same subject",
	);
	assert.equal(
		blockDescriptionStore.removeDescriptions({ dateKey, subjectKey: "math", blocks: [1, 3] }),
		true,
	);
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 1), null);
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 3), null);
});

test("Remove clears loaded Description and Play by Play text without clearing the other draft", async () => {
	const view = await createDescriptionEditsView();
	const descriptionDateKey = "2098-01-14";
	view.descriptionEditsMode.value = "description";
	view.descriptionEditsSelectedMonth.value = new Date(2098, 0, 1);
	view.descriptionEditsSelectedDay.value = 14;
	view.descriptionEditsSelectedYear.value = 2098;
	view.descriptionEditsSelectedSubject.value = { key: "math", label: "Math" };
	view.descriptionEditsSelectedBlock.value = 2;
	view.descriptionEditsDraft.value = "Old Description draft";
	view.descriptionEditsPlayByPlayDraft.value = "Unrelated Play by Play draft";
	blockDescriptionStore.commitDescription({
		dateKey: descriptionDateKey,
		subjectKey: "math",
		blocks: [2],
		text: "Loaded Description\n\ntext",
	});
	view.handleDescriptionEditsLoad();
	assert.equal(view.descriptionEditsLoadedFields.value[0].text, "Loaded Description\n\ntext");
	view.handleDescriptionEditsRemove();
	assert.deepEqual(view.descriptionEditsLoadedFields.value, []);
	assert.equal(view.descriptionEditsLoadedSelectionKey.value, null);
	assert.equal(view.descriptionEditsDraft.value, "");
	assert.equal(view.descriptionEditsPlayByPlayDraft.value, "Unrelated Play by Play draft");
	assert.equal(blockDescriptionStore.getDescription(descriptionDateKey, "math", 2), null);

	const playByPlayDateKey = "2098-01-15";
	view.descriptionEditsMode.value = "play-by-play";
	view.descriptionEditsSelectedMonth.value = new Date(2098, 0, 1);
	view.descriptionEditsSelectedDay.value = 15;
	view.descriptionEditsSelectedYear.value = 2098;
	view.descriptionEditsSelectedSubject.value = { key: "science", label: "Science" };
	view.descriptionEditsSelectedBlock.value = 3;
	view.descriptionEditsDraft.value = "Unrelated Description draft";
	view.descriptionEditsPlayByPlayDraft.value = "Old Play by Play draft";
	blockDescriptionStore.commitPlayByPlay({
		dateKey: playByPlayDateKey,
		subjectKey: "science",
		blocks: [3],
		text: "Loaded Play by Play\n\ntext",
	});
	view.handlePlayByPlayEditsLoad();
	assert.equal(view.playByPlayEditsLoadedFields.value[0].text, "Loaded Play by Play\n\ntext");
	view.handlePlayByPlayEditsRemove();
	assert.deepEqual(view.playByPlayEditsLoadedFields.value, []);
	assert.equal(view.playByPlayEditsLoadedSelectionKey.value, null);
	assert.equal(view.descriptionEditsPlayByPlayDraft.value, "");
	assert.equal(view.descriptionEditsDraft.value, "Unrelated Description draft");
	assert.equal(blockDescriptionStore.getPlayByPlay(playByPlayDateKey, "science", 3), null);
});

test("Calendar Description and Play by Play containers keep separate selectors with matching backgrounds", () => {
	const calendarSource = readSource("src/components/CalendarView.vue");
	const cssSource = readSource("src/css/input.css");
	assert.match(calendarSource, /class="daily-menu-block-saved-description"/);
	assert.match(calendarSource, /class="daily-menu-block-play-by-play"/);
	const descriptionRule = cssSource.match(/\.daily-menu-block-saved-description\s*\{([^}]*)\}/);
	const playByPlayRule = cssSource.match(/\.daily-menu-block-play-by-play\s*\{([^}]*)\}/);
	assert.ok(descriptionRule, "Description must retain its own container rule");
	assert.ok(playByPlayRule, "Play by Play must retain its own container rule");
	const descriptionBackground = descriptionRule[1].match(/\bbackground:\s*([^;]+);/);
	const playByPlayBackground = playByPlayRule[1].match(/\bbackground:\s*([^;]+);/);
	assert.ok(descriptionBackground, "Description must declare its background");
	assert.ok(playByPlayBackground, "Play by Play must declare its background independently");
	assert.equal(descriptionBackground[1].trim(), "rgba(9, 24, 16, 0.4)");
	assert.equal(playByPlayBackground[1].trim(), descriptionBackground[1].trim());
});

test("input.css keeps Blocks menu and Description Edits layout invariants", () => {
	const source = readSource("src/css/input.css");
	assert.match(
		source,
		/\.blocks-menu-sidebar\s*\{[^}]*width:\s*336px;/s,
		"Blocks sidebar must be 336px wide",
	);
	assert.match(
		source,
		/\.blocks-menu-sidebar\s*\{[^}]*background:\s*#091018;/s,
		"Blocks sidebar must use a solid background",
	);
	assert.match(
		source,
		/\.description-edits-text-box\s*\{[^}]*width:\s*772px;[^}]*height:\s*772px;/s,
		"text box must be 772px by 772px",
	);
	assert.match(
		source,
		/\.description-edits-panel-container\s*\{[^}]*height:\s*auto;[^}]*padding:\s*16px 16px 18px;/s,
		"expanded container must fit its contents and keep a 16px inset below the pressed mode button",
	);
	assert.match(
		source,
		/\.description-edits-panel-container--compact\s*\{[^}]*padding-bottom:\s*15px;/s,
		"compact container must keep its original bottom inset",
	);
	assert.match(
		source,
		/\.description-edits-controls-row\s*\{[^}]*margin-top:\s*16px;[^}]*row-gap:\s*16px;/s,
		"Description Edits rows must keep 16px vertical gaps",
	);
	assert.match(
		source,
		/\.description-edits-button\s*\{[^}]*linear-gradient\(180deg,\s*#fff7b8\s*0%,\s*#f8e99a\s*100%\)/s,
		"Description Edits button must use the pastel yellow gradient",
	);
	assert.match(
		source,
		/\.description-edits-button--active\s*\{/s,
		"Description Edits depressed glow state must exist",
	);
	assert.match(
		source,
		/\.daily-menu-block-saved-description\s*\{[^}]*font-size:\s*1rem;[^}]*white-space:\s*pre-wrap;/s,
		"saved description rule must keep 1rem pre-wrap formatting",
	);
	assert.match(
		source,
		/\.daily-menu-block-play-by-play\s*\{[^}]*left:\s*calc\(16px - 3px\);[^}]*right:\s*calc\(16px - 3px\);[^}]*bottom:\s*calc\(0\.85rem \+ 42px \+ 16px\);[^}]*height:\s*490\.5px;/s,
		"Play by Play must be 490.5px high with 16px outer insets and Complete-button spacing",
	);
	assert.match(
		source,
		/\.daily-menu-block-complete-button\s*\{[^}]*height:\s*42px;/s,
		"Complete button height must anchor the Play by Play spacing",
	);
	assert.match(
		source,
		/\.play-by-play-edits-commit-button\s*\{[\s\S]*?\.play-by-play-edits-date-dropdown-button\s*\{/,
		"Play by Play top-row controls must have distinct styling selectors",
	);
	assert.match(
		source,
		/\.block-edits-week-panel-container\s*\{[^}]*left:\s*336px;/s,
		"Block Edits panel must stay offset 336px",
	);
});

test("blockDescriptionState.js exists with both localStorage keys", () => {
	const modulePath = join(repoRoot, "src", "js", "blockDescriptionState.js");
	assert.ok(existsSync(modulePath), "src/js/blockDescriptionState.js must exist");
	const source = readSource("src/js/blockDescriptionState.js");
	assert.match(
		source,
		/zoologistExplorer02\.blockDescriptions/,
		"must persist descriptions under the blockDescriptions key",
	);
	assert.match(
		source,
		/zoologistExplorer02\.descriptionHistory/,
		"must persist history under the descriptionHistory key",
	);
	assert.match(
		source,
		/zoologistExplorer02\.blockPlayByPlay/,
		"must persist Play by Play under a distinct storage key",
	);
});

test("Play by Play storage remains isolated from descriptions by date, subject, and block", () => {
	const dateKey = "2099-11-01";
	blockDescriptionStore.commitDescription({
		dateKey,
		subjectKey: "math",
		blocks: [1],
		text: "description text",
	});
	blockDescriptionStore.commitPlayByPlay({
		dateKey,
		subjectKey: "math",
		blocks: [1],
		text: "play-by-play text",
	});

	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 1), "description text");
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "math", 1), "play-by-play text");
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "science", 1), null);
	assert.equal(
		blockDescriptionStore.removePlayByPlay({ dateKey, subjectKey: "math", blocks: [1] }),
		true,
	);
	assert.equal(blockDescriptionStore.getPlayByPlay(dateKey, "math", 1), null);
	assert.equal(blockDescriptionStore.getDescription(dateKey, "math", 1), "description text");
});

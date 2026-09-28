import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src");
const vueFiles = collectVueFiles(sourceRoot);

function collectVueFiles(directory) {
	if (!fs.existsSync(directory)) {
		return [];
	}

	return fs
		.readdirSync(directory, { withFileTypes: true })
		.flatMap((entry) => {
			const fullPath = path.join(directory, entry.name);
			if (entry.isDirectory()) {
				return collectVueFiles(fullPath);
			}

			return entry.isFile() && entry.name.endsWith(".vue") ? [fullPath] : [];
		})
		.sort();
}

function collectOpeningTags(source, tagName) {
	return [...source.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "g"))].map((match) => match[0]);
}

function collectAttributeValues(source, attributeName) {
	const escapedAttributeName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const pattern = new RegExp(`${escapedAttributeName}\\s*=\\s*(["'])(.*?)\\1`, "gs");
	return [...source.matchAll(pattern)].map((match) => match[2]);
}

function collectBoundAttributeValues(source, attributeName) {
	const escapedAttributeName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const pattern = new RegExp(`:${escapedAttributeName}\\s*=\\s*(["'])(.*?)\\1`, "gs");
	return [...source.matchAll(pattern)].map((match) => match[2]);
}

function collectButtonRecords(source, filePath) {
	return collectOpeningTags(source, "button").map((openingTag) => ({
		filePath,
		id:
			collectAttributeValues(openingTag, "id")[0] ??
			collectBoundAttributeValues(openingTag, "id")[0] ??
			"",
		classes: collectAttributeValues(openingTag, "class")[0]?.split(/\s+/).filter(Boolean) ?? [],
		clickHandler: collectAttributeValues(openingTag, "@click")[0] ?? "",
	}));
}

function collectGenericButtonSelectors(source) {
	return [...source.matchAll(/([^{}]+)\{/g)]
		.flatMap((match) => match[1].split(","))
		.map((selector) => selector.trim())
		.filter((selector) => /^button(?::[\w-]+)?$/.test(selector));
}

function collectCssRuleBlocks(source) {
	const blocks = [];
	for (const match of source.matchAll(/([^{}]+)\s*\{([^{}]*)\}/g)) {
		const selectorList = match[1].trim();
		const declarations = match[2].replace(/\s+/g, " ").trim();
		if (!selectorList || selectorList.startsWith("@")) {
			continue;
		}

		const selectors = selectorList
			.split(",")
			.map((selector) => selector.trim())
			.filter(Boolean)
			.filter((selector) => selector !== "*" && selector !== ":root" && selector !== "body");

		if (selectors.length > 0) {
			blocks.push({ selectors, declarations });
		}
	}
	return blocks;
}

function collectDuplicateCssSelectors(source) {
	const seen = new Map();
	const duplicates = new Set();
	for (const block of collectCssRuleBlocks(source)) {
		for (const selector of block.selectors) {
			const signature = `${selector}::${block.declarations}`;
			if (seen.has(signature)) {
				duplicates.add(selector);
			} else {
				seen.set(signature, true);
			}
		}
	}
	return [...duplicates];
}

function collectCssTokens(source) {
	const tokens = new Set();
	for (const block of collectCssRuleBlocks(source)) {
		for (const selector of block.selectors) {
			for (const match of selector.matchAll(/([.#][A-Za-z_][\w-]*)/g)) {
				tokens.add(match[1].slice(1));
			}
		}
	}
	return tokens;
}

test("buttons keep isolated rendering, style, and functionality ownership", () => {
	const findings = [];
	const vueFiles = collectVueFiles(sourceRoot);
	const buttonRecords = vueFiles.flatMap((filePath) => {
		const source = fs.readFileSync(filePath, "utf8");
		return collectButtonRecords(source, path.relative(projectRoot, filePath));
	});
	const buttonIds = new Map();
	const buttonClasses = new Map();

	for (const button of buttonRecords) {
		if (!button.id) {
			findings.push(`${button.filePath} contains a button without a stable id`);
		} else {
			buttonIds.set(button.id, [...(buttonIds.get(button.id) ?? []), button.filePath]);
		}

		if (button.classes.length === 0) {
			findings.push(
				`${button.filePath}#${button.id || "<missing-id>"} has no class-owned styling`,
			);
		}

		for (const className of button.classes) {
			buttonClasses.set(className, [...(buttonClasses.get(className) ?? []), button]);
		}

		if (
			button.clickHandler &&
			!/^[A-Za-z_$][\w$]*\s*(?:\([^)]*\))?$/.test(button.clickHandler)
		) {
			findings.push(
				`${button.filePath}#${button.id || "<missing-id>"} uses an unscoped click expression: ${button.clickHandler}`,
			);
		}
	}

	for (const [id, files] of buttonIds) {
		if (files.length > 1) {
			findings.push(`button id "${id}" is reused in ${files.join(", ")}`);
		}
	}

	for (const [className, buttons] of buttonClasses) {
		if (buttons.length > 1) {
			findings.push(
				`button class "${className}" is shared by ${buttons
					.map((button) => `${button.filePath}#${button.id || "<missing-id>"}`)
					.join(", ")}`,
			);
		}
	}

	const sourceFiles = [
		path.join(projectRoot, "index.html"),
		path.join(sourceRoot, "js", "main.js"),
		path.join(sourceRoot, "css", "input.css"),
		...vueFiles,
	];

	for (const filePath of sourceFiles) {
		if (!fs.existsSync(filePath)) {
			findings.push(
				`${path.relative(projectRoot, filePath)} is missing from the button ownership audit`,
			);
			continue;
		}

		const source = fs.readFileSync(filePath, "utf8");
		if (filePath.endsWith("index.html") && !source.includes('<div id="app"></div>')) {
			findings.push("index.html is missing the single #app mount point");
		}
		if (filePath.endsWith("main.js") && !source.includes('mount("#app")')) {
			findings.push("src/js/main.js is missing the #app mount call");
		}
		if (filePath.endsWith("input.css")) {
			for (const selector of collectGenericButtonSelectors(source)) {
				findings.push(
					`src/css/input.css contains a generalized button selector: ${selector}`,
				);
			}
		}
	}

	assert.deepEqual(
		findings,
		[],
		`Button ownership audit found isolation issues:\n${findings.join("\n")}`,
	);
});

test("student menu tabs use the same size and shape as the calendar tab", () => {
	const cssSource = fs.readFileSync(path.join(sourceRoot, "css", "input.css"), "utf8");
	const sharedSelectorPattern =
		/\.student-menu-calendar-tab,\s*\.student-menu-rewards-tab,\s*\.student-menu-games-tab,\s*\.student-menu-extra-credit-tab,\s*\.student-menu-progress-tab\s*\{[^}]*width:\s*100%;[^}]*padding:\s*0\.9rem\s+1rem;[^}]*border-radius:\s*0\.875rem;[^}]*font-family:\s*"Minecraft2Bold"[^}]*font-size:\s*1\.75rem;/s;

	assert.match(cssSource, sharedSelectorPattern, "shared sizing selector group is missing");
});

test("daily-menu subject panels render block controls in a tab rail", () => {
	const componentSource = fs.readFileSync(
		path.join(projectRoot, "src", "components", "CalendarView.vue"),
		"utf8",
	);
	const cssSource = fs.readFileSync(path.join(sourceRoot, "css", "input.css"), "utf8");

	assert.match(
		componentSource,
		/<div\s+class="daily-menu-subject-tab-list"[^>]*role="tablist"[^>]*>/,
		"The subject panel should include a tablist for block controls",
	);
	assert.match(
		componentSource,
		/id="daily-menu-math-panel"[\s\S]*?daily-menu-subject-tab-list[\s\S]*?daily-menu-math-block-1-button/,
		"Math panel should place the block tabs inside the panel",
	);
	assert.match(
		cssSource,
		/\.daily-menu-subject-tab-list\s*\{[^}]*position:\s*absolute;[^}]*top:\s*calc\(-2\.8rem\s*-\s*3px\);[^}]*left:\s*50%;[^}]*flex-direction:\s*row;[^}]*transform:\s*translateX\(-50%\);/s,
		"Block controls should use a centered horizontal top tab rail",
	);
	assert.match(
		cssSource,
		/\.daily-menu-subject-tab-list > button\s*\{[^}]*border-radius:\s*0\.6rem\s+0\.6rem\s+0\s+0;/s,
		"Block tabs should keep their flat lower edge flush with the panel top",
	);
});

test("daily menu block panels include complete controls and confetti effects", () => {
	const componentSource = fs.readFileSync(
		path.join(projectRoot, "src", "components", "CalendarView.vue"),
		"utf8",
	);
	const cssSource = fs.readFileSync(path.join(sourceRoot, "css", "input.css"), "utf8");

	assert.match(
		componentSource,
		/class="daily-menu-block-complete-button"/,
		"Each block panel should include a complete button",
	);
	assert.match(
		componentSource,
		/handleBlockComplete|daily-menu-confetti-overlay/,
		"Block completion should trigger a confetti overlay behavior",
	);
	assert.match(
		cssSource,
		/\.daily-menu-block-complete-button\s*\{[^}]*border-radius:\s*9999px;[^}]*background:\s*linear-gradient\(180deg,\s*#fff7b8\s*0%,\s*#f8e99a\s*100%\);/s,
		"Complete buttons should be oval and pastel yellow",
	);
	assert.match(
		cssSource,
		/\.daily-menu-block-complete-button--complete\s*\{[^}]*background:\s*linear-gradient\(180deg,\s*#7efc9b\s*0%,\s*#2dd35a\s*100%\);[^}]*box-shadow:[^}]*0\s+0\s+18px\s*rgba\(34,\s*197,\s*94,\s*0\.8\)/s,
		"Completed buttons should glow green with confirmed state styling",
	);
});

test("text editor calibration toggle and navigation gradients match the control sequence", () => {
	const componentSource = fs.readFileSync(
		path.join(projectRoot, "src", "components", "ParentView.vue"),
		"utf8",
	);
	const cssSource = fs.readFileSync(path.join(sourceRoot, "css", "input.css"), "utf8");

	assert.match(
		componentSource,
		/id="text-editor-calibrate-button"[\s\S]*?@click="toggleCalibrateButton"/,
		"The text editor should include a dedicated calibrate button with a toggle click handler",
	);
	assert.match(
		componentSource,
		/v-if="isCalibrationBarVisible"|v-show="isCalibrationBarVisible"/,
		"The calibration bar should only render when the calibrate button is active",
	);
	const expectedButtonGradients = [
		[
			"text-editor-print-preview-button",
			"linear-gradient\\(90deg,\\s*#633b40\\s+0%,\\s*#855256\\s+48%,\\s*#65432f\\s+100%\\)",
		],
		[
			"text-editor-templates-button",
			"linear-gradient\\(90deg,\\s*#65432f\\s+0%,\\s*#8a5c3d\\s+50%,\\s*#5e542f\\s+100%\\)",
		],
		[
			"text-editor-grid-button",
			"linear-gradient\\(90deg,\\s*#5e542f\\s+0%,\\s*#81733e\\s+50%,\\s*#344d37\\s+100%\\)",
		],
		[
			"text-editor-fonts-button",
			"linear-gradient\\(90deg,\\s*#344d37\\s+0%,\\s*#49684d\\s+50%,\\s*#30485f\\s+100%\\)",
		],
		[
			"text-editor-margins-button",
			"linear-gradient\\(90deg,\\s*#30485f\\s+0%,\\s*#45627b\\s+50%,\\s*#3e3b53\\s+100%\\)",
		],
		[
			"text-editor-calibrate-button",
			"linear-gradient\\(90deg,\\s*#3e3b53\\s+0%,\\s*#57536f\\s+33\\.333%,\\s*#50384d\\s+66\\.667%,\\s*#704f6b\\s+100%\\)",
		],
	];
	for (const [buttonClass, gradientPattern] of expectedButtonGradients) {
		assert.match(
			cssSource,
			new RegExp(`\\.${buttonClass}\\s*\\{[^}]*background:\\s*${gradientPattern};`, "s"),
			`${buttonClass} should use its ordered muted rainbow segment`,
		);
	}
	assert.match(
		cssSource,
		/\.text-editor-calibrate-button\s*\{[^}]*width:\s*136px;[^}]*height:\s*64px;/s,
		"The Calibrate button should retain its existing size",
	);
	assert.match(
		cssSource,
		/\.text-editor-calibrate-button\.text-editor-button--depressed\s*\{[^}]*filter:\s*brightness\(1\.2\)\s*drop-shadow\(0\s+0\s+12px\s*#704f6b\);/s,
		"The active Calibrate button should use a muted violet pressed glow",
	);
});

test("back and home buttons pin to the upper-right corner of the screen", () => {
	const cssSource = fs.readFileSync(path.join(sourceRoot, "css", "input.css"), "utf8");

	assert.match(
		cssSource,
		/\.blocks-menu-sidebar-actions\s*\{[^}]*display:\s*flex;[^}]*justify-content:\s*center;[^}]*align-items:\s*center;[^}]*gap:\s*16px;[^}]*margin-top:\s*auto;/s,
		"The Blocks menu action row should sit at the bottom of the sidebar in a centered flex layout",
	);
	assert.match(
		cssSource,
		/\.parent-screen-back-button,\s*\.parent-screen-back-button-parent,\s*\.student-edits-screen-back-button,\s*\.blocks-screen-back-button,\s*\.curriculum-game-screen-back-button\s*\{[^}]*position:\s*fixed;[^}]*top:\s*16px;[^}]*right:\s*16px;/s,
		"Back buttons should sit 16px from the top edge and 16px from the right edge of the screen",
	);
	assert.match(
		cssSource,
		/\.student-edits-screen-home-button,\s*\.text-editor-home-button,\s*\.blocks-screen-home-button,\s*\.curriculum-game-screen-home-button,\s*\.daily-menu-home-button\s*\{[^}]*position:\s*fixed;[^}]*top:\s*16px;[^}]*right:\s*calc\(6rem\s*\+\s*32px\);/s,
		"Home buttons should sit 16px from the top edge with a 16px gap to the left edge of the Back button",
	);
});

test("blocks menu back and home buttons match the text editor control styling", () => {
	const cssSource = fs.readFileSync(path.join(sourceRoot, "css", "input.css"), "utf8");

	assert.match(
		cssSource,
		/\.student-edits-screen-home-button,\s*\.text-editor-home-button,\s*\.blocks-screen-home-button,\s*\.curriculum-game-screen-home-button,\s*\.daily-menu-home-button\s*\{[^}]*background:\s*linear-gradient\(180deg,\s*#246b39\s*0%,\s*#1d5a30\s*33\.333%,\s*#164a27\s*66\.667%,\s*#103a1e\s*100%\);/s,
		"Blocks and text editor home buttons should share the same green navigation styling",
	);
	assert.match(
		cssSource,
		/\.blocks-menu-sidebar-actions\s*\.blocks-screen-back-button\s*\{[^}]*border:\s*1px\s+solid\s*#0b2035;[^}]*background:\s*linear-gradient\(180deg,\s*#235b91\s*0%,\s*#1d4c7a\s*33\.333%,\s*#173e64\s*66\.667%,\s*#112f4e\s*100%\);/s,
		"Blocks back button should match the blue Text Editor back style exactly",
	);
	assert.doesNotMatch(
		cssSource,
		/\.blocks-menu-sidebar-actions\s*\.blocks-screen-back-button\s*\{[^}]*border:\s*1px\s+solid\s+rgba\(255,\s*248,\s*190,\s*0\.65\);/s,
		"Blocks back button must not keep the custom golden border when it should match the standard back control",
	);
});

test("src/css/input.css and src/js/main.js contain no stale, duplicate, or contradictory app logic", () => {
	const findings = [];
	const cssSource = fs.readFileSync(path.join(sourceRoot, "css", "input.css"), "utf8");
	const mainSource = fs.readFileSync(path.join(sourceRoot, "js", "main.js"), "utf8");
	const appSource = vueFiles.map((filePath) => fs.readFileSync(filePath, "utf8")).join("\n");

	const duplicateCssSelectors = collectDuplicateCssSelectors(cssSource);
	if (duplicateCssSelectors.length > 0) {
		findings.push(
			`input.css contains duplicate selectors: ${[...new Set(duplicateCssSelectors)].join(", ")}`,
		);
	}

	const staleCssSelectors = [...collectCssTokens(cssSource)].filter((token) => {
		return !appSource.includes(token) && !mainSource.includes(token);
	});
	if (staleCssSelectors.length > 0) {
		findings.push(
			`input.css contains stale selectors with no matching app usage: ${staleCssSelectors.join(", ")}`,
		);
	}

	const importPaths = [...mainSource.matchAll(/import\s+.*?from\s+["']([^"']+)["']/g)].map(
		(match) => match[1],
	);
	const duplicateImports = [
		...new Set(importPaths.filter((value, index) => importPaths.indexOf(value) !== index)),
	];
	if (duplicateImports.length > 0) {
		findings.push(`main.js contains duplicate imports: ${duplicateImports.join(", ")}`);
	}

	const mountCalls = [...mainSource.matchAll(/mount\(["'][^"']+["']\)/g)].length;
	if (mountCalls !== 1) {
		findings.push(`main.js should mount the app exactly once; found ${mountCalls} mount calls`);
	}

	assert.deepEqual(
		findings,
		[],
		`CSS/main script audit found stale or duplicate app logic:\n${findings.join("\n")}`,
	);
});

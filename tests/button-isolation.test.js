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

function collectButtonRecords(source, filePath) {
	return collectOpeningTags(source, "button").map((openingTag) => ({
		filePath,
		id: collectAttributeValues(openingTag, "id")[0] ?? "",
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

test("src/css/input.css and src/js/main.js contain no stale, duplicate, or contradictory app logic", () => {
	const findings = [];
	const cssSource = fs.readFileSync(path.join(sourceRoot, "css", "input.css"), "utf8");
	const mainSource = fs.readFileSync(path.join(sourceRoot, "js", "main.js"), "utf8");
	const appSource = vueFiles
		.map((filePath) => fs.readFileSync(filePath, "utf8"))
		.join("\n");

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
	const duplicateImports = [...new Set(importPaths.filter((value, index) => importPaths.indexOf(value) !== index))];
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

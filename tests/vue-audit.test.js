import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { ESLint } from "eslint";
import globals from "globals";
import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src");

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

function collectDuplicateNames(source) {
	const declarationPatterns = [
		/(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g,
		/function\s+([A-Za-z_$][\w$]*)/g,
		/class\s+([A-Za-z_$][\w$]*)/g,
	];

	const matches = new Map();

	for (const pattern of declarationPatterns) {
		for (const match of source.matchAll(pattern)) {
			const name = match[1];
			if (!name) {
				continue;
			}

			matches.set(name, (matches.get(name) ?? 0) + 1);
		}
	}

	return [...matches.entries()].filter(([, count]) => count > 1).map(([name]) => name);
}

function collectDuplicateIds(source) {
	const idCounts = new Map();

	for (const match of source.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)) {
		const value = match[1];
		idCounts.set(value, (idCounts.get(value) ?? 0) + 1);
	}

	return [...idCounts.entries()].filter(([, count]) => count > 1).map(([id]) => id);
}

function collectContradictoryStateChecks(source) {
	const checks = [...source.matchAll(/v-(?:if|else-if)\s*=\s*["']([^"']+)["']/g)].map(
		(match) => match[1],
	);
	const stateSignatures = new Map();
	const findings = new Set();

	for (const condition of checks) {
		const matches = [
			...condition.matchAll(/([A-Za-z_$][\w$]*)\s*(===|!==)\s*["']([^"']+)["']/g),
		];

		for (const match of matches) {
			const [, stateName, operator, literalValue] = match;
			const stateData = stateSignatures.get(stateName) ?? {
				equal: new Set(),
				notEqual: new Set(),
			};

			if (operator === "===") {
				stateData.equal.add(literalValue);
			} else {
				stateData.notEqual.add(literalValue);
			}

			if (stateData.equal.has(literalValue) && stateData.notEqual.has(literalValue)) {
				findings.add(`${stateName}:${literalValue}`);
			}

			stateSignatures.set(stateName, stateData);
		}
	}

	return [...findings];
}

function collectStyleBlocks(source) {
	return [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((match) => ({
		attributes: match[0].slice(0, match[0].indexOf(">") + 1),
		content: match[1],
	}));
}

function collectOpeningTags(source, tagName) {
	return [...source.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "g"))].map((match) => match[0]);
}

function collectAttributeValues(source, attributeName) {
	const escapedAttributeName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const pattern = new RegExp(`${escapedAttributeName}\\s*=\\s*(["'])(.*?)\\1`, "gs");
	return [...source.matchAll(pattern)].map((match) => match[2]);
}

const vueFiles = collectVueFiles(sourceRoot);

const eslint = new ESLint({
	cwd: projectRoot,
	overrideConfigFile: true,
	ignore: false,
	overrideConfig: [
		{
			ignores: ["dist/**", "node_modules/**", "playwright-report/**", "coverage/**"],
		},
		js.configs.recommended,
		...pluginVue.configs["flat/recommended"],
		{
			files: ["**/*.{js,mjs,cjs,vue}"],
			languageOptions: {
				globals: {
					...globals.browser,
					...globals.node,
				},
				ecmaVersion: "latest",
				sourceType: "module",
			},
			rules: {
				"no-console": "off",
				"no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
				"vue/attributes-order": "off",
				"vue/first-attribute-linebreak": "off",
				"vue/html-closing-bracket-newline": "off",
				"vue/html-indent": "off",
				"vue/html-self-closing": "off",
				"vue/max-attributes-per-line": "off",
				"vue/multiline-html-element-content-newline": "off",
				"vue/singleline-html-element-content-newline": "off",
			},
		},
	],
});

test("Vue files lint cleanly with the project ESLint + Vue rules", async () => {
	const results = await eslint.lintFiles(vueFiles);
	const violations = results.flatMap((result) =>
		result.messages.map((message) => ({
			filePath: result.filePath,
			line: message.line,
			column: message.column,
			severity: message.severity,
			text: message.message,
		})),
	);

	assert.deepEqual(
		violations,
		[],
		`Vue static audit found lint issues:\n${JSON.stringify(violations, null, 2)}`,
	);
});

test("Vue files do not contain duplicate declarations, ids, or stale template conditions", () => {
	const findings = [];

	for (const filePath of vueFiles) {
		const source = fs.readFileSync(filePath, "utf8");
		const scriptOnly = source.replace(/<template[\s\S]*?<\/template>/g, "");

		const duplicateDeclarations = collectDuplicateNames(scriptOnly);
		const duplicateIds = collectDuplicateIds(source);
		const staleTemplateConditions = collectContradictoryStateChecks(source);

		if (duplicateDeclarations.length > 0) {
			findings.push(
				`${path.relative(projectRoot, filePath)} duplicate declarations: ${[...new Set(duplicateDeclarations)].join(", ")}`,
			);
		}

		if (duplicateIds.length > 0) {
			findings.push(
				`${path.relative(projectRoot, filePath)} duplicate ids: ${[...new Set(duplicateIds)].join(", ")}`,
			);
		}

		if (staleTemplateConditions.length > 0) {
			findings.push(
				`${path.relative(projectRoot, filePath)} stale template conditions: ${[...new Set(staleTemplateConditions)].join(", ")}`,
			);
		}
	}

	assert.deepEqual(
		findings,
		[],
		`Vue static audit found structural issues:\n${findings.join("\n")}`,
	);
});

test("Calendar day-cell behaviors are not restricted to September", () => {
	const calendarViewSource = fs.readFileSync(
		path.join(sourceRoot, "components", "CalendarView.vue"),
		"utf8",
	);
	const dayCellSource = fs.readFileSync(
		path.join(sourceRoot, "components", "DayCellInteraction.vue"),
		"utf8",
	);

	const findings = [];
	if (calendarViewSource.includes('currentMonth.value.monthName === "September"')) {
		findings.push("CalendarView still gates day-cell behavior to September");
	}
	if (calendarViewSource.includes("!isSeptemberMonth.value || !cell?.isCurrentMonth")) {
		findings.push("CalendarView still blocks animation outside September");
	}
	if (dayCellSource.includes("cell.isCurrentMonth && isSeptemberMonth")) {
		findings.push("DayCellInteraction still restricts the September visual styling");
	}

	assert.deepEqual(
		findings,
		[],
		`Calendar day-cell behavior is still restricted to September:\n${findings.join("\n")}`,
	);
});

test("Vue files keep shared structure and style ownership consistent", () => {
	const findings = [];
	const globalStylesheetPath = path.join(sourceRoot, "css", "input.css");
	const cssFiles = fs
		.readdirSync(path.join(sourceRoot, "css"), { withFileTypes: true })
		.filter((entry) => entry.isFile() && entry.name.endsWith(".css"));

	if (!fs.existsSync(globalStylesheetPath)) {
		findings.push("src/css/input.css is missing as the global stylesheet entry");
	}

	if (cssFiles.length !== 1) {
		findings.push("src/css must contain exactly one global stylesheet entry");
	}

	const mainSource = fs.readFileSync(path.join(sourceRoot, "js", "main.js"), "utf8");
	if (!mainSource.includes('import "../css/input.css";')) {
		findings.push("src/js/main.js must import src/css/input.css");
	}

	for (const filePath of vueFiles) {
		const relativePath = path.relative(projectRoot, filePath);
		const source = fs.readFileSync(filePath, "utf8");
		const styleBlocks = collectStyleBlocks(source);

		if (!source.includes("<script setup>")) {
			findings.push(`${relativePath} must use <script setup>`);
		}

		if (/\s(?:style|:style)\s*=/.test(source)) {
			findings.push(`${relativePath} contains an inline style binding`);
		}

		if (collectAttributeValues(source, ":class").some((value) => /\+|\$\{/.test(value))) {
			findings.push(`${relativePath} constructs a dynamic class name`);
		}

		for (const buttonTag of collectOpeningTags(source, "button")) {
			if (!/\btype\s*=\s*["']button["']/.test(buttonTag)) {
				findings.push(`${relativePath} contains a button without type="button"`);
			}
		}

		for (const structuralTag of ["main", "aside", "nav", "section"]) {
			for (const openingTag of collectOpeningTags(source, structuralTag)) {
				if (!/\bid\s*=/.test(openingTag)) {
					findings.push(
						`${relativePath} contains <${structuralTag}> without a stable id`,
					);
				}
			}
		}

		for (const styleBlock of styleBlocks) {
			if (!/\bscoped\b/.test(styleBlock.attributes)) {
				findings.push(`${relativePath} contains an unscoped component style block`);
			}

			const allowedSelectorPrefixes = {
				"AdultView.vue": ["schedule-"],
				"CurriculumPanel.vue": [
					"cpp-",
					"python-",
					"web-based-",
					"computer-science-",
					"hardware-",
					"embedded-hardware-",
				],
			}[path.basename(filePath)];

			if (!allowedSelectorPrefixes) {
				findings.push(
					`${relativePath} owns component CSS without an explicit ownership rule`,
				);
				continue;
			}

			const selectors = [...styleBlock.content.matchAll(/\.([A-Za-z][\w-]*)\s*[{,:]/g)].map(
				(match) => match[1],
			);
			if (
				selectors.some(
					(selector) =>
						!allowedSelectorPrefixes.some((prefix) => selector.startsWith(prefix)),
				)
			) {
				findings.push(`${relativePath} contains a selector outside its ownership rule`);
			}
		}
	}

	assert.deepEqual(
		findings,
		[],
		`Vue static consistency audit found issues:\n${findings.join("\n")}`,
	);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src");
const cssFilePath = path.join(sourceRoot, "css", "input.css");
const mainJsFilePath = path.join(sourceRoot, "js", "main.js");
const cssSource = fs.readFileSync(cssFilePath, "utf8");
const mainJsSource = fs.readFileSync(mainJsFilePath, "utf8");

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

function stripCssCommentsAndStrings(source) {
	return source
		.replace(/\/\*[\s\S]*?\*\//g, "")
		.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""');
}

test("src/css/input.css has balanced braces and terminated comments", () => {
	const findings = [];

	const commentOpenCount = (cssSource.match(/\/\*/g) ?? []).length;
	const commentCloseCount = (cssSource.match(/\*\//g) ?? []).length;
	if (commentOpenCount !== commentCloseCount) {
		findings.push(
			`input.css has an unterminated comment (found ${commentOpenCount} "/*" and ${commentCloseCount} "*/")`,
		);
	}

	const strippedSource = stripCssCommentsAndStrings(cssSource);
	const openBraceCount = (strippedSource.match(/\{/g) ?? []).length;
	const closeBraceCount = (strippedSource.match(/\}/g) ?? []).length;
	if (openBraceCount !== closeBraceCount) {
		findings.push(
			`input.css has mismatched braces (found ${openBraceCount} "{" and ${closeBraceCount} "}"), which can silently swallow or drop unrelated rules`,
		);
	}

	let depth = 0;
	for (const character of strippedSource) {
		if (character === "{") {
			depth += 1;
		} else if (character === "}") {
			depth -= 1;
			if (depth < 0) {
				findings.push("input.css contains a closing brace with no matching opening brace");
				break;
			}
		}
	}

	assert.deepEqual(findings, [], `Stylesheet syntax audit found issues:\n${findings.join("\n")}`);
});

test("CSS custom properties used by var() stay wired to their JavaScript/Vue source of truth", () => {
	const findings = [];
	const appSources = [
		mainJsSource,
		...collectVueFiles(sourceRoot).map((filePath) => fs.readFileSync(filePath, "utf8")),
	].join("\n");

	const varUsedProperties = new Set(
		[...cssSource.matchAll(/var\(\s*(--[A-Za-z0-9-]+)/g)].map((match) => match[1]),
	);
	const cssDeclaredProperties = new Set(
		[...cssSource.matchAll(/(--[A-Za-z0-9-]+)\s*:/g)].map((match) => match[1]),
	);
	const jsSetProperties = new Set(
		[...appSources.matchAll(/setProperty\(\s*["'](--[A-Za-z0-9-]+)["']/g)].map(
			(match) => match[1],
		),
	);

	for (const property of varUsedProperties) {
		if (!cssDeclaredProperties.has(property) && !jsSetProperties.has(property)) {
			findings.push(
				`input.css reads var(${property}) but no CSS declaration or JavaScript setProperty("${property}", ...) call provides a value`,
			);
		}
	}

	for (const property of jsSetProperties) {
		if (!varUsedProperties.has(property)) {
			findings.push(
				`a setProperty("${property}", ...) call has no matching var(${property}) usage in input.css`,
			);
		}
	}

	assert.deepEqual(
		findings,
		[],
		`Custom property wiring audit found issues:\n${findings.join("\n")}`,
	);
});

test("src/js/main.js relative imports resolve to files that exist on disk", () => {
	const findings = [];
	const relativeImportPaths = [
		...mainJsSource.matchAll(/import\s+(?:[\s\S]*?\s+from\s+)?["'](\.\.?\/[^"']+)["']/g),
	].map((match) => match[1]);

	for (const importPath of relativeImportPaths) {
		const resolvedPath = path.resolve(path.dirname(mainJsFilePath), importPath);
		if (!fs.existsSync(resolvedPath)) {
			findings.push(
				`src/js/main.js imports "${importPath}", which does not resolve to a file on disk`,
			);
		}
	}

	assert.deepEqual(
		findings,
		[],
		`main.js import resolution audit found issues:\n${findings.join("\n")}`,
	);
});

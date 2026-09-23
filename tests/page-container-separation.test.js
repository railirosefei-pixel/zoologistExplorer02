import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

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

function getAttributeValue(tag, attributeName) {
	const escaped = attributeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = tag.match(new RegExp(`${escaped}\\s*=\\s*["']([^"']+)["']`, "i"));
	return match ? match[1] : "";
}

function collectPageAndContainerTags(source) {
	return [...source.matchAll(/<(main|section|aside|article|header|footer)\b[^>]*>/gi)].map(
		(match) => match[0],
	);
}

function collectSelectors(source) {
	return [...source.matchAll(/\.([A-Za-z][\w-]*)\s*[{,:]/g)].map((match) => match[1]);
}

const vueFiles = collectVueFiles(sourceRoot);
const sourceFiles = [
	path.join(projectRoot, "index.html"),
	path.join(sourceRoot, "js", "main.js"),
	path.join(sourceRoot, "css", "input.css"),
	...vueFiles,
];

test("pages and containers keep unique identification, role, and title metadata", () => {
	const findings = [];
	const seenIds = new Map();

	for (const filePath of sourceFiles) {
		if (!fs.existsSync(filePath)) {
			findings.push(
				`${path.relative(projectRoot, filePath)} is missing from the page/container audit`,
			);
			continue;
		}

		const source = fs.readFileSync(filePath, "utf8");
		const relativePath = path.relative(projectRoot, filePath);

		if (filePath.endsWith("index.html") && !source.includes('<div id="app"></div>')) {
			findings.push("index.html is missing the single #app mount point");
		}

		if (filePath.endsWith("main.js") && !source.includes('mount("#app")')) {
			findings.push("src/js/main.js is missing the #app mount call");
		}

		if (filePath.endsWith("input.css")) {
			const broadSelectors = [
				"main",
				"section",
				"aside",
				"article",
				"div",
				"header",
				"footer",
				"page",
				"container",
			].filter((selector) =>
				new RegExp(`(^|[\\s,{])${selector}(?=[\\s,{])`, "i").test(source),
			);

			if (broadSelectors.length > 0) {
				findings.push(
					`src/css/input.css contains general structural selectors that can affect unrelated pages and containers: ${broadSelectors.join(", ")}`,
				);
			}

			const selectors = collectSelectors(source);
			if (
				selectors.some((selector) =>
					/^(page-|container-|content-|layout-|shell-|header-|footer-)/.test(selector),
				)
			) {
				// Intentionally not enforcing repeated selector-name ownership here; the audit focuses on
				// structural metadata and broad global selectors that can unintentionally affect unrelated pages and containers.
			}
		}

		for (const tagString of collectPageAndContainerTags(source)) {
			const tagName = tagString.match(/^<([a-z]+)/i)?.[1].toLowerCase();
			const id = getAttributeValue(tagString, "id");
			const role = getAttributeValue(tagString, "role");
			const label = getAttributeValue(tagString, "aria-label");
			const labelledBy = getAttributeValue(tagString, "aria-labelledby");
			const title = getAttributeValue(tagString, "title");
			const classes = getAttributeValue(tagString, "class");

			if (!id) {
				findings.push(`${relativePath} contains a ${tagName} without a stable id`);
			} else {
				const previous = seenIds.get(id) ?? [];
				seenIds.set(id, [...previous, relativePath]);
			}

			if (!classes) {
				findings.push(
					`${relativePath} contains a ${tagName} without a dedicated styling class`,
				);
			}

			if (
				["main", "article", "section", "aside"].includes(tagName) &&
				!/main|region|complementary|article|tabpanel/i.test(role)
			) {
				findings.push(
					`${relativePath} contains a page or container section without a meaningful role`,
				);
			}

			if (!label && !labelledBy) {
				findings.push(`${relativePath} contains a ${tagName} without an accessible label`);
			}

			if (!title) {
				findings.push(`${relativePath} contains a ${tagName} without a title attribute`);
			}
		}
	}

	for (const [id, files] of seenIds) {
		if (files.length > 1) {
			findings.push(`id "${id}" is reused in ${files.join(", ")}`);
		}
	}

	assert.deepEqual(
		findings,
		[],
		`Page and container separation audit found issues:\n${findings.join("\n")}`,
	);
});

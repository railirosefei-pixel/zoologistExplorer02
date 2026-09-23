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

function collectStructuralTags(source) {
	return [...source.matchAll(/<(nav|section|aside|main)\b[^>]*>/gi)].map((match) => match[0]);
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

test("menus and panels keep unique identification, role, and title metadata", () => {
	const findings = [];
	const seenIds = new Map();

	for (const filePath of sourceFiles) {
		if (!fs.existsSync(filePath)) {
			findings.push(
				`${path.relative(projectRoot, filePath)} is missing from the menu/panel audit`,
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
			const broadSelectors = ["nav", "section", "aside", "main", "menu", "panel"].filter(
				(selector) => new RegExp(`(^|[\\s,{])${selector}(?=[\\s,{])`, "i").test(source),
			);

			if (broadSelectors.length > 0) {
				findings.push(
					`src/css/input.css contains general structural selectors that can affect unrelated menus and panels: ${broadSelectors.join(", ")}`,
				);
			}

			const selectors = collectSelectors(source);
			if (selectors.some((selector) => /^(menu-|panel-|hero-|site-header)/.test(selector))) {
				// Intentionally not enforcing repeated selector-name ownership here; the audit focuses on
				// structural metadata and broad global selectors that can unintentionally affect unrelated menus and panels.
			}
		}

		for (const tagString of collectStructuralTags(source)) {
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

			if (tagName === "nav" && !/navigation/i.test(role)) {
				findings.push(
					`${relativePath} contains a navigation menu without a navigation role`,
				);
			}

			if (tagName === "section" && !/region|tabpanel/i.test(role)) {
				findings.push(`${relativePath} contains a section panel without a region role`);
			}

			if (tagName === "main" && !/main/i.test(role)) {
				findings.push(`${relativePath} contains a main container without a main role`);
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
		`Menu and panel separation audit found issues:\n${findings.join("\n")}`,
	);
});

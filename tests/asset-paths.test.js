import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src");
const deploymentPrefix = "/zoologistExplorer02/";
const assetExtensions = /\.(?:avif|gif|jpe?g|mp3|mp4|ogg|otf|png|svg|wav|webm|webp|woff2?)$/i;

function collectSourceFiles(directory) {
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			return collectSourceFiles(fullPath);
		}

		return entry.isFile() && /\.(?:css|js|vue)$/.test(entry.name) ? [fullPath] : [];
	});
}

test("application asset references use Vite-managed paths", () => {
	const findings = [];

	for (const filePath of collectSourceFiles(sourceRoot)) {
		const source = fs.readFileSync(filePath, "utf8");
		const relativePath = path.relative(projectRoot, filePath);

		if (source.includes(deploymentPrefix)) {
			findings.push(`${relativePath} contains the deployment prefix ${deploymentPrefix}`);
		}

		for (const match of source.matchAll(/(?:url|src|href)\s*[:=(]\s*["']([^"']+)["']/g)) {
			const assetReference = match[1];
			if (assetExtensions.test(assetReference) && !assetReference.startsWith("../")) {
				findings.push(
					`${relativePath} uses a non-imported asset reference: ${assetReference}`,
				);
			}
		}
	}

	assert.deepEqual(findings, [], `Asset path audit found issues:\n${findings.join("\n")}`);
});

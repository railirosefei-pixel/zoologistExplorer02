import { fontStyleOptions } from "./fontStyleOptions.js";

const FORMATTED_TEXT_PREFIX = "\u0000ze2-font-style-v1:";
const allowedFontStyleIds = new Set(fontStyleOptions.map(({ id }) => id));

function sanitizeElementChildren(element) {
	for (const child of [...element.childNodes]) {
		if (child.nodeType !== Node.ELEMENT_NODE) {
			if (child.nodeType !== Node.TEXT_NODE) {
				child.remove();
			}
			continue;
		}

		const tagName = child.tagName.toLowerCase();
		sanitizeElementChildren(child);
		if (tagName === "br" || tagName === "div" || tagName === "p") {
			for (const attribute of [...child.attributes]) {
				child.removeAttribute(attribute.name);
			}
			continue;
		}
		if (tagName === "span") {
			const fontStyleId = child.dataset.fontStyle;
			const fontSize = child.style.fontSize;
			const fontColor = /^#[\da-f]{6}$/i.test(child.dataset.fontColor ?? "")
				? child.dataset.fontColor.toLowerCase()
				: null;
			for (const attribute of [...child.attributes]) {
				child.removeAttribute(attribute.name);
			}
			if (fontStyleId && allowedFontStyleIds.has(fontStyleId)) {
				child.setAttribute("data-font-style", fontStyleId);
			}
			if (fontColor) {
				child.setAttribute("data-font-color", fontColor);
			}
			const styles = [];
			if (fontSize) {
				styles.push(`font-size: ${fontSize};`);
			}
			if (fontColor) {
				styles.push(`color: ${fontColor};`);
			}
			if (styles.length > 0) {
				child.setAttribute("style", styles.join(" "));
			}
			continue;
		}
		child.replaceWith(...child.childNodes);
	}
}

function appendNormalizedNode(node, parent) {
	if (node.nodeType === Node.TEXT_NODE) {
		parent.append(node.cloneNode());
		return;
	}
	if (node.nodeType !== Node.ELEMENT_NODE) {
		return;
	}
	if (node.tagName === "BR") {
		parent.append(document.createTextNode("\n"));
		return;
	}
	if (node.tagName === "DIV" || node.tagName === "P") {
		const children = [...node.childNodes];
		if (children.length === 1 && children[0].nodeName === "BR") {
			return;
		}
		appendNormalizedNodes(children, parent);
		return;
	}
	const normalized = node.cloneNode(false);
	parent.append(normalized);
	appendNormalizedNodes([...node.childNodes], normalized);
}

function appendNormalizedNodes(nodes, parent) {
	for (const node of nodes) {
		const isBlock = node.nodeType === Node.ELEMENT_NODE && ["DIV", "P"].includes(node.tagName);
		if (isBlock && parent.hasChildNodes()) {
			parent.append(document.createTextNode("\n"));
		}
		appendNormalizedNode(node, parent);
	}
}

function sanitizedHtml(html) {
	const container = document.createElement("div");
	container.innerHTML = html;
	sanitizeElementChildren(container);
	const normalized = document.createDocumentFragment();
	appendNormalizedNodes([...container.childNodes], normalized);
	container.replaceChildren(normalized);
	return container.innerHTML;
}

function appendPlainText(node, chunks) {
	if (node.nodeType === Node.TEXT_NODE) {
		chunks.push(node.nodeValue);
		return;
	}
	if (node.nodeType !== Node.ELEMENT_NODE) {
		return;
	}
	if (node.tagName === "BR") {
		chunks.push("\n");
		return;
	}
	if ((node.tagName === "DIV" || node.tagName === "P") && chunks.length > 0) {
		if (!chunks.at(-1).endsWith("\n")) {
			chunks.push("\n");
		}
	}
	for (const child of node.childNodes) {
		appendPlainText(child, chunks);
	}
}

/** Return a plain-text value or a versioned, sanitized HTML value for storage. */
export function serializeFormattedText(editor) {
	sanitizeElementChildren(editor);
	const html = editor.innerHTML;
	if (editor.querySelector("[data-font-style], [data-font-color], span[style]")) {
		return `${FORMATTED_TEXT_PREFIX}${html}`;
	}
	const chunks = [];
	for (const child of editor.childNodes) {
		appendPlainText(child, chunks);
	}
	return chunks.join("");
}

/** Convert a stored editor value into safe HTML for an editable or display surface. */
export function formattedTextToHtml(value) {
	if (typeof value !== "string") {
		return "";
	}
	if (value.startsWith(FORMATTED_TEXT_PREFIX)) {
		return sanitizedHtml(value.slice(FORMATTED_TEXT_PREFIX.length));
	}
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

/** Sanitize content pasted into a formatted editor to plain text. */
export function insertPlainTextAtSelection(editor, text) {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) {
		return;
	}
	const range = selection.getRangeAt(0);
	if (!editor.contains(range.commonAncestorContainer)) {
		return;
	}
	range.deleteContents();
	const textNode = document.createTextNode(text);
	range.insertNode(textNode);
	range.setStartAfter(textNode);
	range.collapse(true);
	selection.removeAllRanges();
	selection.addRange(range);
}

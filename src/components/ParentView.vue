<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watchEffect } from "vue";

import { addSavedTemplate, buildTemplateEntry, loadSavedTemplates } from "../js/templateStorage.js";
import { convertToPixels } from "../js/unitConversion.js";

const emit = defineEmits(["open-student-edits", "back-to-home"]);
const isTextEditorOpen = ref(false);
const textEditorButtonStates = ref({
	printPreview: false,
	templates: false,
	grid: false,
	calibrate: false,
});
const isEditingToolsOpen = ref(false);
const isSizePanelOpen = ref(false);
const isFontsPanelOpen = ref(false);
const isStylesMenuOpen = ref(false);
const isWeightMenuOpen = ref(false);
const isWidthMenuOpen = ref(false);
const isHeightMenuOpen = ref(false);
const isSavedTemplatesListOpen = ref(false);
const widthValue = ref("8");
const heightValue = ref("10");
const widthUnit = ref("in");
const heightUnit = ref("in");
const FONT_STYLE_STORAGE_KEY = "ze2.textEditor.fontStyle";
const CALIBRATION_STORAGE_KEY = "ze2.textEditor.calibration";

function loadActiveFontStyleId() {
	try {
		return window.localStorage.getItem(FONT_STYLE_STORAGE_KEY);
	} catch {
		return null;
	}
}

const activeFontStyleId = ref(loadActiveFontStyleId());
/** Initial font weight derived from the persisted font style id. */
function getInitialFontWeight() {
	if (!activeFontStyleId.value) {
		return "100";
	}
	return activeFontStyleId.value.includes("bold") ? "700" : "400";
}

const selectedFontWeight = ref(getInitialFontWeight());

/** Load persisted calibration bar state, or null when unavailable/invalid. */
function loadCalibrationState() {
	try {
		const raw = window.localStorage.getItem(CALIBRATION_STORAGE_KEY);
		if (!raw) {
			return null;
		}
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" ? parsed : null;
	} catch {
		return null;
	}
}

const savedCalibrationState = loadCalibrationState();
const isCalibrationBarVisible = ref(false);
const calibrationButtonRef = ref(null);
const calibrationBarFrameRef = ref(null);
const calibrationBarLengthPx = ref(
	Number.isFinite(savedCalibrationState?.lengthPx) && savedCalibrationState.lengthPx > 0
		? savedCalibrationState.lengthPx
		: 500,
);
const isCalibrationBarHorizontal = ref(savedCalibrationState?.isHorizontal === true);
const calibrationPixelsPerUnit = ref(
	Number.isFinite(savedCalibrationState?.pixelsPerUnit) && savedCalibrationState.pixelsPerUnit > 0
		? savedCalibrationState.pixelsPerUnit
		: null,
);
const calibrationUnit = ref(
	["in", "cm", "mm"].includes(savedCalibrationState?.unit) ? savedCalibrationState.unit : "in",
);
const calibrationRealLengthInput = ref("");
let calibrationBarDragMode = "";
let calibrationBarDragStartY = 0;
let calibrationBarDragStartX = 0;
let calibrationBarDragStartLengthPx = calibrationBarLengthPx.value;
let calibrationBarDragStartTopPx = 40;
let calibrationBarDragStartLeftPx = 160;
let pendingFontWeightSpan = null;

/** Persist the current calibration bar state so it survives reloads. */
function saveCalibrationState() {
	try {
		window.localStorage.setItem(
			CALIBRATION_STORAGE_KEY,
			JSON.stringify({
				lengthPx: calibrationBarLengthPx.value,
				isHorizontal: isCalibrationBarHorizontal.value,
				pixelsPerUnit: calibrationPixelsPerUnit.value,
				unit: calibrationUnit.value,
			}),
		);
	} catch {
		// localStorage unavailable; calibration stays session-only.
	}
}

/** Push the tracked bar length into the frame's CSS variables so rendering matches state. */
function applyCalibrationBarSizeToFrame() {
	const frame = calibrationBarFrameRef.value;
	if (!frame) {
		return;
	}
	frame.style.setProperty("--calibration-bar-height", `${calibrationBarLengthPx.value}px`);
	frame.style.setProperty("--calibration-bar-width", `${calibrationBarLengthPx.value}px`);
}

/** Rotate the bar; the measured length carries across orientations unchanged. */
function toggleCalibrationBarOrientation() {
	isCalibrationBarHorizontal.value = !isCalibrationBarHorizontal.value;
	applyCalibrationBarSizeToFrame();
	saveCalibrationState();
}

/** Physical-unit label derived from the stored ruler calibration. */
const calibratedLengthLabel = computed(() => {
	if (!calibrationPixelsPerUnit.value) {
		return "";
	}
	const physicalLength = calibrationBarLengthPx.value / calibrationPixelsPerUnit.value;
	return `${physicalLength.toFixed(2)} ${calibrationUnit.value}`;
});

/** Derive and store pixels-per-unit from a user-measured real-world bar length. */
function commitCalibration() {
	const realLength = Number.parseFloat(calibrationRealLengthInput.value);
	if (!Number.isFinite(realLength) || realLength <= 0) {
		return;
	}
	calibrationPixelsPerUnit.value = calibrationBarLengthPx.value / realLength;
	saveCalibrationState();
}

function handleStudentEditsOpen() {
	emit("open-student-edits");
}

function handleParentScreenClose() {
	emit("back-to-home");
}

/** Insert four spaces for Tab and prevent Enter from moving past the template's final line. */
function handlePaperEditorKeydown(event) {
	if (event.key === "Tab") {
		event.preventDefault();
		document.execCommand("insertText", false, "    ");
		return;
	}

	if (event.key !== "Enter") {
		return;
	}

	const editor = printPreviewPaperEditorRef.value;
	if (!editor) {
		return;
	}

	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) {
		return;
	}

	const range = selection.getRangeAt(0);
	const caretRect = range.collapsed ? range.getBoundingClientRect() : range.getClientRects()[0];
	const editorRect = editor.getBoundingClientRect();
	const computedStyle = window.getComputedStyle(editor);
	const lineHeightPx =
		(caretRect && Number.parseFloat(caretRect.height)) ||
		Number.parseFloat(computedStyle.lineHeight) ||
		Number.parseFloat(computedStyle.fontSize) * 1.2 ||
		20;

	if (!caretRect || (caretRect.top === 0 && caretRect.bottom === 0 && caretRect.height === 0)) {
		if (editor.scrollHeight > editor.clientHeight + 1) {
			event.preventDefault();
		}
		return;
	}

	// Hard boundary: Enter is ignored only when one more line would exceed the editor bottom.
	if (caretRect.bottom + lineHeightPx > editorRect.bottom - 1) {
		event.preventDefault();
	}
}

function handlePaperEditorInput() {
	const editor = printPreviewPaperEditorRef.value;
	if (!editor) {
		return;
	}
	// Disarm any armed weight spans: once the caret has left a span (any
	// edit that the beforeinput redirect did not consume), it is no longer
	// the pending typing target and must not swallow further keystrokes.
	for (const caretSpan of editor.querySelectorAll("[data-font-weight-caret]")) {
		delete caretSpan.dataset.fontWeightCaret;
		if (caretSpan === pendingFontWeightSpan) {
			pendingFontWeightSpan = null;
		}
	}
}

function handlePaperEditorBeforeInput(event) {
	if (
		!pendingFontWeightSpan ||
		!printPreviewPaperEditorRef.value?.contains(pendingFontWeightSpan) ||
		!event.data ||
		!event.inputType.startsWith("insert")
	) {
		return;
	}
	event.preventDefault();
	let textNode = pendingFontWeightSpan.lastChild;
	if (textNode?.nodeType === Node.TEXT_NODE) {
		textNode.appendData(event.data);
	} else {
		textNode = document.createTextNode(event.data);
		pendingFontWeightSpan.append(textNode);
	}
	const selection = window.getSelection();
	const range = document.createRange();
	range.setStartAfter(textNode);
	range.collapse(true);
	selection?.removeAllRanges();
	selection?.addRange(range);
}

function handlePaperTemplateSave() {
	templateNameInput.value = "";
	isTemplateNamePromptOpen.value = true;
	nextTick(() => {
		if (templateNameInputRef.value) {
			templateNameInputRef.value.focus();
		}
	});
}

function captureCurrentTemplate() {
	const editor = printPreviewPaperEditorRef.value;
	if (!editor) {
		return null;
	}

	const styles = window.getComputedStyle(editor);
	return {
		html: editor.innerHTML,
		widthValue: widthValue.value,
		widthUnit: widthUnit.value,
		heightValue: heightValue.value,
		heightUnit: heightUnit.value,
		fontFamily: styles.fontFamily,
		fontSize: styles.fontSize,
		fontColor: styles.color,
		textAlign: styles.textAlign,
		padding: styles.padding,
	};
}

function cancelTemplateSave() {
	isTemplateNamePromptOpen.value = false;
	templateNameInput.value = "";
}

function confirmTemplateSave() {
	const trimmedName = templateNameInput.value.trim();
	if (!trimmedName) {
		return;
	}

	const snapshot = captureCurrentTemplate();
	if (!snapshot) {
		cancelTemplateSave();
		return;
	}

	savedTemplates.value = addSavedTemplate(buildTemplateEntry(trimmedName, snapshot));
	cancelTemplateSave();
	textEditorButtonStates.value.printPreview = false;
	handleTextEditorClose();
}

/** Return from Text Editor to the Parent menu. */
function handleTextEditorClose() {
	pendingFontWeightSpan = null;
	isTextEditorOpen.value = false;
	textEditorButtonStates.value.printPreview = false;
	textEditorButtonStates.value.templates = false;
	textEditorButtonStates.value.grid = false;
	textEditorButtonStates.value.calibrate = false;
	isCalibrationBarVisible.value = false;
	isSavedTemplatesListOpen.value = false;
	isEditingToolsOpen.value = false;
	isSizePanelOpen.value = false;
	isFontsPanelOpen.value = false;
	isStylesMenuOpen.value = false;
	isWeightMenuOpen.value = false;
	isWidthMenuOpen.value = false;
	isHeightMenuOpen.value = false;
}

function handleTextEditorOpen() {
	isTextEditorOpen.value = true;
}

function toggleTextEditorButton(buttonName) {
	if (buttonName === "printPreview") {
		textEditorButtonStates.value.printPreview = true;
		nextTick(() => {
			const paperEditor = printPreviewPaperEditorRef.value;
			if (!paperEditor) {
				return;
			}
			paperEditor.focus();
			const selection = window.getSelection();
			selection?.selectAllChildren(paperEditor);
			selection?.collapseToStart();
		});
		return;
	}

	textEditorButtonStates.value[buttonName] = !textEditorButtonStates.value[buttonName];
}

function closeTextEditorDropdowns() {
	isSavedTemplatesListOpen.value = false;
	isStylesMenuOpen.value = false;
	isWeightMenuOpen.value = false;
	isSizePanelOpen.value = false;
	isWidthMenuOpen.value = false;
	isHeightMenuOpen.value = false;
}

function handleDocumentPointerDown(event) {
	const sidebar = document.getElementById("text-editor-templates-panel");
	if (!sidebar || sidebar.contains(event.target)) {
		return;
	}
	// Word-ribbon light dismiss: close only the floating menus, not the
	// inline panels whose buttons stay visible inside the ribbon.
	isStylesMenuOpen.value = false;
	isWeightMenuOpen.value = false;
	isWidthMenuOpen.value = false;
	isHeightMenuOpen.value = false;
}

function handleDocumentKeydown(event) {
	if (event.key === "Escape") {
		closeTextEditorDropdowns();
	}
}

onMounted(() => {
	document.addEventListener("pointerdown", handleDocumentPointerDown);
	document.addEventListener("keydown", handleDocumentKeydown);
});

onBeforeUnmount(() => {
	document.removeEventListener("pointerdown", handleDocumentPointerDown);
	document.removeEventListener("keydown", handleDocumentKeydown);
});

function toggleSavedTemplatesList() {
	isSavedTemplatesListOpen.value = !isSavedTemplatesListOpen.value;
	if (isSavedTemplatesListOpen.value) {
		savedTemplates.value = loadSavedTemplates();
		isStylesMenuOpen.value = false;
		isWeightMenuOpen.value = false;
		isWidthMenuOpen.value = false;
		isHeightMenuOpen.value = false;
	}
}

function applyTemplateTypography(editor, template = {}) {
	const styleMap = [
		{ value: template.fontFamily, property: "font-family" },
		{ value: template.fontSize, property: "font-size" },
		{ value: template.fontColor, property: "color" },
		{ value: template.textAlign, property: "text-align" },
		{ value: template.padding, property: "padding" },
	];

	for (const { value, property } of styleMap) {
		if (typeof value === "string" && value) {
			editor.style.setProperty(property, value);
		}
	}
}

async function loadSavedTemplate(entry) {
	if (!entry || !entry.template) {
		return;
	}

	widthValue.value = entry.template.widthValue ?? widthValue.value;
	widthUnit.value = entry.template.widthUnit ?? widthUnit.value;
	heightValue.value = entry.template.heightValue ?? heightValue.value;
	heightUnit.value = entry.template.heightUnit ?? heightUnit.value;
	textEditorButtonStates.value.printPreview = true;
	isSavedTemplatesListOpen.value = false;
	pendingFontWeightSpan = null;

	await nextTick();
	const editor = printPreviewPaperEditorRef.value;
	if (!editor) {
		return;
	}

	editor.innerHTML = entry.template.html ?? "";
	applyTemplateTypography(editor, entry.template);
}

function toggleEditingTools() {
	isEditingToolsOpen.value = !isEditingToolsOpen.value;
	if (!isEditingToolsOpen.value) {
		isSizePanelOpen.value = false;
		isFontsPanelOpen.value = false;
		isStylesMenuOpen.value = false;
		isWeightMenuOpen.value = false;
		isWidthMenuOpen.value = false;
		isHeightMenuOpen.value = false;
	}
}

function toggleFontsPanel() {
	isFontsPanelOpen.value = !isFontsPanelOpen.value;
	if (!isFontsPanelOpen.value) {
		isStylesMenuOpen.value = false;
		isWeightMenuOpen.value = false;
	}
}

function toggleStylesMenu() {
	if (!isFontsPanelOpen.value) {
		return;
	}
	isStylesMenuOpen.value = !isStylesMenuOpen.value;
	isWeightMenuOpen.value = false;
	if (isStylesMenuOpen.value) {
		isSavedTemplatesListOpen.value = false;
		isWidthMenuOpen.value = false;
		isHeightMenuOpen.value = false;
	}
}

function toggleWeightMenu() {
	if (!isFontsPanelOpen.value) {
		return;
	}
	isWeightMenuOpen.value = !isWeightMenuOpen.value;
	isStylesMenuOpen.value = false;
	if (isWeightMenuOpen.value) {
		isSavedTemplatesListOpen.value = false;
		isWidthMenuOpen.value = false;
		isHeightMenuOpen.value = false;
	}
}

function ensureEditorSelection(editor) {
	const selection = window.getSelection();
	if (
		selection &&
		selection.rangeCount > 0 &&
		editor.contains(selection.getRangeAt(0).commonAncestorContainer)
	) {
		return;
	}

	editor.focus();
	const range = document.createRange();
	range.selectNodeContents(editor);
	range.collapse(false);
	selection?.removeAllRanges();
	selection?.addRange(range);
}

function applyFontStyle(fontOption) {
	const editor = printPreviewPaperEditorRef.value;
	if (!editor || !fontOption?.family) {
		return;
	}
	activeFontStyleId.value = activeFontStyleId.value === fontOption.id ? null : fontOption.id;
	try {
		if (activeFontStyleId.value) {
			window.localStorage.setItem(FONT_STYLE_STORAGE_KEY, activeFontStyleId.value);
		} else {
			window.localStorage.removeItem(FONT_STYLE_STORAGE_KEY);
		}
	} catch {
		// Keep the selection usable for this session when storage is unavailable.
	}
	selectedFontWeight.value = fontOption.weight;
	pendingFontWeightSpan = null;
	ensureEditorSelection(editor);
	document.execCommand("fontName", false, fontOption.family);
}

function applyFontWeight(weight) {
	const editor = printPreviewPaperEditorRef.value;
	if (!editor || !/^([1-9]00)$/.test(weight)) {
		return;
	}
	selectedFontWeight.value = weight;
	pendingFontWeightSpan = null;
	const selection = window.getSelection();
	ensureEditorSelection(editor);
	if (!selection || selection.rangeCount === 0) {
		return;
	}

	const range = selection.getRangeAt(0);
	const weightSpan = document.createElement("span");
	weightSpan.style.fontWeight = weight;
	const isCollapsed = range.collapsed;
	if (isCollapsed) {
		pendingFontWeightSpan = weightSpan;
		weightSpan.dataset.fontWeightCaret = "";
		range.insertNode(weightSpan);
		range.selectNodeContents(weightSpan);
		range.collapse(true);
	} else {
		weightSpan.append(range.extractContents());
		range.insertNode(weightSpan);
		range.selectNodeContents(weightSpan);
		range.collapse(false);
	}
	if (!isCollapsed) {
		editor.normalize();
	}
	selection.removeAllRanges();
	selection.addRange(range);
	isWeightMenuOpen.value = false;
}

function toggleSizePanel() {
	isSizePanelOpen.value = !isSizePanelOpen.value;
	pendingFontWeightSpan = null;
	if (!isSizePanelOpen.value) {
		isWidthMenuOpen.value = false;
		isHeightMenuOpen.value = false;
		return;
	}
	isSavedTemplatesListOpen.value = false;
	isStylesMenuOpen.value = false;
	isWeightMenuOpen.value = false;
}

function toggleUnitMenu(field) {
	if (field === "width") {
		isWidthMenuOpen.value = !isWidthMenuOpen.value;
		isHeightMenuOpen.value = false;
	} else {
		isHeightMenuOpen.value = !isHeightMenuOpen.value;
		isWidthMenuOpen.value = false;
	}
	if (isWidthMenuOpen.value || isHeightMenuOpen.value) {
		isSavedTemplatesListOpen.value = false;
		isStylesMenuOpen.value = false;
		isWeightMenuOpen.value = false;
	}
}

function updateUnit(field, unit) {
	pendingFontWeightSpan = null;
	if (field === "width") {
		widthUnit.value = unit;
		isWidthMenuOpen.value = false;
		return;
	}

	heightUnit.value = unit;
	isHeightMenuOpen.value = false;
}

/** Paper template dimensions in CSS px, derived from the Size menu entries. */
const paperWidthPx = computed(() => convertToPixels(widthValue.value, widthUnit.value));
const paperHeightPx = computed(() => convertToPixels(heightValue.value, heightUnit.value));

const printPreviewPaperRef = ref(null);
const printPreviewPaperEditorRef = ref(null);
const isTemplateNamePromptOpen = ref(false);
const templateNameInput = ref("");
const templateNameInputRef = ref(null);
const savedTemplates = ref(loadSavedTemplates());
const fontStyleOptions = [
	{
		id: "minecraft-regular-1",
		label: "Minecraft Reg 1",
		family: '"MinecraftRegular1", "Trebuchet MS", sans-serif',
		weight: "400",
	},
	{
		id: "minecraft-regular-2",
		label: "Minecraft Reg 2",
		family: '"MinecraftRegular2", "Trebuchet MS", sans-serif',
		weight: "400",
	},
	{
		id: "minecraft-regular-2-bold",
		label: "Minecraft Reg 2 (Bold)",
		family: '"Minecraft2Bold", "Trebuchet MS", sans-serif',
		weight: "700",
	},
	{
		id: "minecraft-regular-2-italic",
		label: "Minecraft Reg 2 (Italic)",
		family: '"Minecraft2Italic", "Trebuchet MS", sans-serif',
		weight: "400",
	},
	{
		id: "minecraft-regular-2-bold-italic",
		label: "Minecraft Reg 2 (Bold & Italic)",
		family: '"Minecraft2BoldItalic", "Trebuchet MS", sans-serif',
		weight: "700",
	},
];
const fontWeightOptions = ["100", "200", "300", "400", "500", "600", "700", "800", "900"];

/** Feeds the Size menu dimensions into the print preview paper stylesheet variables. */
watchEffect(() => {
	const paperElement = printPreviewPaperRef.value;
	if (paperElement) {
		paperElement.style.setProperty("--print-preview-paper-width", `${paperWidthPx.value}px`);
		paperElement.style.setProperty("--print-preview-paper-height", `${paperHeightPx.value}px`);
	}
});

async function toggleCalibrateButton() {
	textEditorButtonStates.value.calibrate = !textEditorButtonStates.value.calibrate;
	isCalibrationBarVisible.value = textEditorButtonStates.value.calibrate;
	if (!isCalibrationBarVisible.value) {
		return;
	}

	await nextTick();
	const calibrationButtonBounds = calibrationButtonRef.value?.getBoundingClientRect();
	if (!calibrationButtonBounds || !calibrationBarFrameRef.value) {
		return;
	}
	calibrationBarFrameRef.value.style.setProperty(
		"--calibration-bar-top",
		`${calibrationButtonBounds.bottom}px`,
	);
	calibrationBarFrameRef.value.style.setProperty(
		"--calibration-bar-left",
		`${calibrationButtonBounds.left + (calibrationButtonBounds.width - 60) / 2}px`,
	);
	applyCalibrationBarSizeToFrame();
}

/** Begin moving the calibration bar or resizing it from a fixed edge. */
function handleCalibrationBarPointerDown(mode, event) {
	calibrationBarDragMode = mode;
	calibrationBarDragStartY = event.clientY;
	calibrationBarDragStartX = event.clientX;
	calibrationBarDragStartLengthPx = calibrationBarLengthPx.value;
	calibrationBarDragStartTopPx =
		Number.parseFloat(
			calibrationBarFrameRef.value?.style.getPropertyValue("--calibration-bar-top") ?? "",
		) || 40;
	calibrationBarDragStartLeftPx =
		Number.parseFloat(
			calibrationBarFrameRef.value?.style.getPropertyValue("--calibration-bar-left") ?? "",
		) || 160;
	event.currentTarget.setPointerCapture(event.pointerId);
}

/** Update calibration bar position or height while its pointer is captured. */
function handleCalibrationBarPointerMove(event) {
	if (!calibrationBarDragMode) {
		return;
	}

	const deltaX = event.clientX - calibrationBarDragStartX;
	const deltaY = event.clientY - calibrationBarDragStartY;
	const frame = calibrationBarFrameRef.value;
	if (calibrationBarDragMode === "move") {
		frame?.style.setProperty(
			"--calibration-bar-left",
			`${calibrationBarDragStartLeftPx + deltaX}px`,
		);
		frame?.style.setProperty(
			"--calibration-bar-top",
			`${calibrationBarDragStartTopPx + deltaY}px`,
		);
		return;
	}

	if (isCalibrationBarHorizontal.value) {
		calibrationBarLengthPx.value = Math.max(
			1,
			calibrationBarDragMode === "top"
				? calibrationBarDragStartLengthPx - deltaX
				: calibrationBarDragStartLengthPx + deltaX,
		);
		applyCalibrationBarSizeToFrame();
		if (calibrationBarDragMode === "top") {
			frame?.style.setProperty(
				"--calibration-bar-left",
				`${calibrationBarDragStartLeftPx + deltaX}px`,
			);
		}
		return;
	}

	calibrationBarLengthPx.value = Math.max(
		1,
		calibrationBarDragMode === "top"
			? calibrationBarDragStartLengthPx - deltaY
			: calibrationBarDragStartLengthPx + deltaY,
	);
	applyCalibrationBarSizeToFrame();
	if (calibrationBarDragMode === "top") {
		frame?.style.setProperty(
			"--calibration-bar-top",
			`${calibrationBarDragStartTopPx + deltaY}px`,
		);
	}
}

/** End a calibration bar pointer interaction. */
function handleCalibrationBarPointerUp() {
	const wasDragging = calibrationBarDragMode !== "";
	calibrationBarDragMode = "";
	if (wasDragging) {
		saveCalibrationState();
	}
}
</script>

<template>
	<main
		id="parent-screen"
		class="parent-screen"
		:class="{ 'parent-screen--templates-active': textEditorButtonStates.templates }"
		role="main"
		aria-label="Parent screen"
		title="Parent screen"
	>
		<nav
			v-if="!isTextEditorOpen"
			id="parent-screen-tab-rail"
			class="parent-screen-tab-rail"
			role="navigation"
			aria-label="Parent navigation"
			title="Parent navigation"
		>
			<button
				id="student-edits-tab"
				class="student-edits-tab"
				type="button"
				name="student-edits-tab"
				data-button-name="student-edits-tab"
				@click="handleStudentEditsOpen"
			>
				Student Edits
			</button>
			<button
				id="text-editor-tab"
				class="text-editor-tab"
				type="button"
				name="text-editor-tab"
				data-button-name="text-editor-tab"
				@click="handleTextEditorOpen"
			>
				Text Editor
			</button>
		</nav>
		<section
			v-else
			id="text-editor-menu"
			class="text-editor-menu"
			:class="{ 'text-editor-menu--templates-active': textEditorButtonStates.templates }"
			role="region"
			aria-label="Text Editor menu"
			title="Text Editor menu"
		>
			<nav
				id="text-editor-navigation-bar"
				class="text-editor-navigation-bar"
				:class="{
					'text-editor-navigation-bar--preview-open': textEditorButtonStates.printPreview,
				}"
				role="navigation"
				aria-label="Text Editor navigation"
				title="Text Editor navigation"
			>
				<button
					id="text-editor-templates-button"
					class="text-editor-templates-button"
					:class="{ 'text-editor-button--depressed': textEditorButtonStates.templates }"
					type="button"
					name="text-editor-templates-button"
					data-button-name="text-editor-templates-button"
					:aria-pressed="textEditorButtonStates.templates"
					@click="toggleTextEditorButton('templates')"
				>
					Templates
				</button>
				<button
					id="text-editor-grid-button"
					class="text-editor-grid-button"
					:class="{ 'text-editor-button--depressed': textEditorButtonStates.grid }"
					type="button"
					name="text-editor-grid-button"
					data-button-name="text-editor-grid-button"
					:aria-pressed="textEditorButtonStates.grid"
					@click="toggleTextEditorButton('grid')"
				>
					Grid
				</button>
				<button
					id="text-editor-calibrate-button"
					ref="calibrationButtonRef"
					class="text-editor-calibrate-button"
					:class="{ 'text-editor-button--depressed': textEditorButtonStates.calibrate }"
					type="button"
					name="text-editor-calibrate-button"
					data-button-name="text-editor-calibrate-button"
					:aria-pressed="textEditorButtonStates.calibrate"
					@click="toggleCalibrateButton"
				>
					Calibrate
				</button>
			</nav>
			<section
				v-if="textEditorButtonStates.printPreview"
				id="text-editor-print-preview-panel"
				class="text-editor-print-preview-panel"
				role="region"
				aria-label="Print Preview"
				title="Print Preview"
			>
				<div
					id="print-preview-paper-viewport"
					class="print-preview-paper-viewport"
					data-container-name="print-preview-paper-viewport"
				>
					<button
						id="text-editor-template-save-button"
						class="text-editor-template-save-button"
						type="button"
						name="text-editor-template-save-button"
						data-button-name="text-editor-template-save-button"
						@click="handlePaperTemplateSave"
					>
						Save
					</button>
					<dialog
						v-if="isTemplateNamePromptOpen"
						id="text-editor-template-name-prompt"
						class="text-editor-template-name-prompt"
						aria-label="Name this template"
					>
						<label
							class="text-editor-template-name-prompt-label"
							for="text-editor-template-name-input"
						>
							Template name
						</label>
						<input
							id="text-editor-template-name-input"
							ref="templateNameInputRef"
							v-model="templateNameInput"
							class="text-editor-template-name-input"
							type="text"
							maxlength="60"
							@keydown.enter="confirmTemplateSave"
							@keydown.esc="cancelTemplateSave"
						/>
						<button
							id="text-editor-template-name-confirm-button"
							class="text-editor-template-name-confirm-button"
							type="button"
							@click="confirmTemplateSave"
						>
							Save Template
						</button>
						<button
							id="text-editor-template-name-cancel-button"
							class="text-editor-template-name-cancel-button"
							type="button"
							@click="cancelTemplateSave"
						>
							Cancel
						</button>
					</dialog>
					<div
						id="print-preview-paper"
						ref="printPreviewPaperRef"
						class="print-preview-paper"
						data-element-name="print-preview-paper"
					>
						<div
							ref="printPreviewPaperEditorRef"
							class="print-preview-paper-editor"
							contenteditable="true"
							role="textbox"
							aria-label="Paper template text"
							@beforeinput="handlePaperEditorBeforeInput"
							@keydown="handlePaperEditorKeydown"
							@input="handlePaperEditorInput"
						/>
					</div>
				</div>
			</section>
			<section
				v-if="textEditorButtonStates.calibrate"
				id="text-editor-calibration-panel"
				class="calibration-panel"
				role="region"
				aria-label="Calibration settings"
				title="Calibration settings"
			>
				<label class="calibration-panel-label" for="calibration-real-length-input">
					Real-world bar length
				</label>
				<input
					id="calibration-real-length-input"
					v-model="calibrationRealLengthInput"
					class="calibration-panel-input"
					type="text"
					inputmode="decimal"
					maxlength="6"
					name="calibration-real-length-input"
					data-element-name="calibration-real-length-input"
				/>
				<select
					id="calibration-unit-select"
					v-model="calibrationUnit"
					class="calibration-panel-unit-select"
					aria-label="Calibration unit"
					name="calibration-unit-select"
					data-element-name="calibration-unit-select"
					@change="saveCalibrationState"
				>
					<option value="in">in</option>
					<option value="cm">cm</option>
					<option value="mm">mm</option>
				</select>
				<button
					id="calibration-commit-button"
					class="calibration-panel-commit-button"
					type="button"
					name="calibration-commit-button"
					data-button-name="calibration-commit-button"
					@click="commitCalibration"
				>
					Set
				</button>
			</section>
			<section
				v-if="textEditorButtonStates.templates"
				id="text-editor-templates-panel"
				class="text-editor-templates-panel"
				role="region"
				aria-label="Template options"
				title="Template options"
			>
				<div class="text-editor-ribbon-group">
					<button
						id="text-editor-template-saved-templates-button"
						class="text-editor-template-saved-templates-button"
						:class="{ 'text-editor-button--depressed': isSavedTemplatesListOpen }"
						type="button"
						name="text-editor-template-saved-templates-button"
						data-button-name="text-editor-template-saved-templates-button"
						:aria-pressed="isSavedTemplatesListOpen"
						@click="toggleSavedTemplatesList"
					>
						Saved
					</button>
					<ul
						v-if="isSavedTemplatesListOpen"
						id="text-editor-saved-templates-list"
						class="text-editor-saved-templates-list"
						aria-label="Saved templates"
					>
						<p
							v-if="savedTemplates.length === 0"
							class="text-editor-saved-templates-empty"
						>
							No saved templates yet.
						</p>
						<button
							v-for="entry in savedTemplates"
							:key="entry.id"
							class="text-editor-saved-template-item"
							type="button"
							:data-template-id="entry.id"
							@click="loadSavedTemplate(entry)"
						>
							{{ entry.name }}
						</button>
					</ul>
					<button
						id="text-editor-template-new-button"
						class="text-editor-template-new-button text-editor-print-preview-button"
						:class="{
							'text-editor-button--depressed': textEditorButtonStates.printPreview,
						}"
						type="button"
						name="text-editor-template-new-button"
						data-button-name="text-editor-template-new-button"
						:aria-pressed="textEditorButtonStates.printPreview"
						@click="toggleTextEditorButton('printPreview')"
					>
						New +
					</button>
					<p class="text-editor-ribbon-group-caption">Templates</p>
				</div>
				<div class="text-editor-ribbon-group">
					<div class="text-editor-size-action-row">
						<button
							id="text-editor-editing-tools-button"
							class="text-editor-editing-tools-button"
							:class="{
								'text-editor-editing-tools-button--depressed': isEditingToolsOpen,
								'text-editor-editing-tools-button--unavailable':
									!textEditorButtonStates.printPreview,
								'text-editor-editing-tools-button--available':
									textEditorButtonStates.printPreview,
							}"
							type="button"
							:disabled="!textEditorButtonStates.printPreview"
							name="text-editor-editing-tools-button"
							data-button-name="text-editor-editing-tools-button"
							:aria-pressed="isEditingToolsOpen"
							@click="toggleEditingTools"
						>
							Tools
						</button>
						<div v-if="isEditingToolsOpen" class="text-editor-size-menu-row">
							<div class="text-editor-size-menu-top-row">
								<button
									id="text-editor-size-menu-button"
									class="text-editor-size-menu-button"
									:class="{
										'text-editor-size-menu-button--depressed': isSizePanelOpen,
									}"
									type="button"
									name="text-editor-size-menu-button"
									data-button-name="text-editor-size-menu-button"
									:aria-pressed="isSizePanelOpen"
									@click="toggleSizePanel"
								>
									Size
								</button>
								<button
									id="text-editor-fonts-button"
									class="text-editor-fonts-button"
									:class="{
										'text-editor-fonts-button--depressed': isFontsPanelOpen,
									}"
									type="button"
									name="text-editor-fonts-button"
									data-button-name="text-editor-fonts-button"
									:aria-pressed="isFontsPanelOpen"
									@click="toggleFontsPanel"
								>
									Fonts
								</button>
							</div>
							<button
								id="text-editor-margins-button"
								class="text-editor-margins-button"
								type="button"
								name="text-editor-margins-button"
								data-button-name="text-editor-margins-button"
							>
								Margins
							</button>
							<section
								v-if="isFontsPanelOpen"
								id="text-editor-fonts-panel"
								class="text-editor-fonts-panel"
								role="region"
								aria-label="Fonts options"
							>
								<button
									class="text-editor-font-option-button"
									data-font-option="styles"
									type="button"
									:aria-pressed="isStylesMenuOpen"
									@click="toggleStylesMenu"
								>
									Fonts
								</button>
								<button
									class="text-editor-font-option-button"
									data-font-option="color"
									type="button"
								>
									Font Color
								</button>
								<button
									class="text-editor-font-option-button"
									data-font-option="weight"
									type="button"
									:aria-pressed="isWeightMenuOpen"
									@click="toggleWeightMenu"
								>
									Font Weight: {{ selectedFontWeight }}
								</button>
								<button
									class="text-editor-font-option-button"
									data-font-option="font-size"
									type="button"
								>
									Font Size
								</button>
								<section
									v-if="isStylesMenuOpen"
									class="text-editor-font-styles-menu"
									role="region"
									aria-label="Font styles"
								>
									<button
										v-for="fontOption in fontStyleOptions"
										:key="fontOption.id"
										class="text-editor-font-style-button"
										:class="{
											'text-editor-font-style-button--depressed':
												activeFontStyleId === fontOption.id,
										}"
										type="button"
										:data-font-style="fontOption.id"
										:aria-pressed="activeFontStyleId === fontOption.id"
										:style="{ fontFamily: fontOption.family }"
										@mousedown.prevent
										@click="applyFontStyle(fontOption)"
									>
										{{ fontOption.label }}
									</button>
								</section>
								<div
									v-if="isWeightMenuOpen"
									class="text-editor-font-weights-menu"
									role="menu"
									aria-label="Font weights"
								>
									<button
										v-for="weight in fontWeightOptions"
										:key="weight"
										class="text-editor-font-weight-button"
										:class="{
											'text-editor-font-weight-button--depressed':
												selectedFontWeight === weight,
										}"
										type="button"
										role="menuitem"
										:aria-pressed="selectedFontWeight === weight"
										@mousedown.prevent
										@click="applyFontWeight(weight)"
									>
										{{ weight }}
									</button>
								</div>
							</section>

							<div
								v-if="isSizePanelOpen"
								id="text-editor-size-panel"
								class="text-editor-size-panel"
								aria-label="Size options"
							>
								<div class="text-editor-size-row">
									<label
										class="text-editor-size-label"
										for="text-editor-size-width"
										>Width</label
									>
									<input
										id="text-editor-size-width"
										v-model="widthValue"
										class="text-editor-size-input"
										type="text"
										inputmode="decimal"
										maxlength="4"
										aria-label="Width value"
									/>
									<div
										class="text-editor-size-unit-field text-editor-size-width-unit-field"
									>
										<button
											id="text-editor-size-width-unit"
											class="text-editor-size-width-unit-button"
											type="button"
											name="text-editor-size-width-unit"
											data-button-name="text-editor-size-width-unit"
											aria-label="Width unit: in"
											title="Width unit"
											@click="toggleUnitMenu('width')"
										>
											{{ widthUnit }}
										</button>
										<div
											v-if="isWidthMenuOpen"
											id="text-editor-size-width-menu"
											class="text-editor-size-unit-menu text-editor-size-width-menu"
										>
											<button
												id="text-editor-size-width-px-option"
												class="text-editor-size-width-px-option"
												type="button"
												name="text-editor-size-width-px-option"
												data-button-name="text-editor-size-width-px-option"
												@click="updateUnit('width', 'px')"
											>
												px
											</button>
											<button
												id="text-editor-size-width-in-option"
												class="text-editor-size-width-in-option"
												type="button"
												name="text-editor-size-width-in-option"
												data-button-name="text-editor-size-width-in-option"
												@click="updateUnit('width', 'in')"
											>
												in
											</button>
											<button
												id="text-editor-size-width-cm-option"
												class="text-editor-size-width-cm-option"
												type="button"
												name="text-editor-size-width-cm-option"
												data-button-name="text-editor-size-width-cm-option"
												@click="updateUnit('width', 'cm')"
											>
												cm
											</button>
											<button
												id="text-editor-size-width-mm-option"
												class="text-editor-size-width-mm-option"
												type="button"
												name="text-editor-size-width-mm-option"
												data-button-name="text-editor-size-width-mm-option"
												@click="updateUnit('width', 'mm')"
											>
												mm
											</button>
										</div>
									</div>
								</div>
								<div class="text-editor-size-row">
									<label
										class="text-editor-size-label"
										for="text-editor-size-height"
										>Height</label
									>
									<input
										id="text-editor-size-height"
										v-model="heightValue"
										class="text-editor-size-input"
										type="text"
										inputmode="decimal"
										maxlength="4"
										aria-label="Height value"
									/>
									<div
										class="text-editor-size-unit-field text-editor-size-height-unit-field"
									>
										<button
											id="text-editor-size-height-unit"
											class="text-editor-size-height-unit-button"
											type="button"
											name="text-editor-size-height-unit"
											data-button-name="text-editor-size-height-unit"
											aria-label="Height unit: in"
											title="Height unit"
											@click="toggleUnitMenu('height')"
										>
											{{ heightUnit }}
										</button>
										<div
											v-if="isHeightMenuOpen"
											id="text-editor-size-height-menu"
											class="text-editor-size-unit-menu text-editor-size-height-menu"
										>
											<button
												id="text-editor-size-height-px-option"
												class="text-editor-size-height-px-option"
												type="button"
												name="text-editor-size-height-px-option"
												data-button-name="text-editor-size-height-px-option"
												@click="updateUnit('height', 'px')"
											>
												px
											</button>
											<button
												id="text-editor-size-height-in-option"
												class="text-editor-size-height-in-option"
												type="button"
												name="text-editor-size-height-in-option"
												data-button-name="text-editor-size-height-in-option"
												@click="updateUnit('height', 'in')"
											>
												in
											</button>
											<button
												id="text-editor-size-height-cm-option"
												class="text-editor-size-height-cm-option"
												type="button"
												name="text-editor-size-height-cm-option"
												data-button-name="text-editor-size-height-cm-option"
												@click="updateUnit('height', 'cm')"
											>
												cm
											</button>
											<button
												id="text-editor-size-height-mm-option"
												class="text-editor-size-height-mm-option"
												type="button"
												name="text-editor-size-height-mm-option"
												data-button-name="text-editor-size-height-mm-option"
												@click="updateUnit('height', 'mm')"
											>
												mm
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<p class="text-editor-ribbon-group-caption">Tools</p>
				</div>
			</section>
			<div
				v-if="isCalibrationBarVisible"
				id="calibration-bar-frame"
				ref="calibrationBarFrameRef"
				class="calibration-bar-frame"
				:class="{ 'calibration-bar-frame--horizontal': isCalibrationBarHorizontal }"
				data-container-name="calibration-bar-frame"
				@pointermove="handleCalibrationBarPointerMove"
				@pointerup="handleCalibrationBarPointerUp"
				@pointercancel="handleCalibrationBarPointerUp"
			>
				<div
					id="calibration-bar"
					class="calibration-bar"
					data-element-name="calibration-bar"
					@pointerdown="handleCalibrationBarPointerDown('move', $event)"
				/>
				<button
					id="calibration-bar-top-handle"
					class="calibration-bar-top-resize-handle"
					type="button"
					aria-label="Resize calibration bar from top"
					@pointerdown="handleCalibrationBarPointerDown('top', $event)"
				/>
				<button
					id="calibration-bar-bottom-handle"
					class="calibration-bar-bottom-resize-handle"
					type="button"
					aria-label="Resize calibration bar from bottom"
					@pointerdown="handleCalibrationBarPointerDown('bottom', $event)"
				/>
				<button
					id="calibration-bar-rotate-button"
					class="calibration-bar-rotate-button"
					type="button"
					aria-label="Rotate calibration bar"
					title="Rotate calibration bar"
					@click="toggleCalibrationBarOrientation"
				>
					&#8635;
				</button>
				<p
					id="calibration-bar-height-counter"
					class="calibration-bar-height-counter"
					aria-live="polite"
				>
					<template v-if="calibrationPixelsPerUnit">
						{{ calibratedLengthLabel }}
						<span class="calibration-bar-px-counter">
							{{ Math.round(calibrationBarLengthPx) }} px
						</span>
					</template>
					<template v-else> {{ Math.round(calibrationBarLengthPx) }} px </template>
				</p>
			</div>
		</section>
		<button
			v-if="isTextEditorOpen"
			id="text-editor-home-button"
			class="text-editor-home-button"
			type="button"
			name="text-editor-home-button"
			data-button-name="text-editor-home-button"
			aria-label="Return home"
			title="Return home"
			@click="handleParentScreenClose"
		>
			Home
		</button>
		<button
			v-if="isTextEditorOpen"
			id="parent-screen-back-button"
			class="parent-screen-back-button"
			type="button"
			name="parent-screen-back-button"
			data-button-name="parent-screen-back-button"
			aria-label="Back to parent menu"
			title="Back to parent menu"
			@click="handleTextEditorClose"
		>
			Back
		</button>
		<button
			v-else
			id="parent-screen-back-button-parent"
			class="parent-screen-back-button-parent"
			type="button"
			name="parent-screen-back-button-parent"
			data-button-name="parent-screen-back-button-parent"
			aria-label="Back to home"
			title="Back to home"
			@click="handleParentScreenClose"
		>
			Back
		</button>
	</main>
</template>

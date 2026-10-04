<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch, watchEffect } from "vue";

import { addSavedTemplate, buildTemplateEntry, loadSavedTemplates } from "../js/templateStorage.js";
import { convertToPixels } from "../js/unitConversion.js";

const emit = defineEmits(["open-student-edits", "back-to-home"]);
const isTextEditorOpen = ref(false);
const textEditorButtonStates = ref({
	printPreview: false,
	grid: false,
	calibrate: false,
});
const isNewMenuOpen = ref(false);
const isNewButtonPressed = ref(false);
const isUnsavedNewDocument = ref(false);
const savedDocumentBaseline = ref(null);
const isLeaveUnsavedPromptOpen = ref(false);
const leaveUnsavedConfirmationDialogRef = ref(null);
const isShellMode = ref(false);
const isEditingToolsOpen = ref(false);
const isSizePanelOpen = ref(false);
const isFontsPanelOpen = ref(false);
const isMarginsPanelOpen = ref(false);

/** Ids of the currently open Tools menus, in the order they were opened. Drives stack DOM order. */
const toolsMenuOpenOrder = ref([]);

/** Push or remove a Tools menu id in toolsMenuOpenOrder to mirror its open state. */
function syncToolsMenuOrder(menuId, isOpen) {
	const currentIndex = toolsMenuOpenOrder.value.indexOf(menuId);
	if (isOpen && currentIndex === -1) {
		toolsMenuOpenOrder.value.push(menuId);
	} else if (!isOpen && currentIndex !== -1) {
		toolsMenuOpenOrder.value.splice(currentIndex, 1);
	}
}

const isStylesMenuOpen = ref(false);
const isFontColorMenuOpen = ref(false);
const isFontSizeMenuOpen = ref(false);
const shouldLowerNestedFontMenus = computed(
	() =>
		(isNewMenuOpen.value || isLoadMenuOpen.value) &&
		isStylesMenuOpen.value &&
		isFontColorMenuOpen.value,
);
const fontSizePoints = ref("");
const committedFontSizePoints = ref("");
const selectedFontColor = ref("#ffffff");
const fontColorPreviewCanvasRef = ref(null);
const fontColorHexInput = ref("");
const committedFontColor = ref("#000000");
const fontColorPickerHue = ref(0);
const fontColorPickerSaturation = ref(1);
const fontColorPickerValue = ref(1);
let savedFontSizeSelection = null;
const isWidthMenuOpen = ref(false);
const isHeightMenuOpen = ref(false);
const isLoadMenuOpen = ref(false);
const widthValue = ref("8.5");
const heightValue = ref("11");
const widthUnit = ref("in");
const heightUnit = ref("in");

watch(isLeaveUnsavedPromptOpen, async (isOpen) => {
	if (!isOpen) {
		return;
	}

	await nextTick();
	const dialog = leaveUnsavedConfirmationDialogRef.value;
	if (dialog && !dialog.open) {
		dialog.showModal();
	}
});

const marginFields = ["top", "bottom", "left", "right"];
const marginValues = reactive({ top: "0", bottom: "0", left: "0", right: "0" });
const isMarginVisibilityOn = ref(true);
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

/** Block Enter when another line below the content or caret would exceed the paper bottom. */
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

	const editorRect = editor.getBoundingClientRect();
	const computedStyle = window.getComputedStyle(editor);
	const lineHeightPx =
		Number.parseFloat(computedStyle.lineHeight) ||
		Number.parseFloat(computedStyle.fontSize) * 1.2 ||
		20;

	const contentRange = document.createRange();
	contentRange.selectNodeContents(editor);
	const contentRect = contentRange.getBoundingClientRect();
	const selection = window.getSelection();
	const caretRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
	let caretRect = null;
	if (caretRange) {
		caretRect = caretRange.collapsed
			? caretRange.getBoundingClientRect()
			: caretRange.getClientRects()[0];
	}
	if (caretRect && caretRect.top === 0 && caretRect.bottom === 0 && caretRect.height === 0) {
		caretRect = null;
	}

	if (contentRect.height === 0 && !caretRect) {
		return;
	}

	// The content range omits the trailing empty line; trust the caret bottom, not its height.
	const lowestBottom = Math.max(contentRect.bottom, caretRect ? caretRect.bottom : 0);
	if (lowestBottom + lineHeightPx > editorRect.bottom) {
		event.preventDefault();
	}
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

	const snapshot = {
		html: editor.innerHTML,
		widthValue: widthValue.value,
		widthUnit: widthUnit.value,
		heightValue: heightValue.value,
		heightUnit: heightUnit.value,
		marginValues: { ...marginValues },
		marginVisibility: isMarginVisibilityOn.value,
		isShell: isShellMode.value,
	};
	if (!isShellMode.value) {
		const styles = window.getComputedStyle(editor);
		Object.assign(snapshot, {
			fontFamily: styles.fontFamily,
			fontSize: styles.fontSize,
			fontColor: styles.color,
			textAlign: styles.textAlign,
			padding: styles.padding,
		});
	}
	return snapshot;
}

function hasUnsavedDocumentChanges() {
	const baseline = savedDocumentBaseline.value;
	const current = captureCurrentTemplate();
	return Boolean(
		baseline && current && JSON.stringify(current) !== JSON.stringify(baseline),
	);
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
	isTextEditorOpen.value = false;
	textEditorButtonStates.value.printPreview = false;
	isNewMenuOpen.value = false;
	isUnsavedNewDocument.value = false;
	isLeaveUnsavedPromptOpen.value = false;
	savedDocumentBaseline.value = null;
	isShellMode.value = false;
	textEditorButtonStates.value.grid = false;
	textEditorButtonStates.value.calibrate = false;
	isCalibrationBarVisible.value = false;
	isLoadMenuOpen.value = false;
	isSizePanelOpen.value = false;
	isFontsPanelOpen.value = false;
	isStylesMenuOpen.value = false;
	isWidthMenuOpen.value = false;
	isHeightMenuOpen.value = false;
}

function handleTextEditorWorkflowBack() {
	if (textEditorButtonStates.value.printPreview) {
		if (hasUnsavedDocumentChanges()) {
			isLeaveUnsavedPromptOpen.value = true;
			return;
		}
		leaveUnsavedNewDocument();
	}
	isLoadMenuOpen.value = false;
	isNewMenuOpen.value = false;
	isNewButtonPressed.value = false;
}

function handleTextEditorOpen() {
	isTextEditorOpen.value = true;
}

function playIllegalActionFeedback() {
	const AudioContextConstructor = window.AudioContext;
	if (!AudioContextConstructor) {
		return;
	}

	const audioContext = new AudioContextConstructor();
	const now = audioContext.currentTime;
	const oscillator = audioContext.createOscillator();
	const gain = audioContext.createGain();

	oscillator.type = "sawtooth";
	oscillator.frequency.setValueAtTime(220, now);
	oscillator.frequency.exponentialRampToValueAtTime(110, now + 0.25);
	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.exponentialRampToValueAtTime(0.16, now + 0.01);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
	oscillator.connect(gain);
	gain.connect(audioContext.destination);
	oscillator.addEventListener("ended", () => audioContext.close());
	oscillator.start(now);
	oscillator.stop(now + 0.25);
}

function toggleTextEditorButton(buttonName) {
	if (buttonName === "printPreview") {
		if (isNewMenuOpen.value) {
			isNewButtonPressed.value = !isNewButtonPressed.value;
			isNewMenuOpen.value = false;
			return;
		}
		if (!isNewMenuOpen.value && isLoadMenuOpen.value) {
			playIllegalActionFeedback();
			return;
		}
		isNewButtonPressed.value = true;
		isNewMenuOpen.value = true;
		return;
	}

	textEditorButtonStates.value[buttonName] = !textEditorButtonStates.value[buttonName];
}

async function resetEditorForNewDocument() {
	resetMarginSettings();
	await nextTick();
	const editor = printPreviewPaperEditorRef.value;
	if (editor) {
		editor.innerHTML = "";
		editor.removeAttribute("style");
	}
	return editor;
}

async function createTextEditorShell() {
	isNewMenuOpen.value = false;
	isUnsavedNewDocument.value = true;
	isShellMode.value = true;
	textEditorButtonStates.value.printPreview = true;
	await resetEditorForNewDocument();
	savedDocumentBaseline.value = captureCurrentTemplate();
}

async function createTextEditorTemplate() {
	isNewMenuOpen.value = false;
	isUnsavedNewDocument.value = true;
	isShellMode.value = false;
	textEditorButtonStates.value.printPreview = true;
	const editor = await resetEditorForNewDocument();
	const fontOption = fontStyleOptions.find((option) => option.id === activeFontStyleId.value);
	if (editor && fontOption) {
		editor.style.fontFamily = fontOption.family;
	}
	if (editor) {
		editor.style.color = committedFontColor.value;
		selectEditorEnd(editor);
	}
	savedDocumentBaseline.value = captureCurrentTemplate();
}

function leaveUnsavedNewDocument() {
	isLeaveUnsavedPromptOpen.value = false;
	isNewMenuOpen.value = false;
	isNewButtonPressed.value = false;
	isUnsavedNewDocument.value = false;
	isShellMode.value = false;
	savedDocumentBaseline.value = null;
	textEditorButtonStates.value.printPreview = false;
}

function stayOnUnsavedNewDocument() {
	isLeaveUnsavedPromptOpen.value = false;
}

function closeTextEditorDropdowns() {
	isLoadMenuOpen.value = false;
	isStylesMenuOpen.value = false;
	isSizePanelOpen.value = false;
	isWidthMenuOpen.value = false;
	isHeightMenuOpen.value = false;
}

function handleDocumentPointerDown(event) {
	const sidebar = document.getElementById("text-editor-tools-panel");
	if (!sidebar || sidebar.contains(event.target)) {
		return;
	}
	// Word-ribbon light dismiss: close only the floating menus, not the
	// inline panels whose buttons stay visible inside the ribbon.
	isStylesMenuOpen.value = false;
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

function toggleLoadMenu() {
	if (
		!isLoadMenuOpen.value &&
		(textEditorButtonStates.value.printPreview || isNewMenuOpen.value)
	) {
		playIllegalActionFeedback();
		return;
	}
	isLoadMenuOpen.value = !isLoadMenuOpen.value;
	if (isLoadMenuOpen.value) {
		savedTemplates.value = loadSavedTemplates();
		isSavedShellsMenuOpen.value = false;
		isStylesMenuOpen.value = false;
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
	restoreMarginSettings(entry.template);
	isUnsavedNewDocument.value = false;
	isLeaveUnsavedPromptOpen.value = false;
	isShellMode.value = entry.template.isShell === true;
	textEditorButtonStates.value.printPreview = true;
	isNewMenuOpen.value = false;
	isLoadMenuOpen.value = false;

	await nextTick();
	const editor = printPreviewPaperEditorRef.value;
	if (!editor) {
		return;
	}

	editor.innerHTML = entry.template.html ?? "";
	editor.removeAttribute("style");
	if (!isShellMode.value) {
		applyTemplateTypography(editor, entry.template);
		const fontOption = fontStyleOptions.find((option) => option.id === activeFontStyleId.value);
		if (fontOption) {
			editor.style.fontFamily = fontOption.family;
		}
		selectEditorEnd(editor);
	}
	savedDocumentBaseline.value = captureCurrentTemplate();
}

function toggleEditingTools() {
	isEditingToolsOpen.value = !isEditingToolsOpen.value;
	if (!isEditingToolsOpen.value) {
		isSizePanelOpen.value = false;
		isFontsPanelOpen.value = false;
		isMarginsPanelOpen.value = false;
		toolsMenuOpenOrder.value = [];
		isStylesMenuOpen.value = false;
		isWidthMenuOpen.value = false;
		isHeightMenuOpen.value = false;
	}
}

function toggleFontsPanel() {
	isFontsPanelOpen.value = !isFontsPanelOpen.value;
	syncToolsMenuOrder("fonts", isFontsPanelOpen.value);
	if (!isFontsPanelOpen.value) {
		isStylesMenuOpen.value = false;
	}
}

function toggleStylesMenu() {
	if (!isFontsPanelOpen.value) {
		return;
	}
	isStylesMenuOpen.value = !isStylesMenuOpen.value;
	if (isStylesMenuOpen.value) {
		isLoadMenuOpen.value = false;
		isWidthMenuOpen.value = false;
		isHeightMenuOpen.value = false;
	}
}

function toggleFontColorMenu() {
	if (!isFontsPanelOpen.value) {
		return;
	}
	isFontColorMenuOpen.value = !isFontColorMenuOpen.value;
	if (isFontColorMenuOpen.value) {
		isLoadMenuOpen.value = false;
		isWidthMenuOpen.value = false;
		isHeightMenuOpen.value = false;
	}
}

function toggleFontSizeMenu() {
	if (!isFontsPanelOpen.value) {
		return;
	}
	isFontSizeMenuOpen.value = !isFontSizeMenuOpen.value;
}

function rememberFontSizeSelection() {
	const editor = printPreviewPaperEditorRef.value;
	const selection = window.getSelection();
	if (editor && selection?.rangeCount > 0) {
		const range = selection.getRangeAt(0);
		if (editor.contains(range.commonAncestorContainer)) {
			savedFontSizeSelection = range.cloneRange();
		}
	}
}

function sanitizeFontSizeInput(event) {
	const numericValue = event.target.value.replace(/\D/g, "").slice(0, 3);
	fontSizePoints.value = numericValue;
	event.target.value = numericValue;
}

function commitFontSize() {
	if (!fontSizePoints.value) {
		return;
	}
	committedFontSizePoints.value = fontSizePoints.value;
	const editor = printPreviewPaperEditorRef.value;
	if (!editor) {
		return;
	}
	const selection = window.getSelection();
	let range = savedFontSizeSelection;
	if (!range || !editor.contains(range.commonAncestorContainer)) {
		if (!selection || selection.rangeCount === 0) {
			ensureEditorSelection(editor);
		}
		range = window.getSelection()?.getRangeAt(0);
	}
	if (!range) {
		return;
	}
	if (!editor.contains(range.commonAncestorContainer) || range.collapsed) {
		return;
	}
	const selectedContents = range.extractContents();
	for (const element of selectedContents.querySelectorAll("[style]")) {
		element.style.removeProperty("font-size");
		if (!element.getAttribute("style")?.trim()) {
			element.removeAttribute("style");
		}
	}
	const sizeSpan = editor.ownerDocument.createElement("span");
	sizeSpan.style.fontSize = `${fontSizePoints.value}pt`;
	sizeSpan.append(selectedContents);
	range.insertNode(sizeSpan);
	for (const sibling of [sizeSpan.previousSibling, sizeSpan.nextSibling]) {
		if (sibling?.nodeType === Node.TEXT_NODE && !sibling.textContent) {
			sibling.remove();
		}
	}
	const formattedRange = document.createRange();
	formattedRange.selectNodeContents(sizeSpan);
	selection.removeAllRanges();
	selection.addRange(formattedRange);
	savedFontSizeSelection = formattedRange.cloneRange();
}

function handlePaperEditorBeforeInput(event) {
	if (
		!committedFontSizePoints.value ||
		event.inputType !== "insertText" ||
		typeof event.data !== "string"
	) {
		return;
	}
	const editor = event.currentTarget;
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) {
		return;
	}
	const range = selection.getRangeAt(0);
	if (!editor.contains(range.commonAncestorContainer)) {
		return;
	}
	event.preventDefault();
	range.deleteContents();
	const fontSize = `${committedFontSizePoints.value}pt`;
	let textNode = range.startContainer;
	if (
		textNode.nodeType !== Node.TEXT_NODE ||
		textNode.parentElement?.style.fontSize !== fontSize
	) {
		const sizeSpan = editor.ownerDocument.createElement("span");
		sizeSpan.style.fontSize = fontSize;
		textNode = editor.ownerDocument.createTextNode(event.data);
		sizeSpan.append(textNode);
		range.insertNode(sizeSpan);
		range.setStart(textNode, event.data.length);
	} else {
		const insertOffset = range.startOffset;
		textNode.insertData(insertOffset, event.data);
		range.setStart(textNode, insertOffset + event.data.length);
	}
	range.collapse(true);
	selection.removeAllRanges();
	selection.addRange(range);
}

function setSelectedFontColorFromHsv(hue, saturation, value) {
	fontColorPickerHue.value = hue;
	fontColorPickerSaturation.value = saturation;
	fontColorPickerValue.value = value;
	const chroma = value * saturation;
	const secondary = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
	const offset = value - chroma;
	let channels;
	if (hue < 60) {
		channels = [chroma, secondary, 0];
	} else if (hue < 120) {
		channels = [secondary, chroma, 0];
	} else if (hue < 180) {
		channels = [0, chroma, secondary];
	} else if (hue < 240) {
		channels = [0, secondary, chroma];
	} else if (hue < 300) {
		channels = [secondary, 0, chroma];
	} else {
		channels = [chroma, 0, secondary];
	}
	const hexColor = `#${channels
		.map((channel) => Math.round((channel + offset) * 255).toString(16).padStart(2, "0"))
		.join("")}`;
	selectedFontColor.value = hexColor;
	fontColorHexInput.value = hexColor;
}

function handleFontColorPickerPointer(event) {
	if (event.type === "pointermove" && event.buttons === 0) {
		return;
	}
	if (event.type === "pointerdown") {
		event.currentTarget.setPointerCapture(event.pointerId);
	}
	const bounds = event.currentTarget.getBoundingClientRect();
	const horizontalPosition = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
	const verticalPosition = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
	const saturation = verticalPosition <= 0.5 ? verticalPosition * 2 : 1;
	const value = verticalPosition <= 0.5 ? 1 : (1 - verticalPosition) * 2;
	setSelectedFontColorFromHsv(horizontalPosition * 360, saturation, value);
}

function handleFontColorPickerKeydown(event) {
	const hueChanges = { ArrowLeft: -5, ArrowRight: 5 };
	if (hueChanges[event.key]) {
		event.preventDefault();
		setSelectedFontColorFromHsv(
			(fontColorPickerHue.value + hueChanges[event.key] + 360) % 360,
			fontColorPickerSaturation.value,
			fontColorPickerValue.value,
		);
		return;
	}
	if (event.key === "ArrowUp" || event.key === "ArrowDown") {
		event.preventDefault();
		const adjustment = event.key === "ArrowUp" ? 0.05 : -0.05;
		setSelectedFontColorFromHsv(
			fontColorPickerHue.value,
			fontColorPickerSaturation.value,
			Math.min(1, Math.max(0, fontColorPickerValue.value + adjustment)),
		);
	}
}

function handleFontColorHexInput() {
	const enteredColor = fontColorHexInput.value.trim();
	if (!/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(enteredColor)) {
		return;
	}
	const digits = enteredColor.slice(1);
	const expandedDigits = digits.length <= 4
		? [...digits].map((digit) => digit + digit).join("")
		: digits;
	selectedFontColor.value = `#${expandedDigits}`.toLowerCase();
}

function drawFontColorPreview(color) {
	const canvas = fontColorPreviewCanvasRef.value;
	const context = canvas?.getContext("2d");
	if (!context) {
		return;
	}
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = "#ffffff";
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = color;
	context.fillRect(0, 0, canvas.width, canvas.height);
}

watch(selectedFontColor, drawFontColorPreview);
watch(isFontColorMenuOpen, async (isOpen) => {
	if (isOpen) {
		await nextTick();
		drawFontColorPreview(selectedFontColor.value);
	}
});

function fontColorForEditingCommand(color) {
	const digits = color.slice(1);
	if (digits.length !== 8) {
		return color;
	}
	const red = Number.parseInt(digits.slice(0, 2), 16);
	const green = Number.parseInt(digits.slice(2, 4), 16);
	const blue = Number.parseInt(digits.slice(4, 6), 16);
	const alpha = Number.parseInt(digits.slice(6, 8), 16) / 255;
	return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function commitFontColor() {
	committedFontColor.value = selectedFontColor.value;
	const editor = printPreviewPaperEditorRef.value;
	if (!editor) {
		return;
	}
	ensureEditorSelection(editor);
	document.execCommand("foreColor", false, fontColorForEditingCommand(committedFontColor.value));
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

	selectEditorEnd(editor);
}

function selectEditorEnd(editor) {
	editor.focus();
	const range = document.createRange();
	range.selectNodeContents(editor);
	range.collapse(false);
	const selection = window.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);
}

function applyFontStyle(fontOption) {
	if (!fontOption?.family) {
		return;
	}
	activeFontStyleId.value = fontOption.id;
	try {
		window.localStorage.setItem(FONT_STYLE_STORAGE_KEY, activeFontStyleId.value);
	} catch {
		// Keep the selection usable for this session when storage is unavailable.
	}
	const editor = printPreviewPaperEditorRef.value;
	if (!editor) {
		return;
	}
	ensureEditorSelection(editor);
	document.execCommand("fontName", false, fontOption.family);
	document.execCommand("foreColor", false, fontColorForEditingCommand(committedFontColor.value));
}

function toggleSizePanel() {
	isSizePanelOpen.value = !isSizePanelOpen.value;
	syncToolsMenuOrder("size", isSizePanelOpen.value);
	if (!isSizePanelOpen.value) {
		isWidthMenuOpen.value = false;
		isHeightMenuOpen.value = false;
		return;
	}
	isLoadMenuOpen.value = false;
	isStylesMenuOpen.value = false;
}

/** Toggle the Margins placeholder panel and track it in the Tools menu open order. */
function toggleMarginsPanel() {
	isMarginsPanelOpen.value = !isMarginsPanelOpen.value;
	syncToolsMenuOrder("margins", isMarginsPanelOpen.value);
}

function sanitizeMarginValue(value) {
	const [whole = "", fraction] = String(value ?? "")
		.replace(/[^\d.]/g, "")
		.split(".");
	return (fraction === undefined ? whole : `${whole}.${fraction}`).slice(0, 4);
}

function updateMarginValue(field, event) {
	const input = event.currentTarget;
	const value = sanitizeMarginValue(input.value);
	input.value = value;
	marginValues[field] = value;
}

function updateAllMarginValues(event) {
	const input = event.currentTarget;
	const value = sanitizeMarginValue(input.value);
	input.value = value;
	for (const field of marginFields) {
		marginValues[field] = value;
	}
}

function resetMarginSettings() {
	for (const field of marginFields) {
		marginValues[field] = "0";
	}
	isMarginVisibilityOn.value = true;
}

function restoreMarginSettings(template) {
	for (const field of marginFields) {
		marginValues[field] = sanitizeMarginValue(template.marginValues?.[field] ?? "0");
	}
	isMarginVisibilityOn.value = template.marginVisibility !== false;
}

function toggleMarginVisibility() {
	isMarginVisibilityOn.value = !isMarginVisibilityOn.value;
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
		isLoadMenuOpen.value = false;
		isStylesMenuOpen.value = false;
	}
}

function updateUnit(field, unit) {
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
const allSidesMarginValue = computed(() =>
	marginFields.every((field) => marginValues[field] === marginValues.top)
		? marginValues.top
		: "",
);

const printPreviewPaperRef = ref(null);
const printPreviewPaperEditorRef = ref(null);
const isTemplateNamePromptOpen = ref(false);
const templateNameInput = ref("");
const templateNameInputRef = ref(null);
const savedTemplates = ref(loadSavedTemplates());
const isSavedShellsMenuOpen = ref(false);
const savedShellEntries = computed(() =>
	savedTemplates.value.filter((entry) => entry.template?.isShell === true),
);
const savedTemplateEntries = computed(() =>
	savedTemplates.value.filter((entry) => entry.template?.isShell !== true),
);
const isTextEditorWorkflowScreen = computed(
	() => isLoadMenuOpen.value || textEditorButtonStates.value.printPreview,
);

function selectSavedShells() {
	isSavedShellsMenuOpen.value = true;
}

function selectSavedTemplates() {
	isSavedShellsMenuOpen.value = false;
}

function formatSavedTemplateDate(createdAt) {
	const date = new Date(createdAt);
	if (!Number.isFinite(date.getTime())) {
		return "";
	}
	return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

const fontStyleOptions = [
	{
		id: "minecraft-regular-1",
		label: "Minecraft 1 Reg",
		family: '"MinecraftRegular1", "Trebuchet MS", sans-serif',
	},
	{
		id: "minecraft-regular-2",
		label: "Minecraft 2 Reg",
		family: '"MinecraftRegular2", "Trebuchet MS", sans-serif',
	},
	{
		id: "minecraft-regular-2-bold",
		label: "Minecraft 2 Bold",
		family: '"Minecraft2Bold", "Trebuchet MS", sans-serif',
	},
	{
		id: "minecraft-regular-2-italic",
		label: "Minecraft 2 Ital",
		family: '"Minecraft2Italic", "Trebuchet MS", sans-serif',
	},
	{
		id: "minecraft-regular-2-bold-italic",
		label: "Minecraft 2 Bold Ital.",
		family: '"Minecraft2BoldItalic", "Trebuchet MS", sans-serif',
	},
];

/** Feeds the Size menu dimensions into the print preview paper stylesheet variables. */
watchEffect(() => {
	const paperElement = printPreviewPaperRef.value;
	if (paperElement) {
		paperElement.style.setProperty("--print-preview-paper-width", `${paperWidthPx.value}px`);
		paperElement.style.setProperty("--print-preview-paper-height", `${paperHeightPx.value}px`);
		paperElement.style.setProperty(
			"--print-preview-margin-top",
			`${Number.parseFloat(marginValues.top) || 0}px`,
		);
		paperElement.style.setProperty(
			"--print-preview-margin-right",
			`${Number.parseFloat(marginValues.right) || 0}px`,
		);
		paperElement.style.setProperty(
			"--print-preview-margin-bottom",
			`${Number.parseFloat(marginValues.bottom) || 0}px`,
		);
		paperElement.style.setProperty(
			"--print-preview-margin-left",
			`${Number.parseFloat(marginValues.left) || 0}px`,
		);
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
					id="text-editor-template-load-button"
					class="text-editor-template-load-button"
					:class="{ 'text-editor-button--depressed': isLoadMenuOpen }"
					type="button"
					name="text-editor-template-load-button"
					data-button-name="text-editor-template-load-button"
					:aria-pressed="isLoadMenuOpen"
					@click="toggleLoadMenu"
				>
					Load
				</button>
				<button
					id="text-editor-template-new-button"
					class="text-editor-template-new-button text-editor-print-preview-button"
					:class="{ 'text-editor-button--depressed': isNewButtonPressed }"
					type="button"
					name="text-editor-template-new-button"
					data-button-name="text-editor-template-new-button"
					:aria-pressed="isNewButtonPressed"
					@click="toggleTextEditorButton('printPreview')"
				>
					New +
				</button>
				<button
					id="text-editor-editing-tools-button"
					class="text-editor-editing-tools-button text-editor-navigation-tools-button"
					:class="{ 'text-editor-editing-tools-button--depressed': isEditingToolsOpen }"
					type="button"
					name="text-editor-editing-tools-button"
					data-button-name="text-editor-editing-tools-button"
					:aria-pressed="isEditingToolsOpen"
					@click="toggleEditingTools"
				>
					Tools
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
				<button
					v-if="!isTextEditorWorkflowScreen"
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
					v-else
					id="text-editor-workflow-home-button"
					class="text-editor-workflow-home-button"
					type="button"
					name="text-editor-workflow-home-button"
					data-button-name="text-editor-workflow-home-button"
					aria-label="Return home"
					title="Return home"
					@click="handleParentScreenClose"
				>
					Home
				</button>
				<button
					v-if="!isTextEditorWorkflowScreen"
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
					id="text-editor-workflow-back-button"
					class="text-editor-workflow-back-button"
					type="button"
					name="text-editor-workflow-back-button"
					data-button-name="text-editor-workflow-back-button"
					aria-label="Back to Text Editor menu"
					title="Back to Text Editor menu"
					@click="handleTextEditorWorkflowBack"
				>
					Back
				</button>
			</nav>
			<section
				v-if="isLoadMenuOpen"
				id="text-editor-load-menu"
				class="text-editor-load-menu"
				aria-label="Load menu"
				title="Load menu"
			>
				<button
					id="text-editor-load-menu-shells-button"
					class="text-editor-load-menu-shells-button"
					type="button"
					name="text-editor-load-menu-shells-button"
					data-button-name="text-editor-load-menu-shells-button"
					@click="selectSavedShells"
				>
					Load Shells
				</button>
				<button
					id="text-editor-load-menu-templates-button"
					class="text-editor-load-menu-templates-button"
					type="button"
					name="text-editor-load-menu-templates-button"
					data-button-name="text-editor-load-menu-templates-button"
					@click="selectSavedTemplates"
				>
					Load Templates
				</button>
				<ul
					v-if="!isSavedShellsMenuOpen && savedTemplateEntries.length > 0"
					id="text-editor-saved-templates-list"
					class="text-editor-saved-templates-list"
					aria-label="Saved templates"
				>
					<button
						v-for="entry in savedTemplateEntries"
						:id="`text-editor-saved-template-${entry.id}`"
						:key="entry.id"
						class="text-editor-saved-template-item"
						type="button"
						:data-template-id="entry.id"
						:aria-label="entry.name"
						@click="loadSavedTemplate(entry)"
					>
						<span class="text-editor-saved-template-date">{{ formatSavedTemplateDate(entry.createdAt) }}</span>
						<span>{{ entry.name }}</span>
					</button>
				</ul>
				<ul
					v-if="isSavedShellsMenuOpen && savedShellEntries.length > 0"
					id="text-editor-saved-shells-list"
					class="text-editor-saved-shells-list"
					aria-label="Saved shells"
				>
					<button
						v-for="entry in savedShellEntries"
						:id="`text-editor-saved-shell-${entry.id}`"
						:key="entry.id"
						class="text-editor-saved-shell-item"
						type="button"
						:data-shell-id="entry.id"
						:aria-label="entry.name"
						@click="loadSavedTemplate(entry)"
					>
						<span class="text-editor-saved-template-date">{{ formatSavedTemplateDate(entry.createdAt) }}</span>
						<span>{{ entry.name }}</span>
					</button>
				</ul>
			</section>
			<section
				v-if="isNewMenuOpen"
				id="text-editor-new-menu"
				class="text-editor-new-menu"
				aria-label="New menu"
				title="New menu"
			>
				<button
					id="text-editor-new-create-shell-button"
					class="text-editor-new-create-shell-button"
					type="button"
					name="text-editor-new-create-shell-button"
					data-button-name="text-editor-new-create-shell-button"
					@click="createTextEditorShell"
				>
					Create A Shell
				</button>
				<button
					id="text-editor-new-create-template-button"
					class="text-editor-new-create-template-button"
					type="button"
					name="text-editor-new-create-template-button"
					data-button-name="text-editor-new-create-template-button"
					@click="createTextEditorTemplate"
				>
					Create A Template
				</button>
			</section>
			<div
				v-if="isLeaveUnsavedPromptOpen"
				class="text-editor-unsaved-confirmation-overlay"
			>
				<dialog
					id="text-editor-unsaved-confirmation"
					ref="leaveUnsavedConfirmationDialogRef"
					class="text-editor-unsaved-confirmation"
					aria-labelledby="text-editor-unsaved-confirmation-message"
					title="Unsaved document confirmation"
					@close="isLeaveUnsavedPromptOpen = false"
				>
					<p id="text-editor-unsaved-confirmation-message">
						If You Leave Now Without Saving, Your Data Will Be Lost
					</p>
					<div class="text-editor-unsaved-confirmation-actions">
						<button
							id="text-editor-unsaved-confirmation-leave-button"
							class="text-editor-unsaved-confirmation-leave-button"
							type="button"
							@click="leaveUnsavedNewDocument"
						>
							Leave
						</button>
						<button
							id="text-editor-unsaved-confirmation-stay-button"
							class="text-editor-unsaved-confirmation-stay-button"
							type="button"
							@click="stayOnUnsavedNewDocument"
						>
							Stay
						</button>
					</div>
				</dialog>
			</div>
			<section
				v-if="textEditorButtonStates.printPreview"
				id="text-editor-print-preview-panel"
				class="text-editor-print-preview-panel"
				:class="{
					'text-editor-print-preview-panel--shell': isShellMode,
					'text-editor-print-preview-panel--template':
						isUnsavedNewDocument && !isShellMode,
				}"
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
						:aria-label="isShellMode ? 'Name this shell' : 'Name this template'"
					>
						<label
							class="text-editor-template-name-prompt-label"
							for="text-editor-template-name-input"
						>
							{{ isShellMode ? "Shell's Name" : "Template's Name" }}
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
							:contenteditable="!isShellMode"
							:role="isShellMode ? undefined : 'textbox'"
							:aria-label="isShellMode ? undefined : 'Paper template text'"
							@beforeinput="handlePaperEditorBeforeInput"
							@keydown="handlePaperEditorKeydown"
						/>
						<div
							v-if="isMarginVisibilityOn"
							class="print-preview-margin-guides"
							aria-hidden="true"
						>
							<span class="print-preview-margin-guide print-preview-margin-guide--top" />
							<span class="print-preview-margin-guide print-preview-margin-guide--bottom" />
							<span class="print-preview-margin-guide print-preview-margin-guide--left" />
							<span class="print-preview-margin-guide print-preview-margin-guide--right" />
						</div>
					</div>
				</div>
			</section>
			<section
				v-if="textEditorButtonStates.calibrate"
				id="text-editor-calibration-panel"
				class="calibration-panel"
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
				v-if="isEditingToolsOpen"
				id="text-editor-tools-panel"
				class="text-editor-tools-panel"
				:class="{
					'text-editor-tools-panel--shell': isShellMode,
					'text-editor-tools-panel--template':
						isUnsavedNewDocument && !isShellMode,
				}"
				aria-label="Editing tools"
				title="Editing tools"
			>
				<div class="text-editor-ribbon-group">
					<div class="text-editor-size-action-row">
						<div v-if="isEditingToolsOpen" class="text-editor-size-menu-row">
							<div class="text-editor-size-menu-top-row">
								<button
									id="text-editor-size-menu-button"
									class="text-editor-size-menu-button text-editor-size-menu-button--dark-blue"
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
							</div>
							<button
								id="text-editor-margins-button"
								class="text-editor-margins-button text-editor-margins-button--medium-blue"
								:class="{
									'text-editor-margins-button--depressed': isMarginsPanelOpen,
								}"
								type="button"
								name="text-editor-margins-button"
								data-button-name="text-editor-margins-button"
								:aria-pressed="isMarginsPanelOpen"
								@click="toggleMarginsPanel"
							>
								Margins
							</button>
							<button
								id="text-editor-fonts-button"
								class="text-editor-fonts-button text-editor-fonts-button--light-blue"
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
							<section
								v-if="isFontsPanelOpen"
								id="text-editor-fonts-panel"
								class="text-editor-fonts-panel text-editor-fonts-panel--below-tools"
								aria-label="Fonts options"
								title="Fonts options"
							>
								<button
									id="text-editor-font-styles-button"
									class="text-editor-font-styles-button"
									:class="{
										'text-editor-font-styles-button--depressed': isStylesMenuOpen,
									}"
									data-font-option="styles"
									type="button"
									:aria-pressed="isStylesMenuOpen"
									@click="toggleStylesMenu"
								>
									Font Styles
								</button>
								<button
									id="text-editor-font-color-button"
									class="text-editor-font-color-button"
									:class="{
										'text-editor-font-color-button--depressed': isFontColorMenuOpen,
									}"
									data-font-option="color"
									type="button"
									:aria-pressed="isFontColorMenuOpen"
									@click="toggleFontColorMenu"
								>
									Font Color
								</button>
								<button
									id="text-editor-font-size-button"
									class="text-editor-font-size-button"
									:class="{
										'text-editor-font-size-button--depressed': isFontSizeMenuOpen,
									}"
									data-font-option="font-size"
									type="button"
									:aria-pressed="isFontSizeMenuOpen"
									@mousedown.prevent="rememberFontSizeSelection"
									@click="toggleFontSizeMenu"
								>
									Font Size
								</button>
								<section
									v-if="isFontSizeMenuOpen"
									id="text-editor-font-size-menu"
									class="text-editor-font-styles-menu text-editor-font-size-menu"
									:class="{
										'text-editor-font-size-menu--below-styles': isStylesMenuOpen,
										'text-editor-font-size-menu--below-color':
											!isStylesMenuOpen && isFontColorMenuOpen,
										'text-editor-font-size-menu--left-of-fonts':
											!isStylesMenuOpen && !isFontColorMenuOpen,
										'text-editor-font-size-menu--lowered': shouldLowerNestedFontMenus,
									}"
									aria-label="Font size"
									title="Font size"
								>
									<div class="text-editor-font-size-menu-content">
										<div class="text-editor-font-size-controls">
											<div class="text-editor-font-size-label">Font Size</div>
											<input
											id="text-editor-font-size-input"
											v-model="fontSizePoints"
											class="text-editor-font-size-input"
											type="text"
											inputmode="numeric"
											aria-label="Font size in points"
											@input="sanitizeFontSizeInput"
										/>
										<span class="text-editor-font-size-unit">pt</span>
									</div>
									<button
										id="text-editor-font-size-commit-button"
										class="description-edits-commit-button text-editor-font-color-commit-button text-editor-font-size-commit-button"
										type="button"
										@click="commitFontSize"
									>
										Commit
									</button>
								</div>
								</section>
								<section
									v-if="isStylesMenuOpen"
									id="text-editor-font-styles-menu"
									class="text-editor-font-styles-menu"
									:class="{
									'text-editor-font-styles-menu--lowered': shouldLowerNestedFontMenus,
								}"
									aria-label="Font styles"
									title="Font styles"
								>
									<button
										v-for="fontOption in fontStyleOptions"
										:id="`text-editor-font-style-button-${fontOption.id}`"
										:key="fontOption.id"
										class="text-editor-font-style-button text-editor-fonts-button--light-blue"
										:class="{
											'text-editor-font-style-button--depressed':
												activeFontStyleId === fontOption.id,
										}"
										type="button"
										:data-font-style="fontOption.id"
										:aria-pressed="activeFontStyleId === fontOption.id"
										@mousedown.prevent
										@click="applyFontStyle(fontOption)"
									>
										{{ fontOption.label }}
									</button>
								</section>
								<section
									v-if="isFontColorMenuOpen"
									id="text-editor-font-color-menu"
									class="text-editor-font-styles-menu text-editor-font-color-menu"
									:class="{
										'text-editor-font-color-menu--above-styles': isStylesMenuOpen,
										'text-editor-font-color-menu--left-of-fonts': !isStylesMenuOpen,
									'text-editor-font-color-menu--lowered': shouldLowerNestedFontMenus,
									}"
									aria-label="Font color"
									title="Font color"
								>
									<button
										id="text-editor-font-color-picker"
										class="text-editor-font-color-picker"
										type="button"
										aria-label="Choose font color"
										@pointerdown="handleFontColorPickerPointer"
										@pointermove="handleFontColorPickerPointer"
										@keydown="handleFontColorPickerKeydown"
									/>
									<div class="text-editor-font-color-controls">
										<canvas
											id="text-editor-font-color-preview"
											ref="fontColorPreviewCanvasRef"
											class="text-editor-font-color-preview"
											width="40"
											height="40"
											role="img"
											aria-label="Font color preview"
										/>
										<input
											id="text-editor-font-color-hex-input"
											v-model="fontColorHexInput"
											class="text-editor-font-color-hex-input"
											type="text"
											maxlength="9"
											spellcheck="false"
											aria-label="Font color hex code"
											@input="handleFontColorHexInput"
										/>
										<button
											id="text-editor-font-color-commit-button"
											class="description-edits-commit-button text-editor-font-color-commit-button"
											type="button"
											@click="commitFontColor"
										>
											Commit
										</button>
									</div>
								</section>
							</section>
							<div
								v-if="isSizePanelOpen"
								id="text-editor-size-panel"
								class="text-editor-size-panel"
								:class="{
									'text-editor-size-panel--below-fonts': isFontsPanelOpen,
								}"
								aria-label="Size options"
							>
								<div class="text-editor-size-row">
									<label
										id="text-editor-size-width-label"
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
											aria-describedby="text-editor-size-width-label"
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
										id="text-editor-size-height-label"
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
											aria-describedby="text-editor-size-height-label"
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
							<section
								v-if="isMarginsPanelOpen"
								id="text-editor-margins-panel"
								class="text-editor-margins-panel"
								:class="{
									'text-editor-margins-panel--below-size':
										isSizePanelOpen && !isFontsPanelOpen,
									'text-editor-margins-panel--below-fonts':
										isFontsPanelOpen && !isSizePanelOpen,
									'text-editor-margins-panel--below-fonts-after-size':
										isFontsPanelOpen && isSizePanelOpen,
								}"
								aria-label="Margins"
								title="Margins"
							>
								<div class="text-editor-margin-controls">
									<label class="text-editor-margin-row" for="text-editor-margin-top-input">
										<span>Top</span>
										<input
											id="text-editor-margin-top-input"
											class="text-editor-margin-input"
											type="text"
											inputmode="decimal"
											maxlength="4"
											:value="marginValues.top"
											@input="updateMarginValue('top', $event)"
										/>
									</label>
									<label class="text-editor-margin-row" for="text-editor-margin-bottom-input">
										<span>Bottom</span>
										<input
											id="text-editor-margin-bottom-input"
											class="text-editor-margin-input"
											type="text"
											inputmode="decimal"
											maxlength="4"
											:value="marginValues.bottom"
											@input="updateMarginValue('bottom', $event)"
										/>
									</label>
									<label class="text-editor-margin-row" for="text-editor-margin-left-input">
										<span>Left</span>
										<input
											id="text-editor-margin-left-input"
											class="text-editor-margin-input"
											type="text"
											inputmode="decimal"
											maxlength="4"
											:value="marginValues.left"
											@input="updateMarginValue('left', $event)"
										/>
									</label>
									<label class="text-editor-margin-row" for="text-editor-margin-right-input">
										<span>Right</span>
										<input
											id="text-editor-margin-right-input"
											class="text-editor-margin-input"
											type="text"
											inputmode="decimal"
											maxlength="4"
											:value="marginValues.right"
											@input="updateMarginValue('right', $event)"
										/>
									</label>
									<label class="text-editor-margin-row" for="text-editor-margin-all-sides-input">
										<span>All Sides</span>
										<input
											id="text-editor-margin-all-sides-input"
											class="text-editor-margin-input"
											type="text"
											inputmode="decimal"
											maxlength="4"
											:value="allSidesMarginValue"
											@input="updateAllMarginValues"
										/>
									</label>
									<div class="text-editor-margin-row">
										<span>Margin Visibility</span>
										<button
											id="text-editor-margin-visibility-button"
											class="text-editor-margin-visibility-button"
											:class="{
												'text-editor-margin-visibility-button--on': isMarginVisibilityOn,
												'text-editor-margin-visibility-button--off': !isMarginVisibilityOn,
											}"
											type="button"
											:aria-pressed="isMarginVisibilityOn"
											@click="toggleMarginVisibility"
										>
											{{ isMarginVisibilityOn ? "On" : "Off" }}
										</button>
									</div>
								</div>
							</section>
						</div>
					</div>
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
			v-if="!isTextEditorOpen"
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

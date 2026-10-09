<script setup>
import {
	computed,
	nextTick,
	onBeforeUnmount,
	onMounted,
	reactive,
	ref,
	watch,
	watchEffect,
} from "vue";

import {
	addSavedTemplate,
	buildTemplateEntry,
	loadSavedTemplates,
	saveSavedTemplates,
} from "../js/templateStorage.js";
import { convertToPixels } from "../js/unitConversion.js";
import MathGamesView from "./MathGamesView.vue";

const emit = defineEmits(["open-student-edits", "back-to-home"]);
const isTextEditorOpen = ref(false);
const isGamesSidebarOpen = ref(false);
const activeGamesButton = ref("");
const textEditorButtonStates = ref({
	printPreview: false,
	grid: false,
	calibrate: false,
});
const isNewMenuOpen = ref(false);
const isNewButtonPressed = ref(false);
const isUnsavedNewDocument = ref(false);
const savedDocumentBaseline = ref(null);
const paperEditorMutationRevision = ref(0);
let paperEditorMutationObserver = null;
const isLeaveUnsavedPromptOpen = ref(false);
const leaveUnsavedConfirmationDialogRef = ref(null);
const isShellMode = ref(false);
const isEditingToolsOpen = ref(false);
const isSizePanelOpen = ref(false);
const isFontsPanelOpen = ref(false);
const isMarginsPanelOpen = ref(false);
const isAlignmentPanelOpen = ref(false);
const globalTextAlignment = ref(null);

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
const isRemoveMode = ref(false);
const isRemoveConfirmationOpen = ref(false);
const removeConfirmationDialogRef = ref(null);
const selectedSavedEntryForRemoval = ref(null);
const removeConfirmationError = ref("");
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

watch(isRemoveConfirmationOpen, async (isOpen) => {
	if (!isOpen) {
		return;
	}

	await nextTick();
	const dialog = removeConfirmationDialogRef.value;
	if (dialog && !dialog.open) {
		dialog.showModal();
	}
});

const marginFields = ["top", "bottom", "left", "right"];
const marginValues = reactive({ top: "0", bottom: "0", left: "0", right: "0" });
const isMarginVisibilityOn = ref(true);
const gridRowsAmount = ref("");
const gridColumnsAmount = ref("");
const selectedGridAlignment = ref(null);
const selectedSingleShapeAction = ref(null);
const removedGridShapeCells = ref([]);
const selectedGridShapeAdditionDirection = ref(null);
const selectedGridShapeAdditionSides = ref(null);
const gridRowShapeAdditions = ref([]);
const gridColumnShapeAdditions = ref([]);
const isGridPositionCustomOpen = ref(false);
const gridMoveStep = ref(null);
const gridNudgeX = ref(0);
const gridNudgeY = ref(0);
const gridShapeWidthInput = ref("");
const gridShapeHeightInput = ref("");
const currentGridShapeWidthInches = ref(null);
const currentGridShapeHeightInches = ref(null);
const selectedGridShapeSides = ref(null);
const currentTemplateGridSides = ref(4);
const quadrilateralVariants = [
	{ id: "square", label: "A.) Squares" },
	{ id: "diamond", label: "B.) Squares (Diamond)" },
	{ id: "vertical-rectangle", label: "C.) Rectangles (Vertical)" },
	{ id: "horizontal-rectangle", label: "D.) Rectangles (Horizontal)" },
];
const selectedGridShapeVariant = ref("vertical-rectangle");
const currentTemplateGridShapeVariant = ref("vertical-rectangle");
const gridRowCount = computed(() => Math.max(1, Number.parseInt(gridRowsAmount.value, 10) || 3));
const gridColumnCount = computed(() =>
	Math.max(1, Number.parseInt(gridColumnsAmount.value, 10) || 4),
);
const gridShapeSideCount = computed(() => currentTemplateGridSides.value);
const gridShapeOptions = [
	{ sides: 1, label: "1 Side: Circle" },
	{ sides: 3, label: "3 Sides: Triangle" },
	{ sides: 4, label: "4 Sides: Quadrilateral" },
	{ sides: 5, label: "5 Sides: Pentagon" },
	{ sides: 6, label: "6 Sides: Hexagon" },
	{ sides: 7, label: "7 Sides: Heptagon" },
	{ sides: 8, label: "8 Sides: Octagon" },
	{ sides: 9, label: "9 Sides: Nonagon" },
	{ sides: 10, label: "10 Sides: Decagon" },
	{ sides: 11, label: "11 Sides: Hendecagon" },
	{ sides: 12, label: "12 Sides: Dodecagon" },
	{ sides: 13, label: "13 Sides: Triskaidecagon" },
	{ sides: 14, label: "14 Sides: Tetradecagon" },
	{ sides: 15, label: "15 Sides: Pentadecagon" },
	{ sides: 16, label: "16 Sides: Hexadecagon" },
	{ sides: 17, label: "17 Sides: Heptadecagon" },
	{ sides: 18, label: "18 Sides: Octadecagon" },
	{ sides: 19, label: "19 Sides: Enneadecagon" },
	{ sides: 20, label: "20 Sides: Icosagon" },
	{ sides: 21, label: "21 Sides: Icosihenagon" },
	{ sides: 22, label: "22 Sides: Icosidigon" },
	{ sides: 23, label: "23 Sides: Icositrigon" },
	{ sides: 24, label: "24 Sides: Icositetragon" },
	{ sides: 25, label: "25 Sides: Icosipentagon" },
	{ sides: 26, label: "26 Sides: Icosihexagon" },
	{ sides: 27, label: "27 Sides: Icosiheptagon" },
	{ sides: 28, label: "28 Sides: Icosioctagon" },
	{ sides: 29, label: "29 Sides: Icosienneagon" },
	{ sides: 30, label: "30 Sides: Triacontagon" },
	{ sides: 31, label: "31 Sides: Triacontahenagon" },
	{ sides: 32, label: "32 Sides: Triacontadigon" },
	{ sides: 33, label: "33 Sides: Triacontatrigon" },
	{ sides: 34, label: "34 Sides: Triacontatetragon" },
	{ sides: 35, label: "35 Sides: Triacontapentagon" },
	{ sides: 36, label: "36 Sides: Triacontahexagon" },
	{ sides: 37, label: "37 Sides: Triacontaheptagon" },
	{ sides: 38, label: "38 Sides: Triacontaoctagon" },
	{ sides: 39, label: "39 Sides: Triacontaenneagon" },
	{ sides: 40, label: "40 Sides: Tetracontagon" },
	{ sides: 41, label: "41 Sides: Tetracontahenagon" },
	{ sides: 42, label: "42 Sides: Tetracontadigon" },
	{ sides: 43, label: "43 Sides: Tetracontatrigon" },
	{ sides: 44, label: "44 Sides: Tetracontatetragon" },
	{ sides: 45, label: "45 Sides: Tetracontapentagon" },
	{ sides: 46, label: "46 Sides: Tetracontahexagon" },
	{ sides: 47, label: "47 Sides: Tetracontaheptagon" },
	{ sides: 48, label: "48 Sides: Tetracontaoctagon" },
	{ sides: 49, label: "49 Sides: Tetracontaenneagon" },
	{ sides: 50, label: "50 Sides: Pentacontagon" },
];
const isApplyToMarginsOn = ref(false);
const isGridApplied = ref(true);
const isGridPrintable = ref(true);
const isQuadrilateralPromptOpen = ref(false);
const appliedGridConfiguration = computed(() =>
	isGridApplied.value
		? {
				rows: gridRowsAmount.value,
				columns: gridColumnsAmount.value,
				sides: gridShapeSideCount.value,
				applyToMargins: isApplyToMarginsOn.value,
			}
		: null,
);
const isShapeRemovalHighlightActive = computed(
	() =>
		textEditorButtonStates.value.printPreview &&
		isGridApplied.value &&
		selectedSingleShapeAction.value === "removal",
);
const isShapeAdditionHighlightActive = computed(
	() =>
		textEditorButtonStates.value.printPreview &&
		isGridApplied.value &&
		selectedSingleShapeAction.value === "addition",
);
const isShapeSwapHighlightActive = computed(
	() =>
		textEditorButtonStates.value.printPreview &&
		isGridApplied.value &&
		selectedSingleShapeAction.value === "swap",
);
const isGridShapeHighlightActive = computed(
	() =>
		isShapeRemovalHighlightActive.value ||
		isShapeAdditionHighlightActive.value ||
		isShapeSwapHighlightActive.value,
);
const isGridShapeInteractionActive = computed(
	() => isShapeRemovalHighlightActive.value || isShapeAdditionHighlightActive.value,
);
const gridSingleShapeHighlightPatternCells = [
	{ row: 0, column: 0, color: "#00ff40" },
	{ row: 0, column: 1, color: "#ffff00" },
	{ row: 1, column: 0, color: "#ffff00" },
	{ row: 1, column: 1, color: "#00ff40" },
];
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

function handleParentScreenBack() {
	if (activeGamesButton.value) {
		activeGamesButton.value = "";
	} else if (isGamesSidebarOpen.value) {
		isGamesSidebarOpen.value = false;
	} else {
		handleParentScreenClose();
	}
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

function toggleNavigationSave() {
	if (isNavigationSaveOpen.value) {
		isNavigationSaveOpen.value = false;
		navigationSaveName.value = "";
		navigationSaveEntryId.value = null;
		navigationSaveError.value = "";
		return;
	}

	navigationSaveName.value = "";
	navigationSaveEntryId.value = null;
	navigationSaveError.value = "";
	isNavigationSaveOpen.value = true;
	nextTick(() => navigationSaveNameInputRef.value?.focus());
}

function handleNavigationSaveInput(event) {
	navigationSaveName.value = event.target.value;
	navigationSaveError.value = "";
	const trimmedName = navigationSaveName.value.trim();
	if (!trimmedName) {
		return;
	}

	const snapshot = captureCurrentTemplate();
	if (!snapshot) {
		navigationSaveError.value = "The current paper could not be saved.";
		return;
	}

	const existingEntry = savedTemplates.value.find(
		(entry) => entry.id === navigationSaveEntryId.value,
	);
	const entry = existingEntry
		? { ...existingEntry, name: trimmedName, template: snapshot }
		: buildTemplateEntry(trimmedName, snapshot);
	const nextEntries = existingEntry
		? savedTemplates.value.map((savedEntry) =>
				savedEntry.id === entry.id ? entry : savedEntry,
			)
		: [...savedTemplates.value, entry];

	if (!saveSavedTemplates(nextEntries)) {
		navigationSaveError.value = "The paper could not be saved. Please try again.";
		return;
	}

	savedTemplates.value = nextEntries;
	navigationSaveEntryId.value = entry.id;
	savedDocumentBaseline.value = snapshot;
}

function finishNavigationSave() {
	isNavigationSaveOpen.value = false;
	navigationSaveName.value = "";
	navigationSaveEntryId.value = null;
	navigationSaveError.value = "";
}

function captureCurrentTemplate() {
	const editor = printPreviewPaperEditorRef.value;
	if (!editor) {
		return null;
	}

	const snapshot = {
		html: editor.innerHTML === "<br>" ? "" : editor.innerHTML,
		widthValue: widthValue.value,
		widthUnit: widthUnit.value,
		heightValue: heightValue.value,
		heightUnit: heightUnit.value,
		marginValues: { ...marginValues },
		marginVisibility: isMarginVisibilityOn.value,
		gridSides: currentTemplateGridSides.value,
		gridShapeVariant: currentTemplateGridShapeVariant.value,
		gridShapeWidthInches: currentGridShapeWidthInches.value,
		gridShapeHeightInches: currentGridShapeHeightInches.value,
		gridOptions: {
			isApplied: isGridApplied.value,
			isPrintable: isGridPrintable.value,
			applyToMargins: isApplyToMarginsOn.value,
			rows: gridRowsAmount.value,
			columns: gridColumnsAmount.value,
			alignment: selectedGridAlignment.value,
			moveStep: gridMoveStep.value,
			nudgeX: gridNudgeX.value,
			nudgeY: gridNudgeY.value,
			widthInput: gridShapeWidthInput.value,
			heightInput: gridShapeHeightInput.value,
			selectedShapeSides: selectedGridShapeSides.value,
			selectedShapeVariant: selectedGridShapeVariant.value,
		},
		gridShapeEdits: {
			removedCells: [...removedGridShapeCells.value],
			rowAdditions: gridRowShapeAdditions.value.map((entry) => ({
				row: entry.row,
				shapes: entry.shapes.map((shape) => ({ ...shape })),
			})),
			columnAdditions: gridColumnShapeAdditions.value.map((entry) => ({
				column: entry.column,
				shapes: entry.shapes.map((shape) => ({ ...shape })),
			})),
		},
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
	return Boolean(baseline && current && JSON.stringify(current) !== JSON.stringify(baseline));
}

const isDocumentDirty = computed(() => {
	// The contenteditable DOM is not reactive, so observe its mutation revision explicitly.
	void paperEditorMutationRevision.value;
	return hasUnsavedDocumentChanges();
});

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
	finishNavigationSave();
	isTextEditorOpen.value = false;
	textEditorButtonStates.value.printPreview = false;
	isQuadrilateralPromptOpen.value = false;
	isNewMenuOpen.value = false;
	isUnsavedNewDocument.value = false;
	isLeaveUnsavedPromptOpen.value = false;
	savedDocumentBaseline.value = null;
	isShellMode.value = false;
	textEditorButtonStates.value.grid = false;
	textEditorButtonStates.value.calibrate = false;
	isCalibrationBarVisible.value = false;
	isLoadMenuOpen.value = false;
	isRemoveMode.value = false;
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
	isRemoveMode.value = false;
	isNewMenuOpen.value = false;
	isNewButtonPressed.value = false;
}

function handleTextEditorOpen() {
	isTextEditorOpen.value = true;
}

function toggleGamesSidebar() {
	isGamesSidebarOpen.value = !isGamesSidebarOpen.value;
	if (!isGamesSidebarOpen.value) {
		activeGamesButton.value = "";
	}
}

function toggleGamesButton(buttonName) {
	if (activeGamesButton.value === buttonName) {
		activeGamesButton.value = "";
		return;
	}
	activeGamesButton.value = buttonName;
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
	removedGridShapeCells.value = [];
	gridRowShapeAdditions.value = [];
	gridColumnShapeAdditions.value = [];
	selectedGridShapeAdditionDirection.value = null;
	selectedGridShapeAdditionSides.value = null;
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
	activateTemplateGridSides();
	await resetEditorForNewDocument();
	savedDocumentBaseline.value = captureCurrentTemplate();
}

async function createTextEditorTemplate() {
	isNewMenuOpen.value = false;
	isUnsavedNewDocument.value = true;
	isShellMode.value = false;
	textEditorButtonStates.value.printPreview = true;
	activateTemplateGridSides();
	const editor = await resetEditorForNewDocument();
	const fontOption = fontStyleOptions.find((option) => option.id === activeFontStyleId.value);
	if (editor && fontOption) {
		editor.style.fontFamily = fontOption.family;
	}
	if (editor) {
		editor.style.color = committedFontColor.value;
		if (globalTextAlignment.value) {
			applyGlobalTextAlignment(editor);
		} else {
			selectEditorEnd(editor);
		}
	}
	savedDocumentBaseline.value = captureCurrentTemplate();
}

function leaveUnsavedNewDocument() {
	finishNavigationSave();
	isLeaveUnsavedPromptOpen.value = false;
	isNewMenuOpen.value = false;
	isNewButtonPressed.value = false;
	isQuadrilateralPromptOpen.value = false;
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
	if (paperEditorMutationObserver) {
		paperEditorMutationObserver.disconnect();
	}
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
		isRemoveMode.value = false;
		isStylesMenuOpen.value = false;
		isWidthMenuOpen.value = false;
		isHeightMenuOpen.value = false;
	} else {
		isRemoveMode.value = false;
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

	selectedGridShapeAdditionDirection.value = null;
	selectedGridShapeAdditionSides.value = null;
	const gridShapeEdits = entry.template.gridShapeEdits ?? {};
	removedGridShapeCells.value = Array.isArray(gridShapeEdits.removedCells)
		? gridShapeEdits.removedCells.filter((key) => typeof key === "string")
		: [];
	gridRowShapeAdditions.value = Array.isArray(gridShapeEdits.rowAdditions)
		? gridShapeEdits.rowAdditions
		: [];
	gridColumnShapeAdditions.value = Array.isArray(gridShapeEdits.columnAdditions)
		? gridShapeEdits.columnAdditions
		: [];
	gridRowsAmount.value = entry.template.gridOptions?.rows ?? gridRowsAmount.value;
	gridColumnsAmount.value = entry.template.gridOptions?.columns ?? gridColumnsAmount.value;
	activateTemplateGridSides(
		entry.template.gridSides ?? 4,
		entry.template.gridShapeVariant ?? "vertical-rectangle",
	);
	currentGridShapeWidthInches.value = entry.template.gridShapeWidthInches ?? null;
	currentGridShapeHeightInches.value = entry.template.gridShapeHeightInches ?? null;
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
		if (globalTextAlignment.value) {
			applyGlobalTextAlignment(editor);
		} else {
			selectEditorEnd(editor);
		}
	}
	savedDocumentBaseline.value = captureCurrentTemplate();
}

function toggleEditingTools() {
	isEditingToolsOpen.value = !isEditingToolsOpen.value;
	if (!isEditingToolsOpen.value) {
		isSizePanelOpen.value = false;
		isFontsPanelOpen.value = false;
		isMarginsPanelOpen.value = false;
		isAlignmentPanelOpen.value = false;
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
		.map((channel) =>
			Math.round((channel + offset) * 255)
				.toString(16)
				.padStart(2, "0"),
		)
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
	const horizontalPosition = Math.min(
		1,
		Math.max(0, (event.clientX - bounds.left) / bounds.width),
	);
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
	const expandedDigits =
		digits.length <= 4 ? [...digits].map((digit) => digit + digit).join("") : digits;
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

function applyTextAlignment(alignment) {
	globalTextAlignment.value = globalTextAlignment.value === alignment ? null : alignment;
	const editor = printPreviewPaperEditorRef.value;
	if (!editor || isShellMode.value) {
		return;
	}
	let range = window.getSelection()?.rangeCount ? window.getSelection().getRangeAt(0) : null;
	if (!range || !editor.contains(range.commonAncestorContainer)) {
		selectEditorEnd(editor);
		range = window.getSelection()?.getRangeAt(0) ?? null;
	}
	if (range && !range.collapsed) {
		const alignedText = document.createElement("div");
		alignedText.style.textAlign = globalTextAlignment.value ?? "";
		alignedText.append(range.extractContents());
		range.insertNode(alignedText);
		const selectedRange = document.createRange();
		selectedRange.selectNodeContents(alignedText);
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(selectedRange);
		editor.focus();
		return;
	}
	const target = getTextAlignmentTarget(editor, range?.startContainer);
	target.style.textAlign = globalTextAlignment.value ?? "";
	editor.focus();
	if (range) {
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);
	}
}

function applyGlobalTextAlignment(editor) {
	if (isShellMode.value || !globalTextAlignment.value) {
		return;
	}
	selectEditorEnd(editor);
	const range = window.getSelection()?.getRangeAt(0);
	getTextAlignmentTarget(editor, range?.startContainer).style.textAlign =
		globalTextAlignment.value;
}

function getTextAlignmentTarget(editor, node) {
	let element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
	while (element && element !== editor) {
		if (
			["BLOCKQUOTE", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "P", "PRE"].includes(
				element.tagName,
			)
		) {
			return element;
		}
		element = element.parentElement;
	}
	return editor;
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

function toggleAlignmentPanel() {
	isAlignmentPanelOpen.value = !isAlignmentPanelOpen.value;
	syncToolsMenuOrder("alignment", isAlignmentPanelOpen.value);
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

function sanitizeGridAmount(value) {
	return value.replace(/\D/g, "").slice(0, 3);
}

function sanitizeGridDimension(value) {
	const sanitizedValue = value.replace(/[^\d.]/g, "");
	const decimalPosition = sanitizedValue.indexOf(".");
	if (decimalPosition === -1) {
		return sanitizedValue.slice(0, 4);
	}
	return `${sanitizedValue.slice(0, decimalPosition + 1)}${sanitizedValue
		.slice(decimalPosition + 1)
		.replaceAll(".", "")}`.slice(0, 4);
}

function updateGridShapeWidthInput(event) {
	const sanitizedValue = sanitizeGridDimension(event.target.value);
	gridShapeWidthInput.value = sanitizedValue;
	event.target.value = sanitizedValue;
}

function updateGridShapeHeightInput(event) {
	const sanitizedValue = sanitizeGridDimension(event.target.value);
	gridShapeHeightInput.value = sanitizedValue;
	event.target.value = sanitizedValue;
}

function activateTemplateGridSides(templateSides = 4, templateVariant = "vertical-rectangle") {
	const selectedOption = gridShapeOptions.find(
		(shapeOption) => shapeOption.sides === templateSides,
	);
	currentTemplateGridSides.value = selectedOption?.sides ?? 4;
	selectedGridShapeSides.value = currentTemplateGridSides.value;
	const isKnownVariant = quadrilateralVariants.some((variant) => variant.id === templateVariant);
	currentTemplateGridShapeVariant.value =
		currentTemplateGridSides.value === 4 && isKnownVariant ? templateVariant : "diamond";
	selectedGridShapeVariant.value = currentTemplateGridShapeVariant.value;
}

function selectGridShape(shapeOption) {
	selectedGridShapeSides.value = shapeOption.sides;
	if (shapeOption.sides === 4) {
		selectedGridShapeVariant.value = "vertical-rectangle";
		isQuadrilateralPromptOpen.value = true;
	}
}

function selectGridShapeVariant(variant) {
	selectedGridShapeSides.value = 4;
	selectedGridShapeVariant.value = variant.id;
}

function closeQuadrilateralPrompt() {
	isQuadrilateralPromptOpen.value = false;
}

function toggleApplyToMargins() {
	isApplyToMarginsOn.value = !isApplyToMarginsOn.value;
}

function toggleGridApplied() {
	isGridApplied.value = !isGridApplied.value;
}

function toggleGridAlignment(alignment) {
	selectedGridAlignment.value = selectedGridAlignment.value === alignment ? null : alignment;
}

function toggleSingleShapeAction(action) {
	selectedSingleShapeAction.value = selectedSingleShapeAction.value === action ? null : action;
	if (selectedSingleShapeAction.value !== "addition") {
		selectedGridShapeAdditionDirection.value = null;
		selectedGridShapeAdditionSides.value = null;
	}
}

function toggleGridShapeAdditionDirection(direction) {
	selectedGridShapeAdditionDirection.value =
		selectedGridShapeAdditionDirection.value === direction ? null : direction;
}

function isGridShapeCellRemoved(cell) {
	return removedGridShapeCells.value.includes(cell.key);
}

function removeGridShape(cell) {
	if (!isShapeRemovalHighlightActive.value || isGridShapeCellRemoved(cell)) {
		return;
	}
	removedGridShapeCells.value = [...removedGridShapeCells.value, cell.key];
}

function addGridShape(cell) {
	const direction = selectedGridShapeAdditionDirection.value;
	const sides = selectedGridShapeAdditionSides.value;
	if (
		!isShapeAdditionHighlightActive.value ||
		!direction ||
		!gridShapeOptions.some((shapeOption) => shapeOption.sides === sides)
	) {
		return;
	}

	const groupIndex = direction === "row" ? cell.row : cell.column;
	const groupLimit =
		direction === "row" ? gridRenderedRowCount.value : gridRenderedColumnCount.value;
	if (groupIndex < 0 || groupIndex >= groupLimit) {
		return;
	}
	const additions =
		direction === "row" ? gridRowShapeAdditions.value : gridColumnShapeAdditions.value;
	const existingGroup = additions.find((entry) =>
		direction === "row" ? entry.row === groupIndex : entry.column === groupIndex,
	);
	const existingShapes = existingGroup?.shapes ?? [];
	const shape = {
		id: `${direction}-${groupIndex}-${existingShapes.length}`,
		sides,
		variant: sides === 4 ? currentTemplateGridShapeVariant.value : "diamond",
	};
	const updatedGroup = {
		...(existingGroup ?? (direction === "row" ? { row: groupIndex } : { column: groupIndex })),
		shapes: [...existingShapes, shape],
	};
	if (direction === "row") {
		gridRowShapeAdditions.value = existingGroup
			? additions.map((entry) => (entry.row === groupIndex ? updatedGroup : entry))
			: [...additions, updatedGroup];
	} else {
		gridColumnShapeAdditions.value = existingGroup
			? additions.map((entry) => (entry.column === groupIndex ? updatedGroup : entry))
			: [...additions, updatedGroup];
	}
}

function nudgeGrid(direction) {
	if (direction === "left") {
		gridNudgeX.value -= gridMoveStep.value;
	} else if (direction === "right") {
		gridNudgeX.value += gridMoveStep.value;
	} else if (direction === "up") {
		gridNudgeY.value -= gridMoveStep.value;
	} else if (direction === "down") {
		gridNudgeY.value += gridMoveStep.value;
	}
}

function getGridAlignmentButtonState(alignment) {
	return selectedGridAlignment.value === alignment
		? "grid-menu-toggle-button--on"
		: "grid-menu-toggle-button--off";
}

function toggleGridPrintable() {
	isGridPrintable.value = !isGridPrintable.value;
}

function handlePrintSelectedPaper() {
	if (!printPreviewPaperRef.value) {
		return;
	}

	window.print();
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
function getGridMarginPixels(field) {
	return isApplyToMarginsOn.value ? Number.parseFloat(marginValues[field]) || 0 : 0;
}

const gridAreaWidthPx = computed(() =>
	Math.max(1, paperWidthPx.value - getGridMarginPixels("left") - getGridMarginPixels("right")),
);
const gridAreaHeightPx = computed(() =>
	Math.max(1, paperHeightPx.value - getGridMarginPixels("top") - getGridMarginPixels("bottom")),
);
function getGridShapeUnitVertices(sides, variant) {
	if (sides === 1) {
		return [];
	}
	if (sides === 4) {
		if (variant === "square") {
			return [
				{ x: -1, y: -1 },
				{ x: 1, y: -1 },
				{ x: 1, y: 1 },
				{ x: -1, y: 1 },
			];
		}
		if (variant === "vertical-rectangle") {
			return [
				{ x: -0.5, y: -1 },
				{ x: 0.5, y: -1 },
				{ x: 0.5, y: 1 },
				{ x: -0.5, y: 1 },
			];
		}
		if (variant === "horizontal-rectangle") {
			return [
				{ x: -1, y: -0.5 },
				{ x: 1, y: -0.5 },
				{ x: 1, y: 0.5 },
				{ x: -1, y: 0.5 },
			];
		}
	}
	return Array.from({ length: sides }, (_, index) => {
		const angle = (Math.PI * 2 * index) / sides - Math.PI / 2;
		return { x: Math.cos(angle), y: Math.sin(angle) };
	});
}

function getGridShapeBounds(sides, variant) {
	if (sides === 1) {
		return { minX: -1, maxX: 1, minY: -1, maxY: 1, width: 2, height: 2 };
	}
	const vertices = getGridShapeUnitVertices(sides, variant);
	const xValues = vertices.map(({ x }) => x);
	const yValues = vertices.map(({ y }) => y);
	const minX = Math.min(...xValues);
	const maxX = Math.max(...xValues);
	const minY = Math.min(...yValues);
	const maxY = Math.max(...yValues);
	return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

const gridShapeUnitVertices = computed(() => {
	return getGridShapeUnitVertices(
		gridShapeSideCount.value,
		currentTemplateGridShapeVariant.value,
	);
});
const gridShapeBounds = computed(() =>
	getGridShapeBounds(gridShapeSideCount.value, currentTemplateGridShapeVariant.value),
);
const gridShapeScales = computed(() => {
	const scaleX =
		currentGridShapeWidthInches.value === null
			? gridAreaWidthPx.value / (gridColumnCount.value * gridShapeBounds.value.width)
			: convertToPixels(currentGridShapeWidthInches.value, "in") /
				gridShapeBounds.value.width;
	const scaleY =
		currentGridShapeHeightInches.value === null
			? gridAreaHeightPx.value / (gridRowCount.value * gridShapeBounds.value.height)
			: convertToPixels(currentGridShapeHeightInches.value, "in") /
				gridShapeBounds.value.height;
	if (gridShapeSideCount.value <= 4) {
		return { x: scaleX, y: scaleY };
	}
	const uniformScale = Math.min(scaleX, scaleY);
	return { x: uniformScale, y: uniformScale };
});
const gridShapeScaleX = computed(() => gridShapeScales.value.x);
const gridShapeScaleY = computed(() => gridShapeScales.value.y);
const gridShapeCellWidth = computed(() => gridShapeBounds.value.width * gridShapeScaleX.value);
const gridShapeCellHeight = computed(() => gridShapeBounds.value.height * gridShapeScaleY.value);
const gridPatternCellWidth = computed(() => gridShapeCellWidth.value);
const gridPatternCellHeight = computed(() => gridShapeCellHeight.value);
const gridRenderedColumnCount = computed(() =>
	Math.min(
		gridColumnCount.value,
		Math.floor((gridAreaWidthPx.value + 1e-6) / gridPatternCellWidth.value),
	),
);
const gridRenderedRowCount = computed(() =>
	Math.min(
		gridRowCount.value,
		Math.floor((gridAreaHeightPx.value + 1e-6) / gridPatternCellHeight.value),
	),
);
const gridRenderedWidthPx = computed(
	() => gridPatternCellWidth.value * gridRenderedColumnCount.value,
);
const gridRenderedHeightPx = computed(
	() => gridPatternCellHeight.value * gridRenderedRowCount.value,
);
const gridRenderedRowAdditions = computed(() =>
	gridRowShapeAdditions.value
		.filter(
			(entry) =>
				Number.isInteger(entry.row) &&
				entry.row >= 0 &&
				entry.row < gridRenderedRowCount.value &&
				Array.isArray(entry.shapes) &&
				entry.shapes.length > 0,
		),
);
const gridRenderedColumnAdditions = computed(() =>
	gridColumnShapeAdditions.value
		.filter(
			(entry) =>
				Number.isInteger(entry.column) &&
				entry.column >= 0 &&
				entry.column < gridRenderedColumnCount.value &&
				Array.isArray(entry.shapes) &&
				entry.shapes.length > 0,
		),
);
const hasMixedGridAdditions = computed(
	() => gridRenderedRowAdditions.value.length > 0 && gridRenderedColumnAdditions.value.length > 0,
);
/** Mixed grids share rectangular slots; trailing cells fill unused space. */
const gridMixedCellSize = computed(() => ({
	width:
		gridRenderedWidthPx.value /
		(gridRenderedColumnCount.value +
			Math.max(0, ...gridRenderedRowAdditions.value.map((entry) => entry.shapes.length))),
	height:
		gridRenderedHeightPx.value /
		(gridRenderedRowCount.value +
			Math.max(0, ...gridRenderedColumnAdditions.value.map((entry) => entry.shapes.length))),
}));
const gridRowAdditionLayouts = computed(() =>
	gridRenderedRowAdditions.value.map((entry) => {
		const cellWidth = hasMixedGridAdditions.value
			? gridMixedCellSize.value.width
			: gridRenderedWidthPx.value / (gridRenderedColumnCount.value + entry.shapes.length);
		const cellHeight = hasMixedGridAdditions.value
			? gridMixedCellSize.value.height
			: gridPatternCellHeight.value;
		const y = entry.row * cellHeight;
		const height =
			hasMixedGridAdditions.value && entry.row === gridRenderedRowCount.value - 1
				? gridRenderedHeightPx.value - y
				: cellHeight;
		return {
			row: entry.row,
			cellWidth,
			y,
			height,
			shapes: entry.shapes.map((shape, index) => {
				const column = gridRenderedColumnCount.value + index;
				const x = column * cellWidth;
				return {
					...shape,
					row: entry.row,
					column,
					isAdded: true,
					isPacked: true,
					x,
					y,
					width:
						hasMixedGridAdditions.value && index === entry.shapes.length - 1
							? gridRenderedWidthPx.value - x
							: cellWidth,
					height,
					key: `addition-${shape.id}`,
					color: getGridHighlightColor(entry.row, column),
				};
			}),
		};
	}),
);
const gridColumnAdditionLayouts = computed(() =>
	gridRenderedColumnAdditions.value.map((entry) => {
		const cellWidth = hasMixedGridAdditions.value
			? gridMixedCellSize.value.width
			: gridPatternCellWidth.value;
		const cellHeight = hasMixedGridAdditions.value
			? gridMixedCellSize.value.height
			: gridRenderedHeightPx.value / (gridRenderedRowCount.value + entry.shapes.length);
		const x = entry.column * cellWidth;
		// Last-row additions own the bottom-right space when both tracks extend.
		const width =
			hasMixedGridAdditions.value &&
			entry.column === gridRenderedColumnCount.value - 1 &&
			!gridRenderedRowAdditions.value.some((layout) => layout.row === gridRenderedRowCount.value - 1)
				? gridRenderedWidthPx.value - x
				: cellWidth;
		return {
			column: entry.column,
			cellHeight,
			x,
			width,
			shapes: entry.shapes.map((shape, index) => {
				const row = gridRenderedRowCount.value + index;
				const y = row * cellHeight;
				return {
					...shape,
					row,
					column: entry.column,
					isAdded: true,
					isPacked: true,
					x,
					y,
					width,
					height:
						hasMixedGridAdditions.value && index === entry.shapes.length - 1
							? gridRenderedHeightPx.value - y
							: cellHeight,
					key: `addition-${shape.id}`,
					color: getGridHighlightColor(row, entry.column),
				};
			}),
		};
	}),
);
const gridRenderedContentWidthPx = computed(() => gridRenderedWidthPx.value);
const gridRenderedContentHeightPx = computed(() => gridRenderedHeightPx.value);
const gridPackedBaseCells = computed(() => {
	if (hasMixedGridAdditions.value) {
		return Array.from({ length: gridRenderedRowCount.value }, (_, row) =>
			Array.from({ length: gridRenderedColumnCount.value }, (_, column) =>
				createBaseGridShapeCell(row, column),
			),
		).flat();
	}
	const cells = new Map();
	for (const layout of gridRowAdditionLayouts.value) {
		for (let column = 0; column < gridRenderedColumnCount.value; column += 1) {
			const cell = createBaseGridShapeCell(layout.row, column);
			cells.set(cell.key, cell);
		}
	}
	for (const layout of gridColumnAdditionLayouts.value) {
		for (let row = 0; row < gridRenderedRowCount.value; row += 1) {
			const cell = createBaseGridShapeCell(row, layout.column);
			cells.set(cell.key, cell);
		}
	}
	return [...cells.values()];
});
const gridPackedCells = computed(() =>
	gridPackedBaseCells.value.concat(
		gridRowAdditionLayouts.value.flatMap((layout) => layout.shapes),
		gridColumnAdditionLayouts.value.flatMap((layout) => layout.shapes),
	),
);
/** Share fitted cell boxes between shape borders, masking, and hit-testing. */
function getGridPackedCellPoints(cell, outlineOnly = false) {
	if (!outlineOnly) {
		return getGridShapeCellPolygonPoints(
			cell.sides,
			cell.variant,
			cell.width,
			cell.height,
			cell.x,
			cell.y,
		);
	}
	return [
		[cell.x, cell.y],
		[cell.x + cell.width, cell.y],
		[cell.x + cell.width, cell.y + cell.height],
		[cell.x, cell.y + cell.height],
	]
		.map(([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`)
		.join(" ");
}
const gridRenderedOffsetX = computed(() => {
	const remainingWidth = Math.max(0, gridAreaWidthPx.value - gridRenderedContentWidthPx.value);
	let alignmentOffsetX = 0;
	if (["right", "bottom-right", "top-right"].includes(selectedGridAlignment.value)) {
		alignmentOffsetX = remainingWidth;
	} else if (["center", "bottom", "top"].includes(selectedGridAlignment.value)) {
		alignmentOffsetX = remainingWidth / 2;
	}
	return alignmentOffsetX + gridNudgeX.value;
});
const gridRenderedOffsetY = computed(() => {
	const remainingHeight = Math.max(0, gridAreaHeightPx.value - gridRenderedContentHeightPx.value);
	let alignmentOffsetY = 0;
	if (selectedGridAlignment.value === "center") {
		alignmentOffsetY = remainingHeight / 2;
	} else if (["bottom", "bottom-left", "bottom-right"].includes(selectedGridAlignment.value)) {
		alignmentOffsetY = remainingHeight;
	}
	return alignmentOffsetY + gridNudgeY.value;
});
const gridShapeOriginX = computed(() => -gridShapeBounds.value.minX * gridShapeScaleX.value);
const gridShapeOriginY = computed(() => -gridShapeBounds.value.minY * gridShapeScaleY.value);
function getGridShapePolygonPoints(offsetX = 0, offsetY = 0) {
	return gridShapeUnitVertices.value
		.map(
			({ x, y }) =>
				`${(gridShapeOriginX.value + x * gridShapeScaleX.value + offsetX).toFixed(4)},${(
					gridShapeOriginY.value +
					y * gridShapeScaleY.value +
					offsetY
				).toFixed(4)}`,
		)
		.join(" ");
}
function getGridShapeCellPolygonPoints(sides, variant, width, height, offsetX = 0, offsetY = 0) {
	const bounds = getGridShapeBounds(sides, variant);
	const uniformScale = sides > 4 ? Math.min(width / bounds.width, height / bounds.height) : null;
	const scaleX = uniformScale ?? width / bounds.width;
	const scaleY = uniformScale ?? height / bounds.height;
	const shapeOffsetX = offsetX + (sides > 4 ? (width - bounds.width * scaleX) / 2 : 0);
	const shapeOffsetY = offsetY + (sides > 4 ? (height - bounds.height * scaleY) / 2 : 0);
	return getGridShapeUnitVertices(sides, variant)
		.map(
			({ x, y }) =>
				`${(shapeOffsetX + (x - bounds.minX) * scaleX).toFixed(4)},${(
					shapeOffsetY +
					(y - bounds.minY) * scaleY
				).toFixed(4)}`,
		)
		.join(" ");
}
function createBaseGridShapeCell(row, column) {
	const rowLayout = gridRowAdditionLayouts.value.find((layout) => layout.row === row);
	const columnLayout = gridColumnAdditionLayouts.value.find((layout) => layout.column === column);
	const cellWidth = hasMixedGridAdditions.value
		? gridMixedCellSize.value.width
		: rowLayout?.cellWidth ?? gridPatternCellWidth.value;
	const cellHeight = hasMixedGridAdditions.value
		? gridMixedCellSize.value.height
		: columnLayout?.cellHeight ?? gridPatternCellHeight.value;
	const x = column * cellWidth;
	const y = row * cellHeight;
	const width =
		hasMixedGridAdditions.value && column === gridRenderedColumnCount.value - 1 && !rowLayout
			? gridRenderedWidthPx.value - x
			: cellWidth;
	const height =
		hasMixedGridAdditions.value && row === gridRenderedRowCount.value - 1 && !columnLayout
			? gridRenderedHeightPx.value - y
			: cellHeight;
	return {
		key: `base-${row}-${column}`,
		row,
		column,
		sides: gridShapeSideCount.value,
		variant: currentTemplateGridShapeVariant.value,
		x,
		y,
		width,
		height,
		isAdded: false,
		isPacked: hasMixedGridAdditions.value || Boolean(rowLayout || columnLayout),
	};
}
function getGridShapeCellAtPoint(x, y) {
	const packedCell = gridPackedCells.value.find((cell) =>
		isGridShapePointInsideCell(cell, x, y),
	);
	if (packedCell) {
		return packedCell;
	}
	const row = Math.floor(y / gridPatternCellHeight.value);
	const column = Math.floor(x / gridPatternCellWidth.value);
	if (
		row >= 0 &&
		row < gridRenderedRowCount.value &&
		column >= 0 &&
		column < gridRenderedColumnCount.value
	) {
		const cell = createBaseGridShapeCell(row, column);
		return cell.isPacked ? null : cell;
	}
	return null;
}
function getGridShapeCellByKey(key) {
	const addedShape = gridRowAdditionLayouts.value
		.flatMap((layout) => layout.shapes)
		.concat(gridColumnAdditionLayouts.value.flatMap((layout) => layout.shapes))
		.find((cell) => cell.key === key);
	if (addedShape) {
		return addedShape;
	}
	const match = /^base-(\d+)-(\d+)$/.exec(key);
	if (!match) {
		return null;
	}
	const row = Number.parseInt(match[1], 10);
	const column = Number.parseInt(match[2], 10);
	if (
		row < 0 ||
		row >= gridRenderedRowCount.value ||
		column < 0 ||
		column >= gridRenderedColumnCount.value
	) {
		return null;
	}
	return createBaseGridShapeCell(row, column);
}
function isGridShapePointInsideCell(cell, x, y) {
	if (cell.isPacked && cell.sides !== 1) {
		const vertices = getGridPackedCellPoints(cell).split(" ").map((point) => {
			const [vertexX, vertexY] = point.split(",").map(Number);
			return { x: vertexX, y: vertexY };
		});
		return isGridPointInsidePolygon({ x, y }, vertices);
	}
	const localX = (x - cell.x) / cell.width;
	const localY = (y - cell.y) / cell.height;
	if (cell.sides === 1) {
		const distanceX = (localX - 0.5) * 2;
		const distanceY = (localY - 0.5) * 2;
		return distanceX * distanceX + distanceY * distanceY <= 1;
	}
	const bounds = getGridShapeBounds(cell.sides, cell.variant);
	const point = {
		x: bounds.minX + localX * bounds.width,
		y: bounds.minY + localY * bounds.height,
	};
	const vertices = getGridShapeUnitVertices(cell.sides, cell.variant);
	return isGridPointInsidePolygon(point, vertices);
}
function isGridPointInsidePolygon(point, vertices) {
	let isInside = false;
	for (
		let index = 0, previousIndex = vertices.length - 1;
		index < vertices.length;
		previousIndex = index++
	) {
		const current = vertices[index];
		const previous = vertices[previousIndex];
		const crossesEdge =
			current.y > point.y !== previous.y > point.y &&
			point.x <
				((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) +
					current.x;
		if (crossesEdge) {
			isInside = !isInside;
		}
	}
	return isInside;
}
function handleGridShapeClick(event) {
	if (!isShapeRemovalHighlightActive.value && !isShapeAdditionHighlightActive.value) {
		return;
	}
	const svg = event.currentTarget;
	const screenMatrix = svg.getScreenCTM();
	if (!screenMatrix) {
		return;
	}
	const svgPoint = svg.createSVGPoint();
	svgPoint.x = event.clientX;
	svgPoint.y = event.clientY;
	const point = svgPoint.matrixTransform(screenMatrix.inverse());
	const x = point.x - gridRenderedOffsetX.value;
	const y = point.y - gridRenderedOffsetY.value;
	if (
		x < 0 ||
		y < 0 ||
		x >= gridRenderedContentWidthPx.value ||
		y >= gridRenderedContentHeightPx.value
	) {
		return;
	}
	const cell = getGridShapeCellAtPoint(x, y);
	if (!cell || !isGridShapePointInsideCell(cell, x, y)) {
		return;
	}
	if (isShapeRemovalHighlightActive.value) {
		removeGridShape(cell);
	} else {
		addGridShape(cell);
	}
}
const gridRemovedShapeLayouts = computed(() =>
	removedGridShapeCells.value.map((key) => getGridShapeCellByKey(key)).filter(Boolean),
);
function getGridHighlightColor(row, column) {
	return (row + column) % 2 === 0 ? "#00ff40" : "#ffff00";
}
const gridShapeViewBox = computed(() => `0 0 ${gridAreaWidthPx.value} ${gridAreaHeightPx.value}`);
const gridShapePolygonPoints = computed(() => getGridShapePolygonPoints());
const allSidesMarginValue = computed(() =>
	marginFields.every((field) => marginValues[field] === marginValues.top) ? marginValues.top : "",
);

const printPreviewPaperRef = ref(null);
const printPreviewPaperEditorRef = ref(null);
watch(
	printPreviewPaperEditorRef,
	(editor) => {
		if (paperEditorMutationObserver) {
			paperEditorMutationObserver.disconnect();
			paperEditorMutationObserver = null;
		}
		if (!editor) {
			return;
		}
		paperEditorMutationObserver = new MutationObserver(() => {
			paperEditorMutationRevision.value += 1;
		});
		paperEditorMutationObserver.observe(editor, {
			attributes: true,
			characterData: true,
			childList: true,
			subtree: true,
		});
	},
	{ flush: "post" },
);
const isTemplateNamePromptOpen = ref(false);
const templateNameInput = ref("");
const templateNameInputRef = ref(null);
const isNavigationSaveOpen = ref(false);
const navigationSaveName = ref("");
const navigationSaveEntryId = ref(null);
const navigationSaveNameInputRef = ref(null);
const navigationSaveError = ref("");
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

function toggleRemoveMode() {
	isRemoveMode.value = !isRemoveMode.value;
}

function handleSavedEntryClick(entry) {
	if (isRemoveMode.value) {
		selectedSavedEntryForRemoval.value = entry;
		removeConfirmationError.value = "";
		isRemoveConfirmationOpen.value = true;
		return;
	}

	return loadSavedTemplate(entry);
}

function cancelSavedEntryRemoval() {
	isRemoveConfirmationOpen.value = false;
	selectedSavedEntryForRemoval.value = null;
	removeConfirmationError.value = "";
}

function keepSavedEntry() {
	const dialog = removeConfirmationDialogRef.value;
	if (dialog?.open) {
		dialog.close();
	} else {
		cancelSavedEntryRemoval();
	}
}

function confirmSavedEntryRemoval() {
	const selectedEntry = selectedSavedEntryForRemoval.value;
	if (!selectedEntry) {
		removeConfirmationError.value = "The saved item could not be identified. Please try again.";
		return;
	}

	const selectedEntryIndex = savedTemplates.value.findIndex(
		(entry) => entry.id === selectedEntry.id,
	);
	if (selectedEntryIndex === -1) {
		removeConfirmationError.value = "The saved item is no longer available.";
		return;
	}

	const nextEntries = [...savedTemplates.value];
	nextEntries.splice(selectedEntryIndex, 1);
	if (!saveSavedTemplates(nextEntries)) {
		removeConfirmationError.value = "The saved item could not be removed. Please try again.";
		return;
	}

	savedTemplates.value = nextEntries;
	const dialog = removeConfirmationDialogRef.value;
	if (dialog?.open) {
		dialog.close();
	} else {
		cancelSavedEntryRemoval();
	}
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
		<template v-if="!isTextEditorOpen">
			<nav
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
				<button
					id="parent-games-tab"
					class="games-tab"
					type="button"
					name="games-tab"
					data-button-name="games-tab"
					@click="toggleGamesSidebar"
				>
					Games
				</button>
			</nav>
			<aside
				v-if="isGamesSidebarOpen"
				id="games-sidebar-panel"
				class="games-sidebar-panel"
				:class="{ 'games-sidebar-panel--compact': activeGamesButton }"
				aria-label="Games sidebar"
				title="Games sidebar"
			>
				<button
					id="games-sidebar-math-button"
					class="games-sidebar-button games-sidebar-button--math"
					:class="{ 'games-sidebar-button--depressed': activeGamesButton === 'math' }"
					type="button"
					name="math"
					data-button-name="math"
					:aria-pressed="activeGamesButton === 'math'"
					@click="toggleGamesButton('math')"
				>
					Math
				</button>
				<button
					id="games-sidebar-language-arts-button"
					class="games-sidebar-button games-sidebar-button--language-arts"
					:class="{
						'games-sidebar-button--depressed': activeGamesButton === 'language-arts',
					}"
					type="button"
					name="language-arts"
					data-button-name="language-arts"
					:aria-pressed="activeGamesButton === 'language-arts'"
					@click="toggleGamesButton('language-arts')"
				>
					Language Arts
				</button>
				<button
					id="games-sidebar-social-studies-button"
					class="games-sidebar-button games-sidebar-button--social-studies"
					:class="{
						'games-sidebar-button--depressed': activeGamesButton === 'social-studies',
					}"
					type="button"
					name="social-studies"
					data-button-name="social-studies"
					:aria-pressed="activeGamesButton === 'social-studies'"
					@click="toggleGamesButton('social-studies')"
				>
					Social Studies
				</button>
				<button
					id="games-sidebar-science-button"
					class="games-sidebar-button games-sidebar-button--science"
					:class="{ 'games-sidebar-button--depressed': activeGamesButton === 'science' }"
					type="button"
					name="science"
					data-button-name="science"
					:aria-pressed="activeGamesButton === 'science'"
					@click="toggleGamesButton('science')"
				>
					Science
				</button>
				<button
					id="games-sidebar-art-button"
					class="games-sidebar-button games-sidebar-button--art"
					:class="{ 'games-sidebar-button--depressed': activeGamesButton === 'art' }"
					type="button"
					name="art"
					data-button-name="art"
					:aria-pressed="activeGamesButton === 'art'"
					@click="toggleGamesButton('art')"
				>
					Art
				</button>
			</aside>
			<MathGamesView v-if="isGamesSidebarOpen && activeGamesButton === 'math'" />
		</template>
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
					v-if="isDocumentDirty || isNavigationSaveOpen"
					id="text-editor-document-save-button"
					class="text-editor-navigation-tools-button text-editor-navigation-save-button"
					type="button"
					name="text-editor-document-save-button"
					data-button-name="text-editor-document-save-button"
					:aria-expanded="isNavigationSaveOpen"
					@click="toggleNavigationSave"
				>
					Save
				</button>
				<label
					v-if="isNavigationSaveOpen"
					class="text-editor-navigation-save-name"
					for="text-editor-document-save-name-input"
				>
					<span>{{ isShellMode ? "Shell Name" : "Template Name" }}</span>
					<input
						id="text-editor-document-save-name-input"
						ref="navigationSaveNameInputRef"
						class="text-editor-navigation-save-name-input"
						type="text"
						maxlength="60"
						:value="navigationSaveName"
						@input="handleNavigationSaveInput"
						@keydown.enter.prevent="finishNavigationSave"
						@keydown.esc.prevent="finishNavigationSave"
					/>
				</label>
				<span
					v-if="isNavigationSaveOpen && navigationSaveError"
					class="text-editor-navigation-save-error"
					role="alert"
				>
					{{ navigationSaveError }}
				</span>
				<button
					id="text-editor-print-button"
					class="text-editor-print-button"
					type="button"
					name="text-editor-print-button"
					data-button-name="text-editor-print-button"
					@click="handlePrintSelectedPaper"
				>
					Print
				</button>
				<button
					v-if="!isTextEditorWorkflowScreen"
					id="text-editor-home-button"
					class="text-editor-home-button navigation-home-button"
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
					class="text-editor-workflow-home-button navigation-home-button"
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
					class="parent-screen-back-button navigation-back-button"
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
					class="text-editor-workflow-back-button navigation-back-button"
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
					:aria-pressed="isSavedShellsMenuOpen"
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
					:aria-pressed="!isSavedShellsMenuOpen"
					@click="selectSavedTemplates"
				>
					Load Templates
				</button>
				<button
					id="text-editor-load-menu-remove-button"
					class="text-editor-load-menu-templates-button text-editor-load-menu-remove-button"
					type="button"
					name="text-editor-load-menu-remove-button"
					data-button-name="text-editor-load-menu-remove-button"
					:aria-pressed="isRemoveMode"
					@click="toggleRemoveMode"
				>
					Remove
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
						:class="{ 'text-editor-saved-item--remove-mode': isRemoveMode }"
						type="button"
						:data-template-id="entry.id"
						:aria-label="entry.name"
						@click="handleSavedEntryClick(entry)"
					>
						<span class="text-editor-saved-template-date">{{
							formatSavedTemplateDate(entry.createdAt)
						}}</span>
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
						:class="{ 'text-editor-saved-item--remove-mode': isRemoveMode }"
						type="button"
						:data-shell-id="entry.id"
						:aria-label="entry.name"
						@click="handleSavedEntryClick(entry)"
					>
						<span class="text-editor-saved-template-date">{{
							formatSavedTemplateDate(entry.createdAt)
						}}</span>
						<span>{{ entry.name }}</span>
					</button>
				</ul>
				<div
					v-if="isRemoveConfirmationOpen"
					class="text-editor-remove-confirmation-overlay"
				>
					<dialog
						id="text-editor-remove-confirmation"
						ref="removeConfirmationDialogRef"
						class="text-editor-remove-confirmation"
						aria-labelledby="text-editor-remove-confirmation-message"
						:title="
							selectedSavedEntryForRemoval?.template?.isShell === true
								? 'Remove saved shell'
								: 'Remove saved template'
						"
						@close="cancelSavedEntryRemoval"
					>
						<p
							id="text-editor-remove-confirmation-message"
							class="text-editor-remove-confirmation-message"
						>
							<span>
								Are You Sure You Want to Delete this
								{{ selectedSavedEntryForRemoval?.template?.isShell === true ? "Shell" : "Template" }}
							</span>
							<span>This is Permanent and Cannot be Undone</span>
						</p>
						<p
							v-if="removeConfirmationError"
							class="text-editor-remove-confirmation-error"
							role="alert"
						>
							{{ removeConfirmationError }}
						</p>
						<div class="text-editor-remove-confirmation-actions">
							<button
								id="text-editor-remove-confirmation-remove-button"
								class="text-editor-remove-confirmation-remove-button"
								type="button"
								@click="confirmSavedEntryRemoval"
							>
								Remove
							</button>
							<button
								id="text-editor-remove-confirmation-keep-button"
								class="text-editor-remove-confirmation-keep-button"
								type="button"
								@click="keepSavedEntry"
							>
								Keep
							</button>
						</div>
					</dialog>
				</div>
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
			<div v-if="isLeaveUnsavedPromptOpen" class="text-editor-unsaved-confirmation-overlay">
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
						:data-grid-applied="isGridApplied ? 'true' : 'false'"
						:data-grid-printable="isGridPrintable ? 'true' : 'false'"
						:data-grid-rows="appliedGridConfiguration?.rows"
						:data-grid-columns="appliedGridConfiguration?.columns"
						:data-grid-sides="appliedGridConfiguration?.sides"
						:data-grid-shape-variant="
							isGridApplied ? currentTemplateGridShapeVariant : undefined
						"
						:data-grid-apply-to-margins="appliedGridConfiguration?.applyToMargins"
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
							<span
								class="print-preview-margin-guide print-preview-margin-guide--top"
							/>
							<span
								class="print-preview-margin-guide print-preview-margin-guide--bottom"
							/>
							<span
								class="print-preview-margin-guide print-preview-margin-guide--left"
							/>
							<span
								class="print-preview-margin-guide print-preview-margin-guide--right"
							/>
						</div>
						<svg
							v-if="isGridApplied"
							id="print-preview-grid"
							class="print-preview-grid"
							:data-grid-rows="gridRowCount"
							:data-grid-columns="gridColumnCount"
							:data-grid-rendered-rows="gridRenderedRowCount"
							:data-grid-rendered-columns="gridRenderedColumnCount"
							:data-grid-content-width="gridRenderedContentWidthPx"
							:data-grid-content-height="gridRenderedContentHeightPx"
							:data-grid-sides="gridShapeSideCount"
							:data-grid-shape-variant="currentTemplateGridShapeVariant"
							:viewBox="gridShapeViewBox"
							preserveAspectRatio="none"
							:aria-hidden="!isGridShapeInteractionActive"
							:class="{
								'print-preview-grid--shape-interaction-active':
									isGridShapeInteractionActive,
							}"
							@click="handleGridShapeClick"
						>
							<defs>
								<pattern
									id="print-preview-grid-shape-pattern"
									:width="gridPatternCellWidth"
									:height="gridPatternCellHeight"
									patternUnits="userSpaceOnUse"
									patternContentUnits="userSpaceOnUse"
								>
									<ellipse
										v-if="gridShapeSideCount === 1"
										:cx="gridShapeOriginX"
										:cy="gridShapeOriginY"
										:rx="gridShapeCellWidth / 2"
										:ry="gridShapeCellHeight / 2"
										fill="none"
										stroke="#000000"
										stroke-width="2"
									/>
									<polygon
										v-else
										:points="gridShapePolygonPoints"
										fill="none"
										stroke="#000000"
										stroke-width="2"
									/>
								</pattern>
								<pattern
									v-if="
										isShapeRemovalHighlightActive ||
											isShapeAdditionHighlightActive ||
											isShapeSwapHighlightActive
									"
									id="print-preview-grid-removal-pattern"
									:width="gridPatternCellWidth * 2"
									:height="gridPatternCellHeight * 2"
									patternUnits="userSpaceOnUse"
									patternContentUnits="userSpaceOnUse"
								>
									<template
										v-for="cell in gridSingleShapeHighlightPatternCells"
										:key="`${cell.row}-${cell.column}`"
									>
										<ellipse
											v-if="gridShapeSideCount === 1"
											:data-grid-highlight-row="cell.row"
											:data-grid-highlight-column="cell.column"
											:cx="
												gridShapeOriginX +
													cell.column * gridPatternCellWidth
											"
											:cy="
												gridShapeOriginY + cell.row * gridPatternCellHeight
											"
											:rx="gridShapeCellWidth / 2"
											:ry="gridShapeCellHeight / 2"
											:fill="cell.color"
											stroke="#000000"
											stroke-width="2"
										/>
										<polygon
											v-else
											:data-grid-highlight-row="cell.row"
											:data-grid-highlight-column="cell.column"
											:points="
												getGridShapePolygonPoints(
													cell.column * gridPatternCellWidth,
													cell.row * gridPatternCellHeight,
												)
											"
											:fill="cell.color"
											stroke="#000000"
											stroke-width="2"
										/>
									</template>
								</pattern>
								<mask
									v-if="gridPackedCells.length"
									id="print-preview-grid-packed-mask"
									maskUnits="userSpaceOnUse"
									x="0"
									y="0"
									:width="gridRenderedWidthPx"
									:height="gridRenderedHeightPx"
								>
									<rect
										:width="gridRenderedWidthPx"
										:height="gridRenderedHeightPx"
										fill="#ffffff"
									/>
									<polygon
										v-for="cell in gridPackedCells"
										:key="cell.key"
										:points="getGridPackedCellPoints(cell, true)"
										fill="#000000"
									/>
								</mask>
							</defs>
							<g
								:transform="`translate(${gridRenderedOffsetX} ${gridRenderedOffsetY})`"
							>
								<rect
									data-grid-shape-area
									:width="gridRenderedWidthPx"
									:height="gridRenderedHeightPx"
									:data-grid-removal-highlight="isShapeRemovalHighlightActive"
									:data-grid-addition-highlight="isShapeAdditionHighlightActive"
									:data-grid-swap-highlight="isShapeSwapHighlightActive"
									:mask="
										gridPackedCells.length
											? 'url(#print-preview-grid-packed-mask)'
											: undefined
									"
									:fill="
										isShapeRemovalHighlightActive ||
											isShapeAdditionHighlightActive ||
											isShapeSwapHighlightActive
											? 'url(#print-preview-grid-removal-pattern)'
											: 'url(#print-preview-grid-shape-pattern)'
									"
								/>
								<template v-for="cell in gridPackedBaseCells" :key="cell.key">
									<ellipse
										v-if="cell.sides === 1"
										:data-grid-packed-base="cell.key"
										:cx="cell.x + cell.width / 2"
										:cy="cell.y + cell.height / 2"
										:rx="cell.width / 2"
										:ry="cell.height / 2"
										:fill="
											isGridShapeCellRemoved(cell)
												? '#ffffff'
												: isGridShapeHighlightActive
													? getGridHighlightColor(cell.row, cell.column)
													: 'none'
										"
										stroke="#000000"
										stroke-width="2"
									/>
									<polygon
										v-else
										:data-grid-packed-base="cell.key"
										:points="getGridPackedCellPoints(cell)"
										:fill="
											isGridShapeCellRemoved(cell)
												? '#ffffff'
												: isGridShapeHighlightActive
													? getGridHighlightColor(cell.row, cell.column)
													: 'none'
										"
										stroke="#000000"
										stroke-width="2"
									/>
								</template>
								<template
									v-for="layout in gridRowAdditionLayouts"
									:key="`row-${layout.row}`"
								>
									<rect
										:data-grid-row-addition="layout.row"
										:data-grid-addition-cell-width="layout.cellWidth"
										:x="0"
										:y="layout.y"
										:width="gridRenderedContentWidthPx"
										:height="layout.height"
										fill="none"
									/>
									<template v-for="shape in layout.shapes" :key="shape.key">
										<ellipse
											v-if="shape.sides === 1"
											data-grid-added-shape="row"
											:data-grid-added-row="shape.row"
											:data-grid-added-sides="shape.sides"
											:cx="shape.x + shape.width / 2"
											:cy="shape.y + shape.height / 2"
											:rx="shape.width / 2"
											:ry="shape.height / 2"
											:fill="
												isGridShapeCellRemoved(shape)
													? '#ffffff'
													: isGridShapeHighlightActive
														? shape.color
														: 'none'
											"
											stroke="#000000"
											stroke-width="2"
										/>
										<polygon
											v-else
											data-grid-added-shape="row"
											:data-grid-added-row="shape.row"
											:data-grid-added-sides="shape.sides"
											:points="getGridPackedCellPoints(shape)"
											:fill="
												isGridShapeCellRemoved(shape)
													? '#ffffff'
													: isGridShapeHighlightActive
														? shape.color
														: 'none'
											"
											stroke="#000000"
											stroke-width="2"
										/>
									</template>
								</template>
								<template
									v-for="layout in gridColumnAdditionLayouts"
									:key="`column-${layout.column}`"
								>
									<rect
										:data-grid-column-addition="layout.column"
										:data-grid-addition-cell-height="layout.cellHeight"
										:x="layout.x"
										:y="0"
										:width="layout.width"
										:height="gridRenderedContentHeightPx"
										fill="none"
									/>
									<template v-for="shape in layout.shapes" :key="shape.key">
										<ellipse
											v-if="shape.sides === 1"
											data-grid-added-shape="column"
											:data-grid-added-column="shape.column"
											:data-grid-added-sides="shape.sides"
											:cx="shape.x + shape.width / 2"
											:cy="shape.y + shape.height / 2"
											:rx="shape.width / 2"
											:ry="shape.height / 2"
											:fill="
												isGridShapeCellRemoved(shape)
													? '#ffffff'
													: isGridShapeHighlightActive
														? shape.color
														: 'none'
											"
											stroke="#000000"
											stroke-width="2"
										/>
										<polygon
											v-else
											data-grid-added-shape="column"
											:data-grid-added-column="shape.column"
											:data-grid-added-sides="shape.sides"
											:points="getGridPackedCellPoints(shape)"
											:fill="
												isGridShapeCellRemoved(shape)
													? '#ffffff'
													: isGridShapeHighlightActive
														? shape.color
														: 'none'
											"
											stroke="#000000"
											stroke-width="2"
										/>
									</template>
								</template>
								<template v-for="shape in gridRemovedShapeLayouts" :key="shape.key">
									<ellipse
										v-if="shape.sides === 1"
										:data-grid-removed-shape="shape.key"
										:cx="shape.x + shape.width / 2"
										:cy="shape.y + shape.height / 2"
										:rx="shape.width / 2"
										:ry="shape.height / 2"
										fill="#ffffff"
										stroke="#000000"
										stroke-width="2"
										pointer-events="none"
									/>
									<polygon
										v-else
										:data-grid-removed-shape="shape.key"
										:points="
											shape.isPacked
												? getGridPackedCellPoints(shape)
												: getGridShapeCellPolygonPoints(
													shape.sides,
													shape.variant,
													shape.width,
													shape.height,
													shape.x,
													shape.y,
												)
										"
										fill="#ffffff"
										stroke="#000000"
										stroke-width="2"
										pointer-events="none"
									/>
								</template>
								<path
									data-grid-outline
									:d="`M 1 1 H ${Math.max(1, gridRenderedWidthPx - 1)} M 1 1 V ${Math.max(1, gridRenderedHeightPx - 1)} M ${Math.max(1, gridRenderedWidthPx - 1)} 1 V ${Math.max(1, gridRenderedHeightPx - 1)}`"
									stroke="#000000"
									stroke-width="2"
									vector-effect="non-scaling-stroke"
								/>
							</g>
						</svg>
					</div>
				</div>
			</section>
			<section
				v-if="textEditorButtonStates.grid"
				id="text-editor-grid-menu"
				class="text-editor-grid-menu"
				aria-label="Grid menu"
				title="Grid menu"
			>
				<div class="grid-menu-top-control-row">
					<div class="grid-menu-control-row grid-menu-control-row--applied">
						<span id="grid-applied-label" class="grid-menu-control-label"
						>Grid Applied</span
						>
						<button
							id="grid-applied-button"
							class="grid-menu-toggle-button"
							:class="{
								'grid-menu-toggle-button--on': isGridApplied,
								'grid-menu-toggle-button--off': !isGridApplied,
							}"
							type="button"
							:aria-label="isGridApplied ? 'Grid Applied: On' : 'Grid Applied: Off'"
							:aria-pressed="isGridApplied"
							@click="toggleGridApplied"
						>
							{{ isGridApplied ? "On" : "Off" }}
						</button>
					</div>
					<div class="grid-menu-control-row grid-menu-control-row--margins">
						<span id="grid-apply-to-margins-label" class="grid-menu-control-label">
							Apply to Margins
						</span>
						<button
							id="grid-apply-to-margins-button"
							class="grid-menu-toggle-button"
							:class="
								isApplyToMarginsOn
									? 'grid-menu-toggle-button--on'
									: 'grid-menu-toggle-button--off'
							"
							type="button"
							:aria-pressed="isApplyToMarginsOn"
							@click="toggleApplyToMargins"
						>
							{{ isApplyToMarginsOn ? "On" : "Off" }}
						</button>
					</div>
				</div>
				<div class="grid-menu-controls-layout">
					<div id="grid-menu-alignment-heading" class="grid-menu-alignment-heading">
						Alignment
					</div>
					<div id="grid-menu-shapes-heading" class="grid-menu-shapes-heading">
						Shapes
					</div>
					<div class="grid-menu-alignment-controls">
						<div class="grid-menu-alignment-controls-inner">
								<details id="grid-menu-alignment-dropdown">
									<summary class="grid-menu-control-label">
										Full Grid Alignment
									</summary>
									<fieldset
										id="grid-menu-alignment-buttons"
										class="grid-menu-alignment-buttons"
										aria-label="Grid alignment"
									>
										<div class="grid-menu-alignment-row">
											<button
												id="grid-alignment-left-button"
												class="grid-menu-toggle-button grid-menu-alignment-button"
												:class="{
													'grid-menu-toggle-button--off':
														selectedGridAlignment !== 'left',
													'grid-menu-toggle-button--on':
														selectedGridAlignment === 'left',
													'grid-menu-alignment-button--depressed':
														selectedGridAlignment === 'left',
												}"
												type="button"
												:aria-pressed="selectedGridAlignment === 'left'"
												@click="toggleGridAlignment('left')"
											>
												Left
											</button>
											<button
												id="grid-alignment-center-button"
												class="grid-menu-toggle-button grid-menu-alignment-button"
												:class="{
													'grid-menu-toggle-button--off':
														selectedGridAlignment !== 'center',
													'grid-menu-toggle-button--on':
														selectedGridAlignment === 'center',
													'grid-menu-alignment-button--depressed':
														selectedGridAlignment === 'center',
												}"
												type="button"
												:aria-pressed="selectedGridAlignment === 'center'"
												@click="toggleGridAlignment('center')"
											>
												Center
											</button>
											<button
												id="grid-alignment-right-button"
												class="grid-menu-toggle-button grid-menu-alignment-button"
												:class="{
													'grid-menu-toggle-button--off':
														selectedGridAlignment !== 'right',
													'grid-menu-toggle-button--on':
														selectedGridAlignment === 'right',
													'grid-menu-alignment-button--depressed':
														selectedGridAlignment === 'right',
												}"
												type="button"
												:aria-pressed="selectedGridAlignment === 'right'"
												@click="toggleGridAlignment('right')"
											>
												Right
											</button>
										</div>
										<div class="grid-menu-alignment-row">
											<button
												id="grid-alignment-top-button"
												class="grid-menu-toggle-button grid-menu-alignment-button"
												:class="{
													'grid-menu-toggle-button--off':
														selectedGridAlignment !== 'top',
													'grid-menu-toggle-button--on':
														selectedGridAlignment === 'top',
													'grid-menu-alignment-button--depressed':
														selectedGridAlignment === 'top',
												}"
												type="button"
												:aria-pressed="selectedGridAlignment === 'top'"
												@click="toggleGridAlignment('top')"
											>
												Top
											</button>
											<button
												id="grid-alignment-top-left-button"
												class="grid-menu-toggle-button grid-menu-alignment-button--top-left"
												:class="getGridAlignmentButtonState('top-left')"
												type="button"
												:aria-pressed="selectedGridAlignment === 'top-left'"
												@click="toggleGridAlignment('top-left')"
											>
												Top Left
											</button>
											<button
												id="grid-alignment-top-right-button"
												class="grid-menu-toggle-button grid-menu-alignment-button--top-right"
												:class="getGridAlignmentButtonState('top-right')"
												type="button"
												:aria-pressed="
													selectedGridAlignment === 'top-right'
												"
												@click="toggleGridAlignment('top-right')"
											>
												Top Right
											</button>
										</div>
										<div class="grid-menu-alignment-row">
											<button
												id="grid-alignment-bottom-button"
												class="grid-menu-toggle-button grid-menu-alignment-button"
												:class="{
													'grid-menu-toggle-button--off':
														selectedGridAlignment !== 'bottom',
													'grid-menu-toggle-button--on':
														selectedGridAlignment === 'bottom',
													'grid-menu-alignment-button--depressed':
														selectedGridAlignment === 'bottom',
												}"
												type="button"
												:aria-pressed="selectedGridAlignment === 'bottom'"
												@click="toggleGridAlignment('bottom')"
											>
												Bottom
											</button>
											<button
												id="grid-alignment-bottom-left-button"
												class="grid-menu-toggle-button grid-menu-alignment-button--bottom-left"
												:class="getGridAlignmentButtonState('bottom-left')"
												type="button"
												:aria-pressed="
													selectedGridAlignment === 'bottom-left'
												"
												@click="toggleGridAlignment('bottom-left')"
											>
												Bottom Left
											</button>
											<button
												id="grid-alignment-bottom-right-button"
												class="grid-menu-toggle-button grid-menu-alignment-button--bottom-right"
												:class="getGridAlignmentButtonState('bottom-right')"
												type="button"
												:aria-pressed="
													selectedGridAlignment === 'bottom-right'
												"
												@click="toggleGridAlignment('bottom-right')"
											>
												Bottom Right
											</button>
										</div>
										<button
											id="grid-alignment-custom-button"
											class="grid-menu-toggle-button grid-menu-alignment-button grid-menu-alignment-custom-button grid-menu-toggle-button--off"
											type="button"
											:aria-expanded="isGridPositionCustomOpen"
											aria-controls="grid-menu-custom-position"
											@click="
												isGridPositionCustomOpen = !isGridPositionCustomOpen
											"
										>
											Custom
										</button>
										<div
											v-if="isGridPositionCustomOpen"
											id="grid-menu-custom-position"
											class="grid-menu-custom-position"
										>
											<div class="grid-menu-position-picker">
												<div
													id="grid-menu-position-heading"
													class="grid-menu-position-heading grid-menu-control-label"
												>
													Grid Position
												</div>
												<select
													id="grid-move-step"
													v-model.number="gridMoveStep"
													class="grid-menu-position-step-select"
													aria-label="Grid movement distance in pixels"
												>
													<option :value="null" disabled>Select</option>
													<option
														v-for="pixelAmount in 10"
														:key="pixelAmount"
														:value="pixelAmount"
													>
														{{ pixelAmount }}
													</option>
												</select>
												<span id="grid-move-unit" aria-hidden="true"
												>px</span
												>
											</div>
											<div
												v-if="gridMoveStep !== null"
												id="grid-menu-move-directions"
												class="grid-menu-position-controls"
												aria-labelledby="grid-menu-position-heading"
											>
												<div
													class="grid-menu-position-directions"
													role="group"
													aria-label="Move grid"
												>
													<button
														id="grid-move-up-button"
														class="grid-menu-position-button"
														type="button"
														aria-label="Move grid up"
														title="Move grid up"
														@click="nudgeGrid('up')"
													>
														Up
													</button>
													<button
														id="grid-move-down-button"
														class="grid-menu-position-button"
														type="button"
														aria-label="Move grid down"
														title="Move grid down"
														@click="nudgeGrid('down')"
													>
														Down
													</button>
													<button
														id="grid-move-left-button"
														class="grid-menu-position-button"
														type="button"
														aria-label="Move grid left"
														title="Move grid left"
														@click="nudgeGrid('left')"
													>
														Left
													</button>
													<button
														id="grid-move-right-button"
														class="grid-menu-position-button"
														type="button"
														aria-label="Move grid right"
														title="Move grid right"
														@click="nudgeGrid('right')"
													>
														Right
													</button>
												</div>
											</div>
										</div>
									</fieldset>
								</details>
								<details id="grid-menu-single-shape-alignment-dropdown">
									<summary class="grid-menu-control-label">
										Single Shape Alignment
									</summary>
									<div
										id="grid-menu-single-shape-options"
										class="grid-menu-single-shape-options"
										role="group"
										aria-label="Single shape actions"
									>
										<button
											id="grid-menu-shape-removal-button"
											class="grid-menu-single-shape-option"
											:class="{
												'grid-menu-single-shape-option--depressed':
													selectedSingleShapeAction === 'removal',
											}"
											type="button"
											:aria-pressed="selectedSingleShapeAction === 'removal'"
											@click="toggleSingleShapeAction('removal')"
										>
											<span class="grid-menu-single-shape-option-label"
											>Shape Removal</span
											>
											<span
												class="grid-menu-single-shape-indicator"
												:class="{
													'grid-menu-single-shape-indicator--on':
														selectedSingleShapeAction === 'removal',
												}"
												aria-hidden="true"
											/>
										</button>
										<div class="grid-menu-shape-addition-controls">
											<button
												id="grid-menu-shape-addition-button"
												class="grid-menu-single-shape-option"
												:class="{
													'grid-menu-single-shape-option--depressed':
														selectedSingleShapeAction === 'addition',
												}"
												type="button"
												:aria-pressed="
													selectedSingleShapeAction === 'addition'
												"
												@click="toggleSingleShapeAction('addition')"
											>
												<span class="grid-menu-single-shape-option-label"
												>Shape Addition</span
												>
												<span
													class="grid-menu-single-shape-indicator"
													:class="{
														'grid-menu-single-shape-indicator--on':
															selectedSingleShapeAction ===
															'addition',
													}"
													aria-hidden="true"
												/>
											</button>
											<div
												v-if="selectedSingleShapeAction === 'addition'"
												class="grid-menu-shape-addition-selection"
											>
												<div
													class="grid-menu-shape-addition-directions"
													role="group"
													aria-label="Shape addition direction"
												>
													<button
														id="grid-menu-shape-addition-row-button"
														class="grid-menu-shape-addition-axis-button"
														:class="{
															'grid-menu-single-shape-option--depressed':
																selectedGridShapeAdditionDirection ===
																'row',
														}"
														type="button"
														:aria-pressed="
															selectedGridShapeAdditionDirection ===
																'row'
														"
														@click="
															toggleGridShapeAdditionDirection('row')
														"
													>
														Row
													</button>
													<button
														id="grid-menu-shape-addition-column-button"
														class="grid-menu-shape-addition-axis-button"
														:class="{
															'grid-menu-single-shape-option--depressed':
																selectedGridShapeAdditionDirection ===
																'column',
														}"
														type="button"
														:aria-pressed="
															selectedGridShapeAdditionDirection ===
																'column'
														"
														@click="
															toggleGridShapeAdditionDirection(
																'column',
															)
														"
													>
														Column
													</button>
												</div>
												<select
													v-if="selectedGridShapeAdditionDirection"
													id="grid-menu-shape-addition-selection"
													v-model.number="selectedGridShapeAdditionSides"
													class="grid-menu-shape-addition-select"
													:aria-label="`Shape to add to selected ${selectedGridShapeAdditionDirection}`"
												>
													<option :value="null" disabled>
														Select a shape
													</option>
													<option
														v-for="shapeOption in gridShapeOptions"
														:key="shapeOption.sides"
														:value="shapeOption.sides"
													>
														{{ shapeOption.label }}
													</option>
												</select>
											</div>
										</div>
										<button
											id="grid-menu-shape-swap-button"
											class="grid-menu-single-shape-option"
											:class="{
												'grid-menu-single-shape-option--depressed':
													selectedSingleShapeAction === 'swap',
											}"
											type="button"
											:aria-pressed="selectedSingleShapeAction === 'swap'"
											@click="toggleSingleShapeAction('swap')"
										>
											<span class="grid-menu-single-shape-option-label"
											>Shape Swap</span
											>
											<span
												class="grid-menu-single-shape-indicator"
												:class="{
													'grid-menu-single-shape-indicator--on':
														selectedSingleShapeAction === 'swap',
												}"
												aria-hidden="true"
											/>
										</button>
										<details
											id="grid-menu-shape-manipulation-dropdown"
											class="grid-menu-shape-manipulation-dropdown"
										>
											<summary class="grid-menu-control-label">
												Shape Manipulation
											</summary>
										</details>
									</div>
								</details>
								<details id="grid-menu-dimensions-dropdown">
									<summary class="grid-menu-control-label">
										Grid Dimensions
									</summary>
									<div class="grid-menu-dimensions-content">
										<label
											class="grid-menu-control-row grid-menu-control-row--amount"
											for="grid-rows-amount"
										>
											<span
												id="grid-rows-amount-label"
												class="grid-menu-control-label"
											>
												Rows Amount
											</span>
											<input
												id="grid-rows-amount"
												class="grid-menu-amount-input"
												type="text"
												inputmode="numeric"
												pattern="[0-9]*"
												maxlength="3"
												:value="gridRowsAmount"
												@input="
													gridRowsAmount = sanitizeGridAmount(
														$event.target.value,
													)
												"
											/>
										</label>
										<label
											class="grid-menu-control-row grid-menu-control-row--amount"
											for="grid-columns-amount"
										>
											<span
												id="grid-columns-amount-label"
												class="grid-menu-control-label"
											>
												Columns Amount
											</span>
											<input
												id="grid-columns-amount"
												class="grid-menu-amount-input"
												type="text"
												inputmode="numeric"
												pattern="[0-9]*"
												maxlength="3"
												:value="gridColumnsAmount"
												@input="
													gridColumnsAmount = sanitizeGridAmount(
														$event.target.value,
													)
												"
											/>
										</label>
										<div
											id="grid-menu-size-heading"
											class="grid-menu-size-heading"
										>
											Size
										</div>
										<div
											id="grid-shape-size-row"
											class="grid-menu-size-dimensions-row"
										>
											<label
												id="grid-shape-width-label"
												class="grid-menu-size-width-label"
												for="grid-shape-width-input"
											>
												Width
											</label>
											<input
												id="grid-shape-width-input"
												class="grid-menu-size-width-input"
												type="text"
												inputmode="decimal"
												pattern="[0-9]*[.]?[0-9]*"
												maxlength="4"
												:value="gridShapeWidthInput"
												@input="updateGridShapeWidthInput"
											/>
											<span
												id="grid-shape-width-unit"
												class="grid-menu-size-width-unit"
											>inches</span
											>
											<label
												id="grid-shape-height-label"
												class="grid-menu-size-height-label"
												for="grid-shape-height-input"
											>
												Height
											</label>
											<input
												id="grid-shape-height-input"
												class="grid-menu-size-height-input"
												type="text"
												inputmode="decimal"
												pattern="[0-9]*[.]?[0-9]*"
												maxlength="4"
												:value="gridShapeHeightInput"
												@input="updateGridShapeHeightInput"
											/>
											<span
												id="grid-shape-height-unit"
												class="grid-menu-size-height-unit"
											>
												inches
											</span>
										</div>
									</div>
								</details>
						</div>
					</div>
					<div class="grid-menu-shapes-group">
					<ul
						id="grid-menu-shapes-list"
						class="grid-menu-shapes-list"
						aria-labelledby="grid-menu-shapes-heading"
					>
						<li v-for="shapeOption in gridShapeOptions" :key="shapeOption.sides">
							<button
								:id="`grid-shape-option-${shapeOption.sides}`"
								class="grid-menu-shapes-option"
								:class="{
									'grid-menu-shapes-option--selected':
										selectedGridShapeSides === shapeOption.sides,
									'grid-menu-shapes-option--even': shapeOption.sides % 2 === 0,
									'grid-menu-shapes-option--odd': shapeOption.sides % 2 !== 0,
								}"
								:data-side-count="shapeOption.sides"
								:aria-pressed="selectedGridShapeSides === shapeOption.sides"
								type="button"
								@click="selectGridShape(shapeOption)"
							>
								{{ shapeOption.label }}
							</button>
							<ul
								v-if="shapeOption.sides === 4"
								class="grid-menu-quadrilateral-variants"
								aria-label="Quadrilateral grid shapes"
							>
								<li v-for="variant in quadrilateralVariants" :key="variant.id">
									<button
										:id="`grid-quadrilateral-variant-${variant.id}`"
										class="grid-menu-shapes-option"
										:class="{
											'grid-menu-shapes-option--selected':
												selectedGridShapeSides === 4 &&
												selectedGridShapeVariant === variant.id,
											'grid-menu-shapes-option--even': true,
										}"
										:data-shape-variant="variant.id"
										:aria-pressed="
											selectedGridShapeSides === 4 &&
												selectedGridShapeVariant === variant.id
										"
										type="button"
										@click="selectGridShapeVariant(variant)"
									>
										{{ variant.label }}
									</button>
								</li>
							</ul>
						</li>
					</ul>
					</div>
				</div>
				<div id="grid-menu-lines-heading" class="grid-menu-lines-heading">Lines</div>
				<button
					id="grid-menu-printable-button"
					class="grid-menu-printable-button"
					:class="
						isGridPrintable
							? 'grid-menu-printable-button--on'
							: 'grid-menu-printable-button--off'
					"
					type="button"
					:aria-pressed="isGridPrintable"
					@click="toggleGridPrintable"
				>
					Printable
				</button>
				<dialog
					v-if="isQuadrilateralPromptOpen"
					id="grid-menu-quadrilateral-prompt"
					open
					class="grid-menu-quadrilateral-prompt"
					aria-labelledby="grid-menu-quadrilateral-prompt-message"
				>
					<p id="grid-menu-quadrilateral-prompt-message">
						Pick One of the Quadrilaterals
					</p>
					<Teleport to="body">
						<button
							id="grid-menu-quadrilateral-prompt-back-button"
							class="grid-menu-quadrilateral-prompt-back-button navigation-back-button"
							type="button"
							@click="closeQuadrilateralPrompt"
						>
							Back
						</button>
					</Teleport>
				</dialog>
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
					'text-editor-tools-panel--template': isUnsavedNewDocument && !isShellMode,
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
							<button
								id="text-editor-alignment-button"
								class="text-editor-alignment-button text-editor-fonts-button text-editor-fonts-button--light-blue"
								:class="{
									'text-editor-alignment-button--depressed': isAlignmentPanelOpen,
								}"
								type="button"
								:aria-pressed="isAlignmentPanelOpen"
								@click="toggleAlignmentPanel"
							>
								Alignment
							</button>
							<section
								v-if="isAlignmentPanelOpen"
								id="text-editor-alignment-panel"
								class="text-editor-alignment-panel"
								:class="{
									'text-editor-alignment-panel--below-size':
										isSizePanelOpen && !isMarginsPanelOpen && !isFontsPanelOpen,
									'text-editor-alignment-panel--below-margins':
										isMarginsPanelOpen && !isSizePanelOpen && !isFontsPanelOpen,
									'text-editor-alignment-panel--below-fonts':
										isFontsPanelOpen && !isSizePanelOpen && !isMarginsPanelOpen,
									'text-editor-alignment-panel--below-size-and-margins':
										isSizePanelOpen && isMarginsPanelOpen && !isFontsPanelOpen,
									'text-editor-alignment-panel--below-fonts-and-size':
										isFontsPanelOpen && isSizePanelOpen && !isMarginsPanelOpen,
									'text-editor-alignment-panel--below-fonts-and-margins':
										isFontsPanelOpen && isMarginsPanelOpen && !isSizePanelOpen,
									'text-editor-alignment-panel--below-all':
										isFontsPanelOpen && isMarginsPanelOpen && isSizePanelOpen,
								}"
								aria-label="Alignment options"
								title="Alignment options"
							>
								<button
									id="text-editor-alignment-left-button"
									class="text-editor-font-styles-button text-editor-alignment-choice-button"
									:class="{
										'text-editor-alignment-choice-button--depressed':
											globalTextAlignment === 'left',
									}"
									type="button"
									:aria-pressed="globalTextAlignment === 'left'"
									@mousedown.prevent
									@click="applyTextAlignment('left')"
								>
									Left
								</button>
								<button
									id="text-editor-alignment-center-button"
									class="text-editor-font-styles-button text-editor-alignment-choice-button"
									:class="{
										'text-editor-alignment-choice-button--depressed':
											globalTextAlignment === 'center',
									}"
									type="button"
									:aria-pressed="globalTextAlignment === 'center'"
									@mousedown.prevent
									@click="applyTextAlignment('center')"
								>
									Center
								</button>
								<button
									id="text-editor-alignment-right-button"
									class="text-editor-font-styles-button text-editor-alignment-choice-button"
									:class="{
										'text-editor-alignment-choice-button--depressed':
											globalTextAlignment === 'right',
									}"
									type="button"
									:aria-pressed="globalTextAlignment === 'right'"
									@mousedown.prevent
									@click="applyTextAlignment('right')"
								>
									Right
								</button>
							</section>
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
										'text-editor-font-styles-button--depressed':
											isStylesMenuOpen,
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
										'text-editor-font-color-button--depressed':
											isFontColorMenuOpen,
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
										'text-editor-font-size-button--depressed':
											isFontSizeMenuOpen,
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
										'text-editor-font-size-menu--below-styles':
											isStylesMenuOpen,
										'text-editor-font-size-menu--below-color':
											!isStylesMenuOpen && isFontColorMenuOpen,
										'text-editor-font-size-menu--left-of-fonts':
											!isStylesMenuOpen && !isFontColorMenuOpen,
										'text-editor-font-size-menu--lowered':
											shouldLowerNestedFontMenus,
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
										'text-editor-font-styles-menu--lowered':
											shouldLowerNestedFontMenus,
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
										'text-editor-font-color-menu--above-styles':
											isStylesMenuOpen,
										'text-editor-font-color-menu--left-of-fonts':
											!isStylesMenuOpen,
										'text-editor-font-color-menu--lowered':
											shouldLowerNestedFontMenus,
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
									<label
										class="text-editor-margin-row"
										for="text-editor-margin-top-input"
									>
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
									<label
										class="text-editor-margin-row"
										for="text-editor-margin-bottom-input"
									>
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
									<label
										class="text-editor-margin-row"
										for="text-editor-margin-left-input"
									>
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
									<label
										class="text-editor-margin-row"
										for="text-editor-margin-right-input"
									>
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
									<label
										class="text-editor-margin-row"
										for="text-editor-margin-all-sides-input"
									>
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
												'text-editor-margin-visibility-button--on':
													isMarginVisibilityOn,
												'text-editor-margin-visibility-button--off':
													!isMarginVisibilityOn,
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
			class="parent-screen-back-button-parent navigation-back-button"
			type="button"
			name="parent-screen-back-button-parent"
			data-button-name="parent-screen-back-button-parent"
			aria-label="Back to home"
			title="Back to home"
			@click="handleParentScreenBack"
		>
			Back
		</button>
	</main>
</template>

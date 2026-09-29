<script setup>
import { computed, nextTick, ref } from "vue";

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
const isWidthMenuOpen = ref(false);
const isHeightMenuOpen = ref(false);
const widthValue = ref("8");
const heightValue = ref("10");
const widthUnit = ref("px");
const heightUnit = ref("px");
const CALIBRATION_STORAGE_KEY = "ze2.textEditor.calibration";

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
const calibrationDevicePixelRatio = ref(
	Number.isFinite(savedCalibrationState?.devicePixelRatioAtCalibration)
		? savedCalibrationState.devicePixelRatioAtCalibration
		: null,
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
				devicePixelRatioAtCalibration: calibrationDevicePixelRatio.value,
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
	calibrationDevicePixelRatio.value = window.devicePixelRatio || 1;
	saveCalibrationState();
}

function handleStudentEditsOpen() {
	emit("open-student-edits");
}

function handleParentScreenClose() {
	emit("back-to-home");
}

/** Return from Text Editor to the Parent menu. */
function handleTextEditorClose() {
	isTextEditorOpen.value = false;
}

function handleTextEditorOpen() {
	isTextEditorOpen.value = true;
}

function toggleTextEditorButton(buttonName) {
	textEditorButtonStates.value[buttonName] = !textEditorButtonStates.value[buttonName];
}

function toggleEditingTools() {
	isEditingToolsOpen.value = !isEditingToolsOpen.value;
	if (!isEditingToolsOpen.value) {
		isSizePanelOpen.value = false;
		isWidthMenuOpen.value = false;
		isHeightMenuOpen.value = false;
	}
}

function toggleSizePanel() {
	isSizePanelOpen.value = !isSizePanelOpen.value;
	if (!isSizePanelOpen.value) {
		isWidthMenuOpen.value = false;
		isHeightMenuOpen.value = false;
	}
}

function toggleUnitMenu(field) {
	if (field === "width") {
		isWidthMenuOpen.value = !isWidthMenuOpen.value;
		isHeightMenuOpen.value = false;
		return;
	}

	isHeightMenuOpen.value = !isHeightMenuOpen.value;
	isWidthMenuOpen.value = false;
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

function getDimensionLabel(value, unit) {
	const amount = Number.parseFloat(value) || 0;
	if (unit === "px") {
		return `${amount}px`;
	}
	if (unit === "in") {
		return `${amount}in`;
	}
	if (unit === "cm") {
		return `${amount}cm`;
	}
	return `${amount}mm`;
}

/** Paper template dimensions in CSS px, derived from the Size menu entries. */
const paperWidthPx = computed(() => convertToPixels(widthValue.value, widthUnit.value));
const paperHeightPx = computed(() => convertToPixels(heightValue.value, heightUnit.value));

/** Scale factor that keeps an oversized paper template visible inside the preview panel. */
const paperPreviewScale = computed(() => {
	if (!paperWidthPx.value || !paperHeightPx.value) {
		return 1;
	}
	return Math.min(
		1,
		(window.innerWidth - 376) / paperWidthPx.value,
		(window.innerHeight - 48) / paperHeightPx.value,
	);
});

/** True entered dimensions, shown when the paper template is scaled down to fit. */
const paperDimensionLabel = computed(
	() =>
		`${getDimensionLabel(widthValue.value, widthUnit.value)} × ${getDimensionLabel(heightValue.value, heightUnit.value)}`,
);

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
			`${calibrationBarDragStartLeftPx + event.clientX - calibrationBarDragStartX}px`,
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
				role="navigation"
				aria-label="Text Editor navigation"
				title="Text Editor navigation"
			>
				<button
					id="text-editor-print-preview-button"
					class="text-editor-print-preview-button"
					:class="{ 'text-editor-button--depressed': textEditorButtonStates.printPreview }"
					type="button"
					name="text-editor-print-preview-button"
					data-button-name="text-editor-print-preview-button"
					:aria-pressed="textEditorButtonStates.printPreview"
					@click="toggleTextEditorButton('printPreview')"
				>
					Print Preview
				</button>
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
				aria-label="Print Preview"
			>
				<div
					id="print-preview-paper-viewport"
					class="print-preview-paper-viewport"
					data-container-name="print-preview-paper-viewport"
				>
					<div
						id="print-preview-paper"
						class="print-preview-paper"
						data-element-name="print-preview-paper"
						:style="{
							width: `${paperWidthPx}px`,
							height: `${paperHeightPx}px`,
							transform: `scale(${paperPreviewScale})`,
						}"
					>
						<p
							v-if="paperPreviewScale < 1"
							id="print-preview-paper-size-label"
							class="print-preview-paper-size-label"
						>
							{{ paperDimensionLabel }}
						</p>
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
					<option value="in">
						in
					</option>
					<option value="cm">
						cm
					</option>
					<option value="mm">
						mm
					</option>
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
				aria-label="Template options"
			>
				<button
					id="text-editor-template-saved-templates-button"
					class="text-editor-template-saved-templates-button"
					type="button"
					name="text-editor-template-saved-templates-button"
					data-button-name="text-editor-template-saved-templates-button"
				>
					Saved Templates
				</button>
				<button
					id="text-editor-template-new-button"
					class="text-editor-template-new-button"
					type="button"
					name="text-editor-template-new-button"
					data-button-name="text-editor-template-new-button"
				>
					New +
				</button>
				<div class="text-editor-size-action-row">
					<button
						id="text-editor-editing-tools-button"
						class="text-editor-editing-tools-button"
						:class="{ 'text-editor-editing-tools-button--depressed': isEditingToolsOpen }"
						type="button"
						name="text-editor-editing-tools-button"
						data-button-name="text-editor-editing-tools-button"
						:aria-pressed="isEditingToolsOpen"
						@click="toggleEditingTools"
					>
						Editing Tools
					</button>
					<div
						v-if="isEditingToolsOpen"
						class="text-editor-size-menu-row"
					>
						<div class="text-editor-size-menu-top-row">
							<button
								id="text-editor-size-menu-button"
								class="text-editor-size-menu-button"
								:class="{ 'text-editor-size-menu-button--depressed': isSizePanelOpen }"
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
								type="button"
								name="text-editor-fonts-button"
								data-button-name="text-editor-fonts-button"
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
						<div
							v-if="isSizePanelOpen"
							id="text-editor-size-panel"
							class="text-editor-size-panel"
							aria-label="Size options"
						>
													<div class="text-editor-size-row">
								<label class="text-editor-size-label" for="text-editor-size-width">Width</label>
								<input
									id="text-editor-size-width"
									v-model="widthValue"
									class="text-editor-size-input"
									type="text"
									inputmode="decimal"
									maxlength="4"
									aria-label="Width value"
								/>
								<div class="text-editor-size-unit-field text-editor-size-width-unit-field">
									<button
										id="text-editor-size-width-unit"
										class="text-editor-size-width-unit-button"
										type="button"
										name="text-editor-size-width-unit"
										data-button-name="text-editor-size-width-unit"
										aria-label="Width unit"
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
								<label class="text-editor-size-label" for="text-editor-size-height">Height</label>
								<input
									id="text-editor-size-height"
									v-model="heightValue"
									class="text-editor-size-input"
									type="text"
									inputmode="decimal"
									maxlength="4"
									aria-label="Height value"
								/>
								<div class="text-editor-size-unit-field text-editor-size-height-unit-field">
									<button
										id="text-editor-size-height-unit"
										class="text-editor-size-height-unit-button"
										type="button"
										name="text-editor-size-height-unit"
										data-button-name="text-editor-size-height-unit"
										aria-label="Height unit"
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
					<template v-else>
						{{ Math.round(calibrationBarLengthPx) }} px
					</template>
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

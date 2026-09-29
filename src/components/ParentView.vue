<script setup>
import { nextTick, ref } from "vue";

const emit = defineEmits(["open-student-edits", "back-to-home"]);
const isTextEditorOpen = ref(false);
const textEditorButtonStates = ref({
	printPreview: false,
	templates: false,
	grid: false,
	fonts: false,
	margins: false,
	calibrate: false,
});
const isSizePanelOpen = ref(false);
const isWidthMenuOpen = ref(false);
const isHeightMenuOpen = ref(false);
const widthValue = ref("8");
const heightValue = ref("10");
const widthUnit = ref("px");
const heightUnit = ref("px");
const isCalibrationBarVisible = ref(false);
const calibrationButtonRef = ref(null);
const calibrationBarFrameRef = ref(null);
const calibrationBarHeightPx = ref(500);
const calibrationBarWidthPx = ref(60);
const isCalibrationBarHorizontal = ref(false);
let calibrationBarDragMode = "";
let calibrationBarDragStartY = 0;
let calibrationBarDragStartX = 0;
let calibrationBarDragStartHeightPx = 500;
let calibrationBarDragStartWidthPx = 60;
let calibrationBarDragStartTopPx = 40;
let calibrationBarDragStartLeftPx = 160;

function toggleCalibrationBarOrientation() {
	isCalibrationBarHorizontal.value = !isCalibrationBarHorizontal.value;
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
}

/** Begin moving the calibration bar or resizing it from a fixed edge. */
function handleCalibrationBarPointerDown(mode, event) {
	calibrationBarDragMode = mode;
	calibrationBarDragStartY = event.clientY;
	calibrationBarDragStartX = event.clientX;
	calibrationBarDragStartHeightPx = calibrationBarHeightPx.value;
	calibrationBarDragStartWidthPx = calibrationBarWidthPx.value;
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
		const nextWidth = Math.max(
			1,
			calibrationBarDragMode === "top"
				? calibrationBarDragStartWidthPx - deltaX
				: calibrationBarDragStartWidthPx + deltaX,
		);
		calibrationBarWidthPx.value = nextWidth;
		frame?.style.setProperty("--calibration-bar-width", `${nextWidth}px`);
		if (calibrationBarDragMode === "top") {
			frame?.style.setProperty(
				"--calibration-bar-left",
				`${calibrationBarDragStartLeftPx + deltaX}px`,
			);
		}
		return;
	}

	const nextHeight = Math.max(
		1,
		calibrationBarDragMode === "top"
			? calibrationBarDragStartHeightPx - deltaY
			: calibrationBarDragStartHeightPx + deltaY,
	);
	calibrationBarHeightPx.value = nextHeight;
	frame?.style.setProperty("--calibration-bar-height", `${nextHeight}px`);
	if (calibrationBarDragMode === "top") {
		frame?.style.setProperty(
			"--calibration-bar-top",
			`${calibrationBarDragStartTopPx + deltaY}px`,
		);
	}
}

/** End a calibration bar pointer interaction. */
function handleCalibrationBarPointerUp() {
	calibrationBarDragMode = "";
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
					id="text-editor-fonts-button"
					class="text-editor-fonts-button"
					:class="{ 'text-editor-button--depressed': textEditorButtonStates.fonts }"
					type="button"
					name="text-editor-fonts-button"
					data-button-name="text-editor-fonts-button"
					:aria-pressed="textEditorButtonStates.fonts"
					@click="toggleTextEditorButton('fonts')"
				>
					Fonts
				</button>
				<button
					id="text-editor-margins-button"
					class="text-editor-margins-button"
					:class="{ 'text-editor-button--depressed': textEditorButtonStates.margins }"
					type="button"
					name="text-editor-margins-button"
					data-button-name="text-editor-margins-button"
					:aria-pressed="textEditorButtonStates.margins"
					@click="toggleTextEditorButton('margins')"
				>
					Margins
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
			/>
			<section
				v-if="textEditorButtonStates.templates"
				id="text-editor-templates-panel"
				class="text-editor-templates-panel"
				aria-label="Template options"
			>
				<button
					id="text-editor-template-pre-made-button"
					class="text-editor-template-pre-made-button"
					type="button"
					name="text-editor-template-pre-made-button"
					data-button-name="text-editor-template-pre-made-button"
				>
					Pre-made
				</button>
				<button
					id="text-editor-template-custom-button"
					class="text-editor-template-custom-button"
					type="button"
					name="text-editor-template-custom-button"
					data-button-name="text-editor-template-custom-button"
				>
					Custom
				</button>
				<div class="text-editor-size-action-row">
					<button
						id="text-editor-size-button"
						class="text-editor-size-button"
						:class="{ 'text-editor-size-button--depressed': isSizePanelOpen }"
						type="button"
						name="text-editor-size-button"
						data-button-name="text-editor-size-button"
						:aria-pressed="isSizePanelOpen"
						@click="toggleSizePanel"
					>
						Size
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
								<div class="text-editor-size-unit-field">
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
										class="text-editor-size-unit-menu"
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
								<div class="text-editor-size-unit-field">
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
										class="text-editor-size-unit-menu"
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
<p class="text-editor-size-summary">
							{{ getDimensionLabel(widthValue, widthUnit) }} × {{ getDimensionLabel(heightValue, heightUnit) }}
						</p>
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
					{{ Math.round(isCalibrationBarHorizontal ? calibrationBarWidthPx : calibrationBarHeightPx) }} px
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

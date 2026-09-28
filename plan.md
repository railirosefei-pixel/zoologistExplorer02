- **Read `C:\zoologistExplorer02\rules\copilot-rules.md`**

- IMPORTANT Follow the plan 1 step at a time

- Whenever a consistency check involving the investigation of stale, unused, duplicate, or contradictory code is run against the program, do not include the "assets" folder in the check. Do not remove the assets directory or anything contained within it

1.) Make the following plan so that an ai agent with significantly less reasoning capablility can easily implement the changes as written.  Make absolutely certain that the plan is written in a way and broken up into enough phases and small enough steps that the risk of the agent making a mistake or missing something is heavily mitigated.  Make absolutely certain that the plan uses file targeting for each individual step when applicable.  Do not simply write a rule or goal which contains all the files that need to be targeted across the board.  Output the plan, starting at line 25 in plan.md.  Once you have written the plan, read through it again and make absolutely certain that the rule involving everything being separated as far as being identified in the code for styling, position, functionality, behavior of any kind, etc ... to make it simple and easy to debug and edit that code.  Make sure to include any useful tests and any points where they may specifically be useful where they will not be run automatically as according to any rule that copilot would automatically follow.  Be precise.  If you find after reading through the plan that it needs editing to be in compliance with the instructions I've dictated in this step then rewrite it to be in compliance and read through the plan again after you've replaced the other plan starting at line 25, and make sure it's in compliance again and follow this circle until you are satisfied that all the rules I've dictated in this step have been completely honored

- Goal

    - I want to add a function to the "Explorer Positions" button.  

    - When the "Explorer Positions" button is clicked on, in addition to the appearance and functionality of the "Resize" button in the "Progress" screen, I want another button to appear as well that is labeled: "Move"

        - Give the "Move" button the same exact size, shape, depth, font style, and font size as the "Resize" button, only make the "Move" button a bright blue color.

        - When the "Move" button is clicked have it depress and don't let it undepress until it is clicked on a 2nd time

        - When the "Move" button is depressed I want the ability to move the following asset: C:\zoologistExplorer02\assets\images\characters\railiFront.webp around the "Progress" screen simply by clicking anywhere on the asset and dragging it around.  When I let go of the left mouse button after I have been dragging the asset, have the asset stay where it is until or unless I click and drag it, again.

---

# Implementation Plan: "Move" button for Raili on the Student Progress screen

## Context map (read-only facts, already verified)

- The "Progress" screen is the Student > Progress tab submenu panel (`student-submenu-panel` with class `student-submenu-panel-progress`) inside `src/components/StudentNavigation.vue`.
- The "Explorer Positions" mode is a global boolean `isExplorerPositionsModeActive` owned by `src/App.vue`, passed into `src/components/StudentNavigation.vue` as the prop `explorerPositionsModeActive`. It is toggled from `src/components/CurriculumGameView.vue`. No changes are needed in `App.vue` or `CurriculumGameView.vue`.
- The "Resize" button (`#student-progress-resize-button`) lives inside the dock `#student-progress-resize-dock`, which renders only when `activeStudentMenu === 'progress' && explorerPositionsModeActive`. The dock is `position: fixed` at bottom-center, so the new "Move" button placed inside the same dock automatically appears next to "Resize".
- The Raili asset is the `<img>` with class `student-progress-raili-image` (imported as `railiFront`), wrapped in the frame `#student-progress-raili-frame` (class `student-progress-raili-frame`, absolutely positioned at bottom-right of the Progress panel).
- Existing Raili resize uses CSS custom properties set via `style.setProperty()` (no inline style attributes in the template) and persists to `localStorage`. The Move feature must follow this exact same pattern.
- Separation rule for this plan: every new element gets its OWN unique id, class names, CSS rule blocks, handler functions, and storage keys. Do NOT reuse, share, or merge selectors/handlers with the existing Resize feature, even where the code looks similar. Duplicate-looking code on distinct named elements is intentional isolation.

## Exact files this plan touches (and only these)

1. `src/components/StudentNavigation.vue` — script state + handlers, template markup.
2. `src/css/input.css` — new CSS rule blocks, plus one property added to the existing `.student-progress-raili-frame` rule.
3. `tests/explorer-positions-mode.test.js` — one new test block.

Do NOT edit: `src/App.vue`, `src/components/CurriculumGameView.vue`, `tests/vue-audit.test.js` (no new `<style>`-block selectors are added to any `.vue` file; all new styles go in `input.css`), the `assets/` folder, or `dist/`.

---

## Phase A — Script state and handlers in `src/components/StudentNavigation.vue`

### Step A1 — Add Move mode reactive state
File: `src/components/StudentNavigation.vue`, `<script setup>` section.
- Immediately after the existing line `const isResizeModeActive = ref(false);` (currently line 15), add a new line: `const isMoveModeActive = ref(false);`
- Immediately after the existing line `const RAILI_HEIGHT_STORAGE_KEY = "ze2.studentProgress.railiHeightPx";`, add two new constants:
  - `const RAILI_OFFSET_X_STORAGE_KEY = "ze2.studentProgress.railiOffsetXPx";`
  - `const RAILI_OFFSET_Y_STORAGE_KEY = "ze2.studentProgress.railiOffsetYPx";`
- Immediately after the existing line `let railiDragActive = false;`, add five new module-level drag variables (mirroring the resize drag variables, but move-specific):
  - `let railiMoveStartX = 0;`
  - `let railiMoveStartY = 0;`
  - `let railiMoveStartOffsetX = 0;`
  - `let railiMoveStartOffsetY = 0;`
  - `let railiMoveActive = false;`
- Also add `const railiFrameRef = ref(null);` immediately after the existing line `const railiImageRef = ref(null);` (the frame element needs a template ref so its CSS variables can be set).

### Step A2 — Add the Move toggle handler
File: `src/components/StudentNavigation.vue`, `<script setup>` section.
- Immediately after the existing `handleResizeToggle` function, add a new function with a JSDoc boundary comment matching the file's existing style:
  - JSDoc: `/** Move mode toggle pipeline boundary. */`
  - Function `handleMoveToggle()` that sets `isMoveModeActive.value = !isMoveModeActive.value;` (first click engages and stays engaged, second click disengages — identical toggle pattern to Resize).

### Step A3 — Add Move drag handlers
File: `src/components/StudentNavigation.vue`, `<script setup>` section, immediately after the existing `handleRailiResizeEnd` function. Add three new functions, each with a JSDoc comment:
1. `/** Apply a Raili position offset and store it in CSS variables on the frame. */`
   `applyRailiOffset(offsetXPx, offsetYPx)` — calls `railiFrameRef.value?.style.setProperty("--student-raili-offset-x", ...)` and `...setProperty("--student-raili-offset-y", ...)` with the values formatted as pixel strings.
2. `/** Begin dragging the Raili frame in Move mode. */`
   `handleRailiMoveStart(event)` — does nothing unless `isMoveModeActive.value` is true; does nothing if `event.target !== event.currentTarget` (this guard prevents the resize handles, which are children of the frame, from starting a move drag); otherwise records `event.clientX/clientY` into `railiMoveStartX/railiMoveStartY`, reads the frame's current rendered translate via `getComputedStyle` or by tracking the last applied offsets in `railiMoveStartOffsetX/railiMoveStartOffsetY`, sets `railiMoveActive = true`, and calls `event.currentTarget.setPointerCapture(event.pointerId)` (same capture pattern as `handleRailiResizeStart`).
3. `/** Move the Raili frame while the pointer moves. */`
   `handleRailiMoveMove(event)` — returns early unless `railiMoveActive`; computes `railiMoveStartOffsetX + (event.clientX - railiMoveStartX)` and the Y equivalent, then calls `applyRailiOffset(...)` with both values.
4. `/** Finish dragging the Raili frame and persist the position. */`
   `handleRailiMoveEnd()` — returns early unless `railiMoveActive`; writes the final integer offsets to `localStorage` under `RAILI_OFFSET_X_STORAGE_KEY` and `RAILI_OFFSET_Y_STORAGE_KEY` (same persistence pattern as `handleRailiResizeEnd`); sets `railiMoveActive = false`.

### Step A4 — Auto-disengage Move mode alongside Resize mode
File: `src/components/StudentNavigation.vue`, `<script setup>` section.
- In the existing `watch(() => props.explorerPositionsModeActive, ...)` block, inside the `if (!active)` branch, add `isMoveModeActive.value = false;` on its own line directly below the existing `isResizeModeActive.value = false;`.
- In the existing `watch(activeStudentMenu, ...)` block, inside the `if (menu !== "progress")` branch, add `isMoveModeActive.value = false;` on its own line directly below the existing `isResizeModeActive.value = false;`.
- In the existing `onMounted(...)` block: (a) inside the final `if (!props.explorerPositionsModeActive)` branch add `isMoveModeActive.value = false;` below the resize line; (b) after the stored-height restore block, add a new block that parses `RAILI_OFFSET_X_STORAGE_KEY` and `RAILI_OFFSET_Y_STORAGE_KEY` with `Number.parseFloat` and, if both are finite, calls `applyRailiOffset(storedX, storedY)` (same guard pattern as the stored-height restore).

---

## Phase B — Template markup in `src/components/StudentNavigation.vue` (depends on Phase A)

### Step B1 — Wire the Raili frame for Move dragging
File: `src/components/StudentNavigation.vue`, `<template>` section, the element `<div id="student-progress-raili-frame" ...>`.
- Add `ref="railiFrameRef"` to the element.
- Extend its `:class` binding so it also applies `'student-progress-raili-frame--move-active': isMoveModeActive` (keep the existing resize entry untouched; two separate keys in the same object).
- Add four event attributes to the frame element, mirroring the resize-handle pattern:
  - `@pointerdown="handleRailiMoveStart"`
  - `@pointermove="handleRailiMoveMove"`
  - `@pointerup="handleRailiMoveEnd"`
  - `@pointercancel="handleRailiMoveEnd"`
- Do NOT change the `<img>` element, the resize handles, or any other element.

### Step B2 — Add the "Move" button to the dock
File: `src/components/StudentNavigation.vue`, `<template>` section, inside `<div id="student-progress-resize-dock" ...>`.
- Immediately AFTER the existing `<button id="student-progress-resize-button" ...>Resize</button>` closing tag, add a brand-new button element with this exact attribute set (copy the Resize button's structure attribute-for-attribute, changing only the values listed):
  - `id="student-progress-move-button"`
  - `class="student-progress-move-button"`
  - `type="button"`
  - `name="student-progress-move-button"`
  - `data-button-name="student-progress-move-button"`
  - `aria-label="Toggle Raili move mode"`
  - `title="Toggle Raili move mode"`
  - `:aria-pressed="isMoveModeActive"`
  - `:class="{ 'student-progress-move-button--engaged': isMoveModeActive }"`
  - `@click="handleMoveToggle"`
  - Button text content: `Move`
- Because the button lives inside the existing dock (which already has `v-if="activeStudentMenu === 'progress' && explorerPositionsModeActive"`), it appears only when Explorer Positions mode is active on the Progress screen — no extra `v-if` is needed. Do NOT add one.

---

## Phase C — Styling in `src/css/input.css` (depends on nothing; parallel with Phases A/B)

All selectors below are NEW and unique to the Move feature. Do not merge them with the resize selectors. All values for size, shape, depth, and font are copied from the `.student-progress-resize-button` family so the two buttons match exactly except for color.

### Step C1 — Enable offset positioning on the Raili frame
File: `src/css/input.css`, the existing `.student-progress-raili-frame { ... }` rule (currently around line 1826).
- Add ONE new declaration inside that existing rule: `transform: translate(var(--student-raili-offset-x, 0px), var(--student-raili-offset-y, 0px));`
- Do not change any other declaration in that rule. (This rule belongs to the frame element itself, so adding a frame-owned property here is allowed and keeps position logic in one place.)

### Step C2 — Move-active frame indicator
File: `src/css/input.css`, immediately after the existing `.student-progress-raili-frame--resize-active { ... }` rule.
- Add a new rule `.student-progress-raili-frame--move-active` with: `pointer-events: auto;` (the base frame has `pointer-events: none`, so this is what enables clicking/dragging the asset), `touch-action: none;`, `cursor: grab;`, and `outline: 2px dashed #38bdf8; outline-offset: 4px;` (bright-blue dashed outline so the user can see Move mode is armed — the blue counterpart of the resize green dashed outline).

### Step C3 — `.student-progress-move-button` base rule
File: `src/css/input.css`, immediately after the existing `.student-progress-resize-button--engaged { ... }` rule block.
- Add `.student-progress-move-button` with declarations copied exactly from `.student-progress-resize-button`, changing ONLY the color values:
  - Same geometry/shape/font: `width: 116px; height: 40px; border-radius: 9999px; font: inherit; font-weight: 700; cursor: pointer;` and the same `transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease;`
  - Same depth: keep the four-layer `box-shadow` structure (inset top highlight, inset bottom shade, 6px ground shadow, soft ambient shadow) with identical offsets/blur, recoloring the shadow tints from green (`rgba(46, 96, 30, ...)` / `rgba(30, 66, 20, ...)`) to blue (`rgba(30, 90, 160, ...)` / `rgba(15, 55, 120, ...)`).
  - Bright blue face: `border: 1px solid rgba(30, 90, 160, 0.6);` and `background: linear-gradient(180deg, #7dd3fc 0%, #38bdf8 45%, #1d6ff2 100%);` with `color: #0b2a5b;`.

### Step C4 — `.student-progress-move-button:hover`
- Copy `.student-progress-resize-button:hover` declaration-for-declaration (`transform: translateY(-1px); filter: brightness(1.04);` and the same raised box-shadow structure), recoloring shadow tints to the same blues used in Step C3.

### Step C5 — `.student-progress-move-button:active`
- Copy `.student-progress-resize-button:active` declaration-for-declaration (`transform: translateY(4px);` and the same pressed box-shadow structure), recoloring tints to blue and replacing the green glow `rgba(126, 226, 31, 0.6)` with a blue glow `rgba(56, 189, 248, 0.6)`.

### Step C6 — `.student-progress-move-button--engaged`
- Copy `.student-progress-resize-button--engaged` declaration-for-declaration (the held-down `translateY(4px)` pressed look), recoloring tints to blue and using the blue glow from Step C5. This is what keeps the button visually depressed after the first click until the second click.

---

## Phase D — Structural test (depends on Phases A–C)

### Step D1 — Extend `tests/explorer-positions-mode.test.js`
File: `tests/explorer-positions-mode.test.js`.
- Add ONE new `test(...)` block after the existing test, named `"Move mode button and Raili drag wiring are present"`. Use the file's existing `readSource` helper. Assertions:
  - In `src/components/StudentNavigation.vue` source: matches `student-progress-move-button`, `student-progress-move-button--engaged`, `isMoveModeActive`, `handleMoveToggle`, `handleRailiMoveStart`, `handleRailiMoveMove`, `handleRailiMoveEnd`, `student-progress-raili-frame--move-active`, `railiFrameRef`, `--student-raili-offset-x`, `--student-raili-offset-y`, `ze2\.studentProgress\.railiOffsetXPx`, `ze2\.studentProgress\.railiOffsetYPx`.
  - In `src/css/input.css` source: matches `\.student-progress-move-button`, `\.student-progress-move-button--engaged`, `\.student-progress-raili-frame--move-active`, `var\(--student-raili-offset-x`, and `#38bdf8`.
  - Negative isolation assertion: `assert.doesNotMatch(studentSource, /class="student-progress-resize-button"[^>]*>\s*Move/)` — the Move button must not reuse the Resize button's class.
- Do NOT modify the existing test block. Do NOT add this file to `package.json` — it is already included in the `test:structure` script.

### Step D2 — Run the structural suite
- Run `npm run test:structure`. It must pass. If it fails, fix only the failing assertion's target file from Phases A–C; do not loosen the test to make it pass.

---

## Phase E — Focused verification (depends on Phase D)

1. `npm run test:structure` — must pass (covers the new test plus vue-audit, css-js-integrity, and button-isolation, which guard the separation rules).
2. Asset check: the railiFront.webp path is not changed, so `npm run test:assets` and `npm run build` are not required by the asset rule. Record them as `not run (not required — no asset path change)`.
3. Manual behavior check (report each as pass/fail; do not claim from build output):
   - Open Student > Progress with Explorer Positions OFF: no dock buttons appear.
   - Toggle Explorer Positions ON: dock shows both "Resize" (green) and "Move" (bright blue), identical size/shape/font.
   - Click "Move" once: button stays visually depressed; Raili frame shows a blue dashed outline.
   - Drag Raili with the left mouse button; release: Raili stays at the drop position.
   - Click "Move" again: button undepresses; dragging no longer moves Raili; Raili remains where it was dropped.
   - Reload the page with Explorer Positions ON: Raili restores to the last dropped position (localStorage persistence).
   - Toggle Explorer Positions OFF then ON: Move mode starts disengaged.

## Explicitly out of scope

- No changes to the Resize feature's behavior, selectors, or handlers.
- No new components, no new files besides the plan content.
- No changes in `assets/`, `dist/`, `App.vue`, `CurriculumGameView.vue`, or `package.json`.
- No deduplication/merging of the new Move selectors or handlers with the Resize ones.

    







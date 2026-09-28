- **Read `C:\zoologistExplorer02\rules\copilot-rules.md`**

- IMPORTANT Follow the plan 1 step at a time

- Whenever a consistency check involving the investigation of stale, unused, duplicate, or contradictory code is run against the program, do not include the "assets" folder in the check. Do not remove the assets directory or anything contained within it

1.) Make the following plan so that an ai agent with significantly less reasoning capablility can easily implement the changes as written.  Make absolutely certain that the plan is written in a way and broken up into enough phases and small enough steps that the risk of the agent making a mistake or missing something is heavily mitigated.  Make absolutely certain that the plan uses file targeting for each individual step when applicable.  Do not simply write a rule or goal which contains all the files that need to be targeted across the board.  Output the plan, starting at line 25 in plan.md.  Once you have written the plan, read through it again and make absolutely certain that the rule involving everything being separated as far as being identified in the code for styling, position, functionality, behavior of any kind, etc ... to make it simple and easy to debug and edit that code.  Make sure to include any useful tests and any points where they may specifically be useful where they will not be run automatically as according to any rule that copilot would automatically follow.  Be precise.  If you find after reading through the plan that it needs editing to be in compliance with the instructions I've dictated in this step then rewrite it to be in compliance and read through the plan again after you've replaced the other plan starting at line 25, and make sure it's in compliance again and follow this circle until you are satisfied that all the rules I've dictated in this step have been completely honored

- Goals:  

    - Remove the screen associated with the Explorer Positions button.  The button will not have a screen associated with it

    - Add the following functionality to the Explorer Positions button:

        - When clicked, I want the Explorer Positions button to turn bright green and to stay depressed until it is clicked on a second time

        - When clicked, the Explorer Positions button should do the following:

            - Open a container inside the Student > Progress screen on the bottom that contains a button labeled "Resize"

                - Make the "Resize" button 116 pixels wide and 40 pixels high.  Make it oval, bright green, and 3D with shadowing.  When the Resize button is clicked on make sure that it stays depressed until it is clicked on a 2nd time

                - When the "Resize" button is clicked on, give me the ability to resize the following asset: "C:\zoologistExplorer02\assets\images\characters\railiFront.webp" by forming a rectangle around it and giving me the resize option when I hover the mouse over one of the rectangle's 4 corners.  When I click and drag on one of the corners of the rectangle, I should be able to resize the character to be bigger or smaller as I please, but the asset's ratio of dimensions should remain the same.

---

# IMPLEMENTATION PLAN (DO NOT START UNTIL INSTRUCTED)

## Locked decisions (from user, 2026-09-27)

- Keep the Explorer Positions button in the Parent > Curriculum Game sidebar (`CurriculumGameView.vue`); its effect appears in Student > Progress.
- The bottom container in Student > Progress appears ONLY while Explorer Positions mode is toggled ON.
- Resized Raili height persists in localStorage across sessions.
- Approved exception: ONE CSS custom property `--student-raili-height` updated via JS `setProperty` (no other dynamic styling). The `var()` must be consumed in `src/css/input.css` (required by tests/css-js-integrity.test.js).

## Authoritative codebase facts (verified 2026-09-27)

- Explorer Positions button: `src/components/CurriculumGameView.vue` lines 35-44, emit `open-explorer-positions`, handler `handleExplorerPositionsOpen` lines 3-5. Styles `.explorer-positions-button` in `src/css/input.css` lines 1703-1741.
- Screen to remove: `src/components/ExplorerPositionsView.vue` (whole file). Imported/rendered only in `src/App.vue` (import line 11, render lines 124-127, handlers lines 81-89). CSS to remove: `.explorer-positions-screen`, `.explorer-positions-placeholder`, `.explorer-positions-heading` (input.css ~1743-1769), and remove `.explorer-positions-screen-back-button` / `.explorer-positions-screen-home-button` from the two shared selector lists (~1434 and ~1461).
- Student > Progress screen + Raili image: `src/components/StudentNavigation.vue` lines 128-145 inside `<aside id="student-submenu-panel">`. Raili import line 5. img currently: `class="pointer-events-none absolute bottom-0 right-0 h-96 w-auto max-w-[45vw] object-contain"`.
- View state lives in `src/App.vue` refs (`activeParentScreen`, `isStudentMenuOpen`). CurriculumGameView and StudentNavigation are never mounted simultaneously (v-else-if chain), so the toggle state must live in App.vue and pass down as props.
- Test constraints:
    - tests/button-isolation.test.js: every `<button>` needs unique static id, unique static class, simple-identifier `@click`. Two buttons may NOT share a static class. (Resize corner handles must therefore be `<div>`, not `<button>`.)
    - tests/page-container-separation.test.js: `<main|section|aside|article|header|footer>` tags need id, class, role, aria-label, title. Use `<div>` for the dock to stay out of scope, but give it full metadata anyway.
    - tests/vue-audit.test.js: scoped `<style>` selectors per file must match allowedSelectorPrefixes (StudentNavigation.vue = `student-`). This plan adds NO scoped styles; ALL new CSS goes into input.css.
    - tests/css-js-integrity.test.js: any `setProperty("--x", ...)` in a .vue file must have a matching `var(--x)` in input.css; any `var(--x)` in input.css needs a CSS declaration or JS setProperty. So input.css must both declare `--student-raili-height` default AND consume it with `var()`.
    - No existing test references Explorer Positions (verified by grep).
- `npm test` = lint + test:structure + test:assets. test:structure lists test files explicitly in package.json; a new test file must be added there.
- Never touch `dist/` (regenerated by `npm run build`, a gated action).
- Do not include `assets/` in any stale/duplicate/consistency check; never remove anything in assets/.

## PHASE 1 — Remove the Explorer Positions screen, convert button to toggle

Target files: src/App.vue, src/components/CurriculumGameView.vue, src/components/ExplorerPositionsView.vue, src/css/input.css

1. `src/App.vue`:
    - Delete import of ExplorerPositionsView (line 11).
    - Delete the `<ExplorerPositionsView ... />` template block (lines 124-127).
    - Delete handlers `handleExplorerPositionsOpen` (lines 81-84) and `handleExplorerPositionsClose` (lines 87-89). Keep `handleParentChainHome`.
    - Add `const isExplorerPositionsModeActive = ref(false);` near the other refs (lines 13-17).
    - Add handler: `function handleExplorerPositionsToggle() { isExplorerPositionsModeActive.value = !isExplorerPositionsModeActive.value; }` with JSDoc comment `/** Explorer Positions mode toggle pipeline boundary. */`.
    - On `<CurriculumGameView>` (lines 115-120): replace `@open-explorer-positions="handleExplorerPositionsOpen"` with `@toggle-explorer-positions-mode="handleExplorerPositionsToggle"` and add prop `:explorer-positions-mode-active="isExplorerPositionsModeActive"`.
    - On `<StudentNavigation>`: add prop `:explorer-positions-mode-active="isExplorerPositionsModeActive"`.
2. `src/components/CurriculumGameView.vue`:
    - Change `defineEmits(["open-explorer-positions", ...])` to `defineEmits(["toggle-explorer-positions-mode", "back-to-student-edits", "go-home"])`.
    - Add props: `defineProps({ explorerPositionsModeActive: { type: Boolean, default: false } });`
    - Rename `handleExplorerPositionsOpen` to `handleExplorerPositionsToggle`, emitting `"toggle-explorer-positions-mode"`.
    - On `#explorer-positions-button`: update @click to the renamed handler; add `:class="{ 'explorer-positions-button--engaged': explorerPositionsModeActive }"` and `:aria-pressed="explorerPositionsModeActive"`.
    - Keep static class `explorer-positions-button` unchanged (button-isolation test).
3. Delete file `src/components/ExplorerPositionsView.vue`.
4. `src/css/input.css`:
    - Delete rules `.explorer-positions-screen`, `.explorer-positions-placeholder`, `.explorer-positions-heading` (~lines 1743-1769).
    - In the shared back-button selector list (~line 1434), remove `,\n.explorer-positions-screen-back-button`. In the shared home-button list (~line 1461), remove `.explorer-positions-screen-home-button`.
    - Add NEW rule `.explorer-positions-button--engaged` directly after `.explorer-positions-button:active` (~line 1741): bright green gradient `linear-gradient(180deg, #7efc9b 0%, #2dd35a 100%)`, `color: #0b4d22`, `border-color: rgba(17, 116, 50, 0.6)`, depressed transform `translateY(4px)`, reduced shadow stack `inset 0 2px 0 rgba(255,255,255,0.7), inset 0 -2px 0 rgba(13,90,38,0.25), 0 3px 0 rgba(20,83,45,0.55), 0 0 14px rgba(34,197,94,0.6)`.
    - Do NOT modify `.explorer-positions-button`, its `:hover`, or `:active` (separation rule).
5. Validate Phase 1: run `npm run lint` and `npm run test:structure`. Both must pass. (ExplorerPositionsView.vue was in no test registry, so deletion is safe.)

## PHASE 2 — Resize dock + Resize button in Student > Progress

Target files: src/components/StudentNavigation.vue, src/css/input.css

6. `src/components/StudentNavigation.vue` script:
    - Extend the vue import to include `watch` and `onMounted` (onMounted is used in Phase 3 — add now).
    - Add `const props = defineProps({ explorerPositionsModeActive: { type: Boolean, default: false } });` (keep `props` referenced; it is used by the watch below).
    - Add `const isResizeModeActive = ref(false);`
    - Add `function handleResizeToggle() { isResizeModeActive.value = !isResizeModeActive.value; }` with JSDoc.
    - Add watchers: `watch(() => props.explorerPositionsModeActive, (active) => { if (!active) { isResizeModeActive.value = false; } });` and `watch(activeStudentMenu, (menu) => { if (menu !== "progress") { isResizeModeActive.value = false; } });`
7. `src/components/StudentNavigation.vue` template — inside `<aside id="student-submenu-panel">`, immediately AFTER the Raili `<img>` (after line 145), add:
    - `<div v-if="activeStudentMenu === 'progress' && explorerPositionsModeActive" id="student-progress-resize-dock" class="student-progress-resize-dock" role="region" aria-label="Resize tools" title="Resize tools" data-container-name="student-progress-resize-dock">` containing one button:
    - `<button id="student-progress-resize-button" class="student-progress-resize-button" :class="{ 'student-progress-resize-button--engaged': isResizeModeActive }" type="button" name="student-progress-resize-button" data-button-name="student-progress-resize-button" aria-label="Toggle Raili resize mode" title="Toggle Raili resize mode" :aria-pressed="isResizeModeActive" @click="handleResizeToggle">Resize</button>`
8. `src/css/input.css` — append new rules at end of file (each selector distinct; do not merge with existing selectors):
    - `.student-progress-resize-dock`: `position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); z-index: 30; display: flex; align-items: center; justify-content: center; padding: 0.75rem 1.25rem; border: 1px solid rgba(190, 242, 205, 0.4); border-radius: 1rem; background: rgba(9, 24, 16, 0.9); box-shadow: 0 10px 18px rgba(15, 23, 42, 0.35);`
    - `.student-progress-resize-button`: exactly `width: 116px; height: 40px;` — oval `border-radius: 9999px;` — bright green `background: linear-gradient(180deg, #b6ff5c 0%, #7ee21f 45%, #4fa30a 100%); color: #123d05;` — 3D `border: 1px solid rgba(46, 96, 30, 0.6); box-shadow: inset 0 2px 0 rgba(255,255,255,0.75), inset 0 -4px 0 rgba(46,96,30,0.3), 0 6px 0 rgba(30,66,20,0.55), 0 10px 14px rgba(15,23,42,0.3);` — `font: inherit; font-weight: 700; cursor: pointer; transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease;`
    - `.student-progress-resize-button:hover`: `transform: translateY(-1px); filter: brightness(1.04);` + slightly raised shadow.
    - `.student-progress-resize-button:active` and `.student-progress-resize-button--engaged`: depressed `transform: translateY(4px); box-shadow: inset 0 2px 0 rgba(255,255,255,0.6), inset 0 -2px 0 rgba(46,96,30,0.25), 0 2px 0 rgba(30,66,20,0.55), 0 0 12px rgba(126,226,31,0.6);` (two separate rules; do not combine selectors — separation rule).
9. Validate Phase 2: `npm run lint`, `npm run test:structure`. Manual (dev server): Explorer Positions button turns bright green + stays depressed on first click, releases on second; dock appears at bottom-center of Student > Progress only while mode ON; Resize button is 116x40 oval bright-green 3D and stays depressed until second click.

## PHASE 3 — Raili resize frame, corner handles, drag logic, persistence

Target files: src/components/StudentNavigation.vue, src/css/input.css

10. `src/components/StudentNavigation.vue` template — wrap the Raili `<img>` in a frame and add handles:
    - Replace the current `<img ...alt="Raili" />` (lines 139-145) with:
      `<div v-if="activeStudentMenu === 'progress'" id="student-progress-raili-frame" class="student-progress-raili-frame" :class="{ 'student-progress-raili-frame--resize-active': isResizeModeActive }" data-container-name="student-progress-raili-frame">`
      inside it the img: `<img ref="railiImageRef" class="student-progress-raili-image" :src="railiFront" alt="Raili" />`
      then 4 handle divs (NOT buttons — button-isolation test): each `v-if="isResizeModeActive"`, e.g.
      `<div v-if="isResizeModeActive" id="student-progress-raili-resize-handle-nw" class="student-progress-raili-resize-handle student-progress-raili-resize-handle--nw" role="presentation" aria-hidden="true" @pointerdown="handleRailiResizeStart('nw', $event)" @pointermove="handleRailiResizeMove('nw', $event)" @pointerup="handleRailiResizeEnd" @pointercancel="handleRailiResizeEnd"></div>`
      and identical handles for `ne`, `sw`, `se` (unique id per handle; same two shared classes are fine on divs).
11. `src/components/StudentNavigation.vue` script — add:
    - `const railiImageRef = ref(null);`
    - Drag state (plain lets, not reactive): `let railiDragStartY = 0; let railiDragStartHeightPx = 0; let railiDragActive = false;`
    - Constant: `const RAILI_HEIGHT_STORAGE_KEY = "ze2.studentProgress.railiHeightPx";`
    - `applyRailiHeight(heightPx)`: clamps to `Math.min(Math.max(heightPx, 96), window.innerHeight * 0.8)` then `railiImageRef.value?.style.setProperty("--student-raili-height", \`${clamped}px\`);` (literal string `"--student-raili-height"` is REQUIRED for css-js-integrity test).
    - `handleRailiResizeStart(corner, event)`: set `railiDragActive = true`; `railiDragStartY = event.clientY`; `railiDragStartHeightPx = railiImageRef.value?.getBoundingClientRect().height ?? 384`; `event.currentTarget.setPointerCapture(event.pointerId)`.
    - `handleRailiResizeMove(corner, event)`: if not `railiDragActive` return; sign = (corner === "nw" || corner === "ne") ? -1 : 1; `applyRailiHeight(railiDragStartHeightPx + sign * (event.clientY - railiDragStartY));` — vertical-axis drag only; aspect ratio preserved automatically because image width stays `auto`.
    - `handleRailiResizeEnd()`: if `railiDragActive`, persist current clamped height: `localStorage.setItem(RAILI_HEIGHT_STORAGE_KEY, String(Math.round(railiImageRef.value?.getBoundingClientRect().height ?? 0)))`; set `railiDragActive = false`.
    - `onMounted(() => { const stored = Number.parseFloat(localStorage.getItem(RAILI_HEIGHT_STORAGE_KEY) ?? ""); if (Number.isFinite(stored) && stored > 0) { applyRailiHeight(stored); } });`
    - All functions get one-line JSDoc (repo convention).
12. `src/css/input.css` — append (all new, distinct selectors):
    - `.student-progress-raili-frame`: `position: absolute; bottom: 0; right: 0; pointer-events: none;` (matches the image's current anchoring inside the fixed aside).
    - `.student-progress-raili-frame--resize-active`: `outline: 2px dashed #7ee21f; outline-offset: 4px;` (this is the visible rectangle).
    - `.student-progress-raili-image`: `--student-raili-height: 24rem; display: block; height: var(--student-raili-height); width: auto; max-width: 45vw; object-fit: contain; pointer-events: none;` (declaration + var() in input.css satisfies css-js-integrity both directions; 24rem = current h-96).
    - `.student-progress-raili-resize-handle`: `position: absolute; width: 16px; height: 16px; border-radius: 9999px; background: linear-gradient(180deg, #b6ff5c 0%, #4fa30a 100%); border: 2px solid #123d05; box-shadow: 0 2px 4px rgba(15,23,42,0.4); pointer-events: auto; touch-action: none; z-index: 40;`
    - 4 separate corner rules (do NOT combine): `.student-progress-raili-resize-handle--nw { top: -8px; left: -8px; cursor: nwse-resize; }`, `--ne { top: -8px; right: -8px; cursor: nesw-resize; }`, `--sw { bottom: -8px; left: -8px; cursor: nesw-resize; }`, `--se { bottom: -8px; right: -8px; cursor: nwse-resize; }`.
13. Validate Phase 3: `npm run lint`, `npm run test:structure` (css-js-integrity now validates the setProperty/var wiring). Manual: with both buttons engaged, dashed rectangle appears around Raili; dragging any corner grows/shrinks her with constant aspect ratio; rectangle + handles vanish when Resize is toggled off; size survives page reload.

## PHASE 4 — Regression test + full gate

Target files: tests/explorer-positions-mode.test.js (NEW), package.json

14. Create `tests/explorer-positions-mode.test.js` (node:test + fs text assertions, mirroring tests/xp-bar.test.js style). Assert:
    - `src/components/ExplorerPositionsView.vue` does NOT exist; App.vue contains no `ExplorerPositionsView` reference.
    - CurriculumGameView.vue contains `toggle-explorer-positions-mode` emit and `explorer-positions-button--engaged` binding.
    - App.vue contains `isExplorerPositionsModeActive` and passes `:explorer-positions-mode-active` to both CurriculumGameView and StudentNavigation.
    - StudentNavigation.vue contains `student-progress-resize-dock`, `student-progress-resize-button`, the 4 handle ids, `setProperty("--student-raili-height"`, and the localStorage key.
    - input.css contains `.explorer-positions-button--engaged`, `.student-progress-resize-button` with `width: 116px` and `height: 40px`, `var(--student-raili-height)`, and does NOT contain `.explorer-positions-screen`.
15. `package.json`: append `tests/explorer-positions-mode.test.js` to the `test:structure` script's file list.
16. Full gate: run `npm test` (lint + structure + assets). If authorized, run `npm run build` as the final production check (regenerates dist/; gated action — disclose before running).
17. Optional manual e2e (not automated): Playwright smoke (`npm run test:e2e`) only if the user authorizes it — no existing spec covers this feature.

## Explicit exclusions

- No keyboard/ARIA resize interaction on handles (mouse/pointer only, per request).
- No changes to `assets/`; railiFront.webp stays in place, imported as today.
- No edits in `dist/`; no consistency sweep of stale code beyond the exact Explorer Positions screen removal listed above.
- No scoped `<style>` additions anywhere; all new CSS is global in input.css.
- Explorer Positions button position/size/typography unchanged; only the new --engaged state is added.





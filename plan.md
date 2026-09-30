- **Read `C:\zoologistExplorer02\rules\copilot-rules.md`**

- Whenever a consistency check involving the investigation of stale, unused, duplicate, or contradictory code is run against the program, do not include the "assets" folder in the check. Do not remove the assets directory or anything contained within it

A.) Make the following plan so that an ai agent with significantly less reasoning capablility can easily implement the changes as written.  Make absolutely certain that the plan is written in a way and broken up into enough phases and small enough steps that the risk of the agent making a mistake or missing something is heavily mitigated.  Make absolutely certain that the plan uses file targeting for each individual step when applicable.  Do not simply write a rule or goal which contains all the files that need to be targeted across the board.  Output the plan, starting at line 23 in plan.md.  Once you have written the plan, read through it again and make absolutely certain that the rule involving everything being separated as far as being identified in the code for styling, position, functionality, behavior of any kind, etc ... to make it simple and easy to debug and edit that code.  Make sure that if anything is moved or removed that the moving or the removal of any stale or dead code, as needed, is instructed in the plan in order to keep the code clean.  Make sure to include any useful tests and any points where they may specifically be useful where they will not be run automatically as according to any rule that copilot would automatically follow.  Be precise.  If you find after reading through the plan that it needs editing to be in compliance with the instructions I've dictated in this step then rewrite it to be in compliance and read through the plan again after you've replaced the other plan starting at line 25, and make sure it's in compliance again and follow this circle until you are satisfied that all the rules I've dictated in this step have been completely honored

1.) When the Save button inside the New + menu is clicked on, a small panel should pop up above it.  The panel should be 120 pixels high and 400 pixels wide. 

2.) Place the text "Template Name" on the left side of the Save panel.  Directly to the right of that text should be a single line text input box, large enough to allow the user to unput 15 characters.

3.) Create a button labeled: "Commit" in the bottom right hand corner of the save panel.

4.) When the "Commit" button, in the save panel, is clicked on then the text inside the text input box that is inside the save panel should be saved as the name of that paper template and all the formatting including but not limited to the text, size, margins, color, and grid lines should be saved under the Saved Templates button.

5.) When the Saved Templates button is clicked on, a sidebar panel which shares a left edge, right edge, and bottom edge with the Templates sidebar panel and the top edge starting 16 pixels underneath the bottom edge of the Saved Templates button should appear as a higher level layer than the buttons on the Templates sidebar panel.  Then all the saved paper template's names should pop up as clickable buttons, with the latest saved entry at the top and then going downward in order by date modified

6.) When a templates name is clicked on in the Saved Templates sidebar panel, then that specific template should show up in the same position and overall state that it was in on the screen, when it was saved. 

    - Do not implement any steps of this plan.  Make the plan, output it into plan.md, and then stop



## Implementation Plan — Saved Paper Templates

Global constraints for every step:
- Do not touch anything inside `assets/`. Any consistency sweep in this plan excludes `assets/` entirely.
- Vue 3 `<script setup>` only; no inline `style=""` attributes; no dynamic Tailwind class strings. All new styling goes in `src/css/input.css` with one isolated selector per named element. Duplicate declarations across distinct elements are intentional isolation — never merge selectors across elements.
- Existing verified anchors: Save button `#text-editor-template-save-button` and paper `#print-preview-paper` live inside `#print-preview-paper-viewport` in `src/components/ParentView.vue`; its CSS rule `.text-editor-template-save-button` sits directly after `.print-preview-paper` in `src/css/input.css` and already uses the `setProperty`/`var()` pattern (`--print-preview-save-right`, `--print-preview-save-bottom`), which `tests/css-js-integrity.test.js` enforces (every JS-set var must have a `var()` usage and vice versa).
- After each phase, run only the check listed in that phase. `npm run test:e2e` (Playwright, writes `test-results/`) and `npm run build` are separately gated: ask the user before running either. Node `--test` runs are not gated.
- If a check fails on files outside the current step's targets (e.g., the known pre-existing `button-isolation.test.js` failures on `student-edits-tab` and `student-edits-screen-*` shared classes), record it as pre-existing and out of scope; do not fix it here.

### Phase 1 — Template persistence store

1.1 Target: `src/js/templateState.js` (NEW file). Model it on `src/js/blockDescriptionState.js`:
- `import { reactive } from "vue";`
- Storage key constant: `"ze2.textEditor.savedTemplates"`.
- `loadSavedTemplates()`: guarded `globalThis.localStorage?.getItem` + `JSON.parse` inside try/catch; return `[]` on any failure or non-array result; keep only entries that are objects with a string `name`.
- `persistSavedTemplates()`: guarded `setItem` of `JSON.stringify(state.savedTemplates)`, try/catch.
- `const state = reactive({ savedTemplates: loadSavedTemplates() });`
- `saveTemplate(entry)`: run `const trimmedName = entry.name.trim();`; return `false` if `trimmedName` is empty; otherwise `state.savedTemplates.unshift({ id: "template-" + Date.now() + "-" + Math.random().toString(36).slice(2), ...entry, name: trimmedName, savedAtIso: new Date().toISOString() })`, persist, return `true`.
- `getTemplates()`: returns `state.savedTemplates` (already newest-first because of `unshift`).
- `getTemplate(id)`: returns the matching entry or `null`.
- Export: `export const templateStore = { state, saveTemplate, getTemplates, getTemplate };`
- Snapshot object shape (exact keys): `{ name, widthValue, widthUnit, heightValue, heightUnit, grid, paperColor, paperText, margins, gridLines }`. The last four may be `null` today; they are reserved slots so requirement 4's "including but not limited to" can be satisfied later without a schema change.

1.2 Target: `tests/saved-templates.test.js` (NEW file). Use `node:test` + `node:assert/strict`, importing `templateStore` from `../src/js/templateState.js`. Tests:
- (a) `saveTemplate` with a blank/whitespace name returns `false` and leaves the list unchanged.
- (b) Two valid saves produce newest-first order (`getTemplates()[0]` is the second save) and all snapshot keys round-trip.
- (c) `getTemplate(id)` returns the matching entry and `getTemplate("missing")` returns `null`.
- Note: Node has no `localStorage`; the store's guarded access makes it session-only there, which these tests rely on. Do not mock `localStorage`.

1.3 Target: `package.json` — append `tests/saved-templates.test.js` to the `test:structure` script's file list.

1.4 Check: `npx node --test tests/saved-templates.test.js`.

### Phase 2 — Save panel UI (requirements 1–3)

2.1 Target: `src/components/ParentView.vue` script, immediately after the existing line `const isHeightMenuOpen = ref(false);`:
- `const isTemplateSavePanelOpen = ref(false);`
- `const templateNameValue = ref("");`
- `function toggleTemplateSavePanel() { isTemplateSavePanelOpen.value = !isTemplateSavePanelOpen.value; }`

2.2 Target: `src/components/ParentView.vue` template, the existing `#text-editor-template-save-button` (inside `#print-preview-paper-viewport`): add `@click="toggleTemplateSavePanel"` and `:aria-expanded="isTemplateSavePanelOpen"`.

2.3 Target: `src/components/ParentView.vue` template, immediately after that Save button and before the `#print-preview-paper` div (the panel stays a sibling of the paper — never inside it):
- `<section v-if="isTemplateSavePanelOpen" id="text-editor-template-save-panel" class="text-editor-template-save-panel" aria-label="Save template" title="Save template">`
- Inside it, one row: `<div class="text-editor-template-save-panel-row">` containing `<label class="text-editor-template-save-panel-label" for="text-editor-template-name-input">Template Name</label>` and `<input id="text-editor-template-name-input" v-model="templateNameValue" class="text-editor-template-name-input" type="text" maxlength="15" name="text-editor-template-name-input" data-element-name="text-editor-template-name-input" />`.
- After the row: `<button id="text-editor-template-commit-button" class="text-editor-template-commit-button" type="button" name="text-editor-template-commit-button" data-button-name="text-editor-template-commit-button">Commit</button>`.

2.4 Target: `src/css/input.css`, directly after the existing `.text-editor-template-save-button` rule. Add these isolated rules (no shared selectors):
- `.text-editor-template-save-panel { position: absolute; right: var(--print-preview-save-right, 16px); bottom: calc(var(--print-preview-save-bottom, 16px) + 64px); z-index: 2; width: 400px; height: 120px; box-sizing: border-box; border: 1px solid rgba(255, 248, 190, 0.65); border-radius: 8px; background: linear-gradient(180deg, #173f70 0%, #0b2342 100%); box-shadow: 0 8px 16px rgba(0, 0, 0, 0.45); }` — the 64px offset equals the Save button's rendered height (~58px) plus a ~6px gap, so the panel always pops up above the Save button; reusing the existing right var aligns its right edge with the Save button's right edge.
- `.text-editor-template-save-panel-row { display: flex; align-items: center; gap: 8px; padding: 12px; }`
- `.text-editor-template-save-panel-label { color: #fff7cc; font-family: "Minecraft2Bold", "Trebuchet MS", sans-serif; font-size: 1rem; white-space: nowrap; }`
- `.text-editor-template-name-input { flex: 1; min-width: 0; height: 32px; box-sizing: border-box; padding: 4px 8px; border: 1px solid #171717; border-radius: 4px; background: #ffffff; color: #202020; font-family: "Minecraft2Bold", "Trebuchet MS", sans-serif; font-size: 1rem; }`
- `.text-editor-template-commit-button { position: absolute; right: 12px; bottom: 12px; min-width: 88px; min-height: 40px; border: 1px solid #171717; border-radius: 8px; background: linear-gradient(180deg, #4b4b4b 0%, #3c3c3c 33.333%, #2e2e2e 66.667%, #202020 100%); color: #fff; font-family: "Minecraft2Bold", "Trebuchet MS", sans-serif; font-size: 1rem; font-weight: 700; cursor: pointer; box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.42), inset 0 -5px 0 rgba(0, 0, 0, 0.35), 0 4px 0 #111, 0 8px 10px rgba(0, 0, 0, 0.48); }`

2.5 Target: `tests/button-isolation.test.js`, inside the existing test `"text editor size control and template panel are implemented as specified"`: add static assertions for `id="text-editor-template-save-panel"`, the label text `Template Name`, an input with `id="text-editor-template-name-input"` and `maxlength="15"`, and `id="text-editor-template-commit-button"` rendering `Commit`.

2.6 Check: `npx node --test tests/button-isolation.test.js tests/saved-templates.test.js`.

### Phase 3 — Commit pipeline (requirement 4)

3.1 Target: `src/components/ParentView.vue` script:
- Under `import { convertToPixels } from "../js/unitConversion.js";` add `import { templateStore } from "../js/templateState.js";`
- Add `handleTemplateCommit()` with a JSDoc noting the four `null` fields are reserved slots that must be wired to real formatting refs when text/color/margins/grid-line state exists:
```
function handleTemplateCommit() {
	const committed = templateStore.saveTemplate({
		name: templateNameValue.value,
		widthValue: widthValue.value,
		widthUnit: widthUnit.value,
		heightValue: heightValue.value,
		heightUnit: heightUnit.value,
		grid: textEditorButtonStates.value.grid,
		paperColor: null,
		paperText: null,
		margins: null,
		gridLines: null,
	});
	if (committed) {
		templateNameValue.value = "";
		isTemplateSavePanelOpen.value = false;
	}
}
```

3.2 Target: `src/components/ParentView.vue` template, the Commit button from step 2.3: add `@click="handleTemplateCommit"`.

3.3 Target: `tests/button-isolation.test.js`, same test as step 2.5: assert `ParentView.vue` contains `import { templateStore } from "../js/templateState.js";` and that the Commit button markup includes `@click="handleTemplateCommit"`.

3.4 Check: `npx node --test tests/button-isolation.test.js tests/saved-templates.test.js`.

### Phase 4 — Saved Templates sidebar + restore handler (requirements 5–6)

4.1 Target: `src/components/ParentView.vue` script:
- Add refs: `const isSavedTemplatesPanelOpen = ref(false);`, `const savedTemplatesButtonRef = ref(null);`, `const templatesPanelRef = ref(null);`
- Add `const savedTemplateEntries = computed(() => templateStore.getTemplates());`
- Add the toggle, which measures the exact 16px offset at runtime (same `getBoundingClientRect` + `setProperty` pattern the calibration bar already uses):
```
async function toggleSavedTemplatesPanel() {
	isSavedTemplatesPanelOpen.value = !isSavedTemplatesPanelOpen.value;
	if (!isSavedTemplatesPanelOpen.value) {
		return;
	}
	await nextTick();
	const panel = templatesPanelRef.value;
	const button = savedTemplatesButtonRef.value;
	if (!panel || !button) {
		return;
	}
	const topPx = button.getBoundingClientRect().bottom - panel.getBoundingClientRect().top + 16;
	panel.style.setProperty("--saved-templates-panel-top", `${topPx}px`);
}
```
- Add the restore handler (with a comment that non-null `paperColor`/`paperText`/`margins`/`gridLines` snapshot fields must be applied here once those formatting refs exist):
```
function handleSavedTemplateOpen(id) {
	const entry = templateStore.getTemplate(id);
	if (!entry) {
		return;
	}
	widthValue.value = entry.widthValue;
	widthUnit.value = entry.widthUnit;
	heightValue.value = entry.heightValue;
	heightUnit.value = entry.heightUnit;
	textEditorButtonStates.value.grid = Boolean(entry.grid);
	textEditorButtonStates.value.printPreview = true;
	isSavedTemplatesPanelOpen.value = false;
}
```
(`printPreview = true` reopens the preview because a template is always saved from the open preview; the paper's on-screen position is derived from the existing centered-viewport CSS and the size restore, so no position state is stored.)

4.2 Target: `src/components/ParentView.vue` template:
- On the `#text-editor-templates-panel` section tag: add `ref="templatesPanelRef"`.
- On `#text-editor-template-saved-templates-button`: add `ref="savedTemplatesButtonRef"`, `@click="toggleSavedTemplatesPanel"`, and `:aria-expanded="isSavedTemplatesPanelOpen"`.

4.3 Target: `src/components/ParentView.vue` template, inside `#text-editor-templates-panel` immediately after the Saved Templates button:
- `<section v-if="isSavedTemplatesPanelOpen" id="text-editor-saved-templates-panel" class="text-editor-saved-templates-panel" aria-label="Saved templates" title="Saved templates">` containing `<button v-for="entry in savedTemplateEntries" :key="entry.id" class="text-editor-saved-template-name-button" type="button" :data-template-id="entry.id" @click="handleSavedTemplateOpen(entry.id)">{{ entry.name }}</button>`. (No `id` attribute on the repeated buttons — `:key` + `data-template-id` identify each row without violating the duplicate-id audit in `tests/vue-audit.test.js`.)

4.4 Target: `src/css/input.css`, directly after the `.text-editor-template-commit-button` rule from step 2.4:
- `.text-editor-saved-templates-panel { position: absolute; top: var(--saved-templates-panel-top, 92px); right: 0; bottom: 0; left: 0; z-index: 10; display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; padding: 12px; overflow-y: auto; border-top: 1px solid rgba(255, 248, 190, 0.65); background: linear-gradient(180deg, #173f70 0%, #0b2342 100%); }` — `left/right/bottom: 0` make it share the Templates panel's left, right, and bottom edges exactly; the runtime-measured `top` var guarantees the 16px gap under the Saved Templates button; `z-index: 10` layers it above the panel's other buttons.
- `.text-editor-saved-template-name-button { width: 100%; min-height: 40px; border: 1px solid #171717; border-radius: 8px; background: linear-gradient(180deg, #4b4b4b 0%, #3c3c3c 33.333%, #2e2e2e 66.667%, #202020 100%); color: #fff; font-family: "Minecraft2Bold", "Trebuchet MS", sans-serif; font-size: 1rem; font-weight: 700; cursor: pointer; box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.42), inset 0 -5px 0 rgba(0, 0, 0, 0.35), 0 4px 0 #111, 0 8px 10px rgba(0, 0, 0, 0.48); }`

4.5 Check: `npx node --test tests/button-isolation.test.js tests/saved-templates.test.js tests/css-js-integrity.test.js tests/vue-audit.test.js` (the integrity/audit tests catch a missing `var()` for `--saved-templates-panel-top` and any inline-style violation).

### Phase 5 — End-to-end behavior coverage (full flow, requirements 1–6)

5.1 Target: `tests/smoke.spec.js`, directly after the existing test `"Print Preview renders the paper template at the Size menu dimensions"`. Add one new test, `"Save panel commits and Saved Templates restores a paper template"`:
- `await page.goto("./"); await page.evaluate(() => globalThis.localStorage?.removeItem("ze2.textEditor.savedTemplates")); await page.reload();` (deterministic storage, same pattern as `tests/description-edits.spec.js`).
- Open Parent → Text Editor → Templates → Editing Tools → Size; set both units to `px`; width `100`, height `50`; click `New +`.
- Click `#text-editor-template-save-button`; assert `#text-editor-template-save-panel` is visible, `boundingBox()` width `400` and height `120`, and `panel.y + panel.height <= saveButton.y + 1` (panel above the button); assert the label text `Template Name`; assert input `maxlength` is `"15"`; assert Commit's right and bottom gaps to the panel are `12` (each `toBeCloseTo(..., 1)`).
- Fill the input with `Alpha`, click Commit; assert the panel is hidden; read `localStorage` key `ze2.textEditor.savedTemplates` and assert entry `name === "Alpha"`, `widthValue === "100"`, `widthUnit === "px"`.
- Change the height unit to `in` (click `#text-editor-size-height-unit`, then `#text-editor-size-height-in-option`) and set the height value to `12` (any different size works), then click `Saved Templates`; assert `#text-editor-saved-templates-panel` is visible and its geometry: left x ≈ templates panel x, right edges ≈ equal, bottom edges ≈ equal, and panel top = Saved Templates button bottom + 16 (all `toBeCloseTo(..., 1)`); assert the first `.text-editor-saved-template-name-button` has text `Alpha`.
- Click the `Alpha` button; assert `#print-preview-paper` `boundingBox()` is back to `100 x 50`, `#text-editor-size-width` has value `"100"`, and `#text-editor-size-width-unit` has text `px`.
- Commit a second template named `Beta`, reopen Saved Templates, and assert `Beta` renders above `Alpha` (latest first).

5.2 Gate: Playwright is not automatic. Ask the user before running `npm run test:e2e -- tests/smoke.spec.js` (writes under `test-results/`).

### Phase 6 — Cleanup and final gates

6.1 Stale/shared-style cleanup:
- Target: `src/components/ParentView.vue`, `#text-editor-template-save-button`: remove the shared class `text-editor-template-new-button` so the Save button is styled only by `.text-editor-template-save-button`.
- Target: `src/css/input.css`, `.text-editor-template-save-button` rule: copy the visual declarations it currently inherits from the shared rule (border, border-radius, background gradient, color, font-family, font-size, font-weight, cursor, box-shadow) into its own rule.
- Do NOT delete or edit the shared `.text-editor-template-new-button, .text-editor-editing-tools-button, .text-editor-size-menu-button` rule — `New +`, `Editing Tools`, and `Size` still use it and an existing test asserts it.

6.2 Dead-code sweep (excluding `assets/` entirely): grep `src/` for `text-editor-template-save-`, `text-editor-saved-template`, `templateStore`, and `ze2.textEditor.savedTemplates`; confirm every new id/class/CSS var has exactly one owner (one template usage + one CSS rule), and remove only dead code created by this feature (e.g., an unused ref, an unused handler, or a superseded CSS rule). Do not remove or merge anything else.

6.3 Final checks in order: `npx node --test tests/button-isolation.test.js tests/saved-templates.test.js tests/css-js-integrity.test.js tests/vue-audit.test.js`; then, only with user approval, `npm run test:e2e -- tests/smoke.spec.js`; `npm run build` only if the user separately approves it. Record any blocked/unapproved check as `not run`, never as a pass.


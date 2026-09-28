- **Read `C:\zoologistExplorer02\rules\copilot-rules.md`**

- IMPORTANT Follow the plan 1 step at a time

- Whenever a consistency check involving the investigation of stale, unused, duplicate, or contradictory code is run against the program, do not include the "assets" folder in the check. Do not remove the assets directory or anything contained within it

1.) Make the following plan so that an ai agent with significantly less reasoning capablility can easily implement the changes as written.  Make absolutely certain that the plan is written in a way and broken up into enough phases and small enough steps that the risk of the agent making a mistake or missing something is heavily mitigated.  Make absolutely certain that the plan uses file targeting for each individual step when applicable.  Do not simply write a rule or goal which contains all the files that need to be targeted across the board.  Output the plan, starting at line 49 in plan.md.  Once you have written the plan, read through it again and make absolutely certain that the rule involving everything being separated as far as being identified in the code for styling, position, functionality, behavior of any kind, etc ... to make it simple and easy to debug and edit that code.  Make sure to include any useful tests and any points where they may specifically be useful where they will not be run automatically as according to any rule that copilot would automatically follow.  Be precise.  If you find after reading through the plan that it needs editing to be in compliance with the instructions I've dictated in this step then rewrite it to be in compliance and read through the plan again after you've replaced the other plan starting at line 25, and make sure it's in compliance again and follow this circle until you are satisfied that all the rules I've dictated in this step have been completely honored

- Goal:

    - When the Explorer Positions button is activated and in addition to the Resize and Move functions it adds to the Progress screen, create a button labeled: "Save".

        - Place the "Save" button inside the Progress screen to the right of the Move button.

        - Place a 16 pixel gap between the right edge of the Move button and the left edge of the "Save" button.   

        - Give the "Save" button the same exact size, shape, depth, font style and font size as the Move button, only make it bright yellow.

        - When the "Save" button is depressed it should stay depressed until it is clicked on a second time.

        - When the "Save" button is activated, 15 more buttons should pop up on the screen with the following labels and in the following order: "Save 1", "Save 2", "Save 3", "Save 4", "Save 5", "Save 6", "Save 7", "Save 8", "Save 9", "Save 10", "Save 11", "Save 12", "Save 13", and "Commit" and "Test".

            - The 13 save buttons and the commit button should appear directly underneath the XP bar, with a 16 pixel gap between the bottom of the XP bar and the top of the first row of save buttons.

            - The 15 buttons should appear in the following order: "Save 1", "Save 2", "Save 3"\n"Save 4", "Save 5", "Save 6"\n"Save 7", "Save 8", "Save 9"\n"Save 10", "Save 11", "Save 12"\n, "Save 13" should be directly underneath "Save 11", "Commit" should be directly underneath "Save 12", and "Test" should be directly under "Save 13".

            - Put a 16 pixel gap between each button in each row and a 16 pixel gap between each button in each column.

        - When any of the 13 save buttons are depressed, it should turn bright green and stay bright green until it is pressed a second time.

        - Each of the 13 save buttons should be bright yellow with a black font color and they should each be 60 pixels wide and 25 pixels high.

        - The "Commit" button should be bright green with a black font color and it should be 60 pixels wide and 25 pixels high.

        - The "Test" button should be bright red with a black font color and it should be 60 pixels wide and 25 pixels high.

        - By default, the "Test" button should have no function and do absolutely nothing when clicked.

        - Every one of the numbered save buttons will save a different position of the following asset: C:\zoologistExplorer02\assets\images\characters\railiFront.webp on the Progress screen.  I will move the asset to a position on the screen and click on "Save 1" and I want that position to be temporarily saved into the "Save 1" slot until or unless, at a later time, I put the asset on another position on the "Progress" screen and click "Save 1" again, at which point I want the latest "Save 1" activation to override the previous saved position.  I want this concept to apply to all 13 save buttons. 

        - Once I click on the "Commit" button, I want all 13 of the asset's positions to be permenently saved in the program unless or until I, at a later time, decide to change the asset's positions by going through this process again.

        - After the "Commit" has been clicked, then and only then will the "Test" button become clickable and have the following function:

            - Clicking on the "Test" button for the first time after the "Commit" button has been clicked will assign the asset to its "Save 1" position and every time the "Test" button is clicked afterward the asset will move to the next saved position, in order I.E. "Save 2" position, "Save 3" position, "Save 4" position, etc ...  When it reaches "Save 13" and "Test" is clicked again, start over by assigning the asset to its "Save 1" position

        - Anytime the asset moves from one position to the next I.E. the asset moves from the position at "Save 1" to the position at "Save 2", etc... 20 XP has been earned and 1 segment of the XP bar should be filled in starting from the left and having every subsequent instance of 20 XP being earned filling in the left most segment of the XP bar that hasn't already been filled in, yet.

# Implementation Plan: Explorer Positions Save/Commit/Test system

Rule: implement Phases A through F strictly in order. Each phase names its target file(s). Never touch the `assets/` folder. Never edit files not listed in the current phase. After each phase run ONLY that phase's validation command.

Authoritative facts (verified against the codebase):
- The Progress screen is the Student > Progress tab in `src/components/StudentNavigation.vue` (`activeStudentMenu === 'progress'`). It is NOT the Parent > Progress Game screen.
- The dock `#student-progress-resize-dock` already has `gap: 16px`, so the Save button's 16px gap from the Move button is inherited; do NOT add any margin for this.
- The Move button CSS is `.student-progress-move-button` / `:hover` / `:active` / `--engaged` in `src/css/input.css` (around line 1816). The Save button copies these four blocks VERBATIM with only color tokens changed (the exact blocks are given in Phase B step B5 below).
- The Raili position lives in the CSS variables `--student-raili-offset-x` and `--student-raili-offset-y` on `#student-progress-raili-frame`; the helper `applyRailiOffset(x, y)` already exists in StudentNavigation.vue. The live-position localStorage keys `ze2.studentProgress.railiOffsetXPx` and `ze2.studentProgress.railiOffsetYPx` are OFF LIMITS; never write to them from this feature.
- XP: `src/js/blockCompletionState.js` computes `totalXp` capped at `XP_LEVEL_CAP = 240`; the bar is 14 segments of 20 XP each. 13 test moves = 260 XP, so the bar tops out at 12 filled segments. This is EXPECTED, not a bug; do not raise the cap.
- Audit rules the code must satisfy (run by `npm run test:structure`):
  - Every `<button>` needs a static unique `id`, `type="button"`, and a class used by NO other button anywhere. NO `v-for` buttons and NO `:id` bindings (bound id strings collide in the audit).
  - No inline `style=""` attributes; no dynamically constructed class strings.
  - All new selectors go in `src/css/input.css` (global stylesheet). Do NOT add new selectors to StudentNavigation.vue's `<style scoped>` block (its scoped selectors must start with `student-` and its ownership entry already exists; leaving the scoped block untouched avoids the prefix audit entirely).
  - Every class in input.css must appear in app source (stale-selector audit); the selectors in this plan are all used by Phase C markup, so add no extras.
  - Identical declarations across DIFFERENT selectors are fine and intentional (isolation); the same selector duplicated with an identical declaration list fails the audit.
  - Do not run stale/unused/duplicate/consistency checks against the `assets/` folder, and do not remove it or anything in it.

## Phase A — Store: bonus XP plumbing
Target: `src/js/blockCompletionState.js` only.

A1. In the `reactive({...})` state object add the property `bonusXp: 0,` after `level: 0,`.

A2. In the `totalXp` computed, change the second argument of `Math.min(` from `Object.values(state.completedBlockKeys).filter(Boolean).length * XP_PER_COMPLETED_BLOCK` to `Object.values(state.completedBlockKeys).filter(Boolean).length * XP_PER_COMPLETED_BLOCK + state.bonusXp`. Keep the 240 cap exactly as is.

A3. Add this function after `markBlockIncomplete` and add `addBonusXp` to the `blockCompletionStore` export object:

```js
/** Add XP earned outside of block completion (Explorer Positions test moves). */
function addBonusXp(amount) {
	if (!Number.isFinite(amount) || amount <= 0) {
		return;
	}
	state.bonusXp += amount;
}
```

A4. Validate: run `node --test tests/xp-bar.test.js`. It must pass unchanged.

## Phase B — Dock Save button
Targets: `src/components/StudentNavigation.vue`, `src/css/input.css`.

B1. Script: after the `isMoveModeActive` ref line add `const isSaveModeActive = ref(false);`.

B2. Script: after `handleMoveToggle` add:

```js
/** Save mode toggle pipeline boundary. */
function handleSaveToggle() {
	isSaveModeActive.value = !isSaveModeActive.value;
}
```

B3. In BOTH watchers that currently set `isResizeModeActive.value = false;` and `isMoveModeActive.value = false;` (the `explorerPositionsModeActive` watcher and the `activeStudentMenu` watcher), add `isSaveModeActive.value = false;` on the next line in the same places.

B4. Template: inside `#student-progress-resize-dock`, immediately AFTER the Move button's closing `</button>`, paste EXACTLY:

```html
				<button
					id="student-progress-save-button"
					class="student-progress-save-button"
					type="button"
					name="student-progress-save-button"
					data-button-name="student-progress-save-button"
					aria-label="Toggle save slots"
					title="Toggle save slots"
					:aria-pressed="isSaveModeActive"
					:class="{ 'student-progress-save-button--engaged': isSaveModeActive }"
					@click="handleSaveToggle"
				>
					Save
				</button>
```

B5. CSS: in `src/css/input.css`, immediately AFTER the `.student-progress-move-button--engaged { ... }` block, paste EXACTLY these four blocks (a byte-copy of the Move button blocks with yellow color tokens; the size, shape, and font declarations stay identical at 116px by 40px, pill radius, `font: inherit; font-weight: 700`):

```css
.student-progress-save-button {
	width: 116px;
	height: 40px;
	border: 1px solid rgba(161, 98, 7, 0.6);
	border-radius: 9999px;
	background: linear-gradient(180deg, #fef9c3 0%, #fde047 45%, #eab308 100%);
	color: #3f2700;
	font: inherit;
	font-weight: 700;
	cursor: pointer;
	box-shadow:
		inset 0 2px 0 rgba(255, 255, 255, 0.75),
		inset 0 -4px 0 rgba(161, 98, 7, 0.3),
		0 6px 0 rgba(133, 77, 14, 0.55),
		0 10px 14px rgba(15, 23, 42, 0.3);
	transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease;
}

.student-progress-save-button:hover {
	transform: translateY(-1px);
	filter: brightness(1.04);
	box-shadow:
		inset 0 2px 0 rgba(255, 255, 255, 0.8),
		inset 0 -4px 0 rgba(161, 98, 7, 0.28),
		0 8px 0 rgba(133, 77, 14, 0.6),
		0 12px 16px rgba(15, 23, 42, 0.32);
}

.student-progress-save-button:active {
	transform: translateY(4px);
	box-shadow:
		inset 0 2px 0 rgba(255, 255, 255, 0.6),
		inset 0 -2px 0 rgba(161, 98, 7, 0.25),
		0 2px 0 rgba(133, 77, 14, 0.55),
		0 0 12px rgba(250, 204, 21, 0.6);
}

.student-progress-save-button--engaged {
	transform: translateY(4px);
	box-shadow:
		inset 0 2px 0 rgba(255, 255, 255, 0.6),
		inset 0 -2px 0 rgba(161, 98, 7, 0.25),
		0 2px 0 rgba(133, 77, 14, 0.55),
		0 0 12px rgba(250, 204, 21, 0.6);
}
```

B6. Validate: run `npm run lint` and `node --test tests/button-isolation.test.js tests/vue-audit.test.js tests/css-js-integrity.test.js`.

## Phase C — 15-button grid markup + CSS
Targets: `src/components/StudentNavigation.vue` (template), `src/css/input.css`.

C1. Template: immediately AFTER the closing `</div>` of the `.student-progress-xp-bar-slot` div, paste the grid container below. The DOM order of children MUST be: Save 1, Save 2, ..., Save 12, Save 13, Commit, Test. Each of the 13 save buttons follows the exact pattern shown for Save 1 with N = 1..13 (write all 13 literally; NO `v-for`, NO `:id`):

```html
			<div
				v-if="activeStudentMenu === 'progress' && explorerPositionsModeActive && isSaveModeActive"
				id="student-progress-save-grid"
				class="student-progress-save-grid"
				role="group"
				aria-label="Saved positions"
				title="Saved positions"
				data-container-name="student-progress-save-grid"
			>
				<button
					id="student-progress-save-1-button"
					class="student-progress-save-1-button"
					type="button"
					name="student-progress-save-1-button"
					data-button-name="student-progress-save-1-button"
					aria-label="Save position 1"
					title="Save position 1"
					:aria-pressed="Boolean(saveSlotEngaged[1])"
					:class="{ 'student-progress-save-1-button--engaged': saveSlotEngaged[1] }"
					@click="handleSaveSlot(1)"
				>
					Save 1
				</button>
				<!-- repeat the button block identically for N = 2 through 13, swapping every 1 for N in id, class, name, data-button-name, aria-label, title, :class engaged key, handleSaveSlot argument, and label text -->
				<button
					id="student-progress-commit-button"
					class="student-progress-commit-button"
					type="button"
					name="student-progress-commit-button"
					data-button-name="student-progress-commit-button"
					aria-label="Commit saved positions"
					title="Commit saved positions"
					@click="handleCommit"
				>
					Commit
				</button>
				<button
					id="student-progress-test-button"
					class="student-progress-test-button"
					type="button"
					name="student-progress-test-button"
					data-button-name="student-progress-test-button"
					aria-label="Test saved positions"
					title="Test saved positions"
					:disabled="!isTestEnabled"
					@click="handleTest"
				>
					Test
				</button>
			</div>
```

C2. CSS: in `src/css/input.css`, after the Phase B blocks, paste EXACTLY:

```css
.student-progress-save-grid {
	display: grid;
	grid-template-columns: repeat(3, 60px);
	gap: 16px;
	margin-top: 16px;
	justify-content: center;
	width: 100%;
}
```

C3. Then one block per N = 1..13 (13 blocks, identical declarations, only the selector's number changes):

```css
.student-progress-save-1-button {
	width: 60px;
	height: 25px;
	border: 1px solid #a16207;
	border-radius: 6px;
	background: #fde047;
	color: #000000;
	font-size: 0.7rem;
	font-weight: 700;
	cursor: pointer;
}
```

C4. Then one engaged block per N = 1..13 (13 blocks):

```css
.student-progress-save-1-button--engaged {
	background: #22c55e;
	color: #000000;
}
```

C5. Then paste EXACTLY:

```css
.student-progress-save-13-button {
	grid-column: 2;
}

.student-progress-commit-button {
	width: 60px;
	height: 25px;
	border: 1px solid #14532d;
	border-radius: 6px;
	background: #22c55e;
	color: #000000;
	font-size: 0.7rem;
	font-weight: 700;
	cursor: pointer;
	grid-column: 3;
}

.student-progress-test-button {
	width: 60px;
	height: 25px;
	border: 1px solid #7f1d1d;
	border-radius: 6px;
	background: #ef4444;
	color: #000000;
	font-size: 0.7rem;
	font-weight: 700;
	cursor: pointer;
	grid-column: 2;
}

.student-progress-test-button:disabled {
	cursor: default;
	opacity: 0.55;
}
```

NOTE: `.student-progress-save-13-button` intentionally gets TWO rule blocks (one sizing block from C3 and one placement block here). The duplicate-selector audit only flags identical declaration lists, and these two are different, so this passes. Resulting layout: rows Save 1-3 / Save 4-6 / Save 7-9 / Save 10-12, then Save 13 (under Save 11) with Commit (under Save 12), then Test (under Save 13). All row and column gaps are 16px, and the grid's `margin-top: 16px` creates the required 16px gap below the XP bar.

C6. Validate: run `npm run test:structure`.

## Phase D — Save/Commit/Test behavior (script only)
Target: `src/components/StudentNavigation.vue` script section only.

D1. After the existing storage-key constants add: `const RAILI_COMMITTED_POSITIONS_STORAGE_KEY = "ze2.studentProgress.railiCommittedPositions";`.

D2. After the mode refs add:

```js
const saveSlotEngaged = ref({});
const savedPositions = ref({});
const committedPositions = ref({});
const isTestEnabled = ref(false);
let testCycleIndex = 0;
```

D3. After `handleRailiMoveEnd` add these four functions EXACTLY:

```js
/** Read the Raili frame's current pixel offsets. */
function readCurrentRailiOffset() {
	return {
		x: Math.round(
			Number.parseFloat(railiFrameRef.value?.style.getPropertyValue("--student-raili-offset-x") ?? "0"),
		) || 0,
		y: Math.round(
			Number.parseFloat(railiFrameRef.value?.style.getPropertyValue("--student-raili-offset-y") ?? "0"),
		) || 0,
	};
}

/** Save the current Raili position into a slot and toggle the slot's engaged look. */
function handleSaveSlot(slotNumber) {
	savedPositions.value[slotNumber] = readCurrentRailiOffset();
	saveSlotEngaged.value[slotNumber] = !saveSlotEngaged.value[slotNumber];
}

/** Permanently commit all 13 saved slots and enable Test mode. */
function handleCommit() {
	committedPositions.value = { ...savedPositions.value };
	localStorage.setItem(
		RAILI_COMMITTED_POSITIONS_STORAGE_KEY,
		JSON.stringify(committedPositions.value),
	);
	isTestEnabled.value = true;
}

/** Cycle Raili through the committed slots, awarding 20 XP per move. */
function handleTest() {
	if (!isTestEnabled.value) {
		return;
	}

	for (let step = 0; step < 13; step += 1) {
		testCycleIndex = (testCycleIndex % 13) + 1;
		const position = committedPositions.value[testCycleIndex];
		if (position) {
			applyRailiOffset(position.x, position.y);
			blockCompletionStore.addBonusXp(20);
			return;
		}
	}
}
```

D4. In `onMounted`, BEFORE its closing `});`, add:

```js
	const storedPositions = localStorage.getItem(RAILI_COMMITTED_POSITIONS_STORAGE_KEY);
	if (storedPositions) {
		try {
			const parsedPositions = JSON.parse(storedPositions);
			if (parsedPositions && typeof parsedPositions === "object") {
				committedPositions.value = parsedPositions;
				savedPositions.value = { ...parsedPositions };
				isTestEnabled.value = true;
			}
		} catch {
			localStorage.removeItem(RAILI_COMMITTED_POSITIONS_STORAGE_KEY);
		}
	}
```

D5. Validate: run `npm run lint`, then `npm run test:structure`.

## Phase E — Test coverage
Target: `tests/explorer-positions-mode.test.js` only. Append ONE new `test(...)` block at the end of the file. Do not modify the existing tests and do not edit `package.json` (the `test:structure` script already includes this file). The new test must assert EXACTLY these:

In `src/components/StudentNavigation.vue` (one `assert.match` per item): `student-progress-save-button`, `student-progress-save-button--engaged`, `isSaveModeActive`, `handleSaveToggle`, `student-progress-save-grid`, `student-progress-commit-button`, `student-progress-test-button`, `handleSaveSlot`, `handleCommit`, `handleTest`, `ze2\.studentProgress\.railiCommittedPositions`, `addBonusXp\(20\)`; plus all 13 numbered ids via a loop:

```js
for (let n = 1; n <= 13; n += 1) {
	assert.match(studentSource, new RegExp(`student-progress-save-${n}-button`));
}
```

In `src/css/input.css` (one `assert.match` per item): `/\.student-progress-save-grid\s*\{[^}]*repeat\(3, 60px\)[^}]*gap:\s*16px/s`, `/\.student-progress-save-button\s*\{[^}]*width:\s*116px;[^}]*height:\s*40px;/s`, `#fde047`, `#22c55e`, `#ef4444`, `width:\s*60px`, `height:\s*25px`, `grid-column:\s*2`, `grid-column:\s*3`.

In `src/js/blockCompletionState.js`: `bonusXp`, `addBonusXp`.

E1. Validate: run `npm run test` (the full suite: lint + structure + asset paths).

## Phase F — Manual behavioral verification (REQUIRED; do not claim success from passing tests alone)
F1. Run `npm run dev` and open the app.
F2. Go to Parent > Student Edits > Curriculum Game and toggle Explorer Positions ON, then open Student > Progress.
F3. Confirm: the Save button sits to the right of the Move button with a 16px gap, has the same 116x40 pill size and font as Move, is bright yellow, and toggles depressed/raised on each click.
F4. Toggle Save ON and confirm the grid appears under the XP bar: rows of Save 1-3, Save 4-6, Save 7-9, Save 10-12, then Save 13 under Save 11 with Commit under Save 12, then Test under Save 13; 16px gaps everywhere; each button 60x25; Test starts disabled.
F5. Move-drag Raili, click Save 1 (it turns green and stays green). Move Raili again, click Save 3. Click Commit. Click Test: Raili jumps to the Save 1 position and one leftmost unfilled XP segment fills. Click Test again: Raili jumps to Save 3 (skipping the never-saved Save 2 slot) and one more segment fills.
F6. Reload the page, return to Student > Progress, and confirm Test is still enabled and cycles through the committed positions.
F7. Record the results. Any failure means stop and diagnose only the failed step before touching anything else.

## Decisions and assumptions
- Numbered saves are session-temporary (in memory only, overridable on every press); only Commit writes to localStorage. On reload, committed positions are restored and Test is re-enabled.
- The 240-XP cap is unchanged, so at most 12 of the 14 segments fill from 13 moves; segments 13-14 stay reserved as documented in ProgressXpBar.vue.
- Test skips never-saved slots (the spec is silent; skipping matches "move to the next saved position").
- Excluded: the `assets/` folder is never audited or modified; no Playwright spec is added unless separately requested; Move/Resize behavior is unchanged; the live-position storage keys are untouched.











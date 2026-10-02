- **Read `C:\zoologistExplorer02\rules\copilot-rules.md`**

- Whenever a consistency check involving the investigation of stale, unused, duplicate, or contradictory code is run against the program, do not include the "assets" folder in the check. Do not remove the assets directory or anything contained within it

- Make absolutely certain that the plan is written in a way and broken up into enough phases and small enough steps that the risk of the agent making a mistake or missing something is heavily mitigated.  Make absolutely certain that the plan uses file targeting for each individual step when applicable.  Do not simply write a rule or goal which contains all the files that need to be targeted across the board.  Output the plan, starting at line 25 in plan.md.  Once you have written the plan, read through it again and make absolutely certain that the rule involving everything being separated as far as being identified in the code for styling, position, functionality, behavior of any kind, etc ... to make it simple and easy to debug and edit that code.  Make sure to include any useful tests and any points where they may specifically be useful where they will not be run automatically as according to any rule that copilot would automatically follow.  Be precise.  If you find after reading through the plan that it needs editing to be in compliance with the instructions I've dictated in this step then rewrite it to be in compliance and read through the plan again after you've replaced the other plan starting at line 25, and make sure it's in compliance again and follow this circle until you are satisfied that all the rules I've dictated in this step have been completely honored

1.) **Phase 1: Verify the selection summary (Goal 1)**

    - Target `src/components/StudentEditsView.vue` for selection state, computed summary values, and summary markup; target `src/css/input.css` only for summary placement and spacing.
    - Show the temporary summary when any date, subject, or block selection exists. Render a complete selected date as `mm/dd/yy`, then the selected subject, then the selected block or `All`, with 16px gaps between fields.
    - Add focused source assertions in `tests/description-edits.test.js`. Validate with `node --test tests/description-edits.test.js`.

2.) **Phase 2: Keep mode buttons dimensionally stable (Goal 2)**

    - Target `src/components/StudentEditsView.vue` only if mode selection markup or pressed state changes button dimensions; target `src/css/input.css` for the two distinct button selectors and panel layout.
    - Preserve identical button dimensions and bottom spacing before and after either mode is selected. Do not alter the other mode's styling while changing one selector.
    - Validate source/layout invariants with `node --test tests/description-edits.test.js`, then measure both button boxes before and after selection in the focused browser flow in Phase 7.

3.) **Phase 3: Reopen existing text for editing (Goal 3)**

    A.) Target `src/components/StudentEditsView.vue` and `src/js/blockDescriptionState.js` for Description-specific selection and saved-text behavior. Keep this path separate from Play by Play.
    B.) Target the same files for a distinct Play by Play path. Do not introduce a shared handler or storage key for the two content types.
    C.) Preserve the existing text until the user saves edits. Add separate Description and Play by Play tests in `tests/description-edits.test.js`; validate after each substep with `node --test tests/description-edits.test.js`.

4.) **Phase 4: Match the calendar Play by Play color to Description**

    - Target `src/components/CalendarView.vue` only if its Play by Play markup needs a class or structure change; target `src/css/input.css` for the two daily-menu container color rules.
    - Keep Description and Play by Play selectors distinct. Change only the Play by Play background colors to match the Description container; preserve sizing, placement, scroll behavior, and text formatting.
    - Add or update the focused CSS/source assertion in `tests/description-edits.test.js`.
    - Validate with `node --test tests/description-edits.test.js` before moving on.

5.) **Phase 5: Rename each Commit control to Save independently**

    - In `src/components/StudentEditsView.vue`, change the Description label, accessible name, and title on the Description control only; separately change the Play by Play label, accessible name, and title on its control only.
    - Keep separate selectors and behavior. Update the corresponding mode-specific assertions in `tests/description-edits.test.js`.
    - Validate with `node --test tests/description-edits.test.js`.

6.) **Phase 6: Add independent Load workflows**

    A.) **Description workflow**

        1. Target `src/components/StudentEditsView.vue` for Description-only Load button markup, selected-value gating, editing state, and handlers. Keep Description button IDs, classes, labels, styles, and handlers distinct from Play by Play.
        2. Target `src/js/blockDescriptionState.js` only if the Description store needs a focused read or per-block overwrite API. Do not change Play by Play storage behavior in this substep.
        3. For one selected block, Load its saved Description into an editable field. For All Blocks, show one editable field when all non-empty saved values are identical; otherwise show a separately editable, labeled field for each block with saved text. Keep overflow inside a right-aligned scroll region.
        4. Do not mutate saved data while editing. Save only changed block values, overwrite those same date/subject/block keys, then clear the loaded fields and focus the blank Description editor at its upper-left start position.
        5. Keep Load visibly disabled and 2D until date, subject, and block are all selected. Center the Description row controls without changing Play by Play styling.
        6. Add focused Description behavior and storage tests to `tests/description-edits.test.js`; validate with `node --test tests/description-edits.test.js`.

    B.) **Play by Play workflow**

        1. Target `src/components/StudentEditsView.vue` for separately named Play by Play Load markup, gating, editor state, and handlers. Do not reuse the Description Load/Save handler or styling.
        2. Target `src/js/blockDescriptionState.js` only for a Play by Play-specific read or per-block overwrite API; keep its storage key separate from descriptions.
        3. Apply the same single-block and All Blocks display rules to Play by Play values, using Play by Play-specific editable fields and scroll styling.
        4. Save only changed Play by Play block values to their original keys, overwrite those keys, clear the loaded fields, and focus the blank Play by Play editor at its upper-left start position.
        5. Keep its Load state and row layout independently styled and gated by the same three selections.
        6. Add Play by Play-specific tests to `tests/description-edits.test.js`; validate with `node --test tests/description-edits.test.js`.

7.) **Phase 7: Verify the complete user flow**

    - Target `tests/description-edits.spec.js` for browser coverage of both independent menus, selection summary, Load enablement, single-block edits, All Blocks identical and differing values, overwrite-on-Save, clearing/focus after Save, and scrolling for overflow.
    - Run the focused unit test with `node --test tests/description-edits.test.js` and the focused browser test with `npm run test:e2e -- tests/description-edits.spec.js`. These checks are not included in the default automatic test command; report each result separately.
    - In the browser, verify the selection summary formatting and that Description and Play by Play buttons retain identical dimensions and bottom spacing before and after mode selection. Confirm the Play by Play daily-menu container visually matches the Description container.

**Workflow constraints**

- Preserve the existing Description and Play by Play storage keys and do not include or modify `assets/` for consistency checks or implementation.
- Keep markup, state, handlers, CSS selectors, and tests separate for Description and Play by Play. Do not introduce a shared generic Load/Save workflow.
- After each phase, run only that phase's listed focused test. If a non-aesthetic test fails, stop, inspect the relevant owning code and call sites, and make the smallest in-scope correction before continuing. Do not retain a failed speculative change unless it is independently required.
- Do not add placeholder behavior, unrelated cleanup, or generated output. Build and broader suites are separate checks and are not part of these phases unless explicitly authorized.





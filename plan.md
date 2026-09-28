- **Read `C:\zoologistExplorer02\rules\copilot-rules.md`**

- IMPORTANT Follow the plan 1 step at a time

- Whenever a consistency check involving the investigation of stale, unused, duplicate, or contradictory code is run against the program, do not include the "assets" folder in the check. Do not remove the assets directory or anything contained within it

1.) Run the following tests one at a time: 

A.) C:\zoologistExplorer02\tests\asset-paths.test.js

B.) C:\zoologistExplorer02\tests\button-isolation.test.js

C.) C:\zoologistExplorer02\tests\css-js-integrity.test.js

D.) C:\zoologistExplorer02\tests\explorer-positions-mode.test.js

E.) C:\zoologistExplorer02\tests\menu-panel-separation.test.js

F.) C:\zoologistExplorer02\tests\page-container-separation.test.js

G.) C:\zoologistExplorer02\tests\raili-resize-persist.spec.js

H.) C:\zoologistExplorer02\tests\september-day-gate.spec.js

I.) C:\zoologistExplorer02\tests\smoke.spec.js

J.) C:\zoologistExplorer02\tests\vue-audit.test.js

K.) C:\zoologistExplorer02\tests\xp-bar.test.js

L.) C:\zoologistExplorer02\tests\xp-level-reset.test.js

M.) ESLint

N.) Playwright

Any errors or warnings found post in plan.md starting at line 39

- Validation results recorded in order:
  - A. asset-paths.test.js: PASS (1/1)
  - B. button-isolation.test.js: PASS (5/5)
  - C. css-js-integrity.test.js: PASS (3/3)
  - D. explorer-positions-mode.test.js: PASS (3/3)
  - E. menu-panel-separation.test.js: PASS (1/1)
  - F. page-container-separation.test.js: PASS (1/1)
  - G. raili-resize-persist.spec.js: FAIL when run via `node --test` with: "Playwright Test did not expect test() to be called here." This file is a Playwright spec and should be run through Playwright, not Node's test runner.
  - H. september-day-gate.spec.js: FAIL when run via `node --test` with: "Playwright Test did not expect test() to be called here." This file is a Playwright spec and should be run through Playwright, not Node's test runner.
  - I. smoke.spec.js: FAIL when run via `node --test` with: "Playwright Test did not expect test() to be called here." This file is a Playwright spec and should be run through Playwright, not Node's test runner.
  - J. vue-audit.test.js: PASS (5/5)
  - K. xp-bar.test.js: PASS (4/4)
  - L. xp-level-reset.test.js: PASS (2/2)
  - M. ESLint: 55 warnings, 0 errors. Warning categories are primarily Vue attribute-order/formatting issues across App.vue, CalendarView.vue, DayCellInteraction.vue, ProgressXpBar.vue, RewardsView.vue, StudentEditsView.vue, and StudentNavigation.vue. 53 warnings are auto-fixable with `eslint --fix`.
  - N. Playwright: PASS (35 passed in 10.4s via `npx playwright test`).

- Summary: All requested Node-based checks passed individually, the ESLint warnings are non-blocking but should be cleaned up, and the Playwright specs pass only when executed through the project's Playwright runner rather than `node --test`.



            

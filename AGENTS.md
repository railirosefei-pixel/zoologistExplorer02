# Agent operating rules

## Mandatory plan obedience

- Read the current plan from disk before taking any action.
- Follow the plan in numbered order; do not skip ahead or infer the next step.
- If a step's precondition is not satisfied, stop and do not edit.
- Treat the current numbered step as the only authorized action until it is completed.

## Required state before any edit

- Before any implementation prompt or edit, declare the target in the form: `Target: <path> — <function/section>`.
- If the target is not yet known, use `Target: needs discovery` and do only read-only discovery.
- State the exact fact being verified before making a change.

## Scope controls

- Do not edit beyond the exact approved target and side effects.
- No speculative fix based only on a likely selector or a likely root cause.
- No broad cleanup while the current plan step is pending.
- No extra checks beyond the current step unless they are explicitly required by the plan or a safety gate.
- `plan.md` is authoritative for the current implementation step.
- Before editing, identify the exact target file, symbol or section, and the fact being verified.
- Make the smallest change that can satisfy the current step.
- Do not add features, refactor adjacent code, or create components unless explicitly requested.
- Preserve `plan.md` during reverts; never use a broad restore operation when a file-specific restore is sufficient.

## Required pre-edit contract

- Before implementation, state the current code path, the exact defect or missing behavior, the approved files to change, and one focused validation check.
- If the requested behavior or scope is ambiguous, stop and ask instead of inferring additional requirements.
- Separate diagnosis from implementation; do not edit while still mapping multiple plausible code paths.

## Verification contract

- Validate the requested behavior directly whenever possible; compilation alone does not prove a UI or layout requirement.
- Do not claim success from a passing build when the requested behavior has not been observed or asserted.
- If validation is unavailable, report it as blocked or not run rather than treating it as a pass.

## Safety and verification

- After each meaningful batch of edits, run only the checks relevant to that batch.
- Record unavailable or blocked checks as `not run` or `blocked`; never treat them as passes.
- If a validation fails, diagnose the failed step only and stop before making a broader change.

## Priority rule

If a rule appears in multiple sources, the more specific repository rule wins, and the current plan step wins over general guidance.

## Authority order

When rules overlap or conflict, follow this order: the current numbered plan step > the task-specific plan file > repository operating rules in AGENTS.md > project engineering rules in rules/copilot-rules.md > general system/developer guidance.

## Minimal conversation output

- Send one brief pre-tool notice only when tools are required.
- Omit routine progress narration.
- Send additional updates only for blockers, failed validation, or meaningful scope changes.
- End successful coding tasks with `Done.`.

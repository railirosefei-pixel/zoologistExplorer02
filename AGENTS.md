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

## Safety and verification

- After each meaningful batch of edits, run only the checks relevant to that batch.
- Record unavailable or blocked checks as `not run` or `blocked`; never treat them as passes.
- If a validation fails, diagnose the failed step only and stop before making a broader change.

## Priority rule

If a rule appears in multiple sources, the more specific repository rule wins, and the current plan step wins over general guidance.

## Authority order

When rules overlap or conflict, follow this order: the current numbered plan step > the task-specific plan file > repository operating rules in AGENTS.md > project engineering rules in rules/copilot-rules.md > general system/developer guidance.

## Rule conflict gate

Before continuing with any task, explicitly alert the user about any rule statements across all active rule sources that contradict one another, are redundant, or have meaningful overlap. Do not continue with the task until that rule conflict has been resolved or explicitly overridden by the current plan step and the user-approved target.

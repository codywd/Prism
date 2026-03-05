---
description: Review current work and file GitHub issues for anything that needs tracking
---

You are performing a self-review of your recent work in this session. Your goal is to identify anything that should be tracked as a GitHub issue but was not addressed in the current task scope.

## Process

1. **Review what you just built or changed.** Look at the git diff (`git diff --stat` and `git diff` for details) to see what changed in this session.

2. **Scan for issue-worthy observations in these categories:**

   - **Bugs you noticed but didn't fix** because they were outside the current task scope
   - **Technical debt** you introduced intentionally (shortcuts, TODOs, hardcoded values, missing error handling)
   - **Parser edge cases** you discovered from AI model responses
   - **Prompt quality issues** you observed in decomposition output
   - **Enhancements** you thought of that would improve the system but aren't in the current phase
   - **Missing tests** for edge cases you encountered but didn't write tests for
   - **Documentation gaps** where the spec, CLAUDE.md, or ADRs don't cover something you had to figure out

3. **Check existing issues first** to avoid duplicates:
   ```
   gh issue list --label claude-filed --state open
   ```

4. **For each issue-worthy observation, file it:**
   ```
   gh issue create \
     --title "..." \
     --body "..." \
     --label "claude-filed,<type-label>,<phase-label>,<priority-label>"
   ```

5. **Report what you filed.** Give a brief summary of each issue created with its number and title.

## Rules

- Every issue you create MUST have the `claude-filed` label so they're easily filtered.
- Always add a phase label (`phase-1`, `phase-2`, `phase-3`, `phase-4`).
- Always add a priority label (`priority-high`, `priority-medium`, `priority-low`).
- Use the issue templates in `.github/ISSUE_TEMPLATE/` as a guide for body structure, but you can use `--body` directly rather than interactive template selection.
- Do NOT file issues for things that are already tracked in `docs/PHASE1_TASKS.md` as upcoming work.
- Do NOT file issues for things that are working correctly and are just "nice to haves" without clear value.
- DO file issues for anything tagged with TODO, FIXME, HACK, or WORKAROUND in the code.
- If you find no issues to file, say so. Don't manufacture issues.

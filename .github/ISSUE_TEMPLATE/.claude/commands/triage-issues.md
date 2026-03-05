---
description: Review open GitHub issues and optionally pick one to work on
---

Review the current state of open issues and help prioritize or resolve them.

## Process

1. **Fetch open issues:**
   ```
   gh issue list --state open --limit 30
   ```

2. **Summarize by category:**
   - Group by label (bug, tech-debt, prompt-quality, enhancement, parser)
   - Note priorities
   - Flag any `blocked` or `needs-discussion` issues

3. **Identify quick wins:**
   - Any `priority-high` issues in the current phase?
   - Any issues that could be resolved in under 15 minutes?
   - Any issues that are now invalid because the code has changed?

4. **Ask the user** if they want to:
   - Tackle a specific issue
   - Close any that are resolved or stale
   - Reprioritize anything

If the user says to pick one, choose the highest-priority issue in the current phase and work on it. Close the issue with a reference to the fix when done.

---
description: Quickly file a GitHub issue for something noticed during development
allowed-tools:
  - Bash
---

File a GitHub issue based on what the user describes (or what you just encountered). Use the `gh` CLI.

1. Determine the appropriate template type: bug, tech-debt, enhancement, prompt-quality, or ai-response-edge-case
2. Check for duplicates: `gh issue list --label claude-filed --state open --search "<keywords>"`
3. Create the issue with appropriate labels (always include `claude-filed`)
4. Report the issue number and URL

Keep it fast. Don't overthink the body. Capture the observation while it's fresh.

#!/usr/bin/env bash
# Setup GitHub labels for the Prism project.
# Run once after creating the repo: ./scripts/setup-labels.sh
#
# Requires: gh CLI authenticated (gh auth login)

set -euo pipefail

REPO="${1:-}"

if [ -z "$REPO" ]; then
  echo "Usage: ./scripts/setup-labels.sh owner/repo"
  echo "Example: ./scripts/setup-labels.sh cdostal/prism"
  exit 1
fi

echo "Setting up labels for $REPO..."

# Delete default labels that we don't use
for label in "documentation" "duplicate" "good first issue" "help wanted" "invalid" "question" "wontfix"; do
  gh label delete "$label" --repo "$REPO" --yes 2>/dev/null || true
done

# Type labels
gh label create "bug"                 --repo "$REPO" --color "d73a4a" --description "Something is broken" --force
gh label create "tech-debt"           --repo "$REPO" --color "fbca04" --description "Works but should be improved" --force
gh label create "enhancement"         --repo "$REPO" --color "a2eeef" --description "New feature or improvement" --force
gh label create "prompt-quality"      --repo "$REPO" --color "7057ff" --description "AI decomposition output quality" --force
gh label create "parser"              --repo "$REPO" --color "e4e669" --description "AI response parsing issue" --force
gh label create "ai-response"         --repo "$REPO" --color "d4c5f9" --description "Unexpected AI model output" --force

# Phase labels
gh label create "phase-1"            --repo "$REPO" --color "0e8a16" --description "Phase 1: The Engine" --force
gh label create "phase-2"            --repo "$REPO" --color "1d76db" --description "Phase 2: The Map" --force
gh label create "phase-3"            --repo "$REPO" --color "5319e7" --description "Phase 3: Perspectives" --force
gh label create "phase-4"            --repo "$REPO" --color "b60205" --description "Phase 4: Collaborate" --force

# Priority labels
gh label create "priority-high"      --repo "$REPO" --color "d73a4a" --description "Blocks current work" --force
gh label create "priority-medium"    --repo "$REPO" --color "fbca04" --description "Should be addressed soon" --force
gh label create "priority-low"       --repo "$REPO" --color "0e8a16" --description "Nice to have" --force

# Component labels
gh label create "shared-types"       --repo "$REPO" --color "c5def5" --description "packages/shared" --force
gh label create "ai-client"          --repo "$REPO" --color "c5def5" --description "AI client abstraction layer" --force
gh label create "orchestrator"       --repo "$REPO" --color "c5def5" --description "Decompose/audit/expand pipeline" --force
gh label create "eval"               --repo "$REPO" --color "c5def5" --description "Evaluation harness" --force
gh label create "graph-ui"           --repo "$REPO" --color "c5def5" --description "D3 graph visualization (Phase 2+)" --force

# Status labels
gh label create "blocked"            --repo "$REPO" --color "b60205" --description "Cannot proceed until dependency is resolved" --force
gh label create "needs-discussion"   --repo "$REPO" --color "d876e3" --description "Requires human decision before proceeding" --force
gh label create "claude-filed"       --repo "$REPO" --color "bfdadc" --description "Issue created autonomously by Claude Code" --force

echo "Done. Labels configured for $REPO."

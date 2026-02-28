#!/usr/bin/env bash
set -euo pipefail

# Resolve known PR conflicts against main by keeping the data-driven CV implementation
# for the 3 conflicted files, then continue the rebase.

TARGET_MAIN_REF="${1:-origin/main}"

if ! git rev-parse --verify "$TARGET_MAIN_REF" >/dev/null 2>&1; then
  echo "[error] Cannot find $TARGET_MAIN_REF. Run: git fetch origin" >&2
  exit 1
fi

BRANCH_NAME="$(git branch --show-current)"
echo "[info] Current branch: $BRANCH_NAME"
echo "[info] Rebasing onto: $TARGET_MAIN_REF"

git rebase "$TARGET_MAIN_REF" || true

if git diff --name-only --diff-filter=U | grep -q .; then
  echo "[info] Resolving conflicts by keeping current branch versions for:" 
  echo "       - index.html"
  echo "       - scripts.js"
  echo "       - styles.css"

  git checkout --ours index.html scripts.js styles.css
  git add index.html scripts.js styles.css

  # Stage any other files already conflict-resolved manually.
  unresolved="$(git diff --name-only --diff-filter=U || true)"
  if [[ -n "$unresolved" ]]; then
    echo "[error] Remaining unresolved conflicts:" >&2
    echo "$unresolved" >&2
    exit 1
  fi

  git rebase --continue
fi

echo "[ok] Rebase/auto-resolution complete."
echo "[next] Push with: git push --force-with-lease"

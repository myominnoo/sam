#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Parse arguments
FORCE_PUSH=false
COMMIT_MSG=""

for arg in "$@"; do
  if [ "$arg" == "--force" ] || [ "$arg" == "-f" ]; then
    FORCE_PUSH=true
  else
    COMMIT_MSG="$arg"
  fi
done

# Default commit message if none is provided
DEFAULT_MSG="Quick update $(date +'%Y-%m-%d %H:%M:%S')"
COMMIT_MSG="${COMMIT_MSG:-$DEFAULT_MSG}"

# Ensure we're inside a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "Error: Not a git repository."
  exit 1
fi

# Stage all changes (new, modified, deleted)
echo "Staging changes..."
git add -A

# Check if there are any staged changes to commit
if git diff-index --quiet HEAD --; then
  echo "No changes to commit."
else
  # Commit
  echo "Committing with message: \"$COMMIT_MSG\"..."
  git commit -m "$COMMIT_MSG"
fi

# Push to current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$FORCE_PUSH" = true ]; then
  echo "Force pushing to remote origin/$BRANCH..."
  git push origin "$BRANCH" --force
else
  echo "Pushing to remote origin/$BRANCH..."
  git push origin "$BRANCH"
fi

echo "Done!"
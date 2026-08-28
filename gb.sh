#!/usr/bin/env bash

# Exit immediately if a command fails
set -e

# Ensure a branch name is provided
if [ -z "$1" ]; then
  echo "Error: Please provide a branch name."
  echo "Usage: ./git-branch-sync.sh <new-branch-name> [commit-message]"
  exit 1
fi

NEW_BRANCH="$1"
COMMIT_MSG="${2:-Initial commit on $NEW_BRANCH}"

# Detect default main branch (main or master)
MAIN_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
MAIN_BRANCH="${MAIN_BRANCH:-main}"

# 0. Handle parent branch name collisions (e.g., if 'base-project' exists when creating 'base-project/tasks-convex')
PARENT_BRANCH="${NEW_BRANCH%%/*}"
if [ "$PARENT_BRANCH" != "$NEW_BRANCH" ] && git show-ref --verify --quiet "refs/heads/$PARENT_BRANCH"; then
  echo "Removing conflicting parent branch '$PARENT_BRANCH' to allow folder structure..."
  git branch -D "$PARENT_BRANCH"
fi

# 1. Force-create and switch to the new branch (-B overwrites if branch exists)
echo "Creating/resetting and switching to branch '$NEW_BRANCH'..."
git checkout -B "$NEW_BRANCH"

# 2. Stage and commit changes (if any exist)
echo "Staging changes..."
git add -A

if git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "No changes to commit. Proceeding..."
else
  echo "Committing: \"$COMMIT_MSG\"..."
  git commit -m "$COMMIT_MSG"
fi

# 3. Force-push new branch to remote and set tracking
echo "Pushing '$NEW_BRANCH' to remote (force-with-lease)..."
git push -u origin "$NEW_BRANCH" --force-with-lease

# 4. Switch back to main branch
echo "Switching back to '$MAIN_BRANCH'..."
git checkout "$MAIN_BRANCH"

echo "Done! You are back on '$MAIN_BRANCH'."
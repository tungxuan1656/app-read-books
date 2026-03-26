#!/usr/bin/env bash

set -e

git clone https://github.com/sickn33/antigravity-awesome-skills.git

SOURCE="./antigravity-awesome-skills/skills"
DEST="./.agents/skills"

echo "Creating project skills directory..."
mkdir -p "$DEST"

copy_skill () {
  if [ -d "$SOURCE/$1" ]; then
    echo "Installing skill: $1"
    cp -R "$SOURCE/$1" "$DEST/"
  else
    echo "Skipping missing skill: $1"
  fi
}

echo ""
echo "Installing core skills..."

core_skills=(
  concise-planning
  systematic-debugging
  lint-and-validate
  kaizen
  git-pushing
)

for skill in "${core_skills[@]}"; do
  copy_skill "$skill"
done

echo ""
echo "Installing backend skills (Node.js)..."

backend_skills=(
  backend-dev-guidelines
  api-patterns
  database-design
  nodejs-best-practices
  typescript-expert
  javascript-pro
  auth-implementation-patterns
  api-security-best-practices
  ethical-hacking-methodology
  sql-injection-testing
  xss-html-injection
  broken-authentication
  backend-dev-guidelines
)

for skill in "${backend_skills[@]}"; do
  copy_skill "$skill"
done

echo ""
echo "Installing frontend skills (React + Tailwind + shadcn)..."

frontend_skills=(
  react-best-practices
  react-patterns
  tailwind-patterns
  frontend-design
  ui-ux-pro-max
)

for skill in "${frontend_skills[@]}"; do
  copy_skill "$skill"
done

echo ""
echo "Installing testing skills..."

testing_skills=(
  test-driven-development
  e2e-testing-patterns
  browser-automation
  code-review-checklist
  requesting-code-review
  receiving-code-review
  systematic-debugging
  verification-before-completion
)

for skill in "${testing_skills[@]}"; do
  copy_skill "$skill"
done

rm -rf antigravity-awesome-skills

echo ""
sh scripts/sync-gitnexus.sh

git clone https://github.com/obra/superpowers.git
cp -a superpowers/skills/. "$DEST/"
rm -rf superpowers

echo ""
echo "Project skills installed successfully."
echo "Location: $DEST"
echo ""
echo "Installing @gitnexus..."
npx gitnexus analyze --skills --embeddings
rm CLAUDE.md
mv .claude/skills/gitnexus .agents/skills/gitnexus
mv .claude/skills/generated .agents/skills/generated
rm -rf .claude
sed -i '' 's/claude/agents/g' AGENTS.md
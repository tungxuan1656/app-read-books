if [ -n "$1" ]; then
  pr_number="$1"
else
  read -p "Enter pull request number: " pr_number
fi
gh api repos/{owner}/{repo}/pulls/$pr_number/comments | jq --arg user "$GH_USER" '[ .[] | select(.user.type == "User" and (.user.login == $user or $user == "")) | { diff_hunk, line, start_line, body } ]'

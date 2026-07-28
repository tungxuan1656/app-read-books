# Feature: ai-reading

## Acceptance criteria
- [a1] OpenAI compatible provider handles chat completion payload requests using custom prompts.
- [a2] Reading content hook supports switching reading AIMode (none, translate, summary) dynamically.
- [a3] Processed chapters are saved in local SQLite database and retrieved as cache hit.

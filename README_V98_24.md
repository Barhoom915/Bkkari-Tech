# NOVATEK V98.24

## AI Chat Stability & API Optimization

- Gemini is now isolated from external research failures.
- Supports both `message.text` and `message.content`.
- External laptop research only runs when the user requests current/researched information.
- PricesAPI is not triggered for every laptop question.
- Research/cache errors no longer break Gemini chat.
- Gemini errors are logged server-side without exposing the API key.
- Gemini request timeout reduced to 20 seconds.
- Gemini output limit increased to 700 tokens.
- V98.24 preserves the V98.23 Smart Compare functionality.

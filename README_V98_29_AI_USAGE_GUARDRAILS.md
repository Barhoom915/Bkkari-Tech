# NOVATEK V98.29 — AI usage guardrails

## Scope
- Applies atomic server-side request quotas to `POST /api/ai-chat`.
- Per actor defaults: 6 requests per rolling minute, 30 requests per UTC day, and 300 requests per UTC calendar month.
- Authenticated users are keyed by Supabase user ID. Guests are keyed by a SHA-256 hash of the best available forwarded client IP; raw IPs are not persisted.
- Every allowed chat request attempts to write an `ai_usage_events` row with the resolved provider/model, success/failure, and latency. Token counts and provider billing costs remain null unless the provider response is instrumented to return those fields; the dashboard must not invent them.
- If quota storage is unavailable, the route fails closed with HTTP 503 instead of allowing unmetered requests.

## Required database setup
1. In the same Supabase project used by both deployments, apply `supabase/v71_ai_analytics_ledger.sql` from the `Barhoom915/bkkari-admin` repository.
2. Apply `supabase/v98_29_ai_usage_guardrails.sql` from this repository.
3. Deploy the store and admin changes only after both migrations succeed.

## Safety
- No Vercel environment variables, secrets, domains, or deployment settings are changed.
- No OpenAI API is added. The existing Ashna → Groq → OpenRouter Free → Gemini fallback chain remains.
- Limits are server-side and atomically enforced in PostgreSQL; client UI values are informational only.
- The admin dashboard reads quota counters using its existing server-side service client. Keep `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` server-only.

## Verification still required before production
- Apply both migrations to the intended Supabase project.
- Run store and admin `npm run build` / lint in their own repositories.
- Test 6 requests/minute, the daily/monthly boundary, parallel requests, unauthenticated guests, provider fallback, and admin analytics against the real database.

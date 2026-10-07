# NOVATEK V98.21 — Smart Compare Reliability & API Cost Guard

- Keeps comparison quota at 10/month per authenticated account.
- Charges comparison quota only after a successful result is produced.
- SerpApi is the primary web provider; Tavily is used only when SerpApi fails.
- PricesAPI is capped to 1 product result and up to 3 offers per laptop lookup.
- Provider failures no longer abort the whole comparison; local scoring can still produce a result.
- Server-side cache uses the Supabase service key and safely fails closed without exposing provider errors.
- Missing Supabase service credentials are detected before paid provider calls are made.

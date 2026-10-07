# NOVATEK V98.24 — Wallet Payment UI

- Redesigned `/wallet` top-up UI into selectable payment circles/cards.
- Sham Cash: SYP and USD choices.
- Added Banque Bemo Saudi Fransi account flow.
- Added Syria International Islamic Bank account flow.
- Added hand-delivery option.
- Bank/SYP flow calculates credited USD using the configured `wallet_exchange_rate`.
- Transfer receipt + transaction/reference number are required for electronic payment methods.
- Top-up requests record payment method, source currency, sent amount, exchange rate, credited amount, and destination account.
- Existing `wallet_topup_requests` rows remain compatible.

SQL: `supabase/v24_wallet_payment_methods.sql`

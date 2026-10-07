# NOVATEK Architecture Overview

## High-level flow

```text
┌──────────────────────────────┐
│          Customer            │
│      Mobile / Desktop        │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       Next.js Storefront     │
│  RTL UI • Catalog • Search   │
│  Account • Cart • Checkout   │
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌──────────────┐  ┌───────────────┐
│ Supabase Auth│  │   Supabase DB │
│ Accounts     │  │ PostgreSQL    │
└──────────────┘  │ RLS + RPCs    │
                  └───────┬───────┘
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
        Wallet / Orders  Catalog   Notifications

                 ▲
                 │
          ┌──────┴──────┐
          │    Vercel   │
          │  Deployment │
          └──────┬──────┘
                 ▲
                 │
             ┌───┴───┐
             │ GitHub│
             │ main  │
             └───────┘
```

## Main application areas

- `app/` — Next.js routes and shared UI.
- `public/` — brand, catalog and social assets.
- `supabase/` — database schema, policies and feature migrations.
- `docs/` — project documentation and release notes.
- `.github/` — issue templates and repository automation.

## Data and security model

Supabase is responsible for authentication and PostgreSQL-backed application data. Sensitive server-side values must remain in environment variables. Client-exposed Supabase configuration must only use the public URL and anon/publishable key intended for browser use.

Checkout-sensitive logic belongs in database RPCs rather than trusting totals calculated only in the browser.

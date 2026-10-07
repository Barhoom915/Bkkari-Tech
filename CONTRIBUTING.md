# Contributing to NOVATEK

NOVATEK is a real storefront project. Changes should be small, testable and easy to review.

## Before you start

1. Create a branch for your change.
2. Do not commit secrets, customer data or production exports.
3. Keep mobile and desktop behavior in mind.
4. If a database change is required, add a clearly named SQL migration under `supabase/`.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Before opening a pull request

```bash
npm run lint
npm run build
```

Then manually check the affected flow on a mobile viewport and a desktop viewport.

## Commit style

Prefer descriptive commits such as:

```text
NOVATEK V98,6 improve repository documentation
NOVATEK V98,7 fix mobile checkout spacing
NOVATEK V98,8 add product search aliases
```

## Pull requests

Explain:

- What changed
- Why it changed
- Which screens are affected
- Whether a Supabase migration is required
- How the change was tested

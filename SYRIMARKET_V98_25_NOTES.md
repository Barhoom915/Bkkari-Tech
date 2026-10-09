# NOVATEK V98.25 — SyriMarket integration foundation

This patch adds a server-only SyriMarket API client and an admin-only catalog connectivity check.

## Environment
Add `SYRIMARKET_API_TOKEN` to Vercel Environment Variables (server-side only), then redeploy.
Never use a `NEXT_PUBLIC_` prefix for this token.

## Admin connectivity check
After deployment, sign in with an active NOVATEK admin account and open:
`/api/admin/syrimarket/catalog`

The route calls `/profile`, `/catalog/products`, and `/catalog/categories/0` using `Authorization: Bearer ...` and returns the provider's raw payloads so the actual response structure can be confirmed before mapping it into the storefront.

## Included API methods
- `getProfile()`
- `getProducts()`
- `getCategories(categoryId = 0)`
- `quote(payload)`
- `createOrder(payload, idempotencyKey)`
- `getOrder(orderId)`
- `cancelOrder(orderId, payload?)`

## Important limitations
This patch does not yet switch the customer-facing catalog from SatoFill, create SyriMarket orders, charge wallets for SyriMarket orders, or compare provider prices. Those require validating the actual product/quote response shapes and wiring them into the current order ledger safely. No test purchase is sent by the catalog route.

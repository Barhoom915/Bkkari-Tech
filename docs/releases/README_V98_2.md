# NOVATEK V98,2

## Changes
- Replaced the bottom contact-card block with a fixed WhatsApp button beside the AI button on mobile.
- Removed the white footer-wrap inset that created black/dark vertical side bars.
- Added `supabase/v98_2_checkout_rpc_fix.sql` to restore the `public.create_order_with_wallet` RPC with the checkout coupon argument and refresh PostgREST schema cache.

## Checkout database fix
The checkout error `Could not find the function public.create_order_with_wallet(... p_coupon_code ...) in the schema cache` is a Supabase/PostgREST RPC signature/cache issue. Run `supabase/v98_2_checkout_rpc_fix.sql` once in the Supabase SQL Editor, then retry checkout.

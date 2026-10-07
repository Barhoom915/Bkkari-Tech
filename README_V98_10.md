# NOVATEK V98,10

## Search history
- Search history is now shown as a clean vertical list inspired by modern commerce apps.
- Each history item can be opened with one tap.
- Each history item has its own `×` remove button.
- `مسح السجل` still clears the entire history.

## Product opening animation
- The tapped product remains the visual focus.
- The storefront stays visible underneath with a subtle dim/blur instead of a white takeover screen.
- The product media expands from its exact card position to the full viewport.
- The transition title pill was removed so the product is the only focal element.
- Light-mode product imagery uses a blend treatment to reduce white image-box artifacts when possible.

## Vercel / GitHub note
If a Dependabot/Preview deployment reports `supabaseUrl is required`, this is an environment-variable scope issue, not a TypeScript compilation error. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are available to the Vercel Preview environment, then redeploy.

Build verification was not completed locally because dependency installation timed out in the execution environment.

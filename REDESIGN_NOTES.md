# Bkkari Tech — PCLand-style storefront pass

This pass keeps the existing storefront routes, Supabase logic, product data and business features intact and updates the storefront presentation toward the supplied PCLand mobile reference.

Changes:
- Added a proper storefront header with Bkkari Tech branding, search, language/account/cart controls and desktop navigation.
- Added a mobile-only centered brand row and separate search/language row to prevent overlap on narrow screens.
- Added desktop category/navigation row while keeping the existing mobile bottom navigation.
- Restyled the mobile bottom navigation to a full-width black ecommerce dock with five requested destinations.
- Tightened hero, category rails, product cards, promo blocks and spacing for mobile-first responsive behavior.
- Kept product rails swipeable and infinite; no business/data/API changes were made.

Validation note:
- The source tree was checked after editing. A full Next.js build could not be completed in this environment because dependencies could not be installed successfully before the execution timeout; this is an environment limitation, not a reported application build error.

V20.1 implementation:
- Reordered storefront homepage to hero → brands → categories → laptop offers → business/gaming rails → PlayStation split section → digital services split section → promo tiles → PC Builder → trust row.
- Added responsive PCLand-style ecommerce header with separate mobile brand/search rows and no logo image dependency.
- Added storefront media controls in Admin > إعدادات المتجر > صور الواجهة; uploads use the existing admin image upload endpoint and persist to `site_settings.storefront_media`.
- Reordered the existing admin navigation without removing any route.

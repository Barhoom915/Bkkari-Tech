# NOVATEK V98,4

## Product opening animation fix
- Reworked laptop and PlayStation product opening transition.
- The transition now starts from the product image area rather than expanding the entire product card.
- It uses a full-screen visual transition with a smooth image expansion, backdrop fade, and product title.
- Navigation uses Next.js client-side router instead of `window.location.href`, avoiding a full browser reload after the animation.
- The previous `novatek-product-expand` transition was removed from the product cards.

## Note
Build was not fully verified in this environment because dependency installation timed out. The project structure and source changes were checked directly.

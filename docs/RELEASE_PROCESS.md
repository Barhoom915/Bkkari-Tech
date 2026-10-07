# NOVATEK Release Process

NOVATEK uses incremental version labels for storefront work.

- `V98,0` — base release
- `V98,1` — first patch
- `V98,2` — second patch
- `V98,3` — third patch
- `V98,4` — fourth patch
- `V98,5` — fifth patch
- `V98,6` — documentation/repository presentation update
- `V99,0` — next major project stage

## Recommended workflow

1. Make the change.
2. Update the relevant release note.
3. Run `npm run lint`.
4. Run `npm run build`.
5. Test mobile and desktop.
6. Check database migrations if applicable.
7. Commit with the version in the message.
8. Push to `main` only when the release is ready.

Do not claim a build passed unless it was actually run successfully.

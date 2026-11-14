# Project architecture

- Keep public book discovery composed from the existing React Router pages and homepage sections, reusing their data flows so browsing stays open without account creation.
- Read book reviews only through the `get_book_reviews` database function: it returns the top 3 to free visitors and everything to paid members, because direct table reads are locked to paid members and admins.
- Run AI book enrichment through the `ai-enrich-book` backend function (admin-only), so the AI key and prompts stay on the server.
- Signed-in reader pages (`/dashboard`) sit behind `ProtectedUserRoute`, which sends visitors to `/signin?next=…`; Google sign-in returns to `/signin`, which then forwards to the saved path, because OAuth must return to a public page.
- Show vendor contact details only through the `get_book_vendors` database function: it returns only a seller count to free visitors and full details to paid members and admins, because direct vendor table reads are locked to paid members and admins.
- Admin checks send a current session token, discard results after account changes, and validate claims plus `has_role` server-side; this avoids signed-out request races without granting client-side privileges.
- Return OAuth to the current origin's public sign-in page and forward after session hydration; this supports independently hosted deployments without cross-origin storage loss.
- Subscription reads include the payment environment and poll while mounted; checkout returns to the reader dashboard so delayed payment confirmations are reflected without a manual reload.
- Flutterwave Standard checkout is initialized server-side using validated payment plans; verified transactions are applied atomically and idempotently to subscriptions, which remain the sole entitlement source rather than user-editable profiles.
- Keep legacy subscription rows and identifiers as deprecated history; new payments use Flutterwave fields so migration does not erase prior entitlements or manual grants.
- Centralize cover resolution and minimum source dimensions in BookCover; use semantic editorial fallback styling when providers cannot supply a usable image rather than enlarging tiny bitmaps.
- Reader badges use aggregated distinct signed-in book viewers and say explored, not matched; never invent social-proof counts or expose reader identities.
- Curated starter shelves use static catalogue IDs and fetch current book metadata; sharing exports the rendered quiz card in the browser without backend generation.

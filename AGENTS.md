# Project architecture

- Keep public book discovery composed from the existing React Router pages and homepage sections, reusing their data flows so browsing stays open without account creation.
- Read book reviews only through the `get_book_reviews` database function: it returns the top 3 to free visitors and everything to paid members, because direct table reads are locked to paid members and admins.
- Run AI book enrichment through the `ai-enrich-book` backend function (admin-only), so the AI key and prompts stay on the server.
- Signed-in reader pages (`/dashboard`) sit behind `ProtectedUserRoute`, which sends visitors to `/signin?next=…`; Google sign-in returns to `/signin`, which then forwards to the saved path, because OAuth must return to a public page.
- Show vendor contact details only through the `get_book_vendors` database function: it returns only a seller count to free visitors and full details to paid members and admins, because direct vendor table reads are locked to paid members and admins.
- Admin checks send a current session token, discard results after account changes, and validate claims plus `has_role` server-side; this avoids signed-out request races without granting client-side privileges.
- Move sign-in to the canonical authentication origin before starting OAuth, then return to its public sign-in page; this keeps session storage origin-scoped and avoids cross-origin OAuth callbacks.
- Subscription reads include the payment environment and poll while mounted; checkout returns to the reader dashboard so delayed payment confirmations are reflected without a manual reload.

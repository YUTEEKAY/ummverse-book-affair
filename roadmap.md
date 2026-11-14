# Ummverse editorial refresh

- [x] Refresh the public browsing experience with the reading-room image, editorial styling, and clear homepage discovery sections.
- [x] Finish desktop/mobile checks and inspect current build diagnostics before commit.

# Portal and payment audit

- [x] Verify public browsing, quiz limits, saved books, reader tabs, admin/import access, vendor add/edit/delete, and sign-out. Correct lost quiz spice selection.
- [x] Harden subscription refresh, checkout return, billing portal opening, and payment-event persistence; 14 regression tests pass and test checkout opens at $5/month. Both catalog environments charge $70/year.
- [x] Fixed-domain sign-in superseded by current-origin returns at the user’s request.
- [x] Previous managed-payment readiness superseded by Flutterwave; retained refund policy unchanged.
- [ ] Verify completed payment, renewal/cancellation, paid review/vendor access, CSV/enrichment mutations, and user-access gifting. Requires approved/manual payment flow and agreed test-account/data changes; not verified by this audit.

# Flutterwave migration and Vercel readiness

- [x] Replace frontend checkout and legacy payment endpoints with Flutterwave Standard, verified return handling, recurring webhooks and cancellation.
- [x] Add secure subscription fields, payment records and shared access rules; preserve existing subscription history and manual grants.
- [x] Match $5/month and $60/year throughout and restore current-origin auth/payment returns.
- [x] Add Vercel SPA rewrites, environment example and deployment instructions; run tests and browser checks.
- [ ] Configure Flutterwave credentials/plans/webhook and disconnect managed payments; blocked until account details and provider disconnect are supplied.

# Covers and engagement

- [x] Upgrade cover URL resolution, blank/low-resolution detection and editorial fallback covers with hardcover detailing.
- [x] Add one-click mood/trope discovery filters, visual heat meter, quick-peek/save controls and real reader counts.
- [x] Add today's curated mood pick with quiz CTA; verify desktop/mobile rendering without AI labels.

# Quiz-result sharing

- [x] Add a branded matched-book share card with cover, title, author and mood tags; export/share locally without backend or AI calls.

# Starter shelves and vendor teaser

- [x] Add static curated thematic shelf definitions and horizontal book rows with descriptions and tags.
- [x] Add live Nigerian/online vendor counts for free readers with an upgrade CTA, without exposing contact details.

# Final production audit

- [x] Add current-origin public OAuth callback, server-verified session completion, safe destination handling and Vercel public-key alias checks; preserve managed Google sign-in.

- [x] Verified sign-in-before-quiz, server allowed/allowed/blocked trial responses and third-attempt modal; admin guards, legal/footer links, image export and mobile layout. 21 tests pass; automatic build OK; no runtime errors observed. Review/vendor RLS inspected.
- [ ] Vercel deployment and Google OAuth end-to-end: blocked by absent deployed Vercel URL/allowlist and external-host OAuth broker setup.
- [ ] Completed Flutterwave payment/renewal/cancellation and paid UI: blocked by missing credentials/plans. CSV/enrichment save flows remain unverified in this pass.
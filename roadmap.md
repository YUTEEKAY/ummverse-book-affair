# Ummverse editorial refresh

- [x] Refresh the public browsing experience with the reading-room image, editorial styling, and clear homepage discovery sections.
- [x] Finish desktop/mobile checks and inspect current build diagnostics before commit.

# Portal and payment audit

- [x] Verify public browsing, quiz limits, saved books, reader tabs, admin/import access, vendor add/edit/delete, and sign-out. Correct lost quiz spice selection.
- [x] Harden subscription refresh, checkout return, billing portal opening, and payment-event persistence; 14 regression tests pass and test checkout opens at $5/month. Both catalog environments charge $70/year.
- [ ] Canonical sign-in implemented; its availability is blocked by ummverse.com.ng awaiting DNS and failing HTTPS.
- [ ] Check real-payment readiness. Blocked: verification/review pending and the retained non-refundable policy conflicts with provider requirements.
- [ ] Verify completed payment, renewal/cancellation, paid review/vendor access, CSV/enrichment mutations, and user-access gifting. Requires approved/manual payment flow and agreed test-account/data changes; not verified by this audit.

# Flutterwave migration and Vercel readiness

- [ ] Replace frontend checkout and legacy payment endpoints with Flutterwave Standard, verified return handling, recurring webhooks and cancellation.
- [ ] Add secure subscription fields, payment records and shared access rules; preserve existing subscription history and manual grants.
- [ ] Match $5/month and $60/year throughout and restore current-origin auth/payment returns.
- [ ] Add Vercel SPA rewrites, environment example and deployment instructions; run tests and browser checks.
- [ ] Configure Flutterwave credentials/plans/webhook and disconnect managed payments; blocked until account details and provider disconnect are supplied.
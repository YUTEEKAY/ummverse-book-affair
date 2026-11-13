# Project architecture

- Keep public book discovery composed from the existing React Router pages and homepage sections, reusing their data flows so browsing stays open without account creation.
- Read book reviews only through the `get_book_reviews` database function: it returns the top 3 to free visitors and everything to paid members, because direct table reads are locked to paid members and admins.
- Run AI book enrichment through the `ai-enrich-book` backend function (admin-only), so the AI key and prompts stay on the server.

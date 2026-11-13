/** Upgrade known cover URLs to their highest reliable resolution. */
export function upgradeCoverUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let u = url.trim().replace(/^http:\/\//, "https://");
  if (u.includes("covers.openlibrary.org")) u = u.replace(/-(S|M)\.jpg/i, "-L.jpg");
  if (u.includes("books.google")) u = u.replace(/&edge=curl/g, "");
  return u;
}

/** Ordered list of cover sources to try for a book. */
export function coverCandidates(book: { cover_url?: string | null; isbn13?: string | null; isbn?: string | null }): string[] {
  const list: string[] = [];
  const primary = upgradeCoverUrl(book.cover_url);
  if (primary) list.push(primary);
  for (const id of [book.isbn13, book.isbn]) {
    const clean = id?.replace(/[^0-9Xx]/g, "");
    if (clean) list.push(`https://covers.openlibrary.org/b/isbn/${clean}-L.jpg?default=false`);
  }
  return [...new Set(list)];
}

const titleCache = new Map<string, Promise<string | null>>();
/** Look up a cover on Open Library by title + author (cached per session). */
export function findCoverByTitle(title: string, author?: string | null): Promise<string | null> {
  const key = `${title}|${author ?? ""}`.toLowerCase();
  if (!titleCache.has(key)) {
    const params = new URLSearchParams({ title, limit: "1", fields: "cover_i" });
    if (author) params.set("author", author);
    titleCache.set(
      key,
      fetch(`https://openlibrary.org/search.json?${params}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const id = d?.docs?.[0]?.cover_i;
          return id ? `https://covers.openlibrary.org/b/id/${id}-L.jpg` : null;
        })
        .catch(() => null),
    );
  }
  return titleCache.get(key)!;
}

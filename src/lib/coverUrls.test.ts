// @ts-ignore bun runner types
import { expect, test } from "bun:test";
import { upgradeCoverUrl, usableCover } from "./coverUrls";
import { heatRating } from "./heatMeter";
test("small and medium Open Library URLs request large covers", () => {
  expect(upgradeCoverUrl("https://covers.openlibrary.org/b/id/1-S.jpg")).toEndWith("-L.jpg");
  expect(upgradeCoverUrl("https://covers.openlibrary.org/b/id/1-M.jpg")).toEndWith("-L.jpg");
});
test("Google covers strip curl and use zoom 1", () => {
  const url = new URL(upgradeCoverUrl("https://books.google.com/books?id=x&zoom=5&edge=curl") ?? "");
  expect(url.searchParams.get("zoom")).toBe("1"); expect(url.searchParams.has("edge")).toBe(false);
});
test("blank and tiny covers are rejected", () => { expect(usableCover(1,1)).toBe(false); expect(usableCover(10,10)).toBe(false); expect(usableCover(120,180)).toBe(false); expect(usableCover(400,600)).toBe(true); });
test("heat meter supports five numeric levels and existing tags", () => { for (let i=1;i<=5;i++) expect(heatRating(String(i))).toBe(i); expect(heatRating("scorching")).toBe(5); expect(heatRating("sweet")).toBe(1); });
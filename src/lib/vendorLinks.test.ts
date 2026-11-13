// @ts-ignore
import { describe, expect, test } from "bun:test";
import { instagramUrl, whatsappUrl, telUrl, websiteUrl } from "./vendorLinks";

describe("vendor links", () => {
  test("instagram handle becomes instagram.com/handle", () => {
    expect(instagramUrl("@rovingheights")).toBe("https://instagram.com/rovingheights");
    expect(instagramUrl("https://www.instagram.com/rovingheights/")).toBe("https://instagram.com/rovingheights");
  });
  test("Nigerian local number opens WhatsApp in international form", () => {
    expect(whatsappUrl("0803 123 4567")).toBe("https://wa.me/2348031234567");
    expect(telUrl("+234 803 123 4567")).toBe("tel:+2348031234567");
  });
  test("website without https gets it added", () => {
    expect(websiteUrl("rovingheights.com")).toBe("https://rovingheights.com");
    expect(websiteUrl("")).toBeNull();
  });
});

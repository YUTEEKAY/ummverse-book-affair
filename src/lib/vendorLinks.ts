// Turn the contact details admins type in into links readers can tap.

export function instagramUrl(handle?: string | null): string | null {
  if (!handle) return null;
  const h = handle.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/+$/, "");
  return h ? `https://instagram.com/${h}` : null;
}

/** Digits only, with Nigerian local numbers (0803…) turned into international form (234803…). */
export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("0") && d.length === 11) d = "234" + d.slice(1);
  return d;
}

export function whatsappUrl(phone?: string | null): string | null {
  const d = normalizePhone(phone);
  return d ? `https://wa.me/${d}` : null;
}

export function telUrl(phone?: string | null): string | null {
  const d = normalizePhone(phone);
  return d ? `tel:+${d}` : null;
}

export function websiteUrl(url?: string | null): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

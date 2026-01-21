import sanitizeHtml from "sanitize-html";

/**
 * Sanitize a string input by removing all HTML tags and attributes.
 * Use for user-supplied text fields to mitigate XSS.
 */
export function sanitizeInput(input: any): string {
  const str = typeof input === "string" ? input : String(input ?? "");
  return sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

/**
 * Sanitize specific string fields on an object.
 * Mutates a shallow copy and returns it.
 */
export function sanitizeFields<T extends Record<string, any>>(obj: T, fields: string[]): T {
  const copy: T = { ...obj };
  for (const key of fields) {
    if (key in copy && typeof copy[key] === "string") {
      copy[key] = sanitizeInput(copy[key]);
    }
  }
  return copy;
}

/**
 * Recursively sanitize all string values within a nested object.
 * Use sparingly; prefer explicit fields for predictable behavior.
 */
export function sanitizeObjectDeep<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj as T;
  if (typeof obj === "string") return sanitizeInput(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map(sanitizeObjectDeep) as unknown as T;
  if (typeof obj === "object") {
    const out: any = Array.isArray(obj) ? [] : {};
    for (const [k, v] of Object.entries(obj as any)) {
      out[k] = sanitizeObjectDeep(v);
    }
    return out as T;
  }
  return obj;
}

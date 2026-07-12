export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
}

export function paginateItems<T>(
  items: T[],
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * limit;

  return {
    data: items.slice(start, start + limit),
    totalCount,
    totalPages,
  };
}

export function matchesKeyword(
  keyword: string,
  fields: (string | undefined | null)[],
): boolean {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => (f ?? '').toLowerCase().includes(q));
}

/**
 * Splits the keyword into individual words and returns true if ANY of the
 * given fields contains ANY of those words. Used for free-text search
 * across multiple fields (e.g. title/description/tags) so that a
 * multi-word query still matches items that only contain some of the
 * words, instead of requiring the exact phrase as a substring.
 */
export function matchesAnyWord(
  keyword: string,
  fields: (string | string[] | undefined | null)[],
): boolean {
  const words = keyword
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return true;

  const haystacks = fields
    .flatMap((f) => (Array.isArray(f) ? f : [f]))
    .map((f) => (f ?? '').toLowerCase());

  return words.some((word) => haystacks.some((h) => h.includes(word)));
}

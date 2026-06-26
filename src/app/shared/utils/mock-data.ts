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

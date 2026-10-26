// paginateData — port of upstream plugins/pagination/paginateData
// (Astryx 0.6.4, MIT).

/** Slice a data array for the current page (1-based). page/pageSize are
 *  coerced to positive integers; non-finite pageSize falls back to 10. */
export function paginateData<T>(data: T[], page: number, pageSize: number): T[] {
	const size = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 10
	const p = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1
	const start = (p - 1) * size
	return data.slice(start, start + size)
}

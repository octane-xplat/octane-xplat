// Template routes retained with explicit, recorded framework gaps — the
// pinned example exercises a public Pagination contract that does not exist
// in @octane-xplat/ui (unit-6 recorded the gap; the upstream component also
// offers 'compact', 'input' and 'none' variants plus hasMore and an editable
// page box, none of which are needed by other pinned examples).
export const templateBlockers: Record<string, string> = {
	'/templates/PaginationDotsCarousel/':
		'Pinned example drives Pagination variant="dots" (plus onChange); the public xplat Pagination exposes only the windowed page-button contract (page/pageCount/onPageChange). The dots variant has no public equivalent.',
	'/templates/PaginationPageSize/':
		'Pinned example drives Pagination totalItems/pageSize/pageSizeOptions/onPageSizeChange with variant="count"; the public xplat Pagination computes pageCount itself and has no count text or page-size selector.',
	'/templates/PaginationVariants/':
		'Pinned example demonstrates all four upstream Pagination variants (dots/compact/count/pages); only the pages variant has a public xplat equivalent.',
}

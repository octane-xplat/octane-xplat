/** Positions describe the final flat row model, before VirtualList windowing.
 * Header rows count toward ARIA indices, but not the spoken data-row ordinal. */
export function gridRowPosition(
	index: number,
	pagination: { pageIndex: number; pageSize: number },
	headerRows: number,
	rowCount: number,
) {
	const ordinal = pagination.pageIndex * pagination.pageSize + index + 1
	return {
		ariaIndex: headerRows + ordinal,
		label: rowCount < 0 ? `Row ${ordinal}` : `Row ${ordinal} of ${rowCount}`,
	}
}

/** Resolve the displayed width without changing flexible legacy columns. */
export function columnStyle(column: any, fixed: boolean, sizing: Record<string, number>) {
	const explicit = fixed || column.columnDef.size != null || sizing[column.id] != null
	return explicit
		? { width: column.getSize(), flexGrow: 0, flexShrink: 0 }
		: { flexGrow: 1, flexShrink: 1 }
}

/** Move a column within the complete order, preserving hidden columns. */
export function moveColumn(order: string[], source: string, target: string) {
	const from = order.indexOf(source)
	const to = order.indexOf(target)
	if (from < 0 || to < 0 || from === to) {
		return order
	}

	const next = [...order]
	next.splice(from, 1)
	next.splice(to, 0, source)
	return next
}

/** Find the visible column whose midpoint a horizontal drag has crossed. */
export function dragTarget(columns: { id: string; getSize(): number }[], id: string, dx: number) {
	const from = columns.findIndex((column) => column.id === id)
	if (from < 0 || !Number.isFinite(dx)) {
		return id
	}

	let distance = columns[from].getSize() / 2
	let target = id
	const direction = dx < 0 ? -1 : 1
	for (let i = from + direction; i >= 0 && i < columns.length; i += direction) {
		distance += columns[i].getSize() / 2
		if (Math.abs(dx) < distance) {
			break
		}

		target = columns[i].id
		distance += columns[i].getSize() / 2
	}

	return target
}

/** Clamp interactive widths to the column's configured bounds. */
export function resizedWidth(column: any, width: number) {
	return Math.max(
		column.columnDef.minSize ?? 20,
		Math.min(column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER, width),
	)
}

import type { VirtualListEntry } from './virtual-list-layout'

export interface VirtualListCell<T> {
	id: number
	typeKey: string
	generation: number
	entry: VirtualListEntry<T> | null
	rows: readonly VirtualListEntry<T>[]
}

/** Reuse physical hosts without retaining an off-window logical row subtree. */
export class VirtualListCellPool<T> {
	private cells: VirtualListCell<T>[] = []
	private byId = new Map<number, VirtualListCell<T>>()
	private nextId = 0

	update(entries: readonly VirtualListEntry<T>[]): readonly VirtualListCell<T>[] {
		if (entries.length === 0) {
			this.clear()
			return this.cells
		}

		const wanted = new Set(entries.map((entry) => entry.rowKey))
		let cells = this.cells.map((cell) => cell.entry && !wanted.has(cell.entry.rowKey)
			? { ...cell, entry: null, rows: [], generation: cell.generation + 1 }
			: cell,
		)

		const retained = new Map(cells.filter((cell) => cell.entry).map((cell) => [cell.entry!.rowKey, cell.id]))

		for (const entry of entries) {
			const retainedId = retained.get(entry.rowKey)
			let index = retainedId === undefined
				? cells.findIndex((cell) => !cell.entry && cell.typeKey === entry.typeKey)
				: cells.findIndex((cell) => cell.id === retainedId)

			if (index === -1) {
				index = cells.length
				cells.push({ id: this.nextId++, typeKey: entry.typeKey, generation: 0, entry: null, rows: [] })
			}

			const cell = cells[index]
			if (cell.entry !== entry) {
				// Immutable snapshots let renderer caches see assignment/index changes.
				cells[index] = { ...cell, entry, rows: [entry], generation: cell.generation + 1 }
			}
		}

		let spare = 0
		cells = cells.filter((cell) => cell.entry || spare++ < 8)
		cells.sort((a, b) => (a.entry?.index ?? Infinity) - (b.entry?.index ?? Infinity) || a.id - b.id)
		this.cells = cells
		this.byId = new Map(cells.map((cell) => [cell.id, cell]))
		return cells
	}

	get(id: number): VirtualListCell<T> | undefined {
		return this.byId.get(id)
	}

	isCurrent(id: number, rowKey: string, generation: number): boolean {
		const cell = this.byId.get(id)
		return cell?.entry?.rowKey === rowKey && cell.generation === generation
	}

	clear() {
		this.cells = []
		this.byId.clear()
		// IDs remain monotonic across empty/restore so old work cannot match.
	}
}

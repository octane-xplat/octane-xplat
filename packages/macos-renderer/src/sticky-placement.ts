export interface StickyPlacementRect { parent: object; x: number; y: number; width: number; height: number }
export interface StickyCellGeometry { x: number; width: number; rowX: number; rowWidth: number }
export interface StickyPlacementLease {
	read(document: object): StickyCellGeometry | undefined
	update(offset: number, priority: number): void
	release(): void
}
/** A layout pin modifier, not a paint transform. The renderer supplies native conversion/order. */
export function createStickyPlacements<Node extends object>(options: {
	nodeFor(view: object): Node | undefined
	valid(node: Node, view: object): boolean
	convert(node: Node, base: StickyPlacementRect, document: object): StickyCellGeometry | undefined
	repin(node: Node, base: StickyPlacementRect): void
	order(node: Node): void
	invalidate(node: Node): void
}) {
	type Record = { view: object; offset: number; priority: number; base?: StickyPlacementRect }
	const records = new WeakMap<Node, Record>()
	return {
		position(node: Node, base: StickyPlacementRect): number {
			const record = records.get(node)
			if (!record || !options.valid(node, record.view)) return base.x
			if (record.base?.parent !== base.parent) { record.offset = 0; record.priority = 0 }
			record.base = base
			return base.x + record.offset
		},
		priority: (node: Node) => { const record = records.get(node); return record && options.valid(node, record.view) ? record.priority : 0 },
		reset(node: Node) {
			const record = records.get(node)
			if (!record) return
			record.base = undefined; record.offset = 0; record.priority = 0
		},
		retain(view: object): StickyPlacementLease | undefined {
			const node = options.nodeFor(view)
			if (!node || !options.valid(node, view)) return
			const previous = records.get(node)
			const record: Record = { view, offset: previous?.offset ?? 0, priority: previous?.priority ?? 0, base: previous?.base }
			records.set(node, record)
			const current = () => records.get(node) === record && options.valid(node, view)
			try { options.invalidate(node) }
			catch (error) { if (previous) records.set(node, previous); else records.delete(node); throw error }
			return {
				read(document) { return current() && record.base ? options.convert(node, record.base, document) : undefined },
				update(offset, priority) {
					if (!current()) return
					if (!Number.isFinite(offset) || !Number.isFinite(priority)) throw new TypeError('Invalid AppKit sticky placement')
					const changed = Math.abs(record.offset - offset) > 0.01
					record.offset = offset; record.priority = priority
					if (changed && record.base) options.repin(node, record.base)
					options.order(node)
				},
				release() {
					if (records.get(node) !== record) return
					records.delete(node)
					if (options.valid(node, view)) {
						try { if (record.base) options.repin(node, record.base) }
						finally { options.order(node) }
					}
				},
			}
		},
	}
}

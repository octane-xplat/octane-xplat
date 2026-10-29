import type { OutlineItem } from '../../props'
import { slugify, uniqueSlug } from './outline-utils'

interface Record { id: string; label: string; level: number; view?: object }
type Reader = (root: object) => Record[]

/** Use the same ID allocation for discovery and current navigation targets. */
export function appKitOutlineEntries(records: Record[]) {
	const entries: (OutlineItem & { view?: object })[] = [], reserved = new Set(records.map((record) => record.id).filter(Boolean)), used = new Set<string>(), counts = new Map<string, number>()
	for (const record of records) {
		const label = record.label.trim()
		if (!label) continue
		let id = record.id
		if (id) { if (used.has(id)) continue }
		else { do { id = uniqueSlug(slugify(label), counts) } while (used.has(id) || reserved.has(id)) }
		used.add(id); entries.push({ id, label, level: record.level, view: record.view })
	}
	return entries
}

export function appKitOutlineRoot(input: unknown): object | null {
	let view = input && typeof input === 'object' && 'current' in input ? input.current : input
	if (view && typeof view === 'object' && 'native' in view) view = view.native
	return view && typeof view === 'object' ? view : null
}

/** One snapshot per actual root and reader; rerenders do not recollect mutable
 * content or publish a fresh array indefinitely. Use document data for updates. */
export function createAppKitOutlineSnapshot() {
	let previousRoot: object | null | undefined, previousReader: Reader | undefined, items: OutlineItem[] = []
	return {
		read(root: object | null, reader?: Reader): OutlineItem[] {
			if (root === previousRoot && reader === previousReader) return items
			if (!root || !reader) { previousRoot = root; previousReader = reader; items = []; return items }
			const next = appKitOutlineEntries(reader(root)).map(({ id, label, level }) => ({ id, label, level }))
			previousRoot = root; previousReader = reader; items = next
			return items
		},
	}
}

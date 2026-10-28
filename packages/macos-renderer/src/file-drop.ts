interface DropView {
	window?: unknown
	registeredDraggedTypes?: any
	registerForDraggedTypes(types: string[]): void
	unregisterDraggedTypes(): void
}
interface DropHandlers { enabled(): boolean; receive(uris: string[]): boolean }
const fileType = 'public.file-url'
const array = (value: any): any[] => Array.isArray(value) ? value :
	Array.from({ length: Number(value?.count ?? 0) }, (_, i) => value.objectAtIndex(i))

// NSDragOperationEvery is NSUIntegerMax. Its uint64 Number representation rounds
// to 2**64, so JS bitwise coercion would discard its Copy bit entirely.
function allowsCopy(value: unknown): boolean {
	if (typeof value === 'bigint') return value === -1n || (value >= 0n && (value & 1n) !== 0n)
	const mask = Number(value)
	return mask === -1 || mask === 2 ** 64 || (Number.isSafeInteger(mask) && mask >= 0 && mask % 2 === 1)
}

/** Native destination ownership only; leaf packages inspect/validate file content. */
export function createAppKitFileDropRegistry(native: () => Record<string, any> = () => globalThis) {
	const owners = new Map<DropView, { entries: Set<DropHandlers>; addedType: boolean }>()
	const candidates = (view: DropView, sender: any) => {
		if (!view.window || sender?.draggingDestinationWindow !== view.window || !allowsCopy(sender.draggingSourceOperationMask)) return []
		const host = native(), board = sender.draggingPasteboard
		if (!host.NSURL || !host.NSPasteboardURLReadingFileURLsOnlyKey || !board?.canReadObjectForClassesOptions?.([host.NSURL],
			{ [host.NSPasteboardURLReadingFileURLsOnlyKey]: true })) return []
		return [...(owners.get(view)?.entries ?? [])].filter((entry) => owners.get(view)?.entries.has(entry) && entry.enabled() && owners.get(view)?.entries.has(entry))
	}
	return {
		subscribe(view: DropView, handlers: DropHandlers): () => void {
			let owner = owners.get(view)
			if (!owner) {
				const types = array(view.registeredDraggedTypes).map(String)
				owner = { entries: new Set(), addedType: !types.includes(fileType) }
				if (owner.addedType) view.registerForDraggedTypes([...types, fileType])
				owners.set(view, owner)
			}
			// Every lease owns an independent entry, even for reused handler objects.
			const bucket = owner, entry = { enabled: () => handlers.enabled(), receive: (uris: string[]) => handlers.receive(uris) }
			bucket.entries.add(entry)
			let active = true
			return () => {
				if (!active) return
				active = false; bucket.entries.delete(entry)
				if (bucket.entries.size || owners.get(view) !== bucket) return
				owners.delete(view)
				if (bucket.addedType) {
					// Preserve other types registered while this lease was alive.
					try {
						const types = array(view.registeredDraggedTypes).map(String).filter((type) => type !== fileType)
						view.unregisterDraggedTypes()
						if (types.length) view.registerForDraggedTypes(types)
					} catch (error) { console.error('[macos-file-drop] release failed', error) }
				}
			}
		},
		operation(view: DropView, sender: any): 0 | 1 {
			try { return candidates(view, sender).length ? 1 : 0 }
			catch (error) { console.error('[macos-file-drop] admission failed', error); return 0 }
		},
		perform(view: DropView, sender: any): boolean {
			try {
				const entries = candidates(view, sender)
				if (!entries.length) return false
				const host = native(), urls = sender.draggingPasteboard.readObjectsForClassesOptions([host.NSURL],
					{ [host.NSPasteboardURLReadingFileURLsOnlyKey]: true })
				const uris = [...new Set(array(urls).filter((url) => url?.isFileURL).map((url) => String(url.absoluteString ?? '')).filter((uri) => uri.startsWith('file:')))]
				if (!uris.length) return false
				for (const entry of entries) {
					if (view.window && sender.draggingDestinationWindow === view.window && owners.get(view)?.entries.has(entry) && entry.enabled() && owners.get(view)?.entries.has(entry) && entry.receive(uris)) return true
				}
				return false
			} catch (error) { console.error('[macos-file-drop] delivery failed', error); return false }
		},
	}
}

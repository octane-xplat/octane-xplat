export interface NativeSheetHandle {
	target: any
	readonly presented: boolean
	present(): boolean
	close(): void
}

/** Own a document-modal session, including a request made before window attachment.
 * Native construction stays in the renderer; this controller owns its resources. */
export function createNativeSheet(view: any, options: {
	onDismissed?(): void
	onUnavailable?(): void
}, deps: {
	makeContent(): any
	makeWindow(content: any, size: { width: number; height: number }, cancel: () => void): any
	releaseWindow(window: any): void
	watchWindow(view: any, notify: () => void): () => void
	observeClose(window: any, notify: () => void): () => void
	fittingSize(content: any): { width: number; height: number } | null
}): NativeSheetHandle | null {
	let content: any, sheet: any = null, parent: any = null
	let closed = false, requested = false, began = false, preparing = false
	const cleanups: (() => void)[] = []
	const sameWindow = (a: any, b: any) => a === b || !!(a && b && a.isEqual?.(b))
	const own = (cleanup: () => void) => { if (closed) {cleanup();} else {cleanups.push(cleanup)} }
	const finish = (reason: 'dismissed' | 'unavailable' | 'owner', endSession = true, nativeClosing = false) => {
		if (closed) {return}
		closed = true
		for (const cleanup of cleanups.splice(0).reverse()) { try { cleanup() } catch {} }
		const oldSheet = sheet; sheet = null
		if (oldSheet) {
			// Retire callbacks before endSheet/close, both of which may synchronously notify.
			try { deps.releaseWindow(oldSheet) } catch {}
			try { if (began && endSession) {parent.endSheet(oldSheet)} } catch {}
			if (!nativeClosing) {
				try { oldSheet.orderOut(null) } catch {}
				try { oldSheet.close() } catch {}
			}
			try { oldSheet.contentViewController = null } catch {}
		}
		parent = null
		if (reason === 'unavailable') {options.onUnavailable?.()}
		else if (reason === 'dismissed' && began) {options.onDismissed?.()}
	}
	const sync = () => {
		if (closed || !requested || preparing) {return}
		try {
			const next = view.window
			if (parent && !sameWindow(next, parent)) { finish('dismissed'); return }
			if (began || !next) {return}
			if (typeof next.beginSheetCompletionHandler !== 'function' || typeof next.endSheet !== 'function') { finish('unavailable'); return }
			parent = next; preparing = true
			own(deps.observeClose(parent, () => finish('dismissed')))
			if (closed) {return}
			const fit = deps.fittingSize(content)
			const size = (n: number | undefined, minimum: number) => typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.max(n, minimum) : minimum
			sheet = deps.makeWindow(content, { width: size(fit?.width, 360), height: size(fit?.height, 160) }, () => {
				if (sheet && !sheet.attachedSheet) {finish('dismissed')}
			})
			if (!sheet) {throw Error('unavailable')}
			own(deps.observeClose(sheet, () => finish('dismissed', true, true)))
			if (closed) {return}
			if (!sameWindow(view.window, parent)) { finish('unavailable'); return }
			began = true
			parent.beginSheetCompletionHandler(sheet, () => finish('dismissed', false))
		} catch { finish('unavailable') } finally { preparing = false }
	}
	try {
		content = deps.makeContent()
		if (!content) {return null}
		own(deps.watchWindow(view, sync))
	} catch { finish('owner'); return null }
	return {
		target: content,
		get presented() { return began },
		present() { if (!closed) { requested = true; sync() }; return !closed },
		close() { finish('owner') },
	}
}

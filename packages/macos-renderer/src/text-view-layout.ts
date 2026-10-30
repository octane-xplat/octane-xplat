/** Private TextArea resize observation. Native sizing stays in AppKit points. */
type LayoutNode = {
	view: any
	textViewport?: any
	textLayoutDetach?: () => void
	textLayoutRetired?: boolean
}

function report(message: string): void {
	try { console.warn(message) } catch { /* Diagnostics cannot own layout. */ }
}

/** Retire before any native removal or other renderer teardown can reenter. */
export function retireTextViewLayout(node: LayoutNode): void {
	node.textLayoutRetired = true
	const detach = node.textLayoutDetach
	node.textLayoutDetach = undefined
	try { detach?.() }
	catch { report('[macos-textarea] Layout observer cleanup failed') }
}

/** One captured center/token and view/viewport/clip/document scope per lease. */
export function observeTextViewLayout(node: LayoutNode, fit: () => void, native: () => any = () => globalThis): (() => void) | undefined {
	if (node.textLayoutRetired) {return}
	const previous = node.textLayoutDetach
	let closed = false, ready = false
	let view: any, viewport: any, clip: any, center: any, remove: any, observer: any
	const current = () => !closed && !node.textLayoutRetired && node.textLayoutDetach === detach
	const release = (token: any) => {
		try { remove.call(center, token) }
		catch { report('[macos-textarea] Layout observer cleanup failed') }
	}
	const detach = () => {
		if (closed) {return}
		closed = true; ready = false
		if (node.textLayoutDetach === detach) {node.textLayoutDetach = undefined}
		const token = observer; observer = undefined
		if (token != null) {release(token)}
	}
	const matches = () => {
		if (!current()) {return false}
		const content = viewport.contentView, document = viewport.documentView
		return current() && node.view === view && node.textViewport === viewport && content === clip && document === view
	}
	const changed = () => {
		if (!ready || !current()) {return}
		try {
			if (!matches()) { detach(); return }
			fit()
		} catch {
			detach()
			report('[macos-textarea] Layout update failed')
		}
	}

	// Publish before old cleanup, flag setters or registration can reenter.
	node.textLayoutDetach = detach
	try {
		previous?.()
		if (!current()) {return detach}
		view = node.view; viewport = node.textViewport; clip = viewport?.contentView
		if (!view || !viewport || !clip) {throw Error('Missing text layout views')}
		if (!matches()) { detach(); return detach }
		const host = native()
		center = host.NSNotificationCenter?.defaultCenter
		const add = center?.addObserverForNameObjectQueueUsingBlock
		remove = center?.removeObserver
		const name = host.NSViewFrameDidChangeNotification
		if (!current()) {return detach}
		if (typeof add !== 'function' || typeof remove !== 'function' || name == null) {throw Error('Missing text layout bridge')}
		clip.postsFrameChangedNotifications = true
		if (!matches()) { detach(); return detach }
		const token = add.call(center, name, clip, null, changed)
		if (!current()) { if (token != null) {release(token);} return detach }
		if (token == null) {throw Error('Missing text layout observer')}
		// Own a returned handle before getters in the scope check can fail.
		observer = token
		if (!matches()) { detach(); return detach }
		ready = true
		// makeNode's final applyProps performs the initial fit. Setup callbacks
		// are deliberately suppressed until the token/scope is fully acquired.
		return detach
	} catch {
		detach()
		throw Error('AppKit TextArea layout observation failed')
	}
}

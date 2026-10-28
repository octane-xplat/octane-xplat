/** Controlled text writes must not replace a native marked-text session. */
export interface TextValueAdapter {
	read(): string
	marked(): boolean
	write(value: string): void
	observeCommit?(notify: () => void): () => void
}
interface Scheduler {
	schedule(callback: () => void): unknown
	cancel(handle: unknown): void
}
const defaultScheduler: Scheduler = {
	schedule: (callback) => setTimeout(callback, 0),
	cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
}

export function createTextValueWriter(adapter: TextValueAdapter, scheduler = defaultScheduler) {
	let pending: string | undefined
	let timer: unknown
	let scheduled = false, disposed = false, writeDepth = 0, revision = 0
	let detach: (() => void) | undefined
	const stopTimer = () => {
		revision++
		if (scheduled) scheduler.cancel(timer)
		scheduled = false
	}
	const stopObserver = () => { const release = detach; detach = undefined; release?.() }
	const write = (value: string) => {
		if (adapter.read() === value) return
		writeDepth++
		try { adapter.write(value) } finally { writeDepth-- }
	}
	const flushLater = () => {
		if (disposed || pending === undefined || scheduled) return
		const expected = revision
		scheduled = true
		timer = scheduler.schedule(() => {
			if (disposed || expected !== revision) return
			scheduled = false
			try {
				if (pending === undefined || adapter.marked()) return
				const value = pending
				pending = undefined
				stopObserver()
				write(value)
			} catch (error) { console.error('[macos-text] deferred value write failed', error) }
		})
	}
	return {
		get isWriting() { return writeDepth > 0 },
		update(value: string | undefined) {
			if (disposed) return
			stopTimer()
			pending = undefined
			if (value === undefined || adapter.read() === value) { stopObserver(); return }
			if (adapter.marked()) {
				pending = value
				if (!detach && adapter.observeCommit) detach = adapter.observeCommit(flushLater)
				return
			}
			stopObserver()
			write(value)
		},
		flushLater,
		dispose() {
			if (disposed) return
			disposed = true
			pending = undefined
			stopTimer()
			stopObserver()
		},
	}
}

const writers = new WeakMap<object, ReturnType<typeof createTextValueWriter>>()
export function setTextValue(view: object, value: string | undefined, adapter: () => TextValueAdapter): void {
	let writer = writers.get(view)
	if (!writer && value !== undefined) { writer = createTextValueWriter(adapter()); writers.set(view, writer) }
	writer?.update(value)
}
export function notifyTextValueCommit(view: object): void { writers.get(view)?.flushLater() }
export function isWritingTextValue(view: object): boolean { return writers.get(view)?.isWriting ?? false }
export function disposeTextValue(view: object): void {
	try { writers.get(view)?.dispose() } finally { writers.delete(view) }
}

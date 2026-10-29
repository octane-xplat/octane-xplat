/** Controlled text writes must not replace a native marked-text session. */
export interface TextValueAdapter {
	read(): string
	marked(): boolean
	write(value: string): void
	observeCommit?(notify: () => void): (() => void) | undefined
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
	type Intent = { value: string; revision: number }
	type Observation = { active: boolean; ready: boolean; release?: () => void }
	type Work = { active: boolean; acquired: boolean; handle?: unknown; cancel?: Scheduler['cancel'] }
	let pending: Intent | undefined, observation: Observation | undefined, work: Work | undefined
	let disposed = false, writeDepth = 0, revision = 0
	const report = (message: string) => { try { console.error(message) } catch {} }
	const current = (intent: Intent) => !disposed && pending === intent && revision === intent.revision
	const releaseWork = (owner: Work | undefined) => {
		if (!owner) return
		owner.active = false
		if (work === owner) work = undefined
		if (!owner.acquired) return
		const handle = owner.handle
		owner.acquired = false; owner.handle = undefined
		try { owner.cancel!.call(scheduler, handle) }
		catch { report('[macos-text] value task cleanup failed') }
	}
	const releaseObservation = (owner: Observation | undefined) => {
		if (!owner) return
		owner.active = false
		if (observation === owner) observation = undefined
		const release = owner.release
		owner.release = undefined
		try { release?.() }
		catch { report('[macos-text] value observation cleanup failed') }
	}
	// Retire both records before either native cleanup can reenter this writer.
	const clearOwned = () => {
		const previousWork = work, previousObservation = observation
		work = undefined; observation = undefined
		if (previousWork) previousWork.active = false
		if (previousObservation) previousObservation.active = false
		releaseWork(previousWork); releaseObservation(previousObservation)
	}
	const finish = (intent: Intent) => {
		if (!current(intent)) return
		pending = undefined
		clearOwned()
	}
	const observe = () => {
		if (disposed || !pending || observation) return
		const owner: Observation = { active: true, ready: false }
		observation = owner
		try {
			const register = adapter.observeCommit
			if (!owner.active || observation !== owner) return
			if (typeof register !== 'function') { releaseObservation(owner); return }
			const release = register.call(adapter, () => {
				if (owner.active && owner.ready && observation === owner) flushLater()
			})
			if (typeof release === 'function') owner.release = release
			if (!owner.active || observation !== owner || disposed || !pending || !owner.release) {
				releaseObservation(owner); return
			}
			owner.ready = true
		} catch {
			releaseObservation(owner)
			report('[macos-text] value observation unavailable')
		}
	}
	const attempt = (intent: Intent) => {
		if (!current(intent)) return
		const actual = adapter.read()
		if (!current(intent)) return
		if (actual === intent.value) { finish(intent); return }
		const marked = adapter.marked()
		if (!current(intent)) return
		if (marked) { observe(); return }
		writeDepth++
		try { adapter.write(intent.value) } finally { writeDepth-- }
		finish(intent)
	}
	const flushLater = () => {
		const intent = pending
		if (!intent || !current(intent) || work) return
		const owner: Work = { active: true, acquired: false }
		work = owner
		try {
			owner.cancel = scheduler.cancel
			const schedule = scheduler.schedule
			if (!owner.active || work !== owner || !current(intent)) return
			if (typeof schedule !== 'function' || typeof owner.cancel !== 'function') throw new Error('Value scheduler unavailable')
			const handle = schedule.call(scheduler, () => {
				if (!owner.active || work !== owner || !current(intent)) return
				owner.active = false; owner.acquired = false; owner.handle = undefined; work = undefined
				try { attempt(intent) }
				catch {
					if (current(intent)) releaseObservation(observation)
					report('[macos-text] deferred value write failed')
				}
			})
			owner.handle = handle; owner.acquired = true
			if (!owner.active || work !== owner) releaseWork(owner)
		} catch {
			releaseWork(owner)
			if (current(intent)) releaseObservation(observation)
			report('[macos-text] value scheduling failed')
		}
	}
	return {
		get isWriting() { return writeDepth > 0 },
		update(value: string | undefined) {
			if (disposed) return
			const expected = ++revision
			pending = value === undefined ? undefined : { value, revision: expected }
			if (!pending) { clearOwned(); return }
			const intent = pending
			releaseWork(work)
			if (!current(intent)) return
			try { attempt(intent) }
			catch (error) { if (current(intent)) releaseObservation(observation); throw error }
		},
		flushLater,
		dispose() {
			if (disposed) return
			disposed = true
			revision++
			pending = undefined
			clearOwned()
		},
	}
}

type WriterOwner = { active: boolean; initial?: string; writer?: ReturnType<typeof createTextValueWriter> }
const writers = new WeakMap<object, WriterOwner>()
export function setTextValue(view: object, value: string | undefined, adapter: () => TextValueAdapter): void {
	let owner = writers.get(view)
	if (owner?.writer) { owner.writer.update(value); return }
	if (owner) { owner.initial = value; return }
	if (value === undefined) return
	owner = { active: true, initial: value }
	writers.set(view, owner)
	let initial: string | undefined
	try {
		const source = adapter()
		if (!owner.active || writers.get(view) !== owner) return
		owner.writer = createTextValueWriter(source)
		initial = owner.initial
		owner.initial = undefined
	} catch (error) {
		if (writers.get(view) === owner) writers.delete(view)
		owner.active = false; owner.initial = undefined
		owner.writer?.dispose()
		throw error
	}
	// Once published, synchronous setter failures keep the writer available for
	// retry, including newer updates accepted during an older write.
	owner.writer!.update(initial)
}
export function notifyTextValueCommit(view: object): void { writers.get(view)?.writer?.flushLater() }
export function isWritingTextValue(view: object): boolean { return writers.get(view)?.writer?.isWriting ?? false }
export function disposeTextValue(view: object): void {
	const owner = writers.get(view)
	if (!owner) return
	writers.delete(view)
	owner.active = false; owner.initial = undefined
	owner.writer?.dispose()
}

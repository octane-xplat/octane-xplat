/** Portable dismissal ownership. Entries outlive close requests: only the
 * declaring owner decides when a controlled layer stops participating. */
export interface LayerEntry {
	token: object
	depth: number
	behavior: 'close' | 'block'
	dismiss(): void
	contains?(target: any): boolean
	isPresent?(): boolean
}

export interface LayerKeyEvent {
	key: string
	isComposing?: boolean
	keyCode?: number
	defaultPrevented?: boolean
	preventDefault(): void
}

const entries: (LayerEntry & { sequence: number })[] = []
const sequences = new WeakMap<object, number>()
let nextSequence = 0
let detach: (() => void) | undefined
let composing = false
let listen: (() => () => void) | undefined

export function configureLayerKeys(bind: () => () => void): void {
	listen = bind
}

export function setLayerComposing(value: boolean): void {
	composing = value
}

function topLayer(retiringToken?: object) {
	let top: (typeof entries)[number] | undefined
	for (const entry of entries) {
		if (entry.token !== retiringToken && entry.isPresent?.() === false) {
			continue
		}

		if (
			!top ||
			entry.depth > top.depth ||
			(entry.depth === top.depth && entry.sequence > top.sequence)
		) {
			top = entry
		}
	}

	return top
}

export function isTopLayer(token: object, retiring = false): boolean {
	return topLayer(retiring ? token : undefined)?.token === token
}

export function layerContains(target: any): boolean {
	return topLayer()?.contains?.(target) ?? false
}

export function shouldCloseLayer(token: object, retiring = false): boolean {
	return !composing && isTopLayer(token, retiring)
}

/** Claim before invoking user code, so synchronous unmount cannot give the
 * same event to the next layer. IME Escape suppresses platform close watchers. */
export function dispatchLayerKey(event: LayerKeyEvent): void {
	if (event.key !== 'Escape' || event.defaultPrevented || !topLayer()) {
		return
	}

	event.preventDefault()
	if (composing || event.isComposing || event.keyCode === 229) {
		return
	}

	const top = topLayer()!
	if (top.behavior === 'close') {
		top.dismiss()
	}
}

export function registerLayer(entry: LayerEntry): () => void {
	let sequence = sequences.get(entry.token)
	if (sequence === undefined) {
		sequence = nextSequence++
		sequences.set(entry.token, sequence)
	}

	const registered = {
		...entry,
		sequence,
		get behavior() {
			return entry.behavior
		},
	}

	entries.push(registered)
	if (!detach && listen) {
		detach = listen()
	}

	return () => {
		const index = entries.indexOf(registered)
		if (index < 0) {
			return
		}

		entries.splice(index, 1)
		if (!entries.length) {
			detach?.()
			detach = undefined
			composing = false
		}
	}
}

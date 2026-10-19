export function focusWebFixture() {
	const queue = new Map<number, () => void>()
	let serial = 0
	const document: any = { activeElement: null, scrollingElement: null }
	const watchers: any[] = []
	class Observer {
		disconnected = false
		callback: () => void
		constructor(callback: () => void) {
			this.callback = callback
			watchers.push(this)
		}
		observe() {
			this.disconnected = false
		}
		disconnect() {
			this.disconnected = true
		}
	}
	const events = new Map<string, Set<() => void>>()
	const window: any = {
		document,
		addEventListener(name: string, callback: () => void) {
			if (!events.has(name)) {
				events.set(name, new Set())
			}
			events.get(name)!.add(callback)
		},
		removeEventListener(name: string, callback: () => void) {
			events.get(name)?.delete(callback)
		},
		MutationObserver: Observer,
		innerWidth: 400,
		innerHeight: 800,
		requestAnimationFrame(callback: () => void) {
			queue.set(++serial, callback)
			return serial
		},
		cancelAnimationFrame(id: number) {
			queue.delete(id)
		},
		getComputedStyle: (node: any) => ({ overflowY: node.overflow ?? 'visible' }),
	}
	const root: any = {
		isConnected: true,
		parentElement: null,
		tagName: 'HTML',
		ownerDocument: document,
		getRootNode: () => document,
		clientLeft: 0,
		clientTop: 0,
		clientWidth: 400,
		clientHeight: 800,
		scrollTop: 100,
		scrollHeight: 1600,
		getBoundingClientRect: () => ({ x: 0, y: -100, width: 400, height: 1600 }),
	}
	const scroll: any = {
		...root,
		tagName: 'DIV',
		parentElement: root,
		overflow: 'auto',
		clientLeft: 1,
		clientTop: 1,
		clientWidth: 300,
		clientHeight: 200,
		scrollTop: 40,
		scrollHeight: 600,
		getBoundingClientRect: () => ({ x: 20, y: 100, width: 302, height: 202 }),
	}
	const field: any = {
		ownerDocument: document,
		parentElement: scroll,
		isConnected: true,
		tagName: 'TEXTAREA',
		isContentEditable: false,
		selectionStart: 1,
		selectionEnd: 3,
		box: { x: 30, y: 240, width: 280, height: 50 },
		getBoundingClientRect() {
			return this.box
		},
	}
	Object.defineProperty(field, 'value', {
		get() {
			throw new Error('Text must never be read')
		},
	})
	Object.defineProperty(field, 'textContent', {
		get() {
			throw new Error('Text must never be read')
		},
	})
	document.activeElement = field
	document.scrollingElement = root
	document.defaultView = window
	return {
		window,
		document,
		root,
		scroll,
		field,
		queue,
		watchers,
		events,
		dispatch: (name: string) => [...(events.get(name) ?? [])].forEach((callback) => callback()),
	}
}

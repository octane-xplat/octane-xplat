/** Gesture ownership stays on the renderer's original NSView, including when
 * layout inserts a margin wrapper. No window-wide input monitor is needed. */

import { NSClickGestureRecognizer, NSEvent, NSGestureRecognizer, NSGestureRecognizerDelegate, NSObject, NSPressGestureRecognizer, NSView, NativeClass, interop } from '@octane-xplat/platform/macos'
interface GestureNode {
	view: NSView | null
	props: Record<string, any>
	container: { root: { eventScope(kind: 'discrete', fn: () => void): void } | null }
	[key: string]: any
}

const nodes = new WeakMap<object, GestureNode>()
const owned = new WeakSet<object>()

function dispatch(node: GestureNode | undefined, name: string, event?: any) {
	if (!node || node.props.disabled || typeof node.props[name] !== 'function') {
		return
	}

	try {
		node.container.root!.eventScope('discrete', () => node.props[name](event))
	} catch (error) {
		console.error('[macos-event] ' + name + ' handler failed', error)
	}
}

/** The JSC host's native property enumeration sees enumerable keys only.
 * Make these renderer-owned methods visible before NativeScript registers them. */
export function registerGestureClass(ctor: any) {
	for (const name of Object.getOwnPropertyNames(ctor.prototype)) {
		if (name === 'constructor') {
			continue
		}

		const descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, name)!
		Object.defineProperty(ctor.prototype, name, { ...descriptor, enumerable: true })
	}

	NativeClass(ctor)
}

class GestureDelegate extends NSObject {
	static ObjCProtocols = [NSGestureRecognizerDelegate]
	static {
		registerGestureClass(this)
	}
	gestureRecognizerShouldRecognizeSimultaneouslyWithGestureRecognizer(
		a: NSGestureRecognizer,
		b: NSGestureRecognizer,
	) {
		// Do not change arbitration with child controls or hosted engines.
		return a.view === b.view && owned.has(a) && owned.has(b)
	}
}

const delegate = GestureDelegate.new()

export function configureGesture(recognizer: NSGestureRecognizer) {
	owned.add(recognizer)
	recognizer.delegate = delegate
	recognizer.delaysPrimaryMouseButtonEvents = false
	return recognizer
}

/** AppKit has no down/up recognizer. This passive mouse observer never claims
 * the sequence from click/pan, and balances down with up or reset/cancel. */
class TouchGestureRecognizer extends NSGestureRecognizer {
	active = false
	static {
		registerGestureClass(this)
	}
	mouseDown(_event: NSEvent) {
		this.active = true
		dispatch(nodes.get(this.view), 'onTouch', { action: 'down', view: this.view })
	}
	mouseDragged(_event: NSEvent) {
		if (!this.active) {
			return
		}

		dispatch(nodes.get(this.view), 'onTouch', { action: 'move', view: this.view })
	}
	mouseUp(_event: NSEvent) {
		if (!this.active) {
			return
		}

		this.active = false
		dispatch(nodes.get(this.view), 'onTouch', { action: 'up', view: this.view })
	}
	reset() {
		if (this.active) {
			this.active = false
			dispatch(nodes.get(this.view), 'onTouch', { action: 'cancel', view: this.view })
		}

		super.reset()
	}
}

class GestureTarget extends NSObject {
	static ObjCExposedMethods = {
		'longPressed:': { params: [NSObject], returns: interop.types.void },
		'doublePressed:': { params: [NSObject], returns: interop.types.void },
	}
	static {
		registerGestureClass(this)
	}
	['longPressed:'](sender: NSGestureRecognizer) {
		this.longPressed(sender)
	}
	['doublePressed:'](sender: NSGestureRecognizer) {
		this.doublePressed(sender)
	}
	longPressed(sender: NSGestureRecognizer) {
		if (Number(sender.state) === 3) {
			dispatch(nodes.get(sender.view), 'onLongPress')
		}
	}
	doublePressed(sender: NSGestureRecognizer) {
		if (Number(sender.state) === 3) {
			dispatch(nodes.get(sender.view), 'onDoubleTap')
		}
	}
}

const target = GestureTarget.new()

export function setPressGesture(node: GestureNode, name: string) {
	nodes.set(node.view!, node)
	const key = name + 'GestureRecognizer'
	let recognizer = node[key] as NSGestureRecognizer | undefined
	if (!recognizer && typeof node.props[name] === 'function') {
		if (name === 'onTouch') {
			recognizer = TouchGestureRecognizer.new() as NSGestureRecognizer
		} else if (name === 'onLongPress') {
			const press = NSPressGestureRecognizer.alloc().initWithTargetAction(target, 'longPressed:')
			press.minimumPressDuration = 0.5
			recognizer = press
		} else {
			const click = NSClickGestureRecognizer.alloc().initWithTargetAction(target, 'doublePressed:')
			click.numberOfClicksRequired = 2
			recognizer = click
		}

		node[key] = configureGesture(recognizer)
		node.view!.addGestureRecognizer(recognizer)
	}

	if (recognizer) {
		recognizer.enabled = !node.props.disabled && typeof node.props[name] === 'function'
	}
}

export function disposePressGestures(node: GestureNode) {
	if (!node.view) {
		return
	}

	// Forget callbacks before AppKit resets a recognizer during teardown.
	nodes.delete(node.view)
	for (const name of ['onTouch', 'onLongPress', 'onDoubleTap']) {
		const recognizer = node[name + 'GestureRecognizer']
		if (recognizer) {
			recognizer.enabled = false
			node.view.removeGestureRecognizer(recognizer)
		}
	}
}

/** NativeScript SwipeDirection values. Only completed drags of at least 30
 * layout points count; cancelled/failed pans never produce a swipe. */
export function swipeDirection(event: { state: number; deltaX: number; deltaY: number }) {
	if (event.state !== 3 || Math.max(Math.abs(event.deltaX), Math.abs(event.deltaY)) < 30) {
		return null
	}

	return Math.abs(event.deltaX) >= Math.abs(event.deltaY)
		? event.deltaX > 0
			? 1
			: 2
		: event.deltaY < 0
			? 4
			: 8
}

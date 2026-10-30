// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
/**
 * Real OS input for AppKit probe cases.
 *
 * These helpers post CoreGraphics events — CGEventPostToPid delivers through
 * the window server into the app's own event queue; CGEventPost to the HID
 * tap goes through the full OS input pipeline to the focused app. Both are
 * dispatched by the host's real NSApp.sendEvent path: local monitors, key
 * equivalents, the responder chain, field editor and hit-testing all run.
 * This is stronger evidence than invokeAction/handler dispatch but the events
 * are still flagged synthetic; it does not prove hardware-key delivery.
 *
 * Everything is resolved through ambient host globals — no framework imports.
 */

export const KVK = {
	A: 0, S: 1, D: 2, F: 3, H: 4, G: 5, Z: 6, X: 7, C: 8, V: 9, B: 11, Q: 12,
	W: 13, E: 14, R: 15, Y: 16, T: 17, Digit1: 18, Digit2: 19, Digit3: 20,
	Digit4: 21, Digit6: 22, Digit5: 23, Equal: 24, Digit9: 25, Digit7: 26,
	Minus: 27, Digit8: 28, Digit0: 29, BracketRight: 30, O: 31, U: 32,
	BracketLeft: 33, I: 34, P: 35, Enter: 36, L: 37, J: 38, Quote: 39, K: 40,
	Semicolon: 41, Backslash: 42, Comma: 43, Slash: 44, N: 45, M: 46, Period: 47,
	Tab: 48, Space: 49, Backquote: 50, Delete: 51, Escape: 53,
	LeftArrow: 123, RightArrow: 124, DownArrow: 125, UpArrow: 126,
	Home: 115, End: 119, PageUp: 116, PageDown: 121, ForwardDelete: 117,
	F1: 122, F2: 120, F3: 99, F4: 118, F5: 96, F6: 97, F7: 98, F8: 100,
}

export const kCGEventFlagMaskShift = 1 << 17
export const kCGEventFlagMaskControl = 1 << 18
export const kCGEventFlagMaskOption = 1 << 19
export const kCGEventFlagMaskCommand = 1 << 20

const native = () => globalThis

function cg(name) {
	const fn = native()[name]
	if (typeof fn !== 'function') {
		throw new Error('AppKit OS input requires the bridged global ' + name)
	}
	return fn
}

const pid = () => Number(native().NSProcessInfo.processInfo.processIdentifier)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const postToPid = (event) => cg('CGEventPostToPid')(pid(), event)
export const postToHid = (event) => cg('CGEventPost')(0 /* kCGHIDEventTap */, event)

/** Post one keyboard event through the real event queue. */
export function postKeyEvent(keyCode, down, flags = 0, mode = 'pid') {
	const event = cg('CGEventCreateKeyboardEvent')(null, keyCode, down)
	if (flags) cg('CGEventSetFlags')(event, flags)
	;(mode === 'hid' ? postToHid : postToPid)(event)
}

/** Post a full key press (down+up). Caller drains via waitFor or sleep. */
export function postKey(keyCode, flags = 0, mode = 'pid') {
	postKeyEvent(keyCode, true, flags, mode)
	postKeyEvent(keyCode, false, flags, mode)
}

/** Post a sequence of presses, waiting briefly for the pump between each. */
export async function postKeys(list, { interval = 60, mode = 'pid' } = {}) {
	for (const [keyCode, flags = 0] of list) {
		postKey(keyCode, flags, mode)
		await sleep(interval)
	}
}

/** Screen coordinates (Quartz top-left origin) for a view's center. */
export function screenPointOfViewCenter(view) {
	const window = view.window
	if (!window) throw new Error('view is not attached to a window')
	const rect = window.convertRectToScreen(
		view.convertRectToView(view.bounds, null),
	)
	const primary = native().NSScreen.screens.objectAtIndex(0)
	return {
		x: Number(rect.origin.x) + Number(rect.size.width) / 2,
		y: Number(primary.frame.size.height) - (Number(rect.origin.y) + Number(rect.size.height) / 2),
	}
}

/**
 * Post a real mouse click at a view's center through the window server.
 * Down and up land through sendEvent → hit-test → tracking/action dispatch.
 */
export async function postClick(view, { button = 'left', mode = 'pid' } = {}) {
	const point = screenPointOfViewCenter(view)
	const right = button === 'right'
	const downType = right ? 3 : 1 // RightMouseDown / LeftMouseDown
	const upType = right ? 4 : 2
	const post = mode === 'hid' ? postToHid : postToPid
	for (const type of [5, downType, upType]) { // move, down, up
		post(cg('CGEventCreateMouseEvent')(null, type, point, right ? 1 : 0))
		await sleep(40)
	}
	return point
}

/** The view whose field editor (or itself) is first responder, or null. */
export function focusedOwner(window) {
	const responder = window?.firstResponder
	if (!responder) return null
	const delegate = responder.delegate
	if (delegate?.window === window) {
		const editor =
			typeof delegate.currentEditor === 'function'
				? delegate.currentEditor()
				: delegate.currentEditor
		if (editor === responder) return delegate
	}
	return responder
}

/** True when the given view owns first responder, counting field editors. */
export function hasFocus(view) {
	const window = view?.window
	if (!window) return false
	return focusedOwner(window) === view
}

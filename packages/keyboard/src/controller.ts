import { keyboardBottomOverlap } from '@octane-xplat/platform/keyboard-geometry'
import { leaseKeyboardProperty } from '@octane-xplat/platform/keyboard-property'
import type { KeyboardPropertyLease } from '@octane-xplat/platform/keyboard-property'
import { observeKeyboardViewport } from '@octane-xplat/platform/keyboard-viewport'
import type { KeyboardViewportLease } from '@octane-xplat/platform/keyboard-viewport'
import type { KeyboardWindowState } from '@octane-xplat/platform/keyboard-state'
import { keyboardRuntime } from './runtime'
import type { KeyboardBindingOptions } from './binding-types'
import type { KeyboardSnapshot, SoftwareKeyboardController } from './types'

const snapshots = new WeakMap<KeyboardWindowState, KeyboardSnapshot>()
const snapshot = (state: KeyboardWindowState): KeyboardSnapshot => {
	let value = snapshots.get(state)
	if (!value) {
		value = {
			inset: state.inset,
			windowRect: state.windowRect,
			currentFrame: state.currentFrame,
			targetFrame: state.targetFrame,
			source: state.source,
			capabilities: {
				geometry: !!state.windowRect && state.source !== 'unknown',
				nativeFrames: state.motion?.nativeFrames ?? state.source === 'native-frames',
				interactive: state.motion?.interactive ?? false,
				floating: state.motion?.floating ?? false,
			},
			phase: state.motion?.phase ?? 'idle',
			transitionId: state.motion?.transitionId ?? 0,
			timestampMs: state.motion?.timestampMs ?? 0,
			durationMs: state.motion?.durationMs ?? null,
		}

		snapshots.set(state, value)
	}
	return value
}

const observeState = (host: object, listener: (state: KeyboardWindowState) => void) => {
	const deactivate = keyboardRuntime.activate()
	let active = true
	let off: () => void
	try {
		off = keyboardRuntime.subscribe(host, (state) => {
			if (active) {
				listener(state)
			}
		})
	} catch (error) {
		active = false
		deactivate()
		throw error
	}
	return () => {
		if (!active) {
			return
		}
		active = false
		try {
			off()
		} finally {
			deactivate()
		}
	}
}

const observe = (host: object, listener: (state: KeyboardSnapshot) => void) =>
	observeState(host, (state) => listener(snapshot(state)))

type Binding = {
	lease: KeyboardPropertyLease
	viewport: KeyboardViewportLease
	owners: KeyboardBindingOptions[]
	state?: KeyboardWindowState
	openExtent: number
	off: () => void
}

const bindings = new WeakMap<object, Binding>()

const apply = (host: object, binding: Binding) => {
	const measured = binding.state,
		options = binding.owners.at(-1)
	if (!measured || !options) {
		return
	}
	const state = measured.bindingFrame
		? { ...measured, currentFrame: measured.bindingFrame }
		: measured
	binding.viewport.update()
	const frame = state.currentFrame ?? state.targetFrame
	const current = keyboardBottomOverlap(state.windowRect, frame)
	const target = keyboardBottomOverlap(state.windowRect, state.targetFrame)
	if (target > 0) {
		binding.openExtent = target
	} else if (!binding.openExtent && current > 0) {
		binding.openExtent = current
	}
	const progress =
		state.source === 'native-frames'
			? Math.min(1, Math.max(0, binding.openExtent ? current / binding.openExtent : 0))
			: state.inset > 0
				? 1
				: 0
	const extra =
		(options.closedOffset ?? 0) +
		((options.openOffset ?? 0) - (options.closedOffset ?? 0)) * progress
	const overlap = keyboardRuntime.overlap(host, state, binding.lease.offset)
	const budget = Math.max(
		0,
		Math.max(state.inset, current) - Math.max(0, options.consumedBottom ?? 0),
	)
	binding.lease.set(-Math.min(overlap, budget) - extra)
	if (current === 0 && target === 0) {
		binding.openExtent = 0
	}
}

/** Software-keyboard observation and movement; separate from hardware useKeyboard.
 * @example
 * ```ts
 * import { KeyboardController } from '@octane-xplat/keyboard'
 * function observe(host: object) {
 *   return KeyboardController.subscribe(host, state => console.log(state.phase))
 * }
 * ```
 */
export const KeyboardController: SoftwareKeyboardController = {
	activate: () => keyboardRuntime.activate(),
	getSnapshot: (host) => snapshot(keyboardRuntime.getSnapshot(host)),
	onMove: observe,
	subscribe(host, listener) {
		let previous: KeyboardSnapshot | undefined
		return observe(host, (state) => {
			const rect = state.targetFrame,
				before = previous?.targetFrame
			const changed =
				!previous ||
				state.source !== previous.source ||
				state.inset !== previous.inset ||
				rect?.x !== before?.x ||
				rect?.y !== before?.y ||
				rect?.width !== before?.width ||
				rect?.height !== before?.height ||
				state.windowRect?.width !== previous.windowRect?.width ||
				state.windowRect?.height !== previous.windowRect?.height ||
				state.capabilities.nativeFrames !== previous.capabilities.nativeFrames ||
				state.capabilities.interactive !== previous.capabilities.interactive ||
				state.capabilities.floating !== previous.capabilities.floating ||
				(state.phase !== 'move' &&
					(state.phase !== previous.phase || state.transitionId !== previous.transitionId))
			previous = state
			if (changed) {
				listener(state)
			}
		})
	},
}

/** @internal Bind only framework-owned native movement hosts. */
export function bindKeyboardHost(host: object, options: KeyboardBindingOptions = {}): () => void {
	if (options.enabled === false) {
		return () => {}
	}
	for (const value of [options.openOffset, options.closedOffset, options.consumedBottom]) {
		if (value !== undefined && !Number.isFinite(value)) {
			throw new RangeError('Keyboard offsets must be finite')
		}
	}
	let binding = bindings.get(host)
	const owned = { ...options }
	if (!binding) {
		const property = keyboardRuntime.property(host)
		if (!property) {
			return () => {}
		}

		binding = {
			lease: leaseKeyboardProperty(property.read, property.write),
			viewport: observeKeyboardViewport(host),
			owners: [owned],
			openExtent: 0,
			off: () => {},
		}

		bindings.set(host, binding)
		const entry = binding
		try {
			entry.off = observeState(host, (state) => {
				entry.state = state
				apply(host, entry)
			})
		} catch (error) {
			bindings.delete(host)
			entry.lease.release()
			entry.viewport.release()
			throw error
		}
	} else {
		binding.owners.push(owned)
		apply(host, binding)
	}
	const entry = binding
	let active = true
	return () => {
		if (!active) {
			return
		}
		active = false
		entry.owners.splice(entry.owners.indexOf(owned), 1)
		if (entry.owners.length) {
			apply(host, entry)
			return
		}
		bindings.delete(host)
		try {
			entry.off()
		} finally {
			try {
				entry.lease.release()
			} finally {
				entry.viewport.release()
			}
		}
	}
}

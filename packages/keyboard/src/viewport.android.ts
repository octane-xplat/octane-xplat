import { leaseKeyboardProperty } from '@octane-xplat/platform/keyboard-property'
import type { KeyboardPropertyLease } from '@octane-xplat/platform/keyboard-property'
import type { KeyboardViewportLease } from './viewport-types'

type Entry = {
	owner: any
	native: any
	previous: string
	count: number
	padding: KeyboardPropertyLease[]
	listener: (event: any) => void
}

const entries = new WeakMap<object, Entry>()
const ownedPolicy = 'dont-apply'
const noLease = (supported: boolean): KeyboardViewportLease => ({
	supported,
	update() {},
	release() {},
})

const nativeFor = (view: any) => view?.nativeViewProtected ?? view?.android
const supportsPadding = (native: any) =>
	native && typeof native.getEdgeInsets === 'function' && typeof native.getImeInsets === 'function'

const paddingOf = (native: any): number[] => {
	const edges = native.getEdgeInsets(),
		ime = native.getImeInsets()
	// Own base padding, not the automatically applied strip. This remains valid
	// if another owner changes the overflow policy while the lease is active.
	return [
		native.getPaddingLeft() - edges.left,
		native.getPaddingTop() - edges.top,
		native.getPaddingRight() - edges.right,
		native.getPaddingBottom() - Math.max(edges.bottom, ime.bottom),
	]
}

const paddingLeases = (native: any) =>
	[0, 1, 2, 3].map((index) =>
		leaseKeyboardProperty(
			() => paddingOf(native)[index],
			(value) => {
				const values = paddingOf(native)
				values[index] = value
				native.setPadding(...values)
			},
		),
	)

const applyBars = (entry: Entry, inset: any) => {
	const cutout = entry.previous.includes('cutout')
	const values = [inset.left, inset.top, inset.right, inset.bottom]
	const cuts = [
		inset.cutoutLeft ?? 0,
		inset.cutoutTop ?? 0,
		inset.cutoutRight ?? 0,
		inset.cutoutBottom ?? 0,
	]
	entry.padding.forEach((lease, index) =>
		lease.set(Math.max(0, values[index] ?? 0, cutout ? cuts[index] : 0)),
	)
}

const requestInsets = (native: any) =>
	(globalThis as any).androidx?.core?.view?.ViewCompat?.requestApplyInsets(native)

const seedBars = (entry: Entry) => {
	const core = (globalThis as any).androidx?.core?.view
	const insets = core?.ViewCompat?.getRootWindowInsets(entry.native)
	const type = core?.WindowInsetsCompat?.Type
	if (!insets || !type) {
		return
	}
	const bars = insets.getInsets(type.systemBars())
	const cutout = type.displayCutout ? insets.getInsets(type.displayCutout()) : undefined
	applyBars(entry, {
		left: bars.left,
		top: bars.top,
		right: bars.right,
		bottom: bars.bottom,
		cutoutLeft: cutout?.left,
		cutoutTop: cutout?.top,
		cutoutRight: cutout?.right,
		cutoutBottom: cutout?.bottom,
	})
}

const update = (entry: Entry, request = true) => {
	if (entry.owner.androidOverflowEdge !== ownedPolicy) {
		return
	}
	const native = nativeFor(entry.owner)
	if (!supportsPadding(native) || entry.native === native) {
		return
	}
	// A detached native view no longer owns the replacement's properties.
	entry.padding.forEach((lease) => lease.release())
	entry.native = native
	entry.padding = paddingLeases(native)
	if (request) {
		seedBars(entry)
		requestInsets(native)
	}
}

/** Lease NativeScript's public inset-distribution event. Its default Page
 * pads by max(navigation, IME) independently of softInputMode. We retain bars
 * and consume IME here so consumers can follow measured frames themselves.
 * No listener on the Activity/decor is replaced. @internal */
export function leaseKeyboardViewport(host: any): KeyboardViewportLease {
	const chain: any[] = []
	for (let view = host; view; view = view.parent) {
		chain.push(view)
	}
	chain.reverse()
	let owner: any
	for (const view of chain) {
		if (entries.has(view)) {
			owner = view
			break
		}

		const policy = view.androidOverflowEdge
		if (policy === 'none' || policy === 'none,cutout') {
			owner = view
			break
		}

		if (policy && policy !== 'ignore') {
			return noLease(false)
		}
	}
	if (!owner) {
		return noLease(!!host?.page)
	}
	let entry = entries.get(owner)
	if (!entry) {
		const native = nativeFor(owner)
		if (
			!supportsPadding(native) ||
			typeof native.setPadding !== 'function' ||
			owner.hasListeners?.('androidOverflowInset')
		) {
			return noLease(false)
		}

		const previous = owner.androidOverflowEdge
		// Clear the old automatically applied strip before capturing base padding.
		owner.androidOverflowEdge = 'ignore'
		entry = {
			owner,
			native,
			previous,
			count: 0,
			padding: paddingLeases(native),
			listener: () => {},
		}

		const own = entry
		own.listener = (event) => {
			if (own.owner.androidOverflowEdge !== ownedPolicy || !event.inset) {
				return
			}
			update(own, false)
			if (own.native !== nativeFor(own.owner)) {
				return
			}
			const inset = event.inset
			applyBars(own, inset)
			inset.leftConsumed = inset.topConsumed = inset.rightConsumed = inset.bottomConsumed = true
			inset.imeBottom = 0
			inset.imeBottomConsumed = true
			if (own.previous.includes('cutout')) {
				inset.cutoutLeftConsumed =
					inset.cutoutTopConsumed =
					inset.cutoutRightConsumed =
					inset.cutoutBottomConsumed =
						true
			}
		}

		entries.set(owner, own)
		try {
			owner.on('androidOverflowInset', own.listener)
			owner.androidOverflowEdge = ownedPolicy
			seedBars(own)
			requestInsets(native)
		} catch (error) {
			entries.delete(owner)
			owner.off('androidOverflowInset', own.listener)
			if (owner.androidOverflowEdge === ownedPolicy || owner.androidOverflowEdge === 'ignore') {
				own.padding.forEach((lease) => lease.release())
				owner.androidOverflowEdge = previous
			}

			throw error
		}
	}
	const own = entry
	own.count++
	let active = true
	return {
		get supported() {
			return (
				active &&
				own.owner.androidOverflowEdge === ownedPolicy &&
				own.native === nativeFor(own.owner)
			)
		},
		update() {
			if (active) {
				update(own)
			}
		},
		release() {
			if (!active) {
				return
			}
			active = false
			if (--own.count) {
				return
			}
			entries.delete(own.owner)
			own.owner.off('androidOverflowInset', own.listener)
			if (own.native === nativeFor(own.owner)) {
				own.padding.forEach((lease) => lease.release())
			}
			if (own.owner.androidOverflowEdge === ownedPolicy) {
				own.owner.androidOverflowEdge = own.previous
				const native = nativeFor(own.owner)
				if (native) {
					requestInsets(native)
				}
			}
		},
	}
}

import { Application, Frame } from '@nativescript/core'

/** Named parallel stacks. A shell (Tabs with `stack` on a spec, the app
 *  entry's root frame) registers its Frame here; `router.push` resolves the
 *  target by name. Native-only concept — on web, parallel stacks map to
 *  nested routes (one linear URL stack). 'root' needs no registration:
 *  unregistered, it resolves to the app's root view when that's a
 *  Frame — the standard `Application.run({ create: () => frame })` boot
 *  shape. An explicit registerStack('root', frame) overrides it. */
const stacks = new Map<string, Frame>()
const regListeners = new Set<(name: string, frame: Frame) => void>()

/**
 * Register a named navigation stack (its root `Frame`/`Outlet`) so `router.push`/`NavLink` can target it.
 *
 * @see getStack, Route.
 */
export function registerStack(name: string, frame: Frame): void {
	stacks.set(name, frame)
	regListeners.forEach((l) => l(name, frame))
}

/**
 * Look up a registered navigation stack by name.
 *
 * @see registerStack.
 */
export function getStack(name: string): Frame | undefined {
	const registered = stacks.get(name)
	if (registered) {
		return registered
	}

	if (name === 'root') {
		const rv = Application.getRootView?.()
		if (rv instanceof Frame) {
			return rv
		}
	}

	return undefined
}

/** All registered stacks in registration order — for hardware-back
 *  resolution (pop whichever stack is visibly on top). */
export function stackEntries(): IterableIterator<[string, Frame]> {
	return stacks.entries()
}

/** Internal: native hosts can observe Frame registrations after startup. */
export function onStackRegistered(cb: (name: string, frame: Frame) => void): void {
	regListeners.add(cb)
}

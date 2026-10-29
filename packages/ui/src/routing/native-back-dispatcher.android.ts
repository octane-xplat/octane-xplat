import { Application } from '@nativescript/core'
import type { NativeRouterBackEvent, NativeRouterBackHandler } from './native-back-types'

type Registration = NativeRouterBackHandler & { order: number }
type BackState = {
	sequence: number
	registrations: Map<object | string, Registration>
}

const stateKey = Symbol.for('octane-xplat.routing.android-back')

/** @internal Shared by routed Frames, pane histories, modals and interceptors.
 * Priority and ownership prevent a background flow from consuming Back.
 * The listener and keyed registrations survive module replacement. */
export function registerNativeBackHandler(
	key: object | string,
	handler: NativeRouterBackHandler,
): () => void {
	const android = Application?.android
	if (!android) {
		return () => {}
	}
	const app = Application as unknown as Record<symbol, BackState | undefined>
	let state = app[stateKey]
	if (!state) {
		state = { sequence: 0, registrations: new Map() }
		app[stateKey] = state
		const current = state
		android.on(
			Application.AndroidApplication.activityBackPressedEvent,
			(event: NativeRouterBackEvent) => {
				if (event.cancel) {
					return
				}
				const handlers = [...current.registrations.entries()].sort(
					([, a], [, b]) => b.priority - a.priority || b.order - a.order,
				)
				for (const [key, registration] of handlers) {
					if (current.registrations.get(key) !== registration) {
						continue
					}

					try {
						if (!registration.handle(event)) {
							continue
						}
					} catch {
						// Do not dismiss a protected surface or exit after a failed claim.
						console.warn('[octane-xplat] Android Back handler failed')
					}

					event.cancel = true
					return
				}
			},
		)
	}
	const registration = { ...handler, order: ++state.sequence }
	state.registrations.set(key, registration)
	return () => {
		if (state.registrations.get(key) === registration) {
			state.registrations.delete(key)
		}
	}
}

/** @internal SDK modal events identify their View as object; Activity events
 * identify Application. Do not intercept a different surface in that Activity. */
export function isNativeActivityBackEvent(event: NativeRouterBackEvent): boolean {
	return (
		event.object === undefined ||
		event.object === Application ||
		event.object === Application.android
	)
}

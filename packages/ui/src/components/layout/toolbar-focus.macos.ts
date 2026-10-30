import type { NSView, NSWindow } from '@octane-xplat/platform/macos'
import type { KeyboardEvent } from '../../internal/keyboard/use-keyboard.types'
import { appKitHost } from '../../internal/platform/host-bridge'
import { createAppKitChoiceFocus } from '../forms/choice-focus.macos'

export type AppKitToolbarFocus = {
	bind: (view: NSView | null) => void
	update: () => void
	dispose: () => void
	keyDown(event: KeyboardEvent): void
}

const read = (view: NSView, key: string) => {
	const value = Reflect.get(view, key)
	return typeof value === 'function' ? value.call(view) : value
}

const enabled = (view: NSView, key: string) => {
	const value = read(view, key)
	return value == null || Boolean(value)
}

const discrete = new Set(['AXButton', 'AXLink', 'AXCheckBox', 'AXRadioButton'])
const composites = new Set([
	'AXToolbar',
	'AXRadioGroup',
	'AXTabGroup',
	'AXMenu',
	'AXList',
	'AXOutline',
	'AXTable',
])

/** Manual focus for discrete toolbar actions. Editors, adjustable controls and
 * nested composites keep their own keys and natural Tab/focus ownership. */
export function createAppKitToolbarFocus(
	options: { orientation(): 'horizontal' | 'vertical' },
	bridge: typeof appKitHost = appKitHost,
	native: () => Record<string, any> = () => globalThis,
): AppKitToolbarFocus {
	type Scope = {
		view: NSView
		window: NSWindow | null
		live: boolean
		refreshing: boolean
		handling: boolean
		views: Map<string, NSView>
		last?: string
		stop?: () => void
		navigation: ReturnType<typeof createAppKitChoiceFocus>
	}
	let current: Scope | null = null,
		serial = 0,
		queued = false
	const keys = new WeakMap<NSView, string>()
	const supported = () =>
		!!bridge()?.keyboardEventsSupported && typeof bridge()?.suppressTabStop === 'function'
	const owns = (scope: Scope) => current === scope && scope.live
	const release = (scope: Scope) => {
		scope.live = false
		const stop = scope.stop
		scope.stop = undefined
		try {
			stop?.()
		} catch {
			console.warn('[macos-toolbar] observer removal failed')
		}
		try {
			scope.navigation.dispose()
		} catch {
			console.warn('[macos-toolbar] Tab release failed')
		}
		try {
			scope.window?.recalculateKeyViewLoop()
		} catch {
			console.warn('[macos-toolbar] key loop refresh failed')
		}
		scope.views.clear()
	}
	const refresh = (scope: Scope) => {
		if (!owns(scope) || scope.refreshing) {
			return
		}
		scope.refreshing = true
		try {
			const window = scope.view.window
			if (
				!window ||
				!scope.stop ||
				!supported() ||
				read(scope.view, 'hidden') ||
				read(scope.view, 'hiddenOrHasHiddenAncestor')
			) {
				scope.navigation.dispose()
				scope.views.clear()
				scope.window = null
				return
			}

			if (scope.window !== window) {
				scope.navigation.dispose()
				scope.last = undefined
				scope.window = window
			}

			if (!owns(scope)) {
				return
			}

			const found = new Map<string, NSView>()
			const visit = (view: NSView) => {
				if (
					!owns(scope) ||
					scope.view.window !== window ||
					view.window !== window ||
					read(view, 'hidden') ||
					read(view, 'hiddenOrHasHiddenAncestor')
				) {
					return
				}
				if (view !== scope.view) {
					const role = read(view, 'accessibilityRole')
					if (composites.has(role)) {
						return
					}

					if (discrete.has(role)) {
						if (
							read(view, 'acceptsFirstResponder') &&
							enabled(view, 'isAccessibilityEnabled') &&
							enabled(view, 'enabled')
						) {
							let key = keys.get(view)
							if (!key) {
								key = `toolbar-${++serial}`
								keys.set(view, key)
							}

							found.set(key, view)
						}

						return // Nested endContent controls keep their own input.
					}
				}
				const children = view.subviews
				for (let index = 0; index < Number(children?.count ?? 0); index++) {
					visit(children.objectAtIndex(index) as NSView)
				}
			}

			visit(scope.view)
			if (!owns(scope) || scope.view.window !== window) {
				return
			}

			scope.views.clear()
			for (const [key, view] of found) {
				scope.views.set(key, view)
			}

			const focused = [...found].find(([, view]) => view === window.firstResponder)?.[0]
			if (focused) {
				scope.last = focused
			}

			if (scope.last && !found.has(scope.last)) {
				scope.last = undefined
			}

			scope.navigation.synchronize()
		} finally {
			scope.refreshing = false
			// A native acquisition may finish after a reentrant bind/teardown.
			if (!owns(scope)) {
				try {
					scope.navigation.dispose()
				} catch {
					console.warn('[macos-toolbar] late Tab release failed')
				}
			}
		}
	}
	const refreshSafely = (scope: Scope) => {
		try {
			refresh(scope)
		} catch {
			console.warn('[macos-toolbar] focus refresh failed')
		}
	}
	const update = (): void => {
		if (queued) {
			return
		}
		queued = true
		void Promise.resolve().then(() => {
			queued = false
			if (current) {
				refreshSafely(current)
			}
		})
	}
	const bind = (view: NSView | null): void => {
		if (current?.view === view) {
			return
		}
		const previous = current
		if (!view) {
			current = null
			if (previous) {
				release(previous)
			}

			return
		}
		const views = new Map<string, NSView>()
		const scope: Scope = {
			view,
			views,
			window: null,
			live: true,
			refreshing: false,
			handling: false,
			navigation: createAppKitChoiceFocus(
				{
					root: () => (owns(scope) ? view : null),
					views,
					selected: () => scope.last,
					orientation: () => 'both',
					direction: () => 'ltr',
					reveal: (target) => {
						if (owns(scope) && target.window === view.window) {
							target.scrollRectToVisible(target.bounds)
						}
					},
				},
				() => {
					const source = bridge(),
						suppress = source?.suppressTabStop
					return {
						keyboardEventsSupported:
							owns(scope) && !!scope.stop && !!source?.keyboardEventsSupported,
						suppressTabStop:
							typeof suppress === 'function'
								? (target: NSView) => {
										if (!owns(scope)) {
											return () => {}
										}
										const off = suppress.call(source, target)
										if (typeof off !== 'function') {
											throw new Error('AppKit toolbar Tab ownership unavailable')
										}
										let active = true
										return () => {
											if (!active) {
												return
											}
											active = false
											try {
												off()
											} catch {
												console.warn('[macos-toolbar] Tab release failed')
											}
										}
									}
								: undefined,
					}
				},
			),
		}
		current = scope // Claim before old cleanup or observer acquisition effects.
		if (previous) {
			release(previous)
		}
		if (!owns(scope)) {
			return
		}
		try {
			const host = native(),
				center = host.NSNotificationCenter?.defaultCenter

			const add = center?.addObserverForNameObjectQueueUsingBlock,
				remove = center?.removeObserver

			if (typeof add === 'function' && typeof remove === 'function') {
				const token = add.call(
					center,
					host.NSWindowDidUpdateNotification ?? 'NSWindowDidUpdateNotification',
					null,
					null,
					(note: { object: NSWindow }) => {
						if (owns(scope) && (note.object === view.window || note.object === scope.window)) {
							refreshSafely(scope)
						}
					},
				)

				if (token != null) {
					let active = true
					const stop = () => {
						if (active) {
							active = false
							remove.call(center, token)
						}
					}

					if (owns(scope)) {
						scope.stop = stop
					} else {
						stop()
					}
				}
			}
		} catch {
			console.warn('[macos-toolbar] focus observation unavailable')
		}
		if (owns(scope)) {
			update()
		}
	}
	return {
		bind,
		update,
		dispose: (): void => bind(null),
		keyDown(event: KeyboardEvent): void {
			const scope = current
			if (
				!scope ||
				!owns(scope) ||
				!scope.stop ||
				scope.handling ||
				!supported() ||
				event.defaultPrevented ||
				event.isComposing ||
				event.altKey ||
				event.ctrlKey ||
				event.metaKey ||
				event.shiftKey
			) {
				return
			}
			const vertical = options.orientation() === 'vertical'
			if (
				![
					'Home',
					'End',
					...(vertical ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight']),
				].includes(event.key)
			) {
				return
			}
			scope.handling = true
			try {
				refresh(scope)
				if (!owns(scope) || !scope.window || scope.view.window !== scope.window) {
					return
				}

				const rows = scope.navigation.orderedKeys(),
					index = rows.findIndex((key) => scope.views.get(key) === scope.window!.firstResponder)

				if (index < 0) {
					return
				} // Editors, foreign/nested responders keep their keys.

				const next =
					event.key === 'Home'
						? 0
						: event.key === 'End'
							? rows.length - 1
							: (index +
									(event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? rows.length - 1 : 1)) %
								rows.length

				if (
					scope.navigation.focus(rows[next]) &&
					owns(scope) &&
					scope.view.window === scope.window
				) {
					scope.last = rows[next]
					event.preventDefault()
					event.stopPropagation()
				}
			} finally {
				scope.handling = false
			}
		},
	}
}

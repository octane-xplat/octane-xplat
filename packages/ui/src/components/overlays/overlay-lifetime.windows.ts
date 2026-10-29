import { Microsoft, NSWinRT } from '@octane-xplat/platform/windows'
import { dispatchLayerKey } from './layer-stack'
import { trackWindowsOverlayExit } from './windows-overlay-exit'
import { createOverlayLifetime as createRootLifetime } from './overlay-lifetime-common'

type Background = {
	view: any
	native: any
	enabled?: boolean
	hitTest?: boolean
	owners: Set<object>
}

const backgrounds = new WeakMap<object, Background>()
const booleanProperty = (native: any, key: string): boolean | undefined => {
	try {
		const value = native[key]
		return typeof value === 'boolean' ? value : undefined
	} catch {
		return undefined
	}
}

/** Keep nested/out-of-order modal cleanup from enabling another modal's background. */
function holdBackground(view: any, token: object): () => void {
	const native = view.nativeViewProtected
	if (!native) {
		return () => {}
	}
	let entry = backgrounds.get(native)
	if (!entry) {
		const enabled = booleanProperty(native, 'IsEnabled')
		const hitTest = booleanProperty(native, 'IsHitTestVisible')
		if (enabled === undefined && hitTest === undefined) {
			throw new Error('Modal background has no native input guard')
		}

		try {
			if (enabled !== undefined) {
				native.IsEnabled = false
			}

			if (hitTest !== undefined) {
				native.IsHitTestVisible = false
			}
		} catch (error) {
			const errors = [error]
			try {
				if (enabled !== undefined) {
					native.IsEnabled = enabled
				}
			} catch (rollback) {
				errors.push(rollback)
			}

			try {
				if (hitTest !== undefined) {
					native.IsHitTestVisible = hitTest
				}
			} catch (rollback) {
				errors.push(rollback)
			}

			throw new AggregateError(errors, 'Windows modal background setup failed')
		}

		entry = { view, native, enabled, hitTest, owners: new Set() }
		backgrounds.set(native, entry)
	}
	const held = entry
	held.owners.add(token)
	return () => {
		if (!held.owners.delete(token) || held.owners.size) {
			return
		}
		backgrounds.delete(native)
		if (view.nativeViewProtected !== native) {
			return
		}
		const errors: unknown[] = []
		try {
			if (held.enabled !== undefined) {
				native.IsEnabled = view.isEnabled === false ? false : held.enabled
			}
		} catch (error) {
			errors.push(error)
		}
		try {
			if (held.hitTest !== undefined) {
				native.IsHitTestVisible =
					view.isEnabled === false || view.isUserInteractionEnabled === false ? false : held.hitTest
			}
		} catch (error) {
			errors.push(error)
		}
		if (errors.length) {
			throw new AggregateError(errors, 'Windows modal background cleanup failed')
		}
	}
}

/** Panels lack Control.IsEnabled: block hit tests there and guard descendant controls. */
function holdTree(view: any, token: object, releases: (() => void)[]): void {
	const native = view.nativeViewProtected
	if (native) {
		const isControl = booleanProperty(native, 'IsEnabled') !== undefined
		releases.push(holdBackground(view, token))
		if (isControl) {
			return
		}
	}
	view.eachChildView?.((child: any) => {
		holdTree(child, token, releases)
		return true
	})
}

/** Windows modal behavior on the existing RootLayout; other overlay kinds retain their backend. */
export function createOverlayLifetime(
	...args: Parameters<typeof createRootLifetime>
): ReturnType<typeof createRootLifetime> {
	const [owner, host, , label] = args
	if (label !== 'Dialog') {
		return createRootLifetime(...args)
	}

	const root = owner as any
	let closingNative = false
	const scopedOwner = {
		open: (target: any, options?: any) => owner.open(target, options),
		close: (target: any) => {
			closingNative = true
			try {
				const result = owner.close(target).finally(releaseBackground)
				trackWindowsOverlayExit(root.nativeViewProtected?.XamlRoot, result)
				return result
			} catch (error) {
				releaseBackground()
				throw error
			}
		},
		removeChild: (target: any) => owner.removeChild(target),
		hasChild: (target: any) => root.hasChild(target),
		getPopupIndex: (target: any) => root.getPopupIndex(target),
	}
	const lifetime = createRootLifetime(scopedOwner, host, args[2], label, args[4])
	const view = host as any
	const token = {}
	const releases: (() => void)[] = []
	function releaseBackground(): void {
		for (const release of releases.reverse()) {
			try {
				release()
			} catch (error) {
				console.error('[Dialog] Windows modal cleanup failed', error)
			}
		}
		releases.length = 0
	}
	let retired = false
	let opened = false
	let native: any
	let tabMode: any
	let hasTabMode = false
	let tabStop: any
	let changedTabStop = false
	const onKey = (event: any) => {
		if (retired || !view.isLoaded || view.nativeViewProtected !== native) {
			return
		}
		const key = event.nativeEvent
		if (Number(key?.Key) !== 27 || key.Handled === true) {
			return
		}
		dispatchLayerKey({
			key: 'Escape',
			acceptScope(scope) {
				try {
					const host = scope as any
					const target =
						host?.nativeViewProtected ?? host?.native?.nativeViewProtected ?? host?.native ?? host

					return target?.XamlRoot === native.XamlRoot
				} catch {
					return false
				}
			},
			keyCode: Number(key?.OriginalKey ?? key.Key),
			isComposing: event.isComposing === true,
			preventDefault: () => event.preventDefault(),
		})
	}
	lifetime.own(() => {
		retired = true
		const errors: unknown[] = []
		try {
			host.off('keyDown', onKey)
		} catch (error) {
			errors.push(error)
		}
		// If setup failed before owner.close, there is no native exit to wait for.
		void Promise.resolve().then(() => {
			if (!closingNative) {
				releaseBackground()
			}
		})
		if (hasTabMode && native && view.nativeViewProtected === native) {
			try {
				native.TabFocusNavigation = tabMode
			} catch (error) {
				errors.push(error)
			}
		}
		if (changedTabStop && native && view.nativeViewProtected === native) {
			try {
				native.IsTabStop = tabStop
			} catch (error) {
				errors.push(error)
			}
		}
		for (const error of errors) {
			console.error('[Dialog] Windows modal cleanup failed', error)
		}
	})

	return {
		...lifetime,
		open(options, afterOpen) {
			if (opened || retired) {
				return
			}
			opened = true
			try {
				if (typeof root.eachChildView !== 'function') {
					throw new Error('Modal root cannot enumerate its content')
				}

				root.eachChildView((child: any) => {
					// RootLayout owns a shared clickable shade; it must remain interactive.
					if (child !== host && child !== root._shadeCover) {
						holdTree(child, token, releases)
					}
					return true
				})

				host.on('keyDown', onKey)
			} catch (error) {
				console.error('[Dialog] Windows modal setup failed', error)
				lifetime.close()
				return
			}
			lifetime.open(options, async () => {
				if (retired) {
					return
				}
				native = view.nativeViewProtected
				if (!native?.XamlRoot || native.XamlRoot !== root.nativeViewProtected?.XamlRoot) {
					throw new Error('Modal content is not attached to its declaring XamlRoot')
				}
				tabMode = native.TabFocusNavigation
				hasTabMode = true
				native.TabFocusNavigation = Microsoft.UI.Xaml.Input.KeyboardNavigationMode.Cycle
				let first = Microsoft.UI.Xaml.Input.FocusManager.FindFirstFocusableElement(native)
				if (!first) {
					tabStop = native.IsTabStop
					changedTabStop = true
					native.IsTabStop = true
					first = native
				}
				if (first) {
					const result = await NSWinRT.toPromise(
						Microsoft.UI.Xaml.Input.FocusManager.TryFocusAsync(
							first,
							Microsoft.UI.Xaml.FocusState.Programmatic,
						),
					)

					if (!result?.Succeeded) {
						throw new Error('Modal initial focus was rejected')
					}
				}
				if (retired) {
					return
				}
				await afterOpen?.()
			})
		},
	}
}

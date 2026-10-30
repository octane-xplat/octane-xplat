import { useCallback, useContext, useId, useLayoutEffect, useRef } from 'octane'
import { AppKitMenuRowsContext } from './menu-rows.macos'
import type { AppKitMenuRow } from './menu-rows.macos'
import type { NSView } from '@octane-xplat/platform/macos'

/** Current row intents are shared by pointer and menu keyboard activation. */
export function useAppKitMenuRow(row: AppKitMenuRow) {
	const registry = useContext(AppKitMenuRowsContext),
		key = useId()

	const own = useRef<NSView | null>(null),
		latest = useRef(row)

	latest.current = row
	const press = useCallback(() => {
		if (own.current && !latest.current.disabled) {
			latest.current.press()
		}
	}, [])

	const openSubmenu = useCallback(() => {
		if (own.current && !latest.current.disabled) {
			latest.current.openSubmenu?.()
		}
	}, [])

	const ref = useCallback(
		(view: NSView | null) => {
			if (own.current && registry && registry.views.get(key) === own.current) {
				registry.willRemove?.(key, own.current)
				registry.views.delete(key)
				registry.rows.delete(key)
			}

			own.current = view
			if (view && registry) {
				registry.views.set(key, view)
				registry.rows.set(key, () => ({
					...latest.current,
					press,
					openSubmenu: latest.current.openSubmenu ? openSubmenu : undefined,
				}))
			}

			registry?.changed?.()
		},
		[registry, key],
	)

	useLayoutEffect(() => {
		registry?.changed?.()
	}, [registry, row.disabled])

	return { ref, press }
}

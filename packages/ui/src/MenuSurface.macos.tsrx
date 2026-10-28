/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useContext, useEffect, useMemo, useRef } from 'octane'
import type { MenuSurfaceProps } from './props'
import { MenuProvider } from './menu-context'
import { AppKitMenuReturnContext } from './menu-return.macos'
import { AppKitMenuRowsProvider } from './menu-rows.macos'
import { createAppKitChoiceFocus } from './choice-focus.macos'
import { createAppKitMenuKeyboard } from './menu-keyboard.macos'
import { appKitHost } from './host-bridge'
import { useDirection } from './internationalization'
import { useKeyboard } from './use-keyboard.macos'
import { cx } from '@octane-xplat/lib'
import { Pressable } from './Pressable.macos.tsrx'
import { Text } from './Text.macos.tsrx'
import type { AppKitMenuRow } from './menu-rows.macos'

/** Each popup root owns its rows, native focus claims and existing close callbacks. */
export function MenuSurface(props: MenuSurfaceProps) @{
	const returnOwner = useContext(AppKitMenuReturnContext), liveReturnOwner = useRef(returnOwner)
	liveReturnOwner.current = returnOwner
	const context = { closeMenu: () => props.closeMenu(), menuSize: 'md' as const }
	const panel = useRef<NSView | null>(null), lease = useRef<(() => void) | null>(null)
	const registry = useRef({ views: new Map<string, NSView>(), rows: new Map<string, () => AppKitMenuRow>() })
	const live = useRef(props), direction = useDirection(), liveDirection = useRef(direction)
	live.current = props; liveDirection.current = direction
	const owner = useRef<NSWindow | null>(null), pendingFocus = useRef(true)
	const navigation = useMemo(() => createAppKitChoiceFocus({
		root: () => panel.current, views: registry.current.views, selected: () => undefined,
		orientation: () => 'both', direction: () => liveDirection.current,
		reveal: (view) => { view.scrollRectToVisible(view.bounds) },
	}), [])
	const rows = () => navigation.orderedKeys().flatMap((key) => {
		const row = registry.current.rows.get(key)?.()
		return row && !row.disabled ? [{ key, label: row.label, submenu: Boolean(row.openSubmenu) }] : []
	})
	const keyboard = useMemo(() => createAppKitMenuKeyboard({
		rows, focused: () => {
			const focused = navigation.focusedView()
			return [...registry.current.views].find(([, view]) => view === focused)?.[0]
		},
		focus: navigation.focus,
		press: (key) => registry.current.rows.get(key)?.().press(),
		openSubmenu: (key) => registry.current.rows.get(key)?.().openSubmenu?.(),
		get closeLevel() { return live.current.closeLevel },
		closeOnTab: (backward) => {
			const owner = liveReturnOwner.current, target = owner?.resolveTab(backward)
			if (!owner || !target) return false
			owner.requestTab(target); return true
		},
		closeMenu: () => live.current.closeMenu(), direction: () => liveDirection.current,
	}), [])
	const initialize = () => {
		const view = panel.current, window = view?.window
		if (!window || !appKitHost()?.keyboardEventsSupported) return
		if (owner.current !== window) {
			navigation.dispose(); keyboard.reset(); owner.current = window; pendingFocus.current = true
		}
		navigation.synchronize()
		if (!pendingFocus.current) return
		const edge = live.current.initialFocus ?? 'container', enabled = rows()
		const key = enabled[edge === 'last' ? enabled.length - 1 : 0]?.key
		if (edge === 'container' || !key) {
			if (window.makeFirstResponder(view)) pendingFocus.current = false
		} else if (navigation.focus(key)) pendingFocus.current = false
	}
	const initializeLatest = useRef(initialize)
	initializeLatest.current = initialize
	const bind = useCallback((view: NSView | null) => {
		lease.current?.(); lease.current = null
		if (!view) { navigation.dispose(); keyboard.reset(); owner.current = null; pendingFocus.current = true }
		panel.current = view
		if (view) {
			const retain = appKitHost()?.retainFocusTarget
			if (typeof retain === 'function') {
				const release = retain(view)
				if (typeof release !== 'function') throw new Error('AppKit menu focus ownership unavailable')
				lease.current = release
			}
			Promise.resolve().then(() => { if (panel.current === view) initializeLatest.current() })
		}
	}, [])
	const keys = useKeyboard({ onKeyDown: (event) => {
		const view = panel.current, responder = view?.window?.firstResponder
		if (!view || !responder) return
		const rowFocused = [...registry.current.views.values()].some((row) => row === responder)
		// Nested endContent editors/buttons own their keys. Tab still requests dismissal.
		if (!rowFocused && responder !== view && event.key !== 'Tab' && event.key !== 'Escape') return
		keyboard.keyDown(event)
	} }).keyboardProps
	useEffect(() => {
		const native = globalThis as Record<string, any>, center = native.NSNotificationCenter?.defaultCenter
		if (!appKitHost()?.keyboardEventsSupported || !center?.addObserverForNameObjectQueueUsingBlock || !center?.removeObserver) return
		let token: unknown
		try {
			token = center.addObserverForNameObjectQueueUsingBlock(native.NSWindowDidUpdateNotification ?? 'NSWindowDidUpdateNotification', null, null,
				(notification: { object: NSWindow }) => { if (notification.object === panel.current?.window) initializeLatest.current() })
		} catch (error) { console.warn('[macos-menu] focus observation unavailable', error); return }
		return () => { if (token != null) center.removeObserver(token) }
	}, [])
	useEffect(() => () => { navigation.dispose(); keyboard.reset(); lease.current?.(); lease.current = null }, [])

	<masonview ref={bind} {...keys} className={cx('vx-menu-list', 'vx-menu-list--appkit', props.className)} style={props.style}
		accessibilityRole="menu" accessibilityLabel={props.label}>
		<MenuProvider value={context}>
			<AppKitMenuRowsProvider value={registry.current}>
				{props.closeLevel && (
					<Pressable accessibilityLabel="Back to parent menu" onPress={props.closeLevel}>
						<Text>Back</Text>
					</Pressable>
				)}
				{props.children}
			</AppKitMenuRowsProvider>
		</MenuProvider>
	</masonview>
}

<style>
	.vx-menu-list--appkit { display: flex; flex-direction: column; }
</style>

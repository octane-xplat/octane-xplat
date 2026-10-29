/** @jsxImportSource @octane-xplat/jsx */
import type { NSView, NSWindow } from '@octane-xplat/platform/macos'
import './MenuSurface.macos.css'
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'octane'
import type { MenuSurfaceProps } from '../../props'
import { MenuProvider } from './menu-context'
import { AppKitMenuReturnContext } from './menu-return.macos'
import { AppKitMenuRowsProvider } from './menu-rows.macos'
import { createAppKitChoiceFocus } from '../forms/choice-focus.macos'
import { createAppKitMenuKeyboard } from './menu-keyboard.macos'
import { createAppKitMenuFocus } from './menu-focus.macos'
import { appKitHost } from '../../internal/platform/host-bridge'
import { useDirection } from '../../internal/platform/internationalization'
import { useKeyboard } from '../../internal/keyboard/use-keyboard.macos'
import { cx } from '@octane-xplat/lib'
import { Pressable } from '../actions/Pressable.macos.tsrx'
import { Text } from '../content/Text.macos.tsrx'
import type { AppKitMenuRows } from './menu-rows.macos'

/** Each popup root owns its rows, native focus claims and existing close callbacks. */
export function MenuSurface(props: MenuSurfaceProps) @{
	const returnOwner = useContext(AppKitMenuReturnContext), liveReturnOwner = useRef(returnOwner)
	liveReturnOwner.current = returnOwner
	const context = { closeMenu: () => props.closeMenu(), menuSize: 'md' as const }
	const panel = useRef<NSView | null>(null), lease = useRef<(() => void) | null>(null)
	const registry = useRef<AppKitMenuRows>({ views: new Map(), rows: new Map() })
	const live = useRef(props), direction = useDirection(), liveDirection = useRef(direction)
	live.current = props; liveDirection.current = direction
	const navigation = useMemo(() => createAppKitChoiceFocus({
		root: () => panel.current, views: registry.current.views, selected: () => undefined,
		orientation: () => 'both', direction: () => liveDirection.current,
		reveal: (view) => { view.scrollRectToVisible(view.bounds) },
	}), [])
	const rows = () => navigation.orderedKeys().flatMap((key) => {
		const row = registry.current.rows.get(key)?.()
		return row && !row.disabled ? [{ key, label: row.label, submenu: Boolean(row.openSubmenu) }] : []
	})
	const resetKeyboard = useRef<() => void>(() => {})
	const focusState = useMemo(() => createAppKitMenuFocus({
		root: () => panel.current, views: registry.current.views, eligible: () => rows().map((row) => row.key),
		initial: () => live.current.initialFocus ?? 'container', supported: () => Boolean(appKitHost()?.keyboardEventsSupported),
		navigation, resetKeyboard: () => resetKeyboard.current(),
	}), [])
	const keyboard = useMemo(() => createAppKitMenuKeyboard({
		rows, focused: () => {
			const focused = navigation.focusedView()
			return [...registry.current.views].find(([, view]) => view === focused)?.[0]
		},
		focus: focusState.focus,
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

	resetKeyboard.current = keyboard.reset

	const queued = useRef(false)
	const refresh = () => { try { focusState.refresh() } catch (error) { console.warn('[macos-menu] focus refresh failed', error) } }
	const queueRefresh = () => {
		if (queued.current) return
		queued.current = true
		void Promise.resolve().then(() => { queued.current = false; if (panel.current) refresh() })
	}
	registry.current.changed = queueRefresh
	registry.current.willRemove = focusState.removed
	useLayoutEffect(queueRefresh)

	const bind = useCallback((view: NSView | null) => {
		if (panel.current === view) return
		focusState.reset(); panel.current = null
		lease.current?.(); lease.current = null
		panel.current = view
		if (view) {
			const retain = appKitHost()?.retainFocusTarget
			if (typeof retain === 'function') {
				const release = retain(view)
				if (typeof release !== 'function') throw new Error('AppKit menu focus ownership unavailable')
				lease.current = release
			}
			queueRefresh()
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
				(notification: { object: NSWindow }) => { if (focusState.observes(notification.object)) refresh() })
		} catch (error) { console.warn('[macos-menu] focus observation unavailable', error); return }
		return () => { if (token != null) center.removeObserver(token) }
	}, [])
	useEffect(() => () => bind(null), [])

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

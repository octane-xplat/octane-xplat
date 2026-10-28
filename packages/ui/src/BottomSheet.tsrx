/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { SheetContent } from './sheet-content'
import type { PercentLengthType } from '@nativescript/core'
import { useContext, useEffect, useMemo, useRef, useState } from 'octane'
import { GridLayout, Screen, isAndroid, isIOS } from '@nativescript/core'
import { createPortal } from './native-portal'
import { SizeProvider } from './size-context'
import type { BottomSheetProps, BottomSheetSwitcherProps } from './props'
import {
	BottomSheetSwitcherContext,
	BottomSheetSwitcherProvider,
	type BottomSheetRegistration,
	type BottomSheetSwitcherHandle,
} from './bottom-sheet-context'

import { createStore } from './store'
import { useStore } from './use-store.tsrx'
import { cx } from '@octane-xplat/lib'
import { applyThemeClasses } from './theme/theme-host'
import { rootLayoutFor } from './root-layout'
import { createOverlayLifetime } from './overlay-lifetime'
import { attachSheetDetents, type SheetDetentsController } from './sheet-detents'
import { normalizeSnapPoints } from './sheet-snap'
import { createKeyboardOverlayHost, keyboardOverlayAnimation } from './keyboard-overlay-host'
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal'
import { attachTapToBlur } from './tap-to-blur'

interface ToastOwner {
	hasChild?(v: any): boolean
	getPopupIndex?(v: any): number
	removeChild?(v: any): void
	close?(v: any): Promise<unknown> | void
}

const screenVh = () => Screen.mainScreen.heightDIPs

/** `height` budget → dips; null keeps the content-sized panel. */
function sheetHeightDips(height: BottomSheetProps['height'], vh: number): number | null {
	if (height == null || height === 'capped') {
		return vh * 0.62
	}

	if (height === 'hug') {
		return null
	}

	if (height === 'tall') {
		return vh * 0.92
	}

	if (typeof height === 'number') {
		return height
	}

	const trimmed = String(height).trim()
	if (trimmed.endsWith('%')) {
		return (parseFloat(trimmed) / 100) * vh
	}

	return parseFloat(trimmed) || null
}

/** The sheet's content — rendered in its portal host. */
function BottomSheetBody(props: { children?: any; layerDepth: number }) @{
	<>
		<LayerDepthProvider value={props.layerDepth}>
			<SizeProvider value={null}>{props.children}</SizeProvider>
		</LayerDepthProvider>
	</>
}

/** One open bottom-sheet host on a RootLayout: theme classes, bottom
 *  docking, grabber + snap/swipe gestures, keyboard lift, tap-to-blur.
 *  Shared by the declarative standalone and the imperative service. */
export function attachBottomSheetHost(
	host: GridLayout,
	props: {
		label?: string
		height?: BottomSheetProps['height']
		snapPoints?: BottomSheetProps['snapPoints']
		purpose?: BottomSheetProps['purpose']
		className?: any
		style?: any
		ios?: Record<string, any>
		android?: Record<string, any>
	},
	lifetime: ReturnType<typeof createOverlayLifetime>,
	closeNow: () => void,
): () => void {
	const purpose = props.purpose ?? 'info'
	host.horizontalAlignment = 'stretch'
	host.verticalAlignment = 'bottom'
	host.accessibilityLabel = props.label ?? ''
	if (props.style) {
		Object.assign(host.style, props.style)
	}

	Object.assign(host, isIOS ? props.ios : isAndroid ? props.android : undefined)

	const detentFractions = props.snapPoints?.length
		? normalizeSnapPoints(props.snapPoints, screenVh())
		: []

	// Snap points fix the height to the largest stop; otherwise apply the
	// height budget (capped default keeps content from covering the screen).
	const sizedHeight = detentFractions.length ? null : sheetHeightDips(props.height, screenVh())
	if (sizedHeight != null) {
		host.height = sizedHeight
	}

	const ctl: SheetDetentsController = attachSheetDetents(host, detentFractions, closeNow, {
		dismissible: purpose !== 'required',
		swipeOnly: !detentFractions.length,
	})

	lifetime.own(ctl.detach)
	lifetime.own(attachTapToBlur(host))
	return () => ctl.enter()
}

/** Declarative in-window bottom sheet (Astryx `BottomSheet`), native leaf —
 *  RootLayout host + portal from the declaring component's
 *  RootLayout. With `sheetId` inside `BottomSheetSwitcher` it registers
 *  under the switcher's shared host instead. */
export function BottomSheet(props: BottomSheetProps) @{
	const switcher = useContext(BottomSheetSwitcherContext)
	const sentinel = useRef<any>(null)
	const [portalHost, setPortalHost] = useState<GridLayout | null>(null)
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const open = props.isOpen ?? internal
	const requestChange = (isOpen: boolean) => {
		if (props.isOpen === undefined) {
			setInternal(isOpen)
		}

		props.onOpenChange?.(isOpen)
	}

	const shown = useRef<{
		host: GridLayout
		lifetime: ReturnType<typeof createOverlayLifetime>
	} | null>(null)

	const dismissal = useLayerDismissal({
		active: !!open && props.sheetId == null,
		isPresent: () => !!shown.current,
		dismiss: () => requestChange(false),
		behavior: props.purpose === 'required' ? 'block' : 'close',
		getFocusTarget: () => props.finalFocusRef?.current,
		getHost: () => sentinel.current,
	})

	const dismiss = useRef(requestChange)
	dismiss.current = requestChange

	useEffect(() => {
		if (props.sheetId == null) {
			return
		}

		if (!switcher) {
			console.warn(
				'[BottomSheet] sheetId is set but no BottomSheetSwitcher ancestor was found — the sheet renders nothing.',
			)

			return
		}

		const spec = { sheetId: props.sheetId, props }
		switcher.register(spec)
		return () => switcher.unregister(spec.sheetId)
	}, [switcher, props.sheetId, props])

	useEffect(() => {
		const cur = shown.current
		if (props.sheetId != null || !open) {
			cur?.lifetime.close()
			return
		}

		const rl = rootLayoutFor(sentinel.current)
		if (!rl) {
			return
		}

		if (cur) {
			return
		}

		const { host, panel, bindKeyboard } = createKeyboardOverlayHost()
		const unbindTheme = applyThemeClasses(
			panel,
			cx('vx-sheet-host', 'vx-bottom-sheet-host', props.className),
		)

		const lifetime = createOverlayLifetime(rl, host, null, 'BottomSheet', (dismissed) => {
			if (shown.current?.host === host) {
				shown.current = null
				setPortalHost(null)
			}

			if (dismissed) {
				dismiss.current?.(false)
			}
		})

		lifetime.own(unbindTheme)
		lifetime.own(bindKeyboard())
		const purpose = props.purpose ?? 'info'
		const hasScrim = props.hasScrim ?? true
		const enter = attachBottomSheetHost(panel, props, lifetime, () => {
			// User dismissal goes through RootLayout close → 'closed' →
			// lifetime reports dismissed → onOpenChange(false).
			const owner = host.parent as ToastOwner | undefined
			owner?.close?.(host)?.catch?.((error: unknown) => {
				console.error('[BottomSheet] close failed', error)
			})
		})

		shown.current = { host, lifetime }
		setPortalHost(panel)
		lifetime.open(
			{
				animation: keyboardOverlayAnimation(),
				...(hasScrim ? { shadeCover: { opacity: 0.4, tapToClose: purpose === 'info' } } : {}),
			},
			() => enter(),
		)
	}, [
		open,
		props.sheetId,
		props.children,
		props.className,
		props.style,
		props.hasScrim,
		props.purpose,
		props.height,
		JSON.stringify(props.snapPoints ?? []),
		props.ios,
		props.android,
	])

	useEffect(() => () => shown.current?.lifetime.close(), [])

	// Zero-size sentinel — the sheet resolves its owning RootLayout from the
	// declaring component's ancestry.

	<>
		<masonview
			ref={(v: any) => {
				sentinel.current = v
			}}
			style={mergeStyle(
				{ flexDirection: 'column' },
				mergeStyle({ display: 'flex' }, { width: 0, height: 0 }),
			)}
		/>
		{props.sheetId == null && open && portalHost
			? createPortal(
					<BottomSheetBody layerDepth={dismissal.depth}>{props.children}</BottomSheetBody>,
					portalHost,
				)
			: null}
	</>
}

/** The active panel rendered in the switcher's portal host. */
function SwitcherPanel(props: {
	store: ReturnType<typeof createStore<Map<string, BottomSheetRegistration>>>
	host: GridLayout
	activeSheet: string | null
	hasScrim: boolean
	requestDismiss: () => void
	layerDepth: number
}) @{
	const specs = useStore(props.store)
	const active = props.activeSheet != null ? specs.get(props.activeSheet) : undefined

	useEffect(() => {
		const host = props.host
		if (!host || !active) {
			return
		}

		const detents = active.props.snapPoints?.length
			? normalizeSnapPoints(active.props.snapPoints, screenVh())
			: []

		const ctl = attachSheetDetents(host, detents, props.requestDismiss, {
			dismissible: (active.props.purpose ?? 'info') !== 'required',
			swipeOnly: !detents.length,
		})

		// Size for this sheet: largest stop or the height budget.
		host.height = detents.length
			? detents[detents.length - 1] * screenVh()
			: ((sheetHeightDips(active.props.height, screenVh()) ?? undefined) as PercentLengthType)

		host.accessibilityLabel = active.props.label
		ctl.enter()
		return () => ctl.detach()
	}, [props.activeSheet, active])

	<masonview
		style={{ display: 'flex', flexDirection: 'column' }}
		className="vx-bottom-sheet-panel"
	>
		<LayerDepthProvider value={props.layerDepth}>
			<SizeProvider value={null}>
				<SheetContent key={props.activeSheet ?? undefined}>{active?.props.children}</SheetContent>
			</SizeProvider>
		</LayerDepthProvider>
	</masonview>
}

/** Shared host for a set of BottomSheet panels (Astryx
 *  `BottomSheetSwitcher`), native leaf — one RootLayout host whose content
 *  is driven by a module-scope registration store. */
export function BottomSheetSwitcher(props: BottomSheetSwitcherProps) @{
	const sentinel = useRef<any>(null)
	const shown = useRef<{
		host: GridLayout
		lifetime: ReturnType<typeof createOverlayLifetime>
	} | null>(null)

	const [portalHost, setPortalHost] = useState<GridLayout | null>(null)

	const [internal, setInternal] = useState<string | null>(props.defaultActiveSheet ?? null)
	const activeId = props.activeSheet !== undefined ? props.activeSheet : internal
	const requestChange = (sheetId: string | null) => {
		if (props.activeSheet === undefined) {
			setInternal(sheetId)
		}

		props.onActiveSheetChange?.(sheetId)
	}

	const onChange = useRef(requestChange)
	onChange.current = requestChange
	const resolvedId = useRef(activeId)
	resolvedId.current = activeId

	const specs = useMemo(() => createStore(new Map<string, BottomSheetRegistration>()), [])
	const focusTarget = useRef<any>(null)
	const selected = activeId != null ? specs.getSnapshot().get(activeId) : undefined
	if (selected) {
		focusTarget.current = selected.props.finalFocusRef ?? null
	}

	const handle: BottomSheetSwitcherHandle = useMemo(
		() => ({
			register(spec) {
				if (spec.sheetId === resolvedId.current) {
					focusTarget.current = spec.props.finalFocusRef ?? null
				}

				const next = new Map(specs.getSnapshot())
				next.set(spec.sheetId, spec)
				specs.set(next)
			},
			unregister(sheetId) {
				const next = new Map(specs.getSnapshot())
				if (next.delete(sheetId)) {
					specs.set(next)
				}
			},
			requestDismiss() {
				onChange.current?.(null)
			},
			activeSheet() {
				return resolvedId.current ?? null
			},
		}),
		[],
	)

	const dismissal = useLayerDismissal({
		active: activeId != null,
		isPresent: () => !!shown.current,
		dismiss: () => onChange.current?.(null),
		get behavior() {
			return selected?.props.purpose === 'required' ? 'block' : 'close'
		},
		getFocusTarget: () => focusTarget.current?.current,
		getHost: () => sentinel.current,
	})

	useEffect(() => {
		const cur = shown.current
		const active = activeId != null ? specs.getSnapshot().get(activeId) : undefined
		if (!active) {
			cur?.lifetime.close()
			return
		}

		if (cur) {
			return
		}

		const rl = rootLayoutFor(sentinel.current)
		if (!rl) {
			return
		}

		const { host, panel, bindKeyboard } = createKeyboardOverlayHost()
		const unbindTheme = applyThemeClasses(
			panel,
			cx('vx-sheet-host', 'vx-bottom-sheet-host', props.className),
		)

		host.horizontalAlignment = 'stretch'
		host.verticalAlignment = 'bottom'
		const lifetime = createOverlayLifetime(rl, host, null, 'BottomSheetSwitcher', (dismissed) => {
			if (shown.current?.host === host) {
				shown.current = null
				setPortalHost(null)
			}

			if (dismissed) {
				onChange.current?.(null)
			}
		})

		lifetime.own(unbindTheme)
		lifetime.own(bindKeyboard())
		lifetime.own(attachTapToBlur(host))
		shown.current = { host, lifetime }
		setPortalHost(panel)

		lifetime.open({
			animation: keyboardOverlayAnimation(),
			...((props.hasScrim ?? true) ? { shadeCover: { opacity: 0.4, tapToClose: true } } : {}),
		})
	}, [activeId, props.hasScrim, props.className])

	// Registrations also arrive while closed — no host needed until active.
	useEffect(() => () => shown.current?.lifetime.close(), [])

	<>
		<BottomSheetSwitcherProvider value={handle}>{props.children}</BottomSheetSwitcherProvider>
		<masonview
			ref={(v: any) => {
				sentinel.current = v
			}}
			style={mergeStyle(
				{ flexDirection: 'column' },
				mergeStyle({ display: 'flex' }, { width: 0, height: 0 }),
			)}
		/>
		{activeId != null && portalHost
			? createPortal(
					<SwitcherPanel
						layerDepth={dismissal.depth}
						store={specs}
						host={portalHost}
						activeSheet={activeId}
						hasScrim={props.hasScrim ?? true}
						requestDismiss={() => onChange.current?.(null)}
					/>,
					portalHost,
				)
			: null}
	</>
}

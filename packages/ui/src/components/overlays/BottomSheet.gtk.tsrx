/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { SheetContent } from './sheet-content'
import { useContext, useEffect, useMemo, useRef, useState } from 'octane'
import { createPortal } from '../../internal/platform/native-portal'
import { SizeProvider } from '../layout/size-context'
import type { BottomSheetProps, BottomSheetSwitcherProps } from '../../props'
import {
	BottomSheetSwitcherContext,
	BottomSheetSwitcherProvider,
	type BottomSheetRegistration,
	type BottomSheetSwitcherHandle,
} from './bottom-sheet-context'

import { createStore } from '../../data/store'
import { cx } from '@octane-xplat/lib'
import { themeSchemeClasses } from '../../theme/theme-host'
import { normalizeSnapPoints } from './sheet-snap'
import { attachSheetDetents, type SheetDetentsController } from './sheet-detents.gtk'
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'

/** The panel's window-height resolver — the sheet docks in a full-window
 *  overlay layer, so snap fractions resolve against the window's height. */
const sheetVh = (view: any): number => view?.get_root?.()?.get_height?.() || 0

/** `height` budget → px; null keeps the content-sized panel. */
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

/** The sheet panel shared by the declarative leaf, the switcher host, and
 *  the imperative service: bottom-docked chrome (grabber + content) inside
 *  an overlay layer's target. Detents/swipe-to-dismiss attach to the
 *  grabber row; `requestDismiss` is the host's user-dismissal channel —
 *  the swipe's slide-out has already run when it fires. Re-attaching on
 *  `resetKey` is what lets the switcher retarget one host across panels. */
export function GtkSheetPanel(props: {
	label?: string
	height?: BottomSheetProps['height']
	snapPoints?: BottomSheetProps['snapPoints']
	purpose?: BottomSheetProps['purpose']
	/** Extra dismissal veto beyond `purpose` (switcher 'required'). */
	dismissible?: boolean
	layerDepth: number
	/** Change token that re-sizes + re-enters the panel (switcher swaps). */
	resetKey?: unknown
	className?: any
	style?: any
	id?: string
	requestDismiss: () => void
	children?: any
}) @{
	const panel = useRef<any>(null)
	const grabber = useRef<any>(null)
	const dismiss = useRef(props.requestDismiss)
	dismiss.current = props.requestDismiss

	useEffect(() => {
		const view = panel.current
		if (!view) {
			return
		}

		let ctl: SheetDetentsController | null = null
		const setup = () => {
			const vh = () => sheetVh(view)
			const detentFractions = props.snapPoints?.length
				? normalizeSnapPoints(props.snapPoints, vh())
				: []
			const sized = detentFractions.length ? null : sheetHeightDips(props.height, vh())
			try {
				view.style.height = sized == null ? undefined : Math.round(sized)
			} catch { }

			ctl = attachSheetDetents(view, grabber.current, detentFractions, vh, () =>
				dismiss.current?.(),
				{
					dismissible:
						props.dismissible !== false && (props.purpose ?? 'info') !== 'required',
					swipeOnly: !detentFractions.length,
				},
			)
			ctl.enter()
		}

		// Snap fractions resolve against the window height — if the view is
		// not mapped yet, wait for the map signal so `vh` reads real pixels.
		if (sheetVh(view) > 0) {
			setup()
		} else {
			const onLoaded = () => {
				view.off?.('loaded', onLoaded)
				setup()
			}
			view.on?.('loaded', onLoaded)
		}

		return () => ctl?.detach()
	}, [props.resetKey, props.height, JSON.stringify(props.snapPoints ?? []), props.purpose])

	<masonview
		ref={(v: any) => {
			panel.current = v
		}}
		id={props.id}
		className={cx(
			'vx-sheet-host',
			'vx-bottom-sheet-host',
			themeSchemeClasses(),
			props.className,
		)}
		style={mergeStyle(
			{ display: 'flex', flexDirection: 'column' },
			styleRecord(props.style),
		)}
		accessibilityLabel={props.label ?? ''}
	>
		<masonview
			ref={(v: any) => {
				grabber.current = v
			}}
			id={props.id != null ? props.id + '-grabber' : undefined}
			className="vx-sheet-grabber"
			style={{
				display: 'flex',
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'center',
				paddingTop: 8,
				paddingBottom: 8,
			}}
			accessibilityLabel="Drag to resize sheet"
		>
			<label className="vx-sheet-grip">―</label>
		</masonview>
		<LayerDepthProvider value={props.layerDepth}>
			<SizeProvider value={null}>{props.children}</SizeProvider>
		</LayerDepthProvider>
	</masonview>
}

/** Declarative in-window bottom sheet (Astryx `BottomSheet`), GTK leaf —
 *  an overlay-layer panel docked to the window's bottom edge on the same
 *  root the declaring component lives in (the `RootLayout` equivalent),
 *  with content portaled from that tree. With `sheetId` inside
 *  `BottomSheetSwitcher` it registers under the switcher's shared host
 *  instead. */
export function BottomSheet(props: BottomSheetProps) @{
	const switcher = useContext(BottomSheetSwitcherContext)
	const sentinel = useRef<any>(null)
	const [layer, setLayer] = useState<any>(null)
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const open = props.isOpen ?? internal
	const requestChange = (isOpen: boolean) => {
		if (props.isOpen === undefined) {
			setInternal(isOpen)
		}

		props.onOpenChange?.(isOpen)
	}

	const shown = useRef<any>(null)
	const releasing = useRef(false)
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

	const dismissal = useLayerDismissal({
		active: !!open && props.sheetId == null,
		isPresent: () => !!shown.current,
		dismiss: () => requestChange(false),
		behavior: props.purpose === 'required' ? 'block' : 'close',
		getFocusTarget: () => props.finalFocusRef?.current,
		getHost: () => sentinel.current,
	})

	/** Slide the panel below the window edge, then release the layer —
	 *  the RootLayout 'closed' equivalent. Instant when the swipe already
	 *  parked the panel off-screen or animations are disabled. */
	const release = () => {
		const l = shown.current
		if (!l) {
			return
		}

		shown.current = null
		const finish = () => {
			try {
				l.dispose()
			} catch { }
			setLayer(null)
		}
		const panelView = l.target?.get_first_child?.()
		let animated = false
		try {
			const vh = sheetVh(panelView)
			if (vh > 0 && (Number(panelView?.translateY) || 0) < vh) {
				const sliding = panelView?.animate?.({
					translate: { x: 0, y: vh },
					duration: 160,
				})
				if (sliding?.then) {
					animated = true
					void sliding.then(finish, finish)
				}
			}
		} catch { }
		if (!animated) {
			finish()
		}
	}

	/** User-initiated dismissal: the surface goes away like the RootLayout
	 *  host does — even if a controlled parent ignores `onOpenChange`. */
	const dismissSurface = () => {
		if (releasing.current) {
			return
		}

		releasing.current = true
		release()
		dismiss.current?.(false)
	}

	useEffect(() => {
		const view = sentinel.current
		if (!view || props.sheetId != null) {
			return
		}

		if (!open) {
			if (shown.current) {
				release()
			}
			releasing.current = false
			return
		}

		if (shown.current) {
			return
		}

		const purpose = props.purpose ?? 'info'
		const hasScrim = props.hasScrim ?? true
		const l = view.createOverlayLayer({
			modal: hasScrim,
			scrim: hasScrim,
			align: { h: 'fill', v: 'end' },
			onScrimPress: purpose === 'info' ? dismissSurface : undefined,
		})
		shown.current = l
		setLayer(l)
		l.setVisible(true)
	}, [open, props.sheetId, props.hasScrim, props.purpose])

	useEffect(
		() => () => {
			try {
				shown.current?.dispose?.()
			} catch { }
			shown.current = null
		},
		[],
	)

	// Zero-size sentinel — the sheet resolves its overlay host from the
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
		{props.sheetId == null && layer
			? createPortal(
					<GtkSheetPanel
						id={props.id}
						label={props.label}
						height={props.height}
						snapPoints={props.snapPoints}
						purpose={props.purpose}
						layerDepth={dismissal.depth}
						className={props.className}
						style={props.style}
						requestDismiss={dismissSurface}
					>
						{props.children}
					</GtkSheetPanel>,
					layer.target,
				)
			: null}
	</>
}

/** The active panel rendered in the switcher's portal host — one shared
 *  `GtkSheetPanel` whose `resetKey` re-sizes/re-enters on each swap. The
 *  GTK portal keeps one universal root (unlike the native RootLayout
 *  host), so the active spec arrives by prop — no cross-root store read. */
function SwitcherPanel(props: {
	spec?: BottomSheetRegistration
	activeSheet: string | null
	layerDepth: number
	className?: any
	style?: any
	id?: string
	requestDismiss: () => void
}) @{
	const sheet = props.spec?.props

	<GtkSheetPanel
		id={props.id ?? sheet?.id}
		label={sheet?.label}
		height={sheet?.height}
		snapPoints={sheet?.snapPoints}
		purpose={sheet?.purpose}
		layerDepth={props.layerDepth}
		resetKey={props.activeSheet}
		className={cx(props.className, sheet?.className)}
		style={{ ...styleRecord(props.style), ...styleRecord(sheet?.style) }}
		requestDismiss={props.requestDismiss}
	>
		<SheetContent key={props.activeSheet ?? undefined}>{sheet?.children}</SheetContent>
	</GtkSheetPanel>
}

/** Shared host for a set of BottomSheet panels (Astryx
 *  `BottomSheetSwitcher`), GTK leaf — one overlay-layer host whose content
 *  is driven by a module-scope registration store. */
export function BottomSheetSwitcher(props: BottomSheetSwitcherProps) @{
	const sentinel = useRef<any>(null)
	const shown = useRef<any>(null)
	const releasing = useRef(false)
	const [layer, setLayer] = useState<any>(null)

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
				const existing = specs.getSnapshot().get(spec.sheetId)
				if (
					existing &&
					Object.keys(existing.props).length === Object.keys(spec.props).length &&
					Object.keys(spec.props).every(
						(key) =>
							(existing.props as unknown as Record<string, unknown>)[key] ===
							(spec.props as unknown as Record<string, unknown>)[key],
					)
				) {
					return
				}

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
		active: selected != null,
		isPresent: () => !!shown.current,
		dismiss: () => onChange.current?.(null),
		get behavior() {
			return selected?.props.purpose === 'required' ? 'block' : 'close'
		},
		getFocusTarget: () => focusTarget.current?.current,
		getHost: () => sentinel.current,
	})

	const release = () => {
		const l = shown.current
		if (!l) {
			return
		}

		shown.current = null
		const finish = () => {
			try {
				l.dispose()
			} catch { }
			setLayer(null)
		}
		const panelView = l.target?.get_first_child?.()
		let animated = false
		try {
			const vh = sheetVh(panelView)
			if (vh > 0 && (Number(panelView?.translateY) || 0) < vh) {
				const sliding = panelView?.animate?.({
					translate: { x: 0, y: vh },
					duration: 160,
				})
				if (sliding?.then) {
					animated = true
					void sliding.then(finish, finish)
				}
			}
		} catch { }
		if (!animated) {
			finish()
		}
	}

	/** Scrim tap: closes the surface and reports through
	 *  `onActiveSheetChange` — the shared host equivalent of a user dismiss. */
	const dismissSurface = () => {
		if (releasing.current) {
			return
		}

		releasing.current = true
		release()
		onChange.current?.(null)
	}

	useEffect(() => {
		const view = sentinel.current
		if (!view) {
			return
		}

		if (!selected) {
			if (shown.current) {
				release()
			}
			releasing.current = false
			return
		}

		if (shown.current) {
			return
		}

		const hasScrim = props.hasScrim ?? true
		const l = view.createOverlayLayer({
			modal: hasScrim,
			scrim: hasScrim,
			align: { h: 'fill', v: 'end' },
			onScrimPress: dismissSurface,
		})
		shown.current = l
		setLayer(l)
		l.setVisible(true)
	}, [selected != null, props.hasScrim])

	useEffect(
		() => () => {
			try {
				shown.current?.dispose?.()
			} catch { }
			shown.current = null
		},
		[],
	)

	<>
		<BottomSheetSwitcherProvider value={handle}>{props.children}</BottomSheetSwitcherProvider>
		<masonview
			id={props.id}
			ref={(v: any) => {
				sentinel.current = v
			}}
			style={mergeStyle(
				{ flexDirection: 'column' },
				mergeStyle({ display: 'flex' }, { width: 0, height: 0 }),
			)}
		/>
		{selected != null && layer
			? createPortal(
					<SwitcherPanel
						layerDepth={dismissal.depth}
						spec={selected}
						activeSheet={activeId}
						className={props.className}
						style={props.style}
						requestDismiss={dismissSurface}
					/>,
					layer.target,
				)
			: null}
	</>
}

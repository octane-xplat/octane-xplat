/** @jsxImportSource @octane-xplat/macos-renderer */
import { SheetContent } from './sheet-content'
import { mergeStyle } from './style-merge'
import { useContext, useEffect, useMemo, useRef, useState } from 'octane'
import type { BottomSheetProps, BottomSheetSwitcherProps } from './props'
import {
	BottomSheetSwitcherContext,
	BottomSheetSwitcherProvider,
	type BottomSheetRegistration,
	type BottomSheetSwitcherHandle,
} from './bottom-sheet-context'

import { createStore } from './store'
import { cx } from '@octane-xplat/lib'

import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { usePresentation, useDetachedPresentation } from './presentation.macos.tsrx'

function SheetPanel(props: BottomSheetProps & { dark?: boolean; layerDepth?: number }) @{
	<LayerDepthProvider value={props.layerDepth ?? 0}>
	<masonview id={props.id} className={cx('vx-sheet', 'vx-bottom-sheet', props.dark && 'ns-dark', props.className)} style={mergeStyle({flexDirection: "column"}, mergeStyle({display: "flex"}, props.style))}>
		<label className="vx-sheet-grabber" accessibilityLabel="Drag to resize sheet">―</label>
		<scrollview><SheetContent key={props.sheetId}>{props.children}</SheetContent></scrollview>
	</masonview>
	</LayerDepthProvider>
}

function PresentedSheet(props: BottomSheetProps) @{
	const dismissal = useLayerDismissal({
		get active() {
			return !!props.isOpen
		},
		dismiss: () => props.onOpenChange?.(false),
		get behavior() {
			return props.purpose === 'required' ? 'block' : 'close'
		},
		getFocusTarget: () => props.finalFocusRef?.current,
		restoreFocus: false,
	})

	const panelProps = { ...props, layerDepth: dismissal.depth }
	const owner = usePresentation(Boolean(props.isOpen), SheetPanel, panelProps, {
		kind: 'sheet',
		modal: props.hasScrim ?? true,
		purpose: props.purpose,
		transitionKey: props.sheetId,
		height: props.height,
		snapPoints: props.snapPoints,
		label: props.label,
		finalFocusRef: props.finalFocusRef,
		canDismiss: () => dismissal.shouldClose(),
		onDismiss: () => props.onOpenChange?.(false),
	})

	<>{owner}</>
}

export function BottomSheet(props: BottomSheetProps) @{
	const switcher = useContext(BottomSheetSwitcherContext)
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const open = props.isOpen ?? internal
	const requestChange = (isOpen: boolean) => {
		if (props.isOpen === undefined) {
			setInternal(isOpen)
		}

		props.onOpenChange?.(isOpen)
	}

	useEffect(() => {
		if (props.sheetId == null || !switcher) {
			return
		}

		const spec: BottomSheetRegistration = { sheetId: props.sheetId, props }
		switcher.register(spec)
	}, [
		switcher,
		props.sheetId,
		props.children,
		props.label,
		props.isOpen,
		props.onOpenChange,
		props.height,
		props.snapPoints,
		props.hasScrim,
		props.purpose,
		props.finalFocusRef,
		props.className,
		props.style,
		props.id,
	])

	useEffect(() => {
		if (props.sheetId == null || !switcher) {
			return
		}

		const sheetId = props.sheetId
		return () => switcher.unregister(sheetId)
	}, [switcher, props.sheetId])

	@if (props.sheetId == null) {
		<PresentedSheet {...props} isOpen={open} onOpenChange={requestChange} />
	}
}

export function BottomSheetSwitcher(props: BottomSheetSwitcherProps) @{
	const specs = useMemo(() => createStore(new Map<string, BottomSheetRegistration>()), [])
	const [internal, setInternal] = useState<string | null>(props.defaultActiveSheet ?? null)
	const resolved = props.activeSheet !== undefined ? props.activeSheet : internal
	const requestChange = (sheetId: string | null) => {
		if (props.activeSheet === undefined) {
			setInternal(sheetId)
		}

		props.onActiveSheetChange?.(sheetId)
	}

	const onChange = useRef<any>(null)
	const activeId = useRef(resolved)
	activeId.current = resolved
	onChange.current = requestChange
	const handle: BottomSheetSwitcherHandle = useMemo(
		() => ({
			register(spec) {
				const existing = specs.getSnapshot().get(spec.sheetId)
				if (
					existing &&
					Object.keys(existing.props).length === Object.keys(spec.props).length &&
					Object.keys(spec.props).every(
						(key) => (existing.props as any)[key] === (spec.props as any)[key],
					)
				) {
					return
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
				return activeId.current ?? null
			},
		}),
		[],
	)

	const dismissal = useLayerDismissal({
		get active() {
			return resolved != null
		},
		dismiss: () => handle.requestDismiss(),
		get behavior() {
			const active = resolved != null ? specs.getSnapshot().get(resolved) : undefined
			return active?.props.purpose === 'required' ? 'block' : 'close'
		},
		getFocusTarget: () => {
			const active = resolved != null ? specs.getSnapshot().get(resolved) : undefined
			return active?.props.finalFocusRef?.current
		},
		restoreFocus: false,
	})

	const owner = useDetachedPresentation(
		false,
		SheetPanel,
		{},
		{},
		{
			subscribe: specs.subscribe,
			resolve() {
				const active = resolved != null ? specs.getSnapshot().get(resolved) : undefined
				const sheet = active?.props
				return {
					isOpen: active != null,
					panelProps: {
						...(sheet as any),
						layerDepth: dismissal.depth,
						className: cx(props.className, sheet?.className),
						style: { ...(props.style as any), ...(sheet?.style as any) },
						id: props.id ?? sheet?.id,
					},
					options: {
						kind: 'sheet',
						modal: props.hasScrim ?? true,
						purpose: sheet?.purpose,
						transitionKey: active?.sheetId,
						height: sheet?.height,
						snapPoints: sheet?.snapPoints,
						label: sheet?.label,
						finalFocusRef: sheet?.finalFocusRef,
						canDismiss: () => dismissal.shouldClose(),
						onDismiss: () => handle.requestDismiss(),
					},
				}
			},
		},
	)

	<BottomSheetSwitcherProvider value={handle}>
		{props.children}
		<masonview ref={owner} style={mergeStyle({display: "flex"}, { width: 0, height: 0 })}/>
	</BottomSheetSwitcherProvider>
}

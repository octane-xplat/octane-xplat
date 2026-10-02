/** @jsxImportSource @octane-xplat/macos-renderer */
import { useContext, useEffect, useMemo, useRef } from 'octane'
import type { BottomSheetProps, BottomSheetSwitcherProps } from './props'
import {
	BottomSheetSwitcherContext,
	BottomSheetSwitcherProvider,
	type BottomSheetRegistration,
	type BottomSheetSwitcherHandle,
} from './bottom-sheet-context'

import { createStore } from './store'
import { cx } from './cx'

import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { usePresentation } from './presentation.macos.tsrx'

function SheetPanel(props: BottomSheetProps & { dark?: boolean; layerDepth?: number }) @{
	<LayerDepthProvider value={props.layerDepth ?? 0}>
	<flexboxlayout flexDirection="column" id={props.id} className={cx('vx-sheet', 'vx-bottom-sheet', props.dark && 'ns-dark', props.className)} style={props.style}>
		<label className="vx-sheet-grabber" accessibilityLabel="Drag to resize sheet">―</label>
		<scrollview>{props.children}</scrollview>
	</flexboxlayout>
	</LayerDepthProvider>
}

function PresentedSheet(props: BottomSheetProps) @{
	const dismissal = useLayerDismissal({
		get active() { return !!props.isOpen },
		dismiss: () => props.onOpenChange?.(false),
		get behavior() { return props.purpose === 'required' ? 'block' : 'close' },
		getFocusTarget: () => props.finalFocusRef?.current,
		restoreFocus: false,
	})

	const panelProps = { ...props, layerDepth: dismissal.depth }
	const owner = usePresentation(Boolean(props.isOpen), SheetPanel, panelProps, {
		kind: 'sheet', modal: props.hasScrim ?? true, purpose: props.purpose, transitionKey: props.sheetId,
		height: props.height, snapPoints: props.snapPoints, label: props.label,
		finalFocusRef: props.finalFocusRef, canDismiss: () => dismissal.shouldClose(),
		onDismiss: () => props.onOpenChange?.(false),
	})

	<flexboxlayout ref={owner} style={{ width: 0, height: 0 }} />
}

export function BottomSheet(props: BottomSheetProps) @{
	const switcher = useContext(BottomSheetSwitcherContext)
	useEffect(() => {
		if (props.sheetId == null || !switcher) return
		const spec: BottomSheetRegistration = { sheetId: props.sheetId, props }
		switcher.register(spec)
	}, [switcher, props.sheetId, props.children, props.label, props.isOpen,
		props.onOpenChange, props.height, props.snapPoints, props.hasScrim, props.purpose,
		props.finalFocusRef, props.className, props.style, props.id])

	useEffect(() => {
		if (props.sheetId == null || !switcher) return
		const sheetId = props.sheetId
		return () => switcher.unregister(sheetId)
	}, [switcher, props.sheetId])

	@if (props.sheetId == null) { <PresentedSheet {...props} /> }
}

export function BottomSheetSwitcher(props: BottomSheetSwitcherProps) @{
	const specs = useMemo(() => createStore(new Map<string, BottomSheetRegistration>()), []);
	const onChange = useRef<any>(null);
	const activeId = useRef(props.activeSheet);
	activeId.current = props.activeSheet;
	onChange.current = props.onActiveSheetChange;
	const handle: BottomSheetSwitcherHandle = useMemo(() => ({
		register(spec) {
			const existing = specs.get().get(spec.sheetId)
			if (existing && Object.keys(existing.props).length === Object.keys(spec.props).length && Object.keys(spec.props).every(key => (existing.props as any)[key] === (spec.props as any)[key])) return
			const next = new Map(specs.get());
			next.set(spec.sheetId, spec);
			specs.set(next);
		},
		unregister(sheetId) {
			const next = new Map(specs.get());
			if (next.delete(sheetId)) specs.set(next);
		},
		requestDismiss() { onChange.current?.(null) },
		activeSheet() { return activeId.current ?? null },
	}), []);

	const dismissal = useLayerDismissal({
		get active() { return props.activeSheet != null },
		dismiss: () => handle.requestDismiss(),
		get behavior() {
			const active = props.activeSheet != null ? specs.get().get(props.activeSheet) : undefined
			return active?.props.purpose === 'required' ? 'block' : 'close'
		},
		getFocusTarget: () => {
			const active = props.activeSheet != null ? specs.get().get(props.activeSheet) : undefined
			return active?.props.finalFocusRef?.current
		},
		restoreFocus: false,
	})

	const owner = usePresentation(false, SheetPanel, {}, {}, {
		subscribe: specs.subscribe,
		resolve() {
			const active = props.activeSheet != null ? specs.get().get(props.activeSheet) : undefined
			const sheet = active?.props
			return {
				isOpen: active != null,
				panelProps: { ...sheet, layerDepth: dismissal.depth, className: cx(props.className, sheet?.className), style: { ...props.style, ...sheet?.style }, id: props.id ?? sheet?.id },
				options: {
					kind: 'sheet', modal: props.hasScrim ?? true, purpose: sheet?.purpose,
					transitionKey: active?.sheetId, height: sheet?.height, snapPoints: sheet?.snapPoints,
					label: sheet?.label, finalFocusRef: sheet?.finalFocusRef,
					canDismiss: () => dismissal.shouldClose(),
					onDismiss: () => handle.requestDismiss(),
				},
			}
		},
	})

	<BottomSheetSwitcherProvider value={handle}>
		{props.children}
		<flexboxlayout ref={owner} style={{ width: 0, height: 0 }} />
	</BottomSheetSwitcherProvider>
}

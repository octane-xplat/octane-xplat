/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { useEffect, useRef, useState } from 'octane'
import type { PopoverProps } from './props'
import { cx } from '@octane-xplat/lib'
import { useThemeScheme } from './theme/theme-scheme'

function PopoverPanel(props: PopoverProps & { dark: boolean; layerDepth: number }) @{
	<masonview className={cx('vx-popover', props.dark && 'ns-dark', props.className)} style={mergeStyle({flexDirection: "column"}, mergeStyle({display: "flex"}, props.style))}>
		<LayerDepthProvider value={props.layerDepth}>{props.children}</LayerDepthProvider>
	</masonview>
}

/** The AppKit bridge hosts a separate root in an anchored NSPopover. */
export function Popover(props: PopoverProps) @{
	const popup = useRef<any>(null)
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const open = props.open ?? internal
	const requestDismiss = () => {
		if (props.open === undefined) setInternal(false)
		props.onDismiss?.()
	}

	const dismissal = useLayerDismissal({ get active() { return !!open }, isPresent: () => !!popup.current && !popup.current.closed, getFocusTarget: () => props.finalFocusRef?.current, dismiss: requestDismiss, get behavior() { return props.dismissOnEscape === false ? 'block' : 'close' } })
	const closing = useRef(false)
	const close = () => { closing.current = true; popup.current?.close(); popup.current = null; closing.current = false }
	const latest = useRef(requestDismiss)
	latest.current = requestDismiss
	const dark = useThemeScheme() === 'dark'
	useEffect(() => {
		if (!open) { close(); return }
		const panelProps = { ...props, dark, layerDepth: dismissal.depth }
		if (popup.current && !popup.current.closed) { popup.current.update(panelProps); return }
		const bridge = (globalThis as any).__xplatAppKit
		popup.current = bridge?.showAnchoredPopup?.({
			anchor: props.anchor?.current,
			placement: props.placement ?? 'bottom',
			// This root owns disposal; close synchronously before unmounting it.
			animates: false,
			lightDismiss: props.dismissOnOutsideTap ?? true,
			component: PopoverPanel,
			props: panelProps,
			onClose: () => { popup.current = null; if (!closing.current && dismissal.shouldClose(true)) latest.current() },
		}) ?? null
	}, [open, props.children, props.className, props.style, props.placement, props.dismissOnOutsideTap, dark])

	useEffect(() => () => close(), [])

	<></>
}

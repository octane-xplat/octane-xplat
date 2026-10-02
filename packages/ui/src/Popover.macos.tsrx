/** @jsxImportSource @octane-xplat/macos-renderer */
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { useEffect, useRef } from 'octane'
import type { PopoverProps } from './props'
import { cx } from './cx'
import { useThemeScheme } from './theme/theme-scheme'

function PopoverPanel(props: PopoverProps & { dark: boolean; layerDepth: number }) @{
	<flexboxlayout flexDirection="column" className={cx('vx-popover', props.dark && 'ns-dark', props.className)} style={props.style}>
		<LayerDepthProvider value={props.layerDepth}>{props.children}</LayerDepthProvider>
	</flexboxlayout>
}

/** The AppKit bridge hosts a separate root in an anchored NSPopover. */
export function Popover(props: PopoverProps) @{
	const popup = useRef<any>(null)
	const dismissal = useLayerDismissal({ get active() { return !!props.open }, isPresent: () => !!popup.current && !popup.current.closed, getFocusTarget: () => props.finalFocusRef?.current, dismiss: () => props.onDismiss?.(), get behavior() { return props.dismissOnEscape === false ? 'block' : 'close' } })
	const closing = useRef(false)
	const close = () => { closing.current = true; popup.current?.close(); popup.current = null; closing.current = false }
	const latest = useRef(props)
	latest.current = props
	const dark = useThemeScheme() === 'dark'
	useEffect(() => {
		if (!props.open) { close(); return }
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
			onClose: () => { popup.current = null; if (!closing.current && dismissal.shouldClose(true)) latest.current.onDismiss?.() },
		}) ?? null
	}, [props.open, props.children, props.className, props.style, props.placement, props.dismissOnOutsideTap, dark])

	useEffect(() => () => close(), [])

	<></>
}

/** @jsxImportSource @xplat/macos/renderer */
import { useEffect, useRef } from 'octane'
import type { PopoverProps } from './props'
import { cx } from './cx'
import { useThemeScheme } from './theme/theme-scheme'

function PopoverPanel(props: PopoverProps & { dark: boolean }) @{
	<flexboxlayout flexDirection="column" className={cx('vx-popover', props.dark && 'ns-dark', props.className)} style={props.style}>
		{props.children}
	</flexboxlayout>
}

/** The AppKit bridge hosts a separate root in an anchored NSPopover. */
export function Popover(props: PopoverProps) @{
	const popup = useRef<any>(null)
	const latest = useRef(props)
	latest.current = props
	const dark = useThemeScheme() === 'dark'
	useEffect(() => {
		if (!props.open) { popup.current?.close(); popup.current = null; return }
		const panelProps = { ...props, dark }
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
			onClose: () => { popup.current = null; latest.current.onDismiss?.() },
		}) ?? null
	}, [props.open, props.children, props.className, props.style, props.placement, props.dismissOnOutsideTap, dark])

	useEffect(() => () => popup.current?.close(), [])

	<></>
}

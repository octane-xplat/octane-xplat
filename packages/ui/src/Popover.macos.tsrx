/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'octane'
import type { PopoverProps } from './props'
import { cx } from '@octane-xplat/lib'
import { createPortal } from './native-portal'
import { useThemeScheme } from './theme/theme-scheme'
import { createAppKitPopoverOwner, type AppKitPopoverTarget } from './popover-owner.macos'

function PopoverPortal(props: { target: AppKitPopoverTarget; panel: PopoverProps; dark: boolean; depth: number; committed(token: object): void }) {
	useLayoutEffect(() => props.committed(props.target.token), null)
	return createPortal(
		<masonview className={cx('vx-popover', props.dark && 'ns-dark', props.panel.className)}
			style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.panel.style))}>
			<LayerDepthProvider value={props.depth}>{props.panel.children}</LayerDepthProvider>
		</masonview>, props.target.view,
	)
}

/** Self-drawn, anchored window layer; content portals from its declaring tree. */
export function Popover(props: PopoverProps) @{
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const open = props.open ?? internal, dark = useThemeScheme() === 'dark'
	const live = useRef({ props, open }); live.current = { props, open }
	const [target, setTarget] = useState<AppKitPopoverTarget | null>(null)
	const requestDismiss = () => {
		if (!live.current.open) return
		if (live.current.props.open === undefined) { live.current.open = false; setInternal(false) }
		live.current.props.onDismiss?.()
	}
	const dismissal = useLayerDismissal({
		active: !!open, isPresent: () => owner.isPresent(),
		getFocusTarget: () => live.current.props.finalFocusRef?.current,
		dismiss: requestDismiss,
		get behavior() { return live.current.props.dismissOnEscape === false ? 'block' : 'close' },
	})
	const owner = useMemo(() => createAppKitPopoverOwner({
		state() { const current = live.current; return { open: !!current.open, anchor: current.props.anchor?.current,
			placement: current.props.placement, alignment: current.props.alignment, offset: current.props.offset,
			lightDismiss: current.props.dismissOnOutsideTap !== false } },
		publish: (next, retired) => setTarget((current) => next ?? (current?.token === retired ? null : current)),
		dismiss: requestDismiss, canDismiss: () => dismissal.shouldClose(),
	}), [])
	useLayoutEffect(() => owner.update(), null)
	useEffect(() => () => owner.dispose(), [])

	@if (target && open) {
		<PopoverPortal target={target} panel={props} dark={dark} depth={dismissal.depth} committed={owner.committed} />
	}
}

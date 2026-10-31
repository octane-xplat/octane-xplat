/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { cx } from '@octane-xplat/lib'
import type { PopoverProps } from '../../props'
import type { PopoverInternalProps } from '../../internal-props'
import { View } from '../layout/View'
import { createPortal } from '../../internal/platform/native-portal'
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { dispatchLayerKey } from './layer-stack'
import { SizeProvider } from '../layout/size-context'
import { useThemeScheme } from '../../theme/theme-scheme'
import { layerOffset, positionPopover, resolveLayerAlignment, resolveLayerSide } from './popover-position'

function PopoverLayer(props: PopoverInternalProps & { anchorView: any }) @{
	const [session, setSession] = useState<any>(null)
	const live = useRef<any>(null)
	const gap = layerOffset(props.offset ?? 8)
	const dark = useThemeScheme() === 'dark'
	const dismissal = useLayerDismissal({
		active: !!props.open && !!session,
		isPresent: () => live.current?.isPresent() ?? false,
		getHost: () => props.anchorView,
		getFocusTarget: () => props.finalFocusRef?.current,
		dismiss: () => props.onDismiss?.(),
		behavior: props.dismissOnEscape === false ? 'block' : 'close',
	})
	const options = {
		position(anchor: any, panel: any, viewport: any, rtl: boolean) {
			if (props.fixedPosition) {
				return { left: props.fixedPosition.x, top: props.fixedPosition.y, placement: 'bottom' as const }
			}
			const side = props.layerPosition
				? resolveLayerSide(props.layerPosition.placement, rtl)
				: (props.placement ?? 'bottom')
			return positionPopover(
				{ left: anchor.x, top: anchor.y, width: anchor.width, height: anchor.height },
				panel,
				{ left: viewport.x, top: viewport.y, width: viewport.width, height: viewport.height },
				side, gap,
				props.layerPosition ? resolveLayerAlignment(props.layerPosition.alignment, side, rtl) : (props.alignment ?? 'start'),
			)
		},
		onEscape(event: { preventDefault(): void }) {
			dispatchLayerKey({ key: 'Escape', preventDefault: () => event.preventDefault() })
		},
		onOutside(event: { preventDefault(): void }) {
			if (props.dismissOnOutsideTap === false || !dismissal.shouldClose()) { return }
			event.preventDefault()
			props.onDismiss?.()
		},
		onUnavailable() {
			if (dismissal.shouldClose(true)) { props.onDismiss?.() }
		},
		onDisposed() {
			if (live.current) { live.current = null; setSession(null) }
		},
	}
	const latest = useRef(options)
	latest.current = options
	useEffect(() => {
		const instance = props.anchorView.createPopover(latest.current)
		live.current = instance
		setSession(instance)
		return () => {
			live.current = null
			instance?.dispose()
		}
	}, [props.anchorView])
	useEffect(() => { session?.configure(options) }, null)
	useEffect(() => {
		if (props.open) { session?.show() }
		else { session?.hide() }
	}, [session, props.open])

	<>
		{session ? createPortal(
			<View className={cx('vx-popover-layer', dark && 'ns-dark')}>
				<View className={cx('vx-popover', props.className)} style={props.style}>
					<LayerDepthProvider value={dismissal.depth}>
						<SizeProvider value={null}>{props.children}</SizeProvider>
					</LayerDepthProvider>
				</View>
			</View>,
			session.target,
		) : null}
	</>
}

/** GTK owns the native surface; portal content keeps the declaring root,
 * context and shared layer authority. */
export function Popover(props: PopoverProps): unknown @{
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const [anchor, setAnchor] = useState<any>(null)
	const open = props.open ?? internal
	useEffect(() => {
		const raw = props.anchor?.current ?? null
		const next = (raw as any)?.native !== undefined ? (raw as any).native : raw
		if (next !== anchor) { setAnchor(next) }
	}, null)
	const requestDismiss = () => {
		if (props.open === undefined) { setInternal(false) }
		props.onDismiss?.()
	}

	<>
		{open && anchor ? <PopoverLayer {...props} open={open} anchorView={anchor} onDismiss={requestDismiss} /> : null}
	</>
}

/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'octane'
import type { PopoverAnchorRef, PopoverPlacement, Renderable } from './props'
import type { NSView } from '@octane-xplat/platform/macos'
import { createPortal } from './native-portal'
import { useThemeScheme } from './theme/theme-scheme'
import { useDirection } from './internationalization'
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { createAppKitTypeaheadLayer, type TypeaheadLayerSize, type TypeaheadLayerTarget } from './typeahead-layer.macos'
import { cx } from '@octane-xplat/lib'
interface Props {
	anchor: PopoverAnchorRef
	input(): NSView | null
	open: boolean
	width?: number
	placement?: PopoverPlacement
	onDismiss(): void
	onBlur(event: any): void
	onReady?(): void
	children?: Renderable
}
function ResultPortal(props: { target: TypeaheadLayerTarget; size: TypeaheadLayerSize; dark: boolean; depth: number; children?: Renderable; committed(token: object): void; blur(event: any): void }) {
	useLayoutEffect(() => props.committed(props.target.token), null)
	return createPortal(
		<masonview className={cx('vx-typeahead-dropdown', 'vx-typeahead-dropdown--appkit', props.dark && 'ns-dark')}
			onBlur={props.blur} style={{ display: 'flex', flexDirection: 'column', width: props.size.width }}>
			<scrollview orientation="vertical" style={{ width: props.size.width, maxHeight: props.size.maxHeight }}>
				<masonview style={{ display: 'flex', flexDirection: 'column', width: props.size.width }}>
					<LayerDepthProvider value={props.depth}>{props.children}</LayerDepthProvider>
				</masonview>
			</scrollview>
		</masonview>, props.target.view,
	)
}
/** Source-tree portal into a same-window layer. No detached result root,
 * inline fallback or focus restoration is used for suggestions. */
export function TypeaheadResults(props: Props) @{
	const direction = useDirection(), dark = useThemeScheme() === 'dark'
	const live = useRef({ props, direction }); live.current = { props, direction }
	const [target, setTarget] = useState<TypeaheadLayerTarget | null>(null)
	const [size, setSize] = useState<TypeaheadLayerSize>({ width: 240, maxHeight: 320 })
	const dismissal = useLayerDismissal({ active: props.open, restoreFocus: false,
		getHost: () => live.current.props.input(),
		dismiss: () => live.current.props.onDismiss(),
		isPresent: () => controller.isPresent(),
	})
	const controller = useMemo(() => createAppKitTypeaheadLayer({
		state: () => { const { props, direction } = live.current; return { open: props.open, anchor: props.anchor.current, input: props.input(), width: props.width, placement: props.placement, rtl: direction === 'rtl' } },
		publish: (next, retired) => setTarget((current) => next ?? (current?.token === retired ? null : current)),
		resize: setSize,
		dismiss: () => live.current.props.onDismiss(),
		canDismiss: () => dismissal.shouldClose(),
	}), [])
	useLayoutEffect(() => controller.update(), null)
	useEffect(() => () => controller.dispose(), [])
	@if (target && props.open) {
		<ResultPortal target={target} size={size} dark={dark} depth={dismissal.depth}
			committed={(token: object) => { if (controller.committed(token)) live.current.props.onReady?.() }} blur={(event: any) => live.current.props.onBlur(event)}>
			{props.children}
		</ResultPortal>
	}
}

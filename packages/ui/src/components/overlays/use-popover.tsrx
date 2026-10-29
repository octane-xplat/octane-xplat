/** @jsxImportSource @octane-xplat/jsx */
import { useCallback } from 'octane'
import type { ContextRenderProps, UsePopoverOptions, UsePopoverReturn } from '../../props'
import { useLayer } from './use-layer'

/** Headless popover (Astryx `usePopover`) built on `useLayer`: the trigger
 *  binds `triggerRef` (+ `triggerProps` for `aria-haspopup`/`aria-expanded`/
 *  `aria-controls` on web and the `expanded` accessibility state elsewhere),
 *  and `render(children, position)` mounts panel content while open. Light
 *  and Escape dismissal are on by default (`hasLightDismiss`/
 *  `hasEscapeDismiss`); upstream's focus-trap surface options are not part
 *  of this contract — authored content owns its own focus semantics. */
export function usePopover(options: UsePopoverOptions = {}): UsePopoverReturn {
	const layer = useLayer({
		mode: 'context',
		lightDismiss: options.hasLightDismiss !== false,
		dismissOnEscape: options.hasEscapeDismiss !== false,
		onShow: options.onShow,
		onHide: options.onHide,
	})

	const toggle = useCallback(() => {
		if (layer.isOpen) {
			layer.hide()
		} else {
			layer.show()
		}
	}, [layer.isOpen, layer.show, layer.hide])

	const render = useCallback(
		(children: any, props?: ContextRenderProps) =>
			layer.render(children, {
				accessibilityRole: 'dialog',
				accessibilityLabel: options.dialogLabel,
				className: options.className,
				style: options.style,
				...props,
			}),
		[layer.render, options.dialogLabel, options.className, options.style],
	)

	return {
		triggerRef: layer.ref,
		triggerProps: {
			accessibilityState: { expanded: layer.isOpen },
			web: {
				'aria-haspopup': 'dialog',
				'aria-expanded': layer.isOpen,
				'aria-controls': layer.id,
			},
		},
		anchorId: layer.anchorId,
		id: layer.id,
		isOpen: layer.isOpen,
		show: layer.show,
		hide: layer.hide,
		toggle,
		render,
	}
}

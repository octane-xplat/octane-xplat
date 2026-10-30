/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useEffect, useRef, useState } from 'octane'
import { createPortal } from './native-portal'
import type { DrawerProps } from './props'
import { cx } from '@octane-xplat/lib'
import { useLayerDismissal, LayerDepthProvider } from './layer-dismissal.tsrx'
import { themeSchemeClasses } from './theme/theme-host'

/** Edge-docked panel over a scrim (Astryx `Drawer`), GTK leaf. The shared
 *  leaf draws its overlay inside a grid cell; GTK's `masonview` falls back
 *  to `Gtk.Box` emulation (no overlapping cells), so the open state mounts
 *  a modal overlay layer instead — scrim covers the window, the panel
 *  docks start and fills height. `main` renders inline. Backdrop tap and
 *  Escape fire `onDismiss`; uncontrolled drawers close on their own. */
export function Drawer(props: DrawerProps) @{
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const open = props.open ?? internal
	const sentinel = useRef<any>(null)
	const [layer, setLayer] = useState<any>(null)
	const requestDismiss = () => {
		if (props.open === undefined) {
			setInternal(false)
		}

		props.onDismiss?.()
	}
	const dismissal = useLayerDismissal({
		active: !!open,
		isPresent: () => !!layer,
		dismiss: requestDismiss,
		behavior: 'close',
		getHost: () => sentinel.current,
	})

	useEffect(() => {
		const view = sentinel.current
		if (!view || !open) {
			return
		}

		const l = view.createOverlayLayer({
			modal: true,
			scrim: true,
			align: { h: 'start', v: 'fill' },
			onScrimPress: requestDismiss,
		})
		setLayer(l)
		l.setVisible(true)
		return () => {
			l.dispose()
			setLayer(null)
		}
	}, [open])

	<>
		{props.main}
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
		{open && layer
			? createPortal(
					<LayerDepthProvider value={dismissal.depth}>
						<masonview
							className={cx('vx-drawer-panel', themeSchemeClasses(), props.className)}
							style={mergeStyle(
								// The portal target is a Gtk.Box — flexGrow is what
								// expands a child to fill its height there.
								{ flexDirection: 'column', flexGrow: 1, height: '100%' },
								{ display: 'flex', width: 280 },
							)}
						>
							{props.drawer}
						</masonview>
					</LayerDepthProvider>,
					layer.target,
				)
			: null}
	</>
}

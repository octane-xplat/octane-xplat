/** @jsxImportSource @octane-xplat/jsx */
import { registerElement } from '@nativescript-community/octane'
import { Drawer as NSDrawer, install } from '@nativescript-community/ui-drawer'
import { useEffect, useRef } from 'octane'
import type { SideDrawerProps } from '../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../components/overlays/escape-props'

// Optional peer: this leaf resolves only when the app ships the plugin
// (isolated linker resolves it under the app root). install() registers the
// plugin's gesture handler once at module load. iOS has no OS drawer
// widget — ui-drawer is the platform-authentic mechanism (edge-gesture
// slide-over); the self-drawn shared `Drawer` lives in the root export.
install()
registerElement('drawer', NSDrawer)

/** SideDrawer — ui-drawer host. `main`/`drawer` are slot props wired via the
 *  driver's hostSlot mechanism (parentView[slot] = view → mainContent /
 *  leftDrawer); `open` drives the imperative open()/close(). Slot hosts are
 *  gridlayout so each side stays multi-child. */
export function SideDrawer(props: SideDrawerProps) @{
	const host = useRef<NSDrawer | null>(null)

	useEffect(() => {
		const d = host.current
		if (!d) {
			return
		}

		if (props.open && !d.isOpened('left')) {
			d.open('left').catch(() => {})
		} else if (!props.open && d.isOpened('left')) {
			d.close('left').catch(() => {})
		}
	}, [props.open])

	<drawer
		id={props.id}
		ref={(d: any) => {
			host.current = d
			applyEscapeProps(d, props)
		}}
		className={cx('vx-drawer', props.className)}
		style={props.style}
	>
		<masonview hostSlot="mainContent" style={{ display: 'grid' }}>
			{props.main}
		</masonview>
		@if (props.drawer != null) {
			<masonview hostSlot="leftDrawer" style={{ display: 'grid' }}>
				{props.drawer}
			</masonview>
		}
	</drawer>
}

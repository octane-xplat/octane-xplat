/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import { useState } from 'octane'
import type { DrawerProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'

/** Self-drawn drawer — grid host: `main` fills the cell, backdrop + left
 *  panel overlay it while `open`. Identical pixels/behavior across targets
 *  (backdrop tap fires `onDismiss` on both). The edge-gesture plugin widget
 *  lives in `ui/android` (DrawerLayout) and `ui/ios` (SideDrawer). */
export function Drawer(props: DrawerProps) @{
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const open = props.open ?? internal
	const requestDismiss = () => {
		if (props.open === undefined) {
			setInternal(false)
		}

		props.onDismiss?.()
	}

	<masonview
		id={props.id}
		ref={(v: any) => applyEscapeProps(v, props)}
		className={cx('vx-drawer', 'vx-drawer--appkit', props.className)}
		style={mergeStyle({ display: 'grid' }, props.style)}
	>
		<masonview className="vx-drawer-main" style={{ display: 'grid' }}>
			{props.main}
		</masonview>
		{/* All layers share the host's single grid cell. */}
		@if (open) {
			<masonview
				className="vx-drawer-backdrop"
				style={mergeStyle({ display: 'flex' }, { backgroundColor: 'rgba(0, 0, 0, 0.4)' })}
				onTap={requestDismiss}
			/>
		}
		@if (open) {
			<masonview
				className="vx-drawer-panel"
				style={mergeStyle(
					{ display: 'flex' },
					{ width: 280, backgroundColor: '#ffffff', justifySelf: 'start' },
				)}
			>
				{props.drawer}
			</masonview>
		}
	</masonview>
}

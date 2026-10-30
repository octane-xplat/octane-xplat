/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useState } from 'octane'
import type { DrawerProps } from './props'
import { cx } from '@octane-xplat/lib'

/** Composed desktop/web Drawer. Mobile uses the same props with native edge gestures. */
export function Drawer(props: DrawerProps): unknown @{
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const open = props.open ?? internal
	const requestDismiss = () => {
		if (props.open === undefined) {
			setInternal(false)
		}

		props.onOpenChange?.(false)
		props.onDismiss?.()
	}

	<masonview
		id={props.id}

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
					{ width: props.width ?? 280, backgroundColor: '#ffffff', justifySelf: 'start' },
				)}
			>
				{props.drawer}
			</masonview>
		}
	</masonview>
}

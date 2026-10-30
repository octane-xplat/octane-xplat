/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useState } from 'octane'
import type { DrawerProps } from './props'
import { cx } from '@octane-xplat/lib'

/** Composed Windows Drawer; edge gestures are available on mobile only. */
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

		className={cx('vx-drawer', props.className)}
		style={mergeStyle(
			{ display: 'grid', gridTemplateColumns: '1fr', gridTemplateRows: '1fr' },
			props.style,
		)}
	>
		<masonview className="vx-drawer-main" style={{ display: 'grid' }}>
			{props.main}
		</masonview>
		@if (open) {
			<>
				<masonview
					className="vx-drawer-backdrop"
					onTap={requestDismiss}
					style={{ display: 'flex' }}
				/>
				<masonview
					className="vx-drawer-panel"
					style={mergeStyle(
						{ display: 'flex' },
						{ justifySelf: 'start', width: props.width ?? 280 },
					)}
				>
					{props.drawer}
				</masonview>
			</>
		}
	</masonview>
}

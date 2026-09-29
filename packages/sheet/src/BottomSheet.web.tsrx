/** @jsxImportSource octane */
import type { BottomSheetProps } from './web/types'

/** Web bottom sheet: a fixed-position panel over a scrim. `open` controls
 *  visibility; `onDismissed` fires on scrim click / Escape. */
export function BottomSheet(props: BottomSheetProps) @{
	const open = props.open ?? false
	const dismissable = (props.shouldDismissOnClickOutside ?? true) || (props.shouldDismissOnBackPress ?? true)

	if (!open) {
		return <></>
	}

	<>
		<div
			style={{ position: 'fixed', inset: 0, background: 'rgb(0 0 0 / 0.4)', zIndex: 999 }}
			onClick={() => {
				if (props.shouldDismissOnClickOutside ?? true) {
					props.onDismissed?.()
				}
			}}
		/>
		<div
			role="dialog"
			aria-modal="true"
			style={{
				position: 'fixed',
				left: 0,
				right: 0,
				bottom: 0,
				zIndex: 1000,
				background: 'var(--sheet-bg, Canvas)',
				color: 'var(--sheet-fg, CanvasText)',
				borderRadius: '16px 16px 0 0',
				boxShadow: '0 -4px 24px rgb(0 0 0 / 0.2)',
				maxHeight: props.skipPartiallyExpanded ? '90vh' : '60vh',
				overflowY: 'auto',
			}}
		>
			{(props.showDragHandle ?? true) && (
				<div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
					<div style={{ width: 36, height: 4, borderRadius: 2, background: 'color-mix(in srgb, CanvasText 30%, transparent)' }} />
				</div>
			)}
			{props.content?.()}
		</div>
	</>;
}

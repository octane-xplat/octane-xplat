/** @jsxImportSource @octane-xplat/jsx */
import type { SeparatorProps } from '../../props'
import { cx } from '@octane-xplat/lib'

/** Divider — hairline rule. `variant`/`label`/`isFullBleed` are class hooks
 *  the native stylesheet resolves; a labeled rule renders text between two
 *  segments. */
export function Separator(props: SeparatorProps): unknown @{
	const vertical = props.orientation === 'vertical'

	@if (props.label != null) {
		<masonview
			id={props.id}
			className={cx(
				'vx-separator',
				'vx-separator--labeled',
				vertical ? 'vx-separator--v' : 'vx-separator--h',
				props.variant === 'strong' && 'vx-separator--strong',
				props.isFullBleed && 'vx-separator--bleed',
				props.className,
			)}
			style={props.style}
			accessibilityRole="none"
		>
			<masonview className="vx-separator-rule" />
			<label
				className="vx-separator-label"
				text={typeof props.label === 'string' ? props.label : ''}
			/>
			<masonview className="vx-separator-rule" />
		</masonview>
	} @else {
		<masonview
			id={props.id}
			className={cx(
				'vx-separator',
				vertical ? 'vx-separator--v' : 'vx-separator--h',
				props.variant === 'strong' && 'vx-separator--strong',
				props.isFullBleed && 'vx-separator--bleed',
				props.className,
			)}
			style={props.style}
			accessibilityRole="none"
		/>
	}
}

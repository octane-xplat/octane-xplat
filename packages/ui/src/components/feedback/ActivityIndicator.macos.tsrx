/** @jsxImportSource @octane-xplat/jsx */
import { cx } from '@octane-xplat/lib'
import type { ActivityIndicatorProps } from '../../props'
import { useThemeScheme } from '../../theme/theme-scheme.macos'
import { controlColors } from '../../internal/platform/control-colors.macos'
import { mergeStyle } from '../../internal/layout/style-merge'

/** Self-drawn ring with AppKit stylesheet rotation and reduced-motion fallback.
 * Native playback and presentation remain unqualified. */
export function ActivityIndicator(props: ActivityIndicatorProps): unknown @{
	const dark = useThemeScheme() === 'dark'
	if (props.busy === false) return null
	const labeled = props.label != null
	const text = typeof props.label === 'string' || typeof props.label === 'number' ? String(props.label): undefined
	const color = props.shade === 'onMedia' ? '#ffffff' : controlColors(dark).primary
	const ring = <masonview id={labeled ? undefined : props.id}
		className={cx('vx-spinner', 'vx-spinner--appkit', `vx-spinner--size-${props.size ?? 'md'}`,
			props.shade === 'onMedia' && 'vx-spinner--onmedia', !labeled && props.className)}
		style={mergeStyle({ borderColor: `${color}4d`, borderTopColor: color }, !labeled ? props.style : undefined)}
		accessible={!labeled} accessibilityRole={labeled ? undefined : 'progressbar'}
		accessibilityLabel={labeled ? undefined : props.accessibilityLabel ?? 'Loading'}
		accessibilityState={labeled ? undefined : { busy: true }} />
	@if (labeled) {
		<masonview id={props.id} className={cx('vx-spinner-row--appkit', props.className)} style={props.style}
			accessibilityRole="progressbar" accessibilityLabel={props.accessibilityLabel ?? text ?? 'Loading'}
			accessibilityState={{ busy: true }}>
			{ring}
			{text !== undefined ? <label className="vx-spinner-label" text={text} /> : props.label}
		</masonview>
	} @else {
		{ring}
	}
}

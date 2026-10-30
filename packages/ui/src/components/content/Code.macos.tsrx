/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { CodeProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { Text } from './Text.macos.tsrx'

/** Code — macOS leaf. The AppKit host resolves `text-muted` for the
 *  secondary color; `size="inherit"`/`color="inherit"` are inert here. */
export function Code(props: CodeProps): unknown @{
	<Text
		id={props.id}
		className={cx('vx-code', props.color === 'secondary' && 'text-muted', props.className)}
		style={mergeStyle({ fontFamily: 'ui-monospace' }, props.style)}
	>
		{props.children}
	</Text>
}

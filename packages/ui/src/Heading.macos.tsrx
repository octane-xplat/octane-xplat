/** @jsxImportSource @octane-xplat/macos-renderer */
import type { HeadingProps } from './props'
import { cx } from '@octane-xplat/lib'

export function Heading(props: HeadingProps) @{
	<label id={props.id} className={cx(props.className)} style={props.style as any} accessibilityRole="heading">
		{props.children}
	</label>
}

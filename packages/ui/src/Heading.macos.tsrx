/** @jsxImportSource @octane-xplat/macos-renderer */
import type { HeadingProps } from './props'
import { styleRecord } from './style-merge'
import { cx } from '@octane-xplat/lib'

export function Heading(props: HeadingProps) @{
	<label id={props.id} className={cx(props.className)} style={styleRecord(props.style)} accessibilityRole="heading">
		{props.children}
	</label>
}

/** @jsxImportSource @octane-xplat/macos-renderer */
import type { CodeProps } from './props';
import { cx } from './cx';
import { Text } from './Text.macos.tsrx';

/** Code — macOS leaf. The AppKit host resolves `text-muted` for the
 *  secondary color; `size="inherit"`/`color="inherit"` are inert here. */
export function Code(props: CodeProps) @{
	<Text
		id={props.id}
		className={cx('vx-code', props.color === 'secondary' && 'text-muted', props.className)}
		style={{ fontFamily: 'ui-monospace', ...props.style }}
	>
		{props.children}
	</Text>
}

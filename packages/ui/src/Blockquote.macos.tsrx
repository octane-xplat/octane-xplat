/** @jsxImportSource @octane-xplat/macos-renderer */
import type { BlockquoteProps } from './props';
import { cx } from './cx';

/** macOS AppKit leaf — same structure as the shared native leaf; the AppKit
 *  host has no CSS layer for the blockquote rule, so the inline-start bar
 *  comes from the background strip view next to the content column. */
export function Blockquote(props: BlockquoteProps) @{
	<flexboxlayout
		id={props.id}
		className={cx('vx-blockquote', props.className)}
		style={{ flexDirection: 'row', gap: 12, ...props.style }}
		flexDirection="row"
	>
		<flexboxlayout
			style={{ width: 2, backgroundColor: props.style?.borderLeftColor ?? '#3f3f46', alignSelf: 'stretch' }}
		/>
		<flexboxlayout flexDirection="column" style={{ flexGrow: 1 }}>
			{typeof props.children === 'string' || typeof props.children === 'number'
				? <label className="vx-blockquote-text text-muted" whiteSpace="normal">{props.children}</label>
				: props.children}
			{props.cite != null && props.cite !== false
				? typeof props.cite === 'string' || typeof props.cite === 'number'
					? <label className="vx-blockquote-cite text-sm text-muted" whiteSpace="normal">{props.cite}</label>
					: props.cite
				: null}
		</flexboxlayout>
	</flexboxlayout>
}

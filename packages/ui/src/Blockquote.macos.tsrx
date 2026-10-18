/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import type { BlockquoteProps } from './props';
import { cx } from '@octane-xplat/lib';

/** macOS AppKit leaf — same structure as the shared native leaf; the AppKit
 *  host has no CSS layer for the blockquote rule, so the inline-start bar
 *  comes from the background strip view next to the content column. */
export function Blockquote(props: BlockquoteProps) @{
	<masonview id={props.id} className={cx('vx-blockquote', props.className)} style={mergeStyle({display: "flex"}, { flexDirection: 'row', gap: 12, ...(props.style as any) })} flexDirection="row">
		<masonview style={mergeStyle({display: "flex"}, { width: 2, backgroundColor: (props.style as any)?.borderLeftColor ?? '#3f3f46', alignSelf: 'stretch' })}/>
		<masonview flexDirection="column" style={mergeStyle({display: "flex"}, { flexGrow: 1 })}>
			{typeof props.children === 'string' || typeof props.children === 'number'
				? <label className="vx-blockquote-text text-muted" whiteSpace="normal">{props.children}</label>
				: props.children}
			{props.cite != null && props.cite !== false
				? typeof props.cite === 'string' || typeof props.cite === 'number'
					? <label className="vx-blockquote-cite text-sm text-muted" whiteSpace="normal">{props.cite}</label>
					: props.cite
				: null}
		</masonview>
	</masonview>
}

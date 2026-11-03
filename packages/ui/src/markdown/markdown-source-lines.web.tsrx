/** @jsxImportSource @octane-xplat/jsx/dom */
import type { JSX } from 'octane/jsx-runtime'
import type { Renderable } from '../props'

/**
 * Web source-line provenance — stamps `data-source-line`/`data-source-line-end`
 * (1-based, inclusive) on a `display:contents` wrapper while the
 * `markdownSourceLinesPlugin` is installed, matching the reference's
 * per-block attributes without adding a layout box.
 */
export function MdSourceLines(props: {
	lines?: { readonly start: number; readonly end: number }
	children?: Renderable
}): JSX.Element @{
	if (props.lines == null) {
		return <>{props.children}</>
	}

	return (
		<div
			style={{ display: 'contents' }}
			data-source-line={props.lines.start}
			data-source-line-end={props.lines.end}
		>
			{props.children}
		</div>
	)
}

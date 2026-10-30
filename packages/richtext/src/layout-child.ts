import type { RichTextEditorProps } from './types'
import { mergeStyle, type StyleProp } from './style-merge'

/** Parent-layout metadata translated to the CSS style bag on the host view —
 *  the driver drops layout keys passed as props; the style channel routes to
 *  the child's mason leaf (stashed pre-attach, replayed at attach). */
export function layoutChildProps(
	props: RichTextEditorProps,
	baseStyle: StyleProp = props.style,
): {
	style: string | Record<string, any>
} {
	const style: Record<string, any> = {}
	if (props.row !== undefined) {
		const row = typeof props.row === 'number' ? props.row + 1 : props.row
		style.gridRow = `${row}${props.rowSpan != null && Number(props.rowSpan) > 1 ? ` / span ${props.rowSpan}` : ''}`
	} else if (props.rowSpan !== undefined) {
		style.gridRow = `span ${props.rowSpan}`
	}
	if (props.col !== undefined) {
		const col = typeof props.col === 'number' ? props.col + 1 : props.col
		style.gridColumn = `${col}${props.colSpan != null && Number(props.colSpan) > 1 ? ` / span ${props.colSpan}` : ''}`
	} else if (props.colSpan !== undefined) {
		style.gridColumn = `span ${props.colSpan}`
	}
	if (props.dock !== undefined) {
		style.position = style.position ?? 'absolute'
		if (props.dock === 'left' || props.dock === 'top' || props.dock === 'bottom') {
			style.left = style.left ?? 0
		}

		if (props.dock === 'right' || props.dock === 'top' || props.dock === 'bottom') {
			style.right = style.right ?? 0
		}

		if (props.dock === 'top' || props.dock === 'left' || props.dock === 'right') {
			style.top = style.top ?? 0
		}

		if (props.dock === 'bottom' || props.dock === 'left' || props.dock === 'right') {
			style.bottom = style.bottom ?? 0
		}
	}
	for (const key of ['left', 'top', 'flexGrow', 'flexShrink', 'alignSelf', 'order'] as const) {
		if (props[key] !== undefined) {
			style[key] = props[key]
		}
	}
	if ((props.left !== undefined || props.top !== undefined) && props.dock === undefined) {
		style.position = style.position ?? 'absolute'
	}
	return { style: mergeStyle(style, baseStyle) }
}

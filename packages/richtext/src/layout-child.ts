import type { RichTextEditorProps } from './types'

/** Parent-layout metadata translated to the CSS style bag on the host view —
 *  the driver drops layout keys passed as props; the style channel routes to
 *  the child's mason leaf (stashed pre-attach, replayed at attach). */
export function layoutChildProps(
	props: RichTextEditorProps,
	baseStyle = props.style,
): { style: Record<string, any> } {
	const style: Record<string, any> = { ...(typeof baseStyle === 'object' ? baseStyle : {}) }
	if (props.row !== undefined) {
		style.gridRow = `${Number(props.row) + 1} / span ${props.rowSpan ?? 1}`
	} else if (props.rowSpan !== undefined) {
		style.gridRow = `span ${props.rowSpan}`
	}
	if (props.col !== undefined) {
		style.gridColumn = `${Number(props.col) + 1} / span ${props.colSpan ?? 1}`
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
	return { style }
}

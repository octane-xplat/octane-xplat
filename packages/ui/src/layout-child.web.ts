import type { LayoutChildProps } from './props';

/** Convert parent-layout metadata to CSS on the web leaf. Native's `dock`
 *  attribute has no CSS equivalent and is ignored on web. Grid indices are
 *  zero-based in the shared API, matching NativeScript. */
export function layoutChildProps(props: LayoutChildProps & { style?: any }, baseStyle = props.style) {
	const style = { ...(baseStyle ?? {}) };
	if (props.row !== undefined) style.gridRow = `${props.row + 1} / span ${props.rowSpan ?? 1}`;
	else if (props.rowSpan !== undefined) style.gridRow = `span ${props.rowSpan}`;
	if (props.col !== undefined) style.gridColumn = `${props.col + 1} / span ${props.colSpan ?? 1}`;
	else if (props.colSpan !== undefined) style.gridColumn = `span ${props.colSpan}`;
	if (props.left !== undefined) style.left = props.left;
	if (props.top !== undefined) style.top = props.top;
	if (props.flexGrow !== undefined) style.flexGrow = props.flexGrow;
	if (props.flexShrink !== undefined) style.flexShrink = props.flexShrink;
	if (props.alignSelf !== undefined) style.alignSelf = props.alignSelf;
	if (props.order !== undefined) style.order = props.order;
	return { style };
}

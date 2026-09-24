import type { LayoutChildProps } from './props';

/** NativeScript reads these attributes from each child view during parent
 *  layout. Values are forwarded with NativeScript's own property names. */
export function layoutChildProps(props: LayoutChildProps) {
	const result: Record<string, any> = {};
	for (const key of ['row', 'col', 'rowSpan', 'colSpan', 'dock', 'left', 'top', 'flexGrow', 'flexShrink', 'alignSelf', 'order'] as const) {
		if (props[key] !== undefined) result[key] = props[key];
	}

	return result;
}

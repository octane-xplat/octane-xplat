import type { LayoutChildProps, FlexContainerProps } from './props'

// start/end shorthand → flex-start/flex-end.
const FLEX_JUSTIFY: Record<string, string> = { start: 'flex-start', end: 'flex-end' }
const FLEX_ALIGN: Record<string, string> = { start: 'flex-start', end: 'flex-end' }

/** NativeScript reads these attributes from each child view during parent
 *  layout. Values are forwarded with NativeScript's own property names.
 *  The flex-container props (justifyContent/alignItems/flexWrap/gap) land on
 *  the host flexboxlayout itself — its own attributes, not child metadata. */
export function layoutChildProps(props: LayoutChildProps & Partial<FlexContainerProps>) {
	const result: Record<string, any> = {}
	for (const key of [
		'row',
		'col',
		'rowSpan',
		'colSpan',
		'dock',
		'left',
		'top',
		'flexGrow',
		'flexShrink',
		'alignSelf',
		'order',
	] as const) {
		if (props[key] !== undefined) result[key] = props[key]
	}

	if (props.justifyContent !== undefined)
		result.justifyContent = FLEX_JUSTIFY[props.justifyContent] ?? props.justifyContent
	if (props.alignItems !== undefined)
		result.alignItems = FLEX_ALIGN[props.alignItems] ?? props.alignItems
	if (props.flexWrap !== undefined)
		result.flexWrap =
			props.flexWrap === true ? 'wrap' : props.flexWrap === false ? 'nowrap' : props.flexWrap
	if (props.gap !== undefined) result.gap = props.gap
	if (props.rowGap !== undefined) result.rowGap = props.rowGap
	if (props.columnGap !== undefined) result.columnGap = props.columnGap

	return result
}

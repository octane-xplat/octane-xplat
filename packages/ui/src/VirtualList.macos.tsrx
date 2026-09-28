/** @jsxImportSource @xplat/macos/renderer */
import type { VirtualListProps } from './props'
import { ScrollView } from './ScrollView.macos.tsrx'

/** AppKit fallback that preserves keyed list behavior but renders every row
 *  in one scroll view; it does not virtualize or recycle offscreen rows. */
export function VirtualList<T = any>(props: VirtualListProps<T>) @{
	<ScrollView id={props.id} className={props.className} style={props.style}>
		@if (props.renderHeader) {
			props.renderHeader()
		}
		@if (props.items.length === 0) {
			@if (props.renderEmpty) {
				props.renderEmpty()
			}
		} @else {
			@for (const item of props.items; index i; key props.keyExtractor(item, i)) {
				{props.renderItem(item, i)}
				@if (props.renderSeparator && i < props.items.length - 1) {
					props.renderSeparator()
				}
			}
		}
		@if (props.renderFooter) {
			props.renderFooter()
		}
	</ScrollView>;
}

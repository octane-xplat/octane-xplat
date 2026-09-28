/** @jsxImportSource @xplat/macos/renderer */
import type { VirtualListProps } from './props'
import { ScrollView } from './ScrollView.macos.tsrx'

type AppKitScrollEvent = { verticalOffset: number; viewportHeight: number; contentHeight: number }
type AppKitVirtualListProps<T> = VirtualListProps<T> & { onScroll?: (event: AppKitScrollEvent) => void }

/** AppKit fallback that preserves keyed list behavior but renders every row
 *  in one scroll view; it does not virtualize or recycle offscreen rows. */
export function VirtualList<T = any>(props: AppKitVirtualListProps<T>) @{
	<ScrollView id={props.id} className={props.className} style={props.style} onScroll={props.onScroll}>
		@if (props.renderHeader) {
			<flexboxlayout className="vx-virtual-list-header" flexDirection="column">
				{props.renderHeader()}
			</flexboxlayout>
		}
		@if (props.items.length === 0) {
			@if (props.renderEmpty) {
				<flexboxlayout className="vx-virtual-list-empty" flexDirection="column">
					{props.renderEmpty()}
				</flexboxlayout>
			}
		} @else {
			@for (const item of props.items; index i; key props.keyExtractor(item, i)) {
				<flexboxlayout className="vx-virtual-list-row" flexDirection="column">
					{props.renderItem(item, i)}
					@if (props.renderSeparator && i < props.items.length - 1) {
						<flexboxlayout className="vx-virtual-list-separator" flexDirection="column">
							{props.renderSeparator()}
						</flexboxlayout>
					}
					</flexboxlayout>
			}
		}
		@if (props.renderFooter) {
			<flexboxlayout className="vx-virtual-list-footer" flexDirection="column">
				{props.renderFooter()}
			</flexboxlayout>
		}
	</ScrollView>;
}

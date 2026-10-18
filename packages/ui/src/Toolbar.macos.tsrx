/** @jsxImportSource @octane-xplat/macos-renderer */
import type { ToolbarProps } from './props';
import { cx } from '@octane-xplat/lib';
import { applyEscapeProps } from './escape-props';
import { SizeProvider } from './size-context';

const SIZE_MIN: Record<string, number> = { sm: 28, md: 32, lg: 36 };

/** Toolbar — named contextual action region with start / optional center /
 *  end slots. Native leaf: the same slot layout minus keyboard roving
 *  (pointer platforms carry the composite-widget arrow navigation). */
export function Toolbar(props: ToolbarProps) @{
	const size = props.size ?? 'md';
	const gapPx = (props.gap ?? 1) * 4;
	const vertical = props.orientation === 'vertical';
	const hasCenter = props.centerContent != null;
	const dividerCls = (props.dividers ?? []).map((d) => 'vx-toolbar--div-' + d).join(' ');

	<SizeProvider value={size}>
		<masonview display="flex" id={props.id} ref={(v: any) => applyEscapeProps(v, props)} className={cx('vx-toolbar', 'vx-toolbar--' + (props.variant ?? 'transparent'), 'vx-toolbar--' + size, dividerCls, props.className)} style={props.style} accessibilityLabel={props.label}>
			@if (hasCenter && !vertical) {
				<masonview display="grid" gridTemplateColumns="1fr auto 1fr" className="vx-toolbar-inner" style={{ minHeight: SIZE_MIN[size] }}>
					<masonview style={{gridColumn: '1'}} display="flex" className="vx-toolbar-slot vx-toolbar-slot--start" alignItems="center" gap={gapPx}>{props.startContent}</masonview>
					<masonview style={{gridColumn: '2'}} display="flex" className="vx-toolbar-slot vx-toolbar-slot--center" alignItems="center" justifyContent="center" gap={gapPx}>{props.centerContent}</masonview>
					<masonview style={{gridColumn: '3'}} display="flex" className="vx-toolbar-slot vx-toolbar-slot--end" alignItems="center" justifyContent="flex-end" gap={gapPx}>{props.endContent}</masonview>
				</masonview>
			} @else {
				<masonview display="flex" className="vx-toolbar-inner" flexDirection={vertical ? 'column' : 'row'} alignItems={vertical ? 'stretch' : 'center'} justifyContent={vertical || hasCenter ? 'flex-start' : 'space-between'} gap={gapPx} style={{ minHeight: vertical ? undefined : SIZE_MIN[size] }}>
					@if (props.startContent != null) {
						<masonview display="flex" className="vx-toolbar-slot vx-toolbar-slot--start" flexDirection={vertical ? 'column' : 'row'} alignItems="center" gap={gapPx} flexGrow={props.endContent == null ? 1 : 0}>{props.startContent}</masonview>
					}
					@if (props.centerContent != null) {
						<masonview display="flex" className="vx-toolbar-slot vx-toolbar-slot--center" flexDirection={vertical ? 'column' : 'row'} alignItems="center" justifyContent="center" gap={gapPx} flexGrow={1}>{props.centerContent}</masonview>
					}
					@if (props.endContent != null) {
						<masonview display="flex" className="vx-toolbar-slot vx-toolbar-slot--end" flexDirection={vertical ? 'column' : 'row'} alignItems="center" justifyContent={vertical ? 'center' : 'flex-end'} gap={gapPx}>{props.endContent}</masonview>
					}
				</masonview>
			}
		</masonview>
	</SizeProvider>
}

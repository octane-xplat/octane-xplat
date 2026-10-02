/** @jsxImportSource @octane-xplat/macos-renderer */
import type { ToolbarProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { ToolbarSizeContext,
	ToolbarSizeProvider,
} from './nav-contexts';

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

	<ToolbarSizeProvider value={size}>
		<flexboxlayout
			id={props.id}
			ref={(v: any) => applyEscapeProps(v, props)}
			className={cx('vx-toolbar', 'vx-toolbar--' + (props.variant ?? 'transparent'), 'vx-toolbar--' + size, dividerCls, props.className)}
			style={props.style}
			accessibilityLabel={props.label}
		>
			@if (hasCenter && !vertical) {
				<gridlayout columns="*,auto,*" className="vx-toolbar-inner" style={{ minHeight: SIZE_MIN[size] }}>
					<flexboxlayout col={0} className="vx-toolbar-slot vx-toolbar-slot--start" alignItems="center" gap={gapPx}>{props.startContent}</flexboxlayout>
					<flexboxlayout col={1} className="vx-toolbar-slot vx-toolbar-slot--center" alignItems="center" justifyContent="center" gap={gapPx}>{props.centerContent}</flexboxlayout>
					<flexboxlayout col={2} className="vx-toolbar-slot vx-toolbar-slot--end" alignItems="center" justifyContent="flex-end" gap={gapPx}>{props.endContent}</flexboxlayout>
				</gridlayout>
			} @else {
				<flexboxlayout
					className="vx-toolbar-inner"
					flexDirection={vertical ? 'column' : 'row'}
					alignItems={vertical ? 'stretch' : 'center'}
					justifyContent={vertical || hasCenter ? 'flex-start' : 'space-between'}
					gap={gapPx}
					style={{ minHeight: vertical ? undefined : SIZE_MIN[size] }}
				>
					@if (props.startContent != null) {
						<flexboxlayout className="vx-toolbar-slot vx-toolbar-slot--start" flexDirection={vertical ? 'column' : 'row'} alignItems="center" gap={gapPx} flexGrow={props.endContent == null ? 1 : 0}>{props.startContent}</flexboxlayout>
					}
					@if (props.centerContent != null) {
						<flexboxlayout className="vx-toolbar-slot vx-toolbar-slot--center" flexDirection={vertical ? 'column' : 'row'} alignItems="center" justifyContent="center" gap={gapPx} flexGrow={1}>{props.centerContent}</flexboxlayout>
					}
					@if (props.endContent != null) {
						<flexboxlayout className="vx-toolbar-slot vx-toolbar-slot--end" flexDirection={vertical ? 'column' : 'row'} alignItems="center" justifyContent={vertical ? 'center' : 'flex-end'} gap={gapPx}>{props.endContent}</flexboxlayout>
					}
				</flexboxlayout>
			}
		</flexboxlayout>
	</ToolbarSizeProvider>
}

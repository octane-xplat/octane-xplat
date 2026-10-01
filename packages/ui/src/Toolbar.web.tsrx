import { useRef } from 'octane';
import type { ToolbarProps } from './props';
import { applyEscapeProps } from './escape-props';
import { useListFocus } from './list-focus.web.tsrx';
import { ToolbarSizeContext,
	ToolbarSizeProvider,
} from './nav-contexts';

const SIZE_MIN: Record<string, number> = { sm: 28, md: 32, lg: 36 };

/** Toolbar — named contextual action region with start / optional center /
 *  end slots and roving-tabindex arrow navigation across the focusable
 *  children. Outer chrome paints the variant and divider edges. */
export function Toolbar(props: ToolbarProps) @{
	const size = props.size ?? 'md';
	const gapPx = (props.gap ?? 1) * 4;
	const orientation = props.orientation ?? 'horizontal';
	const { listRef, handleKeyDown, handleFocus } = useListFocus<HTMLDivElement>({
		itemSelector: 'button, input, a[href], [tabindex]',
		orientation,
		hasRovingTabIndex: true,
	});

	const toolbar = useRef<HTMLDivElement | null>(null);
	const attach = (el: HTMLDivElement | null) => {
		listRef.current = el;
		toolbar.current = el;
		if (el) applyEscapeProps(el, props);
	};

	const variant = props.variant ?? 'transparent';
	const dividerCls = (props.dividers ?? []).map((d) => 'vx-toolbar--div-' + d);
	const hasCenter = props.centerContent != null;

	<ToolbarSizeProvider value={size}>
		<div
			className={['vx-toolbar', 'vx-toolbar--' + variant, 'vx-toolbar--' + size, ...dividerCls, props.className]}
			style={props.style}
		>
			<div
				ref={attach}
				id={props.id}
				className={['vx-toolbar-inner', hasCenter ? 'vx-toolbar-inner--grid' : 'vx-toolbar-inner--flex', orientation === 'vertical' && 'vx-toolbar-inner--vertical']}
				role="toolbar"
				aria-label={props.label}
				aria-orientation={orientation}
				style={{ gap: gapPx, minHeight: SIZE_MIN[size] }}
				onKeyDown={handleKeyDown}
				onFocus={handleFocus}
			>
				@if (hasCenter) {
					<>
						<div className="vx-toolbar-slot vx-toolbar-slot--start" style={{ gap: gapPx }}>{props.startContent}</div>
						<div className="vx-toolbar-slot vx-toolbar-slot--center" style={{ gap: gapPx }}>{props.centerContent}</div>
						<div className="vx-toolbar-slot vx-toolbar-slot--end" style={{ gap: gapPx }}>{props.endContent}</div>
					</>
				} @else {
					<>
						@if (props.startContent != null) {
							<div className={['vx-toolbar-slot vx-toolbar-slot--start', props.endContent == null && 'vx-toolbar-slot--fill']} style={{ gap: gapPx }}>{props.startContent}</div>
						}
						@if (props.endContent != null) {
							<div className={['vx-toolbar-slot vx-toolbar-slot--end', props.startContent == null && 'vx-toolbar-slot--push']} style={{ gap: gapPx }}>{props.endContent}</div>
						}
					</>
				}
			</div>
		</div>
	</ToolbarSizeProvider>
}

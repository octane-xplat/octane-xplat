/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import type { CarouselProps } from './props'
import { toChildArray, mapChildren } from './child-array'
import { spacingStep } from './spacing'
import { cx } from '@octane-xplat/lib'

/** macOS coverage: the slide row inside the AppKit scroller. Buttons,
 *  loop, edge fades, and the imperative handle are unimplemented on this
 *  target (documented). */
export function Carousel(props: CarouselProps) @{
	const items = toChildArray(props.children);
	const count = items.length;
	const gap = spacingStep(props.gap ?? 2) ?? 8;

	<scrollview
		id={props.id}
		className={cx('vx-carousel', props.className)}
		style={props.style}
		horizontal={true}
		accessibilityLabel={props.accessibilityLabel ?? props.label}
	>
		<masonview className="vx-carousel-track" style={mergeStyle({flexDirection: "row"}, mergeStyle({display: "flex"}, { columnGap: gap }))}>
			{mapChildren(items, (child: any, i: number) => (
				<masonview className="vx-carousel-slide" accessibilityLabel={`Slide ${i + 1} of ${count}`} style={{display: "flex"}}>
					{child}
				</masonview>
			))}
		</masonview>
	</scrollview>
}

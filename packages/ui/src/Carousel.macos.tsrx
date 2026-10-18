/** @jsxImportSource @octane-xplat/macos-renderer */
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
		horizontal={true as any}
		accessibilityLabel={props.accessibilityLabel ?? props.label}
	>
		<masonview display="flex" flexDirection="row" className="vx-carousel-track" style={{ columnGap: gap }}>
			{mapChildren(items, (child: any, i: number) => (
				<masonview display="flex" className="vx-carousel-slide" accessibilityLabel={`Slide ${i + 1} of ${count}`}>
					{child}
				</masonview>
			))}
		</masonview>
	</scrollview>
}

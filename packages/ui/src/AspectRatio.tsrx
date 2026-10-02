/** @jsxImportSource @nativescript-community/octane */
import { useMemo } from 'octane'
import type { AspectRatioProps } from './props';
import { cx } from './cx';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { useMeasure } from './useMeasure';

/** AspectRatio — native has no aspect-ratio layout property, so the box
 *  measures its laid-out width and derives `height = width / ratio`
 *  (one extra layout pass; the measure hook coalesces identical bounds).
 *  `fit="cover"` stretches the child to fill; `center`/`contain` center it
 *  without stretching — media-level letterboxing belongs to the child
 *  (e.g. an Image's own scale mode). `shape="ellipse"` rounds the box to
 *  50% radius; child clipping depends on the platform view. */
export function AspectRatio(props: AspectRatioProps) @{
	const { ref, bounds } = useMeasure();
	const fit = props.fit ?? 'cover';
	const ellipse = props.shape === 'ellipse';
	const derivedHeight = bounds != null && bounds.width > 0 ? bounds.width / props.ratio : undefined;

	const hostRef = useMemo(() => [(view: any) => applyEscapeProps(view, props), ref, props.ref], [ref, props.ref, props.ios, props.android, props.web])

	<flexboxlayout
		id={props.id}
		ref={hostRef}
		className={cx(
			'vx-aspectratio',
			`vx-aspectratio-fit-${fit}`,
			ellipse && 'vx-aspectratio--ellipse',
			props.className,
		)}
		style={{
			width: '100%',
			...(derivedHeight !== undefined ? { height: derivedHeight } : {}),
			...(ellipse ? { borderRadius: '50%' as any } : {}),
			...props.style,
		}}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
		accessibilityLiveRegion={props.accessibilityLiveRegion as any}
	>
		<flexboxlayout
			className="vx-aspectratio-content"
			justifyContent={(fit !== 'cover' ? 'center' : undefined) as any}
			alignItems={(fit !== 'cover' ? 'center' : undefined) as any}
			style={{ flexGrow: 1 }}
		>
			{props.children}
		</flexboxlayout>
	</flexboxlayout>
}

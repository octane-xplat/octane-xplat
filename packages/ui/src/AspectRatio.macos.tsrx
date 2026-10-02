/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { AspectRatioProps } from './props'
import { cx } from './cx'
import { applyEscapeProps } from './escape-props'
import { useMeasure } from './useMeasure.macos.tsrx'

/** AspectRatio — derives `height = measured width / ratio` like the
 *  NativeScript leaf. `contain`/`center` center the child; media-level
 *  letterboxing belongs to the child's own sizing. */
export function AspectRatio(props: AspectRatioProps) @{
	const { ref, bounds } = useMeasure()
	const fit = props.fit ?? 'cover'
	const ellipse = props.shape === 'ellipse'
	const derivedHeight = bounds != null && bounds.width > 0 ? bounds.width / props.ratio : undefined

	const hostRef = useMemo(() => refList((view: any) => applyEscapeProps(view, props), ref, props.ref), [ref, props.ref, props.ios, props.android, props.web])

	<flexboxlayout
		id={props.id}
		ref={hostRef}
		className={cx('vx-aspectratio', `vx-aspectratio-fit-${fit}`, ellipse && 'vx-aspectratio--ellipse', props.className)}
		style={{
			width: '100%',
			...(derivedHeight !== undefined ? { height: derivedHeight } : {}),
			...(ellipse ? { borderRadius: '50%' as any } : {}),
			...props.style,
		}}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole}
		accessibilityHint={props.accessibilityHint}
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

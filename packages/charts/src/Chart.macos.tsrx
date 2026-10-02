/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo, useRef, useState } from 'octane';
import { appKitImageSource } from './svg-image.macos';
import { useMeasure } from '@octane-xplat/ui';
import type { ChartProps } from './props';
import { computeScene } from './core/scene';
import type { ChartScene } from './core/scene';
import { createScrub, hitLabel } from './core/hit';
import type { SceneHit } from './core/hit';

const EMPTY_SVG = '<svg xmlns="http://www.w3.org/2000/svg"/>';
const TIP_ESTIMATE_CHAR = 6.2;

/** AppKit leaf: one NSImage plus native label and cursor overlays.
 * Click recognizers currently supply no coordinates; taps use the scene center.
 * AppKit does not deliver onTouch, so touch scrubbing is unavailable. */
export function Chart(props: ChartProps) @{
	const measure = useMeasure();
	const [cursor, setCursor] = useState<SceneHit | null>(null);
	const sceneRef = useRef<ChartScene | null>(null);
	const propsRef = useRef(props);
	propsRef.current = props;

	const bounds = measure.bounds;
	const w = props.width ?? bounds?.width ?? 0;
	const h =
		props.height ??
		(props.aspectRatio && w > 0
			? w / props.aspectRatio
			: bounds?.height && bounds.height > 0
				? bounds.height
				: w > 0
					? w / 1.6
					: 0);

	const scene = useMemo(
		() => (w > 0 && h > 0 ? computeScene(propsRef.current, w, h) : null),
		[
			props.type,
			props.data,
			props.margin,
			props.stacked,
			props.innerRadiusRatio,
			props.xAxis,
			props.yAxis,
			w,
			h,
		],
	);

	sceneRef.current = scene;

	const interactive = !!(props.onPress || props.onScrub || props.tooltip || props.crosshair);
	const onTap = useMemo(() => {
		const scrub = createScrub(() => sceneRef.current, () => propsRef.current, setCursor);
		return (e?: any) => {
			const scene = sceneRef.current;
			scrub('tap', e?.getX?.() ?? (scene?.width ?? 0) / 2, e?.getY?.() ?? (scene?.height ?? 0) / 2);
		};
	}, []);

	const markup = scene?.markup ?? EMPTY_SVG;
	const imageSource = useMemo(() => appKitImageSource(markup), [markup]);

	const legend = props.legend === true ? 'bottom' : props.legend;
	const plot = scene?.plot;
	const dotColor = cursor && scene ? (scene.pie ? scene.pie.slices.find((s) => s.series === cursor.series && s.index === cursor.index)?.color : scene.series[cursor.series]?.color) : undefined;
	const tipText = cursor && scene ? hitLabel(scene, cursor) : null;
	const tipWidth = tipText ? tipText.length * TIP_ESTIMATE_CHAR + 14 : 0;
	const tipLeft = cursor && scene ? Math.min(Math.max(0, cursor.px - tipWidth / 2), Math.max(0, scene.width - tipWidth)) : 0;
	const tipTop = cursor ? cursor.py - 30 : 0;

	<flexboxlayout
		id={props.id}
		className={props.className}
		style={{ flexDirection: 'column', ...props.style }}
		accessible={props.accessibilityLabel != null}
		accessibilityRole={'image'}
		accessibilityLabel={props.accessibilityLabel}
	>
		@if (legend === 'top' && scene) {
			<flexboxlayout flexDirection="row" flexWrap="wrap" style={{ paddingBottom: 4 }}>
				{scene.legend.map((item) => (
					<flexboxlayout flexDirection="row" alignItems="center" style={{ marginRight: 12 }}>
						<flexboxlayout style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: item.color, marginRight: 4 }} />
						<label text={item.text} style={{ fontSize: 11 }} />
					</flexboxlayout>
				))}
			</flexboxlayout>
		}
		<gridlayout
			ref={measure.ref}
			style={{
				width: props.width,
				height: props.height ?? (props.aspectRatio && w > 0 ? w / props.aspectRatio : undefined),
				flexGrow: 1,
			}}
		>
			<image id={props.id ? props.id + '-image' : undefined} src={imageSource} style={{ width: w, height: h }} accessibilityLabel="" />
			<flexboxlayout id={props.id ? props.id + '-tap' : undefined} style={{ width: w, height: h }} onTap={interactive ? onTap : undefined}>	
				<absolutelayout
					id={props.id ? props.id + '-overlay' : undefined}
					style={{ width: w, height: h }}
				>
					{scene?.labels.map((l) => (
						<label
							text={l.text}
							{...{ left: l.x, top: l.y }} style={{ width: l.width, fontSize: 10, opacity: 0.7, textAlign: l.align === 'center' ? 'center' : l.align === 'end' ? 'right' : 'left' }}
						/>
					))}
					@if (cursor && props.crosshair && !scene?.pie && plot) {
						<flexboxlayout left={cursor.px - 0.5} top={plot.y} style={{ width: 1, height: plot.height, backgroundColor: '#8a8a8a' }} />
					}
					@if (cursor && (props.crosshair || props.tooltip)) {
						<flexboxlayout left={cursor.px - 4} top={cursor.py - 4} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor ?? '#4e79a7' }} />
					}
					@if (cursor && props.tooltip && tipText) {
						<label id={props.id ? props.id + '-tooltip' : undefined} text={tipText} {...{ left: tipLeft, top: tipTop < 0 ? cursor.py + 12 : tipTop }} style={{ width: tipWidth, height: 24, backgroundColor: 'rgba(20,20,20,0.88)', borderRadius: 4, color: '#ffffff', fontSize: 11, textAlign: 'center' }} />
					}
				</absolutelayout>
			</flexboxlayout>
		</gridlayout>
		@if (legend === 'bottom' && scene) {
			<flexboxlayout flexDirection="row" flexWrap="wrap" style={{ paddingTop: 4 }}>
				{scene.legend.map((item) => (
					<flexboxlayout flexDirection="row" alignItems="center" style={{ marginRight: 12 }}>
						<flexboxlayout style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: item.color, marginRight: 4 }} />
						<label text={item.text} style={{ fontSize: 11 }} />
					</flexboxlayout>
				))}
			</flexboxlayout>
		}
	</flexboxlayout>
}

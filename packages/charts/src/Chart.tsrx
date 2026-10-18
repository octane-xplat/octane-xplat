/** @jsxImportSource @nativescript-community/octane */
import { useMemo, useRef, useState } from 'octane';
import { AccessibilityRole, Color } from '@nativescript/core';
import { useMeasure } from '@octane-xplat/ui';
import type { ChartProps } from './props';
import { computeScene } from './core/scene';
import type { ChartScene } from './core/scene';
import { createScrub, hitLabel } from './core/hit';
import type { SceneHit } from './core/hit';

const EMPTY_SVG = '<svg xmlns="http://www.w3.org/2000/svg"/>';
const TIP_ESTIMATE_CHAR = 6.2;

// Color throws on unparseable input — user-controlled palette strings
// degrade to the fallback like a browser dropping a bad CSS value.
const safeColor = (value: string | undefined, fallback: string): Color => {
	try {
		return new Color(value ?? fallback);
	} catch {
		return new Color(fallback);
	}
};

/** Chart — NativeScript leaf. The core's Mark[] serialize to one svg markup
 *  string fed to `<svgview>` (vendored ui-svg → SVGKit/androidsvg — its
 *  registration arrives transitively through `@octane-xplat/ui`'s native
 *  entry). Axis labels, legend, tooltip, and crosshair are real views in an
 *  `absolutelayout` overlay — never `<text>` in the markup. Touch input on
 *  the overlay reports view-relative dips (`e.getX()/getY()`), matching the
 *  markup's coordinate space. */
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
	// Stable handler identity — the driver's prop apply subscribes `onTouch`
	// per identity change, so the closure reads scene/props through refs.
	const onTouch = useMemo(() => {
		const scrub = createScrub(
			() => sceneRef.current,
			() => propsRef.current,
			setCursor,
		);

		return (e: any) => {
			scrub(e.action, e.getX(), e.getY());
		};
	}, []);

	// `tap` is the completed-press phase — NS's tap recognizer (and the probe
	// harness's tap dispatch) reach onPress without a touch-sequence guess.
	const onTap = useMemo(() => {
		const scrub = createScrub(
			() => sceneRef.current,
			() => propsRef.current,
			setCursor,
		);

		return (e: any) => {
			// Probe harness taps dispatch with a synthetic event lacking
			// getX/getY — fall back to the view center there.
			const size = e.object?.getActualSize?.();
			scrub('tap', e.getX?.() ?? (size ? size.width / 2 : 0), e.getY?.() ?? (size ? size.height / 2 : 0));
		};
	}, []);

	const legend = props.legend === true ? 'bottom' : props.legend;
	const plot = scene?.plot;
	const dotColor = cursor && scene ? (scene.pie ? scene.pie.slices.find((s) => s.series === cursor.series && s.index === cursor.index)?.color : scene.series[cursor.series]?.color) : undefined;
	const tipText = cursor && scene ? hitLabel(scene, cursor) : null;
	const tipWidth = tipText ? tipText.length * TIP_ESTIMATE_CHAR + 14 : 0;
	const tipLeft = cursor && scene ? Math.min(Math.max(0, cursor.px - tipWidth / 2), Math.max(0, scene.width - tipWidth)) : 0;
	const tipTop = cursor ? cursor.py - 30 : 0;

	<masonview display="flex" id={props.id} className={props.className} style={{ flexDirection: 'column', ...props.style }} accessible={props.accessibilityLabel != null} accessibilityRole={AccessibilityRole.Image} accessibilityLabel={props.accessibilityLabel}>
		@if (legend === 'top' && scene) {
			<masonview display="flex" flexDirection="row" flexWrap="wrap" style={{ paddingBottom: 4 }}>
				{scene.legend.map((item) => (
					<masonview display="flex" flexDirection="row" alignItems="center" style={{ marginRight: 12 }}>
						<contentview style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: safeColor(item.color, 'transparent'), marginRight: 4 }} />
						<label text={item.text} style={{ fontSize: 11 }} />
					</masonview>
				))}
			</masonview>
		}
		<masonview display="grid" ref={measure.ref} style={{
				width: props.width,
				height: props.height ?? (props.aspectRatio && w > 0 ? w / props.aspectRatio : undefined),
				flexGrow: 1,
			}}>
			<svgview src={scene?.markup ?? EMPTY_SVG} stretch="aspectFit" style={{ width: w, height: h }} />
			<masonview id={props.id ? props.id + '-overlay' : undefined} style={{ width: w, height: h }} isUserInteractionEnabled={interactive} onTouch={interactive ? onTouch : undefined} onTap={interactive ? onTap : undefined}>
				{scene?.labels.map((l) => (
					<label width={l.width} text={l.text} textAlignment={l.align === 'center' ? 'center' : l.align === 'end' ? 'right' : 'left'} style={{ fontSize: 10, opacity: 0.7 , position: 'absolute', left: l.x, top: l.y}} />
				))}
				@if (cursor && props.crosshair && !scene?.pie && plot) {
					<contentview width={1} height={plot.height} backgroundColor={new Color('#8a8a8a')} style={{position: 'absolute', left: cursor.px - 0.5, top: plot.y}} />
				}
				@if (cursor && (props.crosshair || props.tooltip)) {
					<contentview width={8} height={8} borderRadius={4} backgroundColor={safeColor(dotColor, '#4e79a7')} style={{position: 'absolute', left: cursor.px - 4, top: cursor.py - 4}} />
				}
				@if (cursor && props.tooltip && tipText) {
					<masonview style={{position: 'absolute', left: tipLeft, top: tipTop < 0 ? cursor.py + 12 : tipTop}} display="flex" backgroundColor={new Color('rgba(20,20,20,0.88)')} borderRadius={4} paddingTop={2} paddingBottom={2} paddingLeft={6} paddingRight={6}>
						<label text={tipText} color={new Color('#ffffff')} style={{ fontSize: 11 }} />
					</masonview>
				}
			</masonview>
		</masonview>
		@if (legend === 'bottom' && scene) {
			<masonview display="flex" flexDirection="row" flexWrap="wrap" style={{ paddingTop: 4 }}>
				{scene.legend.map((item) => (
					<masonview display="flex" flexDirection="row" alignItems="center" style={{ marginRight: 12 }}>
						<contentview style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: safeColor(item.color, 'transparent'), marginRight: 4 }} />
						<label text={item.text} style={{ fontSize: 11 }} />
					</masonview>
				))}
			</masonview>
		}
	</masonview>
}

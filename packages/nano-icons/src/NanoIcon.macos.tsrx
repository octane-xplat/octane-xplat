/** @jsxImportSource @octane-xplat/macos-renderer */
import { useStore } from '@octane-xplat/ui/data';
import {
	createCharCache,
	createLayerColorResolver,
	DEFAULT_ICON_SIZE,
	resolveGlyphEntry,
	type NanoGlyphMap,
} from './glyphmap';

import { nanoIconSetRegistry, resolveNanoIcon, type NanoIconSet } from './set';
import type { NanoIconProps, NanoIconSetProps } from './props';

/** `currentColor` has no meaning in AppKit styles — fall back to the theme text color. */
function layerColor(color: string | undefined): string | undefined {
	return color === 'currentColor' ? undefined : color;
}

/**
 * Escape hatch for what the absolutelayout prop mapper doesn't cover: label
 * the container view for accessibility (the renderer only applies
 * accessibilityLabel on stack/label/textfield types) and rotate/flip through
 * CALayer transform key paths — best-effort, no layout effect.
 */
function applyHostProps(el: any, props: NanoIconProps) {
	if (!el) return;
	el.accessibilityElement = !!props.label;
	if (props.label != null) {
		el.accessibilityLabel = props.label;
	}

	const layer = el.layer;
	if (!layer || typeof layer.setValueForKeyPath !== 'function') return;
	const turns = props.rotate ?? 0;
	if (turns) {
		layer.setValueForKeyPath(((turns * 90) % 360) * (Math.PI / 180), 'transform.rotation.z');
	}

	const sx = props.hFlip ? -1 : 1;
	const sy = props.vFlip ? -1 : 1;
	if (sx !== 1) layer.setValueForKeyPath(sx, 'transform.scale.x');
	if (sy !== 1) layer.setValueForKeyPath(sy, 'transform.scale.y');
}

const charCaches = new WeakMap<NanoGlyphMap, (codepoint: number) => string>();

function charCacheFor(glyphMap: NanoGlyphMap) {
	let cache = charCaches.get(glyphMap);
	if (!cache) {
		cache = createCharCache();
		charCaches.set(glyphMap, cache);
	}

	return cache;
}

function MacGlyphLayers(props: NanoIconProps & { glyphMap: NanoGlyphMap }) {
	const size = props.size ?? DEFAULT_ICON_SIZE;
	const [adv, layers] = resolveGlyphEntry(props.glyphMap, props.name);
	const getChar = charCacheFor(props.glyphMap);
	const resolveColor = createLayerColorResolver(props.color, props.tintMode, layers);
	const width = (adv / props.glyphMap.m.u) * size;
	const family = props.glyphMap.m.f;

	return (
		<masonview id={props.id} className={props.className} style={{ width, height: size }} ref={(el: any) => applyHostProps(el, props)}>
			{layers.map(([codepoint, srcColor], i) => (
				<label key={i} id={props.id ? props.id + ':layer-' + i : undefined} {...({ accessible: false } as Record<string, unknown>)} text={getChar(codepoint)} style={{
						fontFamily: family,
						fontSize: size,
						color: layerColor(resolveColor(i, srcColor)),
						position: 'absolute',
						left: 0,
						top: 0,
					}} />
			))}
		</masonview>
	);
}

const warnedNames = new Set<string>();

/**
 * Render a glyph from a generated icon font set on AppKit. Layers stack as
 * labels in a single absolutelayout cell; the family is registered through
 * `registerNanoIconFont` (see `@octane-xplat/nano-icons` font sources).
 * Missing names render nothing.
 */
export function NanoIcon(props: NanoIconProps) @{
	useStore(nanoIconSetRegistry);
	const resolved = resolveNanoIcon(props.name, props.set);
	if (!resolved) {
		if (!warnedNames.has(props.name)) {
			warnedNames.add(props.name);
			console.warn('[nano-icons] Unknown icon ' + props.name + ' — no registered set contains it');
		}

		return null;
	}

	<MacGlyphLayers {...props} glyphMap={resolved.set.glyphMap} />
}

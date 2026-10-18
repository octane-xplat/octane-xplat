/** @jsxImportSource @nativescript-community/octane */
import { AccessibilityRole, isAndroid, isIOS } from '@nativescript/core';
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

/** `currentColor` has no NativeScript meaning — fall back to the platform text color. */
function layerColor(color: string | undefined): string | undefined {
	return color === 'currentColor' ? undefined : color;
}

function applyPlatformBag(el: any, props: NanoIconProps) {
	if (!el) return;
	const bag = isIOS ? props.ios : isAndroid ? props.android : undefined;
	if (bag) Object.assign(el, bag);
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

const warnedNames = new Set<string>();

function NanoGlyphLayers(props: NanoIconProps & { glyphMap: NanoGlyphMap }) @{
	const size = props.size ?? DEFAULT_ICON_SIZE;
	const [adv, layers] = resolveGlyphEntry(props.glyphMap, props.name);
	const getChar = charCacheFor(props.glyphMap);
	const resolveColor = createLayerColorResolver(props.color, props.tintMode, layers);
	const width = (adv / props.glyphMap.m.u) * size;
	const family = props.glyphMap.m.f;

	<masonview id={props.id} className={props.className} accessible={!!props.label} accessibilityRole={props.label ? AccessibilityRole.Image : undefined} accessibilityLabel={props.label} rotate={((props.rotate ?? 0) * 90) % 360} scaleX={props.hFlip ? -1 : 1} scaleY={props.vFlip ? -1 : 1} style={{ width, height: size }} ref={(el: any) => applyPlatformBag(el, props)}>
		{layers.map(([codepoint, srcColor], i) => (
			<label key={i} id={props.id ? props.id + ':layer-' + i : undefined} accessible={false} text={getChar(codepoint)} style={[{
					fontFamily: family,
					fontSize: size,
					color: layerColor(resolveColor(i, srcColor)) as any,
				}, {position: 'absolute', left: 0, top: 0}]} />
		))}
	</masonview>
}

/**
 * Render a glyph from a generated icon font set. Layers stack as labels in a
 * single absolutelayout cell in the set's font family — on iOS the family is
 * the font's internal name (auto-registered from `app/fonts`), on Android the
 * `<family>.ttf` file name. Missing names render nothing.
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

	<NanoGlyphLayers {...props} glyphMap={resolved.set.glyphMap} />
}

import {
	createCharCache,
	createLayerColorResolver,
	DEFAULT_ICON_SIZE,
	resolveGlyphEntry,
	type NanoGlyphMap,
} from './glyphmap'
import { useStore } from '@octane-xplat/ui/data'
import { nanoIconSetRegistry, resolveNanoIcon, type NanoIconSet } from './set'
import type { NanoIconProps, NanoIconSetProps } from './props'

function transformStyle(props: { rotate?: number; hFlip?: boolean; vFlip?: boolean }): string | undefined {
	const parts: string[] = []
	if (props.rotate) parts.push(`rotate(${(props.rotate * 90) % 360}deg)`)
	if (props.hFlip) parts.push('scaleX(-1)')
	if (props.vFlip) parts.push('scaleY(-1)')
	return parts.length ? parts.join(' ') : undefined
}

function WebGlyphLayers(props: NanoIconProps & { glyphMap: NanoGlyphMap }) {
	const size = props.size ?? DEFAULT_ICON_SIZE
	const [adv, layers] = resolveGlyphEntry(props.glyphMap, props.name)
	const getChar = charCacheFor(props.glyphMap)
	const resolveColor = createLayerColorResolver(props.color, props.tintMode, layers)
	const width = (adv / props.glyphMap.m.u) * size
	const family = props.glyphMap.m.f
	const transform = transformStyle(props)

	return (
		<span
			id={props.id}
			className={['vx-nano-icon', props.className]}
			role={props.label ? 'img' : undefined}
			aria-label={props.label}
			aria-hidden={props.label ? undefined : 'true'}
			style={{
				display: 'inline-block',
				position: 'relative',
				width,
				height: size,
				lineHeight: '0px',
				verticalAlign: 'middle',
				flexShrink: 0,
				transform,
				...(props.style as object | undefined),
			}}
		>
			{layers.map(([codepoint, srcColor], i) => (
				<span
					key={i}
					aria-hidden="true"
					style={{
						position: 'absolute',
						left: 0,
						bottom: 0,
						fontFamily: family,
						fontWeight: 'normal',
						fontStyle: 'normal',
						fontSize: size,
						lineHeight: size,
						whiteSpace: 'pre',
						color: resolveColor(i, srcColor),
					}}
				>
					{getChar(codepoint)}
				</span>
			))}
		</span>
	)
}

const charCaches = new WeakMap<NanoGlyphMap, (codepoint: number) => string>()

function charCacheFor(glyphMap: NanoGlyphMap) {
	let cache = charCaches.get(glyphMap)
	if (!cache) {
		cache = createCharCache()
		charCaches.set(glyphMap, cache)
	}

	return cache
}

/**
 * Render a glyph from a generated icon font set. Layers stack as absolutely
 * positioned spans in the set's font family; `tintMode` controls whether an
 * explicit `color` tints every layer or only `currentColor` slots.
 * Missing names render a '?' fallback glyph.
 */
const warnedNames = new Set<string>()

export function NanoIcon(props: NanoIconProps) {
	useStore(nanoIconSetRegistry)
	const resolved = resolveNanoIcon(props.name, props.set)
	if (!resolved) {
		if (!warnedNames.has(props.name)) {
			warnedNames.add(props.name)
			console.warn(`[nano-icons] Unknown icon "${props.name}" — no registered set contains it`)
		}

		return null
	}

	return <WebGlyphLayers {...props} glyphMap={resolved.set.glyphMap} />
}

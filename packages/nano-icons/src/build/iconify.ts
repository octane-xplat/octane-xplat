// Iconify input bridge for the font pipeline. Iconify icons arrive as data
// (body + geometry), not SVG documents — this materializes each icon as a
// standalone SVG string so it flows through the same validate → flatten →
// glyph stages as file-based input. Resolution of aliases/defaults goes
// through @iconify/utils, matching @octane-xplat/icons' runtime behavior.
import type { IconifyJSON, IconifyIcon } from '@iconify/types'
import { getIcons } from '@iconify/utils'
import { iconToSVG } from '@iconify/utils/lib/svg/build'
import { SVG_NS } from './core/flatten/dom'

export type IconifySvgInput = {
	/** Glyphmap icon name: `<prefix>:<name>` — matches `Icon`/`NanoIcon` naming. */
	name: string
	/** File label used in logs. */
	file: string
	svg: string
}

/**
 * Materialize an Iconify collection (e.g. `@iconify-json/heroicons`) as
 * standalone SVG documents for `buildNanoIconFont`. Iconify geometry comes
 * from the icon's own `width`/`height`/`left`/`top` — the artwork is not
 * rescaled; glyph placement maps the viewBox into the font's em square.
 * `currentColor` fills are preserved as tintable `currentColor` layers.
 */
export function iconifyCollectionToSvgs(collection: IconifyJSON): IconifySvgInput[] {
	const names = [...Object.keys(collection.icons), ...Object.keys(collection.aliases ?? {})]

	const resolved = getIcons(collection, names)
	if (!resolved) {
		throw new Error(`Iconify collection "${collection.prefix}" has no resolvable icons`)
	}

	const inputs: IconifySvgInput[] = []
	for (const [name, icon] of Object.entries(resolved.icons)) {
		const doc = iconifyIconToSvg(name, icon)
		inputs.push({
			name: `${resolved.prefix}:${name}`,
			file: `${resolved.prefix}:${name}.svg`,
			svg: doc,
		})
	}

	return inputs
}

/** Standalone SVG document for one resolved Iconify icon. */
export function iconifyIconToSvg(name: string, icon: IconifyIcon): string {
	const result = iconToSVG(icon, { height: 'unset' })
	const { viewBox } = result.attributes
	return `<svg xmlns="${SVG_NS}" viewBox="${viewBox}">${result.body}</svg>`
}

/**
 * Split an SVG source whose drawing is a flat list of `<polygon>` siblings
 * into `count` layer markups. Every polygon shares the same ancestor `<g>`
 * chain, so each layer reuses the source's prefix/suffix wrappers verbatim
 * and overlays the other layers exactly. Index-interleaved assignment
 * spreads each layer's polygons across the whole artwork, keeping the
 * scattered-twinkle character when layers animate independently.
 */
export function constellationLayers(svgSource: string, count: number): string[] {
	const inner = svgSource.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '')
	const polygons = inner.match(/<polygon\b[\s\S]*?<\/polygon>/g) ?? []
	const first = inner.indexOf('<polygon')
	const last = inner.lastIndexOf('</polygon>')
	if (count < 1 || first < 0 || last < 0) {
		return []
	}

	const prefix = inner.slice(0, first)
	const suffix = inner.slice(last + '</polygon>'.length)
	const buckets = Array.from({ length: count }, () => [] as string[])
	for (const [index, polygon] of polygons.entries()) {
		buckets[index % count].push(polygon)
	}

	return buckets.map((bucket) => prefix + bucket.join('') + suffix)
}

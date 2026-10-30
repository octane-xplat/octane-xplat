import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { constellationLayers } from './src/constellation-layers.ts'

const svg = readFileSync(new URL('./src/assets/constellation.svg', import.meta.url), 'utf8')
const polygons = svg.match(/<polygon\b[\s\S]*?<\/polygon>/g)

test('constellation layers partition every polygon across interleaved markups', () => {
	const layers = constellationLayers(svg, 16)
	assert.equal(layers.length, 16)

	const total = layers.reduce(
		(sum, layer) => sum + (layer.match(/<polygon\b/g)?.length ?? 0),
		0,
	)
	assert.equal(total, polygons.length, 'every polygon lands in exactly one layer')

	// Index interleave: a layer never holds two consecutive source polygons,
	// so each layer reads as a scattered subset of the whole artwork.
	assert.ok(layers[0].includes(polygons[0]))
	assert.ok(!layers[0].includes(polygons[1]))
	assert.ok(layers[1].includes(polygons[1]))

	// Every layer preserves the shared <g> transform/fill wrapper chain so
	// stacked layers overlay the original artwork exactly.
	for (const layer of layers) {
		assert.ok(layer.includes('fill="#f5f5f5"'))
		const opens = layer.match(/<g\b/g)?.length ?? 0
		const closes = layer.match(/<\/g>/g)?.length ?? 0
		assert.equal(opens, closes)
	}
})

test('constellationLayers handles empty or degenerate input', () => {
	assert.deepEqual(constellationLayers('<svg></svg>', 16), [])
	assert.deepEqual(constellationLayers(svg, 0), [])
	assert.equal(
		constellationLayers('<svg><g><polygon points="1 2 3"></polygon></g></svg>', 4).length,
		4,
	)
})

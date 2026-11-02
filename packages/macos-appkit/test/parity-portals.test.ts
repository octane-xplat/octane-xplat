import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
const start = source.indexOf('function measureParity(')
const measure = source.slice(start, source.indexOf('\n}\n', start) + 3)

test('parity associates mounted portal markers with their fixture and deduplicates inline markers', () => {
	const node = (id, classes = [], children = []) => ({
		props: { id },
		classes,
		children,
		view: { layoutSubtreeIfNeeded() {} },
	})
	const inline = node('inline', ['parity-portal--first'])
	const box = node('box', ['parity-box'], [inline])
	const secondBox = node('second-box', ['parity-box'])
	const stage = node(
		'parity-stage',
		[],
		[node('cell-first', ['parity-cell'], [box]), node('cell-second', ['parity-cell'], [secondBox])],
	)
	const portalChild = node('portal-child')
	const portal = node('portal', ['parity-portal--first'], [portalChild])
	const foreignPortal = node('foreign-portal', ['parity-portal--second'])
	const container = {
		hostView: {},
		nodes: new Map([
			[1, stage],
			[2, inline],
			[3, portal],
			[4, portalChild],
		]),
	}
	const other = { nodes: new Map([[1, foreignPortal]]) }
	const descendants = (node) => node.children.flatMap((child) => [child, ...descendants(child)])
	const { measureParity } = runSlice(measure + '\n({ measureParity })', {
		appKitContainers: new Set([container, other]),
		nodeClasses: (node) => node.classes,
		descendants,
		parityNode: (node) => node.props.id,
	})
	const cells = JSON.parse(JSON.stringify(measureParity(container, []).cells))
	assert.deepEqual(cells.first, ['box', 'inline', 'portal', 'portal-child'])
	assert.deepEqual(cells.second, ['second-box', 'foreign-portal'])
	other.nodes.clear()
	assert.deepEqual(JSON.parse(JSON.stringify(measureParity(container, []).cells.second)), [
		'second-box',
	])
})

test('parity converts a separate window through screen coordinates', () => {
	const start = source.indexOf('function parityBoxInHost(')
	const helper = source.slice(start, source.indexOf('\nfunction parityLocalBoxInHost', start))
	const { parityBoxInHost } = runSlice(helper + '\n;({ parityBoxInHost })', {
		round: (value) => value,
	})
	const rect = { origin: { x: 3, y: 4 }, size: { width: 200, height: 96 } }
	const view = {
		window: {
			convertRectToScreen: (r) => ({ ...r, origin: { x: r.origin.x + 100, y: r.origin.y + 200 } }),
		},
		superview: { convertRectToView: (r) => r },
	}
	const box = {
		window: { convertRectToScreen: (r) => r },
		bounds: { origin: { x: 0, y: 0 }, size: { width: 220, height: 112 } },
		convertRectToView: (r) => r,
	}
	assert.deepEqual({ ...parityBoxInHost(view, rect, box) }, { x: 103, y: -188, w: 200, h: 96 })
})

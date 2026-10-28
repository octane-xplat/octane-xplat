import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
test('gradient colors, stops, resize and removal track the host bounds', () => {
	let resize: any, removed = 0, observerRemoved = 0
	const layer: any = { removeFromSuperlayer() { removed++ } }
	const { syncBackgroundImage } = runSlice(
		source.slice(source.indexOf('function syncBackgroundImage'), source.indexOf('const BORDER_SIDES')) + '\n({ syncBackgroundImage })',
		{
			CAGradientLayer: { layer: () => layer },
			nativeColor: (color) => ({ CGColor: color }),
			NSViewFrameDidChangeNotification: 'frame',
			NSNotificationCenter: { defaultCenter: {
				addObserverForNameObjectQueueUsingBlock(_name, _view, _queue, callback) { resize = callback; return {} },
				removeObserver() { observerRemoved++ },
			} },
		},
	)
	const node: any = { view: { isFlipped: true, bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 40 } }, layer: { insertSublayerAtIndex() {} } } }
	syncBackgroundImage(node, 'linear-gradient(to right, rgba(0,0,0,0.1) 0%, red, transparent 100%)')
	assert.deepEqual(Array.from(layer.colors), ['rgba(0,0,0,0.1)', 'red', 'transparent'])
	assert.deepEqual(Array.from(layer.locations), [0, 0.5, 1])
	assert.equal(layer.startPoint.x, 0)
	assert.equal(layer.endPoint.x, 1)
	node.view.bounds = { origin: { x: 0, y: 0 }, size: { width: 200, height: 60 } }
	resize()
	assert.equal(layer.frame.size.width, 200)
	syncBackgroundImage(node, null)
	assert.equal(removed, 1)
	assert.equal(observerRemoved, 1)
	assert.equal(node.gradientLayer, null)
})

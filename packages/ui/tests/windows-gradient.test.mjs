import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

test('Windows gradients need no ColorHelper projection and replace the previous brush', () => {
	class Brush {
		stops = []
		GradientStops = { Append: (stop) => this.stops.push(stop) }
	}
	class Color {
		a = 127.5
		r = 1.4
		g = 2.6
		b = 255
	}
	const source = readFileSync(
		new URL('../src/linear-gradient-apply.windows.ts', import.meta.url),
		'utf8',
	)
	const compiled = ts.transpile(source, {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	})
	const exports = {}
	vm.runInNewContext(compiled, {
		exports,
		require(id) {
			if (id === '@nativescript/core') {
				return { Color }
			}
			assert.equal(id, '@octane-xplat/platform/windows')
			// No Windows.UI.ColorHelper is exposed by this projection.
			return {
				Microsoft: {
					UI: { Xaml: { Media: { LinearGradientBrush: Brush, GradientStop: class {} } } },
				},
			}
		},
	})
	const { applyLinearGradient } = exports
	const view = { nativeViewProtected: {} }
	applyLinearGradient(view, ['rgba(1, 3, 255, .5)', '#ffffff'], 'horizontal')
	const first = view.nativeViewProtected.Background
	assert.deepEqual(JSON.parse(JSON.stringify(first.stops[0].Color)), { A: 128, R: 1, G: 3, B: 255 })
	assert.equal(first.StartPoint.X, 0)
	assert.equal(first.EndPoint.X, 1)
	assert.deepEqual(
		first.stops.map((stop) => stop.Offset),
		[0, 1],
	)
	applyLinearGradient(view, ['#ffffff'], 'vertical')
	const next = view.nativeViewProtected.Background
	assert.notEqual(first, next)
	assert.equal(next.stops.length, 1)
	assert.equal(next.stops[0].Offset, 0)
	assert.equal(next.StartPoint.Y, 0)
	assert.equal(next.EndPoint.Y, 1)
	assert.doesNotThrow(() => applyLinearGradient(null, [], 'horizontal'))
})

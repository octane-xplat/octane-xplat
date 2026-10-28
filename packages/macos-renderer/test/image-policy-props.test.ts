import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
const source = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8')
test('native image creation receives the final policy before its first source load', () => {
	const start = source.indexOf('function makeImageView('), end = source.indexOf('/** Types whose views arrange child views', start), calls: any[] = []
	const view = {}, create = runInNewContext(stripTypeScriptTypes(source.slice(start, end)) + '\n;makeImageView', {
		InputImageView: { alloc: () => ({ initWithFrame: () => view }) }, updateImage: (...args: any[]) => calls.push(args),
	})
	create({ src: 'same', imageCachePolicy: 'none' }); assert.equal(calls.length, 1); assert.equal(calls[0][0], view); assert.equal(calls[0][3], 'none')
})
test('image mutation dispatch reads the final prop bag for simultaneous changes and policy removal', () => {
	const start = source.indexOf("\t\t\tcase 'image':", source.indexOf('function applyProps(')), end = source.indexOf("\n\t\t\tcase 'placeholder':", start), calls: any[] = []
	// Exercise the real image branch under applyProps' observed complete-bag
	// protocol. This is source dispatch evidence, not native batch execution.
	const apply = runInNewContext(stripTypeScriptTypes(`(function(node, props) { node.props = { ...node.props, ...props }; for (const [name, value] of Object.entries(props)) { switch(node.type) { ${source.slice(start, end)} } } })`), { updateImage: (...args: any[]) => calls.push(args) })
	const node = { type: 'image', view: {}, props: { src: 'old', imageCachePolicy: 'memory-disk' } }
	apply(node, { src: 'new', imageCachePolicy: 'none' }); assert.equal(calls.length, 2); assert.ok(calls.every((args) => args[1] === 'new' && args[3] === 'none'))
	calls.length = 0; apply(node, { imageCachePolicy: undefined }); assert.equal(calls.length, 1); assert.equal(calls[0][3], undefined)
})

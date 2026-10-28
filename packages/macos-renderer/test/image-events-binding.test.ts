import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
test('native image bindings use current callbacks in the root scope and reject retired node/view owners', () => {
	const source = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'), start = source.indexOf('function setImageActions('), end = source.indexOf('function setKeyActions(', start)
	const view = {}, other = {}, calls: string[] = [], scopes: string[] = [], node: any = { view, props: { onImageLoad: () => calls.push('old'), onImageError: () => calls.push('error') }, container: { root: { eventScope: (scope: string, callback: () => void) => { scopes.push(scope); callback() } } } }
	const owners = new Map([[view, node]]); let handlers: any
	const bind = runInNewContext(stripTypeScriptTypes(source.slice(start, end)) + '\n;setImageActions', { cssNodesByView: owners, setImageEventHandlers: (_: unknown, next: any) => { handlers = next } })
	bind(node); handlers.onLoad({}, () => true); node.props.onImageLoad = () => calls.push('current'); handlers.onLoad({}, () => true); handlers.onError({ error: Error('load') }, () => true)
	assert.deepEqual(calls, ['old', 'current', 'error']); assert.deepEqual(scopes, ['discrete', 'discrete', 'discrete'])
	owners.set(view, {}); handlers.onLoad({}, () => true); owners.set(view, node); node.view = other; handlers.onError({}, () => true); node.view = view; node.container.root = null; handlers.onLoad({}, () => true)
	assert.deepEqual(calls, ['old', 'current', 'error'])
	let current = true
	node.container.root = { eventScope: (_scope: string, callback: () => void) => { current = false; callback() } }
	handlers.onLoad({}, () => current); assert.deepEqual(calls, ['old', 'current', 'error'])
	current = true; node.container.root = { eventScope: (_scope: string, callback: () => void) => { node.props.onImageLoad = () => calls.push('scope-current'); callback() } }
	handlers.onLoad({}, () => current); assert.equal(calls.at(-1), 'scope-current')
})

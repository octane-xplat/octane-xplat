import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const compile = async (file) =>
	ts.transpile(await readFile(new URL(`../src/${file}.ts`, import.meta.url), 'utf8'), {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	})

const web = await compile('deep-links.web')
const linux = await compile('deep-links.linux')

const locationOf = (pathname, search = '') => ({ pathname, search })

// The web leaf's consume contract without a desktop host — the browser path.
function loadWeb({ bootstrap = null, location = locationOf('/') } = {}) {
	const context = {
		exports: {},
		require: (id) =>
			id === './host-runtime.web'
				? {
						desktopHostBootstrap: () => bootstrap,
						desktopHostClient: () => null,
					}
				: {},
		location,
		window: { addEventListener: () => {} },
	}

	vm.runInNewContext(web, context)
	return context.exports
}

// The linux leaf's bridge stub — bridged hosts push the launch URL through
// __xplatHostSnapshot/__xplatInitialUrl; un-bridged falls back to location.
function loadLinux({ bridged = false, initialUrl = null, location = locationOf('/') } = {}) {
	const context = {
		exports: {},
		require: (id) =>
			id === './bridge'
				? {
						bootstrap: () => context.window.__xplatHostSnapshot,
						bridged: () => bridged,
						onHostEvent: () => () => {},
					}
				: {},
		location,
		window: { __xplatHostSnapshot: initialUrl ? { initialUrl } : null, __xplatInitialUrl: null },
	}

	vm.runInNewContext(linux, context)
	return context.exports
}

test('web consumeInitialUrl reports the host launch URL exactly once', () => {
	const links = loadWeb({ bootstrap: { initialUrl: 'xplat://detail' }, location: locationOf('/app') })
	assert.equal(links.consumeInitialUrl(), 'xplat://detail')
	assert.equal(links.consumeInitialUrl(), null)
})

test('web consumeInitialUrl reports a non-root browser path exactly once', () => {
	const links = loadWeb({ location: locationOf('/index.html') })
	assert.equal(links.consumeInitialUrl(), '/index.html')
	assert.equal(links.consumeInitialUrl(), null)
})

test('web consumeInitialUrl at the root always resolves null', () => {
	const links = loadWeb()
	assert.equal(links.consumeInitialUrl(), null)
	assert.equal(links.consumeInitialUrl(), null)
})

test('linux consumeInitialUrl reports the bridged launch URL exactly once', () => {
	const links = loadLinux({ bridged: true, initialUrl: 'xplat://detail' })
	assert.equal(links.consumeInitialUrl(), 'xplat://detail')
	assert.equal(links.consumeInitialUrl(), null)
})

test('linux consumeInitialUrl reports a non-root browser path exactly once', () => {
	const links = loadLinux({ location: locationOf('/index.html') })
	assert.equal(links.consumeInitialUrl(), '/index.html')
	assert.equal(links.consumeInitialUrl(), null)
})

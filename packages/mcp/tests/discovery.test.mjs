import assert from 'node:assert/strict'
import { test } from 'node:test'
import { join } from 'node:path'
import {
	checkPrerequisites,
	detectPlatforms,
	discoverWorkspace,
	resolveFrameworkBinding,
} from '../src/discovery.mjs'

import { bindApp, buildProjectStatus, createWorkspaceContext } from '../src/status.mjs'
import { makeConsumerApp, makeWorkspace, writeFile, writeJson } from './helpers.mjs'

test('single consumer app binds as sole-app with detected identity', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'my-app', installed: { '@octane-xplat/ui': '0.14.0' } })

	const discovery = discoverWorkspace(root)
	assert.equal(discovery.workspace.kind, 'consumer')
	assert.equal(discovery.apps.length, 1)
	assert.deepEqual(discovery.apps[0].platforms, ['web'])

	const context = createWorkspaceContext({ workspaceRoot: root, evidenceRoot: join(root, '.ev') })
	const report = await buildProjectStatus(context)
	assert.equal(report.identity.selection.state, 'bound')
	assert.equal(report.identity.selection.reason, 'sole-app')
	assert.equal(report.identity.framework.status, 'installed')
	assert.equal(
		report.identity.framework.packages.find((p) => p.name === '@octane-xplat/ui').version,
		'0.14.0',
	)
})

test('multiple apps stay ambiguous until explicit selection', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, 'apps/a', { name: 'app-a' })
	makeConsumerApp(root, 'apps/b', { name: 'app-b' })

	const context = createWorkspaceContext({ workspaceRoot: root, evidenceRoot: join(root, '.ev') })
	const report = await buildProjectStatus(context)
	assert.equal(report.identity.selection.state, 'ambiguous')
	assert.equal(report.identity.selection.candidates.length, 2)
	assert.match(report.nextSteps[0], /never picks silently/)

	const bound = bindApp(context, 'apps/b')
	assert.equal(bound.app.name, 'app-b')
	assert.equal((await buildProjectStatus(context)).identity.selection.state, 'bound')
})

test('an empty workspace reports no-apps without inventing identity', async () => {
	const root = makeWorkspace()
	const context = createWorkspaceContext({ workspaceRoot: root, evidenceRoot: join(root, '.ev') })
	const report = await buildProjectStatus(context)
	assert.equal(report.identity.selection.state, 'none')
	assert.equal(report.identity.selection.reason, 'no-apps')
	assert.match(report.nextSteps[0], /No Octane Xplat app/)
})

test('the framework repository is identified as a framework workspace', () => {
	const root = makeWorkspace()
	writeJson(root, 'package.json', { name: 'octane-xplat', private: true })
	writeJson(root, 'packages/ui/package.json', { name: '@octane-xplat/ui', version: '0.14.0' })
	makeConsumerApp(root, 'apps/web', { name: 'harness-web' })

	const discovery = discoverWorkspace(root)
	assert.equal(discovery.workspace.kind, 'framework-repo')
	assert.equal(discovery.apps.length, 1)
	assert.equal(discovery.apps[0].kind, 'consumer-app')
})

test('native platform detection follows declared nativescript platforms', () => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', {
		name: 'native-app',
		web: false,
		native: true,
		extraManifest: {
			devDependencies: { '@nativescript/ios': '9.0.0', '@nativescript/android': '9.0.0' },
		},
	})

	assert.deepEqual(detectPlatforms(root), ['ios', 'android'])
})

test('macos and linux platforms come from xplat.targets', () => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', {
		name: 'desktop-app',
		web: false,
		extraManifest: {
			xplat: {
				targets: {
					macos: { runtime: 'appkit-node-api' },
					linux: { runtime: 'webkitgtk' },
				},
			},
		},
	})

	assert.deepEqual(detectPlatforms(root), ['macos', 'linux'])
})

test('installed versions bind docs; lockfile disagreement is reported', () => {
	const root = makeWorkspace()
	makeConsumerApp(root, 'app', {
		name: 'locked-app',
		uiVersion: '^0.14.0',
		installed: { '@octane-xplat/ui': '0.14.0' },
	})

	writeFile(
		root,
		'pnpm-lock.yaml',
		`importers:\n  app:\n    dependencies:\n      '@octane-xplat/ui':\n        specifier: ^0.14.0\n        version: 0.13.0\n`,
	)

	const binding = resolveFrameworkBinding(root, join(root, 'app'))
	assert.equal(binding.status, 'installed')
	assert.equal(binding.packages[0].version, '0.14.0')
	assert.match(binding.discrepancy, /0\.13\.0.*0\.14\.0/)
})

test('without installation the binding is provisional, never latest-inferred', () => {
	const root = makeWorkspace()
	makeConsumerApp(root, 'app', { name: 'no-install' })
	writeFile(
		root,
		'pnpm-lock.yaml',
		`importers:\n  app:\n    dependencies:\n      '@octane-xplat/ui':\n        specifier: ^0.14.0\n        version: 0.14.0\n`,
	)

	const binding = resolveFrameworkBinding(root, join(root, 'app'))
	assert.equal(binding.status, 'provisional')
	assert.equal(binding.packages[0].source, 'lockfile')
})

test('prerequisite probes report status and remedy, never silent readiness', () => {
	const prereqs = checkPrerequisites(['web', 'ios', 'android'])
	const byId = Object.fromEntries(prereqs.map((p) => [p.id, p]))
	assert.equal(byId.node.status, 'satisfied')
	assert.ok(['satisfied', 'missing'].includes(byId.git.status))
	assert.equal(byId.chromium.status, 'unknown')
	assert.ok(byId.chromium.remedy)
	if (byId.xcode.status === 'missing') {
		assert.ok(byId.xcode.remedy)
	}
})

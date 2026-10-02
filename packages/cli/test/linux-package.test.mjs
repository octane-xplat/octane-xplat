import assert from 'node:assert/strict'
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { inspectLinuxPackageConfig } from '../src/linux/config.mjs'
import { packageLinux } from '../src/linux/package.mjs'

function project(t) {
	const root = mkdtempSync(join(tmpdir(), 'xplat-linux-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	const manifest = {
		version: '1.2.3',
		xplat: {
			targets: {
				linux: {
					runtime: 'webkitgtk',
					host: { scheme: 'sample' },
					package: {
						applicationId: 'org.example.Sample',
						productName: 'Sample App',
						executableName: 'sample-app',
					},
				},
			},
		},
	}

	writeFileSync(join(root, 'package.json'), JSON.stringify(manifest))
	writeFileSync(join(root, 'vite.linux.config.ts'), '')
	mkdirSync(join(root, 'node_modules/vite'), { recursive: true })
	writeFileSync(
		join(root, 'node_modules/vite/package.json'),
		JSON.stringify({ name: 'vite', bin: { vite: 'build.cjs' } }),
	)
	writeFileSync(
		join(root, 'node_modules/vite/build.cjs'),
		`const fs = require('fs'); const path = require('path'); const out = process.argv[process.argv.indexOf('--outDir') + 1]; fs.mkdirSync(out, {recursive:true}); fs.writeFileSync(path.join(out, 'index.html'), '<h1>Sample</h1>');`,
	)
	return { root, manifest }
}

test('Linux packaging creates relocatable app, metadata, archive and per-user desktop installation', async (t) => {
	const { root } = project(t)
	const { appDir, archive } = await packageLinux(root)
	assert.ok(existsSync(archive))
	assert.deepEqual(JSON.parse(readFileSync(join(appDir, 'app.json'), 'utf8')), {
		applicationId: 'org.example.Sample',
		productName: 'Sample App',
		scheme: 'sample',
	})

	assert.ok(
		execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' }).includes(
			'sample-app/bundle/index.html',
		),
	)
	const relocated = join(root, 'relocated app')
	cpSync(appDir, relocated, { recursive: true })
	execFileSync('sh', ['-n', join(relocated, 'sample-app')])
	const dataHome = join(root, 'data with spaces $dollar %percent')
	execFileSync('sh', [join(relocated, 'install.sh')], {
		env: { ...process.env, XDG_DATA_HOME: dataHome },
	})
	const installed = join(dataHome, 'org.example.Sample')
	assert.ok(existsSync(join(installed, 'bundle/index.html')))
	const desktop = readFileSync(join(dataHome, 'applications/org.example.Sample.desktop'), 'utf8')
	assert.ok(desktop.includes('MimeType=x-scheme-handler/sample;'))
	assert.ok(desktop.includes('Exec="'))
	assert.ok(desktop.includes('%%percent'))
	assert.ok(!desktop.includes(root + '/dist'))
})

test('Linux packaging rejects invalid identities, injection and config traversal before building', () => {
	const t = { after: () => {} }
	const { root, manifest } = project(t)
	try {
		manifest.xplat.targets.linux.package = {
			applicationId: 'bad',
			productName: 'Name\nExec=bad',
			executableName: '../bad',
			viteConfig: '../outside.ts',
		}
		manifest.xplat.targets.linux.host.scheme = 'https'
		writeFileSync(join(root, 'package.json'), JSON.stringify(manifest))
		const config = inspectLinuxPackageConfig(root)
		assert.equal(config.issues.length, 5)
		assert.ok(!existsSync(join(root, 'dist')))
	} finally {
		rmSync(root, { recursive: true, force: true })
	}
})

test('failed frontend build preserves previously packaged app', async (t) => {
	const { root } = project(t)
	const result = await packageLinux(root)
	writeFileSync(join(result.appDir, 'keep.txt'), 'previous app')
	writeFileSync(join(root, 'node_modules/vite/build.cjs'), 'process.exit(1)')
	await assert.rejects(packageLinux(root))
	assert.equal(readFileSync(join(result.appDir, 'keep.txt'), 'utf8'), 'previous app')
})

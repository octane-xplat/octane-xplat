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
import { inspectLinuxPackageConfig } from '../dist/linux/config.js'
import { packageLinux } from '../dist/linux/package.js'
import { hasLinux, linuxRuntime } from '../dist/targets.js'

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

function gtkProject(t) {
	const { root, manifest } = project(t)
	manifest.xplat.targets.linux.runtime = 'gtk'
	delete manifest.xplat.targets.linux.host
	writeFileSync(join(root, 'package.json'), JSON.stringify(manifest))
	writeFileSync(join(root, 'vite.gtk.config.ts'), '')
	writeFileSync(
		join(root, 'node_modules/vite/build.cjs'),
		`const fs = require('fs'); const path = require('path'); const out = process.argv[process.argv.indexOf('--outDir') + 1]; fs.mkdirSync(out, {recursive:true}); fs.writeFileSync(path.join(out, 'app.js'), 'import Gtk from "gi://Gtk?version=4.0";');`,
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

test('linux target detection accepts gtk and webkitgtk runtimes and rejects others', (t) => {
	const { root, manifest } = gtkProject(t)
	assert.equal(linuxRuntime(root), 'gtk')
	assert.ok(hasLinux(root))

	manifest.xplat.targets.linux.runtime = 'webkitgtk'
	writeFileSync(join(root, 'package.json'), JSON.stringify(manifest))
	assert.equal(linuxRuntime(root), 'webkitgtk')
	assert.ok(hasLinux(root))

	manifest.xplat.targets.linux.runtime = 'qt'
	writeFileSync(join(root, 'package.json'), JSON.stringify(manifest))
	assert.equal(linuxRuntime(root), null)
	assert.ok(!hasLinux(root))
})

test('GTK config needs no URI scheme and defaults to vite.gtk.config.ts', async (t) => {
	const { root } = gtkProject(t)
	const config = inspectLinuxPackageConfig(root)
	assert.deepEqual(config.issues, [])
	assert.equal(config.runtime, 'gtk')
	assert.equal(config.viteConfig, join(root, 'vite.gtk.config.ts'))
})

test('GTK config still validates a declared URI scheme', async (t) => {
	const { root, manifest } = gtkProject(t)
	manifest.xplat.targets.linux.host = { scheme: 'HTTPS' }
	writeFileSync(join(root, 'package.json'), JSON.stringify(manifest))
	const config = inspectLinuxPackageConfig(root)
	assert.equal(config.issues.length, 1)
	assert.match(config.issues[0], /linux\.host\.scheme/)
})

test('GTK packaging produces the ESM bundle, gjs -m launcher, and archive', async (t) => {
	const { root } = gtkProject(t)
	const { appDir, archive } = await packageLinux(root)
	assert.ok(existsSync(archive))
	assert.ok(existsSync(join(appDir, 'app.js')))
	assert.deepEqual(JSON.parse(readFileSync(join(appDir, 'app.json'), 'utf8')), {
		applicationId: 'org.example.Sample',
		productName: 'Sample App',
		version: '1.2.3',
	})

	const launcher = readFileSync(join(appDir, 'sample-app'), 'utf8')
	assert.match(launcher, /exec gjs -m "\$APP_DIR\/app\.js"/)
	execFileSync('sh', ['-n', join(appDir, 'sample-app')])

	const listing = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' })
	assert.ok(listing.includes('sample-app/app.js'))
	assert.ok(listing.includes('sample-app/sample-app'))
	assert.ok(!existsSync(join(appDir, 'bundle')))
	assert.ok(!existsSync(join(appDir, 'host')))
	assert.ok(!existsSync(join(appDir, 'install.sh')))
})

test('GTK packaging rejects a build that emits no single ESM bundle', async (t) => {
	const { root } = gtkProject(t)
	writeFileSync(
		join(root, 'node_modules/vite/build.cjs'),
		`const fs = require('fs'); const path = require('path'); const out = process.argv[process.argv.indexOf('--outDir') + 1]; fs.mkdirSync(out, {recursive:true}); fs.writeFileSync(path.join(out, 'a.js'), ''); fs.writeFileSync(path.join(out, 'b.js'), '');`,
	)

	await assert.rejects(packageLinux(root), /exactly one ESM bundle/)
})

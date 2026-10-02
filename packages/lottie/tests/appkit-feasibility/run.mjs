import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildMacOSNative as standardBuild, writeNativeBootstrap } from '../../../cli/src/macos/native.mjs'
import { hostBundle } from '../../../cli/src/macos/jsc-host/runtime.mjs'
import { macOSExecutable } from '../../../cli/src/macos/executables.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../../../..')
const upstream = resolve(process.argv[2] ?? '')
assert.ok(process.argv[2], 'Pass the opensrc path for airbnb/lottie-ios@4.6.1')
const version = JSON.parse(await readFile(join(upstream, 'package.json'), 'utf8')).version
assert.equal(version, '4.6.1', 'Expected opensrc upstream 4.6.1 archive')
await mkdir(join(repo, 'research'), { recursive: true })
const app = await mkdtemp(join(repo, 'research/lottie-appkit-'))
const leaf = join(app, 'leaf')
await mkdir(join(leaf, 'platforms/macos/src'), { recursive: true })
await cp(join(upstream, 'Sources'), join(leaf, 'platforms/macos/src/upstream'), { recursive: true })
await cp(join(here, 'Bridge.swift'), join(leaf, 'platforms/macos/src/Bridge.swift'))
await writeFile(join(leaf, 'package.json'), JSON.stringify({
	name: 'xplat-lottie-feasibility', private: true, version: '0.0.0',
	xplat: { macos: { frameworks: ['AppKit', 'QuartzCore'] } },
}))
await mkdir(join(app, 'node_modules'))
await symlink(leaf, join(app, 'node_modules/xplat-lottie-feasibility'))
await writeFile(join(app, 'package.json'), JSON.stringify({
	private: true, dependencies: { 'xplat-lottie-feasibility': '0.0.0' },
}))
console.log(`UPSTREAM airbnb/lottie-ios ${version}`)
let build = standardBuild
if (process.argv.includes('--wmo')) {
	// Isolated compiler experiment, never rewrite the production builder.
	const builderURL = new URL('../../../cli/src/macos/native.mjs', import.meta.url)
	let source = await readFile(builderURL, 'utf8')
	source = source.replace('timeout: 180_000', 'timeout: 600_000')
	source = source.replace("'-emit-library',", "'-emit-library', '-whole-module-optimization',")
	source = source.replace('headers.push(generated)',
		`await writeFile(generated, '#import <AppKit/AppKit.h>\\n#import <QuartzCore/QuartzCore.h>\\n' + await readFile(generated, 'utf8'))\n\t\t\t\theaders.push(generated)`)
	source = source.replace(/from '(\.\/[^']+)'/g,
		(_, path) => `from '${new URL(path, builderURL).href}'`)
	const experimental = join(app, 'experimental-native.mjs')
	await writeFile(experimental, source)
	build = (await import(experimental)).buildMacOSNative
	console.log('EXPERIMENTAL WMO; 600-second timeout; explicit AppKit/QuartzCore header imports')
}
process.chdir(app) // Swift auxiliary outputs belong to scratch, never the repo root.
const artifact = await build(app)
const bootstrap = join(app, 'bootstrap.js')
await writeNativeBootstrap(artifact, bootstrap)
const host = await macOSExecutable(app, 'macos-arm64/host')
const result = spawnSync(host, [
	join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
	join(here, 'probe.cjs'), artifact.metadata, bootstrap,
], { encoding: 'utf8', timeout: 20_000 })
console.log(result.stdout)
console.log(result.stderr)
assert.equal(result.status, 0, 'Real JSC host probe must exit successfully')
assert.match(result.stderr + result.stdout, /LOTTIE_APPKIT_FEASIBILITY_OK/)
console.log(`Artifact retained under ${app}`)

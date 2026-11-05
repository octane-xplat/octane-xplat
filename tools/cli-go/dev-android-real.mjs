// Explicit opt-in NativeScript/Go relay qualification. No images or user apps.
// Reserve native_builds plus resident_devices/android:elegant-fir-probe.
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { scratchRun } from './scratch.mjs'

assert.equal(process.platform, 'darwin', 'This device recipe requires the configured macOS SDK host')
const root = resolve(import.meta.dirname, '../..'), work = join(root, 'research/go-cli')
const binary = join(work, 'xplat-go-darwin-arm64-cli')
const sha = (data) => createHash('sha256').update(data).digest('hex')
const build = JSON.parse(readFileSync(binary + '.json'))
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {assert.equal(sha(readFileSync(join(root, file))), hash, file)}

const sdk = process.env.ANDROID_HOME ?? join(homedir(), 'Library/Android/sdk')
const java = process.env.JAVA_HOME ?? join(homedir(), 'Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home')
const adb = join(sdk, 'platform-tools/adb'), avd = 'elegant-fir-probe', device = 'emulator-5588'
const scratch = realpathSync(scratchRun(root, 'go-native-android'))
const app = join(scratch, 'app'), appId = 'org.octane.clirelay.p' + sha(scratch).slice(0, 12)
const env = { ...process.env, CI: '1', NODE_OPTIONS: '', NODE_PATH: '', JAVA_HOME: java, ANDROID_HOME: sdk, ANDROID_SDK_ROOT: sdk, GRADLE_USER_HOME: join(scratch, 'gradle'), XPLAT_DEV_CACHE: join(scratch, 'dev-cache'), XDG_CACHE_HOME: join(scratch, 'cache'), PATH: join(java, 'bin') + ':' + join(sdk, 'platform-tools') + ':' + process.env.PATH }
for (const key of ['VISUAL_CAPTURE_URL', 'VISUAL_RUN_ID', 'VISUAL_REVISION', 'VISUAL_SCENARIO_HASH', 'XPLAT_DEV_APP_BRIDGE', 'XPLAT_AGENT_CLIENT', 'XPLAT_PERMISSIONS']) {delete env[key]}
function command(tool, args, options = {}) {
	const result = spawnSync(tool, args, { env, encoding: 'utf8', timeout: 15000, maxBuffer: 2 << 20, ...options })
	assert.equal(result.status, 0, `${tool}: ${result.error?.message ?? result.stderr}`)
	return result.stdout
}
function put(file, data) { mkdirSync(resolve(file, '..'), { recursive: true }); writeFileSync(file, typeof data === 'string' ? data : JSON.stringify(data)) }
async function until(read, message, timeout = 30000) {
	const deadline = Date.now() + timeout
	for (;;) {
		const value = await read()
		if (value) {return value}
		assert.ok(Date.now() < deadline, typeof message === 'function' ? message() : message)
		await delay(200)
	}
}
function owned(tool, args, options = {}) {
	const child = spawn(tool, args, { env, detached: true, stdio: ['ignore', 'pipe', 'pipe'], ...options })
	const state = { child, ended: false, output: '' }
	for (const pipe of [child.stdout, child.stderr]) {pipe.on('data', (data) => { state.output = (state.output + data).slice(-(2 << 20)) })}
	state.completion = new Promise((resolve, reject) => { child.once('error', reject); child.once('close', (code, signal) => { state.ended = true; resolve({ code, signal }) }) })
	return state
}
async function stop(state) {
	if (!state || state.ended) {return}
	state.child.kill('SIGINT')
	await Promise.race([state.completion, delay(20000, undefined, { ref: false }).then(() => { throw new Error('Owned process did not shut down') })])
}
function query(args) {
	const result = command(binary, [...args, '--json'], { cwd: app })
	const response = JSON.parse(result)
	assert.equal(response.ok, true, result)
	return response.data
}

// Use the current installed dependencies; only platform adapter sources are
// copied, exactly as in the AppKit gate. No parser/transport snapshots or mocks.
mkdirSync(app)
mkdirSync(join(app, 'src'))
const mobile = JSON.parse(readFileSync(join(root, 'apps/mobile/package.json')))
const dependencies = Object.fromEntries(['@nativescript/core', '@valor/nativescript-websockets', '@octane-xplat/nativescript-mason-core'].map((name) => [name, JSON.parse(readFileSync(join(root, 'apps/mobile/node_modules', name, 'package.json'))).version]))
const devDependencies = Object.fromEntries(['@nativescript/android', '@nativescript/vite', '@octane-xplat/cli', 'nativescript', 'vite', '@nativescript-community/vite-octane', '@octanejs/vite-plugin'].map((name) => [name, JSON.parse(readFileSync(join(root, 'apps/mobile/node_modules', name, 'package.json'))).version]))
assert.ok(mobile.devDependencies.nativescript)
put(join(app, 'package.json'), { name: 'go-native-android-relay', private: true, version: '0.0.0', type: 'module', main: 'src/index.ts', packageManager: 'bun@1.4.4', dependencies, devDependencies, xplat: { targets: { android: {} } } })
symlinkSync(join(root, 'apps/mobile/node_modules'), join(app, 'node_modules'), 'dir')
cpSync(join(root, 'packages/create/template/App_Resources/Android'), join(app, 'App_Resources/Android'), { recursive: true })
put(join(app, 'nativescript.config.ts'), `export default {id:${JSON.stringify(appId)},appPath:'src',appResourcesPath:'App_Resources',cli:{packageManager:'bun'},bundler:'vite',bundlerConfigPath:'vite.config.mts'}\n`)
put(join(app, 'vite.config.mts'), `import {defineConfig} from 'vite';import {xplatNative} from '@octane-xplat/cli/vite';export default defineConfig(env=>xplatNative(env,{extra:{server:{host:'127.0.0.1'}}}))\n`)
put(join(app, 'tsconfig.json'), { compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'bundler', skipLibCheck: true } })
for (const name of ['dev-actions-registry.ts', 'dev-actions-schema.ts', 'dev-bridge-socket.ts', 'dev-bridge.ts']) {cpSync(join(root, 'packages/platform/src', name), join(app, 'src', name), { recursive: false, force: true })}
put(join(app, 'src/index.ts'), `import '@valor/nativescript-websockets';import {Application,Label} from '@nativescript/core';import {registerDevAction} from './dev-actions-registry';registerDevAction({id:'fixture.android.read',title:'Read Android fixture',description:'Observe owned fixture',effects:{summary:'Read only'},result:{fields:{value:{type:'integer'}}},run:()=>({value:1})});console.log('GO_ANDROID_RELAY_READY');Application.run({create:()=>{const label=new Label();label.text='Owned CLI relay fixture';return label}});\n`)
mkdirSync(env.GRADLE_USER_HOME)
put(join(env.GRADLE_USER_HOME, 'gradle.properties'), 'org.gradle.daemon=false\norg.gradle.workers.max=2\n')
// Reuse downloaded engine artifacts without changing the existing cache.
const gradleCache = join(work, 'nativescript-gradle-cache')
for (const name of ['wrapper', 'caches']) {if (existsSync(join(gradleCache, name))) {cpSync(join(gradleCache, name), join(env.GRADLE_USER_HOME, name), { recursive: true })}}

let emulator, dev, failure
const evidence = { revision: command('git', ['rev-parse', 'HEAD'], { cwd: root }).trim(), binarySha256: build.sha256, device, avd, appId, scratch, passed: false }
try {
	assert.ok(command(join(sdk, 'emulator/emulator'), ['-list-avds']).split(/\r?\n/).includes(avd), 'Designated existing AVD is missing')
	assert.ok(!/^emulator-\d+\s/m.test(command(adb, ['devices'])), 'An emulator is already running; wait for it')
	assert.ok(!/\/(?:qemu-system-[^/\s]+|emulator)\s*$/m.test(command('/bin/ps', ['-axo', 'comm'])), 'An emulator is starting; wait for it')
	emulator = owned(join(sdk, 'emulator/emulator'), ['-avd', avd, '-port', '5588', '-no-window', '-no-audio', '-no-snapshot', '-no-boot-anim', '-gpu', 'swiftshader'])
	await until(() => {
		assert.equal(emulator.ended, false, emulator.output)
		const result = spawnSync(adb, ['-s', device, 'shell', 'getprop', 'sys.boot_completed'], { env, encoding: 'utf8', timeout: 3000 })
		return result.status === 0 && result.stdout.trim() === '1'
	}, 'Designated emulator boot deadline', 120000)
	assert.equal(command(adb, ['-s', device, 'emu', 'avd', 'name']).trim().split(/\r?\n/)[0], avd)
	dev = owned(binary, ['dev', 'android', '--device', device], { cwd: app })
	let instances
	await until(() => {
		assert.equal(dev.ended, false, dev.output)
		assert.ok(!dev.output.includes('failed to load config from'), dev.output)
		assert.ok(!dev.output.includes('Cannot instantiate module ') && !dev.output.includes('An uncaught Exception occurred'), dev.output)
		const result = spawnSync(binary, ['actions', 'list', '--json'], { cwd: app, env, encoding: 'utf8', timeout: 15000 })
		try { instances = JSON.parse(result.stdout).data?.instances } catch { return false }
		return instances?.some((instance) => instance.platform === 'android' && instance.actions.some((action) => action.id === 'fixture.android.read'))
	}, () => 'Native app did not register through Go/Vite: ' + dev.output, 15 * 60000)
	const instance = instances.find((instance) => instance.platform === 'android')
	evidence.instance = { platform: instance.platform, targetId: instance.targetId, appInstanceId: instance.appInstanceId }
	const accepted = query(['actions', 'invoke', '--action', 'fixture.android.read', '--instance', instance.appInstanceId, '--request-key', 'android-read'])
	let job
	await until(() => { job = query(['actions', 'status', accepted.job.jobId]).job; return !['queued', 'running', 'cancelling'].includes(job.state) }, 'Android action did not finish')
	assert.equal(job.state, 'succeeded', JSON.stringify(job))
	assert.equal(job.result.outcome.result.value, 1)
	assert.equal(dev.ended, false, 'Short-lived CLI clients stopped foreground dev')
	evidence.pidAfterClientExit = command(adb, ['-s', device, 'shell', 'pidof', appId]).trim()
	assert.match(evidence.pidAfterClientExit, /^\d+(?: \d+)*$/)
	evidence.passed = true
} catch (error) {
	failure = error
	evidence.error = error.message
} finally {
	try {
		await stop(dev)
		if (dev && !failure) {
			const captures = query(['diagnostics']).sessions
			assert.ok(captures.length > 0 && captures.every((capture) => capture.cleanupConfirmed), 'Native foreground engine cleanup is unconfirmed')
			evidence.engineCleanupConfirmed = true
		}
	} catch (error) { failure ??= error; evidence.cleanupError = error.message }
	if (emulator) {
		const named = spawnSync(adb, ['-s', device, 'emu', 'avd', 'name'], { env, encoding: 'utf8', timeout: 3000 })
		if (named.status === 0 && named.stdout.trim().split(/\r?\n/)[0] === avd) {
			const removed = spawnSync(adb, ['-s', device, 'uninstall', appId], { env, encoding: 'utf8', timeout: 15000 })
			if (removed.status !== 0 && evidence.passed) { failure ??= new Error('Owned Android fixture uninstall failed'); evidence.uninstallError = removed.stderr }
			spawnSync(adb, ['-s', device, 'emu', 'kill'], { env, timeout: 15000 })
		}
		try { await stop(emulator) } catch (error) { failure ??= error; evidence.emulatorCleanupError = error.message }
	}
	evidence.passed &&= !failure
	writeFileSync(join(work, 'dev-android-real.json'), JSON.stringify(evidence, null, 2))
	writeFileSync(join(work, 'dev-android-real-output.log'), dev?.output ?? '')
	writeFileSync(join(work, 'dev-android-emulator.log'), emulator?.output ?? '')
}
if (failure) {throw failure}
console.log('Qualified actual NativeScript Android app action over project Vite relay and Go RPC; no image or OS input qualification')

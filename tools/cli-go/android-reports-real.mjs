// Explicit owned Android exit-info qualification. No images or user apps.
import assert from 'node:assert/strict'
import { spawnSync, spawn } from 'node:child_process'
import {
	mkdirSync,
	writeFileSync,
	readFileSync,
	existsSync,
	mkdtempSync,
	readdirSync,
} from 'node:fs'

import { homedir } from 'node:os'
import { resolve, join } from 'node:path'
import { createHash } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')

const sdk = process.env.ANDROID_HOME ?? join(homedir(), 'Library/Android/sdk')
const java =
	process.env.JAVA_HOME ??
	join(homedir(), 'Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home')

const env = {
	...process.env,
	JAVA_HOME: java,
	ANDROID_HOME: sdk,
	ANDROID_SDK_ROOT: sdk,
	PATH: join(java, 'bin') + ':' + join(sdk, 'platform-tools') + ':' + process.env.PATH,
}

const base = join(homedir(), 'agent-scratch/octane-xplat/go-cli-stoic-forge/android-reports')
const avd = 'octane-stoic-forge-cli',
	avdPath = join(base, 'avd'),
	statePath = join(work, 'android-reports-prepare.json')

const sha = (value) => createHash('sha256').update(value).digest('hex')
function command(tool, args, options = {}) {
	const result = spawnSync(tool, args, {
		env,
		encoding: 'utf8',
		timeout: 60000,
		maxBuffer: 8 * 1024 * 1024,
		...options,
	})
	assert.equal(result.status, 0, `${tool}: ${result.error?.message ?? result.stderr}`)
	return result.stdout
}

const adb = join(sdk, 'platform-tools/adb')
if (process.argv.includes('--prepare')) {
	assert.equal(process.platform, 'darwin', 'This owned emulator recipe is qualified on macOS only')
	assert.ok(existsSync(join(sdk, 'platforms/android-35/android.jar')))
	assert.ok(
		existsSync(join(sdk, 'system-images/android-35/google_apis/arm64-v8a/source.properties')),
		'Install the required SDK image explicitly; this runner never installs images/licenses',
	)

	mkdirSync(base, { recursive: true })
	writeFileSync(
		join(base, 'README.md'),
		'Everything in this folder is disposable.\nOwner: stoic-forge parallel Go CLI; source tools/cli-go/android-reports-real.mjs. Evidence research/go-cli and ~/dev/reports/octane-xplat.\n',
	)

	const manager = join(sdk, 'cmdline-tools/latest/bin/avdmanager'),
		owner = join(base, 'owner.json')

	const list = command(join(sdk, 'emulator/emulator'), ['-list-avds']).trim().split(/\r?\n/)
	if (list.includes(avd)) {
		assert.ok(existsSync(owner), 'Existing AVD is not owned by this task')
		assert.equal(JSON.parse(readFileSync(owner)).path, avdPath)
	} else {
		command(
			manager,
			[
				'create',
				'avd',
				'--name',
				avd,
				'--package',
				'system-images;android-35;google_apis;arm64-v8a',
				'--path',
				avdPath,
			],
			{ input: 'no\n' },
		)

		writeFileSync(owner, JSON.stringify({ avd, path: avdPath, task: 'stoic-forge Go CLI' }))
	}

	const avdConfig = join(avdPath, 'config.ini')
	const config = readFileSync(avdConfig, 'utf8')
	writeFileSync(
		avdConfig,
		config.replace(/^disk\.dataPartition\.size\s*=.*$/m, 'disk.dataPartition.size = 2147483648'),
	)

	const run = mkdtempSync(join(base, 'run-')),
		appId = 'org.octane.clireports.p' + sha(run).slice(0, 12)

	const source = join(run, 'MainActivity.java'),
		classes = join(run, 'classes'),
		dex = join(run, 'dex')

	mkdirSync(classes)
	mkdirSync(dex)
	writeFileSync(
		source,
		`package ${appId}; public class MainActivity extends android.app.Activity { @Override public void onCreate(android.os.Bundle state) { super.onCreate(state); android.widget.TextView text=new android.widget.TextView(this); text.setText("Owned CLI report fixture"); setContentView(text); } }`,
	)

	const manifest = join(run, 'AndroidManifest.xml')
	writeFileSync(
		manifest,
		`<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="${appId}"><uses-sdk android:minSdkVersion="30" android:targetSdkVersion="35"/><application android:label="Owned CLI report fixture" android:theme="@android:style/Theme.Material.Light.NoActionBar"><activity android:name=".MainActivity" android:exported="true"><intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter></activity></application></manifest>`,
	)

	const build = join(sdk, 'build-tools/35.0.1'),
		androidJar = join(sdk, 'platforms/android-35/android.jar')

	command(join(java, 'bin/javac'), [
		'-source',
		'8',
		'-target',
		'8',
		'-bootclasspath',
		androidJar,
		'-d',
		classes,
		source,
	])

	command(join(build, 'd8'), [
		'--lib',
		androidJar,
		'--output',
		dex,
		join(classes, ...appId.split('.'), 'MainActivity.class'),
	])

	const unsigned = join(run, 'unsigned.apk'),
		aligned = join(run, 'aligned.apk'),
		apk = join(run, 'fixture.apk'),
		key = join(run, 'fixture.jks')

	command(join(build, 'aapt2'), ['link', '-o', unsigned, '--manifest', manifest, '-I', androidJar])
	command('/usr/bin/zip', ['-j', unsigned, join(dex, 'classes.dex')])
	command(join(build, 'zipalign'), ['-f', '4', unsigned, aligned])
	command(join(java, 'bin/keytool'), [
		'-genkeypair',
		'-keystore',
		key,
		'-alias',
		'fixture',
		'-keyalg',
		'RSA',
		'-keysize',
		'2048',
		'-validity',
		'1',
		'-storepass',
		'android',
		'-keypass',
		'android',
		'-dname',
		'CN=Owned CLI Fixture',
	])

	command(join(build, 'apksigner'), [
		'sign',
		'--ks',
		key,
		'--ks-pass',
		'pass:android',
		'--key-pass',
		'pass:android',
		'--out',
		apk,
		aligned,
	])

	mkdirSync(work, { recursive: true })
	writeFileSync(
		statePath,
		JSON.stringify({ run, appId, apk, apkSha256: sha(readFileSync(apk)), avd, avdPath }, null, 2),
	)

	console.log('Prepared owned Android diagnostic APK; emulator not started')
} else if (process.argv.includes('--run')) {
	const prepared = JSON.parse(readFileSync(statePath))
	assert.equal(sha(readFileSync(prepared.apk)), prepared.apkSha256)
	const binary = join(work, 'go-tests-darwin-arm64'),
		record = JSON.parse(readFileSync(binary + '.json'))

	assert.equal(sha(readFileSync(binary)), record.sha256)
	for (const [file, hash] of Object.entries(record.inputs)) {
		assert.equal(sha(readFileSync(join(root, file))), hash, file)
	}

	const publicBinary = join(work, 'xplat-go-darwin-arm64-cli')
	const publicRecord = JSON.parse(readFileSync(publicBinary + '.json'))
	assert.equal(sha(readFileSync(publicBinary)), publicRecord.sha256)
	const port = Number(process.env.XPLAT_GO_ANDROID_PORT ?? 5588),
		device = 'emulator-' + port

	assert.ok(Number.isInteger(port) && port >= 5554 && port <= 5682 && port % 2 === 0)
	assert.ok(
		!command(adb, ['devices']).includes(device),
		'Selected emulator port already belongs to a device',
	)

	const child = spawn(
		join(sdk, 'emulator/emulator'),
		[
			'-avd',
			avd,
			'-port',
			String(port),
			'-partition-size',
			'2048',
			'-no-window',
			'-no-audio',
			'-no-snapshot',
			'-no-boot-anim',
			'-gpu',
			'swiftshader',
		],
		{ env, stdio: ['ignore', 'pipe', 'pipe'] },
	)

	let output = '',
		closed = false

	child.stdout.on('data', (chunk) => (output = (output + chunk).slice(-65536)))
	child.stderr.on('data', (chunk) => (output = (output + chunk).slice(-65536)))
	const ended = new Promise((resolve) =>
		child.once('close', () => {
			closed = true
			resolve()
		}),
	)

	try {
		const deadline = Date.now() + 120000
		for (;;) {
			assert.ok(!closed, output)
			const result = spawnSync(adb, ['-s', device, 'shell', 'getprop', 'sys.boot_completed'], {
				env,
				encoding: 'utf8',
				timeout: 3000,
			})

			if (result.status === 0 && result.stdout.trim() === '1') {
				break
			}

			assert.ok(Date.now() < deadline, 'Emulator boot deadline')
			await delay(1000)
		}

		const clock = Number(command(adb, ['-s', device, 'shell', 'date', '+%s']).trim())
		assert.ok(
			Math.abs(Date.now() / 1000 - clock) < 5,
			'Device clock differs from host; no clock mutation performed',
		)

		command(adb, ['-s', device, 'install', prepared.apk])
		const startedAt = new Date().toISOString()
		command(adb, [
			'-s',
			device,
			'shell',
			'am',
			'start',
			'-W',
			'-n',
			prepared.appId + '/.MainActivity',
		])

		assert.match(command(adb, ['-s', device, 'shell', 'pidof', prepared.appId]), /\d+/)
		command(adb, ['-s', device, 'shell', 'am', 'crash', prepared.appId])
		for (let i = 0; i < 50; i++) {
			const result = spawnSync(adb, ['-s', device, 'shell', 'pidof', prepared.appId], {
				env,
				encoding: 'utf8',
				timeout: 3000,
			})

			if (result.status !== 0 || !result.stdout.trim()) {
				break
			}

			await delay(100)
		}

		const fixture = join(prepared.run, 'device.json'),
			evidence = join(work, 'android-reports-real.json')

		writeFileSync(
			fixture,
			JSON.stringify({
				Device: device,
				AppID: prepared.appId,
				StartedAt: startedAt,
				EndedAt: new Date().toISOString(),
				Output: evidence,
				Binary: publicBinary,
			}),
		)

		command(binary, ['-test.run=^TestAndroidNativeReportsReal$', '-test.v'], {
			env: { ...env, XPLAT_GO_ANDROID_REPORT_FIXTURE: fixture },
			timeout: 30000,
		})

		const result = JSON.parse(readFileSync(evidence))
		assert.equal(result.passed, true)
		writeFileSync(
			evidence,
			JSON.stringify(
				{ ...result, apkSha256: prepared.apkSha256, binarySha256: record.sha256 },
				null,
				2,
			),
		)

		console.log(
			'Qualified real Android exit record and native original retention; no NativeScript deployment or image qualification claimed',
		)
	} finally {
		const ownedDevice = () => {
			const result = spawnSync(adb, ['-s', device, 'emu', 'avd', 'name'], {
				env,
				encoding: 'utf8',
				timeout: 3000,
			})
			return result.status === 0 && result.stdout.trim().split(/\r?\n/)[0] === avd
		}

		if (ownedDevice()) {
			spawnSync(adb, ['-s', device, 'uninstall', prepared.appId], { env, timeout: 10000 })
			spawnSync(adb, ['-s', device, 'emu', 'kill'], { env, timeout: 10000 })
		}

		if (!closed) {
			await Promise.race([ended, delay(15000)])
			if (!closed) {
				try {
					process.kill(-child.pid, 'SIGKILL')
				} catch (error) {
					if (error.code !== 'ESRCH') {
						throw error
					}
				}

				await ended
			}
		}

		assert.equal(ownedDevice(), false, 'Owned emulator cleanup is unconfirmed')

		writeFileSync(join(work, 'android-reports-emulator.log'), output)
	}
} else {
	throw new Error('Choose --prepare or --run')
}

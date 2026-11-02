// @ts-nocheck — packaged .app qualification for the TypeScript desktop-webview
// host. Stages a real bundle the way xplat build lays one out, relocates it,
// registers it with LaunchServices, and runs the executable directly so the
// xplat:// scheme, channel dispatch, and UserNotifications all resolve the
// bundle identity — not a dev-server assumption.
import { execFileSync, spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { buildMacOSNative, writeNativeBootstrap } from '../../../packages/cli/src/macos/native.ts'
import { writeInfoPlist } from '../../../packages/cli/src/macos/info-plist.ts'
import { hostBundle } from '../../../packages/cli/src/macos/jsc-host/runtime.ts'

const appRoot = fileURLToPath(new URL('..', import.meta.url))
const verifying = process.argv.includes('--verify')

if (process.platform !== 'darwin' || process.arch !== 'arm64') {
	throw new Error('The packaged WKWebView proof requires an Apple Silicon Mac.')
}

const executableName = 'OctanePackagedProof'
// Reuse the camera-proof bundle identifier: this machine already holds a TCC
// camera grant for it, so getUserMedia exercises the granted delegate path.
const bundleIdentifier = 'org.octane.xplat.macos-camera-proof'

let child
let stopping = false
let stagingRoot

async function stop() {
	if (stopping) {
		return
	}

	stopping = true
	if (child && child.exitCode === null) {
		const exited = new Promise((resolveExit) => child.once('exit', resolveExit))
		child.kill('SIGTERM')
		let forceTimer
		await Promise.race([
			exited,
			new Promise((resolveTimeout) => {
				forceTimer = setTimeout(resolveTimeout, 3000)
			}),
		])

		clearTimeout(forceTimer)
		if (child.exitCode === null) {
			child.kill('SIGKILL')
		}
	}

	if (stagingRoot) {
		await rm(stagingRoot, { recursive: true, force: true })
	}
}

process.once('SIGINT', () => {
	void stop()
})

process.once('SIGTERM', () => {
	void stop()
})

const run = (command, args) => execFileSync(command, args, { stdio: 'inherit' })

try {
	console.log('[packaged-proof] building typed JSC host bundle')
	await build({ configFile: resolve(appRoot, 'vite.webview-packaged-host.config.mjs') })

	console.log('[packaged-proof] building bundled web proof page')
	await build({ configFile: resolve(appRoot, 'vite.webview-packaged-proof.config.mjs') })

	console.log('[packaged-proof] compiling native leaves and metadata')
	const native = await buildMacOSNative(appRoot)

	stagingRoot = await mkdtemp(join(tmpdir(), 'xplat-packaged-proof-'))
	const stagedApp = join(stagingRoot, 'built', `${executableName}.app`)
	const contents = join(stagedApp, 'Contents')
	const resources = join(contents, 'Resources')
	await mkdir(join(contents, 'MacOS'), { recursive: true })
	await mkdir(join(resources, 'app'), { recursive: true })
	await cp(resolve(appRoot, 'dist/webview-packaged-host/host.cjs'), join(resources, 'app/main.cjs'))
	await cp(resolve(appRoot, 'dist/webview-packaged-proof'), join(resources, 'web'), {
		recursive: true,
	})
	await cp(native.metadata.arm64, join(resources, 'metadata.macos.arm64.nsmd'))
	await cp(native.metadata.x86_64, join(resources, 'metadata.macos.x86_64.nsmd'))
	await writeNativeBootstrap(native, join(resources, 'host-shim.js'), { packaged: true })
	await cp(join(hostBundle, 'host'), join(contents, 'MacOS', executableName))
	const frameworkPath = join(contents, 'Frameworks', 'NativeScript.framework')
	await mkdir(dirname(frameworkPath), { recursive: true })
	await cp(join(hostBundle, 'NativeScript.framework'), frameworkPath, {
		recursive: true,
		verbatimSymlinks: true,
	})
	for (const [target, alias] of [
		['A', join(frameworkPath, 'Versions/Current')],
		['Versions/Current/Headers', join(frameworkPath, 'Headers')],
		['Versions/Current/Resources', join(frameworkPath, 'Resources')],
		['Versions/Current/NativeScript', join(frameworkPath, 'NativeScript')],
	]) {
		try {
			await symlink(target, alias)
		} catch (error) {
			if (error.code !== 'EEXIST') {
				throw error
			}
		}
	}

	const nativeLibraries = []
	for (const library of native.prebuilt ?? []) {
		const path = join(contents, 'Frameworks', library.file)
		await cp(library.source, path)
		nativeLibraries.push(path)
	}
	for (const library of native.libraries) {
		const path = join(contents, 'Frameworks', library.file)
		await cp(join(native.directory, library.file), path)
		nativeLibraries.push(path)
	}
	for (const resource of native.resources ?? []) {
		const destination = join(resources, resource.destination)
		await mkdir(dirname(destination), { recursive: true })
		await cp(resource.source, destination)
	}

	// Traversal canaries: a script OUTSIDE Resources/web plus a symlink inside
	// web pointing at it — if the scheme handler serves either, the page learns.
	await writeFile(
		join(resources, 'pwned.js'),
		'window.parent && window.parent.postMessage("PWNED", "*");\n',
	)
	await symlink('../pwned.js', join(resources, 'web/linked-pwned.js'))
	await mkdir(join(resources, 'web/assets'), { recursive: true })
	await writeFile(join(resources, 'web/assets/probe.js'), 'window.__xplatProbeServed = true;\n')

	await writeFile(
		join(contents, 'Info.plist'),
		writeInfoPlist(
			{
				productName: 'Octane Packaged Proof',
				executableName,
				bundleIdentifier,
				version: '0.0.0',
				minimumSystemVersion: '13.5',
				// XPLAT_PROOF_MEDIA_USAGE=1 adds camera/mic usage descriptions so
				// getUserMedia reaches the real TCC prompt for a human session;
				// without them the leaf denies deterministically (no prompt).
				infoPlist:
					process.env.XPLAT_PROOF_MEDIA_USAGE === '1'
						? {
								NSCameraUsageDescription: 'The packaged proof exercises media capture.',
								NSMicrophoneUsageDescription:
									'The packaged proof exercises microphone status.',
							}
						: {},
			},
			null,
		),
	)

	run('chmod', ['755', join(contents, 'MacOS', executableName)])
	for (const library of nativeLibraries) {
		run('codesign', ['--force', '--sign', '-', library])
	}
	run('codesign', ['--force', '--sign', '-', frameworkPath])
	run('codesign', ['--force', '--sign', '-', join(contents, 'MacOS', executableName)])
	run('codesign', ['--force', '--sign', '-', stagedApp])
	run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', stagedApp])

	// Relocate the bundle so nothing can resolve paths against the build tree.
	const relocatedApp = join(stagingRoot, 'relocated', `${executableName}.app`)
	await mkdir(dirname(relocatedApp), { recursive: true })
	run('cp', ['-R', stagedApp, relocatedApp])
	console.log(`[packaged-proof] relocated bundle: ${relocatedApp}`)

	// usernoted only answers LaunchServices-registered bundles.
	run(
		'/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister',
		['-f', relocatedApp],
	)

	child = spawn(join(relocatedApp, 'Contents/MacOS', executableName), [], {
		cwd: stagingRoot,
		env: { ...process.env, NODE_ENV: verifying ? 'test' : 'development' },
		stdio: ['pipe', 'pipe', 'pipe'],
	})

	let output = ''
	let resolveResult
	let rejectResult
	const result = new Promise((resolvePromise, rejectPromise) => {
		resolveResult = resolvePromise
		rejectResult = rejectPromise
	})

	const capture = (chunk) => {
		const text = chunk.toString()
		output += text
		process.stdout.write(text)
		const match = output.match(/XPLAT_PACKAGED_WEBVIEW_PROOF_(OK|FAILED) (\{[^\r\n]*\})/)
		if (!match) {
			return
		}

		if (match[1] === 'FAILED') {
			rejectResult(new Error(`packaged WKWebView proof reported failure: ${match[2]}`))
		} else {
			resolveResult(JSON.parse(match[2]))
		}
	}

	child.stdout.on('data', capture)
	child.stderr.on('data', capture)
	child.once('error', rejectResult)
	child.once('exit', (code, signal) => {
		if (verifying && !output.includes('XPLAT_PACKAGED_WEBVIEW_PROOF_OK')) {
			rejectResult(
				new Error(`packaged proof host exited before completing (code ${code}, signal ${signal}).`),
			)
		}
	})

	if (verifying) {
		let timeoutId
		const timeout = new Promise((_, reject) => {
			timeoutId = setTimeout(
				() => reject(new Error('Timed out waiting for the packaged WKWebView proof.')),
				120_000,
			)
		})

		let proof
		try {
			proof = await Promise.race([result, timeout])
		} finally {
			clearTimeout(timeoutId)
		}

		console.log(
			`[packaged-proof] verified scheme=${JSON.stringify(proof.schemeChecks)} notifications=${JSON.stringify(proof.notifications)}`,
		)

		await stop()
	} else {
		console.log('[packaged-proof] running; close the app window or press Ctrl-C to stop')
		await new Promise((resolveExit) => child.once('exit', resolveExit))
		await stop()
	}
} catch (error) {
	await stop()
	throw error
}

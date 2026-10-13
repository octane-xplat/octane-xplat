import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawn } from 'node:child_process'

const CONFIGS = ['vite.config.native.mts', 'vite.config.native.ts', 'vite.config.mts', 'vite.config.ts', 'vite.config.mjs']
export function mobilePrerequisites(root, target, host = process.platform, env = process.env) {
	const req = createRequire(join(root, 'package.json'))
	const installed = (name) => { try { req.resolve(name); return true } catch { return false } }
	const configFile = CONFIGS.map((name) => join(root, name)).find(existsSync)
	const requirements = {
		'nativescript.config.ts': existsSync(join(root, 'nativescript.config.ts')),
		'native workshop Vite setup': Boolean(configFile && /withWorkshopMobile/.test(readFileSync(configFile, 'utf8'))),
		'@nativescript/core': installed('@nativescript/core'),
		'@nativescript-community/octane': installed('@nativescript-community/octane'),
		'@nativescript-community/vite-octane': installed('@nativescript-community/vite-octane'),
		'@valor/nativescript-websockets': installed('@valor/nativescript-websockets'),
		'nativescript CLI': installed('nativescript'),
	}

	if (target === 'ios') {requirements['macOS / Xcode host'] = host === 'darwin' && existsSync('/Applications/Xcode.app')}
	else {
		requirements['Android SDK directory'] = Boolean((env.ANDROID_HOME || env.ANDROID_SDK_ROOT) && existsSync(env.ANDROID_HOME || env.ANDROID_SDK_ROOT))
		requirements['JAVA_HOME directory'] = Boolean(env.JAVA_HOME && existsSync(env.JAVA_HOME))
	}

	return {
		backend: 'nativescript (Octane universal renderer)', requirements,
		status: target === 'ios' && host !== 'darwin' ? 'remote-host-required' : Object.values(requirements).every(Boolean) ? 'unqualified-backend' : 'missing-prerequisites',
		note: 'Mobile adapter installed; actual-host lifecycle, touch, keyboard, screen-reader and IME qualification remain open. Doctor does not launch or select a device.',
	}
}

export function mobileLaunchSpec({ root, target, device, config, story }) {
	if (!['ios', 'android'].includes(target)) {throw new Error('Expected ios or android')}
	if (!device || typeof device !== 'string' || device.startsWith('-')) {throw new Error('Mobile workshop requires --device <device-id>; it never chooses or boots a device implicitly')}
	const req = createRequire(join(root, 'package.json'))
	const packageFile = req.resolve('nativescript/package.json')
	const manifest = JSON.parse(readFileSync(packageFile, 'utf8'))
	const binary = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin.ns ?? manifest.bin.nativescript
	if (!binary) {throw new Error('Installed NativeScript CLI has no ns binary')}
	return {
		command: process.execPath,
		args: [resolve(dirname(packageFile), binary), 'run', target, '--device', device],
		options: {
			cwd: root, stdio: 'inherit', shell: false,
			env: { ...process.env, XPLAT_WORKSHOP_TARGET: target, XPLAT_WORKSHOP_CONFIG: JSON.stringify(config), XPLAT_WORKSHOP_STORY: story ?? '' },
		},
	}
}

export async function launchMobile(options) {
	const spec = mobileLaunchSpec(options)
	const child = spawn(spec.command, spec.args, spec.options)
	const interrupt = () => child.kill('SIGINT')
	const terminate = () => child.kill('SIGTERM')
	process.on('SIGINT', interrupt)
	process.on('SIGTERM', terminate)
	try {
		await new Promise((resolve, reject) => {
			child.once('error', reject)
			child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`NativeScript workshop ${options.target} exited ${signal ?? code}; check launch logs and restart the target`)))
		})
	} finally {
		process.off('SIGINT', interrupt)
		process.off('SIGTERM', terminate)
	}

	return { target: options.target, exited: true }
}

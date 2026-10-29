import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import ts from 'typescript'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

test('packed macOS consumer resolves generated declarations and platform contracts', () => {
	const directory = mkdtempSync(join(tmpdir(), 'xplat-announce-consumer-'))
	const run = (command, args, cwd) => {
		const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 300_000 })
		assert.equal(result.status, 0, result.stdout + result.stderr)
		return result.stdout
	}

	const output = run('pnpm', ['pack', '--pack-destination', directory], root)
	// `pnpm pack` runs prepack (typegen + pack-check) whose progress lines can
	// land after the tarball path — take the last .tgz line, not the last line.
	const tarball = output
		.trim()
		.split('\n')
		.reverse()
		.find((line) => line.trim().endsWith('.tgz'))
	assert.ok(tarball, `no tarball path in pnpm pack output:\n${output}`)
	const modules = join(directory, 'node_modules/@octane-xplat/platform')
	mkdirSync(modules, { recursive: true })
	run('tar', ['-xzf', tarball, '--strip-components=1', '-C', modules], directory)

	// platform's declarations reference the capability contract in
	// @octane-xplat/lib — a real install pulls it in as a dependency.
	const libOutput = run('pnpm', ['pack', '--pack-destination', directory], resolve(root, '../lib'))
	const libTarball = libOutput
		.trim()
		.split('\n')
		.reverse()
		.find((line) => line.trim().endsWith('.tgz'))
	assert.ok(libTarball, `no tarball path in pnpm pack output:\n${libOutput}`)
	const libModules = join(directory, 'node_modules/@octane-xplat/lib')
	mkdirSync(libModules, { recursive: true })
	run('tar', ['-xzf', libTarball, '--strip-components=1', '-C', libModules], directory)
	const manifest = JSON.parse(readFileSync(join(modules, 'package.json'), 'utf8'))
	assert.equal(manifest.exports['.'].macos.types, './types/generated/index.macos.d.ts')
	assert.match(
		readFileSync(join(modules, 'platforms/macos/include/XplatConnectivity.h'), 'utf8'),
		/readState/,
	)

	assert.match(
		readFileSync(join(modules, 'platforms/macos/src/XplatConnectivity.m'), 'utf8'),
		/nw_path_monitor_start/,
	)

	const entry = join(directory, 'consumer.ts')
	writeFileSync(
		entry,
		`import { announce, random, connectivity, keepAwake, useKeepAwake, type KeepAwakeOptions, type ConnectivityState, type WindowSize, device, locale, type DeviceInfo, type Locale, systemBars } from '@octane-xplat/platform'
import { useWindowSize } from '@octane-xplat/platform/screen'
import { useAppState, useBackHandler } from '@octane-xplat/platform/lifecycle'
import { useSafeAreaInsets } from '@octane-xplat/platform/safe-area'
import { useBreakpoints$ } from '@octane-xplat/platform/breakpoints'
import { useWindowSize as explicitWindow } from '@octane-xplat/platform/screen.ts'
import { device as directDevice } from '@octane-xplat/platform/device'
import { locale as directLocale } from '@octane-xplat/platform/locale'
import { device as explicitDevice } from '@octane-xplat/platform/device.ts'
import { locale as explicitLocale } from '@octane-xplat/platform/locale.ts'
import { systemBars as directBars } from '@octane-xplat/platform/system-bars'
import { systemBars as explicitBars } from '@octane-xplat/platform/system-bars.ts'
const bars: { setStatusBarStyle: (style: 'light' | 'dark') => void; setColor: (color: string) => void }[] = [systemBars, directBars, explicitBars]
// @ts-expect-error status styles keep the shared light/dark vocabulary
systemBars.setStatusBarStyle('automatic')
// @ts-expect-error color arguments remain strings
directBars.setColor(42)
const devices: DeviceInfo[] = [device, directDevice, explicitDevice]
const locales: Locale[] = [locale, directLocale, explicitLocale]
const windowHook: () => WindowSize = useWindowSize
const explicitWindowHook: typeof useWindowSize = explicitWindow
const activityHook: () => 'active' | 'inactive' | 'background' = useAppState
const insetHook: () => { top: number; right: number; bottom: number; left: number } = useSafeAreaInsets
const breakpoints: { compact: boolean; wide: boolean } = useBreakpoints$({ compact: 0, wide: 900 })
const neutralBack: void = useBackHandler(() => false)
// @ts-expect-error the Android-only hook does not return a cleanup function
const backCleanup: () => void = useBackHandler(() => false)
const keepOptions: KeepAwakeOptions = { suppressDeactivateWarnings: true, onRelease: tag => console.log(tag) }
const hook: (tag?: string, options?: KeepAwakeOptions) => void = useKeepAwake
const active: Promise<boolean> = keepAwake.activate('reading')
const inactive: Promise<boolean> = keepAwake.deactivate('reading')
const held: Promise<boolean> = keepAwake.isActivated()
const available: Promise<boolean> = keepAwake.isAvailable()
// @ts-expect-error tags must be strings
keepAwake.activate(42)
const state: ConnectivityState = connectivity.getState()
const stop: () => void = connectivity.subscribe((next) => console.log(next.online, next.type))
stop()
const fn: (text: string) => void = announce
const result: void = fn('Saved ✓')
// @ts-expect-error only string messages are accepted
announce(42)
// @ts-expect-error no delivery acknowledgement
const delivered: boolean = announce('Saved')
const make: (length: number) => Uint8Array = random.bytes
const fill: (view: Uint8Array) => Uint8Array = random.fill
// @ts-expect-error fill expects a buffer view, not a length
random.fill(16)
`,
	)

	const options = {
		strict: true,
		skipLibCheck: false,
		noEmit: true,
		target: ts.ScriptTarget.ES2022,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		customConditions: ['macos'],
	}

	const resolved = ts.resolveModuleName('@octane-xplat/platform', entry, options, ts.sys)
	assert.equal(
		resolved.resolvedModule.resolvedFileName,
		realpathSync(join(modules, 'types/generated/index.macos.d.ts')),
	)

	for (const service of ['device', 'locale', 'system-bars']) for (const suffix of ['', '.ts']) {
		const selected = ts.resolveModuleName(`@octane-xplat/platform/${service}${suffix}`, entry, options, ts.sys)
		assert.equal(selected.resolvedModule?.resolvedFileName, realpathSync(join(modules, `types/generated/${service}.macos.d.ts`)))
	}

	const example = join(directory, 'announce-status.ts')
	writeFileSync(
		example,
		readFileSync(join(root, '../../examples/accessibility/announce-status.ts'), 'utf8'),
	)

	const program = ts.createProgram([entry, example], options)
	assert.deepEqual(
		program
			.getSourceFiles()
			.filter((file) => file.fileName.startsWith(modules + '/') && !file.isDeclarationFile),
		[],
		'consumer typechecking does not load platform implementation source',
	)

	const diagnostics = ts.getPreEmitDiagnostics(program)
	assert.equal(
		diagnostics.length,
		0,
		ts.formatDiagnosticsWithColorAndContext(diagnostics, {
			getCanonicalFileName: (path) => path,
			getCurrentDirectory: () => directory,
			getNewLine: () => '\n',
		}),
	)
})

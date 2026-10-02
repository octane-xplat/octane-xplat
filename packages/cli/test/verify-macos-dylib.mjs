// Experimental desk/lab fixture, not a supported xplat command.
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const revision = '5b697b393152f973dd392851fd72dacf03a7a0c9'
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const fixture = join(repoRoot, 'packages/cli/test/fixtures/macos-dylib')
const hostRoot = join(repoRoot, 'packages/cli/src/macos/jsc-host')
const prebuilt = join(hostRoot, 'prebuilt/macos-arm64')
const scratch = join(repoRoot, 'research/macos-dylib-probe')
mkdirSync(scratch, { recursive: true })

function run(command, args, { log, env = process.env, timeout = 300_000 } = {}) {
	const result = spawnSync(command, args, { cwd: repoRoot, env, encoding: 'utf8', timeout })
	const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
	if (log) {
		writeFileSync(join(scratch, log), output)
	}
	if (result.error || result.status !== 0) {
		throw new Error(
			`${command} failed: ${result.error ?? result.signal ?? result.status}\n${output.slice(-6000)}`,
		)
	}

	return output.trim()
}

if (process.platform !== 'darwin' || process.arch !== 'arm64') {
	throw new Error('Run this probe on an Apple Silicon Mac with Xcode and CMake installed.')
}

const sdk = run('xcrun', ['--sdk', 'macosx', '--show-sdk-path'])
const clang = run('xcrun', ['--find', 'clang'])
const clangxx = run('xcrun', ['--find', 'clang++'])
const generatorSource = join(scratch, 'generator')
if (!existsSync(generatorSource)) {
	const source = run('opensrc', ['path', `NativeScript/runtimes@${revision}`])
		.split('\n')
		.at(-1)

	cpSync(join(source, 'metadata-generator'), generatorSource, { recursive: true })
}

const build = join(scratch, 'build-xcode')
run(
	'cmake',
	[
		'-S',
		generatorSource,
		'-B',
		build,
		'-DCMAKE_BUILD_TYPE=Release',
		'-DMETADATA_BINARY_ARCH=arm64',
		'-DCMAKE_OSX_ARCHITECTURES=arm64',
		`-DCMAKE_OBJC_COMPILER=${clang}`,
		`-DCMAKE_CXX_COMPILER=${clangxx}`,
		`-DCMAKE_OSX_SYSROOT=${sdk}`,
	],
	{ log: 'configure.log' },
)

run('cmake', ['--build', build, '-j', '8'], { log: 'build.log' })
const dylib = join(scratch, 'libxplat-probe.dylib')
run(clang, [
	'-dynamiclib',
	'-arch',
	'arm64',
	'-mmacosx-version-min=13.5',
	'-isysroot',
	sdk,
	join(fixture, 'xplat-probe.c'),
	'-o',
	dylib,
])

console.log('[dylib-probe] compiled custom arm64 dylib')

const output = join(scratch, 'metadata')
for (const dir of [output, join(output, 'types'), join(output, 'json')]) {
	mkdirSync(dir, { recursive: true })
}

const metadata = join(output, 'metadata.nsmd')
run(
	join(build, 'bin/objc-metadata-generator'),
	[
		'import=<Foundation/Foundation.h>',
		'import=<dlfcn.h>',
		`import="${join(fixture, 'xplat-probe.h')}"`,
		`include=${fixture}`,
		`include=${sdk}/usr/include`,
		`include=${sdk}/System/Library/Frameworks/Foundation.framework`,
		`types=${output}/types`,
		`json=${output}/json`,
		'-output-bin',
		metadata,
		'-output-umbrella',
		join(output, 'umbrella.h'),
		'Xclang',
		'-isysroot',
		sdk,
		'-target',
		'arm64-apple-macos13.5',
	],
	{ log: 'metadata.log' },
)

if (!readFileSync(join(output, 'umbrella.h'), 'utf8').includes('xplat-probe.h')) {
	throw new Error('Generated umbrella omits custom header')
}

console.log('[dylib-probe] generated metadata from explicit imports')
for (const [declared, metadataPath, marker] of [
	['0', join(prebuilt, 'metadata.nsmd'), 'PASS shipped metadata:'],
	['1', metadata, 'PASS custom metadata:'],
]) {
	const transcript = run(
		join(prebuilt, 'host'),
		[
			join(prebuilt, 'NativeScript.framework/Versions/A/NativeScript'),
			join(fixture, 'probe.cjs'),
			metadataPath,
			join(fixture, 'bootstrap.js'),
		],
		{
			env: { ...process.env, XPLAT_PROBE_DECLARED: declared, XPLAT_PROBE_DYLIB: dylib },
			log: `host-${declared}.log`,
			timeout: 10_000,
		},
	)

	if (!transcript.includes(marker)) {
		throw new Error(`Host omitted assertion marker:\n${transcript}`)
	}
	console.log(transcript.split('\n').find((line) => line.startsWith(marker)))
}

console.log('[dylib-probe] PASS; artifacts and complete logs: research/macos-dylib-probe')

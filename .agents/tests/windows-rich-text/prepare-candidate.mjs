import { cpSync, existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const source = resolve(process.argv[2] ?? '')
if (!process.argv[2] || !existsSync(join(source, 'src/driver.ts'))) {
	throw new Error(
		'Pass the unmodified @nativescript-community/octane@0.2.4 source package path from opensrc.',
	)
}

const manifest = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'))
if (manifest.name !== '@nativescript-community/octane' || manifest.version !== '0.2.4') {
	throw new Error('This candidate is pinned to @nativescript-community/octane@0.2.4.')
}

const target = resolve(repo, process.argv[3] ?? 'research/windows-rich-text/candidate')
if (existsSync(target)) {
	throw new Error('Choose a new output directory; existing work will not be overwritten.')
}

const req = createRequire(join(repo, 'apps/windows/package.json'))
const sourceTarget = join(target, 'packages/octane')
mkdirSync(sourceTarget, { recursive: true })
cpSync(source, sourceTarget, { recursive: true })
symlinkSync(join(repo, 'apps/windows/node_modules'), join(target, 'node_modules'))
function run(command, args, cwd = repo) {
	const result = spawnSync(command, args, {
		cwd,
		stdio: 'inherit',
		env: {
			...process.env,
			...(command === 'git' ? { GIT_CEILING_DIRECTORIES: dirname(cwd) } : {}),
		},
	})

	if (result.error) {
		throw result.error
	}

	if (result.status !== 0) {
		throw new Error(command + ' failed with exit ' + result.status)
	}
}

run(
	'git',
	['apply', '--check', join(repo, '.agents/patches/windows-rich-text/driver-source.patch')],
	target,
)

run('git', ['apply', join(repo, '.agents/patches/windows-rich-text/driver-source.patch')], target)
writeFileSync(
	join(target, 'tsconfig.base.json'),
	JSON.stringify({
		compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler' },
	}) + '\n',
)

writeFileSync(
	join(target, 'tsconfig.driver.json'),
	JSON.stringify({
		compilerOptions: {
			target: 'ES2022',
			module: 'ESNext',
			moduleResolution: 'Bundler',
			skipLibCheck: true,
			strict: true,
			outDir: 'emitted',
		},
		include: ['packages/octane/src/driver.ts'],
	}) + '\n',
)

run('pnpm', ['exec', 'tsc', '-p', join(target, 'tsconfig.driver.json')])
const installed = dirname(dirname(req.resolve('@nativescript-community/octane')))
const packaged = join(target, 'package')
cpSync(installed, packaged, { recursive: true })
run(
	'git',
	['apply', '--check', join(repo, '.agents/patches/windows-rich-text/driver-package.patch')],
	packaged,
)

run(
	'git',
	['apply', join(repo, '.agents/patches/windows-rich-text/driver-package.patch')],
	packaged,
)

if (
	!readFileSync(join(packaged, 'dist/driver.js')).equals(
		readFileSync(join(target, 'emitted/driver.js')),
	)
) {
	throw new Error('Source emit and package delta differ; do not integrate this candidate.')
}

console.log('Candidate source and package prepared; installed workspace dependencies unchanged.')
console.log('Source driver: ' + join(sourceTarget, 'src/driver.ts'))
console.log('Package driver: ' + join(packaged, 'dist/driver.js'))

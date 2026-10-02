import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	cpSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(packageRoot, '../..')
const temporary = mkdtempSync(join(tmpdir(), 'octane-xplat-auth-consumer-'))
const packOutput = join(temporary, 'pack')
const extractedRoot = join(temporary, 'extracted')
const platformExtractedRoot = join(temporary, 'platform-extracted')
mkdirSync(platformExtractedRoot)
mkdirSync(packOutput)
mkdirSync(extractedRoot)

function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
	if (result.stdout) {
		process.stdout.write(result.stdout)
	}

	if (result.stderr) {
		process.stderr.write(result.stderr)
	}

	if (result.error) {
		throw result.error
	}

	if (result.status !== 0) {
		throw new Error(`${command} exited with ${result.status}`)
	}
}

function typecheck(packagePath, target, mode, exportMapIndex) {
	const consumerRoot = join(temporary, `map-${exportMapIndex}-${target}-${mode.name}`)
	const modules = join(consumerRoot, 'node_modules')
	const packageLink = join(modules, '@octane-xplat/auth')
	mkdirSync(dirname(packageLink), { recursive: true })
	cpSync(packagePath, packageLink, { recursive: true })
	symlinkSync(join(packageRoot, 'node_modules/octane'), join(modules, 'octane'), 'dir')
	if (target === 'macos') {
		cpSync(join(platformExtractedRoot, 'package'), join(modules, '@octane-xplat/platform'), {
			recursive: true,
		})

		symlinkSync(
			join(repoRoot, 'packages/macos-renderer'),
			join(modules, '@octane-xplat/macos-renderer'),
			'dir',
		)
	}

	writeFileSync(
		join(consumerRoot, 'consumer.tsx'),
		`import { appleAuth, googleAuth, AppleSignInButton, GoogleSignInButton, type SignInResult, type GoogleHostedAuthFlow, type GoogleAuthConfig } from '@octane-xplat/auth'
const report = (result: SignInResult) => console.log(result.status)
void appleAuth.signIn({ scopes: ['email', 'name'], nonce: 'n' })
const hostedFlow: GoogleHostedAuthFlow = {
  async createRequest(options) { return { url: 'https://example.test/login?nonce=' + (options.nonce ?? ''), callbackScheme: 'sample' } },
  async complete(_url) { return { provider: 'google', idToken: 'token', scopes: ['openid'], user: { id: 'subject' } } },
  async signOut() {},
}
const config: GoogleAuthConfig = { hostedFlow }
void googleAuth.configure(config)
void googleAuth.signIn({ nonce: 'n' })
void googleAuth.signOut()
void appleAuth.getCredentialState('user-id')
const apple = <AppleSignInButton type="continue" theme="black" onResult={report} />
const google = <GoogleSignInButton theme="auto" variant="standard" onResult={report} />
${
	target === 'macos'
		? `import { authSession, type AuthSessionOptions, type AuthSessionResult } from '@octane-xplat/platform'
const sessionOptions: AuthSessionOptions = { callbackScheme: 'sample', prefersEphemeralSession: true }
const sessionResult: Promise<AuthSessionResult> | undefined = authSession.impl?.open('https://example.test/login', sessionOptions)
void sessionResult`
		: ''
}
${target === 'web' ? 'const webReturn: import("octane/jsx-runtime").JSX.Element = AppleSignInButton({})\nvoid webReturn' : ''}
void apple
void google
`,
	)

	if (target === 'macos') {
		writeFileSync(
			join(consumerRoot, 'google-hosted.macos.ts'),
			readFileSync(join(repoRoot, 'examples/auth/google-hosted.macos.ts'), 'utf8'),
		)
	}

	const configPath = join(consumerRoot, `tsconfig.${mode.name}.json`)
	writeFileSync(
		configPath,
		JSON.stringify(
			{
				compilerOptions: {
					strict: true,
					noEmit: true,
					module: mode.module,
					moduleResolution: mode.moduleResolution,
					target: 'esnext',
					jsx: 'react-jsx',
					jsxImportSource: target === 'macos' ? '@octane-xplat/macos-renderer' : 'octane',
					customConditions: [target],
					skipLibCheck: false,
				},
				files: target === 'macos' ? ['consumer.tsx', 'google-hosted.macos.ts'] : ['consumer.tsx'],
			},
			null,
			2,
		),
	)

	run(
		process.execPath,
		[join(repoRoot, 'node_modules/typescript/bin/tsc'), '--project', configPath],
		consumerRoot,
	)
}

try {
	run('pnpm', ['pack', '--pack-destination', packOutput], packageRoot)
	const tarballs = readdirSync(packOutput).filter((name) => name.endsWith('.tgz'))
	assert.equal(tarballs.length, 1, 'pnpm pack produces one tarball')
	run('tar', ['-xzf', join(packOutput, tarballs[0]), '-C', extractedRoot], temporary)
	run('pnpm', ['pack', '--pack-destination', packOutput], join(repoRoot, 'packages/platform'))
	const platformTarball = readdirSync(packOutput).find(
		(name) => name.startsWith('octane-xplat-platform-') && name.endsWith('.tgz'),
	)

	assert.ok(platformTarball, 'platform dependency is packed')
	run('tar', ['-xzf', join(packOutput, platformTarball), '-C', platformExtractedRoot], temporary)
	const packedRoot = join(extractedRoot, 'package')
	const packedManifest = JSON.parse(readFileSync(join(packedRoot, 'package.json'), 'utf8'))
	const workspaceManifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
	assert.ok(
		workspaceManifest.publishConfig?.exports,
		'the package declares publish-time export mappings',
	)

	const exportMaps = [workspaceManifest.exports, packedManifest.exports]
	const uniqueExportMaps = exportMaps.filter(
		(exportsMap, index) =>
			exportsMap &&
			exportMaps.findIndex(
				(candidate) => JSON.stringify(candidate) === JSON.stringify(exportsMap),
			) === index,
	)

	for (const [index, exportsMap] of uniqueExportMaps.entries()) {
		const consumerPackage = join(temporary, `package-${index}`)
		cpSync(packedRoot, consumerPackage, { recursive: true })
		if (index > 0) {
			const consumerManifestPath = join(consumerPackage, 'package.json')
			const consumerManifest = JSON.parse(readFileSync(consumerManifestPath, 'utf8'))
			consumerManifest.exports = exportsMap
			writeFileSync(consumerManifestPath, `${JSON.stringify(consumerManifest, null, 2)}\n`)
		}

		for (const target of ['web', 'native', 'macos']) {
			for (const mode of [
				{ name: 'bundler', module: 'esnext', moduleResolution: 'bundler' },
				{ name: 'nodenext', module: 'nodenext', moduleResolution: 'nodenext' },
			]) {
				typecheck(consumerPackage, target, mode, index)
			}
		}
	}

	console.log(
		'auth packed consumer: web/native/macos exports typecheck in Bundler and NodeNext modes',
	)
} finally {
	rmSync(temporary, { recursive: true, force: true })
}

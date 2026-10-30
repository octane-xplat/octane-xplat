import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
const root = fileURLToPath(new URL('..', import.meta.url)),
	repo = fileURLToPath(new URL('../../..', import.meta.url))
const temp = await mkdtemp(join(tmpdir(), 'xplat-crypto-consumer-'))
function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
	assert.equal(result.status, 0, result.stdout + result.stderr)
}
try {
	const packed = join(temp, 'packed')
	await mkdir(packed)
	run('bun', ['pm', 'pack', '--ignore-scripts', '--destination', packed], root)
	const archives = (await readdir(packed)).filter((name) => name.endsWith('.tgz'))
	assert.equal(archives.length, 1)
	run('tar', ['-xzf', join(packed, archives[0]), '-C', packed], temp)
	const unpacked = join(packed, 'package'),
		modules = join(temp, 'node_modules')
	await mkdir(join(modules, '@octane-xplat'), { recursive: true })
	await symlink(unpacked, join(modules, '@octane-xplat/crypto'), 'dir')
	const manifest = JSON.parse(await readFile(join(unpacked, 'package.json'), 'utf8'))
	for (const name of Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies })) {
		await mkdir(dirname(join(modules, name)), { recursive: true })
		await symlink(join(root, 'node_modules', name), join(modules, name), 'dir')
	}
	for (const path of Object.values(manifest.exports['.'])) {
		await readFile(join(unpacked, path))
	}
	const ios = await readFile(join(unpacked, 'platforms/ios/src/XplatCryptoEngine.swift'), 'utf8')
	assert.equal(
		ios,
		await readFile(join(unpacked, 'platforms/macos/src/XplatCryptoEngine.swift'), 'utf8'),
	)
	assert.deepEqual(manifest.xplat.macos.frameworks, ['Foundation', 'CryptoKit', 'Security'])
	await writeFile(join(temp, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
	await writeFile(
		join(temp, 'consumer.ts'),
		`
import { Crypto, CryptoDigestAlgorithm, CryptoEncoding, AESKeySize, AESEncryptionKey, AESSealedData, digest, digestStringAsync, getRandomValues, getRandomBytes, randomUUID, aesEncryptAsync, aesDecryptAsync } from '@octane-xplat/crypto'
export async function encrypt(bytes: Uint8Array) {
 const key = await AESEncryptionKey.generate(AESKeySize.AES256)
 const data = await aesEncryptAsync(bytes,key)
 const raw: Uint8Array = await data.combined()
 const encoded: string = await data.combined('base64')
 const ciphertext: string = await data.ciphertext({includeTag:true,encoding:'base64'})
 const parsed = AESSealedData.fromCombined(raw)
 const decrypted: Uint8Array = await aesDecryptAsync(parsed,key)
 const base64: string = await aesDecryptAsync(parsed,key,{output:'base64'})
 return {encoded,ciphertext,decrypted,base64}
}
export { Crypto,digest,digestStringAsync,getRandomValues,getRandomBytes,randomUUID,CryptoDigestAlgorithm,CryptoEncoding }
// @ts-expect-error floating-point random views are not allowed
getRandomValues(new Float32Array(2))
`,
	)
	for (const [target, conditions, lib] of [
		['web', ['web'], ['ESNext', 'DOM']],
		['native', ['native'], ['ESNext']],
	]) {
		const config = join(temp, target + '.json')
		await writeFile(
			config,
			JSON.stringify({
				compilerOptions: {
					strict: true,
					skipLibCheck: false,
					noEmit: true,
					module: 'ESNext',
					moduleResolution: 'Bundler',
					target: 'ES2022',
					customConditions: conditions,
					lib,
					types: [],
				},
				files: ['consumer.ts'],
			}),
		)
		run(process.execPath, [join(repo, 'node_modules/typescript/bin/tsc'), '-p', config], temp)
	}
	for (const [condition, extensions] of [
		['web', ['.web.ts', '.ts', '.js']],
		['native', ['.ios.ts', '.mobile.ts', '.ts', '.js']],
	]) {
		const result = await build({
			root: temp,
			configFile: false,
			logLevel: 'error',
			resolve: { conditions: [condition], extensions },
			build: {
				write: false,
				ssr: condition === 'native',
				target: 'es2022',
				lib: { entry: join(temp, 'consumer.ts'), formats: ['es'] },
				rollupOptions: { external: condition === 'native' ? ['@nativescript/core', 'octane'] : [] },
				minify: false,
			},
			ssr: {
				noExternal: ['@octane-xplat/crypto', '@octane-xplat/platform', '@octane-xplat/lib'],
				resolve: { conditions: [condition] },
			},
		})
		const chunks = (Array.isArray(result) ? result : [result])
			.flatMap((item) => item.output)
			.filter((chunk) => chunk.type === 'chunk')
		assert.ok(chunks.some((chunk) => chunk.exports.includes('encrypt')))
		if (condition === 'native') {
			assert.ok(
				chunks.some(
					(chunk) =>
						chunk.code.includes('XplatCryptoEngine') && chunk.code.includes('SecRandomCopyBytes'),
				),
			)
		}
	}
	console.log(
		'Packed crypto consumer: ambient-free declarations, web/iOS import graphs, paired Apple facades and native framework configuration passed.',
	)
} finally {
	await rm(temp, { recursive: true, force: true })
}

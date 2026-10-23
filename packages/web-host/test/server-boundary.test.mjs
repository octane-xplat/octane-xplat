import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { build, createServer } from 'vite'
import { serverBoundary } from '@octane-xplat/lib/server-boundary'

async function fixture(run) {
	const root = await mkdtemp(new URL('.boundary-', import.meta.url).pathname)
	try {
		await writeFile(join(root, 'package.json'), '{"type":"module"}')
		await writeFile(
			join(root, 'private.server.ts'),
			'export const secret = "SERVER_SECRET_SENTINEL"; export const context = () => ({ secret });',
		)

		await run(root)
	} finally {
		await rm(root, { recursive: true, force: true })
	}
}

function config(root, extra = {}) {
	return {
		root,
		configFile: false,
		logLevel: 'silent',
		plugins: [serverBoundary()],
		resolve: { alias: { '#private': join(root, 'private.server.ts') } },
		build: {
			write: false,
			minify: false,
			sourcemap: true,
			lib: { entry: join(root, 'entry.ts'), formats: ['es'] },
		},
		...extra,
	}
}

test('client builds remove named server re-exports before resolution and omit authored maps', async () =>
	fixture(async (root) => {
		await writeFile(
			join(root, 'entry.ts'),
			'export { /* AUTHORED_PRIVATE_SENTINEL */ context as requestContext } from "./private.server"; export const screen = "public";',
		)
		const result = await build(config(root))
		const output = JSON.stringify(result)
		assert.doesNotMatch(output, /SERVER_SECRET_SENTINEL|AUTHORED_PRIVATE_SENTINEL/)
		const chunks = (Array.isArray(result) ? result[0] : result).output.filter(
			(x) => x.type === 'chunk',
		)
		assert.ok(chunks.some((x) => x.exports.includes('screen')))
		assert.ok(chunks.every((x) => !x.exports.includes('requestContext')))
		const server = await createServer(config(root, { server: { middlewareMode: true } }))
		try {
			const transformed = await server.transformRequest('/entry.ts')
			assert.doesNotMatch(
				JSON.stringify(transformed.map),
				/AUTHORED_PRIVATE_SENTINEL|SERVER_SECRET_SENTINEL/,
			)

			const ssr = await server.ssrLoadModule('/entry.ts')
			assert.equal(ssr.requestContext().secret, 'SERVER_SECRET_SENTINEL')
		} finally {
			await server.close()
		}
	}))

for (const source of [
	'import { secret } from "./private.server"; export const value = secret',
	'import "./private.server"; export const value = 1',
	'export * from "./private.server"',
	'import { secret } from "#private"; export const value = secret',
	'export const load = () => import("./private.server")',
]) {
	test(`rejects residual server imports: ${source}`, async () =>
		fixture(async (root) => {
			await writeFile(join(root, 'entry.ts'), source)
			await assert.rejects(build(config(root)), /server.only|server boundary/i)
		}))
}

test('server directory modules and re-export aliases follow resolved paths', async () =>
	fixture(async (root) => {
		await mkdir(join(root, '.server'))
		await writeFile(join(root, '.server/db.ts'), 'export const db = "SERVER_SECRET_SENTINEL"')
		await writeFile(
			join(root, 'entry.ts'),
			'export { context } from "#private"; export { db } from "./.server/db"; export const client = true',
		)
		assert.doesNotMatch(JSON.stringify(await build(config(root))), /SERVER_SECRET_SENTINEL/)
	}))

test('client consumers cannot use erased server exports through a shared facade', async () =>
	fixture(async (root) => {
		await writeFile(
			join(root, 'shared.ts'),
			'export { context } from "./private.server"; export const screen = true',
		)
		await writeFile(
			join(root, 'entry.ts'),
			'import { context } from "./shared"; export const value = context()',
		)
		await assert.rejects(build(config(root)), /MISSING_EXPORT|not exported|does not export/i)
	}))

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// The swap that publishes staged output cannot be failed through the public
// surface, so this test re-runs itself with fs/promises module mocking enabled
// and fails exactly rename(stage, outDir) after the previous outDir moved aside.
test('restores the previous published output when the swap rename fails', async (t) => {
	if (!process.env.XPLAT_PRERENDER_PUBLISH_CHILD) {
		const child = spawnSync(
			process.execPath,
			['--experimental-test-module-mocks', '--test', fileURLToPath(import.meta.url)],
			{
				env: { ...process.env, XPLAT_PRERENDER_PUBLISH_CHILD: '1' },
				encoding: 'utf8',
			},
		)

		assert.equal(child.status, 0, child.stderr || child.stdout)
		return
	}

	const fs = await import('node:fs/promises')
	const { mkdir, mkdtemp, readFile, readdir, writeFile, rm, lstat, rename: realRename } = fs
	const root = await mkdtemp(join(tmpdir(), 'xplat-publish-'))
	const outDir = join(root, 'html')
	let failSwap = false
	try {
		t.mock.module('node:fs/promises', {
			exports: {
				mkdir,
				mkdtemp,
				readFile,
				writeFile,
				rm,
				lstat,
				rename: async (from, to) => {
					if (failSwap && String(to) === outDir && /\.stage-[^/]*$/.test(String(from))) {
						throw new Error('simulated publish failure')
					}
					return realRename(from, to)
				},
			},
		})

		const { prerender } = await import('../src/build/prerender.ts')
		let edition = 0
		const renderer = {
			href: (path) => path,
			render: async (request) => ({
				version: 1,
				url: new URL(request.url).pathname,
				status: 200,
				headers: [
					['cache-control', 'public'],
					['content-type', 'text/html'],
				],
				html: 'page',
			}),
			document: async (page) => new Response(`edition-${++edition}`, { headers: page.headers }),
		}

		const options = {
			origin: 'https://example.com',
			outDir,
			cacheFile: join(root, 'cache.json'),
			revision: 'v1',
			paths: [{ destination: '/', key: 'v1' }],
		}

		await prerender(renderer, options)
		assert.equal(await readFile(join(outDir, 'index.html'), 'utf8'), 'edition-1')

		failSwap = true
		await assert.rejects(prerender(renderer, options), /simulated publish failure/)
		failSwap = false

		assert.equal(
			await readFile(join(outDir, 'index.html'), 'utf8'),
			'edition-1',
			'the previous owned output is restored in place',
		)

		assert.deepEqual(
			(await readdir(root)).sort(),
			['cache.json', 'html'],
			'no lock, stage or backup directories remain',
		)

		await prerender(renderer, options)
		assert.equal(await readFile(join(outDir, 'index.html'), 'utf8'), 'edition-3')
	} finally {
		await rm(root, { recursive: true, force: true })
	}
})

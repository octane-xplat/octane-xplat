import { mkdirSync, mkdtempSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { xplatWorkshop } from '../dist/build/vite.js'

async function withAssetServer(run) {
	const root = mkdtempSync(join(tmpdir(), 'workshop-assets-'))
	const app = join(root, 'app')
	mkdirSync(join(app, 'public'), { recursive: true })
	const [, shell] = xplatWorkshop({ cwd: app, config: { assets: { pictures: 'public' } } })
	let middleware
	shell.configureServer({
		middlewares: {
			use(handler) {
				middleware = handler
			},
		},
	})
	const server = createServer((req, res) =>
		middleware(req, res, () => {
			res.statusCode = 404
			res.end('not found')
		}),
	)
	try {
		await new Promise((resolve, reject) => {
			server.once('error', reject)
			server.listen(0, '127.0.0.1', resolve)
		})

		await run({ root, app, url: `http://127.0.0.1:${server.address().port}` })
	} finally {
		server.closeAllConnections()
		await new Promise((resolve) => server.close(resolve))
		rmSync(root, { recursive: true, force: true })
	}
}

it('serves files inside a configured workshop asset directory', async () => {
	await withAssetServer(async ({ app, url }) => {
		writeFileSync(join(app, 'public/icon.txt'), 'PUBLIC_ASSET')
		const response = await fetch(`${url}/@workshop-assets/pictures/icon.txt`)
		expect(response.status).toBe(200)
		expect(await response.text()).toBe('PUBLIC_ASSET')
	})
})

it('rejects asset symlinks whose destination escapes the configured directory', async () => {
	await withAssetServer(async ({ root, app, url }) => {
		writeFileSync(join(root, 'private.env'), 'WORKSHOP_PRIVATE_SENTINEL')
		symlinkSync(join(root, 'private.env'), join(app, 'public/linked.txt'))
		const response = await fetch(`${url}/@workshop-assets/pictures/linked.txt`)
		const body = await response.text()
		expect(response.status).toBe(404)
		expect(body).not.toContain('WORKSHOP_PRIVATE_SENTINEL')
	})
})

it('serves safe asset aliases through a symlinked configured root', async () => {
	await withAssetServer(async ({ app, url }) => {
		writeFileSync(join(app, 'public/icon.txt'), 'PUBLIC_ASSET')
		symlinkSync('icon.txt', join(app, 'public/alias.txt'))
		renameSync(join(app, 'public'), join(app, 'actual-public'))
		symlinkSync(join(app, 'actual-public'), join(app, 'public'))
		const response = await fetch(`${url}/@workshop-assets/pictures/alias.txt`)
		expect(response.status).toBe(200)
		expect(await response.text()).toBe('PUBLIC_ASSET')
	})
})

it('rejects directory escapes, prefix lookalikes and broken asset links', async () => {
	await withAssetServer(async ({ app, url }) => {
		mkdirSync(join(app, 'public-private'))
		writeFileSync(join(app, 'public-private/private.txt'), 'PRIVATE_SENTINEL')
		symlinkSync(join(app, 'public-private'), join(app, 'public/escape'))
		symlinkSync(join(app, 'public/missing.txt'), join(app, 'public/broken.txt'))
		for (const path of ['escape/private.txt', 'broken.txt', 'missing.txt', '']) {
			const response = await fetch(`${url}/@workshop-assets/pictures/${path}`)
			expect(response.status).toBe(404)
			expect(await response.text()).not.toContain('PRIVATE_SENTINEL')
		}
	})
})

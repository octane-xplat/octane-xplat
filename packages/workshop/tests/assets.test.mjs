import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
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
	shell.configureServer({ middlewares: { use(handler) { middleware = handler } } })
	const server = createServer((req, res) => middleware(req, res, () => {
		res.statusCode = 404
		res.end('not found')
	}))
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

it.fails('rejects asset symlinks whose destination escapes the configured directory', async () => {
	await withAssetServer(async ({ root, app, url }) => {
		writeFileSync(join(root, 'private.env'), 'WORKSHOP_PRIVATE_SENTINEL')
		symlinkSync(join(root, 'private.env'), join(app, 'public/linked.txt'))
		const response = await fetch(`${url}/@workshop-assets/pictures/linked.txt`)
		const body = await response.text()
		expect(response.status).toBe(404)
		expect(body).not.toContain('WORKSHOP_PRIVATE_SENTINEL')
	})
})

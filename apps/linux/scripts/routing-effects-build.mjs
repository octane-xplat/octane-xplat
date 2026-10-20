// Add the real Linux bridge required by the host's normal self-test readiness
// check. Keep the already-qualified routing bundle unchanged in a new directory.
import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const args = process.argv.slice(2)
assert.equal(
	args.length,
	2,
	'Usage: node scripts/routing-effects-build.mjs ROUTING_ARTIFACT OUTPUT_PARENT',
)

const input = await realpath(resolve(args[0]))
await readFile(join(input, 'index.html'))
const parent = resolve(args[1])
await mkdir(parent, { recursive: true })
const output = await realpath(await mkdtemp(join(parent, 'linux-routing-effects-')))
try {
	await cp(input, output, { recursive: true })
	await build({
		configFile: false,
		logLevel: 'warn',
		build: {
			outDir: output,
			emptyOutDir: false,
			target: 'es2020',
			lib: {
				entry: fileURLToPath(
					new URL('../../../packages/platform/src/bridge.linux.ts', import.meta.url),
				),
				formats: ['es'],
				fileName: () => 'routing-host-bootstrap.linux.js',
			},
		},
	})

	const html = await readFile(join(output, 'index.html'), 'utf8')
	assert.ok(html.includes('</head>'), 'Expected the production routing HTML document')
	await writeFile(
		join(output, 'index.html'),
		html.replace(
			'</head>',
			'<script type="module" src="/routing-host-bootstrap.linux.js"></script></head>',
		),
	)

	console.log(JSON.stringify({ linuxArtifactDirectory: output }))
} catch (error) {
	await rm(output, { recursive: true, force: true })
	throw error
}

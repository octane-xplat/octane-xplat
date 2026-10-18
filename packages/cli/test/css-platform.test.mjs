import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, test } from 'node:test'
import { build, createServer } from 'vite'
import { xplatCss } from '../dist/css-platform.js'

const temporary = []
function fixture(files) {
	const root = mkdtempSync(join(tmpdir(), 'xplat-css-'))
	temporary.push(root)
	for (const [file, contents] of Object.entries(files)) {
		mkdirSync(join(root, file, '..'), { recursive: true })
		writeFileSync(join(root, file), contents)
	}
	return root
}
afterEach(() =>
	temporary.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })),
)

async function bundle(root, platform) {
	const result = await build({
		configFile: false,
		root,
		logLevel: 'silent',
		plugins: [xplatCss(platform)],
		build: {
			write: false,
			minify: false,
			lib: { entry: join(root, 'main.js'), formats: ['es'], cssFileName: 'styles' },
		},
	})
	return (Array.isArray(result) ? result.flatMap((output) => output.output) : result.output)
		.filter((file) => file.type === 'asset' && file.fileName.endsWith('.css'))
		.map((file) => file.source)
		.join('\n')
}

for (const [target, expected] of [
	['web', 'web'],
	['ios', 'ios'],
	['android', 'mobile'],
	['macos', 'default'],
	['windows', 'default'],
	['gtk', 'default'],
]) {
	test(`CSS suffix replacement on ${target}`, async () => {
		const root = fixture({
			'main.js': "import './card.css'",
			'card.css': '.default { color: black }',
			'card.web.css': '.web { color: blue }',
			'card.mobile.css': '.mobile { color: green }',
			'card.ios.css': '.ios { color: red }',
		})
		const css = await bundle(root, target)
		assert.match(css, new RegExp(`\\.${expected}\\s*\\{`))
		for (const name of ['web', 'ios', 'mobile', 'default'].filter((name) => name !== expected))
			assert.ok(!css.includes(`.${name} {`), css)
	})
}

test('explicit platform imports stay exact and composition stays explicit', async () => {
	const root = fixture({
		'main.js': "import './shared.css'; import './card.web.css'",
		'shared.css': '.shared { color: black }',
		'card.web.css': '.web { color: blue }',
		'card.web.ios.css': '.wrong { color: red }',
	})
	const css = await bundle(root, 'ios')
	assert.match(css, /\.shared/)
	assert.match(css, /\.web/)
	assert.doesNotMatch(css, /\.wrong/)
})

test('CSS @import selects siblings, including suffix-only files', async () => {
	const root = fixture({
		'main.js': "import './entry.css'",
		'entry.css': '@import "./card.css";',
		'card.web.css': '.web { color: blue }',
	})
	assert.match(await bundle(root, 'web'), /\.web/)
})

test('dev serving selects siblings and preserves inline query imports', async () => {
	const root = fixture({
		'card.css': '.base { color: black }',
		'card.web.css': '.web { color: blue }',
	})
	const server = await createServer({
		configFile: false,
		root,
		logLevel: 'silent',
		plugins: [xplatCss('web')],
		server: { middlewareMode: true },
	})
	try {
		const result = await server.transformRequest('/card.css?inline')
		assert.match(result.code, /\.web/)
		assert.doesNotMatch(result.code, /\.base/)
	} finally {
		await server.close()
	}
})

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
	['visionos', 'ios'],
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
		for (const name of ['web', 'ios', 'mobile', 'default'].filter((name) => name !== expected)) {
			assert.ok(!css.includes(`.${name} {`), css)
		}
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

for (const platform of ['web', 'ios', 'android', 'macos', 'windows', 'gtk']) {
	test(`platform blocks preserve matching rules on ${platform}`, async () => {
		const root = fixture({
			'main.js': "import './entry.css'",
			'entry.css': `@import './imported.css';
@layer app {
.card { color: black }
@platform web { .card { cursor: pointer } @keyframes pulse { to { opacity: 0 } } }
@platform mobile { @media (min-width: 1px) { .mobile { color: green } } }
@platform ios { .ios { color: red } }
@platform native { .native { color: blue } }
@platform web { @platform ios { .never { color: red } } }
.card { color: white }
}`,
			'imported.css':
				'@platform web { .imported { user-select: none } } @platform android { .android { color: red } }',
		})
		const css = await bundle(root, platform)
		assert.doesNotMatch(css, /@platform|\.never/)
		assert.match(css, /@layer app/)
		assert.ok(css.indexOf('black') < css.indexOf('white'))
		assert.equal(css.includes('cursor'), platform === 'web')
		assert.equal(css.includes('@keyframes'), platform === 'web')
		assert.equal(css.includes('.imported'), platform === 'web')
		assert.equal(css.includes('.native'), platform !== 'web')
		assert.equal(css.includes('.mobile'), platform === 'ios' || platform === 'android')
		assert.equal(css.includes('.ios'), platform === 'ios')
		assert.equal(css.includes('.android'), platform === 'android')
	})
}

test('rejects unknown platform names even inside excluded blocks', async () => {
	const root = fixture({
		'main.js': "import './entry.css'",
		'entry.css': '@platform ios { @platform typo { .bad { color: red } } }',
	})
	await assert.rejects(bundle(root, 'web'), /Expected @platform/)
})

test('rejects platform statements without a block', async () => {
	const root = fixture({ 'main.js': "import './entry.css'", 'entry.css': '@platform web;' })
	await assert.rejects(bundle(root, 'web'), /Expected @platform/)
})

test('preserves existing PostCSS config and filters inlined imports', async () => {
	const root = fixture({
		'main.js': "import './entry.css'",
		'entry.css': '@import "./imported.css";',
		'imported.css': '@platform web { .card { color: red } }',
		'postcss.config.cjs': `module.exports = { plugins: [{ postcssPlugin: 'test-color', Declaration(d) { if (d.value === 'red') d.value = 'blue' } }] }`,
	})
	const css = await bundle(root, 'web')
	assert.match(css, /blue/)
	assert.doesNotMatch(css, /@platform|red/)
})

test('honors user aliases before CSS sibling selection', async () => {
	const root = fixture({
		'main.js': "import '@styles/card.css'",
		'styles/card.css': '.base { color: black }',
		'styles/card.web.css': '.web { color: blue }',
	})
	const outputs = await build({
		configFile: false,
		root,
		logLevel: 'silent',
		plugins: [xplatCss('web')],
		resolve: { alias: { '@styles': join(root, 'styles') } },
		build: {
			write: false,
			lib: { entry: join(root, 'main.js'), formats: ['es'], cssFileName: 'styles' },
		},
	})
	const css = (Array.isArray(outputs) ? outputs : [outputs])
		.flatMap((output) => output.output)
		.filter((file) => file.type === 'asset')
		.map((file) => file.source)
		.join('\n')
	assert.match(css, /\.web/)
	assert.doesNotMatch(css, /\.base/)
})

test('adding and removing a sibling reselects the dev import', async () => {
	const root = fixture({ 'main.js': "import './card.css'", 'card.css': '.base { color: black }' })
	const server = await createServer({
		configFile: false,
		root,
		logLevel: 'silent',
		plugins: [xplatCss('web')],
		server: { middlewareMode: true },
	})
	try {
		assert.match((await server.transformRequest('/main.js')).code, /card\.css/)
		writeFileSync(join(root, 'card.web.css'), '.web { color: blue }')
		server.watcher.emit('add', join(root, 'card.web.css'))
		await server.restart()
		assert.match((await server.transformRequest('/main.js')).code, /card\.web\.css/)
		rmSync(join(root, 'card.web.css'))
		server.watcher.emit('unlink', join(root, 'card.web.css'))
		await server.restart()
		assert.doesNotMatch((await server.transformRequest('/main.js')).code, /card\.web\.css/)
	} finally {
		await server.close()
	}
})

test('raw CSS imports keep raw text while selecting a platform sibling', async () => {
	const root = fixture({ 'card.web.css': '@platform web { .card { color: blue } }' })
	const server = await createServer({
		configFile: false,
		root,
		logLevel: 'silent',
		plugins: [xplatCss('web')],
		server: { middlewareMode: true },
	})
	try {
		const result = await server.transformRequest('/card.web.css?raw')
		assert.match(result.code, /@platform web/)
	} finally {
		await server.close()
	}
})

for (const platform of ['web', 'ios', 'android', 'macos']) {
	test(`comma-separated platform targets use OR on ${platform}`, async () => {
		const root = fixture({
			'main.js': "import './entry.css'",
			'entry.css': `@import './imported.css';
@layer app {
.before { color: black }
@platform web, /* either target */ ios, web {
  .either { color: blue }
  @platform mobile, macos { .both { color: green } }
}
@platform mobile, macos { .group { color: red } }
.after { color: white }
}`,
			'imported.css': '@platform web, ios { .imported { color: blue } }',
		})
		const css = await bundle(root, platform)
		assert.doesNotMatch(css, /@platform/)
		assert.match(css, /@layer app/)
		assert.equal(css.includes('.either'), platform === 'web' || platform === 'ios')
		assert.equal(css.includes('.imported'), platform === 'web' || platform === 'ios')
		assert.equal(css.includes('.both'), platform === 'ios')
		assert.equal(css.includes('.group'), platform !== 'web')
		if (platform === 'web' || platform === 'ios') {
			assert.equal(css.match(/\.either\s*\{/g).length, 1)
			assert.ok(css.indexOf('.before') < css.indexOf('.either'))
			assert.ok(css.indexOf('.either') < css.indexOf('.after'))
		}
	})
}

for (const condition of [
	'web, typo',
	'typo, web',
	',web',
	'web,',
	'web,,ios',
	'',
	'web ios',
	'we/* split identifier */b',
]) {
	test(`rejects invalid platform list ${JSON.stringify(condition)}`, async () => {
		const root = fixture({
			'main.js': "import './entry.css'",
			'entry.css': `@platform android { @platform ${condition} { .bad { color: red } } }`,
		})
		await assert.rejects(bundle(root, 'web'), /Expected @platform/)
	})
}

import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { SourceMap } from 'node:module'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, type TestContext } from 'node:test'
import postcss from 'postcss'
import officialTailwind from '@tailwindcss/postcss'
import { build, createServer, resolveConfig } from 'vite'
import { xplatCss } from '@octane-xplat/build/vite'
import { tailwindCompiler } from '../src/compiler.ts'
import { xplatTailwind } from '../src/vite.ts'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))

async function fixture(t: TestContext, shutdowns: Array<() => Promise<void>> = []) {
  const scratch = join(homedir(), 'agent-scratch/octane-xplat')
  await mkdir(scratch, { recursive: true })
  const root = await mkdtemp(join(scratch, 'tailwind-integration-'))
  t.after(async () => {
    // Stop watchers before removing package.json; deletion can restart Vite.
    for (const shutdown of shutdowns.toReversed()) await shutdown()
    await rm(root, { recursive: true, force: true })
  })
  await writeFile(
    join(root, 'README.md'),
    `Everything in this folder is disposable.\n\nOwned by the Tailwind compiler test fixture. Authoritative sources: ${packageRoot}.\nRetained results belong in the invoking task's reports directory.\n`,
  )
  await mkdir(join(root, 'node_modules/@octane-xplat'), { recursive: true })
  await symlink(
    packageRoot,
    join(root, 'node_modules/@octane-xplat/tailwind'),
    process.platform === 'win32' ? 'junction' : 'dir',
  )
  await writeFile(join(root, 'package.json'), '{"type":"module"}')
  return root
}

async function buildCss(root: string) {
  const built = await build({
    configFile: false,
    root,
    logLevel: 'silent',
    plugins: [xplatCss('web'), xplatTailwind()],
    build: {
      write: false,
      sourcemap: true,
      cssMinify: false,
      rollupOptions: { input: join(root, 'main.js') },
    },
  })
  assert.ok(!Array.isArray(built) && 'output' in built)
  return built.output
    .filter((file) => file.type === 'asset')
    .map((file) => ({
      name: file.fileName,
      source: typeof file.source === 'string' ? file.source : new TextDecoder().decode(file.source),
    }))
}

test('Vite compiles original TSX and TSRX class names and preserves authored CSS without Preflight', async (t) => {
  const root = await fixture(t)
  await writeFile(join(root, 'main.js'), 'import "./styles.css"')
  await writeFile(
    join(root, 'Demo.tsx'),
    'export const Demo = () => <div className="p-4 opacity-50" />',
  )
  await writeFile(
    join(root, 'Template.web.tsrx'),
    '/** @jsxImportSource @octane-xplat/jsx/dom */\nexport function Template() @{ <div className="gap-9" /> }',
  )
  await writeFile(
    join(root, 'styles.css'),
    '@import "@octane-xplat/tailwind";\n@source "./Demo.tsx";\n.authored { opacity: .7 }',
  )
  const assets = await buildCss(root)
  const css = assets
    .filter((file) => file.name.endsWith('.css'))
    .map((file) => file.source)
    .join('\n')
  assert.match(css, /\.p-4\s*\{/)
  assert.match(css, /\.opacity-50\s*\{/)
  assert.match(css, /\.gap-9\s*\{/)
  assert.match(css, /\.authored\s*\{/)
  assert.doesNotMatch(css, /@xplat-tailwind|@tailwind|@source/)
  assert.doesNotMatch(css, /box-sizing:\s*border-box/)
})

test('ordinary app CSS bypasses Tailwind compilation on native targets', async () => {
  const source = '.custom { display: grid; accent-color: red }'
  const result = await postcss([tailwindCompiler({ root: packageRoot, target: 'ios' })]).process(
    source,
    {
      from: join(packageRoot, 'ordinary.css'),
    },
  )
  assert.equal(result.css, source)
})

test('Vite rebuild scans source additions and changed complete class names', async (t) => {
  const root = await fixture(t)
  await writeFile(join(root, 'main.js'), 'import "./styles.css"')
  await writeFile(join(root, 'styles.css'), '@import "@octane-xplat/tailwind";')
  await writeFile(join(root, 'Demo.tsx'), 'export const classes = "p-4"')
  const initial = (await buildCss(root))
    .filter((file) => file.name.endsWith('.css'))
    .map((file) => file.source)
    .join('')
  assert.doesNotMatch(initial, /\.gap-7\s*\{/)
  await writeFile(join(root, 'Added.tsx'), 'export const classes = "gap-7"')
  const updated = (await buildCss(root))
    .filter((file) => file.name.endsWith('.css'))
    .map((file) => file.source)
    .join('')
  assert.match(updated, /\.gap-7\s*\{/)
})

test('platform ownership and duplicate compiler configuration fail explicitly', async (t) => {
  const root = await fixture(t)
  await assert.rejects(
    resolveConfig({ configFile: false, root, plugins: [xplatTailwind()] }, 'build'),
    /exactly one Xplat/,
  )
  await assert.rejects(
    resolveConfig(
      { configFile: false, root, plugins: [xplatCss('web'), xplatTailwind(), xplatTailwind()] },
      'build',
    ),
    /once/,
  )
  await assert.rejects(
    resolveConfig(
      {
        configFile: false,
        root,
        plugins: [xplatCss('web'), xplatTailwind()],
        css: { postcss: { plugins: [officialTailwind()] } },
      },
      'build',
    ),
    /separate Tailwind PostCSS/,
  )
  await assert.rejects(
    resolveConfig(
      {
        configFile: false,
        root,
        plugins: [xplatCss('web'), xplatTailwind()],
        css: { postcss: { plugins: [officialTailwind] } },
      },
      'build',
    ),
    /separate Tailwind PostCSS/,
  )
})

test('native compiler refuses unqualified output with the source filename', async () => {
  const source = '@xplat-tailwind; @tailwind utilities; @source inline("flex");'
  await assert.rejects(
    postcss([tailwindCompiler({ root: packageRoot, target: 'ios' })])
      .process(source, {
        from: join(packageRoot, 'app.css'),
      })
      .async(),
    /app\.css.*Native Tailwind adaptation for ios/,
  )
})

test('compiler source maps retain the authored CSS location', async () => {
  const source =
    '@xplat-tailwind; @tailwind utilities; @source inline("opacity-50");\n.authored { opacity: .7 }'
  const result = await postcss([tailwindCompiler({ root: packageRoot, target: 'web' })]).process(
    source,
    {
      from: join(packageRoot, 'mapped.css'),
      map: { inline: false, annotation: false },
    },
  )
  assert.ok(result.map)
  const payload = result.map.toJSON()
  const map = new SourceMap({
    ...payload,
    version: Number(payload.version),
    file: payload.file ?? 'mapped.css',
    sourceRoot: payload.sourceRoot ?? '',
    sourcesContent: (payload.sourcesContent ?? []).map((content) => content ?? ''),
  })
  const line = result.css.slice(0, result.css.indexOf('.authored')).split('\n').length
  const origin = map.findOrigin(line, 1)
  assert.ok('lineNumber' in origin && 'fileName' in origin)
  assert.equal(origin.lineNumber, 2)
  assert.match(String(origin.fileName), /mapped\.css$/)
})

test('Vite development output retains CSS maps and watches source additions', async (t) => {
  const shutdowns: Array<() => Promise<void>> = []
  const root = await fixture(t, shutdowns)
  await writeFile(join(root, 'main.js'), 'import "./styles.css"')
  await writeFile(join(root, 'styles.css'), '@import "@octane-xplat/tailwind";')
  await writeFile(join(root, 'Demo.tsx'), 'export const classes = "p-4"')
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
    plugins: [xplatCss('web'), xplatTailwind()],
    css: { devSourcemap: true },
    optimizeDeps: { noDiscovery: true },
    server: { host: '127.0.0.1', port: 0 },
  })
  shutdowns.push(() => server.close())
  await server.listen()
  const initial = await server.transformRequest('/styles.css?direct')
  assert.ok(initial)
  assert.match(initial.code, /\.p-4\s*\{/)
  assert.ok(initial.map?.mappings, 'Vite must retain the compiler CSS map')
  const changed = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      server.watcher.off('add', added)
      reject(new Error('Vite did not observe added source'))
    }, 5000)
    const added = (path: string) => {
      if (path.endsWith('Added.tsx')) {
        clearTimeout(timer)
        server.watcher.off('add', added)
        resolve()
      }
    }
    server.watcher.on('add', added)
  })
  await writeFile(join(root, 'Added.tsx'), 'export const classes = "gap-7"')
  await changed
  const deadline = Date.now() + 5000
  let updated = ''
  while (Date.now() < deadline) {
    updated = (await server.transformRequest('/styles.css?direct'))?.code ?? ''
    if (/\.gap-7\s*\{/.test(updated)) break
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  assert.match(updated, /\.gap-7\s*\{/)
})

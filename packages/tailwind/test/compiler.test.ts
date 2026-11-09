import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { SourceMap } from 'node:module'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, type TestContext } from 'node:test'
import postcss, { type ChildNode } from 'postcss'
import officialTailwind from '@tailwindcss/postcss'
import { build, createServer, resolveConfig } from 'vite'
import { pxToDip, css as platformCss } from '@octane-xplat/build/vite'
import { tailwindCompiler } from '../src/compiler.ts'
import { tailwind } from '../src/vite.ts'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))

type CssShape = { type: string; fields: string[]; children?: CssShape[] }

function cssShape(node: ChildNode): CssShape[] {
  if (node.type === 'comment') {
    return []
  }

  if (node.type === 'decl') {
    return [{ type: node.type, fields: [node.prop, node.value, String(Boolean(node.important))] }]
  }

  return [
    {
      type: node.type,
      fields: node.type === 'rule' ? [node.selector] : [node.name, node.params],
      children: node.nodes?.flatMap(cssShape),
    },
  ]
}

test('fresh compiler web output matches the official PostCSS compiler', async () => {
  const input =
    (await readFile(join(packageRoot, 'src/index.css'), 'utf8')).replace(
      'layer(utilities);',
      'layer(utilities) source(none);',
    ) +
    '\n@source inline("p-4 flex grid absolute border font-bold shadow-xl translate-x-4 hover:bg-red-500 dark:text-white md:w-1/2");\n.authored { --custom: 3px; color: var(--custom) }'

  const from = join(packageRoot, 'src/index.css')
  const actual = await postcss([tailwindCompiler({ root: packageRoot, target: 'web' })]).process(
    input,
    { from },
  )

  const expected = await postcss([
    officialTailwind({ base: packageRoot, optimize: false }),
  ]).process(input.replace('@xplat-tailwind;', ''), { from })

  assert.deepEqual(actual.root.nodes.flatMap(cssShape), expected.root.nodes.flatMap(cssShape))
})

async function fixture(t: TestContext, shutdowns: Array<() => Promise<void>> = []) {
  const scratch = join(homedir(), 'agent-scratch/octane-xplat')

  await mkdir(scratch, { recursive: true })

  const root = await mkdtemp(join(scratch, 'tailwind-integration-'))

  t.after(async () => {
    // Stop watchers before removing package.json; deletion can restart Vite.
    for (const shutdown of shutdowns.toReversed()) {
      await shutdown()
    }

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

  await symlink(
    fileURLToPath(new URL('../../ui', import.meta.url)),
    join(root, 'node_modules/@octane-xplat/ui'),
    process.platform === 'win32' ? 'junction' : 'dir',
  )

  await writeFile(join(root, 'package.json'), '{"type":"module"}')
  return root
}

async function buildCss(
  root: string,
  target: 'web' | 'ios' | 'linux' = 'web',
  conditions?: string[],
) {
  const built = await build({
    configFile: false,
    root,
    logLevel: 'silent',
    plugins: [platformCss(target), tailwind(), ...(target === 'ios' ? [pxToDip()] : [])],
    resolve: { conditions },
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
    resolveConfig({ configFile: false, root, plugins: [tailwind()] }, 'build'),
    /exactly one Xplat/,
  )

  await assert.rejects(
    resolveConfig(
      { configFile: false, root, plugins: [platformCss('web'), tailwind(), tailwind()] },
      'build',
    ),
    /once/,
  )

  await assert.rejects(
    resolveConfig(
      {
        configFile: false,
        root,
        plugins: [platformCss('web'), tailwind()],
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
        plugins: [platformCss('web'), tailwind()],
        css: { postcss: { plugins: [officialTailwind] } },
      },
      'build',
    ),
    /separate Tailwind PostCSS/,
  )
})

test('native compiler reports unsupported output with the source filename', async () => {
  const source = '@xplat-tailwind; @tailwind utilities; @source inline("backdrop-blur-lg");'

  await assert.rejects(
    postcss([tailwindCompiler({ root: packageRoot, target: 'ios' })])
      .process(source, {
        from: join(packageRoot, 'app.css'),
      })
      .async(),
    /app\.css[\s\S]*\[ios\] Tailwind/,
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
    plugins: [platformCss('web'), tailwind()],
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
    if (/\.gap-7\s*\{/.test(updated)) {
      break
    }

    await new Promise((resolve) => setTimeout(resolve, 20))
  }

  assert.match(updated, /\.gap-7\s*\{/)
})

test('Vite native compilation retains coordinated layers and normalizes generated units once', async (t) => {
  const root = await fixture(t)

  await writeFile(join(root, 'main.js'), 'import "./styles.css"')
  await writeFile(join(root, 'styles.css'), '@import "@octane-xplat/tailwind";')
  await writeFile(
    join(root, 'Screen.tsx'),
    'export const classes = "flex gap-4 w-8 sm:opacity-50 w-[12px]"',
  )

  const assets = await buildCss(root, 'ios')
  const css = assets
    .filter((file) => file.name.endsWith('.css'))
    .map((file) => file.source)
    .join('\n')

  assert.match(css, /@layer utilities/)
  assert.match(css, /--spacing:\s*4dip/)
  assert.match(css, /min-width:\s*640px/)
  assert.doesNotMatch(css, /640dip|dipdip|0\.25rem/)
  assert.ok(css.includes(String.raw`.w-\[12px\]`))
  assert.match(css, /width:\s*12dip/)
})

test('the packaged UI CSS entry composes its compiler entry and runtime token registrations', async (t) => {
  const root = await fixture(t)

  await writeFile(join(root, 'main.js'), 'import "./styles.css"')
  await writeFile(
    join(root, 'styles.css'),
    '@import "@octane-xplat/tailwind/ui.css";\n:root, .ns-root { --color-primary: #112233; --radius-container: 18px }',
  )

  await writeFile(
    join(root, 'Screen.tsrx'),
    'export const classes = "bg-primary rounded-container"',
  )

  for (const target of ['web', 'ios'] as const) {
    const css = (await buildCss(root, target)).map((asset) => asset.source).join('\n')

    assert.match(css, /background-color:\s*var\(--color-primary\)/)
    assert.match(css, /border-radius:\s*var\(--radius-container\)/)
    assert.doesNotMatch(css, /--color-primary:\s*var\(--color-primary\)/)
    assert.doesNotMatch(css, /@theme|@xplat-tailwind/)
  }
})

test('curated utility imports are rejected even when they are separate CSS modules', async (t) => {
  const root = await fixture(t)

  await writeFile(
    join(root, 'main.js'),
    'import "@octane-xplat/ui/theme/utilities.css"; import "./styles.css"',
  )

  await writeFile(join(root, 'styles.css'), '@import "@octane-xplat/tailwind/ui.css";')
  await assert.rejects(buildCss(root), /Remove @octane-xplat\/ui\/theme\/utilities.css/)
})

test('UI structure and chrome compose with generated utilities without duplicate class rules', async (t) => {
  const root = await fixture(t)

  await writeFile(
    join(root, 'main.js'),
    'import "@octane-xplat/ui/theme/tokens.css"; import "@octane-xplat/ui/theme/chrome.css"; import "./styles.css"',
  )

  await writeFile(join(root, 'styles.css'), '@import "@octane-xplat/tailwind/ui.css";')
  await writeFile(
    join(root, 'Screen.tsx'),
    'export const classes = "gap-4 text-sm bg-primary rounded-lg"',
  )

  const css = (await buildCss(root)).map((asset) => asset.source).join('\n')
  const stylesheet = postcss.parse(css)
  const counts = new Map<string, number>()

  stylesheet.walkRules((rule) => {
    counts.set(rule.selector, (counts.get(rule.selector) ?? 0) + 1)
  })

  for (const name of ['gap-4', 'text-sm', 'bg-primary', 'rounded-lg']) {
    assert.equal(counts.get(`.${name}`), 1, name)
  }

  assert.match(css, /font-size:\s*var\(--text-sm\)/)
  assert.doesNotMatch(css, /\.text-sm\s*\{[^}]*min-height/)
})

test('inlined source directives resolve relative to their original stylesheet', async (t) => {
  const root = await fixture(t)

  await mkdir(join(root, 'nested/templates'), { recursive: true })
  await writeFile(join(root, 'main.js'), 'import "./styles.css"')
  await writeFile(
    join(root, 'styles.css'),
    '@import "@octane-xplat/tailwind" source(none); @import "./nested/sources.css";',
  )

  await writeFile(join(root, 'nested/sources.css'), '@source "./templates";')
  await writeFile(join(root, 'nested/templates/Screen.tsrx'), 'export const classes = "opacity-55"')
  await writeFile(join(root, 'Unscanned.tsx'), 'export const classes = "opacity-65"')

  const css = (await buildCss(root)).map((asset) => asset.source).join('\n')

  assert.match(css, /\.opacity-55\s*\{/)
  assert.doesNotMatch(css, /\.opacity-65\s*\{/)
})

test('the global compiler entry reports CSS Module misuse explicitly', async () => {
  await assert.rejects(
    postcss([tailwindCompiler({ root: packageRoot, target: 'web' })])
      .process('@xplat-tailwind; @tailwind utilities;', {
        from: join(packageRoot, 'styles.module.css'),
      })
      .async(),
    /global stylesheet, outside CSS Modules/,
  )
})

test('native development recovers after an unsupported utility is removed', async (t) => {
  const shutdowns: Array<() => Promise<void>> = []
  const root = await fixture(t, shutdowns)

  await writeFile(join(root, 'main.js'), 'import "./styles.css"')
  await writeFile(join(root, 'styles.css'), '@import "@octane-xplat/tailwind";')

  const source = join(root, 'Screen.tsx')

  await writeFile(source, 'export const classes = "fixed"')

  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
    plugins: [platformCss('ios'), tailwind()],
    optimizeDeps: { noDiscovery: true },
    server: { host: '127.0.0.1', port: 0 },
  })

  shutdowns.push(() => server.close())
  await server.listen()
  await assert.rejects(server.transformRequest('/styles.css?direct'), /fixed/)

  const changed = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      server.watcher.off('change', listener)
      reject(new Error('Vite did not observe corrected source'))
    }, 5000)

    const listener = (path: string) => {
      if (path !== source) {
        return
      }

      clearTimeout(timer)
      server.watcher.off('change', listener)
      resolve()
    }

    server.watcher.on('change', listener)
  })

  await writeFile(source, 'export const classes = "flex"')
  await changed

  const recovered = await server.transformRequest('/styles.css?direct')

  assert.ok(recovered)
  assert.match(recovered.code, /display:\s*flex/)
  assert.doesNotMatch(recovered.code, /position:\s*fixed/)
})

test('official scanning selects Xplat platform leaves before generating native utilities', async (t) => {
  const root = await fixture(t)
  const leaves = join(root, 'leaves')

  await mkdir(leaves)
  for (const [suffix, classes] of [
    ['', 'opacity-10'],
    ['.web', 'hover:opacity-20'],
    ['.mobile', 'opacity-30'],
    ['.ios', 'opacity-40'],
    ['.android', 'opacity-50'],
    ['.macos', 'opacity-60'],
    ['.gtk', 'opacity-70'],
    ['.linux', 'opacity-80'],
    ['.windows', 'opacity-90'],
  ]) {
    await writeFile(join(leaves, `Screen${suffix}.tsx`), `export const classes = "${classes}"`)
  }

  await writeFile(join(leaves, 'Shared.tsrx'), 'export const classes = "opacity-25"')

  const source = '@xplat-tailwind; @tailwind utilities source(none); @source "./leaves";'

  for (const [target, expected] of [
    ['web', String.raw`.hover\:opacity-20:hover`],
    ['ios', '.opacity-40'],
    ['android', '.opacity-50'],
    ['visionos', '.opacity-40'],
    ['macos', '.opacity-60'],
    ['gtk', '.opacity-70'],
    ['linux', '.opacity-80'],
  ] as const) {
    const result = await postcss([tailwindCompiler({ root, target })]).process(source, {
      from: join(root, 'styles.css'),
    })

    const selectors: string[] = []

    result.root.walkRules((rule) => {
      if (rule.selector.startsWith('.')) {
        selectors.push(rule.selector)
      }
    })

    assert.ok(selectors.includes('.opacity-25'), `${target}: shared source`)
    assert.ok(
      selectors.includes(expected),
      `${target}: selected leaf; got ${JSON.stringify(selectors)}`,
    )

    assert.equal(selectors.length, 2, `${target}: foreign and shadowed leaves must be absent`)
  }
})

test('Vite development restores fallback classes after a preferred leaf is deleted', async (t) => {
  const shutdowns: Array<() => Promise<void>> = []
  const root = await fixture(t, shutdowns)

  await writeFile(join(root, 'main.js'), 'import "./styles.css"')
  await writeFile(join(root, 'styles.css'), '@import "@octane-xplat/tailwind";')
  await writeFile(join(root, 'Screen.tsx'), 'export const classes = "opacity-35"')

  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
    plugins: [platformCss('web'), tailwind()],
    optimizeDeps: { noDiscovery: true },
    server: { host: '127.0.0.1', port: 0 },
  })

  shutdowns.push(() => server.close())
  await server.listen()

  const initial = (await server.transformRequest('/styles.css?direct'))?.code ?? ''

  assert.match(initial, /\.opacity-35\s*\{/)
  assert.doesNotMatch(initial, /\.opacity-65\s*\{/)

  const preferred = join(root, 'Screen.web.tsx')

  async function change(
    event: 'add' | 'change' | 'unlink',
    action: () => Promise<void>,
    present: string,
    absent: string,
  ) {
    const observed = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        server.watcher.off(event, listener)
        reject(new Error(`Vite did not observe ${event}: ${preferred}`))
      }, 5000)

      const listener = (file: string) => {
        if (file === preferred) {
          clearTimeout(timer)
          server.watcher.off(event, listener)
          resolve()
        }
      }

      server.watcher.on(event, listener)
    })

    await action()
    await observed

    const deadline = Date.now() + 5000
    let css = ''

    while (Date.now() < deadline) {
      css = (await server.transformRequest('/styles.css?direct'))?.code ?? ''
      if (css.includes(present) && !css.includes(absent)) {
        break
      }

      await new Promise((resolve) => setTimeout(resolve, 20))
    }

    assert.ok(css.includes(present), `${event}: selected class missing`)
    assert.ok(!css.includes(absent), `${event}: old class survived`)
  }

  await change(
    'add',
    () => writeFile(preferred, 'export const classes = "opacity-65"'),
    '.opacity-65',
    '.opacity-35',
  )

  await change(
    'change',
    () => writeFile(preferred, 'export const classes = "opacity-75"'),
    '.opacity-75',
    '.opacity-65',
  )

  await change('unlink', () => rm(preferred), '.opacity-35', '.opacity-75')
})

test('explicit sources include installed and workspace packages with platform selection', async (t) => {
  const root = await fixture(t)
  const workspace = await fixture(t)
  const installed = join(root, 'node_modules/@fixture/components')

  await mkdir(installed, { recursive: true })
  await writeFile(
    join(installed, 'package.json'),
    '{"name":"@fixture/components","version":"1.0.0"}',
  )

  await writeFile(join(installed, 'Card.tsx'), 'export const classes = "opacity-15"')
  await writeFile(join(installed, 'Card.web.tsx'), 'export const classes = "hover:opacity-45"')
  await writeFile(join(workspace, 'Shared.tsrx'), 'export const classes = "opacity-85"')
  await writeFile(join(root, 'Screen.tsx'), 'export const classes = "opacity-95"')
  await writeFile(join(root, 'main.js'), 'import "./styles.css"')
  await writeFile(
    join(root, 'styles.css'),
    `@import "@octane-xplat/tailwind" source(none);
@source "./node_modules/@fixture/components";
@source ${JSON.stringify(workspace.replaceAll('\\', '/'))};`,
  )

  const css = (await buildCss(root, 'ios')).map((asset) => asset.source).join('\n')

  assert.match(css, /\.opacity-15\s*\{/)
  assert.match(css, /\.opacity-85\s*\{/)
  assert.doesNotMatch(css, /opacity-45|opacity-95/)
})

test('client CSS and SSR inline styles stay isolated across concurrent projects', async (t) => {
  const shutdowns: Array<() => Promise<void>> = []
  const projects = await Promise.all([fixture(t, shutdowns), fixture(t, shutdowns)])
  const servers = await Promise.all(
    projects.map(async (root, index) => {
      await writeFile(join(root, 'main.js'), 'import "./styles.css"')
      await writeFile(join(root, 'styles.css'), '@import "@octane-xplat/tailwind";')
      await writeFile(
        join(root, 'Screen.tsx'),
        `export const classes = "opacity-${index ? 35 : 65}"`,
      )

      const server = await createServer({
        configFile: false,
        root,
        logLevel: 'silent',
        plugins: [platformCss('web'), tailwind()],
        css: { devSourcemap: true },
        optimizeDeps: { noDiscovery: true },
        server: { host: '127.0.0.1', port: 0 },
      })

      shutdowns.push(() => server.close())
      await server.listen()
      return server
    }),
  )

  const outputs = await Promise.all(
    servers.map(async (server) => {
      const [client, ssr] = await Promise.all([
        server.transformRequest('/styles.css?direct'),
        server.ssrLoadModule('/styles.css?inline'),
      ])

      assert.ok(client)
      assert.ok(client.map?.mappings, 'client CSS map missing')
      assert.equal(typeof ssr.default, 'string', 'SSR inline CSS missing')
      return [client.code, ssr.default]
    }),
  )

  for (const [index, environments] of outputs.entries()) {
    for (const css of environments) {
      assert.match(css, index === 0 ? /\.opacity-65\s*\{/ : /\.opacity-35\s*\{/)
      assert.doesNotMatch(css, index === 0 ? /\.opacity-35\s*\{/ : /\.opacity-65\s*\{/)
    }
  }
})

test('Linux webview conditions select Linux leaves while retaining browser CSS semantics', async (t) => {
  const root = await fixture(t)

  await writeFile(join(root, 'main.js'), 'import "./styles.css"')
  await writeFile(join(root, 'styles.css'), '@import "@octane-xplat/tailwind";')
  await writeFile(join(root, 'Screen.tsx'), 'export const classes = "opacity-15"')
  await writeFile(join(root, 'Screen.web.tsx'), 'export const classes = "hover:opacity-25"')
  await writeFile(join(root, 'Screen.linux.tsx'), 'export const classes = "fixed bg-red-500"')

  for (const target of ['web', 'linux'] as const) {
    const css = (await buildCss(root, target, ['linux', 'web']))
      .map((asset) => asset.source)
      .join('\n')

    assert.match(css, /\.fixed\s*\{\s*position:\s*fixed/)
    assert.match(css, /\.bg-red-500\s*\{/)
    assert.match(css, /oklch\(/)
    assert.doesNotMatch(css, /opacity-15|opacity-25|\.ns-root|dip/)
  }

  await rm(join(root, 'Screen.linux.tsx'))

  const fallback = (await buildCss(root, 'web', ['linux', 'web']))
    .map((asset) => asset.source)
    .join('\n')

  assert.ok(fallback.includes(String.raw`.hover\:opacity-25`))
  assert.doesNotMatch(fallback, /\.fixed\s*\{|\.bg-red-500\s*\{/)
})

// Copied into the fresh consumer. Every package import resolves there.
import assert from 'node:assert/strict'
import { mkdir, realpath, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, relative } from 'node:path'
import { build, createServer } from 'vite'
import { pxToDip, xplatCss } from '@octane-xplat/build/vite'
import { xplatTailwind } from '@octane-xplat/tailwind/vite'

const root = process.cwd()
const require = createRequire(import.meta.url)
const installed = await realpath(require.resolve('@octane-xplat/tailwind/vite'))

assert.ok(!relative(root, installed).startsWith('..'), 'Must load the installed tarball')
assert.ok(installed.endsWith('/dist/vite.js'), 'Must execute published JavaScript')
await mkdir(join(root, 'src'))
await writeFile(join(root, 'main.js'), 'import "./app.css"')
await writeFile(join(root, 'src/Shared.tsrx'), 'export const classes = "p-4 bg-primary"')
await writeFile(join(root, 'src/Screen.tsx'), 'export const classes = "flex w-[12px] opacity-35"')
await writeFile(join(root, 'src/Screen.web.tsx'), 'export const classes = "hover:opacity-65"')
await writeFile(
  join(root, 'src/Screen.linux.tsx'),
  'export const classes = "fixed bg-red-500 opacity-75"',
)
await writeFile(
  join(root, 'app.css'),
  `@import "@octane-xplat/tailwind/ui.css" source(none);
@source "./src";
:root, .ns-root { --color-primary: #112233 }
`,
)

function plugins(target) {
  return [
    xplatCss(target === 'linux' ? 'web' : target),
    xplatTailwind(),
    ...(target === 'ios' ? [pxToDip()] : []),
  ]
}

function verifyCss(css, target) {
  assert.match(css, /\.p-4\s*\{/)
  assert.match(css, /\.bg-primary\s*\{/)
  assert.match(css, /background-color:\s*var\(--color-primary\)/)
  assert.doesNotMatch(css, /@xplat-tailwind|@tailwind|@source|box-sizing:\s*border-box/)
  if (target === 'web') {
    assert.ok(css.includes(String.raw`.hover\:opacity-65`))
    assert.doesNotMatch(css, /\.opacity-35\s*\{/)
  } else if (target === 'linux') {
    assert.match(css, /\.fixed\s*\{\s*position:\s*fixed/)
    assert.match(css, /\.opacity-75\s*\{/)
    assert.match(css, /oklch\(/)
    assert.match(css, /:root,\s*:host/)
    assert.doesNotMatch(css, /opacity-35|opacity-65|\.ns-root,\s*\.ns-modal|dip/)
  } else {
    assert.match(css, /\.opacity-35\s*\{/)
    assert.doesNotMatch(css, /opacity-65/)
    assert.ok(css.includes(String.raw`.w-\[12px\]`), 'Class name must retain authored px')
    assert.match(css, /width:\s*12dip/)
    assert.doesNotMatch(css, /dipdip|12px\s*[;}]/)
    assert.match(css, /@layer utilities/)
  }
}

const results = []

for (const target of ['web', 'ios', 'linux']) {
  const built = await build({
    configFile: false,
    root,
    logLevel: 'silent',
    plugins: plugins(target),
    resolve: { conditions: target === 'linux' ? ['linux', 'web'] : undefined },
    build: {
      write: false,
      sourcemap: true,
      cssMinify: target !== 'ios',
      rollupOptions: { input: join(root, 'main.js') },
    },
  })

  assert.ok(!Array.isArray(built) && 'output' in built)
  const assets = built.output.filter((file) => file.type === 'asset')
  const css = assets
    .filter((file) => file.fileName.endsWith('.css'))
    .map((file) =>
      typeof file.source === 'string' ? file.source : new TextDecoder().decode(file.source),
    )
    .join('\n')

  verifyCss(css, target)
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
    plugins: plugins(target),
    resolve: { conditions: target === 'linux' ? ['linux', 'web'] : undefined },
    css: { devSourcemap: true },
    optimizeDeps: { noDiscovery: true },
    server: { host: '127.0.0.1', port: 0 },
  })

  try {
    await server.listen()
    const dev = await server.transformRequest('/app.css?direct')

    assert.ok(dev)
    assert.ok(dev.map?.mappings, 'Development CSS must retain its map')
    verifyCss(dev.code, target)
    if (target !== 'ios') {
      const ssr = await server.ssrLoadModule('/app.css?inline')

      assert.equal(typeof ssr.default, 'string')
      verifyCss(ssr.default, target)
    }
  } finally {
    await server.close()
  }
  results.push({
    target,
    productionCss: true,
    developmentCss: true,
    developmentMap: true,
    productionMap: assets.some((file) => file.fileName.endsWith('.css.map')),
    ssrInlineCss: target === 'ios' ? 'not-run' : 'passed',
  })
}

console.log(
  JSON.stringify({
    installation: 'isolated tarballs',
    results,
    evidence: 'CSS compilation only; no browser, native runtime, layout, input or painting',
  }),
)

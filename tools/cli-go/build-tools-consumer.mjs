// Packed project-installed plugins. No browser/device: real Vite
// build/server, HTTP and compiler/type boundaries.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { scratchRun } from './scratch.mjs'

const repo = resolve(import.meta.dirname, '../..')
const runRoot = scratchRun(repo, 'build-tools-consumer')
const packs = join(runRoot, 'packs'),
  consumer = join(runRoot, 'consumer')

mkdirSync(packs)
mkdirSync(consumer)

const environment = { ...process.env }

delete environment.NODE_PATH
delete environment.NODE_OPTIONS

function run(command, args, cwd = repo, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: environment,
    encoding: 'utf8',
    timeout: 120000,
    maxBuffer: 8 * 1024 * 1024,
    ...options,
  })

  assert.equal(
    result.status,
    0,
    `${command} failed (${result.status ?? result.signal}):\n${result.stdout}\n${result.stderr}`,
  )

  return result
}

function pack(path) {
  const manifest = JSON.parse(readFileSync(join(repo, path, 'package.json')))

  run('bun', ['pm', 'pack', '--ignore-scripts', '--destination', packs], join(repo, path))

  const file = join(
    packs,
    `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`,
  )

  assert.ok(existsSync(file), file)
  return file
}

try {
  const { discoverWorkspace } = await import('../../packages/cli/src/mcp/discovery.ts')

  assert.ok(
    !discoverWorkspace(repo).apps.some((app) => app.id === 'packages/build'),
    'Build tooling must not become an app selection candidate',
  )

  const plugins = pack('packages/build'),
    lib = pack('packages/lib')

  const inventory = run('tar', ['-tzf', plugins]).stdout.trim().split('\n')

  for (const file of [
    'dist/vite.js',
    'dist/vite.d.ts',
    'dist/macos/vite.js',
    'dist/macos/vite.d.ts',
    'dist/linux-gtk/vite.js',
    'dist/linux-gtk/vite.d.ts',
    'dist/css-platform.types.d.ts',
    'dist/build-worker.js',
    'dist/typecheck-globals/native.d.ts',
    'dist/typecheck-globals/macos.d.ts',
    'dist/mcp/contracts/actions.js',
    'LICENSE',
  ]) {
    assert.ok(inventory.includes(`package/${file}`), `Missing packed ${file}`)
  }

  assert.ok(
    // Compiled shared modules may retain dist/ui/src in their relative paths.
    // Raw package sources and bundled dependency trees must stay excluded.
    inventory.every(
      (file) =>
        !/\/(node_modules|nim|bin|standalone)\//.test(file) && !file.startsWith('package/src/'),
    ),
    inventory.join('\n'),
  )

  const root = JSON.parse(readFileSync(join(repo, 'package.json')))
  const deps = {
    '@octane-xplat/build': `file:${plugins}`,
    '@octane-xplat/lib': `file:${lib}`,
    vite: root.workspaces.catalog.vite,
    typescript: root.workspaces.catalog.typescript,
    '@types/node': '24.10.1',
  }

  writeFileSync(
    join(consumer, 'package.json'),
    JSON.stringify({
      name: 'packed-build-tools-consumer',
      private: true,
      type: 'module',
      devDependencies: deps,
      overrides: { '@octane-xplat/lib': `file:${lib}` },
    }),
  )

  run('bun', ['install', '--ignore-scripts', '--linker', 'isolated'], consumer)

  const installed = JSON.parse(
    readFileSync(join(consumer, 'node_modules/@octane-xplat/build/package.json')),
  )

  assert.equal(installed.dependencies?.['@octane-xplat/cli'], undefined)
  assert.equal(installed.peerDependencies?.['@octane-xplat/cli'], undefined)
  assert.equal(installed.optionalDependencies?.['@octane-xplat/cli'], undefined)

  // Execute the packed worker outside the repository's dependency topology.
  // The source is inspected, never imported as an application module.
  const request = {
    protocol: 'octane-build-worker',
    version: 1,
    id: 'packed-analysis',
    project: consumer,
    operation: 'route-analyze',
    files: [
      {
        file: 'src/page.tsrx',
        source:
          'throw new Error("must not execute"); export const loader = () => 42; export default function Page() @{ return <label>Page</label> }',
      },
    ],
  }

  writeFileSync(join(consumer, 'worker-request.json'), JSON.stringify(request))

  const worker = join(consumer, 'node_modules/@octane-xplat/build/dist/build-worker.js')

  run(process.execPath, [worker, 'worker-request.json', 'worker-result.json'], consumer)

  const analyzed = JSON.parse(readFileSync(join(consumer, 'worker-result.json')))

  assert.equal(analyzed.id, request.id)
  assert.equal(analyzed.ok, true)
  assert.deepEqual(analyzed.data[0].metadata, { loader: true })
  writeFileSync(
    join(consumer, 'worker-loader.ts'),
    'export const loader = () => ({ packed: true })',
  )

  writeFileSync(
    join(consumer, 'worker-request.json'),
    JSON.stringify({
      ...request,
      operation: 'route-bake',
      loaders: [{ name: 'index', file: 'worker-loader.ts' }],
      markdown: [{ name: 'readme', file: 'readme.md', source: '# Packed worker' }],
    }),
  )

  run(process.execPath, [worker, 'worker-request.json', 'worker-result.json'], consumer)

  const baked = JSON.parse(readFileSync(join(consumer, 'worker-result.json')))

  assert.equal(baked.ok, true)
  assert.deepEqual(baked.data.index, { packed: true })
  assert.equal(baked.data.readme.kind, 'octane-xplat/md')
  mkdirSync(join(consumer, 'worker-routes'))
  writeFileSync(
    join(consumer, 'worker-routes/index.tsx'),
    'throw new Error("planning must not execute route modules"); export default function Page() { return null }',
  )

  writeFileSync(
    join(consumer, 'worker-request.json'),
    JSON.stringify({
      ...request,
      operation: 'route-plan',
      directory: 'worker-routes',
      output: 'worker-generated/routes',
      bake: false,
    }),
  )

  run(process.execPath, [worker, 'worker-request.json', 'worker-result.json'], consumer)

  const planned = JSON.parse(readFileSync(join(consumer, 'worker-result.json')))

  assert.equal(planned.ok, true, JSON.stringify(planned))
  assert.equal(planned.data.version, 1)
  assert.equal(planned.data.count, 1)
  assert.equal(planned.data.outputs.length, 18)
  assert.ok(
    planned.data.outputs.every(
      (entry) =>
        typeof entry.source === 'string' &&
        entry.file.startsWith(join(consumer, 'worker-generated/routes.')),
    ),
  )

  assert.equal(
    existsSync(join(consumer, 'worker-generated')),
    false,
    'Planning must not publish or create output directories',
  )

  writeFileSync(
    join(consumer, 'worker-request.json'),
    JSON.stringify({
      ...request,
      operation: 'action-validate',
      phase: 'input',
      action: {
        id: 'fixture.regex',
        title: 'Check input',
        description: 'Validation only',
        effects: { summary: 'none' },
        input: {
          fields: {
            word: { type: 'string', pattern: String.raw`^(a+)\1$` },
            count: { type: 'integer', default: 1 },
          },
        },
      },
      value: { word: 'aaaa' },
    }),
  )

  run(process.execPath, [worker, 'worker-request.json', 'worker-result.json'], consumer)

  const validated = JSON.parse(readFileSync(join(consumer, 'worker-result.json')))

  assert.equal(validated.ok, true)
  assert.deepEqual(validated.data, {
    declaration: [],
    checked: { ok: true, value: { word: 'aaaa', count: 1 } },
  })

  writeFileSync(
    join(consumer, 'typecheck.ts'),
    readFileSync(join(repo, 'packages/build/test/typecheck.ts'), 'utf8'),
  )

  writeFileSync(
    join(consumer, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        skipLibCheck: true,
        noEmit: true,
        target: 'ESNext',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        types: ['node'],
      },
      include: ['typecheck.ts'],
    }),
  )

  run(
    process.execPath,
    [join(consumer, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json'],
    consumer,
  )

  writeFileSync(
    join(consumer, 'index.html'),
    '<!doctype html><html><body><div id="app"></div><script type="module" src="/src/main.js"></script></body></html>',
  )

  mkdirSync(join(consumer, 'src'))
  writeFileSync(
    join(consumer, 'src/main.js'),
    "import './theme.css'; document.getElementById('app').textContent = 'packed plugins';\n",
  )

  writeFileSync(join(consumer, 'src/theme.css'), '.fallback-must-not-ship { color: red }')
  writeFileSync(
    join(consumer, 'src/theme.web.css'),
    '@platform web { .packed-web { color: rgb(11, 22, 33); --packed-existing: unprocessed } } @platform mobile { .must-not-ship { color: red } }',
  )

  writeFileSync(
    join(consumer, 'postcss.config.mjs'),
    "export default { plugins: [{ postcssPlugin: 'packed-app-postcss', Declaration(decl) { if (decl.prop === '--packed-existing') decl.value = 'preserved' } }] }\n",
  )

  writeFileSync(
    join(consumer, 'vite.config.mjs'),
    "import { defineConfig } from 'vite'\nimport { css, boundary, devBridge, nodeEnvDefine } from '@octane-xplat/build/vite'\nexport default defineConfig(({ mode }) => ({ define: nodeEnvDefine(mode), plugins: [css('web'), boundary('web'), devBridge()], server: { host: '127.0.0.1', port: 0 } }))\n",
  )

  writeFileSync(
    join(consumer, 'verify.mjs'),
    readFileSync(join(import.meta.dirname, 'build-tools-live.mjs'), 'utf8'),
  )

  const result = run(process.execPath, ['verify.mjs'], consumer)
  const live = JSON.parse(result.stdout.trim())
  const original = await import('../../packages/cli/src/vite.ts')

  assert.deepEqual(live.exports, Object.keys(original).sort())
  assert.deepEqual(live.nativeExtensions, original.nativeExtensions)
  assert.deepEqual(
    live.nodeEnv,
    ['development', 'production', 'test'].map((mode) => original.nodeEnvDefine(mode)),
  )

  assert.equal(live.productionCssFiltered, true)
  assert.equal(live.devCssFiltered, true)
  assert.equal(live.appPostcssPreserved, true)
  assert.equal(live.platformSiblingSelected, true)
  assert.equal(live.nativeRegexMatches.length, 4)
  assert.equal(live.foreignModuleRejected, true)
  assert.equal(live.sessionRemoved, true)

  const bytes = readFileSync(plugins)
  const evidence = {
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    package: {
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      files: inventory,
    },
    live,
  }

  const output = join(repo, 'research/go-cli/build-tools-packed.json')

  writeFileSync(output, JSON.stringify(evidence, null, 2))
  console.log(
    `Packed plugins: ${bytes.length} bytes; isolated Vite build/server/typecheck passed without a CLI installation`,
  )

  console.log(`Evidence: ${output}`)
} finally {
  rmSync(runRoot, { recursive: true, force: true })
}

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, readdir, realpath, stat, mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    output: { type: 'string' },
    variant: { type: 'string' },
    phase: { type: 'string' },
  },
})

const consumer = process.cwd()
const variants = ['official-web', 'xplat-web', 'upstream-ios', 'xplat-ios']
const classes =
  'flex grid absolute relative left-3 top-4 w-8 h-5 gap-2 p-4 px-2 opacity-50 rounded-lg text-sm invisible'

async function packageRoot(name, from) {
  const require = createRequire(join(from, 'package.json'))
  let file

  try {
    file = require.resolve(`${name}/package.json`)
  } catch {
    file = require.resolve(name)
  }

  let directory = dirname(await realpath(file))

  while (true) {
    try {
      const manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))

      if (manifest.name) {
        return { directory, manifest }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }

    const parent = dirname(directory)

    assert.notEqual(parent, directory, `No manifest for ${name}`)
    directory = parent
  }
}

async function bytes(directory) {
  let total = 0

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.bun-tag')) {
      continue
    }

    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      total += await bytes(path)
    } else if (entry.isFile()) {
      total += (await stat(path)).size
    }
  }

  return total
}

async function dependencyCost(roots) {
  const packages = new Map()
  const missingOptional = new Set()

  async function visit(name, from, optional = false) {
    let found

    try {
      found = await packageRoot(name, from)
    } catch (error) {
      if (!optional || !['MODULE_NOT_FOUND', 'ERR_MODULE_NOT_FOUND'].includes(error.code)) {
        throw error
      }

      missingOptional.add(name)
      return
    }

    const { directory, manifest } = found

    if (packages.has(directory)) {
      return
    }

    packages.set(directory, {
      name: manifest.name,
      version: manifest.version,
      logicalBytes: await bytes(directory),
      excludedPeers: manifest.peerDependencies ?? {},
    })

    const optionalDependencies = manifest.optionalDependencies ?? {}

    for (const child of Object.keys({ ...manifest.dependencies, ...optionalDependencies }).sort()) {
      await visit(child, directory, Object.hasOwn(optionalDependencies, child))
    }
  }

  for (const name of roots) {
    await visit(name, consumer)
  }

  const inventory = [...packages.values()].sort((a, b) => a.name.localeCompare(b.name))

  return {
    roots,
    installedPackages: inventory.length,
    logicalBytes: inventory.reduce((total, item) => total + item.logicalBytes, 0),
    missingOptional: [...missingOptional].sort(),
    packages: inventory,
  }
}

function summary(samples) {
  const sorted = [...samples].sort((a, b) => a - b)

  return {
    samples,
    medianMs: sorted[Math.floor(sorted.length / 2)],
    minMs: sorted[0],
    maxMs: sorted.at(-1),
  }
}

if (!values.variant) {
  assert.ok(values.output, 'Choose a new --output evidence directory')

  const output = resolve(values.output)

  await mkdir(output, { recursive: true })

  const samples = Object.fromEntries(
    variants.map((variant) => [variant, { build: [], development: null }]),
  )

  const xplat = await packageRoot('@octane-xplat/tailwind', consumer)
  const versions = Object.fromEntries(
    await Promise.all(
      [
        'vite',
        'tailwindcss',
        '@tailwindcss/postcss',
        '@nativescript/tailwind',
        '@octane-xplat/tailwind',
      ].map(async (name) => [
        name,
        (await packageRoot(name, name === 'tailwindcss' ? xplat.directory : consumer)).manifest
          .version,
      ]),
    ),
  )

  const dependencies = {
    xplat: await dependencyCost(['@octane-xplat/tailwind']),
    officialWeb: await dependencyCost(['@tailwindcss/postcss']),
    upstreamNative: await dependencyCost(['@tailwindcss/postcss', '@nativescript/tailwind']),
  }

  function run(variant, phase) {
    const started = performance.now()
    const child = spawnSync(
      process.execPath,
      [import.meta.filename, '--variant', variant, '--phase', phase],
      {
        cwd: consumer,
        encoding: 'utf8',
        timeout: 30000,
        maxBuffer: 2 * 1024 * 1024,
      },
    )

    assert.equal(child.status, 0, `${variant}/${phase}: ${child.stdout}\n${child.stderr}`)
    return { ...JSON.parse(child.stdout), processWallMs: performance.now() - started }
  }

  // Round-robin order reduces, but cannot eliminate, shared-host cache/load bias.
  for (let round = 0; round < 3; round++) {
    for (const variant of variants) {
      samples[variant].build.push(run(variant, 'build'))
    }
  }

  for (const variant of variants) {
    samples[variant].development = run(variant, 'development')
  }

  const report = {
    schema: 1,
    evidence:
      'Isolated installed tarballs; Vite CSS builds and development transforms only. No browser, native runtime, input or painting.',
    environment: { platform: process.platform, architecture: process.arch, node: process.version },
    versions,
    limits: [
      'Shared host: CPU and filesystem caches are not exclusive; timings are descriptive, not performance thresholds.',
      'Build samples use fresh Node processes, not cold OS caches; module loading is included in processWallMs only.',
      'Watch latency includes filesystem notification, Vite invalidation, compiler work and 20ms polling resolution.',
      'Both pipelines use the same Xplat pixel theme and source corpus without Preflight; this is not a stock theme comparison.',
      'The upstream iOS variant composes the official PostCSS compiler and released NativeScript adapter with css; it does not repair adapter losses.',
      'Dependency sizes are logical unpacked installed-file bytes, not compressed downloads or deduplicated disk usage. Dev dependencies and peer edges are excluded.',
    ],
    corpus: classes,
    dependencies,
    variants: Object.fromEntries(
      variants.map((variant) => [
        variant,
        {
          ...samples[variant],
          buildMs: summary(samples[variant].build.map((sample) => sample.durationMs)),
          processWallMs: summary(samples[variant].build.map((sample) => sample.processWallMs)),
        },
      ]),
    ),
  }

  await writeFile(join(output, 'cost.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' })
  console.log(JSON.stringify({ output: join(output, 'cost.json'), evidence: report.evidence }))
} else {
  assert.ok(variants.includes(values.variant), 'Unknown pipeline')
  assert.ok(['build', 'development'].includes(values.phase), 'Unknown phase')

  const variant = values.variant
  const target = variant.endsWith('ios') ? 'ios' : 'web'
  const root = join(consumer, 'cost-projects', variant, values.phase)

  await mkdir(root, { recursive: true })

  const source = join(root, 'App.tsrx')

  await writeFile(source, `export const classes = ${JSON.stringify(classes)}\n`)
  await writeFile(join(root, 'main.js'), "import './app.css'\n")
  await writeFile(
    join(root, 'app.css'),
    "@import '@octane-xplat/tailwind';\n@source './App.tsrx';\n",
  )

  const { build, createServer } = await import('vite')
  const { css: platformCss } = await import('@octane-xplat/build/vite')
  const plugins = [platformCss(target)]
  const config = { configFile: false, root, logLevel: 'silent', plugins }

  if (variant.startsWith('xplat-')) {
    const { tailwind } = await import('@octane-xplat/tailwind/vite')

    plugins.push(tailwind())
  } else {
    const { default: tailwindcss } = await import('@tailwindcss/postcss')
    const processors = [tailwindcss({ base: root, optimize: false })]

    if (target === 'ios') {
      // Node-only PostCSS adapter comparison; this imports no native UI runtime.
      const { default: adapter } = await import('@nativescript/tailwind')

      processors.push(adapter)
    }

    plugins.push({
      name: 'comparison-postcss-composition',
      config(settings) {
        assert.ok(settings.css?.postcss && typeof settings.css.postcss === 'object')
        settings.css.postcss.plugins.push(...processors)
      },
    })
  }

  const { default: postcss } = await import('postcss')
  function inventory(css) {
    const rules = new Map()

    postcss.parse(css).walkRules((rule) => {
      const declarations = []

      rule.walkDecls((decl) => declarations.push(`${decl.prop}:${decl.value}`))
      rules.set(rule.selector, declarations)
    })

    return Object.fromEntries(
      ['.flex', '.grid', '.absolute', '.w-8', '.w-12'].map((selector) => [
        selector,
        rules.get(selector) ?? [],
      ]),
    )
  }

  if (values.phase === 'build') {
    const started = performance.now()
    const built = await build({
      ...config,
      build: { write: false, cssMinify: false, rollupOptions: { input: join(root, 'main.js') } },
    })

    const durationMs = performance.now() - started

    assert.ok(!Array.isArray(built) && 'output' in built)

    const css = built.output
      .filter((file) => file.type === 'asset' && file.fileName.endsWith('.css'))
      .map((file) =>
        typeof file.source === 'string' ? file.source : new TextDecoder().decode(file.source),
      )
      .join('\n')

    assert.ok(css.length > 0, 'Build must emit CSS')
    if (variant !== 'upstream-ios') {
      const generated = inventory(css)

      assert.deepEqual(generated['.flex'], ['display:flex'])
      assert.deepEqual(generated['.grid'], ['display:grid'])
      assert.deepEqual(generated['.absolute'], ['position:absolute'])
      assert.ok(generated['.w-8'].length > 0)
      assert.equal(generated['.w-12'].length, 0)
    }

    console.log(
      JSON.stringify({
        durationMs,
        cssBytes: Buffer.byteLength(css),
        cssSha256: createHash('sha256').update(css).digest('hex'),
        inventory: inventory(css),
      }),
    )
  } else {
    const started = performance.now()
    const server = await createServer({
      ...config,
      optimizeDeps: { noDiscovery: true },
      server: { host: '127.0.0.1', port: 0 },
    })

    try {
      await server.listen()

      const initial = await server.transformRequest('/app.css?direct')

      assert.ok(initial)
      assert.ok(inventory(initial.code)['.w-8'].length > 0)
      assert.equal(inventory(initial.code)['.w-12'].length, 0)

      const initialMs = performance.now() - started
      const deadline = performance.now() + 5000

      while (!server.watcher.getWatched()[root]?.includes('App.tsrx')) {
        assert.ok(performance.now() < deadline, 'Source watcher did not become ready')
        await new Promise((resolve) => setTimeout(resolve, 20))
      }

      const editStarted = performance.now()

      await writeFile(
        source,
        `export const classes = ${JSON.stringify(classes.replace('w-8', 'w-12'))}\n`,
      )

      let changed

      while (true) {
        changed = await server.transformRequest('/app.css?direct')
        assert.ok(changed)
        if (inventory(changed.code)['.w-12'].length > 0) {
          break
        }

        assert.ok(performance.now() - editStarted < 10000, 'Source edit did not invalidate CSS')
        await new Promise((resolve) => setTimeout(resolve, 20))
      }

      console.log(
        JSON.stringify({
          initialMs,
          sourceEditMs: performance.now() - editStarted,
          removedCandidateRetained: inventory(changed.code)['.w-8'].length > 0,
          inventory: inventory(changed.code),
        }),
      )
    } finally {
      await server.close()
    }
  }
}

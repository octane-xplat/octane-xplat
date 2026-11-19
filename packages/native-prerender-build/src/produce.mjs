import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parse, walk } from 'css-tree'
import { artifactNodeCount, validateArtifact } from '@octane-xplat/native-prerender'
import { encodeStartupArtifact, writeStartupJson } from '@octane-xplat/native-prerender/codec'
import { parseProducerConfig } from './config.mjs'
import {
  resolveProject,
  primitiveModules,
  motionModules,
  packageRoot,
} from './project-dependencies.mjs'

/** Every declared-input bind point: each declared value plus the null point when its default is null. */
function bindPoints(launchInputs) {
  let points = [{}]
  for (const input of launchInputs) {
    const domain = [...input.values, ...(input.default === null ? [null] : [])]
    points = points.flatMap((point) =>
      domain.map((value) => ({ ...point, [input.name]: value })),
    )
  }
  return points
}

/** Compile one deterministic initial screen using the selected project's toolchain. */
export async function produceNativeStartup({ projectDir, configurationFile, outputDir, platform }) {
  if (!['ios', 'android'].includes(platform)) {
    throw new Error('Native startup platform must be ios or android')
  }

  if (typeof outputDir !== 'string' || !outputDir) {
    throw new Error('Native startup outputDir is required')
  }

  const work = resolve(outputDir)

  if (existsSync(work) && (!statSync(work).isDirectory() || readdirSync(work).length)) {
    throw new Error('Native startup output directory must be new or empty: ' + work)
  }

  // Reserve before the first await; two producers may not write one destination.
  mkdirSync(work, { recursive: true })
  writeFileSync(join(work, '.producer-owner'), 'Native startup output\n', { flag: 'wx' })

  const project = resolveProject(projectDir)
  const source = import.meta.dirname
  const { require: toolchain, uiRoot, cssRoot, cssRequire, normalizerPath } = project
  const vitePath = toolchain.resolve('vite')
  const { build } = await import(pathToFileURL(vitePath).href)
  const compilerPath = toolchain.resolve('octane/compiler')
  const { compile } = await import(pathToFileURL(compilerPath).href)
  const { processNativeCss, css } = await import(pathToFileURL(normalizerPath).href)

  if (typeof processNativeCss !== 'function') {
    throw new Error('Project native preset does not export processNativeCss')
  }

  const platformCss = css(platform).api

  if (
    typeof platformCss?.select !== 'function' ||
    typeof platformCss?.inputs !== 'function' ||
    typeof platformCss?.filter !== 'function'
  ) {
    throw new Error('Project native preset lacks startup CSS selection/filter capabilities')
  }

  const inputs = new Map()
  const missingInputs = new Set()
  function candidateExists(path) {
    if (existsSync(path)) {
      return true
    }

    missingInputs.add(path)
    return false
  }

  function selectCss(path) {
    const selected = platformCss.select(path)

    for (const candidate of platformCss.inputs()) {
      candidateExists(candidate)
    }

    return selected
  }

  function read(path) {
    const data = readFileSync(path)
    const digest = createHash('sha256').update(data).digest('hex')

    if (inputs.has(path) && inputs.get(path) !== digest) {
      throw new Error('Producer input changed: ' + path)
    }

    inputs.set(path, digest)
    return data.toString('utf8')
  }

  function json(path, value) {
    writeFileSync(path, JSON.stringify(value, null, 2))
  }

  function run(file, input) {
    const args = [file, input]
    const result = spawnSync(process.execPath, args, {
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    })

    if (result.status !== 0) {
      throw new Error('Native startup worker: ' + (result.error?.message ?? result.stderr))
    }
  }

  const configPath = resolve(project.root, configurationFile)
  const configuration = parseProducerConfig(read(configPath), configPath)
  const entryRoot = dirname(configuration.entry)
  const { seed, environment } = configuration
  const cssFiles = new Set()
  const nativeImports = []
  // Resolved lazily: a project without @octane-xplat/motion installed keeps
  // producing while any motion import rejects with a clear reason.
  let motionRoot
  function motionFacadeRoot() {
    if (motionRoot === undefined) {
      try {
        motionRoot = packageRoot(
          project.require.resolve('@octane-xplat/motion'),
          '@octane-xplat/motion',
        )
      } catch {
        motionRoot = null
      }
    }

    return motionRoot
  }
  async function bundle(entry, name) {
    const cssPrefix = '\0xplat-startup-css:'

    await build({
      configFile: false,
      root: project.root,
      envDir: false,
      logLevel: 'warn',
      define: {
        XPLAT_HOME_PLATFORM: JSON.stringify(platform),
        __IOS__: String(platform === 'ios'),
        __APPLE__: String(platform === 'ios'),
        __ANDROID__: String(platform === 'android'),
        __WINDOWS__: 'false',
        __VISIONOS__: 'false',
        __DEV__: 'false',
      },
      ssr: { noExternal: true },
      build: {
        ssr: entry,
        outDir: join(work, name),
        target: 'node22',
        minify: false,
        emptyOutDir: true,
        rolldownOptions: {
          output: { format: 'es', entryFileNames: 'entry.mjs', codeSplitting: false },
        },
      },
      plugins: [
        {
          name: 'native-startup-build-host',
          enforce: 'pre',
          load(id) {
            if (isAbsolute(id) && id.endsWith('.json')) {
              read(id)
              return
            }

            if (id === '\0xplat-render-primitives') {
              return Object.entries(primitiveModules)
                .map(([name, spec]) => {
                  const { path, export: exported = name } =
                    typeof spec === 'string' ? { path: spec } : spec
                  const clause = exported === name ? exported : `${exported} as ${name}`
                  return `export { ${clause} } from ${JSON.stringify(join(uiRoot, path))}`
                })
                .join('\n')
            }

            if (id === '\0xplat-render-motion') {
              const facade = motionFacadeRoot()
              return [
                ...Object.entries(motionModules).map(
                  ([name, exported]) =>
                    `import { ${exported} as ${name} } from ${JSON.stringify(join(facade, 'src/components.tsrx'))}`,
                ),
                `export const motion = { ${Object.keys(motionModules).join(', ')} }`,
              ].join('\n')
            }

            if (id === '\0xplat-startup-component') {
              return (
                'export { ' +
                configuration.exportName +
                ' as StartupComponent } from ' +
                JSON.stringify(configuration.entry)
              )
            }

            // The real platform package's storage leaf wires lifecycle writes
            // at module evaluation, which the build host correctly rejects.
            // The startup facade exposes only the launch-input read seam:
            // storage.getString resolves through the build host's bounded
            // ApplicationSettings; every write/other member rejects.
            if (id === '\0xplat-platform') {
              return [
                `import { ApplicationSettings } from ${JSON.stringify(join(source, 'native-api.mjs'))}`,
                "const write = () => { throw new Error('Native startup producer: native state writes unsupported') }",
                'export const storage = {',
                '  getString: (key) => ApplicationSettings.getString(key) ?? null,',
                '  setString: write,',
                '  remove: write,',
                '  flush: write,',
                '}',
              ].join('\n')
            }

            if (id.startsWith(cssPrefix)) {
              const path = Buffer.from(id.slice(cssPrefix.length), 'base64url').toString('utf8')

              cssFiles.add(path)
              read(path)
              return 'export {}'
            }

            if (!isAbsolute(id) || !/\.(?:ts|tsx|tsrx|mjs|js)$/.test(id)) {
              return
            }

            const contents = read(id)

            if (
              /\.(?:ts|tsx|tsrx)$/.test(id) &&
              (id.startsWith(uiRoot + '/') ||
                id.startsWith(entryRoot + '/') ||
                /\.(?:tsx|tsrx)$/.test(id))
            ) {
              const compiled = compile(contents, id, {
                renderer: {
                  id: 'nativescript',
                  module: 'octane/universal/native',
                  target: 'universal',
                  server: 'unsupported',
                  text: 'host',
                },
              })

              const errors = compiled.diagnostics.filter((item) => item.severity === 'error')

              if (errors.length) {
                throw new Error(JSON.stringify(errors))
              }

              return compiled.code
            }

            return contents
          },
          resolveId(request, importer) {
            if (/\.css[?#]/.test(request)) {
              throw new Error('Native startup CSS query imports are unsupported: ' + request)
            }

            if (request === 'xplat-prerender:component') {
              return '\0xplat-startup-component'
            }

            if (request === '@nativescript/core') {
              nativeImports.push({ importer, request })
              return join(source, 'native-api.mjs')
            }

            // Motion's clock imports the frame scheduler; it only runs inside
            // effects, so a no-op stub stands in for the native module.
            if (request === '@nativescript/core/animation-frame') {
              nativeImports.push({ importer, request })
              return join(source, 'animation-frame.mjs')
            }

            if (request.startsWith('@nativescript/core/')) {
              throw new Error('Unsupported native module: ' + request)
            }

            if (
              request === '@octane-xplat/nativescript-octane' ||
              request === '../../vendor/ui-svg/src'
            ) {
              if (
                ![
                  join(uiRoot, 'src/components/media/svg.mobile.ts'),
                  join(uiRoot, 'src/components/layout/Screen.tsrx'),
                ].includes(importer)
              ) {
                throw new Error('Unsupported native registry or SVG import: ' + importer)
              }

              nativeImports.push({ importer, request })
              return join(source, 'native-api.mjs')
            }

            if (request === 'octane' || request.startsWith('octane/')) {
              return toolchain.resolve(request === 'octane' ? 'octane/universal/native' : request)
            }

            if (request === '@octane-xplat/platform') {
              return '\0xplat-platform'
            }

            if (request === '@octane-xplat/ui') {
              return '\0xplat-render-primitives'
            }

            if (request === '@octane-xplat/motion') {
              if (!motionFacadeRoot()) {
                throw new Error(
                  'Native startup motion facade requires @octane-xplat/motion installed: ' +
                    importer,
                )
              }

              return '\0xplat-render-motion'
            }

            if (request === '@octane-xplat/css-engine') {
              return join(cssRoot, 'src/index.ts')
            }

            if (
              request === '@octane-xplat/native-prerender' ||
              request.startsWith('@octane-xplat/native-prerender/')
            ) {
              return createRequire(import.meta.url).resolve(request)
            }

            if (request === '@octane-xplat/lib' || request === '@octane-xplat/icons') {
              return toolchain.resolve(request)
            }

            if (['@csstools/css-calc', 'css-tree', 'css-what'].includes(request)) {
              return cssRequire.resolve(request)
            }

            if ((!request.startsWith('.') && !isAbsolute(request)) || !importer) {
              if (request.endsWith('.css')) {
                throw new Error('Native startup CSS package imports are unsupported: ' + request)
              }
              return
            }

            const path = isAbsolute(request) ? request : resolve(dirname(importer), request)

            // Motion's projection barrier has platform leaves that pull the
            // live driver; the producer has no measured layout either way, so
            // every barrier specifier (including explicit platform suffixes)
            // force-resolves to the generic leaf where layoutSupported=false
            // and `layout` props reject honestly.
            const motionRootResolved = motionFacadeRoot()
            if (motionRootResolved) {
              const barrier = join(motionRootResolved, 'src/projection/barrier')
              if (path === barrier || path.startsWith(barrier + '.')) {
                return barrier + '.ts'
              }
            }

            if (path === join(cssRoot, 'src/vendor/media-query.ts')) {
              return join(source, 'mobile-media-query.mjs')
            }

            if (path.endsWith('.css')) {
              return cssPrefix + Buffer.from(selectCss(path)).toString('base64url')
            }

            if (/\.(?:ts|tsx|tsrx)$/.test(path)) {
              const stem = path.replace(/\.(?:ts|tsx|tsrx)$/, '')
              const ext = path.slice(stem.length)

              for (const candidate of [stem + '.' + platform + ext, stem + '.mobile' + ext, path]) {
                if (candidateExists(candidate)) {
                  return candidate
                }
              }
            }

            if (/\.(?:m?js|json)$/.test(path)) {
              return
            }

            for (const ext of [
              '.' + platform + '.tsrx',
              '.mobile.tsrx',
              '.tsrx',
              '.' + platform + '.ts',
              '.mobile.ts',
              '.ts',
              '.' + platform + '.js',
              '.js',
            ]) {
              for (const candidate of [path + ext, join(path, 'index' + ext)]) {
                if (candidateExists(candidate)) {
                  return candidate
                }
              }
            }
          },
        },
      ],
    })

    const output = join(work, name, 'entry.mjs')

    if (!existsSync(output)) {
      throw new Error('Render-only Vite build did not emit ' + output)
    }

    return output
  }

  read(vitePath)
  read(compilerPath)
  read(normalizerPath)
  read(import.meta.filename)
  read(createRequire(import.meta.url).resolve('@octane-xplat/native-prerender/codec'))
  read(join(source, 'config.mjs'))
  read(join(source, 'project-dependencies.mjs'))
  read(join(project.root, 'package.json'))

  const homeBundle = await bundle(join(source, 'prepare.mjs'), 'home-bundle')
  const launchInputs = configuration.launchInputs

  // One render point per declared launch-input bind crossed with light/dark.
  // Without declared inputs a single unbound bind keeps the flat artifact
  // path unless its trees diverge by appearance.
  const binds = launchInputs ? bindPoints(launchInputs) : [undefined]
  const renders = []

  for (const [bindIndex, bind] of binds.entries()) {
    const pair = {}
    for (const theme of ['light', 'dark']) {
      const stem = bind ? 'tree-' + bindIndex + '-' + theme : theme + '-tree'
      const output = join(work, stem + '.json')
      const input = join(work, stem + '-input.json')

      json(input, { theme, seed, environment, ...(bind ? { bind } : {}), output })
      run(homeBundle, input)
      pair[theme] = JSON.parse(readFileSync(output, 'utf8'))
      assert.equal(
        pair[theme].platform,
        platform,
        'Build host platform differs from selected leaves',
      )
    }

    // Appearance-dependent props or topology are supported: the artifact
    // emits one scheme-bound tree per render instead of collapsing them.
    renders.push({
      bind,
      pair,
      divergent:
        !isDeepStrictEqual(pair.light.nodes, pair.dark.nodes) ||
        !isDeepStrictEqual(pair.light.logicalNodes, pair.dark.logicalNodes),
    })
  }

  // Every declared bind point crossed with the implicit systemAppearance
  // input. Declared launch inputs always produce a layered artifact; without
  // them, appearance divergence upgrades the flat pair into scheme trees.
  const layered = Boolean(launchInputs) || renders.some((render) => render.divergent)
  const points = renders.flatMap(({ bind }, bindIndex) =>
    ['light', 'dark'].map((theme) => ({ bindIndex, bind, theme })),
  )

  const warnings = []
  const sheets = [
    ...new Set([
      ...['tokens.css', 'chrome.css', 'utilities.css'].map((name) =>
        selectCss(join(uiRoot, 'src/theme', name)),
      ),
      ...cssFiles,
    ]),
  ].map((path) => {
    const id = path.startsWith(project.root + '/')
      ? path.slice(project.root.length + 1)
      : pathToFileURL(path).href

    const filtered = platformCss.filter(read(path), path)

    walk(parse(filtered, { parseValue: false, parseCustomProperty: false }), (node) => {
      if (node.type === 'Atrule' && node.name.toLowerCase() === 'import') {
        throw new Error(
          'Native startup CSS @import is unsupported; use a JS side-effect import: ' + path,
        )
      }
    })

    return {
      id,
      css: processNativeCss(filtered, id, (message) => warnings.push(message), {
        masonSafeAreaEnvironment: true,
      }),
    }
  })

  json(join(work, 'sheets.json'), sheets)

  const cascadeBundle = await bundle(join(source, 'resolve.mjs'), 'cascade-bundle')

  // Safe-area insets become launch constraints only when the prepared tree
  // actually read them; an unused declaration must not narrow adoption.
  const consumesSafeAreaInsets = renders.some(({ pair }) =>
    ['light', 'dark'].some((theme) => pair[theme].reads.includes('Application.safeAreaInsets')),
  )

  // Cascade resolution is per rendered tree: each bind+scheme point owns its
  // logical nodes and one style variant for its scheme.
  const resolved = []
  for (const point of points) {
    const stem = point.bind
      ? 'tree-' + point.bindIndex + '-' + point.theme
      : point.theme + '-tree'
    const suffix = point.bind
      ? '-' + point.bindIndex + '-' + point.theme
      : '-' + point.theme
    const output = join(work, 'resolved' + suffix + '.json')
    const cascadeInput = join(work, 'cascade-input' + suffix + '.json')
    json(cascadeInput, {
      tree: join(work, stem + '.json'),
      seed,
      sheets,
      environment,
      colorScheme: point.theme,
      consumesSafeAreaInsets,
      output,
    })
    run(cascadeBundle, cascadeInput)
    const { launch, ...cascaded } = JSON.parse(readFileSync(output, 'utf8'))
    json(output, cascaded)
    resolved.push({ launch, cascaded })
  }

  // Constraints are a property of the fixed environment, not of a bind; every
  // tree must resolve to the same launch predicate.
  const launch = resolved[0].launch
  for (const item of resolved.slice(1)) {
    assert.deepEqual(item.launch, launch, 'Launch constraints differ across launch-input binds')
  }

  // Resolved evidence is keyed by the same bind the artifact emits.
  const pointBind = (point) => ({
    ...(point.bind ?? {}),
    systemAppearance: point.theme,
  })
  if (layered) {
    json(join(work, 'resolved.json'), {
      scope: resolved[0].cascaded.scope,
      seed,
      trees: points.map((point, index) => ({
        bind: pointBind(point),
        nodes: resolved[index].cascaded.nodes,
        variant: resolved[index].cascaded.variant,
        placeholders: resolved[index].cascaded.placeholders,
      })),
    })
  } else {
    json(join(work, 'resolved.json'), {
      scope: resolved[0].cascaded.scope,
      seed,
      nodes: resolved[0].cascaded.nodes,
      variants: {
        light: resolved[0].cascaded.variant,
        dark: resolved[1].cascaded.variant,
      },
      placeholders: resolved[0].cascaded.placeholders,
    })
  }

  const bundleHashes = Object.fromEntries(
    [homeBundle, cascadeBundle].map((path) => [
      path.slice(work.length + 1),
      createHash('sha256').update(readFileSync(path)).digest('hex'),
    ]),
  )

  const binding = {
    inputs: Object.fromEntries([...inputs].sort()),
    missingInputs: [...missingInputs].sort(),
    bundleHashes,
    normalizedStylesHash: createHash('sha256').update(JSON.stringify(sheets)).digest('hex'),
    seed,
    environment,
    platform,
    configuration,
  }

  const buildHash = createHash('sha256').update(JSON.stringify(binding)).digest('hex')

  // One render point's style variant, translated from cascade visual indices
  // to logical node identities.
  function variantRecords(render, cascaded) {
    const visualNodes = render.logicalNodes.filter((node) => node.kind !== '#text')
    return cascaded.variant.map(({ index, ...record }) => ({
      node: visualNodes[index].index,
      ...record,
    }))
  }

  const startup = validateArtifact({
    version: 1,
    platform,
    hostContract: 'mason-label-v1',
    build: buildHash,
    seed,
    // Unsupported mobile media inputs were rejected during cascade preparation.
    // Mason lays out flow and supported percentages in the actual native viewport.
    constraints: launch.constraints,
    ...(layered
      ? {
          // An empty declaration is legal: the trees then bind only
          // systemAppearance.
          launchInputs: (launchInputs ?? []).map((input) => ({
            name: input.name,
            source: input.source,
            values: [...input.values],
            default: input.default,
          })),
          trees: points.map((point, index) => ({
            bind: pointBind(point),
            nodes: renders[point.bindIndex].pair[point.theme].logicalNodes,
            variant: variantRecords(
              renders[point.bindIndex].pair[point.theme],
              resolved[index].cascaded,
            ),
          })),
        }
      : {
          nodes: renders[0].pair.light.logicalNodes,
          variants: {
            light: variantRecords(renders[0].pair.light, resolved[0].cascaded),
            dark: variantRecords(renders[0].pair.dark, resolved[1].cascaded),
          },
        }),
  })

  writeFileSync(join(work, 'startup.bin'), encodeStartupArtifact(startup))
  writeFileSync(join(work, 'startup.json'), writeStartupJson(startup))
  for (const [path, digest] of inputs) {
    if (createHash('sha256').update(readFileSync(path)).digest('hex') !== digest) {
      throw new Error('Producer input changed during generation: ' + path)
    }
  }

  for (const path of missingInputs) {
    if (existsSync(path)) {
      throw new Error('Producer resolution input appeared during generation: ' + path)
    }
  }

  // Per render point: `light`/`dark` keys without declared inputs (unchanged
  // shape), `name=value&.../theme` keys for declared launch-input trees.
  const readPoints = renders.flatMap(({ bind, pair }) =>
    ['light', 'dark'].map((theme) => [
      bind
        ? launchInputs.map((input) => input.name + '=' + JSON.stringify(bind[input.name])).join('&') +
            '/' +
            theme
        : theme,
      pair[theme].reads,
    ]),
  )
  const manifest = {
    ...binding,
    buildHash,
    warnings,
    nativeImports,
    nativeReads: Object.fromEntries(readPoints),
    registrations: layered
      ? [
          ...new Set(
            renders.flatMap(({ pair }) =>
              ['light', 'dark'].flatMap((theme) => pair[theme].registrations),
            ),
          ),
        ]
      : renders[0].pair.light.registrations,
    startupFormat: 'XPI1',
    dimensionQueries: launch.dimensionQueries,
    startupArtifactHash: createHash('sha256')
      .update(readFileSync(join(work, 'startup.bin')))
      .digest('hex'),
    logicalNodeCount: artifactNodeCount(startup),
    placeholders: layered
      ? points.map((point, index) => ({
          bind: pointBind(point),
          placeholders: resolved[index].cascaded.placeholders ?? [],
        }))
      : (resolved[0].cascaded.placeholders ?? []),
    scope:
      'Private configured Node/Vite ' +
      platform +
      ' render-only producer with twelve shared primitive exports plus the useColorScheme scheme hook and bounded motion.View/Row/Pressable support, explicit environment, AOT theme variants and XPI1 encoding; not normal app integration, general eligibility, SSR or native runtime qualification',
  }

  json(join(work, 'build.json'), manifest)
  return { directory: work, artifact: startup, manifest }
}

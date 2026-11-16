// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Shared TypeScript environment presets + tsconfig.envs.json expansion.
// Each target gets its own program and ambient SDK. Native manifest entries
// expand to iOS and Android; Linux WebKit and GTK use distinct host programs.
import { existsSync, globSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { parse, printParseErrorCode } from 'jsonc-parser'
import { srcUrl } from './env.ts'

const MODULE_DIR = fileURLToPath(srcUrl(import.meta.url, ''))

export const ENV_MANIFEST = 'tsconfig.envs.json'

export type EnvProgram = { env: string; configPath: string; files: string[] }
export type EnvSolution = { files: string[]; references: { path: string }[] }

/**
 * The declaration-emission suffix order: extensionless first, then every platform suffix. Imports
 * bind the unsuffixed default; variant files still enter the program as
 * roots so each is checked against the shared contract.
 */
export const PLATFORM_MODULE_SUFFIXES = [
  '',
  '.web',
  '.ios',
  '.android',
  '.mobile',
  '.native',
  '.macos',
  '.linux',
  '.gtk',
  '.windows',
]

/** Platform resolution and ambient runtime declarations for checking and consumers. */
export const TYPECHECK_ENVIRONMENTS = {
  web: {
    compilerOptions: {
      jsxImportSource: '@octane-xplat/jsx/dom',
      moduleSuffixes: ['.web', ''],
      customConditions: ['web'],
      lib: ['ESNext', 'DOM', 'DOM.Iterable'],
    },
  },
  native: {
    compilerOptions: {
      jsxImportSource: '@octane-xplat/jsx',
      moduleSuffixes: ['.ios', '.android', '.mobile', ''],
      customConditions: ['native'],
      lib: ['ESNext'],
    },
    ambient: ['typecheck-globals/native.d.ts'],
  },
  ios: {
    compilerOptions: {
      jsxImportSource: '@octane-xplat/jsx',
      moduleSuffixes: ['.ios', '.mobile', '.native', ''],
      customConditions: ['ios', 'native'],
      lib: ['ESNext'],
    },
    ambient: ['typecheck-globals/native.d.ts'],
  },
  android: {
    compilerOptions: {
      jsxImportSource: '@octane-xplat/jsx',
      moduleSuffixes: ['.android', '.mobile', '.native', ''],
      customConditions: ['android', 'native'],
      lib: ['ESNext'],
    },
    ambient: ['typecheck-globals/native.d.ts'],
  },
  macos: {
    compilerOptions: {
      jsxImportSource: '@octane-xplat/jsx',
      moduleSuffixes: ['.macos', ''],
      customConditions: ['macos'],
      lib: ['ESNext'],
    },
    // The renderer's host ambient covers the injected bridge globals
    // (dlopen, __xplatAppKit, Node-ish process/console). The AppKit class
    // surface itself is module-scoped now — @octane-xplat/platform/macos.
    ambient: ['typecheck-globals/macos.d.ts', '../../macos-appkit/src/host-globals.d.ts'],
  },
  linux: {
    compilerOptions: {
      jsxImportSource: '@octane-xplat/jsx/dom',
      moduleSuffixes: ['.linux', '.web', ''],
      customConditions: ['linux', 'web'],
      lib: ['ESNext', 'DOM', 'DOM.Iterable'],
    },
  },
  // The GTK4/GJS renderer — a native target, not the linux WebKit surface:
  // .gtk files never see .linux/.web leaves, and the program carries no DOM
  // lib. jsxImportSource is the shared native contract; the `gtk` condition
  // binds the host element type.
  gtk: {
    compilerOptions: {
      jsxImportSource: '@octane-xplat/jsx',
      moduleSuffixes: ['.gtk', ''],
      customConditions: ['gtk'],
      lib: ['ESNext'],
    },
    ambient: ['../../linux-gtk-renderer/src/host-globals.d.ts'],
  },
  windows: {
    compilerOptions: {
      jsxImportSource: '@octane-xplat/jsx',
      moduleSuffixes: ['.windows', '.native', ''],
      customConditions: ['windows', 'native'],
      lib: ['ESNext'],
    },
    ambient: ['typecheck-globals/native.d.ts'],
  },
}

/** Which environment a platform file suffix belongs to. */
const SUFFIX_ENV = {
  web: 'web',
  ios: 'native',
  android: 'native',
  mobile: 'native',
  native: 'native',
  macos: 'macos',
  windows: 'windows',
  linux: 'linux',
  gtk: 'gtk',
}

/** Strip // and block comments plus trailing commas so authored tsconfig-style files parse. */
function parseJsonc(text, path) {
  const errors = []
  const value = parse(text, errors, { allowTrailingComma: true })

  if (errors.length) {
    const error = errors[0]

    throw new Error(
      `${path}: invalid JSON — ${printParseErrorCode(error.error)} at offset ${error.offset}`,
    )
  }

  return value
}

export function loadEnvManifest(dir) {
  const path = join(dir, ENV_MANIFEST)

  if (!existsSync(path)) {
    return null
  }

  const manifest = parseJsonc(readFileSync(path, 'utf8'), path)

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error(`${path}: expected a JSON object`)
  }

  const envs = manifest.environments

  if (!envs || typeof envs !== 'object' || Array.isArray(envs) || !Object.keys(envs).length) {
    throw new Error(`${path}: expected a non-empty "environments" object`)
  }

  return { path, manifest }
}

// Extensions tsc accepts in `files`/`include` — glob results are filtered the
// same way include patterns are (styles, assets and other non-source files
// never enter the program).
const SOURCE_EXT = /\.(?:ts|tsx|mts|cts|tsrx|js|jsx|mjs|cjs)$/

function expandGlobs(dir, patterns, label, { required = true, sourcesOnly = true } = {}) {
  const files = new Set()

  for (const pattern of patterns ?? []) {
    let matched

    try {
      matched = globSync(pattern, { cwd: dir })
    } catch (e) {
      throw new Error(`${label}: bad pattern "${pattern}" — ${e.message}`)
    }

    const keep = sourcesOnly ? matched.filter((rel) => SOURCE_EXT.test(rel)) : matched

    if (required && !keep.length) {
      throw new Error(`${label}: pattern "${pattern}" matched no source files`)
    }

    for (const rel of keep) {
      files.add(resolve(dir, rel))
    }
  }

  return files
}

/**
 * Resolve one environment entry to its concrete root files.
 * entry = { files?: [...], include?: [...], exclude?: [...] } — paths are
 * relative to the manifest directory; include/exclude are glob patterns.
 */
function resolveEnvFiles(dir, entry, label) {
  const files = expandGlobs(dir, entry.include, label)

  for (const file of entry.files ?? []) {
    const abs = resolve(dir, file)

    if (!existsSync(abs)) {
      throw new Error(`${label}: file "${file}" does not exist`)
    }

    files.add(abs)
  }

  const excluded = expandGlobs(dir, entry.exclude, label, {
    required: false,
    sourcesOnly: false,
  })

  for (const file of files) {
    for (const abs of excluded) {
      if (file === abs || file.startsWith(`${abs}/`)) {
        files.delete(file)
        break
      }
    }
  }

  if (!files.size) {
    throw new Error(`${label}: resolved no files — an empty program would pass vacuously`)
  }

  return [...files].sort()
}

/** Map a `src/index[.<suffix>].*` barrel to the environment that must claim it. */
function barrelEnv(rel) {
  const match = /^src\/index(?:\.([A-Za-z]+))?\.(?:ts|tsx|mts|cts|tsrx)$/.exec(rel)

  if (!match) {
    return null
  }

  const suffix = match[1]

  if (!suffix) {
    return 'any' // unsuffixed default barrel — any environment may carry it
  }

  return SUFFIX_ENV[suffix] ?? null
}

const arraysEqual = (a, b) =>
  Array.isArray(a) && a.length === b.length && a.every((v, i) => v === b[i])

/** Platform tags on source files, including declarations and tests. */
function sourcePlatform(file) {
  return /\.(web|ios|android|mobile|native|macos|windows|linux|gtk)(?=\.)/.exec(file)?.[1]
}

function applicable(file, env) {
  const tag = sourcePlatform(file)

  if (!tag) {
    return true
  }

  if (tag === 'mobile') {
    return env === 'ios' || env === 'android'
  }

  if (tag === 'native') {
    return ['ios', 'android', 'windows'].includes(env)
  }

  return tag === env || (env === 'linux' && tag === 'web')
}

function platformTypes(types, env, dir) {
  const require = createRequire(join(dir, 'package.json'))
  const sdkPath = (name) => {
    try {
      return require.resolve(name)
    } catch {
      try {
        const owner = require.resolve('@nativescript/types/package.json')

        return createRequire(owner).resolve(name)
      } catch {
        return name
      }
    }
  }

  return types.flatMap((name) =>
    name === '@nativescript/types'
      ? ['ios', 'android'].includes(env)
        ? [
            sdkPath('@nativescript/types/globals.d.ts'),
            sdkPath(`@nativescript/types-${env}/index.d.ts`),
          ]
        : []
      : [name],
  )
}

function validateOptions(options, label) {
  if (
    options !== undefined &&
    (!options || typeof options !== 'object' || Array.isArray(options))
  ) {
    throw new Error(`${label}: compilerOptions must be an object`)
  }

  for (const key of ['types', 'lib']) {
    const value = options?.[key]

    if (
      value !== undefined &&
      (!Array.isArray(value) || value.some((item) => typeof item !== 'string'))
    ) {
      throw new Error(`${label}: compilerOptions.${key} must be an array of strings`)
    }
  }
}

/** Expand the manifest into independent platform programs; never merge SDKs. */
export function expandEnvPrograms(
  dir,
  { path: manifestPath, manifest },
  { ambientRoot = MODULE_DIR } = {},
): EnvProgram[] {
  const errors = []
  const resolved = {}
  const groups = new Map()

  validateOptions(manifest.compilerOptions, ENV_MANIFEST)

  const top = manifest.compilerOptions ?? {}

  for (const [env, entry] of Object.entries(manifest.environments)) {
    const preset = TYPECHECK_ENVIRONMENTS[env]

    if (!preset) {
      errors.push(`${ENV_MANIFEST}: unknown environment "${env}"`)
      continue
    }

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push(`${ENV_MANIFEST}: environment "${env}" must be an object`)
      continue
    }

    validateOptions(entry.compilerOptions, `${ENV_MANIFEST} environment "${env}"`)
    for (const key of ['files', 'include', 'exclude']) {
      if (
        entry[key] !== undefined &&
        (!Array.isArray(entry[key]) || entry[key].some((v) => typeof v !== 'string'))
      ) {
        throw new Error(`${ENV_MANIFEST}: environment "${env}" ${key} must be an array of strings`)
      }
    }

    for (const key of Object.keys(entry.compilerOptions ?? {})) {
      const allowed = ['types', 'lib']

      if (!allowed.includes(key)) {
        errors.push(`${ENV_MANIFEST}: environment "${env}" cannot override compilerOptions.${key}`)
      }
    }

    const files = resolveEnvFiles(dir, entry, `${ENV_MANIFEST} environment "${env}"`)

    resolved[env] = files
    for (const target of env === 'native' ? ['ios', 'android'] : [env]) {
      if (groups.has(target)) {
        errors.push(
          `${ENV_MANIFEST}: "${target}" overlaps the native environment; declare native or separate ios/android entries`,
        )

        continue
      }

      const options = TYPECHECK_ENVIRONMENTS[target]
      const libs = entry.compilerOptions?.lib ?? options.compilerOptions.lib

      if (
        !['web', 'linux'].includes(target) &&
        [...(top.lib ?? []), ...libs].some((v) => /^dom(?:\.|$)/i.test(v))
      ) {
        errors.push(
          `${ENV_MANIFEST}: DOM libraries are not allowed in "${target}"; put browser libraries in the web or linux environment`,
        )
      }

      const types = platformTypes(
        [...(top.types ?? []), ...(entry.compilerOptions?.types ?? [])],
        target,
        dir,
      )

      for (const sdk of ['ios', 'android']) {
        if (sdk !== target && types.some((t) => t.includes(`@nativescript/types-${sdk}`))) {
          errors.push(`${ENV_MANIFEST}: ${sdk} SDK types are not allowed in "${target}"`)
        }
      }

      const ambient = (options.ambient ?? [])
        .map((rel) => resolve(ambientRoot, rel))
        .filter(existsSync)

      // A default implementation shadowed by a leaf is not an active root.
      // Explicit imports can still reach it and are checked transitively.
      const active = files
        .filter((file) => applicable(file, target))
        .filter((file) => {
          if (target === 'linux' && sourcePlatform(file) === 'web') {
            return !existsSync(file.replace(/\.web(?=\.)/, '.linux'))
          }

          if (sourcePlatform(file) || file.endsWith('.d.ts')) {
            return true
          }

          const ext = /\.(tsrx|tsx|ts|mts|cts)$/.exec(file)?.[0]

          return (
            !ext ||
            !options.compilerOptions.moduleSuffixes
              .filter(Boolean)
              .some((suffix) => existsSync(file.slice(0, -ext.length) + suffix + ext))
          )
        })

      if (!active.length) {
        errors.push(`${ENV_MANIFEST}: "${target}" resolved no applicable source files`)
      }

      groups.set(target, {
        files: [...ambient, ...active],
        compilerOptions: {
          ...top,
          ...options.compilerOptions,
          // Keep JSX vocabulary explicit and independent of runtime resolution.
          jsxImportSource: top.jsxImportSource ?? '@octane-xplat/jsx',
          types: [...new Set(types)],
          lib: [...new Set([...(top.lib ?? []), ...libs])],
        },
      })
    }
  }

  for (const rel of globSync('src/index*.{ts,tsx,mts,cts,tsrx}', { cwd: dir })) {
    const env = barrelEnv(rel)

    if (!env) {
      continue
    }

    const files =
      env === 'any'
        ? Object.values(resolved).flat()
        : env === 'native'
          ? [...(resolved.native ?? []), ...(resolved.ios ?? []), ...(resolved.android ?? [])]
          : (resolved[env] ?? [])

    if (!files.includes(resolve(dir, rel))) {
      errors.push(`${ENV_MANIFEST}: ${rel} is not claimed by the "${env}" environment`)
    }
  }

  if (
    top.moduleSuffixes !== undefined &&
    !arraysEqual(top.moduleSuffixes, PLATFORM_MODULE_SUFFIXES)
  ) {
    errors.push(
      `${ENV_MANIFEST}: top-level moduleSuffixes is fixed; configure platform resolution through environments`,
    )
  }

  if (errors.length) {
    throw new Error(errors.join('\n'))
  }

  const outDir = join(dir, 'node_modules', '.cache', 'xplat-typecheck')

  mkdirSync(outDir, { recursive: true })
  return [...groups]
    .sort(
      ([a], [b]) =>
        ['web', 'ios', 'android', 'macos', 'windows', 'linux', 'gtk'].indexOf(a) -
        ['web', 'ios', 'android', 'macos', 'windows', 'linux', 'gtk'].indexOf(b),
    )
    .map(([env, group]) => {
      const configPath = join(outDir, `${env}.json`)

      // Compiler-only negative assertions also catch renamed/vendored ambient
      // declarations that the SDK-path inspection cannot recognize.
      const forbidden = [
        ...(['web', 'linux'].includes(env) ? [] : ['document', 'window', 'HTMLElement']),
        ...(env === 'ios' ? [] : ['UIView']),
        ...(env === 'android' ? [] : ['android.os.Build']),
      ]

      const canary = join(outDir, `isolation-${env}.ts`)

      writeFileSync(
        canary,
        'export {}\n' +
          forbidden
            .map((name) => `// @ts-expect-error ${name} must be absent in ${env}\nvoid ${name}\n`)
            .join(''),
      )

      group.files = [...group.files, canary]

      const config = { extends: manifestPath, ...group, include: [], exclude: [] }

      writeFileSync(configPath, JSON.stringify(config, null, '\t') + '\n')
      return { env, configPath, files: group.files }
    })
}

/** A solution makes generated programs discoverable from ordinary source files. */
export function envSolution(programs: EnvProgram[], dir: string): EnvSolution {
  return {
    files: [],
    references: programs.map(({ configPath }) => ({
      path: './' + configPath.slice(dir.length + 1).replaceAll('\\', '/'),
    })),
  }
}

/** Reject transitive ambient SDK leaks even when skipLibCheck hides their errors. */
export function assertPlatformIsolation(env, files) {
  for (const original of files) {
    const file = original.replaceAll('\\', '/')
    const sdk = /\/@nativescript\/types-(ios|android)\//.exec(file)?.[1]

    if (
      (!['web', 'linux'].includes(env) && /\/lib\.dom(?:\.[^/]*)?\.d\.ts$/i.test(file)) ||
      file.endsWith('/@nativescript/types/index.d.ts') ||
      (sdk && sdk !== env)
    ) {
      throw new Error(
        `typecheck[${env}]: transitive ambient leakage from ${original}; select a platform declaration or move the import into its platform leaf`,
      )
    }
  }
}

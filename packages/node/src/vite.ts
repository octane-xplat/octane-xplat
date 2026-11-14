import { fileURLToPath } from 'node:url'
import { normalizePath } from 'vite'
import type { Plugin, UserConfig } from 'vite'

const names = new Set(['events', 'util', 'assert', 'buffer', 'querystring', 'stream'])
const coreSubpaths = new Set([
  'assert/strict',
  'stream/promises',
  'stream/web',
  'stream/consumers',
  'util/types',
])

const builtin = (id: string) => {
  const name = id.startsWith('node:') ? id.slice(5) : id

  if (names.has(name)) {
    return name
  }

  if (coreSubpaths.has(name) || (id !== name && names.has(name.split('/')[0]))) {
    throw new Error(`Unsupported Node builtin subpath: ${id}`)
  }

  return undefined
}

export interface NodeBuiltinsOptions {
  /** Web client only by default; select native for non-Node app hosts. */
  target?: 'web' | 'native'
}

/** Bundle the selected builtins. Does not install globals or a dynamic loader. */
export function nodeBuiltins(options: NodeBuiltinsOptions = {}): Plugin {
  const engine = normalizePath(fileURLToPath(new URL('./engine.js', import.meta.url)))
  const engineUrl = `/@fs/${engine.replace(/^\//, '')}`
  const directory = normalizePath(fileURLToPath(new URL('./', import.meta.url)))
  const resolveBuiltin = (id: string) => {
    const name = builtin(id)

    return name ? normalizePath(fileURLToPath(new URL(`./${name}.js`, import.meta.url))) : undefined
  }

  return {
    name: 'xplat-node-builtins',
    enforce: 'pre',
    applyToEnvironment(environment) {
      return options.target === 'native' || environment.config.consumer === 'client'
    },
    config(config, environment) {
      if (options.target !== 'native' && environment.isSsrBuild) {
        return
      }

      const build = (config.build ??= {})
      const bundler = build.rolldownOptions ?? build.rollupOptions ?? (build.rolldownOptions = {})
      const previous = bundler.external

      // Mutate the owning option: returning a second external value would make
      // Vite concatenate it with an existing array from the AppKit preset.
      bundler.external = (id, importer, resolved) => {
        if (builtin(id)) {
          return false
        }

        if (typeof previous === 'function') {
          return previous(id, importer, resolved)
        }

        const patterns = Array.isArray(previous)
          ? previous
          : previous === undefined
            ? []
            : [previous]

        return patterns.some((pattern) =>
          typeof pattern === 'string' ? pattern === id : pattern.test(id),
        )
      }

      return {
        optimizeDeps: {
          rolldownOptions: {
            makeAbsoluteExternalsRelative: false,
            plugins: [
              {
                name: 'xplat-node-builtins-dependencies',
                resolveId: {
                  order: 'pre',
                  handler(id, importer) {
                    // The optimized CJS wrapper and the app must import the same
                    // engine URL. Bundling it here would create new constructors.
                    if (
                      id === engine ||
                      (id === './engine.js' &&
                        importer &&
                        normalizePath(importer).startsWith(directory))
                    ) {
                      return { id: engineUrl, external: true }
                    }

                    return resolveBuiltin(id)
                  },
                },
              },
            ],
          },
        },
      } satisfies UserConfig
    },
    resolveId(id) {
      const resolved = resolveBuiltin(id)

      if (resolved) {
        return resolved
      }
    },
  }
}

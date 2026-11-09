import { isAbsolute, relative, resolve } from 'node:path'
import type { Plugin, PluginOption } from 'vite'
import postcss from 'postcss'
import { tailwindCompiler } from './compiler.ts'
import { isBrowserTarget, type TailwindTarget } from './target.ts'

const targets = new Set<TailwindTarget>([
  'web',
  'ios',
  'android',
  'visionos',
  'macos',
  'windows',
  'linux',
  'gtk',
  'native',
])

async function collectPlugins(options: readonly PluginOption[]): Promise<Plugin[]> {
  const plugins: Plugin[] = []

  for (const pending of options) {
    const option = await pending

    if (Array.isArray(option)) {
      plugins.push(...(await collectPlugins(option)))
    } else if (option) {
      plugins.push(option)
    }
  }

  return plugins
}

function targetFromApi(api: unknown): TailwindTarget | undefined {
  if (typeof api !== 'object' || api === null || !('platform' in api)) {
    return
  }

  const platform = api.platform

  for (const target of targets) {
    if (target === platform) {
      return target
    }
  }
}

function hasTailwindCompiler(plugin: unknown): boolean {
  if (typeof plugin !== 'object' || plugin === null) {
    return false
  }

  if (
    'postcssPlugin' in plugin &&
    (plugin.postcssPlugin === '@tailwindcss/postcss' || plugin.postcssPlugin === 'tailwindcss')
  ) {
    return true
  }

  return (
    'plugins' in plugin && Array.isArray(plugin.plugins) && plugin.plugins.some(hasTailwindCompiler)
  )
}

/** Vite plugin returned by {@link xplatTailwind}. */
export type XplatTailwindPlugin = Plugin

/**
 * Add the official Tailwind v4 compiler to the configured Xplat CSS pipeline.
 * The target comes from the owning Xplat preset (or `xplatCss('web')`).
 * Import `@octane-xplat/tailwind` from an app stylesheet to opt that sheet in.
 * Other stylesheets bypass this compiler. Preflight is not included.
 *
 * @throws When the platform preset is missing/ambiguous or another Tailwind
 * compiler is already configured. Native output is not qualified yet.
 * @example
 * ```ts
 * import { xplatCss } from '@octane-xplat/build/vite'
 * import { xplatTailwind } from '@octane-xplat/tailwind/vite'
 * const plugins = [xplatCss('web'), xplatTailwind()]
 * ```
 */
export function xplatTailwind(): XplatTailwindPlugin {
  const entries = new Map<string, { files: string[]; directories: string[] }>()

  return {
    name: 'xplat-tailwind',
    enforce: 'post',
    async config(config) {
      const plugins = await collectPlugins(config.plugins ?? [])
      const platforms = plugins.filter((plugin) => plugin.name === 'xplat-platform-css')

      if (platforms.length !== 1) {
        throw new Error('xplatTailwind requires exactly one Xplat platform CSS preset')
      }

      const target = targetFromApi(platforms[0].api)

      if (!target) {
        throw new Error('xplatTailwind could not determine the Xplat CSS target')
      }

      if (
        plugins.filter((plugin) => plugin.name === 'xplat-tailwind').length !== 1 ||
        plugins.some((plugin) => plugin.name.startsWith('@tailwindcss/'))
      ) {
        throw new Error('Configure xplatTailwind once, without another Tailwind Vite plugin')
      }

      const settings = config.css?.postcss

      if (!settings || typeof settings !== 'object') {
        throw new Error('xplatTailwind requires the PostCSS configuration supplied by xplatCss')
      }

      const configuredPlugins = postcss(settings.plugins ?? []).plugins

      if (configuredPlugins.some(hasTailwindCompiler)) {
        throw new Error('Remove the separate Tailwind PostCSS compiler when using xplatTailwind')
      }

      if (!isBrowserTarget(target)) {
        const api: unknown = platforms[0].api

        if (
          typeof api !== 'object' ||
          api === null ||
          !('preserveLayers' in api) ||
          typeof api.preserveLayers !== 'boolean'
        ) {
          throw new Error(
            'Native Tailwind requires a build preset with cascade-layer coordination; update @octane-xplat/build',
          )
        }

        api.preserveLayers = true
      }

      settings.plugins = [
        ...configuredPlugins,
        tailwindCompiler({
          root: resolve(config.root ?? '.'),
          target,
          // The Linux webview uses xplatCss('web') with Linux/web module
          // conditions. Its JS leaves differ while its CSS remains browser CSS.
          sourceTarget:
            target === 'web' && config.resolve?.conditions?.includes('linux') ? 'linux' : target,
          onCompile(entry, dependencies) {
            entries.set(entry.replaceAll('\\', '/'), dependencies)
          },
        }),
      ]
    },
    hotUpdate(context) {
      const updates = new Set(context.modules)
      let affected = false

      for (const [entry, dependencies] of entries) {
        const withinDirectory = dependencies.directories.some((directory) => {
          const path = relative(directory, context.file)

          return (
            path === '' ||
            (path !== '..' &&
              !path.startsWith('../') &&
              !path.startsWith('..\\') &&
              !isAbsolute(path))
          )
        })

        if (
          context.file !== entry &&
          !dependencies.files.includes(context.file) &&
          !withinDirectory
        ) {
          continue
        }

        for (const module of this.environment.moduleGraph.getModulesByFile(entry) ?? []) {
          this.environment.moduleGraph.invalidateModule(module)
          updates.add(module)
          affected = true
        }
      }

      if (affected) {
        return [...updates]
      }
    },
  }
}

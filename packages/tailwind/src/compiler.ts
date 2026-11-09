import type { AtRule, Plugin } from 'postcss'
import { compileStylesheet } from './compile.ts'

import { adaptNativeStylesheet } from './native.ts'
import { isBrowserTarget, type TailwindTarget } from './target.ts'

/** Configuration bound to one Vite project and renderer. */
export interface TailwindCompilerOptions {
  root: string
  target: TailwindTarget
  /** Source leaf selection can differ from CSS vocabulary (Linux's webview). */
  sourceTarget?: TailwindTarget
  onCompile?: (entry: string, dependencies: { files: string[]; directories: string[] }) => void
}

/** PostCSS plugin produced for one project/renderer pair. */
export type TailwindCompilerPlugin = Plugin

/** Compile only stylesheets that explicitly import the Xplat Tailwind entry. */
export function tailwindCompiler({
  root: projectRoot,
  target,
  sourceTarget = target,
  onCompile,
}: TailwindCompilerOptions): TailwindCompilerPlugin {
  return {
    postcssPlugin: 'xplat-tailwind',
    async Once(root, { result }) {
      root.walkComments((comment) => {
        if (comment.text.trim() === '@xplat-curated-utilities') {
          throw comment.error(
            'Remove @octane-xplat/ui/theme/utilities.css when using tailwind(); choose one utility stylesheet',
            { plugin: 'xplat-tailwind' },
          )
        }
      })

      const markers: AtRule[] = []

      root.walkAtRules('xplat-tailwind', (rule) => {
        markers.push(rule)
      })

      if (markers.length === 0) {
        return
      }

      if (markers.length !== 1) {
        throw root.error('Import @octane-xplat/tailwind once per stylesheet', {
          plugin: 'xplat-tailwind',
        })
      }

      const input = root.clone()

      input.walkAtRules('xplat-tailwind', (rule) => {
        rule.remove()
      })

      const entry = result.opts.from ?? root.source?.input.file
      const compiled = await compileStylesheet(input, projectRoot, sourceTarget, entry)

      if (entry && onCompile) {
        onCompile(entry, {
          files: compiled.files,
          directories: [projectRoot, ...compiled.directories.map(({ dir }) => dir)],
        })
      }

      // Forward dependency and directory-dependency messages to Vite, which
      // owns watching imported CSS and original source files in development.
      for (const file of compiled.files) {
        result.messages.push({ type: 'dependency', plugin: 'xplat-tailwind', file, parent: entry })
      }

      for (const { dir, glob } of compiled.directories) {
        result.messages.push({
          type: 'dir-dependency',
          plugin: 'xplat-tailwind',
          dir,
          glob,
          parent: entry,
        })
      }

      if (!isBrowserTarget(target)) {
        await adaptNativeStylesheet(compiled.root, target)
      }

      root.removeAll().append(compiled.root.nodes)
      root.raws.indent = compiled.root.raws.indent
    },
  }
}

import postcss, { type AtRule, type Plugin } from 'postcss'
import tailwindcss from '@tailwindcss/postcss'

import { adaptNativeStylesheet } from './native.ts'
import type { TailwindTarget } from './target.ts'

/** Configuration bound to one Vite project and renderer. */
export interface TailwindCompilerOptions {
  root: string
  target: TailwindTarget
  onCompile?: (entry: string, dependencies: { files: string[]; directories: string[] }) => void
}

/** PostCSS plugin produced for one project/renderer pair. */
export type TailwindCompilerPlugin = Plugin

/** Compile only stylesheets that explicitly import the Xplat Tailwind entry. */
export function tailwindCompiler({
  root: projectRoot,
  target,
  onCompile,
}: TailwindCompilerOptions): TailwindCompilerPlugin {
  // Tailwind's optimize pass reparses generated CSS and loses original source
  // locations. Vite owns final minification; keep the compiler AST here.
  const compiler = tailwindcss({ base: projectRoot, optimize: false })

  return {
    postcssPlugin: 'xplat-tailwind',
    async Once(root, { result }) {
      const markers: AtRule[] = []
      root.walkAtRules('xplat-tailwind', (rule) => {
        markers.push(rule)
      })
      if (markers.length === 0) return
      if (markers.length !== 1) {
        throw root.error('Import @octane-xplat/tailwind once per stylesheet', {
          plugin: 'xplat-tailwind',
        })
      }

      const input = root.clone()
      input.walkAtRules('xplat-tailwind', (rule) => {
        rule.remove()
      })
      const compiled = await postcss([compiler]).process(input, {
        ...result.opts,
        from: result.opts.from ?? root.source?.input.file,
      })
      if (compiled.root.type !== 'root') {
        throw root.error('Tailwind returned a document instead of a stylesheet')
      }

      const entry = result.opts.from ?? root.source?.input.file
      if (entry && onCompile) {
        const files: string[] = []
        const directories = [projectRoot]
        for (const message of compiled.messages) {
          if (message.type === 'dependency' && typeof message.file === 'string')
            files.push(message.file)
          if (message.type === 'dir-dependency' && typeof message.dir === 'string')
            directories.push(message.dir)
        }
        onCompile(entry, { files, directories })
      }
      // Forward dependency and directory-dependency messages to Vite, which
      // owns watching imported CSS and original source files in development.
      result.messages.push(...compiled.messages)
      if (target !== 'web') adaptNativeStylesheet(compiled.root, target)
      root.removeAll().append(compiled.root.nodes)
      root.raws.indent = compiled.root.raws.indent
    },
  }
}

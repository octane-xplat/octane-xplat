import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { compileAst } from '@tailwindcss/node'
import { Scanner } from '@tailwindcss/oxide'
import valueParser from 'postcss-value-parser'
import type { Root } from 'postcss'
import { fromTailwindAst, toTailwindAst } from './ast.ts'
import { selectSourceFiles } from './sources.ts'
import type { TailwindTarget } from './target.ts'

export interface CompiledStylesheet {
  root: Root
  files: string[]
  directories: Array<{ dir: string; glob: string }>
}

/** Compile a complete snapshot; rejected/deleted classes cannot survive in a cache. */
export async function compileStylesheet(
  input: Root,
  projectRoot: string,
  target: TailwindTarget,
  entry?: string,
): Promise<CompiledStylesheet> {
  if (entry?.endsWith('.module.css')) {
    throw input.error('Import the Xplat Tailwind entry in a global stylesheet, outside CSS Modules')
  }

  const base = entry ? dirname(resolve(entry)) : projectRoot

  // Vite inlines imports first. Tailwind directives in those imports still
  // resolve relative to the file that authored them.
  input.walkAtRules(/^(source|plugin|config|tailwind)$/, (rule) => {
    const origin = rule.source?.input.file

    if (!origin || dirname(origin) === base) {
      return
    }

    const parsed = valueParser(rule.params)

    parsed.walk((node) => {
      // inline() contains class names, not filesystem paths. In particular an
      // arbitrary candidate may itself begin with ./ or ../.
      if (node.type === 'function' && node.value === 'inline') {
        return false
      }

      if (node.type !== 'string' || !/^\.\.?\//.test(node.value)) {
        return
      }

      const path = relative(base, resolve(dirname(origin), node.value))
        .split(sep)
        .join('/')

      node.value = path.startsWith('.') ? path : `./${path}`
    })

    rule.params = parsed.toString()
  })

  const files = new Set<string>()
  const compiler = await compileAst(toTailwindAst(input), {
    base,
    from: entry,
    onDependency: (file) => files.add(resolve(file)),
    shouldRewriteUrls: true,
  })

  const sources =
    compiler.root === 'none'
      ? []
      : [
          compiler.root
            ? { ...compiler.root, negated: false }
            : { base: projectRoot, pattern: '**/*', negated: false },
        ]

  const scanner = new Scanner({ sources: [...sources, ...compiler.sources] })
  const discoveredFiles = scanner.files
  const selectedFiles = selectSourceFiles(discoveredFiles, target)
  const candidates = scanner.scanFiles(
    selectedFiles.map((file) => ({ file, extension: extname(file).slice(1) })),
  )

  const ast = compiler.build(candidates)

  // Watch shadowed leaves too: adding/removing a preferred leaf must restore
  // the fallback's candidates on the next complete snapshot.
  for (const file of discoveredFiles) {
    const path = isAbsolute(file) ? file : resolve(file)

    if (path !== entry) {
      files.add(path)
    }
  }

  return {
    root: fromTailwindAst(ast, input.source),
    files: [...files],
    directories: scanner.globs.map(({ base: dir, pattern: glob }) => ({ dir: resolve(dir), glob })),
  }
}

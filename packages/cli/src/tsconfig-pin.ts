// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { parse as parseJsonc } from 'jsonc-parser'

/**
 * Vite 8's oxc transform resolves each file's governing tsconfig.json and
 * follows its project references. References-style configs point at the env
 * programs `xplat typecheck` generates under node_modules/.cache — absent
 * on a fresh install, so every plain-source transform fails with
 * TSCONFIG_ERROR. Return the committed env manifest beside the nearest
 * governing tsconfig.json while a reference dangles; ordinary discovery
 * resumes once the programs exist.
 */
export function transformTsconfig(root) {
  let dir = resolve(root)

  // The nearest tsconfig.json governs files under `root` the same way the
  // transform discovers them — keep walking up past nested fixture and
  // output directories until one is found.
  for (;;) {
    if (existsSync(join(dir, 'tsconfig.json'))) {
      break
    }

    const parent = dirname(dir)
    if (parent === dir) {
      return undefined
    }

    dir = parent
  }

  const manifest = join(dir, 'tsconfig.envs.json')
  if (!existsSync(manifest)) {
    return undefined
  }

  const config = parseJsonc(readFileSync(join(dir, 'tsconfig.json'), 'utf8'))
  const references = Array.isArray(config?.references) ? config.references : []

  return references.some((reference) => {
    const path = reference?.path
    return (
      typeof path === 'string' &&
      /^(?:\.\/)?node_modules\/\.cache\/xplat-typecheck\//.test(path.replaceAll('\\', '/')) &&
      !existsSync(resolve(dir, path))
    )
  })
    ? manifest
    : undefined
}

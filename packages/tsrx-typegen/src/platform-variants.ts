import { existsSync } from 'node:fs'
import { basename, dirname, extname, join } from 'node:path'

export const defaultExtensions = {
  '.ts': '.js',
  '.tsx': '.js',
  '.tsrx': '.js',
  '.mts': '.mjs',
  '.cts': '.cjs',
}

// A suffixed source like `billing.macos.ts` is the platform implementation
// behind an unsuffixed `billing.ts` contract — it never carries declarations
// of its own. Returns the existing unsuffixed sibling when the basename's
// stem ends with a non-empty moduleSuffixes entry, otherwise undefined.
export function platformVariantOf(file, moduleSuffixes, extensions = Object.keys(defaultExtensions)) {
  const extension = extname(file)
  const stem = basename(file, extension)
  const suffix = (moduleSuffixes ?? [])
    .filter((candidate) => candidate)
    .find((candidate) => stem.endsWith(candidate))
  if (!suffix) {
    return undefined
  }

  const base = stem.slice(0, -suffix.length)
  for (const candidate of extensions) {
    const sibling = join(dirname(file), base + candidate)
    if (sibling !== file && existsSync(sibling)) {
      return sibling
    }
  }

  return undefined
}

// Execution tools must come from the selected project, never Node's global paths.
import { existsSync, realpathSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'

function installed(fromDir: string, name: string, manifest: boolean): string | null {
  if (
    !/^(?:@[A-Za-z0-9._-]+\/)?[A-Za-z0-9._-]+$/.test(name) ||
    name.split('/').some((part) => part === '.' || part === '..')
  ) {
    return null
  }
  let current = resolve(fromDir)
  for (;;) {
    if (basename(current) !== 'node_modules') {
      const candidate = join(current, 'node_modules', name)
      if (existsSync(manifest ? join(candidate, 'package.json') : candidate)) {
        return realpathSync(candidate)
      }
    }

    const parent = dirname(current)
    if (parent === current) {
      return null
    }

    current = parent
  }
}

export const installedPackageRoot = (fromDir: string, name: string): string | null =>
  installed(fromDir, name, true)

export const installedPackageDir = (fromDir: string, name: string): string | null =>
  installed(fromDir, name, false)

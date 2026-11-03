// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

/** Directory of the installed package `name` as resolved from `fromDir`,
 *  walking Node's node_modules lookup chain (so pnpm workspaces with
 *  `nodeLinker: hoisted` resolve deps living only in the workspace root).
 *  Does not require `<name>/package.json` to be in the package's exports —
 *  only that the package directory exists on the chain. Returns the realpath
 *  (pnpm store/virtual-store links are followed) or null when absent. */
export function installedPackageRoot(fromDir, name) {
  // The trailing slash makes builtin-named npm dependencies use node_modules lookup.
  for (const base of createRequire(join(fromDir, 'package.json')).resolve.paths(`${name}/`) ?? []) {
    const candidate = join(base, name, 'package.json')
    if (existsSync(candidate)) {
      return realpathSync(dirname(candidate))
    }
  }

  return null
}

/** Like {@link installedPackageRoot} but only requires the package directory
 *  to exist on the node_modules chain — used where an installed (possibly
 *  symlinked) dep's location matters, not its manifest. */
export function installedPackageDir(fromDir, name) {
  for (const base of createRequire(join(fromDir, 'package.json')).resolve.paths(`${name}/`) ?? []) {
    const candidate = join(base, name)
    if (existsSync(candidate)) {
      return realpathSync(candidate)
    }
  }

  return null
}

/** Resolve an app's tool, falling back only to the installed umbrella's declared tools. */
export function installedToolPackageRoot(fromDir, name) {
  const direct = installedPackageRoot(fromDir, name)
  if (direct) {
    return direct
  }
  const umbrella = installedPackageRoot(fromDir, 'octane-xplat')
  if (!umbrella) {
    return null
  }
  const manifest = JSON.parse(readFileSync(join(umbrella, 'package.json'), 'utf8'))
  return manifest.dependencies?.[name] ? installedPackageRoot(umbrella, name) : null
}

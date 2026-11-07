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

/** Resolve `siblingFile` beside the app's installed `@octane-xplat/cli`
 *  `exportPath` export (e.g. `appCliFile(app, 'macos', 'host.js')`), or null
 *  when the export or sibling is absent. The app's selected installation is
 *  authoritative — no fallback to global paths. */
export function appCliFile(app, exportPath, siblingFile) {
  try {
    const cli = installedToolPackageRoot(app.root, '@octane-xplat/cli')
    const require = createRequire(join(cli ?? app.root, 'package.json'))
    const resolved = require.resolve(`@octane-xplat/cli/${exportPath}`)
    const file = join(dirname(resolved), siblingFile)
    return existsSync(file) ? file : null
  } catch {
    return null
  }
}

/** Resolve a tool's module entry from the app, falling back only to the
 *  installed umbrella's declared dependency. Returns null when neither has it. */
export function resolveProjectTool(fromDir, name) {
  try {
    return createRequire(join(fromDir, 'package.json')).resolve(name)
  } catch {}
  const umbrella = installedPackageRoot(fromDir, 'octane-xplat')
  if (!umbrella) {
    return null
  }
  const manifest = JSON.parse(readFileSync(join(umbrella, 'package.json'), 'utf8'))
  if (!manifest.dependencies?.[name]) {
    return null
  }
  try {
    return createRequire(join(umbrella, 'package.json')).resolve(name)
  } catch {
    return null
  }
}

// Resolve optional JavaScript entry points without importing or invoking them.
import { lstatSync, realpathSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, sep } from 'node:path'

export function checkUpdatesDependencies() {
  const project = realpathSync(process.cwd())
  const require = createRequire(join(project, 'package.json'))
  const resolved = [
    ['@octane-xplat/updates', '@octane-xplat/updates/prepare'],
    ['@octane-xplat/fingerprint', '@octane-xplat/fingerprint'],
  ].map(([name, specifier]) => {
    for (let at = project; ; at = dirname(at)) {
      const candidate = join(at, 'node_modules', name)
      let found = false

      try {
        lstatSync(candidate)
        found = true
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error
        }
      }

      if (found) {
        const root = realpathSync(candidate),
          entry = realpathSync(require.resolve(specifier))

        if (!entry.startsWith(root + sep) || !statSync(entry).isFile()) {
          throw new Error(`Reinstall ${name} in the selected project: invalid entry point`)
        }

        return { specifier, entry }
      }

      if (dirname(at) === at) {
        throw new Error(`Install ${name} in the selected project before running updates init`)
      }
    }
  })

  return { version: 1, project, resolved }
}

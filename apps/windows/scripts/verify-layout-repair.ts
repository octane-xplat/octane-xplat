import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(new URL('../package.json', import.meta.url))
const widgets = new URL('../App_Resources/Windows/Widgets/', import.meta.url)
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')

/** Reject mixed Core/native inputs before Vite bundles the Windows app. */
export function verifyWindowsLayoutRepair() {
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', widgets), 'utf8'))
  for (const file of manifest.files) {
    if (sha256(readFileSync(new URL('x64/' + file.name, widgets))) !== file.sha256) {
      throw new Error(`The repository-selected Windows layout artifact changed: ${file.name}`)
    }
  }

  const coreModulePath = require.resolve(manifest.coreModule.specifier)
  if (sha256(readFileSync(coreModulePath)) !== manifest.coreModule.sha256) {
    throw new Error(
      'The installed Windows Core layout module does not match the selected Widgets repair. ' +
        'Refresh dependencies with the project’s frozen lockfile before building.',
    )
  }
}

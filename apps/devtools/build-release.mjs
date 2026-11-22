import { execFileSync } from 'node:child_process'
import { mkdir, rename, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { packageMacOS } from '../../packages/cli/src/macos/package.ts'

const root = fileURLToPath(new URL('.', import.meta.url))
const directory = join(root, 'dist/release')
const archiveName = 'xplat-devtools-macos-universal.zip'
const { appPath } = await packageMacOS(root, { publish: false })

try {
  await mkdir(directory, { recursive: true })
  const archive = join(dirname(appPath), archiveName)
  execFileSync('/usr/bin/ditto', ['-c', '-k', '--keepParent', appPath, archive], {
    stdio: 'inherit',
  })
  await rename(archive, join(directory, archiveName))
} finally {
  await rm(dirname(appPath), { recursive: true, force: true })
}

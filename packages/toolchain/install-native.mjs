// Installation only: the xplat command itself never starts Node.
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const cli = dirname(require.resolve('@octane-xplat/cli/package.json'))
const { installNative } = await import(pathToFileURL(join(cli, 'install-native.mjs')).href)

// Select the verified payload directly; dependency postinstall ordering and
// a blocked CLI hook must not leave the umbrella pointing at a placeholder.
const prepare = process.argv.includes('--prepare-package')

if (!prepare) {
  installNative(cli)
}

installNative(import.meta.dirname, prepare)

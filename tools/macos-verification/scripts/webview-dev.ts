import { fileURLToPath } from 'node:url'
import { runMacOSWebViewDev } from '@octane-xplat/cli/macos'

await runMacOSWebViewDev(fileURLToPath(new URL('../../../apps/mobile/', import.meta.url)))

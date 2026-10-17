// The CLI's own service identity — reported as `server` in status payloads so
// an agent can tell which entry point answered (xplat CLI vs xplat-mcp).
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const manifest = JSON.parse(
	readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf8'),
)

export const CLI_NAME = manifest.name // @octane-xplat/cli
export const CLI_VERSION = manifest.version

export const cliServerIdentity = () => ({ name: CLI_NAME, version: CLI_VERSION })

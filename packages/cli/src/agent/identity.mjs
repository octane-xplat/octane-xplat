// The CLI's own service identity — reported as `server` in status payloads so
// an agent can tell which entry point answered (xplat CLI vs xplat-mcp).
import { readFileSync } from 'node:fs'

const manifest = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))

export const CLI_NAME = manifest.name // @octane-xplat/cli
export const CLI_VERSION = manifest.version

export const cliServerIdentity = () => ({ name: CLI_NAME, version: CLI_VERSION })

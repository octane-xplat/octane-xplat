import { readFileSync } from 'node:fs'
import { iosSimulators, androidDevices, hostBlock } from '../../packages/cli/src/mcp/runtime/targets.ts'
const request = JSON.parse(readFileSync(0, 'utf8'))
const value = request.operation === 'host-block' ? hostBlock(request.platform, request.host)
 : (request.platform === 'ios' ? iosSimulators : androidDevices)({ exec: () => request.output ?? null })
console.log(JSON.stringify({ ok: true, value }))

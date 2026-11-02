// Set umask only in an isolated test process, never in the test coordinator.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { dirname } from 'node:path'
import { generateRoutes } from '../../packages/cli/src/commands/routes.ts'
const require = createRequire(new URL('../../packages/cli/package.json', import.meta.url))
const { log } = require('@clack/prompts')
const request = JSON.parse(readFileSync(0, 'utf8'))
process.umask(request.umask)
if (request.native) {
 const run = spawnSync(request.binary, [], { input: JSON.stringify(request.request) + '\n', encoding: 'utf8', env: { ...process.env, PATH: dirname(process.execPath) }, timeout: 10_000 })
 if (run.status !== 0) throw Error(run.stderr)
 const result = JSON.parse(run.stdout)
 if (result.ok) delete result.value.outputs
 console.log(JSON.stringify(result))
} else {
 const warnings = []
 log.warn = message => warnings.push(message)
 try { console.log(JSON.stringify({ ok: true, value: { count: await generateRoutes(request.dir, undefined, undefined, { bake: false }), warnings } })) }
 catch (error) { console.log(JSON.stringify({ ok: false, message: error.message, warnings })) }
}

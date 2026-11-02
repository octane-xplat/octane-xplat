import { readFileSync } from 'node:fs'
import { createLogBuffer } from '../../packages/cli/src/mcp/runtime/logs.ts'
const request = JSON.parse(readFileSync(0,'utf8'))
const logs = createLogBuffer({ limit: request.limit }), observed = [], replies = []
const unwatch = logs.watch(record => observed.push(structuredClone(record)))
for (const step of request.steps) {
 let value
 switch (step.op) {
  case 'append': value = logs.append(step); break
  case 'note': value = logs.note(step.line); break
  case 'reset': logs.reset(step.reason); value = null; break
  case 'unwatch': unwatch(); value = null; break
  case 'observed': value = observed; break
  case 'read': value = logs.read(step); break
  default: throw Error('Unknown log scenario')
 }
 replies.push(structuredClone(value))
}
console.log(JSON.stringify(replies))

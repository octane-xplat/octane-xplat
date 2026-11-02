import { readFileSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { createSessionRegistry } from '../../packages/cli/src/mcp/contracts/sessions.ts'
const request = JSON.parse(readFileSync(0, 'utf8'))
const registry = createSessionRegistry(), replies = [], events = [], cleanupCalls = []
registry.watch(value => events.push(structuredClone(value)))
for (const step of request.steps) {
 try {
  let value
  const id = step.id
  switch (step.op) {
   case 'bind': value = registry.bindOwned({ ...step.input, cleanup: async () => {
    cleanupCalls.push(step.input.sessionId)
    if (step.cleanup?.delayMs) await delay(step.cleanup.delayMs)
    if (step.cleanup?.fail) throw Error('Fixture cleanup failure')
    return { released: step.cleanup?.released ?? [] }
   } }); break
   case 'attach': value = registry.attach(step.input); break
   case 'get': value = registry.get(id); break
   case 'list': value = registry.list(); break
   case 'usable': value = registry.requireUsable(id); break
   case 'ready': value = registry.markReady(id, step.meta); break
   case 'disconnect': value = registry.markDisconnected(id, step.detail); break
   case 'launch': value = registry.setLaunch(id, step.progress); break
   case 'fail': value = registry.markFailed(id, step.error); break
   case 'end': value = await registry.end(id); break
   case 'concurrent-end': {
    let firstDone = false, secondDone = false
    const first = registry.end(id).then(value => { firstDone = true; return value })
    const second = registry.end(id).then(value => { secondDone = true; return value })
    await Promise.resolve()
    const waited = !firstDone && !secondDone
    value = { waited, first: await first, second: await second, pendingAfter: false }
    break
   }
   case 'shutdown': value = await registry.shutdown(); break
   default: throw Error('Unknown session scenario operation')
  }
  replies.push({ ok: true, value: value ?? null })
 } catch (error) { replies.push({ ok: false, message: error.message }) }
}
console.log(JSON.stringify({ ok: true, value: { replies, events, cleanupCalls, observerFailures: 0 } }))

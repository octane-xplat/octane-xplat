import { readFileSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { createJobRegistry } from '../../packages/cli/src/mcp/contracts/sessions.ts'
const request = JSON.parse(readFileSync(0, 'utf8'))
const registry = createJobRegistry({ historyLimit: request.historyLimit }), ids = new Map(), controls = new Map()
const replies = [], runnerCalls = []
for (const step of request.steps) {
 let value
 const alias = step.alias, id = ids.get(alias) ?? alias
 try {
  switch (step.op) {
   case 'start': {
    let run
    if (step.runner) {
     let resolve
     const gate = new Promise(done => { resolve = done }), control = { resolve }
     controls.set(alias, control)
     run = (signal, progress) => {
      runnerCalls.push(alias)
      const spec = step.runner
      control.task = (async () => {
       if (spec.progress) progress(spec.progress)
       let result
       if (spec.untilCancelled) {
        while (!signal.aborted) await delay(1)
        if (spec.cleanupDelayMs) await delay(spec.cleanupDelayMs)
        result = spec.result
       } else if (spec.gate) result = await gate
       else {
        if (spec.delayMs) await delay(spec.delayMs)
        result = spec.result
       }
       if (spec.failure) {
        if (spec.failure.code) throw spec.failure
        throw Error(spec.failure.message)
       }
       return result
      })()
      return control.task
     }
    }
    value = registry.start({ ...step.input, run })
    ids.set(alias, value.job.jobId)
    break
   }
   case 'status': value = registry.status(id); break
   case 'list': value = registry.list(); break
   case 'progress': value = registry.setProgress(id, step.progress); break
   case 'succeed': value = registry.succeed(id, step.result); break
   case 'fail': value = registry.fail(id, step.error); break
   case 'cancel': value = registry.cancel(id); break
   case 'complete': controls.get(alias).resolve(step.result); break
   case 'wait':
    await controls.get(alias)?.task?.catch(() => {})
    await Promise.resolve()
    value = registry.status(id)
    break
   case 'pause': await delay(step.ms); break
   default: throw Error('Unknown job scenario operation')
  }
  replies.push({ ok: true, value: value ?? null })
 } catch (error) { replies.push({ ok: false, message: error.message }) }
}
console.log(JSON.stringify({ ok: true, value: { replies, runnerCalls } }))

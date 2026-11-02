// Actual TypeScript process boundary, with an injected child only for byte loops.
import { spawnManaged } from '../../packages/cli/src/mcp/runtime/process.ts'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { once } from 'node:events'
import { createInterface } from 'node:readline'
import { spawn } from 'node:child_process'

async function execute(request) {
 if (request.operation === 'parallel') return Promise.all(request.requests.map(execute))
 const records = [], notes = []
 const logs = { append: record => records.push(record), note: line => notes.push(line) }
 if (request.operation === 'lines') {
  const fake = new EventEmitter()
  Object.assign(fake, { stdout: new PassThrough(), stderr: new PassThrough(), exitCode: null, signalCode: null })
  const child = spawnManaged({ cmd: 'byte-fixture', logBuffer: logs, spawnImpl: () => fake })
  for (const chunk of request.chunks) fake.stdout.write(Buffer.from(chunk, 'base64'))
  const ended = Promise.all([once(fake.stdout, 'end'), once(fake.stderr, 'end')])
  fake.stdout.end(); fake.stderr.end()
  await ended
  fake.exitCode = 0
  fake.emit('close', 0, null)
  await child.exit
  return records
 }
 const controller = new AbortController()
 if (request.preabort) controller.abort()
 let timer
 const before = process.cwd()
 const stdout = [], stderr = []
 try {
  let child
  logs.append = record => {
   records.push(record)
   if (record.line === request.stopOnLine) controller.abort()
  }
  child = spawnManaged({ cmd: request.cmd, args: request.args, cwd: request.cwd, env: request.env,
   graceMs: request.graceMs ?? 100, signal: controller.signal, logBuffer: logs,
   spawnImpl: (...args) => {
    const process = spawn(...args)
    if (request.raw) {
     process.stdout.on('data', bytes => stdout.push(bytes))
     process.stderr.on('data', bytes => stderr.push(bytes))
    }
    return process
   } })
  if (request.abortMs != null) timer = setTimeout(() => controller.abort(), request.abortMs)
  if (request.doubleStop) {
   const first = child.stop()
   if (first !== child.stop()) throw Error('stop future must be shared')
   await first
  }
  const status = await child.exit
  if (request.repeatStop) await child.stop()
  return { records, notes, pid: child.pid ?? 0, cwdUnchanged: before === process.cwd(),
   ...(request.raw ? { stdoutBase64: Buffer.concat(stdout).toString('base64'), stderrBase64: Buffer.concat(stderr).toString('base64') } : {}),
   exit: { code: status.code, signal: status.signal,
    ...(status.error ? { error: status.error.message, errorCode: status.error.code } : {}) } }
 } finally { clearTimeout(timer) }
}
for await (const line of createInterface({ input: process.stdin, crlfDelay: Infinity })) {
 try { console.log(JSON.stringify(await execute(JSON.parse(line)))) }
 catch (error) { console.log(JSON.stringify({ invalid: error.message })) }
}

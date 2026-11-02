import { createInterface } from 'node:readline'
import { fetchBridgeRegistry, submitInvocation, awaitInvocation, cancelInvocation } from '../../packages/cli/src/mcp/actions/bridge.ts'
async function execute(request) {
 const signal = new AbortController()
 const timers = []
 if (request.preabort) signal.abort()
 if (request.abortMs !== undefined) timers.push(setTimeout(() => signal.abort(), request.abortMs))
 const timed = request.timeoutMs !== undefined ? AbortSignal.timeout(request.timeoutMs) : undefined
 let phase = 'headers'
 try {
  if (request.operation === 'bridge') {
   const endpoint = { url: request.url, token: request.token }
   if (request.call === 'registry') return await fetchBridgeRegistry(endpoint)
   if (request.call === 'submit') return await submitInvocation(endpoint, request.invocation)
   if (request.call === 'cancel') return await cancelInvocation(endpoint, request.requestId)
   if (request.call === 'await') return await awaitInvocation(endpoint, request.requestId, request.waitMs, signal.signal)
   throw Error('Unknown bridge operation')
  }
  const init = { method: request.method, headers: request.headers, signal: timed ? AbortSignal.any([signal.signal, timed]) : signal.signal }
  if (request.body !== undefined) init.body = request.body
  if (request.bodyBase64 !== undefined) init.body = Buffer.from(request.bodyBase64, 'base64')
  const response = await fetch(request.url, init)
  const value = { status: response.status, statusText: response.statusText, url: response.url,
   redirected: response.redirected, ok: response.ok, headers: [...response.headers] }
  phase = 'body'
  if (request.stream) {
   const chunks = []
   for await (const bytes of response.body ?? []) chunks.push(bytes)
   value.bodyBase64 = Buffer.concat(chunks).toString('base64')
  } else if (request.consume === 'none') await response.body?.cancel()
  else if (request.consume === 'json') value.body = await response.json()
  else if (request.consume === 'bytes') value.bodyBase64 = Buffer.from(await response.arrayBuffer()).toString('base64')
  else value.body = await response.text()
  if (request.doubleRead) {
   try { await response.arrayBuffer(); value.secondRead = true }
   catch (error) { value.secondRead = error.message }
  }
  value.bodyUsed = response.bodyUsed
  return { success: true, value }
 } catch (error) { return { success: false, phase, name: error.name, message: error.message } }
 finally { for (const timer of timers) clearTimeout(timer) }
}
for await (const line of createInterface({ input: process.stdin })) {
 const request = JSON.parse(line)
 let result
 if (request.operation === 'normalize') {
  try {
   const url = request.base ? new URL(request.url, request.base) : new URL(request.url)
   if (!['http:','https:'].includes(url.protocol) || url.username || url.password) throw Error('not fetchable')
   url.hash = ''; result = { valid: true, url: url.href, origin: url.origin }
  } catch { result = { valid: false } }
 } else result = request.operation === 'parallel' ? await Promise.all(request.requests.map(execute)) : await execute(request)
 console.log(JSON.stringify(result))
}

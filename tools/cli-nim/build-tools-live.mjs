// Copied into the isolated packed consumer: every package import resolves there.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer, build } from 'vite'
import * as plugins from '@octane-xplat/build/vite'
import { xplatMacOS } from '@octane-xplat/build/macos/vite'
import { xplatLinuxGtk } from '@octane-xplat/build/linux-gtk/vite'

assert.equal(typeof xplatMacOS,'function'); assert.equal(typeof xplatLinuxGtk,'function')
if (process.env.XPLAT_TEST_CLI_EXPORTS === '1') {
 const cliPlugins = await import('@octane-xplat/cli/vite')
 assert.deepEqual(Object.keys(cliPlugins).sort(),Object.keys(plugins).sort())
} else {
 try { await import('@octane-xplat/cli/vite'); assert.fail('Unexpected CLI installation in plugin-only fixture') }
 catch (error) { assert.equal(error.code,'ERR_MODULE_NOT_FOUND') }
}

const root = process.cwd(), cache = join(root,'node_modules/.cache/xplat/dev-bridge')
const result = { exports: Object.keys(plugins).sort(), nativeExtensions: plugins.nativeExtensions,
 nodeEnv: ['development','production','test'].map(mode => plugins.xplatNodeEnvDefine(mode)) }
// Test the shipped helper as an internal implementation probe, without adding
// another public export. This reaches Babel's real transitive dependency graph.
const { nativeUnicodeRegex } = await import(new URL('./native-regex.js',import.meta.resolve('@octane-xplat/build/vite')))
const regexSources = [String.raw`const regex = /\p{L}+/u`, String.raw`const regex = /\P{L}/u`,
 String.raw`const regex = /[\p{L}_]+/v`, String.raw`const regex = new RegExp("\\p{L}+", "u")`]
result.nativeRegexMatches = []
for (const source of regexSources) {
 const transformed = await nativeUnicodeRegex().transform.call({ warn() {} },source,'/fixture/dependency.mjs?used')
 assert.ok(transformed?.map)
 assert.ok(!transformed.code.includes('\\p{') && !transformed.code.includes('\\P{'))
 const actual = Function(transformed.code+'; return regex')(), expected = Function(source+'; return regex')()
 const matches = []
 for (const sample of ['héllo_', '日本', '123', '😀', 'a-b']) {
  const observed = actual.exec(sample), reference = expected.exec(sample)
  assert.deepEqual(observed,reference)
  matches.push(observed ? { value:observed[0],index:observed.index } : null)
 }
 result.nativeRegexMatches.push(matches)
}
const built = await build({ root, logLevel: 'silent', build: { write: false } })
const output = (Array.isArray(built) ? built : [built]).flatMap(bundle => bundle.output)
const css = output.filter(file => file.type === 'asset' && file.fileName.endsWith('.css')).map(file => String(file.source)).join('\n')
assert.ok(css.includes('.packed-web'),css); assert.ok(!css.includes('must-not-ship'),css); assert.ok(!css.includes('@platform'),css)
assert.ok(css.includes('--packed-existing:preserved'),css); assert.ok(!css.includes('unprocessed'),css)
assert.ok(!css.includes('fallback-must-not-ship'),css)
result.productionCssFiltered = true
result.appPostcssPreserved = true

function nativeBridge(request) {
 return new Promise((resolve,reject) => {
  const child = spawn(process.env.XPLAT_TEST_HTTP_PROBE,[],{ env: { ...process.env, PATH: '' },stdio: ['pipe','pipe','pipe'] })
  let stdout = '', stderr = ''
  child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8')
  child.stdout.on('data',chunk => { stdout += chunk }); child.stderr.on('data',chunk => { stderr += chunk })
  const timer = setTimeout(() => child.kill('SIGKILL'),10000)
  child.once('error',error => { clearTimeout(timer); reject(error) })
  child.once('close',code => {
   clearTimeout(timer)
   try { assert.equal(code,0,stderr); assert.equal(stderr,''); resolve(JSON.parse(stdout)) }
   catch (error) { reject(error) }
  })
  child.stdin.end(JSON.stringify({ operation: 'bridge',...request })+'\n')
 })
}
const server = await createServer({ root, logLevel: 'silent' })
try {
 await server.listen()
 const sessionFile = readdirSync(cache).find(file => file.endsWith('.json'))
 assert.ok(sessionFile)
 const endpoint = JSON.parse(readFileSync(join(cache,sessionFile)))
 const mainResponse = await fetch(endpoint.url+'/src/main.js')
 assert.equal(mainResponse.status,200)
 assert.ok((await mainResponse.text()).includes('/src/theme.web.css'))
 result.platformSiblingSelected = true
 const cssResponse = await fetch(endpoint.url+'/src/theme.web.css')
 assert.equal(cssResponse.status,200)
 const source = await cssResponse.text()
 assert.ok(source.includes('.packed-web')); assert.ok(!source.includes('must-not-ship'))
 assert.ok(source.includes('preserved')); assert.ok(!source.includes('unprocessed'))
 result.devCssFiltered = true
 const unauthorized = await fetch(endpoint.url+'/__xplat_dev__/registry')
 assert.equal(unauthorized.status,401)
 const headers = { 'content-type':'application/json','x-xplat-dev-token':endpoint.token }
 const post = async (path,body) => {
  const response = await fetch(endpoint.url+'/__xplat_dev__'+path,{ method:'POST',headers,body:JSON.stringify(body) })
  assert.equal(response.status,200); return response.json()
 }
 const announcement = { protocol:'xplat-dev-actions',version:1,appInstanceId:'packed-instance',platform:'web',revision:1,
  announcedAt:new Date().toISOString(),actions:[{ id:'fixture.echo',description:'Packed transport fixture',effects:[] }] }
 await post('/registry',announcement)
 if (process.env.XPLAT_TEST_HTTP_PROBE) {
  const options = { url:endpoint.url,token:endpoint.token }
  const registry = await nativeBridge({ ...options,call:'registry' })
  assert.equal(registry.ok,true)
  assert.equal(registry.data.instances[0].appInstanceId,announcement.appInstanceId)
  const submitted = await nativeBridge({ ...options,call:'submit',invocation:{ requestId:'packed-call',appInstanceId:announcement.appInstanceId,
   actionId:'fixture.echo',registryRevision:1,input:{ value:'literal é😀' } } })
  assert.equal(submitted.ok,true); assert.equal(submitted.data.accepted,true)
  const poll = await fetch(endpoint.url+'/__xplat_dev__/poll?instance=packed-instance&wait=0',{ headers })
  assert.equal(poll.status,200)
  const work = await poll.json()
  assert.equal(work.invocations[0].requestId,'packed-call')
  assert.equal(work.invocations[0].input.value,'literal é😀')
  const waiting = nativeBridge({ ...options,call:'await',requestId:'packed-call',waitMs:1000 })
  await post('/result',{ requestId:'packed-call',outcome:{ status:'succeeded',value:{ echoed:'literal é😀' } } })
  const completed = await waiting
  assert.equal(completed.ok,true)
  assert.equal(completed.data.outcome.value.echoed,'literal é😀')
  result.nativeBridgeRoundtrip = true
 }
} finally { await server.close() }
result.sessionRemoved = !existsSync(cache) || readdirSync(cache).filter(file => file.endsWith('.json')).length === 0
assert.equal(result.sessionRemoved,true)
// Exercise the packed build plugin's failure path after releasing the server.
writeFileSync(join(root,'src/foreign.mobile.js'),'export const foreign = true\n')
writeFileSync(join(root,'src/main.js'),"import './foreign.mobile.js'\n")
await assert.rejects(build({ root,logLevel:'silent',build:{ write:false } }),error => {
 assert.match(error.message,/platform|foreign|mobile/i)
 return true
})
result.foreignModuleRejected = true
console.log(JSON.stringify(result))

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createServer as createSecureServer } from 'node:https'
import { spawn, spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { gzipSync, deflateSync } from 'node:zlib'
import { once } from 'node:events'
import { connect } from 'node:net'
import { performance } from 'node:perf_hooks'
import { assertCurrentNativeBuild, httpProbeInputs } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..')
const work = join(root, 'research/nim-cli')
const binary = join(work, `native/http-probe${process.platform === 'win32' ? '.exe' : ''}`)
const nativePins = JSON.parse(readFileSync(join(import.meta.dirname, 'nim-dependencies.json')))
assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(work, 'native/http-build.json'))), readFileSync(binary), httpProbeInputs)
const macOnly = { skip: process.platform !== 'darwin' }
let directory, origin, other, secure, caFile, server, second, tls, proxy, proxyUrl
const tunnels = new Set()
const pending = new Set()
const requests = []
const evidence = []
const fixedDate = 'Sun, 01 Nov 2026 12:00:00 GMT'
function handler(request, response) {
 requests.push({ url: request.url, headers: request.headers, method: request.method })
 response.setHeader('Date', fixedDate)
 response.setHeader('Connection', 'close')
 const url = new URL(request.url, 'http://fixture')
 if (url.pathname.includes('/__xplat_dev__/')) {
  const mode = url.pathname.split('/')[2]
  if (request.headers['x-xplat-dev-token'] !== 'fixture-token') {
   response.writeHead(403, { 'Content-Type': 'application/json' }); response.end('{"error":{"code":"unauthorized","message":"fixture token required"}}'); return
  }
  if (mode === 'invalid') { response.end('invalid JSON'); return }
  if (mode === 'empty') { response.end(); return }
  if (mode === 'slow') {
   response.flushHeaders()
   const timer = setTimeout(() => { pending.delete(timer); response.end('{"late":true}') }, 4400); pending.add(timer); return
  }
  if (mode.startsWith('error-')) {
   response.statusCode = 422
   const values = { null: null, false: false, zero: 0, text: 'fixture error', object: { code: 'fixture', message: 'fixture rejection' } }
   response.end(JSON.stringify({ error: values[mode.slice(6)] })); return
  }
  const chunks = []
  request.on('data', bytes => chunks.push(bytes))
  request.on('end', () => {
   const body = Buffer.concat(chunks).toString('utf8')
   response.end(JSON.stringify({ method: request.method, path: request.url,
    body: body ? JSON.parse(body) : null, contentType: request.headers['content-type'] ?? null }))
  })
 } else if (url.pathname === '/echo') {
  const chunks = []
  request.on('data', bytes => chunks.push(bytes))
  request.on('end', () => {
   response.setHeader('Content-Type', 'application/json')
   const explicit = ['x-test', 'x-empty', 'x-latin', 'cookie', 'authorization', 'x-xplat-dev-token', 'content-type', 'content-length']
   response.end(JSON.stringify({ method: request.method, path: request.url,
    headers: Object.fromEntries(explicit.filter(name => request.headers[name] !== undefined).map(name => [name, request.headers[name]])),
    bodyBase64: Buffer.concat(chunks).toString('base64') }))
  })
 } else if (url.pathname === '/redirect') {
  response.writeHead(Number(url.searchParams.get('status') ?? 302), { Location: url.searchParams.get('to') ?? '/echo' }); response.end('redirect')
 } else if (url.pathname === '/loop') {
  response.writeHead(302, { Location: '/loop' }); response.end()
 } else if (url.pathname === '/slow-headers') {
  const timer = setTimeout(() => { pending.delete(timer); response.end('late') }, 500); pending.add(timer)
 } else if (url.pathname === '/slow-body') {
  response.writeHead(200, { 'Content-Type': 'text/plain' }); response.flushHeaders()
  const timer = setTimeout(() => { pending.delete(timer); response.end('late') }, 500); pending.add(timer)
 } else if (url.pathname === '/gzip' || url.pathname === '/deflate') {
  response.setHeader('Content-Encoding', url.pathname.slice(1))
  response.end((url.pathname === '/gzip' ? gzipSync : deflateSync)(Buffer.from('compressed Café 😀\n')))
 } else if (url.pathname === '/bytes') {
  response.setHeader('Content-Type', 'text/plain; charset=iso-8859-1')
  response.end(Buffer.from([0xef,0xbb,0xbf,0x61,0xc3,0x28,0,0xff,0xf0,0x9f,0x98,0x80]))
 } else if (url.pathname === '/headers') {
  response.setHeader('X-List', ['first','second'])
  response.setHeader('Set-Cookie', ['a=1; HttpOnly', 'b=2; SameSite=Lax'])
  response.setHeader('X-Latin', 'é')
  response.end('headers')
 } else if (url.pathname === '/header-limit') {
  response.setHeader('X-Fill', 'a'.repeat(Number(url.searchParams.get('n'))))
  response.end('x')
 } else if (url.pathname === '/early-hints') {
  response.writeEarlyHints({ link: '</fixture.css>; rel=preload; as=style' })
  response.end('hints')
 } else if (url.pathname === '/continue') {
  response.writeContinue(); response.end('continue')
 } else if (url.pathname === '/truncated') {
  response.writeHead(200, { 'Content-Length': '100' }); response.write('short'); response.socket.end()
 } else if (url.pathname === '/json-bom') {
  response.end(Buffer.concat([Buffer.from([0xef,0xbb,0xbf]), Buffer.from('{"ok":true,"text":"Café 😀"}')]))
 } else if (url.pathname === '/status') {
  response.statusCode = Number(url.searchParams.get('code')); response.end(response.statusCode === 204 || response.statusCode === 304 ? undefined : 'status')
 } else if (url.pathname === '/stream') {
  response.setHeader('Content-Type', 'application/octet-stream')
  for (let at = 0; at < 100; at++) response.write(Buffer.alloc(4096, at))
  response.end()
 } else { response.statusCode = 404; response.end('not found') }
}
async function listen(instance) { instance.listen(0, '127.0.0.1'); await once(instance, 'listening'); return `http://127.0.0.1:${instance.address().port}` }
before(async () => {
 if (process.platform !== 'darwin') return
 mkdirSync(join(work, 'http-fixtures'), { recursive: true })
 directory = mkdtempSync(join(work, 'http-fixtures/run-'))
 const config = join(directory, 'openssl.cnf')
 caFile = join(directory, 'certificate.pem')
 const key = join(directory, 'key.pem')
 writeFileSync(config, '[req]\nprompt=no\ndistinguished_name=dn\nx509_extensions=ext\n[dn]\nCN=localhost\n[ext]\nsubjectAltName=DNS:localhost\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,digitalSignature,keyEncipherment,keyCertSign\n')
 const generated = spawnSync('/usr/bin/openssl', ['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-config',config,'-keyout',key,'-out',caFile], { encoding: 'utf8' })
 assert.equal(generated.status, 0, 'Could not create task-local TLS fixture')
 server = createServer(handler); second = createServer(handler)
 origin = await listen(server); other = await listen(second)
 tls = createSecureServer({ key: readFileSync(key), cert: readFileSync(caFile) }, handler)
 secure = (await listen(tls)).replace('http://127.0.0.1', 'https://localhost')
 proxy = createServer((request, response) => {
  response.setHeader('Date', fixedDate); response.setHeader('Connection', 'close')
  response.end(JSON.stringify({ proxied: true, url: request.url }))
 })
 proxy.on('connect', (request, socket, head) => {
  const expected = `localhost:${tls.address().port}`
  if (request.url !== expected) { socket.end('HTTP/1.1 403 Forbidden\r\n\r\n'); return }
  const upstream = connect(tls.address().port, '127.0.0.1', () => {
   socket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
   if (head.length) upstream.write(head)
   socket.pipe(upstream); upstream.pipe(socket)
  })
  for (const channel of [socket, upstream]) {
   tunnels.add(channel); channel.on('close', () => tunnels.delete(channel))
   channel.on('error', () => { socket.destroy(); upstream.destroy() })
  }
 })
 proxyUrl = await listen(proxy)
})
after(async () => {
 if (process.platform === 'darwin') writeFileSync(join(work, 'http-differential.json'), JSON.stringify(evidence))
 for (const timer of pending) clearTimeout(timer)
 for (const channel of tunnels) channel.destroy()
 for (const instance of [server, second, tls, proxy]) if (instance) { instance.closeAllConnections(); await new Promise(resolve => instance.close(resolve)) }
 if (directory) rmSync(directory, { recursive: true, force: true })
})
async function run(native, cases, ca) {
 const start = performance.now()
 const explicitProxy = !native && cases.find(request => request.proxy)?.proxy
 const child = spawn(native ? binary : process.execPath, native ? [] : [join(import.meta.dirname, 'http-reference.mjs')], {
  env: { ...process.env, ...(native ? { PATH: '' } : {}), NODE_EXTRA_CA_CERTS: ca ?? '', HTTP_PROXY: 'http://127.0.0.1:1', HTTPS_PROXY: 'http://127.0.0.1:1',
   ALL_PROXY: 'http://127.0.0.1:1', NO_PROXY: '', NODE_USE_ENV_PROXY: '',
   ...(explicitProxy ? { HTTP_PROXY: explicitProxy, HTTPS_PROXY: explicitProxy, NODE_USE_ENV_PROXY: '1' } : {}) }, stdio: ['pipe','pipe','pipe'] })
 let stdout = '', stderr = ''
 child.stdout.on('data', bytes => stdout += bytes); child.stderr.on('data', bytes => stderr += bytes)
 const timer = setTimeout(() => child.kill('SIGKILL'), 15000)
 child.stdin.end(cases.map(request => JSON.stringify(request)).join('\n') + '\n')
 const [code] = await once(child, 'close'); clearTimeout(timer)
 evidence.push({ native, requests: cases.length, elapsedMs: performance.now() - start })
 assert.equal(code, 0, stderr || stdout)
 if (!native && cases.some(request => request.method === 'patch')) {
  assert.match(stderr, /\[UNDICI-FETCH-patch\] Warning:/)
  evidence.push({ referenceWarning: stderr })
 } else assert.equal(stderr, '')
 return stdout.trim().split('\n').map(line => JSON.parse(line))
}
function comparable(result) {
 if (result.success) return result
 const { kind, detail, ...value } = result
 return value
}
async function compare(cases, ca) {
 const [reference, actual] = await Promise.all([run(false, cases, ca), run(true, cases)])
 evidence.push({ cases, reference, actual })
 assert.equal(actual.length, cases.length)
 for (const [at, request] of cases.entries()) assert.deepEqual(comparable(actual[at]), reference[at], `HTTP case ${at}: ${JSON.stringify(request)}`)
 return actual
}

test('system transport reports its real TLS backend and asynchronous DNS capability', macOnly, async () => {
 const [version] = await run(true, [{ operation: 'version' }])
 assert.match(version.version, /libcurl\//); assert.match(version.version, /SecureTransport/)
 assert.equal(version.asyncDns, true)
 assert.equal(version.threadSafeGlobals, true)
 assert.equal(version.urlParser, nativePins.ada.version)
 console.log(JSON.stringify(version))
})
test('HTTP methods, explicit headers, Latin-1 bytes and UTF-8 or binary bodies match Node', macOnly, async () => {
 const cases = []
 for (const method of ['GET','get','HEAD','POST','PUT','PATCH','DELETE','OPTIONS']) cases.push({ url: `${origin}/echo`, method, consume: method === 'HEAD' ? 'text' : 'json' })
 for (const method of ['patch','pAtCh']) cases.push({ url: `${origin}/echo`, method, consume: 'text' })
 cases.push({ url: `${origin}/echo`, method: 'POST', headers: [['X-Test',' first '],['x-test','second'],['x-empty',''],['x-latin','é'],['Cookie','a=1'],['cookie','b=2']], body: 'Café 😀\ud800', consume: 'json' })
 cases.push({ url: `${origin}/echo`, method: 'PATCH', bodyBase64: Buffer.from([0,255,128,1]).toString('base64'), consume: 'json' })
 await compare(cases)
})
test('status, duplicate headers, BOM, invalid UTF-8 and null-body consumption match Node', macOnly, async () => {
 const cases = ['/headers','/bytes','/json-bom','/status?code=204','/status?code=205','/status?code=304','/status?code=404','/status?code=503']
  .map(path => ({ url: origin + path, consume: path === '/json-bom' ? 'json' : 'text', doubleRead: true }))
 await compare(cases)
})
test('HTTP URL normalization preserves Unicode paths, queries, fragments and dot segments', macOnly, async () => {
 const paths = ['/echo?q=café', '/echo?q=a b', '/a/../echo?x=%2f#fragment', '/a/%2e%2e/echo', '/echo?q=\ud800', '/echo?q=\'`{}[]^']
 await compare(paths.map(path => ({ url: origin + path, consume: 'json' })))
})
test('WHATWG URL corpus matches Node through native Ada, including IDNs and UTF-16 edge cases', macOnly, async () => {
 const source = join(work, 'dependencies', `ada-${nativePins.ada.revision}`, 'tests/wpt')
 const cases = ['urltestdata.json','urltestdata-javascript-only.json','ada_extra_urltestdata.json'].flatMap(file => JSON.parse(readFileSync(join(source, file))))
  .filter(value => typeof value === 'object' && value && typeof value.input === 'string')
  .map(value => ({ operation: 'normalize', url: value.input, base: value.base ?? '' }))
 const [actual, expected] = await Promise.all([run(true, cases), run(false, cases)])
 assert.equal(actual.length, cases.length)
 for (const [at, request] of cases.entries()) assert.deepEqual(actual[at], expected[at], `URL case ${at}: ${JSON.stringify(request).slice(0, 200)}`)
 console.log(`${cases.length} native WHATWG URL cases checked; Ada ${nativePins.ada.version}; Node Ada ${process.versions.ada}`)
})
test('gzip/deflate decompression preserves bytes and response headers', macOnly, async () => {
 await compare(['/gzip','/deflate','/bytes'].flatMap(path => ['text','bytes'].map(consume => ({ url: origin + path, consume }))))
})
test('header byte bounds and informational response handling match Node', macOnly, async () => {
 await compare([0,16000,16314,16315,16316,16317,17000].map(n => ({ url: `${origin}/header-limit?n=${n}` })))
 await compare(['/early-hints','/continue'].map(path => ({ url: origin + path })))
})
test('Fetch blocked ports fail before transport work and preserve reference errors', macOnly, async () => {
 const cases = [1,21,4190,6667,10080].map(port => ({ url: `http://127.0.0.1:${port}/echo` }))
 const values = await compare(cases)
 assert.ok(values.every(value => value.kind === 'hfTransport' && value.detail === 'bad port'))
})
test('redirects preserve or rewrite methods and remove credentials across origins', macOnly, async () => {
 const cases = []
 for (const status of [301,302,303,307,308]) for (const method of ['POST','PUT']) cases.push({ url: `${origin}/redirect?status=${status}&to=/echo`, method, body: 'redirect payload', consume: 'json' })
 for (const target of [`${origin}/echo`, `${other}/echo`]) cases.push({ url: `${origin}/redirect?to=${encodeURIComponent(target)}`, method: 'POST', body: 'payload', headers: [['authorization','Bearer fixture'],['cookie','a=1'],['x-xplat-dev-token','fixture-token']], consume: 'json' })
 cases.push({ url: `${origin}/loop` })
 await compare(cases)
})
test('headers resolve before delayed bodies, with phase-specific abort and timeout errors', macOnly, async () => {
 const start = performance.now()
 await compare([{ url: `${origin}/slow-body`, consume: 'none' }])
 assert.ok(performance.now() - start < 450)
 await compare([{ url: `${origin}/slow-headers`, abortMs: 50 }, { url: `${origin}/slow-body`, abortMs: 50 },
  { url: `${origin}/slow-headers`, timeoutMs: 50 }, { url: `${origin}/slow-body`, timeoutMs: 50 },
  { url: `${origin}/echo`, preabort: true }, { url: `${origin}/truncated` }])
})
test('TLS rejects untrusted and wrong-host certificates and accepts an explicit task-local CA', macOnly, async () => {
 await compare([{ url: `${secure}/json-bom`, consume: 'json' }])
 await compare([{ url: `${secure}/json-bom`, caFile, consume: 'json' }], caFile)
 await compare([{ url: `${secure.replace('localhost','127.0.0.1')}/json-bom`, caFile, consume: 'json' }], caFile)
})
test('explicit HTTP proxy and TLS CONNECT work while ambient proxies stay disabled', macOnly, async () => {
 await compare([{ url: `${origin}/echo`, proxy: proxyUrl, consume: 'json' }])
 await compare([{ url: `${secure}/json-bom`, proxy: proxyUrl, caFile, consume: 'json' }], caFile)
})
test('streamed data, byte caps and sink failures leave subsequent requests usable', macOnly, async () => {
 await compare([{ url: `${origin}/stream`, stream: true }])
 await compare([{ url: `${origin}/redirect?to=/stream`, stream: true },
  ...[204,205,304].map(code => ({ url: `${origin}/status?code=${code}`, stream: true })),
  { url: `${origin}/echo`, method: 'HEAD', stream: true }])
 const values = await run(true, [{ url: `${origin}/stream`, maxBytes: 5000 }, { url: `${origin}/stream`, stream: true, sinkError: true }, { url: `${origin}/json-bom`, consume: 'json' }])
 assert.equal(values[0].kind, 'hfBodyLimit'); assert.equal(values[1].kind, 'hfSink'); assert.equal(values[2].success, true)
 const closed = await run(true, [{ url: `${origin}/stream`, stream: true, sinkClose: true }, { url: `${origin}/echo`, consume: 'json' }])
 assert.equal(closed[0].kind, 'hfClosed'); assert.equal(closed[1].kind, 'hfClosed')
})
test('concurrent slow transfers do not block a fast request or each other\'s cancellation', macOnly, async () => {
 const requests = [{ url: `${origin}/slow-body`, abortMs: 60 }, { url: `${origin}/json-bom`, consume: 'json' }, { url: `${origin}/slow-headers`, timeoutMs: 80 }]
 const [expected, actual] = await Promise.all([run(false, [{ operation: 'parallel', requests }]), run(true, [{ operation: 'parallel', requests }])])
 assert.deepEqual(actual[0].map(comparable), expected[0])
})

test('authenticated bridge registry, submit, cancel and wait calls match real TypeScript envelopes', macOnly, async () => {
 const endpoint = { operation: 'bridge', url: `${origin}/bridge/ok`, token: 'fixture-token' }
 const cases = [{ ...endpoint, call: 'registry' }, { ...endpoint, call: 'submit' },
  ...[null,false,0,[],{ requestId: 'request-one', args: { text: 'Café 😀\ud800', flag: false } }].map(invocation => ({ ...endpoint, call: 'submit', invocation })),
  { ...endpoint, call: 'cancel', requestId: 'request-one' }]
 for (const waitMs of [undefined,null,0,1,1000,1234.5,31000]) cases.push({ ...endpoint, call: 'await', requestId: 'request-one', waitMs })
 await compare(cases)
})
test('bridge nullish error fallbacks and invalid JSON preserve reference behavior', macOnly, async () => {
 const cases = ['invalid','empty','error-null','error-false','error-zero','error-text','error-object']
  .map(mode => ({ operation: 'bridge', url: `${origin}/bridge/${mode}`, token: 'fixture-token', call: 'registry' }))
 cases.push({ operation: 'bridge', url: `${origin}/bridge/ok`, token: 'wrong-token', call: 'registry' })
 cases.push({ operation: 'bridge', url: 'http://127.0.0.1:1', token: 'fixture-token', call: 'registry' })
 await compare(cases)
})
test('bridge wait cancellation leaves the action alive until explicit cooperative cancellation', macOnly, async () => {
 const endpoint = { operation: 'bridge', url: `${origin}/bridge/slow`, token: 'fixture-token' }
 const first = requests.length
 await compare([{ ...endpoint, call: 'await', requestId: 'request-one', abortMs: 50 },
  { ...endpoint, call: 'await', requestId: 'request-one', waitMs: 1000, preabort: true },
  { ...endpoint, url: `${origin}/bridge/ok`, call: 'cancel', requestId: 'request-one' }])
 const sent = requests.slice(first).filter(request => request.url.startsWith('/bridge/'))
 assert.equal(sent.filter(request => request.url.endsWith('/invoke/cancel')).length, 2)
 assert.equal(sent.filter(request => request.url.includes('/invoke/request-one')).length, 2)
})
test('bridge body timeout retains the reference\'s successful null payload fallback', macOnly, async () => {
 const result = await compare([{ operation: 'bridge', url: `${origin}/bridge/slow`, token: 'fixture-token', call: 'registry' }])
 assert.deepEqual(result[0], { ok: true, data: null })
})

// Explicit public HTTPS smoke: pinned JSON bytes, no credentials or images.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { writeFileSync, readFileSync } from 'node:fs'
import { assertCurrentNativeBuild, httpProbeInputs } from './native-inputs.mjs'
const root = resolve(import.meta.dirname, '../..')
assertCurrentNativeBuild(root, JSON.parse(readFileSync(resolve(root, 'research/nim-cli/native/http-build.json'))),
 readFileSync(resolve(root, 'research/nim-cli/native/http-probe')), httpProbeInputs)
const url = 'https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/751bff37182d3f1213fa05d7196b954e230abad9/config.json'
const expected = '7135149f7cffa1a573466c6e4d8423ed73b62fd2332c575bf738a0d033f70df7'
const request = { url, consume: 'bytes', timeoutMs: 10000 }
const run = spawnSync(resolve(root, 'research/nim-cli/native/http-probe'), [], { input: JSON.stringify(request) + '\n',
 encoding: 'utf8', timeout: 15000, env: { ...process.env, PATH: '' } })
assert.equal(run.status, 0, run.stderr)
assert.equal(run.stderr, '')
const result = JSON.parse(run.stdout)
assert.equal(result.success, true, JSON.stringify(result))
assert.equal(result.value.status, 200)
const bytes = Buffer.from(result.value.bodyBase64, 'base64')
const sha256 = createHash('sha256').update(bytes).digest('hex')
assert.equal(sha256, expected)
const reference = await fetch(url, { signal: AbortSignal.timeout(10000) })
assert.equal(reference.status, 200)
assert.equal(createHash('sha256').update(new Uint8Array(await reference.arrayBuffer())).digest('hex'), expected)
const evidence = { url, nativeStatus: result.value.status, nativeBytes: bytes.length, sha256, redirected: result.value.redirected }
writeFileSync(resolve(root, 'research/nim-cli/http-live-result.json'), JSON.stringify(evidence))
console.log(JSON.stringify(evidence))

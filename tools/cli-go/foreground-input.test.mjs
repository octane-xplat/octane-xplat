import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { spawn, spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, rmSync, realpathSync, cpSync } from 'node:fs'

import { join, resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { scratchRun } from './scratch.mjs'
const root = resolve(import.meta.dirname, '../..'),
  work = join(root, 'research/go-cli')

const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${host}-cli${process.platform === 'win32' ? '.exe' : ''}`)
const build = JSON.parse(readFileSync(binary + '.json'))
const sha = (b) => createHash('sha256').update(b).digest('hex')
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
  assert.equal(sha(readFileSync(join(root, file))), hash, file)
}

const scratch = realpathSync(scratchRun(root, 'go-foreground-input'))
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }))
let sequence = 0
function put(dir, file, value) {
  const p = join(dir, file)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(
    p,
    typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value),
  )
  return p
}

const env = { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' }
const engine = `import{createInterface}from'node:readline';import{spawn}from'node:child_process';import{writeFileSync}from'node:fs';
console.log('TTY:'+Boolean(process.stdin.isTTY));console.error('PROMPT_STDERR');
if(['interrupt','raw-cancel'].includes(process.env.INPUT_MODE)){if(process.env.INPUT_MODE==='raw-cancel'){process.stdin.setRawMode(true);process.stdin.resume()};process.on('SIGINT',()=>{});process.on('SIGTERM',()=>{});const leaf=spawn(process.execPath,['-e',"process.on('SIGINT',()=>{});process.on('SIGTERM',()=>{});console.log('LEAF_READY');setInterval(()=>{},1000)"],{stdio:['ignore','pipe','inherit']});leaf.stdout.once('data',()=>console.log('INPUT_READY'));setInterval(()=>{},1000)}else{const reader=createInterface({input:process.stdin});console.log('INPUT_READY');reader.once('line',line=>{console.log('ANSWER:'+line);writeFileSync('answer.json',JSON.stringify(line));reader.close();process.exit(37)})}`

function project() {
  const dir = join(scratch, 'app ' + sequence++ + ' π')
  put(dir, 'package.json', { name: 'input-app', private: true, packageManager: 'bun@1.4.4' })
  put(dir, 'node_modules/@octane-xplat/lint/package.json', {
    name: '@octane-xplat/lint',
    type: 'module',
    exports: { './bin': './run.mjs' },
  })
  put(dir, 'node_modules/@octane-xplat/lint/run.mjs', engine)
  return dir
}

async function answerPrompt(exe, dir, args, marker) {
  const child = spawn(exe, args, { cwd: dir, env, stdio: ['pipe', 'pipe', 'pipe'] })
  let stdout = '',
    stderr = '',
    sent = false
  const timer = setTimeout(() => child.kill('SIGTERM'), 25000)
  try {
    return await new Promise((resolve, reject) => {
      child.on('error', reject)
      child.stdout.on('data', (bytes) => {
        stdout += bytes
        if (!sent && stdout.includes(marker)) {
          sent = true
          child.stdin.write('answer π😀\n')
        }
      })
      child.stderr.on('data', (bytes) => {
        stderr += bytes
      })
      child.on('close', (code, signal) => resolve({ code, signal, stdout, stderr, sent }))
    })
  } finally {
    clearTimeout(timer)
    child.stdin.destroy()
  }
}

test('foreground project tool reads piped input without waiting for parent EOF', async () => {
  const dir = project(),
    r = await answerPrompt(binary, dir, ['lint'], 'INPUT_READY')
  assert.equal(r.code, 37, r.stdout + r.stderr)
  assert.equal(r.signal, null)
  assert.equal(r.sent, true)
  assert.match(r.stdout, /ANSWER:answer π😀/)
  assert.match(r.stderr, /PROMPT_STDERR/)
  assert.equal(JSON.parse(readFileSync(join(dir, 'answer.json'))), 'answer π😀')
})

for (const mode of ['answer', 'interrupt', 'interrupt-default', 'raw-cancel']) {
  test(
    `isolated POSIX terminal ${mode} preserves TTY input and restores foreground ownership`,
    { skip: process.platform === 'win32' },
    () => {
      const dir = project()
      const r = spawnSync(
        'python3',
        ['-I', join(root, 'tools/cli-go/foreground-terminal.py'), binary, mode],
        { cwd: dir, env: { ...env, INPUT_MODE: mode }, encoding: 'utf8', timeout: 25000 },
      )
      assert.equal(r.status, 0, r.stdout + r.stderr)
      const result = JSON.parse(r.stdout)
      assert.equal(
        result.code,
        mode === 'answer' ? 37 : mode === 'raw-cancel' ? 143 : 130,
        result.output,
      )
      assert.equal(result.promptObserved, true)
      assert.equal(result.restored, true, result.output)
      assert.equal(result.modesRestored, true, result.output)
      assert.match(result.output, /TTY:true/)
      assert.match(result.output, /FOLLOWUP:followup/)
      if (mode === 'answer') {
        assert.match(result.output, /ANSWER:answer π😀/)
      }
    },
  )
}

test('actual Bun postinstall prompt receives input through the release-owned Node worker', async () => {
  const install = join(scratch, 'CLI ' + sequence++ + ' π')
  put(install, 'package.json', { name: '@octane-xplat/cli', version: build.cliVersion })
  const exe = join(install, 'bin/xplat.exe')
  mkdirSync(dirname(exe))
  cpSync(binary, exe)
  put(install, 'native-worker/manifest.json', build.releaseWorker)
  for (const file of Object.keys(build.releaseWorker.files)) {
    put(install, 'native-worker/' + file, readFileSync(join(work, 'release-worker', file)))
  }
  const dir = join(scratch, 'upgrade ' + sequence++ + ' π')
  put(dir, 'package.json', {
    name: 'upgrade-input',
    private: true,
    packageManager: 'bun@1.4.4',
    scripts: { postinstall: 'node prompt.mjs' },
  })
  put(dir, 'prompt.mjs', engine.replace('process.exit(37)', 'process.exit(0)'))
  const r = await answerPrompt(exe, dir, ['upgrade'], 'INPUT_READY')
  assert.equal(r.code, 0, r.stdout + r.stderr)
  assert.equal(r.sent, true)
  assert.equal(JSON.parse(readFileSync(join(dir, 'answer.json'))), 'answer π😀')
})

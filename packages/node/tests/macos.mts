import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { build } from 'vite'
import { nodeBuiltins } from '../dist/vite.js'

assert.equal(process.platform, 'darwin', 'Run on the actual AppKit host')

const root = fileURLToPath(new URL('..', import.meta.url))
const hostRoot = fileURLToPath(new URL('../../cli/src/macos/jsc-host/', import.meta.url))
const host = join(hostRoot, 'prebuilt/macos')
const work = join(root, 'tests/.runtime/macos')

await mkdir(work, { recursive: true })
await writeFile(
  join(work, 'bootstrap.js'),
  (await readFile(join(hostRoot, 'shim.js'), 'utf8')) +
    '\nglobalThis.__nodeOriginalBuffer = globalThis.Buffer;\n',
)

await writeFile(
  join(work, 'entry.ts'),
  `
import events from 'node:events'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import { requireNode } from ${JSON.stringify(join(root, 'dist/index.js'))}
import { run } from ${JSON.stringify(join(root, 'tests/conformance.ts'))}
NSApplication.sharedApplication;
setTimeout(async () => {
  try {
    let count = 0;
    const check = (name,actual,expected = true) => { if (!Object.is(actual,expected)) throw Error(name); count++; };
    check('static events identity', events === requireNode('events'));
    check('static Buffer identity', Buffer === requireNode('buffer').Buffer);
    check('existing host Buffer preserved', globalThis.Buffer === globalThis.__nodeOriginalBuffer);
    check('unclaimed fs reaches existing host', fs.existsSync(${JSON.stringify(join(work, 'entry.ts'))}));
    await run({assert:check, record(){}});
    console.log('NODE_MACOS_OK assertions=' + count);
  } catch (error) { console.error('NODE_MACOS_FAIL ' + error.stack); }
  finally { globalThis.__xplatStopHost(); }
}, 0);
`,
)

await build({
  root: work,
  configFile: false,
  logLevel: 'error',
  plugins: [nodeBuiltins({ target: 'native' })],
  build: {
    target: 'es2020',
    outDir: 'dist',
    minify: false,
    lib: { entry: join(work, 'entry.ts'), formats: ['cjs'], fileName: () => 'case.cjs' },
    rolldownOptions: { external: [/^node:/] },
  },
})

const result = spawnSync(
  join(host, 'host'),
  [
    join(host, 'NativeScript.framework/Versions/A/NativeScript'),
    join(work, 'dist/case.cjs'),
    join(host, `metadata.macos.${process.arch === 'x64' ? 'x86_64' : 'arm64'}.nsmd`),
    join(work, 'bootstrap.js'),
  ],
  { encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024 },
)

assert.equal(result.status, 0, result.stdout + result.stderr)

const match = /NODE_MACOS_OK assertions=(\d+)/.exec(result.stdout + result.stderr)

assert.ok(match, result.stdout + result.stderr)
assert.ok(Number(match[1]) >= 30)
console.log(`AppKit/JSC: ${match[1]} builtin assertions before UI mounting; host Buffer preserved.`)

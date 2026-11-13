// Selected-project engine binding and headless development lifecycle; no visual inspection.
import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  existsSync,
  symlinkSync,
  realpathSync,
} from 'node:fs'

import { join, dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { scratchRun } from './scratch.mjs'

const root = resolve(import.meta.dirname, '../..'),
  scratch = realpathSync(scratchRun(root, 'go-workshop-engine'))

after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }))

const { loadMacOSDevEngine } = await import(
  pathToFileURL(join(root, 'packages/workshop/dist/build/macos-engine.js')).href
)

function put(dir, path, value) {
  const file = join(dir, path)

  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value))
  return file
}

let serial = 0
function app() {
  const dir = join(scratch, 'app ' + serial++ + ' π')

  put(dir, 'package.json', { name: 'engine-consumer', private: true, type: 'module' })
  return dir
}

function engine(
  dir,
  exports = './engine.js',
  body = 'export async function runMacOSDev(){return "selected"}',
) {
  const pkg = join(dir, 'node_modules/@octane-xplat/macos-build')

  put(pkg, 'package.json', {
    name: '@octane-xplat/macos-build',
    type: 'module',
    exports: { './dev-engine': exports },
  })

  put(pkg, 'engine.js', body)
  return pkg
}

test('packed engine exports load from an actual installed project without the CLI', async () => {
  const dir = app(),
    packs = join(scratch, 'packs')

  mkdirSync(packs)

  const pack = spawnSync('bun', ['pm', 'pack', '--ignore-scripts', '--destination', packs], {
    cwd: join(root, 'packages/macos-build'),
    encoding: 'utf8',
    timeout: 30000,
  })

  assert.equal(pack.status, 0, pack.stderr)

  const manifest = JSON.parse(readFileSync(join(root, 'packages/macos-build/package.json')))
  const archive = join(packs, `octane-xplat-macos-build-${manifest.version}.tgz`)

  put(dir, 'package.json', {
    name: 'engine-consumer',
    private: true,
    type: 'module',
    dependencies: {
      '@octane-xplat/macos-build': 'file:' + archive.replaceAll('\\', '/'),
      ...(process.platform === 'darwin'
        ? {
            octane: '0.17.0',
            '@nativescript/macos-node-api': '0.4.4-next.2026-08-09-31292056208',
            vite: '8.3.0',
          }
        : {}),
    },
  })

  const install = spawnSync('bun', ['install', '--ignore-scripts', '--linker', 'isolated'], {
    cwd: dir,
    encoding: 'utf8',
    timeout: 120000,
  })

  assert.equal(install.status, 0, install.stderr)

  const api = await loadMacOSDevEngine(dir)

  assert.equal(typeof api.runMacOSDev, 'function')
  await assert.rejects(api.runMacOSDev(dir), /Declare xplat.targets.macos.runtime/)
  assert.throws(() => readFileSync(join(dir, 'node_modules/@octane-xplat/cli/package.json')), {
    code: 'ENOENT',
  })

  const declaration = readFileSync(
    join(dir, 'node_modules/@octane-xplat/macos-build/dist/macos/dev.d.ts'),
    'utf8',
  )

  assert.match(declaration, /resourceRoot/)
  assert.match(declaration, /onReady/)
  if (process.platform === 'darwin') {
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json')))

    pkg.xplat = {
      targets: {
        macos: {
          runtime: 'appkit-node-api',
          renderer: 'appkit',
          dev: { viteConfig: 'vite.config.mjs', bundleFile: 'dist/main.cjs' },
          package: {
            productName: 'Direct engine fixture',
            bundleIdentifier: 'org.octane.xplat.direct-engine',
            executableName: 'DirectEngine',
            minimumSystemVersion: '13.5',
          },
        },
      },
    }

    put(dir, 'package.json', pkg)
    put(
      dir,
      'vite.config.mjs',
      `export default {build:{outDir:'dist',lib:{entry:'main.js',formats:['cjs'],fileName:()=> 'main.cjs'},rollupOptions:{external:['@nativescript/macos-node-api',/^node:/]}}}`,
    )

    put(
      dir,
      'runner.mjs',
      `import {runMacOSDev} from '@octane-xplat/macos-build/dev-engine';
  const mode=process.argv[2];let observed='',stopping=false;
  const write=process.stdout.write.bind(process.stdout);
  process.stdout.write=(chunk,...args)=>{observed=(observed+String(chunk)).slice(-4096);if(mode==='cancel'&&!stopping&&observed.split(String.fromCharCode(10)).includes('DIRECT_ENGINE_APP_VALUE=40')){stopping=true;setTimeout(()=>process.kill(process.pid,'SIGTERM'),250)}return write(chunk,...args)};
  await runMacOSDev(process.cwd(),{resourceRoot:process.cwd()+'/resources-'+mode,onReady:({pid})=>{console.log('DIRECT_ENGINE_HOST_PID='+pid);}});
  console.log('DIRECT_ENGINE_STOPPED');`,
    )

    const probe = join(
      root,
      'research/go-cli/xplat-go-darwin-' + (process.arch === 'x64' ? 'amd64' : process.arch),
    )

    for (const mode of ['exit', 'cancel']) {
      mkdirSync(join(dir, 'resources-' + mode))
      put(
        dir,
        'main.js',
        `import '@nativescript/macos-node-api';const app=NSApplication.sharedApplication;app.setActivationPolicy(2);console.log('DIRECT_ENGINE_APP_VALUE=40');${mode === 'exit' ? 'setTimeout(()=>app.terminate(null),300)' : 'setInterval(()=>{},1000)'}`,
      )

      const launched = spawnSync(
        probe,
        ['exec', '--project', dir, '--timeout', '120s', '--', process.execPath, 'runner.mjs', mode],
        {
          cwd: dir,
          encoding: 'utf8',
          timeout: 130000,
          env: { ...process.env, NODE_PATH: '', NODE_OPTIONS: '' },
        },
      )

      assert.ifError(launched.error)
      assert.equal(launched.status, 0, launched.stdout + launched.stderr)

      const result = JSON.parse(launched.stdout)

      writeFileSync(
        join(root, 'research/go-cli/workshop-engine/runtime-' + mode + '.json'),
        JSON.stringify(result, null, 2),
      )

      assert.equal(result.cancelled, false, JSON.stringify(result))
      assert.equal(result.exitCode, 0, result.stdout + result.stderr)
      assert.match(result.stdout, /^DIRECT_ENGINE_APP_VALUE=40$/m, mode + '\n' + result.stderr)
      assert.match(result.stdout, /DIRECT_ENGINE_STOPPED/)

      const pid = Number(result.stdout.match(/DIRECT_ENGINE_HOST_PID=(\d+)/)?.[1])

      assert.ok(pid > 0)
      assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
      assert.equal(existsSync(join(dir, 'resources-' + mode, 'bundle')), false)
    }
  }
})

test('binding selects the project engine and rejects a nearer broken install', async () => {
  const dir = app()

  engine(dir)
  assert.equal(await (await loadMacOSDevEngine(dir)).runMacOSDev(), 'selected')

  const nested = join(dir, 'nested')

  put(nested, 'package.json', { name: 'nested', type: 'module' })
  engine(nested, './missing.js')
  await assert.rejects(loadMacOSDevEngine(nested), /missing\.js/)
})

test('missing engine has an installation instruction rather than a CLI fallback', async () => {
  await assert.rejects(loadMacOSDevEngine(app()), /bun add -D @octane-xplat\/macos-build/)
})

test('the engine export must stay inside its selected package and provide its API', async () => {
  const dir = app(),
    pkg = engine(dir, './escape.js')

  const outside = put(dir, 'outside.js', "throw Error('escaped module must not execute')")

  symlinkSync(outside, join(pkg, 'escape.js'))
  await assert.rejects(loadMacOSDevEngine(dir), /must stay inside/)

  const invalid = app()

  engine(invalid, './engine.js', 'export const somethingElse=true')
  await assert.rejects(loadMacOSDevEngine(invalid), /engine API is missing/)
})

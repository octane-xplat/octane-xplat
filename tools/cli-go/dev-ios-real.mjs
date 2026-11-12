// Explicit opt-in NativeScript/Go relay qualification. No images or user apps.
// Reserve native_builds plus resident_devices and
// exclusive:["ios:91D40099-A056-497D-A572-ADDDFD6A8F23"]. Never create, clone,
// erase or select a simulator by name.
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'

import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { scratchRun } from './scratch.mjs'

assert.equal(
  process.platform,
  'darwin',
  'This device recipe requires the configured macOS SDK host',
)

const root = resolve(import.meta.dirname, '../..'),
  work = join(root, 'research/go-cli')

const binary = join(work, 'xplat-go-darwin-arm64-cli')
const sha = (data) => createHash('sha256').update(data).digest('hex')
const build = JSON.parse(readFileSync(binary + '.json'))

assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
  assert.equal(sha(readFileSync(join(root, file))), hash, file)
}

const udid = '91D40099-A056-497D-A572-ADDDFD6A8F23'
const scratch = realpathSync(scratchRun(root, 'go-native-ios'))
// NativeScript names the Xcode project and executable after this directory; the
// JS bundle folder is always "app", so a directory named "app" collides in Xcode.
const app = join(scratch, 'relay-fixture'),
  appId = 'org.octane.clirelay.p' + sha(scratch).slice(0, 12)

const env = {
  ...process.env,
  CI: '1',
  NODE_OPTIONS: '',
  NODE_PATH: '',
  XPLAT_DEV_CACHE: join(scratch, 'dev-cache'),
  XDG_CACHE_HOME: join(scratch, 'cache'),
}

for (const key of [
  'VISUAL_CAPTURE_URL',
  'VISUAL_RUN_ID',
  'VISUAL_REVISION',
  'VISUAL_SCENARIO_HASH',
  'XPLAT_DEV_APP_BRIDGE',
  'XPLAT_AGENT_CLIENT',
  'XPLAT_PERMISSIONS',
]) {
  delete env[key]
}

function command(tool, args, options = {}) {
  const result = spawnSync(tool, args, {
    env,
    encoding: 'utf8',
    timeout: 15000,
    maxBuffer: 2 << 20,
    ...options,
  })

  assert.equal(result.status, 0, `${tool}: ${result.error?.message ?? result.stderr}`)
  return result.stdout
}

function put(file, data) {
  mkdirSync(resolve(file, '..'), { recursive: true })
  writeFileSync(file, typeof data === 'string' ? data : JSON.stringify(data))
}

async function until(read, message, timeout = 30000) {
  const deadline = Date.now() + timeout

  for (;;) {
    const value = await read()

    if (value) {
      return value
    }

    assert.ok(Date.now() < deadline, typeof message === 'function' ? message() : message)
    await delay(200)
  }
}

function owned(tool, args, options = {}) {
  const child = spawn(tool, args, {
    env,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  })

  const state = { child, ended: false, output: '' }

  for (const pipe of [child.stdout, child.stderr]) {
    pipe.on('data', (data) => {
      state.output = (state.output + data).slice(-(2 << 20))
    })
  }

  state.completion = new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('close', (code, signal) => {
      state.ended = true
      resolve({ code, signal })
    })
  })

  return state
}

async function stop(state) {
  if (!state || state.ended) {
    return
  }

  state.child.kill('SIGINT')
  await Promise.race([
    state.completion,
    delay(20000, undefined, { ref: false }).then(() => {
      throw new Error('Owned process did not shut down')
    }),
  ])
}

function query(args) {
  const result = command(binary, [...args, '--json'], { cwd: app })
  const response = JSON.parse(result)

  assert.equal(response.ok, true, result)
  return response.data
}

function simctl(args, options = {}) {
  return command('xcrun', ['simctl', ...args], options)
}

function simulator() {
  const listed = JSON.parse(simctl(['list', 'devices', '-j']))

  for (const [runtime, devices] of Object.entries(listed.devices ?? {})) {
    const device = devices.find((device) => device.udid === udid)

    if (device) {
      return { ...device, runtime }
    }
  }

  return null
}

// Use the current installed dependencies; only platform adapter sources are
// copied, exactly as in the AppKit gate. No parser/transport snapshots or mocks.
mkdirSync(app)
mkdirSync(join(app, 'src'))

const mobile = JSON.parse(readFileSync(join(root, 'apps/mobile/package.json')))
const dependencies = Object.fromEntries(
  [
    '@nativescript/core',
    '@valor/nativescript-websockets',
    '@octane-xplat/nativescript-mason-core',
  ].map((name) => [
    name,
    JSON.parse(readFileSync(join(root, 'apps/mobile/node_modules', name, 'package.json'))).version,
  ]),
)

const devDependencies = Object.fromEntries(
  [
    '@nativescript/ios',
    '@nativescript/vite',
    '@octane-xplat/cli',
    'nativescript',
    'vite',
    '@nativescript-community/vite-octane',
    '@octanejs/vite-plugin',
  ].map((name) => [
    name,
    JSON.parse(readFileSync(join(root, 'apps/mobile/node_modules', name, 'package.json'))).version,
  ]),
)

assert.ok(mobile.devDependencies.nativescript)
put(join(app, 'package.json'), {
  name: 'go-native-ios-relay',
  private: true,
  version: '0.0.0',
  type: 'module',
  main: 'src/index.ts',
  packageManager: 'bun@1.4.4',
  dependencies,
  devDependencies,
  xplat: { targets: { ios: {} } },
})

symlinkSync(join(root, 'apps/mobile/node_modules'), join(app, 'node_modules'), 'dir')
cpSync(join(root, 'packages/create/template/App_Resources/iOS'), join(app, 'App_Resources/iOS'), {
  recursive: true,
})

// MasonCore.xcframework ships no x86_64 simulator slice, so build arm64 only.
writeFileSync(
  join(app, 'App_Resources/iOS/build.xcconfig'),
  readFileSync(join(app, 'App_Resources/iOS/build.xcconfig')) +
    'ARCHS[sdk=iphonesimulator*] = arm64;\nONLY_ACTIVE_ARCH[sdk=iphonesimulator*] = YES;\nEXCLUDED_ARCHS[sdk=iphonesimulator*] = x86_64;\n',
)

put(
  join(app, 'nativescript.config.ts'),
  `export default {id:${JSON.stringify(appId)},appPath:'src',appResourcesPath:'App_Resources',cli:{packageManager:'bun'},bundler:'vite',bundlerConfigPath:'vite.config.mts'}\n`,
)

put(
  join(app, 'vite.config.mts'),
  `import {defineConfig} from 'vite';import {native} from '@octane-xplat/cli/vite';export default defineConfig(env=>native(env,{extra:{server:{host:'127.0.0.1'}}}))\n`,
)

put(join(app, 'tsconfig.json'), {
  compilerOptions: {
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'bundler',
    skipLibCheck: true,
  },
})

for (const name of [
  'dev-actions-registry.ts',
  'dev-actions-schema.ts',
  'dev-bridge-socket.ts',
  'dev-bridge.ts',
]) {
  cpSync(join(root, 'packages/platform/src', name), join(app, 'src', name), {
    recursive: false,
    force: true,
  })
}

put(
  join(app, 'src/index.ts'),
  `import '@valor/nativescript-websockets';import {Application,Label} from '@nativescript/core';import {registerDevAction} from './dev-actions-registry';registerDevAction({id:'fixture.ios.read',title:'Read iOS fixture',description:'Observe owned fixture',effects:{summary:'Read only'},result:{fields:{value:{type:'integer'}}},run:()=>({value:1})});console.log('GO_IOS_RELAY_READY');Application.run({create:()=>{const label=new Label();label.text='Owned CLI relay fixture';return label}});\n`,
)

let dev, failure
const evidence = {
  revision: command('git', ['rev-parse', 'HEAD'], { cwd: root }).trim(),
  binarySha256: build.sha256,
  device: udid,
  simulator: { udid },
  appId,
  scratch,
  passed: false,
}

try {
  const device = simulator()

  assert.ok(device, `Designated simulator ${udid} is missing; do not create a replacement`)
  assert.ok(device.isAvailable, `Designated simulator ${udid} is unavailable on this runtime`)
  evidence.simulator.runtime = device.runtime
  evidence.simulator.initiallyBooted = device.state === 'Booted'
  evidence.simulator.initialState = device.state
  dev = owned(binary, ['dev', 'ios', '--device', udid], { cwd: app })

  let instances

  await until(
    () => {
      assert.equal(dev.ended, false, dev.output)
      assert.ok(!dev.output.includes('failed to load config from'), dev.output)
      assert.ok(
        !dev.output.includes('Cannot instantiate module ') &&
          !dev.output.includes('An uncaught Exception occurred'),
        dev.output,
      )

      assert.ok(!dev.output.includes('** BUILD FAILED **'), dev.output)

      const result = spawnSync(binary, ['actions', 'list', '--json'], {
        cwd: app,
        env,
        encoding: 'utf8',
        timeout: 15000,
      })

      try {
        instances = JSON.parse(result.stdout).data?.instances
      } catch {
        return false
      }

      return instances?.some(
        (instance) =>
          instance.platform === 'ios' &&
          instance.actions.some((action) => action.id === 'fixture.ios.read'),
      )
    },
    () => 'Native app did not register through Go/Vite: ' + dev.output,
    15 * 60000,
  )

  const instance = instances.find((instance) => instance.platform === 'ios')

  evidence.instance = {
    platform: instance.platform,
    targetId: instance.targetId,
    appInstanceId: instance.appInstanceId,
  }

  const accepted = query([
    'actions',
    'invoke',
    '--action',
    'fixture.ios.read',
    '--instance',
    instance.appInstanceId,
    '--request-key',
    'ios-read',
  ])

  let job

  await until(() => {
    job = query(['actions', 'status', accepted.job.jobId]).job
    return !['queued', 'running', 'cancelling'].includes(job.state)
  }, 'iOS action did not finish')

  assert.equal(job.state, 'succeeded', JSON.stringify(job))
  assert.equal(job.result.outcome.result.value, 1)
  assert.equal(dev.ended, false, 'Short-lived CLI clients stopped foreground dev')

  const launchctl = simctl(['spawn', udid, 'launchctl', 'list'], { timeout: 30000 })
  const appLine = launchctl
    .split(/\r?\n/)
    .find((line) => line.includes(`UIKitApplication:${appId}`))

  assert.ok(appLine, `No UIKitApplication:${appId} entry in launchctl list`)
  evidence.pidAfterClientExit = appLine.trim().split(/\s+/)[0]
  assert.match(evidence.pidAfterClientExit, /^\d+$/)
  evidence.passed = true
} catch (error) {
  failure = error
  evidence.error = error.message
} finally {
  try {
    await stop(dev)
    if (dev && !failure) {
      const captures = query(['diagnostics']).sessions

      assert.ok(
        captures.length > 0 && captures.every((capture) => capture.cleanupConfirmed),
        'Native foreground engine cleanup is unconfirmed',
      )

      evidence.engineCleanupConfirmed = true
    }
  } catch (error) {
    failure ??= error
    evidence.cleanupError = error.message
  }

  const state = simulator()

  if (state) {
    // These act only on the fixture app id inside the designated simulator.
    spawnSync('xcrun', ['simctl', 'terminate', udid, appId], { env, timeout: 15000 })

    const removed = spawnSync('xcrun', ['simctl', 'uninstall', udid, appId], {
      env,
      encoding: 'utf8',
      timeout: 15000,
    })

    if (removed.status !== 0 && evidence.passed) {
      failure ??= new Error('Owned iOS fixture uninstall failed')
      evidence.uninstallError = removed.stderr
    }

    if (evidence.simulator.initiallyBooted === false) {
      spawnSync('xcrun', ['simctl', 'shutdown', udid], { env, timeout: 60000 })
    }

    evidence.simulator.finalState = simulator()?.state
  }

  evidence.passed &&= !failure
  writeFileSync(join(work, 'dev-ios-real.json'), JSON.stringify(evidence, null, 2))
  writeFileSync(join(work, 'dev-ios-real-output.log'), dev?.output ?? '')
}

if (failure) {
  throw failure
}

console.log(
  'Qualified actual NativeScript iOS app action over project Vite relay and Go RPC; no image or OS input qualification',
)

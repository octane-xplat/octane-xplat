import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { macos } from '../../../cli/src/macos/vite.ts'
import { hostBundle, hostRoot, macOSHostArch } from '../../../cli/src/macos/jsc-host/runtime.ts'

const here = fileURLToPath(new URL('.', import.meta.url))
const appRoot = fileURLToPath(new URL('../../../../apps/macos', import.meta.url))
const scratch = join(homedir(), 'agent-scratch/octane-xplat/desktop-window-lifecycle')
await mkdir(scratch, { recursive: true })
const directory = await mkdtemp(join(scratch, 'macos-'))

async function verifyPackagedSingleInstance() {
  const contents = join(directory, 'SecondLaunch.app/Contents')
  const resources = join(contents, 'Resources')
  const app = join(resources, 'app')
  const executable = join(contents, 'MacOS/SecondLaunch')
  const secondDirectory = join(directory, 'second-launch')
  await Promise.all([
    mkdir(app, { recursive: true }),
    mkdir(join(contents, 'MacOS'), { recursive: true }),
    mkdir(join(contents, 'Frameworks'), { recursive: true }),
    mkdir(secondDirectory),
  ])
  const identifier = `org.octane.xplat.secondlaunch.${randomUUID().replaceAll('-', '')}`
  await Promise.all([
    cp(join(hostBundle, 'host'), executable),
    cp(join(hostBundle, 'NativeScript.framework'), join(contents, 'Frameworks/NativeScript.framework'), { recursive: true, verbatimSymlinks: true }),
    cp(join(hostBundle, `metadata.macos.${macOSHostArch()}.nsmd`), join(resources, `metadata.macos.${macOSHostArch()}.nsmd`)),
    cp(join(hostRoot, 'shim.js'), join(resources, 'host-shim.js')),
    writeFile(join(contents, 'Info.plist'), `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>${identifier}</string>
<key>CFBundleExecutable</key><string>SecondLaunch</string>
<key>CFBundlePackageType</key><string>APPL</string>
</dict></plist>`),
  ])

  const config = await macos('production', {
    root: appRoot,
    entry: join(here, 'single-instance.macos.ts'),
    outDir: app,
  })
  await build({ ...config, configFile: false, logLevel: 'error' })

  const env = { ...process.env, OCTANE_MACOS_AUTOMATION: '1' }
  const primary = spawn(executable, [], { env })
  let output = ''
  primary.stdout.on('data', (data) => { output += data })
  primary.stderr.on('data', (data) => { output += data })
  const exited = new Promise<number | null>((resolve, reject) => {
    primary.on('error', reject)
    primary.on('close', resolve)
  })
  void exited.catch(() => {})

  async function waitFor(marker: string) {
    for (let attempt = 0; attempt < 200 && !output.includes(marker); attempt++) {
      if (primary.exitCode !== null || primary.signalCode !== null) break
      await Promise.race([delay(50), exited])
    }
    assert.ok(output.includes(marker), output)
  }

  try {
    await waitFor('DESKTOP_WAITING_FOR_SECOND_INSTANCE')
    const secondary = spawnSync(executable, ['résumé notes.txt', '--integration-flag'], {
      cwd: secondDirectory,
      env,
      encoding: 'utf8',
      timeout: 15_000,
    })
    const secondaryOutput = secondary.stdout + secondary.stderr
    assert.equal(secondary.status, 0, `${secondary.error ?? ''}\n${secondaryOutput}`)
    assert.match(secondaryOutput, /DESKTOP_REDIRECTED_OK/)
    assert.doesNotMatch(secondaryOutput, /DESKTOP_WAITING_FOR_SECOND_INSTANCE/)
    await waitFor('DESKTOP_SECOND_INSTANCE_OK')
    const status = await Promise.race([exited, delay(10_000, undefined, { ref: false }).then(() => {
      throw new Error('The primary app did not exit after processing the launch')
    })])
    assert.equal(status, 0, output)
    console.log('DESKTOP_SECOND_INSTANCE_OK (AppKit)')
  } finally {
    if (primary.exitCode === null && primary.signalCode === null) primary.kill()
    await exited
  }
}

try {
  const config = await macos('production', {
    root: appRoot,
    entry: join(here, 'window.macos.tsrx'),
    outDir: directory,
  })

  await build({ ...config, configFile: false, logLevel: 'error' })

  const result = spawnSync(
    join(hostBundle, 'host'),
    [
      join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
      join(directory, 'main.cjs'),
      join(hostBundle, `metadata.macos.${macOSHostArch()}.nsmd`),
      join(hostRoot, 'shim.js'),
    ],
    {
      encoding: 'utf8',
      timeout: 45_000,
      env: { ...process.env, OCTANE_MACOS_EXTERNAL_RUNLOOP: '1', OCTANE_MACOS_AUTOMATION: '1' },
    },
  )
  const output = result.stdout + result.stderr

  assert.equal(result.status, 0, `${result.error ?? ''}\n${output}`)
  assert.doesNotMatch(output, /DESKTOP_WINDOW_FAIL/)
  assert.match(output, /DESKTOP_WINDOW_OK/)
  assert.match(output, /DESKTOP_DIALOG_OK/)
  assert.match(output, /DESKTOP_SAVE_OK/)
  assert.match(output, /DESKTOP_MESSAGE_OK/)
  assert.match(output, /DESKTOP_SCREEN_OK/)
  assert.match(output, /DESKTOP_BOUNDS_OK/)
  assert.match(output, /DESKTOP_ACTIVATE_OK/)
  assert.match(output, /DESKTOP_MINIMIZE_OK/)
  assert.match(output, /DESKTOP_APP_QUIT_OK/)
  console.log('DESKTOP_WINDOW_OK, DESKTOP_DIALOG_OK, DESKTOP_SAVE_OK, DESKTOP_ACTIVATE_OK, DESKTOP_MINIMIZE_OK and DESKTOP_APP_QUIT_OK (AppKit)')
  await verifyPackagedSingleInstance()
} finally {
  await rm(directory, { recursive: true, force: true })
}

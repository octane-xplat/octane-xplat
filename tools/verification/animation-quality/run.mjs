import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { mkdir, open, readFile, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { recorderArguments } from './recorder-args.mjs'

// Physical devices only. Installation touches only this benchmark's bundle.
const args = process.argv.slice(2)
const reserved = args[0] === '--reserved'

if (reserved) {
  args.shift()
}

const functional = args.includes('--functional')
const positional = args.filter((arg) => arg !== '--functional')
const [device, testRun, appPath, outputPath, selected] = positional
const diagnosticCosts = selected === 'DiagnosticCosts'
const tests = [
  'Tween',
  'Spring',
  'Drag',
  'Retarget',
  'Layout',
  'Shared',
  'Sheet',
  'Scroll',
  'DisposalAndResume',
]

if (
  !device ||
  !testRun ||
  !appPath ||
  !outputPath ||
  (selected && ![...tests, 'DiagnosticCosts'].includes(selected))
) {
  throw Error(
    'Usage: node run.ts AUTHORIZED_PHYSICAL_UDID XCTESTRUN APP NEW_OUTPUT_DIRECTORY [Tween|Spring|Drag|Retarget|Layout|Shared|Sheet|Scroll|DisposalAndResume|DiagnosticCosts] [--functional]',
  )
}

if (device === '91D40099-A056-497D-A572-ADDDFD6A8F23') {
  throw Error('Presentation recording requires an authorized physical device')
}

if (!reserved) {
  const result = spawnSync(
    'goddard-agent',
    [
      'resource',
      'run',
      '--json',
      JSON.stringify({
        resources: { exclusive: [`device:${device}`] },
        purpose: 'Physical iOS animation quality: screenshot-free XCTest and Instruments',
      }),
      '--',
      process.execPath,
      fileURLToPath(import.meta.url),
      '--reserved',
      ...args,
    ],
    { stdio: 'inherit' },
  )

  let exitCode = result.status ?? 1

  // Export after the broker releases the device; this is host-only analysis.
  if (!functional) {
    for (const test of selected ? [selected] : tests) {
      const stem = join(resolve(outputPath), test)

      if (!existsSync(stem + '.result.json')) {
        continue
      }

      try {
        for (const schema of diagnosticCosts
          ? ['toc', 'os-signpost', 'time-profile', 'thread-info']
          : [
              'toc',
              'hitches',
              'os-signpost',
              'hitches-frame-lifetimes',
              'displayed-surfaces-interval',
              'device-thermal-state-intervals',
            ]) {
          command('xcrun', [
            'xctrace',
            'export',
            '--input',
            stem + '.trace',
            ...(schema === 'toc'
              ? ['--toc']
              : ['--xpath', `/trace-toc/run[@number="1"]/data/table[@schema="${schema}"]`]),
            '--output',
            stem + '.' + schema + '.xml',
          ])
        }
      } catch (error) {
        console.error(`${test}: export failed: ${error.message}`)
        exitCode = 1
      }
    }
  }

  process.exit(exitCode)
}

function command(program, argv) {
  const result = spawnSync(program, argv, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })

  if (result.status !== 0) {
    throw Error(`${program} failed (${result.status}): ${result.stderr || result.stdout}`)
  }

  return result.stdout
}

const configuration = JSON.parse(
  command('plutil', ['-convert', 'json', '-o', '-', resolve(testRun)]),
)

const policy = configuration.AnimationQualityTests

if (
  policy?.SystemAttachmentLifetime !== 'keepNever' ||
  policy?.UserAttachmentLifetime !== 'keepNever'
) {
  throw Error('Refusing run: generated xctestrun must disable automatic screen capture')
}

const output = resolve(outputPath)

await mkdir(output) // Never replace evidence from an earlier run.
await writeFile(
  join(output, 'recording-options.json'),
  JSON.stringify({
    os_signpost: {
      dynamicTracingEnabledSubsystems: ['org.octanexplat.animation'],
      recordAllProcessesInSingleProcessMode: false,
    },
  }),
)

const executable = command('plutil', [
  '-extract',
  'CFBundleExecutable',
  'raw',
  '-o',
  '-',
  join(resolve(appPath), 'Info.plist'),
]).trim()

await writeFile(
  join(output, 'provenance.json'),
  JSON.stringify(
    {
      device,
      testRun: resolve(testRun),
      appPath: resolve(appPath),
      appExecutableSha256: createHash('sha256')
        .update(await readFile(join(resolve(appPath), executable)))
        .digest('hex'),
      xcode: command('xcodebuild', ['-version']).trim(),
      runnerRevision: command('git', ['rev-parse', 'HEAD']).trim(),
      runnerDiffSha256: createHash('sha256')
        .update(command('git', ['diff', '--binary', 'HEAD']))
        .digest('hex'),
      presentationRecording: !functional,
      diagnosticCosts,
      screenshotPolicy: 'keepNever',
      debugger: false,
    },
    null,
    2,
  ),
)

command('xcrun', ['devicectl', 'device', 'install', 'app', '--device', device, resolve(appPath)])

const bundle = 'org.octanexplat.animationquality'
let failed = false

for (const test of selected ? [selected] : tests) {
  const stem = join(output, test)
  let pid
  let recorder
  let recording = ''
  let recorded

  try {
    if (!functional) {
      recorder = spawn(
        'xcrun',
        recorderArguments({
          device,
          bundle,
          output: stem + '.trace',
          recordingOptions: join(output, 'recording-options.json'),
          diagnosticCosts,
        }),
      )

      recorded = new Promise((done) => recorder.once('close', (code) => done(code)))
      await new Promise((ready, reject) => {
        const timeout = setTimeout(
          () => reject(Error('Instruments did not start within 45 seconds')),
          45000,
        )

        const consume = (chunk) => {
          recording += chunk.toString()
          if (recording.includes('Ctrl-C to stop the recording')) {
            clearTimeout(timeout)
            ready()
          }
        }

        recorder.stdout.on('data', consume)
        recorder.stderr.on('data', consume)
        recorder.once('error', (error) => {
          clearTimeout(timeout)
          reject(error)
        })

        recorder.once('close', () => {
          clearTimeout(timeout)
          reject(Error('Instruments exited before recording: ' + recording))
        })
      })
    }

    if (functional) {
      const launched = JSON.parse(
        command('xcrun', [
          'devicectl',
          'device',
          'process',
          'launch',
          '--device',
          device,
          '--terminate-existing',
          '--json-output',
          '-',
          bundle,
        ]),
      )

      pid = launched.result.process.processIdentifier
    }

    console.log(`${test}: ${functional ? 'functional check' : 'recording started'}; running XCTest`)

    const testLog = await open(stem + '.test.log', 'wx')
    let result

    try {
      result = await new Promise((done, reject) => {
        const child = spawn(
          'xcodebuild',
          [
            'test-without-building',
            '-xctestrun',
            resolve(testRun),
            '-destination',
            `platform=iOS,id=${device}`,
            '-parallel-testing-enabled',
            'NO',
            '-enablePerformanceTestsDiagnostics',
            'NO',
            '-collect-test-diagnostics',
            'never',
            `-only-testing:AnimationQualityTests/AnimationQualityTests/test${!functional && !diagnosticCosts && test !== 'DisposalAndResume' ? 'Presentation' : ''}${test}`,
            '-resultBundlePath',
            stem + '.xcresult',
          ],
          { stdio: ['ignore', testLog.fd, testLog.fd], timeout: 180000 },
        )

        child.once('error', reject)
        child.once('close', done)
      })
    } finally {
      await testLog.close()
    }

    if (recorder) {
      recorder.kill('SIGINT')
    }

    const recordingCode = recorder ? await recorded : 0

    await writeFile(stem + '.recording.log', recording)
    if (recordingCode !== 0) {
      throw Error(`Instruments failed (${recordingCode}); see recording log`)
    }

    command('xcrun', [
      'devicectl',
      'device',
      'copy',
      'from',
      '--device',
      device,
      '--source',
      'Documents/animation-quality-results.json',
      '--destination',
      stem + '.app-results.json',
      '--domain-type',
      'appDataContainer',
      '--domain-identifier',
      bundle,
    ])

    const appResults = JSON.parse(await readFile(stem + '.app-results.json', 'utf8'))
    const scenario = test === 'DisposalAndResume' || diagnosticCosts ? 'spring' : test.toLowerCase()
    const trials = appResults.filter((row) => row.scenario === scenario)
    const expected = test === 'DisposalAndResume' || diagnosticCosts ? 1 : 6

    if (
      result === 0 &&
      (trials.length !== expected ||
        (!functional && trials.some((row) => row.diagnostic !== diagnosticCosts)))
    ) {
      throw Error(
        `${test}: missing result rows or diagnostic build used for presentation recording`,
      )
    }

    if (
      result === 0 &&
      test === 'Sheet' &&
      (trials.some((row) => row.sheetFactoryEntries !== 1) ||
        appResults.at(-1)?.sheetFactoryEntries !== 0)
    ) {
      throw Error('Sheet factory cache did not stay bounded and release at owner teardown')
    }

    await writeFile(
      stem + '.result.json',
      JSON.stringify(
        {
          test,
          xctestExitCode: result,
          trace: functional ? null : stem + '.trace',
          evidence: 'physical',
          qualifiedBaseline: false,
        },
        null,
        2,
      ),
    )

    console.log(
      `${test}: XCTest ${result === 0 ? 'passed' : 'FAILED'}; ${functional ? 'functional evidence' : 'presentation recording'} retained`,
    )

    if (result !== 0) {
      failed = true
    }
  } finally {
    if (recorder?.exitCode === null) {
      recorder.kill('SIGINT')

      const timer = setTimeout(() => recorder.kill('SIGTERM'), 30000)

      await recorded
      clearTimeout(timer)
    }

    await writeFile(stem + '.recording.log', recording)
    if (pid !== undefined) {
      command('xcrun', [
        'devicectl',
        'device',
        'process',
        'terminate',
        '--device',
        device,
        '--pid',
        String(pid),
      ])
    }
  }
}

if (failed) {
  process.exitCode = 1
}

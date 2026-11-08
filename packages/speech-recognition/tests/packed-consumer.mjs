import assert from 'node:assert/strict'
import { loadSource } from '../../../scripts/load-source.ts'
import { pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(packageRoot, '../..')
const temporary = mkdtempSync(join(tmpdir(), 'octane-xplat-speech-recognition-consumer-'))
const packOutput = join(temporary, 'pack')
const extractedRoot = join(temporary, 'extracted')
mkdirSync(packOutput)
mkdirSync(extractedRoot)

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  if (result.stdout) {
    process.stdout.write(result.stdout)
  }

  if (result.stderr) {
    process.stderr.write(result.stderr)
  }

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(`${command} exited with ${result.status}`)
  }
}

// Deps the consumer needs in scope — the package's declared dependency plus
// the ambient native types the native lane's tsconfig declares.
const dependencies = ['@octane-xplat/lib', '@nativescript/types']

const consumer = `import {
	speechRecognition,
	SpeechRecognitionError,
	type SpeechRecognitionSession,
	type SpeechRecognitionResult,
	type SpeechRecognitionAvailability,
	type SpeechRecognitionOptions,
	type SpeechSessionState,
} from '@octane-xplat/speech-recognition'

const supported: boolean = speechRecognition.supported
const available: Promise<boolean> = speechRecognition.isAvailable()
const availability: Promise<SpeechRecognitionAvailability> =
	speechRecognition.getAvailability({ lang: 'en-US' })
const options: SpeechRecognitionOptions = { lang: 'en-US', interimResults: true, continuous: false }
const session: SpeechRecognitionSession = speechRecognition.start(options)
const off = session.subscribe((event) => {
	if (event.type === 'transcript') {
		const text: string = event.transcript
		const final: boolean = event.isFinal
		void text
		void final
	}

	if (event.type === 'end') {
		const done: SpeechRecognitionResult = event.result
		void done
	}
})
const state: SpeechSessionState = session.state
const stopping: Promise<SpeechRecognitionResult> = session.stop()
session.abort()
off()
const error = new SpeechRecognitionError('busy', 'held', { nativeCode: 8, cause: undefined })
const code: import('@octane-xplat/speech-recognition').SpeechRecognitionErrorCode = error.code
const native: string | number | null = error.nativeCode
void supported
void available
void availability
void state
void stopping
void code
void native
// @ts-expect-error 'loud' is not a valid error code
const bad: import('@octane-xplat/speech-recognition').SpeechRecognitionErrorCode = 'loud'
void bad
`

// Mirrors the create template's per-target tsconfig: suffix typing selects
// the platform leaf, `types` scopes ambient globals, and skipLibCheck stays
// on — NativeScript's third-party ambient declarations carry upstream
// conflicts.
const targets = {
  web: {
    moduleSuffixes: ['.web', ''],
    customConditions: ['web'],
    types: [],
  },
  native: {
    moduleSuffixes: ['.ios', '.android', '.mobile', ''],
    customConditions: ['native'],
    types: ['@nativescript/types'],
  },
  macos: {
    moduleSuffixes: ['.macos', ''],
    customConditions: ['macos'],
    types: [],
  },
  gtk: {
    moduleSuffixes: ['.gtk', ''],
    customConditions: ['gtk'],
    types: [],
  },
  linux: {
    moduleSuffixes: ['.linux', ''],
    customConditions: ['linux'],
    types: [],
  },
  windows: {
    moduleSuffixes: ['.windows', '.native', ''],
    customConditions: ['windows'],
    types: [],
  },
}

function linkDependencies(modules) {
  for (const dependency of dependencies) {
    const source = join(packageRoot, 'node_modules', dependency)
    const fallback = join(repoRoot, 'node_modules', dependency)
    const resolved = existsSync(source) ? source : existsSync(fallback) ? fallback : null
    if (!resolved) {
      continue
    }

    const targetPath = join(modules, dependency)
    mkdirSync(dirname(targetPath), { recursive: true })
    symlinkSync(resolved, targetPath, 'dir')
  }
}

function typecheck(packagePath, target, mode, exportMapIndex) {
  const consumerRoot = join(temporary, `map-${exportMapIndex}-${target}-${mode.name}`)
  const modules = join(consumerRoot, 'node_modules')
  const packageLink = join(modules, '@octane-xplat/speech-recognition')
  mkdirSync(dirname(packageLink), { recursive: true })
  cpSync(packagePath, packageLink, { recursive: true })
  linkDependencies(modules)

  // ESM consumer — NodeNext treats extensionless .ts as CJS without it.
  writeFileSync(
    join(consumerRoot, 'package.json'),
    JSON.stringify({ name: `consumer-${exportMapIndex}-${target}-${mode.name}`, type: 'module' }),
  )
  writeFileSync(join(consumerRoot, 'consumer.ts'), consumer)

  const config = targets[target]
  const configPath = join(consumerRoot, `tsconfig.${mode.name}.json`)
  writeFileSync(
    configPath,
    JSON.stringify(
      {
        compilerOptions: {
          strict: true,
          noEmit: true,
          module: mode.module,
          moduleResolution: mode.moduleResolution,
          target: 'esnext',
          moduleSuffixes: config.moduleSuffixes,
          customConditions: config.customConditions,
          types: config.types.filter((name) => {
            const segments = name.split('/')
            const pkg = name.startsWith('@') ? segments.slice(0, 2) : segments.slice(0, 1)
            return existsSync(join(modules, ...pkg, 'package.json'))
          }),
          skipLibCheck: true,
        },
        files: ['consumer.ts'],
      },
      null,
      2,
    ),
  )

  run(
    process.execPath,
    [join(repoRoot, 'node_modules/typescript/bin/tsc'), '--project', configPath],
    consumerRoot,
  )
}

// Execute the real resolved entry for one condition in Node — every lane
// must import cleanly and report the explicit unsupported contract rather
// than crashing on missing host globals.
async function importCheck(packagePath, condition) {
  const importRoot = join(temporary, `import-${condition}`)
  const modules = join(importRoot, 'node_modules')
  const packageLink = join(modules, '@octane-xplat/speech-recognition')
  mkdirSync(dirname(packageLink), { recursive: true })
  cpSync(packagePath, packageLink, { recursive: true })
  linkDependencies(modules)
  writeFileSync(join(importRoot, 'package.json'), '{"type":"module"}')
  writeFileSync(
    join(importRoot, 'consumer.mjs'),
    `
import assert from 'node:assert/strict'
import { speechRecognition } from '@octane-xplat/speech-recognition'
assert.equal(speechRecognition.supported, false)
assert.equal(await speechRecognition.isAvailable(), false)
const availability = await speechRecognition.getAvailability({ lang: 'en-US' })
assert.equal(availability.available, false)
assert.equal(availability.reason, 'unsupported')
assert.equal(availability.lang, 'en-US')
const permission = await speechRecognition.getPermissions()
assert.equal(permission.status, 'unsupported')
assert.throws(() => speechRecognition.start(), /unavailable/)
`,
  )

  await loadSource(pathToFileURL(join(importRoot, 'consumer.mjs')), {
    resolve: { conditions: [condition] },
    ssr: {
      noExternal: ['@octane-xplat/speech-recognition', '@octane-xplat/lib'],
      resolve: { conditions: [condition] },
    },
  })
}

try {
  run('bun', ['pm', 'pack', '--ignore-scripts', '--destination', packOutput], packageRoot)
  const tarballs = readdirSync(packOutput).filter((name) => name.endsWith('.tgz'))
  assert.equal(tarballs.length, 1, 'bun pm pack produces one tarball')
  run('tar', ['-xzf', join(packOutput, tarballs[0]), '-C', extractedRoot], temporary)
  const packedRoot = join(extractedRoot, 'package')
  const packedManifest = JSON.parse(readFileSync(join(packedRoot, 'package.json'), 'utf8'))
  const workspaceManifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))

  const exportMaps = [
    workspaceManifest.exports,
    workspaceManifest.publishConfig?.exports ?? packedManifest.exports,
  ]

  const uniqueExportMaps = exportMaps.filter(
    (exportsMap, index) =>
      exportsMap &&
      exportMaps.findIndex(
        (candidate) => JSON.stringify(candidate) === JSON.stringify(exportsMap),
      ) === index,
  )

  for (const [index, exportsMap] of uniqueExportMaps.entries()) {
    const consumerPackage = join(temporary, `package-${index}`)
    cpSync(packedRoot, consumerPackage, { recursive: true })
    const consumerManifestPath = join(consumerPackage, 'package.json')
    const consumerManifest = JSON.parse(readFileSync(consumerManifestPath, 'utf8'))
    consumerManifest.exports = exportsMap
    writeFileSync(consumerManifestPath, `${JSON.stringify(consumerManifest, null, 2)}\n`)

    for (const target of Object.keys(targets)) {
      if (!exportsMap['.']) {
        continue
      }

      for (const mode of [
        { name: 'bundler', module: 'esnext', moduleResolution: 'bundler' },
        { name: 'nodenext', module: 'nodenext', moduleResolution: 'nodenext' },
      ]) {
        typecheck(consumerPackage, target, mode, index)
      }
    }
  }

  for (const condition of ['web', 'macos', 'gtk', 'linux', 'windows', 'native', 'default']) {
    await importCheck(packedRoot, condition === 'default' ? 'import' : condition)
  }

  console.log(
    'speech-recognition packed consumer: six targets typecheck in Bundler and NodeNext modes; all seven resolved entries import and report unsupported cleanly',
  )
} finally {
  rmSync(temporary, { recursive: true, force: true })
}

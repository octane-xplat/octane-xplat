import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, it } from 'node:test'
import { findHmrScopeGaps } from '../dist/doctor-checks.js'
import { inspectCompatibility } from '../dist/compatibility-check.js'

const dirs = []
const track = (p) => {
  dirs.push(p)
  return p
}

const tmp = (name) => realpathSync(track(mkdtempSync(join(tmpdir(), name))))

const makePkg = (dir, manifest, files = {}) => {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'package.json'), JSON.stringify(manifest))
  for (const [file, contents] of Object.entries(files)) {
    mkdirSync(join(dir, file, '..'), { recursive: true })
    writeFileSync(join(dir, file), contents)
  }

  return dir
}

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('findHmrScopeGaps', () => {
  it('only reports workspace packages whose shippable source can join the app bundles', () => {
    const ws = tmp('xplat-hmr-ws-')
    const app = join(ws, 'apps/mobile')

    makePkg(ws, { name: 'ws', workspaces: ['apps/*', 'packages/*'] })
    makePkg(app, {
      name: 'app',
      dependencies: { '@nativescript/ios': '9.1.0' },
    })
    writeFileSync(join(app, 'nativescript.config.ts'), 'export default {}')
    writeFileSync(
      join(app, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          paths: {
            '@scope/covered': ['../../packages/covered/src/index.ts'],
            '@scope/covered/*': ['../../packages/covered/src/*'],
          },
        },
      }),
    )
    mkdirSync(join(app, 'src'), { recursive: true })
    writeFileSync(join(app, 'src/main.ts'), "import '@scope/covered'\nimport '@scope/gap'\n")

    makePkg(join(ws, 'packages/covered'), { name: '@scope/covered' }, { 'src/index.ts': '' })
    makePkg(join(ws, 'packages/gap'), { name: '@scope/gap' }, {
      'src/index.ts':
        "import '@scope/deep'\nimport '@scope/types'\nimport '@scope/webonly'\n",
      // None of these files can join an iOS bundle, so the packages they
      // import are not in the app's HMR scope.
      'src/impl.web.ts': "import '@scope/webedge'\n",
      'src/impl.ios.ts': "import '@scope/iosgap'\n",
      'src/impl.test.ts': "import '@scope/testedge'\n",
      'src/web/index.ts': "import '@scope/platformdir'\n",
      'tests/tool.ts': "import '@scope/testdiredge'\n",
    })
    makePkg(join(ws, 'packages/deep'), { name: '@scope/deep' }, { 'src/index.ts': '' })
    makePkg(join(ws, 'packages/iosgap'), { name: '@scope/iosgap' }, { 'src/index.ts': '' })
    // Type-only facade and platform-foreign package: reachable, but nothing
    // they ship is hot-updatable on iOS.
    makePkg(join(ws, 'packages/types'), { name: '@scope/types' }, { 'src/index.d.ts': '' })
    makePkg(join(ws, 'packages/webonly'), { name: '@scope/webonly' }, {
      'src/index.web.ts': '',
    })
    // Only reachable through excluded files; never enters the scan at all.
    makePkg(join(ws, 'packages/webedge'), { name: '@scope/webedge' }, { 'src/index.ts': '' })
    makePkg(join(ws, 'packages/testedge'), { name: '@scope/testedge' }, { 'src/index.ts': '' })
    makePkg(join(ws, 'packages/testdiredge'), { name: '@scope/testdiredge' }, {
      'src/index.ts': '',
    })
    makePkg(join(ws, 'packages/platformdir'), { name: '@scope/platformdir' }, {
      'src/index.ts': '',
    })

    assert.deepEqual(findHmrScopeGaps(app), ['@scope/deep', '@scope/gap', '@scope/iosgap'])
  })

  it('keeps every reachable workspace package inside the repository app scope', () => {
    const app = join(dirname(fileURLToPath(import.meta.url)), '../../../apps/mobile')

    assert.deepEqual(findHmrScopeGaps(app), [])
  })
})

describe('inspectCompatibility', () => {
  it('does not count an engine installed privately for an optional peer as a second app engine', () => {
    const ws = tmp('xplat-engine-ws-')
    const app = join(ws, 'apps/mobile')

    makePkg(ws, {
      name: 'ws',
      packageManager: 'bun@1.4.4',
      workspaces: ['apps/*'],
    })
    makePkg(app, {
      name: 'app',
      dependencies: {
        '@nativescript/ios': '9.1.0',
        '@octane-xplat/nativescript-mason-core': '1.0.0',
        '@octane-xplat/nativescript-octane': '1.0.0',
        '@tsrx/oxc': '0.23.0',
        octane: '0.17.0',
      },
    })

    // The driver pins masonkit as an optional peer so a linked checkout can
    // self-host; its own nested install is not an engine the app selected.
    const driver = makePkg(join(app, 'node_modules/@octane-xplat/nativescript-octane'), {
      name: '@octane-xplat/nativescript-octane',
      version: '1.0.0',
      peerDependencies: { '@octane-xplat/nativescript-masonkit': '*' },
      peerDependenciesMeta: { '@octane-xplat/nativescript-masonkit': { optional: true } },
    })

    makePkg(join(driver, 'node_modules/@octane-xplat/nativescript-masonkit'), {
      name: '@octane-xplat/nativescript-masonkit',
      version: '1.0.0',
    })
    makePkg(join(app, 'node_modules/@octane-xplat/nativescript-mason-core'), {
      name: '@octane-xplat/nativescript-mason-core',
      version: '1.0.0',
    })
    makePkg(join(app, 'node_modules/@nativescript/ios'), {
      name: '@nativescript/ios',
      version: '9.1.0',
    })
    makePkg(join(app, 'node_modules/@tsrx/oxc'), { name: '@tsrx/oxc', version: '0.23.0' })
    makePkg(join(app, 'node_modules/octane'), {
      name: 'octane',
      version: '0.17.0',
      peerDependencies: { '@tsrx/oxc': '*' },
    })

    const rows = inspectCompatibility(app, { node: process.version, bun: '1.4.4' })
    const engines = rows.find((row) => row.name === 'compatibility installed mason engines')

    assert.ok(engines, JSON.stringify(rows))
    assert.equal(engines.ok, true, engines.detail)
  })

  it('passes the repository app compiler-peer and engine checks', () => {
    const app = join(dirname(fileURLToPath(import.meta.url)), '../../../apps/mobile')
    const rows = inspectCompatibility(app, { node: process.version, bun: '1.4.4' })

    assert.equal(
      rows.some((row) => row.name === 'compatibility compiler peer @tsrx/oxc'),
      false,
      JSON.stringify(rows),
    )

    const engines = rows.find((row) => row.name === 'compatibility installed mason engines')

    assert.ok(engines, JSON.stringify(rows))
    assert.equal(engines.ok, true, engines.detail)
  })
})

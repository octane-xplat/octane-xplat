import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const checker = new URL('./check-vite-tsconfigs.ts', import.meta.url).pathname

const GENERATED_REFERENCES = {
  files: [],
  references: [{ path: './node_modules/.cache/xplat-typecheck/web.json' }],
}

const PINNED_CONFIG = `import { defineConfig } from 'vite'
export default defineConfig({
  tsconfig: new URL('./tsconfig.envs.json', import.meta.url).pathname,
  build: { lib: { entry: 'src/index.ts' } },
})
`

function audit(packages) {
  const root = mkdtempSync(join(tmpdir(), 'vite-tsconfig-audit-'))

  try {
    for (const [name, files] of Object.entries(packages)) {
      const dir = join(root, 'packages', name)
      mkdirSync(dir, { recursive: true })

      for (const [file, contents] of Object.entries(files)) {
        writeFileSync(
          join(dir, file),
          typeof contents === 'string' ? contents : JSON.stringify(contents),
        )
      }
    }

    return spawnSync(process.execPath, [checker, root], { encoding: 'utf8' })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

const manifest = (build) => ({ name: '@fixture/pkg', scripts: { build } })

test('a pinned vite build config satisfies the audit', () => {
  const result = audit({
    pinned: {
      'package.json': manifest('vite build'),
      'tsconfig.json': GENERATED_REFERENCES,
      'tsconfig.envs.json': { extends: '../../tsconfig.base.json' },
      'vite.config.ts': PINNED_CONFIG,
    },
  })

  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /pinned:/)
})

test('an unpinned config on a generated-references package fails', () => {
  const result = audit({
    unpinned: {
      'package.json': manifest('vite build'),
      'tsconfig.json': GENERATED_REFERENCES,
      'vite.config.ts': `import { defineConfig } from 'vite'\nexport default defineConfig({ build: {} })\n`,
    },
  })

  assert.equal(result.status, 1, result.stdout + result.stderr)
  assert.match(result.stderr, /UNPINNED: .*unpinned\/vite\.config\.ts/)
})

test('a pin naming a missing manifest fails', () => {
  const result = audit({
    'missing-target': {
      'package.json': manifest('vite build'),
      'tsconfig.json': GENERATED_REFERENCES,
      'vite.config.ts': `import { defineConfig } from 'vite'
export default defineConfig({ tsconfig: './tsconfig.envs.json', build: {} })
`,
    },
  })

  assert.equal(result.status, 1, result.stdout + result.stderr)
  assert.match(result.stderr, /UNPINNED:/)
})

test('include-style and committed-reference tsconfigs need no pin', () => {
  const result = audit({
    'include-style': {
      'package.json': manifest('vite build'),
      'tsconfig.json': { include: ['src/**/*.ts'] },
      'vite.config.ts': `import { defineConfig } from 'vite'\nexport default defineConfig({ build: {} })\n`,
    },
    'committed-references': {
      'package.json': manifest('vite build --config vite.pkg.config.ts'),
      'tsconfig.json': { files: [], references: [{ path: './tsconfig.build.json' }] },
      'vite.pkg.config.ts': `import { defineConfig } from 'vite'\nexport default defineConfig({ build: {} })\n`,
    },
    'no-vite-build': {
      'package.json': manifest('tsc -p tsconfig.build.json'),
      'tsconfig.json': GENERATED_REFERENCES,
    },
  })

  assert.equal(result.status, 0, result.stdout + result.stderr)
})

test('a references-style package running vite build with no config file fails', () => {
  const result = audit({
    'no-config': {
      'package.json': manifest('vite build'),
      'tsconfig.json': GENERATED_REFERENCES,
    },
  })

  assert.equal(result.status, 1, result.stdout + result.stderr)
  assert.match(result.stderr, /UNPINNED: .*no-config\/package\.json/)
})

test('a --config operand resolves the pinned config file', () => {
  const result = audit({
    'custom-config': {
      'package.json': manifest(
        'tsc -p tsconfig.build.json && vite build --config vite.panel.config.mjs',
      ),
      'tsconfig.json': GENERATED_REFERENCES,
      'tsconfig.envs.json': { extends: '../../tsconfig.base.json' },
      'vite.panel.config.mjs': `import { defineConfig } from 'vite'
export default defineConfig({
  tsconfig: new URL('./tsconfig.envs.json', import.meta.url).pathname,
})
`,
    },
  })

  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /vite\.panel\.config\.mjs -> \.\/tsconfig\.envs\.json/)
})

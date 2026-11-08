import { test } from 'node:test'
import assert from 'node:assert/strict'
import { manifestAssets } from '../src/assets.ts'

const manifest = {
  'src/main.ts': {
    file: 'assets/main-AAA.js',
    isEntry: true,
    css: ['assets/main-AAA.css'],
    imports: ['_vendor-BBB.js', '_shared-CCC.js'],
  },
  '_vendor-BBB.js': {
    file: 'assets/vendor-BBB.js',
    css: ['assets/vendor-BBB.css'],
    imports: ['_dep-DDD.js'],
  },
  '_shared-CCC.js': {
    file: 'assets/shared-CCC.js',
    css: ['assets/shared-CCC.css', 'assets/vendor-BBB.css'],
  },
  '_dep-DDD.js': {
    file: 'assets/dep-DDD.js',
    css: ['assets/dep-DDD.css'],
  },
  'src/lazy.ts': {
    file: 'assets/lazy-EEE.js',
    isDynamicEntry: true,
    css: ['assets/lazy-EEE.css'],
  },
}

test('resolves the entry script and imported stylesheets before the entry CSS', () => {
  assert.deepEqual(manifestAssets(manifest, 'src/main.ts'), {
    scripts: ['/assets/main-AAA.js'],
    styles: [
      '/assets/dep-DDD.css',
      '/assets/vendor-BBB.css',
      '/assets/shared-CCC.css',
      '/assets/main-AAA.css',
    ],
  })
})

test('prefixes every asset with a custom base and tolerates missing imports or css', () => {
  assert.deepEqual(
    manifestAssets(
      {
        'src/app.ts': { file: 'assets/app.js', isEntry: true, imports: ['_gone.js', '_x.js'] },
        '_x.js': { file: 'assets/x.js' },
      },
      'src/app.ts',
      { base: '/static/' },
    ),
    { scripts: ['/static/assets/app.js'], styles: [] },
  )

  for (const base of ['static', 'static/', '/static', '']) {
    assert.throws(() => manifestAssets(manifest, 'src/main.ts', { base }), TypeError, base)
  }
})

test('visits each chunk once across cycles and shared imports', () => {
  assert.deepEqual(
    manifestAssets(
      {
        'src/app.ts': { file: 'app.js', isEntry: true, imports: ['_a.js'] },
        '_a.js': { file: 'a.js', css: ['a.css'], imports: ['_b.js'] },
        '_b.js': { file: 'b.js', css: ['b.css'], imports: ['_a.js', 'src/app.ts'] },
      },
      'src/app.ts',
    ),
    { scripts: ['/app.js'], styles: ['/b.css', '/a.css'] },
  )
})

test('rejects a missing entry and a non-entry chunk by name', () => {
  assert.throws(() => manifestAssets(manifest, 'src/absent.ts'), /src\/absent\.ts/)
  assert.throws(() => manifestAssets(manifest, 'src/lazy.ts'), /src\/lazy\.ts/)
})

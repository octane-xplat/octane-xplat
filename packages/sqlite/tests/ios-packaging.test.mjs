import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

// Guards nativescript-community/sqlite#53: a library-style xcframework slice
// carrying a bare Headers/module.modulemap makes Xcode's ProcessXCFramework
// emit include/module.modulemap per package — any second map-carrying library
// xcframework (e.g. @nativescript/font-manager's SwiftPM FontManager binary
// target) fails the app build with "Multiple commands produce
// .../include/module.modulemap". The repo patches them out of
// @nativescript-community/sqlite-bridge (packages/cli/patches); this test fails
// if the patch stops applying, a version bump revives a bare map, or another
// package in the plugin family introduces one.

const repo = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const require = createRequire(import.meta.url)

// Resolve transitive deps from the direct dependency's real location so bun's
// isolated store and flat layouts both reach sibling node_modules.
const sqliteAnchor = dirname(
  realpathSync(require.resolve('@nativescript-community/sqlite/package.json')),
)

const fromSqlite = createRequire(join(sqliteAnchor, 'resolve-anchor.js'))
const packageRoot = (name) => dirname(fromSqlite.resolve(`${name}/package.json`))

const listFiles = (dir) => {
  if (!existsSync(dir)) {
    return []
  }
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    return statSync(path).isDirectory() ? listFiles(path) : [path]
  })
}

const SQLITE_PACKAGES = [
  '@nativescript-community/sqlite',
  '@nativescript-community/sqlite-bridge',
  '@nativescript-community/sqlite-core',
  '@nativescript-community/sqlite-napi',
  '@nativescript-community/sqlite-default-engine',
]

test('installed sqlite plugin family ships no bare library-slice modulemaps', () => {
  const offenders = []
  for (const name of SQLITE_PACKAGES) {
    for (const file of listFiles(join(packageRoot(name), 'platforms/ios'))) {
      // Framework-style maps (<x>.framework/Modules/module.modulemap) merge
      // into the emitted bundle at a per-framework path and cannot collide;
      // any other placement lands on the shared include/ root.
      if (
        file.endsWith('module.modulemap') &&
        !file.endsWith('.framework/Modules/module.modulemap')
      ) {
        offenders.push(file)
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    'bare module.modulemap(s) in installed sqlite packages collide under ProcessXCFramework — check the sqlite-bridge patch registration (packages/cli/patches/manifest.json)',
  )
})

test('sqlite-bridge slices retain headers and static libraries', () => {
  const root = packageRoot('@nativescript-community/sqlite-bridge')
  const xcframework = join(root, 'platforms/ios/NSSqliteBridge.xcframework')
  const plist = readFileSync(join(xcframework, 'Info.plist'), 'utf8')
  const slices = [...plist.matchAll(/<key>LibraryIdentifier<\/key>\s*<string>([^<]+)/g)].map(
    (m) => m[1],
  )
  assert.ok(slices.length > 0, 'no AvailableLibraries in NSSqliteBridge.xcframework')
  for (const slice of slices) {
    const dir = join(xcframework, slice)
    assert.ok(
      existsSync(join(dir, 'Headers/NSSqliteBridge.h')),
      `${slice}: missing Headers/NSSqliteBridge.h — NativeScript metadata generation and ObjC consumers read this header`,
    )

    const binary =
      plist.match(/<key>BinaryPath<\/key>\s*<string>([^<]+)/)?.[1] ?? 'libNSSqliteBridge.a'

    assert.ok(
      existsSync(join(dir, binary)),
      `${slice}: missing ${binary} — the bridge's static library must still link`,
    )
  }
})

test('canonical patch removes one modulemap per published slice', () => {
  const patch = readFileSync(
    join(repo, 'packages/cli/patches/@nativescript-community__sqlite-bridge@4.1.1.patch'),
    'utf8',
  )
  const removed = new Set(
    [
      ...patch.matchAll(
        /^deleted file mode.*\nindex [0-9a-f]+\.\.[0-9a-f]+.*\n--- (a\/.+\/module\.modulemap)$/gm,
      ),
    ].map((m) => m[1].slice(2)),
  )
  assert.ok(removed.size > 0, 'patch removes no module.modulemap files')
  const root = packageRoot('@nativescript-community/sqlite-bridge')
  const plist = readFileSync(
    join(root, 'platforms/ios/NSSqliteBridge.xcframework/Info.plist'),
    'utf8',
  )
  const expected = [...plist.matchAll(/<key>LibraryIdentifier<\/key>\s*<string>([^<]+)/g)].map(
    (m) => `platforms/ios/NSSqliteBridge.xcframework/${m[1]}/Headers/module.modulemap`,
  )
  for (const path of expected) {
    assert.ok(
      removed.has(path),
      `patch does not remove ${path} — the published slice set outgrew the patch`,
    )
  }
})

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const platform = process.argv[2]

assert.equal(platform, 'ios')
assert.equal(process.platform, 'darwin', 'Apple API checks require the designated Apple host')

const root = fileURLToPath(new URL('..', import.meta.url))

// The iOS backend is TypeScript-only: it must not ship a compiled Swift/ObjC
// bridge under platforms/ios. Re-adding a wrapper is a regression.
assert.ok(
  !existsSync(join(root, 'platforms/ios')),
  'tracking-transparency must not ship iOS native wrapper sources',
)

// The Apple SDK this host builds against must still carry both frameworks the
// backend loads through NSBundle at runtime.
const sdk = spawnSync('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-path'], {
  encoding: 'utf8',
})

assert.equal(sdk.status, 0, sdk.stderr)
for (const framework of ['AppTrackingTransparency', 'AdSupport']) {
  assert.ok(
    existsSync(join(sdk.stdout.trim(), `System/Library/Frameworks/${framework}.framework`)),
    `${framework}.framework missing from the iPhoneSimulator SDK`,
  )
}

// NativeScript exposes these SDKs through generated runtime metadata; the
// shipped @nativescript/types-ios declarations mirror that surface. Guard the
// members the backend binds so a types upgrade cannot silently drop them.
const require_ = createRequire(join(root, 'package.json'))
// types-ios is a dependency of the declared @nativescript/types umbrella;
// resolve relative to it so the check works under isolated layouts.
const umbrella = require_.resolve('@nativescript/types/index.d.ts')
const typesEntry = createRequire(umbrella).resolve('@nativescript/types-ios/index.d.ts')
const objcDir = join(dirname(typesEntry), 'lib', 'ios')
const arch = readdirSync(objcDir).find((entry) => entry.startsWith('objc-'))

assert.ok(arch, 'no objc-* declaration directory under @nativescript/types-ios')

const declarations = (framework) =>
  readFileSync(join(objcDir, arch, `objc!${framework}.d.ts`), 'utf8')

const att = declarations('AppTrackingTransparency')

for (const member of [
  'declare class ATTrackingManager',
  'requestTrackingAuthorizationWithCompletionHandler',
  'trackingAuthorizationStatus',
  'ATTrackingManagerAuthorizationStatus',
]) {
  assert.ok(att.includes(member), `types-ios lost AppTrackingTransparency member: ${member}`)
}

const ads = declarations('AdSupport')

for (const member of [
  'declare class ASIdentifierManager',
  'sharedManager()',
  'advertisingIdentifier',
  'advertisingTrackingEnabled',
]) {
  assert.ok(ads.includes(member), `types-ios lost AdSupport member: ${member}`)
}

console.log(
  `${platform} ATT/AdSupport binding prerequisites pass. No permission prompt or advertising identifier read was performed.`,
)

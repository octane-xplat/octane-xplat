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
	'splash-screen must not ship iOS native wrapper sources',
)

const sdk = spawnSync('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-path'], {
	encoding: 'utf8',
})
assert.equal(sdk.status, 0, sdk.stderr)
assert.ok(
	existsSync(join(sdk.stdout.trim(), 'System/Library/Frameworks/UIKit.framework')),
	'UIKit.framework missing from the iPhoneSimulator SDK',
)

// NativeScript exposes these SDKs through generated runtime metadata; the
// shipped @nativescript/types-ios declarations mirror that surface. Guard the
// members the backend binds so a types upgrade cannot silently drop them.
const require_ = createRequire(join(root, 'package.json'))
const umbrella = require_.resolve('@nativescript/types/index.d.ts')
const typesEntry = createRequire(umbrella).resolve('@nativescript/types-ios/index.d.ts')
const objcDir = join(dirname(typesEntry), 'lib', 'ios')
const arch = readdirSync(objcDir).find((entry) => entry.startsWith('objc-'))
assert.ok(arch, 'no objc-* declaration directory under @nativescript/types-ios')
const declarations = (framework) =>
	readFileSync(join(objcDir, arch, `objc!${framework}.d.ts`), 'utf8')

const foundation = declarations('Foundation')
for (const member of [
	'declare class NSBundle',
	'objectForInfoDictionaryKey',
	'pathForResourceOfType',
	'addObserverForNameObjectQueueUsingBlock',
	'removeObserver(observer',
	'declare class NSThread',
	'isMainThread',
	'declare class NSNumber',
	'declare class NSOperationQueue',
	'mainQueue',
	'underlyingQueue',
	'addOperationWithBlock',
]) {
	assert.ok(foundation.includes(member), `types-ios lost Foundation member: ${member}`)
}
const objectivec = declarations('ObjectiveC')
for (const member of [
	'addObserverForKeyPathOptionsContext',
	'removeObserverForKeyPath',
	'observeValueForKeyPathOfObjectChangeContext',
	'accessibilityViewIsModal',
]) {
	assert.ok(objectivec.includes(member), `types-ios lost ObjectiveC member: ${member}`)
}
const dispatch = declarations('Dispatch')
for (const member of ['declare function dispatch_after', 'declare function dispatch_time']) {
	assert.ok(dispatch.includes(member), `types-ios lost Dispatch member: ${member}`)
}
const uikit = declarations('UIKit')
for (const member of [
	'storyboardWithNameBundle',
	'instantiateInitialViewController',
	'animateWithDurationAnimationsCompletion',
	'UIWindowDidBecomeVisibleNotification',
	'UIWindowDidBecomeHiddenNotification',
	'UIWindowLevelNormal',
	'rootViewController',
	'accessibilityIdentifier',
	'userInteractionEnabled',
]) {
	assert.ok(uikit.includes(member), `types-ios lost UIKit member: ${member}`)
}
console.log(
	'iOS launch-screen binding prerequisites pass. No window, observer or storyboard was created.',
)

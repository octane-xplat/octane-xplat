import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

// Shared byte-identity checks for Android fixture consumers. No device work.
export function readAndroidBuild(directory) {
  if (!directory) throw new Error('Set XPLAT_PRERENDER_ANDROID_BUILD to the printed build directory')
  const build = JSON.parse(readFileSync(join(resolve(directory), 'build.json'), 'utf8'))
  const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
  const check = (value, reason) => {
    if (!value) throw new Error(reason)
  }
  check(
    build.id === (build.home ? 'org.octanexplat.prerenderhome.android' : 'org.octanexplat.prerenderbootstrap.android'),
    'Unexpected bootstrap app identity',
  )
  check(hash(build.apk) === build.apkHash, 'APK changed since build')
  for (const [path, input] of Object.entries(build.sourceHashes))
    check(hash(path) === input.sha256 && hash(input.copy) === input.sha256, 'Build source changed: ' + path)
  for (const input of Object.values(build.inputs))
    check(hash(input.copy) === input.sha256, 'Pinned SDK input changed: ' + input.copy)
  for (const [path, digest] of Object.entries(build.generatedHashes))
    check(hash(path) === digest, 'Generated input changed: ' + path)
  return build
}

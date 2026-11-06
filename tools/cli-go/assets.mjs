// Optional native inference fixtures; downloads never happen in the executable.
import assert from 'node:assert/strict'
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

export const assetPins = JSON.parse(readFileSync(new URL('./native-assets.json', import.meta.url)))
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
export async function runtimeAssets(target) {
  const pin = assetPins.targets[target]
  assert.ok(pin, 'Unsupported native runtime target')
  const work = resolve(import.meta.dirname, '../../research/go-cli/runtime-assets')
  mkdirSync(work, { recursive: true })
  const archive = join(work, pin.url.split('/').at(-1)),
    library = join(work, pin.directory, pin.library)
  if (!existsSync(archive) || sha(readFileSync(archive)) !== pin.sha256) {
    const response = await fetch(pin.url, { signal: AbortSignal.timeout(120000) })
    assert.equal(response.ok, true)
    const bytes = Buffer.from(await response.arrayBuffer())
    assert.equal(bytes.length, pin.bytes)
    assert.equal(sha(bytes), pin.sha256)
    writeFileSync(archive, bytes)
  }
  const extracted = spawnSync(
    'tar',
    [
      '-xf',
      archive,
      '-C',
      work,
      ...[pin.library, 'LICENSE', 'ThirdPartyNotices.txt'].map(
        (name) => pin.directory + '/' + name,
      ),
    ],
    { encoding: 'utf8' },
  )
  assert.equal(extracted.status, 0, extracted.stderr)
  assert.equal(sha(readFileSync(library)), pin.librarySha256)
  return { pin, library, directory: join(work, pin.directory) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log(JSON.stringify(await runtimeAssets(process.argv[2])))
}

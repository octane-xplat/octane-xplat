import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, readdirSync, mkdtempSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { gzipSync } from 'node:zlib'
const root = resolve(import.meta.dirname, '../..')
const run = (command, args, options = {}) => {
 const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', ...options })
 assert.equal(result.status, 0, result.stderr)
 return result
}
test('packed npm consumer installs a native CLI with no JS payload or runtime dependencies', () => {
 run(process.execPath, [resolve(import.meta.dirname, 'pack.mjs'), '--host-only'])
 const { stage, version } = JSON.parse(readFileSync(resolve(root, 'research/nim-cli/package/stage.json')))
 const tarball = resolve(root, 'research/nim-cli/package', `octane-xplat-cli-${version}.tgz`)
 const inventory = run('tar', ['-tzf', tarball]).stdout.split('\n').filter(Boolean)
 assert.ok(inventory.length > 0)
 assert.ok(inventory.includes('package/native/NOTICE.txt'))
 assert.ok(inventory.includes('package/LICENSE'))
 assert.ok(inventory.every(path => /^package\/(package\.json|LICENSE|install-native\.mjs|bin\/xplat\.exe|native\/[^/]+)$/.test(path)), inventory.join('\n'))
 assert.ok(!inventory.some(path => /\/(src|dist|patches|node_modules)\//.test(path)))
 const pkg = JSON.parse(readFileSync(join(stage, 'package.json')))
 assert.equal(pkg.name, '@octane-xplat/cli')
 assert.equal(pkg.publishConfig.tag, 'nim')
 for (const field of ['exports','dependencies','devDependencies','peerDependencies','optionalDependencies']) assert.equal(pkg[field], undefined)
 // Qualify extraction and the real install hook, not just the staging directory.
 const extracted = mkdtempSync(join(tmpdir(), 'xplat-nim-packed-'))
 run('tar', ['-xzf', tarball, '-C', extracted])
 const packageRoot = join(extracted, 'package')
 run(process.execPath, [join(packageRoot, 'install-native.mjs')])
 const binary = join(packageRoot, 'bin/xplat.exe')
 const result = run(binary, ['catalog', '--json'], { env: { ...process.env, PATH: '' } })
 assert.equal(JSON.parse(result.stdout).ok, true)
 // Installer must refuse changed bytes before selecting a binary.
 const manifest = JSON.parse(readFileSync(join(packageRoot,'native/manifest.json')))
 const selected = manifest[`${process.platform}-${process.arch}`]
 writeFileSync(join(packageRoot,'native',selected.file), 'tampered')
 const bad = spawnSync(process.execPath, [join(packageRoot,'install-native.mjs')], { encoding:'utf8' })
 assert.notEqual(bad.status, 0)
 assert.match(bad.stderr, /checksum mismatch/)
 console.log(`Native npm tarball: ${readFileSync(tarball).length} bytes; standalone gzip: ${gzipSync(readFileSync(binary)).length} bytes`)
})

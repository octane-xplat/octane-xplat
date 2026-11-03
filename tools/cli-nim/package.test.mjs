import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, readdirSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { gzipSync } from 'node:zlib'
const root = resolve(import.meta.dirname, '../..')
const run = (command, args, options = {}) => {
 const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', ...options })
 assert.equal(result.status, 0, result.stderr)
 return result
}
test('packed npm consumer keeps a native bin, bounded exports and opt-in engines', t => {
 run(process.execPath, [resolve(import.meta.dirname, 'pack.mjs'), '--host-only'])
 const { stage, version } = JSON.parse(readFileSync(resolve(root, 'research/nim-cli/package/stage.json')))
 const tarball = resolve(root, 'research/nim-cli/package', `octane-xplat-cli-${version}.tgz`)
 const inventory = run('tar', ['-tzf', tarball]).stdout.split('\n').filter(Boolean)
 assert.ok(inventory.length > 0)
 assert.ok(inventory.includes('package/native/NOTICE.txt'))
 assert.ok(inventory.includes('package/LICENSE'))
 assert.ok(inventory.every(path => /^package\/(package\.json|LICENSE|install-native\.mjs|bin\/xplat\.exe|native\/[^/]+|dist\/.+)$/.test(path)), inventory.join('\n'))
 assert.ok(!inventory.some(path => /\/(src|patches|node_modules)\//.test(path)))
 const pkg = JSON.parse(readFileSync(join(stage, 'package.json')))
 assert.equal(pkg.name, '@octane-xplat/cli')
 assert.equal(pkg.publishConfig.tag, 'nim')
 for (const field of ['dependencies','devDependencies','optionalDependencies']) {assert.equal(pkg[field], undefined)}
 assert.deepEqual(Object.keys(pkg.exports).sort(),['./linux-gtk/vite','./macos/vite','./vite','./worker'])
 assert.ok(Object.values(pkg.peerDependenciesMeta).every(value => value.optional))
 for (const entry of ['cli.js','commands/fmt.js','mcp/docs-service.js','macos/jsc-host/prebuilt/macos/host']) {assert.ok(!inventory.includes('package/dist/'+entry))}
 // Qualify extraction and the real install hook, not just the staging directory.
 const extracted = mkdtempSync(join(tmpdir(), 'xplat-nim-packed-'))
 t.after(()=>{rmSync(extracted,{recursive:true,force:true});rmSync(stage,{recursive:true,force:true})})
 run('tar', ['-xzf', tarball, '-C', extracted])
 const consumer = join(extracted,'consumer')
 mkdirSync(consumer)
 writeFileSync(join(consumer,'package.json'),JSON.stringify({private:true,dependencies:{'@octane-xplat/cli':`file:${tarball}`}}))
 run('bun',['install','--ignore-scripts','--linker','isolated'],{cwd:consumer})
 assert.deepEqual(readdirSync(join(consumer,'node_modules')).filter(name=>!name.startsWith('.')),['@octane-xplat'])
 assert.deepEqual(readdirSync(join(consumer,'node_modules/@octane-xplat')),['cli'])
 const packageRoot = join(extracted, 'package')
 const notices = readFileSync(join(packageRoot, 'native/NOTICE.txt'), 'utf8')
 assert.match(notices, /Hugging Face tokenizers\.js 0\.2\.0 \(Apache-2\.0\)/)
 assert.match(notices, /c64658585ee6b65da8788f434b8ac53e93a4e32c/)
 assert.match(notices, /Apache License\s+Version 2\.0/)
 assert.match(notices, /ada 4\.0\.0 \(b12a893a45809da8103bb4f1e2f6f5ee13f9100b\)/)
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

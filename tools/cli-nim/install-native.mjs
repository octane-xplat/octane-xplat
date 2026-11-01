// Runs at installation only; xplat itself launches the native executable.
import { copyFileSync, chmodSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
const root = import.meta.dirname
const target = `${process.platform}-${process.arch}`
const manifest = JSON.parse(readFileSync(resolve(root,'native/manifest.json')))
const record = manifest[target]
if (!record) throw Error(`The Nim CLI has no executable for ${target}`)
const source = resolve(root, 'native', record.file)
if (createHash('sha256').update(readFileSync(source)).digest('hex') !== record.sha256) throw Error('Native CLI checksum mismatch')
copyFileSync(source,resolve(root,'bin/xplat.exe'))
chmodSync(resolve(root,'bin/xplat.exe'),0o755)

// Task-local compiler only; never installs or changes system tools.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
	createReadStream,
	createWriteStream,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	renameSync,
	rmSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pin = JSON.parse(readFileSync(join(here, 'compiler.json'), 'utf8'))
const asset = pin.assets[`${process.platform}-${process.arch}`]
assert.ok(asset, 'No pinned compiler asset for this host')
const root = resolve(here, '../../research/perry-cli')
mkdirSync(root, { recursive: true })
const destination = join(root, 'compiler')
if (existsSync(destination)) {
	throw new Error(
		'research/perry-cli/compiler already exists; set PERRY_BIN to use an existing compiler. The installer will not overwrite it.',
	)
}
const scratch = mkdtempSync(join(root, '.download-'))
try {
	const archive = join(scratch, asset.name)
	const response = await fetch(
		`https://github.com/PerryTS/perry/releases/download/v${pin.version}/${asset.name}`,
		{ signal: AbortSignal.timeout(300000) },
	)
	assert.ok(response.ok, `Download failed: HTTP ${response.status}`)
	await pipeline(Readable.fromWeb(response.body), createWriteStream(archive))
	const hash = createHash('sha256')
	for await (const chunk of createReadStream(archive)) hash.update(chunk)
	assert.equal(hash.digest('hex'), asset.sha256, 'Compiler archive checksum mismatch')
	const unpacked = join(scratch, 'unpacked')
	mkdirSync(unpacked)
	const extraction = spawnSync('tar', ['-xf', archive, '-C', unpacked], { stdio: 'inherit' })
	assert.equal(extraction.status, 0, 'Compiler extraction failed; tar must be available')
	const executable = join(unpacked, process.platform === 'win32' ? 'perry.exe' : 'perry')
	const version = spawnSync(executable, ['--version'], { encoding: 'utf8' })
	assert.equal(version.status, 0, version.stderr)
	assert.equal(version.stdout.trim(), `perry ${pin.version}`)
	renameSync(unpacked, destination)
	console.log(`Installed verified Perry ${pin.version} under research/perry-cli/compiler`)
} finally {
	rmSync(scratch, { recursive: true, force: true })
}

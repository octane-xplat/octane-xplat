// Immutable runtime-only host snapshot; no shared checkout or compiler install.
import assert from 'node:assert/strict'
import {
	cpSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
	readdirSync,
	mkdtempSync,
	rmSync,
} from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { modelFixtureDir } from '../cli-nim/model-fixtures.mjs'

const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
const stage = mkdtempSync(join(work, 'snapshot-')),
	source = join(stage, 'source')
mkdirSync(source)
function copy(file) {
	const to = join(source, file)
	mkdirSync(dirname(to), { recursive: true })
	cpSync(join(root, file), to, { recursive: true })
}
try {
	for (const file of readdirSync(import.meta.dirname)) {
		if (/\.(go|mod|sum|mjs|json|md|txt)$/.test(file) || file === 'licenses') {
			copy('tools/cli-go/' + file)
		}
	}
	copy('packages/cli/go')
	const inputs = new Set()
	for (const target of ['linux-amd64', 'windows-amd64']) {
		const unit = `go-tests-${target}${target.startsWith('windows') ? '.exe' : ''}`
		const unitRecord = JSON.parse(readFileSync(join(work, unit + '.json')))
		assert.equal(sha(readFileSync(join(work, unit))), unitRecord.sha256)
		for (const [input, hash] of Object.entries(unitRecord.inputs)) {
			assert.equal(sha(readFileSync(join(root, input))), hash, 'Stale unit source: ' + input)
			inputs.add(input)
		}
		copy('research/go-cli/' + unit)
		copy('research/go-cli/' + unit + '.json')
		for (const onnx of [false, true]) {
			const file = `xplat-go-${target}${onnx ? '-onnx' : ''}${target.startsWith('windows') ? '.exe' : ''}`
			const record = JSON.parse(readFileSync(join(work, file + '.json')))
			assert.equal(sha(readFileSync(join(work, file))), record.sha256)
			for (const [input, hash] of Object.entries(record.inputs)) {
				assert.equal(sha(readFileSync(join(root, input))), hash, 'Stale snapshot source: ' + input)
				inputs.add(input)
			}
			for (const suffix of ['', '.json', '.tgz']) {
				copy('research/go-cli/' + file + suffix)
			}
		}
		const cli = `xplat-go-${target}-cli-onnx${target.startsWith('windows') ? '.exe' : ''}`
		const cliRecord = JSON.parse(readFileSync(join(work, cli + '.json')))
		assert.equal(sha(readFileSync(join(work, cli))), cliRecord.sha256)
		for (const [input, hash] of Object.entries(cliRecord.inputs)) {
			assert.equal(
				sha(readFileSync(join(root, input))),
				hash,
				'Stale public native source: ' + input,
			)
			inputs.add(input)
		}
		for (const suffix of ['', '.json', '.tgz']) {
			copy('research/go-cli/' + cli + suffix)
		}
		const pin = JSON.parse(readFileSync(join(import.meta.dirname, 'native-assets.json'))).targets[
			target
		]
		for (const name of [pin.library, 'LICENSE', 'ThirdPartyNotices.txt']) {
			copy('research/go-cli/runtime-assets/' + pin.directory + '/' + name)
		}
	}
	for (const file of ['project-packages', 'project-packages.json', 'model-cases.json']) {
		copy('research/go-cli/' + file)
	}
	cpSync(modelFixtureDir, join(source, 'research/go-cli/model-fixtures'), { recursive: true })
	writeFileSync(
		join(source, 'package.json'),
		JSON.stringify({
			name: 'xplat-go-portability-snapshot',
			private: true,
			type: 'module',
			packageManager: 'bun@1.4.4',
			workspaces: ['tools/cli-go'],
			devDependencies: {
				turbo: JSON.parse(readFileSync(join(root, 'package.json'))).devDependencies.turbo,
			},
		}),
	)
	for (const input of inputs) {
		copy(input)
	}
	// Runtime tasks belong at the disposable root; hashed source stays unchanged.
	const manifest = JSON.parse(readFileSync(join(source, 'package.json')))
	manifest.scripts = {
		'test:go-unit:portable': 'node tools/cli-go/unit-portable.mjs',
		'test:go:portable': 'node tools/cli-go/qualify.mjs',
		'test:go-model:portable': 'node tools/cli-go/model-portable.mjs',
		'test:go-doc-snapshot:portable': 'node --test tools/cli-go/doc-snapshot.test.mjs',
		'test:go-doc-index:portable': 'node --test tools/cli-go/docs-index-portable.mjs',
	}
	writeFileSync(join(source, 'package.json'), JSON.stringify(manifest))
	writeFileSync(
		join(source, 'turbo.json'),
		JSON.stringify({
			tasks: {
				'//#test:go-unit:portable': { cache: false },
				'//#test:go:portable': { cache: false },
				'//#test:go-model:portable': { cache: false },
				'//#test:go-doc-snapshot:portable': { cache: false },
				'//#test:go-doc-index:portable': { cache: false },
			},
		}),
	)
	const archive = join(work, 'portability-source.tgz')
	// AppleDouble/xattrs are host metadata, not hashed source. They must not
	// materialize as extra ._*.go files on Linux or Windows extraction.
	const packed = spawnSync('tar', ['--no-xattrs', '-czf', archive, '-C', stage, 'source'], {
		encoding: 'utf8',
		env: { ...process.env, COPYFILE_DISABLE: '1' },
	})
	assert.equal(packed.status, 0, packed.stderr)
	const bytes = readFileSync(archive),
		record = {
			archive,
			bytes: bytes.length,
			sha256: sha(bytes),
			scope:
				'Cross-compiled Go core/cgo binaries and identical hashed source plus pinned native model assets; qualification requires actual host execution.',
		}
	writeFileSync(join(work, 'snapshot.json'), JSON.stringify(record, null, 2) + '\n')
	console.log(JSON.stringify(record))
} finally {
	rmSync(stage, { recursive: true, force: true })
}

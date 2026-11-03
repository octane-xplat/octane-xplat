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
	for (const target of ['linux-amd64', 'windows-amd64']) {
		for (const onnx of [false, true]) {
			const file = `xplat-go-${target}${onnx ? '-onnx' : ''}${target.startsWith('windows') ? '.exe' : ''}`
			const record = JSON.parse(readFileSync(join(work, file + '.json')))
			assert.equal(sha(readFileSync(join(work, file))), record.sha256)
			for (const [input, hash] of Object.entries(record.inputs)) {
				assert.equal(
					sha(readFileSync(join(import.meta.dirname, input))),
					hash,
					'Stale snapshot source: ' + input,
				)
			}
			for (const suffix of ['', '.json', '.tgz']) {
				copy('research/go-cli/' + file + suffix)
			}
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
	// Runtime tasks belong at the disposable root; hashed source stays unchanged.
	const manifest = JSON.parse(readFileSync(join(source, 'package.json')))
	manifest.scripts = {
		'test:go:portable': 'node tools/cli-go/qualify.mjs',
		'test:go-model:portable': 'node tools/cli-go/model-portable.mjs',
	}
	writeFileSync(join(source, 'package.json'), JSON.stringify(manifest))
	writeFileSync(
		join(source, 'turbo.json'),
		JSON.stringify({
			tasks: {
				'//#test:go:portable': { cache: false },
				'//#test:go-model:portable': { cache: false },
			},
		}),
	)
	const archive = join(work, 'portability-source.tgz')
	const packed = spawnSync('tar', ['-czf', archive, '-C', stage, 'source'], { encoding: 'utf8' })
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

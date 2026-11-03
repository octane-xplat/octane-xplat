// Explicit native inference qualification against the existing pinned model.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, symlinkSync, rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { modelFixtureDir, prepareModelFixtures } from '../cli-nim/model-fixtures.mjs'
import { runtimeDir, runtimeTarget, prepareOrtFixtures } from '../cli-nim/ort-fixtures.mjs'
import { localEmbedder, MODEL } from '../../packages/docs-search/src/model.ts'
import { encodeText } from '../../packages/docs-search/src/inference.ts'

assert.equal(
	process.platform,
	'darwin',
	'This optional model fixture presently qualifies macOS arm64 only',
)
assert.equal(process.arch, 'arm64')
const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')
const binary = process.env.XPLAT_GO_ONNX_BINARY ?? join(work, 'xplat-go-darwin-arm64-onnx')
const build = JSON.parse(readFileSync(binary + '.json'))
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
assert.equal(build.onnx, true)
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
	assert.equal(sha(readFileSync(join(root, file))), hash, `Stale source: ${file}`)
}
await prepareModelFixtures({ tokenizerOnly: false })
// Reuse the pinned immutable runtime/model source; preparation affects ignored
// task assets only, never the retained Nim source or executable.
await prepareOrtFixtures()
const library = join(runtimeDir, runtimeTarget.library)
const temporary = mkdtempSync(join(work, 'model-check-'))
const evidence = {
	version: 1,
	host: `${process.platform}-${process.arch}`,
	build,
	passed: false,
	scope:
		'Native Go CPU inference with separate pinned ONNX/model assets; no Node inference in the executable.',
	comparisons: [],
	retrieval: [],
}
const require = createRequire(join(root, 'packages/docs-search/package.json'))
const packageRoot = dirname(dirname(require.resolve('@huggingface/tokenizers')))
const { Tokenizer } = await import(
	pathToFileURL(
		join(packageRoot, JSON.parse(readFileSync(join(packageRoot, 'package.json'))).module),
	)
)
const tokenizer = new Tokenizer(
	JSON.parse(readFileSync(join(modelFixtureDir, 'tokenizer.json'))),
	JSON.parse(readFileSync(join(modelFixtureDir, 'tokenizer_config.json'))),
)
function native(operation, texts, overrides = {}, { fail = false } = {}) {
	const request = join(temporary, 'request.json')
	writeFileSync(
		request,
		JSON.stringify({
			directory: modelFixtureDir,
			library,
			librarySha256: runtimeTarget.librarySha256,
			texts,
			...overrides,
		}),
	)
	const result = spawnSync(
		'/usr/bin/sandbox-exec',
		[
			'-p',
			'(version 1)(allow default)(deny network*)',
			binary,
			operation,
			'--request',
			request,
			'--timeout',
			'2m',
		],
		{ encoding: 'utf8', env: { ...process.env, PATH: '' }, maxBuffer: 32 << 20, timeout: 150000 },
	)
	assert.equal(result.status, fail ? 1 : 0, result.stderr + '\n' + result.stdout)
	assert.equal(result.stderr, '')
	return JSON.parse(result.stdout)
}
try {
	const texts = [
		'',
		'hello world',
		'Café 中文 🚀',
		'İ Σ ΟΣ ς Å',
		'[CLS]hello[MASK]world[SEP]',
		'navigation '.repeat(800),
	]
	const tokens = native('tokenize', texts)
	for (const [at, text] of texts.entries()) {
		assert.deepEqual(
			tokens[at],
			encodeText(tokenizer, text, 512).input_ids.map(Number),
			`Tokenizer: ${text.slice(0, 40)}`,
		)
	}
	const documents = [
		[
			'docs/app/navigation.md',
			'Confirm before leaving unsaved edits',
			'ask for confirmation before throwing away unfinished form changes',
		],
		[
			'docs/app/local-storage.md',
			'Confirm that the data survives reopening',
			'keep saved records after closing and reopening the database',
		],
		[
			'docs/platform/media-services.md',
			'Recording audio',
			'capture a voice memo from the microphone',
		],
		[
			'docs/testing/test-identifiers.md',
			'Give controls stable test names',
			'stable automation selectors after the interface is translated',
		],
	].map(([path, heading, query]) => {
		const source = readFileSync(join(root, path), 'utf8')
		const lines = source.split('\n'),
			start = lines.findIndex(
				(line) => /^#{1,6} /.test(line) && line.replace(/^#+ /, '').trim() === heading,
			)
		assert.ok(start >= 0, heading)
		let end = start + 1
		while (end < lines.length && !/^#{1,6} /.test(lines[end])) {
			end++
		}
		return { path, heading, query, text: lines.slice(start, end).join('\n'), line: start + 1 }
	})
	const all = [
		...texts,
		...documents.map((item) => item.text),
		...documents.map((item) => item.query),
	]
	const actual = native('embed', all)
	assert.match(actual.engine, /onnxruntime-1\.31\.1/)
	const cache = join(temporary, 'cache'),
		linked = join(cache, 'models', MODEL.name, MODEL.revision)
	mkdirSync(dirname(linked), { recursive: true })
	symlinkSync(modelFixtureDir, linked, 'dir')
	const reference = localEmbedder(cache)
	let expected
	try {
		expected = await reference.embed(all)
	} finally {
		await reference.dispose()
	}
	const dot = (a, b) => a.reduce((sum, value, at) => sum + value * b[at], 0)
	for (const [at, vector] of actual.vectors.entries()) {
		assert.equal(vector.length, 384)
		assert.ok(vector.every(Number.isFinite))
		assert.ok(Math.abs(Math.hypot(...vector) - 1) < 1e-10)
		const cosine = dot(vector, expected[at])
		evidence.comparisons.push({ text: all[at].slice(0, 80), cosine })
		assert.ok(cosine > 0.95)
	}
	for (const [at, document] of documents.entries()) {
		const vector = actual.vectors[texts.length + documents.length + at]
		const ranked = documents
			.map((candidate, index) => ({
				path: candidate.path,
				heading: candidate.heading,
				line: candidate.line,
				score: dot(vector, actual.vectors[texts.length + index]),
			}))
			.sort((a, b) => b.score - a.score)
		assert.equal(ranked[0].path, document.path, document.query)
		evidence.retrieval.push({ query: document.query, ranked })
	}
	const single = native('embed', [texts[1]])
	assert.deepEqual(
		single.vectors[0],
		actual.vectors[1],
		'Embedding must be independent of batch companions',
	)
	assert.match(
		native('embed', ['hello'], { librarySha256: '0'.repeat(64) }, { fail: true }).error,
		/checksum/,
	)
	const size = (path) => {
		const bytes = readFileSync(path)
		return {
			bytes: bytes.length,
			gzip6Bytes: gzipSync(bytes, { level: 6 }).length,
			sha256: sha(bytes),
		}
	}
	evidence.assets = {
		runtime: size(library),
		weights: size(join(modelFixtureDir, 'onnx/model_quantized.onnx')),
	}
	const samples = []
	for (let at = 0; at < 25; at++) {
		const start = performance.now()
		const result = spawnSync(binary, ['--help'], {
			encoding: 'utf8',
			env: { ...process.env, PATH: '' },
		})
		assert.equal(result.status, 0, result.stderr)
		if (at >= 5) {
			samples.push(performance.now() - start)
		}
	}
	samples.sort((a, b) => a - b)
	evidence.measurements = {
		executableBytes: build.bytes,
		gzip6Bytes: build.gzipBytes,
		downloadBytes: build.download.bytes,
		medianMs: (samples[9] + samples[10]) / 2,
		p95Ms: samples[18],
		samples,
		goals: { gzipBytes: 5000000, medianMs: 50 },
	}
	writeFileSync(
		join(work, 'model-cases.json'),
		JSON.stringify({
			texts: all,
			expectedTokens: all.map((text) => encodeText(tokenizer, text, 512).input_ids.map(Number)),
			expectedVectors: expected,
			documents,
			prefixCount: texts.length,
		}),
	)
	evidence.passed = true
} finally {
	writeFileSync(join(work, 'model-qualification.json'), JSON.stringify(evidence, null, 2) + '\n')
	rmSync(temporary, { recursive: true, force: true })
}
console.log(JSON.stringify(evidence, null, 2))

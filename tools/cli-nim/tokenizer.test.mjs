import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFileSync, readdirSync, mkdtempSync, copyFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { modelFixtureDir, modelFiles } from './model-fixtures.mjs'
import { MODEL } from '../../packages/docs-search/src/model.ts'
import { encodeText } from '../../packages/docs-search/src/inference.ts'

const root = resolve(import.meta.dirname, '../..')
const work = join(root, 'research/nim-cli')
const require = createRequire(join(root, 'packages/docs-search/package.json'))
const tokenizerPackage = dirname(dirname(require.resolve('@huggingface/tokenizers')))
const tokenizerManifest = JSON.parse(readFileSync(join(tokenizerPackage, 'package.json')))
assert.equal(tokenizerManifest.version, '0.2.0')
const { Tokenizer } = await import(pathToFileURL(join(tokenizerPackage, tokenizerManifest.module)))
const tokenizerData = JSON.parse(readFileSync(join(modelFixtureDir, 'tokenizer.json')))
const tokenizerConfig = JSON.parse(readFileSync(join(modelFixtureDir, 'tokenizer_config.json')))
const tokenizer = new Tokenizer(tokenizerData, tokenizerConfig)
const binary = join(work, `native/tokenizer-probe${process.platform === 'win32' ? '.exe' : ''}`)
const macOnly = { skip: process.platform !== 'darwin' }
const fixtures = []
after(() => { for (const path of fixtures) rmSync(path, { recursive: true, force: true }) })
function native(requests) {
 const run = spawnSync(binary, [], { input: requests.map(request => JSON.stringify({ directory: modelFixtureDir, ...request })).join('\n') + '\n',
  encoding: 'utf8', maxBuffer: 96 * 1024 * 1024, timeout: 60000, env: { ...process.env, PATH: '' } })
 assert.equal(run.status, 0, run.stderr || run.error?.message)
 assert.equal(run.stderr, '')
 const replies = run.stdout.trim().split('\n').map(line => JSON.parse(line))
 assert.equal(replies.length, requests.length)
 return replies
}
function expected(request) {
 switch (request.operation) {
 case 'nfd': case 'nfd-lifetime': return request.text.normalize('NFD')
 case 'normalize': return tokenizer.normalizer(request.text)
 case 'pre-tokens': return tokenizer.pre_tokenizer.pre_tokenize_text(request.text)
 case 'encode': case 'lifetime': return encodeText(tokenizer, request.text, request.maxTokens ?? MODEL.maxTokens)
 default: throw Error(request.operation)
 }
}
function compare(requests, label) {
 const replies = native(requests)
 for (const [at, request] of requests.entries()) {
  const context = `${label} case ${at}: ${JSON.stringify(request).slice(0, 140)}`
  assert.equal(replies[at].ok, true, `${context}: ${replies[at].message}`)
  assert.deepEqual(replies[at].value, expected(request), context)
 }
 console.log(`${requests.length} tokenizer differential cases checked (${label})`)
 return replies.map(reply => reply.value)
}

test('NFD preserves UTF-16 units, embedded NUL, expansion and explicit library lifetimes', macOnly, () => {
 const values = ['', 'é Å Å Ǻ ﬃ', '한글', 'A\u0315\u0300\u05ae\u0301', '丽𐐀😀', '\ud800x\udc00', '\ud800\udc00', '\0é\0', 'é'.repeat(10000)]
 compare(values.flatMap(text => ['nfd', 'nfd-lifetime'].map(operation => ({ operation, text }))), 'NFD')
 const [version] = native([{ operation: 'version' }])
 assert.match(version.value, /^\d+\.\d+\.\d+\.\d+$/)
 console.log(`Native normalization ICU ${version.value}; Node ICU ${process.versions.icu}, Unicode ${process.versions.unicode}`)
})

test('NFD and BERT normalization agree over every Unicode scalar and isolated surrogate units', macOnly, () => {
 const requests = []
 let block = ''
 for (let code = 0; code <= 0x10ffff; code++) {
  if (code >= 0xd800 && code <= 0xdfff) continue
  block += String.fromCodePoint(code)
  if (code % 512 === 511) { for (const operation of ['nfd', 'normalize']) requests.push({ operation, text: block }); block = '' }
 }
 if (block) for (const operation of ['nfd', 'normalize']) requests.push({ operation, text: block })
 for (const text of ['\ud800a', 'a\udfff', '\ud800\ud800', '\udc00\udc00', '\ud800\0\udc00', '\u0345Σ\u0345', 'AΣ\u0301', '\u0130\u212b\ufb01'])
  for (const operation of ['nfd', 'normalize']) requests.push({ operation, text })
 compare(requests, 'all scalar normalization')
})

test('BERT pre-tokenization uses JS whitespace and Unicode plus ASCII punctuation', macOnly, () => {
 const cases = ['hello world', 'a\0b', 'a+b=c$d|e~f^g_h`i', '\u0085a\u001cb', 'a。b、c—d', '😀view中文𠀀word', '\ud800abc\udc00']
 for (const code of [9, 10, 11, 12, 13, 32, 0x85, 0xa0, 0x1680, 0x180e, 0x2000, 0x200b, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000, 0xfeff]) cases.push(`alpha${String.fromCodePoint(code)}beta`)
 compare(cases.map(text => ({ operation: 'pre-tokens', text })), 'pre-tokenization')
})

test('actual MiniLM IDs preserve added-token boundaries, normalization and whole-word fallback', macOnly, () => {
 const cases = ['', 'hello world', 'CAFÉ Straße naïve Å İ Σ AΣ', 'Hello, 世界! 中文𝄞𠀀文字', 'view𠀀word', 'a\0b\ufffdc\ue000d\u200de',
  '[CLS]hello[SEP]', 'pre[MASK]post', '[PAD][UNK][CLS][SEP][MASK]', '[cls]hello[sep]', '[CLs][SEp]', '[CLS][CLS]', '[PAD]',
  '[CLS]\ud800[MASK]\udc00[SEP]', 'word【中文】ascii+$=x', 'a'.repeat(100), 'a'.repeat(101), 'aa😀', 'é'.repeat(100), 'é'.repeat(101),
  'a\u0301'.repeat(100), 'a\u0301'.repeat(101), '[not-a-special-token]', '\ud800abc\udc00', 'hello\t\n\rworld']
 const result = compare(cases.map(text => ({ operation: 'encode', text })), 'actual vocabulary')
 assert.deepEqual(result[1].input_ids, [101, 7592, 2088, 102])
 assert.deepEqual(result[12].attention_mask, [1, 1, 1]) // literal PAD is attended
 assert.equal(result[19].input_ids[1], 100)
 assert.ok(result[18].input_ids.length > 3)
})

test('single-sequence encoding ignores file padding and keeps final SEP when truncating', macOnly, () => {
 assert.equal(tokenizerData.truncation.max_length, 128)
 const requests = []
 for (const words of [0, 1, 126, 127, 128, 129, 509, 510, 511, 512, 513, 800])
  for (const maxTokens of [2, 7, 128, 512]) requests.push({ operation: 'encode', text: 'hello '.repeat(words), maxTokens })
 const values = compare(requests, 'truncation')
 const large = values[requests.findIndex(r => r.text === 'hello '.repeat(800) && r.maxTokens === 512)]
 assert.equal(large.input_ids.length, 512)
 assert.equal(large.input_ids.at(-1), 102)
 assert.equal(values[0].input_ids.length, 2)
})

test('real Markdown and deterministic mixed vocabulary sequences encode exactly', macOnly, () => {
 const requests = []
 const paths = readdirSync(join(root, 'docs'), { recursive: true }).filter(path => path.endsWith('.md')).sort().slice(0, 32)
 assert.equal(paths.length, 32)
 for (const path of paths) requests.push({ operation: 'encode', text: readFileSync(join(root, 'docs', path), 'utf8') })
 const vocabulary = Object.keys(tokenizerData.model.vocab)
 let seed = 0x6d696e69
 const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed >>> 0 }
 const separators = [' ', '\0', '[MASK]', '\n', '中文', '𠀀', 'é\u0301', ' + ', '\ud800', '😀']
 for (let run = 0; run < 180; run++) {
  let text = ''
  for (let at = 0; at < 30; at++) text += vocabulary[random() % vocabulary.length] + separators[random() % separators.length]
  requests.push({ operation: 'encode', text })
 }
 assert.equal(requests.length, 212)
 compare(requests, 'Markdown and vocabulary')
})

test('pinned assets reject altered bytes and tokenizers can be disposed and reopened', macOnly, () => {
 mkdirSync(join(work, 'tokenizer-fixtures'), { recursive: true })
 const dir = mkdtempSync(join(work, 'tokenizer-fixtures/invalid-')); fixtures.push(dir)
 for (const file of ['tokenizer.json', 'tokenizer_config.json']) copyFileSync(join(modelFixtureDir, file), join(dir, file))
 writeFileSync(join(dir, 'tokenizer_config.json'), '{}')
 const [invalid, reopened, lifetime] = native([{ operation: 'encode', text: 'hello', directory: dir },
  { operation: 'encode', text: 'hello' }, { operation: 'lifetime', text: 'hello' }])
 assert.equal(invalid.ok, false)
 assert.equal(invalid.message, 'Pinned tokenizer file checksum mismatch')
 assert.equal(reopened.ok, true)
 assert.deepEqual(reopened.value, encodeText(tokenizer, 'hello', 512))
 assert.deepEqual(lifetime.value, reopened.value)
 const source = readFileSync(join(root, 'packages/cli/nim/minilm_tokenizer.nim'), 'utf8')
 assert.ok(source.includes(modelFiles['tokenizer.json']))
 assert.ok(source.includes(modelFiles['tokenizer_config.json']))
})

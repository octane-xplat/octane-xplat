// Explicit test-data preparation, never part of the native executable.
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, readFileSync, mkdirSync, writeFileSync, renameSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { MODEL } from '../../packages/docs-search/src/model.ts'

export const modelFiles = {
 'config.json': '7135149f7cffa1a573466c6e4d8423ed73b62fd2332c575bf738a0d033f70df7',
 'tokenizer.json': 'da0e79933b9ed51798a3ae27893d3c5fa4a201126cef75586296df9b4d2c62a0',
 'tokenizer_config.json': '9261e7d79b44c8195c1cada2b453e55b00aeb81e907a6664974b4d7776172ab3',
 'onnx/model_quantized.onnx': 'afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1',
}
export const modelFixtureDir = resolve(import.meta.dirname, '../../research/nim-cli/model-fixtures', MODEL.name, MODEL.revision)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')

export async function prepareModelFixtures({ tokenizerOnly = true } = {}) {
 for (const [file, digest] of Object.entries(modelFiles)) {
  if (tokenizerOnly && file.endsWith('.onnx')) continue
  const path = resolve(modelFixtureDir, file)
  if (existsSync(path) && sha(readFileSync(path)) === digest) continue
  const response = await fetch(`https://huggingface.co/${MODEL.name}/resolve/${MODEL.revision}/${file}`, { signal: AbortSignal.timeout(120_000) })
  if (!response.ok) throw Error(`Fixture download failed (${response.status}): ${file}`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (sha(bytes) !== digest) throw Error(`Fixture checksum mismatch: ${file}`)
  mkdirSync(dirname(path), { recursive: true })
  const staging = `${path}.${randomUUID()}.tmp`
  try { writeFileSync(staging, bytes); renameSync(staging, path) }
  finally { rmSync(staging, { force: true }) }
  console.log(`Prepared pinned model fixture: ${file} (${bytes.length} bytes)`)
 }
 return modelFixtureDir
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
 if (process.argv.length !== 3 || !['--tokenizer-only', '--with-weights'].includes(process.argv[2])) throw Error('Use --tokenizer-only or --with-weights')
 await prepareModelFixtures({ tokenizerOnly: process.argv[2] === '--tokenizer-only' })
}

import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { encodeText, poolEmbedding } from './inference.ts'

/** Model identity participates in all embedding/cache keys. */
export const MODEL = {
	name: 'Xenova/all-MiniLM-L6-v2',
	revision: '751bff37182d3f1213fa05d7196b954e230abad9',
	dtype: 'q8',
	dimensions: 384,
	maxTokens: 512,
} as const

/** Embedding boundary; tests can supply deterministic vectors without model downloads. */
export interface Embedder {
	id: string
	prepare?(): Promise<void>
	embed(texts: string[]): Promise<number[][]>
	dispose?(): Promise<void>
}

/** Cache identity covering model files, inference settings and engine version. */
export const modelId = `${MODEL.name}@${MODEL.revision}:${MODEL.dtype}:mean:normalized:wasm-1.31.1:tokenizers-0.2.0:single-sequence-512:v1`

// Immutable model files from the pinned Hugging Face revision, including q8 weights.
const FILES = {
	'config.json': '7135149f7cffa1a573466c6e4d8423ed73b62fd2332c575bf738a0d033f70df7',
	'tokenizer.json': 'da0e79933b9ed51798a3ae27893d3c5fa4a201126cef75586296df9b4d2c62a0',
	'tokenizer_config.json': '9261e7d79b44c8195c1cada2b453e55b00aeb81e907a6664974b4d7776172ab3',
	'onnx/model_quantized.onnx': 'afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1',
}

const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')

async function modelDirectory(cacheDir: string, download: boolean) {
	const dir = resolve(cacheDir, 'models', MODEL.name, MODEL.revision)
	for (const [file, sha] of Object.entries(FILES)) {
		const path = join(dir, file)
		if (existsSync(path) && digest(readFileSync(path)) === sha) {
			continue
		}

		if (!download) {
			throw new Error('Pinned model file is absent or invalid; run docs index')
		}

		const response = await fetch(
			`https://huggingface.co/${MODEL.name}/resolve/${MODEL.revision}/${file}`,
			{ signal: AbortSignal.timeout(120_000) },
		)

		if (!response.ok) {
			throw new Error(`Model download failed (${response.status})`)
		}

		const bytes = new Uint8Array(await response.arrayBuffer())
		if (digest(bytes) !== sha) {
			throw new Error('Model file checksum mismatch')
		}

		mkdirSync(dirname(path), { recursive: true })
		const tmp = `${path}.${randomUUID()}.tmp`
		try {
			writeFileSync(tmp, bytes)
			renameSync(tmp, path)
		} finally {
			rmSync(tmp, { force: true })
		}
	}
	return dir
}

/** Load CPU inference lazily; only explicit preparation permits model downloads. */
export function localEmbedder(cacheDir: string, download = false): Embedder {
	let loading: ReturnType<typeof load> | undefined
	async function load() {
		const dir = await modelDirectory(cacheDir, download)
		const [{ Tokenizer }, ort] = await Promise.all([
			import('@huggingface/tokenizers'),
			import('onnxruntime-web/wasm'),
		])
		const tokenizer = new Tokenizer(
			JSON.parse(readFileSync(join(dir, 'tokenizer.json'), 'utf8')),
			JSON.parse(readFileSync(join(dir, 'tokenizer_config.json'), 'utf8')),
		)
		// Node's WASM execution provider supports a single thread. Runtime assets
		// resolve from the installed package; inference never needs a CDN.
		ort.env.wasm.numThreads = 1
		const session = await ort.InferenceSession.create(
			new Uint8Array(readFileSync(join(dir, 'onnx/model_quantized.onnx'))),
			{ executionProviders: ['wasm'] },
		)
		return { tokenizer, ort, session }
	}
	return {
		id: modelId,
		async prepare() {
			await modelDirectory(cacheDir, download)
		},
		async embed(texts) {
			if (!texts.length) {
				return []
			}
			loading ??= load()
			const { tokenizer, ort, session } = await loading
			const vectors: number[][] = []
			// One sequence per run avoids padding and batch-dependent q8 outputs.
			for (const text of texts) {
				const encoded = encodeText(tokenizer, text, MODEL.maxTokens)
				const inputs = Object.fromEntries(
					Object.entries(encoded).map(([name, values]) => [
						name,
						new ort.Tensor('int64', BigInt64Array.from(values.map(BigInt)), [1, values.length]),
					]),
				)

				const outputs = await session.run(inputs)
				const output = outputs.last_hidden_state
				if (
					!output ||
					output.type !== 'float32' ||
					output.dims.length !== 3 ||
					output.dims[0] !== 1 ||
					output.dims[1] !== encoded.input_ids.length ||
					output.dims[2] !== MODEL.dimensions
				) {
					throw new Error('Unexpected MiniLM embedding output')
				}

				vectors.push(
					poolEmbedding(output.data as Float32Array, encoded.attention_mask, MODEL.dimensions),
				)
			}
			return vectors
		},
		async dispose() {
			const current = loading
			loading = undefined
			const loaded = await current?.catch(() => undefined)
			await loaded?.session.release()
		},
	}
}

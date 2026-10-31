import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

/** Model identity participates in all embedding/cache keys. */
export const MODEL = {
	name: 'Xenova/all-MiniLM-L6-v2',
	revision: '751bff37182d3f1213fa05d7196b954e230abad9',
	dtype: 'q8',
	dimensions: 384,
} as const

/** Embedding boundary; tests can supply deterministic vectors without model downloads. */
export interface Embedder {
	id: string
	prepare?(): Promise<void>
	embed(texts: string[]): Promise<number[][]>
	dispose?(): Promise<void>
}

/** Cache identity covering model files, inference settings and engine version. */
export const modelId = `${MODEL.name}@${MODEL.revision}:${MODEL.dtype}:mean:normalized:transformers-4.3.2:v1`

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
	let extractor: Awaited<ReturnType<typeof load>> | undefined
	async function load() {
		// 4.3.2 metadata discovery drops local-only/revision options. An absolute
		// model directory prevents remote discovery without changing global env.
		const dir = await modelDirectory(cacheDir, download)
		const { pipeline } = await import('@huggingface/transformers')
		return pipeline('feature-extraction', dir, {
			revision: MODEL.revision,
			dtype: MODEL.dtype,
			device: 'cpu' as const,
			cache_dir: join(cacheDir, 'models'),
			local_files_only: true,
			session_options: { intraOpNumThreads: 1, interOpNumThreads: 1 },
		})
	}
	return {
		id: modelId,
		async prepare() {
			await modelDirectory(cacheDir, download)
		},
		async embed(texts) {
			extractor ??= await load()
			const output = await extractor(texts, { pooling: 'mean', normalize: true })
			return output.tolist() as number[][]
		},
		async dispose() {
			await extractor?.dispose()
			extractor = undefined
		},
	}
}

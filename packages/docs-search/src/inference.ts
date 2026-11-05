import type { Tokenizer } from '@huggingface/tokenizers'

/** Encode one BERT sequence, retaining its final separator when truncating. */
export function encodeText(tokenizer: Tokenizer, text: string, maxTokens: number) {
	const encoded = tokenizer.encode(text, { return_token_type_ids: true })
	const truncate = (values: number[]) =>
		values.length > maxTokens
			? [...values.slice(0, maxTokens - 1), values[values.length - 1]]
			: values
	return {
		input_ids: truncate(encoded.ids),
		attention_mask: truncate(encoded.attention_mask),
		token_type_ids: truncate(encoded.token_type_ids),
	}
}

/** Attention-mask-weighted mean pooling followed by L2 normalization. */
export function poolEmbedding(values: Float32Array, mask: readonly number[], dimensions: number) {
	if (values.length !== mask.length * dimensions) {
		throw new Error('Embedding shape mismatch')
	}
	const pooled = Array<number>(dimensions).fill(0)
	let count = 0
	for (let token = 0; token < mask.length; token++) {
		if (!mask[token]) {
			continue
		}

		count++
		for (let dim = 0; dim < dimensions; dim++) {
			pooled[dim] += values[token * dimensions + dim]
		}
	}
	if (!count) {
		throw new Error('Embedding has no attended tokens')
	}
	for (let dim = 0; dim < dimensions; dim++) {
		pooled[dim] /= count
	}
	const norm = Math.hypot(...pooled)
	if (!Number.isFinite(norm) || !norm) {
		throw new Error('Invalid embedding output')
	}
	return pooled.map((value) => value / norm)
}

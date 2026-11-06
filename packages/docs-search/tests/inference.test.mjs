import assert from 'node:assert/strict'
import { test } from 'node:test'
import { encodeText, poolEmbedding } from '../src/inference.ts'

test('truncation keeps BERT boundary tokens and aligned masks and types', () => {
  const tokenizer = {
    encode() {
      return {
        ids: [101, 11, 12, 13, 102],
        attention_mask: [1, 1, 1, 1, 1],
        token_type_ids: [0, 0, 0, 0, 0],
      }
    },
  }
  assert.deepEqual(encodeText(tokenizer, 'long input', 4), {
    input_ids: [101, 11, 12, 102],
    attention_mask: [1, 1, 1, 1],
    token_type_ids: [0, 0, 0, 0],
  })
})

test('pooling ignores masked padding and returns a normalized vector', () => {
  const vector = poolEmbedding(new Float32Array([2, 0, 0, 2, 100, 100]), [1, 1, 0], 2)
  assert.ok(Math.abs(vector[0] - Math.SQRT1_2) < 1e-10)
  assert.ok(Math.abs(Math.hypot(...vector) - 1) < 1e-10)
  assert.throws(() => poolEmbedding(new Float32Array([1]), [1], 2), /shape/)
  assert.throws(() => poolEmbedding(new Float32Array([1, 1]), [0], 2), /attended/)
  assert.throws(() => poolEmbedding(new Float32Array([0, 0]), [1], 2), /Invalid/)
  assert.throws(() => poolEmbedding(new Float32Array([NaN, 1]), [1], 2), /Invalid/)
})

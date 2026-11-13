import { createHash } from 'node:crypto'
import { projectPreparedTree } from '../src/index.ts'

export const build = 'ab'.repeat(32)
export const expected = { build, platform: 'android' }
export function commands(texts = ['Hello, 世界'], base = 100) {
  return [
    {
      op: 'create',
      id: base,
      type: 'masonview',
      props: { className: 'screen', style: { flexDirection: 'column' } },
    },
    { op: 'create', id: base + 1, type: 'label', props: { maxLines: 0 } },
    ...texts.map((value, index) => ({
      op: 'create',
      id: base + 2 + index,
      type: '#text',
      props: { value },
    })),
    ...texts.map((_, index) => ({
      op: 'insert',
      id: base + 2 + index,
      parent: base + 1,
      before: null,
    })),
    { op: 'insert', id: base + 1, parent: base, before: null },
    { op: 'insert', id: base, parent: null, before: null },
    {
      op: 'event',
      id: base,
      name: 'tap',
      handler() {
        throw new Error('must not run')
      },
    },
  ]
}
export function fixture(texts) {
  const nodes = projectPreparedTree(commands(texts)).nodes
  return {
    version: 1,
    platform: 'android',
    hostContract: 'mason-label-v1',
    build,
    seed: { title: 'Hello', count: 1234.5, data: [null, true, false] },
    constraints: [
      { input: 'fontScale', equals: 1 },
      { input: 'width', min: 320, max: 800 },
    ],
    nodes,
    variants: Object.fromEntries(
      ['light', 'dark'].map((theme) => [
        theme,
        nodes
          .filter((node) => node.kind !== '#text')
          .map((node) => ({
            node: node.index,
            style: { color: theme === 'light' ? '#123456' : '#abcdef', fontSize: 15 },
            cssKeys: ['fontSize'],
            inheritedKeys: ['color'],
          })),
      ]),
    ),
  }
}
export function resign(data) {
  const result = Buffer.from(data)
  result.writeUInt32LE(result.length, 8)
  createHash('sha256').update(result.subarray(80)).digest().copy(result, 48)
  return result
}

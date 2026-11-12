import assert from 'node:assert/strict'
import { test } from 'node:test'
import { matchPreparedVisualTree } from './match-tree.mjs'

function fixture() {
  const commands = [
    {
      op: 'create',
      id: 10,
      type: 'masonview',
      props: { style: { display: 'flex' }, className: 'home' },
    },
    { op: 'create', id: 20, type: 'label', props: { className: 'greeting', maxLines: 0 } },
    { op: 'create', id: 30, type: '#text', props: { value: 'Hello ' } },
    { op: 'create', id: 40, type: '#text', props: { value: 'Alex' } },
    { op: 'insert', id: 10, parent: null, before: null },
    { op: 'insert', id: 20, parent: 10, before: null },
    { op: 'insert', id: 30, parent: 20, before: null },
    { op: 'insert', id: 40, parent: 20, before: null },
  ]
  const nodes = [
    {
      index: 0,
      kind: 'masonview',
      path: '0',
      parent: null,
      props: { className: 'home', style: { display: 'flex' } },
      children: [1],
      text: '',
    },
    {
      index: 1,
      kind: 'label',
      path: '0/0',
      parent: 0,
      props: { maxLines: 0, className: 'greeting' },
      children: [],
      text: 'Hello Alex',
    },
  ]
  return { commands, nodes }
}

test('matches artifact-local indices without mutating either tree', () => {
  const { commands, nodes } = fixture()
  const previous = structuredClone({ commands, nodes })
  assert.deepEqual(
    [...matchPreparedVisualTree(commands, nodes, 4)],
    [
      [10, 0],
      [20, 1],
    ],
  )
  assert.deepEqual({ commands, nodes }, previous)
  for (const command of commands) {
    command.id += 100
    if (typeof command.parent === 'number') command.parent += 100
  }
  assert.deepEqual(
    [...matchPreparedVisualTree(commands, nodes, 4)],
    [
      [110, 0],
      [120, 1],
    ],
  )
})

for (const [name, change, reason] of [
  [
    'changed inline style',
    ({ commands }) => {
      commands[0].props.style.display = 'grid'
    },
    /initial props differ/,
  ],
  [
    'extra live prop',
    ({ commands }) => {
      commands[1].props.isEnabled = false
    },
    /initial props differ/,
  ],
  [
    'changed text',
    ({ commands }) => {
      commands[3].props.value = 'Blair'
    },
    /initial text differs/,
  ],
  [
    'changed authored identity',
    ({ commands }) => {
      commands[1].props.id = 'different'
    },
    /initial props differ/,
  ],
  [
    'wrong kind',
    ({ commands }) => {
      commands[1].type = 'masonview'
    },
    /visual topology differs/,
  ],
  [
    'unknown host family',
    ({ commands }) => {
      commands[1].type = 'textfield'
    },
    /unsupported initial host/,
  ],
  [
    'wrong artifact parent',
    ({ nodes }) => {
      nodes[1].parent = null
    },
    /visual topology differs/,
  ],
  [
    'wrong artifact index',
    ({ nodes }) => {
      nodes[1].index = 7
    },
    /visual topology differs/,
  ],
  [
    'wrong artifact path',
    ({ nodes }) => {
      nodes[1].path = '0/1'
    },
    /visual topology differs/,
  ],
  [
    'wrong visual child index',
    ({ nodes }) => {
      nodes[0].children = [0]
    },
    /visual child index differs/,
  ],
  [
    'duplicate creation',
    ({ commands }) => {
      commands.push(commands[0])
    },
    /duplicate command identity/,
  ],
  [
    'duplicate parent',
    ({ commands }) => {
      commands.push(commands[7])
    },
    /duplicate logical parent/,
  ],
  [
    'invalid anchor',
    ({ commands }) => {
      commands[7].before = 999
    },
    /unknown insertion anchor/,
  ],
  [
    'uncreated insertion target',
    ({ commands }) => {
      commands.unshift(commands.pop())
    },
    /unknown insertion reference/,
  ],
  [
    'unsupported initial mutation',
    ({ commands }) => {
      commands.push({ op: 'update', id: 20, props: {} })
    },
    /unsupported initial command/,
  ],
  [
    'nonfinite style',
    ({ commands }) => {
      commands[0].props.style.width = NaN
    },
    /non-finite property/,
  ],
  [
    'nonportable callback prop',
    ({ commands }) => {
      commands[1].props.callback = () => {}
    },
    /nonportable property/,
  ],
]) {
  test('rejects ' + name + ' before returning claims', () => {
    const input = fixture()
    change(input)
    assert.throws(() => matchPreparedVisualTree(input.commands, input.nodes, 4), reason)
  })
}

test('does not execute prop accessors', () => {
  const { commands, nodes } = fixture()
  let reads = 0
  Object.defineProperty(commands[1].props, 'text', {
    enumerable: true,
    get() {
      reads++
      return 'unexpected'
    },
  })
  assert.throws(() => matchPreparedVisualTree(commands, nodes, 4), /property accessor/)
  assert.equal(reads, 0)
})

test('rejects an unreachable cycle and an uninserted host', () => {
  const { commands, nodes } = fixture()
  commands.push(
    { op: 'create', id: 50, type: 'masonview', props: {} },
    { op: 'create', id: 60, type: 'masonview', props: {} },
    { op: 'insert', id: 50, parent: 60, before: null },
    { op: 'insert', id: 60, parent: 50, before: null },
  )
  assert.throws(() => matchPreparedVisualTree(commands, nodes, 6), /unreachable or unmatched/)
  commands.splice(-3)
  assert.throws(() => matchPreparedVisualTree(commands, nodes, 5), /unreachable or unmatched/)
})

test('checks event host ownership without persisting runtime listener identities', () => {
  const { commands, nodes } = fixture()
  commands.push({ op: 'event', id: 20, type: 'tap', listener: { id: 123, priority: 'discrete' } })
  assert.equal(matchPreparedVisualTree(commands, nodes, 4).size, 2)
  commands.at(-1).id = 30
  assert.throws(() => matchPreparedVisualTree(commands, nodes, 4), /unknown event host/)
})

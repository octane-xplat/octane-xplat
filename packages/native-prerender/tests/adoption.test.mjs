import assert from 'node:assert/strict'
import test from 'node:test'
import { createNativeClaims, projectPreparedTree } from '../src/index.ts'
import { commands } from './fixture.mjs'

function fixture(texts = ['a', 'bc']) {
  const batch = commands(texts)
  const views = [{ name: 'container' }, { name: 'label' }]
  return { batch, views, claims: createNativeClaims(projectPreparedTree(batch).nodes, views) }
}

test('full logical match gates exact one-time wrappers while later creation stays ordinary', () => {
  const { batch, views, claims } = fixture()
  assert.throws(() => claims.createView(100, 'masonview'), /outside commit/)
  claims.match(batch)
  assert.equal(claims.phase, 'ready')
  assert.equal(claims.pendingCount, 2)
  claims.commit(() => {
    assert.equal(claims.createView(100, 'masonview'), views[0])
    assert.equal(claims.createView(101, 'label'), views[1])
    // Later callback work must use ordinary constructors, including while
    // the outer commit still finishes its lifecycle/layout callbacks.
    assert.equal(claims.createView(900, 'label'), undefined)
  })
  assert.equal(claims.phase, 'live')
  assert.equal(claims.claimedCount, 2)
  assert.equal(claims.pendingCount, 0)
  assert.equal(claims.createView(901, 'label'), undefined)
  claims.retire()
  assert.equal(claims.createView(100, 'masonview'), undefined)
})

test('text-slot mismatch rejects before commit even when folded native text matches', () => {
  const { claims } = fixture()
  assert.throws(() => claims.match(commands(['ab', 'c'])), /logical tree differs/)
  assert.equal(claims.phase, 'rejected')
  let applied = false
  assert.throws(() => claims.commit(() => { applied = true }), /not ready/)
  assert.equal(applied, false)
  assert.equal(claims.claimedCount, 0)
  assert.equal(claims.pendingCount, 0)
  assert.throws(() => claims.createView(100, 'masonview'), /outside commit/)
})

test('partial mutation failure preserves the original thrown value and forbids retries', () => {
  for (const failure of [new Error('native insertion failed'), undefined]) {
    const { claims, batch, views } = fixture()
    claims.match(batch)
    let caught = false
    try {
      claims.commit(() => {
        assert.equal(claims.createView(100, 'masonview'), views[0])
        throw failure
      })
    } catch (error) {
      caught = true
      assert.equal(error, failure)
    }
    assert.equal(caught, true)
    assert.equal(claims.phase, 'failed')
    assert.equal(claims.claimedCount, 1)
    assert.throws(() => claims.match(batch), /already matched/)
    assert.throws(() => claims.commit(() => {}), /not ready/)
    assert.throws(() => claims.createView(101, 'label'), /outside commit/)
    claims.retire()
    assert.equal(claims.pendingCount, 0)
    assert.equal(claims.createView(101, 'label'), undefined)
  }
})

test('wrong, repeated, missing and premature ordinary claims fail the initial scope', () => {
  for (const apply of [
    (claims) => claims.createView(100, 'label'),
    (claims) => claims.createView(999, 'label'),
    (claims) => { claims.createView(100, 'masonview'); claims.createView(100, 'masonview') },
    (claims) => { claims.createView(100, 'masonview') },
    (claims) => { claims.createView(100, 'masonview'); claims.createView(101, 'label'); claims.createView(101, 'label') },
    (claims) => { claims.createView(100, 'masonview'); claims.retire() },
  ]) {
    const { batch, claims } = fixture()
    claims.match(batch)
    assert.throws(() => claims.commit(() => { apply(claims) }))
    assert.equal(claims.phase, 'failed')
  }
})

test('wrapper ownership is unique and a Label-only root needs no container claim', () => {
  const { batch, views } = fixture()
  const nodes = projectPreparedTree(batch).nodes
  assert.throws(() => createNativeClaims(nodes, [views[0], views[0]]), /distinct wrapper/)
  assert.throws(() => createNativeClaims(nodes, []), /distinct wrapper/)
  const label = {}
  const single = [{ op: 'create', id: 5, type: 'label', props: { text: 'Ready' } }, { op: 'insert', id: 5, parent: null, before: null }]
  const claims = createNativeClaims(projectPreparedTree(single).nodes, [label])
  claims.match(single)
  claims.commit(() => { assert.equal(claims.createView(5, 'label'), label) })
  assert.equal(claims.claimedCount, 1)
})

test('placeholder indexes take a null slot, count as replaced and still gate the live kind', () => {
  for (const [kind, props] of [
    ['activityindicator', { busy: true }],
    ['svgview', { src: '<svg xmlns="http://www.w3.org/2000/svg"/>', stretch: 'aspectFit' }],
  ]) {
    const batch = [
      { op: 'create', id: 100, type: 'masonview', props: {} },
      { op: 'create', id: 101, type: kind, props },
      { op: 'create', id: 102, type: 'label', props: { text: 'Title' } },
      { op: 'insert', id: 101, parent: 100, before: null },
      { op: 'insert', id: 102, parent: 100, before: null },
      { op: 'insert', id: 100, parent: null, before: null },
    ]
    const nodes = projectPreparedTree(batch).nodes
    const container = {}, label = {}

    // Slot shape: null exactly at the placeholder index, distinct wrappers elsewhere.
    assert.throws(
      () => createNativeClaims(nodes, [container, {}, label]),
      /distinct wrapper per non-placeholder/,
    )
    assert.throws(
      () => createNativeClaims(nodes, [container, null, null]),
      /distinct wrapper per non-placeholder/,
    )

    const claims = createNativeClaims(nodes, [container, null, label])
    claims.match(batch)
    claims.commit(() => {
      assert.equal(claims.createView(100, 'masonview'), container)
      assert.equal(claims.createView(101, kind), undefined)
      assert.equal(claims.createView(102, 'label'), label)
    })
    assert.equal(claims.phase, 'live')
    assert.equal(claims.claimedCount, 2)
    assert.equal(claims.replacedCount, 1)
    assert.equal(claims.factoryCalls, 3)

    // The live host kind must still match the placeholder's logical kind.
    const wrong = createNativeClaims(nodes, [container, null, label])
    wrong.match(batch)
    assert.throws(
      () =>
        wrong.commit(() => {
          wrong.createView(100, 'masonview')
          wrong.createView(101, 'masonview')
          wrong.createView(102, 'label')
        }),
      /native claim kind differs/,
    )
    assert.equal(wrong.phase, 'failed')

    // Commit still requires every record consumed, placeholders included.
    const incomplete = createNativeClaims(nodes, [container, null, label])
    incomplete.match(batch)
    assert.throws(
      () =>
        incomplete.commit(() => {
          incomplete.createView(100, 'masonview')
          incomplete.createView(102, 'label')
        }),
      /not fully consumed/,
    )
  }
})

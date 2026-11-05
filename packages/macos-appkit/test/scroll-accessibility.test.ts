import { rendererSource } from './renderer-source.ts'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runSlice } from './mock-globals.ts'

test('real scroll prop branch applies and clears native descriptions/visibility without changing content, role or geometry', () => {
  const source = rendererSource(),
    axStart = source.indexOf('function applyAccessibility('),
    axEnd = source.indexOf('/** Host updates carry', axStart)
  assert.ok(axStart >= 0 && axEnd > axStart)
  const update = runSlice(
    source.slice(axStart, axEnd) +
      '\nfunction update(node, props) { for (const [name, value] of Object.entries(props)) applyBuiltinScrollViewProp(node, name, value) }; update',
  )
  let element = true,
    label = ''
  const document = { content: 'All 24 notes' },
    clip = { bounds: { origin: { x: 20, y: 120 } } }
  const view = {
    documentView: document,
    contentView: clip,
    accessibilityRole: 'AXScrollArea',
    accessibilityValue: 'native value',
    accessibilityHelp: null,
    accessibilityValueDescription: null,
    setAccessibilityLabel(value: string) {
      label = value
    },
    set accessibilityElement(value: boolean) {
      element = value
    },
  }
  const node = { type: 'scrollview', view, props: {} }
  update(node, {
    accessibilityLabel: 'Trip notes',
    accessibilityHint: 'Scroll to review.',
    accessibilityValue: '24 notes',
    accessible: false,
  })
  assert.equal(label, 'Trip notes')
  assert.equal(view.accessibilityHelp, 'Scroll to review.')
  assert.equal(view.accessibilityValueDescription, '24 notes')
  assert.equal(element, false)
  update(node, { accessibilityHint: '', accessibilityValue: '' })
  assert.equal(view.accessibilityHelp, '')
  assert.equal(view.accessibilityValueDescription, '')
  update(node, {
    accessibilityLabel: undefined,
    accessibilityHint: undefined,
    accessibilityValue: undefined,
    accessible: undefined,
  })
  assert.equal(label, '')
  assert.equal(view.accessibilityHelp, null)
  assert.equal(view.accessibilityValueDescription, null)
  assert.equal(element, true)
  assert.equal(view.accessibilityRole, 'AXScrollArea')
  assert.equal(view.accessibilityValue, 'native value')
  assert.equal(view.documentView, document)
  assert.equal(view.contentView, clip)
  assert.deepEqual(clip.bounds.origin, { x: 20, y: 120 })
  assert.equal(document.content, 'All 24 notes')
})

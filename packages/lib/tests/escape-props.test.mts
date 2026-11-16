import assert from 'node:assert/strict'
import { test } from 'node:test'
import { applyEscapeProps } from '../src/escape-props.web.ts'

test('web escape properties assign properties and maintain attributes', () => {
  const attributes = new Map<string, string>([['title', 'old'], ['aria-label', 'old']])
  const element = {
    title: 'old',
    setAttribute(name: string, value: string) { attributes.set(name, value) },
    removeAttribute(name: string) { attributes.delete(name) },
  }
  applyEscapeProps(element, { web: { title: 'new', 'aria-hidden': true, 'aria-label': false, custom: 3 } })
  assert.equal(element.title, 'new')
  assert.equal(attributes.get('aria-hidden'), '')
  assert.equal(attributes.has('aria-label'), false)
  assert.equal(attributes.get('custom'), '3')
  applyEscapeProps(element, { web: { title: null, custom: undefined } })
  assert.equal(attributes.has('title'), false)
  assert.equal(attributes.has('custom'), false)
})

test('web escape properties fall back to attributes for read-only properties', () => {
  const attributes = new Map<string, string>()
  const element = {
    get readOnly() { return 'initial' },
    setAttribute(name: string, value: string) { attributes.set(name, value) },
    removeAttribute(name: string) { attributes.delete(name) },
  }
  applyEscapeProps(element, { web: { readOnly: 'fallback' } })
  assert.equal(attributes.get('readOnly'), 'fallback')
})

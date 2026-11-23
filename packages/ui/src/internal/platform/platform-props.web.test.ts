// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { applyWebProps } from './platformProps.web'

it('assigns writable properties and attributes for dash names', () => {
  const el = document.createElement('div')

  applyWebProps(el, { title: 'hello', 'aria-hidden': true })
  expect(el.title).toBe('hello')
  expect(el.getAttribute('aria-hidden')).toBe('')

  applyWebProps(el, { 'aria-hidden': false, title: null })
  expect(el.hasAttribute('aria-hidden')).toBe(false)
  expect(el.hasAttribute('title')).toBe(false)
})

it('reflects unknown names as attributes instead of expando properties', () => {
  const el = document.createElement('div')

  applyWebProps(el, { 'data-tracking-id': 7, customname: 'kept' })
  expect(el.getAttribute('data-tracking-id')).toBe('7')
  expect(el.getAttribute('customname')).toBe('kept')
  expect('customname' in el).toBe(false)
})

it('falls back to an attribute when the property is read-only', () => {
  const attributes = new Map<string, string>()
  const el = {
    get readOnly() {
      return 'initial'
    },
    setAttribute(name: string, value: string) {
      attributes.set(name, value)
    },
    removeAttribute(name: string) {
      attributes.delete(name)
    },
  }

  applyWebProps(el, { readOnly: 'fallback' })
  expect(el.readOnly).toBe('initial')
  expect(attributes.get('readOnly')).toBe('fallback')
})

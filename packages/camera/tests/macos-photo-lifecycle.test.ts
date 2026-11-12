import { describe, expect, it } from 'vitest'

import { createPhotoCaptureLifecycle } from '../src/photo-lifecycle.macos'

// Covers the states the removed tests/macos/photo-lifecycle.swift fixture
// exercised against the Swift PhotoCaptureLifecycle.
describe('macOS photo capture lifecycle', () => {
  it('prepare → ready → capture → finish accepts each transition once', () => {
    const life = createPhotoCaptureLifecycle()
    const token = life.prepare()

    expect(token).toBe(0)
    expect(life.prepare()).toBeNull()
    expect(life.capture()).toBeNull()
    expect(life.ready(token!)).toBe(true)

    const captureToken = life.capture()

    expect(captureToken).toBe(token)
    expect(life.accepts(token!)).toBe(true)
    expect(life.finish()).toBe(true)
    expect(life.finish()).toBe(false)
    expect(life.accepts(token!)).toBe(false)
  })

  it('rejects stale tokens after finish invalidates the generation', () => {
    const life = createPhotoCaptureLifecycle()
    const first = life.prepare()!

    life.ready(first)
    life.finish()
    expect(life.accepts(first)).toBe(false)
    expect(life.ready(first)).toBe(false)
    expect(life.prepare()).toBeNull()
  })

  it('blocks capture while preparing or finished', () => {
    const preparing = createPhotoCaptureLifecycle()

    preparing.prepare()
    expect(preparing.capture()).toBeNull()

    const finished = createPhotoCaptureLifecycle()

    finished.prepare()
    finished.finish()
    expect(finished.capture()).toBeNull()
  })

  it('finish from preview or preparing still fences late results', () => {
    const life = createPhotoCaptureLifecycle()
    const token = life.prepare()!

    expect(life.finish()).toBe(true)
    expect(life.ready(token)).toBe(false)
    expect(life.accepts(token)).toBe(false)
  })
})

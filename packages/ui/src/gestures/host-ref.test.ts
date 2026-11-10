import { expect, it } from 'vitest'
import { createInteractionHostRef } from './host-ref'

it('preserves a host across callback-ref replacement and cancels only a real detach', () => {
  const calls: string[] = [],
    pending: (() => void)[] = []

  const lifecycle = createInteractionHostRef<object>(
    () => {
      calls.push('attach')
    },
    () => {
      calls.push('detach')
    },
    (callback) => {
      pending.push(callback)
    },
  )

  const host = {}

  lifecycle.bind(host)
  calls.length = 0
  lifecycle.bind(null)
  lifecycle.bind(host)
  for (const callback of pending.splice(0)) {
    callback()
  }

  expect(calls).toEqual([])
  lifecycle.bind(null)
  expect(calls).toEqual([])
  for (const callback of pending.splice(0)) {
    callback()
  }

  expect(calls).toEqual(['detach'])
  lifecycle.dispose()
})

it('retires queued null refs when a different host commits or the component disposes', () => {
  const attached: object[] = [],
    pending: (() => void)[] = []

  let detaches = 0
  const lifecycle = createInteractionHostRef<object>(
    (host) => {
      attached.push(host)
    },
    () => {
      detaches++
    },
    (callback) => {
      pending.push(callback)
    },
  )

  const first = {},
    second = {}

  lifecycle.bind(first)
  lifecycle.bind(null)
  lifecycle.bind(second)

  const count = detaches

  for (const callback of pending.splice(0)) {
    callback()
  }

  expect(detaches).toBe(count)
  expect(lifecycle.host).toBe(second)
  lifecycle.bind(null)
  lifecycle.dispose()
  for (const callback of pending.splice(0)) {
    callback()
  }

  expect(detaches).toBe(count + 1)
  expect(attached).toEqual([first, second])
})

it('does not overwrite a newer host installed by a detach callback', () => {
  const first = {},
    replacement = {},
    stale = {}

  let replace = false
  const lifecycle = createInteractionHostRef<object>(
    () => {},
    () => {
      if (replace) {
        replace = false
        lifecycle.bind(replacement)
      }
    },
  )

  lifecycle.bind(first)
  replace = true
  lifecycle.bind(stale)
  expect(lifecycle.host).toBe(replacement)
  lifecycle.dispose()
})

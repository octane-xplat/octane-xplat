import { expect, it, vi } from 'vitest'
import { attachPan } from './pan'
import { attachments, sample } from '../test/owned-input'

it('maps shared samples into Motion offsets, deltas, velocity and cancellation', () => {
  const start = vi.fn(),
    move = vi.fn(),
    end = vi.fn(),
    node = {}

  const off = attachPan(node, 'x', { start, move, end })
  const binding = attachments.at(-1)!

  expect(binding.node).toBe(node)
  expect(binding.options.axis).toBe('x')
  binding.options.onStart!(sample(10, 300))
  binding.options.onUpdate!(sample(25, 400))
  expect(move.mock.calls.at(-1)![1]).toMatchObject({
    offset: { x: 25, y: 0 },
    delta: { x: 15, y: 0 },
    velocity: { x: 400, y: 0 },
  })

  binding.options.onFinalize!({ outcome: 'cancelled', sample: sample(25), reason: 'superseded' })
  expect(end).toHaveBeenCalledOnce()
  expect(end.mock.calls[0][1].cancelled).toBe(true)
  expect(end.mock.calls[0][1].velocity).toEqual({ x: 0, y: 0 })
  off()
  expect(binding.node).toBeNull()
})

import { expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { attachPan } from '../../../packages/motion/src/pan.web'

it('preserves real nested button and input clicks before the drag threshold', async () => {
  const host = document.createElement('div')
  const button = document.createElement('button')
  const input = document.createElement('input')
  button.textContent = 'Nested motion action'
  host.append(button, input)
  document.body.append(host)
  let clicks = 0
  let starts = 0
  button.addEventListener('click', () => clicks++)
  const off = attachPan(host, true, {
    start: () => starts++,
    move() {},
    end() {},
  })
  try {
    await userEvent.click(button)
    expect(clicks).toBe(1)
    await userEvent.click(input)
    expect(document.activeElement).toBe(input)
    expect(starts).toBe(0)
  } finally {
    off()
    host.remove()
  }
})

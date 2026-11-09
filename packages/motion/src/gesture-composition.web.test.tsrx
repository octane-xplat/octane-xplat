/** @jsxImportSource @octane-xplat/jsx/dom */
import { act, createRoot } from 'octane'
import { motion, MotionConfig } from './index.web'
import { controllers } from './components.tsrx'
import { gestureContract } from '../test/gesture-contract'
import type { MotionProps } from './types'

function Subject(props: { motion: MotionProps; reduced: boolean }) @{
  <MotionConfig reducedMotion={props.reduced ? 'always' : 'never'}>
    <motion.View id="composition" transition={{ duration: 0 }} {...props.motion} />
  </MotionConfig>
}

gestureContract((props, reduced = false) => {
  const container = document.createElement('div')

  document.body.append(container)

  const root = createRoot(container)
  const update = (motion: MotionProps) =>
    act(() => root.render(<Subject motion={motion} reduced={reduced} />))

  update(props)

  const node = container.querySelector('#composition')!
  let closed = false

  return {
    controller: controllers.get(node)!,
    update,
    event(name) {
      const type = {
        focus: 'focus',
        blur: 'blur',
        down: 'pointerdown',
        up: 'pointerup',
        cancel: 'pointercancel',
      }[name]

      act(() => node.dispatchEvent(new Event(type, { bubbles: true })))
    },
    close() {
      if (!closed) {
        closed = true
        act(() => root.unmount())
        container.remove()
      }
    },
  }
})

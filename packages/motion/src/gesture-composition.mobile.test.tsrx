/** @jsxImportSource @octane-xplat/jsx */
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalSync,
} from 'octane/universal/native'

import { motion, MotionConfig } from './index'
import { controllers } from './components.tsrx'
import { dispatchOwnedPress } from '../test/owned-input'
import { gestureContract } from '../test/gesture-contract'
import type { MotionProps } from './types'

function Subject(props: { motion: MotionProps; reduced: boolean }) @{
  <MotionConfig reducedMotion={props.reduced ? 'always' : 'never'}>
    <motion.View transition={{ duration: 0 }} {...props.motion} />
  </MotionConfig>
}

gestureContract((props, reduced = false) => {
  const container = createObjectContainer('nativescript')
  const driver = createObjectDriver('nativescript')
  const publicInstance = driver.getPublicInstance
  const listeners = new Map<string, Set<(event: object) => void>>()

  // Supply only NativeScript's observable event surface. The real host adapter
  // still translates touch down/up/cancel and focus/blur into gesture state.
  driver.getPublicInstance = (...args) => {
    const node = publicInstance(...args)

    if (node && typeof node === 'object') {
      Object.assign(node, {
        on(name: string, callback: (event: object) => void) {
          if (!listeners.has(name)) {
            listeners.set(name, new Set())
          }

          listeners.get(name)!.add(callback)
        },
        off(name: string, callback: (event: object) => void) {
          listeners.get(name)?.delete(callback)
        },
      })
    }

    return node
  }

  const root = createUniversalRoot(container, driver)
  const update = (motion: MotionProps) =>
    flushUniversalSync(() => root.render(Subject, { motion, reduced }))

  update(props)

  const node = container.children[0]
  let closed = false

  return {
    controller: controllers.get(node)!,
    update,
    event(name) {
      const type = name === 'focus' || name === 'blur' ? name : 'touch'
      const action = name === 'cancel' ? 'cancel' : name

      flushUniversalSync(() => {
        if (type === 'touch') {
          dispatchOwnedPress(node, action)
        }

        for (const callback of listeners.get(type) ?? []) {
          callback({ action })
        }
      })
    },
    close() {
      if (!closed) {
        closed = true
        root.unmount()
      }
    },
  }
})

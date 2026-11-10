import {
  attachWebGesture,
  attachWebPress,
  attachWebInteractionScope,
  registerWebGestureViewport,
} from '../../../../packages/ui/src/gestures/input.web'

import { createPanController } from '../../../../packages/ui/src/gestures/controller'
import { createInteractionScope } from '../../../../packages/ui/src/gestures/scope'
import type { Suspension } from '../../../../packages/ui/src/gestures/types'

const panel = document.querySelector<HTMLElement>('#panel')!
const button = document.querySelector<HTMLButtonElement>('#action')!
const output = document.querySelector<HTMLOutputElement>('#state')!
const state = {
  clicks: 0,
  starts: 0,
  ends: 0,
  cancels: 0,
  x: 0,
  scopePresses: 0,
  leases: 0,
  scopeFailure: '',
  scrollY: 0,
  revealStarts: 0,
}

const publish = () => {
  output.textContent = JSON.stringify(state)
}

const pan = createPanController({
  axis: 'x',
  onStart: () => {
    state.starts++
    publish()
  },
  onUpdate: (event) => {
    state.x = event.translation.x
    panel.style.transform = `translateX(${state.x}px)`
    publish()
  },
  onEnd: () => {
    state.ends++
    publish()
  },
  onCancel: () => {
    state.cancels++
    publish()
  },
})

const detach = attachWebGesture(panel, pan.handle)

const press = attachWebPress(button, {
  slop: 8,
  longPressDelay: 500,
  onPress() {
    state.clicks++
    publish()
  },
})

window.addEventListener(
  'pagehide',
  () => {
    press.dispose()
    detach()
    pan.dispose()
  },
  { once: true },
)

publish()

const content = document.querySelector<HTMLElement>('#frozen-content')!
const scopedButton = document.querySelector<HTMLButtonElement>('#frozen-action')!
const freeze = document.querySelector<HTMLButtonElement>('#freeze')!
const release = document.querySelector<HTMLButtonElement>('#release')!
const scrollParent = document.querySelector<HTMLElement>('#scroll-parent')!
const viewport = document.querySelector<HTMLElement>('#scroll-viewport')!

if (!pan.scope) {
  throw new Error('The standalone fixture requires an owned signal scope')
}

const suspended$ = pan.scope.signal$('fixture:suspended', false)
const scope = createInteractionScope(
  suspended$,
  // oxlint-disable-next-line xplat/require-signals-runtime -- Imperative fixture; the imported controller owns this signal runtime. No component renders here.
  pan.scope.derived$('fixture:readonly', () => suspended$.get()),
)

const offScope = attachWebInteractionScope(content, scope.handle)
const leases: Suspension[] = []

freeze.addEventListener('click', () => {
  const result = scope.handle.suspend()

  if (result.ok) {
    leases.push(result.lease)
  } else {
    state.scopeFailure = result.reason
  }

  state.leases = leases.length
  publish()
})

release.addEventListener('click', () => {
  leases.pop()?.release()
  state.leases = leases.length
  publish()
})

scopedButton.addEventListener('click', () => {
  state.scopePresses++
  publish()
})

const reveal = createPanController({
  axis: 'x',
  onStart() {
    state.revealStarts++
    publish()
  },
})

const offReveal = attachWebGesture(scrollParent, reveal.handle)
const offViewport = registerWebGestureViewport(viewport)

viewport.addEventListener('scroll', () => {
  state.scrollY = viewport.scrollTop
  publish()
})

window.addEventListener(
  'pagehide',
  () => {
    offViewport()
    offReveal()
    reveal.dispose()
    offScope()
    scope.dispose()
  },
  { once: true },
)

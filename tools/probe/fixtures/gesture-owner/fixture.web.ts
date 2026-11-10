import { attachWebGesture } from '../../../../packages/ui/src/gestures/input.web'
import { createPanController } from '../../../../packages/ui/src/gestures/controller'

const panel = document.querySelector<HTMLElement>('#panel')!
const button = document.querySelector<HTMLButtonElement>('#action')!
const output = document.querySelector<HTMLOutputElement>('#state')!
const state = { clicks: 0, starts: 0, ends: 0, cancels: 0, x: 0 }
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

button.addEventListener('click', () => {
  state.clicks++
  publish()
})

window.addEventListener(
  'pagehide',
  () => {
    detach()
    pan.dispose()
  },
  { once: true },
)

publish()

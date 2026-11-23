import { Application, Button, GridLayout, Label, Page, TextField } from '@nativescript/core'
import { Button as DeepButton } from '@nativescript/core/ui/button'
import { View as MasonView } from '@octane-xplat/nativescript-masonkit'
import { renderNativeScriptApp } from '@octane-xplat/nativescript-octane'
import { Control } from './Control.tsrx'

function check(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const page = new Page()
const host = new GridLayout()
page.content = host
let disposed = 0
const root = renderNativeScriptApp(host, Control, { disposed: () => disposed++ })
const entry = { create: () => page }

if (Application.started) {
  Application.resetRootView(entry)
} else {
  Application.run(entry)
}

const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 30))

async function run() {
  const deadline = Date.now() + 20_000
  const layout = page.getViewById('layout')
  const action = page.getViewById('action')
  const input = page.getViewById('input')
  const value = page.getViewById('value')
  check(Button === DeepButton && action instanceof Button, 'Core constructor identity split')
  check(input instanceof TextField && input.text === 'Editable', 'Missing Core TextField')
  check(layout instanceof MasonView && value instanceof Label, 'Missing Mason or Core Label')
  while ((!page.isLoaded || action.getActualSize().width <= 0) && Date.now() < deadline) {
    await delay()
  }
  const width = layout.getActualSize().width
  const loaded = page.isLoaded
  console.log(`WINDOWS_CORE_LAYOUT width=${width} loaded=${loaded}`)
  const peer = action.nativeViewProtected
  check(peer && input.nativeViewProtected, 'Missing WinUI control peers')

  action.notify({ eventName: Button.tapEvent, object: action })
  await delay()
  check(value.text === 'initial:1', 'Core event did not update the Octane tree')
  console.log('WINDOWS_CORE_READY')

  let activeAction = action
  if (import.meta.hot) {
    let updatedValue = page.getViewById('value')
    while (
      !(updatedValue instanceof Label && updatedValue.text === 'updated:1') &&
      Date.now() < deadline + 30_000
    ) {
      await delay()
      updatedValue = page.getViewById('value')
    }
    check(
      updatedValue instanceof Label && updatedValue.text === 'updated:1',
      'Hot edit did not preserve component state',
    )
    check(Application.getRootView() === page, 'Hot edit replaced the host Page')
    const button = page.getViewById('action')
    check(button instanceof Button && button.nativeViewProtected, 'Missing WinUI peer after edit')
    activeAction = button
    activeAction.notify({ eventName: Button.tapEvent, object: activeAction })
    await delay()
    check(String(updatedValue.text) === 'updated:2', 'Hot edit changed tap delivery')
    console.log(
      `WINDOWS_CORE_HOT sameView=${activeAction === action} samePeer=${activeAction.nativeViewProtected === peer}`,
    )
  }

  const disposalsBeforeUnmount = disposed
  root.unmount()
  await delay()
  check(disposed === disposalsBeforeUnmount + 1, 'Octane did not dispose the live effect')
  // The driver detaches the subtree as a unit. Its internal parent links may survive.
  check(
    host.getChildrenCount() === 0 && !layout.parent,
    'Octane did not detach the Mason subtree from its Core host',
  )
  check(
    !action.hasListeners(Button.tapEvent) && !activeAction.hasListeners(Button.tapEvent),
    'Unmount retained a Core tap listener',
  )
  console.log('WINDOWS_CORE_TEARDOWN')
  check(
    loaded && Math.abs(width - 240) < 1,
    `Expected a 240 DIP Mason layout; measured ${width}, page loaded ${loaded}`,
  )
  console.log('WINDOWS_CORE_PASS')
}

import.meta.hot?.dispose(() => root.unmount())
void run().catch((error) => console.error('WINDOWS_CORE_FAIL', error.stack ?? String(error)))

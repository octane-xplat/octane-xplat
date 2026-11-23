import { Application, Button, Label, Page, TextField } from '@nativescript/core'
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
let disposed = 0
const root = renderNativeScriptApp(page, Control, { disposed: () => disposed++ })
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
  check(page.isLoaded && layout.getActualSize().width === 240, 'Expected a 240 DIP Mason layout')
  const peer = action.nativeViewProtected
  check(peer && input.nativeViewProtected, 'Missing WinUI control peers')

  action.notify({ eventName: Button.tapEvent, object: action })
  await delay()
  check(value.text === 'initial:1', 'Core event did not update the Octane tree')
  console.log('WINDOWS_CORE_READY')

  if (import.meta.hot) {
    while (String(value.text) !== 'updated:1' && Date.now() < deadline + 30_000) {
      await delay()
    }
    check(String(value.text) === 'updated:1', 'Hot edit did not preserve component state')
    check(
      page.getViewById('action') === action && action.nativeViewProtected === peer,
      'Hot edit replaced the WinUI peer',
    )
    check(Application.getRootView() === page, 'Hot edit replaced the host Page')
    console.log('WINDOWS_CORE_HOT')
  }

  root.unmount()
  await delay()
  check(disposed === 1 && !page.content && !action.parent, 'Octane did not tear down its tree')
  action.notify({ eventName: Button.tapEvent, object: action })
  check(!action.hasListeners(Button.tapEvent), 'Unmount retained the Core tap listener')
  console.log('WINDOWS_CORE_PASS')
}

import.meta.hot?.dispose(() => root.unmount())
void run().catch((error) => console.error('WINDOWS_CORE_FAIL', error.stack ?? String(error)))

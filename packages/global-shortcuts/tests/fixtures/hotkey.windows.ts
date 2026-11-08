import { createGlobalShortcuts, getGlobalShortcutSupport } from '../../src/index.windows.ts'

for (const name of ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']) {
  globalThis[name] ??= globalThis['__ns__' + name]
}

const ui = Microsoft.UI.Xaml
const window = new ui.Window()
window.Title = 'XplatGlobalHotkeys'
window.Content = new ui.Controls.StackPanel()
window.Activate()

const say = (m) => console.log('GHK ' + m)
let presses = 0
setTimeout(async () => {
  try {
    const support = await getGlobalShortcutSupport()
    say('support ' + JSON.stringify(support))
    if (!support.supported) {
      throw new Error('unsupported: ' + support.reason)
    }

    const shortcuts = createGlobalShortcuts()
    const result = await shortcuts.register({
      id: 'ghk',
      accelerator: 'Ctrl+Alt+KeyK',
      description: 'probe',
      onPress: () => {
        presses++
        say('pressed ' + presses)
      },
    })

    if (!result.ok) {
      throw new Error('register failed ' + result.error.code + ': ' + result.error.message)
    }

    say('registered trigger=' + result.shortcut.trigger)
    // The driver sends the chord twice with a foreign window focused.
    const deadline = Date.now() + 45000
    while (presses < 2 && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 200))
    }

    if (presses < 2) {
      throw new Error('expected 2 presses, got ' + presses)
    }

    say('unregistered ' + (await result.shortcut.unregister()))
    // The driver sends once more; delivery must not resume.
    await new Promise((r) => setTimeout(r, 2500))
    say('post-unregister presses=' + presses)
    const reserved = await shortcuts.register({ id: 'res', accelerator: 'Meta+KeyL', onPress() {} })
    say('reserved ok=' + reserved.ok + ' code=' + (reserved.ok ? '-' : reserved.error.code))
    if (!reserved.ok && reserved.error.code !== 'reserved') {
      throw new Error('expected reserved for Meta+KeyL, got ' + reserved.error.code)
    }

    await shortcuts.dispose()
    if (presses === 2) {
      console.log('GHK_WINDOWS_OK presses=' + presses)
    } else {
      console.log('GHK_WINDOWS_FAIL presses=' + presses)
    }
  } catch (error) {
    console.log('GHK_WINDOWS_FAIL ' + String(error && error.message ? error.message : error))
  }
}, 0)

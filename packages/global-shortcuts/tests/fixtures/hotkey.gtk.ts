import GLib from 'gi://GLib?version=2.0'
import { createGlobalShortcuts, getGlobalShortcutSupport } from '../../src/index.gtk'

const say = (m) => print('GHK ' + m)
const check = (value, name) => {
  if (!value) {
    throw new Error('ASSERT ' + name)
  }
}

let presses = 0
let bound = null
const loop = GLib.MainLoop.new(null, false)

async function main() {
  const support = await getGlobalShortcutSupport()

  say('support ' + JSON.stringify(support))
  check(support.supported === true, 'portal supported: ' + support.reason)
  check(support.assignment === 'desktop', 'desktop assignment')

  const shortcuts = createGlobalShortcuts({ appId: 'org.octane.GlobalShortcutsProbe' })
  const result = await shortcuts.register({
    id: 'probe',
    accelerator: 'Ctrl+Alt+KeyK',
    description: 'Probe',
    onPress: () => {
      presses++
      say('ACTIVATED ' + presses)
    },
  })

  check(
    result.ok,
    'bind failed: ' + (result.ok ? '' : result.error.code + ' ' + result.error.message),
  )

  if (!result.ok) {
    return
  }

  say('bound trigger=' + result.shortcut.trigger)
  bound = result.shortcut
}

GLib.timeout_add(GLib.PRIORITY_DEFAULT, 250, () => {
  let contents = null

  try {
    const got = GLib.file_get_contents('/tmp/ghk-cmd')

    if (got[0]) {
      contents = new TextDecoder('utf-8').decode(got[1]).trim()
    }
  } catch {
    return GLib.SOURCE_CONTINUE
  }

  if (contents === null) {
    return GLib.SOURCE_CONTINUE
  }

  if (contents.includes('close') && bound !== null) {
    const shortcut = bound

    bound = null
    void shortcut.unregister().then((released) => say('UNBOUND ' + released))
  }

  if (contents.includes('exit')) {
    say('DONE presses=' + presses)
    loop.quit()
    return GLib.SOURCE_REMOVE
  }

  return GLib.SOURCE_CONTINUE
})

main().then(
  () => undefined,
  (error) => {
    say('GTK_FAIL ' + String(error && error.message ? error.message : error))
    loop.quit()
  },
)

loop.run()

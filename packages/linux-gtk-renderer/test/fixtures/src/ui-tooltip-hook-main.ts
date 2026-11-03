import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { TooltipHookScene, EmptyTooltipScene, binding, lifetime } from './ui-tooltip-hook.gtk.tsrx'

Gtk.init()
const window = new Gtk.Window({
  title: 'Octane GTK tooltip hook test',
  default_width: 700,
  default_height: 400,
  decorated: false,
})

const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {
  onUncaughtError(error) {
    throw error
  },
})

const loop = GLib.MainLoop.new(null, false)
const pause = (ms = 100) =>
  new Promise<void>((resolve) => {
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
      resolve()
      return false
    })
  })

let checks = 0
const failures: string[] = []
const check = (name: string, ok: unknown) => {
  checks++
  if (!ok) {
    failures.push(name)
  }
}

const view = (id: string): any => [...container.nodes.values()].find((n) => n.props.id === id)?.view
const popup = (anchor = view('hook-trigger')): any => {
  for (let child = anchor?.get_first_child(); child; child = child.get_next_sibling()) {
    if (child instanceof Gtk.Popover) {
      return child
    }
  }
  return null
}

const emit = (type: 'hover' | 'leave' | 'focus' | 'blur' | 'touch') => {
  const model = view('hook-trigger').observe_controllers()
  for (let i = 0; i < model.get_n_items(); i++) {
    const controller = model.get_item(i)
    if (controller instanceof Gtk.EventControllerMotion && (type === 'hover' || type === 'leave')) {
      if (type === 'hover') {
        controller.emit('enter', 0, 0)
      } else {
        controller.emit('leave')
      }
    }

    if (controller instanceof Gtk.EventControllerFocus && (type === 'focus' || type === 'blur')) {
      controller.emit(type === 'focus' ? 'enter' : 'leave')
    }

    if (controller instanceof Gtk.GestureClick && type === 'touch' && controller.get_touch_only()) {
      controller.emit('pressed', 1, 10, 10)
    }
  }
}

const notifications: string[] = []
let props: Parameters<typeof TooltipHookScene>[0] = {
  options: {
    delay: 80,
    hideDelay: 80,
    onShow: () => notifications.push('show'),
    onHide: () => notifications.push('hide'),
  },
}

const render = async (next: Partial<typeof props> = {}) => {
  props = { ...props, ...next }
  root.render(TooltipHookScene, props)
  await pause()
}

const options = async (next: NonNullable<typeof props.options>) =>
  render({ options: { ...props.options, ...next } })

let ack = 0
const keys = new Gtk.EventControllerKey()
keys.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
keys.connect('key-pressed', (_c: any, key: number) => {
  if (key === 65481) {
    ack++
    return true
  }
  return false
})

window.add_controller(keys)
async function phase(payload: object) {
  const next = ack + 1
  print('GTK_TOOLTIP_HOOK_READY ' + JSON.stringify(payload))
  for (let i = 0; i < 250 && ack < next; i++) {
    await pause(20)
  }
  check('OS phase acknowledged', ack >= next)
  await pause(180)
}

async function run() {
  await render()
  window.present()
  await pause(180)
  const osInput = GLib.getenv('GTK_TOOLTIP_HOOK_OS') === '1'
  if (osInput) {
    await phase({ key: 'F12' })
    check('fixture window is active for focus checks', window.is_active)
  }
  view('hook-peer').focus()
  await pause()
  notifications.length = 0
  check('starts hidden', !popup().get_visible())
  check('stable description id', binding.anchorId === binding.describedBy)
  emit('hover')
  await pause(25)
  check('hover waits for delay', !popup().get_visible())
  await pause(100)
  check('hover opens native tooltip', popup().get_mapped())
  check('provider is retained', view('hook-content')?.get_text() === 'First')
  check('show callback fires once', notifications.join() === 'show')
  check(
    'native description is attached',
    Gtk.test_accessible_has_relation(view('hook-trigger'), Gtk.AccessibleRelation.DESCRIBED_BY),
  )
  await render({
    value: 'Second',
    renderProps: { className: 'hook-custom', style: { padding: 12 } },
  })
  check('open content updates through context', view('hook-content')?.get_text() === 'Second')
  check(
    'render class and style are applied',
    [...container.nodes.values()].some(
      (n) =>
        n.cssClasses.has('hook-custom') &&
        Number.parseFloat(String(n.computedStyle?.padding)) === 12,
    ),
  )
  emit('leave')
  await pause(20)
  check('hide delay retains panel', popup().get_visible())
  await pause(100)
  check('leave hides after delay', !popup().get_visible())
  check('hide callback fires once', notifications.join() === 'show,hide')
  check('closing releases content', !view('hook-content'))
  await options({ isOpen: true, placement: 'above', alignment: 'start' })
  check('controlled open shows panel', popup().get_mapped())
  let [, rect] = popup().get_pointing_to()
  check(
    'start alignment and default gap reach native placement',
    Math.abs(rect.x - popup().get_child().get_width() / 2) <= 1 &&
      rect.y === 0 &&
      popup().get_offset()[1] === -8,
  )
  await options({ alignment: 'end' })
  ;[, rect] = popup().get_pointing_to()
  check(
    'end alignment updates native placement',
    Math.abs(rect.x - (view('hook-trigger').get_width() - popup().get_child().get_width() / 2)) <=
      1,
  )
  await render({ renderProps: { placement: 'below', alignment: 'center', offset: '12px' } })
  ;[, rect] = popup().get_pointing_to()
  check('render overrides placement', popup().get_position() === Gtk.PositionType.BOTTOM)
  check(
    'render overrides alignment and offset',
    Math.abs(rect.x - view('hook-trigger').get_width() / 2) <= 1 &&
      rect.y === view('hook-trigger').get_height() &&
      popup().get_offset()[1] === 12,
  )
  emit('leave')
  emit('blur')
  await pause(150)
  check('controlled open suppresses intent hides', popup().get_visible())
  await options({ isOpen: false })
  check('controlled false hides', !popup().get_visible())
  emit('hover')
  emit('focus')
  await pause(150)
  check('controlled false blocks intent', !popup().get_visible())
  await options({ isOpen: undefined, focusTrigger: 'never' })
  view('hook-trigger').focus()
  await pause()
  check('focus never suppresses focus intent', !popup().get_visible())
  view('hook-peer').focus()
  await pause()
  await options({
    focusTrigger: 'always',
    onShow: () => notifications.push('latest-show'),
    onHide: () => notifications.push('latest-hide'),
  })
  view('hook-trigger').focus()
  await pause()
  check('focus always opens', popup().get_visible())
  check('latest show callback is used', notifications.at(-1) === 'latest-show')
  view('hook-peer').focus()
  await pause()
  check('latest hide callback is used', notifications.at(-1) === 'latest-hide')
  await options({ isEnabled: false })
  check('disabled disposes the native surface', !popup())
  await options({ isEnabled: true, focusTrigger: 'auto', touchTrigger: 'auto' })
  emit('touch')
  await pause()
  check('auto touch ignores action triggers', !popup().get_visible())
  await options({ touchTrigger: 'tap' })
  emit('touch')
  await pause()
  check('tap touch opens action trigger', popup().get_visible())
  emit('touch')
  await pause()
  check('second tap closes', !popup().get_visible())
  await options({ touchTrigger: 'none' })
  emit('touch')
  await pause()
  check('none touch stays hidden', !popup().get_visible())
  await render({ plain: true })
  await options({ focusTrigger: 'auto', touchTrigger: 'auto' })
  emit('focus')
  await pause()
  check('auto focus skips nonfocusable host', !popup().get_visible())
  await render({ nested: true })
  emit('touch')
  await pause()
  check('auto touch ignores nested action triggers', !popup().get_visible())
  await render({ nested: false })
  emit('touch')
  await pause()
  check('auto touch opens nonaction trigger', popup().get_visible())
  emit('touch')
  await pause()
  await render({ plain: false, split: true, renderProps: undefined })
  await options({ isOpen: true, placement: 'below' })
  const native = popup(view('hook-position'))
  check('split refs position at separate host', !!native && !popup(view('hook-trigger')))
  check(
    'split refs describe interaction target',
    Gtk.test_accessible_has_relation(view('hook-trigger'), Gtk.AccessibleRelation.DESCRIBED_BY),
  )
  await options({ isOpen: false })
  view('hook-trigger').set_direction(Gtk.TextDirection.RTL)
  await options({ isOpen: true, placement: 'start' })
  check(
    'logical placement follows RTL',
    popup(view('hook-position')).get_position() === Gtk.PositionType.RIGHT,
  )
  await render({ split: false })
  view('hook-trigger').set_direction(Gtk.TextDirection.LTR)
  await options({
    isOpen: undefined,
    placement: 'below',
    focusTrigger: 'auto',
    touchTrigger: 'auto',
  })
  view('hook-peer').focus()
  await pause()
  if (osInput) {
    const bounds = view('hook-trigger').getBounds()
    await phase({ x: bounds.x + 10, y: bounds.y + 10, hover: true })
    check('real pointer hover opens', popup().get_mapped())
    await phase({ x: 600, y: 300, hover: true })
    check('real pointer leave hides', !popup().get_visible())
    view('hook-peer').focus()
    await pause()
    await phase({ key: 'shift+Tab' })
    check('real keyboard focus opens', popup().get_mapped())
    await phase({ key: 'Escape' })
    check('real Escape dismisses', !popup().get_visible())
  }
  root.render(EmptyTooltipScene, {})
  await pause()
  await render({ options: { isDefaultOpen: true, onShow: () => notifications.push('default') } })
  check('default open shows on mount', popup().get_mapped())
  check('default open notifies visibility', notifications.at(-1) === 'default')
  const last = popup()
  root.unmount()
  await pause()
  check('unmount releases popup and all nodes', !last.get_parent() && container.nodes.size === 0)
  check('portal lifetimes balance', lifetime.mounts === lifetime.unmounts)
  print(
    'GTK_TOOLTIP_HOOK ' +
      JSON.stringify({
        checks,
        failures,
        osInput,
        gtk: `${Gtk.get_major_version()}.${Gtk.get_minor_version()}.${Gtk.get_micro_version()}`,
      }),
  )
  window.destroy()
  loop.quit()
}

let failed = false
run().catch((error) => {
  failed = true
  printerr('GTK_TOOLTIP_HOOK_ERROR ' + String(error?.stack ?? error))
  try {
    root.unmount()
  } catch {}
  window.destroy()
  loop.quit()
})

loop.run()
if (failed) {
  ;(globalThis as any).imports.system.exit(1)
}

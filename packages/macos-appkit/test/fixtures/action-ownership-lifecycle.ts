import { createMacOSRoot } from '@octane-xplat/macos-appkit'
import { NSApplication, NSView, NSButton } from '@octane-xplat/platform/macos'
import Actions from './Actions'

export async function checkActionOwnershipLifecycle(nativeWindow: any) {
  const check = (value: unknown, message: string) => {
    if (!value) {
      throw Error(message)
    }
  }
  const host = NSView.alloc().initWithFrame({
    origin: { x: 0, y: 0 },
    size: { width: 240, height: 220 },
  })
  nativeWindow.contentView.addSubview(host)
  const root = createMacOSRoot(host),
    debug = (root as any).__macosDebug
  const app = NSApplication.sharedApplication
  const calls: string[] = []
  let props = {
    nativeEnabled: true,
    editable: true,
    state: {},
    press: () => calls.push('first'),
    edit: () => calls.push('edit'),
    submit: () => calls.push('submit'),
    increment: () => calls.push('increment'),
    decrement: () => calls.push('decrement'),
    firstLink: () => calls.push('link-a'),
    secondLink: () => calls.push('link-b'),
  }
  const render = async () => {
    root.render(Actions as any, props)
    await new Promise((resolve) => setTimeout(resolve, 60))
    nativeWindow.contentView.layoutSubtreeIfNeeded()
  }
  try {
    await render()
    const button = debug.findId('lease-native'),
      tag = button.tag,
      target = button.target
    console.log('PACKED_ACTION_HANDLES', typeof NSButton, typeof NSView)
    check(
      app.sendActionToFrom('buttonPressed:', target, button),
      'Native button selector unavailable',
    )
    props = { ...props, press: () => calls.push('current') }
    await render()
    check(
      debug.findId('lease-native') === button && button.tag === tag,
      'Handler replacement changed native tag/view',
    )
    app.sendActionToFrom('buttonPressed:', target, button)
    props = { ...props, nativeEnabled: false }
    await render()
    app.sendActionToFrom('buttonPressed:', target, button)
    check(calls.join(',') === 'first,current', 'Disabled/replaced native action dispatch failed')
    const press = debug.findId('lease-press'),
      ax = debug.findId('lease-ax-only')
    check(press.accessibilityPerformPress(), 'AX press missing')
    const role =
      typeof ax.accessibilityRole === 'function' ? ax.accessibilityRole() : ax.accessibilityRole
    const label =
      typeof ax.accessibilityLabel === 'function' ? ax.accessibilityLabel() : ax.accessibilityLabel
    console.log(
      'PACKED_AX_GETTER_SHAPES',
      typeof ax.accessibilityRole,
      typeof ax.accessibilityLabel,
    )
    check(
      role === 'AXSlider' && label === 'Volume',
      'AX-only semantics missing: ' + String(role) + '/' + String(label),
    )
    check(
      !(typeof ax.acceptsFirstResponder === 'function'
        ? ax.acceptsFirstResponder()
        : ax.acceptsFirstResponder) && !ax.accessibilityPerformPress(),
      'AX-only view manufactured a press action',
    )
    check(
      ax.accessibilityPerformIncrement() && ax.accessibilityPerformDecrement(),
      'AX adjustment selectors missing',
    )
    props = { ...props, state: { readonly: true } }
    await render()
    check(
      !press.accessibilityPerformPress() && !ax.accessibilityPerformIncrement(),
      'Readonly AX dispatch escaped',
    )
    props = { ...props, state: { disabled: true } }
    await render()
    check(
      !press.accessibilityPerformPress() && !ax.accessibilityPerformDecrement(),
      'Disabled AX dispatch escaped',
    )
    const field = debug.findId('lease-field'),
      fieldTarget = field.target
    check(
      app.sendActionToFrom('textFieldSubmitted:', fieldTarget, field),
      'Text submit selector unavailable',
    )
    props = { ...props, editable: false }
    await render()
    const beforeReadonly = calls.length
    app.sendActionToFrom('textFieldSubmitted:', fieldTarget, field)
    check(calls.length === beforeReadonly, 'Readonly native text submitted')
    const a = debug.findId('lease-link-a'),
      b = debug.findId('lease-link-b')
    const firstAction = a.accessibilityCustomActions.objectAtIndex(0),
      secondAction = b.accessibilityCustomActions.objectAtIndex(0)
    check(
      firstAction && secondAction && firstAction !== secondAction,
      'Same-name links shared native AX action',
    )
    firstAction.handler()
    secondAction.handler()
    const before = calls.length
    root.unmount()
    app.sendActionToFrom('buttonPressed:', target, button)
    app.sendActionToFrom('textFieldSubmitted:', fieldTarget, field)
    firstAction.handler()
    secondAction.handler()
    check(
      !press.accessibilityPerformPress() && !ax.accessibilityPerformIncrement(),
      'Retired AX view dispatched',
    )
    check(calls.length === before, 'Retired native action callback escaped')
    check(calls.slice(-2).join(',') === 'link-a,link-b', 'Same-name native links redirected')
  } finally {
    root.unmount()
    host.removeFromSuperview()
  }
  console.log('PACKED_ACTION_OWNERSHIP_OK')
}

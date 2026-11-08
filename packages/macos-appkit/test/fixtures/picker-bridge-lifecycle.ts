import { NSDate, NSDatePicker, NSApplication, NSView } from '@octane-xplat/platform/macos'

// Qualify the composed leaf bridge, separately from raw datepicker/timepicker JSX.
export function checkPickerBridgeLifecycle(app: NSApplication, host: NSView) {
  const check = (condition: boolean, message: string) => {
    if (!condition) {
      throw Error(message)
    }
  }

  console.log('PACKED_PICKER_BRIDGE_HANDLES', typeof NSDate, typeof NSDatePicker)

  const bridge: unknown = Reflect.get(globalThis, '__xplatAppKit')

  if (
    typeof bridge !== 'object' ||
    bridge === null ||
    !('attachDatePicker' in bridge) ||
    typeof bridge.attachDatePicker !== 'function'
  ) {
    throw Error('Packed date-picker bridge unavailable')
  }

  const anchor = NSView.alloc().initWithFrame({
    origin: { x: 0, y: 0 },
    size: { width: 200, height: 100 },
  })

  host.addSubview(anchor)
  try {
    for (const mode of ['date', 'time', 'dateAndTime']) {
      const initial = Date.UTC(2026, 1, 10, 12, 30)
      const next = Date.UTC(2026, 1, 11, 13, 45)
      const events: number[] = []
      const handle: unknown = bridge.attachDatePicker(
        anchor,
        {
          mode,
          selectionMillis: initial,
          minimumMillis: initial - 86400000,
          maximumMillis: next + 86400000,
          accessibilityLabel: 'Bridge ' + mode,
        },
        (millis: number) => events.push(millis),
      )

      if (
        typeof handle !== 'object' ||
        handle === null ||
        !('update' in handle) ||
        typeof handle.update !== 'function' ||
        !('detach' in handle) ||
        typeof handle.detach !== 'function'
      ) {
        throw Error('Packed date-picker bridge failed to attach: ' + mode)
      }

      const picker = anchor.subviews.lastObject

      if (!(picker instanceof NSDatePicker)) {
        throw Error(mode + ' missing picker')
      }

      const target = picker.target

      try {
        check(picker.superview === anchor, mode + ' missing native attachment')
        check(
          Math.round(Number(picker.dateValue.timeIntervalSince1970) * 1000) === initial,
          mode + ' lost initial selection',
        )

        check(
          Math.round(Number(picker.minDate.timeIntervalSince1970) * 1000) === initial - 86400000,
          mode + ' lost minimum',
        )

        check(
          Number(picker.datePickerElements) ===
            (mode === 'time' ? 12 : mode === 'date' ? 224 : 236),
          mode + ' wrong components',
        )

        handle.update({ selectionMillis: next, enabled: true })
        check(
          Math.round(Number(picker.dateValue.timeIntervalSince1970) * 1000) === next,
          mode + ' lost updated selection',
        )

        check(picker.minDate == null && picker.maxDate == null, mode + ' retained removed bounds')
        check(events.length === 0, mode + ' echoed programmatic writes')
        check(
          app.sendActionToFrom('controlChanged:', target, picker),
          mode + ' selector unavailable',
        )

        check(events.length === 1 && events[0] === next, mode + ' selector missed handler')
        handle.update({ selectionMillis: next, enabled: false })
        app.sendActionToFrom('controlChanged:', target, picker)
        check(events.length === 1, mode + ' disabled callback dispatched')
      } finally {
        handle.detach()
      }

      handle.detach()
      handle.update({ selectionMillis: initial })
      check(picker.superview == null && picker.target == null, mode + ' retained attachment/target')
      check(String(picker.action) === '<null selector>', mode + ' retained selector')
      check(Number(anchor.constraints.count) === 0, mode + ' retained edge constraints')
      app.sendActionToFrom('controlChanged:', target, picker)
      check(events.length === 1, mode + ' stale target dispatched after retirement')
    }
  } finally {
    anchor.removeFromSuperview()
  }

  console.log('PACKED_PICKER_BRIDGE_OK')
}

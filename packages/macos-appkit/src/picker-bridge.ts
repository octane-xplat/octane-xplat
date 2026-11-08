import type { Actions } from './actions'
import type { PickerElements } from './picker-elements'
import {
  NSDate,
  NSDatePicker,
  NSDatePickerElementFlags,
  NSDatePickerStyle,
  NSMenuItem,
  NSView,
} from '@octane-xplat/platform/macos'

import type { PropBag } from './model'

interface Dependencies {
  actions: Pick<Actions, 'buttonActionTarget' | 'allocate'>
  pickerElements: Pick<PickerElements, 'makePopUpControl'>
}

export function createPickerBridge(deps: Dependencies) {
  const DATE_PICKER_STYLES = (
    typeof NSDatePickerStyle === 'object' && NSDatePickerStyle ? NSDatePickerStyle : {}
  ) as { [key: string]: number }

  const DATE_PICKER_ELEMENTS = (
    typeof NSDatePickerElementFlags === 'object' && NSDatePickerElementFlags
      ? NSDatePickerElementFlags
      : {}
  ) as { [key: string]: number }

  function dateFromMillis(millis: number | undefined) {
    if (
      typeof NSDate?.dateWithTimeIntervalSince1970 !== 'function' ||
      typeof millis !== 'number' ||
      !Number.isFinite(millis) ||
      !Number.isFinite(new Date(millis).getTime())
    ) {
      return null
    }

    return NSDate.dateWithTimeIntervalSince1970(millis / 1000)
  }

  /** Native ID picker. Keep the raw NativeScript index API on its separate path. */
  function attachPicker(view: NSView, initial: PropBag, onSelect: (id: string) => void) {
    if (!view || typeof view.addSubview !== 'function' || !deps.actions.buttonActionTarget) {
      return null
    }

    let control: ReturnType<typeof deps.pickerElements.makePopUpControl>

    try {
      control = deps.pickerElements.makePopUpControl()
    } catch {
      return null
    }

    const picker = control.view,
      action = control.action

    let active = true,
      attached = false,
      selecting = false,
      writing = 0,
      enabled = false,
      version = 0

    let options: { id: string; title: string; disabled: boolean }[] = [],
      items: NSMenuItem[] = []

    let label: string | undefined,
      initialized = false

    const constraints: { active: boolean }[] = []
    const detach = () => {
      if (!active) {
        return
      }

      active = false
      attached = false
      version++
      action.release()
      try {
        picker.menu?.cancelTracking()
      } catch {}

      try {
        picker.target = null
        picker.action = null as unknown as string
      } catch {}

      for (const constraint of constraints) {
        try {
          constraint.active = false
        } catch {}
      }

      try {
        picker.removeAllItems()
      } catch {}

      items = []
      options = []
      try {
        picker.removeFromSuperview()
      } catch {}
    }

    const apply = (next: PropBag) => {
      const ids = new Set<string>()

      if (!Array.isArray(next.options)) {
        throw Error('Invalid picker choices')
      }

      const nextOptions = next.options.map((item: any) => {
        if (typeof item.id !== 'string' || typeof item.title !== 'string' || ids.has(item.id)) {
          throw Error('Invalid picker choices')
        }

        ids.add(item.id)
        return { id: item.id, title: item.title, disabled: !!item.disabled }
      })

      if (
        next.selection !== undefined &&
        (typeof next.selection !== 'string' || !ids.has(next.selection))
      ) {
        throw Error('Invalid picker selection')
      }

      const nextEnabled = next.enabled !== false && nextOptions.some((item: any) => !item.disabled)
      const changed =
        !initialized ||
        options.length !== nextOptions.length ||
        options.some(
          (item, i) =>
            item.id !== nextOptions[i].id ||
            item.title !== nextOptions[i].title ||
            item.disabled !== nextOptions[i].disabled,
        )

      enabled = nextEnabled
      picker.enabled = enabled
      if (changed) {
        version++
        action.setHandler(undefined)
        picker.menu?.cancelTracking()
        picker.autoenablesItems = false
        picker.menu.autoenablesItems = false
        picker.removeAllItems()
        items = []
        for (const option of nextOptions) {
          // Explicit items preserve duplicate/empty titles; IDs never depend on labels.
          const item = NSMenuItem.alloc().initWithTitleActionKeyEquivalent(option.title, null, '')

          item.enabled = !option.disabled
          picker.menu.addItem(item)
          items.push(item)
        }

        options = nextOptions
        initialized = true
        picker.invalidateIntrinsicContentSize()
      } else if (!enabled) {
        picker.menu?.cancelTracking()
      }

      const nextLabel = String(next.accessibilityLabel ?? '')

      if (label !== nextLabel) {
        picker.accessibilityLabel = nextLabel
        label = nextLabel
      }

      const index = options.findIndex((item) => item.id === next.selection)

      if (Number(picker.indexOfSelectedItem) !== index) {
        picker.selectItemAtIndex(index)
      }

      const ownedVersion = version

      action.setHandler(() => {
        if (
          !active ||
          !attached ||
          selecting ||
          writing ||
          !enabled ||
          version !== ownedVersion ||
          picker.superview !== view ||
          !view.window
        ) {
          return
        }

        const nativeEnabled = (picker as any).isEnabled
        const nativeState =
          typeof nativeEnabled === 'function'
            ? nativeEnabled.call(picker)
            : (nativeEnabled ?? picker.enabled)

        if (nativeState === false || nativeState === 0) {
          return
        }

        const index = Number(picker.indexOfSelectedItem),
          item = items[index],
          option = options[index]

        if (!Number.isSafeInteger(index) || index < 0 || !item || !option || option.disabled) {
          return
        }

        const selected = picker.selectedItem

        if (!(selected === item || selected?.isEqual?.(item))) {
          return
        }

        const nativeItemEnabled = (item as any).isEnabled
        const itemState =
          typeof nativeItemEnabled === 'function'
            ? nativeItemEnabled.call(item)
            : (nativeItemEnabled ?? item.enabled)

        if (itemState === false || itemState === 0) {
          return
        }

        selecting = true
        try {
          onSelect(option.id)
        } catch {
          console.error('[macos-leaf] picker change failed')
        } finally {
          selecting = false
        }
      })
    }

    try {
      writing++
      try {
        apply(initial)
      } finally {
        writing--
      }

      view.addSubview(picker)
      for (const edge of [
        'leadingAnchor',
        'trailingAnchor',
        'topAnchor',
        'bottomAnchor',
      ] as const) {
        const constraint = picker[edge].constraintEqualToAnchor(view[edge])

        constraints.push(constraint)
        constraint.active = true
      }

      attached = true
      return {
        update(next: PropBag) {
          if (!active) {
            return
          }

          writing++
          try {
            apply(next)
          } catch (error) {
            detach()
            throw error
          } finally {
            writing--
          }
        },
        detach,
      }
    } catch {
      detach()
      return null
    }
  }

  /** Embeds a real NSDatePicker inside the leaf's backing view, pinned to its
   *  edges — the leaf gives the host element an explicit size. mode 'date'
   *  uses YearMonthDay (text field by default, `style: 'graphical'` for the
   *  inline calendar); 'time' uses HourMinute with the clock-and-calendar
   *  field. Returns a handle with update/detach. */
  function attachDatePicker(view: NSView, options: PropBag, onChange: (event: any) => void) {
    if (
      !view ||
      typeof view.addSubview !== 'function' ||
      typeof NSDatePicker?.alloc !== 'function' ||
      !deps.actions.buttonActionTarget
    ) {
      return null
    }

    const isTime = options?.mode === 'time'
    const isBoth = options?.mode === 'dateAndTime'
    let picker: NSDatePicker

    try {
      picker = NSDatePicker.alloc().init()
    } catch {
      return null
    }

    const action = deps.actions.allocate(picker)
    let active = true,
      writing = 0,
      enabled = false

    let minimum: number | undefined, maximum: number | undefined
    let rangeInitialized = false,
      accessibilityLabel: string | undefined

    const constraints: { active: boolean }[] = []
    const detach = () => {
      if (!active) {
        return
      }

      active = false
      action.release()
      try {
        picker.target = null
        picker.action = null as unknown as string
      } catch {}

      for (const constraint of constraints) {
        try {
          constraint.active = false
        } catch {}
      }

      try {
        picker.removeFromSuperview()
      } catch {}
    }

    try {
      picker.datePickerElements = isTime
        ? (DATE_PICKER_ELEMENTS.HourMinute ?? 0x000c)
        : isBoth
          ? (DATE_PICKER_ELEMENTS.YearMonthDay ?? 0x00e0) |
            (DATE_PICKER_ELEMENTS.HourMinute ?? 0x000c)
          : (DATE_PICKER_ELEMENTS.YearMonthDay ?? 0x00e0)

      picker.datePickerStyle =
        !isTime && !isBoth && options?.style === 'graphical'
          ? (DATE_PICKER_STYLES.ClockAndCalendar ?? 1)
          : isTime
            ? (DATE_PICKER_STYLES.ClockAndCalendar ?? 1)
            : (DATE_PICKER_STYLES.TextField ?? 2)

      const apply = (next: PropBag) => {
        const min = next?.minimumMillis ?? undefined,
          max = next?.maximumMillis ?? undefined

        const selected = next?.selectionMillis ?? undefined
        const valid = (value: number | undefined) =>
          value === undefined ||
          (Number.isFinite(value) && Number.isFinite(new Date(value).getTime()))

        const validInput =
          valid(min) &&
          valid(max) &&
          valid(selected) &&
          !(min !== undefined && max !== undefined && min > max) &&
          !(
            selected !== undefined &&
            ((min !== undefined && selected < min) || (max !== undefined && selected > max))
          )

        enabled = next?.enabled !== false && validInput
        picker.enabled = enabled

        const label = String(next?.accessibilityLabel ?? '')

        if (label !== accessibilityLabel) {
          picker.accessibilityLabel = label
          accessibilityLabel = label
        }

        if (!validInput) {
          return
        }

        // Clear old bounds before a disjoint replacement. Range/selection writes
        // are programmatic and must never publish controlChanged echoes.
        if (!rangeInitialized || minimum !== min || maximum !== max) {
          picker.minDate = null as unknown as NSDate
          picker.maxDate = null as unknown as NSDate
          picker.minDate = dateFromMillis(min) as NSDate
          picker.maxDate = dateFromMillis(max) as NSDate
          minimum = min
          maximum = max
          rangeInitialized = true
        }

        const date = dateFromMillis(selected)
        const seconds = picker.dateValue?.timeIntervalSince1970

        if (date && (typeof seconds !== 'number' || Math.round(seconds * 1000) !== selected)) {
          picker.dateValue = date
        }
      }

      writing++
      try {
        apply(options)
      } finally {
        writing--
      }

      picker.translatesAutoresizingMaskIntoConstraints = false
      view.addSubview(picker)
      for (const edge of [
        'leadingAnchor',
        'trailingAnchor',
        'topAnchor',
        'bottomAnchor',
      ] as const) {
        const constraint = picker[edge].constraintEqualToAnchor(view[edge])

        constraints.push(constraint)
        constraint.active = true
      }

      picker.tag = action.id
      picker.target = deps.actions.buttonActionTarget
      picker.action = 'controlChanged:'
      action.setHandler(() => {
        if (!active || writing || !enabled || picker.superview !== view || !view.window) {
          return
        }

        const nativeEnabled = (picker as any).isEnabled
        const nativeState =
          typeof nativeEnabled === 'function' ? nativeEnabled.call(picker) : nativeEnabled

        if (nativeState === false || nativeState === 0) {
          return
        }

        const date = picker.dateValue
        const rawMillis =
          typeof date?.timeIntervalSince1970 === 'number' ? date.timeIntervalSince1970 * 1000 : null

        const millis = rawMillis === null ? null : Math.round(rawMillis)

        if (
          millis === null ||
          !Number.isFinite(millis) ||
          !Number.isFinite(new Date(millis).getTime()) ||
          (minimum !== undefined && millis < minimum) ||
          (maximum !== undefined && millis > maximum)
        ) {
          return
        }

        try {
          onChange?.(millis)
        } catch {
          console.error('[macos-leaf] date-picker change failed')
        }
      })

      return {
        update(next: PropBag) {
          if (!active) {
            return
          }

          writing++
          try {
            apply(next)
          } catch (error) {
            detach()
            throw error
          } finally {
            writing--
          }
        },
        detach,
      }
    } catch {
      detach()
      return null
    }
  }

  return {
    attachPicker,
    attachDatePicker,
  }
}

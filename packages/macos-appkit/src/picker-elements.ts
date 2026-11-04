import type { Actions } from './actions'
import type { Layout } from './layout'
import type { CssCascade } from './css-cascade'
import type { Accessibility } from './accessibility'
import type { Tree } from './tree'
import type { PropBag, ElementNode } from './model'
import {
  NSDate,
  NSDatePicker,
  NSDatePickerElementFlags,
  NSDatePickerMode,
  NSDatePickerStyle,
  NSMenuItem,
  NSPopUpButton,
  NSSegmentedControl,
  NSSegmentSwitchTracking,
} from '@octane-xplat/platform/macos'
import { nativeColor } from './native-colors'

interface Dependencies {
  actions: Pick<
    Actions,
    'buttonActionTarget' | 'nextActionId' | 'actionHandlers' | 'setControlAction'
  >
  layout: Pick<Layout, 'queueLayoutReconcile'>
  cssCascade: Pick<CssCascade, 'setNodeInlineStyle' | 'applyClassName'>
  accessibility: Pick<Accessibility, 'applyAccessibility'>
  tree: Pick<Tree, 'detach'>
}
export type PickerElements = ReturnType<typeof createPickerElements>

export function createPickerElements(deps: Dependencies) {
  /** Native control/action allocation shared by raw indices and authentic ID pickers. */
  function makePopUpControl() {
    const view = NSPopUpButton.alloc().initWithFramePullsDown(
      {
        origin: { x: 0, y: 0 },
        size: { width: 120, height: 26 },
      },
      false,
    )

    view.target = deps.actions.buttonActionTarget
    view.action = 'controlChanged:'
    view.translatesAutoresizingMaskIntoConstraints = false
    const actionId = deps.actions.nextActionId++
    view.tag = actionId
    deps.actions.actionHandlers.set(actionId, null)
    return { view, actionId }
  }

  /** A noneditable AppKit picker for the shared NativeScript item/index API. */
  function makeListPicker(node: ElementNode) {
    const control = makePopUpControl()
    node.listPickerIndex = -1
    node.listPickerRequested = -1
    return control
  }

  function notifyListPickerChange(node: ElementNode, value: number) {
    const oldValue = node.listPickerIndex
    node.listPickerIndex = value
    if (value !== oldValue && typeof node.props.onSelectedIndexChange === 'function') {
      node.props.onSelectedIndexChange({
        eventName: 'selectedIndexChange',
        object: node.view,
        value,
        oldValue,
      })
    }
  }

  function syncListPicker(node: ElementNode) {
    const view = node.view! as NSPopUpButton
    const items = node.props.items ?? []
    const titles = Array.from(items, (item, index) => (item == null ? String(index) : item + ''))
    // Adding by title can merge duplicate labels. Explicit menu items preserve
    // every entry and its index, including empty or repeated labels.
    if (
      !node.listPickerTitles ||
      titles.length !== node.listPickerTitles.length ||
      titles.some((title, index) => title !== node.listPickerTitles[index])
    ) {
      view.removeAllItems()
      for (const title of titles) {
        view.menu!.addItem(NSMenuItem.alloc().initWithTitleActionKeyEquivalent(title, null, ''))
      }

      node.listPickerTitles = titles
      view.invalidateIntrinsicContentSize()
    }

    if (!Object.is(node.listPickerInput, node.props.selectedIndex)) {
      node.listPickerRequested = node.props.selectedIndex ?? -1
      node.listPickerInput = node.props.selectedIndex
    }

    const value = titles.length
      ? Math.max(0, Math.min(node.listPickerRequested, titles.length - 1))
      : -1

    view.selectItemAtIndex(value)
    deps.actions.setControlAction(
      node,
      () => {
        const index = Number(view.indexOfSelectedItem)
        node.listPickerRequested = index
        notifyListPickerChange(node, index)
      },
      () => undefined,
    )

    notifyListPickerChange(node, value)
  }

  /** Raw shared SegmentedBar: ordered item titles with one retained selection. */
  function makeSegmentedBar(node: ElementNode) {
    const view = NSSegmentedControl.segmentedControlWithLabelsTrackingModeTargetAction(
      [],
      NSSegmentSwitchTracking.SelectOne,
      deps.actions.buttonActionTarget,
      'controlChanged:',
    )

    view.translatesAutoresizingMaskIntoConstraints = false
    view.selectedSegmentBezelColor = nativeColor('#0000ff')
    const actionId = deps.actions.nextActionId++
    view.tag = actionId
    deps.actions.actionHandlers.set(actionId, null)
    node.segmentedBarIndex = -1
    node.segmentedBarRequested = -1
    return { view, actionId }
  }

  function notifySegmentedBarChange(node: ElementNode, value: number) {
    const oldIndex = node.segmentedBarIndex
    node.segmentedBarIndex = value
    if (value !== oldIndex && typeof node.props.onSelectedIndexChange === 'function') {
      node.props.onSelectedIndexChange({
        eventName: 'selectedIndexChange',
        object: node.view,
        value,
        oldIndex,
        newIndex: value,
      })
    }
  }

  function syncSegmentedBar(node: ElementNode) {
    const view = node.view! as NSSegmentedControl
    // Builder items precede authored children, matching NativeScript's append path.
    const titles = [
      ...Array.from(node.props.items ?? [], (item: any) => String(item.title ?? '')),
      ...node.children.map((item) => item.props.title ?? ''),
    ]

    if (
      !node.segmentedBarTitles ||
      titles.length !== node.segmentedBarTitles.length ||
      titles.some((title, index) => title !== node.segmentedBarTitles[index])
    ) {
      view.segmentCount = titles.length
      for (const [index, title] of titles.entries()) {
        view.setLabelForSegment(title, index)
      }

      node.segmentedBarTitles = titles
      view.invalidateIntrinsicContentSize()
      deps.layout.queueLayoutReconcile(node.container, node.parent)
    }

    if (!Object.is(node.segmentedBarInput, node.props.selectedIndex)) {
      node.segmentedBarRequested = node.props.selectedIndex ?? -1
      node.segmentedBarInput = node.props.selectedIndex
    }

    const value = titles.length
      ? Math.max(0, Math.min(node.segmentedBarRequested, titles.length - 1))
      : -1

    view.selectedSegment = value
    deps.actions.setControlAction(
      node,
      () => {
        const index = Number(view.selectedSegment)
        node.segmentedBarRequested = index
        notifySegmentedBarChange(node, index)
      },
      () => undefined,
    )

    notifySegmentedBarChange(node, value)
  }

  /** Shared time-of-day values discard calendar dates, seconds and milliseconds. */
  function timeOfDay(value: Date | string): Date {
    if (typeof value === 'string') {
      const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value)
      if (
        !match ||
        match[0] !== value ||
        Number(match[1]) > 23 ||
        Number(match[2]) > 59 ||
        Number(match[3] ?? 0) > 59
      ) {
        throw new TypeError(
          'AppKit timepicker time must be a valid Date or 24-hour HH:mm[:ss] string',
        )
      }

      return new Date(0, 0, 0, Number(match[1]), Number(match[2]))
    }

    if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
      throw new TypeError(
        'AppKit timepicker time must be a valid Date or 24-hour HH:mm[:ss] string',
      )
    }

    return new Date(0, 0, 0, value.getHours(), value.getMinutes())
  }

  function makeTimePicker(node: ElementNode) {
    const view = NSDatePicker.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 100, height: 24 },
    })

    view.datePickerStyle = NSDatePickerStyle.TextFieldAndStepper
    view.datePickerElements = NSDatePickerElementFlags.HourMinute
    view.datePickerMode = NSDatePickerMode.Single
    view.bezeled = true
    view.drawsBackground = true
    view.target = deps.actions.buttonActionTarget
    view.action = 'controlChanged:'
    view.sizeToFit()
    view.translatesAutoresizingMaskIntoConstraints = false
    const actionId = deps.actions.nextActionId++
    view.tag = actionId
    deps.actions.actionHandlers.set(actionId, null)
    node.timePickerDefault = timeOfDay(new Date())
    node.timePickerValue = node.timePickerDefault
    node.timePickerBounds = [0, 1439]
    view.dateValue = NSDate.dateWithTimeIntervalSince1970(node.timePickerDefault.getTime() / 1000)
    return { view, actionId }
  }

  function notifyTimeChange(node: ElementNode, value: Date) {
    const normalized = timeOfDay(value)
    const [minimum, maximum] = node.timePickerBounds!
    const minutes = Math.min(
      Math.max(normalized.getHours() * 60 + normalized.getMinutes(), minimum),
      maximum,
    )

    const time = new Date(0, 0, 0, 0, minutes)
    const oldValue = node.timePickerValue!
    node.timePickerValue = time

    ;(node.view! as NSDatePicker).dateValue = NSDate.dateWithTimeIntervalSince1970(
      time.getTime() / 1000,
    )

    if (time.getHours() !== oldValue.getHours() || time.getMinutes() !== oldValue.getMinutes()) {
      if (typeof node.props.onTimeChange === 'function') {
        node.props.onTimeChange({
          eventName: 'timeChange',
          object: node.view,
          value: new Date(time),
          oldValue: new Date(oldValue),
        })
      }
    }
  }

  function syncTimePicker(node: ElementNode, props: PropBag) {
    const view = node.view! as NSDatePicker
    const minimum = (node.props.minHour ?? 0) * 60 + (node.props.minMinute ?? 0)
    const maximum = (node.props.maxHour ?? 23) * 60 + (node.props.maxMinute ?? 59)
    // Bounds are one atomic range. Never partially apply an inverted proposal.
    if (minimum <= maximum) {
      node.timePickerBounds = [minimum, maximum]
    }

    const [lower, upper] = node.timePickerBounds!
    view.minDate = null as any
    view.maxDate = null as any
    view.minDate = NSDate.dateWithTimeIntervalSince1970(
      new Date(0, 0, 0, 0, lower).getTime() / 1000,
    )
    view.maxDate = NSDate.dateWithTimeIntervalSince1970(
      new Date(0, 0, 0, 0, upper).getTime() / 1000,
    )
    let time = new Date(node.timePickerValue!)
    const previous = node.timePickerInputs ?? {}
    for (const name of Object.keys(props)) {
      if (!['time', 'hour', 'minute'].includes(name)) {
        continue
      }

      const value = props[name]
      if (name === 'time') {
        const next = value == null ? node.timePickerDefault! : timeOfDay(value)
        const old = previous.time == null ? node.timePickerDefault! : timeOfDay(previous.time)
        if (
          (value == null) === (previous.time == null) &&
          next.getHours() === old.getHours() &&
          next.getMinutes() === old.getMinutes()
        ) {
          continue
        }

        time = new Date(next)
      } else if (!Object.is(previous[name], value)) {
        if (name === 'hour') {
          time.setHours(value ?? node.timePickerDefault!.getHours())
        } else {
          time.setMinutes(value ?? node.timePickerDefault!.getMinutes())
        }
      }
    }

    // Keep copies so mutating a caller-owned Date cannot alter equality history.
    node.timePickerInputs = {
      ...node.props,
      time: node.props.time == null ? undefined : timeOfDay(node.props.time),
    }

    view.enabled = node.props.isEnabled !== false
    deps.actions.setControlAction(
      node,
      () => notifyTimeChange(node, new Date(Number(view.dateValue!.timeIntervalSince1970) * 1000)),
      () => undefined,
    )

    notifyTimeChange(node, time)
  }

  /** DatePicker's shared values carry a local calendar day, never time-of-day. */
  function calendarDate(value: Date | string): Date {
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) {
      throw new Error('AppKit datepicker requires a valid date')
    }

    date.setHours(0, 0, 0, 0)
    return date
  }

  function makeDatePicker(node: ElementNode) {
    const view = NSDatePicker.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 140, height: 24 },
    })

    view.datePickerStyle = NSDatePickerStyle.TextFieldAndStepper
    view.datePickerElements = NSDatePickerElementFlags.YearMonthDay
    view.datePickerMode = NSDatePickerMode.Single
    view.bezeled = true
    view.drawsBackground = true
    view.dateValue = NSDate.dateWithTimeIntervalSince1970(calendarDate(new Date()).getTime() / 1000)
    view.target = deps.actions.buttonActionTarget
    view.action = 'controlChanged:'
    view.sizeToFit()
    view.translatesAutoresizingMaskIntoConstraints = false
    const actionId = deps.actions.nextActionId++
    view.tag = actionId
    deps.actions.actionHandlers.set(actionId, null)
    node.datePickerDefault = calendarDate(new Date())
    node.datePickerValue = node.datePickerDefault
    return { view, actionId }
  }

  function notifyDateChange(node: ElementNode, value: Date) {
    const oldValue = node.datePickerValue as Date
    const date = calendarDate(value)
    node.datePickerValue = date

    ;(node.view! as NSDatePicker).dateValue = NSDate.dateWithTimeIntervalSince1970(
      date.getTime() / 1000,
    )

    if (date.getTime() !== oldValue.getTime() && typeof node.props.onDateChange === 'function') {
      node.props.onDateChange({
        eventName: 'dateChange',
        object: node.view,
        value: new Date(date),
        oldValue: new Date(oldValue),
      })
    }
  }

  function syncDatePicker(node: ElementNode, props: PropBag) {
    const view = node.view! as NSDatePicker
    // Clear both old bounds before applying a new range, so moving the range
    // does not leave AppKit temporarily constrained by the previous endpoint.
    view.minDate = null as any
    view.maxDate = null as any
    if (node.props.minDate != null) {
      view.minDate = NSDate.dateWithTimeIntervalSince1970(
        calendarDate(node.props.minDate).getTime() / 1000,
      )
    }

    if (node.props.maxDate != null) {
      view.maxDate = NSDate.dateWithTimeIntervalSince1970(
        calendarDate(node.props.maxDate).getTime() / 1000,
      )
    }

    let date = new Date(node.datePickerValue as Date)
    const previous = node.datePickerInputs ?? {}
    // Property order matches NativeScript's sequential setters. An explicit
    // date sets all components; subsequent component props adjust that date.
    for (const name of Object.keys(props)) {
      if (
        !['date', 'year', 'month', 'day'].includes(name) ||
        Object.is(previous[name], props[name])
      ) {
        continue
      }

      const value = props[name]
      if (name === 'date') {
        date = value == null ? new Date(node.datePickerDefault as Date) : calendarDate(value)
      } else if (name === 'year') {
        date.setFullYear(value ?? (node.datePickerDefault as Date).getFullYear())
      } else if (name === 'month') {
        date.setMonth((value ?? (node.datePickerDefault as Date).getMonth() + 1) - 1)
      } else {
        date.setDate(value ?? (node.datePickerDefault as Date).getDate())
      }
    }

    node.datePickerInputs = { ...node.props }
    if (node.props.minDate != null && date < calendarDate(node.props.minDate)) {
      date = calendarDate(node.props.minDate)
    }

    if (node.props.maxDate != null && date > calendarDate(node.props.maxDate)) {
      date = calendarDate(node.props.maxDate)
    }

    view.enabled = node.props.isEnabled !== false
    deps.actions.setControlAction(
      node,
      () => notifyDateChange(node, new Date(Number(view.dateValue!.timeIntervalSince1970) * 1000)),
      () => undefined,
    )

    notifyDateChange(node, date)
  }
  function applyBuiltinSegmentedBarProp(node: ElementNode, name: string, value: PropBag[string]) {
    if (['items', 'selectedIndex', 'onSelectedIndexChange', 'id'].includes(name)) {
      return
    } else if (name === 'style') {
      deps.cssCascade.setNodeInlineStyle(node, value)
    } else if (name === 'className') {
      deps.cssCascade.applyClassName(node, value)
    } else if (name === 'accessible' || name.startsWith('accessibility')) {
      deps.accessibility.applyAccessibility(node, name, value)
    } else if (name.startsWith('on') && value == null) {
      return
    } else if (value !== undefined) {
      console.warn('[macos-host] ignored segmentedbar prop ' + name)
    }
  }

  function applyBuiltinListPickerProp(node: ElementNode, name: string, value: PropBag[string]) {
    if (['items', 'selectedIndex', 'onSelectedIndexChange', 'id'].includes(name)) {
      return
    } else if (name === 'style') {
      deps.cssCascade.setNodeInlineStyle(node, value)
    } else if (name === 'className') {
      deps.cssCascade.applyClassName(node, value)
    } else if (name === 'accessible' || name.startsWith('accessibility')) {
      deps.accessibility.applyAccessibility(node, name, value)
    } else if (name.startsWith('on') && value == null) {
      return
    } else if (value !== undefined) {
      console.warn('[macos-host] ignored listpicker prop ' + name)
    }
  }

  function applyBuiltinTimePickerProp(node: ElementNode, name: string, value: PropBag[string]) {
    if (
      [
        'time',
        'hour',
        'minute',
        'minHour',
        'minMinute',
        'maxHour',
        'maxMinute',
        'isEnabled',
        'onTimeChange',
        'id',
      ].includes(name)
    ) {
      return
    } else if (name === 'style') {
      deps.cssCascade.setNodeInlineStyle(node, value)
    } else if (name === 'className') {
      deps.cssCascade.applyClassName(node, value)
    } else if (name === 'accessible' || name.startsWith('accessibility')) {
      deps.accessibility.applyAccessibility(node, name, value)
    } else if (name.startsWith('on') && value == null) {
      return
    } else if (value !== undefined) {
      console.warn('[macos-host] ignored timepicker prop ' + name)
    }
  }

  function applyBuiltinDatePickerProp(node: ElementNode, name: string, value: PropBag[string]) {
    if (
      [
        'date',
        'minDate',
        'maxDate',
        'year',
        'month',
        'day',
        'isEnabled',
        'onDateChange',
        'id',
      ].includes(name)
    ) {
      return
    } else if (name === 'style') {
      deps.cssCascade.setNodeInlineStyle(node, value)
    } else if (name === 'className') {
      deps.cssCascade.applyClassName(node, value)
    } else if (name === 'accessible' || name.startsWith('accessibility')) {
      deps.accessibility.applyAccessibility(node, name, value)
    } else if (name.startsWith('on') && value == null) {
      return
    } else if (value !== undefined) {
      console.warn('[macos-host] ignored datepicker prop ' + name)
    }
  }

  function disposeBuiltinSegmentedItem(node: ElementNode) {
    if (node.type === 'segmentedbaritem') {
      deps.tree.detach(node.container, node)
      node.props.title = undefined
    }
  }

  function disposeBuiltinSegmentedChildren(node: ElementNode) {
    if (node.type === 'segmentedbar') {
      for (const child of node.children.slice()) {
        deps.tree.detach(node.container, child)
      }
    }
  }

  function disposeBuiltinSegmentedControl(node: ElementNode) {
    if (node.type === 'segmentedbar' && node.view) {
      node.view.target = null
      node.view.action = null
      node.view.segmentCount = 0
      node.segmentedBarTitles = null
      node.props.items = undefined
      node.props.onSelectedIndexChange = undefined
    }
  }

  function disposeBuiltinListPicker(node: ElementNode) {
    if (node.type === 'listpicker' && node.view) {
      node.view.target = null
      node.view.action = null
      node.view.removeAllItems()
      node.listPickerTitles = null
      node.props.onSelectedIndexChange = undefined
    }
  }

  function disposeBuiltinTimePicker(node: ElementNode) {
    if (node.type === 'timepicker' && node.view) {
      node.view.target = null
      node.view.action = null
      node.props.onTimeChange = undefined
      node.timePickerInputs = undefined
    }
  }

  function disposeBuiltinDatePicker(node: ElementNode) {
    if (node.type === 'datepicker' && node.view) {
      node.view.target = null
      node.view.action = null
      node.props.onDateChange = undefined
    }
  }

  return {
    makePopUpControl,
    makeListPicker,
    notifyListPickerChange,
    syncListPicker,
    makeSegmentedBar,
    notifySegmentedBarChange,
    syncSegmentedBar,
    timeOfDay,
    makeTimePicker,
    notifyTimeChange,
    syncTimePicker,
    calendarDate,
    makeDatePicker,
    notifyDateChange,
    syncDatePicker,
    applyBuiltinSegmentedBarProp,
    applyBuiltinListPickerProp,
    applyBuiltinTimePickerProp,
    applyBuiltinDatePickerProp,
    disposeBuiltinSegmentedItem,
    disposeBuiltinSegmentedChildren,
    disposeBuiltinSegmentedControl,
    disposeBuiltinListPicker,
    disposeBuiltinTimePicker,
    disposeBuiltinDatePicker,
  }
}

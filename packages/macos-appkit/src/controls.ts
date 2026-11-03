import {
  NSBezelStyle,
  NSBorderType,
  NSButton,
  NSButtonType,
  NSColor,
  NSControlSize,
  NSDate,
  NSDatePicker,
  NSDatePickerElementFlags,
  NSDatePickerMode,
  NSDatePickerStyle,
  NSMenuItem,
  NSNotificationCenter,
  NSPopUpButton,
  NSProgressIndicator,
  NSProgressIndicatorStyle,
  NSScrollView,
  NSSegmentedControl,
  NSSegmentSwitchTracking,
  NSSlider,
  NSTextAlignment,
  NSTextField,
  NSView,
  NSViewBoundsDidChangeNotification,
} from '@octane-xplat/platform/macos'
import type { PropBag, ElementNode } from './model'
import { makeMasonHostView } from './mason'
import { nativeColor } from './native-colors'

import type { createActions } from './actions'
import type { createTextElements } from './text-elements'
import type { createNativeStyle } from './native-style'
import type { createLayout } from './layout'

interface Dependencies {
  actions: Pick<
    ReturnType<typeof createActions>,
    | 'nextActionId'
    | 'actionIdsByView'
    | 'actionHandlers'
    | 'buttonActionTarget'
    | 'setControlAction'
  >
  textElements: Pick<ReturnType<typeof createTextElements>, 'PaddedLabelCell'>
  nativeStyle: Pick<ReturnType<typeof createNativeStyle>, 'fontForStyle'>
  layout: Pick<ReturnType<typeof createLayout>, 'queueLayoutReconcile'>
}

export function createControls(deps: Dependencies) {
  const scrollHandlers = new WeakMap<object, () => void>()

  /** Reconcile one gravity area with the children's desired views. Only
   *  re-parented children land in `moved` — detaching a view that is (or
   *  contains) the first responder ends the active editing session. */

  /** Allocate the action/AX identity. setAction independently owns the click
   * recognizer, including callbacks added after a semantic-only initial mount. */
  function wireViewAction(view: NSView, props: PropBag): number | undefined {
    const interactive = typeof props.onTap === 'function' || props.accessibilityRole === 'button'

    // Accessibility props need the AX id too — a 'checkbox'/'link' role or a
    // bare accessibilityLabel must not drop every accessibility prop.
    const actionId =
      interactive || props.accessibilityRole !== undefined || props.accessibilityLabel !== undefined
        ? deps.actions.nextActionId++
        : undefined

    if (actionId !== undefined) {
      deps.actions.actionIdsByView.set(view, actionId)
      deps.actions.actionHandlers.set(actionId, null)
    }

    return actionId
  }

  function makeLabel(): NSTextField {
    const label = NSTextField.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 400, height: 32 },
    })

    label.cell = deps.textElements.PaddedLabelCell.alloc().initTextCell('')
    label.bezeled = false
    label.drawsBackground = false
    label.editable = false
    label.selectable = false
    label.alignment = NSTextAlignment.Left
    label.cell.wraps = true
    label.cell.usesSingleLineMode = false
    label.translatesAutoresizingMaskIntoConstraints = false
    label.font = deps.nativeStyle.fontForStyle(16)
    label.textColor = NSColor.labelColor
    return label
  }

  function makeButton(props: PropBag) {
    const button = NSButton.buttonWithTitleTargetAction(
      String(props.title ?? 'Button'),
      deps.actions.buttonActionTarget,
      'buttonPressed:',
    )

    button.bezelStyle = NSBezelStyle.Rounded
    button.setButtonType(NSButtonType.MomentaryLight)
    button.translatesAutoresizingMaskIntoConstraints = false
    const actionId = deps.actions.nextActionId++
    button.tag = actionId
    deps.actions.actionHandlers.set(actionId, null)
    return { view: button, actionId }
  }

  function makeScrollView(node: ElementNode) {
    const scroll = NSScrollView.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 480, height: 320 },
    })

    // The document view is a mason host — the engine sizes it to content and
    // pins scroll children inside it.
    const content = makeMasonHostView(node)
    scroll.hasVerticalScroller = true
    scroll.drawsBackground = false
    scroll.borderType = NSBorderType.No
    scroll.translatesAutoresizingMaskIntoConstraints = false
    scroll.documentView = content
    return { view: scroll, childHost: content }
  }

  function setScrollAction(node: ElementNode, handler: ((event: any) => void) | undefined) {
    const clipView = (node.view! as NSScrollView).contentView
    if (typeof handler !== 'function') {
      scrollHandlers.delete(clipView)
      return
    }

    if (!node.scrollObserverInstalled) {
      clipView.postsBoundsChangedNotifications = true
      node.scrollObserver =
        NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
          NSViewBoundsDidChangeNotification,
          clipView,
          null,
          () => scrollHandlers.get(clipView)?.(),
        )

      node.scrollObserverInstalled = true
    }

    scrollHandlers.set(clipView, () => {
      const startedAt = performance.now()
      const bounds = clipView.bounds
      const contentHeight = Number(
        (node.view! as NSScrollView).documentView?.frame?.size?.height ?? 0,
      )

      const event = {
        verticalOffset: Number(bounds.origin.y ?? 0),
        viewportHeight: Number(bounds.size.height ?? 0),
        contentHeight,
      }

      try {
        node.container.root!.eventScope('discrete', () => handler(event))
      } catch (error) {
        console.error('[macos-event] scroll handler failed', error)
      }

      if ((process.env as { [key: string]: string | undefined }).OCTANE_MACOS_AUTOMATION === '1') {
        node.scrollMetrics ??= { events: [] }
        const sample = {
          verticalOffset: event.verticalOffset,
          callbackMs: performance.now() - startedAt,
          mountedRows: null as number | null,
          afterEventMs: null as number | null,
        }

        node.scrollMetrics.events.push(sample)
        if (node.scrollMetrics.events.length > 2000) {
          node.scrollMetrics.events.shift()
        }

        setTimeout(() => {
          sample.afterEventMs = performance.now() - startedAt
          sample.mountedRows = [...node.container.nodes.values()].filter(
            (candidate) =>
              /^(?:row-r|bench-row-)\d+$/.test(String(candidate.props.id ?? '')) &&
              candidate.parent !== null &&
              candidate.view?.superview != null,
          ).length
        }, 0)
      }
    })
  }

  function makeSwitch(props: PropBag) {
    const button = NSButton.buttonWithTitleTargetAction(
      '',
      deps.actions.buttonActionTarget,
      'controlChanged:',
    )
    button.setButtonType(NSButtonType.Switch)
    button.state = props.checked ? 1 : 0
    button.translatesAutoresizingMaskIntoConstraints = false
    const actionId = deps.actions.nextActionId++
    button.tag = actionId
    deps.actions.actionHandlers.set(actionId, null)
    return { view: button, actionId }
  }

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

  function makeProgress() {
    const view = NSProgressIndicator.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 140, height: 16 },
    })

    view.style = NSProgressIndicatorStyle.Bar
    view.controlSize = NSControlSize.Regular
    view.indeterminate = false
    view.displayedWhenStopped = true
    view.minValue = 0
    view.maxValue = 100
    view.doubleValue = 0
    view.sizeToFit()
    view.translatesAutoresizingMaskIntoConstraints = false
    return view
  }

  function syncProgress(node: ElementNode) {
    const view = node.view! as NSProgressIndicator
    const maximum = node.props.maxValue ?? 100
    // A positive native range keeps the degenerate shared case at 0%,
    // without asking AppKit to divide by zero or accept a negative range.
    view.maxValue = maximum > 0 ? maximum : 100
    view.doubleValue = maximum > 0 ? Math.min(Math.max(node.props.value ?? 0, 0), maximum) : 0
  }

  function makeActivityIndicator() {
    const view = NSProgressIndicator.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 16, height: 16 },
    })

    view.style = NSProgressIndicatorStyle.Spinning
    view.controlSize = NSControlSize.Regular
    view.indeterminate = true
    view.displayedWhenStopped = false
    view.sizeToFit()
    view.translatesAutoresizingMaskIntoConstraints = false
    return view
  }

  function syncActivityIndicator(node: ElementNode) {
    const view = node.view! as NSProgressIndicator
    if (node.props.busy === true) {
      view.startAnimation(null)
    } else {
      view.stopAnimation(null)
    }

    // NSStackView detaches hidden arranged views. Suppress drawing instead
    // so a stopped spinner retains its NativeScript-style layout slot.
    view.alphaValue = node.props.busy === true ? Number(node.appliedStyle?.opacity ?? 1) : 0
  }

  function makeSlider(props: PropBag) {
    const slider = NSSlider.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 140, height: 24 },
    })

    slider.minValue = Number(props.minValue ?? 0)
    slider.maxValue = Number(props.maxValue ?? 1)
    slider.doubleValue = Number(props.value ?? 0)
    slider.target = deps.actions.buttonActionTarget
    slider.action = 'controlChanged:'
    slider.translatesAutoresizingMaskIntoConstraints = false
    const actionId = deps.actions.nextActionId++
    slider.tag = actionId
    deps.actions.actionHandlers.set(actionId, null)
    return { view: slider, actionId }
  }
  return {
    scrollHandlers,
    wireViewAction,
    makeLabel,
    makeButton,
    makeScrollView,
    setScrollAction,
    makeSwitch,
    makePopUpControl,
    makeListPicker,
    syncListPicker,
    makeSegmentedBar,
    syncSegmentedBar,
    timeOfDay,
    makeTimePicker,
    syncTimePicker,
    calendarDate,
    makeDatePicker,
    syncDatePicker,
    makeProgress,
    syncProgress,
    makeActivityIndicator,
    syncActivityIndicator,
    makeSlider,
  }
}

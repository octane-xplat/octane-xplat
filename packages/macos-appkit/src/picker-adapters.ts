import type { ElementAdapter } from './element-adapter'
import type { ElementNode } from './model'
import type { PickerElements } from './picker-elements'
import type { Actions } from './actions'
import { FailureCollector } from './failures.ts'
import { nativeColor } from './native-colors'

export interface PickerAdapterDependencies {
  pickerElements: Pick<
    PickerElements,
    | 'timeOfDay'
    | 'calendarDate'
    | 'makeSegmentedBar'
    | 'applyBuiltinSegmentedBarProp'
    | 'syncSegmentedBar'
    | 'makeListPicker'
    | 'applyBuiltinListPickerProp'
    | 'syncListPicker'
    | 'makeTimePicker'
    | 'applyBuiltinTimePickerProp'
    | 'syncTimePicker'
    | 'makeDatePicker'
    | 'applyBuiltinDatePickerProp'
    | 'syncDatePicker'
    | 'disposeBuiltinSegmentedItem'
    | 'disposeBuiltinSegmentedChildren'
    | 'disposeBuiltinSegmentedControl'
    | 'disposeBuiltinListPicker'
    | 'disposeBuiltinTimePicker'
    | 'disposeBuiltinDatePicker'
  >
  actions: Pick<Actions, 'disposeActions'>
}

export type PickerAdapters = Readonly<Record<string, ElementAdapter>>

export function createPickerAdapters(deps: PickerAdapterDependencies): PickerAdapters {
  function dispose(node: ElementNode, release: (node: ElementNode) => void) {
    const failures = new FailureCollector()

    failures.run('picker actions', () => deps.actions.disposeActions(node))
    failures.run('picker state', () => release(node))
    failures.throwIfFailed()
  }

  return {
    listpicker: {
      container: false,
      hasView: true,
      validate(props) {
        if (props?.items != null && !Array.isArray(props.items)) {
          throw new Error('AppKit listpicker items must be an array')
        }

        if (props?.selectedIndex != null && !Number.isInteger(props.selectedIndex)) {
          throw new Error('AppKit listpicker selectedIndex must be an integer')
        }

        // Validate item conversion before allocating a view or registration.
        for (const item of props?.items ?? []) {
          if (item != null) {
            void (item + '')
          }
        }
      },
      create(node) {
        node.view = deps.pickerElements.makeListPicker(node).view
      },
      applyProp(node, name, value) {
        deps.pickerElements.applyBuiltinListPickerProp(node, name, value)
        return true
      },
      afterProps(node, _patch) {
        deps.pickerElements.syncListPicker(node)
      },

      dispose(node) {
        dispose(node, deps.pickerElements.disposeBuiltinListPicker)
      },
    },
    datepicker: {
      container: false,
      hasView: true,
      validate(props) {
        for (const name of ['date', 'minDate', 'maxDate']) {
          if (props?.[name] != null) {
            if (!(props[name] instanceof Date) && typeof props[name] !== 'string') {
              throw new Error('AppKit datepicker ' + name + ' must be Date or string')
            }

            deps.pickerElements.calendarDate(props[name])
          }
        }

        for (const name of ['year', 'month', 'day']) {
          if (props?.[name] != null && !Number.isInteger(props[name])) {
            throw new Error('AppKit datepicker ' + name + ' must be an integer')
          }
        }
      },
      create(node) {
        node.view = deps.pickerElements.makeDatePicker(node).view
      },
      applyProp(node, name, value) {
        deps.pickerElements.applyBuiltinDatePickerProp(node, name, value)
        return true
      },
      afterProps(node, patch) {
        deps.pickerElements.syncDatePicker(node, patch)
      },

      dispose(node) {
        dispose(node, deps.pickerElements.disposeBuiltinDatePicker)
      },
    },
    timepicker: {
      container: false,
      hasView: true,
      validate(props) {
        if (props?.time != null) {
          deps.pickerElements.timeOfDay(props.time)
        }

        for (const name of ['hour', 'minute', 'minHour', 'minMinute', 'maxHour', 'maxMinute']) {
          const value = props?.[name]
          const maximum = name.toLowerCase().includes('hour') ? 23 : 59

          if (value != null && (!Number.isInteger(value) || value < 0 || value > maximum)) {
            throw new TypeError(
              'AppKit timepicker ' + name + ' must be an integer from 0 through ' + maximum,
            )
          }
        }
      },
      create(node) {
        node.view = deps.pickerElements.makeTimePicker(node).view
      },
      applyProp(node, name, value) {
        deps.pickerElements.applyBuiltinTimePickerProp(node, name, value)
        return true
      },
      afterProps(node, patch) {
        deps.pickerElements.syncTimePicker(node, patch)
      },

      dispose(node) {
        dispose(node, deps.pickerElements.disposeBuiltinTimePicker)
      },
    },
    segmentedbar: {
      container: false,
      hasView: true,
      validate(props) {
        if (props?.items != null && !Array.isArray(props.items)) {
          throw new Error('AppKit segmentedbar items must be an array')
        }

        for (const item of props?.items ?? []) {
          if (!item || typeof item !== 'object') {
            throw new Error('AppKit segmentedbar items must be objects with optional titles')
          }

          if (item.title != null && typeof item.title !== 'string') {
            throw new Error('AppKit segmentedbar item title must be a string')
          }
        }

        if (props?.selectedIndex != null && !Number.isInteger(props.selectedIndex)) {
          throw new Error('AppKit segmentedbar selectedIndex must be an integer')
        }

        if (props?.style?.selectedBackgroundColor != null) {
          nativeColor(props.style.selectedBackgroundColor)
        }
      },
      create(node) {
        node.view = deps.pickerElements.makeSegmentedBar(node).view
      },
      applyProp(node, name, value) {
        deps.pickerElements.applyBuiltinSegmentedBarProp(node, name, value)
        return true
      },
      afterProps(node, _patch) {
        deps.pickerElements.syncSegmentedBar(node)
      },
      prepareDispose: deps.pickerElements.disposeBuiltinSegmentedChildren,
      dispose(node) {
        dispose(node, deps.pickerElements.disposeBuiltinSegmentedControl)
      },
    },
    segmentedbaritem: {
      publicInstance: 'node',
      container: false,
      hasView: false,
      validate(props) {
        if (props?.title != null && typeof props.title !== 'string') {
          throw new Error('AppKit segmentedbaritem title must be a string')
        }
      },
      create() {},
      afterProps(node) {
        if (node.parent) {
          deps.pickerElements.syncSegmentedBar(node.parent)
        }
      },
      prepareDispose: deps.pickerElements.disposeBuiltinSegmentedItem,
    },
  }
}

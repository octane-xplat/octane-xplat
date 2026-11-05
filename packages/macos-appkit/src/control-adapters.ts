import type { ElementAdapter } from './element-adapter'
import type { Controls } from './controls'
import type { Actions } from './actions'

export interface ControlAdapterDependencies {
  controls: Pick<
    Controls,
    | 'makeSwitch'
    | 'makeSlider'
    | 'makeProgress'
    | 'makeActivityIndicator'
    | 'applyBuiltinSwitchProp'
    | 'applyBuiltinSliderProp'
    | 'applyBuiltinProgressProp'
    | 'applyBuiltinActivityIndicatorProp'
    | 'syncProgress'
    | 'syncActivityIndicator'
    | 'disposeBuiltinActivityIndicator'
  >
  actions: Pick<Actions, 'disposeActions'>
}

export type ControlAdapters = Readonly<Record<string, ElementAdapter>>

export function createControlAdapters(deps: ControlAdapterDependencies): ControlAdapters {
  return {
    switch: {
      container: false,
      hasView: true,
      create(node, props) {
        node.view = deps.controls.makeSwitch(node, props).view
      },
      applyProp(node, name, value) {
        deps.controls.applyBuiltinSwitchProp(node, name, value)
        return true
      },
      dispose: deps.actions.disposeActions,
    },
    slider: {
      container: false,
      hasView: true,
      create(node, props) {
        node.view = deps.controls.makeSlider(node, props).view
      },
      applyProp(node, name, value) {
        deps.controls.applyBuiltinSliderProp(node, name, value)
        return true
      },
      dispose: deps.actions.disposeActions,
    },
    progress: {
      container: false,
      hasView: true,
      validate(props) {
        for (const name of ['value', 'maxValue']) {
          if (
            props[name] != null &&
            (typeof props[name] !== 'number' || !Number.isFinite(props[name]))
          ) {
            throw new Error('AppKit progress ' + name + ' must be a finite number')
          }
        }
      },
      create(node) {
        node.view = deps.controls.makeProgress()
      },
      applyProp(node, name, value) {
        deps.controls.applyBuiltinProgressProp(node, name, value)
        return true
      },
      afterProps: deps.controls.syncProgress,
    },
    activityindicator: {
      container: false,
      hasView: true,
      validate(props) {
        if (props.busy != null && typeof props.busy !== 'boolean') {
          throw new Error('AppKit activityindicator busy must be boolean')
        }
      },
      create(node) {
        node.view = deps.controls.makeActivityIndicator()
      },
      applyProp(node, name, value) {
        deps.controls.applyBuiltinActivityIndicatorProp(node, name, value)
        return true
      },
      afterProps: deps.controls.syncActivityIndicator,
      dispose: deps.controls.disposeBuiltinActivityIndicator,
    },
  }
}

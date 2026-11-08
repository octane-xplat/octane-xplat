import type { ElementAdapter } from './element-adapter'
import type { Controls } from './controls'
import type { Actions } from './actions'
import type { Layout } from './layout'
import { configureScrollAxes } from './scroll-view'
import { FailureCollector } from './failures.ts'

export interface ScrollAdapterDependencies {
  controls: Pick<
    Controls,
    'makeScrollView' | 'applyBuiltinScrollViewProp' | 'disposeBuiltinScrollView'
  >
  actions: Pick<Actions, 'disposeActions'>
  layout: Pick<Layout, 'queueLayoutReconcile'>
}

export type ScrollAdapter = ElementAdapter

export function createScrollAdapter(deps: ScrollAdapterDependencies): ScrollAdapter {
  return {
    container: true,
    hasView: true,
    childProps: new Set(['horizontalAlignment', 'verticalAlignment']),
    validate(props) {
      if (
        props.orientation != null &&
        !['horizontal', 'vertical', 'both'].includes(props.orientation)
      ) {
        throw new Error('[macos-host] scrollview orientation must be horizontal, vertical or both')
      }
    },
    create(node) {
      const scroll = deps.controls.makeScrollView(node)

      node.view = scroll.view
      node.childHost = scroll.childHost
    },
    applyProp(node, name, value) {
      deps.controls.applyBuiltinScrollViewProp(node, name, value)
      return true
    },
    afterProps(node, patch) {
      if (!node.scrollAxisConstraints || 'orientation' in patch || 'horizontal' in patch) {
        configureScrollAxes(node)
        deps.layout.queueLayoutReconcile(node.container, node)
      }
    },
    dispose(node) {
      const failures = new FailureCollector()

      failures.run('scroll actions', () => deps.actions.disposeActions(node))
      failures.run('scroll observer', () => deps.controls.disposeBuiltinScrollView(node))

      const detach = node.scrollGeometryDetach
      const constraints = node.scrollAxisConstraints ?? []

      node.scrollGeometryDetach = null
      node.scrollAxisConstraints = undefined
      failures.run('scroll geometry', () => detach?.())
      for (const constraint of constraints) {
        failures.run('scroll constraint', () => {
          constraint.active = false
        })
      }

      failures.throwIfFailed()
    },
  }
}

import type { ElementAdapter } from './element-adapter'
import type { Controls } from './controls'
import type { ContainerElements } from './container-elements'
import type { Actions } from './actions'
import type { Layout } from './layout'

export interface PilotAdapterDependencies {
  controls: Pick<Controls, 'makeButton' | 'applyBuiltinButtonProp'>
  containers: Pick<
    ContainerElements,
    | 'makeContentView'
    | 'contentViewNodesByView'
    | 'observeContentGeometry'
    | 'applyBuiltinContentHostProp'
    | 'disposeBuiltinContentHost'
  >
  actions: Pick<Actions, 'disposeActions'>
  layout: Pick<Layout, 'queueLayoutReconcile' | 'layoutContentChild'>
}

export type PilotAdapters = Readonly<Record<string, ElementAdapter>>

/** Definitions assembled by runtime composition; leaf imports register nothing. */
export function createPilotAdapters(deps: PilotAdapterDependencies): PilotAdapters {
  return {
    button: {
      container: false,
      hasView: true,
      create(node, props) {
        node.view = deps.controls.makeButton(node, props).view
      },
      applyProp(node, name, value) {
        deps.controls.applyBuiltinButtonProp(node, name, value)
        return true
      },
      dispose: deps.actions.disposeActions,
    },
    contentview: {
      container: true,
      hasView: true,
      create(node) {
        node.view = deps.containers.makeContentView()
        deps.containers.contentViewNodesByView.set(node.view, node)
        deps.containers.observeContentGeometry(node)
      },
      applyProp(node, name, value) {
        deps.containers.applyBuiltinContentHostProp(node, name, value)
        return true
      },
      afterProps(node) {
        deps.layout.queueLayoutReconcile(node.container, node)
      },
      prepareDispose: deps.containers.disposeBuiltinContentHost,
      dispose: deps.actions.disposeActions,
      layout(node) {
        node.view?.invalidateIntrinsicContentSize()
        deps.layout.layoutContentChild(node)
        if (node.parent?.type === 'rootlayout') {
          deps.layout.queueLayoutReconcile(node.container, node.parent)
        }
      },
    },
  }
}

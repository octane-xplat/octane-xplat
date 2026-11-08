import type { ElementAdapter } from './element-adapter'
import type { ContainerElements } from './container-elements'
import type { Layout } from './layout'
import type { CssCascade } from './css-cascade'
import type { Projection } from './projection'
import type { Actions } from './actions'

export interface ContainerAdapterDependencies {
  containers: Pick<
    ContainerElements,
    | 'makeRootLayout'
    | 'makeActionBar'
    | 'makeLiquidGlass'
    | 'makePlaceholder'
    | 'contentViewNodesByView'
    | 'gridLayoutNodesByView'
    | 'observeContentGeometry'
    | 'applyBuiltinContentHostProp'
    | 'applyBuiltinLiquidGlassProp'
    | 'applyBuiltinPlaceholderProp'
    | 'disposeBuiltinRootLayout'
    | 'disposeBuiltinContentHost'
    | 'disposeBuiltinLiquidGlass'
    | 'disposeBuiltinPlaceholder'
    | 'syncActionBar'
    | 'setActionBarTitleView'
    | 'validateActionBarProps'
    | 'fireCreatingView'
  >
  layout: Pick<Layout, 'queueLayoutReconcile' | 'layoutRootChildren'>
  cssCascade: Pick<CssCascade, 'setNodeInlineStyle' | 'applyClassName'>
  projection: Pick<Projection, 'disposeBuiltinProxyChildren'>
  actions: Pick<Actions, 'disposeActions'>
}

export type ContainerAdapters = Readonly<Record<string, ElementAdapter>>

export function createContainerAdapters(deps: ContainerAdapterDependencies): ContainerAdapters {
  return {
    rootlayout: {
      childProps: new Set([
        'row',
        'col',
        'rowSpan',
        'colSpan',
        'horizontalAlignment',
        'verticalAlignment',
      ]),
      container: true,
      hasView: true,
      containerStyles: true,
      create(node) {
        node.view = deps.containers.makeRootLayout(node)
      },
      applyProp(node, name, value) {
        deps.containers.applyBuiltinContentHostProp(node, name, value)
        return true
      },
      afterProps(node) {
        deps.layout.queueLayoutReconcile(node.container, node)
      },
      prepareDispose: deps.containers.disposeBuiltinRootLayout,
      dispose: deps.actions.disposeActions,
      layout(node) {
        node.view?.invalidateIntrinsicContentSize()
        deps.layout.layoutRootChildren(node)
        if (['contentview', 'actionbar', 'rootlayout'].includes(node.parent?.type ?? '')) {
          deps.layout.queueLayoutReconcile(node.container, node.parent)
        }
      },
    },
    actionbar: {
      childProps: new Set(['horizontalAlignment', 'verticalAlignment']),
      validate: deps.containers.validateActionBarProps,
      beforeProps(node, patch) {
        if ('titleView' in patch && node.actionBarTitleViewProp !== patch.titleView) {
          deps.containers.setActionBarTitleView(node, patch.titleView)
        }
      },
      container: true,
      hasView: true,
      create(node) {
        node.view = deps.containers.makeActionBar(node)
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
        deps.containers.syncActionBar(node)
        deps.layout.queueLayoutReconcile(node.container, node.parent)
      },
    },
    liquidglass: {
      childProps: new Set([
        'row',
        'col',
        'rowSpan',
        'colSpan',
        'horizontalAlignment',
        'verticalAlignment',
      ]),
      container: true,
      hasView: true,
      containerStyles: true,
      create(node) {
        node.view = deps.containers.makeLiquidGlass(node)
        deps.containers.gridLayoutNodesByView.set(node.view, node)
      },
      applyProp(node, name, value) {
        deps.containers.applyBuiltinLiquidGlassProp(node, name, value)
        return true
      },
      afterProps(node) {
        deps.layout.queueLayoutReconcile(node.container, node)
      },
      prepareDispose: deps.containers.disposeBuiltinLiquidGlass,
      dispose: deps.actions.disposeActions,
    },
    proxyviewcontainer: {
      publicInstance: 'node',
      container: true,
      hasView: false,
      create() {},
      applyProp(node, name, value) {
        if (name === 'style') {
          deps.cssCascade.setNodeInlineStyle(node, value)
        }

        if (name === 'className') {
          deps.cssCascade.applyClassName(node, value)
        }

        return true
      },
      afterProps(node) {
        deps.layout.queueLayoutReconcile(node.container, node)
      },
      prepareDispose: deps.projection.disposeBuiltinProxyChildren,
    },
    placeholder: {
      didAttach: deps.containers.fireCreatingView,
      validate(props) {
        if (props.onCreatingView != null && typeof props.onCreatingView !== 'function') {
          throw new Error('AppKit placeholder onCreatingView must be a function')
        }
      },
      container: false,
      hasView: true,
      create(node) {
        node.view = deps.containers.makePlaceholder(node)
      },
      applyProp(node, name, value) {
        deps.containers.applyBuiltinPlaceholderProp(node, name, value)
        return true
      },
      prepareDispose: deps.containers.disposeBuiltinPlaceholder,
      dispose: deps.actions.disposeActions,
    },
  }
}

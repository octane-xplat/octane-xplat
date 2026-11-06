import type { Accessibility } from './accessibility'
import type { AVPlayerView, WKWebView } from '@octane-xplat/platform/macos'
import type { ElementAdapter } from './element-adapter'
import type { ImageElements } from './image-elements'
import type { Roots } from './roots'
import type { Actions } from './actions'
import type { CssCascade } from './css-cascade'
import type { NativeStyle } from './native-style'
import type { Subscriptions } from './subscriptions'
import type { ElementNode, PropBag } from './model'
import type { Nodes } from './nodes'
import type { Registry } from './registry'
import type { Tree } from './tree'
import { FailureCollector } from './failures.ts'
import {
  makeTabView,
  makeTabItem,
  syncTabView,
  syncTabItem,
  validateTabProps,
  releaseTabView,
  releaseTabItem,
} from './tab-view'

import { makeListView, updateListView, disposeListView } from './list-view'
import { makeWebView, updateWebView, disposeWebView } from './webview'
import { makePagerView, updatePagerView, disposePagerView } from './pager'
import { makeVideoView, updateVideoView, disposeVideoView } from './video'
import { validateListProps } from './list-template'
import { nativeColor } from './native-colors'

export interface SurfaceAdapterDependencies {
  accessibility: Pick<Accessibility, 'applyAccessibility'>
  imageElements: Pick<
    ImageElements,
    'makeImageView' | 'makeAnimatedImageView' | 'applyBuiltinImageProp' | 'disposeBuiltinImage'
  >
  roots: Pick<Roots, 'createMacOSRoot' | 'unmountOwnedRoot'>
  actions: Pick<Actions, 'disposeActions'>
  cssCascade: Pick<CssCascade, 'setNodeInlineStyle' | 'applyClassName'>
  nativeStyle: Pick<NativeStyle, 'setSizeConstraint'>
  subscriptions: Pick<Subscriptions, 'setImageActions'>
  nodes: Pick<Nodes, 'validateNodeProps'>
  registry: Pick<Registry, 'assertSupportedType' | 'typeHasView' | 'canContainView'>
  tree: Pick<Tree, 'validateTextNesting' | 'detach'>
}

export type SurfaceAdapters = Readonly<Record<string, ElementAdapter>>

export function createSurfaceAdapters(deps: SurfaceAdapterDependencies): SurfaceAdapters {
  function applyBuiltinTabViewProp(node: ElementNode, name: string, value: PropBag[string]) {
    if (
      ['items', 'selectedIndex', 'onSelectedIndexChange', 'onSelectedIndexChanged', 'id'].includes(
        name,
      )
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
      console.warn('[macos-host] ignored tabview prop ' + name)
    }
  }

  function applyBuiltinListViewProp(node: ElementNode, name: string, value: PropBag[string]) {
    if (
      [
        'items',
        'renderItem',
        'itemTemplate',
        'itemTemplates',
        'separatorColor',
        'onItemTap',
        'onItemLoading',
        'onLoadMoreItems',
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
      console.warn('[macos-host] ignored listview prop ' + name)
    }
  }

  function applyBuiltinWebViewProp(node: ElementNode, name: string, value: PropBag[string]) {
    if (name === 'style') {
      deps.cssCascade.setNodeInlineStyle(node, value)
    } else if (name === 'className') {
      deps.cssCascade.applyClassName(node, value)
    } else if (name === 'accessibilityLabel') {
      node.view!.accessibilityLabel = String(value ?? '')
    } else if (name === 'accessible') {
      node.view!.accessibilityElement = value !== false
    } else if (name === 'accessibilityHint') {
      node.view!.accessibilityHelp = String(value ?? '')
    }
  }

  function disposeBuiltinListView(node: ElementNode) {
    if (node.type === 'listview' && node.view) {
      disposeListView(node.view)
    }
  }

  function disposeBuiltinPager(node: ElementNode) {
    if (node.type === 'pager' && node.view) {
      disposePagerView(node.view)
    }
  }

  function disposeBuiltinVideo(node: ElementNode) {
    if (node.type === 'xplatvideo' && node.view) {
      disposeVideoView(node.view as AVPlayerView)
    }
  }

  function disposeBuiltinTabView(node: ElementNode) {
    if (node.type === 'tabview') {
      releaseTabView(node)
    }
  }

  function disposeBuiltinTabItem(node: ElementNode) {
    if (node.type === 'tabviewitem') {
      deps.tree.detach(node.container, node)
      releaseTabItem(node)
    }
  }

  function disposeBuiltinWebView(node: ElementNode) {
    // Nodes destroyed by a failed makeNode may have a null view — every
    // branch below must tolerate partial construction.
    if (node.type === 'webview' && node.view) {
      disposeWebView(node.view as WKWebView)
    }
  }

  return {
    listview: {
      container: false,
      hasView: true,
      validate(props) {
        validateListProps(props, (template) =>
          template.validate(
            (tag, values) => {
              try {
                deps.registry.assertSupportedType(tag)
                deps.nodes.validateNodeProps(tag, values)
              } catch (error) {
                throw new TypeError('[macos-host] listview itemTemplate: ' + String(error))
              }
            },
            (parent, child) => {
              deps.tree.validateTextNesting(parent, child)
              if (
                parent &&
                (deps.registry.typeHasView(child) || child === 'proxyviewcontainer') &&
                !deps.registry.canContainView(parent)
              ) {
                throw new TypeError(
                  '[macos-host] listview itemTemplate: <' + parent + '> cannot contain child views',
                )
              }
            },
          ),
        )
        if (props.separatorColor != null) {
          nativeColor(props.separatorColor)
        }
      },
      create(node) {
        node.view = makeListView(
          {
            createRoot: (host) =>
              deps.roots.createMacOSRoot(host, { fontFamily: node.container.fontFamily }),
            releaseOwnedRoot: (host) => deps.roots.unmountOwnedRoot(host),
            color: nativeColor,
          },
          node,
        )
      },
      applyProp(node, name, value) {
        applyBuiltinListViewProp(node, name, value)
        return true
      },
      afterProps(node) {
        updateListView(node.view!, node.props)
      },
      prepareDispose: disposeBuiltinListView,
      dispose: deps.actions.disposeActions,
    },
    tabview: {
      container: false,
      hasView: true,
      validate(props) {
        validateTabProps('tabview', props)
      },
      create(node) {
        node.view = makeTabView(node)
      },
      applyProp(node, name, value) {
        applyBuiltinTabViewProp(node, name, value)
        return true
      },
      afterProps(node) {
        syncTabView(node)
      },
      prepareDispose: disposeBuiltinTabView,
      dispose: deps.actions.disposeActions,
    },
    tabviewitem: {
      publicInstance: 'node',
      container: false,
      hasView: false,
      validate(props) {
        validateTabProps('tabviewitem', props)
      },
      create(node) {
        makeTabItem(node)
      },
      afterProps(node) {
        syncTabItem(node)
      },
      prepareDispose: disposeBuiltinTabItem,
    },
    webview: {
      container: false,
      hasView: true,
      create(node) {
        node.view = makeWebView()
      },
      applyProp(node, name, value) {
        applyBuiltinWebViewProp(node, name, value)
        return true
      },
      afterProps(node, patch) {
        updateWebView(node, patch, (height) => {
          if (node.lifecycle === 'disposing' || node.lifecycle === 'disposed') {
            return
          }
          deps.cssCascade.setNodeInlineStyle(node, { ...node.props.style, height })
          deps.nativeStyle.setSizeConstraint(node, 'height', height)
        })
      },
      dispose(node) {
        const failures = new FailureCollector()
        failures.run('web state', () => disposeBuiltinWebView(node))
        failures.run('web actions', () => deps.actions.disposeActions(node))
        failures.throwIfFailed()
      },
    },
    image: {
      container: false,
      hasView: true,
      create(node, props) {
        node.view = deps.imageElements.makeImageView(props, node)
      },
      applyProp(node, name, value) {
        deps.imageElements.applyBuiltinImageProp(node, name, value)
        return true
      },
      dispose(node) {
        const failures = new FailureCollector()
        failures.run('image state', () => deps.imageElements.disposeBuiltinImage(node))
        failures.run('image actions', () => deps.actions.disposeActions(node))
        failures.throwIfFailed()
      },
    },
    animatedimage: {
      container: false,
      hasView: true,
      create(node, props) {
        node.view = deps.imageElements.makeAnimatedImageView(props, node)
      },
      applyProp(node, name, value) {
        deps.imageElements.applyBuiltinImageProp(node, name, value)
        return true
      },
      dispose(node) {
        const failures = new FailureCollector()
        failures.run('animated image state', () => deps.imageElements.disposeBuiltinImage(node))
        failures.run('animated image actions', () => deps.actions.disposeActions(node))
        failures.throwIfFailed()
      },
    },
    pager: {
      container: false,
      hasView: true,
      create(node) {
        node.view = makePagerView(node)
      },
      afterProps(node) {
        updatePagerView(node.view!, node.props)
      },
      prepareDispose: disposeBuiltinPager,
      dispose: deps.actions.disposeActions,
    },
    xplatvideo: {
      container: false,
      hasView: true,
      create(node) {
        node.view = makeVideoView()
      },
      afterProps(node) {
        updateVideoView(node, node.props)
      },
      prepareDispose: disposeBuiltinVideo,
      dispose: deps.actions.disposeActions,
    },
  }
}

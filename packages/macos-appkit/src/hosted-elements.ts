import type { createCssCascade } from './css-cascade'
import type { createAccessibility } from './accessibility'
import type { createTree } from './tree'
import type { PropBag, ElementNode } from './model'
import { WKWebView, AVPlayerView } from '@octane-xplat/platform/macos'
import { releaseTabView, releaseTabItem } from './tab-view'
import { disposeListView } from './list-view'
import { disposeWebView } from './webview'
import { disposePagerView } from './pager'
import { disposeVideoView } from './video'

interface Dependencies {
  cssCascade: Pick<ReturnType<typeof createCssCascade>, 'setNodeInlineStyle' | 'applyClassName'>
  accessibility: Pick<ReturnType<typeof createAccessibility>, 'applyAccessibility'>
  tree: Pick<ReturnType<typeof createTree>, 'detach'>
}
export function createHostedElements(deps: Dependencies) {
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
    applyBuiltinTabViewProp,
    applyBuiltinListViewProp,
    applyBuiltinWebViewProp,
    disposeBuiltinListView,
    disposeBuiltinPager,
    disposeBuiltinVideo,
    disposeBuiltinTabView,
    disposeBuiltinTabItem,
    disposeBuiltinWebView,
  }
}

/** Mason owns these container subtrees. ScrollView retains native chrome and
 * a separate document compute; glass retains its native painting surface.
 * ContentView, RootLayout, lists, tabs and portals keep their host boundaries. */
export const MASON_CONTAINERS = new Set(['masonview', 'liquidglass', 'scrollview'])

interface LayoutAncestor<T> {
  type: string
  parent?: T | null
  layoutParent?: T | null
}

/** A descendant mutation can change every auto-sized ancestor in one Mason tree. */
export function masonLayoutRoot<T extends LayoutAncestor<T>>(node: T): T {
  // A scroll node owns a separate document compute and scroll-extent pins.
  if (!MASON_CONTAINERS.has(node.type) || node.type === 'scrollview') {
    return node
  }

  let root = node
  let ancestor = node.layoutParent ?? node.parent

  while (ancestor) {
    if (ancestor.type !== 'proxyviewcontainer') {
      if (!MASON_CONTAINERS.has(ancestor.type)) {
        break
      }

      root = ancestor
      if (ancestor.type === 'scrollview') {
        break
      }
    }

    ancestor = ancestor.layoutParent ?? ancestor.parent
  }

  return root
}

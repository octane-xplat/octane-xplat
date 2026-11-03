/** @jsxImportSource @octane-xplat/jsx */
import { useContext } from 'octane'
import { ListContext, ListProvider } from './list-context'
import type { ListMarker, ListTaskMarker } from './list-context'

/** Draws `marker` on the List items inside it, in place of the marker their
 *  List's `listStyle` names, or `task`'s read-only checkbox in place of
 *  either; internal, for Markdown's nested lists and task items in mixed
 *  lists. Outside a List, or in a List without markers, it changes nothing
 *  (Astryx `ListMarkerScope`). */
export function ListMarkerScope(props: {
  marker: ListMarker
  task?: ListTaskMarker
  children?: unknown
}): unknown {
  const context = useContext(ListContext)
  if (context == null) {
    return props.children
  }

  return (
    <ListProvider value={{ ...context, marker: props.marker, task: props.task }}>
      {props.children}
    </ListProvider>
  )
}

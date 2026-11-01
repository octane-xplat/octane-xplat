import type { GtkView } from './index.js'

/** A composite control keeps its native public widget while mounting and
 * measuring the outer GTK host that provides its platform behavior. */
export function physicalView(node: { view: GtkView | null; layoutView?: GtkView }): GtkView | null {
	return node.layoutView ?? node.view
}

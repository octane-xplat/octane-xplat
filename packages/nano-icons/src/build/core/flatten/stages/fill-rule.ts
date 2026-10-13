// Ported from react-native-nano-icons (MIT, © Software Mansion) — see
// packages/nano-icons/LICENSES.md for full attribution.
import type { SvgDocument } from '../document'
import { removeOverlaps, shapeStr } from '../shape'

export function evenoddToNonzeroWinding(doc: SvgDocument): void {
	doc.mapShapes((s) => (shapeStr(s, 'fill_rule') === 'evenodd' ? removeOverlaps(s, doc.ops) : s))
}

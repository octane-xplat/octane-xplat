// Ported from react-native-nano-icons (MIT, © Software Mansion) — see
// packages/nano-icons/LICENSES.md for full attribution.
import type { SvgDocument } from '../document'
import { normalizeOpacity } from '../shape'

export function normalizeOpacities(doc: SvgDocument): void {
	doc.forEachShape((s) => normalizeOpacity(s))
}

// Ported from react-native-nano-icons (MIT, © Software Mansion) — see
// packages/nano-icons/LICENSES.md for full attribution.
import type { PathKitModule } from '../pathkit/types'
import { SvgDocument } from './document'
import { createPathOps } from './pathops'
import { flattenDocument } from './stages'

export function flattenSvg(svgContent: string, pathkit: PathKitModule): string {
	const doc = SvgDocument.parse(svgContent, createPathOps(pathkit))
	flattenDocument(doc)
	return doc.serialize()
}

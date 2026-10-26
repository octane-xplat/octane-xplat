import { MediaModePage } from './media-mode/MediaModePage'
// Ported authored-page registry — /pages/* route → the screen that renders
// it. The coverage ledger derives 'ported' status from these keys; adding
// a page flips its row, same as the template example registry.

import { NeutralPalettePage } from './palettes/NeutralPalettePage'
import { StonePalettePage } from './palettes/StonePalettePage'
import { GothicPalettePage } from './palettes/GothicPalettePage'
import { Y2kPalettePage } from './palettes/Y2kPalettePage'
import { ButterPalettePage } from './palettes/ButterPalettePage'
import { TapTargetsPage } from './tap-targets/TapTargetsPage'
import { TextareaCounterPage } from './textarea-counter/TextareaCounterPage'
import { ComponentScoresPage } from './component-scores/ComponentScoresPage'

const pages: Record<string, () => any> = {
	'/pages/media-mode/': MediaModePage,
	'/pages/neutral-palette/': NeutralPalettePage,
	'/pages/stone-palette/': StonePalettePage,
	'/pages/gothic-palette/': GothicPalettePage,
	'/pages/y2k-palette/': Y2kPalettePage,
	'/pages/butter-palette/': ButterPalettePage,
	'/pages/tap-targets/': TapTargetsPage,
	'/pages/textarea-counter/': TextareaCounterPage,
	'/pages/component-scores/': ComponentScoresPage,
}

export const portedPages = new Set(Object.keys(pages))

export function pageFor(route: string): any {
	return pages[route]
}

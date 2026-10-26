// Ported authored-page registry — /pages/* route → the screen that renders
// it. The coverage ledger derives 'ported' status from these keys; adding
// a page flips its row, same as the template example registry.

import './authored/authored.css'
import {MediaModePage} from './media-mode/MediaModePage'
import {ComponentScoresPage} from './component-scores/ComponentScoresPage'
import { NeutralPalettePage } from './palettes/NeutralPalettePage'
import { StonePalettePage } from './palettes/StonePalettePage'
import { GothicPalettePage } from './palettes/GothicPalettePage'
import { Y2kPalettePage } from './palettes/Y2kPalettePage'
import { ButterPalettePage } from './palettes/ButterPalettePage'
import { TapTargetsPage } from './tap-targets/TapTargetsPage'
import { TextareaCounterPage } from './textarea-counter/TextareaCounterPage'
import { ExamplePage } from './authored/ExamplePage'
import { NavigationPage } from './authored/NavigationPage'
import { ShowcaseHeaderPage } from './authored/ShowcaseHeaderPage'
import { ShowcaseComponentsPage } from './authored/ShowcaseComponentsPage'
import { DocHomePage } from './docs/DocHomePage'
import { DocDiscoverPage } from './docs/DocDiscoverPage'
import { DocDocsPage } from './docs/DocDocsPage'
import { TopNavMenuPage } from './authored/TopNavMenuPage'
import { MegaMenuPage } from './authored/MegaMenuPage'
import { ColorStudioPage } from './color-studio/ColorStudioPage'
import { PaletteGeneratorPage } from './palette-generator/PaletteGeneratorPage'
import { PolymorphicLinkPage } from './authored/PolymorphicLinkPage'
import { CodeBlockPerfPage } from './performance/CodeBlockPerfPage'
import { DocumentationPage } from './docs/DocumentationPage'
import { DictationLabPage } from './dictation/DictationLabPage'
import { ExampleCardsPage } from './authored/ExampleCardsPage'

import { MobileSpacingPage } from './mobile-spacing/MobileSpacingPage'
import { ShellLabPage } from './shell-lab/ShellLabPage'

const pages: Record<string, () => any> = {
	'/pages/mobile-spacing/': MobileSpacingPage,
	'/pages/shell-lab/': ShellLabPage,

	'/pages/media-mode/': MediaModePage,
	'/pages/component-scores/': ComponentScoresPage,
	'/pages/dictation-lab/': DictationLabPage,
	'/pages/example-cards/': ExampleCardsPage,

	'/pages/documentation/': DocumentationPage,
	'/pages/codeblock-perf/': CodeBlockPerfPage,
	'/pages/polymorphic-link/': PolymorphicLinkPage,
	'/pages/topnav-menu/': TopNavMenuPage,
	'/pages/mega-menu/': MegaMenuPage,
	'/pages/color-studio/': ColorStudioPage,
	'/pages/palette-generator/': PaletteGeneratorPage,

	'/pages/doc-home/': DocHomePage,
	'/pages/doc-discover/': DocDiscoverPage,
	'/pages/doc-docs/': DocDocsPage,

	'/pages/example/': ExamplePage,
	'/pages/navigation/': NavigationPage,
	'/pages/showcase-header/': ShowcaseHeaderPage,
	'/pages/showcase-components/': ShowcaseComponentsPage,
	'/pages/neutral-palette/': NeutralPalettePage,
	'/pages/stone-palette/': StonePalettePage,
	'/pages/gothic-palette/': GothicPalettePage,
	'/pages/y2k-palette/': Y2kPalettePage,
	'/pages/butter-palette/': ButterPalettePage,
	'/pages/tap-targets/': TapTargetsPage,
	'/pages/textarea-counter/': TextareaCounterPage,
}

export const portedPages = new Set(Object.keys(pages))

export function pageFor(route: string): any {
	return pages[route]
}

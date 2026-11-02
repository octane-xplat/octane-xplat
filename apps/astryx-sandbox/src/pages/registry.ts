import { TableOverviewPage } from './tables/TableOverviewPage.tsrx'
import { TableLabPage } from './tables/TableLabPage.tsrx'
// Ported authored-page registry — /pages/* route → the screen that renders
// it. The coverage ledger derives 'ported' status from these keys; adding
// a page flips its row, same as the template example registry.

import './authored/authored.css'
import { MediaModePage } from './media-mode/MediaModePage.tsrx'
import { ComponentScoresPage } from './component-scores/ComponentScoresPage.tsrx'
import { NeutralPalettePage } from './palettes/NeutralPalettePage.tsrx'
import { StonePalettePage } from './palettes/StonePalettePage.tsrx'
import { GothicPalettePage } from './palettes/GothicPalettePage.tsrx'
import { Y2kPalettePage } from './palettes/Y2kPalettePage.tsrx'
import { ButterPalettePage } from './palettes/ButterPalettePage.tsrx'
import { TapTargetsPage } from './tap-targets/TapTargetsPage.tsrx'
import { TextareaCounterPage } from './textarea-counter/TextareaCounterPage.tsrx'
import { ExamplePage } from './authored/ExamplePage.tsrx'
import { NavigationPage } from './authored/NavigationPage.tsrx'
import { ShowcaseHeaderPage } from './authored/ShowcaseHeaderPage.tsrx'
import { ShowcaseComponentsPage } from './authored/ShowcaseComponentsPage.tsrx'
import { DocHomePage } from './docs/DocHomePage.tsrx'
import { DocDiscoverPage } from './docs/DocDiscoverPage.tsrx'
import { DocDocsPage } from './docs/DocDocsPage.tsrx'
import { TopNavMenuPage } from './authored/TopNavMenuPage.tsrx'
import { MegaMenuPage } from './authored/MegaMenuPage.tsrx'
import { ColorStudioPage } from './color-studio/ColorStudioPage.tsrx'
import { PaletteGeneratorPage } from './palette-generator/PaletteGeneratorPage.tsrx'
import { PolymorphicLinkPage } from './authored/PolymorphicLinkPage.tsrx'
import { CodeBlockPerfPage } from './performance/CodeBlockPerfPage.tsrx'
import { DocumentationPage } from './docs/DocumentationPage.tsrx'
import { DictationLabPage } from './dictation/DictationLabPage.tsrx'
import { ExampleCardsPage } from './authored/ExampleCardsPage.tsrx'

import { MobileSpacingPage } from './mobile-spacing/MobileSpacingPage.tsrx'
import { ShellLabPage } from './shell-lab/ShellLabPage.tsrx'

import { motionLabPage } from './motion-lab/MotionLabShell.web.tsrx'
import { MotionOverviewPage } from './motion-lab/MotionOverviewPage.web.tsrx'
import { PublishedGuidancePage } from './motion-lab/PublishedPage.web.tsrx'
import { MotionTokensPage } from './motion-lab/TokensPage.web.tsrx'
import { MotionSpringsPage } from './motion-lab/SpringsPage.web.tsrx'
import { MotionJsMirrorPage } from './motion-lab/JsMirrorPage.web.tsrx'
import { MotionExportPage } from './motion-lab/ExportPage.web.tsrx'
import { ExitGapPage } from './motion-lab/ExitGapPage.web.tsrx'
import { MotionBugsPage } from './motion-lab/BugsPage.web.tsrx'
import { ViolationsPage } from './motion-lab/ViolationsPage.web.tsrx'
import { MotionRubricPage } from './motion-lab/RubricPage.web.tsrx'
import { ReducedMotionPage } from './motion-lab/ReducedMotionPage.web.tsrx'
import { PreviewsPage } from './motion-lab/PreviewsPage.web.tsrx'
import { PreviewPlanPage } from './motion-lab/PreviewPlanPage.web.tsrx'
import { MotionLibraryPage } from './motion-lab/LibraryPage.web.tsrx'
import { MotionPlanPage } from './motion-lab/PlanPage.web.tsrx'
import { MotionExamplesPage } from './motion-examples/MotionExamplesPage.web.tsrx'
import { MobileTypePage } from './mobile-type/MobileTypePage.web.tsrx'
import { MobilePrototypesPage } from './mobile-prototypes/MobilePrototypesPage.web.tsrx'

const pages: Record<string, () => any> = {
	'/pages/motion-lab/': motionLabPage(MotionOverviewPage),
	'/pages/motion-lab/published/': motionLabPage(PublishedGuidancePage),
	'/pages/motion-lab/tokens/': motionLabPage(MotionTokensPage),
	'/pages/motion-lab/springs/': motionLabPage(MotionSpringsPage),
	'/pages/motion-lab/js-mirror/': motionLabPage(MotionJsMirrorPage),
	'/pages/motion-lab/export/': motionLabPage(MotionExportPage),
	'/pages/motion-lab/exit-gap/': motionLabPage(ExitGapPage),
	'/pages/motion-lab/bugs/': motionLabPage(MotionBugsPage),
	'/pages/motion-lab/violations/': motionLabPage(ViolationsPage),
	'/pages/motion-lab/rubric/': motionLabPage(MotionRubricPage),
	'/pages/motion-lab/reduced-motion/': motionLabPage(ReducedMotionPage),
	'/pages/motion-lab/previews/': motionLabPage(PreviewsPage),
	'/pages/motion-lab/preview-plan/': motionLabPage(PreviewPlanPage),
	'/pages/motion-lab/library/': motionLabPage(MotionLibraryPage),
	'/pages/motion-lab/plan/': motionLabPage(MotionPlanPage),
	'/pages/motion-examples/': MotionExamplesPage,
	'/pages/mobile-type/': MobileTypePage,
	'/pages/mobile-prototypes/': MobilePrototypesPage,
	'/pages/mobile-spacing/': MobileSpacingPage,
	'/pages/shell-lab/': ShellLabPage,

	'/pages/table-overview/': TableOverviewPage,
	'/pages/table-lab/': TableLabPage,
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

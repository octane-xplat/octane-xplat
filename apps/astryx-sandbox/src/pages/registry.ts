import { TableOverviewPage } from './tables/TableOverviewPage'
import { TableLabPage } from './tables/TableLabPage'
// Ported authored-page registry — /pages/* route → the screen that renders
// it. The coverage ledger derives 'ported' status from these keys; adding
// a page flips its row, same as the template example registry.

import './authored/authored.css'
import { MediaModePage } from './media-mode/MediaModePage'
import { ComponentScoresPage } from './component-scores/ComponentScoresPage'
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

import { motionLabPage } from './motion-lab/MotionLabShell.web'
import { MotionOverviewPage } from './motion-lab/MotionOverviewPage.web'
import { PublishedGuidancePage } from './motion-lab/PublishedPage.web'
import { MotionTokensPage } from './motion-lab/TokensPage.web'
import { MotionSpringsPage } from './motion-lab/SpringsPage.web'
import { MotionJsMirrorPage } from './motion-lab/JsMirrorPage.web'
import { MotionExportPage } from './motion-lab/ExportPage.web'
import { ExitGapPage } from './motion-lab/ExitGapPage.web'
import { MotionBugsPage } from './motion-lab/BugsPage.web'
import { ViolationsPage } from './motion-lab/ViolationsPage.web'
import { MotionRubricPage } from './motion-lab/RubricPage.web'
import { ReducedMotionPage } from './motion-lab/ReducedMotionPage.web'
import { PreviewsPage } from './motion-lab/PreviewsPage.web'
import { PreviewPlanPage } from './motion-lab/PreviewPlanPage.web'
import { MotionLibraryPage } from './motion-lab/LibraryPage.web'
import { MotionPlanPage } from './motion-lab/PlanPage.web'
import { MotionExamplesPage } from './motion-examples/MotionExamplesPage.web'
import { MobileTypePage } from './mobile-type/MobileTypePage.web'
import { MobilePrototypesPage } from './mobile-prototypes/MobilePrototypesPage.web'

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

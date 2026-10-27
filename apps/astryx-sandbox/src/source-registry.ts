// Source registry for the preview shell's code view — maps a pinned route to
// the Octane source actually running for it. `?raw` imports bundle the real
// .tsrx text, so the CodeBlock shows the ported implementation, not the
// upstream original. Pending rows have no Octane source — the code view says
// so honestly instead of quoting code that isn't running.

import type { CoverageRow } from './coverage/coverage'

const exampleSources = import.meta.glob('./examples/**/*.tsrx', {
	query: '?raw',
	import: 'default',
	eager: true,
}) as Record<string, string>

const pageSources = import.meta.glob('./pages/**/*.tsrx', {
	query: '?raw',
	import: 'default',
	eager: true,
}) as Record<string, string>

// Template name -> source text (file basename equals the template name).
const byExampleName = new Map<string, string>()
for (const [path, text] of Object.entries(exampleSources)) {
	const name = path.slice(path.lastIndexOf('/') + 1, -'.tsrx'.length).replace(/\.web$/, '')
	byExampleName.set(name, text)
}

// Page file basename -> source text; routed through the page registry's
// explicit route<->file map below.
const pageByFile = new Map<string, string>()
for (const [path, text] of Object.entries(pageSources)) {
	const file = path.slice(path.lastIndexOf('/') + 1, -'.tsrx'.length).replace(/\.web$/, '')
	pageByFile.set(file, text)
}

/** Ported authored-page route -> source file basename (NeutralPalettePage). */
const pageSourceFiles: Record<string, string> = {
	'/pages/mobile-spacing/': 'MobileSpacingPage',
	'/pages/shell-lab/': 'ShellLabPage',

	'/pages/table-overview/': 'TableOverviewPage',
	'/pages/table-lab/': 'TableLabPage',
	'/pages/media-mode/': 'MediaModePage',
	'/pages/component-scores/': 'ComponentScoresPage',
	'/pages/dictation-lab/': 'DictationLabPage',
	'/pages/example-cards/': 'ExampleCardsPage',

	'/pages/documentation/': 'DocumentationPage',
	'/pages/codeblock-perf/': 'CodeBlockPerfPage',
	'/pages/polymorphic-link/': 'PolymorphicLinkPage',
	'/pages/topnav-menu/': 'TopNavMenuPage',
	'/pages/mega-menu/': 'MegaMenuPage',
	'/pages/color-studio/': 'ColorStudioPage',
	'/pages/palette-generator/': 'PaletteGeneratorPage',

	'/pages/doc-home/': 'DocHomePage',
	'/pages/doc-discover/': 'DocDiscoverPage',
	'/pages/doc-docs/': 'DocDocsPage',

	'/pages/example/': 'ExamplePage',
	'/pages/navigation/': 'NavigationPage',
	'/pages/showcase-header/': 'ShowcaseHeaderPage',
	'/pages/showcase-components/': 'ShowcaseComponentsPage',
	'/pages/neutral-palette/': 'NeutralPalettePage',
	'/pages/stone-palette/': 'StonePalettePage',
	'/pages/gothic-palette/': 'GothicPalettePage',
	'/pages/y2k-palette/': 'Y2kPalettePage',
	'/pages/butter-palette/': 'ButterPalettePage',
}

/** The Octane source rendered for a route, or null when the row is pending
 *  (no ported implementation exists to describe). */
export function sourceForRow(row: CoverageRow | undefined): string | null {
	if (!row) {
		return null
	}
	if ((row.kind === 'template-block' || row.kind === 'template-page') && row.name) {
		return byExampleName.get(row.name) ?? null
	}
	const file = pageSourceFiles[row.route]
	return file ? (pageByFile.get(file) ?? null) : null
}

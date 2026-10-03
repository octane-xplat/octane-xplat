// Node-side Lingui extractor for .tsrx sources — imported by the app's
// lingui.config.ts, never bundled into an app target:
//
//   import { babelExtractor, tsrxExtractor } from '@octane-xplat/lingui/extractor'
//   export default defineConfig({ extractors: [babelExtractor, tsrxExtractor] })
//
// `lingui extract` reads source text, so the octane compiler lowers .tsrx
// component syntax to plain TypeScript first; the macro import and tagged-
// template calls survive that transform and Lingui's own babel extractor then
// finds the messages. The default extractor chain skips .tsrx entirely —
// `extract-experimental` bundlers can't load the extension either.
import babelExtractor, { extractFromFileWithBabel } from '@lingui/cli/api/extractors/babel'

import { compile } from 'octane/compiler'

export type Extractor = typeof babelExtractor

export const tsrxExtractor: Extractor = {
	match: (filename) => filename.endsWith('.tsrx'),
	async extract(filename, code, onMessageExtracted, ctx) {
		const { code: tsCode, map, diagnostics } = compile(code, filename)
		const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error')
		if (errors.length) {
			throw new Error(`${filename}: ${errors[0]!.message}`)
		}

		// compile() emits a basename in map.sources; Lingui resolves origins
		// relative to rootDir, so point the map at the authored path to keep
		// extracted origins (.po `#:` comments) on .tsrx line numbers.
		map.sources = [filename]
		await extractFromFileWithBabel(
			filename,
			tsCode,
			onMessageExtracted,
			{ ...ctx, sourceMaps: map },
			{
				plugins: ['typescript', 'jsx'],
			},
		)
	},
}

export { babelExtractor }

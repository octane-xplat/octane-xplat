import { defineConfig } from '@lingui/cli'
import { formatter } from '@lingui/format-json'
import { babelExtractor, tsrxExtractor } from '@octane-xplat/lingui/extractor'

export default defineConfig({
	sourceLocale: 'en',
	locales: ['en'],
	catalogs: [
		{
			path: '<rootDir>/locales/{locale}/messages',
			include: ['<rootDir>/src'],
		},
	],
	extractors: [babelExtractor, tsrxExtractor],
	format: formatter({ lineNumbers: true, style: 'lingui' }),
})

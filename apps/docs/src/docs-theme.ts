import { defineTheme } from '@octane-xplat/ui'

function headingTokens(compact: boolean) {
	return {
		'--text-heading-1-size': compact ? '32px' : '33px',
		'--text-heading-1-leading': '1.27',
		'--text-heading-1-weight': '600',
		'--text-heading-2-size': compact ? '26px' : '24px',
		'--text-heading-2-leading': 'normal',
		'--text-heading-2-weight': '400',
		'--text-heading-3-size': compact ? '20px' : '16px',
		'--text-heading-3-leading': 'normal',
		'--text-heading-3-weight': '500',
		'--text-heading-4-size': compact ? '20px' : '16px',
		'--text-heading-4-leading': 'normal',
		'--text-heading-4-weight': '500',
	}
}

export const docsTheme = defineTheme({ name: 'docs', tokens: headingTokens(false) })
export const compactDocsTheme = defineTheme({ name: 'docs-compact', tokens: headingTokens(true) })

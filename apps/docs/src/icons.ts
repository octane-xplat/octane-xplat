import { createIconRegistry } from '@octane-xplat/ui'
import constellation from './assets/constellation.svg?raw'

/** App-owned SVG artwork rendered through the shared Icon component. */
export const docsIcons = createIconRegistry()
docsIcons.registerIcons({
	'docs-markdown': { text: 'M↓' },
	'docs-constellation': {
		viewBox: '0 0 524 524',
		markup: constellation.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, ''),
	},
	'docs-copy-surface': {
		viewBox: '0 0 162 30',
		markup:
			'<path d="M147.176777,-0.176776695 L162.176777,14.8232233 L162.25,15 L162.25,30.25 L9,30.25 L8.8232233,30.1767767 L-0.176776695,21.1767767 L-0.25,21 L-0.25,-0.25 L147,-0.25 Z"/>',
	},
	'docs-code': {
		markup:
			'<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
	},
	'docs-chat': {
		markup:
			'<path d="M20.5 11.5a8.4 8.4 0 0 1-8.5 8.3 9.2 9.2 0 0 1-4-.9L3 20l1.2-4.1a8 8 0 0 1-1.2-4.4 8.5 8.5 0 0 1 17.5 0Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
	},
})

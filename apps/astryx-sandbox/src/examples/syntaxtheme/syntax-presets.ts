// Color values from the pinned Astryx MIT syntax presets.
// Original themes: Dracula (Zeno Rocha), GitHub (GitHub), One Dark Pro (Binaryify).
import type { CodeBlockProps } from '@octane-xplat/ui'

type SyntaxThemeOverride = NonNullable<CodeBlockProps['syntaxTheme']>

export const dracula: SyntaxThemeOverride = {
	name: 'dracula',
	tokens: {
		keyword: '#ff79c6',
		string: '#f1fa8c',
		comment: '#6272a4',
		number: '#bd93f9',
		function: '#50fa7b',
		type: '#8be9fd',
		variable: '#f8f8f2',
		operator: '#ff79c6',
		constant: '#bd93f9',
		tag: '#ff79c6',
		attribute: '#50fa7b',
		property: '#66d9ef',
		punctuation: '#f8f8f2',
		background: '#282a36',
	},
}

export const githubLight: SyntaxThemeOverride = {
	name: 'github-light',
	tokens: {
		keyword: '#cf222e',
		string: '#0a3069',
		comment: '#6e7781',
		number: '#0550ae',
		function: '#8250df',
		type: '#953800',
		variable: '#24292f',
		operator: '#cf222e',
		constant: '#0550ae',
		tag: '#116329',
		attribute: '#0550ae',
		property: '#0550ae',
		punctuation: '#24292f',
		background: '#ffffff',
	},
}

export const githubDark: SyntaxThemeOverride = {
	name: 'github-dark',
	tokens: {
		keyword: '#ff7b72',
		string: '#a5d6ff',
		comment: '#8b949e',
		number: '#79c0ff',
		function: '#d2a8ff',
		type: '#ffa657',
		variable: '#e6edf3',
		operator: '#ff7b72',
		constant: '#79c0ff',
		tag: '#7ee787',
		attribute: '#79c0ff',
		property: '#79c0ff',
		punctuation: '#c9d1d9',
		background: '#0d1117',
	},
}

export const oneDarkPro: SyntaxThemeOverride = {
	name: 'one-dark-pro',
	tokens: {
		keyword: '#c678dd',
		string: '#98c379',
		comment: '#5c6370',
		number: '#d19a66',
		function: '#61afef',
		type: '#e5c07b',
		variable: '#e06c75',
		operator: '#56b6c2',
		constant: '#d19a66',
		tag: '#e06c75',
		attribute: '#d19a66',
		property: '#e06c75',
		punctuation: '#abb2bf',
		background: '#282c34',
	},
}

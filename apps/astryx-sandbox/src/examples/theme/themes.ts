// Shared doc themes for the Theme family examples — the same two
// definitions upstream ThemeApply/ThemeNested/ThemeShowcase/ThemeSwitcher
// inline per file, hoisted once here.

import { defineTheme } from '@octane-xplat/ui'

export const warmTheme = defineTheme({
	name: 'warm-docs',
	tokens: {
		'--color-accent': ['#D97706', '#FBBF24'],
		'--color-background-surface': ['#FFF7ED', '#1F1300'],
		'--color-background-card': ['#FFFBEB', '#2A1A05'],
		'--color-text-primary': ['#3B2F15', '#FEF3C7'],
		'--color-text-secondary': ['#92400E', '#FCD34D'],
		'--color-border': ['#FED7AA', '#92400E66'],
		'--radius-container': '20px',
		// Xplat aliases — the app's chrome tokens follow the same tokens
		// the upstream example recolors.
		'--color-primary': ['#D97706', '#FBBF24'],
		'--color-surface': ['#FFF7ED', '#1F1300'],
		'--color-text': ['#3B2F15', '#FEF3C7'],
	},
})

export const forestTheme = defineTheme({
	name: 'forest-docs',
	tokens: {
		'--color-accent': ['#15803D', '#86EFAC'],
		'--color-background-surface': ['#F0FDF4', '#052E16'],
		'--color-background-card': ['#FFFFFF', '#0F3D24'],
		'--color-text-primary': ['#052E16', '#DCFCE7'],
		'--color-text-secondary': ['#166534', '#BBF7D0'],
		'--color-border': ['#BBF7D0', '#15803D66'],
		'--radius-container': '8px',
		'--color-primary': ['#15803D', '#86EFAC'],
		'--color-surface': ['#F0FDF4', '#052E16'],
		'--color-text': ['#052E16', '#DCFCE7'],
	},
})

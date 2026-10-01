import { preset as presetBase } from '@bamboocss/preset-base'
import type { Preset, Theme, UserConfig, UtilityConfig } from '@bamboocss/types'

const portableProperties = [
	'alignItems',
	'alignSelf',
	'backgroundColor',
	'borderColor',
	'borderRadius',
	'borderWidth',
	'color',
	'display',
	'flexDirection',
	'flexGrow',
	'flexShrink',
	'flexWrap',
	'fontFamily',
	'fontSize',
	'fontWeight',
	'gap',
	'height',
	'justifyContent',
	'lineHeight',
	'margin',
	'marginBottom',
	'marginLeft',
	'marginRight',
	'marginTop',
	'maxHeight',
	'maxWidth',
	'minHeight',
	'minWidth',
	'padding',
	'paddingBottom',
	'paddingLeft',
	'paddingRight',
	'paddingTop',
	'textAlign',
	'width',
] as const

const colors = Object.fromEntries(
	[
		'danger',
		'onprimary',
		'primary',
		'surface',
		'surface-secondary',
		'text',
		'text-secondary',
	].map((name) => [name, { value: `var(--color-${name})` }]),
)

const spacing = Object.fromEntries(
	['4'].map((name) => [name, { value: `var(--space-${name})` }]),
)

const radii = Object.fromEntries(
	['sm', 'md', 'lg', 'xl'].map((name) => [name, { value: `var(--radius-${name})` }]),
)

const portableUtilities = Object.fromEntries(
	portableProperties.flatMap((property) => {
		const config = presetBase.utilities[property]
		if (!config) return []
		// Bamboo's default margin scale includes `auto`, which NativeScript
		// ignores; expose token spacing only in the shared preset.
		return [[property, property.startsWith('margin') ? { ...config, values: 'spacing' } : config]]
	}),
) as UtilityConfig

const portableTheme = {
	tokens: {
		colors,
		radii,
		spacing,
	},
} satisfies Theme

/**
 * Utilities and tokens selected for the CSS subset shared by NativeScript and
 * browsers. This intentionally omits Bamboo's full browser-oriented preset;
 * apps can extend it when they have checked a property on their targets.
 */
export const xplatPortablePreset: Preset = {
	name: '@octane-xplat/bamboo/portable',
	utilities: portableUtilities,
	theme: portableTheme,
}

/**
 * Bamboo defaults for apps using the shared Octane xplat stylesheet.
 *
 * Pass this object to `defineConfig` from `@bamboocss/dev`, then add the app's
 * `include` and `outdir`. The shared UI stylesheet declares the matching layer
 * order before `virtual:bamboo.css` is imported.
 */
export const xplatBambooConfig = {
	preflight: false,
	cssVarRoot: ':root, .ns-root',
	layers: {
		reset: 'xplat.reset',
		base: 'xplat.base',
		tokens: 'xplat.tokens',
		recipes: 'xplat.recipes',
		utilities: 'xplat.utilities',
	},
	presets: [],
	utilities: portableUtilities,
	theme: portableTheme,
} satisfies Pick<
		UserConfig,
		'preflight' | 'cssVarRoot' | 'layers' | 'presets' | 'utilities' | 'theme'
	>

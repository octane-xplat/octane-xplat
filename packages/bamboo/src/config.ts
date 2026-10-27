import { preset as presetBase } from '@bamboocss/preset-base'
import type { Preset, Theme, UserConfig, UtilityConfig } from '@bamboocss/types'

// Bamboo 1.56.2 has no flexWrap utility. Keep it outside this selected subset
// rather than promising a utility that cannot be generated.
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

// Token names mirror every --color-* / --radius-* / --space-* variable the
// @octane-xplat/ui default theme (theme/chrome.css `:root, .ns-root` block)
// declares. tests/theme-tokens.test.mjs fails when the lists drift apart.
const colors = Object.fromEntries(
	[
		'primary',
		'onprimary',
		'surface',
		'surface-secondary',
		'text',
		'text-secondary',
		'text-disabled',
		'border',
		'border-strong',
		'danger',
		'warning',
		'success',
		'overlay-hover',
		'overlay-pressed',
		'danger-text',
		'warning-text',
		'success-text',
		'syntax-keyword',
		'syntax-string',
		'syntax-comment',
		'syntax-number',
		'syntax-function',
		'syntax-type',
		'syntax-variable',
		'syntax-operator',
		'syntax-constant',
		'syntax-tag',
		'syntax-attribute',
		'syntax-property',
		'syntax-punctuation',
		'syntax-background',
	].map((name) => [name, { value: `var(--color-${name})` }]),
)

const spacing = Object.fromEntries(['4'].map((name) => [name, { value: `var(--space-${name})` }]))

const radii = Object.fromEntries(
	['sm', 'md', 'lg', 'xl', 'container'].map((name) => [name, { value: `var(--radius-${name})` }]),
)

const portableUtilities = Object.fromEntries(
	portableProperties.map((property) => {
		const config = presetBase.utilities[property]
		if (!config) {
			throw new Error(
				`@octane-xplat/bamboo: missing portable utility "${property}" in @bamboocss/preset-base`,
			)
		}

		// Bamboo's default margin scale includes `auto`, which NativeScript
		// ignores; expose token spacing only in the shared preset.
		return [property, property.startsWith('margin') ? { ...config, values: 'spacing' } : config]
	}),
) as UtilityConfig

const portableTheme = {
	tokens: {
		colors,
		radii,
		spacing,
	},
} satisfies Theme

// Compile through the framework CSS pipeline, rather than adding runtime
// ancestor selectors or selector specificity. These names also generate types.
const platformConditions = {
	web: '@platform web',
	mobile: '@platform mobile',
	native: '@platform native',
	ios: '@platform ios',
	android: '@platform android',
	visionos: '@platform visionos',
	macos: '@platform macos',
	windows: '@platform windows',
	linux: '@platform linux',
	gtk: '@platform gtk',
}

/**
 * Utilities and tokens selected for the CSS subset shared by NativeScript and
 * browsers. This intentionally omits Bamboo's full browser-oriented preset;
 * apps can extend it when they have checked a property on their targets.
 */
export const xplatPortablePreset: Preset = {
	name: '@octane-xplat/bamboo/portable',
	conditions: platformConditions,
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
	conditions: platformConditions,
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
	'conditions' | 'preflight' | 'cssVarRoot' | 'layers' | 'presets' | 'utilities' | 'theme'
>

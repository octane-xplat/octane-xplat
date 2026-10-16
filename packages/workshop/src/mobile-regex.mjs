import { transformAsync, types } from '@babel/core'
import unicodeProperties from '@babel/plugin-transform-unicode-property-regex'

// Compatibility approach shared with apps/mobile/visual-regex.mjs; no testing-host dependency.
/** Compile Unicode properties for the pinned iOS runtime without changing globals. */
export function transformMobileRegex(code, filename = 'workshop-host.mjs') {
	return transformAsync(code, {
		filename,
		configFile: false,
		babelrc: false,
		sourceMaps: true,
		plugins: [
			// Storybook also embeds constant RegExp constructors. Turn only unshadowed
			// built-in constructors into literals for Babel's standard regex transform.
			() => ({
				visitor: {
					NewExpression(path) {
						const node = path.node
						if (
							!types.isIdentifier(node.callee, { name: 'RegExp' }) ||
							path.scope.getBinding('RegExp') ||
							node.arguments.length !== 2
						) {
							return
						}

						const [pattern, flags] = node.arguments
						if (
							types.isStringLiteral(pattern) &&
							types.isStringLiteral(flags) &&
							flags.value.includes('u') &&
							/\\[pP]\{/.test(pattern.value)
						) {
							path.replaceWith(types.regExpLiteral(pattern.value, flags.value))
						}
					},
				},
			}),
			unicodeProperties.default ?? unicodeProperties,
		],
	})
}

export function mobileRegexPlugin() {
	return {
		name: 'xplat-workshop-mobile-unicode-regex',
		async transform(code, id) {
			if (!/\\[pP]\{/.test(code) || !/\.[cm]?js(?:\?|$)/.test(id)) {
				return null
			}

			const result = await transformMobileRegex(code, id.split('?')[0])
			return result ? { code: result.code, map: result.map } : null
		},
		async renderChunk(code, chunk) {
			const result = await transformMobileRegex(code, chunk.fileName)
			return result ? { code: result.code, map: result.map } : null
		},
	}
}

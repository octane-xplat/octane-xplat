import type { Plugin } from 'vite'

/** Adapt Bamboo 1.56.2's configured-environment accounting to an explicit build plan. */
export function buildEnvironments(plugins: Plugin[], names: readonly string[]) {
	const participating = new Set(names)
	if (!participating.size || names.some((name) => !name)) {
		throw new Error('@octane-xplat/bamboo: buildEnvironments must contain environment names')
	}

	const css = plugins.find((plugin) => plugin.name === 'bamboocss:css')
	const resolvedHook = css?.configResolved
	const appHook = css?.buildApp
	const resolved = typeof resolvedHook === 'function' ? resolvedHook : resolvedHook?.handler
	const app = typeof appHook === 'function' ? appHook : appHook?.handler
	if (!css || !resolved || !app) {
		throw new Error(
			'@octane-xplat/bamboo: buildEnvironments requires Bamboo CSS configResolved and buildApp hooks',
		)
	}

	function select<T>(environments: Record<string, T>): Record<string, T> {
		for (const name of participating) {
			if (!Object.hasOwn(environments, name)) {
				throw new Error(`@octane-xplat/bamboo: unknown buildEnvironments entry "${name}"`)
			}
		}
		return Object.fromEntries([...participating].map((name) => [name, environments[name]]))
	}

	// Only Bamboo receives this view. Vite and other plugins retain the full registry.
	css.configResolved = {
		...(typeof resolvedHook === 'object' ? resolvedHook : {}),
		handler(config) {
			return resolved.call(
				this,
				config.command === 'build'
					? { ...config, environments: select(config.environments) }
					: config,
			)
		},
	}
	css.buildApp = {
		...(typeof appHook === 'object' ? appHook : {}),
		handler(builder) {
			return app.call(this, { ...builder, environments: select(builder.environments) })
		},
	}
	plugins.unshift({
		name: 'xplat-bamboo:build-environments',
		apply: 'build',
		buildStart: {
			order: 'pre',
			sequential: true,
			handler() {
				const name = this.environment?.name
				if (!name || !participating.has(name)) {
					this.error(
						`@octane-xplat/bamboo: building environment "${name ?? 'unknown'}" is missing from buildEnvironments; include every environment the builder runs`,
					)
				}
			},
		},
	})
}

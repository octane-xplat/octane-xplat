/** Internal Vite/Rollup plugin protocol. Kept structural so the shared utility
 * does not impose a bundler dependency on runtime consumers. */
type Context = {
	parse(code: string): any
	resolve(
		source: string,
		importer: string | undefined,
		options: any,
	): Promise<{ id: string } | null>
	error(message: string): never
	environment?: { config?: { consumer?: string } }
}

type Options = { ssr?: boolean; custom?: Record<string, unknown> }
const bypass = 'xplat:server-boundary-resolution'
const clean = (id: string) => id.split(/[?#]/, 1)[0].replace(/\\/g, '/')
export const isServerModule = (id: string) =>
	/(?:^|\/)\.server\//.test(clean(id)) || /\.server(?:\.[\w-]+)*$/.test(clean(id))

const server = (context: Context, options?: Options) =>
	options?.ssr || context.environment?.config?.consumer === 'server'

/** Explicit server-only re-exports are erased on clients. Imports and uses must
 * stay in .server modules; ambiguous export-star syntax is rejected. No DCE of
 * arbitrary authored side effects or inference from callback names is needed. */
export function serverBoundary() {
	return {
		name: 'xplat-server-boundary',
		enforce: 'post' as const,
		config: () => ({ build: { rollupOptions: { output: { sourcemapExcludeSources: true } } } }),
		async resolveId(
			this: Context,
			source: string,
			importer: string | undefined,
			options: Options = {},
		) {
			if (server(this, options) || options.custom?.[bypass]) {
				return null
			}
			const resolved = await this.resolve(source, importer, {
				...options,
				skipSelf: true,
				custom: { ...options.custom, [bypass]: true },
			})
			if (isServerModule(source) || (resolved && isServerModule(resolved.id))) {
				this.error(
					`Server-only module ${source} is reachable from client code${importer ? ` in ${importer}` : ''}. Move its use into a .server module and expose an explicit named re-export to server consumers only.`,
				)
			}
			return null
		},
		async transform(this: Context, code: string, id: string, options?: Options) {
			if (server(this, options)) {
				return null
			}
			if (isServerModule(id)) {
				this.error(`Server-only module ${id} entered a client graph`)
			}
			if (!/\.[cm]?[jt]sx?$|\.tsrx$/.test(clean(id)) || !/\b(?:import|export)\b/.test(code)) {
				return null
			}
			const ast = this.parse(code)
			const removed: [number, number][] = []
			const statements = [...ast.body]
			const visit = (node: any) => {
				if (!node || typeof node !== 'object') {
					return
				}
				if (node.type === 'ImportExpression') {
					statements.push(node)
				}
				for (const value of Object.values(node)) {
					if (Array.isArray(value)) {
						value.forEach(visit)
					} else if (value && typeof value === 'object') {
						visit(value)
					}
				}
			}
			visit(ast)
			for (const statement of statements) {
				if (!statement.source?.value) {
					continue
				}

				const source = statement.source.value as string
				const resolved = await this.resolve(source, id, {
					skipSelf: true,
					custom: { [bypass]: true },
				})

				if (!isServerModule(source) && !(resolved && isServerModule(resolved.id))) {
					continue
				}

				if (statement.type !== 'ExportNamedDeclaration' || !statement.specifiers.length) {
					this.error(
						`Client module ${id} must use an explicit named re-export for ${source}; imports and export * cannot cross the server boundary`,
					)
				}

				removed.push([statement.start, statement.end])
			}
			if (!removed.length) {
				return null
			}
			for (const [start, end] of removed.reverse()) {
				code =
					code.slice(0, start) + code.slice(start, end).replace(/[^\r\n]/g, ' ') + code.slice(end)
			}
			// Break the authored source-map chain for server-containing modules.
			// An empty mapping cannot expose text removed by this transform.
			return { code, map: { version: 3, sources: [], names: [], mappings: '', sourcesContent: [] } }
		},
	}
}

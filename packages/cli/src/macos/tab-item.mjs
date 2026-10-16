import { parseModule } from '@tsrx/core'

/** Keep native handles inside a source-tree component that owns their portals. */
export function tabItemContentRoots() {
	return {
		name: 'xplat-appkit-owned-content',
		enforce: 'pre',
		transform(source, id) {
			if (
				!/\.(?:tsx|tsrx)(?:\?|$)/.test(id) ||
				/\.web\.(?:tsx|tsrx)(?:\?|$)/.test(id) ||
				id.includes('/macos-renderer/src/portal-components.macos.tsx')
			)
				return null
			if (/@jsxImportSource\s+@octane-xplat\/jsx\/dom\b/.test(source)) return null
			if (!/tabviewitem|listview/.test(source)) return null
			const ast = parseModule(source, id.split('?')[0])
			const edits = []
			const bindings = new Map()
			const names = { tabviewitem: '__PortalTabItem', listview: '__PortalList' }
			function binding(tag) {
				if (bindings.has(tag)) return bindings.get(tag)
				let name = '__Xplat' + names[tag]
				while (source.includes(name)) name += '_'
				bindings.set(tag, name)
				return name
			}
			function visit(node) {
				if (!node || typeof node !== 'object') return
				if (node.type === 'JSXElement' && node.openingElement.name.type === 'JSXIdentifier') {
					const tag = node.openingElement.name.name
					if (tag in names) {
						const name = binding(tag)
						edits.push([node.openingElement.name.start, node.openingElement.name.end, name])
						if (node.closingElement)
							edits.push([node.closingElement.name.start, node.closingElement.name.end, name])
					}
				}
				for (const [key, value] of Object.entries(node)) {
					if (key === 'metadata' || key === 'loc') continue
					if (Array.isArray(value)) {
						for (const child of value) visit(child)
					} else if (value && typeof value === 'object') visit(value)
				}
			}
			visit(ast)
			if (!edits.length) return null
			let code = source
			for (const [start, end, replacement] of edits.sort((a, b) => b[0] - a[0]))
				code = code.slice(0, start) + replacement + code.slice(end)
			code += `\nimport { ${[...bindings].map(([tag, name]) => `${names[tag]} as ${name}`).join(', ')} } from '@octane-xplat/macos-renderer'\n`
			return { code, map: null }
		},
	}
}

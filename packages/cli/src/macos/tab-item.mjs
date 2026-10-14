import { parseModule } from '@tsrx/core'

/** The raw intrinsic keeps its compiler-owned key/ref identity. Only its
 * children become an opaque prop for the host-owned Octane content root. */
export function tabItemContentRoots() {
	return {
		name: 'xplat-appkit-tab-item-content',
		enforce: 'pre',
		transform(source, id) {
			if (!/\.(?:tsx|tsrx)(?:\?|$)/.test(id) || /\.web\.(?:tsx|tsrx)(?:\?|$)/.test(id) || !source.includes('tabviewitem')) {return null}
			if (/@jsxImportSource\s+@octane-xplat\/jsx\/dom\b/.test(source)) {return null}
			const ast = parseModule(source, id.split('?')[0])
			const edits = []
			let binding = '__XplatTabProps'
			while (source.includes(binding)) {binding += '_'}
			let needsProps = false
			function visit(node) {
				if (!node || typeof node !== 'object') {return}
				if (node.type === 'JSXElement' && node.openingElement.name.type === 'JSXIdentifier' && node.openingElement.name.name === 'tabviewitem') {
					if (node.closingElement) {
						edits.push([node.openingElement.end - 1, node.openingElement.end, ' __tabContent={<>'])
						edits.push([node.closingElement.start, node.closingElement.end, '</>} />'])
					}

					for (const attr of node.openingElement.attributes) {
						if (attr.type === 'JSXAttribute' && attr.name.name === 'children') {edits.push([attr.name.start, attr.name.end, '__tabContent'])}
						if (attr.type === 'JSXSpreadAttribute') {
							needsProps = true
							edits.push([attr.argument.start, attr.argument.start, binding + '('])
							edits.push([attr.argument.end, attr.argument.end, ')'])
						}
					}
				}

				for (const [key, value] of Object.entries(node)) {
					if (key === 'metadata' || key === 'loc') {continue}
					if (Array.isArray(value)) {for (const child of value) {visit(child)}}
					else if (value && typeof value === 'object') {visit(value)}
				}
			}

			visit(ast)
			if (!edits.length) {return null}
			let code = source
			for (const [start, end, replacement] of edits.sort((a, b) => b[0] - a[0])) {code = code.slice(0, start) + replacement + code.slice(end)}
			if (needsProps) {code += `\nimport { __tabItemProps as ${binding} } from '@octane-xplat/macos-renderer'\n`}
			return { code, map: null }
		},
	}
}

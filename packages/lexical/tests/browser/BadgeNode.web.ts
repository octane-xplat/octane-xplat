import { TextNode } from 'lexical'

export class BadgeNode extends TextNode {
	static getType() {
		return 'badge'
	}

	static clone(node: BadgeNode) {
		return new BadgeNode(node.__text, node.__key)
	}

	static importJSON(serialized: any) {
		return $createBadgeNode(serialized.text)
	}

	exportJSON() {
		return { ...super.exportJSON(), type: 'badge', version: 1 }
	}

	static importDOM() {
		return {
			span: (element: HTMLElement) =>
				element.hasAttribute('data-badge')
					? { conversion: () => ({ node: $createBadgeNode(element.textContent ?? '') }), priority: 1 }
					: null,
		}
	}

	exportDOM() {
		const element = document.createElement('span')
		element.setAttribute('data-badge', '')
		element.textContent = this.getTextContent()
		return { element }
	}
}

export function $createBadgeNode(text: string) {
	return new BadgeNode(text)
}

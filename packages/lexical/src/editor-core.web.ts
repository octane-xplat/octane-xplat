import {
	$createParagraphNode,
	$createTextNode,
	$findMatchingParent,
	$getRoot,
	$getSelection,
	$insertNodes,
	$isNodeSelection,
	$isRangeSelection,
	FORMAT_ELEMENT_COMMAND,
	FORMAT_TEXT_COMMAND,
	REDO_COMMAND,
	UNDO_COMMAND,
} from 'lexical'

import {
	$createHeadingNode,
	$createQuoteNode,
	$isHeadingNode,
	$isQuoteNode,
	HeadingNode,
	QuoteNode,
} from '@lexical/rich-text'
import {
	$isListNode,
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	ListItemNode,
	ListNode,
} from '@lexical/list'

import {
	$createLinkNode,
	$isLinkNode,
	AutoLinkNode,
	LinkNode,
	TOGGLE_LINK_COMMAND,
} from '@lexical/link'
import { $createCodeNode, $isCodeNode, CodeNode } from '@lexical/code'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { $isHorizontalRuleNode, INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/extension'
import { $setBlocksType } from '@lexical/selection'
import type { LexicalEditorHandle, LexicalFormat } from './types'

/** The facade's default node set minus the horizontal-rule node, which each
 *  renderer supplies: the web leaf uses the `@octanejs/lexical` decorator
 *  subclass (click-select portal), the framework-free AppKit document uses
 *  `@lexical/extension`'s DOM-native node. Aztec's capability surface plus
 *  AutoLinkNode (parsing safety for docs produced by fuller editors). */
export const SHARED_NODES = [
	HeadingNode,
	QuoteNode,
	ListNode,
	ListItemNode,
	LinkNode,
	AutoLinkNode,
	CodeNode,
]

const HEADING_TAG: Partial<Record<LexicalFormat, 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'>> = {
	heading1: 'h1',
	heading2: 'h2',
	heading3: 'h3',
	heading4: 'h4',
	heading5: 'h5',
	heading6: 'h6',
}

const TEXT_FORMAT: Partial<Record<LexicalFormat, string>> = {
	bold: 'bold',
	italic: 'italic',
	underline: 'underline',
	strikethrough: 'strikethrough',
	code: 'code',
	highlight: 'highlight',
	subscript: 'subscript',
	superscript: 'superscript',
}

const ELEMENT_FORMAT: Partial<Record<LexicalFormat, string>> = {
	alignLeft: 'left',
	alignCenter: 'center',
	alignRight: 'right',
}

/** Toggle a block type at the selection — reverts to paragraph when the
 *  selection already sits in that block type. */
function setBlock(
	editor: any,
	is: (n: any) => boolean,
	create: () => any,
	match?: (n: any) => boolean,
): void {
	editor.update(() => {
		const sel = $getSelection()
		if (!$isRangeSelection(sel)) {
			return
		}
		const block = $findMatchingParent(sel.anchor.getNode(), is)
		const active = block != null && (match ? match(block) : true)
		$setBlocksType(sel, () => (active ? $createParagraphNode() : create()))
	})
}

export function applyFormat(editor: any, format: LexicalFormat): void {
	const text = TEXT_FORMAT[format]
	if (text) {
		editor.dispatchCommand(FORMAT_TEXT_COMMAND, text)
		return
	}

	const el = ELEMENT_FORMAT[format]
	if (el) {
		editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, el)
		return
	}

	const tag = HEADING_TAG[format]
	if (tag) {
		setBlock(
			editor,
			$isHeadingNode,
			() => $createHeadingNode(tag),
			(n) => n.getTag() === tag,
		)
		return
	}

	switch (format) {
		case 'paragraph':
			setBlock(
				editor,
				() => true,
				() => $createParagraphNode(),
				() => false,
			)
			break
		case 'blockquote':
			setBlock(editor, $isQuoteNode, () => $createQuoteNode())
			break
		case 'codeBlock':
			setBlock(editor, $isCodeNode, () => $createCodeNode())
			break
		case 'bulletList':
			editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
			break
		case 'orderedList':
			editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
			break
		case 'taskList':
			editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
			break
		case 'horizontalRule':
			if (!editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)) {
				throw new RangeError('[lexical] horizontalRule requires a command handler plugin')
			}

			break
		default:
			throw new RangeError(`[lexical] Unsupported apply format: ${format}; use linkTo for links`)
	}
}

export function isActive(editor: any, format: LexicalFormat): boolean {
	return editor.read(() => {
		const sel = $getSelection()
		if (sel == null) {
			return false
		}

		const text = TEXT_FORMAT[format]
		if (text) {
			return $isRangeSelection(sel) && sel.hasFormat(text as any)
		}

		const el = ELEMENT_FORMAT[format]
		if (el) {
			const nodes = sel.getNodes()
			return nodes.some((n: any) => {
				const block = $findMatchingParent(n, (p: any) => p.getFormatType != null)
				return block != null && (block as any).getFormatType() === el
			})
		}

		const tag = HEADING_TAG[format]
		if (tag) {
			return sel.getNodes().some((n: any) => {
				const h = $findMatchingParent(n, $isHeadingNode)
				return h?.getTag() === tag
			})
		}

		switch (format) {
			case 'blockquote':
				return sel.getNodes().some((n: any) => $findMatchingParent(n, $isQuoteNode) != null)
			case 'codeBlock':
				return sel.getNodes().some((n: any) => $findMatchingParent(n, $isCodeNode) != null)
			case 'bulletList':
			case 'orderedList':
			case 'taskList': {
				const want =
					format === 'bulletList' ? 'bullet' : format === 'orderedList' ? 'number' : 'check'
				return sel.getNodes().some((n: any) => {
					const l = $findMatchingParent(n, $isListNode)
					return l?.getListType() === want
				})
			}
			case 'link':
				return sel
					.getNodes()
					.some((n: any) => $isLinkNode(n) || $isLinkNode($findMatchingParent(n, $isLinkNode)))
			case 'horizontalRule':
				return $isNodeSelection(sel) && sel.getNodes().some($isHorizontalRuleNode)
			case 'paragraph':
				return sel
					.getNodes()
					.some((n: any) => $findMatchingParent(n, (p: any) => p.getType?.() === 'paragraph'))
			default:
				return false
		}
	})
}

/** Plain-text offset of a selection point — DFS accumulating text size.
 *  Block separators aren't counted; positions are best-effort parity with
 *  the native flat-offset contract, not ProseMirror-style coordinates. */
export function flatOffset(root: any, key: string, offset: number): number {
	const contains = (node: any): boolean =>
		node.getKey() === key || (node.getChildren?.() ?? []).some(contains)

	let acc = 0
	const visit = (node: any): boolean => {
		if (node.getKey() === key) {
			acc += offset
			return true
		}

		for (const c of node.getChildren?.() ?? []) {
			if (contains(c)) {
				if (visit(c)) {
					return true
				}
			} else {
				acc += c.getTextContentSize?.() ?? 0
			}
		}

		return false
	}

	visit(root)
	return acc
}

export function activeFormats(editor: any): LexicalFormat[] {
	const out: LexicalFormat[] = []
	for (const f of Object.keys(TEXT_FORMAT) as LexicalFormat[]) {
		if (isActive(editor, f)) {
			out.push(f)
		}
	}

	for (const f of [
		'paragraph',
		'heading1',
		'heading2',
		'heading3',
		'heading4',
		'heading5',
		'heading6',
		'blockquote',
		'bulletList',
		'orderedList',
		'taskList',
		'codeBlock',
		'link',
	] as LexicalFormat[]) {
		if (isActive(editor, f)) {
			out.push(f)
		}
	}

	return out
}

/** The shared handle contract over a live lexical editor — used by the web
 *  leaf's imperative handle and the bundled AppKit document driver. */
export function bindEditorHandle(editor: any): LexicalEditorHandle {
	return {
		getHTML: () => editor.read(() => $generateHtmlFromNodes(editor)),
		setHTML: (html: string) =>
			editor.update(() => {
				const dom = new DOMParser().parseFromString(html, 'text/html')
				const nodes = $generateNodesFromDOM(editor, dom)
				$getRoot().clear().select()
				$insertNodes(nodes)
			}),
		getJSON: () => editor.getEditorState().toJSON(),
		setJSON: (doc) => editor.setEditorState(editor.parseEditorState(JSON.stringify(doc))),
		apply: (format) => {
			if (format === 'link') {
				throw new RangeError('Use linkTo(url, anchor) to apply a link')
			}
			editor.focus()
			applyFormat(editor, format)
		},
		linkTo: (url, anchor) => {
			if (anchor != null && anchor !== '') {
				editor.update(() => {
					const link = $createLinkNode(url)
					link.append($createTextNode(anchor))
					const sel = $getSelection()
					if ($isRangeSelection(sel)) {
						sel.insertNodes([link])
					}
				})
			} else {
				editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
			}
		},
		removeLink: () => editor.dispatchCommand(TOGGLE_LINK_COMMAND, null),
		isActive: (format) => isActive(editor, format),
		undo: () => editor.dispatchCommand(UNDO_COMMAND, undefined),
		redo: () => editor.dispatchCommand(REDO_COMMAND, undefined),
		focus: () => editor.focus(),
		blur: () => editor.blur(),
		isFocused: () => {
			const root = editor.getRootElement()
			return root != null && root === document.activeElement
		},
		native: editor,
	}
}

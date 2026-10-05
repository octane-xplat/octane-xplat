import { useState, useImperativeHandle, useEffect, useRef } from 'octane'
import {
	AutoFocusPlugin,
	ContentEditable,
	EditorRefPlugin,
	HistoryPlugin,
	LexicalComposer,
	LexicalErrorBoundary,
	LinkPlugin,
	ListPlugin,
	OnChangePlugin,
	RichTextPlugin,
} from '@octanejs/lexical'

import {
	$createParagraphNode,
	$createTextNode,
	$findMatchingParent,
	$getRoot,
	$getSelection,
	$isNodeSelection,
	$isRangeSelection,
	FORMAT_ELEMENT_COMMAND,
	FORMAT_TEXT_COMMAND,
	REDO_COMMAND,
	UNDO_COMMAND,
} from 'lexical'

import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode, HeadingNode, QuoteNode } from '@lexical/rich-text'
import {
	$isListItemNode,
	$isListNode,
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	ListItemNode,
	ListNode,
} from '@lexical/list'

import { $createLinkNode, $isLinkNode, AutoLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { $createCodeNode, $isCodeNode, CodeNode } from '@lexical/code'
import { HorizontalRuleNode, INSERT_HORIZONTAL_RULE_COMMAND, $isHorizontalRuleNode } from '@lexical/extension'
import { $setBlocksType } from '@lexical/selection'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import type { LexicalEditorHandle, LexicalEditorProps, LexicalFormat } from './types'

export const supported = true

/** The facade's default node set — Aztec's capability surface plus
 *  AutoLinkNode (parsing safety for docs produced by fuller editors). */
const NODES = [
	HeadingNode,
	QuoteNode,
	ListNode,
	ListItemNode,
	LinkNode,
	AutoLinkNode,
	CodeNode,
	HorizontalRuleNode,
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
function setBlock(editor: any, is: (n: any) => boolean, create: () => any, match?: (n: any) => boolean): void {
	editor.update(() => {
		const sel = $getSelection()
		if (!$isRangeSelection(sel)) return
		const block = $findMatchingParent(sel.anchor.getNode(), is)
		const active = block != null && (match ? match(block) : true)
		$setBlocksType(sel, () => (active ? $createParagraphNode() : create()))
	})
}

function applyFormat(editor: any, format: LexicalFormat): void {
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
		setBlock(editor, $isHeadingNode, () => $createHeadingNode(tag), (n) => n.getTag() === tag)
		return
	}

	switch (format) {
		case 'paragraph':
			setBlock(editor, () => true, () => $createParagraphNode(), () => false)
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
			editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
			break
	}
}

function isActive(editor: any, format: LexicalFormat): boolean {
	return editor.read(() => {
		const sel = $getSelection()
		if (sel == null) return false

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
				const want = format === 'bulletList' ? 'bullet' : format === 'orderedList' ? 'number' : 'check'
				return sel.getNodes().some((n: any) => {
					const l = $findMatchingParent(n, $isListNode)
					return l?.getListType() === want
				})
			}
			case 'link':
				return sel.getNodes().some(
					(n: any) => $isLinkNode(n) || $isLinkNode($findMatchingParent(n, $isLinkNode)),
				)
			case 'horizontalRule':
				return $isNodeSelection(sel) && sel.getNodes().some($isHorizontalRuleNode)
			case 'paragraph':
				return sel.getNodes().some((n: any) =>
					$findMatchingParent(n, (p: any) => p.getType?.() === 'paragraph'),
				)
			default:
				return false
		}
	})
}

/** Plain-text offset of a selection point — DFS accumulating text size.
 *  Block separators aren't counted; positions are best-effort parity with
 *  the native flat-offset contract, not ProseMirror-style coordinates. */
function flatOffset(root: any, key: string, offset: number): number {
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
				if (visit(c)) return true
			} else {
				acc += c.getTextContentSize?.() ?? 0
			}
		}

		return false
	}

	visit(root)
	return acc
}

function activeFormats(editor: any): LexicalFormat[] {
	const out: LexicalFormat[] = []
	for (const f of Object.keys(TEXT_FORMAT) as LexicalFormat[]) {
		if (isActive(editor, f)) out.push(f)
	}

	for (const f of ['paragraph', 'heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6', 'blockquote', 'bulletList', 'orderedList', 'taskList', 'codeBlock', 'link'] as LexicalFormat[]) {
		if (isActive(editor, f)) out.push(f)
	}

	return out
}

/** Unified editor facade, web half — a LexicalComposer over the published
 *  `@octanejs/lexical` binding, with optional web-only node and plugin composition. */
export function LexicalEditor(props: LexicalEditorProps) @{
	const editorRef = useRef<any>(null)
	const lastEmitted = useRef<string | undefined>(undefined)
	const lastJSON = useRef<string | undefined>(undefined)
	const lastHTMLInput = useRef(JSON.stringify([props.json !== undefined, props.value]))
	const lastJSONInput = useRef(JSON.stringify(props.json))
	const bound = useRef<LexicalEditorHandle | undefined>(undefined)
	const [exposedHandle, setHandle] = useState<LexicalEditorHandle | null>(null)
	useImperativeHandle<LexicalEditorHandle | null>(props.ref, () => exposedHandle, [exposedHandle])

	const initialConfig = {
		namespace: 'octane-xplat/lexical',
		nodes: props.web?.replaceNodes
			? props.web.nodes ?? []
			: [...new Set([...NODES, ...(props.web?.nodes ?? [])])],
		editable: props.editable !== false,
		editorState: props.json != null
			? JSON.stringify(props.json)
			: props.value != null
				? (editor: any) => {
						const dom = new DOMParser().parseFromString(props.value!, 'text/html')
						const nodes = $generateNodesFromDOM(editor, dom)
						$getRoot().append(...nodes)
					}
				: undefined,
		onError: (e: Error) => {
			throw e
		},
	}

	const attach = (editor: any) => {
		if (!editor || bound.current?.native === editor) return
		editorRef.current = editor
		bound.current = {
			getHTML: () => editor.read(() => $generateHtmlFromNodes(editor)),
			setHTML: (html: string) =>
				editor.update(() => {
					const dom = new DOMParser().parseFromString(html, 'text/html')
					const nodes = $generateNodesFromDOM(editor, dom)
					$getRoot().clear().append(...nodes)
				}),
			getJSON: () => editor.getEditorState().toJSON(),
			setJSON: (doc) =>
				editor.setEditorState(editor.parseEditorState(JSON.stringify(doc))),
			apply: (format) => {
				editor.focus()
				applyFormat(editor, format)
			},
			linkTo: (url, anchor) => {
				if (anchor != null && anchor !== '') {
					editor.update(() => {
						const link = $createLinkNode(url)
						link.append($createTextNode(anchor))
						const sel = $getSelection()
						if ($isRangeSelection(sel)) sel.insertNodes([link])
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

		setHandle(bound.current!)
		props.onJSONReady?.(true)
		props.onReady?.()
	}

	// External `value`/`json` changes re-push; editor-emitted docs are skipped
	// (the update already owns the doc).
	useEffect(() => {
		const e = editorRef.current
		if (!e) return
		const stamp = JSON.stringify([props.json !== undefined, props.value])
		if (stamp === lastHTMLInput.current) return
		lastHTMLInput.current = stamp
		if (props.json !== undefined || props.value === undefined || props.value === lastEmitted.current) return
		bound.current?.setHTML(props.value)
	}, [exposedHandle, props.value, props.json])

	useEffect(() => {
		const e = editorRef.current
		if (!e) return
		const stamp = JSON.stringify(props.json)
		if (stamp === lastJSONInput.current) return
		lastJSONInput.current = stamp
		if (props.json === undefined || stamp === lastJSON.current) return
		bound.current?.setJSON(props.json)
	}, [exposedHandle, props.json])

	useEffect(() => {
		editorRef.current?.setEditable(props.editable !== false)
	}, [exposedHandle, props.editable])

	const emitChange = (state: any, editor: any) => {
		const html = state.read(() => $generateHtmlFromNodes(editor))
		lastEmitted.current = html
		props.onChange?.(html)
		const doc = state.toJSON()
		lastJSON.current = JSON.stringify(doc)
		props.onJSONChange?.(doc)
		state.read(() => {
			const sel = $getSelection()
			if ($isRangeSelection(sel) && props.onSelectionChange) {
				const root = $getRoot()
				props.onSelectionChange({
					start: flatOffset(root, sel.anchor.key, sel.anchor.offset),
					end: flatOffset(root, sel.focus.key, sel.focus.offset),
					active: activeFormats(editor),
				})
			}
		})
	}

	<div className={props.className} style={{ position: 'relative', ...props.style }}>
		<LexicalComposer initialConfig={initialConfig}>
			<RichTextPlugin
				contentEditable={
					<ContentEditable
						id={props.id}
						aria-placeholder={props.placeholder ?? ''}
						placeholder={null}
						className="vx-lexical-input"
						style={{ outline: 'none' }}
						onFocus={props.onFocus}
						onBlur={props.onBlur}
					/>
				}
				placeholder={
					props.placeholder ? (
						<div
							className="vx-lexical-placeholder"
							style={{
								position: 'absolute',
								inset: '8px auto auto 10px',
								pointerEvents: 'none',
								opacity: 0.5,
							}}
						>
							{props.placeholder}
						</div>
					) : null
				}
				ErrorBoundary={LexicalErrorBoundary}
			/>
			{!props.web?.replacePlugins ? (
				<>
					<HistoryPlugin />
					<ListPlugin />
					<LinkPlugin />
					{props.autofocus ? <AutoFocusPlugin /> : null}
				</>
			) : null}
			<OnChangePlugin onChange={emitChange} />
			<EditorRefPlugin editorRef={attach} />
			{props.web?.plugins}
		</LexicalComposer>
	</div>
}

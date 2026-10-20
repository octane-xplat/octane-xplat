// Framework-free AppKit webview document — drives lexical's createEditor and
// the upstream @lexical/* register* helpers directly. The macOS transport only
// ferries {value, json, placeholder, editable, autofocus} plus the callback
// surface, so the web leaf's LexicalComposer plugin composition was never
// reachable here; this mounts the same default plugin set (rich-text, list,
// checklist, history, link, horizontal-rule) without a renderer in between.
import {
	$createNodeSelection,
	$getNodeFromDOMNode,
	$getRoot,
	$getSelection,
	$isNodeSelection,
	$isRangeSelection,
	$setSelection,
	CLICK_COMMAND,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_LOW,
	HISTORY_MERGE_TAG,
	createEditor,
	getActiveElement,
	isDOMNode,
	mergeRegister,
} from 'lexical'
import type { LexicalEditor } from 'lexical'
import { registerRichText } from '@lexical/rich-text'
import { registerCheckList, registerList } from '@lexical/list'
import { createEmptyHistoryState, registerHistory } from '@lexical/history'
import { registerLink } from '@lexical/link'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import {
	$createHorizontalRuleNode,
	$isHorizontalRuleNode,
	HorizontalRuleNode,
	INSERT_HORIZONTAL_RULE_COMMAND,
	namedSignals,
} from '@lexical/extension'
import { installEditorDocument } from '@octane-xplat/richtext/browser-transport'
import { SHARED_NODES, activeFormats, bindEditorHandle, flatOffset } from './editor-core.web'
import type { LexicalEditorHandle } from './types'

let editor: LexicalEditor | undefined
let handle: LexicalEditorHandle | undefined
let current: any
let lastEmitted: string | undefined
let lastJSON: string | undefined
let lastHTMLInput: string | undefined
let lastJSONInput: string | undefined
let contentEl: HTMLDivElement
let placeholderEl: HTMLDivElement

/** DOM-native node set: same defaults as the web leaf, with the
 *  @lexical/extension HorizontalRuleNode whose createDOM emits a real <hr>. */
const NODES = [...SHARED_NODES, HorizontalRuleNode]

/** Mirrors $canShowPlaceholder — empty root or a single unindented paragraph
 *  holding only (empty) text nodes. */
function canShowPlaceholder(): boolean {
	return editor!.read(() => {
		if (editor!.isComposing()) {
			return false
		}
		const root = $getRoot()
		if (root.getTextContent().trim() !== '') {
			return false
		}
		const children = root.getChildren()
		if (children.length > 1) {
			return false
		}
		const top = children[0] as any
		if (top == null) {
			return true
		}
		return (
			top.getType() === 'paragraph' &&
			top.__indent === 0 &&
			top.getChildren().every((n: any) => n.getType() === 'text')
		)
	})
}

/** Mirrors the decorator component's click-to-select on <hr> elements —
 *  NodeSelection toggling plus the theme `hrSelected` ('selected') class. */
function syncHorizontalRuleSelection() {
	editor!.read(() => {
		const sel = $getSelection()
		const selected = $isNodeSelection(sel)
			? new Set(sel.getNodes().map((n) => n.getKey()))
			: undefined
		for (const hr of contentEl.querySelectorAll('hr')) {
			const node = $getNodeFromDOMNode(hr)
			if ($isHorizontalRuleNode(node)) {
				hr.classList.toggle('selected', selected != null && selected.has(node.getKey()))
			}
		}
	})
}

function syncPlaceholder() {
	placeholderEl.textContent = current.placeholder ?? ''
	placeholderEl.parentElement!.style.display =
		canShowPlaceholder() && current.placeholder ? '' : 'none'
	contentEl.setAttribute('aria-placeholder', current.placeholder ?? '')
}

installEditorDocument((props) => {
	current = props
	if (!editor) {
		const root = document.getElementById('root')!
		const wrapper = document.createElement('div')
		wrapper.style.position = 'relative'
		contentEl = document.createElement('div')
		contentEl.className = 'vx-lexical-input'
		contentEl.style.outline = 'none'
		contentEl.setAttribute('role', 'textbox')
		contentEl.setAttribute('spellcheck', 'true')
		placeholderEl = document.createElement('div')
		placeholderEl.className = 'vx-lexical-placeholder'
		placeholderEl.style.position = 'absolute'
		placeholderEl.style.inset = '8px auto auto 10px'
		placeholderEl.style.pointerEvents = 'none'
		placeholderEl.style.opacity = '0.5'
		const placeholderWrap = document.createElement('div')
		placeholderWrap.setAttribute('aria-hidden', 'true')
		placeholderWrap.append(placeholderEl)
		wrapper.append(contentEl, placeholderWrap)
		root.append(wrapper)
		contentEl.addEventListener('focus', () => current.onFocus?.())
		contentEl.addEventListener('blur', () => current.onBlur?.())

		editor = createEditor({
			namespace: 'octane-xplat/lexical',
			nodes: NODES,
			editable: current.editable !== false,
			onError: (e) => {
				throw e
			},
		})

		// Seed the document before listeners/root attach — the composer's
		// initialConfig.editorState accepts a string or seed function, core
		// createEditor only takes a live EditorState, so seed explicitly.
		if (current.json != null) {
			editor.setEditorState(editor.parseEditorState(JSON.stringify(current.json)))
		} else if (current.value != null) {
			editor.update(() => {
				const dom = new DOMParser().parseFromString(current.value!, 'text/html')
				const nodes = $generateNodesFromDOM(editor!, dom)
				$getRoot().append(...nodes)
			})
		}

		mergeRegister(
			registerRichText(editor),
			registerList(editor),
			registerCheckList(editor),
			registerHistory(editor, createEmptyHistoryState(), 1000),
			registerLink(editor, namedSignals({ attributes: undefined, validateUrl: undefined })),
			editor.registerCommand(
				INSERT_HORIZONTAL_RULE_COMMAND,
				() => {
					const selection = $getSelection()
					if (!$isRangeSelection(selection)) {
						return false
					}
					if (selection.focus.getNode() !== null) {
						$insertNodeToNearestRoot($createHorizontalRuleNode())
					}

					return true
				},
				COMMAND_PRIORITY_EDITOR,
			),
			editor.registerCommand(
				CLICK_COMMAND,
				(event: MouseEvent) => {
					if (!isDOMNode(event.target)) {
						return false
					}
					const node = $getNodeFromDOMNode(event.target)
					if (!$isHorizontalRuleNode(node)) {
						return false
					}
					const sel = $getSelection()
					const nodeSelection =
						event.shiftKey && $isNodeSelection(sel) ? sel : $createNodeSelection()
					$setSelection(nodeSelection)
					if (node.isSelected()) {
						nodeSelection.delete(node.getKey())
					} else {
						nodeSelection.add(node.getKey())
					}

					return true
				},
				COMMAND_PRIORITY_LOW,
			),
			editor.registerEditableListener((editable) => {
				contentEl.contentEditable = editable ? 'true' : 'false'
				if (editable) {
					contentEl.removeAttribute('aria-readonly')
					contentEl.removeAttribute('aria-autocomplete')
					contentEl.removeAttribute('tabindex')
				} else {
					contentEl.setAttribute('aria-readonly', 'true')
					contentEl.setAttribute('aria-autocomplete', 'none')
					contentEl.tabIndex = -1
				}

				syncPlaceholder()
			}),
			editor.registerUpdateListener(({ editorState, prevEditorState, tags }) => {
				syncPlaceholder()
				syncHorizontalRuleSelection()
				if (tags.has(HISTORY_MERGE_TAG) || prevEditorState.isEmpty()) {
					return
				}
				const e = editor!
				const html = editorState.read(() => $generateHtmlFromNodes(e))
				lastEmitted = html
				current.onChange?.(html)
				const doc = editorState.toJSON()
				lastJSON = JSON.stringify(doc)
				current.onJSONChange?.(doc)
				editorState.read(() => {
					const sel = $getSelection()
					if ($isRangeSelection(sel) && current.onSelectionChange) {
						const root = $getRoot()
						current.onSelectionChange({
							start: flatOffset(root, sel.anchor.key, sel.anchor.offset),
							end: flatOffset(root, sel.focus.key, sel.focus.offset),
							active: activeFormats(e),
						})
					}
				})
			}),
		)

		editor.setRootElement(contentEl)
		if (current.autofocus) {
			editor.focus(() => {
				const rootElement = editor!.getRootElement()
				const activeElement = rootElement !== null ? getActiveElement(rootElement) : null
				if (
					rootElement !== null &&
					(activeElement === null || !rootElement.contains(activeElement))
				) {
					rootElement.focus({ preventScroll: true })
				}
			})
		}

		handle = bindEditorHandle(editor)
		lastHTMLInput = JSON.stringify([current.json !== undefined, current.value])
		lastJSONInput = JSON.stringify(current.json)
		syncPlaceholder()
		props.ref(handle)
	}

	// External `value`/`json` changes re-push; editor-emitted docs are skipped
	// (the update already owns the doc). Stamps track the web leaf's two
	// effects exactly — both advance every props packet.
	const htmlStamp = JSON.stringify([current.json !== undefined, current.value])
	if (htmlStamp !== lastHTMLInput) {
		lastHTMLInput = htmlStamp
		if (
			current.value !== undefined &&
			current.json === undefined &&
			current.value !== lastEmitted
		) {
			handle!.setHTML(current.value)
		}
	}

	const jsonStamp = JSON.stringify(current.json)
	if (jsonStamp !== lastJSONInput) {
		lastJSONInput = jsonStamp
		if (current.json !== undefined && jsonStamp !== lastJSON) {
			handle!.setJSON(current.json)
		}
	}

	editor.setEditable(current.editable !== false)
})

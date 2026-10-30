/** @jsxImportSource @octane-xplat/jsx/dom */
import type { JSX } from 'octane/jsx-runtime'
import { useState, useImperativeHandle, useEffect, useRef } from 'octane'
import {
	AutoFocusPlugin,
	ContentEditable,
	CheckListPlugin,
	HorizontalRulePlugin,
	HorizontalRuleNode,
	EditorRefPlugin,
	HistoryPlugin,
	LexicalComposer,
	LexicalErrorBoundary,
	LinkPlugin,
	ListPlugin,
	OnChangePlugin,
	RichTextPlugin,
} from '@octanejs/lexical'

import { $getRoot, $getSelection, $insertNodes, $isRangeSelection } from 'lexical'

import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { SHARED_NODES, activeFormats, bindEditorHandle, flatOffset } from './editor-core.web'
import type { LexicalEditorHandle, LexicalEditorProps } from './types'

export const supported = true

/** The facade's default node set — Aztec's capability surface plus
 *  AutoLinkNode (parsing safety for docs produced by fuller editors). The
 *  web leaf registers the `@octanejs/lexical` decorator subclass for
 *  click-select; the AppKit document driver composes the same list around
 *  the DOM-native `@lexical/extension` node. */
const NODES = [...SHARED_NODES, HorizontalRuleNode]

/** Unified editor facade, web half — a LexicalComposer over the published
 *  `@octanejs/lexical` binding, with optional web-only node and plugin composition. */
export function LexicalEditor(props: LexicalEditorProps): JSX.Element @{
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
			? (props.web.nodes ?? [])
			: [...new Set([...NODES, ...(props.web?.nodes ?? [])])],
		editable: props.editable !== false,
		editorState:
			props.json != null
				? JSON.stringify(props.json)
				: props.value != null
					? (editor: any) => {
							const dom = new DOMParser().parseFromString(props.value!, 'text/html')
							const nodes = $generateNodesFromDOM(editor, dom)
							$getRoot().select()
							$insertNodes(nodes)
						}
					: undefined,
		onError: (e: Error) => {
			throw e
		},
	}

	const attach = (editor: any) => {
		if (!editor || bound.current?.native === editor) {
			return
		}

		editorRef.current = editor
		bound.current = bindEditorHandle(editor)

		setHandle(bound.current!)
		props.onJSONReady?.(true)
		props.onReady?.()
	}

	// External `value`/`json` changes re-push; editor-emitted docs are skipped
	// (the update already owns the doc).
	useEffect(() => {
		const e = editorRef.current
		if (!e) {
			return
		}

		const stamp = JSON.stringify([props.json !== undefined, props.value])
		if (stamp === lastHTMLInput.current) {
			return
		}

		lastHTMLInput.current = stamp
		if (
			props.json !== undefined ||
			props.value === undefined ||
			props.value === lastEmitted.current
		) {
			return
		}

		bound.current?.setHTML(props.value)
	}, [exposedHandle, props.value, props.json])

	useEffect(() => {
		const e = editorRef.current
		if (!e) {
			return
		}

		const stamp = JSON.stringify(props.json)
		if (stamp === lastJSONInput.current) {
			return
		}

		lastJSONInput.current = stamp
		if (props.json === undefined || stamp === lastJSON.current) {
			return
		}

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
					<CheckListPlugin />
					<HorizontalRulePlugin />
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

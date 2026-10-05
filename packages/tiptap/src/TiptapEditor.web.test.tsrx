// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { Extension, Mark, Node } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { TiptapEditor } from './TiptapEditor.web.tsrx'
import type { TiptapEditorHandle } from './types'

const Spoiler = Mark.create({
	name: 'spoiler',
	parseHTML: () => [{ tag: 'span[data-spoiler]' }],
	renderHTML: () => ['span', { 'data-spoiler': '' }, 0],
})

const Shout = Extension.create({
	name: 'shout',
	addCommands() {
		return {
			shout: () => ({ commands }: any) => commands.setContent('<p>SHOUT</p>'),
		}
	},
})

// Minimal schema for the starterKit:false path — callers dropping the
// built-in kit supply the base nodes themselves.
const Doc = Node.create({ name: 'doc', topNode: true, content: 'block+' })
const Paragraph = Node.create({
	name: 'paragraph',
	group: 'block',
	content: 'inline*',
	parseHTML: () => [{ tag: 'p' }],
	renderHTML: () => ['p', 0],
})

const Text = Node.create({ name: 'text', group: 'inline' })

const roots: any[] = []

function mount(props: any = {}) {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	let handle: TiptapEditorHandle | null = null
	act(() =>
		root.render(
			<TiptapEditor
				{...props}
				ref={(next: TiptapEditorHandle | null) => {
					handle = next
				}}
			/>,
		),
	)

	return { el, root, get handle() { return handle } }
}

afterEach(() => {
	for (const root of roots.splice(0)) act(() => root.unmount())
	document.body.innerHTML = ''
	vi.restoreAllMocks()
})

it('mounts StarterKit by default', () => {
	const { handle } = mount({ value: '<p>Travel notes</p>' })
	const editor = handle!.native
	expect(editor.schema.marks.bold).toBeTruthy()
	expect(editor.schema.nodes.heading).toBeTruthy()
	expect(handle!.getHTML()).toContain('<p>Travel notes</p>')
})

it('registers caller mark extensions alongside StarterKit', () => {
	const { handle } = mount({
		value: '<p>shh <span data-spoiler>secret</span></p>',
		web: { extensions: [Spoiler] },
	})

	const editor = handle!.native
	expect(editor.schema.marks.spoiler).toBeTruthy()
	expect(editor.schema.marks.bold).toBeTruthy()

	const doc = handle!.getJSON()!
	const marks = JSON.stringify(doc)
	expect(marks).toContain('"spoiler"')
	expect(handle!.getHTML()).toContain('data-spoiler')
})

it('exposes commands added by caller extensions', () => {
	const { handle } = mount({ web: { extensions: [Shout] } })
	handle!.native.commands.shout()
	expect(handle!.getHTML()).toContain('SHOUT')
})

it('passes starterKit options to the built-in kit', () => {
	const { handle } = mount({ web: { starterKit: { link: false } } })
	const editor = handle!.native
	expect(editor.schema.marks.link).toBeUndefined()
	expect(editor.schema.marks.bold).toBeTruthy()
})

it('hands the schema to caller extensions when starterKit is false', () => {
	const { handle } = mount({
		web: { starterKit: false, extensions: [Doc, Paragraph, Text, Spoiler] },
	})

	const editor = handle!.native
	expect(editor.schema.marks.spoiler).toBeTruthy()
	expect(editor.schema.marks.bold).toBeUndefined()
	expect(editor.schema.nodes.heading).toBeUndefined()
})

it('never registers StarterKit twice', () => {
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

	const { handle } = mount({
		web: { extensions: [StarterKit.configure({ link: false })] },
	})

	const kits = handle!.native.extensionManager.extensions.filter(
		(extension: any) => extension.name === 'starterKit',
	)

	expect(kits).toHaveLength(1)
	expect(handle!.native.schema.marks.link).toBeUndefined()
	expect(warn).not.toHaveBeenCalledWith(
		expect.stringContaining('Duplicate extension names'),
	)
})

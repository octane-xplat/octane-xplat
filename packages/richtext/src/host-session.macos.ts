import type { RichTextEditorHandle, RichTextEditorProps, RichTextFormat } from './types'

export interface EditorPacket {
	event: string
	html?: string
	json?: any
	selection?: { start: number; end: number; active: RichTextFormat[] }
	focused?: boolean
	message?: string
}

/** Internal transport adapter: synchronous getters read the last WebKit snapshot. */
export function createEditorSession(
	send: (packet: string) => void,
	native: any,
	readProps: () => RichTextEditorProps & {
		onJSONChange?: (doc: any) => void
		onJSONReady?: (ok: boolean) => void
	},
) {
	let disposed = false
	let ready = false
	let html = ''
	let json: any = null
	let active: RichTextFormat[] = []
	let focused = false
	let pending: string[] = []
	const command = (method: string, ...args: any[]) => {
		if (disposed) {
			return
		}

		const packet = JSON.stringify({ method, args })
		if (ready) {
			send(packet)
		} else {
			pending.push(packet)
		}
	}

	const handle: RichTextEditorHandle & { getJSON(): any; setJSON(doc: any): void } = {
		getHTML: () => html,
		setHTML: (value) => command('setHTML', value),
		getJSON: () => json,
		setJSON: (doc) => command('setJSON', doc),
		apply: (format) => command('apply', format),
		linkTo: (url, anchor) => command('linkTo', url, anchor),
		removeLink: () => command('removeLink'),
		isActive: (format) => active.includes(format),
		undo: () => command('undo'),
		redo: () => command('redo'),
		focus: () => command('focus'),
		blur: () => command('blur'),
		isFocused: () => focused,
		native,
	}

	return {
		handle,
		update(props: object) {
			command('props', props)
		},
		receive(serialized: string) {
			if (disposed) {
				return
			}

			const packet: EditorPacket = JSON.parse(serialized)
			const props = readProps()
			if (packet.html !== undefined) {
				html = packet.html
			}

			if ('json' in packet) {
				json = packet.json
			}

			if (packet.selection) {
				active = packet.selection.active
			}

			if (packet.focused !== undefined) {
				focused = packet.focused
			}

			switch (packet.event) {
				case 'boot':
					ready = true
					for (const packet of pending) {
						send(packet)
					}

					pending = []
					break
				case 'ready':
					props.onJSONReady?.(true)
					props.onReady?.()
					break
				case 'change':
					props.onChange?.(html)
					if (json) {
						props.onJSONChange?.(json)
					}

					break
				case 'selection':
					if (packet.selection) {
						props.onSelectionChange?.(packet.selection)
					}

					break
				case 'focus':
					props.onFocus?.()
					break
				case 'blur':
					props.onBlur?.()
					break
				case 'error':
					console.error('[macos-editor] ' + packet.message)
					break
			}
		},
		dispose() {
			if (disposed) {
				return
			}

			disposed = true
			pending = []
			native.dispose()
		},
	}
}

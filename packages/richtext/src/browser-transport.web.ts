const formats = [
	'bold',
	'italic',
	'underline',
	'strikethrough',
	'code',
	'blockquote',
	'bulletList',
	'orderedList',
	'taskList',
	'codeBlock',
	'horizontalRule',
	'highlight',
	'subscript',
	'superscript',
	'paragraph',
	'heading1',
	'heading2',
	'heading3',
	'heading4',
	'heading5',
	'heading6',
	'alignLeft',
	'alignCenter',
	'alignRight',
	'link',
]

/** Internal document transport. Engine handles never cross the WebKit boundary. */
export function installEditorDocument(render: (props: any) => void) {
	let handle: any = null
	const pending: { method: string; args: any[] }[] = []
	let selection = { start: 0, end: 0, active: [] as string[] }
	const post = (event: string, extra: object = {}) => {
		const packet = {
			event,
			html: handle?.getHTML() ?? '',
			json: handle?.getJSON?.() ?? null,
			focused: handle?.isFocused() ?? false,
			selection,
			...extra,
		}

		;(window as any).webkit.messageHandlers.editor.postMessage(JSON.stringify(packet))
	}

	const snapshot = (event: string) => {
		setTimeout(() => {
			if (!handle) {
				return
			}

			selection = { ...selection, active: formats.filter((f) => handle.isActive(f)) }
			post(event)
		}, 0)
	}

	const command = (packet: { method: string; args: any[] }) => {
		if (packet.method === 'props') {
			render({ ...packet.args[0], ...callbacks })
			if (handle) {
				snapshot('snapshot')
			}
		} else if (!handle) {
			pending.push(packet)
		} else if (
			[
				'setHTML',
				'setJSON',
				'apply',
				'linkTo',
				'removeLink',
				'undo',
				'redo',
				'focus',
				'blur',
			].includes(packet.method)
		) {
			handle[packet.method]?.(...packet.args)
			snapshot('snapshot')
		}
	}

	const callbacks = {
		ref(next: any) {
			if (!next || next === handle) {
				return
			}

			handle = next
			snapshot('ready')
			for (const packet of pending.splice(0)) {
				command(packet)
			}
		},
		onChange: () => snapshot('change'),
		onSelectionChange(next: typeof selection) {
			selection = next
			snapshot('selection')
		},
		onFocus: () => snapshot('focus'),
		onBlur: () => snapshot('blur'),
	}

	;(window as any).__xplatEditorReceive = (serialized: string) => {
		try {
			command(JSON.parse(serialized))
		} catch (error) {
			post('error', { message: String(error) })
		}
	}

	window.addEventListener('error', (event) => post('error', { message: event.message }))
	window.addEventListener('unhandledrejection', (event) =>
		post('error', { message: String(event.reason) }),
	)

	post('boot')
}

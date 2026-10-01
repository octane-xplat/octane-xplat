import { createRoot } from 'octane'

export function browserAdapter(target: 'web' | 'linux') {
	const host = document.getElementById('root')!
	let root: ReturnType<typeof createRoot> | undefined
	const errors: ((error: unknown) => void)[] = []
	const onError = (event: ErrorEvent) =>
		errors.forEach((report) => report(event.error ?? event.message))

	const onRejection = (event: PromiseRejectionEvent) =>
		errors.forEach((report) => report(event.reason))

	window.addEventListener('error', onError)
	window.addEventListener('unhandledrejection', onRejection)
	const find = (id: string) =>
		[...host.querySelectorAll<HTMLElement>('[id]')].find((node) => node.id === id) ?? null

	const required = (id: string) => {
		const node = find(id)
		if (!node) {
			throw new Error('Missing probe view: ' + id)
		}

		return node
	}

	return {
		host,
		identity: target === 'linux' ? 'WebKitGTK' : 'Chromium',
		interaction: 'dom-dispatch',
		onError: (report: (error: unknown) => void) => errors.push(report),
		mount(Component: any, props: Record<string, unknown>) {
			root?.unmount()
			host.replaceChildren()
			root = createRoot(host, {
				onUncaughtError: (error: unknown) => errors.forEach((report) => report(error)),
			})

			root.render(Component, props)
		},
		find,
		press(id: string) {
			required(id).click()
		},
		setText(id: string, value: string) {
			const input = required(id) as HTMLInputElement
			input.value = value
			input.dispatchEvent(new Event('input', { bubbles: true }))
			input.dispatchEvent(new Event('change', { bubbles: true }))
		},
		inspect(id: string) {
			const node = required(id)
			const { x, y, width, height } = node.getBoundingClientRect()
			return {
				text: node.textContent ?? '',
				value: (node as HTMLInputElement).value ?? '',
				frame: { x, y, width, height },
			}
		},
		dispose() {
			root?.unmount()
			host.replaceChildren()
			window.removeEventListener('error', onError)
			window.removeEventListener('unhandledrejection', onRejection)
		},
	}
}

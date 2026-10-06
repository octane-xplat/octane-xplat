/** @jsxImportSource @octane-xplat/macos-renderer */
import { useCallback, useRef, useState } from 'octane'
import { createCefBrowser, wireControl, type CefBrowser } from './cef.macos'

function normalizeUrl(raw: string): string {
	const trimmed = raw.trim()
	if (!trimmed) {
		return 'about:blank'
	}

	if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
		return trimmed
	}

	return `https://${trimmed}`
}

export default function App() @{
	const [url, setUrlState] = useState('https://example.com')
	const urlRef = useRef(url)
	const setUrl = (value: string) => {
		urlRef.current = value
		setUrlState(value)
	}
	const [status, setStatus] = useState('CEF: initializing…')
	const [title, setTitle] = useState('')
	const host = useRef<CefBrowser | null>(null)
	const goButton = useRef<any>(null)
	const fieldView = useRef<any>(null)
	const fieldTarget = useRef<any>(null)
	const selfTestFired = useRef(false)

	// Self-test: set the field's text natively, fire its action (commits the
	// edit through the real target/action path), then performClick on Go —
	// proves text-field-driven navigation end to end.
	const maybeSelfTest = () => {
		if (selfTestFired.current || !host.current || !goButton.current) {
			return
		}
		selfTestFired.current = true
		setTimeout(() => {
			console.log('[selftest] set field + fire action + performClick')
			fieldView.current.stringValue = 'https://example.org'
			fieldTarget.current.xplatAction(fieldView.current)
			goButton.current.performClick()
		}, 4000)
		setTimeout(() => {
			console.log('[selftest] injectWheel + requestSource + takeFocus')
			host.current?.injectWheel(0, -240)
			host.current?.requestSource()
			host.current?.takeFocus()
		}, 12000)
		setTimeout(() => {
			console.log('[selftest] focus back to field')
			fieldView.current.window.makeFirstResponder(fieldView.current)
		}, 14000)
	}

	const attach = useCallback((parent: any) => {
		if (!parent) {
			host.current?.close()
			host.current = null
			return
		}

		try {
			const browser = createCefBrowser((event) => {
				console.log(`[cef-event] ${JSON.stringify(event)}`)
				if (event.type === 'created') {
					setStatus('CEF: browser created')
				} else if (event.type === 'nav') {
					setUrl(String(event.url))
				} else if (event.type === 'title') {
					setTitle(String(event.title))
				} else if (event.type === 'loading') {
					setStatus(event.isLoading ? 'CEF: loading…' : 'CEF: idle')
				} else if (event.type === 'error') {
					setStatus(`CEF error ${event.code}: ${event.text}`)
				} else if (event.type === 'popup') {
					setStatus(`popup canceled: ${event.url}`)
				} else if (event.type === 'focus') {
					setStatus(`focus → ${event.where}`)
				}
			})
			host.current = browser
			if (!browser.attachTo(parent, normalizeUrl(url))) {
				setStatus('CEF: attachTo failed')
			}
			maybeSelfTest()
		} catch (error) {
			setStatus(`CEF: ${String(error)}`)
		}
	}, [])

	const navigate = () => {
		host.current?.load(normalizeUrl(urlRef.current))
	}

	<flexboxlayout flexDirection="column" style={{ width: '100%', height: '100%' }}>
		<flexboxlayout flexDirection="row" style={{ padding: 8 }} alignItems="center">
			<button title="←" ref={(view: any) => wireControl(view, () => host.current?.goBack())} />
			<button title="→" ref={(view: any) => wireControl(view, () => host.current?.goForward())} />
			<button title="⟳" ref={(view: any) => wireControl(view, () => host.current?.reload())} />
			<textfield
				flexGrow={1}
				value={url}
				placeholder="URL"
				ref={(view: any) => {
					fieldView.current = view
					fieldTarget.current = wireControl(view, (sender: any) => {
						setUrl(String(sender?.stringValue ?? ''))
					})
				}}
				onTextChange={(value: string) => setUrl(value)}
			/>
			<button
				title="Go"
				ref={(view: any) => {
					goButton.current = view
					wireControl(view, navigate)
				}}
			/>
		</flexboxlayout>
		<label text={status} />
		<label text={title} style={{ fontSize: 12 }} />
		<flexboxlayout ref={attach} flexGrow={1} style={{ backgroundColor: '#222222' }} />
	</flexboxlayout>
}

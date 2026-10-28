import { useState, useEffect, useRef } from 'octane'

export function DemoPreview(props: { demo: string }) @{
	const [state, setState] = useState('idle')
	const [attempt, setAttempt] = useState(0)
	const token = useRef(crypto.randomUUID())
	const launch = useRef<HTMLButtonElement | null>(null)
	const url = `/demo.html?demo=${props.demo}&token=${token.current}`
	useEffect(() => {
		if (state !== 'loading') {
			return
		}

		const ready = (event: MessageEvent) => {
			if (
				event.origin === location.origin &&
				event.data?.token === token.current &&
				event.data?.type === 'xplat-demo-ready' &&
				event.data.demo === props.demo
			) {
				setState('ready')
			}
		}

		window.addEventListener('message', ready)
		const timeout = setTimeout(() => setState('error'), 15000)
		return () => {
			clearTimeout(timeout)
			window.removeEventListener('message', ready)
		}
	}, [state, attempt])

	const start = () => {
		token.current = crypto.randomUUID()
		setAttempt(attempt + 1)
		setState('loading')
	}

	const close = () => {
		setState('idle')
		requestAnimationFrame(() => launch.current?.focus())
	}

	<section className="demo-preview" aria-label="Browser preview">
		<p>Browser preview · no native simulator</p>
		<button ref={launch} onClick={start} disabled={state === 'loading' || state === 'ready'}>
			Try in browser
		</button>
		<a href={url}>Open standalone</a>
		<p role="status">
			{state === 'loading'
				? 'Loading browser demo…'
				: state === 'error'
					? 'Preview could not load. Retry or open standalone.'
					: state === 'ready'
						? 'Browser demo ready.'
						: 'The demo loads when you choose Try in browser.'}
		</p>
		@if (state === 'error') {
			<button onClick={start}>Retry</button>
		}
		@if (state === 'loading' || state === 'ready') {
			<>
				<button onClick={close}>Close preview</button>
				<iframe
					key={attempt}
					title={
						props.demo === 'packing-list'
							? 'Packing list browser demo'
							: 'Goal counter browser demo'
					}
					src={url}
					onError={() => setState('error')}
				/>
			</>
		}
	</section>
}

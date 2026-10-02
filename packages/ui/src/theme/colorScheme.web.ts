import { useSyncExternalStore } from 'octane'

export type { ColorScheme } from '../props'
import type { ColorScheme } from '../props'

type HostTransport = {
	listen(listener: (message: string) => void): () => void
}

const hostTransport = () =>
	typeof window === 'undefined'
		? null
		: (((window as any).__xplatHostTransport as HostTransport | undefined) ?? null)

let hostedScheme: ColorScheme =
	typeof window === 'undefined'
		? 'light'
		: ((window as any).__xplatHostSnapshot?.colorScheme ??
			(window as any).__xplatColorScheme ??
			'light')

function getSystemScheme(): ColorScheme {
	return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
		? 'dark'
		: 'light'
}

export function getColorScheme(): ColorScheme {
	return hostTransport() ? hostedScheme : getSystemScheme()
}

export function subscribeSystemScheme(cb: () => void): () => void {
	const transport = hostTransport()
	if (!transport) {
		const mq = matchMedia('(prefers-color-scheme: dark)')
		mq.addEventListener('change', cb)
		return () => mq.removeEventListener('change', cb)
	}

	const onTransportMessage = (message: string) => {
		try {
			const packet = JSON.parse(message) as { type?: string; name?: string; payload?: unknown }
			if (packet.type === 'event' && packet.name === 'appearance.change') {
				hostedScheme = packet.payload === 'dark' ? 'dark' : 'light'
				cb()
			}
		} catch {
			// Host messages are strings; unrelated malformed traffic is ignored.
		}
	}

	const onCompatEvent = (event: Event) => {
		hostedScheme = (event as CustomEvent).detail === 'dark' ? 'dark' : 'light'
		cb()
	}

	const offTransport = transport.listen(onTransportMessage)
	window.addEventListener('xplat:appearance.change', onCompatEvent)
	return () => {
		offTransport()
		window.removeEventListener('xplat:appearance.change', onCompatEvent)
	}
}

export function useColorScheme(): ColorScheme {
	return useSyncExternalStore(subscribeSystemScheme, getColorScheme)
}

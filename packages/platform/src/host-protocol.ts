/** A native capability callable from an app-owned desktop webview. */
export type HostServiceMethod = (...args: any[]) => unknown

/** Services registered in the native JavaScript host. */
export type HostServiceMap = Record<string, Record<string, HostServiceMethod>>

/** Named notifications emitted by the native host. */
export type HostEventMap = Record<string, unknown>

/** Methods available from the current native host. */
export type HostCapabilities = Record<string, string[]>

export type HostCallRequest = {
	type: 'call'
	id: number
	service: string
	method: string
	args: unknown[]
}

export type HostCapabilitiesRequest = { type: 'capabilities'; id: number }
export type HostRequest = HostCallRequest | HostCapabilitiesRequest

export type HostReplyMessage =
	| { type: 'reply'; id: number; ok: true; value: unknown }
	| { type: 'reply'; id: number; ok: false; error: string }

export type HostEventMessage = { type: 'event'; name: string; payload: unknown }
export type HostMessage = HostReplyMessage | HostEventMessage

/** Message transport supplied by a webview's native host. */
export interface HostTransport {
	postMessage(message: string): void
	listen(listener: (message: string) => void): () => void
}

type ArgumentsOf<Method> = Method extends (...args: infer Args) => unknown ? Args : never
type ResultOf<Method> = Method extends (...args: any[]) => infer Result ? Awaited<Result> : never

/**
 * Type-safe client for services and events implemented by a desktop host.
 * The method signatures are shared with the host through the caller's generic
 * service and event maps; the wire protocol carries ordinary JSON messages.
 */
export interface HostClient<
	Services extends object = HostServiceMap,
	Events extends object = HostEventMap,
> {
	call<Service extends keyof Services & string, Method extends keyof Services[Service] & string>(
		service: Service,
		method: Method,
		...args: ArgumentsOf<Services[Service][Method]>
	): Promise<ResultOf<Services[Service][Method]>>
	capabilities(): Promise<HostCapabilities>
	on<Event extends keyof Events & string>(
		name: Event,
		listener: (payload: Events[Event]) => void,
	): () => void
	dispose(): void
}

/** A transport endpoint that replies to requests and delivers host events. */
export interface HostReplyPort {
	reply(message: string): void
	emit(message: string): void
}

/**
 * Create the webview-side client. Host methods are typed at compile time; this
 * deliberately does not add runtime schema validation.
 */
export function createHostClient<Services extends object, Events extends object = HostEventMap>(
	transport: HostTransport,
): HostClient<Services, Events> {
	const pending = new Map<number, { resolve(value: unknown): void; reject(error: Error): void }>()
	const listeners = new Map<string, Set<(payload: unknown) => void>>()
	let nextId = 0
	let disposed = false

	const removeListener = transport.listen((message) => {
		const packet = JSON.parse(message) as HostMessage
		if (packet.type === 'reply') {
			const task = pending.get(packet.id)
			if (!task) {
				return
			}

			pending.delete(packet.id)
			if (packet.ok) {
				task.resolve(packet.value)
			} else {
				task.reject(new Error(packet.error))
			}

			return
		}

		for (const listener of listeners.get(packet.name) ?? []) {
			listener(packet.payload)
		}
	})

	const request = (value: Omit<HostCallRequest, 'id'> | Omit<HostCapabilitiesRequest, 'id'>) => {
		if (disposed) {
			return Promise.reject(new Error('desktop host client is disposed'))
		}

		const id = ++nextId
		const promise = new Promise<unknown>((resolve, reject) => pending.set(id, { resolve, reject }))
		try {
			transport.postMessage(JSON.stringify({ ...value, id }))
		} catch (error) {
			const task = pending.get(id)
			pending.delete(id)
			task?.reject(error instanceof Error ? error : new Error(String(error)))
		}

		return promise
	}

	return {
		call: ((service, method, ...args) =>
			request({ type: 'call', service, method, args }) as Promise<unknown>) as HostClient<
			Services,
			Events
		>['call'],
		capabilities() {
			return request({ type: 'capabilities' }) as Promise<HostCapabilities>
		},
		on(name, listener) {
			const eventListeners = listeners.get(name) ?? new Set()
			const receive = listener as (payload: unknown) => void
			eventListeners.add(receive)
			listeners.set(name, eventListeners)
			return () => {
				eventListeners.delete(receive)
				if (!eventListeners.size) {
					listeners.delete(name)
				}
			}
		},
		dispose() {
			if (disposed) {
				return
			}

			disposed = true
			removeListener()
			listeners.clear()
			for (const task of pending.values()) {
				task.reject(new Error('desktop host client is disposed'))
			}

			pending.clear()
		},
	}
}

/**
 * Create the native-host dispatcher. Application services and framework
 * services share the same typed registry and protocol.
 */
export function createHostDispatcher<Services extends object, Events extends object = HostEventMap>(
	services: Services,
	port: HostReplyPort,
) {
	return {
		async dispatch(message: string): Promise<void> {
			const request = JSON.parse(message) as HostRequest
			if (request.type === 'capabilities') {
				const capabilities = Object.fromEntries(
					Object.entries(services).map(([name, methods]) => [name, Object.keys(methods)]),
				) as HostCapabilities

				port.reply(JSON.stringify({ type: 'reply', id: request.id, ok: true, value: capabilities }))
				return
			}

			try {
				const method = (services as HostServiceMap)[request.service]?.[request.method]
				if (typeof method !== 'function') {
					throw new Error(`desktop host has no ${request.service}.${request.method} service`)
				}

				const value = await method(...request.args)
				port.reply(JSON.stringify({ type: 'reply', id: request.id, ok: true, value }))
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error)
				port.reply(JSON.stringify({ type: 'reply', id: request.id, ok: false, error: message }))
			}
		},
		emit<Event extends keyof Events & string>(name: Event, payload: Events[Event]): void {
			port.emit(JSON.stringify({ type: 'event', name, payload }))
		},
	}
}

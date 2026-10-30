/** A native capability callable from an app-owned desktop webview. The
 *  signature stays `any[]`/`unknown` — concrete types flow through the
 *  caller's `HostServiceMap` generic instead of this fallback shape. */
export type HostServiceMethod = (...args: any[]) => unknown

/** Services registered in the native JavaScript host. */
export type HostServiceMap = Record<string, Record<string, HostServiceMethod>>

/** Named notifications emitted by the native host. */
export type HostEventMap = Record<string, unknown>

/** Methods available from the current native host. */
export type HostCapabilities<Services extends object = HostServiceMap> = {
	[Service in keyof Services & string]?: (keyof Services[Service] & string)[]
} & Record<string, string[] | undefined>

/** Service-call request message. */
export type HostCallRequest = {
	/** Message discriminator. */
	type: 'call'
	/** Request correlation id. */
	id: number
	/** Target service name. */
	service: string
	/** Target method name. */
	method: string
	/** Positional arguments. */
	args: unknown[]
}

/** Capabilities query. */
export type HostCapabilitiesRequest = {
	/** Message discriminator. */
	type: 'capabilities'
	/** Request correlation id. */
	id: number
}
/** Request envelope union. */
export type HostRequest = HostCallRequest | HostCapabilitiesRequest

/** Service-call reply. */
export type HostReplyMessage =
	| {
			/** Message discriminator. */
			type: 'reply'
			/** Correlation id of the request being answered. */
			id: number
			/** The call succeeded — `value` carries the awaited result. */
			ok: true
			value: unknown
	  }
	| {
			/** Message discriminator. */
			type: 'reply'
			/** Correlation id of the request being answered. */
			id: number
			/** The call threw — `error` carries the message. */
			ok: false
			error: string
	  }

/** Host-emitted event. */
export type HostEventMessage = {
	/** Message discriminator. */
	type: 'event'
	/** Event name — keys the client's listener set. */
	name: string
	/** Event payload, JSON-serialized. */
	payload: unknown
}
/** Envelope for host-bound messages. */
export type HostMessage = HostReplyMessage | HostEventMessage

/** Message transport supplied by a webview's native host. */
export interface HostTransport {
	/** Send a serialized message frame to the host. */
	postMessage(message: string): void
	/** Subscribe to frames from the host; returns an unsubscribe. */
	listen(listener: (message: string) => void): () => void
}

type ArgumentsOf<Method> = Method extends (...args: infer Args) => unknown ? Args : never
type ResultOf<Method> = Method extends (...args: any[]) => infer Result ? Awaited<Result> : never

/** Service-shaped frontend API whose bridge calls preserve the host's types. */
export type HostServiceClient<Services extends object> = {
	[Service in keyof Services & string]: {
		[Method in keyof Services[Service] & string]: (
			...args: ArgumentsOf<Services[Service][Method]>
		) => Promise<ResultOf<Services[Service][Method]>>
	}
}

/**
 * Type-safe client for services and events implemented by a desktop host.
 * The method signatures are shared with the host through the caller's generic
 * service and event maps; the wire protocol carries ordinary JSON messages.
 */
export interface HostClient<
	Services extends object = HostServiceMap,
	Events extends object = HostEventMap,
> {
	/** Invoke a host service method over the transport; resolves with the awaited result, rejects on host errors or disposal. */
	call<Service extends keyof Services & string, Method extends keyof Services[Service] & string>(
		/** Target service name. */
		service: Service,
		/** Target method name. */
		method: Method,
		...args: ArgumentsOf<Services[Service][Method]>
	): Promise<ResultOf<Services[Service][Method]>>
	/** Query which methods the connected host exposes, per service. */
	capabilities(): Promise<HostCapabilities<Services>>
	/** Subscribe to a host event; returns an unsubscribe. */
	on<Event extends keyof Events & string>(
		/** Event name. */
		name: Event,
		listener: (payload: Events[Event]) => void,
	): () => void
	/** Tear down the client — rejects pending calls and removes listeners; idempotent. */
	dispose(): void
}

/** A transport endpoint that replies to requests and delivers host events. */
export interface HostReplyPort {
	/** Send a reply frame answering a request. */
	reply(message: string): void
	/** Send an event frame to subscribers. */
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
		let packet: HostMessage
		try {
			packet = JSON.parse(message) as HostMessage
		} catch {
			// A malformed frame is dropped — it must not throw inside the
			// host's receive path or poison the transport listener.
			return
		}

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
			return request({ type: 'capabilities' }) as Promise<HostCapabilities<Services>>
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
		/** Route one serialized request to a service method and reply on the port. */
		async dispatch(message: string): Promise<void> {
			const request = JSON.parse(message) as HostRequest
			if (request.type === 'capabilities') {
				const capabilities = Object.fromEntries(
					Object.entries(services).map(([name, methods]) => [name, Object.keys(methods)]),
				) as HostCapabilities<Services>

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
		/** Publish a typed event to connected clients. */
		emit<Event extends keyof Events & string>(name: Event, payload: Events[Event]): void {
			port.emit(JSON.stringify({ type: 'event', name, payload }))
		},
	}
}

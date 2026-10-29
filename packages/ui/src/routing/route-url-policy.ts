/** Incoming links become application-relative URLs before strict route parsing.
 * Custom scheme authorities are the first path segment: pack://items/coat.
 * HTTP(S) authorities are origins and must be explicitly trusted. */
export function createRouteUrlPolicy(options: {
	allowedSchemes?: readonly string[]
	allowedOrigins?: readonly string[]
}) {
	const schemes = new Set(
		(options.allowedSchemes ?? []).map((value) => {
			const scheme = value.toLowerCase().replace(/:$/, '')
			if (
				!/^[a-z][a-z\d+.-]*$/.test(scheme) ||
				['http', 'https', 'javascript', 'vbscript', 'data', 'file', 'blob'].includes(scheme)
			) {
				throw new TypeError(`Invalid application URL scheme '${value}'`)
			}
			return scheme
		}),
	)
	const origin = (scheme: string, authority: string) => {
		if (!/^(?:[a-z\d.-]+|\[[a-f\d:]+\])(?::\d+)?$/i.test(authority)) {
			throw new TypeError('Invalid URL authority')
		}
		const port = /:(\d+)$/.exec(authority)
		if (port && Number(port[1]) > 65535) {
			throw new TypeError('Invalid URL port')
		}
		const host = authority.toLowerCase().replace(scheme === 'https' ? /:443$/ : /:80$/, '')
		return scheme + '://' + host
	}
	const origins = new Set(
		(options.allowedOrigins ?? []).map((value) => {
			const match = /^(https?):\/\/([^/?#]+)\/?$/i.exec(value)
			if (!match) {
				throw new TypeError(`Expected an HTTP(S) origin, received '${value}'`)
			}
			return origin(match[1].toLowerCase(), match[2])
		}),
	)
	return (value: string): string => {
		// Incoming URLs must reject literal ASCII controls before parsing.
		// oxlint-disable-next-line no-control-regex
		if (/[\u0000-\u0020\u007f\\]/.test(value)) {
			throw new TypeError('URL contains unescaped whitespace or a backslash')
		}
		if (value.startsWith('/') && !value.startsWith('//')) {
			return value
		}
		const match = /^([a-z][a-z\d+.-]*):\/\/([^/?#]*)(.*)$/i.exec(value)
		if (!match) {
			throw new TypeError('Expected an application-relative or configured absolute URL')
		}
		const [, protocol, authority, suffix] = match
		const scheme = protocol.toLowerCase()
		if (scheme === 'http' || scheme === 'https') {
			if (!origins.has(origin(scheme, authority))) {
				throw new TypeError('URL origin is not allowed')
			}

			return (suffix.startsWith('/') ? '' : '/') + suffix
		}
		if (!schemes.has(scheme) || /[:@]/.test(authority)) {
			throw new TypeError('URL scheme or authority is not allowed')
		}
		return '/' + authority + (authority || !suffix.startsWith('/') ? suffix : suffix.slice(1))
	}
}

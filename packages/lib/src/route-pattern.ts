/** Normalize one file-router segment into the public pattern vocabulary. */
export function normalizeRouteSegment(segment: string): string {
	if (!segment.startsWith('[') || !segment.endsWith(']')) {return segment}
	const inner = segment.slice(1, -1)
	if (inner.startsWith('[') && inner.endsWith(']')) {
		const optional = inner.slice(1, -1)
		return optional.startsWith('...') ? '*' + optional.slice(3) : ':' + optional + '?'
	}
	return inner.startsWith('...') ? '*' + inner.slice(3) : ':' + inner
}

/** Return a pattern segment's parameter name, or undefined for a static segment. */
export function routeParamName(segment: string): string | undefined {
	if (segment.startsWith(':')) {
		return segment.endsWith('?') ? segment.slice(1, -1) : segment.slice(1)
	}
	if (segment.startsWith('*')) {return segment.slice(1) || '*'}
	return undefined
}

/** Normalize file/spec path segments, removing a trailing index component. */
export function routePatternSegments(path: string): string[] {
	const segments = path.split('/').filter(Boolean).map(normalizeRouteSegment)
	if (segments[segments.length - 1] === 'index') {segments.pop()}
	return segments
}

/** Canonical public route identity: an absolute pattern, with '/' for the index. */
export function routePatternPath(path: string): string {
	return '/' + routePatternSegments(path).join('/')
}

/** Match encoded URL segments; optional params backtrack and splats capture strings.
 * The decoder lets legacy callers retain their historical value codec. Malformed
 * encoding throws URIError, to be classified by the external-input boundary. */
export function matchRouteSegments(
	pattern: readonly string[],
	segments: readonly string[],
	decode: (value: string) => unknown = decodeURIComponent,
): Record<string, unknown> | null {
	const params: Record<string, unknown> = {}
	const assign = (key: string, value: unknown) =>
		Object.defineProperty(params, key, {
			value,
			configurable: true,
			enumerable: true,
			writable: true,
		})
	const walk = (pi: number, si: number): boolean => {
		if (pi === pattern.length) {return si === segments.length}
		const segment = pattern[pi]
		if (segment.startsWith('*') && pi === pattern.length - 1) {
			assign(routeParamName(segment)!, segments.slice(si).map(decodeURIComponent).join('/'))
			return true
		}
		if (segment.startsWith(':')) {
			const name = routeParamName(segment)!
			if (si < segments.length) {
				assign(name, decode(segments[si]))
				if (walk(pi + 1, si + 1)) {return true}
				delete params[name]
			}
			return segment.endsWith('?') && walk(pi + 1, si)
		}
		return segment === segments[si] && walk(pi + 1, si + 1)
	}
	return walk(0, 0) ? params : null
}

/** Raw URL search values. Repeated keys are arrays; '+' follows form encoding. */
export type RouteSearchValues = Record<string, string | string[]>

/** Scalar search input accepted by the strict URL codec. Nullish values are omitted. */
export type RouteSearchInput = Record<
	string,
	string | number | boolean | null | undefined | readonly (string | number | boolean)[]
>

/** Parse an application-relative URL without browser globals. Malformed encoding
 * throws URIError; out-of-base and non-relative paths throw TypeError. */
export function parseRouteLocation(value: string, base = '/') {
	if (!value.startsWith('/') || value.startsWith('//')) {
		throw new TypeError('Expected an application-relative URL')
	}
	const hashAt = value.indexOf('#')
	const hash = hashAt < 0 ? undefined : decodeURIComponent(value.slice(hashAt + 1))
	const withoutHash = hashAt < 0 ? value : value.slice(0, hashAt)
	const queryAt = withoutHash.indexOf('?')
	let path = queryAt < 0 ? withoutHash : withoutHash.slice(0, queryAt)
	const prefix = '/' + base.split('/').filter(Boolean).join('/')
	if (prefix !== '/') {
		if (path === prefix) {path = '/'}
		else if (path.startsWith(prefix + '/')) {path = path.slice(prefix.length)}
		else {throw new TypeError('URL is outside the configured route base')}
	}
	const segments = path.split('/').filter(Boolean)
	// Validate even unmatched paths, so malformed input cannot become not-found.
	for (const segment of segments) {decodeURIComponent(segment)}
	const search: RouteSearchValues = {}
	const query = queryAt < 0 ? '' : withoutHash.slice(queryAt + 1)
	const decode = (part: string) => decodeURIComponent(part.replace(/\+/g, ' '))
	for (const pair of query.split('&')) {
		if (!pair) {continue}
		const equalAt = pair.indexOf('=')
		const key = decode(equalAt < 0 ? pair : pair.slice(0, equalAt))
		const next = decode(equalAt < 0 ? '' : pair.slice(equalAt + 1))
		const previous = Object.prototype.hasOwnProperty.call(search, key) ? search[key] : undefined
		const data =
			previous === undefined ? next : [...(Array.isArray(previous) ? previous : [previous]), next]
		Object.defineProperty(search, key, {
			value: data,
			enumerable: true,
			configurable: true,
			writable: true,
		})
	}
	return { segments, search, hash }
}

/** Build a strict destination URL. Path fields must be declared strings; search
 * is scalar/repeated scalar data. Objects and nonfinite numbers are rejected,
 * never silently coerced or JSON-decoded on the receiving side. */
export function buildRouteLocation(
	pattern: readonly string[],
	params: Readonly<Record<string, string | undefined>> = {},
	search: RouteSearchInput = {},
	hash?: string,
	base = '/',
): string {
	const known = new Set(pattern.flatMap((segment) => routeParamName(segment) ?? []))
	for (const key of Object.keys(params)) {
		if (!known.has(key)) {throw new TypeError(`Undeclared path parameter: ${key}`)}
	}
	const segments = pattern.flatMap((segment, index) => {
		const name = routeParamName(segment)
		if (name === undefined) {return [encodeURIComponent(segment)]}
		if (segment.startsWith('*') && index !== pattern.length - 1) {
			throw new TypeError('A catch-all must be the final segment')
		}
		const value = Object.prototype.hasOwnProperty.call(params, name) ? params[name] : undefined
		if (value === undefined || value === '') {
			if (segment.endsWith('?') || segment.startsWith('*')) {return []}
			throw new TypeError(`Missing path parameter: ${name}`)
		}
		if (typeof value !== 'string') {throw new TypeError(`Path parameter must be a string: ${name}`)}
		return segment.startsWith('*')
			? value.split('/').map(encodeURIComponent)
			: [encodeURIComponent(value)]
	})
	const pairs: string[] = []
	for (const key of Object.keys(search).sort()) {
		const value = search[key]
		if (value === undefined || value === null) {continue}
		for (const item of Array.isArray(value) ? value : [value]) {
			if (
				!['string', 'number', 'boolean'].includes(typeof item) ||
				(typeof item === 'number' && !Number.isFinite(item))
			)
				{throw new TypeError(`Search value must be a finite scalar: ${key}`)}
			pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(item)))
		}
	}
	const prefix = base.split('/').filter(Boolean).join('/')
	const path = '/' + (prefix ? [prefix, ...segments] : segments).join('/')
	return (
		path +
		(pairs.length ? '?' + pairs.join('&') : '') +
		(hash ? '#' + encodeURIComponent(hash) : '')
	)
}

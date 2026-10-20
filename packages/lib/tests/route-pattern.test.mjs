import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
	matchRouteSegments,
	parseRouteLocation,
	buildRouteLocation,
	routePatternPath,
	routePatternSegments,
	routeParamName,
} from '../src/route-pattern.ts'

test('file and spec grammar share canonical root, optional, and catch-all identities', () => {
	for (const [input, output] of [
		['', '/'],
		['index', '/'],
		['/items/index/', '/items'],
		['items/[id]', '/items/:id'],
		['[[locale]]/help', '/:locale?/help'],
		['docs/[...rest]', '/docs/*rest'],
		['docs/[[...rest]]', '/docs/*rest'],
	])
		{assert.equal(routePatternPath(input), output)}
	assert.equal(routeParamName(':locale?'), 'locale')
	assert.equal(routeParamName('*'), '*')
	assert.equal(routeParamName('index'), undefined)
})

test('matching preserves the root, backtracks optional prefixes, and decodes splats', () => {
	assert.deepEqual(matchRouteSegments([], []), {})
	assert.deepEqual(matchRouteSegments(routePatternSegments('[[locale]]/help'), ['help']), {})
	assert.deepEqual(matchRouteSegments([':id'], ['a%2Fb']), { id: 'a/b' })
	assert.deepEqual(matchRouteSegments(['docs', '*rest'], ['docs', 'a%20b', 'c']), { rest: 'a b/c' })
	assert.equal(matchRouteSegments(['items', ':id'], ['missing']), null)
	assert.throws(() => matchRouteSegments([':id'], ['%ZZ']), URIError)
})

test('special property names are ordinary own params, never prototype mutation', () => {
	const params = matchRouteSegments([':__proto__', ':constructor'], ['safe', 'value'])
	assert.equal(Object.getPrototypeOf(params), Object.prototype)
	assert.equal(params.__proto__, 'safe')
	assert.equal(params.constructor, 'value')
})

test('strict URLs round-trip scalars, repeated keys, literal json prefixes, hashes, and route bases', () => {
	const pattern = routePatternSegments('/items/:id')
	const href = buildRouteLocation(
		pattern,
		{ id: 'json:a/b' },
		{ tags: ['a+b', 'c d'], page: 2 },
		'a#b',
		'/app/',
	)
	assert.equal(href, '/app/items/json%3Aa%2Fb?page=2&tags=a%2Bb&tags=c%20d#a%23b')
	const parsed = parseRouteLocation(href, '/app')
	assert.deepEqual(matchRouteSegments(pattern, parsed.segments), { id: 'json:a/b' })
	assert.deepEqual(parsed.search, { page: '2', tags: ['a+b', 'c d'] })
	assert.equal(parsed.hash, 'a#b')
	assert.deepEqual(parseRouteLocation('/?query=a+b').search, { query: 'a b' })
	assert.deepEqual(parseRouteLocation('/app', '/app').segments, [])
	assert.deepEqual(parseRouteLocation('/?__proto__=safe&constructor=value').search, {
		['__proto__']: 'safe',
		constructor: 'value',
	})
})

test('strict codec rejects missing/extra paths, opaque data, invalid encodings, and foreign bases', () => {
	assert.throws(() => buildRouteLocation(['items', ':id']), /Missing path/)
	assert.throws(() => buildRouteLocation(['items'], { id: 'extra' }), /Undeclared/)
	assert.throws(() => buildRouteLocation([], {}, { value: {} }), /finite scalar/)
	assert.throws(() => buildRouteLocation([], {}, { value: NaN }), /finite scalar/)
	assert.throws(() => parseRouteLocation('/unknown/%ZZ'), URIError)
	assert.throws(() => parseRouteLocation('/?value=%ZZ'), URIError)
	assert.throws(() => parseRouteLocation('/application', '/app'), /outside/)
	assert.throws(() => parseRouteLocation('//other.test/path'), /application-relative/)
})

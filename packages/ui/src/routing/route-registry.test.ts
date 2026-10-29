// @vitest-environment node
import { expect, it } from 'vitest'
import { createRouteRegistry, RouteRegistrationError } from './route-registry'
import { defineRoutes, defineRuntimeRoutes } from './route-table'
import type { RouteManifest } from '../props'

const screen = () => null
const base = () => defineRuntimeRoutes([{ path: '/a', screen }])

it('detects pattern collisions even when internal names differ', () => {
	const initial = base()
	const alias = {
		...base(),
		routes: [{ ...base().routes[0], name: 'alias' }],
		screens: { alias: screen },
	}
	let current: RouteManifest = initial
	const registry = createRouteRegistry(initial, (next) => {
		current = next
	})
	expect(() => registry.add(alias, { id: 'alias' })).toThrow(RouteRegistrationError)
	const registration = registry.add(alias, {
		id: 'alias',
		conflict: 'replace',
	})
	expect(current.routes.map((route) => route.name)).toEqual(['alias'])
	expect(Object.keys(current.screens)).toEqual(['alias'])
	registration.dispose()
	expect(current.routes.map((route) => route.name)).toEqual(['a'])
})

it('keeps disposal valid when removing a layer reveals an earlier collision', () => {
	const initial = base()
	let current: RouteManifest = initial
	const registry = createRouteRegistry(initial, (next) => {
		current = next
	})
	const replacement = {
		...defineRuntimeRoutes([{ path: '/b', screen }]),
		routes: [{ ...defineRuntimeRoutes([{ path: '/b', screen }]).routes[0], name: 'a' }],
		screens: { a: screen },
	}
	const first = registry.add(replacement, {
		id: 'rename',
		conflict: 'replace',
	})
	const last = {
		...base(),
		routes: [{ ...base().routes[0], name: 'last' }],
		screens: { last: screen },
	}
	const second = registry.add(last, { id: 'last' })
	first.dispose()
	// Accepted layers retain their order when an earlier definition reappears.
	expect(current.routes.map((route) => route.name)).toEqual(['last'])
	second.dispose()
	expect(current.routes.map((route) => route.name)).toEqual(['a'])
})

it('validates legacy screen and directory-layout collisions without touching live state', () => {
	const initial = { screens: { screen }, routes: [], layouts: { '': screen } }
	let calls = 0
	const registry = createRouteRegistry(initial, () => {
		calls++
	})
	expect(() =>
		registry.add({ screens: { screen }, routes: [], layouts: {} }, { id: 'screen' }),
	).toThrow(RouteRegistrationError)
	expect(() =>
		registry.add({ screens: {}, routes: [], layouts: { '': screen } }, { id: 'layout' }),
	).toThrow(RouteRegistrationError)
	expect(() => registry.add(base(), { id: ' ' })).toThrow(TypeError)
	expect(calls).toBe(0)
})

it('replaces its base independently of plugin IDs and preserves layer ownership', () => {
	const initial = base()
	let current: RouteManifest = initial
	const registry = createRouteRegistry(initial, (next) => {
		current = next
	})
	const override = () => null
	const replacement = () => null
	const layer = registry.add(defineRuntimeRoutes([{ path: '/a', screen: override }]), {
		id: 'default-catalog',
		conflict: 'replace',
	})
	registry.replaceBase(
		defineRuntimeRoutes([
			{ path: '/a', screen: replacement },
			{ path: '/b', screen },
		]),
	)
	expect(current.screens.a).toBe(override)
	expect(current.screens.b).toBe(screen)
	layer.dispose()
	expect(current.screens.a).toBe(replacement)
	expect(current.screens.b).toBe(screen)
	const before = current
	expect(() => registry.replaceBase({ screens: {}, layouts: {}, routes: undefined! })).toThrow()
	expect(current).toBe(before)
	registry.dispose()
	expect(() => registry.replaceBase(initial)).toThrow('disposed')
})

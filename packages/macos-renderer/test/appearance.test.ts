import assert from 'node:assert/strict'
import { test } from 'node:test'
import { installAppearanceBridge } from '../src/appearance.ts'
import { mockGlobals } from './mock-globals.ts'

test('standalone effective appearance is live, app-wide, and disposed', () => {
	let system = 'light'
	let override: string | null = null
	let applied: { name: string } | null = null
	const observers = new Set<any>()
	let registrations = 0
	const application = {
		get appearance() {
			return applied
		},
		set appearance(value: { name: string } | null) {
			applied = value
			override =
				value == null ? null : String(value.name) === 'NSAppearanceNameDarkAqua' ? 'dark' : 'light'
		},
		get effectiveAppearance() {
			return {
				bestMatchFromAppearancesWithNames(names: string[]) {
					assert.deepEqual(names, ['NSAppearanceNameAqua', 'NSAppearanceNameDarkAqua'])
					return (override ?? system) === 'dark' ? names[1] : names[0]
				},
			}
		},
		addObserverForKeyPathOptionsContext(observer: any, key: string) {
			assert.equal(key, 'effectiveAppearance')
			registrations++
			observers.add(observer)
		},
		removeObserverForKeyPath(observer: any, key: string) {
			assert.equal(key, 'effectiveAppearance')
			assert.ok(observers.delete(observer))
		},
	}

	mockGlobals({
		NSApplication: { sharedApplication: application },
		NSAppearance: { appearanceNamed: (name: string) => ({ name }) },
		NSObject: {
			extend(methods: any) {
				return { new: () => ({ ...methods }) }
			},
		},
	})

	const bridge: Record<string, any> = {}
	installAppearanceBridge(bridge)
	assert.equal(bridge.getColorScheme(), 'light')
	system = 'dark'
	assert.equal(bridge.getColorScheme(), 'dark') // before any consumer mounts
	const first: string[] = []
	const second: string[] = []
	const closeFirst = bridge.onAppearanceChange(() => first.push(bridge.getColorScheme()))
	const closeSecond = bridge.onAppearanceChange(() => second.push(bridge.getColorScheme()))
	assert.equal(registrations, 1)
	const subscribe = bridge.onAppearanceChange
	const setter = bridge.setAppearanceOverride
	installAppearanceBridge(bridge)
	assert.equal(bridge.onAppearanceChange, subscribe)
	assert.equal(bridge.setAppearanceOverride, setter)
	const emit = () =>
		observers.forEach((observer) =>
			observer.observeValueForKeyPathOfObjectChangeContext('effectiveAppearance'),
		)

	system = 'light'
	emit()
	assert.deepEqual(first, ['light'])
	assert.deepEqual(second, ['light'])
	// The preference setter pins NSApp.appearance; readers and listeners
	// resolve the override through effectiveAppearance until null restores
	// system following.
	bridge.setAppearanceOverride('dark')
	assert.equal(String(application.appearance?.name), 'NSAppearanceNameDarkAqua')
	assert.equal(bridge.getColorScheme(), 'dark')
	emit()
	assert.equal(first.at(-1), 'dark')
	bridge.setAppearanceOverride(null)
	assert.equal(application.appearance, null)
	assert.equal(bridge.getColorScheme(), 'light')
	emit()
	assert.equal(first.at(-1), 'light')
	override = 'dark'
	emit()
	system = 'dark'
	emit()
	system = 'light'
	emit()
	assert.equal(bridge.getColorScheme(), 'dark')
	override = null
	emit()
	assert.equal(bridge.getColorScheme(), 'light')
	closeFirst()
	const count = first.length
	system = 'dark'
	emit()
	assert.equal(first.length, count)
	assert.equal(second.at(-1), 'dark')
	closeSecond()
	closeSecond()
	assert.equal(observers.size, 0)
	const closeReopened = bridge.onAppearanceChange(() => first.push(bridge.getColorScheme()))
	assert.equal(bridge.getColorScheme(), 'dark')
	assert.equal(registrations, 2)
	closeReopened()
	assert.equal(observers.size, 0)
})

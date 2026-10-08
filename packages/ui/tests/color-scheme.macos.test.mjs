import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function load(path, context, names) {
	const source = readFileSync(new URL(path, import.meta.url), 'utf8')
		.replace(/^import .*$/gm, '')
		.replace(/^export /gm, '')

	return runInNewContext(
		ts.transpileModule(source, {
			compilerOptions: { target: ts.ScriptTarget.ESNext },
		}).outputText + `\n({${names.join(',')}})`,
		context,
	)
}

test('macOS hooks reconnect and theme override holds until system mode returns', () => {
	let scheme = 'dark'
	let producer
	let disposed = 0
	const context = {
		useSyncExternalStore: (subscribe, snapshot) => ({ subscribe, snapshot }),
		__xplatAppKit: {
			getColorScheme: () => scheme,
			onAppearanceChange(callback) {
				assert.equal(producer, undefined)
				producer = callback
				return () => {
					producer = undefined
					disposed++
				}
			},
		},
	}

	const color = load('../src/colorScheme.macos.ts', context, [
		'getColorScheme',
		'subscribeSystemScheme',
		'useColorScheme',
	])

	assert.equal(color.getColorScheme(), 'dark')
	const hook = color.useColorScheme()
	assert.equal(hook.snapshot(), 'dark')
	let updates = 0
	const close = hook.subscribe(() => updates++)
	scheme = 'light'
	producer()
	assert.equal(hook.snapshot(), 'light')
	assert.equal(updates, 1)
	close()
	assert.equal(disposed, 1)
	assert.equal(producer, undefined)
	const reopen = hook.subscribe(() => updates++)
	assert.equal(hook.snapshot(), 'light')
	reopen()
	// Theme module is evaluated separately, as in the actual module graph.
	const theme = load(
		'../src/theme/theme-scheme.macos.ts',
		{
			...context,
			...color,
			cx: (...classes) => classes.join(' '),
		},
		['setThemePreference', 'getThemeScheme', 'onThemeSchemeChange'],
	)

	const seen = []
	const unmount = theme.onThemeSchemeChange(() => seen.push(theme.getThemeScheme()))
	theme.setThemePreference('dark')
	assert.equal(theme.getThemeScheme(), 'dark')
	scheme = 'dark'
	producer()
	scheme = 'light'
	producer()
	assert.equal(theme.getThemeScheme(), 'dark')
	theme.setThemePreference('system')
	assert.equal(theme.getThemeScheme(), 'light')
	assert.equal(seen.at(-1), 'light')
	unmount()
	const count = seen.length
	theme.setThemePreference('dark')
	assert.equal(seen.length, count)
	assert.equal(producer, undefined)
})

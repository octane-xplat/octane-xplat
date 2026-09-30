import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(packageRoot, '../..')
const temporary = mkdtempSync(join(tmpdir(), 'octane-xplat-ui-consumer-'))
const packOutput = join(temporary, 'pack')
const extractedRoot = join(temporary, 'extracted')
mkdirSync(packOutput)
mkdirSync(extractedRoot)

function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
	if (result.stdout) {
		process.stdout.write(result.stdout)
	}

	if (result.stderr) {
		process.stderr.write(result.stderr)
	}

	if (result.error) {
		throw result.error
	}

	if (result.status !== 0) {
		throw new Error(`${command} exited with ${result.status}`)
	}
}

function typecheck(packagePath, target, mode, exportMapIndex) {
	console.log(`checking ${target} exports from map ${exportMapIndex} in ${mode.name} mode`)
	const consumerRoot = join(temporary, `map-${exportMapIndex}-${target}-${mode.name}`)
	const modules = join(consumerRoot, 'node_modules')
	const packageLink = join(modules, '@octane-xplat/ui')
	mkdirSync(dirname(packageLink), { recursive: true })
	cpSync(packagePath, packageLink, { recursive: true })

	for (const dependency of [
		'octane',
		'@nativescript-community/octane',
		'@nativescript-community/ui-drawer',
		'@nativescript/core',
		'@nativescript/types',
	]) {
		const source = join(packageRoot, 'node_modules', dependency)
		if (!existsSync(source)) {
			continue
		}

		const targetPath = join(modules, dependency)
		mkdirSync(dirname(targetPath), { recursive: true })
		symlinkSync(source, targetPath, 'dir')
	}

	let source
	if (target === 'web') {
		source = `import { Button, KeyboardAvoiding, View, Hoverable, Tooltip } from '@octane-xplat/ui'
import { Hoverable as WebHoverable, Tooltip as WebTooltip } from '@octane-xplat/ui/web'
import type { ButtonProps, KeyboardAvoidingProps, ViewProps } from '@octane-xplat/ui'

const buttonProps: ButtonProps = { children: 'Save', loading: true }
// @ts-expect-error loading is a boolean prop
const invalidButtonProps: ButtonProps = { loading: 'yes' }
const viewProps: ViewProps = { id: 'root', gap: 8, ios: { hidden: true } }
const keyboardProps: KeyboardAvoidingProps = { id: 'web-form', children: 'Form' }
const button = <Button {...buttonProps} />
const keyboard = <KeyboardAvoiding {...keyboardProps} />
const root = <View {...viewProps} />
const hoverable: typeof WebHoverable = Hoverable
const tooltip: typeof WebTooltip = Tooltip
void invalidButtonProps
void keyboard
void button
void root
void hoverable
void tooltip
void KeyboardAvoiding
`
	} else if (target === 'macos') {
		source = `import { Button, KeyboardAvoiding, View } from '@octane-xplat/ui'
import type { ButtonProps, KeyboardAvoidingProps, ViewProps } from '@octane-xplat/ui'

const buttonProps: ButtonProps = { children: 'Save', loading: true }
// @ts-expect-error loading is a boolean prop
const invalidButtonProps: ButtonProps = { loading: 'yes' }
const viewProps: ViewProps = { id: 'macos-root', gap: 4 }
const keyboardProps: KeyboardAvoidingProps = { id: 'macos-form', children: 'Form' }
const button = <Button {...buttonProps} />
const keyboard = <KeyboardAvoiding {...keyboardProps} />
const view = <View {...viewProps} />
void button
void keyboard
void invalidButtonProps
void view
`
	} else {
		source = `import { Button, KeyboardAvoiding, ListItem, View, createStore, defineRoutes, useStore } from '@octane-xplat/ui'
import type { ButtonProps, KeyboardAvoidingProps, ListItemProps, RouteSpec, ViewProps } from '@octane-xplat/ui'
import { UITabBar, UISwitch, type PlatformTabsProps, type RefreshProps as IOSRefreshProps } from '@octane-xplat/ui/ios'
import { MaterialSwitch, type RefreshProps as AndroidRefreshProps } from '@octane-xplat/ui/android'
import { layoutsForRoute } from '@octane-xplat/ui/native'

const buttonProps: ButtonProps = { children: 'Save', loading: true }
// @ts-expect-error loading is a boolean prop
const invalidButtonProps: ButtonProps = { loading: 'yes' }
const viewProps: ViewProps = { id: 'native-root', gap: 6 }
const itemProps: ListItemProps = { title: 'Profile', supportingText: 'Details' }
const keyboardProps: KeyboardAvoidingProps = { children: 'Form' }
const row = <ListItem {...itemProps}><ListItem.Leading>•</ListItem.Leading><ListItem.Content>Profile</ListItem.Content></ListItem>
const screen = () => null
const routeSpec: RouteSpec = { path: 'people/:id', screen }
const manifest = defineRoutes({ routes: [routeSpec], layouts: { people: screen } })
const countStore = createStore(1)
const count: number = useStore(countStore)
const doubled: number = useStore(countStore, (value) => value * 2)
const tabs: PlatformTabsProps = { tabs: [{ title: 'Home', render: () => null }], ios: { tintColor: 'blue' }, android: { elevation: 1 } }
const refresh: IOSRefreshProps = { refreshing: true }
const androidRefresh: AndroidRefreshProps = { onRefresh: () => {} }
const tabBar = <UITabBar {...tabs} />
const iosSwitch: typeof UISwitch = UISwitch
const androidSwitch: typeof MaterialSwitch = MaterialSwitch
const getLayouts: typeof layoutsForRoute = layoutsForRoute
const root = <View {...viewProps} />
const keyboard = <KeyboardAvoiding {...keyboardProps} />
void buttonProps
void invalidButtonProps
void row
void manifest
void count
void doubled
void refresh
void androidRefresh
void tabBar
void iosSwitch
void androidSwitch
void getLayouts
void root
void keyboard
`
	}

	writeFileSync(join(consumerRoot, 'consumer.tsx'), source)
	const configPath = join(consumerRoot, `tsconfig.${mode.name}.json`)
	writeFileSync(
		configPath,
		JSON.stringify(
			{
				compilerOptions: {
					strict: true,
					noEmit: true,
					module: mode.module,
					moduleResolution: mode.moduleResolution,
					target: 'esnext',
					jsx: 'react-jsx',
					jsxImportSource: 'octane',
					customConditions: [target],
					// NativeScript peer declarations require host globals and have upstream lib conflicts.
					skipLibCheck: target === 'native',
				},
				files: ['consumer.tsx'],
			},
			null,
			2,
		),
	)

	run(
		process.execPath,
		[join(repoRoot, 'node_modules/typescript/bin/tsc'), '--project', configPath],
		consumerRoot,
	)
}

try {
	run('pnpm', ['pack', '--pack-destination', packOutput], packageRoot)
	const tarballs = readdirSync(packOutput).filter((name) => name.endsWith('.tgz'))
	assert.equal(tarballs.length, 1, 'pnpm pack produces one tarball')
	run('tar', ['-xzf', join(packOutput, tarballs[0]), '-C', extractedRoot], temporary)
	const packedRoot = join(extractedRoot, 'package')
	const packedManifest = JSON.parse(readFileSync(join(packedRoot, 'package.json'), 'utf8'))
	const workspaceManifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
	assert.ok(workspaceManifest.publishConfig?.exports, 'the package declares publish-time export mappings')

	const exportMaps = [
		workspaceManifest.exports,
		workspaceManifest.publishConfig?.exports ?? packedManifest.exports,
	]

	const uniqueExportMaps = exportMaps.filter(
		(exportsMap, index) =>
			exportsMap &&
			exportMaps.findIndex(
				(candidate) => JSON.stringify(candidate) === JSON.stringify(exportsMap),
			) === index,
	)

	for (const [index, exportsMap] of uniqueExportMaps.entries()) {
		const consumerPackage = join(temporary, `package-${index}`)
		cpSync(packedRoot, consumerPackage, { recursive: true })
		const consumerManifestPath = join(consumerPackage, 'package.json')
		const consumerManifest = JSON.parse(readFileSync(consumerManifestPath, 'utf8'))
		consumerManifest.exports = exportsMap
		writeFileSync(consumerManifestPath, `${JSON.stringify(consumerManifest, null, 2)}\n`)

		for (const target of ['web', 'native', 'macos']) {
			for (const mode of [
				{ name: 'bundler', module: 'esnext', moduleResolution: 'bundler' },
				{ name: 'nodenext', module: 'nodenext', moduleResolution: 'nodenext' },
			]) {
				typecheck(consumerPackage, target, mode, index)
			}
		}
	}

	console.log('ui packed consumer: web/native/macos exports and platform subpaths typecheck in Bundler and NodeNext modes')
} finally {
	rmSync(temporary, { recursive: true, force: true })
}

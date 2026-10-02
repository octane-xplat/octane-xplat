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

function typecheck(packagePath, target, mode, exportMapIndex, peers = 'all') {
	console.log(`checking ${target} exports from map ${exportMapIndex} in ${mode.name} mode`)
	const consumerRoot = join(
		temporary,
		`map-${exportMapIndex}-${target}-${mode.name}${peers === 'required' ? '-required-peers' : ''}`,
	)

	const modules = join(consumerRoot, 'node_modules')
	const packageLink = join(modules, '@octane-xplat/ui')
	mkdirSync(dirname(packageLink), { recursive: true })
	cpSync(packagePath, packageLink, { recursive: true })

	// Web consumers only install the required peer — the optional
	// NativeScript peers must stay out of the web type graph.
	const dependencies =
		peers === 'required'
			? ['octane']
			: [
					'octane',
					'@nativescript-community/octane',
					'@nativescript-community/ui-drawer',
					'@nativescript/core',
					'@nativescript/types',
				]

	for (const dependency of dependencies) {
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
		source = `import { Button, KeyboardAvoiding, View, HoverCard, Tooltip } from '@octane-xplat/ui'
import { HoverCard as WebHoverCard, Tooltip as WebTooltip } from '@octane-xplat/ui/web'
import type { ButtonProps, KeyboardAvoidingProps, ViewProps } from '@octane-xplat/ui'

const buttonProps: ButtonProps = { children: 'Save', loading: true }
// @ts-expect-error loading is a boolean prop
const invalidButtonProps: ButtonProps = { loading: 'yes' }
const viewProps: ViewProps = { id: 'root', gap: 8, ios: { hidden: true } }
const keyboardProps: KeyboardAvoidingProps = { id: 'web-form', children: 'Form' }
const button = <Button {...buttonProps} />
const keyboard = <KeyboardAvoiding {...keyboardProps} />
const root = <View {...viewProps} />
const hoverCard: typeof WebHoverCard = HoverCard
const tooltip: typeof WebTooltip = Tooltip
void invalidButtonProps
void keyboard
void button
void root
void hoverCard
void tooltip
void KeyboardAvoiding
`
	} else if (target === 'macos') {
		source = `import { Button, KeyboardAvoiding, View, useAnimation, WebView, SafeArea } from '@octane-xplat/ui'
import type { ButtonProps, KeyboardAvoidingProps, ViewProps, AnimatedValue, WebViewProps, WebViewHandle, WebViewContentSize, WebViewLoadEvent } from '@octane-xplat/ui'

const buttonProps: ButtonProps = { children: 'Save', loading: true }
// @ts-expect-error loading is a boolean prop
const invalidButtonProps: ButtonProps = { loading: 'yes' }
const animation: AnimatedValue = useAnimation(0, 'translateX')
animation.to(100, { duration: 250 })
animation.spring(0, { damping: 14, stiffness: 120 })
animation.stop()
// @ts-expect-error duration is numeric milliseconds
animation.to(1, { duration: 'fast' })
const viewProps: ViewProps = { id: 'macos-root', gap: 4 }
const keyboardProps: KeyboardAvoidingProps = { id: 'macos-form', children: 'Form' }
const button = <Button {...buttonProps} />
const keyboard = <KeyboardAvoiding {...keyboardProps} />
const view = <View {...viewProps} />
const handle: { current: WebViewHandle | null } = { current: null }
const webProps: WebViewProps = {
 html: '<p>Embedded</p>', src: 'https://example.com', ref: handle,
 matchContents: true, scrollEnabled: false,
 onLayoutContent: (size: WebViewContentSize) => { const height: number = size.height; void height },
 onLoad: (event: WebViewLoadEvent) => { const url: string | undefined = event.url; void url },
 onError: (event) => { const error: string | undefined = event.error; void error },
}
const embedded = <SafeArea ignoreSafeArea><WebView {...webProps} /></SafeArea>
handle.current?.reload()
handle.current?.goBack()
handle.current?.goForward()
handle.current?.stopLoading()
// @ts-expect-error content height is numeric
const invalidSize: WebViewContentSize = { width: 320, height: 'tall' }
// @ts-expect-error WebView hosts a document, not component children
const invalidChildren = <WebView children="text" />
void invalidChildren
void invalidSize
void embedded
void button
void keyboard
void invalidButtonProps
void view
`
	} else {
		source = `import { Button, KeyboardAvoiding, List, ListItem, View, createStore, defineRoutes, useStore } from '@octane-xplat/ui'
import type { ButtonProps, KeyboardAvoidingProps, ListItemProps, RouteSpec, ViewProps } from '@octane-xplat/ui'
import { UITabBar, UISwitch, type PlatformTabsProps, type RefreshProps as IOSRefreshProps } from '@octane-xplat/ui/ios'
import { MaterialSwitch, type RefreshProps as AndroidRefreshProps } from '@octane-xplat/ui/android'
import { layoutsForRoute } from '@octane-xplat/ui/native'

const buttonProps: ButtonProps = { children: 'Save', loading: true }
// @ts-expect-error loading is a boolean prop
const invalidButtonProps: ButtonProps = { loading: 'yes' }
const viewProps: ViewProps = { id: 'native-root', gap: 6 }
const itemProps: ListItemProps = { label: 'Profile', description: 'Details', startContent: '•' }
const keyboardProps: KeyboardAvoidingProps = { children: 'Form' }
const row = <List><ListItem {...itemProps} /></List>
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

	// ESM consumer — NodeNext treats extensionless .tsx as CJS without it,
	// which would let an ESM-only package slip type checks its runtime
	// resolution can't satisfy.
	writeFileSync(
		join(consumerRoot, 'package.json'),
		JSON.stringify({ name: `consumer-${exportMapIndex}-${target}-${mode.name}`, type: 'module' }),
	)

	writeFileSync(join(consumerRoot, 'consumer.tsx'), source)
	const configPath = join(consumerRoot, `tsconfig.${mode.name}.json`)
	// Mirrors the create template's per-target tsconfig: suffix typing selects
	// .web/.mobile/.ios/.android/.macos declaration variants, `types` scopes the
	// ambient globals, and skipLibCheck stays on — NativeScript's third-party
	// ambient declarations carry upstream lib conflicts.
	const suffixes = {
		web: ['.web', ''],
		native: ['.ios', '.android', '.mobile', ''],
		macos: ['.macos', ''],
	}[target]

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
					jsxImportSource: target === 'native' ? '@nativescript-community/octane' : 'octane',
					moduleSuffixes: suffixes,
					customConditions: [target],
					types: target === 'native' ? ['@nativescript/types'] : [],
					skipLibCheck: true,
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
	assert.ok(
		workspaceManifest.publishConfig?.exports,
		'the package declares publish-time export mappings',
	)

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
				if (target === 'web') {
					typecheck(consumerPackage, target, mode, index, 'required')
				}
			}
		}
	}

	console.log(
		'ui packed consumer: web/native/macos exports and platform subpaths typecheck in Bundler and NodeNext modes',
	)
} finally {
	rmSync(temporary, { recursive: true, force: true })
}

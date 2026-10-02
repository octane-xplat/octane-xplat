import assert from 'node:assert/strict'
import ts from 'typescript'
import { buildMacOSBarrel } from './macos-barrel.mjs'
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

const macosOnly = process.argv.includes('--macos-only')
const overlaysOnly = process.argv.includes('--macos-overlays')
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

async function typecheck(packagePath, target, mode, exportMapIndex, peers = 'all') {
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
		target === 'macos'
			? ['octane', '@octanejs/vite-plugin']
			: peers === 'required'
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

	if (target === 'macos') {
		for (const dependency of ['@octane-xplat/macos-renderer', '@nativescript/macos-node-api']) {
			const targetPath = join(modules, dependency)
			mkdirSync(dirname(targetPath), { recursive: true })
			symlinkSync(join(repoRoot, 'apps/macos/node_modules', dependency), targetPath, 'dir')
		}

		// The overlay-only consumer stays independent from the full macOS barrel
		// build; --macos-only retains runtime/declaration export parity.
		if (!overlaysOnly) {
			const runtimeValues = await buildMacOSBarrel(consumerRoot)
			const declaration = join(packageLink, 'types/index.macos.d.ts')
			const program = ts.createProgram([declaration], {
				moduleResolution: ts.ModuleResolutionKind.Bundler,
				module: ts.ModuleKind.ESNext,
				target: ts.ScriptTarget.ESNext,
				skipLibCheck: false,
			})

			const diagnostics = program.getSemanticDiagnostics(program.getSourceFile(declaration))
			assert.equal(
				diagnostics.length,
				0,
				ts.formatDiagnostics(diagnostics, {
					getCanonicalFileName: (file) => file,
					getCurrentDirectory: () => consumerRoot,
					getNewLine: () => '\n',
				}),
			)

			const checker = program.getTypeChecker()
			const module = checker.getSymbolAtLocation(program.getSourceFile(declaration))
			const declaredValues = checker
				.getExportsOfModule(module)
				.filter((symbol) => {
					const resolved =
						symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol

					return resolved.flags & ts.SymbolFlags.Value
				})
				.map((symbol) => symbol.name)

			assert.deepEqual(
				runtimeValues.sort(),
				declaredValues.sort(),
				'packed macOS runtime/declaration value exports match',
			)
		}
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
		source = `import { Button, KeyboardAvoiding, View, useAnimation, WebView, SafeArea, useLayer, Calendar, CodeBlock, useOutlineFromDOM, Dialog, DialogHeader, AlertDialog, BottomSheet, BottomSheetSwitcher, Lightbox, Toast, ToastViewport, showToast, useToast, useImperativeDialog, useImperativeAlertDialog, useLightbox, openBottomSheet, closeBottomSheet, bottomSheetHost } from '@octane-xplat/ui'
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
const context = useLayer({ mode: 'context' })
context.ref({})
context.render('Context', { placement: 'below' })
const fixed = useLayer({ mode: 'fixed' })
fixed.render('Fixed', { x: 10, y: 20 })
// @ts-expect-error fixed layers have no callable anchor ref
fixed.ref({})
// @ts-expect-error fixed coordinates must be numbers
fixed.render('Invalid', { x: '10' })
const calendar = <Calendar value="2026-10-02" />
const code = <CodeBlock code="const count = 1" />
const outline = useOutlineFromDOM()
void calendar
void code
void outline
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
const dialog = <Dialog isOpen onOpenChange={() => {}} purpose="form" width={420}><DialogHeader title="Edit" onOpenChange={() => {}} /></Dialog>
const alert = <AlertDialog isOpen onOpenChange={() => {}} title="Delete?" actionLabel="Delete" onAction={() => {}} />
const sheet = <BottomSheet isOpen label="Options" snapPoints={[0.25, '50%', 400]} />
const switcher = <BottomSheetSwitcher activeSheet="options">{sheet}</BottomSheetSwitcher>
const lightbox = <Lightbox isOpen onOpenChange={() => {}} media={[{ src: 'image.png', alt: 'Image' }]} />
const toast = <Toast body="Saved" renderContent={props => props.body} onDismiss={reason => { const typed: 'auto' | 'manual' = reason; void typed }} />
const viewport = <ToastViewport position="topStart" maxVisible={3}>{toast}</ToastViewport>
const dismiss: () => void = showToast({ body: 'Saved', onHide: reason => { const typed: 'auto' | 'manual' = reason; void typed } })
const dialogControl = useImperativeDialog()
dialogControl.show('Edit', { purpose: 'required', width: 400 })
const alertControl = useImperativeAlertDialog()
alertControl.show({ title: 'Delete?', actionLabel: 'Delete', onAction() {} })
const mediaControl = useLightbox({ media: [{ src: 'image.png', alt: 'Image' }] })
mediaControl.open(0)
const toastControl = useToast()
toastControl({ body: 'Done', isAutoHide: false })
const promise: Promise<unknown> = openBottomSheet(() => null, { id: 1 }, { label: 'Choose', snapPoints: ['25%', 300], hasScrim: false })
closeBottomSheet('selected')
const host: null = bottomSheetHost()
// @ts-expect-error dialog dismissal must be controlled
const invalidDialog = <Dialog isOpen />
// @ts-expect-error shared sheets require an accessible label
const invalidSheet = <BottomSheet isOpen />
// @ts-expect-error invalid toast position must not silently become any
showToast({ body: 'Saved', position: 'middle' })
// @ts-expect-error imperative dialogs use the shared purpose contract
dialogControl.show('Edit', { purpose: 'anything' })
void [dialog, alert, switcher, lightbox, viewport, dismiss, promise, host, invalidDialog, invalidSheet]
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
					jsxImportSource:
						target === 'native'
							? '@nativescript-community/octane'
							: target === 'macos'
								? '@octane-xplat/macos-renderer'
								: 'octane',
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
	// The isolated macOS gate builds first, then packs without running the
	// all-platform prepack checker. The default gate still runs that checker.
	if (macosOnly) {
		run('pnpm', ['build'], packageRoot)
	}

	run(
		'pnpm',
		[
			'pack',
			...(macosOnly || overlaysOnly ? ['--config.ignore-scripts=true'] : []),
			'--pack-destination',
			packOutput,
		],
		packageRoot,
	)

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

		for (const target of macosOnly || overlaysOnly ? ['macos'] : ['web', 'native', 'macos']) {
			for (const mode of [
				{ name: 'bundler', module: 'esnext', moduleResolution: 'bundler' },
				{ name: 'nodenext', module: 'nodenext', moduleResolution: 'nodenext' },
			]) {
				await typecheck(consumerPackage, target, mode, index)
				if (target === 'web') {
					await typecheck(consumerPackage, target, mode, index, 'required')
				}
			}
		}
	}

	console.log(
		overlaysOnly
			? 'ui packed macOS overlay consumer: JSX and imperative declaration contracts pass in Bundler and NodeNext; full runtime parity remains in --macos-only'
			: `ui packed consumer: ${macosOnly ? 'macos' : 'web/native/macos'} runtime/declaration exports and consumers pass in Bundler and NodeNext modes`,
	)
} finally {
	rmSync(temporary, { recursive: true, force: true })
}

import { loadSource } from '../../../scripts/load-source.ts'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { build } from 'vite'
import { octane } from 'octane/compiler/vite'
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
	writeSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

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
		writeSync(1, result.stdout)
	}

	if (result.stderr) {
		writeSync(2, result.stderr)
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
			? ['octane', '@octanejs/vite-plugin', '@octane-xplat/camera', '@octane-xplat/jsx']
			: peers === 'required'
				? ['octane']
				: [
						'octane',
						'@nativescript-community/octane',
						'@nativescript/core',
						'@nativescript/types',
					]

	// Internal utilities are runtime dependencies on every target.
	dependencies.push('@octane-xplat/lib', '@octane-xplat/platform')

	for (const dependency of dependencies) {
		const source = join(packageRoot, 'node_modules', dependency)
		if (!existsSync(source)) {
			continue
		}

		const targetPath = join(modules, dependency)
		mkdirSync(dirname(targetPath), { recursive: true })
		symlinkSync(source, targetPath, 'dir')
	}

	if (target === 'native') {
		// Load the packed helper: declaration checks alone cannot catch missing
		// runtime exports from an external Octane entry point.
		// Older runtimes enumerate exports rather than forwarding all of core.
		for (const entry of ['dist/universal-native.js', 'dist/node/universal-native.js']) {
			assert.match(
				readFileSync(join(modules, 'octane', entry), 'utf8'),
				/export \{[^}]*\bChildren\b[^}]*\} from ["']\.\/universal-core\.js["']/,
			)
		}

		const helper = join(packageLink, 'src/child-array.ts')
		assert.match(readFileSync(helper, 'utf8'), /from ['"]octane['"]/)
		const { toChildArray, mapChildren } = await loadSource(pathToFileURL(helper), {
			resolve: { alias: [{ find: /^octane$/, replacement: 'octane/universal/native' }] },
		})

		assert.deepEqual(toChildArray([null, 'first', [false, 'second']]), ['first', 'second'])
		assert.equal(mapChildren(['first', 'second'], (child) => child).length, 2)
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
			const consumerManifest = JSON.parse(readFileSync(join(packageLink, 'package.json'), 'utf8'))

			// Export maps carry one `types` entry per subpath; platform conditions
			// are runtime-only strings. The macOS consumer's declarations resolve
			// through the shared entry.
			const macosEntry = consumerManifest.exports['.'].macos
			const declaration = join(
				packageLink,
				typeof macosEntry === 'string' ? consumerManifest.exports['.'].types : macosEntry.types,
			)

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
		source = `import { Button, KeyboardAvoiding, useKeyboardInset, View, HoverCard, Tooltip } from '@octane-xplat/ui'
import { HoverCard as WebHoverCard, Tooltip as WebTooltip, useOutlineFromDOM } from '@octane-xplat/ui/web'
import type { ButtonProps, KeyboardAvoidingProps, ViewProps } from '@octane-xplat/ui'

const buttonProps: ButtonProps = { children: 'Save', isLoading: true }
// @ts-expect-error isLoading is a boolean prop
const invalidButtonProps: ButtonProps = { isLoading: 'yes' }
const viewProps: ViewProps = { id: 'root', gap: 8, ios: { hidden: true } }
const inset: number = useKeyboardInset()
// @ts-expect-error inset is a number, not a string
const invalidInset: string = useKeyboardInset()
void [inset, invalidInset]
const keyboardProps: KeyboardAvoidingProps = { id: 'web-form', children: 'Form' }
const button = <Button {...buttonProps} />
const keyboard = <KeyboardAvoiding {...keyboardProps} />
const root = <View {...viewProps} />
const hoverCard: typeof WebHoverCard = HoverCard
const tooltip: typeof WebTooltip = Tooltip
const domOutline = useOutlineFromDOM()
void domOutline
void invalidButtonProps
void keyboard
void button
void root
void hoverCard
void tooltip
void KeyboardAvoiding
`
	} else if (target === 'macos') {
		source = `import { Button, KeyboardAvoiding, useKeyboardInset, View, useAnimation, WebView, SafeArea, useLayer, Calendar, CodeBlock, Dialog, DialogHeader, AlertDialog, BottomSheet, BottomSheetSwitcher, Lightbox, Toast, ToastViewport, showToast, useToast, useImperativeDialog, useImperativeAlertDialog, useLightbox, openBottomSheet, closeBottomSheet } from '@octane-xplat/ui'
import { CameraView, useOutlineFromView, bottomSheetHost } from '@octane-xplat/ui/macos'
import type { ButtonProps, KeyboardAvoidingProps, ViewProps, AnimatedValue, WebViewProps, WebViewHandle, WebViewContentSize, WebViewLoadEvent } from '@octane-xplat/ui'

const buttonProps: ButtonProps = { children: 'Save', isLoading: true }
// @ts-expect-error isLoading is a boolean prop
const invalidButtonProps: ButtonProps = { isLoading: 'yes' }
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
const outline = useOutlineFromView()
void calendar
void code
void outline
const viewProps: ViewProps = { id: 'macos-root', gap: 4 }
const inset: number = useKeyboardInset()
// @ts-expect-error inset is a number, not a string
const invalidInset: string = useKeyboardInset()
void [inset, invalidInset]
const keyboardProps: KeyboardAvoidingProps = { id: 'macos-form', children: 'Form' }
const button = <Button {...buttonProps} />
const keyboard = <KeyboardAvoiding {...keyboardProps} />
const view = <View {...viewProps} />
const handle: { current: WebViewHandle | null } = { current: null }
const webProps: WebViewProps = {
 html: '<p>Embedded</p>', ref: handle,
 matchContents: true, scrollEnabled: false,
 onLayoutContent: (size: WebViewContentSize) => { const height: number = size.height; void height },
 onLoad: (event: WebViewLoadEvent) => { const url: string | undefined = event.url; void url },
 onError: (event) => { const error: string | undefined = event.error; void error },
}
const remoteProps: WebViewProps = { src: 'https://example.com' }
// @ts-expect-error src and html are mutually exclusive document sources
const bothSources: WebViewProps = { src: 'https://example.com', html: '<p></p>' }
// @ts-expect-error a WebView requires a document source
const noSource: WebViewProps = {}
void remoteProps
void bothSources
void noSource
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
const toastHandle = showToast({ body: 'Saved', onHide: reason => { const typed: 'auto' | 'manual' = reason; void typed } })
toastHandle?.update({ body: 'Saved again' })
toastHandle?.dismiss()
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
// @ts-expect-error shared sheets require an accessible label
const invalidSheet = <BottomSheet isOpen />
// @ts-expect-error invalid toast position must not silently become any
showToast({ body: 'Saved', position: 'middle' })
// @ts-expect-error imperative dialogs use the shared purpose contract
dialogControl.show('Edit', { purpose: 'anything' })
void [CameraView, dialog, alert, switcher, lightbox, viewport, toastHandle, promise, host, invalidSheet]
`
	} else {
		source = `import { Button, KeyboardAvoiding, useKeyboardInset, List, ListItem, View } from '@octane-xplat/ui'
import { defineRoutes } from '@octane-xplat/ui/routing'
import { createStore, useStore } from '@octane-xplat/ui/data'
import type { ButtonProps, KeyboardAvoidingProps, ListItemProps, ViewProps } from '@octane-xplat/ui'
import type { RouteSpec } from '@octane-xplat/ui/routing'
import { PlatformIcon, UITabBar, UISwitch, type PlatformTabsProps, type RefreshProps as IOSRefreshProps, type UITableViewProps, type UISwitchProps } from '@octane-xplat/ui/ios'
import { MaterialSwitch, type MaterialSwitchProps, type RecyclerViewProps, type RefreshProps as AndroidRefreshProps } from '@octane-xplat/ui/android'
import { useOutlineFromView } from '@octane-xplat/ui/nativescript'
// @ts-expect-error legacy catalog lookups are removed; outlets own route composition
import { layoutsForRoute } from '@octane-xplat/ui/nativescript'

const buttonProps: ButtonProps = { children: 'Save', isLoading: true }
// @ts-expect-error isLoading is a boolean prop
const invalidButtonProps: ButtonProps = { isLoading: 'yes' }
const viewProps: ViewProps = { id: 'native-root', gap: 6 }
const itemProps: ListItemProps = { label: 'Profile', description: 'Details', startContent: '•' }
const inset: number = useKeyboardInset()
// @ts-expect-error inset is a number, not a string
const invalidInset: string = useKeyboardInset()
void [inset, invalidInset]
const keyboardProps: KeyboardAvoidingProps = { children: 'Form' }
const row = <List><ListItem {...itemProps} /></List>
const screen = () => null
const routeSpec = { path: '/people/:id', screen } as const satisfies RouteSpec
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
const iosSwitchProps: UISwitchProps = { value: true, onChange: checked => { void checked } }
const tableProps: UITableViewProps<{ id: string }> = { items: [], renderItem: () => null }
const recyclerProps: RecyclerViewProps = { items: [], renderItem: () => null }
const androidSwitchProps: MaterialSwitchProps = { isDisabled: true }
const glyph: string = PlatformIcon.select({ ios: 'heart.fill', android: 'favorite' })
const getLayouts: typeof layoutsForRoute = layoutsForRoute
const viewOutline = useOutlineFromView()
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
void iosSwitchProps
void tableProps
void recyclerProps
void androidSwitchProps
void glyph
void getLayouts
void viewOutline
void root
void keyboard
`
	}

	// Exercise the purpose entrypoints under every export map, resolver mode
	// and peer configuration — each moved domain resolves through its own
	// subpath and must no longer resolve at the package root.
	source += `
import { router as subpathRouter, useRouter, getRouteApi, type RouteManifest } from '@octane-xplat/ui/routing'
import { useListData, useAsyncList, defineQuery, defineCursorQuery, createQueryClient, useQuery$, type Selection, type QueryOptions, type QueryLoadContext } from '@octane-xplat/ui/data'
import { inspectQueryClient, registerQueryInspection } from '@octane-xplat/ui/data/dev'
import { Markdown, parseMdDoc, tokenize, type MdDoc, type MarkdownProps, type TokenLine } from '@octane-xplat/ui/markdown'
import { ChatMessage, ChatComposer, useChatComposerContext, type ChatMessageProps } from '@octane-xplat/ui/chat'
// @ts-expect-error routing APIs live under @octane-xplat/ui/routing
import { router as rootRouter } from '@octane-xplat/ui'
// @ts-expect-error stores live under @octane-xplat/ui/data
import { useStore as rootUseStore } from '@octane-xplat/ui'
// @ts-expect-error Markdown lives under @octane-xplat/ui/markdown
import { MarkdownScreen } from '@octane-xplat/ui'
// @ts-expect-error chat components live under @octane-xplat/ui/chat
import { ChatLayout } from '@octane-xplat/ui'
// @ts-expect-error legacy navigation was removed during the canonical cutover
import { pushRoute } from '@octane-xplat/ui/routing'
const typedFeed = defineCursorQuery(['feed'], async (tag: string, { cursor }) => {
  const response = await fetch('/api/feed?tag=' + encodeURIComponent(tag) + '&cursor=' + encodeURIComponent(cursor))
  return response.json() as Promise<{ items: { id: string }[]; nextCursor?: string }>
}, { initialCursor: '', maxPages: 3 })
void createQueryClient().ensureData(typedFeed, 'all').then(data => {
  const firstId: string | undefined = data.pages[0]?.items[0]?.id
  // @ts-expect-error pages retain the item type inferred from the loader
  const wrongId: number = data.pages[0]!.items[0]!.id
  void [firstId, wrongId]
})
const typedWithAuthority = defineQuery(['authority-inference'], async (id: string, { signal }) => {
  void signal
  return { id, revision: 1 }
}, { compareAuthority: (incoming, current) => incoming.revision - current.revision })
void createQueryClient().ensureData(typedWithAuthority, '1').then(value => {
  const revision: number = value.revision
  void revision
})
const typedPrevious = defineQuery(['previous-inference'], async (id: string, { previous }: QueryLoadContext<{ id: string; revision: number }>): Promise<{ id: string; revision: number }> => ({
  id, revision: (previous?.revision ?? 0) + 1,
}), { compareAuthority: (incoming, current) => incoming.revision - current.revision })
void typedPrevious
const typedQueries = createQueryClient()
const typedInspector = inspectQueryClient(typedQueries, { eventLimit: 10, labels: [{ definition: typedFeed, label: 'feed' }] })
const clientStatus: 'live' | 'disposed' = typedInspector.snapshot().status
void registerQueryInspection
void clientStatus
typedInspector.dispose()
const typedUsers = defineQuery(['users'], (id: string) => ({ id, name: 'Ada' }))
typedQueries.setQueryData(typedUsers, '42', { id: '42', name: 'Grace' })
typedQueries.setQueriesData(typedUsers, (value, id) => ({ ...value, id }))
const typedUser: { id: string; name: string } | undefined = typedQueries.getQueryData(typedUsers, '42')
// @ts-expect-error result type is inferred from the definition, not widened by the update
typedQueries.setQueryData(typedUsers, '42', { id: '42', name: 123 })
// @ts-expect-error updater must return the definition's result type
typedQueries.setQueryData(typedUsers, '42', value => ({ ...value!, name: 123 }))
// @ts-expect-error matching updates have the same result contract
typedQueries.setQueriesData(typedUsers, value => ({ ...value, name: 123 }))
// @ts-expect-error definition's selection is a string
typedQueries.setQueryData(typedUsers, 42, { id: '42', name: 'Grace' })
void typedQueries.runOptimistic(typedUsers, '42', (operation, view$) => {
  operation.set(view$, previous => ({ ...previous, name: 'Grace' }))
  // @ts-expect-error tentative values must match the record
  operation.set(view$, { id: '42', name: 123 })
  // @ts-expect-error confirmed receipts must match the query result
  operation.adopt({ id: '42', name: 123 })
  operation.adopt({ id: '42', name: 'Grace' })
})
// @ts-expect-error the global default cache was removed
import { cachedQuery$ } from '@octane-xplat/ui/data'
void typedUser
const mdProps: MarkdownProps = { text: '# hi' }
const mdDoc: MdDoc = parseMdDoc('# hi')
const tokens: TokenLine[] = tokenize('let x = 1', 'ts')
const msgProps: ChatMessageProps = { sender: 'assistant', children: 'hello' }
void [subpathRouter, useRouter, getRouteApi, useListData, useAsyncList, defineQuery, createQueryClient, useQuery$, Markdown, ChatMessage, ChatComposer, useChatComposerContext, rootRouter, rootUseStore, MarkdownScreen, ChatLayout, mdProps, mdDoc, tokens, msgProps]
`

	source += `
import type { ClassValue } from '@octane-xplat/ui'
import type { ClassValue as OctaneClassValue } from 'octane/jsx-runtime'
// @ts-expect-error ClassName was removed; use upstream ClassValue
import type { ClassName } from '@octane-xplat/ui'
declare const classCount: number
declare const upstreamClass: OctaneClassValue
const sharedClass: ClassValue = ['card', classCount && 'active', [42, 0, NaN], upstreamClass] as const
const classExample = <View className={sharedClass} />
void classExample
`

	source += `
import { Item, Selector, BaseTypeahead, Typeahead, Tokenizer, ComplexSelector, PowerSearch, Table } from '@octane-xplat/ui'
import type { ComplexSelectorRenderProps, ItemProps, SearchableItem, SearchSource, TableColumn, TypeaheadInputHandle, PowerSearchConfig } from '@octane-xplat/ui'
// @ts-expect-error internal presentation is not a supported root export
import { SelectView } from '@octane-xplat/ui'
// @ts-expect-error internal presentation is not a supported root export
import { BaseTypeaheadView } from '@octane-xplat/ui'
// @ts-expect-error internal presentation is not a supported root export
import { PowerSearchView } from '@octane-xplat/ui'
// @ts-expect-error internal presentation is not a supported root export
import { ComplexSelectorView } from '@octane-xplat/ui'
const choice: SearchableItem = { id: 'apple', label: 'Apple' }
const searchSource: SearchSource<SearchableItem> = { search: () => [choice], bootstrap: () => [choice] }
const inputHandle: { current: TypeaheadInputHandle | null } = { current: null }
const selector = <Selector label="Fruit" value="apple" options={[{ value: 'apple', label: 'Apple' }]} onValueChange={value => { void value }} />
const base = <BaseTypeahead value={choice} searchSource={searchSource} onChange={item => { const selected: SearchableItem | null = item; void selected }} ref={inputHandle} debounceMs={0} />
const typeahead = <Typeahead label="Fruit" value={choice} searchSource={searchSource} onChange={() => {}} />
const tokenizer = <Tokenizer label="Tags" value={[choice]} searchSource={searchSource} onChange={() => {}} tokenOverflowBehavior="unfocusedInline" />
const renderComplex = ({ value, onChange, close, isOpen }: ComplexSelectorRenderProps<SearchableItem>) => { onChange(value); close(); return String(isOpen) }
const complex = <ComplexSelector label="Fruit" value={choice} onChange={() => {}}>{renderComplex}</ComplexSelector>
const namedItemProps: ItemProps = { label: 'Fruit', description: 'Fresh', startContent: 'F', endContent: '1', isDisabled: false }
const item = <Item {...namedItemProps} />
const tableRow = { name: 'Fruit', qty: 1 }
const tableColumn: TableColumn<typeof tableRow> = { key: 'name', renderCell: item => String(item.name) + item.qty }
const table = <Table data={[tableRow]} columns={[tableColumn]} />
const searchConfig: PowerSearchConfig = { name: 'fruit', fields: [] }
const power = <PowerSearch config={searchConfig} filters={[]} onChange={(filters, type, index) => { const position: number = index; void [filters, type, position] }} />
inputHandle.current?.focus()
inputHandle.current?.setQuery('apple')
// @ts-expect-error selector values use string keys
const invalidSelector = <Selector options={[]} value={42} />
void [selector, base, typeahead, tokenizer, complex, item, table, power, invalidSelector, SelectView, BaseTypeaheadView, PowerSearchView, ComplexSelectorView]
`

	// ESM consumer — NodeNext treats extensionless .tsx as CJS without it,
	// which would let an ESM-only package slip type checks its runtime
	// resolution can't satisfy.
	writeFileSync(
		join(consumerRoot, 'package.json'),
		JSON.stringify({ name: `consumer-${exportMapIndex}-${target}-${mode.name}`, type: 'module' }),
	)

	source += `
import { RouteOutlet, useImperativeBottomSheet, type ImperativeBottomSheetReturn, type RouteOutletProps } from '@octane-xplat/ui'
const scoped: ImperativeBottomSheetReturn = useImperativeBottomSheet()
const ownedSheet = scoped.open(() => null)
ownedSheet.close('done')
const outletProps: RouteOutletProps = { stack: 'root' }
void [<RouteOutlet {...outletProps}>{scoped.element}</RouteOutlet>, ownedSheet]
`

	if (target === 'native') {
		source += `
import { useImperativeModal as iosModal } from '@octane-xplat/ui/ios'
import { useImperativeModal as androidModal } from '@octane-xplat/ui/android'
// @ts-expect-error removed owner helper is replaced by RouteOutlet and useRouter
import { useNativeRouteNavigator } from '@octane-xplat/ui/nativescript'
const iosOwner = iosModal()
const androidOwner = androidModal()
const navigation = useRouter()
void [iosOwner.element, androidOwner.element, navigation, useNativeRouteNavigator]
`
	}

	writeFileSync(join(consumerRoot, 'consumer.tsx'), source)
	if (target === 'web' && mode.name === 'bundler' && peers === 'all') {
		const entry = join(consumerRoot, 'query-inspection-production.ts')
		writeFileSync(
			entry,
			`
export { createQueryClient } from '@octane-xplat/ui/data'
if (import.meta.env.DEV) {
  import('@octane-xplat/ui/data/dev').then(module => { globalThis.__queryInspection = module })
}
`,
		)

		for (const development of [true, false]) {
			const result = await build({
				root: consumerRoot,
				configFile: false,
				plugins: [octane({ ssr: false })],
				resolve: { conditions: ['web'], extensions: ['.web.ts', '.ts', '.tsx', '.js', '.json'] },
				define: { 'import.meta.env.DEV': String(development) },
				build: { write: false, minify: false, lib: { entry, formats: ['es'] } },
			})

			const output = (Array.isArray(result) ? result[0] : result).output
			const code = output
				.filter((item) => item.type === 'chunk')
				.map((item) => item.code)
				.join('\n')

			assert.equal(
				code.includes('queries.inspect.'),
				development,
				'inspection action is excluded by the production gate',
			)

			assert.equal(
				code.includes('eventLimit must be'),
				development,
				'production does not ship the event collector',
			)
		}
	}
	const keyboardGuide = readFileSync(join(repoRoot, 'docs/app/text-entry.md'), 'utf8').split(
		'## Read software keyboard space',
	)[1]

	assert.ok(keyboardGuide, 'keyboard inset guide exists')
	const keyboardExamples = [...keyboardGuide.matchAll(/```tsx\n([\s\S]*?)```/g)]
	assert.equal(keyboardExamples.length, 7, 'all keyboard inset examples are checked')
	const exampleFiles = keyboardExamples.map((match, index) => {
		const name = `keyboard-example-${index}.tsx`
		writeFileSync(join(consumerRoot, name), match[1])
		return name
	})
	const routingGuide = readFileSync(join(repoRoot, 'docs/app/navigation.md'), 'utf8')
	const catalogGuide = routingGuide
		.split('## Register routes from data')[1]
		?.split('## Own runtime registrations')[0]
	assert.ok(catalogGuide, 'the inferred catalog authoring section exists')
	const programmaticExamples = [
		...catalogGuide.matchAll(/```tsx\n(\/\/ src\/guide-routes\.tsx[\s\S]*?)```/g),
	]
	assert.equal(
		programmaticExamples.length,
		2,
		'both inferred programmatic guide screens are checked',
	)
	for (let index = 0; index < programmaticExamples.length; index++) {
		const name = `programmatic-guide-${index}.tsx`
		writeFileSync(join(consumerRoot, name), programmaticExamples[index][1])
		exampleFiles.push(name)
	}
	const literalExample = routingGuide
		.split('### Keep reusable route paths literal')[1]
		?.match(/```ts\n([\s\S]*?)```/)
	assert.ok(literalExample, 'the literal-preserving route example exists')
	writeFileSync(join(consumerRoot, 'literal-route-spec.ts'), literalExample[1])
	exampleFiles.push('literal-route-spec.ts')
	const scrollGuide = readFileSync(join(repoRoot, 'docs/app/primitives.md'), 'utf8')
		.split('## Move a scroll viewport')[1]
		?.split('## macOS scrolling and refresh')[0]
	assert.ok(scrollGuide, 'portable scroll command guide exists')
	const scrollExamples = [...scrollGuide.matchAll(/```tsx\n([\s\S]*?)```/g)]
	assert.equal(scrollExamples.length, 1, 'portable scroll command example is checked')
	writeFileSync(join(consumerRoot, 'scroll-command-example.tsx'), scrollExamples[0][1])
	exampleFiles.push('scroll-command-example.tsx')
	const nativeControls = readFileSync(join(repoRoot, 'docs/app/navigation.md'), 'utf8')
		.split('### Retained native controls')[1]
		?.match(/```tsx\n([\s\S]*?)```/)
	assert.ok(nativeControls, 'native route controls example exists')
	writeFileSync(join(consumerRoot, 'native-route-controls.tsx'), nativeControls[1])
	exampleFiles.push('native-route-controls.tsx')

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
								? '@octane-xplat/jsx'
								: 'octane',
					moduleSuffixes: suffixes,
					customConditions: [target],
					types: target === 'native' ? ['@nativescript/types'] : [],
					skipLibCheck: true,
				},
				files: ['consumer.tsx', ...exampleFiles],
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
	if (macosOnly || overlaysOnly) {
		run('pnpm', ['build'], packageRoot)
	}

	// The isolated macOS gate builds first, then packs without running the
	// all-platform prepack checker. The default gate still runs that checker.
	if (macosOnly) {
		run('pnpm', ['typegen'], packageRoot)
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
	// Node tools consume these exports without the app's source compiler.
	const nodeConsumer = join(temporary, 'node-consumer')
	const installed = join(nodeConsumer, 'node_modules/@octane-xplat/ui')
	mkdirSync(dirname(installed), { recursive: true })
	cpSync(packedRoot, installed, { recursive: true })
	writeFileSync(
		join(nodeConsumer, 'check.mjs'),
		`
import assert from 'node:assert/strict'
import { realpathSync } from 'node:fs'
for (const specifier of ['@octane-xplat/ui/parity', '@octane-xplat/ui/parity/check-helpers']) {
  const entry = import.meta.resolve(specifier)
  assert.match(realpathSync(new URL(entry)), /node_modules/)
  assert.match(entry, /\\.js$/)
  await import(specifier)
}
const { near, dims } = await import('@octane-xplat/ui/parity/check-helpers')
assert.equal(near(10, 10.5), true)
assert.equal(near(10, 11), false)
assert.equal(dims({ box: { w: 10, h: 20 } }, 10, 20)[1], true)
`,
	)

	run(process.execPath, ['check.mjs'], nodeConsumer)
	const packedManifest = JSON.parse(readFileSync(join(packedRoot, 'package.json'), 'utf8'))
	const workspaceManifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
	assert.deepEqual(
		packedManifest.exports,
		workspaceManifest.exports,
		'packing preserves source and declaration exports',
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

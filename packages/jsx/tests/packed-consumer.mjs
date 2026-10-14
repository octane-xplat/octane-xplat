import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(packageRoot, '../..')
const temporary = mkdtempSync(join(tmpdir(), 'octane-xplat-jsx-consumer-'))
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

// ---------------------------------------------------------------------------
// Consumer sources. Each lane compiles native.tsx + dom.tsx + imports.ts with
// a different condition set; per-lane assertions live in the sources.
// ---------------------------------------------------------------------------

// Shared contract surface every condition must serve identically: core tags,
// the compiler-produced #text entry, and the nine maintained extensions.
const nativeSource = `
const tree = (
	<flexboxlayout className="row" style={{ padding: 4 }} flexDirection="row">
		<label text="hi" whiteSpace="nowrap" />
		<label><formattedstring fontFamily="system-ui" fontSize={18} color="#ff0000" backgroundColor="#ffffff" ref={(element) => { void element; return () => {} }}><span text="Rich" fontWeight="bold"><span text="nested" /></span></formattedstring></label>
		<button isEnabled={false} onTap={(event) => void event.object} />
		<scrollview orientation="horizontal" />
		<wraplayout orientation="vertical" itemWidth={0} itemHeight={30}><label text="Item" /></wraplayout>
		<rootlayout ref={(view) => { void view; return () => {} }} style={{ padding: 8 }}><label horizontalAlignment="right" text="Overlay" /><contentview /></rootlayout>
		<docklayout stretchLastChild={false}><label dock="right" text="Side" /></docklayout>
		<proxyviewcontainer row={1} ref={(element) => { void element; return () => {} }}><label text="Projected" /></proxyviewcontainer>
		<contentview id="single" style={{ width: 100, height: 40 }}
			ref={(view) => { void view; return () => {} }}>
			<label text="Content" horizontalAlignment="center" verticalAlignment="middle" />
		</contentview>
		<activityindicator busy={true} ref={(view) => { void view; return () => {} }} />
		<htmlview html="<b>Hello &amp; world</b>" style={{ fontSize: 18 }} ref={(view) => { void view; return () => {} }} />
		<searchbar text="query" hint="Find" onTextChange={(event) => { const value: string = event.value; const old: string | undefined = event.oldValue; void value; void old; void event.object }} onSubmit={(event) => { const name: string = event.eventName; void name; void event.object }} ref={(view) => { void view; return () => {} }} />
		<textfield hint="name" onTextChange={(event) => void event.value} />
		<listview items={[1, 2]} renderItem={(item) => <label text={String(item)} />} />
		<svgview src="<svg />" stretch="aspectFit" />
		<gridlayout hostSlot="mainContent" />
		<cachedimage src="a.png" failureImageUri="f.png" noCache />
		<xplatvideo src="v.mp4" onFinished={() => {}} />
		<nscanvas onReady={() => {}} />
		<xplatlottie src="a.json" loop />
		<pager items={[1]} renderItem={(item) => <label text={String(item)} />} />
		<animatedimage src="g.gif" />
		<applesigninbutton onTap={() => {}} />
		<googlesigninbutton onTap={() => {}} />
	</flexboxlayout>
)
void tree

// @ts-expect-error unknown elements are rejected — DOM vocabulary is not native
const bad = <div />

// @ts-expect-error unknown props are rejected on shared tags
const badProp = <label nosuchprop={1} />
void bad
void badProp
// @ts-expect-error ContentView has common attributes, no invented content prop
const badContent = <contentview content="text" />
void badContent
// @ts-expect-error RootLayout has no new track configuration prop
const badRoot = <rootlayout rows="20" />
void badRoot
// @ts-expect-error busy is boolean
const badActivityBusy = <activityindicator busy="true" />
// @ts-expect-error AppKit-specific props are not in the shared contract
const badActivitySize = <activityindicator controlSize={0} />
void badActivityBusy
void badActivitySize
// @ts-expect-error HTML content is a string
const badHtml = <htmlview html={123} />
// @ts-expect-error HtmlView does not acquire AppKit-specific props
const badHtmlText = <htmlview text="Hello" />
void badHtml
void badHtmlText
// @ts-expect-error SearchBar text is a string
const badSearchText = <searchbar text={123} />
// @ts-expect-error SearchBar preserves the canonical hint name
const badSearchPlaceholder = <searchbar placeholder="Find" />
// @ts-expect-error SearchBar changes carry an event, not a bare string
const badSearchHandler = <searchbar onTextChange={(value: string) => { void value }} />
void badSearchText
void badSearchPlaceholder
void badSearchHandler
// @ts-expect-error WrapLayout item size is numeric
const badWrapSize = <wraplayout itemWidth="30" />
// @ts-expect-error WrapLayout orientation is closed
const badWrapOrientation = <wraplayout orientation="diagonal" />
void badWrapSize
void badWrapOrientation
// @ts-expect-error DockLayout primitive contract rejects strings
const badDock = <docklayout stretchLastChild="false" />
// @ts-expect-error DockLayout edges are closed
const badEdge = <label dock="center" />
void badDock
void badEdge
`

// Module augmentation through the intrinsics entry must reach the contract.
const augmentSource = `
import type { Attributes } from '@octane-xplat/jsx/intrinsics'

declare module '@octane-xplat/jsx/intrinsics' {
	interface NativeElements<TElement> {
		fixturewidget: Attributes<TElement, { marker?: string }>
	}
}

const augmented = <fixturewidget marker="x" />
void augmented
`

const domSource = `/** @jsxImportSource @octane-xplat/jsx/dom */
const el = <div className="page" onClick={(event) => void event.currentTarget} />
// @ts-expect-error DOM rejects native tags
const wrong = <flexboxlayout />
// @ts-expect-error invalid DOM props fail
const badProp = <div nosuchprop={1} />
void el
void wrong
void badProp
`

// Per-condition assertions on the conditioned host element type.
const laneSource = {
	default: `
const lane = <label
	ref={(element) => {
		// The opaque default is a real object type, not unknown.
		const asObject: object | null = element
		void asObject
		// @ts-expect-error opaque members are not readable
		element?.nativeViewProtected
	}}
/>
void lane
`,
	native: `
import type { View } from '@nativescript/core/ui/core/view/index.js'
const lane = <>
	<label
		ref={(element) => {
			const view: View | null = element
			void view?.ios
		}}
	/>
	<label ref={{ current: null as View | null }} />
</>
void lane
`,
	macos: `
const formatted = <label><formattedstring ref={(element) => {
 if (element) { const logical: import('@octane-xplat/jsx/jsx-runtime').LogicalElement = element; const noView: null = logical.view; void noView; }
 return () => {}
}}><span text="rich" /></formattedstring></label>
void formatted
const proxy = <proxyviewcontainer ref={(element) => {
	if (element) {
		const logical: import('@octane-xplat/jsx/jsx-runtime').LogicalElement = element
		const absent: null = logical.view
		void absent
		// @ts-expect-error a viewless ref is not an NSView
		element.addSubview(element)
	}
	return () => {}
}} />
void proxy

const lane = <label
	ref={(element) => {
		// AppKit host surface — proves the macos branch resolved.
		element?.addSubview(element)
	}}
/>
void lane
`,
	both: `
const formatted = <label><formattedstring ref={(element) => {
 if (element) { const logical: import('@octane-xplat/jsx/jsx-runtime').LogicalElement = element; const noView: null = logical.view; void noView; }
 return () => {}
}}><span text="rich" /></formattedstring></label>
void formatted
const proxy = <proxyviewcontainer ref={(element) => {
	if (element) {
		const logical: import('@octane-xplat/jsx/jsx-runtime').LogicalElement = element
		const absent: null = logical.view
		void absent
		// @ts-expect-error a viewless ref is not an NSView
		element.addSubview(element)
	}
	return () => {}
}} />
void proxy

// customConditions: ['macos', 'native'] with @nativescript/core ABSENT —
// only the macos branch can resolve; a stray native resolution would fail
// import of '@nativescript/core' before this check runs.
const lane = <label
	ref={(element) => {
		element?.addSubview(element)
	}}
/>
void lane
`,
}

// Resolution proof for every published subpath in each lane.
const importsSource = `
import type { HostElement, JSX, NativeElements, Ref } from '@octane-xplat/jsx/jsx-runtime'
import type { JSX as DevJSX } from '@octane-xplat/jsx/jsx-dev-runtime'
import type { NativeElements as Intrinsics } from '@octane-xplat/jsx/intrinsics'
import type { JSX as DomJSX } from '@octane-xplat/jsx/dom/jsx-runtime'
import type { JSX as DomDevJSX } from '@octane-xplat/jsx/dom/jsx-dev-runtime'
import type { JSX as DomIndex } from '@octane-xplat/jsx/dom'

const ref: Ref<HostElement> = { current: null }
const element: JSX.Element = null
type Members = keyof NativeElements<HostElement>
const tag: Members = 'label'
const dev: DevJSX.Element = null
const intr: keyof Intrinsics<HostElement> = 'pager'
declare const domEl: DomJSX.Element
declare const domDev: DomDevJSX.Element
declare const domIndex: DomIndex.Element
void ref
void element
void tag
void dev
void intr
void domEl
void domDev
void domIndex
`

const lanes = {
	default: { customConditions: [], nsCore: false, skipLibCheck: false },
	native: { customConditions: ['native'], nsCore: true, skipLibCheck: true },
	macos: { customConditions: ['macos'], nsCore: false, skipLibCheck: false },
	both: { customConditions: ['macos', 'native'], nsCore: false, skipLibCheck: false },
	dom: { customConditions: ['web'], nsCore: false, skipLibCheck: false, domOnly: true },
}

const modes = [
	{ name: 'bundler', module: 'esnext', moduleResolution: 'bundler' },
	{ name: 'nodenext', module: 'nodenext', moduleResolution: 'nodenext' },
]

function linkDependencies(modules, names) {
	for (const dependency of names) {
		const source = join(packageRoot, 'node_modules', dependency)
		const fallback = join(repoRoot, 'node_modules', dependency)
		const resolved = existsSync(source) ? source : existsSync(fallback) ? fallback : null
		assert.ok(resolved, `dependency ${dependency} must be installed in the workspace`)
		mkdirSync(dirname(join(modules, dependency)), { recursive: true })
		symlinkSync(resolved, join(modules, dependency), 'dir')
	}
}

try {
	run('pnpm', ['pack', '--pack-destination', packOutput], packageRoot)
	const tarballs = readdirSync(packOutput).filter((name) => name.endsWith('.tgz'))
	assert.equal(tarballs.length, 1, 'pnpm pack produces one tarball')
	run('tar', ['-xzf', join(packOutput, tarballs[0]), '-C', extractedRoot], temporary)
	const packedRoot = join(extractedRoot, 'package')

	for (const [laneName, lane] of Object.entries(lanes)) {
		for (const mode of modes) {
			const consumerRoot = join(temporary, `${laneName}-${mode.name}`)
			const modules = join(consumerRoot, 'node_modules')
			const packageLink = join(modules, '@octane-xplat/jsx')
			mkdirSync(dirname(packageLink), { recursive: true })
			cpSync(packedRoot, packageLink, { recursive: true })

			// octane is a required peer (DOM types + universal runtime types).
			const deps = ['octane']
			if (lane.nsCore) {
				deps.push('@nativescript/core', '@nativescript/types')
			}

			linkDependencies(modules, deps)

			writeFileSync(
				join(consumerRoot, 'package.json'),
				JSON.stringify({ name: `jsx-consumer-${laneName}-${mode.name}`, type: 'module' }),
			)

			const files = []
			if (lane.domOnly) {
				writeFileSync(join(consumerRoot, 'dom.tsx'), domSource)
				writeFileSync(
					join(consumerRoot, 'imports.ts'),
					`
import type { JSX } from '@octane-xplat/jsx/dom/jsx-runtime'
import type { JSX as DevJSX } from '@octane-xplat/jsx/dom/jsx-dev-runtime'
declare const el: JSX.Element
declare const dev: DevJSX.Element
void el
void dev
`,
				)

				files.push('dom.tsx', 'imports.ts')
			} else {
				writeFileSync(join(consumerRoot, 'native.tsx'), nativeSource + laneSource[laneName])
				writeFileSync(join(consumerRoot, 'dom.tsx'), domSource)
				writeFileSync(join(consumerRoot, 'augment.tsx'), augmentSource)
				writeFileSync(join(consumerRoot, 'imports.ts'), importsSource)
				files.push('native.tsx', 'dom.tsx', 'augment.tsx', 'imports.ts')
			}

			writeFileSync(
				join(consumerRoot, 'tsconfig.json'),
				JSON.stringify(
					{
						compilerOptions: {
							strict: true,
							noEmit: true,
							module: mode.module,
							moduleResolution: mode.moduleResolution,
							target: 'esnext',
							jsx: 'react-jsx',
							jsxImportSource: '@octane-xplat/jsx',
							customConditions: lane.customConditions,
							types: lane.nsCore ? ['@nativescript/types'] : [],
							skipLibCheck: lane.skipLibCheck,
							lib: ['esnext', 'dom'],
						},
						files,
					},
					null,
					2,
				),
			)

			run(
				process.execPath,
				[join(repoRoot, 'node_modules/typescript/bin/tsc'), '--project', 'tsconfig.json'],
				consumerRoot,
			)

			console.log(`[packed jsx] ${laneName}/${mode.name} consumer passed`)
		}
	}
} finally {
	// Leave the tree on failure for inspection.
}

console.log(`Packed jsx consumer passed: ${temporary}`)

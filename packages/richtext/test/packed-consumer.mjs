import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const repo = resolve(import.meta.dirname, '../../..')
await mkdir(join(repo, 'research'), { recursive: true })
const app = await mkdtemp(join(repo, 'research/editor-consumer-'))
const packs = join(app, 'packs')
await mkdir(packs)
await mkdir(join(app, 'src'))
function run(command, args, cwd = app) {
	return execFileSync(command, args, {
		cwd,
		encoding: 'utf8',
		timeout: 420_000,
		maxBuffer: 16 * 1024 * 1024,
		env: { ...process.env, MACOS_SIGNING_IDENTITY: '', MACOS_NOTARY_PROFILE: '' },
	})
}

const dependencies = {
	octane: '0.6.3',
	'@nativescript/macos-node-api': '0.4.4-next.2026-08-09-31292056208',
}

for (const name of ['richtext', 'tiptap', 'lexical', 'macos-renderer', 'cli']) {
	const dir = join(repo, 'packages', name)
	const manifest = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
	run('pnpm', ['pack', '--pack-destination', packs], dir)
	dependencies[manifest.name] =
		`file:${join(packs, `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`)}`
}

const product = {
	productName: 'EditorConsumer',
	executableName: 'EditorConsumer',
	bundleIdentifier: 'org.octane.xplat.editor-consumer',
	version: '0.1.0',
	minimumSystemVersion: '13.5',
	viteConfig: 'vite.config.mjs',
	bundleFile: 'dist/main.cjs',
}

await writeFile(
	join(app, 'package.json'),
	JSON.stringify(
		{
			name: 'editor-consumer',
			private: true,
			type: 'module',
			dependencies,
			devDependencies: { '@octanejs/vite-plugin': '0.1.61', vite: '8.3.0', typescript: '5.9.3' },
			xplat: { targets: { macos: { runtime: 'appkit-node-api', package: product } } },
		},
		null,
		2,
	),
)

await writeFile(
	join(app, 'pnpm-workspace.yaml'),
	`packages: []\nnodeLinker: isolated\nminimumReleaseAge: 0\noverrides:\n  '@octane-xplat/richtext': ${JSON.stringify(dependencies['@octane-xplat/richtext'])}\n  '@tiptap/core': 3.28.0\n  '@tiptap/pm': 3.28.0\n  '@tiptap/starter-kit': 3.28.0\n`,
)

await writeFile(
	join(app, 'tsconfig.json'),
	JSON.stringify({
		compilerOptions: {
			strict: true,
			skipLibCheck: true,
			target: 'ESNext',
			module: 'ESNext',
			moduleResolution: 'Bundler',
			jsx: 'react-jsx',
			jsxImportSource: '@octane-xplat/macos-renderer',
			customConditions: ['macos'],
			moduleSuffixes: ['.macos', ''],
			lib: ['ESNext'],
			types: [],
			noEmit: true,
		},
		include: ['src/types.tsx'],
	}),
)

await writeFile(
	join(app, 'src/types.tsx'),
	`import { RichTextEditor, type RichTextEditorHandle } from '@octane-xplat/richtext'
import { TiptapEditor, ensureJSONBridge, jsonBridgeReady, type TiptapEditorHandle } from '@octane-xplat/tiptap'
import { LexicalEditor, type LexicalEditorHandle } from '@octane-xplat/lexical'
const onRef = (h: RichTextEditorHandle | null) => h?.setHTML('<p>Test</p>')
const elements = [<RichTextEditor ref={onRef} value="<p>Test</p>" />, <TiptapEditor json={{ type: 'doc' }} ref={(h: TiptapEditorHandle | null) => { h?.getJSON() }} />, <LexicalEditor json={{ root: {} }} ref={(h: LexicalEditorHandle | null) => { h?.getJSON() }} />]
// @ts-expect-error JSON belongs to the engine facade
const bad = <RichTextEditor json={{ type: 'doc' }} />
// @ts-expect-error Lexical JSON has a root, not a ProseMirror doc
const badJSON = <LexicalEditor json={{ type: 'doc' }} />
void elements; void bad; void badJSON; void ensureJSONBridge; void jsonBridgeReady
`,
)

await writeFile(
	join(app, 'src/App.macos.tsx'),
	`/** @jsxImportSource @octane-xplat/macos-renderer */
import { RichTextEditor } from '@octane-xplat/richtext'
import { TiptapEditor } from '@octane-xplat/tiptap'
import { LexicalEditor } from '@octane-xplat/lexical'
const seen = new Set<string>()
let rich: any, tiptap: any, lexical: any
const ready = (name: string, handle: any) => {
 if (!handle?.getHTML().includes('Seed')) throw Error(name + ' missing initial HTML')
 if (name === 'tiptap' && handle.getJSON()?.type !== 'doc') throw Error('tiptap JSON shape')
 if (name === 'lexical' && !handle.getJSON()?.root) throw Error('lexical JSON shape')
 seen.add(name)
 if (seen.size === 3) { console.log('PACKED_EDITORS_READY'); globalThis.__finishEditors() }
}
export default function App() { return <flexboxlayout flexDirection="column">
 <RichTextEditor style={{ height: 120 }} value="<p>Seed rich</p>" ref={(h: any) => { rich = h }} onReady={() => ready('richtext', rich)} />
 <TiptapEditor style={{ height: 120 }} value="<p>Wrong HTML</p>" json={{type:"doc",content:[{type:"paragraph",content:[{type:"text",text:"Seed tiptap JSON"}]}]}} ref={(h: any) => { tiptap = h }} onReady={() => ready('tiptap', tiptap)} />
 <LexicalEditor style={{ height: 120 }} value="<p>Wrong HTML</p>" json={{root:{type:"root",version:1,children:[{type:"paragraph",version:1,children:[{type:"text",version:1,text:"Seed lexical JSON",format:0,detail:0,mode:"normal",style:""}],direction:null,format:"",indent:0,textFormat:0,textStyle:""}],direction:null,format:"",indent:0}}} ref={(h: any) => { lexical = h }} onReady={() => ready('lexical', lexical)} />
 </flexboxlayout> }
`,
)

await writeFile(
	join(app, 'src/main.mjs'),
	`import '@nativescript/macos-node-api'
import { createMacOSRoot } from '@octane-xplat/macos-renderer'
import App from './App.macos.tsx'
const app = NSApplication.sharedApplication
app.setActivationPolicy(1)
const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer({origin:{x:0,y:0},size:{width:500,height:420}},1,2,false)
window.releasedWhenClosed = false
const root = createMacOSRoot(window.contentView)
globalThis.__finishEditors = () => { root.unmount(); window.close(); globalThis.__xplatStopHost() }
root.render(App,{})
window.makeKeyAndOrderFront(app)
app.finishLaunching()
setTimeout(() => { console.error('PACKED_EDITORS_TIMEOUT'); globalThis.__finishEditors() }, 20000)
`,
)

await writeFile(
	join(app, 'vite.config.mjs'),
	`import { xplatMacOS } from '@octane-xplat/cli/macos/vite'
export default async ({mode}) => { const config = await xplatMacOS(mode, {root: import.meta.dirname, entry: 'src/main.mjs'}); config.build.outDir='dist'; return config }
`,
)

console.log('[packed editors] installing tarball consumer')
run('pnpm', ['install', '--ignore-scripts'])
run('pnpm', ['exec', 'xplat', 'patches', 'apply'])
// patches apply registers patchedDependencies, so this install must update
// the lockfile — frozen installs (CI default) would reject the config change.
run('pnpm', ['install', '--ignore-scripts', '--no-frozen-lockfile'])
run('pnpm', ['exec', 'tsc', '--noEmit'])
console.log('[packed editors] macos declarations pass including negative JSON cases')
run('pnpm', ['exec', 'xplat', 'build', '--targets', 'macos'])
console.log('[packed editors] production AppKit build and native metadata pass')
const executable = join(
	app,
	'artifacts/macos-arm64/EditorConsumer.app/Contents/MacOS/EditorConsumer',
)

const result = spawnSync(executable, [], { cwd: app, encoding: 'utf8', timeout: 25_000 })
const output = result.stdout + result.stderr
assert.equal(result.status, 0, output)
assert.match(output, /PACKED_EDITORS_READY/)
assert.doesNotMatch(output, /PACKED_EDITORS_TIMEOUT|uncaught render error|command .*failed/)
console.log(
	'[packed editors] all three engines mounted via Octane AppKit; refs ready and teardown passed',
)

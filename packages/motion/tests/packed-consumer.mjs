import { checkMacOSMotionConsumer } from '../../../scripts/check-macos-motion-consumer.ts'
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
const temporary = mkdtempSync(join(tmpdir(), 'octane-xplat-motion-consumer-'))
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

// Deps the consumer needs in scope — the package's declared dependencies and
// peers plus the shared JSX facade.
const dependencies = [
	'octane',
	'@nativescript-community/octane',
	'@nativescript/core',
	'@nativescript-community/gesturehandler',
	'@nativescript/types',
	'@octane-xplat/macos-renderer',
	'@octane-xplat/jsx',
	'@octane-xplat/ui',
	'motion-dom',
]

const consumers = {
	web: `import { motion, MotionConfig, Presence, useMotionValue, useSpring, type MotionValue } from '@octane-xplat/motion'
const value: MotionValue = useMotionValue(0)
const sprung: MotionValue = useSpring(value)
const view = <motion.View animate={{ opacity: 1 }} drag="x" dragConstraints={{left: -40, right: 40}} dragElastic={0.35} dragMomentum={false} onDragEnd={(_event, info) => { const velocity: number = info.velocity.x; void velocity }} />
// @ts-expect-error ref constraints are deliberately deferred
const refDrag = <motion.View drag dragConstraints={{current: null}} />
// @ts-expect-error drag only accepts boolean or an axis
const badDrag = <motion.View drag="both" />
void refDrag
void badDrag
const config = <MotionConfig reducedMotion="user" />
const presence = <Presence present={true} />
// @ts-expect-error useMotionValue seeds a number
const badSeed = useMotionValue('zero')
// @ts-expect-error reducedMotion follows the published union
const badMotion = <MotionConfig reducedMotion="sometimes" />
void view
void config
void presence
void sprung
void badSeed
void badMotion
`,
	native: `import { motion, useMotionValue, useTransform, type MotionValue } from '@octane-xplat/motion'
const value: MotionValue = useMotionValue(0)
const doubled: MotionValue = useTransform(value, (input: number) => input * 2)
const view = <motion.Row drag="y" dragConstraints={{top: -20, bottom: 20}} onDrag={(_event, info) => { const y: number = info.offset.y; void y }} animate={{ opacity: 0.5 }} />
void view
void doubled
`,
}

for (const target of Object.keys(consumers)) {
	consumers[target] += `
import { LayoutGroup } from '@octane-xplat/motion'
import type { Variants, AnimationDefinition, TransitionInput } from '@octane-xplat/motion'
const containers = <motion.View layoutRoot><motion.View layout drag="x" layoutAnchor={{ x: 1, y: 1 }} style={{ borderRadius: 20 }} /></motion.View>
const independent = <motion.View layout layoutAnchor={false} />
// @ts-expect-error anchors require numeric coordinates
const badAnchor = <motion.View layoutAnchor={{ x: 'end', y: 1 }} />
void containers
void independent
void badAnchor
const shared = <LayoutGroup id="tabs" inherit="id"><motion.View layoutId="underline" layoutCrossfade={false} transition={{layout: {duration: 0.3}}} /></LayoutGroup>
// @ts-expect-error inherit has a bounded vocabulary
const badGroup = <LayoutGroup inherit="everything" />
// @ts-expect-error shared IDs are strings
const badShared = <motion.View layoutId={42} />
void shared
void badGroup
void badShared
const variants: Variants = { show: (custom: number) => ({ x: custom, transition: { duration: 0, when: 'beforeChildren', staggerChildren: 0.1 } }) }
const labels: AnimationDefinition = ['show']
const timing: TransitionInput = { default: { duration: 0.2 }, x: { delay: 0.1 }, delayChildren: 0.1, when: 'afterChildren' }
const variantHost = <motion.View variants={variants} custom={20} initial="show" animate={labels} exit="show" whileTap="show" whileFocus={['show']} transition={timing} />
// @ts-expect-error arbitrary values are outside the numeric target contract
const invalidVariant: Variants = { show: { x: '10px' } }
// @ts-expect-error when has a bounded vocabulary
const invalidWhen: TransitionInput = { when: 'together' }
void variantHost
void invalidVariant
void invalidWhen
`
}

// Package acceptance checks the shared numeric contract. Runtime and input
// evidence belongs to the platform harnesses, not this type-only fixture.
consumers.macos =
	consumers.native +
	`
import { MotionConfig, useReducedMotion } from '@octane-xplat/motion'
const reduced: boolean = useReducedMotion()
const macosConfig = <MotionConfig reducedMotion="user" />
// @ts-expect-error reducedMotion remains the same bounded union on macOS
const badMacosConfig = <MotionConfig reducedMotion="sometimes" />
void reduced
void macosConfig
void badMacosConfig
`

const extraFiles = {}
// Compile the maintained guide examples against packed declarations on each
// target, so docs cannot depend on workspace-only types or imports.
for (const [file, names] of [
	[
		'docs/app/animation-gestures.md',
		[
			'ReorderingList',
			'ScrollingCard',
			'AnimatedTabs',
			'ExpandingDetails',
			'MovingHighlight',
			'IndependentHighlight',
			'AnchoredCard',
			'ExpandingCard',
			'MovableCard',
		],
	],
	['.changelog/motion-shared-elements.md', ['Highlight']],
	['.agents/skills/octane-xplat/references/services.md', ['SharedCard']],
	['packages/motion/README.md', ['LayoutCard']],
	['docs/testing/known-limits.md', ['LayoutSelection']],
	['packages/motion/UPSTREAM.md', ['GroupNamespace', 'SharedPresence']],
]) {
	const markdown = readFileSync(join(repoRoot, file), 'utf8')
	const snippets = [...markdown.matchAll(/```tsx\n([\s\S]*?)```/g)].map((match) => match[1])
	for (const name of names) {
		const snippet = snippets.find((source) => source.includes(`export function ${name}(`))
		assert.ok(snippet, `Missing maintained example ${name} in ${file}`)
		extraFiles[`example-${name}.tsx`] = snippet
	}
}

// Mirrors the create template's per-target tsconfig: suffix typing selects
// .web/.mobile/.ios/.android/.macos declaration variants, `types` scopes the
// ambient globals, and skipLibCheck stays on — NativeScript's third-party
// ambient declarations carry upstream lib conflicts.
const targetConfig = {
	macos: {
		jsxImportSource: '@octane-xplat/jsx',
		moduleSuffixes: ['.macos', ''],
		customConditions: ['macos', 'native'],
		types: [],
	},
	web: {
		jsxImportSource: '@octane-xplat/jsx/dom',
		moduleSuffixes: ['.web', ''],
		customConditions: ['web'],
		types: [],
	},
	native: {
		jsxImportSource: '@octane-xplat/jsx',
		moduleSuffixes: ['.ios', '.android', '.mobile', ''],
		customConditions: ['native'],
		types: ['@nativescript/types'],
	},
}

async function typecheck(packagePath, target, mode, exportMapIndex) {
	const consumerRoot = join(temporary, `map-${exportMapIndex}-${target}-${mode.name}`)
	const modules = join(consumerRoot, 'node_modules')
	const packageLink = join(modules, '@octane-xplat/motion')
	mkdirSync(dirname(packageLink), { recursive: true })
	cpSync(packagePath, packageLink, { recursive: true })
	for (const dependency of dependencies) {
		const source = join(packageRoot, 'node_modules', dependency)
		const fallback = join(repoRoot, 'node_modules', dependency)
		const resolved = existsSync(source) ? source : existsSync(fallback) ? fallback : null
		if (!resolved) {
			continue
		}

		const targetPath = join(modules, dependency)
		mkdirSync(dirname(targetPath), { recursive: true })
		symlinkSync(resolved, targetPath, 'dir')
	}

	// ESM consumer — NodeNext treats extensionless .tsx as CJS without it,
	// which would let an ESM-only package slip type checks its runtime
	// resolution can't satisfy.
	writeFileSync(
		join(consumerRoot, 'package.json'),
		JSON.stringify({ name: `consumer-${exportMapIndex}-${target}-${mode.name}`, type: 'module' }),
	)

	writeFileSync(join(consumerRoot, 'consumer.tsx'), consumers[target])
	for (const [name, contents] of Object.entries(extraFiles)) {
		writeFileSync(join(consumerRoot, name), contents)
	}

	if (target === 'macos' && mode.name === 'bundler') {
		await checkMacOSMotionConsumer({
			packageRoot,
			consumerRoot,
			packageName: '@octane-xplat/motion',
			exportsMap: JSON.parse(readFileSync(join(packageLink, 'package.json'), 'utf8')).exports,
		})
	}

	const config = targetConfig[target]
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
					jsxImportSource: config.jsxImportSource,
					moduleSuffixes: config.moduleSuffixes,
					customConditions: config.customConditions,
					types: config.types.filter((name) => {
						const segments = name.split('/')
						const pkg = name.startsWith('@') ? segments.slice(0, 2) : segments.slice(0, 1)
						return existsSync(join(modules, ...pkg, 'package.json'))
					}),
					skipLibCheck: true,
				},
				files: ['consumer.tsx', ...Object.keys(extraFiles)],
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

		for (const target of Object.keys(consumers)) {
			// Subpath exports absent from a map (e.g. ./macos only exists in the
			// workspace map) cannot resolve — skip that lane for that map.
			const targetSubpaths = targetConfig[target].subpaths ?? ['.']
			if (!targetSubpaths.every((subpath) => exportsMap[subpath])) {
				continue
			}

			for (const mode of [
				{
					name: 'bundler',
					module: 'esnext',
					moduleResolution: 'bundler',
				},
				{
					name: 'nodenext',
					module: 'nodenext',
					moduleResolution: 'nodenext',
				},
			]) {
				await typecheck(consumerPackage, target, mode, index)
			}
		}
	}

	console.log(
		'motion packed consumer: web/native/macos exports typecheck in Bundler and NodeNext; macOS source/dist imports and object mounts pass (host behavior unqualified)',
	)
} finally {
	rmSync(temporary, { recursive: true, force: true })
}

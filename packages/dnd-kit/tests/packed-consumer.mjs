import { spawnSync } from 'node:child_process'
import {
	mkdtempSync,
	mkdirSync,
	readdirSync,
	cpSync,
	symlinkSync,
	writeFileSync,
	rmSync,
	readFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const temporary = mkdtempSync(join(tmpdir(), 'xplat-dnd-consumer-'))
function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8' })
	if (result.status !== 0) {
		throw new Error(result.stderr || result.stdout || String(result.error))
	}
}

try {
	run('pnpm', ['--config.ignore-scripts=true', 'pack', '--pack-destination', temporary], root)
	const tarball = readdirSync(temporary).find((name) => name.endsWith('.tgz'))
	run('tar', ['-xzf', join(temporary, tarball), '-C', temporary], root)
	const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
	for (const target of ['web', 'native', 'macos']) {
		for (const mode of ['Bundler', 'NodeNext']) {
			const consumer = join(temporary, `${target}-${mode}`)
			const modules = join(consumer, 'node_modules')
			mkdirSync(join(modules, '@octane-xplat'), { recursive: true })
			cpSync(join(temporary, 'package'), join(modules, '@octane-xplat/dnd-kit'), {
				recursive: true,
			})

			for (const name of [
				...Object.keys(manifest.dependencies),
				...Object.keys(manifest.peerDependencies),
			]) {
				const destination = join(modules, name)
				mkdirSync(dirname(destination), { recursive: true })
				symlinkSync(join(root, 'node_modules', name), destination, 'dir')
			}

			writeFileSync(join(consumer, 'package.json'), '{"type":"module"}')
			writeFileSync(
				join(consumer, 'consumer.tsx'),
				`
import { DndContext, SortableList, useDraggable, useDroppable, useSortable, useDndContext, SortableContext, arrayMove, closestCenter, type AutoScroll, type DragEvent } from '@octane-xplat/dnd-kit'
import { View } from '@octane-xplat/ui'
function Card() {
 const drag = useDraggable({ id: 'a', disabled: false, data: { list: 'first' } })
 const drop = useDroppable({ id: 'target', accept: source => source.id === 'a' })
 const sorted = useSortable({ id: 'a' })
 const state = useDndContext()
 void drop; void sorted; void state
 return <View bind={drag.bind} onPan={drag.onPan} style={drag.style} />
}
const node = <DndContext collisionDetection={closestCenter}><SortableContext items={['a']}><Card /></SortableContext></DndContext>
const list = <SortableList items={['a']} renderItem={() => null} onReorder={(items, event: DragEvent) => { void items; void event }} />
const order: string[] = arrayMove(['a', 'b'], 0, 1)
// @ts-expect-error IDs must be strings or numbers
useDraggable({ id: {} })
// @ts-expect-error onReorder is required
const missingOwner = <SortableList items={['a']} renderItem={() => null} />
const scroll: AutoScroll = { bounds: () => null, offsetRef: { current: 0 }, maxOffset: () => 0, scrollTo: () => {} }
void node; void list; void order; void missingOwner; void scroll
`,
			)

			writeFileSync(
				join(consumer, 'tsconfig.json'),
				JSON.stringify({
					compilerOptions: {
						strict: true,
						noEmit: true,
						skipLibCheck: true,
						target: 'ES2022',
						types: [],
						module: mode === 'NodeNext' ? 'NodeNext' : 'ESNext',
						moduleResolution: mode,
						customConditions: [target],
						jsx: 'react-jsx',
						jsxImportSource: 'octane',
					},
					files: ['consumer.tsx'],
				}),
			)

			run(
				process.execPath,
				[join(root, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json'],
				consumer,
			)
		}
	}

	console.log('dnd-kit packed consumers pass: web/native/macos, Bundler/NodeNext')
} finally {
	rmSync(temporary, { recursive: true, force: true })
}

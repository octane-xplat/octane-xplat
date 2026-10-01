import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkPackedPackage, verifyPackedPackage } from '../src/pack-check.mjs'

const toolRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixtureRoot = resolve(toolRoot, '../typegen-fixture')
const ts = createRequire(join(fixtureRoot, 'package.json'))('typescript')
const root = mkdtempSync(join(tmpdir(), 'tsrx-typegen-pack-fixture-'))

function writePackage(files) {
	const rootPath = join(root, `case-${Math.random().toString(36).slice(2)}`)
	mkdirSync(rootPath, { recursive: true })
	for (const [path, contents] of Object.entries(files)) {
		const file = join(rootPath, path)
		mkdirSync(dirname(file), { recursive: true })
		writeFileSync(file, contents)
	}

	return rootPath
}

const baseFiles = {
	'package.json': JSON.stringify({
		name: '@fixture/typed-package',
		exports: { '.': { types: './types/index.d.ts', default: './dist/index.js' } },
	}),
	'dist/index.js': 'export const value = 1\n',
	'types/index.d.ts': 'export declare const value: number\n',
}

try {
	verifyPackedPackage(ts, writePackage(baseFiles))

	const workspaceOnlyTypes = writePackage({
		'package.json': JSON.stringify({
			name: '@fixture/workspace-only-types',
			version: '0.0.0',
			type: 'module',
			files: ['dist', 'types'],
			exports: { '.': { types: './types/index.d.ts', default: './dist/index.js' } },
		}),
		'dist/index.js': 'export const value = 1\n',
		'types/index.d.ts': 'export declare const value: number\n',
		'workspace/demo-vue/types/shims.vue.d.ts':
			"import type { Component } from 'vue'\nexport type DemoOnly = Component\n",
	})

	checkPackedPackage(workspaceOnlyTypes, ts)

	const starBarrel = writePackage({
		'package.json': JSON.stringify({
			name: '@fixture/star-barrel',
			exports: { '.': { types: './types/index.d.ts', default: './src/index.ts' } },
		}),
		'src/index.ts': "export * from './runtime.js'\n",
		'src/runtime.ts': 'export const value = 1\n',
		'types/index.d.ts': 'export declare const value: number\n',
	})

	verifyPackedPackage(ts, starBarrel)

	const mismatchedRuntime = writePackage({
		...baseFiles,
		'dist/index.js': 'export const value = 1\nexport const missingType = true\n',
	})

	assert.throws(
		() => verifyPackedPackage(ts, mismatchedRuntime),
		/runtime\/type value exports differ.*missingType/,
	)

	const missingDependency = writePackage({
		...baseFiles,
		'types/index.d.ts':
			"import type { External } from 'unlisted-types'\nexport interface Props extends External {}\nexport declare const value: number\n",
	})

	assert.throws(
		() => verifyPackedPackage(ts, missingDependency),
		/imports unlisted-types; declare unlisted-types/,
	)

	const missingRelative = writePackage({
		...baseFiles,
		'types/index.d.ts':
			"export type { Props } from './missing.js'\nexport declare const value: number\n",
	})

	assert.throws(
		() => verifyPackedPackage(ts, missingRelative),
		/unresolved declaration reference \.\/missing\.js/,
	)

	// `export type *` exposes the target's names in type space only — an
	// ambient `declare const` behind it must not count as a declared value
	// (mirrors the ui index.macos.d.ts / props specRouteTypes case).
	const typeStarExport = writePackage({
		'package.json': JSON.stringify({
			name: '@fixture/type-star',
			exports: { '.': { types: './types/index.d.ts', default: './src/index.ts' } },
		}),
		'src/index.ts': "export type * from './props.js'\nexport const value = 1\n",
		'src/props.ts': 'export declare const phantom: unique symbol\nexport interface Props {}\n',
		'types/index.d.ts': "export type * from './props.js'\nexport declare const value: number\n",
		'types/props.d.ts': 'export declare const phantom: unique symbol\nexport interface Props {}\n',
	})

	verifyPackedPackage(ts, typeStarExport)

	// Control: a real `export *` edge does carry the ambient const into the
	// declared value surface, so a runtime that lacks it still fails.
	const valueStarExport = writePackage({
		'package.json': JSON.stringify({
			name: '@fixture/value-star',
			exports: { '.': { types: './types/index.d.ts', default: './src/index.ts' } },
		}),
		'src/index.ts': 'export const value = 1\n',
		'types/index.d.ts': "export * from './props.js'\nexport declare const value: number\n",
		'types/props.d.ts': 'export declare const phantom: unique symbol\n',
	})

	assert.throws(
		() => verifyPackedPackage(ts, valueStarExport),
		/declarations without runtime values: phantom/,
	)
} finally {
	rmSync(root, { recursive: true, force: true })
}

console.log('tsrx-typegen: packed-package failure checks pass')

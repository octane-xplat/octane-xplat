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

	verifyPackedPackage(
		ts,
		writePackage({
			...baseFiles,
			'package.json': JSON.stringify({
				name: '@fixture/conditional-types',
				types: './types/legacy.d.ts',
				exports: { '.': { types: './types/index.d.ts', default: './dist/index.js' } },
			}),
			'types/legacy.d.ts': 'export declare const legacy: boolean\n',
		}),
	)

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

	const extensionlessSource = {
		'package.json': JSON.stringify({
			name: '@fixture/extensionless-source',
			exports: {
				'.': { types: './types/service.d.ts', default: './src/service' },
				'./*': { types: './types/*.d.ts', default: './src/*' },
				'./*.ts': { types: './types/*.d.ts', default: './src/*.ts' },
			},
		}),
		'src/service.ts': 'export const value = 1\n',
		'src/service.web.ts': 'export const value = 2\n',
		'src/hook.tsrx': 'export function hook() { return 1 }\n',
		'src/hook.web.tsrx': 'export function hook() { return 2 }\n',
		'src/asset.json': '{}\n',
		'src/manual.d.ts': 'export interface Manual { value: string }\n',
		'types/service.d.ts': 'export declare const value: number\n',
		'types/service.web.d.ts': 'export declare const value: number\n',
		'types/hook.d.ts': 'export declare function hook(): number\n',
		'types/hook.web.d.ts': 'export declare function hook(): number\n',
	}

	verifyPackedPackage(ts, writePackage(extensionlessSource))
	const { 'types/hook.web.d.ts': omitted, ...missingVariant } = extensionlessSource
	assert.ok(omitted)
	assert.throws(
		() => verifyPackedPackage(ts, writePackage(missingVariant)),
		/missing from the tarball: \.\/types\/hook\.web\.d\.ts/,
	)

	assert.throws(
		() =>
			verifyPackedPackage(
				ts,
				writePackage({
					...extensionlessSource,
					'package.json': JSON.stringify({
						name: '@fixture/untyped-extensionless-source',
						exports: { '.': './src/service' },
					}),
				}),
			),
		/has no types condition/,
	)

	const templateExports = {
		'package.json': JSON.stringify({
			name: '@fixture/template-exports',
			exports: { '.': { types: './types/index.d.ts', default: './src/index.tsrx' } },
		}),
		'src/index.tsrx':
			'function Internal() @{ return <input /> }\nexport function Component() @{ return <Internal /> }\n',
		'types/index.d.ts': 'export declare function Component(): unknown\n',
	}

	verifyPackedPackage(ts, writePackage(templateExports))
	assert.throws(
		() =>
			verifyPackedPackage(
				ts,
				writePackage({ ...templateExports, 'types/index.d.ts': 'export {}\n' }),
			),
		/missing declarations: Component/,
	)

	const unreachableTypes = writePackage({
		...baseFiles,
		'package.json': JSON.stringify({
			name: '@fixture/unreachable-types',
			exports: { '.': { default: './dist/index.js', types: './types/index.d.ts' } },
		}),
	})

	assert.throws(() => verifyPackedPackage(ts, unreachableTypes), /has no types condition/)

	const sourceCondition = writePackage({
		...baseFiles,
		'package.json': JSON.stringify({
			name: '@fixture/source-condition',
			exports: {
				'.': {
					macos: { default: './src/index.ts' },
					types: './types/index.d.ts',
					default: './dist/index.js',
				},
			},
		}),
		'src/index.ts': 'export const value = 1\n',
	})

	assert.throws(() => verifyPackedPackage(ts, sourceCondition), /has no types condition/)

	const sourceLeak = writePackage({
		...baseFiles,
		'types/index.d.ts': "export { value } from '../src/value.js'\n",
		'src/value.ts': 'export const value = 1\n',
	})

	assert.throws(
		() => verifyPackedPackage(ts, sourceLeak),
		/resolves .* to implementation source; publish its declaration/,
	)

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

	// A mixed `export { value, type Options }` clause keeps the type element
	// out of the declared value surface even when `types` points at the `.ts`
	// source itself (mirrors the workshop ./macos MacOSStageOptions case).
	const mixedTypeExport = writePackage({
		'package.json': JSON.stringify({
			name: '@fixture/mixed-type',
			exports: { '.': { types: './src/index.ts', default: './src/index.ts' } },
		}),
		'src/index.ts': "export { value, type Options } from './runtime.js'\n",
		'src/runtime.ts': 'export const value = 1\nexport interface Options {}\n',
	})

	verifyPackedPackage(ts, mixedTypeExport)

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

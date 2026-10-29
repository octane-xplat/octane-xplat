import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import test from 'node:test'
import vm from 'node:vm'

const appRequire = createRequire(new URL('../apps/windows/package.json', import.meta.url))
const artifact = process.env.WINDOWS_CORE_ARTIFACT
const path = artifact
	? resolve(artifact, 'file-system/file-system-access.windows.js')
	: appRequire.resolve('@nativescript/core/file-system/file-system-access.windows.js')

const source = readFileSync(path, 'utf8')
	.replace(/^import .*\n/gm, '')
	.replace(/^export /gm, '')

const slash = String.fromCharCode(92)
const file = ['C:', 'qualification', '資料😀.txt'].join(slash)
const parent = ['C:', 'qualification'].join(slash)

// This executes the exact distributed FileSystemAccess, with no native file I/O.
function fixture() {
	const state = { entries: new Map(), queries: [], opened: [], disposed: 0, writes: [], winrt: [] }
	const io = {
		FileMode: { OpenOrCreate: 4 },
		FileAccess: { ReadWrite: 3 },
		FileShare: { ReadWrite: 3 },
		File: {
			Exists(path) {
				state.queries.push(['file', path])
				return state.entries.get(path)?.kind === 'file'
			},
			Open(path, mode, access, share) {
				assert.deepEqual([mode, access, share], [4, 3, 3])
				state.opened.push(path)
				if (!state.entries.has(path)) {
					state.entries.set(path, { kind: 'file', content: '' })
				}
				return {
					Dispose() {
						state.disposed++
					},
				}
			},
		},
		Directory: {
			Exists(path) {
				state.queries.push(['directory', path])
				return state.entries.get(path)?.kind === 'directory'
			},
			CreateDirectory(path) {
				if (state.entries.get(path)?.kind === 'file') {
					throw new Error('path is a file')
				}
				state.entries.set(path, { kind: 'directory' })
			},
		},
	}
	const context = {
		System: { IO: io },
		Windows: {
			Storage: {
				StorageFolder: {
					GetFolderFromPathAsync(path) {
						state.winrt.push(path)
						return { done() {} } // An async completion cannot contribute a synchronous result.
					},
				},
				PathIO: {
					WriteTextAsync(path, content) {
						state.writes.push(path)
						state.entries.set(path, { kind: 'file', content })
					},
				},
			},
		},
	}
	const Access = vm.runInNewContext(source + '\nFileSystemAccess', context)
	return { access: new Access(), state, io, context }
}

test('Windows existence returns a synchronous boolean and distinguishes files from directories', () => {
	const { access, state } = fixture()
	state.entries.set(file, { kind: 'file', content: 'keep me' })
	state.entries.set(parent, { kind: 'directory' })
	for (const [path, isFile, isFolder] of [
		[file, true, false],
		[parent, false, true],
		[file + '.missing', false, false],
	]) {
		assert.equal(access.fileExists(path), isFile)
		assert.equal(access.folderExists(path), isFolder)
	}
	assert.deepEqual(state.winrt, [])
	assert.deepEqual(state.writes, [])
})

test('Windows existence passes Unicode, drive-root and relative paths unchanged to the native backend', () => {
	const { access, state } = fixture()
	for (const path of [file, 'C:/qualification/資料😀.txt', 'relative.txt']) {
		state.entries.set(path, { kind: 'file', content: 'contents' })
		assert.equal(access.fileExists(path), true)
		assert.deepEqual(state.queries.at(-1), ['file', path])
	}
	const root = 'C:' + slash
	state.entries.set(root, { kind: 'directory' })
	assert.equal(access.folderExists(root), true)
	assert.deepEqual(state.queries.at(-1), ['directory', root])
})

test('Windows invalid existence inputs do not invoke the backend or coerce user objects', () => {
	const { access, state } = fixture()
	const object = {
		toString() {
			throw new Error('must not coerce')
		},
	}
	for (const path of ['', null, undefined, 3, object]) {
		assert.equal(access.fileExists(path), false)
		assert.equal(access.folderExists(path), false)
	}
	assert.deepEqual(state.queries, [])
	assert.deepEqual(state.winrt, [])
})

test('Windows existing-file metadata lookup does not write or open its contents', () => {
	const { access, state } = fixture()
	state.entries.set(file, { kind: 'file', content: 'preserve existing content' })
	const result = access.getFile(file)
	assert.deepEqual(JSON.parse(JSON.stringify(result)), {
		path: file,
		name: '資料😀.txt',
		extension: '.txt',
	})
	assert.equal(state.entries.get(file).content, 'preserve existing content')
	assert.deepEqual(state.opened, [])
	assert.deepEqual(state.writes, [])
})

test('Windows missing files create parents and close the new stream before returning metadata', () => {
	const { access, state } = fixture()
	assert.equal(access.getFile(file).name, '資料😀.txt')
	assert.equal(state.entries.get(parent).kind, 'directory')
	assert.equal(state.entries.get(file).content, '')
	assert.deepEqual(state.opened, [file])
	assert.equal(state.disposed, 1)
	assert.deepEqual(state.writes, [])
})

test('Windows creation preserves a file that appears after the existence check', () => {
	const { access, state, io } = fixture()
	io.File.Exists = () => {
		state.entries.set(file, { kind: 'file', content: 'created by another caller' })
		return false
	}
	assert.equal(access.getFile(file).path, file)
	assert.equal(state.entries.get(file).content, 'created by another caller')
	assert.equal(state.disposed, 1)
	assert.deepEqual(state.writes, [])
})

test('Windows projection failures are not mistaken for file absence or followed by blank writes', () => {
	for (const failure of ['missing', 'throws', 'non-boolean']) {
		const { access, state, io, context } = fixture()
		if (failure === 'missing') {
			delete context.System
		}

		if (failure === 'throws') {
			io.File.Exists = () => {
				throw new Error('bridge unavailable')
			}
		}

		if (failure === 'non-boolean') {
			io.File.Exists = () => Promise.resolve(true)
		}

		assert.throws(() => access.fileExists(file))
		const errors = []
		assert.equal(
			access.getFile(file, (error) => errors.push(error)),
			undefined,
		)

		assert.equal(errors.length, 1)
		assert.deepEqual(state.opened, [])
		assert.deepEqual(state.writes, [])
	}
})

test('Windows file creation reports native open/disposal failures without a blank-write fallback', () => {
	for (const failure of ['parent', 'open', 'dispose']) {
		const { access, state, io } = fixture()
		if (failure === 'parent') {
			io.Directory.CreateDirectory = () => {
				throw new Error('parent failed')
			}
		}

		io.File.Open = () => {
			if (failure === 'open') {
				throw new Error('open failed')
			}
			return {
				Dispose() {
					throw new Error('close failed')
				},
			}
		}

		const errors = []
		assert.equal(
			access.getFile(file, (error) => errors.push(error)),
			undefined,
		)

		assert.equal(errors.length, 1)
		assert.equal(errors[0].message, failure === 'dispose' ? 'close failed' : failure + ' failed')
		assert.deepEqual(state.writes, [])
	}
})

test('Windows folder references synchronously create missing directories and preserve existing ones', () => {
	const { access, state } = fixture()
	assert.equal(access.getFolder(parent).path, parent)
	assert.equal(state.entries.get(parent).kind, 'directory')
	const existing = state.entries.get(parent)
	assert.equal(access.getFolder(parent).path, parent)
	assert.equal(state.entries.get(parent), existing)
	assert.equal(access.getExistingFolder(parent).path, parent)
	assert.deepEqual(state.winrt, [])
})

test('Windows folder creation reports failure or a colliding file without fabricating a folder', () => {
	for (const failure of ['collision', 'native']) {
		const { access, state, io } = fixture()
		if (failure === 'collision') {
			state.entries.set(parent, { kind: 'file', content: 'keep me' })
		} else {
			io.Directory.CreateDirectory = () => {
				throw new Error('create failed')
			}
		}

		const errors = []
		assert.equal(
			access.getFolder(parent, (error) => errors.push(error)),
			undefined,
		)

		assert.equal(errors.length, 1)
		if (failure === 'collision') {
			assert.equal(state.entries.get(parent).content, 'keep me')
		} else {
			assert.equal(state.entries.has(parent), false)
		}

		assert.deepEqual(state.writes, [])
	}
})

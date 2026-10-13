import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'typescript'

const defaultRoot = fileURLToPath(new URL('../..', import.meta.url))

// An object driver, not an AppKit runtime or image-codec qualification.
export function createDriver({ mediaRoot = defaultRoot, filesRoot, ...options } = {}) {
	const events = []
	const disk = new Map()
	const panels = []
	const selections = []
	let sequence = 0
	let writes = 0
	const source = (name = 'photo.png', properties = {}) => {
		const url = {
			lastPathComponent: name,
			path: `/originals/${name}`,
			active: false,
			startAccessingSecurityScopedResource() {
				events.push(['start', this.path])
				this.active = properties.scoped !== false
				return this.active
			},
			stopAccessingSecurityScopedResource() {
				events.push(['stop', this.path])
				assert.equal(this.active, true)
				this.active = false
			},
		}

		disk.set(url.path, { width: 1200, height: 800, ...properties })
		return url
	}

	const bytes = (width, height) => ({
		width,
		height,
		length: 12,
		base64EncodedStringWithOptions(value) {
			assert.equal(value, 0)
			if (options.base64Failure) {
				throw new Error('base64 failure')
			}

			return Buffer.from(`JPEG:${width}x${height}`).toString('base64')
		},
		isEqualToData(other) {
			return this === other
		},
		writeToFileAtomically(uri, atomic) {
			assert.equal(atomic, true)
			assert.match(uri, /^\/temp\/octane-image-\d+\.jpg$/)
			assert.equal(disk.has(uri), false, 'never overwrite an existing file')
			events.push(['write', uri])
			writes++
			disk.set(uri, this)
			if (options.writeFailure === writes) {
				return false
			}

			if (options.writeThrow === writes) {
				throw new Error('write threw')
			}

			return true
		},
	})

	const host = {
		NSModalResponseOK: 7,
		NSBitmapImageFileTypeJPEG: 3,
		NSImageCompressionFactor: 'quality',
		NSOpenPanel: {
			openPanel() {
				const selection = selections.shift() ?? { cancel: true, urls: [] }
				const panel = {
					URL: selection.urls?.[0],
					URLs: {
						count: selection.urls?.length ?? 0,
						objectAtIndex: (index) => selection.urls[index],
					},
					runModal: () => (selection.cancel ? 0 : 7),
				}

				panels.push(panel)
				return panel
			},
		},
		NSUUID: { UUID: () => ({ UUIDString: String(++sequence) }) },
		NSFileManager: {
			defaultManager: {
				temporaryDirectory: {
					URLByAppendingPathComponent: (filename) => ({ path: `/temp/${filename}` }),
				},
				fileExistsAtPath: (uri) => disk.has(uri),
				removeItemAtPathError(uri) {
					events.push(['remove', uri])
					assert.match(uri, /^\/temp\/octane-image-\d+\.jpg$/)
					if (options.cleanupFailure) {
						return false
					}

					return disk.delete(uri)
				},
			},
		},
		NSData: {
			dataWithContentsOfURL(url) {
				events.push(['read-source', url.path])
				const data = disk.get(url.path)
				assert.equal(url.active, data.scoped !== false)
				return data.unreadable ? null : data
			},
			dataWithContentsOfFile(uri) {
				events.push(['read-output', uri])
				return options.readFailure ? null : disk.get(uri)
			},
		},
		NSBitmapImageRep: {
			imageTypes: ['public.png', 'public.jpeg', 'public.heic'],
			imageRepWithData(data) {
				if (data.invalid) {
					return null
				}

				return {
					pixelsWide: data.width,
					pixelsHigh: data.height,
					representationUsingTypeProperties(type, properties) {
						assert.equal(type, 3)
						assert.equal(properties.quality, 0.85)
						if (data.conversionThrow) {
							throw new Error('conversion threw')
						}

						if (data.conversionFailure) {
							return null
						}

						return bytes(data.width, data.height)
					},
				}
			},
		},
	}

	const context = vm.createContext(host)
	const cache = new Map()
	const load = (path) => {
		if (cache.has(path)) {
			return cache.get(path)
		}

		const exports = {}
		cache.set(path, exports)
		const source = readFileSync(path, 'utf8')
		const code = ts.transpile(source, {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2022,
		})

		vm.runInContext(`(function(exports, require) { ${code}\n})`, context, { filename: path })(
			exports,
			(name) => {
				assert.ok(name.startsWith('.'), 'macOS public import needs no mobile runtime')
				// The unrelated FileInput UI export needs a renderer; this suite exercises services.
				if (name === './FileInput.macos.tsrx') {
					readFileSync(resolve(dirname(path), name))
					return {
						FileInput() {
							throw new Error('FileInput UI is outside the service driver')
						},
					}
				}

				return load(resolve(dirname(path), `${name}.ts`))
			},
		)

		return exports
	}

	const publicEntry = (root) => {
		const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
		const entry = manifest.exports['.'].macos
		return load(resolve(root, typeof entry === 'string' ? entry : entry.default))
	}

	const media = publicEntry(mediaRoot).media
	const files = publicEntry(filesRoot ?? resolve(defaultRoot, '../files')).files
	return { media, files, source, selections, panels, events, disk, host }
}

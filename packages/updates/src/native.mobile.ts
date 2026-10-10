import { File, Folder, Http, Utils, isIOS, path } from '@nativescript/core'
import type { Environment } from './client'

export function nativeEnvironment(): Environment {
	const root = isIOS
		? path.join(NSHomeDirectory(), 'Library', 'Application Support', 'xplat-ota')
		: path.join(Utils.android.getApplicationContext().getFilesDir().getAbsolutePath(), 'xplat-ota')

	const rawVersion = isIOS
		? (NSBundle.mainBundle.objectForInfoDictionaryKey('CFBundleShortVersionString') as string)
		: Utils.android
				.getApplicationContext()
				.getPackageManager()
				.getPackageInfo(Utils.android.getApplicationContext().getPackageName(), 0).versionName

	const nativeVersion = /^\d+(?:\.\d+){0,2}$/.test(rawVersion)
		? rawVersion.split('.').map(Number).concat([0, 0]).slice(0, 3).join('.')
		: rawVersion

	const fail = (error: unknown) => {
		throw error
	}

	const location = (name: string) => path.join(root, name)
	const remove = (name: string) => {
		const file = location(name)
		if (isIOS) {
			if (
				NSFileManager.defaultManager.fileExistsAtPath(file) &&
				!NSFileManager.defaultManager.removeItemAtPathError(file)
			) {
				throw new Error(`Cannot remove OTA file ${name}`)
			}
		} else {
			const erase = (entry: java.io.File) => {
				if (entry.isDirectory()) {
					const children = entry.listFiles()
					for (let i = 0; children && i < children.length; i++) {
						erase(children[i])
					}
				}

				if (entry.exists() && !entry.delete()) {
					throw new Error(`Cannot remove OTA file ${name}`)
				}
			}

			erase(new java.io.File(file))
		}
	}

	return {
		platform: isIOS ? 'ios' : 'android',
		nativeVersion,
		releaseBuild:
			!File.exists(location('mode.txt')) ||
			File.fromPath(location('mode.txt')).readTextSync(fail) === 'release',
		storage: {
			exists: (name) => File.exists(location(name)) || Folder.exists(location(name)),
			read: (name) => File.fromPath(location(name)).readTextSync(fail),
			remove,
			write(name, value) {
				const file = location(name)
				Folder.fromPath(file.slice(0, file.lastIndexOf('/')))
				if (typeof value === 'string') {
					File.fromPath(file).writeTextSync(value, fail)
					return
				}

				if (isIOS) {
					const data = NSData.dataWithBytesLength(
						value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength),
						value.byteLength,
					)

					if (!data.writeToFileAtomically(file, true)) {
						throw new Error(`Cannot write OTA file ${name}`)
					}
				} else {
					const bytes = (Array as any).create('byte', value.length)
					for (let i = 0; i < value.length; i++) {
						bytes[i] = value[i] > 127 ? value[i] - 256 : value[i]
					}

					File.fromPath(file).writeSync(bytes, fail)
				}
			},
			move(from, to) {
				if (isIOS) {
					if (
						!NSFileManager.defaultManager.moveItemAtPathToPathError(location(from), location(to))
					) {
						throw new Error('Cannot commit OTA staging directory')
					}
				} else if (!new java.io.File(location(from)).renameTo(new java.io.File(location(to)))) {
					throw new Error('Cannot commit OTA staging directory')
				}
			},
		},
		async request(url, timeout) {
			const response = await Http.request({
				url,
				method: 'GET',
				timeout,
				dontFollowRedirects: true,
			})

			return {
				status: response.statusCode,
				bytes: new Uint8Array(response.content?.toArrayBuffer() ?? new ArrayBuffer(0)),
			}
		},
	}
}

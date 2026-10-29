import { existsSync } from 'node:fs'
import { glob, readFile, realpath } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'
import { parse } from 'yaml'
import { configValue } from './native-config.ts'
/** Native lock records omit cache paths and derived origin hashes, retaining resolved identities. */
export async function nativeResolutions(
	root: string,
	platforms: readonly string[],
	nativeConfig: Record<string, any>,
	add: (id: string, value: unknown) => void,
	tree: (
		base: string,
		path: string,
		prefix: string,
		reason: string,
		critical?: boolean,
		declarationsOnly?: boolean,
	) => Promise<void>,
): Promise<void> {
	const nativeRoot = resolve(
		root,
		typeof nativeConfig.buildPath === 'string' ? nativeConfig.buildPath : 'platforms',
	)
	if (platforms.includes('ios')) {
		const ios = join(nativeRoot, 'ios'),
			podfile = join(ios, 'Podfile.lock')
		if (existsSync(podfile)) {
			const value = parse(await readFile(podfile, 'utf8'))
			if (!value || typeof value !== 'object' || !Array.isArray(value.PODS)) {
				throw new Error('Invalid native Podfile.lock')
			}
			delete value['PODFILE CHECKSUM']
			for (const [name, source] of Object.entries(value['EXTERNAL SOURCES'] ?? {}) as [
				string,
				Record<string, unknown>,
			][]) {
				const path = source[':path']
				if (typeof path === 'string') {
					const directory = await realpath(resolve(ios, path))
					await tree(directory, directory, `native-pod/${name}/`, 'local native Pod sources')
					source[':path'] = '<local-native-source>'
				}
				const spec = source[':podspec']
				if (typeof spec === 'string' && !/^https?:/.test(spec)) {
					source[':podspec'] = spec.replaceAll(root, '<project>')
				}
			}
			add('native-resolution:ios/Podfile.lock', configValue(value, root, root))
		}
		if (existsSync(ios)) {
			for await (const file of glob('**/Package.resolved', {
				cwd: ios,
				exclude: ['**/Pods/**', '**/build/**', '**/DerivedData/**'],
			})) {
				const value = JSON.parse(await readFile(join(ios, file), 'utf8'))
				const pins = value.pins ?? value.object?.pins
				if (
					![1, 2, 3].includes(value.version) ||
					!Array.isArray(pins) ||
					pins.some(
						(pin) =>
							!pin ||
							typeof pin !== 'object' ||
							!pin.state ||
							(typeof pin.state.revision !== 'string' && typeof pin.state.version !== 'string'),
					)
				) {
					throw new Error('Unsupported native Swift package resolution metadata')
				}
				const logical = file
					.split(sep)
					.join('/')
					.replace(/[^/]+\.(xcworkspace|xcodeproj)(?=\/)/g, 'project.$1')
				const identity = (pin: Record<string, any>): string =>
					pin.identity ?? pin.package ?? pin.repositoryURL ?? pin.location ?? ''
				if (
					pins.some((pin) => typeof identity(pin) !== 'string' || !identity(pin)) ||
					new Set(pins.map(identity)).size !== pins.length
				) {
					throw new Error('Ambiguous native Swift package identities')
				}
				add(
					'native-resolution:ios/' + logical,
					configValue(
						{
							version: value.version,
							pins: [...pins].sort((a, b) =>
								identity(a) < identity(b) ? -1 : identity(a) > identity(b) ? 1 : 0,
							),
						},
						root,
						resolve(root, nativeConfig.appResourcesPath ?? 'App_Resources'),
					),
				)
			}
		}
	}
	if (platforms.includes('android')) {
		const android = join(nativeRoot, 'android')
		if (existsSync(android)) {
			for await (const file of glob(
				['**/gradle.lockfile', '**/dependency-locks/*.lockfile', '**/libs.versions.toml'],
				{ cwd: android, exclude: ['**/build/**', '**/.gradle/**'] },
			)) {
				add(
					'native-resolution:android/' + file.split(sep).join('/'),
					(await readFile(join(android, file), 'utf8')).replaceAll(root, '<project>'),
				)
			}
		}
	}
}

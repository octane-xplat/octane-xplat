import { mkdir, readFile, realpath, symlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
export async function linkDependencies(root, repo) {
	const platform = process.env.XPLAT_CRYPTO_PLATFORM_ROOT ?? join(repo, 'packages/platform')
	const lib = process.env.XPLAT_IMAGE_LIB_ROOT ?? join(repo, 'packages/lib')
	async function link(source, destination) {
		await mkdir(dirname(destination), { recursive: true })
		try {
			await symlink(await realpath(source), destination, 'dir')
		} catch (error) {
			if (error.code !== 'EEXIST') {
				throw error
			}
		}
	}
	for (const [name, source] of [
		['@nativescript/core', join(repo, 'apps/mobile/node_modules/@nativescript/core')],
		['@octane-xplat/lib', lib],
		['@octane-xplat/platform', platform],
	]) {
		await link(source, join(root, 'node_modules', name))
	}
	if (process.env.XPLAT_CRYPTO_PLATFORM_ROOT) {
		const manifest = JSON.parse(await readFile(join(platform, 'package.json'), 'utf8'))
		for (const name of Object.keys(manifest.dependencies ?? {})) {
			await link(
				name === '@octane-xplat/lib'
					? lib
					: name.startsWith('@octane-xplat/')
						? join(repo, 'packages', name.slice('@octane-xplat/'.length))
						: join(repo, 'packages/platform/node_modules', name),
				join(platform, 'node_modules', name),
			)
		}
	}
}

const fs = require('node:fs')
const path = require('node:path')

const checkout = path.join(__dirname, 'nativescript-mason')
const packageName = '@octane-xplat/nativescript-masonkit'

// The fork publishes the compiled package: JS, typings, and the platforms/
// native binaries. Build it in the checkout with
// `pnpm exec nx run nativescript-masonkit:build.all`; its TS source is not
// consumable by this workspace.
const dist = path.join(checkout, 'dist', 'packages', 'nativescript-masonkit')

function distManifest() {
	const manifest = path.join(dist, 'package.json')
	if (!fs.existsSync(manifest)) {
		throw new Error(
			`${manifest} is missing — build the fork first: ` +
				`pnpm exec nx run nativescript-masonkit:build.all in ${checkout}`,
		)
	}

	return JSON.parse(fs.readFileSync(manifest, 'utf8'))
}

module.exports = {
	hooks: {
		readPackage(pkg) {
			for (const field of ['dependencies', 'devDependencies', 'optionalDependencies']) {
				if (!pkg[field]?.[packageName]) {
					continue
				}

				if (distManifest().name !== packageName) {
					throw new Error(`Expected ${packageName} in ${dist}`)
				}

				pkg[field][packageName] = `link:${dist}`
			}

			return pkg
		},
	},
}

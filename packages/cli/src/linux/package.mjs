import {
	chmodSync,
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	renameSync,
	rmSync,
	writeFileSync,
} from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inspectLinuxPackageConfig } from './config.mjs'

const hostRoot = fileURLToPath(new URL('./host/', import.meta.url))
const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`
const desktopString = (value) => value.replaceAll('\\', '\\\\').replaceAll('\t', '\\t')

/** Build a relocatable GJS/WebKitGTK app and tar archive from a Linux target. */
export async function packageLinux(appRoot) {
	const config = inspectLinuxPackageConfig(appRoot)
	if (config.issues.length) {
		throw new Error(config.issues.join('\n'))
	}
	const require = createRequire(join(resolve(appRoot), 'package.json'))
	let vite
	try {
		const manifest = require.resolve('vite/package.json')
		vite = join(dirname(manifest), JSON.parse(readFileSync(manifest, 'utf8')).bin.vite)
	} catch {
		throw new Error('Declare vite in this app and run pnpm install before building Linux.')
	}

	const output = join(appRoot, 'dist', 'linux')
	mkdirSync(output, { recursive: true })
	const staging = mkdtempSync(join(output, '.package-'))
	const appDir = join(staging, config.executableName)
	const archiveName = `${config.executableName}-${config.version}.tar.gz`
	try {
		mkdirSync(appDir)
		execFileSync(
			process.execPath,
			[
				vite,
				'build',
				'--config',
				config.viteConfig,
				'--base',
				'/',
				'--outDir',
				join(appDir, 'bundle'),
			],
			{ cwd: appRoot, stdio: 'inherit' },
		)
		if (!existsSync(join(appDir, 'bundle', 'index.html'))) {
			throw new Error(
				'Linux packaging requires a static Vite frontend with index.html (not SSR or library output).',
			)
		}

		cpSync(hostRoot, join(appDir, 'host'), { recursive: true })
		writeFileSync(
			join(appDir, 'app.json'),
			JSON.stringify(
				{
					applicationId: config.applicationId,
					productName: config.productName,
					scheme: config.scheme,
				},
				null,
				2,
			) + '\n',
		)
		writeFileSync(
			join(appDir, config.executableName),
			`#!/bin/sh
set -eu
APP_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
command -v gjs >/dev/null 2>&1 || { echo 'Install GJS, GTK4, libadwaita, WebKitGTK 6.0 and libsecret; see README.txt.' >&2; exit 1; }
exec gjs "$APP_DIR/host/gjs-host.js" --bundle "$APP_DIR/bundle" "$@"
`,
		)

		chmodSync(join(appDir, config.executableName), 0o755)
		writeFileSync(
			join(appDir, `${config.applicationId}.desktop`),
			`[Desktop Entry]
Type=Application
Name=${desktopString(config.productName)}
Exec=${config.executableName} %u
Icon=application-x-executable
Terminal=false
Categories=Utility;
MimeType=x-scheme-handler/${config.scheme};
StartupWMClass=${config.applicationId}
DBusActivatable=false
`,
		)

		// Installation generates absolute paths at the destination; no build paths
		// are embedded in the distributable desktop entry or executable.
		writeFileSync(
			join(appDir, 'install.sh'),
			`#!/bin/sh
set -eu
APP_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
DATA_DIR="\${XDG_DATA_HOME:-$HOME/.local/share}"
DEST="$DATA_DIR/${config.applicationId}"
mkdir -p "$DEST" "$DATA_DIR/applications"
if [ "$APP_DIR" != "$DEST" ]; then cp -R "$APP_DIR/." "$DEST/"; fi
python3 - "$DEST" "$DATA_DIR/applications/${config.applicationId}.desktop" <<'PY'
import pathlib, sys
root = pathlib.Path(sys.argv[1])
entry = (root / ${quote(`${config.applicationId}.desktop`)}).read_text()
# Desktop Exec quoting has two layers: string escapes, then argument escapes.
executable = str(root / ${quote(config.executableName)})
executable = executable.replace('\\\\', '\\\\\\\\\\\\\\\\').replace('"', '\\\\\\\\"').replace('\\x60', '\\\\\\\\x60').replace('$', '\\\\\\\\$').replace('%', '%%')
entry = entry.replace(${quote(`Exec=${config.executableName} %u`)}, 'Exec="' + executable + '" %u')
pathlib.Path(sys.argv[2]).write_text(entry)
PY
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$DATA_DIR/applications" || true
printf 'Installed to %s\\n' "$DEST"
`,
		)

		chmodSync(join(appDir, 'install.sh'), 0o755)
		writeFileSync(
			join(appDir, 'README.txt'),
			`${config.productName} ${config.version}\nRun ./${config.executableName} from any directory, or ./install.sh to copy into XDG_DATA_HOME and install the desktop entry.\nRequires Python 3 for installation; GJS, GTK4 (4.10+), libadwaita, WebKitGTK 6.0, libsecret, a graphical session, and D-Bus for execution.\nUbuntu 24.04: sudo apt install gjs gir1.2-gtk-4.0 gir1.2-adw-1 gir1.2-webkit-6.0 gir1.2-secret-1 python3 desktop-file-utils xdg-utils\nSecret storage needs an unlocked Secret Service keyring. Notifications need a desktop notification service.\nRegister incoming links with: xdg-mime default ${config.applicationId}.desktop x-scheme-handler/${config.scheme}\nRemove the installed application directory and ${config.applicationId}.desktop from XDG_DATA_HOME/applications to uninstall.\n`,
		)
		execFileSync(
			'tar',
			['-czf', join(staging, archiveName), '-C', staging, config.executableName],
			{ stdio: 'inherit' },
		)
		const destination = join(output, config.executableName)
		const backup = join(staging, 'previous')
		if (existsSync(destination)) {
			renameSync(destination, backup)
		}
		try {
			renameSync(appDir, destination)
		} catch (error) {
			if (existsSync(backup)) {
				renameSync(backup, destination)
			}
			throw error
		}

		renameSync(join(staging, archiveName), join(output, archiveName))
		console.log(`[linux-package] ${destination}\n[linux-package] ${join(output, archiveName)}`)
		return { appDir: destination, archive: join(output, archiveName) }
	} finally {
		rmSync(staging, { recursive: true, force: true })
	}
}

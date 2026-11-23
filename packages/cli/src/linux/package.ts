// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'

import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { gtkRuntimeBuildMarker } from '../linux-gtk/native-gi-projection.ts'
import { inspectLinuxPackageConfig } from './config.ts'
import {
  stageGtkRuntime,
  stageInstalledGtkRuntime,
  writeGtkRuntimeLauncher,
} from './gtk-runtime.ts'

const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`
const desktopString = (value) => value.replaceAll('\\', '\\\\').replaceAll('\t', '\\t')

/** The application ESM entry. linuxGtk emits `app.js` by
 *  default; accept any single top-level bundle so an app may rename it. */
const findGtkBundle = (appDir) => {
  if (existsSync(join(appDir, 'app.js'))) {
    return 'app.js'
  }

  const entries = readdirSync(appDir).filter((entry) => /\.(js|mjs)$/.test(entry))

  if (entries.length !== 1) {
    throw new Error(
      'Linux GTK packaging expected exactly one ESM bundle (app.js by default); ' +
        'keep the Vite lib build to a single-file output.',
    )
  }

  return entries[0]
}

/** XDG install surface for native GTK apps: a `.desktop` entry,
 *  `install.sh` (replaces any previous install cleanly, then writes the
 *  absolute Exec path), and `uninstall.sh` (removes only the installed app
 *  directory and desktop entry — user settings under XDG_CONFIG_HOME stay).
 *  GTK currently registers no URI scheme. */
function writeDesktopInstall(config, appDir, { scheme, execArgs }) {
  const execLine = `Exec=${config.executableName}${execArgs}`

  writeFileSync(
    join(appDir, `${config.applicationId}.desktop`),
    `[Desktop Entry]
Type=Application
Name=${desktopString(config.productName)}
${execLine}
Icon=application-x-executable
Terminal=false
Categories=Utility;
${scheme ? `MimeType=x-scheme-handler/${scheme};\n` : ''}StartupWMClass=${config.applicationId}
DBusActivatable=false
`,
  )

  // Installation generates absolute paths at the destination; no build paths
  // are embedded in the distributable desktop entry or executable. A reinstall
  // empties the destination first so files removed between versions do not
  // linger; XDG_CONFIG_HOME settings are never touched.
  writeFileSync(
    join(appDir, 'install.sh'),
    `#!/bin/sh
set -eu
APP_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
DATA_DIR="\${XDG_DATA_HOME:-$HOME/.local/share}"
DEST="$DATA_DIR/${config.applicationId}"
mkdir -p "$DATA_DIR/applications"
if [ "$APP_DIR" != "$DEST" ]; then
  rm -rf -- "$DEST"
  mkdir -p "$DEST"
  cp -R "$APP_DIR/." "$DEST/"
fi
python3 - "$DEST" "$DATA_DIR/applications/${config.applicationId}.desktop" <<'PY'
import pathlib, sys
root = pathlib.Path(sys.argv[1])
entry = (root / ${quote(`${config.applicationId}.desktop`)}).read_text()
# Desktop Exec quoting has two layers: string escapes, then argument escapes.
executable = str(root / ${quote(config.executableName)})
executable = executable.replace('\\\\', '\\\\\\\\\\\\\\\\').replace('"', '\\\\\\\\"').replace('\\x60', '\\\\\\\\x60').replace('$', '\\\\\\\\$').replace('%', '%%')
entry = entry.replace(${quote(execLine)}, 'Exec="' + executable + '"${execArgs}')
pathlib.Path(sys.argv[2]).write_text(entry)
PY
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$DATA_DIR/applications" || true
printf 'Installed to %s\\n' "$DEST"
`,
  )

  chmodSync(join(appDir, 'install.sh'), 0o755)

  writeFileSync(
    join(appDir, 'uninstall.sh'),
    `#!/bin/sh
set -eu
DATA_DIR="\${XDG_DATA_HOME:-$HOME/.local/share}"
DEST="$DATA_DIR/${config.applicationId}"
rm -rf -- "$DEST"
rm -f -- "$DATA_DIR/applications/${config.applicationId}.desktop"
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$DATA_DIR/applications" || true
printf 'Removed %s and its desktop entry.\\n' "$DEST"
printf 'Settings kept under %s\\n' "\${XDG_CONFIG_HOME:-$HOME/.config}/${config.applicationId}"
`,
  )

  chmodSync(join(appDir, 'uninstall.sh'), 0o755)
}

/** Bundle one GTK entry and its launcher in the native-owned staging directory. */
function buildGtkApp(config, vite, appRoot, appDir, gtkRuntimeRoot) {
  const payload = join(dirname(appDir), '.gtk-runtime')
  let architecture
  let schemaPath
  if (gtkRuntimeRoot) {
    architecture = stageGtkRuntime(gtkRuntimeRoot, payload)
    schemaPath = join(payload, 'gi.json')
  } else {
    stageInstalledGtkRuntime(appRoot, payload)
    architecture = 'universal'
    schemaPath = join(payload, 'x86_64/gi.json')
  }
  execFileSync(
    process.execPath,
    [vite, 'build', '--config', config.viteConfig, '--outDir', appDir],
    {
      cwd: appRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        XPLAT_GTK_RUNTIME_SCHEMA: schemaPath,
      },
    },
  )

  const bundle = findGtkBundle(appDir)

  const marker = join(appDir, gtkRuntimeBuildMarker)
  if (!existsSync(marker) || readFileSync(marker, 'utf8') !== '1\n') {
    throw new Error(
      'Use the updated linuxGtk Vite preset to build with the NativeScript runtime.',
    )
  }
  rmSync(marker)
  renameSync(payload, join(appDir, 'runtime'))
  writeGtkRuntimeLauncher(appDir, config.executableName, bundle, architecture)
  writeFileSync(
    join(appDir, 'app.json'),
    JSON.stringify(
      {
        applicationId: config.applicationId,
        productName: config.productName,
        version: config.version,
      },
      null,
      2,
    ) + '\n',
  )

  writeDesktopInstall(config, appDir, { scheme: null, execArgs: '' })

  const instructions = `Run ./${config.executableName} from any directory. The bundled NativeScript runtime supports Linux ${architecture === 'universal' ? 'x86_64 and aarch64' : architecture}.\nOn Ubuntu 24.04, install libgtk-4-1 and libjson-glib-1.0-0 and use a graphical session.\nInstall libwebkitgtk-6.0-4 for WebView, libsoup-3.0-0 for HTTP images, and librsvg2-common for SVG images.\n`
  writeFileSync(
    join(appDir, 'README.txt'),
    `${config.productName} ${config.version}\n${instructions}`,
  )
  return architecture
}

export async function packageLinux(
  appRoot: string,
  { stagingRoot, publish = true, gtkRuntimeRoot }: { stagingRoot?: string; publish?: boolean; gtkRuntimeRoot?: string } = {},
) {
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
    throw new Error('Declare vite in this app and run bun install before building Linux.')
  }

  const output = join(appRoot, 'dist', 'linux')

  mkdirSync(output, { recursive: true })

  const staging = stagingRoot ?? mkdtempSync(join(output, '.package-'))
  let preserveStaging = false
  const appDir = join(staging, config.executableName)
  const archiveName = `${config.executableName}-${config.version}.tar.gz`

  try {
    let gtkRuntimeArchitecture
    mkdirSync(appDir)
    gtkRuntimeArchitecture = buildGtkApp(config, vite, appRoot, appDir, gtkRuntimeRoot)

    execFileSync(
      'tar',
      ['--no-xattrs', '-czf', join(staging, archiveName), '-C', staging, config.executableName],
      { stdio: 'inherit', env: { ...process.env, COPYFILE_DISABLE: '1' } },
    )

    if (!publish) {
      preserveStaging = true
      return {
        version: 1,
        runtime: config.runtime,
        gtkRuntimeArchitecture,
        executableName: config.executableName,
        packageVersion: config.version,
        appDir,
        archive: join(staging, archiveName),
      }
    }

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
    if (!preserveStaging) {
      rmSync(staging, { recursive: true, force: true })
    }
  }
}

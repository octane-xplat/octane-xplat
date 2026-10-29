import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const host = process.env.SHORTCUTS_GTK_HOST
const vm = process.env.SHORTCUTS_GTK_VM ?? 'octane-linux'
assert.ok(host, 'Set SHORTCUTS_GTK_HOST to a Linux host or an OrbStack Mac host')
const q = (value) => "'" + value.replaceAll("'", "'\\''") + "'"
const prefix = process.env.SHORTCUTS_GTK_VM ? `orb -m ${q(vm)} -w /tmp ` : ''
const run = (script, input) =>
	execFileSync(
		'ssh',
		['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', host, prefix + 'sh -c ' + q(script)],
		{ input, encoding: 'utf8', timeout: 30_000, maxBuffer: 1024 * 1024 },
	)
const temporary = mkdtempSync(join(tmpdir(), 'xplat-shortcuts-gtk-'))
let remote
try {
	await build({
		configFile: false,
		logLevel: 'warn',
		build: {
			outDir: temporary,
			emptyOutDir: false,
			lib: {
				entry: fileURLToPath(new URL('./fixtures/input.gtk.js', import.meta.url)),
				formats: ['es'],
				fileName: () => 'input.js',
			},
			rollupOptions: { external: [/^gi:/, 'system'] },
			minify: false,
		},
	})
	remote = run('mktemp -d /tmp/xplat-shortcuts-XXXXXX').trim()
	assert.match(remote, /^\/tmp\/xplat-shortcuts-[A-Za-z0-9]+$/)
	run(`cat > ${q(remote + '/input.js')}`, readFileSync(join(temporary, 'input.js')))
	const driver = `
set -eu
cd ${q(remote)}
gjs -m input.js > output.log 2>&1 &
app_pid=$!
trap 'kill "$app_pid" 2>/dev/null || true' EXIT
window=$(timeout 10 xdotool search --sync --name '^XplatShortcuts$' | head -1)
xdotool windowfocus --sync "$window"
xdotool key --clearmodifiers --delay 80 ctrl+k g i F2 ctrl+shift+x
attempt=0
while ! grep -q RECORDING-DONE output.log; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 100 ]; then cat output.log; exit 1; fi
  sleep 0.05
done
xdotool key --clearmodifiers F12
result=0
wait "$app_pid" || result=$?
cat output.log
exit "$result"
`
	run(`cat > ${q(remote + '/driver.sh')}`, driver)
	console.log(run(`xvfb-run -a sh ${q(remote + '/driver.sh')}`))
} finally {
	if (remote && /^\/tmp\/xplat-shortcuts-[A-Za-z0-9]+$/.test(remote)) {
		run(`rm -rf ${q(remote)}`)
	}
	rmSync(temporary, { recursive: true, force: true })
}

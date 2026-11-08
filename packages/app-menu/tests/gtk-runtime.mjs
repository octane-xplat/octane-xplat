import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const host = process.env.APP_MENU_GTK_HOST
const vm = process.env.APP_MENU_GTK_VM ?? 'octane-linux'
assert.ok(host, 'Set APP_MENU_GTK_HOST to a Linux host or an OrbStack Mac host')
const q = (value) => "'" + value.replaceAll("'", "'\\''") + "'"
const prefix = process.env.APP_MENU_GTK_VM ? `orb -m ${q(vm)} -w /tmp ` : ''
const run = (script, input) =>
  execFileSync(
    'ssh',
    ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', host, prefix + 'sh -c ' + q(script)],
    { input, encoding: 'utf8', timeout: 60_000, maxBuffer: 1024 * 1024 },
  )

const temporary = mkdtempSync(join(tmpdir(), 'xplat-app-menu-gtk-'))
let remote
try {
  await build({
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir: temporary,
      emptyOutDir: false,
      lib: {
        entry: fileURLToPath(new URL('./fixtures/menu.gtk.js', import.meta.url)),
        formats: ['es'],
        fileName: () => 'menu.js',
      },
      rollupOptions: { external: [/^gi:/, 'system'] },
      minify: false,
    },
  })

  remote = run('mktemp -d /tmp/xplat-app-menu-XXXXXX').trim()
  assert.match(remote, /^\/tmp\/xplat-app-menu-[A-Za-z0-9]+$/)
  run(`cat > ${q(remote + '/menu.js')}`, readFileSync(join(temporary, 'menu.js')))
  const driver = `
set -u
cd ${q(remote)}
echo "DRIVER gjs=$(command -v gjs) $(gjs --version 2>&1 | head -1)"
gjs -m menu.js > output.log 2>&1 &
app_pid=$!
trap 'kill "$app_pid" 2>/dev/null || true' EXIT
window=$(timeout 15 xdotool search --sync --name '^XplatAppMenu$' | head -1)
if [ -z "$window" ]; then
  echo 'DRIVER-FAIL window not found'
  ps -p "$app_pid" -o stat= 2>/dev/null || echo 'gjs exited'
  cat output.log
  exit 1
fi
xdotool windowfocus --sync "$window"

wait_marker() {
  attempt=0
  while ! grep -q "$1" output.log; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge "$2" ]; then
      echo "DRIVER-FAIL waiting for $1"
      if ! ps -p "$app_pid" > /dev/null 2>&1; then echo 'gjs exited early'; fi
      cat output.log
      exit 1
    fi
    sleep 0.1
  done
}
wait_marker APPMENU_READY 150

# Real key input: accels, disabled accel, controlled checkbox, nested submenu accel.
xdotool key --clearmodifiers --delay 120 ctrl+n ctrl+d ctrl+shift+s ctrl+alt+k
wait_marker 'FIRED docA=1' 150

# Menubar keyboard navigation through real UI — try sequences until New fires.
last=$(grep -c 'FIRED new=' output.log || true)
nav='none'
for seq in 'F10 Return' 'F10 Down Return' 'F10 Right Down Return' 'F10 Down Down Return'; do
  # shellcheck disable=SC2086
  xdotool key --clearmodifiers --delay 150 $seq
  sleep 0.6
  now=$(grep -c 'FIRED new=' output.log || true)
  if [ "$now" -gt "$last" ]; then nav="$seq"; break; fi
done
if [ "$nav" = 'none' ]; then
  # F10 did not open the menubar — fall back to a real mouse click on the
  # 'File' menubar label, then the first item ('New') in the popover.
  xdotool mousemove --window "$window" 25 15 click 1
  sleep 0.7
  for y in 38 44 50 56 62 68; do
    xdotool mousemove --window "$window" 30 "$y" click 1
    sleep 0.4
    now=$(grep -c 'FIRED new=' output.log || true)
    if [ "$now" -gt "$last" ]; then nav="mouse:y=$y"; break; fi
  done
fi
echo "MENUBAR-NAV $nav"

wait_marker APPMENU_UPDATED 200
xdotool key --clearmodifiers --delay 120 ctrl+n ctrl+shift+n
wait_marker 'FIRED newWindow=1' 150

result=0
wait "$app_pid" || result=$?
cat output.log
echo "MENUBAR-NAV-RESULT $nav"
if ! grep -q APPMENU_GTK_OK output.log; then result=1; fi
exit "$result"
`

  run(`cat > ${q(remote + '/driver.sh')}`, driver)
  // GApplication registration needs a session bus that bare xvfb-run lacks.
  console.log(run(`xvfb-run -a dbus-run-session -- sh ${q(remote + '/driver.sh')}`))
} finally {
  if (remote && /^\/tmp\/xplat-app-menu-[A-Za-z0-9]+$/.test(remote)) {
    run(`rm -rf ${q(remote)}`)
  }

  rmSync(temporary, { recursive: true, force: true })
}

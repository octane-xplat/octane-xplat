// Build a real Octane app using installed CLI/platform tarballs, then verify
// the relocated archive on Linux. Requires GTK/WebKitGTK, Xvfb, keyring and
// notification-daemon; this never disables WebKit's sandbox.
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const [cliTarball, platformTarball] = process.argv.slice(2)
if (process.platform !== 'linux' || !cliTarball || !platformTarball) {
	throw new Error('Run on Linux: node verify-linux-consumer.mjs <cli.tgz> <platform.tgz>')
}

const root = mkdtempSync(join(tmpdir(), 'xplat-linux-consumer-'))
const app = join(root, 'app')
cpSync(join(here, 'fixtures/linux-app'), app, { recursive: true })
const manifestPath = join(app, 'package.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
manifest.devDependencies['@octane-xplat/cli'] = `file:${resolve(cliTarball)}`
manifest.dependencies['@octane-xplat/platform'] = `file:${resolve(platformTarball)}`
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
writeFileSync(
	join(app, 'pnpm-workspace.yaml'),
	'packages: [.]\noverrides:\n  esbuild: 0.27.7\nallowBuilds:\n  esbuild: true\n',
)
const run = (cmd, args, options = {}) =>
	execFileSync(cmd, args, { cwd: app, stdio: 'inherit', ...options })
run('pnpm', ['install'])
run('pnpm', ['exec', 'xplat', 'build', '--targets', 'linux'])
const relocated = join(root, 'relocated app')
mkdirSync(relocated)
run('tar', ['-xzf', join(app, 'dist/linux/linux-proof-1.0.0.tar.gz'), '-C', relocated])
const first = join(relocated, 'linux-proof')
const data = join(root, 'data with spaces $dollar %percent')
run('sh', [join(first, 'install.sh')], { env: { ...process.env, XDG_DATA_HOME: data } })
run('desktop-file-validate', [join(data, 'applications/org.octane.LinuxProof.desktop')])
const installed = join(data, 'org.octane.LinuxProof/linux-proof')
manifest.xplat.targets.linux.package.applicationId = 'org.octane.LinuxOther'
manifest.xplat.targets.linux.package.executableName = 'linux-other'
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
run('pnpm', ['exec', 'xplat', 'build', '--targets', 'linux'])
const other = join(app, 'dist/linux/linux-other/linux-other')
const configHome = join(root, 'config')
mkdirSync(configHome)
const driver = join(root, 'runtime-driver.mjs')
writeFileSync(
	driver,
	`
import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
const logs = []
const children = new Set()
function launch(executable, args) {
 const child = spawn(executable, args, { cwd: '/tmp', env: {...process.env, XPLAT_LOG_CONSOLE: '1'}, detached: true })
 children.add(child)
 let output = ''
 child.stdout.on('data', b => { output += b; process.stdout.write(b) })
 child.stderr.on('data', b => { output += b; process.stderr.write(b) })
 child.on('exit', () => children.delete(child))
 return { child, output: () => output }
}
async function wait(process, expected) {
 const until = Date.now() + 30000
 while (Date.now() < until) {
  const out = process.output()
  assert.ok(!/LINUX_PROOF_FAILED|CONSOLE JS ERROR/.test(out), out)
  if (out.includes(expected)) return
  if (process.child.exitCode !== null) throw new Error('Exited before ' + expected + ': ' + out)
  await new Promise(r => setTimeout(r, 100))
 }
 throw new Error('Timeout waiting for ' + expected + ': ' + process.output())
}
async function stop(p) {
 logs.push(p.output())
 if (p.child.exitCode === null) {
  process.kill(-p.child.pid, 'SIGTERM')
  await new Promise(r => p.child.once('exit', r))
 }
}
try {
 execFileSync('gnome-keyring-daemon', ['--unlock', '--components=secrets'], {input: 'xplat-fixture-keyring-password'})
 const notifications = spawn('/usr/lib/notification-daemon/notification-daemon', [], {stdio:'ignore'})
 await new Promise(r => setTimeout(r, 500))
 execFileSync('pnpm', ['exec', 'xplat', 'doctor'], {cwd:${JSON.stringify(app)},stdio:'inherit'})
 const selftest = launch(${JSON.stringify(installed)}, ['--self-test', 'linux-proof://cold-start/deep-link'])
 await wait(selftest, 'SELFTEST_RESULT {"checks":17,"failed":[]}')
 await new Promise(r => selftest.child.exitCode === null ? selftest.child.once('exit', r) : r())
 assert.equal(selftest.child.exitCode, 0)
 assert.ok(selftest.output().includes('LINUX_CONSUMER_MOUNTED'))
 assert.ok(selftest.output().includes('deepLinks.initialUrl="linux-proof://cold-start/deep-link"'))
 logs.push(selftest.output())
 const writer = launch(${JSON.stringify(installed)}, ['linux-proof://probe/write'])
 await wait(writer, 'LINUX_SECRET_WRITTEN')
 const isolated = launch(${JSON.stringify(other)}, ['linux-proof://probe/isolated'])
 await wait(isolated, 'LINUX_SECRET_ISOLATED')
 await stop(isolated)
 await stop(writer)
 const reader = launch(${JSON.stringify(installed)}, ['linux-proof://probe/read'])
 await wait(reader, 'LINUX_SECRET_PERSISTED')
 execFileSync(${JSON.stringify(installed)}, ['linux-proof://probe/second-instance'], {cwd:'/tmp'})
 await wait(reader, 'LINUX_INCOMING_LINK linux-proof://probe/second-instance')
 execFileSync('xdg-mime', ['default', 'org.octane.LinuxProof.desktop', 'x-scheme-handler/linux-proof'])
 assert.ok(readFileSync(${JSON.stringify(join(configHome, 'mimeapps.list'))}, 'utf8').includes('x-scheme-handler/linux-proof=org.octane.LinuxProof.desktop'))
 await stop(reader)
 notifications.kill()
 writeFileSync(${JSON.stringify(join(root, 'runtime.log'))}, logs.join('\\n'))
 console.log('LINUX_CONSUMER_PASS: packed CLI, Octane mount, relocation, installer, desktop entry and URI association, doctor, 17 bridge checks, persistent isolated storage, second-instance link')
} finally {
 for (const child of children) { try { process.kill(-child.pid, 'SIGTERM') } catch {} }
}
`,
)

run('xvfb-run', ['-a', 'dbus-run-session', '--', process.execPath, driver], {
	env: {
		...process.env,
		GSK_RENDERER: 'cairo',
		LIBGL_ALWAYS_SOFTWARE: '1',
		XDG_DATA_HOME: data,
		XDG_CONFIG_HOME: configHome,
	},
	timeout: 180000,
})

console.log(`Linux consumer evidence: ${root}`)

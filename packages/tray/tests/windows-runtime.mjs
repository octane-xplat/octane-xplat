// Windows runtime check for @octane-xplat/tray's windows leaf on the packaged
// NativeScript Windows host. Bundles src/index.windows.ts into a fixture app,
// registers and launches it as a packaged app in the interactive session, and
// verifies the full lifecycle: availability, NIM_ADD (real notification-area
// rect via Shell_NotifyIconGetRect), synthetic activation + menu events
// delivered through the real message queue, update, window helpers, NIM_DELETE.
//
// Env: TRAY_WINDOWS_HOST (ssh host with an interactive session) and
// TRAY_WINDOWS_RUNTIME (remote dir containing a copy of the packaged runtime,
// e.g. apps/windows/platforms/windows/windows/bin). The test keeps a staged
// runtime + registered package on the box; re-runs reuse it.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const host = process.env.TRAY_WINDOWS_HOST
const runtime = process.env.TRAY_WINDOWS_RUNTIME
assert.ok(host && runtime, 'Set TRAY_WINDOWS_HOST and TRAY_WINDOWS_RUNTIME')

const quote = (value) => "'" + value.replaceAll("'", "''") + "'"
const run = (script, timeout = 240_000) =>
	execFileSync(
		'ssh',
		[
			'-o',
			'BatchMode=yes',
			'-o',
			'ConnectTimeout=5',
			host,
			'powershell -NoProfile -EncodedCommand ' +
				Buffer.from(
					"$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'; [Console]::OutputEncoding=[Text.Encoding]::UTF8; " +
						script,
					'utf16le',
				).toString('base64'),
		],
		{ encoding: 'utf8', timeout, maxBuffer: 4 * 1024 * 1024 },
	)

const identity = 'org.xplat.trayprobe'
const id = Date.now().toString(36)
const remote = 'C:\\Users\\alecs\\xplat-trayprobe-runtime'
const logPath = 'C:\\Users\\alecs\\xplat-tray-selftest.txt'

const temporary = mkdtempSync(join(tmpdir(), 'xplat-tray-win-'))
try {
	// Bundle the fixture against the real leaf.
	await build({
		configFile: false,
		logLevel: 'warn',
		build: {
			outDir: temporary,
			emptyOutDir: false,
			lib: {
				entry: fileURLToPath(new URL('./fixtures/tray-app.windows.js', import.meta.url)),
				formats: ['es'],
				fileName: () => 'bundle.mjs',
			},
			minify: false,
		},
	})
	// Stage the runtime once; it is mutated in place per run.
	if (run(`Test-Path ${quote(remote + '\\windows.exe')}`).trim() !== 'True') {
		console.log('staging runtime (one-time robocopy)')
		run(
			`New-Item -ItemType Directory -Force ${quote(remote)} | Out-Null; & robocopy ${quote(runtime)} ${quote(remote)} /E /R:0 /W:0 /NFL /NDL /NJH /NJS /NP | Out-Null; exit 0`,
			600_000,
		)
	}
	const bundleLocal = join(temporary, 'bundle.mjs')
	execFileSync('scp', ['-q', bundleLocal, `${host}:${remote.replaceAll('\\', '/')}/app/bundle.mjs`], {
		timeout: 120_000,
	})
	run(`Set-Content ${quote(remote + '\\app\\package.json')} '{"main":"bundle.mjs"}'`)
	const manifest = remote + '\\AppxManifest.xml'
	run(
		`[xml]$xml=Get-Content ${quote(manifest)}; $xml.Package.Identity.Name=${quote(identity)}; if($xml.Package.Extensions){[void]$xml.Package.RemoveChild($xml.Package.Extensions)}; $xml.Save(${quote(manifest)})`,
	)

	// Package registration needs the interactive session: run it via an /it
	// task with a generous wait (session-1 powershell starts can stall).
	let pfn = run(
		`(Get-AppxPackage -Name ${quote(identity)} -ErrorAction SilentlyContinue).PackageFamilyName`,
	).trim()
	if (!pfn) {
		console.log('registering package via session-1 task (may take minutes)')
		const reg = remote + '\\register.ps1'
		const regLocal = join(temporary, 'register.ps1')
		writeFileSync(
			regLocal,
			`try { Add-AppxPackage -Register '${manifest}' -ForceUpdateFromAnyVersion -ErrorAction Stop; Set-Content '${remote}\\regdone' 'ok' } catch { Set-Content '${remote}\\regdone' ('fail ' + $_.ToString()) }\n`,
		)
		execFileSync('scp', ['-q', regLocal, `${host}:${remote.replaceAll('\\', '/')}/register.ps1`], {
			timeout: 60_000,
		})
		run(`[IO.File]::Delete(${quote(remote + '\\regdone')})`)
		run(
			`schtasks /create /tn XplatTrayReg /tr "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ${remote}\\\\register.ps1" /sc once /st 00:00 /it /f | Out-Null; schtasks /run /tn XplatTrayReg | Out-Null; $d=(Get-Date).AddSeconds(600); while(-not (Test-Path ${quote(remote + '\\regdone')})){ if((Get-Date) -gt $d){throw 'registration timed out'}; Start-Sleep -Seconds 2 }; schtasks /delete /tn XplatTrayReg /f | Out-Null; Get-Content ${quote(remote + '\\regdone')}`,
			660_000,
		)
		pfn = run(`(Get-AppxPackage -Name ${quote(identity)}).PackageFamilyName`).trim()
	}
	console.log('PFN ' + pfn)

	const output = run(
		`
$pfn=${quote(pfn)}
$log="$env:LOCALAPPDATA\\Packages\\$pfn\\LocalState\\console.log"
Get-Process windows -ErrorAction SilentlyContinue | Where-Object {$_.Path -eq ${quote(remote + '\\windows.exe')}} | Stop-Process -Force
[IO.File]::Delete($log)
[IO.File]::Delete(${quote(logPath)})
schtasks /create /tn XplatTrayApp /tr ('explorer.exe shell:AppsFolder\\' + $pfn + '!App') /sc once /st 00:00 /it /f | Out-Null
schtasks /run /tn XplatTrayApp | Out-Null
$deadline=(Get-Date).AddSeconds(120)
$done=$false
while((Get-Date) -lt $deadline){
 if(Test-Path $log){ $c=Get-Content $log -Raw -ErrorAction SilentlyContinue; if($c -match 'TRAY_WINDOWS_'){ $done=$true; break } }
 Start-Sleep -Milliseconds 800
}
'result: ' + $(if($done){'COMPLETE'}else{'TIMEOUT'})
'=== console ==='
if(Test-Path $log){ Get-Content $log }
'=== selftest ==='
if(Test-Path ${quote(logPath)}){ Get-Content ${quote(logPath)} }
Get-Process windows -ErrorAction SilentlyContinue | Where-Object {$_.Path -eq ${quote(remote + '\\windows.exe')}} | Stop-Process -Force
schtasks /delete /tn XplatTrayApp /f | Out-Null
`,
		180_000,
	)
	console.log(output)
	assert.match(output, /availability \{"available":true,"platform":"windows"\}/)
	assert.match(output, /created/)
	assert.match(output, /activate-ok/)
	assert.match(output, /menu-select-ok activate,a/)
	assert.match(output, /update-ok activate,a,b/)
	assert.match(output, /windows had=(true|false) hidden=false toggled=true/)
	assert.match(output, /destroyed=true/)
	assert.match(output, /TRAY_WINDOWS_OK/)
	// Native evidence the icon actually occupied the notification area:
	// the worker's own Shell_NotifyIconGetRect returns a real box.
	assert.match(output, /rect \[\d+,\d+,\d+,\d+\]/)
	console.log('TRAY_WINDOWS_RUNTIME_OK')
} finally {
	rmSync(temporary, { recursive: true, force: true })
}

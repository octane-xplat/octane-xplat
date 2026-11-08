// Windows runtime feasibility check for tray primitives on the packaged
// NativeScript Windows host. Verified 2026-11-07 on the alpha146 packaged
// runtime: eval-Worker + message-only window (DefWindowProcW) +
// Shell_NotifyIconW add/modify/delete + Shell_NotifyIconGetRect S_OK +
// GetMessageW callback delivery — all inside the packaged app.
//
// Env: TRAY_WINDOWS_HOST (ssh host with an interactive session) and
// TRAY_WINDOWS_RUNTIME (remote dir containing a copy of the packaged runtime,
// e.g. apps/windows/platforms/windows/windows/bin).
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

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

// Stage the runtime once; it is mutated in place per run.
const staged = run(`Test-Path ${quote(remote + '\\windows.exe')}`).trim()
if (staged !== 'True') {
	console.log('staging runtime (one-time robocopy)')
	run(
		`New-Item -ItemType Directory -Force ${quote(remote)} | Out-Null; & robocopy ${quote(runtime)} ${quote(remote)} /E /R:0 /W:0 /NFL /NDL /NJH /NJS /NP | Out-Null; exit 0`,
		600_000,
	)
}

const bundle = readFileSync(new URL('./fixtures/tray-probe.windows.js', import.meta.url)).toString('base64')
run(`[IO.File]::WriteAllBytes(${quote(remote + '\\app\\bundle.mjs')}, [Convert]::FromBase64String('${bundle}'))`)
run(`Set-Content ${quote(remote + '\\app\\package.json')} '{"main":"bundle.mjs"}'`)
const manifest = remote + '\\AppxManifest.xml'
run(
	`[xml]$xml=Get-Content ${quote(manifest)}; $xml.Package.Identity.Name=${quote(identity)}; if($xml.Package.Extensions){[void]$xml.Package.RemoveChild($xml.Package.Extensions)}; $xml.Save(${quote(manifest)})`,
)

// Package registration requires the interactive session; run it via an /it
// task with a generous wait (session-1 powershell starts can stall for minutes).
const pkg = run(`Get-AppxPackage -Name ${quote(identity)} | Select-Object -ExpandProperty PackageFamilyName`).trim()
if (!pkg) {
	console.log('registering package via session-1 task (may take minutes)')
	const reg = `${remote}\\register.ps1`
	run(`Set-Content ${quote(reg)} "try { Add-AppxPackage -Register '${manifest.replaceAll("'", "''")}' -ForceUpdateFromAnyVersion -ErrorAction Stop; Set-Content '${remote.replaceAll("'", "''")}\\\\regdone' 'ok' } catch { Set-Content '${remote.replaceAll("'", "''")}\\\\regdone' ('fail ' + `$_`) }"`)
	run(`Remove-Item ${quote(remote + '\\regdone')} -Force -ErrorAction SilentlyContinue`)
	run(
		`schtasks /create /tn XplatTrayReg${id} /tr "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ${remote}\\\\register.ps1" /sc once /st 00:00 /it /f | Out-Null; schtasks /run /tn XplatTrayReg${id} | Out-Null; $d=(Get-Date).AddSeconds(600); while(-not (Test-Path ${quote(remote + '\\regdone')})){ if((Get-Date) -gt $d){throw 'registration timed out'}; Start-Sleep -Seconds 2 }; schtasks /delete /tn XplatTrayReg${id} /f | Out-Null; Get-Content ${quote(remote + '\\regdone')}`,
		660_000,
	)
}
const pfn = run(`(Get-AppxPackage -Name ${quote(identity)}).PackageFamilyName`).trim()
console.log('PFN ' + pfn)

const output = run(
	`
$pfn=${quote(pfn)}
$log="$env:LOCALAPPDATA\\Packages\\$pfn\\LocalState\\console.log"
Get-Process windows -ErrorAction SilentlyContinue | Where-Object {$_.Path -eq ${quote(remote + '\\windows.exe')}} | Stop-Process -Force
Remove-Item $log -Force -ErrorAction SilentlyContinue
Remove-Item 'C:\\Users\\alecs\\xplat-tray-main.log','C:\\Users\\alecs\\xplat-tray-worker.log' -Force -ErrorAction SilentlyContinue
schtasks /create /tn XplatTrayApp${id} /tr ('explorer.exe shell:AppsFolder\\' + $pfn + '!App') /sc once /st 00:00 /it /f | Out-Null
schtasks /run /tn XplatTrayApp${id} | Out-Null
$deadline=(Get-Date).AddSeconds(120)
$done=$false
while((Get-Date) -lt $deadline){
 if(Test-Path 'C:\\Users\\alecs\\xplat-tray-worker.log'){ $c=Get-Content 'C:\\Users\\alecs\\xplat-tray-worker.log' -Raw -ErrorAction SilentlyContinue; if($c -match 'DONE'){ $done=$true; break } }
 Start-Sleep -Milliseconds 800
}
'result: ' + $(if($done){'COMPLETE'}else{'TIMEOUT'})
if(Test-Path 'C:\\Users\\alecs\\xplat-tray-worker.log'){ Get-Content 'C:\\Users\\alecs\\xplat-tray-worker.log' }
if(Test-Path $log){ Get-Content $log }
Get-Process windows -ErrorAction SilentlyContinue | Where-Object {$_.Path -eq ${quote(remote + '\\windows.exe')}} | Stop-Process -Force
schtasks /delete /tn XplatTrayApp${id} /f | Out-Null
`,
	180_000,
)
console.log(output)
assert.match(output, /NIM_ADD true/)
assert.match(output, /GetRect hr=0x0 rect=\d+,\d+,\d+,\d+/)
assert.match(output, /NIM_MODIFY true/)
assert.match(output, /GetMessageW got=true wParam=\d+ lParam=0x202/)
assert.match(output, /NIM_DELETE true/)
assert.match(output, /DONE/)
console.log('TRAY_WINDOWS_OK')

param([string]$Directory, [string]$Runtime, [string]$Identity)
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$dir=$Directory
Get-Process windows -ErrorAction SilentlyContinue | Where-Object {$_.Path -eq "$dir\runtime\windows.exe"} | Stop-Process
$source=$Runtime
New-Item -ItemType Directory -Force "$dir\runtime" | Out-Null
& robocopy $source "$dir\runtime" /E /R:0 /W:0 /NFL /NDL /NJH /NJS /NP | Out-Null
Copy-Item "$dir\bundle.mjs" "$dir\runtime\app\bundle.mjs" -Force
'{"main":"bundle.mjs"}' | Set-Content "$dir\runtime\app\package.json"
$manifest="$dir\runtime\AppxManifest.xml"
[xml]$xml=Get-Content $manifest
$xml.Package.Identity.Name=$Identity
if($xml.Package.Extensions){[void]$xml.Package.RemoveChild($xml.Package.Extensions)}
# Inject the microphone device capability if absent — dictation needs it.
$caps=$xml.Package.Capabilities
$hasMic=$false
foreach($c in $caps.ChildNodes){ if($c.LocalName -eq 'DeviceCapability' -and $c.Name -eq 'microphone'){$hasMic=$true} }
if(-not $hasMic){
 $cap=$xml.CreateElement('DeviceCapability')
 $cap.SetAttribute('Name','microphone')
 [void]$caps.AppendChild($cap)
 'SPEECH DRIVER injected microphone DeviceCapability'
}else{
 'SPEECH DRIVER microphone DeviceCapability already present'
}
$xml.Save($manifest)
try {
Add-AppxPackage -Register $manifest -ForceUpdateFromAnyVersion
$pkg=Get-AppxPackage -Name $Identity
# Grant this package microphone access non-interactively (per-app consent).
$micKey='HKCU:\Software\Microsoft\Windows\CurrentVersion\DeviceAccess\Global\{E5323777-F976-4f5b-9B55-B94699C46E44}'
New-Item -Path $micKey -Force | Out-Null
Set-ItemProperty -Path $micKey -Name 'Value' -Value 'Allow'
Set-ItemProperty -Path $micKey -Name $pkg.PackageFamilyName -Value 'Allow'
New-Item -Path "$micKey\$($pkg.PackageFamilyName)" -Force | Out-Null
Set-ItemProperty -Path "$micKey\$($pkg.PackageFamilyName)" -Name 'Value' -Value 'Allow'
"SPEECH DRIVER mic consent set for $($pkg.PackageFamilyName)"
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes
Add-Type -AssemblyName System.Speech
Add-Type 'using System;using System.Runtime.InteropServices;public static class SpeechProbeInput {[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);}'
$log=Join-Path $env:LOCALAPPDATA "Packages\$($pkg.PackageFamilyName)\LocalState\console.log"
Remove-Item $log -ErrorAction SilentlyContinue
# SAPI in-proc dictation sanity check — proves the mic hears the speakers and
# desktop-app mic access is granted, independent of the packaged WinRT path.
try {
 $eng=New-Object System.Speech.Recognition.SpeechRecognitionEngine
 $eng.SetInputToDefaultAudioDevice()
 $eng.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar)) | Out-Null
 $script:sapiDone=$false; $script:sapiHeard=$null
 $eng.add_RecognizeCompleted({param($s,$e) $script:sapiDone=$true; $script:sapiHeard=$e.Result})
 $eng.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
 $sapiSynth=New-Object System.Speech.Synthesis.SpeechSynthesizer
 $sapiSynth.SetOutputToDefaultAudioDevice()
 Start-Sleep -Milliseconds 400
 $sapiSynth.Speak('the quick brown fox jumps over the lazy dog')
 $t0=Get-Date
 while(-not $script:sapiDone -and ((Get-Date)-$t0).TotalSeconds -lt 14){Start-Sleep -Milliseconds 250}
 try { $eng.RecognizeAsyncCancel() } catch {}
 if($script:sapiHeard){ "SPEECH DRIVER SAPI heard: "+$script:sapiHeard.Text+" conf="+$script:sapiHeard.Confidence } else { "SPEECH DRIVER SAPI no result" }
 $eng.Dispose()
} catch { "SPEECH DRIVER SAPI error: $_" }
Start-Process explorer.exe -ArgumentList "shell:AppsFolder\$($pkg.PackageFamilyName)!App"
$deadline=(Get-Date).AddSeconds(25)
do {
 Start-Sleep -Milliseconds 300
 $windows=[System.Windows.Automation.AutomationElement]::RootElement.FindAll([System.Windows.Automation.TreeScope]::Children,[System.Windows.Automation.Condition]::TrueCondition)
 $window=$windows | Where-Object {$_.Current.Name -eq 'XplatSpeech'} | Select-Object -First 1
} while (-not $window -and (Get-Date) -lt $deadline)
if(-not $window){ if(Test-Path $log){Get-Content $log};throw 'No speech window' }
[SpeechProbeInput]::SetForegroundWindow([IntPtr]$window.Current.NativeWindowHandle) | Out-Null
$synth=New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SetOutputToDefaultAudioDevice()
$phrase='the quick brown fox jumps over the lazy dog'
$speaks=0
$clickedConsent=$false
$deadline=(Get-Date).AddSeconds(200)
$sawDone=$false
while ((Get-Date) -lt $deadline) {
 if(Test-Path $log){ $content=Get-Content $log -Raw } else { $content='' }
 if($content -match 'SPEECH DONE'){ $sawDone=$true; break }
 # Click a microphone-consent prompt if one is showing; also log when the
 # set of top-level windows changes so we can see whether a prompt appears.
 try {
   $tops=[System.Windows.Automation.AutomationElement]::RootElement.FindAll([System.Windows.Automation.TreeScope]::Children,[System.Windows.Automation.Condition]::TrueCondition)
   $sig=($tops | ForEach-Object {$_.Current.Name}) -join '|'
   if($sig -ne $lastTopSig){ $lastTopSig=$sig; "SPEECH DRIVER TOPS: $sig" }
 } catch { "SPEECH DRIVER tops scan error: $_" }
 if(-not $clickedConsent){
  try {
   foreach($top in $tops){
    $texts=$top.FindAll([System.Windows.Automation.TreeScope]::Descendants,[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::ControlTypeProperty,[System.Windows.Automation.ControlType]::Text))
    $joined=($texts | ForEach-Object {$_.Current.Name}) -join ' '
    if($joined -match 'microphone' -and $top.Current.Name -ne 'XplatSpeech'){
     $btns=$top.FindAll([System.Windows.Automation.TreeScope]::Descendants,[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::ControlTypeProperty,[System.Windows.Automation.ControlType]::Button))
     $allow=$btns | Where-Object {$_.Current.Name -match '^(Allow|Yes)'} | Select-Object -First 1
     if($allow){
      $ip=$allow.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
      if($ip){ $ip.Invoke(); $clickedConsent=$true; "SPEECH DRIVER clicked consent button '$($allow.Current.Name)' on '$($top.Current.Name)'" }
     }
    }
   }
  } catch { "SPEECH DRIVER consent scan error: $_" }
 }
 $listening=[regex]::Matches($content,'SPEECH LISTENING').Count
 $results=[regex]::Matches($content,'SPEECH RESULT').Count
 if($listening -gt $results -and $speaks -lt 12){
  $speaks++
  "SPEECH DRIVER speaking round $speaks"
  $synth.Speak($phrase)
 } else {
  Start-Sleep -Milliseconds 350
 }
}
if(-not $sawDone){ 'SPEECH DRIVER deadline without SPEECH DONE' }
Start-Sleep -Milliseconds 500
if(Test-Path $log){ $output=Get-Content $log -Raw } else { $output='(no console.log produced)' }
$output
if ($output -notmatch 'SPEECH DONE') { throw 'Probe did not finish' }
} finally {
$own=Get-Process windows -ErrorAction SilentlyContinue | Where-Object {$_.Path -eq "$dir\runtime\windows.exe"}
$own | Stop-Process
if($pkg) { Remove-AppxPackage $pkg.PackageFullName }
if($pkg) { Remove-ItemProperty -Path $micKey -Name $pkg.PackageFamilyName -ErrorAction SilentlyContinue }
}
exit 0

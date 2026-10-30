# Run in interactive session 1 only, under the shared VM lease.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes,System.Windows.Forms
Add-Type @'
using System; using System.Runtime.InteropServices;
public static class InputForeground {
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr window);
}
'@
$root = [System.Windows.Automation.AutomationElement]::RootElement
$all = $root.FindAll([System.Windows.Automation.TreeScope]::Children, [System.Windows.Automation.Condition]::TrueCondition)
$window = $null
foreach ($candidate in $all) {
 $process = Get-Process -Id $candidate.Current.ProcessId -ErrorAction SilentlyContinue
 if ($process.ProcessName -eq 'windows' -and $process.Path -like '*windows-ui-lab*') { $window = $candidate; break }
}
if (-not $window) { throw 'Isolated Windows lab window missing' }
[InputForeground]::SetForegroundWindow([IntPtr]$window.Current.NativeWindowHandle) | Out-Null
function Field($name) {
 $condition = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, $name)
 $field = $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)
 if (-not $field) { throw "Field missing: $name" }
 return $field
}
function Check($condition, $message) { if (-not $condition) { throw $message }; Write-Output "PASS $message" }
function Command($id, $action, $value = $null) {
 $sequence = [Guid]::NewGuid().ToString()
 $json = @{sequence=$sequence; id=$id; action=$action; value=$value} | ConvertTo-Json -Compress
 [System.IO.File]::WriteAllText('C:\Users\octane\dev\input-contract-command.tmp', $json, (New-Object System.Text.UTF8Encoding $false))
 Move-Item -Force C:\Users\octane\dev\input-contract-command.tmp C:\Users\octane\dev\input-contract-command.json
 # Await the exact application acknowledgement; no click occurs before public blur.
 $deadline = (Get-Date).AddSeconds(10)
 $log = "$env:LOCALAPPDATA\Packages\org.nativescript.xplat_8w7k1f04p0kxp\LocalState\console.log"
 do {
  if ((Get-Content -Encoding UTF8 $log -ErrorAction SilentlyContinue) -match $sequence) { return }
  Start-Sleep -Milliseconds 100
 } while ((Get-Date) -lt $deadline)
 throw "No acknowledgement for $action"
}
$ordinary = Field 'Ordinary accessible name'
$ordinary.SetFocus()
[System.Windows.Forms.SendKeys]::SendWait('{END}Z{ENTER}')
Start-Sleep -Milliseconds 300
Check ($ordinary.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern).Current.Value -eq 'ordinaryZ') 'real ordinary typing'
Command ordinary blur
Check (-not $ordinary.Current.HasKeyboardFocus) 'isolated public blur removes focus'
Command ordinary focus
Check $ordinary.Current.HasKeyboardFocus 'public focus restores focus'
foreach ($name in @('Disabled accessible name', 'Secure accessible name')) {
 $field = Field $name
 Check (-not $field.Current.IsEnabled -and -not $field.Current.IsKeyboardFocusable) "$name disabled and nonfocusable"
 $rejected = $false
 try { $field.SetFocus() } catch { $rejected = $true }
 Check $rejected "$name rejects UIA focus"
}
$readonly = Field 'Readonly accessible name'
$readonly.SetFocus()
[System.Windows.Forms.SendKeys]::SendWait('{END}Z')
Start-Sleep -Milliseconds 200
Check ($readonly.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern).Current.Value -eq 'plain readonly') 'plain readonly rejects typing'
foreach ($literal in @('initial', 'inherit', 'unset', 'revert')) {
 $field = Field "Literal $literal"
 Check ($field.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern).Current.Value -eq $literal) "literal $literal"
}
$area = Field 'Multiline accessible name'
$area.SetFocus()
[System.Windows.Forms.SendKeys]::SendWait('{END}{ENTER}Z')
Start-Sleep -Milliseconds 300
Check ($area.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern).Current.Value -match '[\r\n]Z$') 'real multiline Enter inserts line'
Command ordinary name 'Updated accessible name'
Check ($null -ne (Field 'Updated accessible name')) 'dynamic accessible name'
Command disabled disabled $false
Check (Field 'Disabled accessible name').Current.IsEnabled 'disabled restoration'
Command secure readonly $false
Check (Field 'Secure accessible name').Current.IsEnabled 'secure readonly restoration'
Command secure secure $false
Check (-not (Field 'Secure accessible name').Current.IsPassword) 'secure to plain replacement'
Command secure secure $true
Check (Field 'Secure accessible name').Current.IsPassword 'plain to secure replacement'
Command secure readonly $true
Check (-not (Field 'Secure accessible name').Current.IsEnabled) 'readonly safety after replacement'
Command ordinary visible $false
Command ordinary visible $true
Command ordinary focus
Check (Field 'Updated accessible name').Current.HasKeyboardFocus 'remount restores public focus'
Write-Output 'Review UTF8 console focus/blur/change/submit ordering and absence of readonly/disabled changes; UIA state alone is not callback evidence.'

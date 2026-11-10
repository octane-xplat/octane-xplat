param(
 [Parameter(Mandatory=$true)][string]$RunRoot,
 [Parameter(Mandatory=$true)][string]$BridgeSource,
 [Parameter(Mandatory=$true)][string]$BundleSource
)
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$run=[IO.Path]::GetFullPath($RunRoot)
New-Item -ItemType Directory -Force "$run/runtime", "$run/tmp" | Out-Null
$env:TEMP="$run/tmp"; $env:TMP=$env:TEMP
if (!(Test-Path "$run/runtime/package/package.json")) {
  curl.exe --fail --location --output "$run/windows-beta24.tgz" 'https://registry.npmjs.org/@nativescript/windows/-/windows-1.0.0-beta.24.tgz'
  if($LASTEXITCODE){throw 'Runtime download failed'}
  tar.exe -xzf "$run/windows-beta24.tgz" -C "$run/runtime"
  if($LASTEXITCODE){throw 'Runtime extraction failed'}
}
$framework="$run/runtime/package/framework"
$project="$framework/GestureBindings"
if(!(Test-Path $project)) {
  Copy-Item -Recurse -LiteralPath "$framework/__PROJECT_NAME__" -Destination $project
  Get-ChildItem $project -Recurse -File | Where-Object Extension -in '.cs','.xaml','.csproj','.appxmanifest','.props','.targets' | ForEach-Object {
    $text=[IO.File]::ReadAllText($_.FullName).Replace('__PROJECT_NAME__','GestureBindings')
    [IO.File]::WriteAllText($_.FullName,$text)
  }
  Rename-Item "$project/__PROJECT_NAME__.csproj" GestureBindings.csproj
}
Copy-Item -LiteralPath $BridgeSource -Destination "$project/GestureInput.cs" -Force
Copy-Item -LiteralPath $BundleSource -Destination "$run/windows-bindings.js" -Force
@'
using System;
using System.IO;
using Microsoft.UI.Xaml;
namespace GestureBindings;
public static class GateLog {
 public static void Write(string value) => File.AppendAllText(Path.Combine(AppContext.BaseDirectory,"gate.log"),value+Environment.NewLine);
}
sealed partial class App : Application {
 internal static Window CurrentWindow { get; } = new Window();
 private readonly RuntimeHost runtime = new();
 private readonly DispatcherTimer pump = new() { Interval=TimeSpan.FromMilliseconds(16) };
 private readonly DispatcherTimer stop = new() { Interval=TimeSpan.FromSeconds(25) };
 public App() { InitializeComponent(); UnhandledException += (_, e) => {GateLog.Write(e.Exception.ToString());e.Handled=true;}; }
 protected override void OnLaunched(LaunchActivatedEventArgs args) {
  try { runtime.Initialize(); runtime.RunMainScript(); GateLog.Write("JSERROR="+runtime.GetLastJsError()); }
  catch(Exception e){ GateLog.Write(e.ToString()); }
  pump.Tick += (_,_) => runtime.PumpTimers(); pump.Start();
  stop.Tick += (_,_) => { pump.Stop();stop.Stop();Exit(); };stop.Start();
 }
}
'@ | Set-Content "$project/App.xaml.cs" -Encoding UTF8
New-Item -ItemType Directory -Force "$project/app" | Out-Null
Copy-Item "$run/windows-bindings.js" "$project/app/bundle.js"
'{"main":"bundle.js"}' | Set-Content "$project/app/package.json" -Encoding ASCII
$projectFile="$project/GestureBindings.csproj"
$projectText=[IO.File]::ReadAllText($projectFile)
if (!$projectText.Contains('Microsoft.Windows.SDK.BuildTools.MSIX')) {
 $projectText=$projectText.Replace('</Project>', '<ItemGroup><PackageReference Include="Microsoft.Windows.SDK.BuildTools.MSIX" Version="1.6.20250507.1" /></ItemGroup></Project>')
 [IO.File]::WriteAllText($projectFile,$projectText)
}
$env:DOTNET_CLI_TELEMETRY_OPTOUT='1'
dotnet build "$project/GestureBindings.csproj" -c Debug -p:Platform=x64 -p:WindowsPackageType=None -p:WindowsAppSDKBootstrapInitialize=true -p:EnableMsixTooling=false -p:AppxPackage=false -p:AppxMSBuildToolsPath=C:/BuildTools/MSBuild/Microsoft/VisualStudio/v18.0/AppxPackage/ -o "$run/bin" *> "$run/build.log"
$code=$LASTEXITCODE
Get-Content "$run/build.log" -Tail 18
exit $code

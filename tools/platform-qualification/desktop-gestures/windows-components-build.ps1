param(
 [Parameter(Mandatory=$true)][string]$RunRoot,
 [Parameter(Mandatory=$true)][string]$HostCheckout
)
$ErrorActionPreference='Stop'
$run=[IO.Path]::GetFullPath($RunRoot)
$prepared=Join-Path $HostCheckout 'apps/windows/platforms/windows'
$source=Join-Path $prepared 'windows'
$project=Join-Path $run 'project'
if(Test-Path $project){throw 'Use a fresh disposable run directory'}
New-Item -ItemType Directory -Force $project,"$run/tmp" | Out-Null
$env:TEMP="$run/tmp"; $env:TMP=$env:TEMP
# Preserve the shared checkout and its prepared app. Only immutable SDK/native
# inputs are reused; C# compilation and the packed consumer live in scratch.
Get-ChildItem $source | Where-Object Name -NotIn @('bin','binpublish','obj','app','app.nsbundle') | ForEach-Object {
 Copy-Item -LiteralPath $_.FullName -Destination $project -Recurse
}
Get-ChildItem $project -Recurse -Filter GestureInput.cs | Remove-Item
Copy-Item "$run/GestureInput.cs" "$project/GestureInput.cs"
Copy-Item "$run/dist" "$project/app" -Recurse
@'
using System;
using Microsoft.UI.Xaml;
namespace windows;
sealed partial class App : Application {
 public static Window CurrentWindow { get; private set; }
 public Window MainWindow => CurrentWindow;
 public Window Window => CurrentWindow;
 private readonly RuntimeHost runtime = new();
 private readonly DispatcherTimer pump = new() { Interval=TimeSpan.FromMilliseconds(16) };
 public App() {
  GateLog.Write("APP_CONSTRUCTOR");
  InitializeComponent();
  CurrentWindow = new Window();
  UnhandledException += (_,e) => {GateLog.Write("NATIVE_ERROR "+e.Exception);e.Handled=true;};
 }
 protected override void OnLaunched(LaunchActivatedEventArgs args) {
  try {
   GateLog.Write("LAUNCH_BEGIN");
   runtime.Initialize(); runtime.RunMainScript();
   GateLog.Write("JSERROR="+runtime.GetLastJsError());
   pump.Tick += (_,_) => runtime.PumpTimers(); pump.Start();
   if(CurrentWindow?.Content != null) CurrentWindow.Activate();
  } catch(Exception e) {GateLog.Write("LAUNCH_ERROR "+e);}
 }
}
'@ | Set-Content "$project/App.xaml.cs" -Encoding UTF8
$entry=Join-Path $project 'Program.cs'
$entryText=[IO.File]::ReadAllText($entry)
$entryText=$entryText.Replace('ComWrappersSupport.InitializeComWrappers();','GateLog.Write("MAIN_BEGIN"); try { ComWrappersSupport.InitializeComWrappers();')
$entryText=$entryText.Replace('new App();','GateLog.Write("APPLICATION_START"); new App();')
$entryText=$entryText.Replace('            });','            }); } catch(Exception error) { GateLog.Write("MAIN_ERROR "+error); throw; }')
[IO.File]::WriteAllText($entry,$entryText)
$gateSource=@'
using System;
using System.IO;
namespace windows;
public static class GateLog {
 public static void Write(string value) => File.AppendAllText(@"__GATE_LOG__",value+Environment.NewLine);
}
'@
$gateSource.Replace('__GATE_LOG__',("$run\gate.log").Replace('"','""')) | Set-Content "$project/GateLog.cs" -Encoding UTF8
$projectFile=Join-Path $project 'windows.csproj'
$text=[IO.File]::ReadAllText($projectFile)
if (!$text.Contains('Microsoft.Windows.SDK.BuildTools.MSIX')) {
 $text=$text.Replace('</Project>','<ItemGroup><PackageReference Include="Microsoft.Windows.SDK.BuildTools.MSIX" Version="1.6.20250507.1" /></ItemGroup></Project>')
 [IO.File]::WriteAllText($projectFile,$text)
}
$env:DOTNET_CLI_TELEMETRY_OPTOUT='1'
# This gate registers a normal loose package, whose manifest supplies the
# runtime dependency. The unpackaged bootstrapper rejects package identity.
dotnet build $projectFile -c Debug -p:Platform=x64 -p:WindowsPackageType=None -p:WindowsAppSDKBootstrapInitialize=false -p:EnableMsixTooling=false -p:AppxPackage=false -p:AppxMSBuildToolsPath=C:/BuildTools/MSBuild/Microsoft/VisualStudio/v18.0/AppxPackage/ "-p:NSWindowsRoot=$prepared" -o "$run/bin" *> "$run/build.log"
$code=$LASTEXITCODE
Get-Content "$run/build.log" -Tail 25
exit $code

param([Parameter(Mandatory=$true)][string]$RunRoot)
$ErrorActionPreference='Stop'
$run=[IO.Path]::GetFullPath($RunRoot)
$hash=[Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($run))
$suffix=([BitConverter]::ToString($hash)).Replace('-','').Substring(0,12)
$name="OctaneXplat.GestureQualification.$suffix"
if(Get-AppxPackage -Name $name){throw 'The run already has a registered package; preserve it and choose a fresh run'}
$runtime=Get-AppxPackage Microsoft.WindowsAppRuntime.1.6 | Sort-Object Version -Descending | Select-Object -First 1
if(!$runtime){throw 'Existing Windows App Runtime 1.6 package is required; no runtime is installed by this gate'}
$identity=Join-Path $run 'bin'
New-Item -ItemType Directory -Force "$identity/Assets"|Out-Null
foreach($asset in @('Square150x150Logo.png','Square44x44Logo.png','StoreLogo.png')) {
 Copy-Item "$run/project/Assets/$asset" "$identity/Assets/$asset"
}
$publisher=[Security.SecurityElement]::Escape($runtime.Publisher)
@"
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10" xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10" xmlns:uap10="http://schemas.microsoft.com/appx/manifest/uap/windows10/10" xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities" IgnorableNamespaces="uap uap10 rescap">
 <Identity Name="$name" Publisher="CN=OctaneLocalQualification" Version="1.0.0.0" ProcessorArchitecture="x64"/>
 <Properties><DisplayName>Octane packed gesture qualification</DisplayName><PublisherDisplayName>Octane local qualification</PublisherDisplayName><Logo>Assets/StoreLogo.png</Logo></Properties>
 <Resources><Resource Language="en-us"/></Resources>
 <Dependencies><TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.19041.0" MaxVersionTested="10.0.26100.0"/><PackageDependency Name="$($runtime.Name)" Publisher="$publisher" MinVersion="$($runtime.Version)"/></Dependencies>
 <Capabilities><rescap:Capability Name="runFullTrust"/></Capabilities>
 <Applications><Application Id="App" Executable="windows.exe" EntryPoint="Windows.FullTrustApplication" uap10:RuntimeBehavior="packagedClassicApp" uap10:TrustLevel="mediumIL"><uap:VisualElements DisplayName="Octane packed gestures" Description="Owned local qualification" BackgroundColor="transparent" Square150x150Logo="Assets/Square150x150Logo.png" Square44x44Logo="Assets/Square44x44Logo.png"/></Application></Applications>
</Package>
"@ | Set-Content "$identity/AppxManifest.xml" -Encoding UTF8
# Reuse the prepared host's WinRT activation declarations. DLLs on disk alone
# do not register Mason or the framework widgets in a packaged process.
[xml]$preparedManifest=Get-Content "$run/project/Package.appxmanifest"
[xml]$manifest=Get-Content "$identity/AppxManifest.xml"
$extensions=$preparedManifest.SelectSingleNode("/*[local-name()='Package']/*[local-name()='Extensions']")
if(!$extensions){throw 'Prepared native host has no WinRT activation declarations'}
$manifest.DocumentElement.AppendChild($manifest.ImportNode($extensions,$true))|Out-Null
$manifest.Save("$identity/AppxManifest.xml")
Add-AppxPackage -Register "$identity/AppxManifest.xml"
$package=Get-AppxPackage -Name $name
if(!$package){throw 'Owned test package registration did not complete'}
@{name=$name;fullName=$package.PackageFullName;family=$package.PackageFamilyName}|ConvertTo-Json -Compress|Set-Content "$run/identity.json"

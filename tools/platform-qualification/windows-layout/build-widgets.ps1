param(
    [Parameter(Mandatory)][string]$ScratchDirectory,
    [string]$SourceArchive,
    [string]$MsBuildPath = 'C:/BuildTools/MSBuild/Current/Bin/MSBuild.exe',
    [switch]$PrepareOnly
)
$ErrorActionPreference = 'Stop'
$commit = 'abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b'
$archiveHash = 'E5AFF3114F26CBD6E7F78920A4C28EA9A5B43E890233C8603CFF3EEAE9618F94'
$patchHash = '1FF8F2A68F8D70E48AD7772A877E0DB58BEA65A0B559D2C9C9BC90BAB5BD45CB'
$patch = Join-Path $PSScriptRoot '../patches/windows-layout/native-padding.patch'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $env:USERPROFILE 'agent-scratch/octane-xplat'))
$scratch = [IO.Path]::GetFullPath($ScratchDirectory)
if (-not $scratch.StartsWith($taskRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Use a new run directory below ~/agent-scratch/octane-xplat/<task>/.'
}
if (Test-Path $scratch) { throw 'Use a new scratch directory; existing outputs are preserved.' }
New-Item -ItemType Directory -Path "$scratch/source", "$scratch/build/bin", "$scratch/build/obj", "$scratch/logs", "$scratch/tmp" -Force | Out-Null
$env:TEMP = "$scratch/tmp"; $env:TMP = $env:TEMP
$archive = "$scratch/source.tar.gz"
if ($SourceArchive) { Copy-Item -LiteralPath $SourceArchive $archive }
else {
    & curl.exe --fail --location --output $archive "https://api.github.com/repos/NativeScript/NativeScript/tarball/$commit"
    if ($LASTEXITCODE -ne 0) { throw 'Pinned NativeScript source download failed.' }
}
if ((Get-FileHash $archive).Hash -ne $archiveHash) { throw 'Pinned source archive hash mismatch.' }
$entries = @(& tar.exe -tzf $archive)
if ($LASTEXITCODE -ne 0) { throw 'Cannot list pinned source archive.' }
$files = @($entries | Where-Object { $_ -match '/packages/ui-mobile-base/windows/widgets-cpp/[^/]+$' -or $_ -match '^[^/]+/LICENSE$' })
if ($files.Count -ne 37) { throw 'Pinned native source inventory changed.' }
& tar.exe -xzf $archive -C "$scratch/source" --strip-components=1 @files
if ($LASTEXITCODE -ne 0) { throw 'Native source extraction failed.' }
# The canonical patch also contains upstream test changes. Compile only its
# three native hunks; the upstream test suite is a separate verification gate.
$fullPatch = [IO.File]::ReadAllText($patch)
$hunks = [regex]::Matches($fullPatch, '(?ms)^diff --git a/packages/ui-mobile-base/windows/widgets-cpp/.*?(?=^diff --git |\z)')
if ($hunks.Count -ne 3) { throw 'Expected three canonical native patch hunks.' }
$nativePatch = "$scratch/native-padding.patch"
[IO.File]::WriteAllText($nativePatch, (($hunks | ForEach-Object { $_.Value }) -join ''), [Text.UTF8Encoding]::new($false))
if ((Get-FileHash $nativePatch).Hash -ne $patchHash) { throw 'Canonical native patch changed; review the source pin and binary manifest.' }
& git.exe -C "$scratch/source" apply --check $nativePatch
if ($LASTEXITCODE -ne 0) { throw 'Native patch does not apply to the pin.' }
& git.exe -C "$scratch/source" apply $nativePatch
if ($LASTEXITCODE -ne 0) { throw 'Native patch application failed.' }
& git.exe -C "$scratch/source" apply --reverse --check $nativePatch
if ($LASTEXITCODE -ne 0) { throw 'Applied native patch failed its reverse check.' }
$manifest = [ordered]@{sourceCommit=$commit;sourceArchiveSha256=$archiveHash;nativePatchSha256=$patchHash;architecture='x64';preparedOnly=[bool]$PrepareOnly;artifacts=@()}
if (-not $PrepareOnly) {
    $env:CL = '/MP2'
    $project = "$scratch/source/packages/ui-mobile-base/windows/widgets-cpp/NativeScript.Widgets.vcxproj"
    $arguments = @($project, '/restore', '/t:Build', '/m:2', '/nologo', '/v:minimal', '/p:Configuration=Release', '/p:Platform=x64', '/p:PlatformToolset=v143', '/p:NuGetTargetMoniker=native%2CVersion=v0.0', '/p:AppxGeneratePriEnabled=false', '/p:EnableCoreMrtTooling=false', '/p:IncludeCopyLocalFilesOutputGroup=false', '/p:GenerateLibraryLayout=false', "/p:OutDir=$scratch/build/bin/", "/p:IntDir=$scratch/build/obj/")
    $manifest.command = @($MsBuildPath) + $arguments
    $ErrorActionPreference = 'Continue'
    & $MsBuildPath @arguments *> "$scratch/logs/msbuild.log"
    $manifest.msbuildExitCode = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    $manifest.artifacts = @(Get-ChildItem "$scratch/build/bin" -File | Where-Object { $_.Name -in @('NativeScript.Widgets.dll', 'NativeScript.Widgets.winmd') } | ForEach-Object { @{name=$_.Name;sha256=(Get-FileHash $_.FullName).Hash;bytes=$_.Length} })
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content "$scratch/build-manifest.json" -Encoding UTF8
if (-not $PrepareOnly -and ($manifest.msbuildExitCode -ne 0 -or $manifest.artifacts.Count -ne 2)) { throw 'Native build failed; inspect its retained manifest and MSBuild log.' }
$manifest | ConvertTo-Json -Depth 5

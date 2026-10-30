param([Parameter(Mandatory)][string]$UpstreamDirectory)
$ErrorActionPreference = 'Stop'
$manifest = Get-Content (Join-Path $PSScriptRoot 'manifest.json') -Raw | ConvertFrom-Json
foreach ($file in $manifest.files) {
    if ($file.name -notin @('NativeScript.Widgets.dll', 'NativeScript.Widgets.winmd')) { throw 'Unexpected Widgets artifact name' }
    $candidate = Join-Path $PSScriptRoot ('x64/' + $file.name)
    if ((Get-FileHash $candidate -Algorithm SHA256).Hash -ne $file.sha256 -or (Get-Item $candidate).Length -ne $file.bytes) {
        throw "Pinned padding artifact changed: $($file.name)"
    }
    $upstream = Join-Path $UpstreamDirectory $file.name
    if ((Get-FileHash $upstream -Algorithm SHA256).Hash -ne $file.upstreamSha256) {
        throw "Upstream Widgets changed: $($file.name). Review or rebuild the pinned padding repair before adopting this core version."
    }
}
Write-Output 'Verified pinned x64 Widgets padding repair and upstream pair.'

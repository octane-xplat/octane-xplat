param([Parameter(Mandatory)][string]$Source,[Parameter(Mandatory)][string]$Destination)
$ErrorActionPreference = 'Stop'
$sourceDocument = [xml](Get-Content -LiteralPath $Source)
$destinationDocument = [xml](Get-Content -LiteralPath $Destination)
$namespace = 'http://schemas.microsoft.com/appx/manifest/foundation/windows10'
$manager = [Xml.XmlNamespaceManager]::new($destinationDocument.NameTable)
$manager.AddNamespace('a', $namespace)
$extensions = $destinationDocument.DocumentElement.SelectSingleNode('a:Extensions', $manager)
$changed = $false
foreach ($extension in @($sourceDocument.Package.Extensions.Extension)) {
    if ($null -eq $extension -or $extension.Category -ne 'windows.activatableClass.inProcessServer') { continue }
    if ($null -eq $extensions) {
        $extensions = $destinationDocument.CreateElement('Extensions', $namespace)
        [void]$destinationDocument.DocumentElement.AppendChild($extensions)
    }
    $path = [string]$extension.InProcessServer.Path
    $existing = @($extensions.SelectNodes('a:Extension', $manager) | Where-Object {
        $_.Category -eq 'windows.activatableClass.inProcessServer' -and [string]$_.InProcessServer.Path -eq $path
    })
    if ($existing.Count -gt 1) { throw "Duplicate native server registration: $path" }
    if ($existing.Count -eq 0) {
        [void]$extensions.AppendChild($destinationDocument.ImportNode($extension, $true))
        $changed = $true
        continue
    }
    $server = $existing[0].InProcessServer
    $ids = @($server.ActivatableClass | ForEach-Object { $_.ActivatableClassId })
    foreach ($class in @($extension.InProcessServer.ActivatableClass)) {
        if ($ids -notcontains $class.ActivatableClassId) {
            [void]$server.AppendChild($destinationDocument.ImportNode($class, $true))
            $ids += $class.ActivatableClassId
            $changed = $true
        }
    }
}
if ($changed) { $destinationDocument.Save($Destination) }
Write-Output "Native registration manifest merge: changed=$changed"

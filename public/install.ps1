$ErrorActionPreference = "Stop"
$repo = "B-Divyesh/sf-photo-proof-pile"
try {
  $releases = Invoke-RestMethod "https://api.github.com/repos/$repo/releases?per_page=1"
  $release = @($releases) | Select-Object -First 1
} catch {
  throw "A verified Windows release is not published yet. Nothing was installed."
}
$asset = $release.assets | Where-Object { $_.name -match '\.msi$' } | Select-Object -First 1
$sums = $release.assets | Where-Object { $_.name -eq 'SHA256SUMS' } | Select-Object -First 1
$releaseMarker = $release.assets | Where-Object { $_.name -eq 'DESKTOP_RELEASE_VERIFIED.json' } | Select-Object -First 1

if (-not $asset -or -not $sums -or -not $releaseMarker) {
  throw "A verified Windows release is not published yet. Nothing was installed."
}

$download = Join-Path $env:TEMP $asset.name
$checksumFile = Join-Path $env:TEMP "proof-pile-SHA256SUMS"
$releaseFile = Join-Path $env:TEMP "proof-pile-release.json"
Invoke-WebRequest $releaseMarker.browser_download_url -OutFile $releaseFile
$releaseStatus = Get-Content $releaseFile -Raw | ConvertFrom-Json
if ($releaseStatus.matrix -ne "complete" -or $releaseStatus.checksums -ne "sha256") {
  throw "Desktop release verification is incomplete. Nothing was installed."
}
if ($releaseStatus.signatures.windows -eq "unsigned") {
  Write-Warning "This Windows installer is unsigned. Windows will ask you to confirm the publisher."
} elseif ($releaseStatus.signatures.windows -ne "authenticode-signed") {
  throw "The Windows signing status is unknown. Nothing was installed."
}
Invoke-WebRequest $asset.browser_download_url -OutFile $download
Invoke-WebRequest $sums.browser_download_url -OutFile $checksumFile
$line = Get-Content $checksumFile | Where-Object { $_ -match [regex]::Escape($asset.name) } | Select-Object -First 1
$expected = ($line -split '\s+')[0]
$actual = (Get-FileHash $download -Algorithm SHA256).Hash.ToLowerInvariant()
if (-not $expected -or $expected.ToLowerInvariant() -ne $actual) {
  Remove-Item $download -ErrorAction SilentlyContinue
  throw "Checksum verification failed. Nothing was installed."
}
Start-Process msiexec.exe -Wait -ArgumentList "/i `"$download`""
Write-Host "Installed Proof Pile after verifying its SHA256 checksum."

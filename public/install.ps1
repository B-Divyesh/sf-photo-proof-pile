$ErrorActionPreference = "Stop"
$repo = "B-Divyesh/sf-photo-proof-pile"
$expectedTag = "v__PROOF_PILE_RELEASE_VERSION__"
$expectedCommit = "__PROOF_PILE_RELEASE_COMMIT__"
try {
  $release = Invoke-RestMethod "https://api.github.com/repos/$repo/releases/tags/$expectedTag"
} catch {
  throw "A Windows release is not published yet. Nothing was installed."
}
if ($release.tag_name -ne $expectedTag -or $release.target_commitish -ne $expectedCommit) {
  throw "The published Windows package does not match this site build. Nothing was installed."
}
$asset = $release.assets | Where-Object { $_.name -match '\.msi$' } | Select-Object -First 1
$sums = $release.assets | Where-Object { $_.name -eq 'SHA256SUMS' } | Select-Object -First 1
$manifestAsset = $release.assets | Where-Object { $_.name -eq 'latest.json' } | Select-Object -First 1
$downloadBase = "https://github.com/$repo/releases/download/$expectedTag/"

if (-not $asset -or -not $sums -or -not $manifestAsset -or
    $asset.browser_download_url -ne "$downloadBase$($asset.name)" -or
    $sums.browser_download_url -ne "${downloadBase}SHA256SUMS" -or
    $manifestAsset.browser_download_url -ne "${downloadBase}latest.json") {
  throw "A Windows release is not published yet. Nothing was installed."
}

$download = Join-Path $env:TEMP $asset.name
$checksumFile = Join-Path $env:TEMP "proof-pile-SHA256SUMS"
$manifestFile = Join-Path $env:TEMP "proof-pile-latest.json"
Invoke-WebRequest $manifestAsset.browser_download_url -OutFile $manifestFile
$manifest = Get-Content $manifestFile -Raw | ConvertFrom-Json
if ($manifest.version -ne $expectedTag -or $manifest.commit -ne $expectedCommit) {
  throw "The published Windows manifest does not match this site build. Nothing was installed."
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

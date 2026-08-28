$ErrorActionPreference = "Stop"
$repo = "B-Divyesh/sf-photo-proof-pile"
$release = Invoke-RestMethod "https://api.github.com/repos/$repo/releases/latest"
$asset = $release.assets | Where-Object { $_.name -match '\.msi$' } | Select-Object -First 1
$sums = $release.assets | Where-Object { $_.name -eq 'SHA256SUMS' } | Select-Object -First 1

if (-not $asset -or -not $sums) {
  throw "A Windows release is not published yet. Check https://github.com/$repo/releases"
}

$download = Join-Path $env:TEMP $asset.name
$checksumFile = Join-Path $env:TEMP "proof-pile-SHA256SUMS"
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

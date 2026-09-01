param(
  [Parameter(Mandatory = $true)]
  [string[]]$Path
)

$ErrorActionPreference = "Stop"
$packages = Get-ChildItem -Path $Path -Recurse -File | Where-Object { $_.Extension -in ".msi", ".exe" }
if (-not $packages) {
  throw "No Windows packages were found to inspect."
}

foreach ($package in $packages) {
  $signature = Get-AuthenticodeSignature -FilePath $package.FullName
  if ($signature.Status -ne "NotSigned") {
    throw "Expected an unsigned Windows package, but $($package.Name) is $($signature.Status)."
  }
}

Write-Host "Verified Windows packages are NotSigned."

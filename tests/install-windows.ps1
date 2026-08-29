$ErrorActionPreference = "Stop"
$script:Payload = "proof-pile-test-msi"
$script:Expected = [Convert]::ToHexString(
  [Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($script:Payload))
).ToLowerInvariant()
$script:Started = $false

function Invoke-RestMethod {
  [pscustomobject]@{ assets = @(
    [pscustomobject]@{ name = "Proof.Pile_0.1.1_x64_en-US.msi"; browser_download_url = "https://downloads.test/Proof.Pile_0.1.1_x64_en-US.msi" },
    [pscustomobject]@{ name = "SHA256SUMS"; browser_download_url = "https://downloads.test/SHA256SUMS" },
    [pscustomobject]@{ name = "DESKTOP_RELEASE_VERIFIED.json"; browser_download_url = "https://downloads.test/DESKTOP_RELEASE_VERIFIED.json" }
  ) }
}

function Invoke-WebRequest {
  param([string]$Uri, [string]$OutFile)
  if ($Uri.EndsWith("SHA256SUMS")) {
    [IO.File]::WriteAllText($OutFile, "$script:Expected  Proof.Pile_0.1.1_x64_en-US.msi`n")
  } elseif ($Uri.EndsWith("DESKTOP_RELEASE_VERIFIED.json")) {
    [IO.File]::WriteAllText($OutFile, '{"matrix":"complete","checksums":"sha256","signatures":{"macos":"unsigned","windows":"unsigned"}}')
  } else {
    [IO.File]::WriteAllText($OutFile, $script:Payload)
  }
}

function Start-Process {
  param([string]$FilePath, [switch]$Wait, [string]$ArgumentList)
  $script:Started = $true
}

. "$PSScriptRoot/../public/install.ps1"
if (-not $script:Started) { throw "A matching package was not opened." }

$script:Expected = "0" * 64
$script:Started = $false
try {
  . "$PSScriptRoot/../public/install.ps1"
  throw "A mismatched package was accepted."
} catch {
  if ($_.Exception.Message -notmatch "Checksum verification failed") { throw }
}
if ($script:Started) { throw "A mismatched package reached msiexec." }

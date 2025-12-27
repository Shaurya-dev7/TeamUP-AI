$profilePath = $PROFILE
if (!(Test-Path -Path $profilePath)) {
  New-Item -ItemType File -Path $profilePath -Force | Out-Null
}
$snippet = 'if ($env:TERM_PROGRAM -eq "vscode") { . "$(code --locate-shell-integration-path pwsh)" }'
if (-not (Get-Content -Path $profilePath -ErrorAction SilentlyContinue | Select-String -SimpleMatch 'code --locate-shell-integration-path pwsh')) {
  Add-Content -Path $profilePath -Value "`n$snippet`n"
  Write-Output "Added snippet to $profilePath"
} else {
  Write-Output "Snippet already present in $profilePath"
}
Get-Content -Path $profilePath -Raw
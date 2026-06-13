# Deploy Iraqi Trade Center Store Frontend to production server
#
# Canonical server paths (server: 65.20.159.30):
#   Store     : D:\iraqitradecenter\IraqiTradeCenter-Store         (this store frontend)
#   Companies : D:\iraqitradecenter\api_IraqiTradeCenter_Company   (company backend API)
#               D:\iraqitradecenter\IraqiTradeCenter_Company       (company frontend)
#   Parent    : D:\iraqitradecenter\api-iraqitradecenter           (parent backend API)
#               D:\iraqitradecenter\parent.iraqitradecenter        (parent frontend)
#
# Architecture:
#   - Main store  : https://iraqi-trade-center.iq/           -> D:\iraqitradecenter\IraqiTradeCenter-Store
#   - Per-company : https://store.{CODE}.iraqi-trade-center.iq/  -> same folder (IIS wildcard binding)
#
# API routing (web.config reverse proxy / ARR):
#   /capi/*  -> unified backend (https://api-iraqitradecenter.gcc.iq/api)  [products + images]
#   /api/*   -> unified backend (https://api-iraqitradecenter.gcc.iq/api)  [auth / companies / cards]
#
# The frontend reads window.location.hostname to detect the company code.
#
# Usage: .\deploy.ps1

$ErrorActionPreference = 'Stop'

$plink = 'E:\IraqiTradeCenter\_Tools\scripts\plink.exe'
$pscp  = 'E:\IraqiTradeCenter\_Tools\scripts\pscp.exe'
$srv   = 'gcc2026@65.20.159.30'          # public IP (use 192.168.0.50 on LAN for speed)
$pwd   = 'dRJB^ogSW%&*F6'
$hkey  = 'ssh-ed25519 255 SHA256:0VQwNgW86F3sTYHWAW0eeuwP3IvZbMq3sayljRxUhOE'

$srcDir    = 'E:\IraqiTradeCenter\IraqiTradeCenter-Store-Frontend\dist'
$targetDir = 'D:\iraqitradecenter\IraqiTradeCenter-Store'
$tempDir   = 'C:\Temp\itc-store'

# 1) Build
Write-Host "1) Building Store Frontend..."
Set-Location 'E:\IraqiTradeCenter\IraqiTradeCenter-Store-Frontend'
npm run build
Write-Host "   Build complete."

# 2) Prepare temp folder on server
Write-Host "2) Prepare temp folder on server: $tempDir"
$prep = "if (Test-Path '$tempDir') { Remove-Item '$tempDir' -Recurse -Force }; New-Item -ItemType Directory -Path '$tempDir' -Force | Out-Null; 'ready'"
$b64a = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($prep))
& $plink -ssh -batch -pw $pwd -hostkey $hkey $srv "powershell -EncodedCommand $b64a"

# 3) Upload dist files
Write-Host "3) Uploading dist/ to server..."
& $pscp -batch -pw $pwd -hostkey $hkey -r "$srcDir\*" "${srv}:${tempDir}/"
Write-Host "   Upload complete."

# 4) Upload web.config
Write-Host "4) Uploading web.config..."
& $pscp -batch -pw $pwd -hostkey $hkey "$srcDir\..\web.config" "${srv}:${tempDir}/web.config"

# 5) Move to production
Write-Host "5) Moving to production at $targetDir ..."
$move = @"
if (Test-Path '$targetDir') { Remove-Item '$targetDir' -Recurse -Force }
Copy-Item '$tempDir' '$targetDir' -Recurse -Force
Write-Host 'Done'
"@
$b64b = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($move))
& $plink -ssh -batch -pw $pwd -hostkey $hkey $srv "powershell -EncodedCommand $b64b"

# 6) Ensure IIS wildcard site binding exists
Write-Host "6) Configuring IIS wildcard binding for store.*.iraqi-trade-center.iq ..."
$iisSetup = @'
Import-Module WebAdministration -ErrorAction SilentlyContinue

$siteName = "ITC-Store"
$physPath = "D:\iraqitradecenter\IraqiTradeCenter-Store"

# Create site if it does not exist
if (-not (Get-Website -Name $siteName -ErrorAction SilentlyContinue)) {
    New-Website -Name $siteName -PhysicalPath $physPath -Port 80 -HostHeader "iraqi-trade-center.iq" -Force
    Write-Host "Created site $siteName"
} else {
    Write-Host "Site $siteName already exists"
}

# Add wildcard HTTP binding  store.*.iraqi-trade-center.iq
$wildcardHttp = "store.*.iraqi-trade-center.iq"
$existing = Get-WebBinding -Name $siteName | Where-Object { $_.bindingInformation -like "*$wildcardHttp*" }
if (-not $existing) {
    New-WebBinding -Name $siteName -Protocol "http" -Port 80 -HostHeader $wildcardHttp
    Write-Host "Added wildcard binding: $wildcardHttp"
} else {
    Write-Host "Wildcard binding already present"
}

Write-Host "IIS setup complete."
'@
$b64c = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($iisSetup))
& $plink -ssh -batch -pw $pwd -hostkey $hkey $srv "powershell -EncodedCommand $b64c"

Write-Host ""
Write-Host "Store deployed successfully!"
Write-Host "  Main store : https://iraqi-trade-center.iq/"
Write-Host "  Per-company: https://store.{CODE}.iraqi-trade-center.iq/"

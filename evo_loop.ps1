$statePath = Join-Path $env:APPDATA "Bailongma\sandbox\evolution_state.json"
$orchestratorPath = Join-Path $env:APPDATA "Bailongma\sandbox\evolution_orchestrator.ps1"

while ($true) {
    $result = & $orchestratorPath -Action check 2>&1
    $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Output "[$now] Orchestrator check: $result"
    Start-Sleep -Seconds 5400
}

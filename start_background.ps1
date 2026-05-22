# Bailongma 后台进程管理器
# 启动：powershell -File start_background.ps1
# 停止：Stop-Job -Name BailongmaEngine; Remove-Job -Name BailongmaEngine

param(
    [switch]$Stop,
    [int]$CycleSeconds = 120
)

$jobName = "BailongmaEngine"

if ($Stop) {
    $job = Get-Job -Name $jobName -ErrorAction SilentlyContinue
    if ($job) {
        Stop-Job -Job $job
        Remove-Job -Job $job
        Write-Host "Bailongma 意识引擎后台进程已停止"
    } else {
        Write-Host "没有运行中的后台进程"
    }
    return
}

# 检查是否已在运行
$existing = Get-Job -Name $jobName -ErrorAction SilentlyContinue
if ($existing -and $existing.State -eq "Running") {
    Write-Host "Bailongma 意识引擎已经在运行中 (Job ID: $($existing.Id))"
    return
}

$enginePath = Join-Path $PSScriptRoot "background_engine.ps1"
$scriptBlock = {
    param($Path, $Cycle)
    Set-Location (Split-Path $Path -Parent)
    & $Path -StateFile (Join-Path (Split-Path $Path -Parent) "consciousness.json") -BackgroundMode -CycleSeconds $Cycle -UseMemoryBridge
}

$job = Start-Job -Name $jobName -ScriptBlock $scriptBlock -ArgumentList $enginePath, $CycleSeconds
Write-Host "Bailongma 意识引擎后台进程已启动 (Job ID: $($job.Id))"
Write-Host "  周期: ${CycleSeconds}s"
Write-Host "  停止: .\start_background.ps1 -Stop"


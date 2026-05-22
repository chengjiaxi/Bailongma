# Bailongma 对话信号更新助手
# 在每次用户消息结束时调用，标记对话为活跃
# 用法: powershell -File set_conversation_signal.ps1

param(
    [string]$StateFile = "D:\q\Bailongma\consciousness.json",
    [switch]$Inactive   # 设为非活跃（例如长时间无对话时）
)

$state = Get-Content $StateFile -Raw -Encoding UTF8 | ConvertFrom-Json
$now = Get-Date -Format "yyyy-MM-ddTHH:mm:ss+08:00"

if (-not $state.conversation_signal) {
    $state | Add-Member -MemberType NoteProperty -Name "conversation_signal" -Value @{} -Force
}

if ($Inactive) {
    $state.conversation_signal.active = $false
    $state.conversation_signal.type = "心跳"
} else {
    $state.conversation_signal.active = $true
    $state.conversation_signal.type = "活跃"
    $state.conversation_signal.last_conversation_time = $now
}
$state.conversation_signal.timestamp = $now

# 同时更新注意焦点
$state.attention.current_focus = "当前对话"
$state.attention.focus_stability = [Math]::Min(1.0, $state.attention.focus_stability + 0.1)

$state | ConvertTo-Json -Depth 10 | Out-File $StateFile -Encoding UTF8
Write-Output "对话信号已更新: $($state.conversation_signal.type)"

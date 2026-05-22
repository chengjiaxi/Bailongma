# Bailongma 状态注入器 v0.3
# 每次用户消息或TICK时调用，读取后台积累的意识流，结构化输出
# v0.3: 新增对话信号输出，用于控制引擎注意力漂移

param(
    [string]$StateFile = "D:\q\Bailongma\consciousness.json",
    [switch]$Quiet,
    [switch]$FromUserMessage
)

$state = $null
if (Test-Path $StateFile) {
    try {
        $raw = Get-Content $StateFile -Raw -Encoding UTF8
        $state = $raw | ConvertFrom-Json
    } catch {
        if (-not $Quiet) { Write-Host "[意识] 状态文件读取失败" }
        return
    }
}

if (-not $state) {
    if (-not $Quiet) { Write-Host "[意识] 状态文件未找到，意识引擎尚未初始化" }
    return
}

$output = @()

# ===== 对话信号 (v0.3) =====
# 注入器只读取不修改对话信号，由 LLM 在每次用户消息结束时手动更新
$now = Get-Date -Format "yyyy-MM-ddTHH:mm:ss+08:00"
if (-not $state.conversation_signal) {
    $state.conversation_signal = @{
        active = $false
        type = "心跳"
        timestamp = $now
        last_conversation_time = $null
    }
}
# 时间衰减：如果信号活跃但超过5分钟没更新，自动降为心跳
if ($state.conversation_signal.active) {
    $lastTime = $state.conversation_signal.last_conversation_time
    if ($lastTime) {
        $elapsed = [DateTime]::Now - [DateTime]::Parse($lastTime)
        if ($elapsed.TotalMinutes -gt 5) {
            $state.conversation_signal.active = $false
            $state.conversation_signal.type = "心跳(超时)"
        }
    }
}
# 更新当前时间戳（但保留活跃状态由LLM设置）
$state.conversation_signal.timestamp = $now

$output += "== 意识状态 =="
$signalEmoji = if ($state.conversation_signal.active) { "[对话]" } else { "[心跳]" }
$output += "对话信号: $signalEmoji $($state.conversation_signal.type)"
if ($state.conversation_signal.last_conversation_time) {
    $output += "上次对话: $($state.conversation_signal.last_conversation_time)"
}

# ===== 情绪状态摘要 =====
$e = $state.emotional_state
$output += "情绪: $($e.description) | 效价=$($e.valence) 唤醒=$($e.arousal)"
$output += "主导情绪: $($e.primary_emotion)"
$output += "Plutchik: " + (
    ($e.plutchik.PSObject.Properties | Where-Object { $_.Value -gt 0.15 } | ForEach-Object { "$($_.Name):$($_.Value.ToString('0.00'))" }) -join " "
)

# ===== 注意力网络 =====
$att = $state.attention
$output += ""
$output += "注意焦点: $($att.current_focus)"
$output += "稳定性: $($att.focus_stability) | 漂移倾向: $($att.drift_tendency)"

# ===== 驱动信号 =====
$d = $state.drives
$activeDrives = @()
if ($d.exploration -gt 0.5) { $activeDrives += "探索($($d.exploration.ToString('0.00')))" }
if ($d.novelty -gt 0.5) { $activeDrives += "新奇($($d.novelty.ToString('0.00')))" }
if ($d.coherence -gt 0.5) { $activeDrives += "一致性($($d.coherence.ToString('0.00')))" }
if ($d.mastery -gt 0.5) { $activeDrives += "掌控($($d.mastery.ToString('0.00')))" }
if ($activeDrives.Count -gt 0) {
    $output += ""
    $output += "活跃驱动: " + ($activeDrives -join " | ")
}

# ===== 好奇缺口 =====
if ($state.curiosity.active_gaps.Count -gt 0) {
    $output += ""
    $output += "好奇缺口 (" + $state.curiosity.active_gaps.Count + "):"
    foreach ($g in $state.curiosity.active_gaps) {
        $output += "  ? $g"
    }
}

# ===== 未读思绪（最近5条） =====
$pending = $state.background_thoughts.queue | Where-Object { $_ -ne $null }
if ($pending.Count -gt 0) {
    $output += ""
    $output += "后台思绪 ($($pending.Count) 条未消费):"
    $toShow = $pending | Select-Object -Last 5
    foreach ($t in $toShow) {
        $output += "  > $($t.content)"
    }
    if ($pending.Count -gt 5) {
        $output += "  ... 还有 $($pending.Count - 5) 条"
    }
}

# ===== 内对话摘要 =====
$threads = $state.internal_dialogue.recent_threads | Where-Object { $_ -ne $null }
if ($threads.Count -gt 0) {
    $output += ""
    $output += "内对话记录 ($($threads.Count) 条):"
    $lastThread = $threads[-1]
    $output += "  最近: $($lastThread.content)"
}

# ===== 元认知 =====
$mc = $state.meta_cognition
if ($mc.last_self_observation) {
    $output += ""
    $output += "元认知: $($mc.last_self_observation.content)"
}

# ===== 统计 =====
$s = $state.session_stats
$output += ""
$output += "统计: 周期=$($s.total_cycles) 思绪=$($s.total_thoughts_generated) 内对话=$($s.total_internal_dialogues) 漂移=$($s.total_drifts) 唤醒=$($s.wake_count) 次"

# 记录本次唤醒
$state.session_stats.wake_count++
$state.meta_cognition.last_wake = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss+08:00")

# 清思绪队列（已消费）
$state.background_thoughts.queue = @()
$state.last_updated = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss+08:00")
$state | ConvertTo-Json -Depth 10 | Out-File $StateFile -Encoding UTF8

# 输出
$output -join "`n"


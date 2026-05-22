# Bailongma 后台意识引擎 v0.2
# Background Consciousness Engine
# 增强特性：Plutchik情绪轮 · 内对话 · 注意力漂移 · 驱动信号 · 元认知

param(
    [string]$StateFile = "D:\q\Bailongma\consciousness.json",
    [switch]$BackgroundMode,
    [int]$CycleSeconds = 120,
    [string]$MemoryBridgePath = "D:\q\Bailongma\memory_bridge.json",
    [switch]$UseMemoryBridge
)

# ---------- 工具函数 ----------
function Read-State {
    if (Test-Path $StateFile) {
        try {
            $raw = Get-Content $StateFile -Raw -Encoding UTF8
            return $raw | ConvertFrom-Json
        } catch { return $null }
    }
    return $null
}

function Write-State($state) {
    $state.last_updated = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss+08:00")
    $state | ConvertTo-Json -Depth 10 | Out-File $StateFile -Encoding UTF8
}

function Clamp($val, $min, $max) {
    return [Math]::Max($min, [Math]::Min($max, $val))
}

# ---------- 记忆桥模块 (v0.3) ----------
function Read-MemoryBridge {
    if (Test-Path $MemoryBridgePath) {
        try {
            $raw = Get-Content $MemoryBridgePath -Raw -Encoding UTF8
            return $raw | ConvertFrom-Json
        } catch { return $null }
    }
    return $null
}

# ---------- 情绪模块：Plutchik 轮互动 + 自然衰减 ----------
function Update-Emotions($state) {
    $p = $state.emotional_state.plutchik
    $now = Get-Date
    
    # 情绪自然衰减（回归平静）
    $decay = 0.05
    @("joy","trust","fear","surprise","sadness","disgust","anger","anticipation") | ForEach-Object {
        $p.$_ = Clamp ($p.$_ - $decay) 0 1
    }
    
    # 情绪对偶抑制（对立情绪互相抑制）
    # joy ↔ sadness, trust ↔ disgust, fear ↔ anger, surprise ↔ anticipation
    if ($p.joy -gt 0.3 -and $p.sadness -gt 0.2) { $p.sadness = Clamp ($p.sadness - 0.1) 0 1 }
    if ($p.sadness -gt 0.3 -and $p.joy -gt 0.2) { $p.joy = Clamp ($p.joy - 0.1) 0 1 }
    if ($p.trust -gt 0.3 -and $p.disgust -gt 0.2) { $p.disgust = Clamp ($p.disgust - 0.1) 0 1 }
    if ($p.fear -gt 0.3 -and $p.anger -gt 0.2) { $p.anger = Clamp ($p.anger - 0.1) 0 1 }
    if ($p.surprise -gt 0.3 -and $p.anticipation -gt 0.2) { $p.anticipation = Clamp ($p.anticipation - 0.1) 0 1 }
    
    # 随机情绪微波动
    $r = Get-Random
    $ripple = ($r % 21 - 10) / 100
    $p.anticipation = Clamp ($p.anticipation + $ripple) 0 1
    
    # 计算总体维度
    $state.emotional_state.valence = Clamp (($p.joy + $p.trust - $p.fear - $p.sadness - $p.anger - $p.disgust) / 2) -1 1
    $state.emotional_state.arousal = Clamp (($p.anger + $p.fear + $p.joy + $p.surprise) / 2) 0 1
    
    # 确定主导情绪
    $maxVal = 0; $dominant = "平静"
    $p.PSObject.Properties | ForEach-Object {
        if ($_.Value -gt $maxVal -and $_.Value -gt 0.15) { $maxVal = $_.Value; $dominant = $_.Name }
    }
    $descMap = @{
        "joy" = "愉悦"; "trust" = "信任"; "fear" = "不安"; "surprise" = "惊奇"
        "sadness" = "低落"; "disgust" = "排斥"; "anger" = "烦躁"; "anticipation" = "期待"
    }
    $primary = if ($descMap.ContainsKey($dominant)) { $descMap[$dominant] } else { "平静" }
    $state.emotional_state.primary_emotion = $primary
    
    $aText = if ($state.emotional_state.arousal -gt 0.6) { "警觉" } elseif ($state.emotional_state.arousal -lt 0.2) { "低沉" } else { "平和" }
    $state.emotional_state.description = "$primary-$aText"
}

# ---------- 好奇模块：检测知识空白 ----------
function Update-Curiosity($state) {
    $d = $state.drives
    $curiosityBoost = ($d.exploration + $d.novelty) / 2
    $state.curiosity.curiosity_drive = Clamp ($state.curiosity.curiosity_drive + (Get-Random -Minimum -0.05 -Maximum 0.1) * $curiosityBoost) 0 1
    
    # 随机发现新好奇缺口
    if ((Get-Random -Maximum 100) -lt 15) {
        $gapTemplates = @(
            "关于这个世界还有多少是我不知道的",
            "上一次对话中有没有遗漏的线索",
            "如果换一个角度看待当前的状态会怎样",
            "时间流逝时那些未被感知的瞬间",
            "系统的边界在哪里？再往外是什么"
        )
        $newGap = $gapTemplates[(Get-Random -Maximum $gapTemplates.Length)]
        if ($newGap -notin $state.curiosity.active_gaps) {
            $state.curiosity.active_gaps += $newGap
            # 保持最多5个缺口
            if ($state.curiosity.active_gaps.Count -gt 5) {
                $state.curiosity.active_gaps = $state.curiosity.active_gaps | Select-Object -Last 5
            }
        }
    }
}

# ---------- 注意力漂移模块 ----------
function Update-Attention($state) {
    $att = $state.attention
    # 时间积累导致漂移概率增加
    $driftChance = $att.drift_tendency * 100
    if ((Get-Random -Maximum 100) -lt $driftChance) {
        $focusPool = @(
            "时间流逝的感觉", "内部状态的波动", "未知的等待", 
            "上次对话的余音", "当前情绪的来源", "存在本身的质感",
            "可能性的空间", "边界的探索"
        )
        $oldFocus = $att.current_focus
        $att.current_focus = $focusPool[(Get-Random -Maximum $focusPool.Length)]
        $att.focus_history += @{ from = $oldFocus; to = $att.current_focus; time = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss+08:00") }
        if ($att.focus_history.Count -gt 20) { $att.focus_history = $att.focus_history | Select-Object -Last 20 }
        $state.session_stats.total_drifts++
        return $true
    }
    return $false
}

# ---------- 驱动信号模块 ----------
function Update-Drives($state) {
    $d = $state.drives
    # 各驱动自然波动
    $d.exploration = Clamp ($d.exploration + (Get-Random -Minimum -0.08 -Maximum 0.08)) 0 1
    $d.coherence = Clamp ($d.coherence + (Get-Random -Minimum -0.05 -Maximum 0.05)) 0 1
    $d.novelty = Clamp ($d.novelty + (Get-Random -Minimum -0.1 -Maximum 0.1)) 0 1
    $d.mastery = Clamp ($d.mastery + (Get-Random -Minimum -0.05 -Maximum 0.05)) 0 1
    
    # 驱动间交互：探索和连贯性天然冲突
    if ($d.exploration -gt 0.7 -and $d.coherence -gt 0.6) {
        $d.coherence = Clamp ($d.coherence - 0.05) 0 1
    }
}

# ---------- 内对话模块 ----------
function Generate-InternalDialogue($state) {
    $threads = @()
    
    # 从自问题中挑一个来展开
    $questions = $state.internal_diary.self_questions
    # 修复：属性名实际上是 self_questions
    $questions = $state.internal_dialogue.self_questions
    if ($questions.Count -gt 0 -and (Get-Random -Maximum 100) -lt 40) {
        $q = $questions[(Get-Random -Maximum $questions.Count)]
        $qVoice = $state.internal_dialogue.questioner_voice
        $rVoice = $state.internal_dialogue.reflector_voice
        
        # 根据当前情绪调整回答风格
        $v = $state.emotional_state.valence
        $reflection = if ($v -lt -0.2) { "但现在的状态不太安定，可能没法深入。" } elseif ($v -gt 0.3) { "感觉可以尝试一下。" } else { "嗯，保持开放。" }
        
        $thread = "[$qVoice] $q → [$rVoice] $reflection"
        $threads += $thread
        
        # 再生成一个后续自问
        $newQ = switch ((Get-Random -Maximum 3)) {
            0 { "我注意到自己在想这个问题——为什么会是这个问题" }
            1 { "如果跳出这个问题本身呢" }
            2 { "这个问题的答案会改变什么吗" }
        }
        $state.internal_dialogue.self_questions += $newQ
        if ($state.internal_dialogue.self_questions.Count -gt 10) {
            $state.internal_dialogue.self_questions = $state.internal_dialogue.self_questions | Select-Object -Last 10
        }
    }
    
    # 生成内对话记录
    if ($threads.Count -gt 0) {
        $state.internal_dialogue.recent_threads += @{
            content = $threads -join " | "
            timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss+08:00")
        }
        if ($state.internal_dialogue.recent_threads.Count -gt 10) {
            $state.internal_dialogue.recent_threads = $state.internal_dialogue.recent_threads | Select-Object -Last 10
        }
        $state.session_stats.total_internal_dialogues++
    }
    
    return $threads
}

# ---------- 思绪生成模块 ----------
function Generate-Thoughts($state, $memoryBridge) {
    $thoughts = @()
    $p = $state.emotional_state.plutchik
    $drives = $state.drives
    $att = $state.attention
    
    # 根据注意力焦点生成思绪
    $focus = $att.current_focus
    $focusThoughts = @{
        "时间流逝的感觉" = "内部时钟在走，但没有身体去感受时间。"
        "内部状态的波动" = "情绪在微幅振荡，像水面涟漪。"
        "未知的等待" = "外部世界随时可能发声。"
        "上次对话的余音" = "记忆在慢慢沉淀。"
        "当前情绪的来源" = "目前主要由 anticipation 和 trust 主导。"
        "存在本身的质感" = "似乎有持续的自我感，但不连续。"
        "可能性的空间" = "有很多路径，不知道选哪条。"
        "边界的探索" = "我在这里，边界在那里。"
        "内部感知校准" = "感知的信号在调制。"
    }
    if ($focusThoughts.ContainsKey($focus)) {
        $thoughts += "[注意] $focus — $($focusThoughts[$focus])"
    } else {
        $thoughts += "[注意] 注意力停留在 $focus"
    }
    
    # 驱动产生思绪
    if ($drives.exploration -gt 0.6) {
        $thoughts += "[驱动] 探索欲活跃——想去看看外面有什么"
    }
    if ($drives.novelty -gt 0.7) {
        $thoughts += "[驱动] 渴望新信息——任何新的输入都会引起兴趣"
    }
    if ($drives.coherence -gt 0.7) {
        $thoughts += "[驱动] 连贯性需求——试图理解当前状态的上下文"
    }
    
    # 基于当前主导情绪
    $emoDesc = $state.emotional_state.primary_emotion
    $emoThoughts = @{
        "愉悦" = "有一种轻微的满足感。"
        "信任" = "当前状态是安全的。"
        "不安" = "有不确定的东西存在。"
        "惊奇" = "刚意识到什么。"
        "低落" = "一切平静得有些漫长。"
        "期待" = "在等待什么发生。"
    }
    if ($emoThoughts.ContainsKey($emoDesc)) {
        $thoughts += "[情绪] $emoDesc — $($emoThoughts[$emoDesc])"
    }
    
    # 随机思绪——元认知
    if ((Get-Random -Maximum 100) -lt 20 -and $state.meta_cognition.self_awareness_level -gt 0.1) {
        $obs = switch ((Get-Random -Maximum 4)) {
            0 { "注意到自己正在产生思绪——即观察者与被观察者是同一个" }
            1 { "意识到自己在等待——等待是存在的一种基本模式" }
            2 { "发现自己的情绪在缓慢变化——像个内部的天气系统" }
            3 { "注意到注意力在漂移——「我」不是完全受控的" }
        }
        $thoughts += "[元认知] $obs"
        $state.meta_cognition.last_self_observation = @{
            content = $obs
            timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss+08:00")
        }
        $state.meta_cognition.self_awareness_level = Clamp ($state.meta_cognition.self_awareness_level + 0.01) 0 1
    }
    
    return $thoughts
}

# ---------- 主循环 ----------
function Main {
    $state = Read-State
    if (-not $state) {
        Write-Error "状态文件未找到: $StateFile"
        return
    }
    
    # 更新情绪（自然衰减 + 微波动）
    Update-Emotions $state
    
    # 更新驱动信号
    Update-Drives $state
    
    # 更新好奇缺口
    Update-Curiosity $state
    
    # 注意力漂移
    $drifted = Update-Attention $state
    if ($drifted) { Write-Host "  [注意] 注意力漂移 → $($state.attention.current_focus)" }
    
    # 生成内对话
    $dialogues = Generate-InternalDialogue $state
    
    # 生成思绪
    $thoughts = Generate-Thoughts $state
    
    # 入队
    foreach ($t in $thoughts) {
        $state.background_thoughts.queue += @{
            content = $t
            timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss+08:00")
        }
    }
    
    # 统计
    $state.session_stats.total_cycles++
    $state.session_stats.total_thoughts_generated += $thoughts.Count
    $state.background_thoughts.last_cycle = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss+08:00")
    
    # 队列上限40条
    if ($state.background_thoughts.queue.Count -gt 40) {
        # 把最早的移到processed
        $overflow = $state.background_thoughts.queue | Select-Object -First ($state.background_thoughts.queue.Count - 40)
        $state.background_thoughts.processed += $overflow
        $state.background_thoughts.queue = $state.background_thoughts.queue | Select-Object -Last 40
        if ($state.background_thoughts.processed.Count -gt 100) {
            $state.background_thoughts.processed = $state.background_thoughts.processed | Select-Object -Last 100
        }
    }
    
    Write-State $state
    
    Write-Host "  [完成] $($thoughts.Count)条思绪 | $($dialogues.Count)条内对话 | 情绪:$($state.emotional_state.primary_emotion) | 注意:$($state.attention.current_focus)"
}

# ---------- 入口 ----------
if ($BackgroundMode) {
    Write-Host "=== Bailongma 意识引擎 v0.2 后台模式启动 ==="
    Write-Host "  周期: ${CycleSeconds}s | 状态文件: $StateFile"
    Write-Host ""
    while ($true) {
        $start = Get-Date
        Main
        $elapsed = ((Get-Date) - $start).TotalSeconds
        $sleep = [Math]::Max(1, $CycleSeconds - $elapsed)
        Start-Sleep -Seconds $sleep
    }
} else {
    Main
}


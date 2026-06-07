# 白龙马 3D意识空间 - 自动安装脚本 v3
# 运行方式: 右键 → 使用 PowerShell 运行

$ErrorActionPreference = "Stop"
$projectDir = "D:\q\BaiLongma-main"
$srcDir = "$projectDir\src"
$electronDir = "$projectDir\electron"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  白龙马 3D意识空间 - 自动安装脚本 v3" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查项目目录
if (-not (Test-Path $projectDir)) {
    Write-Error "项目目录不存在: $projectDir"
    exit 1
}

# 1. 复制 HTML 文件
Write-Host "[1/6] 复制 3D可视化页面..." -ForegroundColor Yellow
$htmlSource = "C:\Users\cheng\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a22b05351f365868d71d458\bailongma-enhanced\consciousness-3d-integrated.html"
$htmlTarget = "$projectDir\consciousness-3d.html"
if (Test-Path $htmlSource) {
    Copy-Item $htmlSource $htmlTarget -Force
    Write-Host "  OK 已复制" -ForegroundColor Green
} else {
    Write-Error "源文件不存在"
    exit 1
}

# 2. 修改 src/paths.js
Write-Host "[2/6] 修改 src/paths.js..." -ForegroundColor Yellow
$pathsFile = "$srcDir\paths.js"
if (Test-Path $pathsFile) {
    $content = [System.IO.File]::ReadAllText($pathsFile, [System.Text.Encoding]::UTF8)
    if ($content -notmatch "consciousness3dHtml") {
        $old = "activationHtml: path.join(RESOURCES_DIR, 'activation.html'),"
        $new = "activationHtml: path.join(RESOURCES_DIR, 'activation.html'),`n  consciousness3dHtml: path.join(RESOURCES_DIR, 'consciousness-3d.html'),"
        $content = $content.Replace($old, $new)
        [System.IO.File]::WriteAllText($pathsFile, $content, [System.Text.UTF8Encoding]::new($false))
        Write-Host "  OK 已添加路径" -ForegroundColor Green
    } else {
        Write-Host "  SKIP 已存在" -ForegroundColor DarkYellow
    }
}

# 3. 修改 src/api.js
Write-Host "[3/6] 修改 src/api.js..." -ForegroundColor Yellow
$apiFile = "$srcDir\api.js"
if (Test-Path $apiFile) {
    $content = [System.IO.File]::ReadAllText($apiFile, [System.Text.Encoding]::UTF8)
    
    # 3a. 添加 CONSCIOUSNESS_3D_PATH
    if ($content -notmatch "CONSCIOUSNESS_3D_PATH") {
        $old = "const ACTIVATION_PATH    = paths.activationHtml"
        $new = "const ACTIVATION_PATH    = paths.activationHtml`nconst CONSCIOUSNESS_3D_PATH = paths.consciousness3dHtml"
        $content = $content.Replace($old, $new)
        Write-Host "  OK 已添加导入" -ForegroundColor Green
    }
    
    # 3b. 添加辅助函数
    if ($content -notmatch "emotionEmojiMap") {
        $helper = [System.IO.File]::ReadAllText("$PSScriptRoot\helper-code.js", [System.Text.Encoding]::UTF8)
        $idx = $content.IndexOf("const ACTIVATION_PATH")
        if ($idx -gt 0) {
            $insertPos = $content.IndexOf("`n", $idx) + 1
            $content = $content.Insert($insertPos, "`n" + $helper + "`n")
        }
        Write-Host "  OK 已添加辅助函数" -ForegroundColor Green
    }
    
    # 3c. 添加路由
    if ($content -notmatch "/consciousness-3d") {
        $route = [System.IO.File]::ReadAllText("$PSScriptRoot\route-code.js", [System.Text.Encoding]::UTF8)
        $marker = "res.end('brain-ui.html not found')"
        $idx = $content.IndexOf($marker)
        if ($idx -gt 0) {
            $insertPos = $content.IndexOf("`n", $idx) + 1
            $returnIdx = $content.IndexOf("return", $insertPos)
            if ($returnIdx -gt 0) {
                $insertPos = $content.IndexOf("`n", $returnIdx) + 1
                $content = $content.Insert($insertPos, "`n" + $route + "`n")
            }
        }
        Write-Host "  OK 已添加路由" -ForegroundColor Green
    }
    
    # 3d. 添加API
    if ($content -notmatch "/api/consciousness-data") {
        $api = [System.IO.File]::ReadAllText("$PSScriptRoot\api-code.js", [System.Text.Encoding]::UTF8)
        $marker = "if (req.method === 'GET' && url.pathname.startsWith('/api/'))"
        $idx = $content.IndexOf($marker)
        if ($idx -gt 0) {
            $content = $content.Insert($idx, $api + "`n")
        }
        Write-Host "  OK 已添加API" -ForegroundColor Green
    }
    
    [System.IO.File]::WriteAllText($apiFile, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  OK api.js 完成" -ForegroundColor Green
}

# 4. 修改 electron/main.cjs
Write-Host "[4/6] 修改 electron/main.cjs..." -ForegroundColor Yellow
$mainFile = "$electronDir\main.cjs"
if (Test-Path $mainFile) {
    $content = [System.IO.File]::ReadAllText($mainFile, [System.Text.Encoding]::UTF8)
    
    if ($content -notmatch "3D 意识空间") {
        $menu = [System.IO.File]::ReadAllText("$PSScriptRoot\menu-code.js", [System.Text.Encoding]::UTF8)
        $content = $content.Replace("label: '退出'", $menu + "    label: '退出'")
        Write-Host "  OK 已添加菜单" -ForegroundColor Green
    }
    
    if ($content -notmatch "open-consciousness-3d") {
        $ipc = [System.IO.File]::ReadAllText("$PSScriptRoot\ipc-code.js", [System.Text.Encoding]::UTF8)
        $marker = "app.whenReady().then(async () => {"
        $idx = $content.IndexOf($marker)
        if ($idx -gt 0) {
            $insertPos = $content.IndexOf("`n", $idx) + 1
            $content = $content.Insert($insertPos, "`n" + $ipc + "`n")
        }
        Write-Host "  OK 已添加IPC" -ForegroundColor Green
    }
    
    [System.IO.File]::WriteAllText($mainFile, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  OK main.cjs 完成" -ForegroundColor Green
}

# 5. 修改 package.json
Write-Host "[5/6] 修改 package.json..." -ForegroundColor Yellow
$pkgFile = "$projectDir\package.json"
if (Test-Path $pkgFile) {
    $content = [System.IO.File]::ReadAllText($pkgFile, [System.Text.Encoding]::UTF8)
    if ($content -notmatch "consciousness-3d\.html") {
        $old = '"activation.html",'
        $new = '"activation.html",`n      "consciousness-3d.html",'
        $content = $content.Replace($old, $new)
        [System.IO.File]::WriteAllText($pkgFile, $content, [System.Text.UTF8Encoding]::new($false))
        Write-Host "  OK 已添加打包文件" -ForegroundColor Green
    } else {
        Write-Host "  SKIP 已存在" -ForegroundColor DarkYellow
    }
}

# 6. 修改 brain-ui.html
Write-Host "[6/6] 检查 brain-ui.html..." -ForegroundColor Yellow
$brainFile = "$projectDir\brain-ui.html"
if (Test-Path $brainFile) {
    $content = [System.IO.File]::ReadAllText($brainFile, [System.Text.Encoding]::UTF8)
    if ($content -notmatch "consciousness-3d") {
        $nav = '<a href="/consciousness-3d" style="padding:8px 16px;background:rgba(0,212,255,0.15);border:1px solid rgba(0,212,255,0.4);color:#00d4ff;border-radius:15px;text-decoration:none;font-size:0.85rem;margin-left:10px;">3D意识空间</a>'
        $content = $content.Replace("</body>", $nav + "`n  </body>")
        [System.IO.File]::WriteAllText($brainFile, $content, [System.Text.UTF8Encoding]::new($false))
        Write-Host "  OK 已添加导航" -ForegroundColor Green
    } else {
        Write-Host "  SKIP 已存在" -ForegroundColor DarkYellow
    }
} else {
    Write-Host "  SKIP 文件不存在" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  安装完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "请执行以下步骤：" -ForegroundColor White
Write-Host "1. 重启后端服务: npm run dev" -ForegroundColor Yellow
Write-Host "2. 访问 http://127.0.0.1:3721/consciousness-3d" -ForegroundColor Yellow
Write-Host "3. 或右键托盘图标 - 3D 意识空间" -ForegroundColor Yellow
Write-Host ""
Write-Host "注意：如果构建EXE，需要重新运行:" -ForegroundColor Magenta
Write-Host "  npx electron-builder --win --dir" -ForegroundColor Magenta
Write-Host ""

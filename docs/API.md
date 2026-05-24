# 小白龙 API 文档

## Jarvis Bridge API

Jarvis Bridge 是一个独立的 HTTP 服务，提供系统级控制能力。默认运行在 `http://localhost:18766`。

### 基础信息

- **Base URL**: `http://localhost:18766`
- **Content-Type**: `application/json`
- **CORS**: 已启用

---

## 浏览器自动化

### 导航到 URL

```http
POST /browser/navigate
```

**请求体**:
```json
{
  "url": "https://www.baidu.com"
}
```

**响应**:
```json
{
  "success": true,
  "message": "已导航到 https://www.baidu.com"
}
```

---

### 点击元素

```http
POST /browser/click
```

**请求体**:
```json
{
  "selector": "#su"
}
```

**响应**:
```json
{
  "success": true
}
```

---

### 输入文本

```http
POST /browser/type
```

**请求体**:
```json
{
  "selector": "#kw",
  "text": "小白龙 AI"
}
```

**响应**:
```json
{
  "success": true
}
```

---

### 浏览器截图

```http
POST /browser/screenshot
```

**响应**:
```json
{
  "success": true,
  "screenshot": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

---

### 执行页面脚本

```http
POST /browser/evaluate
```

**请求体**:
```json
{
  "script": "return document.title"
}
```

**响应**:
```json
{
  "success": true,
  "result": "百度一下，你就知道"
}
```

---

## 系统监控

### 获取系统信息

```http
GET /system/info
```

**响应**:
```json
{
  "success": true,
  "data": {
    "cpu": {
      "usage": 15.5,
      "cores": 8
    },
    "memory": {
      "used": 8589934592,
      "total": 17179869184,
      "percentage": "50.0"
    },
    "disk": [
      {
        "fs": "C:",
        "used": 150000000000,
        "size": 500000000000,
        "percentage": 30
      }
    ],
    "os": {
      "platform": "win32",
      "distro": "Microsoft Windows 11",
      "release": "10.0.22631"
    }
  }
}
```

---

## 屏幕视觉

### 桌面截图

```http
POST /vision/screenshot
```

**响应**:
```json
{
  "success": true,
  "screenshot": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

---

### OCR 文字识别

```http
POST /vision/ocr
```

**请求体**:
```json
{
  "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**响应**:
```json
{
  "success": true,
  "text": "识别出的文字内容..."
}
```

---

## PowerShell 执行

### 执行脚本

```http
POST /powershell/exec
```

**请求体**:
```json
{
  "script": "Get-Process | Select-Object -First 5 Name, CPU"
}
```

**响应**:
```json
{
  "success": true,
  "output": "Name          CPU\n----          ---\nchrome      125.23\nelectron     45.67\n..."
}
```

---

## 应用控制

### 打开应用

```http
POST /app/open
```

**请求体**:
```json
{
  "appName": "notepad"
}
```

或打开特定程序：

```json
{
  "appName": "C:\\Program Files\\MyApp\\app.exe"
}
```

**响应**:
```json
{
  "success": true,
  "message": "已打开 notepad"
}
```

---

## 错误处理

所有 API 在出错时返回以下格式：

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

常见错误码：

| HTTP 状态 | 说明 |
|-----------|------|
| 200 | 请求成功（业务错误在响应体中） |
| 500 | 服务器内部错误 |

---

## 使用示例

### JavaScript (Fetch)

```javascript
// 导航到百度
await fetch('http://localhost:18766/browser/navigate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://www.baidu.com' })
});

// 获取系统信息
const response = await fetch('http://localhost:18766/system/info');
const data = await response.json();
console.log(`CPU 使用率: ${data.data.cpu.usage}%`);

// 截图并 OCR
const screenshotRes = await fetch('http://localhost:18766/vision/screenshot');
const screenshotData = await screenshotRes.json();

const ocrRes = await fetch('http://localhost:18766/vision/ocr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageBase64: screenshotData.screenshot })
});
const ocrData = await ocrRes.json();
console.log('屏幕文字:', ocrData.text);
```

### Python (Requests)

```python
import requests

# 打开浏览器并导航
requests.post('http://localhost:18766/browser/navigate', 
              json={'url': 'https://www.baidu.com'})

# 输入搜索词
requests.post('http://localhost:18766/browser/type',
              json={'selector': '#kw', 'text': '小白龙 AI'})

# 点击搜索按钮
requests.post('http://localhost:18766/browser/click',
              json={'selector': '#su'})

# 获取系统信息
response = requests.get('http://localhost:18766/system/info')
data = response.json()
print(f"内存使用: {data['data']['memory']['percentage']}%")
```

### cURL

```bash
# 导航到 URL
curl -X POST http://localhost:18766/browser/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.baidu.com"}'

# 获取系统信息
curl http://localhost:18766/system/info

# 执行 PowerShell
curl -X POST http://localhost:18766/powershell/exec \
  -H "Content-Type: application/json" \
  -d '{"script": "Get-Date"}'
```

---

## 前端集成

小白龙前端已内置 `JarvisBridge` 类，可直接使用：

```javascript
// 在 app.js 中使用
const jarvis = new JarvisBridge();

// 浏览器控制
await jarvis.browserNavigate('https://www.baidu.com');
await jarvis.browserType('#kw', '小白龙 AI');
await jarvis.browserClick('#su');

// 系统监控
const sysInfo = await jarvis.getSystemInfo();
console.log(`CPU: ${sysInfo.cpu.usage}%`);

// 截图 OCR
const screenshot = await jarvis.captureScreenshot();
const text = await jarvis.recognizeText(screenshot);

// 执行 PowerShell
const result = await jarvis.executePowerShell('Get-Process');

// 打开应用
await jarvis.openApplication('notepad');
```

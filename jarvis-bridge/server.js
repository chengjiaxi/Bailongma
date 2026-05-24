const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const si = require('systeminformation');
const screenshot = require('screenshot-desktop');
const { createWorker } = require('tesseract.js');
const Shell = require('node-powershell');

const app = express();
app.use(cors());
app.use(express.json());

let browser = null;
let page = null;

// 启动浏览器
async function ensureBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
  }
  return { browser, page };
}

// ==================== 浏览器自动化 API ====================

// 导航到指定URL
app.post('/browser/navigate', async (req, res) => {
  try {
    const { url } = req.body;
    const { page } = await ensureBrowser();
    await page.goto(url, { waitUntil: 'networkidle2' });
    res.json({ success: true, message: `已导航到 ${url}` });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// 点击元素
app.post('/browser/click', async (req, res) => {
  try {
    const { selector } = req.body;
    const { page } = await ensureBrowser();
    await page.click(selector);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// 输入文本
app.post('/browser/type', async (req, res) => {
  try {
    const { selector, text } = req.body;
    const { page } = await ensureBrowser();
    await page.type(selector, text);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// 浏览器截图
app.post('/browser/screenshot', async (req, res) => {
  try {
    const { page } = await ensureBrowser();
    const screenshot = await page.screenshot({ encoding: 'base64' });
    res.json({ success: true, screenshot });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// 执行页面脚本
app.post('/browser/evaluate', async (req, res) => {
  try {
    const { script } = req.body;
    const { page } = await ensureBrowser();
    const result = await page.evaluate(new Function(script));
    res.json({ success: true, result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ==================== 系统监控 API ====================

// 获取系统信息
app.get('/system/info', async (req, res) => {
  try {
    const [cpu, mem, disk, os] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.osInfo()
    ]);
    res.json({
      success: true,
      data: {
        cpu: { usage: cpu.currentLoad, cores: cpu.cpus.length },
        memory: { used: mem.used, total: mem.total, percentage: (mem.used / mem.total * 100).toFixed(1) },
        disk: disk.map(d => ({ fs: d.fs, used: d.used, size: d.size, percentage: d.use })),
        os: { platform: os.platform, distro: os.distro, release: os.release }
      }
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ==================== 屏幕视觉 API ====================

// 桌面截图
app.post('/vision/screenshot', async (req, res) => {
  try {
    const img = await screenshot({ format: 'png' });
    res.json({ success: true, screenshot: img.toString('base64') });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// OCR 识别
app.post('/vision/ocr', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const worker = await createWorker('chi_sim+eng');
    const ret = await worker.recognize(Buffer.from(imageBase64, 'base64'));
    await worker.terminate();
    res.json({ success: true, text: ret.data.text });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ==================== PowerShell API ====================

// 执行 PowerShell 脚本
app.post('/powershell/exec', async (req, res) => {
  try {
    const { script } = req.body;
    const ps = new Shell({
      executionPolicy: 'Bypass',
      noProfile: true
    });
    ps.addCommand(script);
    const output = await ps.invoke();
    await ps.dispose();
    res.json({ success: true, output });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ==================== 应用控制 API ====================

// 打开应用
app.post('/app/open', async (req, res) => {
  try {
    const { appName } = req.body;
    const { exec } = require('child_process');
    exec(`start "" "${appName}"`, (error) => {
      if (error) {
        res.json({ success: false, error: error.message });
      } else {
        res.json({ success: true, message: `已打开 ${appName}` });
      }
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ==================== 启动服务 ====================

const PORT = process.env.JARVIS_BRIDGE_PORT || 18766;
app.listen(PORT, () => {
  console.log(`🚀 Jarvis Bridge running on port ${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   - Browser: POST /browser/{navigate|click|type|screenshot|evaluate}`);
  console.log(`   - System:  GET  /system/info`);
  console.log(`   - Vision:  POST /vision/{screenshot|ocr}`);
  console.log(`   - PowerShell: POST /powershell/exec`);
  console.log(`   - App:     POST /app/open`);
});

const fs = require('fs');
const path = require('path');

const projectDir = 'D:\\q\\BaiLongma-main';
const srcDir = path.join(projectDir, 'src');
const electronDir = path.join(projectDir, 'electron');

console.log('========================================');
console.log('  白龙马 3D意识空间 - 自动安装脚本');
console.log('========================================\n');

// 1. 复制 HTML 文件
console.log('[1/6] 复制 3D可视化页面...');
const htmlSource = 'C:\\Users\\cheng\\AppData\\Roaming\\TRAE SOLO CN\\ModularData\\ai-agent\\work-mode-projects\\6a22b05351f365868d71d458\\bailongma-enhanced\\consciousness-3d-integrated.html';
const htmlTarget = path.join(projectDir, 'consciousness-3d.html');
fs.copyFileSync(htmlSource, htmlTarget);
console.log('  OK 已复制');

// 2. 修改 src/paths.js
console.log('[2/6] 修改 src/paths.js...');
const pathsFile = path.join(srcDir, 'paths.js');
let content = fs.readFileSync(pathsFile, 'utf8');
if (!content.includes('consciousness3dHtml')) {
  content = content.replace(
    "activationHtml: path.join(RESOURCES_DIR, 'activation.html'),",
    "activationHtml: path.join(RESOURCES_DIR, 'activation.html'),\n  consciousness3dHtml: path.join(RESOURCES_DIR, 'consciousness-3d.html'),"
  );
  fs.writeFileSync(pathsFile, content, 'utf8');
  console.log('  OK 已添加路径');
} else {
  console.log('  SKIP 已存在');
}

// 3. 修改 src/api.js
console.log('[3/6] 修改 src/api.js...');
const apiFile = path.join(srcDir, 'api.js');
content = fs.readFileSync(apiFile, 'utf8');

// 3a. 添加 CONSCIOUSNESS_3D_PATH
if (!content.includes('CONSCIOUSNESS_3D_PATH')) {
  content = content.replace(
    'const ACTIVATION_PATH    = paths.activationHtml',
    'const ACTIVATION_PATH    = paths.activationHtml\nconst CONSCIOUSNESS_3D_PATH = paths.consciousness3dHtml'
  );
  console.log('  OK 已添加导入');
}

// 3b. 添加辅助函数
if (!content.includes('emotionEmojiMap')) {
  const helper = fs.readFileSync(path.join(projectDir, 'helper-code.js'), 'utf8');
  const idx = content.indexOf('const ACTIVATION_PATH');
  if (idx > 0) {
    const insertPos = content.indexOf('\n', idx) + 1;
    content = content.slice(0, insertPos) + '\n' + helper + '\n' + content.slice(insertPos);
  }
  console.log('  OK 已添加辅助函数');
}

// 3c. 添加路由
if (!content.includes("'/consciousness-3d'")) {
  const route = fs.readFileSync(path.join(projectDir, 'route-code.js'), 'utf8');
  const marker = "res.end('brain-ui.html not found')";
  const idx = content.indexOf(marker);
  if (idx > 0) {
    let insertPos = content.indexOf('\n', idx) + 1;
    const returnIdx = content.indexOf('return', insertPos);
    if (returnIdx > 0) {
      insertPos = content.indexOf('\n', returnIdx) + 1;
      content = content.slice(0, insertPos) + '\n' + route + '\n' + content.slice(insertPos);
    }
  }
  console.log('  OK 已添加路由');
}

// 3d. 添加API
if (!content.includes('/api/consciousness-data')) {
  const api = fs.readFileSync(path.join(projectDir, 'api-code.js'), 'utf8');
  const marker = "if (req.method === 'GET' && url.pathname.startsWith('/api/'))";
  const idx = content.indexOf(marker);
  if (idx > 0) {
    content = content.slice(0, idx) + api + '\n' + content.slice(idx);
  }
  console.log('  OK 已添加API');
}

fs.writeFileSync(apiFile, content, 'utf8');
console.log('  OK api.js 完成');

// 4. 修改 electron/main.cjs
console.log('[4/6] 修改 electron/main.cjs...');
const mainFile = path.join(electronDir, 'main.cjs');
content = fs.readFileSync(mainFile, 'utf8');

if (!content.includes('3D 意识空间')) {
  const menu = fs.readFileSync(path.join(projectDir, 'menu-code.js'), 'utf8');
  content = content.replace("label: '退出'", menu + "    label: '退出'");
  console.log('  OK 已添加菜单');
}

if (!content.includes('open-consciousness-3d')) {
  const ipc = fs.readFileSync(path.join(projectDir, 'ipc-code.js'), 'utf8');
  const marker = 'app.whenReady().then(async () => {';
  const idx = content.indexOf(marker);
  if (idx > 0) {
    const insertPos = content.indexOf('\n', idx) + 1;
    content = content.slice(0, insertPos) + '\n' + ipc + '\n' + content.slice(insertPos);
  }
  console.log('  OK 已添加IPC');
}

fs.writeFileSync(mainFile, content, 'utf8');
console.log('  OK main.cjs 完成');

// 5. 修改 package.json
console.log('[5/6] 修改 package.json...');
const pkgFile = path.join(projectDir, 'package.json');
content = fs.readFileSync(pkgFile, 'utf8');
if (!content.includes('consciousness-3d.html')) {
  content = content.replace('"activation.html",', '"activation.html",\n      "consciousness-3d.html",');
  fs.writeFileSync(pkgFile, content, 'utf8');
  console.log('  OK 已添加打包文件');
} else {
  console.log('  SKIP 已存在');
}

// 6. 修改 brain-ui.html
console.log('[6/6] 检查 brain-ui.html...');
const brainFile = path.join(projectDir, 'brain-ui.html');
if (fs.existsSync(brainFile)) {
  content = fs.readFileSync(brainFile, 'utf8');
  if (!content.includes('consciousness-3d')) {
    const nav = '<a href="/consciousness-3d" style="padding:8px 16px;background:rgba(0,212,255,0.15);border:1px solid rgba(0,212,255,0.4);color:#00d4ff;border-radius:15px;text-decoration:none;font-size:0.85rem;margin-left:10px;">3D意识空间</a>';
    content = content.replace('</body>', nav + '\n  </body>');
    fs.writeFileSync(brainFile, content, 'utf8');
    console.log('  OK 已添加导航');
  } else {
    console.log('  SKIP 已存在');
  }
} else {
  console.log('  SKIP 文件不存在');
}

console.log('\n========================================');
console.log('  安装完成！');
console.log('========================================\n');
console.log('请执行以下步骤：');
console.log('1. 重启后端服务: npm run dev');
console.log('2. 访问 http://127.0.0.1:3721/consciousness-3d');
console.log('3. 或右键托盘图标 -> 3D 意识空间\n');
console.log('注意：如果构建EXE，需要重新运行:');
console.log('  npx electron-builder --win --dir\n');

/**
 * ============================================================================
 * 意识三维空间可视化模块 (Consciousness 3D Space Visualization)
 * ============================================================================
 *
 * 基于 Three.js r150+ 的 AI 意识系统 3D 可视化引擎
 * 使用 Web Components (Custom Elements + Shadow DOM) 封装
 *
 * 核心可视化元素：
 *   1. 记忆星云 (Memory Nebula)      - 记忆以星辰形式存在于星云中
 *   2. 知识图谱 (Knowledge Graph)    - 实体与关系的力导向三维布局
 *   3. 目标晶体 (Goal Crystals)      - 以多面体晶体展示目标层级
 *   4. 技能光环 (Skill Halos)        - 圆环形态展示技能熟练度
 *   5. 情绪粒子 (Emotion Particles)  - 粒子系统展示情绪状态
 *   6. 反思之镜 (Reflection Mirror)  - 半透明镜面带水波效果
 *   7. 社交网络 (Social Network)     - 用户节点与关系连线
 *
 * @author Bailongma AI System
 * @version 2.0.0
 * @license MIT
 * ============================================================================
 */

/* =========================================================================
 * 全局常量与工具函数
 * ========================================================================= */

/** 情绪颜色映射 */
const EMOTION_COLORS = {
  joy:       0xFFD700,  // 金色 - 喜悦
  sadness:   0x4169E1,  // 蓝色 - 悲伤
  anger:     0xFF2400,  // 红色 - 愤怒
  curiosity: 0x00E676,  // 绿色 - 好奇
  fear:      0x9C27B0,  // 紫色 - 恐惧
  surprise:  0xFF6F00,  // 橙色 - 惊讶
  disgust:   0x4E342E,  // 棕色 - 厌恶
  trust:     0x2196F3,  // 浅蓝 - 信任
};

/** 目标状态颜色映射 */
const GOAL_STATE_COLORS = {
  completed:  0x00E676,  // 绿色 - 完成
  active:     0xFFD700,  // 黄色 - 进行中
  paused:     0x78909C,  // 灰色 - 暂停
  abandoned:  0xF44336,  // 红色 - 放弃
};

/** 实体类型颜色映射 */
const ENTITY_TYPE_COLORS = {
  person:    0x42A5F5,  // 蓝色
  concept:   0xAB47BC,  // 紫色
  location:  0x66BB6A,  // 绿色
  event:     0xFFA726,  // 橙色
  skill:     0x26C6DA,  // 青色
  emotion:   0xEF5350,  // 粉红
  object:    0xFFEE58,  // 黄色
  default:   0xBDBDBD,  // 灰色
};

/** 技能类型颜色映射 */
const SKILL_TYPE_COLORS = {
  technical:   0x00BCD4,  // 青色
  creative:    0xE91E63,  // 粉红
  social:      0x4CAF50,  // 绿色
  analytical:  0x2196F3,  // 蓝色
  physical:    0xFF9800,  // 橙色
  default:     0xBDBDBD,  // 灰色
};

/** 视图模式枚举 */
const VIEW_MODES = {
  ALL:        'all',
  MEMORY:     'memory',
  KNOWLEDGE:  'knowledge',
  GOALS:      'goals',
  SKILLS:     'skills',
  EMOTIONS:   'emotions',
  SOCIAL:     'social',
  PANORAMIC:  'panoramic',
};

/** 缓动函数 */
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** 生成随机范围数 */
function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

/** 向量归一化到指定范围 */
function normalizeToRange(value, min, max, newMin, newMax) {
  return ((value - min) / (max - min)) * (newMax - newMin) + newMin;
}

/* =========================================================================
 * 自定义着色器 (Custom Shaders)
 * ========================================================================= */

/** 星辰着色器 - 带呼吸闪烁效果 */
const STAR_VERTEX_SHADER = `
  attribute float size;
  attribute float importance;
  attribute vec3 customColor;
  varying vec3 vColor;
  varying float vImportance;
  uniform float time;
  uniform float globalBrightness;

  void main() {
    vColor = customColor;
    vImportance = importance;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // 呼吸闪烁：重要性越高的星星闪烁越稳定
    float breathe = 1.0 + 0.3 * (1.0 - importance) * sin(time * 2.0 + position.x * 10.0);

    // 大小基于重要性和到相机距离
    gl_PointSize = size * breathe * globalBrightness * (300.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 100.0);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const STAR_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vImportance;
  uniform float time;

  void main() {
    // 创建柔和的圆形星点
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    // 边缘衰减
    if (dist > 0.5) discard;

    // 核心高亮 + 外围辉光
    float core = exp(-dist * dist * 30.0);
    float glow = exp(-dist * dist * 8.0);
    float alpha = mix(glow * 0.6, core, vImportance * 0.8);

    // 添加微妙的色彩脉动
    vec3 color = vColor + 0.1 * sin(time * 1.5 + vImportance * 6.28) * vec3(0.2, 0.1, 0.0);

    gl_FragColor = vec4(color, alpha);
  }
`;

/** 粒子系统着色器 - 情绪粒子 */
const PARTICLE_VERTEX_SHADER = `
  attribute float size;
  attribute float alpha;
  attribute vec3 customColor;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = customColor;
    vAlpha = alpha;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (250.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 80.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const PARTICLE_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float softEdge = 1.0 - smoothstep(0.2, 0.5, dist);
    gl_FragColor = vec4(vColor, vAlpha * softEdge);
  }
`;

/** 水波纹效果着色器 */
const WATER_VERTEX_SHADER = `
  varying vec2 vUv;
  uniform float time;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // 水波纹位移
    float wave1 = sin(pos.x * 3.0 + time * 1.5) * cos(pos.z * 2.0 + time * 1.0) * 0.05;
    float wave2 = sin(pos.x * 5.0 - time * 2.0) * cos(pos.z * 4.0 + time * 1.3) * 0.03;
    pos.y += wave1 + wave2;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const WATER_FRAGMENT_SHADER = `
  varying vec2 vUv;
  uniform float time;
  uniform float reflectivity;

  void main() {
    // 基础镜面颜色
    vec3 baseColor = vec3(0.4, 0.6, 0.8);

    // 水波纹图案
    float wave = sin(vUv.x * 20.0 + time * 2.0) * cos(vUv.y * 20.0 + time * 1.5);
    wave = wave * 0.5 + 0.5;

    // 边缘高光
    float edge = smoothstep(0.0, 0.1, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));

    vec3 color = mix(baseColor, vec3(0.7, 0.9, 1.0), wave * 0.4);
    float alpha = reflectivity * edge * (0.5 + wave * 0.2);

    gl_FragColor = vec4(color, alpha);
  }
`;

/** 发光线条着色器 - 知识图谱连线 */
const GLOW_LINE_VERTEX_SHADER = `
  varying float vAlpha;

  void main() {
    vAlpha = 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GLOW_LINE_FRAGMENT_SHADER = `
  uniform vec3 color;
  uniform float opacity;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4(color, opacity * vAlpha);
  }
`;

/* =========================================================================
 * 辅助数据结构
 * ========================================================================= */

/** 力导向布局引擎 (简化版) */
class ForceLayout3D {
  /**
   * @param {Object} params
   * @param {number} params.repulsion - 排斥力系数
   * @param {number} params.attraction - 吸引力系数
   * @param {number} params.damping - 阻尼系数
   * @param {number} params.iterations - 每次更新的迭代次数
   */
  constructor(params = {}) {
    this.repulsion = params.repulsion || 50;
    this.attraction = params.attraction || 0.01;
    this.damping = params.damping || 0.9;
    this.iterations = params.iterations || 3;
    this.nodes = new Map();
    this.edges = [];
    this.velocities = new Map();
  }

  /** 添加节点 */
  addNode(id, position) {
    this.nodes.set(id, position.clone());
    this.velocities.set(id, new THREE.Vector3());
  }

  /** 添加边 */
  addEdge(sourceId, targetId, weight = 1.0) {
    this.edges.push({ source: sourceId, target: targetId, weight });
  }

  /** 清除所有节点和边 */
  clear() {
    this.nodes.clear();
    this.edges = [];
    this.velocities.clear();
  }

  /** 执行一步布局计算 */
  step() {
    const nodeKeys = Array.from(this.nodes.keys());

    for (let iter = 0; iter < this.iterations; iter++) {
      // 排斥力 - 所有节点互相排斥
      for (let i = 0; i < nodeKeys.length; i++) {
        for (let j = i + 1; j < nodeKeys.length; j++) {
          const posA = this.nodes.get(nodeKeys[i]);
          const posB = this.nodes.get(nodeKeys[j]);
          const diff = new THREE.Vector3().subVectors(posA, posB);
          const dist = diff.length() || 0.01;
          const force = this.repulsion / (dist * dist);
          const forceVec = diff.normalize().multiplyScalar(force);

          this.velocities.get(nodeKeys[i]).add(forceVec);
          this.velocities.get(nodeKeys[j]).sub(forceVec);
        }
      }

      // 吸引力 - 连接的节点相互吸引
      for (const edge of this.edges) {
        const posA = this.nodes.get(edge.source);
        const posB = this.nodes.get(edge.target);
        if (!posA || !posB) continue;

        const diff = new THREE.Vector3().subVectors(posB, posA);
        const dist = diff.length();
        const force = dist * this.attraction * edge.weight;
        const forceVec = diff.normalize().multiplyScalar(force);

        this.velocities.get(edge.source).add(forceVec);
        this.velocities.get(edge.target).sub(forceVec);
      }

      // 应用速度和阻尼
      for (const [id, vel] of this.velocities) {
        vel.multiplyScalar(this.damping);
        this.nodes.get(id).add(vel);
      }
    }

    return this.nodes;
  }

  /** 获取节点位置 */
  getPositions() {
    const positions = {};
    for (const [id, pos] of this.nodes) {
      positions[id] = pos.clone();
    }
    return positions;
  }
}

/** 粒子爆炸特效管理器 */
class ParticleExplosion {
  /**
   * @param {THREE.Vector3} origin - 爆炸原点
   * @param {number} color - 粒子颜色
   * @param {number} count - 粒子数量
   * @param {number} duration - 持续时间(秒)
   */
  constructor(origin, color = 0xFFD700, count = 200, duration = 2.0) {
    this.origin = origin.clone();
    this.color = color;
    this.count = count;
    this.duration = duration;
    this.elapsed = 0;
    this.active = true;
    this.mesh = null;
    this._create();
  }

  /** 创建粒子系统 */
  _create() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const velocities = new Float32Array(this.count * 3);
    const sizes = new Float32Array(this.count);
    const alphas = new Float32Array(this.count);
    const colors = new Float32Array(this.count * 3);

    const baseColor = new THREE.Color(this.color);

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      // 从原点向外发射
      positions[i3] = this.origin.x;
      positions[i3 + 1] = this.origin.y;
      positions[i3 + 2] = this.origin.z;

      // 随机方向速度
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = randomRange(2, 8);
      velocities[i3] = speed * Math.sin(phi) * Math.cos(theta);
      velocities[i3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
      velocities[i3 + 2] = speed * Math.cos(phi);

      sizes[i] = randomRange(2, 6);
      alphas[i] = 1.0;

      // 颜色微小变化
      colors[i3] = baseColor.r + randomRange(-0.1, 0.1);
      colors[i3 + 1] = baseColor.g + randomRange(-0.1, 0.1);
      colors[i3 + 2] = baseColor.b + randomRange(-0.1, 0.1);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));

    this.velocities = velocities;

    const material = new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERTEX_SHADER,
      fragmentShader: PARTICLE_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.mesh = new THREE.Points(geometry, material);
    this.mesh.frustumCulled = false;
  }

  /** 更新动画 */
  update(deltaTime) {
    if (!this.active) return;

    this.elapsed += deltaTime;
    const progress = this.elapsed / this.duration;

    if (progress >= 1.0) {
      this.active = false;
      return;
    }

    const positions = this.mesh.geometry.attributes.position.array;
    const alphas = this.mesh.geometry.attributes.alpha.array;
    const sizes = this.mesh.geometry.attributes.size.array;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      // 更新位置
      positions[i3] += this.velocities[i3] * deltaTime;
      positions[i3 + 1] += this.velocities[i3 + 1] * deltaTime;
      positions[i3 + 2] += this.velocities[i3 + 2] * deltaTime;

      // 重力效果
      this.velocities[i3 + 1] -= 3.0 * deltaTime;

      // 渐隐
      alphas[i] = 1.0 - progress;
      sizes[i] *= 0.995;
    }

    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.alpha.needsUpdate = true;
    this.mesh.geometry.attributes.size.needsUpdate = true;
  }

  /** 销毁 */
  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
  }
}


/* =========================================================================
 * 主组件定义：consciousness-3d-space
 * ========================================================================= */

/** HTML 模板 */
const COMPONENT_TEMPLATE = `
<style>
  :host {
    display: block;
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    background: #000;
    font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    color: #e0e0e0;
  }

  /* 3D 画布容器 */
  #canvas-container {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }

  canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }

  /* ========== 顶部标题栏 ========== */
  #title-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 48px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
    z-index: 100;
    pointer-events: none;
  }

  #title-bar h1 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 2px;
    color: rgba(100, 200, 255, 0.9);
    text-shadow: 0 0 10px rgba(100, 200, 255, 0.5);
  }

  #fps-counter {
    margin-left: auto;
    font-size: 12px;
    color: rgba(200, 200, 200, 0.5);
    font-family: monospace;
  }

  /* ========== 左侧控制面板 ========== */
  #control-panel {
    position: absolute;
    top: 60px;
    left: 12px;
    width: 240px;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    background: rgba(10, 15, 30, 0.85);
    border: 1px solid rgba(100, 200, 255, 0.15);
    border-radius: 12px;
    padding: 16px;
    z-index: 100;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    transition: transform 0.3s ease, opacity 0.3s ease;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
  }

  #control-panel.hidden {
    transform: translateX(-280px);
    opacity: 0;
    pointer-events: none;
  }

  #control-panel::-webkit-scrollbar {
    width: 4px;
  }
  #control-panel::-webkit-scrollbar-track {
    background: transparent;
  }
  #control-panel::-webkit-scrollbar-thumb {
    background: rgba(100, 200, 255, 0.2);
    border-radius: 2px;
  }

  .panel-section {
    margin-bottom: 16px;
  }

  .panel-section-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: rgba(100, 200, 255, 0.6);
    margin-bottom: 10px;
    padding-bottom: 4px;
    border-bottom: 1px solid rgba(100, 200, 255, 0.1);
  }

  /* 视图切换按钮组 */
  .view-btn-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .view-btn {
    background: rgba(100, 200, 255, 0.08);
    border: 1px solid rgba(100, 200, 255, 0.15);
    border-radius: 8px;
    color: rgba(200, 220, 240, 0.8);
    padding: 8px 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
    user-select: none;
  }

  .view-btn:hover {
    background: rgba(100, 200, 255, 0.15);
    border-color: rgba(100, 200, 255, 0.3);
    color: #fff;
  }

  .view-btn.active {
    background: rgba(100, 200, 255, 0.25);
    border-color: rgba(100, 200, 255, 0.5);
    color: #fff;
    box-shadow: 0 0 12px rgba(100, 200, 255, 0.2);
  }

  .view-btn .icon {
    display: block;
    font-size: 18px;
    margin-bottom: 4px;
  }

  /* 滑块控件 */
  .slider-group {
    margin-bottom: 10px;
  }

  .slider-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: rgba(200, 220, 240, 0.7);
    margin-bottom: 4px;
  }

  .slider-value {
    color: rgba(100, 200, 255, 0.8);
    font-family: monospace;
  }

  input[type="range"] {
    width: 100%;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: rgba(100, 200, 255, 0.1);
    border-radius: 2px;
    outline: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: rgba(100, 200, 255, 0.7);
    cursor: pointer;
    box-shadow: 0 0 8px rgba(100, 200, 255, 0.4);
    transition: transform 0.15s ease;
  }

  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    background: rgba(100, 200, 255, 0.9);
  }

  /* 开关控件 */
  .toggle-group {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .toggle-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    color: rgba(200, 200, 200, 0.6);
    padding: 4px 10px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
  }

  .toggle-btn.on {
    background: rgba(100, 200, 255, 0.15);
    border-color: rgba(100, 200, 255, 0.3);
    color: rgba(100, 200, 255, 0.9);
  }

  /* 搜索框 */
  #search-box {
    width: 100%;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(100, 200, 255, 0.15);
    border-radius: 8px;
    padding: 8px 12px;
    color: #e0e0e0;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s ease;
    box-sizing: border-box;
  }

  #search-box:focus {
    border-color: rgba(100, 200, 255, 0.4);
    box-shadow: 0 0 12px rgba(100, 200, 255, 0.1);
  }

  #search-box::placeholder {
    color: rgba(200, 200, 200, 0.3);
  }

  /* 时间轴 */
  #timeline-container {
    margin-top: 8px;
  }

  #timeline {
    width: 100%;
    height: 4px;
    position: relative;
    background: rgba(100, 200, 255, 0.1);
    border-radius: 2px;
    cursor: pointer;
  }

  #timeline-progress {
    height: 100%;
    background: linear-gradient(90deg, rgba(100, 200, 255, 0.5), rgba(200, 100, 255, 0.5));
    border-radius: 2px;
    width: 0%;
    transition: width 0.1s linear;
  }

  #timeline-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-size: 10px;
    color: rgba(200, 200, 200, 0.4);
  }

  /* ========== 信息悬浮框 ========== */
  #tooltip {
    position: absolute;
    display: none;
    max-width: 320px;
    background: rgba(10, 20, 40, 0.92);
    border: 1px solid rgba(100, 200, 255, 0.25);
    border-radius: 12px;
    padding: 14px 18px;
    z-index: 200;
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    pointer-events: none;
    transition: opacity 0.15s ease;
  }

  #tooltip.visible {
    display: block;
  }

  #tooltip-title {
    font-size: 14px;
    font-weight: 600;
    color: rgba(100, 200, 255, 0.9);
    margin-bottom: 8px;
    line-height: 1.3;
  }

  #tooltip-content {
    font-size: 12px;
    color: rgba(200, 220, 240, 0.75);
    line-height: 1.6;
  }

  #tooltip-content .tag {
    display: inline-block;
    background: rgba(100, 200, 255, 0.1);
    border-radius: 4px;
    padding: 1px 6px;
    margin: 2px 2px 2px 0;
    font-size: 10px;
    color: rgba(100, 200, 255, 0.7);
  }

  /* ========== 右键菜单 ========== */
  #context-menu {
    position: absolute;
    display: none;
    min-width: 160px;
    background: rgba(15, 25, 45, 0.95);
    border: 1px solid rgba(100, 200, 255, 0.2);
    border-radius: 10px;
    padding: 6px 0;
    z-index: 300;
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  }

  #context-menu.visible {
    display: block;
  }

  .ctx-menu-item {
    padding: 8px 16px;
    font-size: 13px;
    color: rgba(200, 220, 240, 0.8);
    cursor: pointer;
    transition: background 0.15s ease;
    user-select: none;
  }

  .ctx-menu-item:hover {
    background: rgba(100, 200, 255, 0.12);
    color: #fff;
  }

  .ctx-menu-divider {
    height: 1px;
    background: rgba(100, 200, 255, 0.1);
    margin: 4px 0;
  }

  /* ========== 统计面板（底部） ========== */
  #stats-bar {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 24px;
    padding: 8px 20px;
    background: rgba(10, 15, 30, 0.7);
    border: 1px solid rgba(100, 200, 255, 0.1);
    border-radius: 20px;
    z-index: 100;
    backdrop-filter: blur(8px);
  }

  .stat-item {
    text-align: center;
  }

  .stat-value {
    font-size: 16px;
    font-weight: 600;
    color: rgba(100, 200, 255, 0.9);
    font-family: monospace;
  }

  .stat-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: rgba(200, 200, 200, 0.4);
    margin-top: 2px;
  }

  /* ========== 快捷键提示 ========== */
  #shortcut-hint {
    position: absolute;
    bottom: 60px;
    right: 12px;
    font-size: 10px;
    color: rgba(200, 200, 200, 0.3);
    z-index: 100;
    text-align: right;
    line-height: 1.8;
    pointer-events: none;
  }

  /* ========== 切换面板按钮 ========== */
  #toggle-panel-btn {
    position: absolute;
    top: 60px;
    left: 12px;
    width: 36px;
    height: 36px;
    background: rgba(10, 15, 30, 0.8);
    border: 1px solid rgba(100, 200, 255, 0.2);
    border-radius: 10px;
    color: rgba(100, 200, 255, 0.7);
    font-size: 18px;
    cursor: pointer;
    z-index: 101;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    backdrop-filter: blur(8px);
  }

  #toggle-panel-btn:hover {
    background: rgba(10, 15, 30, 0.95);
    border-color: rgba(100, 200, 255, 0.4);
    color: rgba(100, 200, 255, 1);
  }

  /* ========== 加载画面 ========== */
  #loading-screen {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: radial-gradient(ellipse at center, #0a1428 0%, #000 100%);
    z-index: 1000;
    transition: opacity 0.8s ease;
  }

  #loading-screen.fade-out {
    opacity: 0;
    pointer-events: none;
  }

  .loading-ring {
    width: 60px;
    height: 60px;
    border: 2px solid rgba(100, 200, 255, 0.1);
    border-top: 2px solid rgba(100, 200, 255, 0.8);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-text {
    margin-top: 16px;
    font-size: 13px;
    letter-spacing: 3px;
    color: rgba(100, 200, 255, 0.6);
    animation: pulse-text 2s ease-in-out infinite;
  }

  @keyframes pulse-text {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
</style>

<!-- 加载画面 -->
<div id="loading-screen">
  <div class="loading-ring"></div>
  <div class="loading-text">初始化意识空间...</div>
</div>

<!-- 3D 画布容器 -->
<div id="canvas-container"></div>

<!-- 标题栏 -->
<div id="title-bar">
  <h1>CONSCIOUSNESS 3D SPACE</h1>
  <span id="fps-counter">-- FPS</span>
</div>

<!-- 切换面板按钮 -->
<button id="toggle-panel-btn" title="切换控制面板 (H)">&#9776;</button>

<!-- 控制面板 -->
<div id="control-panel">
  <!-- 搜索框 -->
  <div class="panel-section">
    <input type="text" id="search-box" placeholder="搜索元素..." />
  </div>

  <!-- 视图切换 -->
  <div class="panel-section">
    <div class="panel-section-title">视图切换</div>
    <div class="view-btn-group">
      <div class="view-btn active" data-view="all">
        <span class="icon">&#9673;</span>全景
      </div>
      <div class="view-btn" data-view="memory">
        <span class="icon">&#10022;</span>记忆
      </div>
      <div class="view-btn" data-view="knowledge">
        <span class="icon">&#9670;</span>知识
      </div>
      <div class="view-btn" data-view="goals">
        <span class="icon">&#9830;</span>目标
      </div>
      <div class="view-btn" data-view="skills">
        <span class="icon">&#9711;</span>技能
      </div>
      <div class="view-btn" data-view="emotions">
        <span class="icon">&#10047;</span>情绪
      </div>
      <div class="view-btn" data-view="social">
        <span class="icon">&#9786;</span>社交
      </div>
    </div>
  </div>

  <!-- 动画控制 -->
  <div class="panel-section">
    <div class="panel-section-title">动画控制</div>
    <div class="slider-group">
      <div class="slider-label">
        <span>动画速度</span>
        <span class="slider-value" id="speed-value">1.0x</span>
      </div>
      <input type="range" id="speed-slider" min="0" max="3" step="0.1" value="1" />
    </div>
    <div class="slider-group">
      <div class="slider-label">
        <span>粒子密度</span>
        <span class="slider-value" id="density-value">100%</span>
      </div>
      <input type="range" id="density-slider" min="10" max="200" step="10" value="100" />
    </div>
  </div>

  <!-- 元素显示/隐藏 -->
  <div class="panel-section">
    <div class="panel-section-title">元素可见性</div>
    <div class="toggle-group">
      <div class="toggle-btn on" data-layer="memory">记忆星云</div>
      <div class="toggle-btn on" data-layer="knowledge">知识图谱</div>
      <div class="toggle-btn on" data-layer="goals">目标晶体</div>
      <div class="toggle-btn on" data-layer="skills">技能光环</div>
      <div class="toggle-btn on" data-layer="emotions">情绪粒子</div>
      <div class="toggle-btn on" data-layer="mirror">反思之镜</div>
      <div class="toggle-btn on" data-layer="social">社交网络</div>
    </div>
  </div>

  <!-- 时间轴 -->
  <div class="panel-section">
    <div class="panel-section-title">时间回放</div>
    <div id="timeline-container">
      <div id="timeline">
        <div id="timeline-progress"></div>
      </div>
      <div id="timeline-labels">
        <span>过去</span>
        <span>现在</span>
      </div>
    </div>
  </div>
</div>

<!-- 信息悬浮框 -->
<div id="tooltip">
  <div id="tooltip-title"></div>
  <div id="tooltip-content"></div>
</div>

<!-- 右键菜单 -->
<div id="context-menu">
  <div class="ctx-menu-item" data-action="focus">聚焦此处</div>
  <div class="ctx-menu-item" data-action="highlight">高亮同类</div>
  <div class="ctx-menu-divider"></div>
  <div class="ctx-menu-item" data-action="hide">隐藏元素</div>
  <div class="ctx-menu-item" data-action="isolate">隔离此类型</div>
  <div class="ctx-menu-divider"></div>
  <div class="ctx-menu-item" data-action="details">查看详情</div>
</div>

<!-- 底部统计栏 -->
<div id="stats-bar">
  <div class="stat-item">
    <div class="stat-value" id="stat-memories">0</div>
    <div class="stat-label">记忆</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" id="stat-entities">0</div>
    <div class="stat-label">实体</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" id="stat-goals">0</div>
    <div class="stat-label">目标</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" id="stat-skills">0</div>
    <div class="stat-label">技能</div>
  </div>
  <div class="stat-item">
    <div class="stat-value" id="stat-connections">0</div>
    <div class="stat-label">连接</div>
  </div>
</div>

<!-- 快捷键提示 -->
<div id="shortcut-hint">
  1-7 切换视图 | H 面板 | R 重置 | 空格 暂停
</div>
`;

/* =========================================================================
 * 主组件类
 * ========================================================================= */

class Consciousness3DSpace extends HTMLElement {
  /** 组件标签名 */
  static get observedAttributes() {
    return ['width', 'height', 'data-url'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    /* ---- 内部状态 ---- */
    this._initialized = false;
    this._animationId = null;
    this._clock = null;
    this._paused = false;
    this._animationSpeed = 1.0;
    this._currentView = VIEW_MODES.ALL;
    this._searchQuery = '';
    this._selectedObject = null;
    this._hoveredObject = null;
    this._contextTarget = null;

    /* ---- Three.js 核心 ---- */
    this._renderer = null;
    this._scene = null;
    this._camera = null;
    this._raycaster = null;
    this._mouse = new THREE.Vector2();
    this._orbitControls = null;

    /* ---- 可视化层 ---- */
    this._layers = {
      memory:   null,  // Group
      knowledge: null,
      goals:    null,
      skills:   null,
      emotions: null,
      mirror:   null,
      social:   null,
    };

    /* ---- 数据引用 ---- */
    this._data = {
      memories:    [],
      entities:    [],
      relations:   [],
      goals:       [],
      skills:      [],
      emotions:    [],
      users:       [],
      connections: [],
    };

    /* ---- 力导向布局引擎 ---- */
    this._forceLayout = new ForceLayout3D();

    /* ---- 爆炸特效列表 ---- */
    this._explosions = [];

    /* ---- FPS 计算 ---- */
    this._frameCount = 0;
    this._lastFpsTime = 0;

    /* ---- 时间轴 ---- */
    this._timelineSnapshots = [];
    this._timelineIndex = 0;

    /* ---- 可交互对象缓存 ---- */
    this._interactableObjects = [];

    /* ---- 绑定事件处理 ---- */
    this._onResize = this._onResize.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onContextMenu = this._onContextMenu.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._animate = this._animate.bind(this);
  }

  /* =========================================================================
   * Web Component 生命周期
   * ========================================================================= */

  connectedCallback() {
    // 注入 Shadow DOM 内容
    this.shadowRoot.innerHTML = COMPONENT_TEMPLATE;
    this._init();
  }

  disconnectedCallback() {
    this._dispose();
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('keydown', this._onKeyDown);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'data-url' && this._initialized) {
      this._fetchData(newVal);
    }
  }

  /* =========================================================================
   * 初始化
   * ========================================================================= */

  _init() {
    // 加载 Three.js 依赖
    this._loadDependencies()
      .then(() => {
        this._initThreeJS();
        this._initControls();
        this._initUIBindings();
        this._initSceneContent();
        this._initLights();
        this._generateDemoData();
        this._populateVisualization();
        this._startAnimation();
        this._hideLoadingScreen();
        this._initialized = true;
      })
      .catch(err => {
        console.error('[Consciousness3DSpace] 初始化失败:', err);
        this._hideLoadingScreen();
      });
  }

  /** 动态加载 Three.js 依赖 */
  async _loadDependencies() {
    const cdnBase = 'https://unpkg.com/three@0.160.0/build/';

    // 检查 THREE 是否已存在
    if (typeof THREE !== 'undefined') return;

    // 加载 Three.js 核心
    await this._loadScript(cdnBase + 'three.module.js', 'module');

    // 如果 CDN 模块加载失败，尝试全局 UMD 版本
    if (typeof THREE === 'undefined') {
      await this._loadScript('https://unpkg.com/three@0.160.0/build/three.min.js');
    }

    // 加载 OrbitControls
    if (typeof THREE === 'undefined') {
      throw new Error('Three.js 加载失败，请检查网络连接');
    }

    // 内联实现简易 OrbitControls（避免 CDN 加载问题）
    this._createSimpleOrbitControls();
  }

  /** 动态脚本加载器 */
  _loadScript(url, type) {
    return new Promise((resolve, reject) => {
      // 避免重复加载
      const existing = document.querySelector(`script[src="${url}"]`);
      if (existing) {
        existing.addEventListener('load', resolve);
        if (existing.dataset.loaded) resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = url;
      if (type === 'module') {
        script.type = 'module';
      }
      script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = () => reject(new Error(`无法加载脚本: ${url}`));
      document.head.appendChild(script);
    });
  }

  /** 创建简易的轨道控制器（不依赖外部模块） */
  _createSimpleOrbitControls() {
    const self = this;
    const canvas = this._renderer.domElement;

    let isDown = false;
    let isRight = false;
    let prevX = 0, prevY = 0;
    let theta = 0, phi = Math.PI / 3;
    let radius = 50;
    let target = new THREE.Vector3(0, 0, 0);

    function updateCamera() {
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      self._camera.position.set(target.x + x, target.y + y, target.z + z);
      self._camera.lookAt(target);
    }

    canvas.addEventListener('pointerdown', (e) => {
      if (e.button === 2) { isRight = true; } else { isDown = true; }
      prevX = e.clientX;
      prevY = e.clientY;
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!isDown && !isRight) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;

      if (isDown) {
        theta -= dx * 0.005;
        phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi + dy * 0.005));
      }
      if (isRight) {
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);
        right.crossVectors(self._camera.getWorldDirection(new THREE.Vector3()), up).normalize();
        target.add(right.multiplyScalar(-dx * 0.05));
        target.y += dy * 0.05;
      }
      updateCamera();
    });

    window.addEventListener('pointerup', () => { isDown = false; isRight = false; });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      radius = Math.max(5, Math.min(200, radius + e.deltaY * 0.05));
      updateCamera();
    }, { passive: false });

    // 提供公共方法
    this._orbitControls = {
      updateCamera,
      setTarget: (t) => { target.copy(t); updateCamera(); },
      reset: () => { theta = 0; phi = Math.PI / 3; radius = 50; target.set(0, 0, 0); updateCamera(); },
      getTarget: () => target.clone(),
      getRadius: () => radius,
      focusOn: (pos, newRadius = 15) => {
        target.copy(pos);
        radius = newRadius;
        updateCamera();
      }
    };

    updateCamera();
  }

  /** 初始化 Three.js 核心 */
  _initThreeJS() {
    const container = this.shadowRoot.querySelector('#canvas-container');

    // 场景
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x000510);
    this._scene.fog = new THREE.FogExp2(0x000510, 0.008);

    // 相机
    this._camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    // 渲染器
    this._renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this._renderer.setSize(container.clientWidth, container.clientHeight);
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 1.2;
    container.appendChild(this._renderer.domElement);

    // 时钟
    this._clock = new THREE.Clock();

    // 射线投射器（用于鼠标拾取）
    this._raycaster = new THREE.Raycaster();
    this._raycaster.params.Points = { threshold: 0.5 };

    // 事件监听
    window.addEventListener('resize', this._onResize);
    this._renderer.domElement.addEventListener('click', this._onClick);
    this._renderer.domElement.addEventListener('pointermove', this._onMouseMove);
    this._renderer.domElement.addEventListener('contextmenu', this._onContextMenu);
    window.addEventListener('keydown', this._onKeyDown);
  }

  /** 初始化场景光源 */
  _initLights() {
    // 环境光 - 微弱的整体照明
    const ambient = new THREE.AmbientLight(0x1a1a2e, 0.3);
    this._scene.add(ambient);

    // 中心点光源 - 模拟意识核心
    const coreLight = new THREE.PointLight(0x4488ff, 2, 80);
    coreLight.position.set(0, 0, 0);
    this._scene.add(coreLight);
    this._coreLight = coreLight;

    // 半球光 - 天空/地面色彩
    const hemiLight = new THREE.HemisphereLight(0x2244aa, 0x112211, 0.4);
    this._scene.add(hemiLight);

    // 背景星空粒子
    this._createBackgroundStars();
  }

  /** 创建背景星空 */
  _createBackgroundStars() {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = randomRange(-300, 300);
      positions[i3 + 1] = randomRange(-300, 300);
      positions[i3 + 2] = randomRange(-300, 300);
      sizes[i] = randomRange(0.3, 1.5);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // 简单的点材质
    const material = new THREE.PointsMaterial({
      color: 0xaaccff,
      size: 0.5,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const stars = new THREE.Points(geometry, material);
    stars.frustumCulled = false;
    this._scene.add(stars);
    this._bgStars = stars;
  }

  /* =========================================================================
   * 场景内容初始化
   * ========================================================================= */

  /** 初始化各可视化层的容器 */
  _initSceneContent() {
    this._layers.memory = new THREE.Group();
    this._layers.memory.name = 'memory';
    this._scene.add(this._layers.memory);

    this._layers.knowledge = new THREE.Group();
    this._layers.knowledge.name = 'knowledge';
    this._scene.add(this._layers.knowledge);

    this._layers.goals = new THREE.Group();
    this._layers.goals.name = 'goals';
    this._scene.add(this._layers.goals);

    this._layers.skills = new THREE.Group();
    this._layers.skills.name = 'skills';
    this._scene.add(this._layers.skills);

    this._layers.emotions = new THREE.Group();
    this._layers.emotions.name = 'emotions';
    this._scene.add(this._layers.emotions);

    this._layers.mirror = new THREE.Group();
    this._layers.mirror.name = 'mirror';
    this._scene.add(this._layers.mirror);

    this._layers.social = new THREE.Group();
    this._layers.social.name = 'social';
    this._scene.add(this._layers.social);
  }

  /* =========================================================================
   * 数据生成与填充
   * ========================================================================= */

  /** 生成演示数据 */
  _generateDemoData() {
    // ---- 记忆数据 ----
    const memoryTopics = [
      '第一次学习编程', '与朋友的深夜对话', '读完《三体》', '解决复杂算法',
      '观看日出', '收到重要邮件', '项目上线成功', '一次失败的演讲',
      '与导师的交流', '创作第一首诗', '探索新城市', '帮助陌生人',
      '调试通宵的bug', '收到生日祝福', '学到新知识', '做出重要决定',
      '运动突破记录', '品尝新美食', '观看纪录片', '参与开源项目',
      '团队庆祝活动', '独立完成设计', '阅读科学论文', '音乐会上的感动',
      '冥想中的顿悟', '代码重构完成', '设计原型被认可', '数据分析发现',
      '与AI对话的启发', '回顾旧日记', '清晨的跑步', '家庭视频通话',
    ];

    this._data.memories = memoryTopics.map((title, i) => {
      const importance = Math.random();
      const sentiment = randomRange(-1, 1); // -1=负面, 0=中性, 1=正面
      const accessCount = Math.floor(randomRange(1, 50));
      // 使用简化的降维位置（模拟 t-SNE/PCA）
      const angle1 = (i / memoryTopics.length) * Math.PI * 2;
      const angle2 = randomRange(0, Math.PI);
      const radius = randomRange(8, 25);
      return {
        id: `mem_${i}`,
        title,
        content: `关于"${title}"的详细记忆内容。时间：2024-${String(Math.floor(randomRange(1, 13))).padStart(2, '0')}-${String(Math.floor(randomRange(1, 29))).padStart(2, '0')}`,
        importance,
        sentiment,
        accessCount,
        position: new THREE.Vector3(
          radius * Math.sin(angle2) * Math.cos(angle1),
          radius * Math.sin(angle2) * Math.sin(angle1),
          radius * Math.cos(angle2)
        ),
        tags: ['记忆', sentiment > 0.3 ? '积极' : sentiment < -0.3 ? '消极' : '中性'],
        type: 'memory',
      };
    });

    // ---- 知识图谱数据 ----
    const entityNames = [
      '人工智能', '神经网络', '深度学习', '自然语言处理', '计算机视觉',
      '强化学习', '注意力机制', '变换器', '知识图谱', '机器学习',
      'Python', 'JavaScript', 'Three.js', '数据结构', '算法',
      '物理', '数学', '哲学', '心理学', '认知科学',
    ];

    const entityTypes = Object.keys(ENTITY_TYPE_COLORS);
    this._data.entities = entityNames.map((name, i) => ({
      id: `ent_${i}`,
      name,
      type: entityTypes[i % entityTypes.length],
      connections: Math.floor(randomRange(2, 12)),
      description: `"${name}"是知识体系中的重要概念节点。`,
      position: new THREE.Vector3(
        randomRange(-30, 30),
        randomRange(-20, 20),
        randomRange(-30, 30)
      ),
    }));

    // 生成关系
    this._data.relations = [];
    for (let i = 0; i < entityNames.length; i++) {
      const numRelations = Math.floor(randomRange(1, 4));
      for (let j = 0; j < numRelations; j++) {
        const target = Math.floor(Math.random() * entityNames.length);
        if (target !== i) {
          this._data.relations.push({
            source: `ent_${i}`,
            target: `ent_${target}`,
            weight: randomRange(0.3, 1.0),
            label: '相关',
          });
        }
      }
    }

    // 初始化力导向布局
    this._forceLayout.clear();
    this._data.entities.forEach(e => this._forceLayout.addNode(e.id, e.position));
    this._data.relations.forEach(r => this._forceLayout.addEdge(r.source, r.target, r.weight));
    // 运行多次迭代使布局收敛
    for (let i = 0; i < 50; i++) this._forceLayout.step();
    // 更新实体位置
    const positions = this._forceLayout.getPositions();
    this._data.entities.forEach(e => { if (positions[e.id]) e.position.copy(positions[e.id]); });

    // ---- 目标数据 ----
    this._data.goals = [
      { id: 'goal_0', title: '构建完整意识系统', state: 'active', progress: 0.65, children: [
        { id: 'goal_0_0', title: '记忆模块', state: 'completed', progress: 1.0 },
        { id: 'goal_0_1', title: '知识图谱模块', state: 'active', progress: 0.8 },
        { id: 'goal_0_2', title: '情绪系统', state: 'active', progress: 0.5 },
      ]},
      { id: 'goal_1', title: '学习新技能', state: 'active', progress: 0.4, children: [
        { id: 'goal_1_0', title: '掌握3D可视化', state: 'active', progress: 0.7 },
        { id: 'goal_1_1', title: '学习音乐创作', state: 'paused', progress: 0.2 },
      ]},
      { id: 'goal_2', title: '提升社交智能', state: 'active', progress: 0.3, children: [] },
      { id: 'goal_3', title: '完成日常任务', state: 'completed', progress: 1.0, children: [] },
      { id: 'goal_4', title: '探索未知领域', state: 'paused', progress: 0.1, children: [] },
    ];

    // ---- 技能数据 ----
    this._data.skills = [
      { id: 'skill_0', name: '编程', type: 'technical', proficiency: 0.85 },
      { id: 'skill_1', name: '写作', type: 'creative', proficiency: 0.72 },
      { id: 'skill_2', name: '分析', type: 'analytical', proficiency: 0.88 },
      { id: 'skill_3', name: '沟通', type: 'social', proficiency: 0.65 },
      { id: 'skill_4', name: '设计', type: 'creative', proficiency: 0.55 },
      { id: 'skill_5', name: '数学', type: 'analytical', proficiency: 0.78 },
      { id: 'skill_6', name: '学习', type: 'default', proficiency: 0.90 },
      { id: 'skill_7', name: '推理', type: 'analytical', proficiency: 0.82 },
    ];

    // ---- 情绪数据 ----
    this._data.emotions = [
      { type: 'joy',       intensity: 0.7 },
      { type: 'curiosity', intensity: 0.9 },
      { type: 'sadness',   intensity: 0.15 },
      { type: 'anger',     intensity: 0.05 },
    ];

    // ---- 社交数据 ----
    this._data.users = [
      { id: 'user_0', name: 'Alice', closeness: 0.9, role: '核心用户' },
      { id: 'user_1', name: 'Bob', closeness: 0.7, role: '开发者' },
      { id: 'user_2', name: 'Carol', closeness: 0.5, role: '研究员' },
      { id: 'user_3', name: 'David', closeness: 0.6, role: '设计师' },
      { id: 'user_4', name: 'Eve', closeness: 0.3, role: '访客' },
    ];

    this._data.connections = [
      { source: 'user_0', target: 'user_1', strength: 0.8 },
      { source: 'user_0', target: 'user_2', strength: 0.5 },
      { source: 'user_1', target: 'user_3', strength: 0.6 },
      { source: 'user_2', target: 'user_4', strength: 0.3 },
    ];
  }

  /* =========================================================================
   * 可视化元素构建
   * ========================================================================= */

  /** 填充所有可视化层 */
  _populateVisualization() {
    this._buildMemoryNebula();
    this._buildKnowledgeGraph();
    this._buildGoalCrystals();
    this._buildSkillHalos();
    this._buildEmotionParticles();
    this._buildReflectionMirror();
    this._buildSocialNetwork();
    this._updateStats();
  }

  /* ---- 1. 记忆星云 ---- */
  _buildMemoryNebula() {
    const memories = this._data.memories;
    const count = memories.length;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const importances = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const mem = memories[i];
      const i3 = i * 3;
      positions[i3] = mem.position.x;
      positions[i3 + 1] = mem.position.y;
      positions[i3 + 2] = mem.position.z;

      // 大小 = 访问次数（归一化）
      sizes[i] = normalizeToRange(mem.accessCount, 1, 50, 2, 12);
      importances[i] = mem.importance;

      // 颜色 = 情绪效价
      const c = new THREE.Color();
      if (mem.sentiment < -0.3) {
        // 负面 -> 蓝色系
        c.setHSL(0.6, 0.8, 0.5 + mem.importance * 0.3);
      } else if (mem.sentiment > 0.3) {
        // 正面 -> 黄色系
        c.setHSL(0.12, 0.9, 0.5 + mem.importance * 0.3);
      } else {
        // 中性 -> 红色系
        c.setHSL(0.0, 0.7, 0.5 + mem.importance * 0.3);
      }
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('importance', new THREE.BufferAttribute(importances, 1));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.ShaderMaterial({
      vertexShader: STAR_VERTEX_SHADER,
      fragmentShader: STAR_FRAGMENT_SHADER,
      uniforms: {
        time: { value: 0 },
        globalBrightness: { value: 1.0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    points.name = 'memory-nebula';
    points.userData.layer = 'memory';
    this._layers.memory.add(points);

    // 记忆间连接线（相似记忆连线）
    this._buildMemoryConnections(memories);

    // 记录可交互对象
    for (let i = 0; i < count; i++) {
      this._interactableObjects.push({
        type: 'memory',
        index: i,
        data: memories[i],
        layer: 'memory',
        object: points,
      });
    }

    // 记忆星云中心辉光
    const glowGeo = new THREE.SphereGeometry(2, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.name = 'memory-core-glow';
    this._layers.memory.add(glow);
  }

  /** 构建记忆间的连接线 */
  _buildMemoryConnections(memories) {
    const linePositions = [];
    const maxConnections = 40;
    let count = 0;

    for (let i = 0; i < memories.length && count < maxConnections; i++) {
      for (let j = i + 1; j < memories.length && count < maxConnections; j++) {
        const dist = memories[i].position.distanceTo(memories[j].position);
        if (dist < 12) {
          linePositions.push(
            memories[i].position.x, memories[i].position.y, memories[i].position.z,
            memories[j].position.x, memories[j].position.y, memories[j].position.z
          );
          count++;
        }
      }
    }

    if (linePositions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const lines = new THREE.LineSegments(geo, mat);
      lines.name = 'memory-connections';
      this._layers.memory.add(lines);
    }
  }

  /* ---- 2. 知识图谱 ---- */
  _buildKnowledgeGraph() {
    const entities = this._data.entities;
    const relations = this._data.relations;
    const layer = this._layers.knowledge;

    // 实体球体
    for (let i = 0; i < entities.length; i++) {
      const ent = entities[i];
      const radius = 0.3 + ent.connections * 0.15;
      const color = ENTITY_TYPE_COLORS[ent.type] || ENTITY_TYPE_COLORS.default;

      // 发光球体
      const geo = new THREE.SphereGeometry(radius, 24, 24);
      const mat = new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.85,
        shininess: 80,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(ent.position);
      mesh.name = ent.id;
      mesh.userData = { type: 'entity', index: i, data: ent, layer: 'knowledge' };
      layer.add(mesh);

      // 外部辉光环
      const glowGeo = new THREE.SphereGeometry(radius * 1.6, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.copy(ent.position);
      layer.add(glowMesh);

      this._interactableObjects.push({
        type: 'entity',
        index: i,
        data: ent,
        layer: 'knowledge',
        object: mesh,
      });
    }

    // 关系连线
    const linePositions = [];
    const lineColors = [];
    for (const rel of relations) {
      const src = entities.find(e => e.id === rel.source);
      const tgt = entities.find(e => e.id === rel.target);
      if (!src || !tgt) continue;

      linePositions.push(src.position.x, src.position.y, src.position.z);
      linePositions.push(tgt.position.x, tgt.position.y, tgt.position.z);

      const c1 = new THREE.Color(ENTITY_TYPE_COLORS[src.type] || 0xffffff);
      const c2 = new THREE.Color(ENTITY_TYPE_COLORS[tgt.type] || 0xffffff);
      lineColors.push(c1.r, c1.g, c1.b);
      lineColors.push(c2.r, c2.g, c2.b);
    }

    if (linePositions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const lines = new THREE.LineSegments(geo, mat);
      lines.name = 'knowledge-relations';
      layer.add(lines);
    }
  }

  /* ---- 3. 目标晶体 ---- */
  _buildGoalCrystals() {
    const goals = this._data.goals;
    const layer = this._layers.goals;
    const self = this;

    goals.forEach((goal, gi) => {
      // 父目标位置 - 环形分布
      const parentAngle = (gi / goals.length) * Math.PI * 2;
      const parentRadius = 15;
      const parentPos = new THREE.Vector3(
        Math.cos(parentAngle) * parentRadius,
        randomRange(-3, 3),
        Math.sin(parentAngle) * parentRadius
      );

      self._createCrystalMesh(goal, parentPos, layer, gi, 1.5);

      // 子目标围绕父目标旋转
      if (goal.children) {
        goal.children.forEach((child, ci) => {
          const childAngle = (ci / goal.children.length) * Math.PI * 2;
          const childRadius = 3;
          const childPos = new THREE.Vector3(
            parentPos.x + Math.cos(childAngle) * childRadius,
            parentPos.y + randomRange(-1, 1),
            parentPos.z + Math.sin(childAngle) * childRadius
          );
          self._createCrystalMesh(child, childPos, layer, gi * 100 + ci, 0.8, parentPos);
        });
      }
    });
  }

  /** 创建单个晶体网格 */
  _createCrystalMesh(goal, position, layer, index, scale = 1.0, orbitCenter = null) {
    const color = GOAL_STATE_COLORS[goal.state] || 0x888888;

    // 根据进度选择多面体
    let geometry;
    if (goal.progress >= 0.8) {
      geometry = new THREE.IcosahedronGeometry(scale, 0);
    } else {
      geometry = new THREE.DodecahedronGeometry(scale, 0);
    }

    const material = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.3 + goal.progress * 0.6,
      shininess: 120,
      side: THREE.DoubleSide,
      wireframe: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.name = goal.id;
    mesh.userData = {
      type: 'goal',
      index,
      data: goal,
      layer: 'goals',
      orbitCenter,
      orbitAngle: Math.random() * Math.PI * 2,
      orbitSpeed: 0.2 + Math.random() * 0.3,
      rotationSpeed: new THREE.Vector3(
        randomRange(-0.5, 0.5),
        randomRange(-0.5, 0.5),
        randomRange(-0.5, 0.5)
      ),
    };
    layer.add(mesh);

    // 晶体边框线
    const wireGeo = new THREE.EdgesGeometry(geometry);
    const wireMat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.4,
    });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    mesh.add(wireframe);

    // 添加光晕
    const glowGeo = new THREE.SphereGeometry(scale * 1.5, 12, 12);
    const glowMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    mesh.add(glow);

    this._interactableObjects.push({
      type: 'goal',
      index,
      data: goal,
      layer: 'goals',
      object: mesh,
    });

    return mesh;
  }

  /* ---- 4. 技能光环 ---- */
  _buildSkillHalos() {
    const skills = this._data.skills;
    const layer = this._layers.skills;

    skills.forEach((skill, i) => {
      const angle = (i / skills.length) * Math.PI * 2;
      const ringRadius = 12;
      const pos = new THREE.Vector3(
        Math.cos(angle) * ringRadius,
        randomRange(-2, 2),
        Math.sin(angle) * ringRadius
      );

      // 熟练度 -> 圆环半径
      const torusRadius = 0.8 + skill.proficiency * 1.5;
      const tubeRadius = 0.05 + skill.proficiency * 0.12;
      const color = SKILL_TYPE_COLORS[skill.type] || SKILL_TYPE_COLORS.default;

      const geo = new THREE.TorusGeometry(torusRadius, tubeRadius, 16, 48);
      const mat = new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.7,
        shininess: 100,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.rotation.x = Math.PI / 2 + randomRange(-0.3, 0.3);
      mesh.name = skill.id;
      mesh.userData = {
        type: 'skill',
        index: i,
        data: skill,
        layer: 'skills',
        pulsePhase: Math.random() * Math.PI * 2,
        isPulsing: false,
        baseEmissiveIntensity: 0.5,
      };
      layer.add(mesh);

      // 外部辉光
      const glowGeo = new THREE.TorusGeometry(torusRadius, tubeRadius * 3, 16, 48);
      const glowMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      mesh.add(glow);

      this._interactableObjects.push({
        type: 'skill',
        index: i,
        data: skill,
        layer: 'skills',
        object: mesh,
      });
    });
  }

  /* ---- 5. 情绪粒子 ---- */
  _buildEmotionParticles() {
    const emotions = this._data.emotions;
    const layer = this._layers.emotions;

    emotions.forEach(emotion => {
      const particleCount = Math.floor(emotion.intensity * 300);
      if (particleCount < 5) return;

      const positions = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const alphas = new Float32Array(particleCount);
      const colors = new Float32Array(particleCount * 3);

      const baseColor = new THREE.Color(EMOTION_COLORS[emotion.type] || 0xffffff);

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = randomRange(-20, 20);
        positions[i3 + 1] = randomRange(-15, 15);
        positions[i3 + 2] = randomRange(-20, 20);
        sizes[i] = randomRange(1, 4);
        alphas[i] = randomRange(0.3, 0.9);
        colors[i3] = baseColor.r + randomRange(-0.05, 0.05);
        colors[i3 + 1] = baseColor.g + randomRange(-0.05, 0.05);
        colors[i3 + 2] = baseColor.b + randomRange(-0.05, 0.05);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
      geo.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.ShaderMaterial({
        vertexShader: PARTICLE_VERTEX_SHADER,
        fragmentShader: PARTICLE_FRAGMENT_SHADER,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const points = new THREE.Points(geo, mat);
      points.name = `emotion-${emotion.type}`;
      points.userData = {
        layer: 'emotions',
        emotionType: emotion.type,
        intensity: emotion.intensity,
        particleCount,
      };
      layer.add(points);
    });
  }

  /* ---- 6. 反思之镜 ---- */
  _buildReflectionMirror() {
    const layer = this._layers.mirror;

    // 主镜面平面
    const mirrorGeo = new THREE.PlaneGeometry(40, 40, 64, 64);
    const mirrorMat = new THREE.ShaderMaterial({
      vertexShader: WATER_VERTEX_SHADER,
      fragmentShader: WATER_FRAGMENT_SHADER,
      uniforms: {
        time: { value: 0 },
        reflectivity: { value: 0.4 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
    mirror.rotation.x = -Math.PI / 2;
    mirror.position.y = -12;
    mirror.name = 'reflection-mirror';
    mirror.userData = { layer: 'mirror' };
    layer.add(mirror);

    // 边框光圈
    const ringGeo = new THREE.RingGeometry(19.5, 20.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -11.95;
    layer.add(ring);

    this._mirrorMaterial = mirrorMat;
  }

  /* ---- 7. 社交网络 ---- */
  _buildSocialNetwork() {
    const users = this._data.users;
    const connections = this._data.connections;
    const layer = this._layers.social;
    const userPositions = {};

    // 用户节点
    users.forEach((user, i) => {
      const angle = (i / users.length) * Math.PI * 2;
      const r = 8;
      const pos = new THREE.Vector3(
        Math.cos(angle) * r,
        randomRange(-3, 3) + 10,
        Math.sin(angle) * r
      );
      userPositions[user.id] = pos;

      // 人脸图标 - 用球体模拟
      const sphereRadius = 0.5 + user.closeness * 0.5;
      const geo = new THREE.SphereGeometry(sphereRadius, 24, 24);
      const mat = new THREE.MeshPhongMaterial({
        color: 0x42A5F5,
        emissive: 0x1565C0,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.name = user.id;
      mesh.userData = { type: 'user', index: i, data: user, layer: 'social' };
      layer.add(mesh);

      // 眼睛（两个小球）
      const eyeGeo = new THREE.SphereGeometry(sphereRadius * 0.12, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(-sphereRadius * 0.3, sphereRadius * 0.15, sphereRadius * 0.85);
      mesh.add(eyeL);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.position.set(sphereRadius * 0.3, sphereRadius * 0.15, sphereRadius * 0.85);
      mesh.add(eyeR);

      // 瞳孔
      const pupilGeo = new THREE.SphereGeometry(sphereRadius * 0.06, 8, 8);
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
      pupilL.position.z = sphereRadius * 0.02;
      eyeL.add(pupilL);
      const pupilR = new THREE.Mesh(pupilGeo, pupilMat);
      pupilR.position.z = sphereRadius * 0.02;
      eyeR.add(pupilR);

      // 光晕
      const glowGeo = new THREE.SphereGeometry(sphereRadius * 2, 12, 12);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x42A5F5,
        transparent: true,
        opacity: 0.05,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      mesh.add(glow);

      this._interactableObjects.push({
        type: 'user',
        index: i,
        data: user,
        layer: 'social',
        object: mesh,
      });
    });

    // 关系连线
    const linePositions = [];
    connections.forEach(conn => {
      const src = userPositions[conn.source];
      const tgt = userPositions[conn.target];
      if (!src || !tgt) return;

      linePositions.push(src.x, src.y, src.z);
      linePositions.push(tgt.x, tgt.y, tgt.z);
    });

    if (linePositions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: 0x64B5F6,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
      });
      const lines = new THREE.LineSegments(geo, mat);
      lines.name = 'social-connections';
      layer.add(lines);
    }
  }

  /* =========================================================================
   * 动画循环
   * ========================================================================= */

  /** 启动动画循环 */
  _startAnimation() {
    this._lastFpsTime = performance.now();
    this._animate();
  }

  /** 主动画帧 */
  _animate() {
    this._animationId = requestAnimationFrame(this._animate);

    if (this._paused) return;

    const delta = this._clock.getDelta() * this._animationSpeed;
    const elapsed = this._clock.elapsedTime * this._animationSpeed;

    // 更新 FPS
    this._frameCount++;
    const now = performance.now();
    if (now - this._lastFpsTime >= 1000) {
      const fps = Math.round(this._frameCount * 1000 / (now - this._lastFpsTime));
      const fpsEl = this.shadowRoot.querySelector('#fps-counter');
      if (fpsEl) fpsEl.textContent = `${fps} FPS`;
      this._frameCount = 0;
      this._lastFpsTime = now;
    }

    // 更新各层动画
    this._updateMemoryAnimation(elapsed, delta);
    this._updateKnowledgeAnimation(elapsed, delta);
    this._updateGoalAnimation(elapsed, delta);
    this._updateSkillAnimation(elapsed, delta);
    this._updateEmotionAnimation(elapsed, delta);
    this._updateMirrorAnimation(elapsed, delta);
    this._updateSocialAnimation(elapsed, delta);
    this._updateExplosions(delta);
    this._updateCoreLight(elapsed);
    this._updateBackgroundStars(elapsed);

    // 渲染
    this._renderer.render(this._scene, this._camera);
  }

  /** 记忆星云动画 - 星辰呼吸闪烁（着色器内处理），中心辉光脉动 */
  _updateMemoryAnimation(elapsed, delta) {
    const nebula = this._layers.memory?.getObjectByName('memory-nebula');
    if (nebula?.material?.uniforms) {
      nebula.material.uniforms.time.value = elapsed;
    }
    const coreGlow = this._layers.memory?.getObjectByName('memory-core-glow');
    if (coreGlow) {
      coreGlow.scale.setScalar(1 + 0.15 * Math.sin(elapsed * 1.5));
    }
  }

  /** 知识图谱动画 - 节点微弱脉动 */
  _updateKnowledgeAnimation(elapsed, delta) {
    this._layers.knowledge?.children.forEach(child => {
      if (child.userData?.type === 'entity') {
        child.material.emissiveIntensity = 0.3 + 0.15 * Math.sin(elapsed * 2 + child.position.x);
      }
    });
  }

  /** 目标晶体动画 - 旋转和子目标轨道运动 */
  _updateGoalAnimation(elapsed, delta) {
    this._layers.goals?.children.forEach(child => {
      if (!child.userData?.type) return;

      // 自身旋转
      const rs = child.userData.rotationSpeed;
      if (rs) {
        child.rotation.x += rs.x * delta;
        child.rotation.y += rs.y * delta;
        child.rotation.z += rs.z * delta;
      }

      // 子目标轨道运动
      const center = child.userData.orbitCenter;
      if (center) {
        const angle = (child.userData.orbitAngle || 0) + elapsed * (child.userData.orbitSpeed || 0.2);
        const orbitR = 3;
        child.position.x = center.x + Math.cos(angle) * orbitR;
        child.position.z = center.z + Math.sin(angle) * orbitR;
        child.position.y = center.y + Math.sin(angle * 0.7) * 0.5;
      }
    });
  }

  /** 技能光环动画 - 激活脉冲效果 */
  _updateSkillAnimation(elapsed, delta) {
    this._layers.skills?.children.forEach(child => {
      if (!child.userData?.type) return;
      const phase = child.userData.pulsePhase || 0;

      // 持续微弱旋转
      child.rotation.z += 0.3 * delta;

      // 脉冲效果
      if (child.userData.isPulsing) {
        child.material.emissiveIntensity = 0.8 + 0.5 * Math.sin(elapsed * 5 + phase);
        child.scale.setScalar(1 + 0.1 * Math.sin(elapsed * 3 + phase));
      } else {
        child.material.emissiveIntensity = child.userData.baseEmissiveIntensity + 0.1 * Math.sin(elapsed * 1.5 + phase);
      }
    });
  }

  /** 情绪粒子动画 - 不同情绪不同运动模式 */
  _updateEmotionAnimation(elapsed, delta) {
    this._layers.emotions?.children.forEach(child => {
      if (!child.userData?.emotionType) return;

      const positions = child.geometry.attributes.position.array;
      const count = child.userData.particleCount;
      const type = child.userData.emotionType;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        switch (type) {
          case 'joy':
            // 金色上浮粒子
            positions[i3 + 1] += delta * 2;
            if (positions[i3 + 1] > 15) positions[i3 + 1] = -15;
            positions[i3] += Math.sin(elapsed + i) * delta * 0.3;
            break;

          case 'sadness':
            // 蓝色下沉粒子
            positions[i3 + 1] -= delta * 1.5;
            if (positions[i3 + 1] < -15) positions[i3 + 1] = 15;
            positions[i3] += Math.cos(elapsed * 0.5 + i) * delta * 0.2;
            break;

          case 'anger':
            // 红色快速粒子
            positions[i3] += Math.sin(elapsed * 3 + i * 0.1) * delta * 3;
            positions[i3 + 1] += Math.cos(elapsed * 4 + i * 0.2) * delta * 2;
            positions[i3 + 2] += Math.sin(elapsed * 2 + i * 0.3) * delta * 2.5;
            // 边界约束
            for (let j = 0; j < 3; j++) {
              if (Math.abs(positions[i3 + j]) > 20) positions[i3 + j] *= -0.9;
            }
            break;

          case 'curiosity':
            // 绿色旋转粒子
            const cx = positions[i3], cz = positions[i3 + 2];
            const dist = Math.sqrt(cx * cx + cz * cz) || 1;
            positions[i3] += (-cz / dist) * delta * 1.5;
            positions[i3 + 2] += (cx / dist) * delta * 1.5;
            positions[i3 + 1] += Math.sin(elapsed + i * 0.5) * delta * 0.5;
            break;

          default:
            // 默认缓慢漂浮
            positions[i3] += Math.sin(elapsed + i) * delta * 0.3;
            positions[i3 + 1] += Math.cos(elapsed * 0.7 + i) * delta * 0.2;
            break;
        }
      }
      child.geometry.attributes.position.needsUpdate = true;
    });
  }

  /** 反思之镜动画 - 水波纹效果（着色器处理） */
  _updateMirrorAnimation(elapsed, delta) {
    if (this._mirrorMaterial?.uniforms) {
      this._mirrorMaterial.uniforms.time.value = elapsed;
    }
  }

  /** 社交网络动画 - 节点微弱漂浮 */
  _updateSocialAnimation(elapsed, delta) {
    this._layers.social?.children.forEach(child => {
      if (child.userData?.type === 'user') {
        const base = child.position.clone();
        child.position.y += Math.sin(elapsed * 0.8 + child.position.x) * delta * 0.2;
      }
    });
  }

  /** 更新爆炸特效 */
  _updateExplosions(delta) {
    for (let i = this._explosions.length - 1; i >= 0; i--) {
      const exp = this._explosions[i];
      exp.update(delta);
      if (!exp.active) {
        this._layers.goals.remove(exp.mesh);
        exp.dispose();
        this._explosions.splice(i, 1);
      }
    }
  }

  /** 核心光源呼吸效果 */
  _updateCoreLight(elapsed) {
    if (this._coreLight) {
      this._coreLight.intensity = 1.5 + 0.5 * Math.sin(elapsed * 0.8);
    }
  }

  /** 背景星空缓慢旋转 */
  _updateBackgroundStars(elapsed) {
    if (this._bgStars) {
      this._bgStars.rotation.y = elapsed * 0.01;
      this._bgStars.rotation.x = Math.sin(elapsed * 0.005) * 0.02;
    }
  }

  /* =========================================================================
   * 交互功能
   * ========================================================================= */

  /** 鼠标点击事件 */
  _onClick(event) {
    const rect = this._renderer.domElement.getBoundingClientRect();
    this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this._raycaster.setFromCamera(this._mouse, this._camera);
    const intersects = this._raycaster.intersectObjects(this._scene.children, true);

    // 关闭右键菜单
    this._hideContextMenu();

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const userData = hit.userData;
      if (userData && userData.type) {
        this._selectedObject = userData;
        this._showTooltipFor(userData, event);
        return;
      }
    }

    this._hideTooltip();
    this._selectedObject = null;
  }

  /** 鼠标移动事件（悬停检测） */
  _onMouseMove(event) {
    const rect = this._renderer.domElement.getBoundingClientRect();
    this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // 更新 tooltip 位置（如果已显示）
    const tooltip = this.shadowRoot.querySelector('#tooltip');
    if (tooltip.classList.contains('visible')) {
      tooltip.style.left = (event.clientX - rect.left + 15) + 'px';
      tooltip.style.top = (event.clientY - rect.top - 10) + 'px';
    }

    // 悬停高亮（节流处理）
    if (this._hoverThrottle) return;
    this._hoverThrottle = true;
    setTimeout(() => { this._hoverThrottle = false; }, 100);

    this._raycaster.setFromCamera(this._mouse, this._camera);
    const intersects = this._raycaster.intersectObjects(this._scene.children, true);

    // 取消之前的高亮
    if (this._hoveredObject && this._hoveredObject !== this._selectedObject) {
      this._unhighlightObject(this._hoveredObject);
    }

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const userData = hit.userData;
      if (userData && userData.type && userData !== this._selectedObject) {
        this._hoveredObject = userData;
        this._highlightObject(userData);
      }
    } else {
      this._hoveredObject = null;
    }
  }

  /** 右键菜单事件 */
  _onContextMenu(event) {
    event.preventDefault();
    const rect = this._renderer.domElement.getBoundingClientRect();

    this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this._raycaster.setFromCamera(this._mouse, this._camera);
    const intersects = this._raycaster.intersectObjects(this._scene.children, true);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.userData?.type) {
        this._contextTarget = hit.userData;
        this._showContextMenu(event.clientX - rect.left, event.clientY - rect.top);
        return;
      }
    }
    this._hideContextMenu();
  }

  /** 键盘快捷键 */
  _onKeyDown(event) {
    const key = event.key;

    // 忽略搜索框内的输入
    const searchBox = this.shadowRoot.querySelector('#search-box');
    if (searchBox && this.shadowRoot.activeElement === searchBox) return;

    switch (key) {
      case '1': this._switchView(VIEW_MODES.MEMORY); break;
      case '2': this._switchView(VIEW_MODES.KNOWLEDGE); break;
      case '3': this._switchView(VIEW_MODES.GOALS); break;
      case '4': this._switchView(VIEW_MODES.SKILLS); break;
      case '5': this._switchView(VIEW_MODES.EMOTIONS); break;
      case '6': this._switchView(VIEW_MODES.SOCIAL); break;
      case '7': this._switchView(VIEW_MODES.PANORAMIC); break;
      case 'h':
      case 'H':
        this._togglePanel();
        break;
      case 'r':
      case 'R':
        this._orbitControls?.reset();
        break;
      case ' ':
        event.preventDefault();
        this._paused = !this._paused;
        break;
      case 'Escape':
        this._hideContextMenu();
        this._hideTooltip();
        break;
    }
  }

  /** 窗口大小变化处理 */
  _onResize() {
    const container = this.shadowRoot.querySelector('#canvas-container');
    if (!container || !this._renderer || !this._camera) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(w, h);
  }

  /* =========================================================================
   * UI 交互
   * ========================================================================= */

  /** 初始化 UI 事件绑定 */
  _initUIBindings() {
    const root = this.shadowRoot;

    // 视图切换按钮
    root.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._switchView(btn.dataset.view);
      });
    });

    // 动画速度滑块
    const speedSlider = root.querySelector('#speed-slider');
    const speedValue = root.querySelector('#speed-value');
    if (speedSlider) {
      speedSlider.addEventListener('input', () => {
        this._animationSpeed = parseFloat(speedSlider.value);
        if (speedValue) speedValue.textContent = `${this._animationSpeed.toFixed(1)}x`;
      });
    }

    // 粒子密度滑块
    const densitySlider = root.querySelector('#density-slider');
    const densityValue = root.querySelector('#density-value');
    if (densitySlider) {
      densitySlider.addEventListener('input', () => {
        const val = parseInt(densitySlider.value);
        if (densityValue) densityValue.textContent = `${val}%`;
        // 更新星云亮度作为密度的代理指标
        const nebula = this._layers.memory?.getObjectByName('memory-nebula');
        if (nebula?.material?.uniforms) {
          nebula.material.uniforms.globalBrightness.value = val / 100;
        }
      });
    }

    // 元素可见性开关
    root.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('on');
        const layerName = btn.dataset.layer;
        if (this._layers[layerName]) {
          this._layers[layerName].visible = btn.classList.contains('on');
        }
      });
    });

    // 搜索框
    const searchBox = root.querySelector('#search-box');
    if (searchBox) {
      searchBox.addEventListener('input', () => {
        this._searchQuery = searchBox.value.trim().toLowerCase();
        this._applySearch();
      });
    }

    // 切换面板按钮
    const toggleBtn = root.querySelector('#toggle-panel-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this._togglePanel());
    }

    // 右键菜单项
    root.querySelectorAll('.ctx-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        if (this._contextTarget) {
          this._handleContextAction(action, this._contextTarget);
        }
        this._hideContextMenu();
      });
    });

    // 点击画布空白处关闭菜单
    this._renderer.domElement.addEventListener('pointerdown', () => {
      this._hideContextMenu();
    });

    // 时间轴
    const timeline = root.querySelector('#timeline');
    if (timeline) {
      timeline.addEventListener('click', (e) => {
        const rect = timeline.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        const progress = root.querySelector('#timeline-progress');
        if (progress) progress.style.width = (ratio * 100) + '%';
        this._applyTimelineSnapshot(ratio);
      });
    }
  }

  /** 初始化控制面板（placeholder，被 _initUIBindings 替代） */
  _initControls() {
    // 已在 _initUIBindings 中实现
  }

  /** 切换视图模式 */
  _switchView(mode) {
    this._currentView = mode;

    // 更新按钮状态
    this.shadowRoot.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === mode);
    });

    // 根据视图模式切换可见性
    const layerNames = ['memory', 'knowledge', 'goals', 'skills', 'emotions', 'mirror', 'social'];

    if (mode === VIEW_MODES.ALL || mode === VIEW_MODES.PANORAMIC) {
      layerNames.forEach(name => {
        if (this._layers[name]) this._layers[name].visible = true;
      });
    } else {
      layerNames.forEach(name => {
        if (this._layers[name]) {
          this._layers[name].visible = (name === mode);
        }
      });
      // 在特定视图中也显示反思之镜
      if (this._layers.mirror && mode !== VIEW_MODES.MEMORY) {
        // 保持镜面可见
      }
    }

    // 更新可见性开关按钮
    this.shadowRoot.querySelectorAll('.toggle-btn').forEach(btn => {
      const layerName = btn.dataset.layer;
      if (layerName && this._layers[layerName]) {
        btn.classList.toggle('on', this._layers[layerName].visible);
      }
    });
  }

  /** 切换控制面板显隐 */
  _togglePanel() {
    const panel = this.shadowRoot.querySelector('#control-panel');
    const btn = this.shadowRoot.querySelector('#toggle-panel-btn');
    if (panel) {
      panel.classList.toggle('hidden');
    }
  }

  /** 显示悬浮框 */
  _showTooltipFor(userData, event) {
    const tooltip = this.shadowRoot.querySelector('#tooltip');
    const titleEl = this.shadowRoot.querySelector('#tooltip-title');
    const contentEl = this.shadowRoot.querySelector('#tooltip-content');
    if (!tooltip || !titleEl || !contentEl) return;

    const rect = this._renderer.domElement.getBoundingClientRect();
    let title = '';
    let content = '';

    switch (userData.type) {
      case 'memory': {
        const mem = userData.data;
        title = mem.title;
        const sentimentLabel = mem.sentiment > 0.3 ? '积极' : mem.sentiment < -0.3 ? '消极' : '中性';
        content = `
          <p>${mem.content}</p>
          <p>重要性: ${(mem.importance * 100).toFixed(0)}% | 访问: ${mem.accessCount}次</p>
          <p>情绪: ${sentimentLabel} (${mem.sentiment.toFixed(2)})</p>
          <span class="tag">记忆</span> <span class="tag">${sentimentLabel}</span>
        `;
        break;
      }
      case 'entity': {
        const ent = userData.data;
        title = ent.name;
        content = `
          <p>${ent.description}</p>
          <p>类型: ${ent.type} | 连接数: ${ent.connections}</p>
          <span class="tag">${ent.type}</span>
        `;
        break;
      }
      case 'goal': {
        const goal = userData.data;
        title = goal.title;
        const stateLabel = { completed: '已完成', active: '进行中', paused: '已暂停', abandoned: '已放弃' };
        content = `
          <p>状态: ${stateLabel[goal.state] || goal.state}</p>
          <p>进度: ${(goal.progress * 100).toFixed(0)}%</p>
          <p>子目标: ${goal.children ? goal.children.length : 0}个</p>
          <span class="tag">${goal.state}</span>
        `;
        break;
      }
      case 'skill': {
        const skill = userData.data;
        title = skill.name;
        content = `
          <p>类型: ${skill.type}</p>
          <p>熟练度: ${(skill.proficiency * 100).toFixed(0)}%</p>
          <span class="tag">${skill.type}</span>
        `;
        break;
      }
      case 'user': {
        const user = userData.data;
        title = user.name;
        content = `
          <p>角色: ${user.role}</p>
          <p>亲密度: ${(user.closeness * 100).toFixed(0)}%</p>
          <span class="tag">${user.role}</span>
        `;
        break;
      }
    }

    titleEl.textContent = title;
    contentEl.innerHTML = content;

    tooltip.style.left = (event.clientX - rect.left + 15) + 'px';
    tooltip.style.top = (event.clientY - rect.top - 10) + 'px';
    tooltip.classList.add('visible');
  }

  /** 隐藏悬浮框 */
  _hideTooltip() {
    const tooltip = this.shadowRoot.querySelector('#tooltip');
    if (tooltip) tooltip.classList.remove('visible');
  }

  /** 显示右键菜单 */
  _showContextMenu(x, y) {
    const menu = this.shadowRoot.querySelector('#context-menu');
    if (!menu) return;
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.add('visible');
  }

  /** 隐藏右键菜单 */
  _hideContextMenu() {
    const menu = this.shadowRoot.querySelector('#context-menu');
    if (menu) menu.classList.remove('visible');
  }

  /** 处理右键菜单动作 */
  _handleContextAction(action, userData) {
    switch (action) {
      case 'focus':
        if (userData.object) {
          this._orbitControls?.focusOn(userData.object.position, 10);
        }
        break;

      case 'highlight':
        this._highlightSameType(userData.type);
        break;

      case 'hide':
        if (this._layers[userData.layer]) {
          this._layers[userData.layer].visible = false;
        }
        break;

      case 'isolate':
        this._isolateType(userData.type);
        break;

      case 'details':
        this._showTooltipFor(userData, { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
        break;
    }
  }

  /** 高亮同类元素 */
  _highlightSameType(type) {
    this._interactableObjects.forEach(obj => {
      if (obj.object && obj.object.material) {
        if (obj.type === type) {
          obj.object.material.emissiveIntensity = 1.0;
        } else {
          obj.object.material.emissiveIntensity = 0.1;
        }
      }
    });

    // 3秒后恢复
    setTimeout(() => {
      this._interactableObjects.forEach(obj => {
        if (obj.object && obj.object.material) {
          obj.object.material.emissiveIntensity = 0.5;
        }
      });
    }, 3000);
  }

  /** 隔离特定类型 */
  _isolateType(type) {
    const layerMap = {
      memory: 'memory',
      entity: 'knowledge',
      goal: 'goals',
      skill: 'skills',
      user: 'social',
    };
    const targetLayer = layerMap[type];

    Object.keys(this._layers).forEach(name => {
      if (this._layers[name]) {
        this._layers[name].visible = (name === targetLayer);
      }
    });
  }

  /** 高亮特定对象 */
  _highlightObject(userData) {
    if (userData.object && userData.object.material) {
      userData.object.material.emissiveIntensity = 1.0;
    }
  }

  /** 取消高亮对象 */
  _unhighlightObject(userData) {
    if (userData.object && userData.object.material) {
      const baseIntensity = userData.data?.proficiency !== undefined ? 0.5 : 0.4;
      userData.object.material.emissiveIntensity = baseIntensity;
    }
  }

  /** 搜索应用 */
  _applySearch() {
    const query = this._searchQuery;

    this._interactableObjects.forEach(obj => {
      if (!obj.object || !obj.object.material) return;

      if (!query) {
        obj.object.material.opacity = obj.type === 'entity' ? 0.85 : 0.7;
        return;
      }

      const data = obj.data;
      let text = '';
      switch (obj.type) {
        case 'memory': text = data.title + ' ' + (data.content || ''); break;
        case 'entity': text = data.name + ' ' + data.type; break;
        case 'goal':   text = data.title + ' ' + data.state; break;
        case 'skill':  text = data.name + ' ' + data.type; break;
        case 'user':   text = data.name + ' ' + data.role; break;
      }

      if (text.toLowerCase().includes(query)) {
        obj.object.material.opacity = 1.0;
        obj.object.material.emissiveIntensity = 1.0;
      } else {
        obj.object.material.opacity = 0.1;
        obj.object.material.emissiveIntensity = 0.05;
      }
    });
  }

  /** 应用时间轴快照 */
  _applyTimelineSnapshot(ratio) {
    // 时间轴进度反馈（演示效果）
    const progress = this.shadowRoot.querySelector('#timeline-progress');
    if (progress) progress.style.width = (ratio * 100) + '%';

    // 根据时间轴位置调整元素的可见性和状态
    // 这里模拟历史回放效果
    this._data.memories.forEach((mem, i) => {
      const visible = (i / this._data.memories.length) < ratio;
      // 通过改变大小来模拟时间流逝
    });
  }

  /** 触发目标完成爆炸特效 */
  _triggerGoalExplosion(position) {
    const explosion = new ParticleExplosion(position, 0x00E676, 300, 2.5);
    this._layers.goals.add(explosion.mesh);
    this._explosions.push(explosion);
  }

  /** 隐藏加载画面 */
  _hideLoadingScreen() {
    const screen = this.shadowRoot.querySelector('#loading-screen');
    if (screen) {
      setTimeout(() => {
        screen.classList.add('fade-out');
        setTimeout(() => screen.remove(), 800);
      }, 500);
    }
  }

  /** 更新统计数字 */
  _updateStats() {
    const root = this.shadowRoot;
    const setVal = (id, val) => {
      const el = root.querySelector(`#${id}`);
      if (el) el.textContent = val;
    };

    setVal('stat-memories', this._data.memories.length);
    setVal('stat-entities', this._data.entities.length);
    setVal('stat-goals', this._data.goals.reduce((sum, g) => sum + 1 + (g.children?.length || 0), 0));
    setVal('stat-skills', this._data.skills.length);
    setVal('stat-connections', this._data.relations.length + this._data.connections.length);
  }

  /* =========================================================================
   * 资源清理
   * ========================================================================= */

  /** 销毁所有资源 */
  _dispose() {
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
    }

    // 清理爆炸特效
    this._explosions.forEach(e => e.dispose());
    this._explosions = [];

    // 清理场景
    if (this._scene) {
      this._scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    }

    // 清理渲染器
    if (this._renderer) {
      this._renderer.dispose();
    }
  }

  /* =========================================================================
   * 公共 API
   * ========================================================================= */

  /**
   * 更新记忆数据
   * @param {Array} memories - 记忆数据数组
   */
  updateMemories(memories) {
    this._data.memories = memories;
    // 清理旧的
    while (this._layers.memory.children.length) {
      const child = this._layers.memory.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      this._layers.memory.remove(child);
    }
    this._buildMemoryNebula();
    this._updateStats();
  }

  /**
   * 更新知识图谱数据
   * @param {Array} entities - 实体数组
   * @param {Array} relations - 关系数组
   */
  updateKnowledgeGraph(entities, relations) {
    this._data.entities = entities;
    this._data.relations = relations;
    // 重新运行力导向布局
    this._forceLayout.clear();
    entities.forEach(e => this._forceLayout.addNode(e.id, e.position));
    relations.forEach(r => this._forceLayout.addEdge(r.source, r.target, r.weight));
    for (let i = 0; i < 50; i++) this._forceLayout.step();
    const positions = this._forceLayout.getPositions();
    entities.forEach(e => { if (positions[e.id]) e.position.copy(positions[e.id]); });
    // 重建
    while (this._layers.knowledge.children.length) {
      const child = this._layers.knowledge.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      this._layers.knowledge.remove(child);
    }
    this._buildKnowledgeGraph();
    this._updateStats();
  }

  /**
   * 更新情绪数据
   * @param {Array} emotions - 情绪数组
   */
  updateEmotions(emotions) {
    this._data.emotions = emotions;
    while (this._layers.emotions.children.length) {
      const child = this._layers.emotions.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      this._layers.emotions.remove(child);
    }
    this._buildEmotionParticles();
  }

  /**
   * 标记目标完成并触发爆炸特效
   * @param {string} goalId - 目标ID
   */
  completeGoal(goalId) {
    const goalMesh = this._layers.goals?.getObjectByName(goalId);
    if (goalMesh) {
      this._triggerGoalExplosion(goalMesh.position);
      goalMesh.material.color.setHex(GOAL_STATE_COLORS.completed);
      goalMesh.material.emissive.setHex(GOAL_STATE_COLORS.completed);
      goalMesh.material.opacity = 1.0;
    }
    // 更新数据
    const findGoal = (goals) => {
      for (const g of goals) {
        if (g.id === goalId) return g;
        if (g.children) {
          const found = findGoal(g.children);
          if (found) return found;
        }
      }
      return null;
    };
    const goal = findGoal(this._data.goals);
    if (goal) {
      goal.state = 'completed';
      goal.progress = 1.0;
    }
  }

  /**
   * 获取当前视图模式
   * @returns {string}
   */
  getViewMode() {
    return this._currentView;
  }

  /**
   * 切换暂停/播放
   * @param {boolean} [paused] - 可选，指定暂停状态
   */
  togglePause(paused) {
    this._paused = paused !== undefined ? paused : !this._paused;
  }

  /**
   * 导出当前状态快照
   * @returns {Object} 包含所有可视化数据的快照对象
   */
  exportSnapshot() {
    return {
      timestamp: Date.now(),
      viewMode: this._currentView,
      memories: this._data.memories.map(m => ({ ...m, position: { x: m.position.x, y: m.position.y, z: m.position.z } })),
      emotions: [...this._data.emotions],
      goals: JSON.parse(JSON.stringify(this._data.goals)),
    };
  }
}

/* =========================================================================
 * 注册自定义元素
 * ========================================================================= */
if (!customElements.get('consciousness-3d-space')) {
  customElements.define('consciousness-3d-space', Consciousness3DSpace);
}

/* =========================================================================
 * 导出（兼容 ES Module 和全局引用）
 * ========================================================================= */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Consciousness3DSpace };
}

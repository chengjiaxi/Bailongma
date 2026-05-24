// ACUI ThoughtPanel — 小白龙状态可视化面板
// Usage: ui_show("ThoughtPanel", { state, thought, focus, recentActions, cycle, memories, skills })
// state: 'idle' | 'thinking' | 'executing' | 'done' | 'error'

const STATUS_MAP = {
  idle:     { icon: '⚪', color: '#64748b', label: '空闲' },
  thinking: { icon: '💭', color: '#a5b4fc', label: '思考中' },
  executing:{ icon: '⚡', color: '#22d3ee', label: '执行中' },
  done:     { icon: '✅', color: '#4ade80', label: '完成' },
  error:    { icon: '❌', color: '#f87171', label: '出错' },
}

const CSS = `
:host{display:block;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,"PingFang SC","Microsoft YaHei",sans-serif;background:rgba(15,23,42,0.92);border:1px solid VAR_COLOR44;border-radius:16px;overflow:hidden;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);color:#e2e8f0;max-height:70vh;display:flex;flex-direction:column;width:440px;box-shadow:0 8px 32px rgba(0,0,0,0.4),0 0 0 1px VAR_COLOR22;transition:border-color 0.4s ease,box-shadow 0.4s ease;pointer-events:auto}
.hd{padding:14px 18px 12px;border-bottom:1px solid rgba(99,102,241,0.15);display:flex;align-items:center;justify-content:space-between;background:rgba(99,102,241,0.06)}
.hl{display:flex;align-items:center;gap:10px}
.dot{width:10px;height:10px;border-radius:50%;background:VAR_COLOR;box-shadow:0 0 8px VAR_COLOR66;flex-shrink:0;transition:all 0.4s ease}
.dot.pulse{animation:pd 1.2s ease-in-out infinite}
@keyframes pd{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}
.hd h2{margin:0;font-size:14px;font-weight:600;color:#e2e8f0;letter-spacing:0.3px}
.badge{font-size:11px;color:VAR_COLOR;background:VAR_COLOR18;padding:2px 10px;border-radius:10px;font-weight:500;transition:all 0.4s ease}
.bd{padding:8px 14px;overflow-y:auto;flex:1;max-height:45vh}
.bd::-webkit-scrollbar{width:4px}.bd::-webkit-scrollbar-track{background:transparent}.bd::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.3);border-radius:2px}
.sec{margin-bottom:10px}.sec:last-child{margin-bottom:0}
.st{font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;display:flex;align-items:center;gap:6px}
.st:after{content:"";flex:1;height:1px;background:rgba(100,116,139,0.15)}
.tb{background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.15);border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.6;color:#cbd5e1;min-height:20px;white-space:pre-wrap;word-break:break-word}
.tb:empty:before{content:"—";color:#475569}
.al{display:flex;flex-direction:column;gap:3px}
.ai{display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:6px;font-size:12px;color:#94a3b8;background:rgba(148,163,184,0.03)}
.aii{flex-shrink:0;font-size:11px}.ait{flex:1}
.es{font-size:12px;color:#475569;padding:8px 0;text-align:center}
.mg{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:11px;color:#64748b}
.mi{display:flex;gap:4px}.ml{color:#475569}.mv{color:#94a3b8}
.ft{border-top:1px solid rgba(99,102,241,0.1);padding:8px 18px;display:flex;align-items:center;gap:10px;font-size:10px;color:#475569}
.status-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#22d3ee;animation:pd 1.5s ease-in-out infinite}
`
const _sheet = new CSSStyleSheet()
_sheet.replaceSync(CSS)

function escapeHtml(t) { if (!t) return ''; const d = document.createElement('div'); d.textContent = t; return d.innerHTML }

class AcuiThoughtPanel extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = [_sheet]
    this._props = {}
  }

  set props(v) {
    this._props = v || {}
    this._render()
  }

  connectedCallback() { this._render() }

  _render() {
    const p = this._props || {}
    const state = p.state || 'idle'
    const st = STATUS_MAP[state] || STATUS_MAP.idle
    const thought = p.thought || ''
    const focus = p.focus || ''
    const cycle = p.cycle || ''
    const skills = p.skills || ''
    const memories = p.memories || ''
    const acts = p.recentActions || []
    const isActive = state === 'executing' || state === 'thinking'

    const color = st.color
    let css = CSS.replace(/VAR_COLOR/g, color)
    css = css.replace(/VAR_COLOR44/g, color + '44')
    css = css.replace(/VAR_COLOR66/g, color + '66')
    css = css.replace(/VAR_COLOR18/g, color + '18')
    css = css.replace(/VAR_COLOR22/g, color + '22')

    const dotClass = isActive ? 'dot pulse' : 'dot'

    let ah = '<div class="es">暂无操作记录</div>'
    if (acts.length > 0) {
      ah = acts.map(a => {
        const txt = typeof a === 'string' ? a : (a.text || '')
        const ico = a.icon || '▸'
        return `<div class="ai"><span class="aii">${ico}</span><span class="ait">${escapeHtml(txt)}</span></div>`
      }).join('')
    }

    let ctxHtml = ''
    if (focus || cycle || skills || memories) {
      ctxHtml = '<div class="sec"><div class="st">上下文</div><div class="mg">'
      if (focus) ctxHtml += `<span class="mi"><span class="ml">焦点</span><span class="mv">${escapeHtml(focus)}</span></span>`
      if (cycle) ctxHtml += `<span class="mi"><span class="ml">阶段</span><span class="mv">${escapeHtml(cycle)}</span></span>`
      if (skills) ctxHtml += `<span class="mi"><span class="ml">技能</span><span class="mv">${escapeHtml(skills)}</span></span>`
      if (memories) ctxHtml += `<span class="mi"><span class="ml">记忆</span><span class="mv">${escapeHtml(memories)}</span></span>`
      ctxHtml += '</div></div>'
    }

    this.shadowRoot.innerHTML = `
<style>${css}</style>
<div class="hd">
  <div class="hl"><div class="${dotClass}"></div><h2>小白龙 · 执行面板</h2></div>
  <span class="badge">${st.icon} ${st.label}</span>
</div>
<div class="bd">
  ${thought ? `<div class="sec"><div class="st">当前思考</div><div class="tb">${escapeHtml(thought)}</div></div>` : ''}
  <div class="sec"><div class="st">执行记录</div><div class="al">${ah}</div></div>
  ${ctxHtml}
</div>
<div class="ft">
  <span class="${isActive ? 'status-dot' : ''}" style="${isActive ? '' : 'width:5px;height:5px;border-radius:50%;background:#64748b;display:inline-block'}"></span>
  <span>${state === 'idle' ? '等待指令' : '运行中'}</span>
  <span style="margin-left:auto">${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>
</div>`
  }
}

AcuiThoughtPanel.tagName = 'acui-thought-panel'
customElements.define(AcuiThoughtPanel.tagName, AcuiThoughtPanel)

export { AcuiThoughtPanel }

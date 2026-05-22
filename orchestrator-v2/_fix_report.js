const fs = require('fs');
const reportContent = `// ============================================================
// 辩论报告生成器
// ============================================================

const fs2 = require('fs');

function generateReport(input, state, stepLog) {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const report = [];

  report.push('# 辩论总结报告');
  report.push('');
  report.push('---');
  report.push('**问题**: ' + input);
  report.push('**时间**: ' + now);
  report.push('**步骤统计**: ' + stepLog.filter(s => s.status === 'done' || s.status === 'fallback').length + '/' + stepLog.length + ' 步完成');
  report.push('');

  report.push('## 1. 问题定义');
  report.push(state.defined || '(无)');
  report.push('');

  report.push('## 2. 幕僚表态');
  if (state.opinions && state.opinions.length > 0) {
    for (const o of state.opinions) {
      report.push('### ' + (o.emoji || '') + ' ' + (o.persona || ''));
      report.push(o.opinion || '');
      report.push('');
    }
  } else {
    report.push('暂无幕僚表态数据');
  }

  report.push('## 3. 冲突维度');
  if (state.dimensions && state.dimensions.length > 0) {
    state.dimensions.forEach((d, i) => {
      report.push('### 维度 ' + (i+1));
      report.push(d);
      report.push('');
    });
  } else {
    report.push('未提炼出明确的冲突维度');
  }

  report.push('## 4. 维度辩论');
  if (state.debates && state.debates.length > 0) {
    state.debates.forEach((d, i) => {
      report.push('### 维度 ' + (i+1) + ': ' + (d.dimension || '').substring(0, 100));
      report.push(d.summary || '(无辩论摘要)');
      report.push('');
    });
  } else {
    report.push('未进行维度辩论');
  }

  report.push('## 5. 秘书总结');
  report.push(state.summary || '(无)');
  report.push('');

  report.push('## 6. 行动建议');
  report.push(state.harvest || '(无)');
  report.push('');

  report.push('---');
  report.push('## 附录: 执行日志');
  if (stepLog && stepLog.length > 0) {
    for (const log of stepLog) {
      report.push('- Step ' + log.step + ': [' + log.status + '] ' + ((log.detail || '').substring(0, 80)));
    }
  }
  report.push('');

  return report.join('\n');
}

function saveReport(input, state, stepLog, filePath) {
  const report = generateReport(input, state, stepLog);
  fs2.writeFileSync(filePath, report, 'utf8');
  return filePath;
}

module.exports = { generateReport, saveReport };
`;

fs.writeFileSync('D:/q/Bailongma/orchestrator-v2/debate/report.js', reportContent, 'utf8');
console.log('OK');

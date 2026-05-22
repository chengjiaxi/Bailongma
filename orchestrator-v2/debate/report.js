// report.js - regenerated
const fs2 = require("fs");
function generateReport(input, state, stepLog){
const now=new Date().toISOString().replace("T"," ").substring(0,19);
const r=[];
r.push("# Debate Summary Report");r.push("");r.push("---");
r.push("**Question**: "+input);
r.push("**Time**: "+now);
r.push("**Steps**: "+stepLog.filter(s=>s.status==="done"||s.status==="fallback").length+"/"+stepLog.length);
r.push("");
r.push("# Problem Definition");
r.push(state.defined||"-");r.push("");
r.push("# Advisor Opinions");
if(state.opinions&&state.opinions.length>0){for(const o of state.opinions){r.push("### "+(o.emoji||"")+" "+(o.persona||""));r.push(o.opinion||"");r.push("");}}else{r.push("-");}
r.push("# Conflict Dimensions");
if(state.dimensions&&state.dimensions.length>0){state.dimensions.forEach((d,i)=>{r.push("### Dimension "+(i+1));r.push(d);r.push("");});}else{r.push("-");}
r.push("# Dimension Debates");
if(state.debates&&state.debates.length>0){state.debates.forEach((d,i)=>{r.push("### Dimension "+(i+1)+": "+(d.dimension||"").substring(0,100));r.push(d.summary||"-");r.push("");});}else{r.push("-");}
r.push("# Secretary Summary");
r.push(state.summary||"-");r.push("");
r.push("# Action Items");
r.push(state.harvest||"-");r.push("");
r.push("---");r.push("## Appendix: Execution Log");
if(stepLog&&stepLog.length>0){for(const l of stepLog){r.push("- Step "+l.step+": ["+l.status+"] "+(l.detail||"").substring(0,80));}}r.push("");
return r.join("\n");}
function saveReport(input,state,stepLog,filePath){const report=generateReport(input,state,stepLog);fs2.writeFileSync(filePath,report,"utf8");return filePath;}
module.exports={generateReport,saveReport};
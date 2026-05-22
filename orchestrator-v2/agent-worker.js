const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

class AgentWorker {
  constructor(id, task, context, sessionStore) {
    this.id = id;
    this.task = task;
    this.context = context;
    this.store = sessionStore;
    this.process = null;
    this.status = "idle";
  }

  async run() {
    this.status = "running";
    this.store.appendEvent(this.id, { type: "status", status: "running", ts: new Date().toISOString() });
    const role = this.task.roles && this.task.roles.length > 0 ? this.task.roles[0] : null;
    return new Promise((resolve) => {
      const agentCtx = { task: { id: this.task.id, name: this.task.name, target: this.task.target, priority: this.task.priority },
        role: role ? { id: role.id, name: role.name, emoji: role.emoji, description: role.description, prompt: role.prompt } : null,
        llmConfig: { baseUrl: (process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, ""),
          model: process.env.LLM_MODEL || process.env.OPENAI_MODEL || "gpt-4o",
          apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "" },
        timestamp: new Date().toISOString() };
      const ctxJson = JSON.stringify(agentCtx);
      let script = "const ctx = " + ctxJson + ";\n";
      script += "async function runAgent() {\n";
      script += "const steps = [];\n";
      script += "const startTime = Date.now();\n";
      script += "if (ctx.role) {\n";
      script += "steps.push({ type: \"identity\", role: ctx.role.name, emoji: ctx.role.emoji, content: \"Assuming role: \" + ctx.role.emoji + \" \" + ctx.role.name });\n";
      script += "}\n";
      script += "const messages = [];\n";
      script += "if (ctx.role && ctx.role.prompt) {\n";
      script += "messages.push({ role: \"system\", content: ctx.role.prompt + \"\\n\\n\" + ctx.role.name + \"\" + ctx.role.description });\n";
      script += "} else {\n";
      script += "messages.push({ role: \"system\", content: \"You are a professional AI assistant.\" });\n";
      script += "}\n";
      script += "messages.push({ role: \"user\", content: ctx.task.target });\n";
      script += "steps.push({ type: \"llm\", action: \"calling \" + ctx.llmConfig.model });\n";
      script += "let llmResponse = \"\";\n";
      script += "let modelInfo = ctx.llmConfig.model;\n";
      script += "let errorInfo = null;\n";
      script += "try {\n";
      script += "const url = ctx.llmConfig.baseUrl + \"/chat/completions\";\n";
      script += "const r = await fetch(url, { method: \"POST\", headers: { \"Content-Type\": \"application/json\", \"Authorization\": \"Bearer \" + ctx.llmConfig.apiKey }, body: JSON.stringify({ model: ctx.llmConfig.model, messages: messages, max_tokens: 2048, temperature: 0.7 }) });\n";
      script += "if (!r.ok) { const e = await r.text().catch(()=>\"\"); throw new Error(\"LLM \" + r.status + \": \" + e.slice(0,200)); }\n";
      script += "const d = await r.json();\n";
      script += "modelInfo = d.model || ctx.llmConfig.model;\n";
      script += "llmResponse = d.choices && d.choices[0] && d.choices[0].message ? d.choices[0].message.content : JSON.stringify(d);\n";
      script += "} catch (err) { errorInfo = err.message; llmResponse = \"[LLM Error] \" + err.message; }\n";
      script += "const elapsed = Date.now() - startTime;\n";
      script += "steps.push({ type: \"llm_result\", duration: elapsed + \"ms\", model: modelInfo, error: errorInfo });\n";
      script += "const result = { summary: (ctx.role ? ctx.role.emoji + \" [\" + ctx.role.name + \"] \" : \"\") + \"Processed: \" + ctx.task.name, steps: steps, output: (ctx.role ? \"=== \" + ctx.role.name + \" Analysis ===\\n\" : \"\") + llmResponse, roleUsed: ctx.role ? ctx.role.id : null, model: modelInfo, duration: elapsed + \"ms\", error: errorInfo };\n";
      script += "process.stdout.write(JSON.stringify(result));\n";
      script += "}\n";
      script += "runAgent().then(() => process.exit(0)).catch(e => { process.stderr.write(e.message); process.exit(1); });\n";
      const child = spawn("node", ["-e", script]);
      let output = "";
      child.stdout.on("data", (d) => { output += d; });
      child.stderr.on("data", () => {});
      child.on("close", (code) => {
        this.status = code === 0 ? "completed" : "failed";
        this.store.updateStatus(this.id, this.status, output);
        this.store.appendEvent(this.id, { type: "status", status: this.status, ts: new Date().toISOString() });
        try { resolve(JSON.parse(output)); }
        catch { resolve({ summary: this.task.name + " (fallback)", raw: output.slice(0,500), status: this.status }); }
      });
    });
  }
  getStatus() { return this.status; }
}
module.exports = AgentWorker;
// ============================================================
// LLM 调用工具 — 独立于 agent-worker，直接 fetch API
// ============================================================

const BASE_URL = (process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
const MODEL = process.env.LLM_MODEL || process.env.OPENAI_MODEL || "gpt-4o";
const API_KEY = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "";

async function callLLM({ messages, model, maxTokens, temperature }) {
  const url = BASE_URL + "/chat/completions";
  const body = {
    model: model || MODEL,
    messages: messages,
    max_tokens: maxTokens || 2048,
    temperature: temperature ?? 0.7
  };
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + API_KEY
    },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error("LLM " + resp.status + ": " + errText.slice(0, 200));
  }
  return await resp.json();
}

module.exports = { callLLM };
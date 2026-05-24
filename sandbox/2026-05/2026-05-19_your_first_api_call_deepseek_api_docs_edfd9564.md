---
title: "Your First API Call | DeepSeek API Docs"
source_url: https://api-docs.deepseek.com/
source_tool: jina
fetched_at: 2026-05-19T14:19:21.000Z
---# Your First API Call | DeepSeek API Docs

Published Time: Mon, 11 May 2026 13:19:46 GMT

# Your First API Call | DeepSeek API Docs

[Skip to main content](https://api-docs.deepseek.com/#__docusaurus_skipToContent_fallback)

[![Image 1: DeepSeek API Docs Logo](https://cdn.deepseek.com/platform/favicon.png) **DeepSeek API Docs**](https://api-docs.deepseek.com/)

[English](https://api-docs.deepseek.com/#)
*   [English](https://api-docs.deepseek.com/)
*   [中文（中国）](https://api-docs.deepseek.com/zh-cn/)

[DeepSeek Platform](https://platform.deepseek.com/)

*   [Quick Start](https://api-docs.deepseek.com/#) 
    *   [Your First API Call](https://api-docs.deepseek.com/)
    *   [Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing)
    *   [Token & Token Usage](https://api-docs.deepseek.com/quick_start/token_usage)
    *   [Rate Limit](https://api-docs.deepseek.com/quick_start/rate_limit)
    *   [Error Codes](https://api-docs.deepseek.com/quick_start/error_codes)
    *   [Agent Integrations](https://api-docs.deepseek.com/#) 

*   [API Guides](https://api-docs.deepseek.com/#) 
    *   [Thinking Mode](https://api-docs.deepseek.com/guides/thinking_mode)
    *   [Multi-round Conversation](https://api-docs.deepseek.com/guides/multi_round_chat)
    *   [Chat Prefix Completion (Beta)](https://api-docs.deepseek.com/guides/chat_prefix_completion)
    *   [FIM Completion (Beta)](https://api-docs.deepseek.com/guides/fim_completion)
    *   [JSON Output](https://api-docs.deepseek.com/guides/json_mode)
    *   [Tool Calls](https://api-docs.deepseek.com/guides/tool_calls)
    *   [Context Caching](https://api-docs.deepseek.com/guides/kv_cache)
    *   [Anthropic API](https://api-docs.deepseek.com/guides/anthropic_api)

*   [API Reference](https://api-docs.deepseek.com/#) 
*   [News](https://api-docs.deepseek.com/#) 
*   [Other Resources](https://api-docs.deepseek.com/#) 
*   [FAQ](https://api-docs.deepseek.com/faq)
*   [Change Log](https://api-docs.deepseek.com/updates)

*   [](https://api-docs.deepseek.com/)
*   Quick Start
*   Your First API Call

On this page

# Your First API Call

The DeepSeek API uses an API format compatible with OpenAI/Anthropic. By modifying the configuration, you can use the OpenAI/Anthropic SDK or softwares compatible with the OpenAI/Anthropic API to access the DeepSeek API.

| PARAM | VALUE |
| --- | --- |
| base_url (OpenAI) | `https://api.deepseek.com` |
| base_url (Anthropic) | `https://api.deepseek.com/anthropic` |
| api_key | apply for an [API key](https://platform.deepseek.com/api_keys) |
| model* | `deepseek-v4-flash` `deepseek-v4-pro` `deepseek-chat` (to be deprecated on 2026/07/24) `deepseek-reasoner` (to be deprecated on 2026/07/24) |

* The model names `deepseek-chat` and `deepseek-reasoner` will be deprecated on 2026/07/24. For compatibility, they correspond to the non-thinking mode and thinking mode of `deepseek-v4-flash`, respectively.

## Integrate with Agent Tools[​](https://api-docs.deepseek.com/#integrate-with-agent-tools "Direct link to Integrate with Agent Tools")

The DeepSeek API is supported by many popular AI agent and coding assistant tools. If you use tools like Claude Code, GitHub Copilot, or OpenCode, you can use DeepSeek as the backend model directly — no code required.

See the [Agent Integrations Guide](https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code) for details.

## Invoke The Chat API[​](https://api-docs.deepseek.com/#invoke-the-chat-api "Direct link to Invoke The Chat API")

Once you have obtained an API key, you can access the DeepSeek model using the following example scripts in the OpenAI API format. This is a non-stream example, you can set the `stream` parameter to `true` to get stream response.

For examples using the Anthropic API format, please refer to [Anthropic API](https://api-docs.deepseek.com/guides/anthropic_api).

*   curl
*   python
*   nodejs

`curl https://api.deepseek.com/chat/completions \  -H "Content-Type: application/json" \  -H "Authorization: Bearer ${DEEPSEEK_API_KEY}" \  -d '{        "model": "deepseek-v4-pro",        "messages": [          {"role": "system", "content": "You are a helpful assistant."},          {"role": "user", "content": "Hello!"}        ],        "thinking": {"type": "enabled"},        "reasoning_effort": "high",        "stream": false      }'`

`# Please install OpenAI SDK first: `pip3 install openai`import osfrom openai import OpenAIclient = OpenAI(    api_key=os.environ.get('DEEPSEEK_API_KEY'),    base_url="https://api.deepseek.com")response = client.chat.completions.create(    model="deepseek-v4-pro",    messages=[        {"role": "system", "content": "You are a helpful assistant"},        {"role": "user", "content": "Hello"},    ],    stream=False,    reasoning_effort="high",    extra_body={"thinking": {"type": "enabled"}})print(response.choices[0].message.content)`

`// Please install OpenAI SDK first: `npm install openai`import OpenAI from "openai";const openai = new OpenAI({        baseURL: 'https://api.deepseek.com',        apiKey: process.env.DEEPSEEK_API_KEY,});async function main() {  const completion = await openai.chat.completions.create({    messages: [{ role: "system", content: "You are a helpful assistant." }],    model: "deepseek-v4-pro",    thinking: {"type": "enabled"},    reasoning_effort: "high",    stream: false,  });  console.log(completion.choices[0].message.content);}main();`

[Next Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing)

*   [Integrate with Agent Tools](https://api-docs.deepseek.com/#integrate-with-agent-tools)
*   [Invoke The Chat API](https://api-docs.deepseek.com/#invoke-the-chat-api)

WeChat Official Account

*   ![Image 2: WeChat QRcode](https://cdn.deepseek.com/official_account.jpg)

Community

*   [Email](mailto:api-service@deepseek.com)
*   [Discord](https://discord.gg/Tc7c45Zzu5)
*   [Twitter](https://twitter.com/deepseek_ai)

More

*   [GitHub](https://github.com/deepseek-ai)

Copyright © 2026 DeepSeek, Inc.
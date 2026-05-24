---
title: "What Is Prompt Caching? LLM Speed & Cost Guide"
source_url: https://redis.io/blog/what-is-prompt-caching/
source_tool: jina
fetched_at: 2026-05-19T13:45:13.381Z
---# What Is Prompt Caching? LLM Speed & Cost Guide

Published Time: 2026-03-11T20:31:38.000Z

# What Is Prompt Caching? LLM Speed & Cost Guide
[](https://redis.io/blog/what-is-prompt-caching/)Skip to:
*   [Home](https://redis.io/)
*   [Content](https://redis.io/blog/what-is-prompt-caching/#content)
*   [Footer navigation](https://redis.io/blog/what-is-prompt-caching/#footer)

Your agents aren't failing. Their context is.

[See how we fix it](https://redis.io/iris/)

[](https://redis.io/)

[![Image 1: Redis Iris](https://cdn.sanity.io/images/sy1jschh/production/43c9a99e04264ff3ed739c052201b011d3c6030a-32x32.svg)Redis Iris](https://redis.io/iris/)
*   [Platform](https://redis.io/blog/what-is-prompt-caching/#)

Products
    *   [![Image 2: Redis Iris](https://cdn.sanity.io/images/sy1jschh/production/9793c0892518539b1babdf64b577ffd12bca7577-32x32.svg) Redis Iris Real-time context for agents](https://redis.io/iris/)
    *   [![Image 3: Redis Feature Form](https://cdn.sanity.io/images/sy1jschh/production/defaef0e324f07afccd84f399c373f84d758a3cf-32x32.svg) Redis Feature Form Real-time ML feature pipeline for apps & agents](https://redis.io/feature-form/)
    *   [![Image 4: Redis Cloud](https://cdn.sanity.io/images/sy1jschh/production/5f60e1427a8be962bb08ee8764c012b5e1f654f4-64x64.svg) Redis Cloud Fully managed and integrated with Google Cloud, Azure, and AWS](https://redis.io/cloud/)
    *   [![Image 5: Redis Software 64px](https://cdn.sanity.io/images/sy1jschh/production/6e8022b300501627786cac386f00b9caa6a3a43b-64x64.svg) Redis Software Self-managed software with enterprise-grade compliance and reliability](https://redis.io/software/)
    *   [![Image 6: Redis Open Source](https://cdn.sanity.io/images/sy1jschh/production/378b62e5358b1546ba6d1c7561379a188fb33e1c-64x64.svg) Redis Open Source In-memory database for caching & streaming](https://redis.io/open-source/)
    *   [![Image 7: Redis Search](https://cdn.sanity.io/images/sy1jschh/production/268a50e4eccc434ad96b7d5d41e75b842cf83a2c-32x33.svg) Redis Search Search & query for structured data](https://redis.io/search/)

Tools
    *   [Redis LangCache](https://redis.io/langcache/)
    *   [Redis Insight](https://redis.io/insight/)
    *   [Redis Data Integration](https://redis.io/data-integration/)
    *   [Clients & Connectors](https://redis.io/docs/latest/develop/clients/)

Get Redis[Downloads](https://redis.io/downloads/)

*   [Resources](https://redis.io/blog/what-is-prompt-caching/#)

Learn
    *   [Tutorials](https://redis.io/tutorials/)
    *   [Quick starts](https://redis.io/docs/get-started/)
    *   [Commands](https://redis.io/docs/latest/commands/)
    *   [University](https://university.redis.io/academy)
    *   [Knowledge Base](https://support.redislabs.com/)
    *   [Resource Center](https://redis.io/resources/)
    *   [Blog](https://redis.io/blog/)
    *   [Demo Center](https://redis.io/demo-center/)
    *   [Developer Hub](https://redis.io/dev/)

Connect
    *   [Customer Stories](https://redis.io/customers/)
    *   [Partners](https://redis.io/partners/)
    *   [Support](https://redis.io/support/)
    *   [Community](https://redis.io/community/)
    *   [Events & Webinars](https://redis.io/events/)
    *   [Professional Services](https://redis.io/services/professional-services/)

Latest
    *   [Releases](https://redis.io/new/)
    *   [News & updates](https://redis.io/company/news/)

Learn how to Build[Visit our Developer Hub](https://redis.io/dev/)

*   [Docs](https://redis.io/docs/)
*   [Pricing](https://redis.io/pricing/)

*   Search[Login](https://cloud.redis.io/?utm_source=direct&utm_medium=direct&utm_campaign=%2Fblog%2Fwhat-is-prompt-caching%2F&utm_term=not%20specified&utm_content=not%20specified)[Book a meeting](https://redis.io/meeting/)[Try Redis](https://redis.io/try-free/)

[Redis Iris![Image 8: Redis Iris](https://cdn.sanity.io/images/sy1jschh/production/43c9a99e04264ff3ed739c052201b011d3c6030a-32x32.svg)](https://redis.io/iris/)

Platform

Products

[Redis Iris Real-time context for agents](https://redis.io/iris/)[Redis Feature Form Real-time ML feature pipeline for apps & agents](https://redis.io/feature-form/)[Redis Cloud Fully managed and integrated with Google Cloud, Azure, and AWS](https://redis.io/cloud/)[Redis Software Self-managed software with enterprise-grade compliance and reliability](https://redis.io/software/)[Redis Open Source In-memory database for caching & streaming](https://redis.io/open-source/)[Redis Search Search & query for structured data](https://redis.io/search/)

Tools

[Redis LangCache](https://redis.io/langcache/)[Redis Insight](https://redis.io/insight/)[Redis Data Integration](https://redis.io/data-integration/)[Clients & Connectors](https://redis.io/docs/latest/develop/clients/)

Get Redis[Downloads](https://redis.io/downloads/)

Resources

Learn

[Tutorials](https://redis.io/tutorials/)[Quick starts](https://redis.io/docs/get-started/)[Commands](https://redis.io/docs/latest/commands/)[University](https://university.redis.io/academy)[Knowledge Base](https://support.redislabs.com/)[Resource Center](https://redis.io/resources/)[Blog](https://redis.io/blog/)[Demo Center](https://redis.io/demo-center/)[Developer Hub](https://redis.io/dev/)

Connect

[Customer Stories](https://redis.io/customers/)[Partners](https://redis.io/partners/)[Support](https://redis.io/support/)[Community](https://redis.io/community/)[Events & Webinars](https://redis.io/events/)[Professional Services](https://redis.io/services/professional-services/)

Latest

[Releases](https://redis.io/new/)[News & updates](https://redis.io/company/news/)

Learn how to Build[Visit our Developer Hub](https://redis.io/dev/)

[Docs](https://redis.io/docs/)

[Pricing](https://redis.io/pricing/)

[Try Redis](https://redis.io/try-free/)[Book a meeting](https://redis.io/meeting/)[Login](https://cloud.redis.io/?utm_source=direct&utm_medium=direct&utm_campaign=%2Fblog%2Fwhat-is-prompt-caching%2F&utm_term=not%20specified&utm_content=not%20specified)

[](https://redis.io/blog/what-is-prompt-caching/)

Resource Center

[Events & webinars](https://redis.io/events/)[Blog](https://redis.io/blog/)[Videos](https://redis.io/resources/videos/)[Glossary](https://redis.io/glossary/)[Resources](https://redis.io/resources/all/)[Architecture Diagrams](https://redis.io/resources/architecture-diagrams/)[Demo Center](https://redis.io/demo-center/)

Blog

[Events & webinars](https://redis.io/events/)[Videos](https://redis.io/resources/videos/)[Glossary](https://redis.io/glossary/)[Resources](https://redis.io/resources/all/)[Architecture Diagrams](https://redis.io/resources/architecture-diagrams/)[Demo Center](https://redis.io/demo-center/)

[Back to blog](https://redis.io/en/blog/)

Blog

# What is prompt caching? LLM speed & cost guide

March 10, 2026 9 minute read

[](https://redis.io/blog/author/jim-allenwallaceredis-com/)

![Image 9: Image](https://cdn.sanity.io/images/sy1jschh/production/b566b185b46861c427fcba7c47672a5882774185-100x100.jpg?w=256&q=80&fit=clip&auto=format)

Jim Allen Wallace

If you're building with large language models (LLMs) in production, you've probably noticed two things: latency spikes that make your app feel sluggish, and token costs that climb faster than you expected. Most of these problems come down to redundant computation, and the right caching strategy can cut both latency and spend without changing your models.

Prompt caching stores the computational state from an LLM's attention layers so the model can skip redundant prefill work on repeated prompt prefixes. The result: lower time-to-first-token (TTFT) and cheaper input costs on every request that hits the cache for a shared prefix.

This guide covers how prompt caching works at the model layer, how it differs from regular and semantic caching, where each approach fits in your architecture, and how to combine them with Redis for maximum cost and latency reduction.

## **Why LLM apps get slow & expensive at scale**

Every LLM request goes through two latency phases: time to first token (TTFT), which measures how long the model takes to start responding, and time to last token (TTLT), which captures the full generation time. Both get worse as your prompts get longer. A long system prompt increases TTFT because the model processes every token through its attention mechanism before producing any output. That "prefill" computation is expensive, and it runs on every single request.

Then there's the cost side. Across major providers, output tokens typically cost [several times more](https://openai.com/api/pricing) than input tokens, with ratios typically ranging from 3x to 5x for standard models, and up to 8x for premium or reasoning models. A 10,000-token system prompt repeated across 50,000 monthly conversations adds up fast, and that's before you count the output tokens you're paying a premium for.

At scale, these costs compound alongside operational complexity: more concurrent users, more state to manage, more systems to coordinate. The good news is that a layered caching strategy can address both the latency and cost problems. And it starts with understanding prompt caching.

## **What is prompt caching in LLMs?**

When an LLM processes your prompt, it generates key-value (KV) cache entries in its attention layers—mathematical representations of the relationships between tokens. Normally, the model recomputes this KV cache on every request. Prompt caching stores it so the model can skip that computation on subsequent requests that share the same prefix. The model still generates a fresh response every time; it's the redundant prefill work that gets cut. This is a [provider-managed feature](https://platform.openai.com/docs/guides/prompt-caching) built into the LLM API, not something you build yourself.

The main constraint is prefix matching. Prompt caching works by comparing the beginning of your current prompt against what's already cached. If the cached prefix and your new prompt are exactly identical (token-for-token) up to a certain point, the model reuses the cached computation for that portion and only processes new tokens from where the match ends. A single token change anywhere in the prefix breaks the match from that point forward.

Major LLM providers each handle this differently. Anthropic offers both automatic caching and explicit `cache_control` markers, with cache reads priced at [0.1x the base input cost](https://docs.anthropic.com/en/docs/about-claude/pricing)—a 90% discount. OpenAI's prompt caching [is automatic](https://developers.openai.com/api/docs/guides/prompt-caching/) on prompts over 1,024 tokens, with cached-input discounts that [vary by model](https://developers.openai.com/cookbook/examples/prompt_caching_201/) and go up to 90% on newer models. Optional parameters like `prompt_cache_retention` (for extended 24-hour caching) and `prompt_cache_key` (for routing control) are available for optimization. Google supports [context caching](https://ai.google.dev/gemini-api/docs/caching) through both the Gemini Developer API (Google AI Studio) and [Vertex AI](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/context-cache/context-cache-overview), with implicit caching enabled by default on Gemini 2.5 models. Cache discounts and implementation details vary by provider and model.

## **How does prompt caching actually speed up LLM apps?**

Once you know what prompt caching stores, the next question is what you get back: lower TTFT and cheaper input tokens. The performance gains scale with prompt length:

*   A 1,024-token prompt saw [7% TTFT improvement](https://developers.openai.com/cookbook/examples/prompt_caching_201/), while prompts over 150,000 tokens hit 67% faster TTFT. The longer your shared prefix, the bigger the payoff.
*   In one [book-chat benchmark](https://www.anthropic.com/news/prompt-caching), a 100,000-token cached prompt reduced TTFT by ~79% and cached input token costs by 90%.
*   Anthropic's documentation claims [up to 85%](https://www-cdn.anthropic.com/9c214a37d0a41f458ba04e680ee09da719ad52da.pdf) latency reduction for long prompts.
*   [Bedrock preview materials](https://aws.amazon.com/blogs/aws/reduce-costs-and-latency-with-amazon-bedrock-intelligent-prompt-routing-and-prompt-caching-preview/) cite similar directional numbers—up to 85% lower latency and up to 90% lower costs on supported models.

The takeaway across providers: prompt caching targets input-side computation. It reduces TTFT and cuts the cost of repeated prefixes, but you still pay full price for output tokens. The biggest savings come from long, stable prefixes that get reused across many requests. Some engineering teams treat cache hit rate like an uptime metric, declaring SEVs when it drops.

## **How is prompt caching different from regular & semantic caching?**

Prompt caching is one of three caching layers you'll use in production. They operate at different levels of the LLM stack and are meant to work together, not replace each other.

*   **Regular (exact-match) caching** stores full LLM responses keyed by an exact string hash. If someone asks the identical question twice, word for word, you return the stored response instantly. Natural language rarely repeats exactly, though, so [hit rates](https://thenewstack.io/what-is-semantic-caching/) for user-facing apps tend to be low. This layer works best for templated or programmatic queries.
*   **Semantic caching** converts queries into vector embeddings (numerical representations of meaning) and compares them against cached vectors using cosine similarity. If the similarity exceeds a configured threshold, the cached response is returned without calling the LLM at all. "Tell me about our Q3 revenue" and "What was our revenue in the third quarter?" would hit the same cache entry, saving you the full cost of that LLM call.
*   **Prompt caching** operates at the model layer and doesn't bypass the LLM—you still pay for output tokens. What it cuts is the redundant prefill computation on shared input prefixes.

The key cost difference: semantic caching bypasses LLM calls entirely on cache hits, saving both input and output token costs. Prompt caching only reduces input-side costs. That makes semantic caching generally [more cost-effective](https://aws.amazon.com/blogs/database/optimize-llm-response-costs-and-latency-with-effective-caching/) for workloads where users ask similar questions in different ways, while prompt caching helps more with genuinely novel queries that share a long prefix. Redis supports both exact-match and [semantic caching](https://redis.io/docs/latest/develop/ai/langcache/) with vector search, so you can run all three layers from a single platform.

## **Where should you use prompt caching in your LLM architecture?**

Because prompt caching relies on prefix matching, it works best when you structure prompts with [stable content first](https://aws.amazon.com/blogs/machine-learning/effectively-use-prompt-caching-on-amazon-bedrock/) and variable content last. The more of your prefix that stays identical across requests, the higher your cache hit rate.

A common ordering that tends to maximize cache reuse:

1.   [**Tool/function definitions:**](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) Most stable, rarely change
2.   **System prompt:** Stable per deployment
3.   **Reference documents:** Stable per session or task
4.   **Conversation history:** Grows, but older turns stay fixed
5.   **User query:** Almost always changes, so it goes last

This ordering is one of the simplest ways to improve cache hit rate, and it's worth designing around early rather than retrofitting later.

### **RAG pipelines**

Prompt caching tends to work well in retrieval-augmented generation (RAG) setups where multiple users query the same knowledge base. Caching the system instructions and retrieved document chunks means the model skips prefill on the shared context for each new question. The payoff is highest when users ask [several questions](https://aws.amazon.com/blogs/machine-learning/effectively-use-prompt-caching-on-amazon-bedrock/) about the same document. When retrieved chunks change with every query, though, the prefix changes too, and cache reuse drops.

### **Multi-turn chatbots**

System instructions in chatbots often run to thousands of tokens of behavioral guidelines, and they stay the same across every turn. Caching that prefix and letting conversation history and user messages stay dynamic is one of the simpler wins. This is especially valuable in long conversations, where session costs can vary widely depending on cache hit rate and token usage.

### **Agentic systems**

In long-horizon agentic systems, the system prompt is typically where teams see the most consistent caching benefits because it's both large and stable. More dynamic components like tool outputs and retrieved context tend to vary across runs, which can reduce cache reuse given the [prefix-matching constraint](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching). Caching the system prompt is still worth it; just don't expect the same hit rates you'd see in a chatbot with a fixed prefix.

### **Cache-breaking anti-patterns**

Watch for subtle cache breakers: timestamps in system prompts ("Today is {{date}}"), session identifiers in static sections, user-specific information in the prompt header, and dynamic tool definitions that change per user. Even a capitalization change can wipe out thousands of tokens of cached computation, so it's worth auditing your prompts for anything that changes between requests in sections you expect to be stable.

## **How to combine prompt caching with semantic caching**

Once prompt caching is handling your shared prefixes, you can stack it with response-level caching to cover more of your traffic. Production systems that [combine these layers](https://aws.amazon.com/blogs/database/optimize-llm-response-costs-and-latency-with-effective-caching/) into a caching hierarchy tend to get the broadest cost and latency coverage.

The layers stack like this: exact-match caching catches identical repeats, semantic caching catches paraphrased queries via vector similarity, and prompt caching optimizes the novel queries that still need the LLM. On cache hits, the first two layers bypass LLM calls entirely—the third reduces the cost of calls that have to happen. Together, they cover the full spectrum of query patterns.

Redis fits naturally across all three layers. [Redis LangCache](https://redis.io/docs/latest/develop/ai/langcache/) is a fully managed semantic caching service with integrated embedding generation, configurable similarity controls, and built-in cache hit rate monitoring. Teams that want more control can use [RedisVL's SemanticCache](https://redis.io/docs/latest/develop/ai/redisvl/user_guide/llmcache/), a self-managed Python library with distance threshold tuning and time-to-live (TTL)-based expiration. Redis also integrates with LangChain and LangGraph for vector storage and related AI workflows via its [ecosystem integrations](https://redis.io/docs/latest/develop/ai/ecosystem-integrations/).

Teams typically start with a [high similarity threshold](https://redis.io/blog/what-is-semantic-caching/) and adjust based on their query patterns. Note that RedisVL's SemanticCache uses cosine distance (where lower = more similar), so a 0.95 cosine similarity translates to a 0.05 distance threshold. Higher similarity thresholds [reduce false hits](https://redis.io/blog/large-language-model-operations-guide/) but lower cache reuse; lower thresholds catch more queries but risk serving incorrect responses. The right value depends on your domain and query distribution.

This layered approach tends to provide the most value for workloads with [meaningful semantic overlap](https://redis.io/blog/large-language-model-operations-guide/) in queries—customer support, FAQ bots, and internal tools are good examples. For workloads with less repetition, the exact-match and prompt caching layers still deliver value, and semantic caching can be added later as query patterns [become clearer](https://redis.io/blog/large-language-model-operations-guide/).

## **Faster LLM apps require layered caching**

Each caching layer solves a different part of the cost and latency problem. Stacking them into a layered architecture covers the full range of query patterns, from exact repeats to paraphrased questions to genuinely novel requests.

Redis combines [vector search](https://redis.io/docs/latest/develop/ai/), semantic caching, and in-memory data structures in a single platform with sub-millisecond latency—so your semantic cache, session state, vector storage, and operational data all run on the same infrastructure. Whether you're building chatbots, RAG pipelines, or [agentic systems](https://redis.io/guides/ai-agents-infrastructure/), the same platform scales across all of them.

[Try Redis free](https://redis.io/try-free/) to test semantic caching with your own query patterns, or [talk to the team](https://redis.io/meeting/) about optimizing your LLM infrastructure costs.

Sections

[Why LLM apps get slow & expensive at scale](https://redis.io/blog/what-is-prompt-caching/#Why_LLM_apps_get_slow_and_expensive_at_scale)

[What is prompt caching in LLMs?](https://redis.io/blog/what-is-prompt-caching/#What_is_prompt_caching_in_LLMs)

[How does prompt caching actually speed up LLM apps?](https://redis.io/blog/what-is-prompt-caching/#How_does_prompt_caching_actually_speed_up_LLM_apps)

[How is prompt caching different from regular & semantic caching?](https://redis.io/blog/what-is-prompt-caching/#How_is_prompt_caching_different_from_regular_and_semantic_caching)

[Where should you use prompt caching in your LLM architecture?](https://redis.io/blog/what-is-prompt-caching/#Where_should_you_use_prompt_caching_in_your_LLM_architecture)

[RAG pipelines](https://redis.io/blog/what-is-prompt-caching/#RAG_pipelines)[Multi-turn chatbots](https://redis.io/blog/what-is-prompt-caching/#Multiturn_chatbots)[Agentic systems](https://redis.io/blog/what-is-prompt-caching/#Agentic_systems)[Cache-breaking anti-patterns](https://redis.io/blog/what-is-prompt-caching/#Cachebreaking_antipatterns)

[How to combine prompt caching with semantic caching](https://redis.io/blog/what-is-prompt-caching/#How_to_combine_prompt_caching_with_semantic_caching)

[Faster LLM apps require layered caching](https://redis.io/blog/what-is-prompt-caching/#Faster_LLM_apps_require_layered_caching)

[View as Markdown](https://redis.io/blog/what-is-prompt-caching.md)

Share

[](https://www.linkedin.com/sharing/share-offsite/?url=https://redis.io/blog/what-is-prompt-caching/)[](https://www.facebook.com/sharer/sharer.php?u=https://redis.io/blog/what-is-prompt-caching/)[](https://twitter.com/intent/tweet?url=https://redis.io/blog/what-is-prompt-caching/)

## Get started with Redis today

Speak to a Redis expert and learn more about enterprise-grade Redis today.

[Try for free](https://redis.io/try-free/)[Talk to sales](https://redis.io/meeting/)

[](https://redis.io/blog/what-is-prompt-caching/)

[](https://redis.io/)

[](https://github.com/redis/redis/ "githubCircledFilled")[](https://www.facebook.com/Redisinc "facebookCircledFilled")[](https://www.youtube.com/c/redisinc "youtubeCircledFilled")[](https://www.linkedin.com/company/redisinc/ "linkedinCircledFilled")[](https://www.instagram.com/redisinc/ "instagramCircledFilled")[](https://x.com/Redisinc "xCircledFilled")

[Trust](https://trust.redis.io/)[Privacy](https://redis.io/legal/privacy-policy/)[Terms of use](https://redis.io/legal/redis-website-terms-of-use/)[Legal notices](https://redis.io/legal/)

Use cases

[Vector database](https://redis.io/solutions/vector-database/)[Feature Form](https://redis.io/feature-form/)[Semantic cache](https://redis.io/redis-for-ai/)[Caching](https://redis.io/solutions/caching/)[NoSQL database](https://redis.io/nosql/what-is-nosql/)[Leaderboards](https://redis.io/solutions/leaderboards/)[Data deduplication](https://redis.io/solutions/deduplication/)[Messaging](https://redis.io/solutions/messaging/)[Authentication token storage](https://redis.io/solutions/authentication-token-storage/)[Fast data ingest](https://redis.io/solutions/fast-data-ingest/)[Redis Search](https://redis.io/query-engine/)[All solutions](https://redis.io/solutions/)

Industries

[Financial Services](https://redis.io/industries/financial-services/)[Gaming](https://redis.io/industries/gaming/)[Healthcare](https://redis.io/industries/healthcare/)[Retail](https://redis.io/industries/retail/)[All industries](https://redis.io/industries/)

Compare

[Redis vs. ElastiCache](https://redis.io/compare/elasticache/)[Redis vs. Memcached](https://redis.io/compare/memcached/)[Redis vs. Memorystore](https://redis.io/compare/memorystore/)[Redis vs. Redis Open Source](https://redis.io/compare/open-source/)

Company

[Mission & values](https://redis.io/company/)[Careers](https://redis.io/company/careers/)[News](https://redis.io/company/news/)

Connect

[Community](https://redis.io/community/)[Events & Webinars](https://redis.io/events/)

Partners

[Amazon Web Services](https://redis.io/cloud-partners/aws/)[Google Cloud](https://redis.io/cloud-partners/google/)[Azure](https://redis.io/cloud-partners/azure/)[All partners](https://redis.io/partners/)

Support

[Professional Services](https://redis.io/services/professional-services/)[Support](https://redis.io/support/)[Redis for Agents Documentation](https://redis.io/agents/)

*   [Trust](https://trust.redis.io/)
*   [Privacy](https://redis.io/legal/privacy-policy/)
*   [Terms of use](https://redis.io/legal/redis-website-terms-of-use/)
*   [Legal notices](https://redis.io/legal/)

In compliance with our [Privacy Policy](https://redis.com/legal/privacy-policy/), Redis uses cookies to enhance your experience, provide personalized content, and analyze our traffic. By clicking "Accept", you consent to our use of cookies. To manage or opt-out, please select "More Info".

Accept More Info

![Image 10](https://t.co/1/i/adsct?bci=4&dv=UTC%26en-US%26Google%20Inc.%26Linux%20x86_64%26255%26800%26600%268%2624%26800%26600%260%26na&eci=3&event=%7B%7D&event_id=ba3840a7-ec7b-4988-bc23-0288692b4303&integration=gtm&p_id=Twitter&p_user_id=0&pl_id=4716b379-23f0-4b69-af60-d85c0fd9d1b5&pt=What%20Is%20Prompt%20Caching%3F%20LLM%20Speed%20%26%20Cost%20Guide&tw_document_href=https%3A%2F%2Fredis.io%2Fblog%2Fwhat-is-prompt-caching%2F&tw_iframe_status=0&tw_pid_src=1&twpid=tw.1779198309769.943386890141366320&txn_id=nzkug&type=javascript&version=2.3.53)![Image 11](https://analytics.twitter.com/1/i/adsct?bci=4&dv=UTC%26en-US%26Google%20Inc.%26Linux%20x86_64%26255%26800%26600%268%2624%26800%26600%260%26na&eci=3&event=%7B%7D&event_id=ba3840a7-ec7b-4988-bc23-0288692b4303&integration=gtm&p_id=Twitter&p_user_id=0&pl_id=4716b379-23f0-4b69-af60-d85c0fd9d1b5&pt=What%20Is%20Prompt%20Caching%3F%20LLM%20Speed%20%26%20Cost%20Guide&tw_document_href=https%3A%2F%2Fredis.io%2Fblog%2Fwhat-is-prompt-caching%2F&tw_iframe_status=0&tw_pid_src=1&twpid=tw.1779198309769.943386890141366320&txn_id=nzkug&type=javascript&version=2.3.53)
# Turbo Assistant (bring your own key)

The storefront can recommend products without a backend LLM. The model never invents SKUs: it emits a **structured action**, the app runs that action against the real JSON catalog, then an optional second call phrases the copy from the top results.

```
Shopper → Assistant panel
       → AiClient (viewer’s key, OpenAI-compatible /v1/chat/completions)
       → JSON action { search | build | clarify }
       → CatalogFacade / CatalogQueryService / BuilderStore
       → Real product cards or a filled PC build
```

## Browser key (demo only)

`AiConfigStore` keeps `provider`, `baseUrl`, `model`, and `apiKey` in `localStorage` (`turbo.ai`). The key never ships to Turbo servers. Use **Forget key** to wipe it.

Defaults:

- Provider: OpenAI (`https://api.openai.com`)
- Model: `gpt-5.6-terra` (cheaper demos: `gpt-5.6-luna`)
- Compatible base URL: OpenRouter, Azure OpenAI, or a future proxy

Gemini is not called from the browser: `generativelanguage.googleapis.com` does not send CORS headers.

The shared GitHub Pages demo has no key. **Play sample conversation** replays `public/data/ai-samples.json` against real catalog slugs so the customer still sees cards and “Apply to builder”.

## Action schema

```json
{ "action": "search", "query": { "category": "laptops", "maxPrice": 50000, "gpu": "RTX 4060" } }
```

```json
{ "action": "build", "parts": { "cpu": "<slug>", "gpu": "<slug>" } }
```

```json
{ "action": "clarify", "question": "1080p or 1440p?" }
```

`query` matches `CatalogQuery` (including comma-joined multi-select facets). `parts` slugs must exist in `builder.json`.

## Surfaces

- Floating bubble (sitewide, `@defer` chunk)
- PC Builder → **Help me choose** (returned build applies to `BuilderStore`)
- Search: natural-language queries offer **Ask Turbo Assistant**

## Production: move the key server-side

Do not ship a browser-held key in production. Add:

```
POST /api/assistant
{ "messages": [...], "locale": "en" | "ar" }
```

The server holds the provider key, calls the model, and returns the same action JSON. The storefront already executes actions locally — swap `AiClient` for `HttpClient.post('/api/assistant')`. See [BACKEND-SWAP.md](BACKEND-SWAP.md).

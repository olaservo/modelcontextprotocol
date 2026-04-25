# SDK routing for `build-mcp-server`

Use this table to route the user to the right SDK documentation based on their language choice. **Do not duplicate SDK content here** — always link out.

> **Canonical SDK index:** the docs maintain an authoritative [SDKs page](https://modelcontextprotocol.io/docs/sdk) listing every official SDK with its repo and tier badge. Cite that as the source of truth — the URLs in the table below mirror it, but if any drift, the docs page wins.
>
> **Note on tiers.** The groupings below are about **documentation depth**, not about the official [MCP SDK Tiering System](https://modelcontextprotocol.io/community/sdk-tiers) (which measures feature completeness, conformance, and maintenance commitments). The two are orthogonal: a Tier 1 SDK can still be documentation-light, and vice versa. For feature-completeness questions (does this SDK support completion? pagination? structured tool output?), check the official SDK tiering page and the SDK's own changelog.
>
> **Server-vs-client coverage:** server-side support is generally further along than client-side across every SDK. The risky direction is server-initiated requests (sampling, elicitation, roots/list) — verify those specifically before promising them.

## Rich tier — link directly

Comprehensive guides, multiple narrative walkthroughs, and many code examples. Point the user directly at the SDK doc site.

| Language | Landing page | Server-side notes |
|---|---|---|
| **TypeScript** | [ts.sdk.modelcontextprotocol.io](https://ts.sdk.modelcontextprotocol.io/) | Mature server API. Higher-level helpers for declaring tools/resources/prompts; both stdio and Streamable HTTP transports are first-class. Default recommendation for JavaScript/TypeScript servers. |
| **Python** | [py.sdk.modelcontextprotocol.io](https://py.sdk.modelcontextprotocol.io/) | Mature server API. **FastMCP** is the recommended high-level server framework — most server tutorials and examples are FastMCP-first. Use it unless you need the lower-level `Server` class. |
| **Kotlin** | [kotlin.sdk.modelcontextprotocol.io](https://kotlin.sdk.modelcontextprotocol.io/) | Published site is richer than the repo README. Good fit for JVM/Android servers and Spring-based services. |

## Moderate tier — link + check caveats

API reference is solid; narrative documentation may be thinner. The SDK site is authoritative for method signatures; this skill's SKILL.md carries the protocol-level glue (lifecycle, capability declaration, common feature traps) that may be thin on the SDK site.

| Language | Landing page | Server-side notes |
|---|---|---|
| **Java** | [java.sdk.modelcontextprotocol.io](https://java.sdk.modelcontextprotocol.io/) | Published site has getting-started content, feature guides, and component documentation **not present in the repo**. Spring AI integration is well-documented. Always check the published site first. |
| **Go** | [go.sdk.modelcontextprotocol.io](https://go.sdk.modelcontextprotocol.io/) | Official SDK landing. Pair with `pkg.go.dev/github.com/modelcontextprotocol/go-sdk` for auto-generated GoDoc reference. |
| **C#** | [csharp.sdk.modelcontextprotocol.io](https://csharp.sdk.modelcontextprotocol.io/) | Landing page is thin; the repo has DocFX concept guides worth reading if the published site doesn't answer your question. ASP.NET Core integration available. |
| **Rust** | [rust.sdk.modelcontextprotocol.io](https://rust.sdk.modelcontextprotocol.io/) | Crate is `rmcp`. Verify server-side feature support — especially completion and pagination — in the crate's changelog before committing. |

## Light tier — link + verify feature support

Documentation is mostly auto-generated API reference, minimal narrative, or absent. **Always check the SDK's changelog** to confirm the server features you need (completion, pagination, structured output, server-initiated requests) are actually implemented before starting.

| Language | Landing page | Server-side notes |
|---|---|---|
| **PHP** | [php.sdk.modelcontextprotocol.io](https://php.sdk.modelcontextprotocol.io/) | Mostly auto-generated reference. |
| **Ruby** | [ruby.sdk.modelcontextprotocol.io](https://ruby.sdk.modelcontextprotocol.io/) | Minimal published docs. |
| **Swift** | [github.com/modelcontextprotocol/swift-sdk](https://github.com/modelcontextprotocol/swift-sdk) | No dedicated docs site. Read the repo README + source directly. |

If the user is committed to a Light-tier SDK and the docs don't cover what they need, the right move is to **contribute examples upstream to the SDK repo first**, then link from your code. Don't let your server implementation become shadow documentation.

## Universal fallback

The docs' [Build a server](https://modelcontextprotocol.io/docs/develop/build-server) tutorial has an 8-language tab layout walking through a weather-server example. Use it as the fallback when the SDK-specific docs don't have a server-building walkthrough — and pair it with [connect-local-servers](https://modelcontextprotocol.io/docs/develop/connect-local-servers) for the end-to-end install-and-run loop.

## "What language should I use?" if the user is indifferent

Default to **TypeScript** if the server wraps a Node-based service, exposes web APIs, or targets serverless platforms (Cloudflare Workers, Vercel). Default to **Python** for data-oriented servers, scientific tooling, ML-adjacent integrations, or anything where the user's team already works in Python — FastMCP is the lowest-friction path to a working server in any language.

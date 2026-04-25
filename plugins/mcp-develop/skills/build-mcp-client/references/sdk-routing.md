# SDK routing for `build-mcp-client`

Use this table to route the user to the right SDK documentation based on their language choice. **Do not duplicate SDK content here** — always link out.

> **Canonical SDK index:** the docs maintain an authoritative [SDKs page](https://modelcontextprotocol.io/docs/sdk) listing every official SDK with its repo and tier badge. Cite that as the source of truth — the URLs in the table below mirror it, but if any drift, the docs page wins.
>
> **Note on tiers.** The groupings below are about **documentation depth**, not about the official [MCP SDK Tiering System](https://modelcontextprotocol.io/community/sdk-tiers) (which measures feature completeness, conformance, and maintenance commitments). The two are orthogonal: a Tier 1 SDK can still be documentation-light, and vice versa. For feature-completeness questions (does this SDK support sampling yet? elicitation?), check the official SDK tiering page and the SDK's own changelog.

## Rich tier — link directly

Comprehensive guides, multiple narrative walkthroughs, and many code examples. Point the user directly at the SDK doc site.

| Language | Landing page | Client-side notes |
|---|---|---|
| **TypeScript** | [ts.sdk.modelcontextprotocol.io](https://ts.sdk.modelcontextprotocol.io/) | Mature client API; good examples for stdio and Streamable HTTP. Default recommendation for JavaScript/TypeScript hosts. |
| **Python** | [py.sdk.modelcontextprotocol.io](https://py.sdk.modelcontextprotocol.io/) | Mature client API. FastMCP patterns are server-oriented — look for the `ClientSession` / client examples specifically. |
| **Kotlin** | [kotlin.sdk.modelcontextprotocol.io](https://kotlin.sdk.modelcontextprotocol.io/) | Published site is richer than the repo README. Good fit for JVM/Android hosts. |

## Moderate tier — link + check caveats

API reference is solid; narrative documentation may be thinner. The SDK site is authoritative for method signatures; this skill's SKILL.md carries the protocol-level glue (lifecycle, capability negotiation) that may be thin on the SDK site.

| Language | Landing page | Client-side notes |
|---|---|---|
| **Java** | [java.sdk.modelcontextprotocol.io](https://java.sdk.modelcontextprotocol.io/) | Published site has getting-started content, feature guides, and component documentation **not present in the repo**. Always check the published site first. |
| **Go** | [go.sdk.modelcontextprotocol.io](https://go.sdk.modelcontextprotocol.io/) | Official SDK landing. Pair with `pkg.go.dev/github.com/modelcontextprotocol/go-sdk` for auto-generated GoDoc reference. |
| **C#** | [csharp.sdk.modelcontextprotocol.io](https://csharp.sdk.modelcontextprotocol.io/) | Landing page is thin; the repo has DocFX concept guides worth reading if the published site doesn't answer your question. |
| **Rust** | [rust.sdk.modelcontextprotocol.io](https://rust.sdk.modelcontextprotocol.io/) | Crate is `rmcp`. Verify client-side feature support in the crate's changelog before committing. |

## Light tier — link + verify client support

Documentation is mostly auto-generated API reference, minimal narrative, or absent. Client-side features (sampling, elicitation, roots) may lag the server side. **Always check the SDK's changelog** to confirm the client features you need are actually implemented before starting.

| Language | Landing page | Client-side notes |
|---|---|---|
| **PHP** | [php.sdk.modelcontextprotocol.io](https://php.sdk.modelcontextprotocol.io/) | Mostly auto-generated reference. |
| **Ruby** | [ruby.sdk.modelcontextprotocol.io](https://ruby.sdk.modelcontextprotocol.io/) | Minimal published docs. |
| **Swift** | [github.com/modelcontextprotocol/swift-sdk](https://github.com/modelcontextprotocol/swift-sdk) | No dedicated docs site. Read the repo README + source directly. |

If the user is committed to a Light-tier SDK and the docs don't cover what they need, the right move is to **contribute examples upstream to the SDK repo first**, then link from your code. Don't let the client implementation become shadow documentation.

## Universal fallback

The docs' [Build a client](https://modelcontextprotocol.io/docs/develop/build-client) tutorial has an 8-language tab layout covering the basics for Python, TypeScript/JavaScript, and others. Use it as the fallback when the SDK-specific docs don't have a client-building walkthrough.

## "What language should I use?" if the user is indifferent

Default to **TypeScript** if the host is a web app, agent loop, VS Code extension, or anything Node-based. Default to **Python** for CLIs, data-oriented hosts, or when the user's team already works in Python. Both are Rich-tier and have the lowest friction to a working client.

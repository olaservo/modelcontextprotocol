---
name: build-mcp-client
description: Guide building an MCP client or host. Use when the user wants to build an MCP client, add MCP support to an app or agent, connect to an MCP server from code, implement the host side of MCP, wire up sampling/elicitation/roots, or pick a transport and SDK. Routes to official SDK docs rather than duplicating them.
---

# Building an MCP client

## When to use this skill

Use this skill when the user wants to **build** an MCP client (the component inside a host application that speaks MCP to one server). This includes adding MCP support to an agent loop, CLI, web app, IDE extension, or desktop app, and wiring up client-side features like sampling, elicitation, or roots.

**Do not use this skill for:**

- Building an MCP **server** — out of scope; a dedicated server skill will cover that.
- Configuring an existing host (e.g. Claude Desktop, VS Code `mcp.json`) — that's host configuration, not client building.
- SDK API reference or method signatures — the [official SDKs page](https://modelcontextprotocol.io/docs/sdk) is the canonical landing for every SDK and its tier. This skill routes you there and to the per-language doc sites.

## Reference the spec by version, not `/latest/`

When you cite a spec page during this work, **always use the dated path** (e.g., `/specification/2025-11-25/basic/lifecycle`), not `/specification/latest/...`. Reasons:

- The user needs to know exactly which revision a behavior comes from. `/latest/` silently swaps versions when a new spec ships and can change the meaning of your citation under their feet.
- If the user is building against a specific protocol version (because the host they target hasn't upgraded yet), citing `/latest/` may point them at a different revision than the one they actually negotiate.

Two intentional exceptions:

- **`/specification/draft/...`** — when you want to show what's coming in the next revision (e.g., when the user asks "is anyone working on a fix for X?" or is sketching a SEP).
- **An older dated path** (e.g., `/specification/2025-06-18/...`) — when the user is explicitly working against a non-current version.

The current revision and version policy are documented at [docs/learn/versioning](https://modelcontextprotocol.io/docs/learn/versioning). Check it once at the start of a session in case the current version has rolled forward since this skill was written.

## Discovery phase (ask before routing)

Before writing any code or linking any SDK, ask the user these six questions in order. Stop and collect answers — do not proceed past Step 2 until they're filled in.

1. **Host type.** Terminal CLI, agent loop, web app backend, IDE/editor extension, or desktop app? This determines the client's lifetime model (per-invocation vs long-lived) and whether multi-server management is even needed.
2. **Language / SDK.** Which language? If the user is indifferent, recommend **TypeScript** or **Python** (both Rich-tier SDKs — see [`references/sdk-routing.md`](references/sdk-routing.md)).
3. **Transport.** [stdio](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#stdio) (local subprocess) or [Streamable HTTP](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#streamable-http) (remote)? If the user is unsure, reframe: *"Are the servers you want to connect to local binaries you'll spawn as subprocesses, or HTTP URLs someone else hosts?"*
4. **Server count.** One fixed server, N user-configured servers, or dynamic registration at runtime? Don't build a connection pool for N=1.
5. **Client features needed.** Enumerate — users who don't know these features exist can't ask for them:
   - **Tools** (calling server-exposed tools; typically used when the agent needs to fetch context or take an action)
   - **Resources** (reading server-exposed data or files; typically used for providing context that is handled by the host application and optionally fetched by the agent)
   - **Prompts** (server-authored prompt templates)
   - **Sampling** (server asks your client to run an LLM completion)
   - **Elicitation** (server asks your client to prompt the user for input)
   - **Roots** (your client tells the server which directories to operate on)
   - **Logging / Progress / Cancellation** (utilities)
6. **Auth.** None / OAuth to a remote server / custom bearer? Only ask if the answer to (3) was Streamable HTTP. stdio transports carry credentials via environment variables, not the protocol.

## Step 1 — Ground yourself in the architecture

Before any code, confirm the mental model. MCP distinguishes three roles:

- **Host** — the user-facing application (Claude Desktop, Cursor, your CLI).
- **Client** — a protocol-level component *inside* the host that handles one direct connection to one server. A host typically owns multiple clients.
- **Server** — the external process or service the client talks to.

**The most common early misconception: one client handles many servers.** It doesn't. Create **one client instance per server connection**. Multi-server hosts instantiate multiple clients.

Read these first:

- [Architecture](https://modelcontextprotocol.io/docs/learn/architecture) — host/client/server scope
- [Understanding MCP clients](https://modelcontextprotocol.io/docs/learn/client-concepts) — core client features (Elicitation, Roots, Sampling) with sequence diagrams

## Step 2 — Pick a transport

| Transport | Use when | Lifecycle | Auth story | Spec |
|---|---|---|---|---|
| **stdio** | Server is a local binary you spawn as a subprocess. Simplest, fewest moving parts. The spec says clients **SHOULD** support stdio whenever possible. | Client owns the subprocess lifetime; close stdin + reap on shutdown. | Pass credentials via environment variables at spawn time, never over the wire. | [Transports § stdio](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#stdio) |
| **Streamable HTTP** | Server is a remote HTTP endpoint. Use when the server is hosted by someone else, or needs to serve many clients. | Long-lived HTTP session with streaming responses. Handle reconnects + session IDs. | Full [MCP authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) (OAuth) applies. | [Transports § Streamable HTTP](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#streamable-http) |

Most production clients end up supporting **both**. Start with the one the user answered in discovery (3), get it working, then add the second if needed.

For end-to-end worked examples of each, route to:

- [Connect to local servers](https://modelcontextprotocol.io/docs/develop/connect-local-servers) (stdio)
- [Connect to remote servers](https://modelcontextprotocol.io/docs/develop/connect-remote-servers) (Streamable HTTP)

## Step 3 — Pick an SDK (route out)

Do **not** hand-roll JSON-RPC. Use an official SDK.

See [`references/sdk-routing.md`](references/sdk-routing.md) for the full tier table and per-language caveats. Summary:

- **Rich tier** (link and stop): TypeScript, Python, Kotlin — comprehensive guides and examples, everything you need lives on the SDK doc site.
- **Moderate tier** (link + check caveats): Java, Go, C#, Rust. API reference is solid; narrative may be thinner.
- **Light tier** (link + verify client support): PHP, Ruby, Swift. Client-side features may lag server-side; check the changelog first.

Universal fallback when none of the above fits: [Build a client](https://modelcontextprotocol.io/docs/develop/build-client) in the docs has an 8-language tab tutorial.

## Step 4 — Implement the lifecycle

Every MCP client must complete a 3-phase lifecycle: **Initialization → Operation → Shutdown**. Get the initialization handshake right and the rest is straightforward.

**Initialization checklist:**

1. Send an `initialize` request with `protocolVersion`, your declared `capabilities` (e.g. `roots`, `sampling`, `elicitation`), and `clientInfo` (`name`, `title`, `version`).
2. Receive the server's `initialize` response — it returns `protocolVersion`, its own `capabilities`, `serverInfo`, and optional `instructions`.
3. Send the `notifications/initialized` notification. **Only after this notification may you call operational methods.**
4. **Gate feature use on negotiated capabilities.** If the server didn't declare `tools`, don't call `tools/list`. If you didn't declare `sampling`, the server won't ask you to sample.
5. Handle protocol version mismatch — if the server returns a `protocolVersion` you don't support, disconnect cleanly.
6. On shutdown: for stdio, close stdin and reap the subprocess; for Streamable HTTP, close the session.

**Capability-negotiation gotchas:**

- **Don't call `tools/list` before `initialized`.** The spec forbids it; well-behaved servers will reject it.
- **Don't assume `resources` exists.** Not every server exposes resources. Check server capabilities first.
- **Sampling requires the *client* to declare the capability, not the server.** If you want servers to be able to ask your client for LLM completions, you must advertise `sampling` in your `initialize` params.
- **Elicitation is the same pattern.** If you want servers to request user input via your client, declare `elicitation` (optionally with `form` or `url` subcapabilities) in your `initialize` params.

Source of truth: [Lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle).

## Step 5 — Wire client features you actually need

Add features incrementally.

Each feature has implementation traps that aren't in the concept docs — see [`references/client-features.md`](references/client-features.md) for the full list. One-line summary:

- **Sampling.** Latency is user-visible; don't auto-approve silently; maintain a human-in-the-loop surface.
- **Elicitation.** Needs a real UI surface, not a silent auto-approve; never pass passwords or API keys.
- **Roots.** Advisory, not a sandbox. Don't assume servers will respect them. Enforce at the OS level if you need real isolation.
- **Logging / Progress / Cancellation.** Utilities. Don't block the event loop waiting for progress updates; always honor cancellation.

## Step 6 — Multi-server management

Only relevant if discovery answer (4) was "more than one server." Three patterns, pick the simplest that fits:

- **Static config file.** User-editable JSON listing servers to connect to at startup. Model: Claude Desktop's `mcp.json`. Simplest; connections are established once and kept alive for the host's lifetime.
- **Lazy connection pool.** A pool keyed by server ID; connect on first use, cache the client instance, tear down on host exit. Good for hosts with many configured servers where most are unused in a given session.
- **Dynamic add/remove.** Servers can be added and removed at runtime via lifecycle hooks. Required for anything where servers are discovered from a registry or user input mid-session.

In all three patterns, **one client instance per server**. The pool multiplexes, it doesn't merge.

**Once connected server count grows past a handful, naive "load every tool definition into context on every turn" stops working** — token cost and latency degrade fast. Read [Client Best Practices](https://modelcontextprotocol.io/docs/develop/clients/client-best-practices) for the two patterns that scale: **progressive tool discovery** (a `search_tools` meta-tool that defers loading definitions until needed) and **programmatic tool calling** (chained tool calls that don't round-trip large intermediate results through the model). These are the difference between a host that handles 5 servers and one that handles 50.

## Step 7 — Auth (only if remote + protected)

Skip this step entirely if you're using stdio. stdio carries credentials via environment variables at subprocess spawn — no protocol-level auth.

For Streamable HTTP against a protected server, read in this order:

1. [Understanding Authorization in MCP](https://modelcontextprotocol.io/docs/tutorials/security/authorization) — friendly walkthrough of the client side of the OAuth flow with HTTP-level examples. Start here.
2. [Authorization specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) — the normative reference.
3. [Security best practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices) — attack vectors that affect clients (token passthrough, confused deputy via redirect handling). Required reading before shipping a client that initiates real OAuth flows.

Other notes:

- Production OAuth flows are non-trivial. A dedicated `add-mcp-auth` skill will cover remote-vs-local, OAuth vs API key, and enterprise IdP scenarios. For now, route to the spec and the user's chosen SDK's auth helpers.
- **Enterprise IdP** requirements (e.g. corporate SSO) have their own extension: [Enterprise-managed authorization](https://modelcontextprotocol.io/extensions/auth/enterprise-managed-authorization).

## Step 8 — Sanity-check with the Inspector

Before shipping, point the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) at the same servers your client will talk to. The Inspector is server-side oriented (it acts as a generic client), so it's the easiest way to:

- Verify that a server actually behaves the way you think it does — especially if your client is producing unexpected results and you need to isolate "is it me or the server?"
- See the exact JSON-RPC payloads on the wire, which is the level you have to debug at when something is wrong.
- Try out tools/resources/prompts manually to confirm capability negotiation worked.

For deeper investigation, see [Debugging](https://modelcontextprotocol.io/docs/tools/debugging).

## Using the mcp-docs MCP server for lookups

This plugin ships with an `mcp-docs` HTTP MCP server configured. When you need authoritative spec content during implementation — method names, capability field shapes, error codes, feature semantics — **call the `SearchModelContextProtocol` tool first** before web-searching or guessing. It queries the current published spec at `modelcontextprotocol.io/mcp` and returns canonical results.

Search term tip (same as in `search-mcp-github`): GitHub and the docs index don't split camelCase. Search both `clientCapabilities` and `client capabilities` if the first returns nothing.

## What this skill does NOT cover

- **JSON-RPC wire format, framing, envelope shape.** See the [Transports spec](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports).
- **Full OAuth walkthrough.** Defer to a future `add-mcp-auth` skill; for now, link to [Authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization).
- **Server-building.** A separate `build-mcp-server` skill will cover that.
- **Host configuration** — Claude Desktop `config.json`, VS Code `mcp.json`, Cursor settings. Different audience; if the user just wants to *use* an existing MCP server in an existing host, they don't need to build a client at all.
- **Framework integrations** — LangChain, LlamaIndex, Vercel AI SDK adapters. These projects have their own docs.
- **Deeper testing and evaluation.** Step 8 covers the Inspector and [Debugging](https://modelcontextprotocol.io/docs/tools/debugging) page as the standard checks. A future `debug-mcp` skill will go deeper into automated client-side test harnesses.

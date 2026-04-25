---
name: build-mcp-server
description: Guide building an MCP server. Use when the user wants to build an MCP server, expose tools/resources/prompts to LLMs, wrap an internal API or data source for AI consumption, ship a server users can install locally or host remotely, or pick a transport and SDK for the server side. Routes to official SDK docs rather than duplicating them.
---

# Building an MCP server

## When to use this skill

Use this skill when the user wants to **build** an MCP server (a process that exposes tools, resources, or prompts to one or more MCP clients). This includes wrapping an internal API for an AI agent, exposing a data source as resources, packaging a CLI as MCP tools, or hosting a remote MCP service for many users.

**Do not use this skill for:**

- Building an MCP **client** — see the companion `build-mcp-client` skill.
- Just *running* an existing server in a host (Claude Desktop, VS Code) — that's host configuration, not server building.
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

1. **What does the server expose?** A wrapper around an internal API? A data source (database, filesystem, knowledge base)? A CLI as tools? A workflow engine? This frames which features to expose (Step 5) and what the audience cares about.
2. **Language / SDK.** Which language? If the user is indifferent, recommend **TypeScript** or **Python** (both Rich-tier SDKs — see [`references/sdk-routing.md`](references/sdk-routing.md)).
3. **Transport.** [stdio](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#stdio) (server runs as a subprocess on the user's machine) or [Streamable HTTP](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#streamable-http) (server is hosted, clients connect over HTTP)? If the user is unsure, reframe: *"Will users install and run this server themselves, or will they connect to a URL you host?"*
4. **Distribution / deployment model.** Local-only (npm/pip/uv package or binary users install) vs hosted service (your team operates it, users connect remotely) vs both. This decides whether you need to think about session management, multi-tenancy, and an OAuth flow.
5. **Server features to expose.** Enumerate — and resist the temptation to expose everything:
   - **Tools** (model-controlled actions: API calls, file writes, computations)
   - **Resources** (application-controlled context: files, DB rows, documents)
   - **Prompts** (user-controlled templates: slash commands, workflows)
   - **Completion** (autocomplete suggestions for prompt arguments / resource URIs)
   - **Logging** (structured log emission to the client)
   - **Pagination** (only relevant for tools/resources/prompts lists that can grow large)
   - *Server-initiated requests:* **Sampling**, **Elicitation**, **Roots/list** — the server *requests* these from the client. Only useful if you can assume connecting clients implement them.
6. **Auth.** None / OAuth resource server / custom bearer / per-user vs per-session? Only ask if the answer to (3) was Streamable HTTP. stdio servers receive credentials via environment variables at spawn time, not the protocol.

## Step 1 — Ground yourself in the architecture

Before any code, confirm the mental model. MCP distinguishes three roles:

- **Host** — the user-facing application (Claude Desktop, Cursor, an internal agent).
- **Client** — a protocol-level component *inside* the host that handles one direct connection to one server.
- **Server** — your code: the external process or service the client talks to.

**The most common early misconception: a server can decide what the client does with its data.** It can't. The client (and the host's user) chooses what to surface to the model and when. Your job is to expose well-named, well-described primitives. Their orchestration belongs to the client.

Read these first:

- [Architecture](https://modelcontextprotocol.io/docs/learn/architecture) — host/client/server scope
- [Understanding MCP servers](https://modelcontextprotocol.io/docs/learn/server-concepts) — Tools / Resources / Prompts with worked examples and control hierarchy

## Step 2 — Pick a transport

| Transport | Use when | Lifecycle | Auth story | Spec |
|---|---|---|---|---|
| **stdio** | Server runs as a subprocess on the user's machine — you ship a binary or package they install. Simplest, fewest moving parts. The spec says clients **SHOULD** support stdio whenever possible, so stdio servers reach the largest audience. | Per-user lifetime; the host spawns one subprocess per server config. No session multiplexing. **Never write to stdout** — only stderr. | Credentials arrive via environment variables at spawn time, never over the wire. | [Transports § stdio](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#stdio) |
| **Streamable HTTP** | Server is hosted by you and shared across many users. Use when the data is centralized, when state needs to survive restarts, or when distributing a binary isn't viable. | Long-lived HTTP sessions with streaming responses. You manage session IDs, reconnects, and (typically) per-user state. | Full [MCP authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) (OAuth) applies — your server is the *resource server*. | [Transports § Streamable HTTP](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#streamable-http) |

Most production servers eventually support **both**. Start with whichever matches the user's discovery (3) answer; add the second only if a real audience needs it.

For testing your server end-to-end against a real host, route the user to:

- [Connect to local servers](https://modelcontextprotocol.io/docs/develop/connect-local-servers) (stdio servers tested via Claude Desktop / VS Code)
- [Connect to remote servers](https://modelcontextprotocol.io/docs/develop/connect-remote-servers) (Streamable HTTP servers tested via a remote-capable host)

And for interactive debugging, the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) is the standard tool — see Step 8.

## Step 3 — Pick an SDK (route out)

Do **not** hand-roll JSON-RPC. Use an official SDK.

See [`references/sdk-routing.md`](references/sdk-routing.md) for the full tier table and per-language caveats. Summary:

- **Rich tier** (link and stop): TypeScript, Python, Kotlin — comprehensive guides and examples, everything you need lives on the SDK doc site. Server-side coverage is the most mature here.
- **Moderate tier** (link + check caveats): Java, Go, C#, Rust. Server APIs are solid; narrative may be thinner.
- **Light tier** (link + verify feature support): PHP, Ruby, Swift. Server-side support is generally further along than client-side, but verify the specific features you need (e.g. completion, pagination) in the SDK's changelog.

Universal fallback when none of the above fits: [Build a server](https://modelcontextprotocol.io/docs/develop/build-server) in the docs has an 8-language tab tutorial.

## Step 4 — Implement the lifecycle

Every MCP server must respond to a 3-phase lifecycle: **Initialization → Operation → Shutdown**. The SDK handles most of the wire mechanics; you just need to declare your capabilities correctly.

**Initialization checklist (server side):**

1. On `initialize` request, return `protocolVersion`, your declared `capabilities` (e.g. `tools`, `resources`, `prompts`, `logging`, `completions`), `serverInfo` (`name`, `title`, `version`), and optional `instructions` (a system-prompt-style hint the host may show to the model).
2. Wait for the `notifications/initialized` notification before responding to any operational request. **Reject operational calls that arrive before `initialized`.**
3. **Declare only capabilities you actually implement.** If you advertise `tools.listChanged: true`, you must actually emit the notification when your tool list changes. Capability declaration is a promise.
4. **Inspect the *client's* declared capabilities.** If the client didn't declare `sampling`, don't try to call `sampling/createMessage`. Same for `elicitation` and `roots`.
5. Handle protocol version mismatch — if the client sends a `protocolVersion` you don't support, return an error and disconnect. Never silently downgrade.
6. On shutdown: for stdio, exit cleanly when stdin closes; for Streamable HTTP, drain in-flight requests and close the session.

**Capability-negotiation gotchas:**

- **Don't conflate `tools` (server capability) with `sampling` (client capability).** Your server declares the primitives it offers; the client declares the primitives it offers back. The two are independent.
- **`listChanged: true` is opt-in.** If your tool/resource/prompt list never changes after startup, omit it. Servers that lie cause clients to subscribe to notifications that never come.
- **`completions` is its own capability.** If you want clients to query autocomplete for prompt arguments or resource URI templates, declare `completions: {}` in your capabilities. Without it, clients won't ask.

Source of truth: [Lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle).

## Step 5 — Implement the features you actually expose

Add primitives incrementally. Start with the smallest set that proves the use case.

Each feature has implementation traps that aren't in the concept docs — see [`references/server-features.md`](references/server-features.md) for the full list. One-line summary:

- **Tools.** Names and descriptions are the model's only window into what you do. Bad names = unused tools. Annotate destructive tools. Sanitize errors. Production hosts often run [progressive tool discovery](https://modelcontextprotocol.io/docs/develop/clients/client-best-practices#progressive-tool-discovery) — your tool *names and descriptions* are what they search over, so write them to be discoverable.
- **Resources.** Decide *now* whether resources are static, list-changed-notifying, or subscribable — wire churn later is expensive. URI templates need careful design.
- **Prompts.** Validate arguments against your declared schema before substituting. Prompts are user-invoked, so the names are user-facing.
- **Completion.** Optional. Useful for prompt arguments and resource URI templates. Skip unless your prompts have real argument spaces worth completing.
- **Logging.** **stdio servers must never write to stdout** — that corrupts the JSON-RPC channel. Use stderr or the logging primitive.
- **Pagination.** Use cursor-based pagination on any list that could grow beyond ~100 items. Don't return the cursor in responses you didn't paginate.
- **Server-initiated requests** (sampling / elicitation / roots/list). Useful, but **gate every call on whether the client declared the matching capability.** A common trap: writing a server that depends on `sampling` and discovering most clients don't implement it.

## Step 6 — Server-initiated requests (only if you need them)

Most servers don't need to ask the client for anything beyond responding to tool calls. Skip this step unless your tool implementations *require* an LLM completion, user input, or filesystem context from the client.

- **Sampling** — your tool calls back to the client to ask it to run an LLM completion. Useful for agentic tools where the server orchestrates a multi-step LLM workflow without bundling its own model. Spec: [Client § Sampling](https://modelcontextprotocol.io/specification/2025-11-25/client/sampling).
- **Elicitation** — your tool asks the client to prompt the user for missing input mid-execution. Useful when an argument can't be inferred and shouldn't be made required (e.g. picking from a server-known dropdown). Spec: [Client § Elicitation](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation).
- **Roots/list** — your server queries the client for which filesystem directories the user wants you to operate on. Filesystem-scoped servers should always check this. Spec: [Client § Roots](https://modelcontextprotocol.io/specification/2025-11-25/client/roots).

**Critical discipline:** *check `clientCapabilities` before calling.* If `sampling`, `elicitation`, or `roots` isn't in the client's declared capabilities, the call will fail. Build a graceful fallback path so the server still works against minimal clients.

## Step 7 — Auth (only if remote + protected)

Skip this step entirely if you're using stdio. stdio receives credentials via environment variables at spawn time — no protocol-level auth.

For Streamable HTTP servers exposing protected data, read in this order:

1. [Understanding Authorization in MCP](https://modelcontextprotocol.io/docs/tutorials/security/authorization) — the friendly walkthrough of the resource-server flow with HTTP-level examples. Start here.
2. [Authorization specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) — the normative reference.
3. [Security best practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices) — attack vectors specific to MCP (confused deputy, token passthrough, session fixation). **Required reading** before deploying a public Streamable HTTP server.

Non-obvious server-side details:

- Your server is the **resource server**; you typically delegate token issuance to a separate authorization server (your existing IdP, Auth0, etc.). The spec doesn't require you to be your own auth server.
- The spec assumes one *user* per session. If your server is multi-tenant, the OAuth token tells you which user is connected; you must scope every tool call's data access by that user. Don't leak across tenants.
- If you need OAuth client credentials (machine-to-machine, no user) instead of authorization-code flow, see the [OAuth client credentials extension](https://modelcontextprotocol.io/extensions/auth/oauth-client-credentials).
- For corporate SSO scenarios, see [Enterprise-managed authorization](https://modelcontextprotocol.io/extensions/auth/enterprise-managed-authorization).

A dedicated `add-mcp-auth` skill will eventually cover end-to-end OAuth resource-server implementation. For now, route to the spec and the user's chosen SDK's auth helpers.

## Step 8 — Test with the Inspector before shipping

Before exposing your server to a real host, run it through the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector). It's a browser-based tool that connects to your server (stdio or Streamable HTTP), enumerates capabilities, and lets you call every tool, read every resource, and walk through every prompt manually.

Why this is non-negotiable for server building:

- It surfaces capability-declaration mismatches *before* a real host bumps into them.
- It exercises the lifecycle handshake end-to-end without you needing to wire up a host.
- It shows the exact JSON-RPC payloads, which is the level you have to debug at when something goes wrong.

For deeper investigation when the Inspector shows something odd, see [Debugging](https://modelcontextprotocol.io/docs/tools/debugging).

## Using the mcp-docs MCP server for lookups

This plugin ships with an `mcp-docs` HTTP MCP server configured. When you need authoritative spec content during implementation — method names, capability field shapes, error codes, feature semantics — **call the `SearchModelContextProtocol` tool first** before web-searching or guessing. It queries the current published spec at `modelcontextprotocol.io/mcp` and returns canonical results.

Search term tip: GitHub and the docs index don't split camelCase. Search both `serverCapabilities` and `server capabilities` if the first returns nothing.

## What this skill does NOT cover

- **JSON-RPC wire format, framing, envelope shape.** See the [Transports spec](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports).
- **Full OAuth walkthrough.** Defer to a future `add-mcp-auth` skill; for now, link to [Authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization).
- **Client-building.** See the companion `build-mcp-client` skill.
- **Deployment and hosting recipes** — Cloudflare Workers, Vercel, AWS Lambda, Kubernetes patterns for hosting Streamable HTTP servers. SDK ecosystems and third-party platforms own these; the MCP docs don't currently centralize them. A future `deploy-mcp-server` skill may.
- **Distribution to host registries** — getting your server listed in client registries, app stores, or marketplaces. Each host has its own listing process.
- **Domain-specific server design** — naming tools well, structuring resources, designing prompt UX. These are app-design concerns; useful design references include the [Security best practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices) tutorial and the [Client best practices](https://modelcontextprotocol.io/docs/develop/clients/client-best-practices) page (read it from the *server* perspective to understand what good clients expect from you).

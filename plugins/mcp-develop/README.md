# Official MCP Develop Plugin

Agent skills for learning the Model Context Protocol and building on top of it — clients, servers, apps, and extensions.

This plugin is the counterpart to [`mcp-spec`](../mcp-spec/README.md), which focuses on researching and contributing to the specification itself.

## Installation

### Claude Code

```bash
/plugin marketplace add modelcontextprotocol/modelcontextprotocol
```

### Claude Cowork

Navigate to Customize >> Browse Plugins >> Personal >> Plus Button >> Add marketplace from GitHub and add `modelcontextprotocol/modelcontextprotocol`

## Available Skills

### `/build-mcp-server`

Guide for building an MCP server — the process that exposes tools, resources, and prompts to MCP clients. Runs a six-question discovery phase (what the server exposes, language/SDK, transport, distribution model, server features, auth) and then routes to the right SDK docs and spec pages rather than duplicating them.

**Covers:**

- Host / client / server architecture and the "client decides surface" rule
- Transport selection (stdio for shipped binaries vs Streamable HTTP for hosted services)
- SDK routing across TypeScript, Python, Kotlin, Java, Go, C#, Rust, PHP, Ruby, Swift
- Initialize handshake and capability declaration discipline
- Server-side feature implementation traps for tools, resources, prompts, completion, logging, and pagination
- Server-initiated requests (sampling, elicitation, roots/list) and how to gate them on client capabilities
- The MCP Inspector loop as the standard pre-ship verification

**Does not cover:** client building, deployment recipes (Cloudflare/Vercel/Lambda), distribution to host registries, full OAuth walkthroughs — those are reserved for dedicated skills or external docs.

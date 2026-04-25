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

### `/build-mcp-client`

Guide for building an MCP client or host — the component inside a host application that speaks MCP to one server. Runs a six-question discovery phase (host type, language/SDK, transport, server count, client features, auth) and then routes to the right SDK docs and spec pages rather than duplicating them.

**Covers:**

- Host / client / server architecture and the "one client per server" rule
- Transport selection (stdio vs Streamable HTTP)
- SDK routing across TypeScript, Python, Kotlin, Java, Go, C#, Rust, PHP, Ruby, Swift
- Initialize handshake and capability negotiation checklist
- Client-side feature implementation traps for sampling, elicitation, roots, logging, progress, and cancellation
- Multi-server management patterns

**Does not cover:** server building, host configuration (Claude Desktop / VS Code `mcp.json`), or full OAuth walkthroughs — those are reserved for dedicated skills.

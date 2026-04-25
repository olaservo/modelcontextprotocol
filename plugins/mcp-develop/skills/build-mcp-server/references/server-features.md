# Server-feature implementation traps

This file is the non-duplicative value this skill adds on top of the official docs. The [server-concepts](https://modelcontextprotocol.io/docs/learn/server-concepts) page and spec pages describe what the features *are*; this file captures the implementation traps you'll hit building them.

**How to use:** skim the feature(s) your user plans to expose. Pair each section with the spec page linked below. If you're not sure which features you need, re-read Step 5 of `SKILL.md`.

## Tools

Model-controlled actions. The LLM decides when to call them based on the name and description you provide.

- **Concept:** [server-concepts § Tools](https://modelcontextprotocol.io/docs/learn/server-concepts#tools)
- **Spec:** [Server § Tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)

**Don't:**

- **Don't ship a tool whose name and description don't, on their own, tell a model when to call it.** Names and descriptions are the model's *only* window into your tool. `executeQuery` is worse than `runReadOnlySqlAgainstUserDatabase`. Spend disproportionate time here.
- **Don't return raw stack traces or internal error messages to the client.** They're surfaced to the model and the user. Sanitize: return human-readable error text plus an opaque error code for your own logs.
- **Don't omit `annotations` for destructive or expensive tools.** The spec defines hints like `destructiveHint`, `idempotentHint`, `readOnlyHint`, `openWorldHint` so clients can warn users or apply policy. Omit them and clients can't help.
- **Don't return giant blobs without considering token cost.** Tool results are inserted into the model's context. A 50KB JSON dump of a database query will burn the context budget. Truncate, summarize, or paginate — and tell the model how to ask for more.
- **Don't forget `tools/list_changed`.** If your tool list can change at runtime (feature flag, auth state, plugin load), declare `tools.listChanged: true` *and* actually emit `notifications/tools/list_changed` when it changes. Declaring without emitting is a lie.

## Resources

Application-controlled context: data the host can attach to model context, with the user (or app logic) deciding when.

- **Concept:** [server-concepts § Resources](https://modelcontextprotocol.io/docs/learn/server-concepts#resources)
- **Spec:** [Server § Resources](https://modelcontextprotocol.io/specification/2025-11-25/server/resources)

**Don't:**

- **Don't conflate "tool-callable data" with resources.** If the model needs to fetch data based on inferred arguments, that's a *tool*. Resources are for data the *user or host* selects.
- **Don't design URI templates without thinking through the parameter space.** A template like `db://table/{rowId}` is fine; `db://{anything}/{anything}` is not. Templates exist to enable completion and pagination — pick parameter names that make sense in a UI.
- **Don't return content without a `mimeType`.** Clients use it to render. Without it, your nicely-formatted markdown shows up as a raw string blob.
- **Don't enable subscriptions you can't actually push.** `resources.subscribe: true` advertises that clients can subscribe to resource updates and receive change notifications. If your underlying source can't tell you when something changed, don't declare it.
- **Don't leak data through resource enumeration.** `resources/list` returns every resource you offer. If a resource is per-user or per-session, scope your list response by the connected client's identity.

## Prompts

User-controlled templates: slash commands or menu options the user selects, which produce a structured prompt for the model.

- **Concept:** [server-concepts § Prompts](https://modelcontextprotocol.io/docs/learn/server-concepts#prompts)
- **Spec:** [Server § Prompts](https://modelcontextprotocol.io/specification/2025-11-25/server/prompts)

**Don't:**

- **Don't treat prompts as just system messages.** A prompt can return multi-message conversations including assistant turns and resource references. Use that — a single-message prompt is often the wrong shape.
- **Don't skip argument schema validation.** Your prompt declares an argument schema; the client sends arguments. Validate before substituting. Don't trust the client to validate for you.
- **Don't bake secrets into prompt templates.** Prompts are *user-facing* (they appear as slash commands or menu items). API keys and internal URLs belong in environment variables or auth tokens, not in the template body.
- **Don't ship a prompt whose name doesn't read well as a slash command.** `/server-name__do_thing_v2` reads badly. Names propagate to UI directly.

## Completion

Optional. Provides autocomplete suggestions for prompt arguments and resource URI template parameters.

- **Spec:** [Server § Utilities § Completion](https://modelcontextprotocol.io/specification/2025-11-25/server/utilities/completion)

**Don't:**

- **Don't implement completion if your prompts have no argument space worth completing.** It's pure overhead for a `/summarize` prompt with no arguments.
- **Don't return more than ~100 suggestions.** The host UI typically renders a finite menu; thousands of completions degrade the UX.
- **Don't make completion calls expensive.** They fire on every keystroke. Cache aggressively, or pre-compute static result sets.
- **Don't forget to declare `completions: {}` in your capabilities.** Without it, clients won't ask — and your completion handler is dead code.

## Logging

Server emits structured log messages to the client.

- **Spec:** [Server § Utilities § Logging](https://modelcontextprotocol.io/specification/2025-11-25/server/utilities/logging)

**Don't:**

- **Don't write to stdout on stdio servers, ever.** stdout is the JSON-RPC channel. A single stray `print()` or `console.log()` corrupts the next message and breaks the connection. Use stderr or the `logging` primitive. This is the single most common cause of "server starts but client sees garbage."
- **Don't ignore the client's `logging/setLevel` request.** If the user filters to `error`, don't keep emitting `debug` messages.
- **Don't dump high-frequency logs unbounded.** Rate-limit; a chatty server can flood the client's log buffer.
- **Don't log secrets, tokens, or PII.** Logs travel to the client and may be persisted there. Treat them like network traffic.

## Pagination

Cursor-based pagination for `tools/list`, `resources/list`, `prompts/list`, and `resources/templates/list`.

- **Spec:** [Server § Utilities § Pagination](https://modelcontextprotocol.io/specification/2025-11-25/server/utilities/pagination)

**Don't:**

- **Don't return a `nextCursor` for a response that exhausted the data.** Empty `nextCursor` means "done." A non-empty cursor on a complete response makes clients loop forever.
- **Don't make cursors guessable or stateful in surprising ways.** Treat them as opaque tokens. Most implementations encode the next offset or last item ID; don't expose row IDs or anything an attacker could walk.
- **Don't paginate lists that will never grow large.** A server with three tools doesn't need pagination. Premature paging adds round trips.
- **Don't change ordering between paginated calls.** Cursors assume a stable sort. If you sort by `updatedAt` and items get updated mid-pagination, items may be skipped or duplicated. Use a stable secondary key (e.g., ID) as a tiebreaker.

## Server-initiated requests (sampling, elicitation, roots/list)

These are *server-initiated* — your server asks the *client* to do something. Whether the client can respond depends on whether it declared the matching capability during `initialize`.

- **Sampling:** [Client § Sampling](https://modelcontextprotocol.io/specification/2025-11-25/client/sampling) — server requests an LLM completion from the client.
- **Elicitation:** [Client § Elicitation](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation) — server asks the client to prompt the user for structured input.
- **Roots/list:** [Client § Roots](https://modelcontextprotocol.io/specification/2025-11-25/client/roots) — server asks the client which filesystem directories to operate on.

**Don't:**

- **Don't call `sampling/createMessage`, `elicitation/create`, or `roots/list` without first checking the client declared the capability.** If the client didn't advertise it during `initialize`, the call will fail. Capture the client capabilities at handshake time and gate every call.
- **Don't make your server *require* sampling.** Sampling support varies a lot across clients. If a server only works against sampling-capable clients, you've narrowed your audience to a small subset. Build a fallback that does the work without sampling, even if degraded.
- **Don't elicit credentials.** Same rule as the client side: elicitation is for user input, not secrets. Don't ask for API keys or passwords through elicitation; require them via your auth flow instead.
- **Don't ignore `roots` if you're a filesystem-scoped server.** A server that operates on the user's files but never queries roots will read outside the user's intended scope. Always call `roots/list` at session start (if declared) and re-query on `notifications/roots/list_changed`.
- **Don't block your tool handler on a server-initiated request.** These calls are async and may take seconds (sampling) or minutes (elicitation). Return progress notifications while you wait, and honor cancellation.

## Cancellation and progress (utilities your tools should support)

- **Cancellation spec:** [Basic § Utilities § Cancellation](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/cancellation)
- **Progress spec:** [Basic § Utilities § Progress](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/progress)

**Don't:**

- **Don't ignore cancellation notifications.** When the client cancels an in-flight tool call, stop the work, free resources, and don't return a result. Long-running tools that ignore cancellation hang the host UX.
- **Don't emit progress without a `progressToken`.** Progress notifications are scoped to the request that included a `progressToken` in its metadata. If the client didn't provide one, don't send progress for it.
- **Don't lie with progress totals.** If you don't know the total work, omit `total` rather than guessing. A bouncing progress bar is better than one that hits 95% and stalls.

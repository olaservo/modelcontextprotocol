# Client-feature implementation traps

This file is the non-duplicative value this skill adds on top of the official docs. The [client-concepts](https://modelcontextprotocol.io/docs/learn/client-concepts) page and spec pages describe what the features *are*; this file captures the implementation traps you'll hit building them.

**How to use:** skim the feature your user plans to implement. Pair it with the spec page linked in each section. If you're not sure which features you need, re-read Step 5 of `SKILL.md`.

## Sampling

Server asks your client to run an LLM completion on its behalf. You are in charge of approvals, model selection, and cost.

- **Concept:** [client-concepts § Sampling](https://modelcontextprotocol.io/docs/learn/client-concepts#sampling)
- **Spec:** [Client § Sampling](https://modelcontextprotocol.io/specification/2025-11-25/client/sampling)

**Don't:**

- **Don't auto-approve sampling requests silently.** The human-in-the-loop review is the core security feature of sampling. A silent auto-approver turns your client into a free LLM endpoint for any server it connects to.
- **Don't ignore `modelPreferences`.** Servers use `costPriority`, `speedPriority`, and `intelligencePriority` as negotiation hints. Pass them into your model-selection logic instead of always routing to the same model.
- **Don't hide sampling latency from the user.** These requests block the server's tool call; if your UI doesn't show that work is in progress, users will assume the agent is hung.
- **Don't forward system prompts verbatim without review.** The server's `systemPrompt` is attacker-controlled from the client's perspective. Either display it to the user or scrub it against your own policy.
- **Don't forget to declare `sampling` in your `initialize` capabilities.** Servers gate on this; if you don't advertise it, the server won't ask.

## Elicitation

Server asks your client to prompt the user for structured input mid-operation. You render the UI and return the answer.

- **Concept:** [client-concepts § Elicitation](https://modelcontextprotocol.io/docs/learn/client-concepts#elicitation)
- **Spec:** [Client § Elicitation](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation)

**Don't:**

- **Don't auto-approve elicitation silently.** Same failure mode as sampling — the whole point is to involve the user.
- **Don't forward passwords or API keys via elicitation.** The spec is explicit: elicitation **never** requests credentials. Reject any schema that looks like it's fishing for secrets, and warn the user.
- **Don't block your event loop waiting for the user.** Elicitation is inherently asynchronous — the user may take seconds or minutes. Handle the pending response as an async task, not a blocking call.
- **Don't skip schema validation on the response.** The spec requires the client to validate the user's input against the server's provided schema *before* returning it.
- **Don't forget the `form` / `url` subcapabilities.** If your client can render form-based elicitation but not URL-based, declare only what you support: `"elicitation": { "form": {} }`.

## Roots

Your client tells the server which filesystem directories to operate on. Advisory, not enforced.

- **Concept:** [client-concepts § Roots](https://modelcontextprotocol.io/docs/learn/client-concepts#roots)
- **Spec:** [Client § Roots](https://modelcontextprotocol.io/specification/2025-11-25/client/roots)

**Don't:**

- **Don't treat roots as a sandbox.** The spec says servers "SHOULD" respect roots, not "MUST." A malicious or buggy server can read outside the roots you declared. If you need real isolation, enforce at the OS level — container, chroot, or file-permission boundaries.
- **Don't use non-`file://` URIs.** Roots are filesystem-only. Other URI schemes will be ignored by well-behaved servers.
- **Don't forget `roots/list_changed`.** When the user opens a new workspace or closes one, notify servers via `notifications/roots/list_changed`. Servers that don't get notified will operate on a stale view.
- **Don't advertise `roots.listChanged: true` if your client can't actually send the notification.** Capability declaration is a promise.
- **Don't over-scope.** Roots narrower than necessary leak less. Expose only the workspace the user is actively working in, not their whole home directory.

## Logging

Server emits structured log messages; your client displays or records them.

- **Spec:** [Server § Utilities § Logging](https://modelcontextprotocol.io/specification/2025-11-25/server/utilities/logging)

**Don't:**

- **Don't dump server log messages straight to the user's main UI.** They're meant for developer/debug surfaces, not primary output. Consider a collapsible log pane or a debug-only stream.
- **Don't log unbounded.** Ring-buffer or rate-limit; a noisy server can flood your client.
- **Don't ignore log levels.** Servers emit `debug` / `info` / `warning` / `error` etc. Respect the level the user selected via `logging/setLevel`.

## Progress

Server sends progress updates for long-running operations; your client shows them.

- **Spec:** [Basic § Utilities § Progress](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/progress)

**Don't:**

- **Don't block the event loop waiting for progress.** Progress notifications are best-effort; handle them as they arrive and don't gate UI on them.
- **Don't assume every long request will send progress.** Only requests that opted in via `progressToken` in their metadata will. If the user didn't include a token, no notifications will come.
- **Don't leak progress tokens across requests.** Each progress token is scoped to one request/response pair.

## Cancellation

Either side can cancel an in-flight request. Clients cancel server operations; servers can cancel sampling requests back to the client.

- **Spec:** [Basic § Utilities § Cancellation](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/cancellation)

**Don't:**

- **Don't ignore cancellations from the server.** If the server cancels a sampling request it sent you, stop the in-flight model call and don't return a result.
- **Don't forget to send cancellation when the user aborts.** If the user hits Ctrl+C or closes the chat, send `notifications/cancelled` for any pending requests so the server can free resources.
- **Don't race the response.** Cancellations are advisory — a response may already be in flight when you cancel. Handle both outcomes: canceled cleanly, or got a response you now need to discard.

## Tasks (experimental)

The [Tasks utility](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks) is an experimental feature in the 2025-11-25 spec for long-running, resumable operations. **Not required for any SDK tier.** If your user asks about it, link to the spec and note that client-side support varies widely — check the SDK's changelog before implementing.

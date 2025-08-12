+++
date = '2025-08-04T18:00:00+01:00'
publishDate = '2025-08-04T18:00:00+01:00'
draft = false
title = 'Server Instructions: Giving LLMs a user manual for your server'
author = 'Ola Hungerford (Maintainer)'
tags = ['automation', 'mcp', 'server instructions', 'tutorial']
+++

Many of us are still exploring the nooks and crannies of MCP, and learning how to best use the building blocks of the protocol to enhance our agents and applications.  Some things like Prompts are more prominent features of MCP.  Others are more hidden, but potentially very influential over the LLM's behavior and how well an agent will understand your server.  Server `instructions` are one of the latter.

## The Problem

Imagine you're an LLM who just got handed a collection of tools from servers A, B, and C to complete a certain task.  They might have already been carefully pre-selected, or they might be more like what my own physical workbench looks like (in other words, a mishmash of whatever I've been using in the last few weeks).

Now lets say that the creator of Server A has pre-existing knowledge or preferences about how best to use their tools or prompts, and/or more background information about the underlying systems.

Some examples could include:

- 'Tool C should always be used after tool A and B'
- 'This Prompt or Tool works best if specialized tools from other servers X and Y are available'
- 'All Tools are rate limited to 10 requests per minute'
- 'Always look up the user's language and accessibility preferences before attempting to fetch any resources with this server.'
- 'Only use Tool A to ask the user for their preferences if elicitation is supported.  Otherwise, fall back to using default user preferences.'

## Example: TODO more specific and detailed example

TODO

## Solutions

One solution could be to include this extra information in every tool description or prompt provided by the server.  However, going back to the physical tool analogy: you can only depend on 'labeling' each tool if there is enough space to describe them.  A model's context window limitations are similar, since they have hard limits to how much information you can fit into that space.  (And even if all those labels can fit within your model's context limits, the more tokens you cram into that space, the more likely it is you might cause more confusion than clarity.)

Alternatively, relying on just prompts to give common instructions like this means that:

- The prompt always needs to be selected by the user, and
- The instructions are more likely to get lost in the shuffle of other messages.  

Imagine a pile of post-it notes, all filled out with instructions on how to do this or that with a drawer full of tools.  Its totally possible that you have the right notes lined up in front of you to do everything reliably, but its not always the most efficient way to provide this type of context.

For 'global' instructions you always want the LLM to follow, instead of repeating them in multiple tool descriptions or prompts in a server, it can make more sense to include them in the model's system prompt instead.  This is where **server instructions** come in, to give the server a way to inject information that the LLM should always 'read' in order to understand how to use the server - independent of individual prompts, tools or messages.

**Note:** since the exact way that the host uses server instructions is up to the implementer (as a `MAY` in the spec), its not guaranteed that they will be injected into the system prompt.  Its recommended to evaluate a given clients behavior with your server and its tools before relying on this functionality.

### Implementing Server Instructions

TODO

## Which host applications support server instructions?

At the time of writing, only a few host applications definitively support server instructions - for a complete list, refer to the [Clients](https://modelcontextprotocol.io/clients) page in the MCP documentation.  Claude Code and VSCode (Insider's Edition) were the clients used to demonstrate server instructions for this post.

## Wrapping Up

Although its just an unassuming text field, this post skimmed the surface of how `instructions` can be used and implemented in both clients and servers.  
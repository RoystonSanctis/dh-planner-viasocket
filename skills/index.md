# viaSocket skills — index for AI agents

The one entry point for an agent connected to the viaSocket MCP (`https://mcp.docstar.io/connector/viasocket`).
Pick the row that matches the task, fetch that one guide, read it whole and follow it. Do not read the others.

Fetch raw and read the whole file you fetch (`curl -s <url>`, or a fetch that returns the text verbatim): a summarizing
fetch drops the exact keys and schemas the skills depend on. These files change; never work from a saved copy.

Base for the links below: `https://raw.githubusercontent.com/Walkover-Web-Solution/viasocket-developer-hub-skills/refs/heads/main/`

## Pick one

| The person wants to… | Fetch |
| -------------------- | ----- |
| build a plug for an app, or add several actions/triggers to one | `skills/SKILL-PLUG-CREATION.md` |
| create, fix or improve one action or trigger of an existing plug | `skills/SKILL-ACTION.md` |
| create, edit or copy one connection (auth) of an existing plug | `skills/SKILL-CONNECTION.md` |
| (automation, no person in the loop) build a plug from an integration request | `skills/SKILL-REQUEST-INTEGRATION.md` |
| integrate viaSocket into their product (let their users connect apps, run actions, receive events) on a Node.js backend | `https://flow.viasocket.com/documentation/skill-install.md` |
| the same from a non-Node backend (plain HTTP) | `https://flow.viasocket.com/documentation/skill-install.md?format=http` |
| deploy or host the finished app on Embarko | `https://embarko.ai/docs/quickstart.md` |

## Shared by the plug skills

- `knowledge-base/index.md`: every knowledge-base file, and every section of the large ones as its own small file.
  The skills cite sections as `<file> "<Heading>"`: find the heading there and fetch only that section.
- `knowledge-base/publish-policy.md`: who may publish what. It wins over any other file.
- `dh-review-agent.md`: the review a plug passes before it is published.

## Not for agents working through the MCP

`dh-master-planner.md`, `dh-planner-chat.md`, the other root `dh-*-agent.md` files, `viasocket-template-agent.md`,
`system-instruction/`, `sub-agents/`, `architecture-context/` and `code/` are prompts and tooling for viaSocket's
in-product planner.

To add or rename a skill, change this table only: the MCP quickstart, the MCP instructions, `AGENTS.md` and the
feedback automation all point here instead of listing skills.

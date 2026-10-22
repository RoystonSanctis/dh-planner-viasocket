# viaSocket Developer Hub skills — index for AI agents

Start here when an agent connected to the viaSocket MCP (`https://mcp.docstar.io/connector/viasocket`) builds or
changes a plug. Links are relative to `https://raw.githubusercontent.com/RoystonSanctis/dh-planner-viasocket/refs/heads/dev/`.
Fetch raw and read the whole file you fetch (`curl -s <url>`, or a fetch that returns the text verbatim); a summarizing
fetch drops the exact keys and schemas the skills depend on.

## Pick one skill

| The person wants to… | Fetch |
| -------------------- | ----- |
| build a plug for an app, or add several actions/triggers to one | [skills/SKILL-PLUG-CREATION.md](skills/SKILL-PLUG-CREATION.md) |
| create, fix or improve one action or trigger of an existing plug | [skills/SKILL-ACTION.md](skills/SKILL-ACTION.md) |
| create, edit or copy one connection (auth) of an existing plug | [skills/SKILL-CONNECTION.md](skills/SKILL-CONNECTION.md) |
| (automation, no person in the loop) build a plug from an integration request | [skills/SKILL-REQUEST-INTEGRATION.md](skills/SKILL-REQUEST-INTEGRATION.md) |

Each skill says which knowledge-base files to read in full and cites detail sections as `<file> "<Heading>"`.

## Knowledge base

- [knowledge-base/index.md](knowledge-base/index.md): every knowledge-base file, and every section of the large ones as
  its own small file. Look a cited heading up there and fetch only that section.
- [knowledge-base/publish-policy.md](knowledge-base/publish-policy.md): who may publish what. It wins over any other file.
- [dh-review-agent.md](dh-review-agent.md): the review a plug passes before it is published.

## Not for external agents

`dh-master-planner.md`, `dh-planner-chat.md`, the other root `dh-*-agent.md` files, `viasocket-template-agent.md`,
`system-instruction/`, `sub-agents/`, `architecture-context/` and `code/` are prompts and tooling for viaSocket's
in-product planner. An agent working through the MCP uses the skills above instead.

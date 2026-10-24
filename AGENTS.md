# Instructions for AI agents working in this repo

Cursor, Codex and other agents load this file automatically when they open the repo.

- Start at [skills/index.md](skills/index.md). It picks exactly one skill for the task; read that skill whole and follow it. Do not
  read the other skills.
- Read [knowledge-base/publish-policy.md](knowledge-base/publish-policy.md) before publishing anything; it wins over
  every other file.
- Never read all of `knowledge-base/`. Read the files the chosen skill says to read in full; for every other
  `<file> "<Heading>"` it cites, find the heading in [knowledge-base/index.md](knowledge-base/index.md) and read only
  that section's file.
- `knowledge-base/index.md` and `knowledge-base/sections/` are generated: to change knowledge, edit the source file in
  `knowledge-base/` and run `python3 code/build-kb-sections.py`.
- The root `dh-*-agent.md` files (except `dh-review-agent.md`, used for reviews), `dh-master-planner.md`,
  `system-instruction/` and `sub-agents/` are prompts for viaSocket's in-product planner, not for you.

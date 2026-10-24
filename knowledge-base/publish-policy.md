# Publish policy

The one place that says who may publish what in Developer Hub. Skills, the MCP quickstart and the viaSocket
maintenance agent follow this file; where another file disagrees, this file wins.

## Never, for anyone

- Edit a `published` version in place: changes go to a `drafted` version or a COPY of the published one.
- Hard-delete anything, or unpublish or delete a plug (`status: "unpublished"` / `"deleted"` cascades to every action).
- Publish a connection (auth version) change, or Force Update Action Version (moves end users' live flows), without a
  person saying yes to that specific change.
- Publish code that has not passed the review (`dh-review-agent.md`) and a dry run.

## Who may publish

| Who | Plugs | May publish |
| --- | ----- | ----------- |
| A developer's agent, `SKILL-PLUG-CREATION.md` / `SKILL-ACTION.md` | the developer's own (in `list_plugins`) | only after the developer says yes in the chat, then private or public as they choose (each skill's §4.3) |
| A developer's agent, `SKILL-CONNECTION.md` / `SKILL-REQUEST-INTEGRATION.md` | the developer's own | never: they leave drafts |
| A developer's agent | viaSocket's (used in flows, not in `list_plugins`) | never: no edits at all; `report_feedback` instead |
| viaSocket's maintenance agent (from `report_feedback`) | viaSocket's | without asking, only (a) a new action or trigger, or (b) a backward-compatible new version of an existing one; anything else stays a draft and a person decides in Slack |
| viaSocket's review agent (from `report_published`) | a developer's plug that was just published | the same as the maintenance agent: only new actions/triggers and backward-compatible new versions, after review and dry run; never the developer's connection or OAuth app |

## Test connection version

To test a plug end to end, viaSocket's maintenance and review agents may add one draft connection version named
"viaSocket OAuth (test)" to a plug whose OAuth 2.0 connection uses the developer's own OAuth app: a COPY of that
version with viaSocket's own client id and secret. It is never made the preferred version and never published, the
developer's own versions are never changed, and later runs reuse it. Client ids and secrets go straight into the
Developer Hub, never into chat, files, PRs or logs.

## Backward compatible

A new version of a published action or trigger is backward compatible only when every existing input key, its type
and its required flag, the output shape, and the behaviour for inputs that already worked all stay the same, and the
change only fixes wrong behaviour or adds optional inputs or outputs. Check it by dry-running an input that worked on
the published version and the reported case on the new one; publish only if both succeed. Never force-update.

## Rollback

Whoever publishes records the previously published version id (in the action's `metadata.aiLogs` and in the report to
the person) so it can be re-published if the new one misbehaves.

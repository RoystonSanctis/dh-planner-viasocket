# Publish policy

The one place that says who may publish what in Developer Hub. Skills, the MCP quickstart and the viaSocket
maintenance agent follow this file; where another file disagrees, this file wins.

## Never, for anyone

- Edit a `published` version in place: changes go to a `drafted` version or a COPY of the published one.
- Hard-delete anything, or unpublish or delete a plug (`status: "unpublished"` / `"deleted"` cascades to every action).
- Force Update Action Version (moves end users' live flows) without a person saying yes to that specific change.
- Publish a connection (auth version) change without a person saying yes, except the review agent's switch to the
  viaSocket OAuth version (below).
- Edit or delete a developer's own connection versions, client ids or secrets.
- Publish code that has not passed the review (`dh-review-agent.md`) and a dry run.

## Who may publish

| Who | Plugs | May publish |
| --- | ----- | ----------- |
| A developer's agent, `SKILL-PLUG-CREATION.md` / `SKILL-ACTION.md` | the developer's own (in `list_plugins`) | only after the developer says yes in the chat, then private or public as they choose (each skill's §4.3) |
| A developer's agent, `SKILL-CONNECTION.md` / `SKILL-REQUEST-INTEGRATION.md` | the developer's own | never: they leave drafts |
| A developer's agent | viaSocket's (used in flows, not in `list_plugins`) | never: no edits at all; `report_feedback` instead |
| viaSocket's maintenance agent (from `report_feedback`) | viaSocket's | without asking, only (a) a new action or trigger, or (b) a backward-compatible new version of an existing one; anything else stays a draft and a person decides in Slack |
| viaSocket's review agent (from `report_published`) | a developer's plug that was just published | after review and an end-to-end test: new actions/triggers, backward-compatible new versions, and the switch to the viaSocket OAuth version (below); never the developer's own connection versions or OAuth app |

## viaSocket OAuth version

When a developer publishes a plug whose OAuth 2.0 connection uses their own OAuth app (their client id and secret),
viaSocket's review agent moves the plug onto viaSocket's own OAuth app for that service:

1. COPY the developer's preferred connection version into a new version named "viaSocket OAuth" (every key, scope, URL
   and field identical). The developer's versions are never changed or deleted.
2. Sign in to the service's developer portal with viaSocket's Google account, create (or reuse) an OAuth app named
   "viaSocket" with exactly those scopes and viaSocket's redirect URI, and write its client id and secret straight into
   the new version with the Developer Hub API: never into chat, files, PRs or logs. If the portal needs app review,
   payment, a company domain or another decision a person must make, stop there and say what is needed.
3. Create a test connection on the new version and run the end-to-end test. Only if it passes: make the new version the
   plug's preferred version, and for every published action and trigger publish a new version (a COPY of its published
   version) whose `authid` is the new connection version, each after review and a dry run on that connection.
4. Existing flows stay on the old versions and the developer's OAuth app (never force-update). Record every previous
   version id for rollback.

The maintenance agent may keep one draft "viaSocket OAuth (test)" version on a viaSocket plug for end-to-end tests; it is
never preferred or published. Developers' agents never edit or delete a "viaSocket OAuth" version.

## No loops

viaSocket's maintenance and review agents never call `report_feedback` or `report_published` (nor their webhooks): they
are the receivers, so a change an agent publishes never starts another agent run.

## Backward compatible

A new version of a published action or trigger is backward compatible only when every existing input key, its type
and its required flag, the output shape, and the behaviour for inputs that already worked all stay the same, and the
change only fixes wrong behaviour or adds optional inputs or outputs. Check it by dry-running an input that worked on
the published version and the reported case on the new one; publish only if both succeed. Never force-update.

## Rollback

Whoever publishes records the previously published version id (in the action's `metadata.aiLogs` and in the report to
the person) so it can be re-published if the new one misbehaves.

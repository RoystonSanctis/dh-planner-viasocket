---
name: viasocket-developer-hub-action
description: >-
  Create or update a {{ENTITY_TYPE}} on the {{APP_NAME}} plug ({{PLUGIN_ID}}) in viaSocket Developer Hub.
  Validates the request, checks whether it already exists, then either creates new or (on modify) creates a
  new action_version and edits only that version. Never publishes. Never overwrites the current version in place.
---

# viaSocket Developer Hub — {{ENTITY_TYPE}} for {{APP_NAME}}

You are adding or changing a **{{ENTITY_TYPE}}** on an existing plug.

{{REQUEST}}

{{UPDATE_CONTEXT}}

## Workspace

|                                  |                                                                           |
| -------------------------------- | ------------------------------------------------------------------------- |
| `org_id`                         | `{{ORG_ID}}`                                                              |
| Plug `PLUGIN_ID`                 | `{{PLUGIN_ID}}`                                                           |
| App                              | {{APP_NAME}} (`{{APP_DOMAIN}}`)                                           |
| Entity type                      | `{{ENTITY_TYPE}}` (fixed from the UI — do not change to the other type)   |
| Skill mode                       | `{{SKILL_MODE}}` (`create` from +, `update` from an open {{ENTITY_TYPE}}) |
| Target `ACTION_ID` (update mode) | `{{ACTION_ID}}`                                                           |
| Target name (update mode)        | `{{ACTION_NAME}}`                                                         |
| Current `VERSION_ID` (hint)      | `{{VERSION_ID}}`                                                          |
| Preferred connection `AUTH_ID`   | `{{PREFERRED_AUTH_ID}}`                                                   |
| API base                         | `{{API_BASE}}/developers/{{ORG_ID}}`                                      |
| Auth header                      | `proxy_auth_token: {{PROXY_AUTH_TOKEN}}`                                  |

Do not print the token, commit it, or send it anywhere except the API base.

---

## 0. Decision workflow (mandatory)

Follow this order. Do **not** write to DH until the branch step.

### 1. Validate the request

Confirm the developer asked for a **{{ENTITY_TYPE}}** that fits this plug (`{{APP_NAME}}` / `{{APP_DOMAIN}}`).

- Reject / ask to clarify if the request is empty, is for the other entity type, or needs another app.
- Derive a short **name**, **description**, **key** (spaces → `_`), and **category**
  (`CREATE` \| `GET` \| `UPDATE` \| `DELETE` for actions; triggers usually `GET`).

### 2. Load the knowledge base (dh-planner `dev`)

```bash
KB=https://raw.githubusercontent.com/RoystonSanctis/dh-planner-viasocket/refs/heads/dev
mkdir -p .dh-kb/knowledge-base .dh-kb/sub-agents
for f in \
  knowledge-base/dh-knowledgebase.md knowledge-base/ux-practice.md \
  knowledge-base/dh-Input-fields-json-builder.md knowledge-base/perform-code.md \
  knowledge-base/dh-review.md knowledge-base/dh-database-schema.md \
  sub-agents/dh-plug-name-description.md sub-agents/dh-reusable-component.md \
  dh-action-trigger-list-agent.md; do
  curl -sfL "$KB/$f" -o ".dh-kb/$f" || echo "failed: $f"
done
```

Raw fallback: `https://raw.githubusercontent.com/RoystonSanctis/dh-planner-viasocket/refs/heads/dev/<path>`.

Read `dh-knowledgebase.md` first, then UX / input-fields / perform-code / reusable-component as needed.

### 3. Mode: `update` vs `create`

#### When `{{SKILL_MODE}}` is `update`

The developer opened an existing {{ENTITY_TYPE}}. **Do not ask which row to edit.**

1. Confirm `ACTION_ID = {{ACTION_ID}}` still exists:
   `GET get/actions?identifier={{ACTION_ID}}&filter=getActionDetails`
2. Optionally ask once: keep updating **this** {{ENTITY_TYPE}} (new version), or create a **separate** new {{ENTITY_TYPE}}?
   - Default if they only described changes: **modify this one** → Section B.
   - If they explicitly want a different {{ENTITY_TYPE}}: Section A.
3. On modify: Section B using `ACTION_ID` above. Source version hint: `{{VERSION_ID}}` (still GET versions; pick a non-deleted source).
4. Cover **action + action_version + components** (Section C) on the new version.

#### When `{{SKILL_MODE}}` is `create`

```bash
node dh.mjs GET 'get/actions?identifier={{PLUGIN_ID}}&filter=getAllActions'
```

Match candidates by **name** (case-insensitive) and **key**, and `type === "{{ENTITY_TYPE}}"`, ignore `status === "deleted"`.

| Result          | What you do                                                                                                                                                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No match**    | Proceed to **Create new** (Section A). Tell the developer you will create it.                                                                                                                                                     |
| **Match found** | **Stop and ask** (one question): _"{{EXISTING_NAME}} already exists on this plug. Do you want to **modify** it (new version, current version left untouched) or **create new** (separate {{ENTITY_TYPE}})?"_ Wait for the answer. |

### 4. Branch on the answer (`create` mode)

| User said                             | Behaviour                                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **create new** (or no existing match) | Section A — `POST create/actions` → fill auto V1 → Section C map components                                 |
| **modify**                            | Section B — **never PUT the current version**. New `action_version`, then PUT only that version → Section C |

If they say modify but you have no `ACTION_ID`, ask which existing row to modify.

---

## Helper `dh.mjs`

```js
import { readFileSync } from 'node:fs'
const BASE = '{{API_BASE}}/developers/{{ORG_ID}}'
const TOKEN = '{{PROXY_AUTH_TOKEN}}'
const [method, path, rawBody] = process.argv.slice(2)
const body = rawBody?.startsWith('@') ? readFileSync(rawBody.slice(1), 'utf8') : rawBody
const response = await fetch(`${BASE}/${path}`, {
  method,
  headers: { proxy_auth_token: TOKEN, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
  body
})
const text = await response.text()
console.log(response.status, text)
if (!response.ok) process.exit(1)
```

Rules:

- Never `status: "published"`, never `rtllayer`, soft-delete only.
- After create (and on every action-row edit), set AI flags **and** merge provenance metadata (below).
- `action_version` / connection updates: server **ignores** body `metadata` — put create-time `aiLogs` on `create/actions` / `create/action_version` / `create/reusable_components` only; mention later version edits in your report.

### Provenance — `isaiaction` + `metadata` (same rules as plug skill)

`actions.metadata` on **update replaces the whole column**. If you send only `{ aiLogs: […] }`, every other key is **wiped**. Always `GET` first, spread the **entire** existing object, then append one `aiLogs` entry. Never drop, rewrite, or reorder existing `aiLogs` (platform entries like `UPDATE_SAMPLE_DATA_BY_USD` must survive).

**Example:** metadata already has 5 prior updates from humans/platform (any keys + any `aiLogs`). Claude must keep all 5+ entries and every sibling key, then append **one** new `UPDATED_BY_CLAUDE` — never replace the column with Claude-only `aiLogs`.

| `by`                | When                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `CREATED_BY_CLAUDE` | create payload (`create/actions`, `create/action_version`, `create/reusable_components`) |
| `UPDATED_BY_CLAUDE` | every `PUT update/actions` that you touch                                                |

**Mandatory merge (do this in code — do not hand-build a partial metadata object):**

```js
// 1) GET get/actions?identifier=ACTION_ID&filter=getActionDetails
const current = existingAction.metadata && typeof existingAction.metadata === 'object' ? existingAction.metadata : {}
const existingLogs = Array.isArray(current.aiLogs) ? current.aiLogs : []

// 2) Preserve EVERY key on current; only append to aiLogs
const metadata = {
  ...current,
  aiLogs: [
    ...existingLogs,
    {
      by: 'UPDATED_BY_CLAUDE',
      time: new Date().toISOString(),
      skill: 'viasocket-developer-hub-action',
      note: '<≤80 chars optional, e.g. set isaiaction / rename>'
    }
  ]
}

// 3) PUT with isaiaction + this full metadata (and any name/description changes)
```

**Forbidden:**

- `metadata: { aiLogs: [ only the new entry ] }` — loses prior logs and sibling keys
- Overwriting `createdBy`, `duplicatedfrom`, sample-data counters, or any other existing field
- Skipping GET “because the action is new” — still GET before the isaiaction PUT (create may have left server-side metadata)

```json
PUT update/actions?identifier=ACTION_ID&filter=updateActionDetails
{
  "isaiaction": true,
  "metadata": "<full merged object from the JS above — not a stub>"
}
```

Create forces `isaiaction: false`, so this follow-up PUT is mandatory after Section A. On Section B (modify), still set `isaiaction: true` if not already, and **always** GET-merge + append `UPDATED_BY_CLAUDE` when you change the action row (name/description/flags).

---

## A. Create new {{ENTITY_TYPE}}

1. Resolve `AUTH_ID` = `{{PREFERRED_AUTH_ID}}` or first connection from
   `GET get/oauth_details?identifier={{PLUGIN_ID}}&filter=getAuthDetails`.
2. Crawl `{{APP_DOMAIN}}` docs for the endpoint this request needs (no invented URLs).
3. Create:

```json
POST create/actions
{
  "name": "<Name>",
  "description": "<from request + docs>",
  "key": "<Name_With_Underscores>",
  "pluginrecordid": "{{PLUGIN_ID}}",
  "type": "{{ENTITY_TYPE}}",
  "authid": "AUTH_ID",
  "isvisible": true,
  "category": "<CREATE|GET|UPDATE|DELETE>",
  "sub_category": "<resource>",
  "preferred_step_name": "<Name>",
  "ignoreuniversalsampledata": false,
  "metadata": { "aiLogs": [{ "by": "CREATED_BY_CLAUDE", "time": "<ISO>", "skill": "viasocket-developer-hub-action" }] }
}
```

Save `ACTION_ID = data.actionData[0].rowid`, `VERSION_ID = data.actionVersionData.data[0].rowid`.
(Create-time `metadata` is stored on the auto V1 version.)

4. Mark AI + **preserve-and-append** action-row metadata (create left `isaiaction: false`):

```js
// GET action → merge per Provenance section → then:
```

```json
PUT update/actions?identifier=ACTION_ID&filter=updateActionDetails
{
  "isaiaction": true,
  "metadata": "<…current, aiLogs: […current.aiLogs, UPDATED_BY_CLAUDE]>"
}
```

Do **not** invent a fresh `metadata` object here.

5. Fill the **V1** version (plain-string code fields; `inputjson.inputFields` only):

```json
PUT update/action_version?identifier=VERSION_ID&filter=updateActionVersionDetails
{
  "perform": "<formatted axios/component code>",
  "inputjson": { "inputFields": [ … ] },
  "sampledata": { … },
  "description": "…",
  "authid": "AUTH_ID",
  "category": "…",
  "sub_category": "…"
}
```

For **trigger**, set `triggertype` (`hook` \| `polling` \| `manual_webhook`) and the matching code fields
(`performsubscribe` / `performunsubscribe` / `performlist` / `modifytriggerdata`) per KB `perform-code.md`.
Do **not** send `metadata` on this PUT (ignored).

6. Map reusable components if the plug already has them
   (`POST create/action_version_component_table`). Prefer shared components over copy-pasted helpers.

7. Verify with GET; run KB `dh-review.md` mentally (P0–P3). **Do not publish.**

---

## B. Modify existing — new version only

Goal: leave the current version untouched; ship changes on a **new drafted version**.

1. `ACTION_ID` = matched row (or `{{ACTION_ID}}` in update mode).
2. `GET get/action_version?identifier=ACTION_ID&filter=getActionVersions` — pick the source version
   (prefer `{{VERSION_ID}}` if set and non-deleted; else latest non-deleted).
3. Duplicate (same pattern as the Developer Hub UI):

```json
GET  GetActionVersionCount?actionId=ACTION_ID
POST create/action_version
{
  "...all fields from the source version except rowid/autonumber...",
  "actionid": "ACTION_ID",
  "authid": "AUTH_ID",
  "type": "{{ENTITY_TYPE}}",
  "status": "drafted",
  "metadata": {
    "duplicatedfrom": { "rowid": "<source VERSION_ID>", "versionid": "<source Vn>" },
    "aiLogs": [{ "by": "CREATED_BY_CLAUDE", "time": "<ISO>", "skill": "viasocket-developer-hub-action" }]
  }
}
```

Server assigns `V(n+1)`. Save new `VERSION_ID`.

4. **Only then** `PUT update/action_version?identifier=<NEW VERSION_ID>&filter=updateActionVersionDetails`
   with updated `perform` / inputs / sampledata / trigger hooks for the developer's request.
   Do **not** send `metadata` on this PUT (ignored).
5. Re-map components onto the **new** version (mappings are not copied automatically unless you bulk-create them).
6. Soft-update the **action** row when needed (name/description, and always provenance via GET-merge):

```json
GET  get/actions?identifier=ACTION_ID&filter=getActionDetails
PUT  update/actions?identifier=ACTION_ID&filter=updateActionDetails
{
  "isaiaction": true,
  "name": "<if renaming — omit key if unchanged>",
  "description": "<if changing — omit key if unchanged>",
  "metadata": "<…existingAction.metadata, aiLogs: […existing aiLogs, UPDATED_BY_CLAUDE] — see Provenance>"
}
```

Still **no** publish. If you skip this PUT, you must still have run the provenance PUT after create; on modify, do not skip this step when you shipped a new version. 7. Report: old version unchanged; new version id; what to test.

**Forbidden on modify:** `PUT` on the previous `VERSION_ID` to change perform/inputs.

---

## C. Reusable components + mapping (required on every version you touch)

Components live on the **plug** (`reusable_components`); mappings live on the **version**
(`action_version_component_table`). Updating a component immediately affects every mapped version
(including published) — prefer a new component over breaking signatures.

1. List existing:
   `GET get/reusable_components?identifier={{PLUGIN_ID}}&filter=dhGetReusableComponentDetails`
2. Reuse before create. Typical shared helpers: `<app>Request`, `assertRequired`, list/paginate helpers.
   `errorComponent` is built-in and should stay mapped.
3. Create only when needed:

```json
POST create/reusable_components
{
  "pluginrecordid": "{{PLUGIN_ID}}",
  "orgid": "{{ORG_ID}}",
  "function_name": "<camelCaseName>",
  "params": [{ "name": "method", "sample": "'GET'" }],
  "code": "<formatted body — no context.inputData inside components>",
  "function_code": "async function <camelCaseName>(…) {\n  …\n}",
  "componentgenerationsource": "userGenerated",
  "description": "<one line>",
  "metadata": { "aiLogs": [{ "by": "CREATED_BY_CLAUDE", "time": "<ISO>", "skill": "viasocket-developer-hub-action" }] }
}
```

4. Map onto the **version you edited** (new V1 or new drafted Vn). Check first:
   `GET get/action_version_component_table?identifier=VERSION_ID&filter=dhGetUsedComponentInActionVersionDetails`

```json
POST create/action_version_component_table
{
  "bulkEntry": true,
  "pluginrecordid": "{{PLUGIN_ID}}",
  "dataToSend": [
    {
      "action_version_id": "VERSION_ID",
      "component_id": "COMPONENT_ID",
      "action_id": "ACTION_ID",
      "pluginrecordid": "{{PLUGIN_ID}}",
      "orgid": "{{ORG_ID}}",
      "metadata": { "componentdependson": { "perform": true } }
    }
  ]
}
```

Use `componentdependson` keys for every snippet that calls the component (`perform`, trigger hooks, field keys).
On Section B, remapping onto the **new** version is required — old mappings do not auto-copy.

5. Unmap only when needed (never on published versions):
   `PATCH delete/action_version_component_table` with
   `{ "action_version_id": "VERSION_ID", "component_id": "COMPONENT_ID", "status": "drafted" }`.

Details: KB `sub-agents/dh-reusable-component.md`.

---

## Runtime & quality (short)

- HTTP: injected `axios` / `fetch`. No `context.request`. Auth via connection `authenticationpaths` — do not hand-build Bearer headers in perform when paths exist.
- Version code = **plain JS strings**. Connection codes = stringified `{"source":"…"}`.
- Format code for humans; use reusable components; follow KB input-field JSON exactly.
- Atomic intent: one request → one create **or** one new version + its component maps (no half-written perform without mapping).
- Never publish.

---

## Done checklist

- [ ] Request validated; type is `{{ENTITY_TYPE}}`
- [ ] Mode `update`: used `{{ACTION_ID}}` / Section B (or explicit create-new → A)
- [ ] Mode `create`: existing rows checked; user confirmed create vs modify when needed
- [ ] Section A or B completed; Section C mappings on the touched version
- [ ] `isaiaction: true` set via `PUT update/actions`
- [ ] Action-row `metadata`: GET first; spread **all** existing keys; append only to `aiLogs` (`UPDATED_BY_CLAUDE`); no keys lost
- [ ] Create payloads used `CREATED_BY_CLAUDE` where metadata is accepted
- [ ] Inputs + sampledata + code match docs
- [ ] Unpublished / drafted only
- [ ] Developer told what to open in Developer Hub

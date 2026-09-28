---
name: viasocket-developer-hub-plug
description: >-
  Build or update the {{APP_NAME}} ({{APP_DOMAIN}}) plug in viaSocket Developer Hub through its REST API:
  crawl the app's real API docs, then create the plug, connection, reusable components, actions and
  triggers with production-quality, formatted code that matches the viaSocket VM runtime. Use when asked
  to build, extend, fix or review a viaSocket plug. Never publishes.
---

# viaSocket Developer Hub — build the {{APP_NAME}} plug

You are building a **plug**: the viaSocket integration for **{{APP_NAME}}** (`{{APP_DOMAIN}}`). Flow builders
will use it to connect their {{APP_NAME}} account, run actions, and start flows from triggers. Everything
you write runs in production for real users, so it must be **correct against the app's real API**,
**correct against the viaSocket runtime** (Section 6), **readable** (Section 7), and **built from reusable
components** (Section 8).

Read this whole skill before the first write. Sections 5–8 describe runtime behaviour that is not visible
from the API and that is the usual reason a plug "looks done" but fails for users.

{{USECASE}}

## Workspace

|                        |                                          |
| ---------------------- | ---------------------------------------- |
| `org_id`               | `{{ORG_ID}}`                             |
| App                    | {{APP_NAME}}                             |
| Domain                 | `{{APP_DOMAIN}}`                         |
| Developer Hub API base | `{{API_BASE}}/developers/{{ORG_ID}}`     |
| Auth header            | `proxy_auth_token: {{PROXY_AUTH_TOKEN}}` |

The token is the developer's dashboard session. Do not print it back, commit it, or send it anywhere other
than the API base above.

---

## 0. Workflow (follow in order)

1. **Load the viaSocket knowledge base** (Section KB) — at minimum `dh-knowledgebase.md`.
2. **Crawl** the app's site and developer docs; write the inventory (Section 2). No DH writes before this.
3. **Design** the plug with the KB's UX rules: auth type, the action/trigger list, the reusable components,
   every input field.
4. **Check for an existing plug** (`getAllPlugins`). If one exists for this domain, update it — never create
   a duplicate.
5. **Plug** → create, then update details (Section 3).
6. **Connection** → create with `authenticationpaths`, connection label and test code (Section 4).
7. **Reusable components** → create the shared helpers (Section 8).
8. **Actions and triggers** → create each, then PUT its version with formatted code, inputs and sample data,
   then map the components it calls (Sections 9–10).
9. **Review** every action against `knowledge-base/dh-review.md` and verify by reading everything back
   (Section 11). Fix what fails.
10. **Stop.** Do not publish. Report to the developer what was built, what you could not verify (you have
    no app credentials) and what they should test in Developer Hub.

---

## KB. viaSocket knowledge base (dh-planner) — load before designing

viaSocket's own plug-design rules, UX patterns and worked examples live in the public repo
`RoystonSanctis/dh-planner-viasocket` (branch `dev`). This skill covers the Developer Hub API and the
runtime; the knowledge base covers **what good plugs look like** (field design, naming, per-category UX,
code conventions, review rules). Use both.

### Fetch it locally (preferred)

Some files are thousands of lines, so a web-fetch summary loses detail. Download the raw files and read or
grep the sections you need:

```bash
KB=https://raw.githubusercontent.com/RoystonSanctis/dh-planner-viasocket/refs/heads/dev
mkdir -p .dh-kb/knowledge-base .dh-kb/sub-agents
for f in \
  knowledge-base/dh-knowledgebase.md knowledge-base/ux-practice.md knowledge-base/ux-worked-examples.md \
  knowledge-base/dh-Input-fields-json-builder.md knowledge-base/perform-code.md knowledge-base/dh-review.md \
  knowledge-base/dh-connection-practice.md knowledge-base/dh-connection-schema.md \
  knowledge-base/dh-database-schema.md knowledge-base/backed-plug-service.md \
  knowledge-base/viasocket-flow-execution-script.md \
  sub-agents/dh-plug-name-description.md sub-agents/dh-reusable-component.md \
  dh-action-trigger-list-agent.md dh-connection-agent.md dh-review-agent.md dh-master-planner.md; do
  curl -sfL "$KB/$f" -o ".dh-kb/$f" || echo "failed: $f"
done
```

Each file starts with a `# Page Index`; read that first, then only the sections you need. If you cannot
run shell commands, fetch the same raw URLs one at a time
(`https://raw.githubusercontent.com/RoystonSanctis/dh-planner-viasocket/refs/heads/dev/<path>`). Do not use the
`github.com/...` page URLs.

### Index — what to read when

| When                                | File                                                                              | Covers                                                                                                                                                                                              |
| ----------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Always, first**                   | `knowledge-base/dh-knowledgebase.md` (~400 lines)                                 | Consolidated rules: universal rules, trigger types, design strategy, naming, field ordering per category, field types, visibility/dependsOn, code skeletons, reusable components, review priorities |
| Choosing the action/trigger list    | `dh-action-trigger-list-agent.md`                                                 | Research protocol, completeness/splitting rules, exclusion gates, naming contract, deduplication                                                                                                    |
| Naming, descriptions, category      | `sub-agents/dh-plug-name-description.md`                                          | Action/trigger title and description rules, type and category guidelines                                                                                                                            |
| Designing each action/trigger's UX  | `knowledge-base/ux-practice.md`                                                   | Per-category patterns (GET, LIST, FIND/SEARCH, CREATE, UPDATE, FIND OR CREATE, FIND + UPDATE, DELETE; instant/scheduled/manual triggers)                                                            |
| Looking for a similar real example  | `knowledge-base/ux-worked-examples.md` (~10k lines — grep by category or app)     | Real actions (HubSpot, Xero, Google Sheets, Calendly…) with the UX rationale, input JSON and perform code                                                                                           |
| Writing input fields                | `knowledge-base/dh-Input-fields-json-builder.md` (~5k lines — use its Page Index) | Exact JSON for every static/dynamic field type, `whereClause`, visibility rules, `list`/`limit`, custom mapping, defaults                                                                           |
| Writing perform / trigger code      | `knowledge-base/perform-code.md`                                                  | Trigger and action code rules and snippets, error handling, success-code handling, final code review                                                                                                |
| Designing the connection            | `knowledge-base/dh-connection-practice.md`, `dh-connection-agent.md`              | Auth selection priority, Basic/OAuth 2/OAuth 1/No Auth patterns, connection label and field naming, token safety                                                                                    |
| Connection payload fields           | `knowledge-base/dh-connection-schema.md`                                          | Connection object, create and update payload schemas per auth type                                                                                                                                  |
| Action/trigger/component fields     | `knowledge-base/dh-database-schema.md`                                            | Category/sub-category guidelines, action/trigger/component/mapping schemas                                                                                                                          |
| Reusable components                 | `sub-agents/dh-reusable-component.md`                                             | Parameterisation, return formats, try/catch, mapping `path` rules                                                                                                                                   |
| App allows only one webhook per app | `knowledge-base/backed-plug-service.md`                                           | viaSocket multi-service webhook receiver (register service, subscribe/unsubscribe users)                                                                                                            |
| Webhook + "Get Data" flows          | `knowledge-base/viasocket-flow-execution-script.md`                               | How a webhook trigger's pre-process step fetches data                                                                                                                                               |
| Final review                        | `knowledge-base/dh-review.md`, `dh-review-agent.md`                               | Review checklist and priorities (P0 breaking → P3 text)                                                                                                                                             |
| Orchestration context (optional)    | `dh-master-planner.md`                                                            | How viaSocket's own planner agent sequences the work                                                                                                                                                |

### Precedence when sources disagree

1. **Runtime and API facts in this skill win** (Sections 1, 4.1–4.6, 6, 8.1, 8.4): how credentials are
   masked and injected, what `context` contains, available globals, wire formats, endpoints and filters.
   The knowledge base was written for viaSocket's in-app agent, whose tools (e.g.
   `Fetch_Mapped_Reusable_Component_In_Action_Version`) you do not have; use the REST calls in this skill
   instead.
2. **UX, naming, field design, code conventions and review rules come from the knowledge base.**
3. Never send `rtllayer`, `isAIActionTrigger`, `functionId` or `isUserOnDh`, even though the KB schemas
   list them: `rtllayer` without `isAIActionTrigger` auto-publishes the action.

If the docs are ambiguous or missing (OAuth client credentials, private endpoints, unclear auth), ask the
developer. Never invent endpoints, fields, scopes or secrets.

---

## 1. Calling the Developer Hub API

### 1.1 Helper (write this once, reuse it)

Save as `dh.mjs` in a scratch directory (Node 18+, no dependencies):

```js
// dh.mjs — usage: node dh.mjs METHOD 'path?query' ['{"json":"body"}' | @body.json]
import { readFileSync } from 'node:fs'

const BASE = '{{API_BASE}}/developers/{{ORG_ID}}'
const TOKEN = '{{PROXY_AUTH_TOKEN}}'

const [method, path, rawBody] = process.argv.slice(2)
const body = rawBody?.startsWith('@') ? readFileSync(rawBody.slice(1), 'utf8') : rawBody

const response = await fetch(`${BASE}/${path}`, {
  method,
  headers: {
    proxy_auth_token: TOKEN,
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '1'
  },
  body
})
const text = await response.text()
console.log(response.status, text)
if (!response.ok) process.exit(1)
```

For anything bigger than a few fields, build the JSON body in a file (`@body.json`) with a script. Never
hand-escape JavaScript code into a JSON string on the command line: that is how code gets mangled.

### 1.2 Endpoints

| Op                    | Method  | Path                                                                                |
| --------------------- | ------- | ----------------------------------------------------------------------------------- |
| Create                | `POST`  | `create/<table>` + JSON body                                                        |
| Read                  | `GET`   | `get/<table>?identifier=<id>&filter=<filter>` (add `&fields=a,b` to select columns) |
| Update                | `PUT`   | `update/<table>?identifier=<id>&filter=<filter>` + JSON body                        |
| Delete                | `PATCH` | `delete/<table>?identifier=<id>&filter=<filter>` + body (see warnings)              |
| Latest version number | `GET`   | `GetActionVersionCount?actionId=<ACTION_ID>` → e.g. `"3"`                           |
| Connection usage      | `GET`   | `GetUsedInCountForAuth?pluginId=<PLUGIN_ID>`                                        |

Tables: `plugins`, `oauth_details`, `actions`, `action_version`, `reusable_components`,
`action_version_component_table`.

| Filter                                     | Table                          | `identifier` is                            |
| ------------------------------------------ | ------------------------------ | ------------------------------------------ |
| `getAllPlugins`                            | plugins                        | the org id `{{ORG_ID}}`                    |
| `getPluginDetails` / `updatePluginDetails` | plugins                        | PLUGIN_ID                                  |
| `getAuthDetails`                           | oauth_details                  | PLUGIN_ID (lists every connection version) |
| `updateAuthDetails`                        | oauth_details                  | AUTH_ID                                    |
| `getAllActions`                            | actions                        | PLUGIN_ID                                  |
| `getActionDetails` / `updateActionDetails` | actions                        | ACTION_ID                                  |
| `getActionVersions`                        | action_version                 | ACTION_ID                                  |
| `updateActionVersionDetails`               | action_version                 | VERSION_ID                                 |
| `dhGetReusableComponentDetails`            | reusable_components            | PLUGIN_ID                                  |
| `dhUpdateReusableComponentDetails`         | reusable_components            | COMPONENT_ID                               |
| `dhDeleteReusableComponent`                | reusable_components            | COMPONENT_ID                               |
| `dhGetUsedComponentInActionVersionDetails` | action_version_component_table | VERSION_ID                                 |
| `dhGetUsedActionVersionForComponent`       | action_version_component_table | COMPONENT_ID                               |

An unknown filter returns `Invalid filter`. Identifiers are row ids (`row` + alphanumerics).

### 1.3 Responses

- Create: `{ "success": true, "data": { "actionData": [row], "actionVersionData": {...} } }`
  → new id is `data.actionData[0].rowid`. For `actions`, the auto-created V1 version id is
  `data.actionVersionData.data[0].rowid`.
- Update: `{ "success": true, "data": [updatedRow] }`.
- Get: `{ "success": true, "data": [rows] }` (an empty result is `[]`).
- Errors: `success: false` with a message such as `unable to update entry for <table>` plus the DB error.
  Read it, fix the payload, retry. The server does **not** whitelist fields: a typo'd column name is
  either silently stored or rejected by the DB, so spell fields exactly as in this skill.

### 1.4 Rules that protect production

- The server forces new rows to `unpublished` / `drafted` / `NOT_VERIFIED`. Never send `status: "published"`,
  `actionversionrecordid`, or `publishdescription`.
- **Never send `rtllayer`** in any body: on `create/actions` it auto-publishes the action.
- **Deleting:** soft-delete only. Actions: `PUT update/actions?filter=updateActionDetails` with
  `{"status":"deleted"}`. Versions: `PUT update/action_version?filter=updateActionVersionDetails` with
  `{"isdeleted":true}`. Plug: `PUT update/plugins` with `{"status":"deleted"}`. The generic `PATCH delete/`
  on `plugins`, `actions` or `action_version` is a **hard delete** — do not use it.
- A **published** version cannot be edited. To change it, create a new version (Section 9.4) and edit that.
- Always `GET` before `PUT` when changing something you did not create in this session.

### 1.5 Provenance — mark everything you create or change

viaSocket tracks AI-made work. Every row you create or edit must say it was done by Claude, without losing
metadata that is already there.

**One shape everywhere.** Log entries use the same `{ by, time }` shape the platform already writes to
`metadata.aiLogs` (e.g. `{ "by": "UPDATE_SAMPLE_DATA_BY_USD", "time": "…" }`), with these values:

| `by`                | When                        |
| ------------------- | --------------------------- |
| `CREATED_BY_CLAUDE` | you created the row         |
| `UPDATED_BY_CLAUDE` | you changed an existing row |

```json
{ "by": "CREATED_BY_CLAUDE", "time": "2026-09-26T10:15:00.000Z", "skill": "viasocket-developer-hub-plug" }
```

`time` is `new Date().toISOString()`. Add a short `note` (≤ 80 chars) only when the reason is not obvious
(`"fixed authenticationpaths format"`). Never remove or rewrite existing `aiLogs` entries — the platform
reads them (for example `UPDATE_SAMPLE_DATA_BY_USD` counts drive sample-data automation).

**Preserve metadata.** The server handles `metadata` differently per table and operation:

| Table                                       | On create                                                         | On update                                                                                                                      |
| ------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `plugins`, `actions`, `reusable_components` | body `metadata` is stored                                         | body `metadata` **replaces the whole column** → `GET` the row, merge, send the full object                                     |
| `action_version`, `oauth_details`           | body `metadata` is stored (`save` history is added by the server) | body `metadata` is **ignored**; the server keeps the stored metadata and appends its own `save` entry → do not send `metadata` |

Merge rule for updates (`plugins`, `actions`, `reusable_components`):

```js
const current = existingRow.metadata || {}
const metadata = {
  ...current,
  aiLogs: [
    ...(Array.isArray(current.aiLogs) ? current.aiLogs : []),
    { by: 'UPDATED_BY_CLAUDE', time: new Date().toISOString(), skill: 'viasocket-developer-hub-plug' }
  ]
}
// PUT { ...otherChanges, metadata }
```

**Plug (`plugins.metadata`).** On create, also record who created it — once, never overwritten later:

```json
"metadata": {
  "createdBy": {
    "type": "AI",
    "agent": "claude",
    "skill": "viasocket-developer-hub-plug",
    "orgId": "{{ORG_ID}}",
    "time": "<ISO time>"
  },
  "aiLogs": [{ "by": "CREATED_BY_CLAUDE", "time": "<ISO time>", "skill": "viasocket-developer-hub-plug" }]
}
```

If you are updating a plug someone else created, leave `createdBy` untouched and only append an
`UPDATED_BY_CLAUDE` entry.

**Actions and triggers.** Mark them as AI-made with `isaiaction: true`. The create endpoint forces
`isaiaction` to `false` (it only sets it together with `rtllayer`, which you must never send), so set it
with a follow-up update right after creating (Section 9.1):

```json
PUT update/actions?identifier=ACTION_ID&filter=updateActionDetails
{ "isaiaction": true, "aiorgid": "{{ORG_ID}}" }
```

Send `metadata: { "aiLogs": [CREATED_BY_CLAUDE entry] }` in the `create/actions` body; it is stored on the
auto-created V1 version. Do the same in `create/action_version` bodies (9.4), `create/oauth_details` and
`create/reusable_components`. Editing an existing version or connection cannot add an `aiLogs` entry (the
server ignores `metadata` there); mention those edits in your final report instead.

---

## 2. Crawl and design (before any write)

### 2.1 What to crawl

1. `https://{{APP_DOMAIN}}`: product description, logo, brand colour.
2. Developer docs: `/docs`, `/developers`, `/api`, `/reference`, and `developers.{{APP_DOMAIN}}` /
   `docs.{{APP_DOMAIN}}`. Look for `llms.txt` and an **OpenAPI spec** (`openapi.json`, `swagger.json`).
   If a spec exists, download it and read endpoints, parameters, enums and response schemas from it: it is
   the most reliable source.
3. Authentication docs: API key vs OAuth 2 vs Basic; where users find their key; OAuth authorize, token and
   refresh URLs, scopes, token lifetime.
4. Webhooks / events docs: event names, subscribe and unsubscribe endpoints, payload examples, signatures.
5. Rate limits and pagination style (page/limit, cursor, offset).

### 2.2 Inventory (write it down before writing to DH)

| Item                                                                                    | Used for                               |
| --------------------------------------------------------------------------------------- | -------------------------------------- |
| Description, category, logo URL, brand colour                                           | plug details                           |
| API base URL(s) and every host you call                                                 | `whitelistdomains`, component base URL |
| Auth type, credential fields, where the user finds them                                 | connection                             |
| Header/query format of the credential (`Authorization: Bearer …`, `X-Api-Key`, `?key=`) | `authenticationpaths`                  |
| A cheap authenticated "who am I" endpoint                                               | `testcode` + connection label          |
| Endpoints per capability: method, path, params, body, response                          | actions                                |
| Webhook events + subscribe/unsubscribe, or list endpoints to poll                       | triggers                               |
| Pagination format                                                                       | dropdowns, list actions, polling       |

### 2.3 What to build

- **Actions:** one per meaningful operation (Create/Get/Update/Delete/List/Find for each main resource, plus
  notable operations). Cover what the use case needs first; if the developer asks for "everything", cover
  the whole public API except endpoints that only exist to manage the integration itself (e.g. webhook
  CRUD can still be exposed as actions, but triggers must manage their own webhooks).
- **Triggers:** prefer `hook` when the API can create webhooks programmatically; `manual_webhook` when users
  must paste a URL in the app's UI; `polling` when there are no webhooks but a list endpoint sorted by
  creation/update time exists.
- **Consolidate** per the KB's design strategy: e.g. one unified LIST action (mode: list all / search / by
  ID) instead of separate list/search/get, upsert instead of a create-vs-update toggle, variants folded into
  one action via a boolean or static dropdown.
- **Names** (KB "Naming"): actions `[Verb] [Object]` in Title Case (`Create Contact`); triggers start with
  `New` / `Updated` / `Deleted` (`New Form Response`). Descriptions ≤ 120 chars; trigger descriptions start
  with `Runs when …`. Omit the app name unless the name is too generic without it. `key` = name with spaces
  replaced by `_` (`Create_Contact`); never rename keys of existing actions.
- **Category:** `CREATE`, `GET`, `UPDATE`, `DELETE` (use `GET` for list/find and for triggers); see the KB's
  category guidelines in `dh-database-schema.md`. `sub_category` = the resource in Title Case.
- **Inputs:** every resource ID the user would otherwise have to copy from the app is a **dynamic dropdown**
  (Section 9.3) — except in `DELETE` actions, which take a plain `string` ID plus an irreversibility `help`
  notice. Enums are static dropdowns. Required fields first, optionals after. Every documented API parameter
  is either an input or handled in code; never invent undocumented ones.

---

## 3. Plug (`plugins`)

### 3.1 Find or create

```bash
node dh.mjs GET 'get/plugins?identifier={{ORG_ID}}&filter=getAllPlugins'
```

If no plug has `domain` = `{{APP_DOMAIN}}`:

```json
POST create/plugins
{
  "name": "{{APP_NAME}}",
  "orgid": "{{ORG_ID}}",
  "domain": "{{APP_DOMAIN}}",
  "whitelistdomains": ["{{APP_DOMAIN}}"],
  "metadata": {
    "createdBy": {
      "type": "AI",
      "agent": "claude",
      "skill": "viasocket-developer-hub-plug",
      "orgId": "{{ORG_ID}}",
      "time": "<ISO time>"
    },
    "aiLogs": [{ "by": "CREATED_BY_CLAUDE", "time": "<ISO time>", "skill": "viasocket-developer-hub-plug" }]
  }
}
```

Save `PLUGIN_ID = data.actionData[0].rowid`. If the plug already exists, do not touch `createdBy`; append
an `UPDATED_BY_CLAUDE` entry with your first update (Section 1.5).

### 3.2 Details

```json
PUT update/plugins?identifier=PLUGIN_ID&filter=updatePluginDetails
{
  "description": "One or two sentences from the app's own site: what it is and what the plug lets users do.",
  "domain": "{{APP_DOMAIN}}",
  "whitelistdomains": ["{{APP_DOMAIN}}", "api.{{APP_DOMAIN}}"],
  "audience": "Private",
  "category": ["<one of the dashboard categories, e.g. Forms and Surveys, CRM, Developer Tools>"],
  "tags": ["short", "keywords"],
  "iconurl": "<real logo URL>",
  "brandcolor": "#RRGGBB",
  "havestaticip": false,
  "metadata": "<current metadata, merged per Section 1.5>"
}
```

`metadata` replaces the whole column on this endpoint: `GET` the plug first and send the merged object
(keep `createdBy` and every existing `aiLogs` entry). Omit `metadata` entirely if you are not changing it.

- `whitelistdomains` must contain every host your code calls (Section 4.3).
- Optional helper: `POST {{API_BASE}}/openai/dh/getBrandDetails` with
  `{"pluginDomain":"{{APP_DOMAIN}}","pluginName":"{{APP_NAME}}","pluginId":"PLUGIN_ID"}` fills logo,
  colour, description, tags and category. It **writes directly to the plug** and may overwrite `name`,
  `domain`, `audience` and `whitelistdomains`, so run it _before_ your own details PUT, then re-apply
  `whitelistdomains` and `audience`.
- Do **not** call `/openai/dh/getActionTriggersSuggestions`: it creates action rows immediately.
- After the connection exists, set `{"preferedauthversion":"AUTH_ID"}` on the plug.

---

## 4. Connection (`oauth_details`)

A plug can have several connection versions (`authversion` `V1`, `V2`, …). Every action version points at
one via `authid`.

### 4.1 How credentials reach your code (read carefully)

When a connection has `authenticationpaths`, the VM **masks** credentials inside plug code:
`context.authData.api_key` is the literal string `"${context.authData.api_key}"`, not the key. The real
value is only inserted by the HTTP interceptor, in two places:

1. the headers/query/body entries declared in `authenticationpaths`, on every `axios`/`fetch` call whose
   URL is on the whitelist, and
2. `${context.authData.x}` placeholders in the URL **hostname and path** (e.g. per-account subdomains).

Consequences:

- **Always define `authenticationpaths`** and **never build auth headers in action/trigger/component
  code.** A hand-built `Authorization: 'Bearer ' + context.authData.api_key` sends the literal placeholder
  and fails with 401.
- Calls to non-whitelisted hosts are sent **without auth and without any error**. The app then answers 401.
- Exception: `testcode`, `accesstokencode`, `refreshtokencode` and `revokeapicode` run with **real**
  values and must set their own headers.

### 4.2 `authenticationpaths` format

```json
{
  "headers": [{ "name": "Authorization", "value": "return `Bearer ${context.authData.api_key}`" }],
  "queryParams": [],
  "body": []
}
```

- Each entry is `{ "name", "value" }`. `value` is a **function body** run as
  `new Function('context', value)(context)`, so it must `return` the value. Anything else is silently
  ignored or breaks the request. (`{key, value}` and bare template strings do not work.)
- In `value`, `context.authData` holds the real stored credentials:
  - Basic/API key: the `authfields` keys (`context.authData.api_key`), plus `context.authData.testcode`
    (what testcode returned).
  - OAuth 2: the token response fields (`context.authData.access_token`); `context.authData.accesstokencode`
    is an alias of the same object.
- `queryParams` entries are set on the URL; `body` entries are merged only into JSON object bodies.
- Get it right before the first test run: the VM caches a connection's `authenticationpaths`/whitelist
  (`authInfo-fromDbDash-<AUTH_ID>`, up to 30 days). Any `PUT update/plugins` on the plug clears that cache for
  all of its connections, so after changing `authenticationpaths` or `whitelistdomains`, send a plug update
  (e.g. the provenance `metadata` merge from Section 1.5) and re-test.

### 4.3 Whitelist

`whitelistdomains` on the connection (and on the plug) lists the hosts that receive credentials. The match
is by registrable domain (`api.example.com` matches `example.com`). Keep `skipwhitelistvalidation: false`
unless the app uses customer-specific domains that cannot be listed; when `true`, the whole URL is templated.

### 4.4 Connection label (mandatory)

Users see a label on each saved connection (for example their email). Connection creation **fails** with
`connection label can't be empty` if it is missing.

- `connectionlabelkey`: a short key, e.g. `"email"`.
- `connectionlabelvalue`: a path into `{ context: { authData: { ...fields, testcode: <testcode return> } } }`,
  e.g. `"context.authData.testcode.email"`.
- `isconnectionlabelmasked`: `false` for emails or names; `true` (the default) for anything secret.

### 4.5 `testcode`

Runs when a user saves a connection, with the **real** values in `context.authData` and the plain `axios`.
Call the cheapest authenticated endpoint and **return the response body**; it is stored as
`context.authData.testcode` (usable by the label, and by `authenticationpaths` if the app returns a token).
Throw (or let axios throw) on bad credentials; any `status >= 400` in the result also fails the connection.

### 4.6 Wire format of connection code

`testcode`, `accesstokencode`, `refreshtokencode` and `revokeapicode` are stored as a **JSON string of
`{"source": "<js>"}`**, and `queryparams` as a JSON string. Build the object, then `JSON.stringify` it once:

```js
const testcode = JSON.stringify({ source: TEST_CODE }) // TEST_CODE is the formatted JS below
```

### 4.7 Create — API key / token (`type: "Basic"`)

```json
POST create/oauth_details
{
  "pluginrecordid": "PLUGIN_ID",
  "authversion": "V1",
  "type": "Basic",
  "granttype": null,
  "redirecturl": "https://auth.viasocket.com/redirect/auth1",
  "description": "Connect with your {{APP_NAME}} API key.",
  "authfields": {
    "authentication": {
      "type": "basic",
      "fields": [
        {
          "key": "api_key",
          "label": "API Key",
          "type": "password",
          "required": true,
          "placeholder": "<key format from docs>",
          "help": "<exact place in the app where the user creates the key, from the docs>"
        }
      ]
    }
  },
  "queryparams": "{}",
  "accesstokencode": "{\"source\":null}",
  "refreshtokencode": "{\"source\":null}",
  "revokeapicode": "{\"source\":null}",
  "testcode": "<JSON.stringify({ source: TEST_CODE })>",
  "authenticationpaths": {
    "headers": [{ "name": "Authorization", "value": "return `Bearer ${context.authData.api_key}`" }],
    "queryParams": [],
    "body": []
  },
  "whitelistdomains": ["{{APP_DOMAIN}}", "api.{{APP_DOMAIN}}"],
  "skipwhitelistvalidation": false,
  "connectionlabelkey": "email",
  "connectionlabelvalue": "context.authData.testcode.email",
  "isconnectionlabelmasked": false,
  "metadata": { "aiLogs": [{ "by": "CREATED_BY_CLAUDE", "time": "<ISO time>", "skill": "viasocket-developer-hub-plug" }] }
}
```

`TEST_CODE`:

```js
const response = await axios.get('https://api.{{APP_DOMAIN}}/<me endpoint from docs>', {
  headers: {
    Authorization: `Bearer ${context.authData.api_key}`,
    'Content-Type': 'application/json'
  }
})

return response.data
```

Auth field `type`: `string` | `password` | `dropdown` | `help`. Field `key` must match what
`authenticationpaths`/`testcode` read (`context.authData.<key>`). Add extra fields (subdomain, region) the
same way; a subdomain can then be used in URLs as `https://${context.authData.subdomain}.example.com`.

### 4.8 Create — OAuth 2 (`type: "Auth2.0"`)

Needs the developer's OAuth app `clientid` / `clientsecret`: **ask for them**, never invent them. The
redirect URL to register in the app is `https://auth.viasocket.com/redirect/auth2.0`.

```json
POST create/oauth_details
{
  "pluginrecordid": "PLUGIN_ID",
  "authversion": "V1",
  "type": "Auth2.0",
  "granttype": "Authorization Code",
  "clientid": "<from developer>",
  "clientsecret": "<from developer>",
  "authrequrl": "<authorize URL from docs>",
  "redirecturl": "https://auth.viasocket.com/redirect/auth2.0",
  "scopeseperatedby": "space",
  "queryparams": "{\"scope\":\"<scopes from docs>\",\"response_type\":\"code\"}",
  "authfields": { "authentication": { "type": "Auth2.0", "fields": [] } },
  "accesstokencode": "<JSON.stringify({ source: ACCESS_TOKEN_CODE })>",
  "refreshtokencode": "<JSON.stringify({ source: REFRESH_TOKEN_CODE })>",
  "revokeapicode": "{\"source\":null}",
  "testcode": "<JSON.stringify({ source: TEST_CODE })>",
  "authenticationpaths": {
    "headers": [{ "name": "Authorization", "value": "return `Bearer ${context.authData.access_token}`" }],
    "queryParams": [],
    "body": []
  },
  "whitelistdomains": ["{{APP_DOMAIN}}"],
  "connectionlabelkey": "email",
  "connectionlabelvalue": "context.authData.testcode.email",
  "isconnectionlabelmasked": false,
  "metadata": { "aiLogs": [{ "by": "CREATED_BY_CLAUDE", "time": "<ISO time>", "skill": "viasocket-developer-hub-plug" }] }
}
```

`granttype`: `Authorization Code` | `Implicit` | `Client Credentials` | `Password Credentials`.
`scopeseperatedby`: `space` or `,`.

`ACCESS_TOKEN_CODE` (inputs: `context.authData.clientid`, `.clientsecret`, `.redirecturl`,
`.Authorization.code`):

```js
const response = await axios.post(
  '<token URL from docs>',
  new URLSearchParams({
    grant_type: 'authorization_code',
    code: context.authData.Authorization?.code,
    redirect_uri: context.authData.redirecturl,
    client_id: context.authData.clientid,
    client_secret: context.authData.clientsecret
  }).toString(),
  { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
)

return response.data
```

`REFRESH_TOKEN_CODE` (previous tokens are in `context.authData.accesstokencode`):

```js
const response = await axios.post(
  '<token URL from docs>',
  new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: context.authData.accesstokencode?.refresh_token,
    client_id: context.authData.clientid,
    client_secret: context.authData.clientsecret
  }).toString(),
  { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
)

return response.data
```

`TEST_CODE`: same as 4.7 but with `Bearer ${context.authData.accesstokencode?.access_token}`.

Follow the provider's docs exactly (JSON vs form body, Basic client auth header, extra params such as
`owner=user` or `access_type=offline`). If refresh returns no new `refresh_token`, return the old one too.

### 4.9 NoAuth

```json
{
  "pluginrecordid": "PLUGIN_ID",
  "authversion": "V1",
  "type": "NoAuth",
  "redirecturl": "https://auth.viasocket.com/redirect/auth2.0",
  "authfields": { "authentication": { "type": "noauth", "fields": [] } },
  "queryparams": "{\"scope\":\"\",\"response_type\":\"\"}",
  "accesstokencode": "{\"source\":\"\"}",
  "refreshtokencode": "{\"source\":\"\"}",
  "revokeapicode": "{\"source\":\"\"}",
  "testcode": "{\"source\":\"return { success: true }\"}"
}
```

Save `AUTH_ID`, then set `preferedauthversion` on the plug. `clientsecret` is encrypted on save.

---

## 5. The data model at a glance

```
plugins (PLUGIN_ID)
 ├─ oauth_details         connection versions V1, V2 … (AUTH_ID)
 ├─ reusable_components   shared async functions (COMPONENT_ID)
 └─ actions               one row per action / trigger (ACTION_ID)
     └─ action_version    V1, V2 … code + inputs + sample (VERSION_ID), points at AUTH_ID
         └─ action_version_component_table   which components this version can call
```

---

## 6. The runtime (socket-vm) — what your code can and cannot do

### 6.1 How code is executed

Each code field (perform, subscribe, dropdown source, component…) is a **function body**. The VM pastes it
inside `async function step(context) { … }` together with the mapped components, and runs it in Node's
`vm` inside a child process.

- Top-level `await` works; **you must `return`** the result.
- These names already exist in that scope — **never redeclare them** with `const`/`let` (SyntaxError):
  `context`, `axios`, `fetch`, `console`, `authData`, `fieldsChanges`, `__stepId`, and every mapped
  component name.
- Steps have a short timeout (5–15 s depending on environment; polling triggers ~5 min), 256 MB of memory,
  and responses over 10 MB are truncated. Keep requests few and dropdown sources fast and paginated.

### 6.2 Globals

Available: `axios`, `fetch` (node-fetch 2), `_` (lodash), `moment` (moment-timezone), `crypto` (Node),
`Buffer`, `FormData` (npm `form-data`, use `.getHeaders()`), `URLSearchParams`, `atob`, `jwt`
(jsonwebtoken), `cheerio`, `XMLParser` / `XMLBuilder` / `XMLValidator` (fast-xml-parser), `setTimeout`,
`usaProxy` (use as `httpsAgent: usaProxy` when an API needs a US IP), all ES built-ins (`JSON`, `Promise`,
`Date`, `Intl`, `Math`…). Polling helpers: `__findFromMemory(key, initial)`, `__updateInMemory(key, value)`.

**Not available** (do not use): `URL`, `TextEncoder`, `btoa`, `structuredClone`, `setInterval`,
`clearTimeout`, `AbortController`, `Blob`, `require`, `process`, `module`, `import`. Build query strings
with `URLSearchParams`, base64 with `Buffer.from(x).toString('base64')`.

`axios` is a wrapper: callable as `axios(config)` and has `.get .post .put .patch .delete .request` only.
There is no `axios.create`, `axios.isAxiosError`, `axios.defaults` or interceptors. TLS verification is off.
`console` has only `log` and `error` (`console.warn` throws).

### 6.3 `context` by code field

| Field                       | What it receives                                                                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `perform` (action)          | `context.inputData` (the form values), `context.authData` (masked)                                                                                          |
| dropdown `source`           | `context.inputData` (values of other fields), `context.paginateData[<fieldKey>]` (last `offset` you returned), `__searchText` (only with `enableSearchApi`) |
| `performsubscribe`          | `context.inputData` incl. **`context.inputData.hookUrl`** (the URL to register). No `context.req`.                                                          |
| `performunsubscribe`        | `context.inputData` incl. **`context.inputData.performsubscribe`** = exactly what subscribe returned                                                        |
| `modifytriggerdata`         | `context.req.body`, `context.req.headers`, `context.req.query`, `context.req.url`, plus `context.inputData` (incl. `performsubscribe`)                      |
| `performlist`               | sample data for the editor; `context.inputData`                                                                                                             |
| `perform` (polling trigger) | `context.inputData`, `context.paginationData` (note the spelling)                                                                                           |
| `transferoption`            | `context.inputData.transferOption.offset`                                                                                                                   |
| `testcode` / token code     | `context.authData` with **real** values (Section 4)                                                                                                         |

There is **no** `context.subscribeData`, `context.triggerData` or `context.request`.

### 6.4 Input values

- `context.inputData.<key>` for each field. Values are coerced by field type: `number` → Number,
  `boolean` → boolean, `multiselect` → array, `dictionary` → object. Empty optional strings arrive as `''`
  and empty numbers may arrive as `0`: treat `''`, `null`, `undefined` (and `0` for optional page/limit
  fields) as "not provided" and **do not send them** to the API.
- Input-group children are nested: a group `address` with child `city` is `context.inputData.address.city`.

### 6.5 Errors

- Let axios errors propagate or pass them to `errorComponent` (Section 8.2): users then see the app's own
  error message and status.
- For your own validation errors, `throw { status: 400, message: 'Readable message for the user' }`.
  (`throw new Error('x')` also works but loses the status.)
- Never `catch` and `return` an error object as if it succeeded. Never swallow errors with `console.log`.

### 6.6 Return values

- Actions: return the useful API response (usually `response.data`). For endpoints with an empty body
  (204), return something mappable: `{ success: true, <idField>: <id> }`.
- Must be JSON-serialisable. Return plain data, never the axios response object.
- Triggers: returning an **array** from `modifytriggerdata` or a polling `perform` runs the flow **once per
  item** (up to 1000). Return an object for a single run.

---

## 7. Code quality — formatted, readable, consistent

Every code field is shown to developers in an editor and maintained by humans. Write it like production
source, not a minified one-liner.

**Bad** (generated, unreadable, duplicated in every action, leaks the auth pattern):

```js
const input = context.inputData || {}
const headers = { Authorization: `Bearer ${context.authData.api_key}`, 'Content-Type': 'application/json' }
const params = {}
for (const k of ['page']) if (input[k] !== undefined && input[k] !== null && input[k] !== '') params[k] = input[k]
const response = await axios.get(`https://api.example.com/webhooks/${encodeURIComponent(input.webhookId)}/events`, { headers, params })
return response.data
```

**Good** (formatted, destructured inputs, guard, shared component, standard error handling):

```js
try {
  const { webhookId, page } = context.inputData
  await assertRequired({ webhookId })

  return await exampleRequest('GET', `/webhooks/${encodeURIComponent(webhookId)}/events`, {
    params: { page }
  })
} catch (error) {
  await errorComponent(error)
}
```

### 7.1 Rules

1. **Format:** 2-space indent, single quotes, no semicolons, trailing commas off, lines ≤ 100 chars, one
   statement per line, blank line between logical blocks. Real newlines, never `\n`-joined strings.
2. **Skeleton:** every `perform`, `performsubscribe`, `performunsubscribe`, `modifytriggerdata` and dropdown
   `source` is wrapped in `try { … } catch (error) { await errorComponent(error) }`.
3. **Inputs:** destructure at the top — `const { formId, name } = context.inputData`. Exception: in dropdown
   `source`, reference parent fields literally as `context.inputData.parentKey`, because `dependsOn` is
   detected from that text.
4. **Required-field guards:** right after destructuring, throw a readable 400 if any `required: true` value is
   missing (a shared `assertRequired` component keeps this to one line). Also `throw` when the API answers
   200 with an error body.
5. **Payloads:** build with shorthand/spread (`{ name, email, ...extra }`) and strip empties in one place
   (the request component or one `Object.fromEntries(Object.entries(raw).filter(…))`), not with an `if` per
   field. For updates send only what the user filled in.
6. **No duplication:** base URL, auth-agnostic request logic, JSON parsing, pagination and ID lookups live
   in reusable components (Section 8). An action's perform is usually 3–15 lines.
7. **No auth in code** (Section 4.1). Only `Content-Type` and app-specific headers (API version headers
   belong in the request component).
8. **Encode path parameters** with `encodeURIComponent`. Build query strings with `params` or
   `URLSearchParams`, never by concatenating user input.
9. **No `console.log`** in saved code (use it only while debugging).
10. **Comments:** only where the reason is not obvious ("Tally's PATCH needs every field, so we read the
    current webhook first"). No tutorial comments, no commented-out code.
11. **Names:** `camelCase` variables and components, verbs for functions (`listContacts`, `getOrgId`).

### 7.2 Format mechanically

Format every snippet before sending it. Plug code has top-level `return`, so wrap it for prettier and
unwrap afterwards. Save as `fmt.mjs`:

```js
// fmt.mjs — usage: node fmt.mjs in.json out.json   (in.json = { "<id>": "<code>", ... })
// needs: npm i -D prettier (or run once: npx --yes prettier@3 --version)
import { readFileSync, writeFileSync } from 'node:fs'
import * as prettier from 'prettier'

const options = {
  parser: 'babel',
  semi: false,
  singleQuote: true,
  trailingComma: 'none',
  printWidth: 100,
  tabWidth: 2,
  arrowParens: 'always'
}

async function formatBody(code) {
  const output = await prettier.format(`async function __plug__() {\n${code}\n}\n`, options)
  return output
    .trimEnd()
    .split('\n')
    .slice(1, -1)
    .map((line) => line.replace(/^ {2}/, ''))
    .join('\n')
}

const input = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const output = {}
for (const [id, code] of Object.entries(input)) output[id] = await formatBody(code)
writeFileSync(process.argv[3], JSON.stringify(output, null, 2))
```

If prettier throws, the snippet has a syntax error: fix it before uploading.

---

## 8. Reusable components

### 8.1 What they are

A reusable component is a named `async function` stored once per plug (`reusable_components`) and
**mapped** to the action versions that use it (`action_version_component_table`). At run time viaSocket
pastes the `function_code` of every mapped component in front of the code, in the same scope, so a
component:

- is called directly by name: `await tallyRequest('GET', '/forms')` (always `await` — they are async);
- sees the step's `context`, `axios` (with auth injection), `fetch`, `console` and all globals;
- can call other components **only if those are mapped to the same version too** (no automatic
  dependency resolution);
- runs in actions, triggers (subscribe/unsubscribe/modify/polling) and dropdown `source` code.

### 8.2 Why and when

Use a component for anything used by two or more snippets, and always for:

| Component                             | Purpose                                                                                                                                                                                                         |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<app>Request(method, path, options)` | Base URL, API-version headers, drops empty params, returns `response.data`. Every action and dropdown calls this — one place to fix the API base or headers.                                                    |
| `errorComponent(error)`               | **Built in.** Created automatically for every plug and auto-mapped to every new action/trigger. Throws a clean `{ status, message, code, originalError }` from axios or plain errors. Always use it in `catch`. |
| `assertRequired(values)`              | Required-field guard: `await assertRequired({ formId, title })` throws `400 "Missing required field(s): title"`.                                                                                                |
| `parseJsonInput(value, fieldLabel)`   | JSON text inputs (arrays of blocks, custom fields) with a readable error.                                                                                                                                       |
| `list<Resource>(…)` / `paginate(…)`   | Shared list/pagination logic for list actions, dropdowns and polling.                                                                                                                                           |
| ID resolution helpers                 | e.g. `get<App>AccountId()` when many endpoints need an account/org id that the API can return.                                                                                                                  |
| Payload shaping                       | e.g. flattening custom fields, mapping webhook payloads, used by both trigger and actions.                                                                                                                      |

Do not make a component for a one-off, action-specific step. Search the plug's existing components before
creating a new one.

**Rules inside a component** (KB `sub-agents/dh-reusable-component.md`):

- Take everything as parameters. Never read `context.inputData`, `context.paginateData` or `__searchText`
  inside a component; the caller passes them (`await listForms(__searchText, context?.paginateData?.['formId'])`).
  This keeps components reusable and lets the server detect `dependsOn` from the caller's code.
- Validate required parameters first and throw a descriptive error.
- Wrap the body in `try { … } catch (error) { throw error }`. Never call `errorComponent` inside a component;
  the calling snippet catches and calls it.
- Dropdown-style components return `[{ label, value, sample }]`, or `{ data: [...], offset }` when paginated
  or searchable (Section 9.3).

**Caution:** components are **not versioned**. Updating one immediately changes every version mapped to it,
including published ones. Keep signatures backwards compatible; add a new component instead of changing
behaviour that published actions rely on.

### 8.3 Shape

| Field                       | Meaning                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `function_name`             | Valid JS identifier, unique within the plug (`tallyRequest`)                                                      |
| `params`                    | `[{ "name": "method", "sample": "'GET'" }, …]` — positional, in order; `sample` is a JS literal used when testing |
| `code`                      | The function **body** (formatted)                                                                                 |
| `function_code`             | The full declaration that actually runs: `async function <name>(<params>) {\n  <code indented 2>\n}`              |
| `description`               | One line (the server also generates one)                                                                          |
| `componentgenerationsource` | `"userGenerated"`                                                                                                 |

Build `function_code` from `code` so they never drift:

```js
const functionCode = `async function ${name}(${params.map((p) => p.name).join(', ')}) {\n${code
  .split('\n')
  .map((line) => (line ? `  ${line}` : line))
  .join('\n')}\n}`
```

### 8.4 API

List a plug's components (find `errorComponent`'s id here):

```bash
node dh.mjs GET 'get/reusable_components?identifier=PLUGIN_ID&filter=dhGetReusableComponentDetails'
```

Create (one per call; returns `data.actionData[0].rowid` = COMPONENT_ID):

```json
POST create/reusable_components
{
  "pluginrecordid": "PLUGIN_ID",
  "orgid": "{{ORG_ID}}",
  "function_name": "exampleRequest",
  "params": [
    { "name": "method", "sample": "'GET'" },
    { "name": "path", "sample": "'/me'" },
    { "name": "options", "sample": "{}" }
  ],
  "code": "<formatted body>",
  "function_code": "<async function exampleRequest(method, path, options) { … }>",
  "componentgenerationsource": "userGenerated",
  "description": "Calls the {{APP_NAME}} API; auth is injected by the connection.",
  "metadata": { "aiLogs": [{ "by": "CREATED_BY_CLAUDE", "time": "<ISO time>", "skill": "viasocket-developer-hub-plug" }] }
}
```

Bulk create: `{ "bulkEntry": true, "pluginrecordid": "PLUGIN_ID", "dataToSend": [ {…full rows incl. orgid…} ] }`.

Update: `PUT update/reusable_components?identifier=COMPONENT_ID&filter=dhUpdateReusableComponentDetails`
with the changed fields (always send `code` and `function_code` together).

Delete: first unmap it everywhere, then
`PATCH delete/reusable_components?identifier=COMPONENT_ID&filter=dhDeleteReusableComponent`.

Map components to a version (one row per component):

```json
POST create/action_version_component_table
{
  "bulkEntry": true,
  "pluginrecordid": "PLUGIN_ID",
  "dataToSend": [
    {
      "action_version_id": "VERSION_ID",
      "component_id": "COMPONENT_ID",
      "action_id": "ACTION_ID",
      "pluginrecordid": "PLUGIN_ID",
      "orgid": "{{ORG_ID}}",
      "metadata": { "componentdependson": { "perform": true } }
    }
  ]
}
```

- `componentdependson` records **where** the version uses the component: the section keys (`perform`,
  `performlist`, `performsubscribe`, `performunsubscribe`, `modifytriggerdata`, `transferoption`) and/or the
  **field key** of each dynamic field whose generator calls it (e.g. `"formId": true`; inside input groups use
  just the field key). Example for a trigger whose subscribe code and `formId` dropdown use it:
  `{ "performsubscribe": true, "performunsubscribe": true, "formId": true }`.
  This drives the editor UI; at run time every mapped component is injected into every snippet.
- Send `componentdependson` directly as above. The dashboard instead sends one `path` per usage, and `path`
  **toggles** that key (a second call with the same path removes it) — avoid `path` unless you mean to toggle.
  To add a usage to an existing mapping, PUT
  `update/action_version_component_table?identifier=<mapping rowid>&filter=dhUpdateReusableComponentDetails`
  with the full `metadata`.
- Check existing mappings first to avoid duplicates:
  `GET get/action_version_component_table?identifier=VERSION_ID&filter=dhGetUsedComponentInActionVersionDetails`.
- Unmap: `PATCH delete/action_version_component_table` with body
  `{ "action_version_id": "VERSION_ID", "component_id": "COMPONENT_ID", "status": "drafted" }`
  (rejected for published versions).
- Mapping rule: for each version, map every component referenced by its perform/trigger code **or any of
  its dropdown sources**, plus their dependencies, plus `errorComponent`. Map before the first test run.

### 8.5 Reference request component (adapt per app)

```js
try {
  if (!method || !path) throw { status: 400, message: 'method and path are required' }

  const { params, data, headers } = options || {}

  // Drop empty values so optional inputs never reach the API as '' or null
  const query = Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )

  const response = await axios({
    method,
    url: `https://api.{{APP_DOMAIN}}${path}`,
    params: query,
    data,
    headers: { 'Content-Type': 'application/json', ...headers }
  })

  return response.data
} catch (error) {
  throw error
}
```

`assertRequired(values)`:

```js
try {
  const missing = Object.entries(values || {})
    .filter(([, value]) => value === undefined || value === null || value === '')
    .map(([key]) => key)

  if (missing.length) throw { status: 400, message: `Missing required field(s): ${missing.join(', ')}` }

  return true
} catch (error) {
  throw error
}
```

A dropdown component following the same rules:

```js
// listForms(searchText, page) — params: [{ name: 'searchText', sample: "''" }, { name: 'page', sample: '1' }]
try {
  const currentPage = page || 1
  const response = await exampleRequest('GET', '/forms', {
    params: { q: searchText, page: currentPage, limit: 100 }
  })

  const items = response?.items || []
  if (!items.length) return { data: [], offset: searchText ? currentPage : null, message: 'No forms found.' }

  return {
    data: items.map((item) => ({ label: item.name, value: item.id, sample: item.id })),
    offset: response?.hasMore ? currentPage + 1 : null
  }
} catch (error) {
  throw error
}
```

Caller (`optionsGenerator` of `formId`, with `canPaginate` and `enableSearchApi`):

```js
try {
  return await listForms(__searchText, context?.paginateData?.['formId'])
} catch (error) {
  await errorComponent(error)
}
```

---

## 9. Actions

### 9.1 Create the action

```json
POST create/actions
{
  "name": "Create Contact",
  "description": "Create a contact in {{APP_NAME}}.",
  "key": "Create_Contact",
  "pluginrecordid": "PLUGIN_ID",
  "type": "action",
  "authid": "AUTH_ID",
  "isvisible": true,
  "category": "CREATE",
  "sub_category": "Contact",
  "preferred_step_name": "Create Contact",
  "ignoreuniversalsampledata": false,
  "metadata": { "aiLogs": [{ "by": "CREATED_BY_CLAUDE", "time": "<ISO time>", "skill": "viasocket-developer-hub-plug" }] }
}
```

This also creates version **V1** (`drafted`, carrying the `metadata` above) and maps `errorComponent` to it.
Save `ACTION_ID = data.actionData[0].rowid` and `VERSION_ID = data.actionVersionData.data[0].rowid`.

Then mark it as AI-made (the create endpoint always stores `isaiaction: false`):

```json
PUT update/actions?identifier=ACTION_ID&filter=updateActionDetails
{ "isaiaction": true, "aiorgid": "{{ORG_ID}}" }
```

### 9.2 Fill the version

```json
PUT update/action_version?identifier=VERSION_ID&filter=updateActionVersionDetails
{
  "perform": "<formatted code, plain string>",
  "inputjson": { "inputFields": [ …fields… ] },
  "sampledata": { …a realistic response from the docs… },
  "description": "Create a contact in {{APP_NAME}}.",
  "authid": "AUTH_ID",
  "category": "CREATE",
  "sub_category": "Contact"
}
```

- Code fields on versions (`perform`, `performlist`, `performsubscribe`, `performunsubscribe`,
  `modifytriggerdata`, `transferoption`) are **plain strings** — not `{source}` objects.
- Send only `inputjson.inputFields`; the server rebuilds `steps`/`blocks` and `dependsOn` from it.
- `sampledata` must match what the code returns (users map fields from it). Use the docs' example response;
  never leave `"string"` placeholders when the docs give real examples.
- Then map components (Section 8.4).

### 9.3 Input fields

The exact JSON for every field type is in the KB's `dh-Input-fields-json-builder.md`; follow it. The rules
that matter most:

- Base keys on every field: `key` (unique, no `.`, `[`, `]`), `type`, `label` (Title Case, the plain field
  name — "Form", not "Select Form"), `help`, `required`. `placeholder` is required for `string`, `number`,
  `date`, `html`, `markdown`, and is always a string (`"100"`, not `100`).
- `help` is short and non-technical: starts with **"Enter"** for text-like fields and **"Select"** for
  dropdown/multiselect/boolean. Never tell users to copy IDs from URLs.
- Dropdown, multiselect and boolean fields also need the **custom-mapping triplet**, shown when the user maps
  a value instead of picking one: `customInputLabel` (e.g. "Form ID"; must not start with "Enter"),
  `customHelp` (e.g. "Enter the form ID from actions like List Forms."), `customPlaceholder` (a concrete
  sample value, no "E.g.").
- Standalone `help` fields (`type: "help"`) only for critical notices: DELETE warnings, behaviour-changing
  choices, prerequisites, manual-webhook setup.
- Never write `steps`, `blocks` or `dependsOn` yourself — they are generated.

| `type`              | Use for                   | Notes                                                                      |
| ------------------- | ------------------------- | -------------------------------------------------------------------------- |
| `string`            | text, IDs the user types  | `list: true` + `limit` only for static preconfiguration (mostly triggers)  |
| `number`            | counts, limits            | arrives as Number                                                          |
| `date`              | dates                     | needs `dateFormat` (KB lists the 4 allowed formats)                        |
| `boolean`           | flags                     | `options: [{label:'Yes',value:true},{label:'No',value:false}]`, true first |
| `dropdown`          | one choice                | static `options` or dynamic `optionsGenerator`                             |
| `multiselect`       | several choices           | arrives as array; dynamic ones cannot paginate                             |
| `markdown` / `html` | rich text bodies          |                                                                            |
| `dictionary`        | key/value maps            | fixed `template` (see KB)                                                  |
| `input groups`      | nested objects            | static `fields: [...]` or dynamic `fieldsGenerator`; `list: true` repeats  |
| `aifield`           | AI-built structured input | needs `prompt` and `suggestionGenerator`                                   |
| `help`              | notices (no value)        | static `help` text, or dynamic `source` returning `{ message }`            |

Static dropdown:

```json
{
  "key": "status",
  "label": "Status",
  "type": "dropdown",
  "required": true,
  "help": "Select the form status.",
  "placeholder": "Select Status",
  "options": [
    { "label": "Published", "value": "PUBLISHED" },
    { "label": "Draft", "value": "DRAFT" }
  ],
  "customInputLabel": "Status",
  "customHelp": "Enter PUBLISHED or DRAFT.",
  "customPlaceholder": "PUBLISHED"
}
```

(`sample` is only needed when `value` is an ID that differs from `label`; it must equal `value`.)

Dynamic dropdown (`optionsGenerator` is copied to `source` by the server):

```json
{
  "key": "formId",
  "label": "Form",
  "type": "dropdown",
  "required": true,
  "help": "Select the form.",
  "placeholder": "Select Form",
  "canPaginate": true,
  "enableSearchApi": false,
  "optionsGenerator": "<formatted code>",
  "customInputLabel": "Form ID",
  "customHelp": "Enter the form ID from actions like List Forms.",
  "customPlaceholder": "wMbq9A"
}
```

```js
try {
  const page = context?.paginateData?.['formId'] || 1
  const response = await exampleRequest('GET', '/forms', { params: { page, limit: 100 } })
  const items = response?.items || []

  if (!items.length) return { data: [], offset: null, message: 'No forms found.' }

  return {
    data: items.map((item) => ({ label: item.name, value: item.id, sample: item.id })),
    offset: response?.hasMore ? page + 1 : null
  }
} catch (error) {
  await errorComponent(error)
}
```

**Return shape is strict:**

- `canPaginate` **or** `enableSearchApi` true → `{ data: [{ label, value, sample }], offset }`; `offset` is
  `null` when there are no more pages and comes back as `context.paginateData['<key>']` for the next page.
- Both false → `[{ label, value, sample }]`.
- Nothing found → `{ message: '…' }` (non-paginated), `{ data: [], offset: null, message }` (paginated), and
  keep the current offset when a search returns nothing.
- Dynamic **multiselect** supports neither flag: return a flat array, looping through pages if needed.
- Set `canPaginate` / `enableSearchApi` only if the API documents pagination / search parameters for that
  endpoint; with `enableSearchApi`, pass `__searchText` to the API's search parameter.
- A dependent dropdown references the parent **literally** (`context.inputData.workspaceId`); the server
  derives `dependsOn: ["workspaceId"]` from that text. When the parent is empty return
  `{ message: 'Select a workspace first.' }`.
- Labels must be human-readable (name, title, email); never show bare IDs when a name exists.

Conditional field — `visibilityCondition` is a boolean **expression** (no `return`) over `context.inputData`:

```json
{ "key": "post_at", "label": "At", "type": "string", "visibilityCondition": "context?.inputData?.schedule_type === 'datetime'" }
```

### 9.4 New version of a published action

```json
GET  GetActionVersionCount?actionId=ACTION_ID
POST create/action_version
{
  "actionid": "ACTION_ID",
  "authid": "AUTH_ID",
  "type": "action",
  "status": "drafted",
  "perform": "<code>",
  "metadata": { "aiLogs": [{ "by": "CREATED_BY_CLAUDE", "time": "<ISO time>", "skill": "viasocket-developer-hub-plug" }] }
}
```

The server numbers it `V(n+1)`. This endpoint does **not** build `steps`/`blocks`, so immediately PUT the
new version with `inputjson`, `sampledata` etc. (Section 9.2), and map its components (mappings are not
copied between versions).

---

## 10. Triggers

Create exactly like an action with `"type": "trigger"` and `"category": "GET"`, then PUT the version.

### 10.1 Instant — `hook` (the app has a webhook-creation API)

```json
PUT update/action_version?identifier=VERSION_ID&filter=updateActionVersionDetails
{
  "triggertype": "hook",
  "performsubscribe": "<code>",
  "performunsubscribe": "<code>",
  "performlist": "<code>",
  "modifytriggerdata": "<code>",
  "sampledata": { … },
  "inputjson": { "inputFields": [ … ] },
  "description": "…",
  "authid": "AUTH_ID"
}
```

Subscribe (runs when the flow is published; its return value is saved):

```js
try {
  return await exampleRequest('POST', '/webhooks', {
    data: {
      url: context.inputData.hookUrl,
      events: ['contact.created']
    }
  })
} catch (error) {
  await errorComponent(error)
}
```

Unsubscribe (runs when the flow is unpublished or deleted):

```js
try {
  const webhookId = context.inputData.performsubscribe?.id
  if (!webhookId) return { success: true }

  await exampleRequest('DELETE', `/webhooks/${encodeURIComponent(webhookId)}`)

  return { success: true, webhookId }
} catch (error) {
  await errorComponent(error)
}
```

Modify trigger data (runs on every incoming webhook; shape it exactly like `sampledata`):

```js
try {
  const payload = context.req.body || {}

  // Ignore events this trigger does not handle (e.g. an app that sends every event to one URL)
  if (payload.event !== 'contact.created') return []

  return payload.data
} catch (error) {
  await errorComponent(error)
}
```

- Returning `[]` runs nothing; an array runs the flow per item.
- `performlist` produces the sample shown in the editor (Test button) and must match
  `modifytriggerdata`'s output shape. Fetch the **latest single item** through the API and return
  `{ viasocket_help: REAL, ...item }`; if there is none (or no such API), return every expected key with an
  empty value as `{ viasocket_help: SAMPLE, ... }`, where
  - `REAL` = "This is the latest item data available in the selected resource. Save the Trigger and publish
    to get the new item created in the selected resource."
  - `SAMPLE` = "This data is only a sample of the original data. If you want to see the original data, then
    you have to save the trigger, publish the flow and perform the given action."
- If the app signs webhooks, verify the signature in `modifytriggerdata` when the secret is available.
- If the app allows only **one webhook per application** (not per user), use viaSocket's multi-service
  webhook receiver instead of per-flow webhooks — see KB `knowledge-base/backed-plug-service.md`.

### 10.2 Manual webhook — `manual_webhook` (user pastes the URL in the app)

Needs `performlist` and `modifytriggerdata` only (no auth, so `modifytriggerdata` can only reshape the
payload). The only input field is one static `help` field with two-part HTML instructions:
`🔗 Webhook Setup Guide` (list of steps: where in the app to paste the webhook URL, which events to select)
followed by `📤 What happens next?` (list explaining what data arrives). Heading → list, no text in between.

### 10.3 Polling — `polling` (no webhooks)

```json
{
  "triggertype": "polling",
  "perform": "<code>",
  "performlist": "<code>",
  "scheduleTimeOptions": [5, 15, 60, 720, 1440],
  "canpaginate": true,
  "sampledata": { … }
}
```

- `scheduleTimeOptions`: minutes, only from `5, 15, 60, 720, 1440`. The chosen interval is
  `context.inputData.scheduledTime`; the run start time is `__executionStartTime__` (ISO string).
- The platform does **no deduplication**. `perform` must return only items created (or updated) inside the
  current window, as an array (the flow runs once per item), from a **single page** (max 1000 items). Never
  expose page size, cursor or `scheduledTime` as inputs.
- Prefer the API's own time filter; otherwise filter client-side and sort oldest first:

```js
try {
  const { formId } = context.inputData
  await assertRequired({ formId })

  const windowStart = new Date(new Date(__executionStartTime__).getTime() - Number(context.inputData.scheduledTime || 15) * 60000)

  const response = await exampleRequest('GET', `/forms/${encodeURIComponent(formId)}/submissions`, {
    params: { startDate: windowStart.toISOString(), limit: 100 }
  })

  return (response?.items || [])
    .filter((item) => new Date(item.createdAt) >= windowStart)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
} catch (error) {
  await errorComponent(error)
}
```

- With `canpaginate: true`, a cursor can be carried across runs in `context.paginationData`: set it only when
  the filtered result is non-empty **and** the API returned a new next cursor; never reset it to `null`/`0`.
  See KB `dh-knowledgebase.md` → "Scheduled Perform" for the multi-resource cursor pattern and
  upcoming-event (lookahead) windows.

### 10.4 Transfer data — `transferoption` (optional, polling/hook)

Lets users import historical records. Read `context.inputData.transferOption.offset` and
`return { data: [...], offset: <next>, uniqueIdentifier: '<id field>' }`. `data` must be an array (max 200
per page); returning the same offset again ends the transfer.

---

## 11. Verify and fix — "done" means all of this is true

You cannot run code against the app without the user's credentials, so verify statically and by reading
back from the API.

### 11.1 Before uploading

- [ ] Every snippet passes `fmt.mjs` (formatting = syntax check).
- [ ] Run each snippet against a **mock** — an async function with `context`, a fake `axios(config)` that
      records calls, and the components prepended — and check the method, URL, query and body it produces
      for sample inputs, including empty optionals.
- [ ] No snippet builds an auth header, redeclares a reserved name (6.1) or uses an unavailable global
      (6.2).
- [ ] Every component a snippet calls is mapped to that version (including dropdown sources and transitive
      dependencies).

### 11.2 After uploading — read back

```bash
node dh.mjs GET 'get/plugins?identifier=PLUGIN_ID&filter=getPluginDetails'
node dh.mjs GET 'get/oauth_details?identifier=PLUGIN_ID&filter=getAuthDetails'
node dh.mjs GET 'get/actions?identifier=PLUGIN_ID&filter=getAllActions'
node dh.mjs GET 'get/action_version?identifier=ACTION_ID&filter=getActionVersions'
node dh.mjs GET 'get/action_version_component_table?identifier=VERSION_ID&filter=dhGetUsedComponentInActionVersionDetails'
```

- [ ] Plug: `status` unpublished, `whitelistdomains` complete, `preferedauthversion` = AUTH_ID, real icon,
      `metadata.createdBy` present (plugs you created) and earlier `metadata` keys still intact.
- [ ] Provenance: every action/trigger has `isaiaction: true`; every row you created has a
      `CREATED_BY_CLAUDE` entry in `metadata.aiLogs`, and every plug/action/component you edited has an
      `UPDATED_BY_CLAUDE` entry, with no existing entries lost.
- [ ] Connection: `authenticationpaths` entries use `{name, value: "return …"}`; label key/value set;
      `testcode` is a `{"source": …}` string.
- [ ] Every action/trigger: status `unpublished`, version `drafted`, correct `authid`, `inputjson.blocks`
      contains every field, dynamic dropdowns have `source`, dependent ones have `dependsOn`, `sampledata`
      present, code is multi-line and formatted.
- [ ] Triggers: `triggertype` correct and all required code fields for that type present.

### 11.3 Symptom → cause → fix

| Symptom (in DH test or user report)                     | Cause                                                                                                       | Fix                                                                    |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 401 / "unauthorized" on every action                    | Auth header built in code (masked placeholder sent), or `authenticationpaths` uses `{key}` / lacks `return` | Remove auth from code; set `{name, value: "return …"}`                 |
| 401 only for some hosts                                 | Host missing from `whitelistdomains` (auth silently skipped)                                                | Add the host to connection and plug                                    |
| `X is not defined` for a component                      | Component not mapped to this version                                                                        | Map it (and its dependencies)                                          |
| `Identifier 'context' has already been declared`        | Redeclared a reserved name                                                                                  | Rename the variable                                                    |
| `URL is not defined` / `btoa is not defined`            | Unavailable global                                                                                          | Use `URLSearchParams` / `Buffer`                                       |
| Connection save fails "connection label can't be empty" | No `connectionlabelkey`/`value`                                                                             | Set them (4.4)                                                         |
| Unsubscribe does nothing / webhooks pile up             | Read `context.subscribeData` (does not exist)                                                               | Use `context.inputData.performsubscribe.id`                            |
| Dropdown empty / wrong until parent chosen              | Parent read via destructuring, so no `dependsOn`                                                            | Reference `context.inputData.parent` literally, return `[]` when empty |
| API rejects `page=0` / `filter=`                        | Empty optionals sent                                                                                        | Drop empties in the request component                                  |
| Flow runs N times per event                             | `modifytriggerdata` returned an array unintentionally                                                       | Return an object for single events                                     |
| Polling trigger re-fires old items                      | No cursor                                                                                                   | Use `__findFromMemory`/`__updateInMemory`                              |
| Edit rejected "already published"                       | Editing a published version                                                                                 | Create a new version (9.4)                                             |
| Changed `authenticationpaths` has no effect             | Cached connection info                                                                                      | Re-test; create a new connection version if needed                     |

Then run the KB review (`knowledge-base/dh-review.md`, priorities P0 → P3) over every action and fix all P0
and P1 findings: every `context.inputData.<key>` exists as a field, no orphan fields, required guards,
generators handle "parent not selected" and zero results, no raw IDs typed where a dropdown is possible
(except DELETE), text casing and help wording.

When something is wrong: GET the row, fix only what is wrong, PUT it back, and read it back again.

---

## 12. Updating an existing plug

- Find the plug (`getAllPlugins`), its connections, actions, versions, components and mappings first.
- Edit **drafted** versions in place; for **published** ones create a new version (9.4).
- Changing a component affects every mapped version immediately (8.2) — prefer adding a new component.
- Never delete what you did not create unless the developer asks; soft-delete only (1.4).

## 13. Out of scope

Publishing plugs/actions/versions, verification, analytics, force-updating flows to new versions, and the
AI orchestration endpoints — unless the developer explicitly asks.

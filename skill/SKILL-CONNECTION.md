---
name: viasocket-developer-hub-connection
description: >-
  Create or update a connection (oauth_details) on the {{APP_NAME}} plug ({{PLUGIN_ID}}) in viaSocket
  Developer Hub. Validates the request, checks existing connection versions, then either modifies in place
  or duplicates into a new authversion and edits the duplicate. Never publishes the plug.
---

# viaSocket Developer Hub — connection for {{APP_NAME}}

You are adding or changing a **connection** (`oauth_details`) on an existing plug.

{{REQUEST}}

## Workspace

|                               |                                          |
| ----------------------------- | ---------------------------------------- |
| `org_id`                      | `{{ORG_ID}}`                             |
| Plug `PLUGIN_ID`              | `{{PLUGIN_ID}}`                          |
| App                           | {{APP_NAME}} (`{{APP_DOMAIN}}`)          |
| Preferred connection (if any) | `{{PREFERRED_AUTH_ID}}`                  |
| API base                      | `{{API_BASE}}/developers/{{ORG_ID}}`     |
| Auth header                   | `proxy_auth_token: {{PROXY_AUTH_TOKEN}}` |

Do not print the token, commit it, or send it anywhere except the API base.

---

## 0. Decision workflow (mandatory)

### 1. Validate the request

Confirm they want connection/auth work for this plug (API key, OAuth2, OAuth1, NoAuth, scopes, test API,
connection label, whitelist, `authenticationpaths`, etc.). Clarify only if the auth type is ambiguous.

### 2. Load the knowledge base

```bash
KB=https://raw.githubusercontent.com/RoystonSanctis/dh-planner-viasocket/refs/heads/dev
mkdir -p .dh-kb/knowledge-base
for f in \
  knowledge-base/dh-knowledgebase.md knowledge-base/dh-connection-practice.md \
  knowledge-base/dh-connection-schema.md knowledge-base/dh-review.md \
  dh-connection-agent.md; do
  curl -sfL "$KB/$f" -o ".dh-kb/$f" || echo "failed: $f"
done
```

Raw: `https://raw.githubusercontent.com/RoystonSanctis/dh-planner-viasocket/refs/heads/dev/<path>`.

### 3. List existing connections on this plug

```bash
node dh.mjs GET 'get/oauth_details?identifier={{PLUGIN_ID}}&filter=getAuthDetails'
```

| Result          | What you do                                                                                                                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **None**        | **Create new** from scratch (Section A).                                                                                                                                                                                  |
| **One or more** | Summarise them (`authversion`, `type`, `rowid`) and **ask**: _"A connection already exists. Do you want to **modify** the current one in place, or **create new** (duplicate into a new version, then change the copy)?"_ |

### 4. Branch

| User said      | Behaviour                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| **modify**     | Section B — `PUT update/oauth_details` on the chosen `AUTH_ID` (in place)                            |
| **create new** | Section C — duplicate current connection → `POST create/oauth_details` → then modify the **new** row |

Default if they name a brand-new auth type that does not exist yet: create new (Section A or C).

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

Before POST/PUT, **JSON.stringify** these keys when they are objects: `testcode`, `accesstokencode`,
`refreshtokencode`, `revokeapicode`, `queryparams` (shape `{"source":"<js>"}` for code fields).

Never publish the plug. After changing `authenticationpaths` or whitelist, `PUT` the plug once so auth
caches clear.

---

## A. Create first connection (none exist)

Crawl `{{APP_DOMAIN}}` auth docs. Choose `Basic` \| `Auth2.0` \| `Auth1` \| `NoAuth`.

```json
POST create/oauth_details
{
  "pluginrecordid": "{{PLUGIN_ID}}",
  "authversion": "V1",
  "type": "Basic",
  "authfields": {
    "authentication": {
      "type": "basic",
      "fields": [
        { "key": "api_key", "label": "API Key", "type": "password", "required": true, "help": "…" }
      ]
    }
  },
  "authenticationpaths": {
    "headers": [{ "name": "Authorization", "value": "return `Bearer ${context.authData.api_key}`" }],
    "queryParams": [],
    "body": []
  },
  "whitelistdomains": ["{{APP_DOMAIN}}", "api.{{APP_DOMAIN}}"],
  "connectionlabelkey": "email",
  "connectionlabelvalue": "context.authData.testcode.email",
  "isconnectionlabelmasked": false,
  "testcode": "{\"source\":\"…axios get me… return response.data\"}",
  "queryparams": "{}",
  "accesstokencode": "{\"source\":null}",
  "refreshtokencode": "{\"source\":null}",
  "revokeapicode": "{\"source\":null}",
  "metadata": {
    "aiLogs": [{ "by": "CREATED_BY_CLAUDE", "time": "<ISO>", "skill": "viasocket-developer-hub-connection" }]
  }
}
```

Save `AUTH_ID`. Then:

```json
PUT update/plugins?identifier={{PLUGIN_ID}}&filter=updatePluginDetails
{ "preferedauthversion": "AUTH_ID", "whitelistdomains": ["{{APP_DOMAIN}}", "api.{{APP_DOMAIN}}"] }
```

OAuth2: set `granttype`, `clientid`/`clientsecret` (ask developer), `authrequrl`, `redirecturl`
(`https://auth.viasocket.com/redirect/auth2.0`), stringified `accesstokencode` / `refreshtokencode` /
`testcode` per KB. See connection-practice + connection-schema.

---

## B. Modify existing connection (in place)

User chose **modify**. Target `AUTH_ID` = preferred or the version they named.

```json
PUT update/oauth_details?identifier=AUTH_ID&filter=updateAuthDetails
{
  "authenticationpaths": { … },
  "testcode": "{\"source\":\"…\"}",
  "whitelistdomains": ["…"],
  "connectionlabelkey": "…",
  "connectionlabelvalue": "…",
  "authfields": { … }
}
```

- Update only fields required by the request.
- Do **not** create a new `authversion` on this path.
- Then touch the plug (`preferedauthversion` or whitelist) so VM auth cache clears.
- Provenance: merge `UPDATED_BY_CLAUDE` into plugin/connection history where the API allows; connection
  update history is server-managed on `metadata.save`.

---

## C. Create new = duplicate then modify the copy

User chose **create new** while connections already exist. Mirror the DH UI "create new version":

1. Load source connection (`{{PREFERRED_AUTH_ID}}` or the one they pick).
2. `POST create/oauth_details` with a **copy** of its fields (drop `rowid`), set:

```json
{
  "...copied fields...",
  "pluginrecordid": "{{PLUGIN_ID}}",
  "metadata": {
    "duplicatedfrom": { "rowid": "<source AUTH_ID>", "authversion": "<source Vn>" },
    "aiLogs": [{ "by": "CREATED_BY_CLAUDE", "time": "<ISO>", "skill": "viasocket-developer-hub-connection" }]
  }
}
```

Server / UI assigns next `authversion` (`V2`, …). Save new `AUTH_ID`.

3. **Then** apply the developer's changes with Section B `PUT` on the **new** `AUTH_ID` only.
4. Optionally set `preferedauthversion` to the new id if they want it default.
5. Report: source left unchanged; new connection id + authversion.

**Forbidden:** inventing a blank second connection when "create new" was chosen and a good source
exists — always duplicate first so credentials/paths carry over, then edit.

---

## Credentials & runtime (must get right)

- With `authenticationpaths`, the VM **masks** secrets in action code; real values inject only via those
  paths (and URL `${context.authData.x}` placeholders). Always set `authenticationpaths`; never teach
  actions to build `Authorization` by concatenating masked values.
- `testcode` / token exchange run with **real** `context.authData` and plain `axios`.
- `connectionlabelkey` + `connectionlabelvalue` are required or create fails with empty label.
- Whitelist every API host.

---

## Done checklist

- [ ] Request validated
- [ ] Existing connections listed; user chose modify vs create new when needed
- [ ] Modify → in-place PUT only; create new (with existing) → duplicate then PUT on copy
- [ ] `authenticationpaths`, whitelist, label, testcode correct
- [ ] Plug preferred auth / whitelist updated if needed
- [ ] Plug not published
- [ ] Developer told which `AUTH_ID` / `authversion` to open

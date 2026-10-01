---
title: "DH Connection Knowledge Base (Consolidated)"
description: "Token-minimal knowledge base for designing and updating viaSocket plug connections. Reason top-down; infer specifics from context."
---

# Page Index

- Universal Connection Rules
- Variable & Alias Reference
- Selection & Priority Strategy
- Connection Types & UX Flows
  - Basic Auth
  - OAuth 2.0 Authorization Code
  - OAuth 2.0 Client Credentials
  - OAuth 2.0 Implicit
  - OAuth 2.0 Password Credentials
  - OAuth 1.0
  - No Auth
- Client Credentials Setup Modes
- Naming & Copywriting
  - Connection Labels
  - Credential Fields
- Code Runtime & Skeletons
  - Environment & Globals
  - Code Style
  - Standard Function Template
  - Newline Escaping
  - Token Handlers (Access, Refresh, Revoke)
  - Test (Me) Code
  - Request Parameter Injection
- Database & Payload Schemas
  - Create Payload
  - Common Fields
  - Update Payloads & Discriminators
  - Connection Response Reference
- Connection Safety & Longevity
- Developer Hub (DH) Connection URLs
- Validation Checklist

---

# Universal Connection Rules
*Invariants for every connection. Details live in the sections referenced.*

1. **Docs = Ground Truth**: Never invent endpoints, grant types, scopes, or `context.authData` keys. Undocumented/ambiguous endpoint → state the limitation; never assume a standard OAuth shape. Every documented auth requirement is represented in the UX or handled in code.
2. **Strongest Supported Method**: Follow Selection & Priority Strategy; never downgrade security for convenience.
3. **Backend Auth Injection**: Credentials reach every Action/Trigger call only via `authenticationpaths` (headers, body, queryParams). Actions/Triggers never add or hardcode auth; they read only non-secret config (subdomain, region, tenant ID) via `context?.authData?.<field_key>`.
4. **Secrets**: API keys, client/consumer/token secrets, and passwords → `password` fields; never hardcoded, logged, defaulted, or shown in labels/previews/errors (mask labels that expose sensitive data).
5. **Minimal Scopes & Minimal Trust**: Connection-level scopes MUST cover ONLY the Test (Me) API and minimal scopes required for connection establishment, passed via the `scope` key inside the `queryparams` JSON string (e.g. `queryparams: "{\"response_type\":\"code\",\"scope\":\"user.read\"}"`). Do NOT add all scopes or action/trigger-specific scopes at the connection level. Action- and trigger-specific scopes belong strictly in the individual Action or Trigger payloads in `dh-database-schema.md` via the `scopes` key. Add only the fields and sections the chosen flow requires.
6. **Payload Types & Schema Strictness (CRITICAL)**:
   - **Create:** Send ALL keys. `authenticationpaths` MUST contain `headers`, `body`, and `queryParams` arrays (use `[]` if empty).
   - **Update:** Send ONLY updated keys + `rowid` (from `connection_version_id`) + `pluginrecordid` (from `pluginId`). If updating `authenticationpaths`, include all 3 keys; otherwise omit `authenticationpaths` entirely.
   - `queryparams`: always a stringified JSON string (`"{}"`, `"{\"response_type\":\"code\"}"`), never an object; static params only.
   - Code fields (`testcode`, `accesstokencode`, `refreshtokencode`, `revokeapicode`): stringified JSON `{"source": ...}` (`"{\"source\":null}"` when unused); never raw JS.
   - `authfields.authentication.fields`: MUST ALWAYS be an array (`[]` if empty).
   - `authenticationpaths`: all 3 keys (`headers`, `body`, `queryParams`; `[]` if empty) on create, and on update whenever it is sent; omit entirely if unchanged.
   - **Null Constraints:** `type`, `granttype`, and `scopeseperatedby` CANNOT be `""`. Use `null`.
   - **Scope Separator Rule (`scopeseperatedby`):** STRICTLY use `"space"` or `"comma"` (literal word strings) or `null`. NEVER use a literal space character `" "` or comma character `","` (WRONG: `"scopeseperatedby": " "`, CORRECT: `"scopeseperatedby": "space"` or `"scopeseperatedby": "comma"`).
7. **Updates**: Send only changed keys + `rowid` (from `connection_version_id`) + `pluginrecordid` (from `pluginId`). Never send `connection_version_id` inside `request_payload`; never leak UI state (`draftMark`) or DB copies (`authenticationpaths_copy`).
8. **Test API**: Exactly one lightweight authenticated endpoint (`"testcode": "{\"source\":\"...\"}"`, use `{"source":null}` if empty); returns `response.data` unmodified without mutation or synthetic wrappers (see Test (Me) Code).
9. **Whitelist**: `whitelistdomains` includes both the service domain and the API base domain (`["notion.com", "api.notion.com"]`), even for No Auth.
10. **Internal IDs & Trust**: Never ask users for internal IDs (`pluginRecordId`, `connectionId`, `pluginId`, `connection_version_id`, `preferedauthversion`, `orgId`) or other internal system IDs the Test API or context can supply.
11. **Execution Limit**: Exactly 1 connection operation per execution.
12. **Mandatory Optional Chaining (`?.`) in Code Paths**: Optional chaining (`?.`) is strictly required in EVERY property access path inside connection code blocks, templates, and label expressions (e.g., `context?.authData?.<key>`, `response?.data`, `context?.authData?.testcode?.['key']`). Without optional chaining, if an intermediate key is not present while running the code, accessing properties directly will throw an unexpected runtime error (`TypeError: Cannot read properties of undefined`). Reviewers MUST flag if optional chaining is missing (e.g., `const formResponseData = body.form_response; formResponseData.definition?.fields`).

---

# Variable & Alias Reference

| Runtime Variable | Payload Field | Lives On | Notes |
|---|---|---|---|
| `pluginId` | `pluginrecordid` | Plugin & all connection payloads | Same value, different name |
| `connection_version_id` / `functionId` | `rowid` | Connection version | Version being updated |
| `orgId` | `orgid` | Connection record | Auto-injected |
| `preferedauthversion` | `preferedauthversion` | Plugin record | Preferred version rowid; `""` = none |
| `threadId` | — | Metadata only | Never in connection payloads |

---

# Selection & Priority Strategy
**Analyze & verify first**: Verify available auth methods directly from the provider's official API documentation (OpenAPI, developer guides, auth specs). Note grant types; authorization, token, refresh, revoke, and Test endpoints; token lifecycle (expiry, refresh issued, rotation); minimal scopes; stable identifiers; encoding needs (Base64 client credentials, `application/x-www-form-urlencoded` vs JSON).

**Mandatory Selection Priority (OAuth 2.0 First)**:
In the connection setup, the authentication selection MUST strictly be **OAuth 2.0 (`Auth2.0`) first**, followed by other authentication methods only if OAuth 2.0 is verified as not supported in the API documentation:
1. **OAuth 2.0 Authorization Code**: Primary & default choice for public SaaS with real end-users. PKCE (`S256`) when supported. Confirm the grant is documented.
2. **OAuth 2.0 Client Credentials**: Primary choice for app-only, server-to-server integrations with no end-user identity and no user-scoped data.
3. **Basic Auth**: Static API key, bearer token, or username/password. Select only if OAuth 2.0 is verified as not supported in the API docs.
4. **OAuth 1.0**: Legacy request signing. Select only if OAuth 2.0 and Basic Auth are not supported.
5. **No Auth**: Genuinely public, non-sensitive APIs.
6. Nothing documented → ask the user for the auth type and official API documentation.

- **Implicit / Password Credentials**: deprecated; only when the provider supports nothing else—state the trade-off.
- One viable method → implement directly, no selector.

---

# Connection Types & UX Flows

| Type (`type`) | Grant Type (`granttype`) | Steps | Characteristics |
|---|---|---|---|
| **Basic** | `null` | 6 | API key / user+pass injected via request parameters |
| **Auth2.0** | `Authorization Code` | 13 | Redirect, consent, token exchange, refresh, revoke, PKCE |
| **Auth2.0** | `Client Credentials` | 10 | App-only; no redirect/consent; refresh = re-request |
| **Auth2.0** | `Implicit` | 12 | Legacy; token in redirect, no exchange |
| **Auth2.0** | `Password Credentials` | 10 | Legacy; username + password exchanged for tokens |
| **Auth1** | `null` | 9 | Consumer key/secret; built-in 3-legged exchange; signed requests |
| **NoAuth** | `null` | 2 | Whitelist + optional static request parameters |

Render only the sections the flow needs (no Redirect/App Credentials/Authorization Endpoint for Client or Password Credentials; no Access Token API for Implicit; OAuth 1.0 uses its endpoint config instead).

## Basic Auth
- **Flow (6)**: Configure Fields → Test (Me) API → Connection Label → Icon → Whitelist Domains → Set Request Parameters.
- **Fields**: `string` (username, account ID), `password` (API key, secret, token, password). `key` matches the API parameter name.
- **Injection**: request parameters reference `context.authData.<key>`; build composite values (e.g. Base64 `user:pass`) inside the function—never ask users to pre-format.
- **Payload**: no `granttype`, token codes or token codes.

## OAuth 2.0 Authorization Code
- **Flow (13)**: Pre-auth Fields? (subdomain, region, tenant) → Copy Redirect URL → App Credentials (see Client Credentials Setup Modes) → Authorization Endpoint (`authrequrl`, scopes, `response_type=code`, PKCE, provider params like `access_type=offline`, `prompt=consent`, `audience`) → Access Token API → Refresh Token API → Revoke Token API → Test (Me) API (Bearer) → Connection Label → Icon → Whitelist Domains → Set Request Parameters (Bearer header).
- **Redirect URL in Auth 2.0 App**:
  - **Prod**: `https://auth.viasocket.com/redirect/auth2.0`
  - **Dev**: `https://dev-auth.viasocket.com/redirect/auth2.0`
  - **Local**: `http://localhost:3000/redirect/auth2.0`
- **Rules**: Minimal scopes in `queryparams.scope` (strictly those required for the Test/Me API or baseline connection); action/trigger-specific scopes belong on individual actions/triggers in `dh-database-schema.md` via the `scopes` key; `scopeseperatedby` strictly `"space"`, `"comma"`, or `null` (never `" "` / `","`); verify Base64/content-type needs for the token call. `authenticationpaths.headers` must inject the Bearer token (empty `headers` → every request 401s).

## OAuth 2.0 Client Credentials
- **Flow (10)**: Fields? → Access Token API (`grant_type=client_credentials`, `scope`; usually no refresh token) → Refresh Token API (re-request with same credentials) → Revoke Token API (token + client credentials) → Test (Me) API (`/me`, `/account`, else `/status`, `/ping`) → Connection Label → Icon → Whitelist Domains → Set Request Parameters (Bearer).
- **Rules**: Client ID/Secret collected as `authfields` (keys `clientid`, `clientsecret`); no root `clientid`/`clientsecret` in its payload. Label from app, workspace, or tenant ID—never user identity. Secret stays in perform code only. Bearer injection required.

## OAuth 2.0 Implicit
- **Flow (12)**: Authorization Code flow minus Access Token API; Refresh Token API rarely available.
- **Rules**: Flag as legacy. Token captured from redirect at `context?.authData?.access_token`; `accesstokencode`/`refreshtokencode` source `null`. Root `clientid` set, `clientsecret` `null`. Flag insecure browser-storage risk.

## OAuth 2.0 Password Credentials
- **Flow (10)**: Fields (`username` string, `password` password; both required) → Access Token API (`grant_type=password`, client ID/secret, username, password) → Refresh Token API (`grant_type=refresh_token`) → Revoke → Test (Me) API → Label → Icon → Whitelist → Set Request Parameters.
- **Rules**: Flag deprecation. Never log or persist the raw password beyond the token call. Root `clientid` + `clientsecret`. Only engine using `authversion: "V2"`.

## OAuth 1.0
- **Flow (9)**: App Credentials (Consumer Key/Secret → root `clientid`/`clientsecret`) → Copy Redirect URL (`https://auth.viasocket.com/redirect/auth1`) → OAuth1 Endpoint (`auth1parameters`: `requestTokenUrl`, `authorizeUrl`, `accessTokenUrl`, `signatureMethod`) → Test (Me) API (signed) → Label → Icon → Whitelist → Set Request Parameters (signing).
- **Rules**: Built-in Authorize runs the 3-legged exchange and stores tokens at `context.authData.accesstokencode` (`oauth_token`, `oauth_token_secret`)—**never write `accesstokencode`**. Revoke usually omitted (no standard). Sign every request: method + URL + params + consumer secret + token secret → hash per `signatureMethod` → `oauth_signature`, with fresh nonce and timestamp. `HMAC-SHA1` most common; `HMAC-SHA256` supported; `RSA-SHA1` needs a private key; `PLAINTEXT` only over HTTPS when required. Define the signer once as a reusable component (`generateOAuth1Signature`); document provider signing quirks.

## No Auth
- **Flow (2)**: Whitelist Domains → Set Request Parameters? (static headers, e.g. `Content-Type: application/json`).
- **Rules**: Verify in docs that the API is truly public (a keyless response isn't proof); never for user-specific or private data. No fields, token, or test code. Note abuse/rate-limit exposure.

---

# Client Credentials Setup Modes
*OAuth 2.0 Authorization Code: `clientid` and `clientsecret` are dedicated root keys on the connection.*

- **Global / Internal (Default, Recommended)**: Root `clientid`/`clientsecret` hold the values (entered later in viaSocket). `authfields.authentication.fields` contains no `clientid`, `clientsecret`, or `redirectUrl`.
- **Manual / User-Provided (only when requested)**: Root `clientid`/`clientsecret` = `null`; `authfields.authentication.fields` MUST include:
  - `{"key": "clientid", "type": "string", "label": "Client Id", "placeholder": "Enter Client id", "required": true, "disableField": true}` (never `client_id`)
  - `{"key": "clientsecret", "type": "string", "label": "Client Secret", "placeholder": "Enter Client Secret", "required": true, "disableField": true}` (never `client_secret`)
  - `{"key": "redirectUrl", "value": "https://auth.viasocket.com/redirect/auth2.0"}` (**mandatory**; omission invalidates and disables the credential fields; Prod: `https://auth.viasocket.com/redirect/auth2.0`, Dev: `https://dev-auth.viasocket.com/redirect/auth2.0`, Local: `http://localhost:3000/redirect/auth2.0`)
- Token code reads both modes the same way: `context?.authData?.clientid`, `context?.authData?.clientsecret`.

---

# Naming & Copywriting

## Connection Labels
Identifies each saved account (`"John – Production API"`, `"Acme (US)"`, masked `"XXX-XXX-23433"`); never a static generic string (`"My App Connection"`).
- **Source**: the Test (Me) response stored at `context.authData?.testcode` (or an auth field). You MUST verify and know the Test API response structure (`context.authData?.testcode`) to accurately map identifier keys into `connectionlabelvalue` (and `_connectionlabelvalue`). Never guess property paths.
  - User-scoped flows: name, email, workspace.
  - App-scoped (Client Credentials): app, workspace, or tenant ID.
  - No user-identifiable field → stable non-sensitive ID (account/workspace).
- **Key Paths Structure & Formats (Applicable Across All Key Paths)**:
  Two formats are supported for accessing values across all key paths structures (`connectionlabelvalue`, `_connectionlabelvalue`, `iconurlpath`, `authenticationpaths`, etc.):
  1. `${context.authData?.testcode?.name}` (raw JS: `context.authData?.testcode?.name`) — **Preferred format**.
  2. `${context?.authData?.testcode?.["name"]}` (raw JS: `context?.authData?.testcode?.["name"]`) — Bracket notation; fits well when there are special characters or spaces in the keys (e.g., `${context?.authData?.testcode?.["workspace-name"]}`).
  *Rule: Prefer the first format; the second format fits well when there are special characters or spaces in the keys.*
- **`connectionlabelvalue`**: one direct JS path starting with `context.authData?.` (or `context?.authData?`). Prefer dot notation (`context.authData?.testcode?.name` or `context.authData?.testcode?.user?.email`). Use bracket notation (`context?.authData?.testcode?.["key with-space"]`) when keys contain special characters or spaces. No `return`, function wrapper, or `||` fallback—pick the single most reliable key. Invalid: `context?.res?.data?.*` (`res` is local to `testcode`).
- **`_connectionlabelvalue`**: template version of `connectionlabelvalue`, e.g., `"${context.authData?.testcode?.name}"` (preferred) or `"${context?.authData?.testcode?.[\"key-with-space\"]}"` (when keys have special characters or spaces).
- **`connectionlabelkey`**: identifier type (`"workspace"`). `connectionlabelname`: reserved—omit or `null`.
- **`isconnectionlabelmasked: true`** when the label is sensitive.

## Credential Fields
- **`key`**: exact API parameter name (`api_key`, `subdomain`). Stable contract—never rename.
- **`label`**: Title Case, source-app terminology (`API Key`, `Workspace Subdomain`); no app-name prefix, protocol jargon, or internal key names.
- **`type`**: `password` for secrets; `string` for public values; `dropdown` only for small, stable, non-secret settings (Region, Environment) with options in `children: [{label, value, sample}]` or JS `source`; `help` for notes.
- **`help`**: one actionable sentence on where to find the value + Markdown link, noting sensitivity/expiry if relevant (`"Enter your API Key from Settings -> Developer -> API Key, or click [here](https://example.com/api-keys)."`). Business meaning, never storage mechanics (❌ `"Paste the value stored as context.authData.api_key."`).
- **Other keys**: `placeholder` (concrete example), `required`, `value` (default; only for optional non-sensitive fields, never credentials), `visibilityCondition` (JS over `context.authData`).
- **Order**: required credentials first, optional pre-auth context after; help below its field.
- **Update Safety**: keep compliant existing text unchanged.

---

# Code Runtime & Skeletons

## Environment & Globals
- **Libraries** (no `import`/`require`/`window`/`document`): `axios`, `fetch` (node-fetch), `FormData` (form-data), `Buffer`, `crypto`, `_` (lodash), `moment`, `jwt` (jsonwebtoken), `cheerio`, `XMLParser`, `XMLBuilder`, `XMLValidator`, `URLSearchParams`, `https`, `setTimeout`, `atob`.
- **Context Paths**:
  - Preferred access format is dot notation `${context.authData?.testcode?.name}` / `context.authData?.testcode?.name`; use bracket format `${context?.authData?.testcode?.["name"]}` / `context?.authData?.testcode?.["name"]` when keys contain special characters or spaces.
  - Auth code: `context.authData?.Authorization?.code` (or `context?.authData?.Authorization?.code`)
  - PKCE verifier: `context.authData?.code_verifier` (send as `code_verifier`)
  - Access token: `context.authData?.accesstokencode?.access_token`
  - Refresh token: `context.authData?.accesstokencode?.refresh_token`
  - Client credentials: `context.authData?.clientid`, `context.authData?.clientsecret`
  - Test response: `context.authData?.testcode`
  - User inputs: `context.authData?.<field_key>`
- **Real vs Placeholder Values**: connection code (`testcode`, token code) receives real `authData` values and sets its own headers. Plug code (Actions/Triggers) sees every `authData` value as a placeholder; real values reach only `authenticationpaths` entries and `${context.authData.<key>}` in the URL host/path, on calls to whitelisted hosts → whitelist every API host.
- **Scope**: code handles only tokens, signatures, and dispatch; business logic belongs to Actions/Triggers.

## Code Style
- **Clean, Multi-line JS**: All tool-call code payloads must be formatted as readable, multi-line JS.
- **Destructure Upfront**: E.g., `const { api_key } = context?.authData || {};`.
- **Payload Construction**: Build payloads via spread operators.
- **Central Cleanup**: `Object.fromEntries(Object.entries(raw).filter(...))`.
- **Minimize Intermediate Variables**: Credential extraction, request, call, and return as distinct blocks; avoid dense one-liners.

## Standard Function Template
Mandatory for every connection code block:
```javascript
async function <fnName>() {
  try {
    // API logic
    return response.data;
  } catch (error) {
    throw error;
  }
};
return await <fnName>();
```

## Newline Escaping
Escape levels = decode passes.
- **Double-encoded (2 levels → `\\n`):** `testcode`, `accesstokencode`, `refreshtokencode`, `revokeapicode` (because they are wrapped in `{"source":"..."}`).
  - ✅ `"{\"source\":\"async function testcode() {\\n  ...\\n}\\n\\nreturn await testcode();\"}"`
- **Plain string (1 level → `\n`):** `authenticationpaths.headers[].value`, `body[].value`, `queryParams[].value`, `connectionlabelvalue`, `_connectionlabelvalue`, `help`, `placeholder` (raw JS injected directly).
  - ✅ `"value": "function returnHeaders() {\n  return \`Bearer ${context?.authData?.accesstokencode?.access_token}\`;\n}\n\nreturn returnHeaders();"`
- **Self-check**: `JSON.parse(testcode).source` parses and spans multiple lines; no `authenticationpaths` value contains `\\n`. Build with `JSON.stringify(...)` instead of counting backslashes.

## Token Handlers (Access, Refresh, Revoke)
**Access Token (`accesstokencode`) — Authorization Code** (Password Credentials: `grant_type: 'password'` + `username`, `password`; Client Credentials: `grant_type: 'client_credentials'`, no `code`/`redirect_uri`/`code_verifier`)
```javascript
async function getAccessToken() {
  try {
    const response = await axios.post('https://oauth2.example.com/token', {
      code: context?.authData?.Authorization?.code,
      client_id: context?.authData?.clientid,
      client_secret: context?.authData?.clientsecret,
      redirect_uri: context?.authData?.redirecturl,
      code_verifier: context?.authData?.code_verifier,
      grant_type: 'authorization_code'
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
return await getAccessToken();
```

**Refresh Token (`refreshtokencode`)** (Client Credentials: re-run the access token request instead)
```javascript
async function refreshAccessToken() {
  try {
    const response = await axios.post('https://oauth2.example.com/token', {
      client_id: context?.authData?.clientid,
      client_secret: context?.authData?.clientsecret,
      refresh_token: context?.authData?.accesstokencode?.refresh_token,
      grant_type: 'refresh_token'
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
return await refreshAccessToken();
```

**Revoke Token (`revokeapicode`)**
```javascript
async function revokeToken() {
  try {
    const response = await axios.post(`https://oauth2.example.com/revoke?token=${context?.authData?.accesstokencode?.access_token}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
return await revokeToken();
```

## Test (Me) Code
- **Structure**: `"testcode": "{\"source\":\"...\"}"` (use `{"source":null}` if empty).
- **Single Request**: MUST contain **EXACTLY ONE** API request (prefer `GET /me`, `/user`, `/users/me`, `/account`, `/profile`, `/oauth2/v2/userinfo`; else `/workspaces`, `/teams`, `/status`, `/ping`). No secondary/quota endpoints. A successful authenticated response passes the test.
- **Direct Return**: MUST return `response.data` directly (`return response.data;`) without mutation or synthetic wrappers. Stored at `context.authData?.testcode` for label paths.
- **Test Response Knowledge**: You MUST verify and know the Test API response structure (`context.authData?.testcode`) to accurately map identifier keys into `connectionlabelvalue` (and `_connectionlabelvalue`). Never guess property paths.
- Validates token exchange, header injection, and scope sufficiency together.

**Basic / OAuth 2.0** (Basic: `${context.authData?.api_key}`)
```javascript
async function testcode() {
  try {
    const response = await axios.get('https://api.example.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${context.authData?.accesstokencode?.access_token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
return await testcode();
```

**OAuth 1.0 (Signed)**
```javascript
async function testcode() {
  try {
    const url = 'https://api.example.com/v1/me';
    const oauthParams = {
      oauth_consumer_key: context?.authData?.consumerkey,
      oauth_token: context?.authData?.accesstokencode?.oauth_token,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: Math.random().toString(36).substring(2),
      oauth_version: '1.0'
    };

    oauthParams.oauth_signature = generateOAuth1Signature('GET', url, oauthParams, context?.authData?.consumersecret, context?.authData?.accesstokencode?.oauth_token_secret);
    const authHeader = 'OAuth ' + Object.entries(oauthParams).map(([k, v]) => `${k}="${encodeURIComponent(v)}"`).join(', ');

    const response = await axios.get(url, { headers: { 'Authorization': authHeader } });
    return response.data;
  } catch (error) {
    throw error;
  }
};
return await testcode();
```

## Request Parameter Injection
`authenticationpaths` entries `{ name, value }`, where `value` is a JS expression/function resolving the latest credential on every call (never a cached or static value). Format matches the provider (`Bearer <token>`, `Basic <base64>`, `Api-Key <key>`, query param). OAuth redirect params (`response_type`, `client_id`, `redirect_uri`, `scope`, `state`) never go here—they belong in `authrequrl`/`queryparams`.
```javascript
// Header (OAuth 2.0 Bearer)
function returnHeaders() {
  return `Bearer ${context.authData?.accesstokencode?.access_token}`;
}
return returnHeaders();

// Header (API key)
function returnHeaders() {
  return `Api-Key ${context.authData?.api_key}`;
}
return returnHeaders();

// Query param
return context.authData?.api_key;
```

---

# Database & Payload Schemas

## Create Payload
DB-managed (`rowid`, timestamps, `createdby`, `metadata`) and plugin-display fields (`pluginname`, `pluginiconurl`, `domain`, `whitelistdomains`) are excluded—set whitelist and the rest via update.
- **Create Strictness**: Send ALL keys. `authenticationpaths` MUST contain `headers`, `body`, and `queryParams` arrays (use `[]` if empty).
- **Auth Fields**: `authfields.authentication.fields` MUST ALWAYS be an Array (use `[]` if empty).
- **Null Constraints**: `type`, `granttype`, and `scopeseperatedby` CANNOT be `""`. Use `null`.
- **Scope Separator Rule (`scopeseperatedby`)**: STRICTLY use `"space"` or `"comma"` (literal word strings) or `null`. NEVER use a literal space character `" "` or comma character `","` (WRONG: `"scopeseperatedby": " "`, CORRECT: `"scopeseperatedby": "space"` or `"scopeseperatedby": "comma"`).
```json
{
  "type": "Basic | Auth2.0 | Auth1 | NoAuth",
  "authversion": "V1 | V2",
  "granttype": "Authorization Code | Implicit | Client Credentials | Password Credentials | null",
  "pluginrecordid": "string",
  "redirecturl": "https://auth.viasocket.com/redirect/auth2.0 (Prod) | https://dev-auth.viasocket.com/redirect/auth2.0 (Dev) | http://localhost:3000/redirect/auth2.0 (Local) | https://auth.viasocket.com/redirect/auth1",
  "queryparams": "{}",
  "isconnectionlabelmasked": false,
  "authfields": {
    "authentication": {
      "type": "Basic | Auth2.0 | Auth1.0 | NoAuth",
      "fields": []
    }
  },
  "accesstokencode": "{\"source\":null}",
  "refreshtokencode": "{\"source\":null}",
  "revokeapicode": "{\"source\":null}",
  "testcode": "{\"source\":null}",
  "authenticationpaths": {
    "headers": [],
    "body": [],
    "queryParams": []
  }
}
```

## Common Fields
Plugin-level; allowed in create or update:
- `preferedauthversion`: rowid of the plugin's default connection version (`null`/`""` = none).
- `description`: optional description of the connection version.

## Update Payloads & Discriminators
Shape branches on `type` + `granttype`. Always `rowid` + `pluginrecordid` + changed keys only.
- **Update Strictness**: Send ONLY updated keys. If updating `authenticationpaths`, include all 3 keys (`headers`, `body`, `queryParams`); otherwise omit `authenticationpaths` entirely.
- **Null Constraints**: `type`, `granttype`, and `scopeseperatedby` CANNOT be `""`. Use `null`.

| Variant | `componentToRender` Options | Variant Keys |
|---|---|---|
| **Basic** | `authfields`, `testcode`, `connectionLabel`, `iconUrlPath`, `appeandHeaders` | No token codes  |
| **Auth Code** | + `auth2Credentials`, `authorizationEndPointConfiguration`, `accesstokencode`, `refreshtokencode`, `revokeapicode` | Root `clientid`/`clientsecret` (null in manual mode), `authrequrl`, `queryparams`, `scopeseperatedby` |
| **Client Credentials** | `authfields`, `accesstokencode`, `refreshtokencode`, `revokeapicode`, `testcode`, `connectionLabel`, `iconUrlPath`, `appeandHeaders` | Credentials in `authfields` (no root keys) |
| **Implicit** | Auth Code set minus `authorizationEndPointConfiguration` | Root `clientid`; `clientsecret: null` |
| **Password Credentials** | Same as Implicit | Root `clientid` + `clientsecret` |
| **OAuth 1.0** | `authfields`, `auth2Credentials`, `auth1Urls`, `testcode`, `connectionLabel`, `iconUrlPath`, `appeandHeaders` | Root `clientid`/`clientsecret` = consumer key/secret, `type`, `redirecturl`, `auth1parameters` |

**Full Update Shape** (include only what changes)
```json
{
  "rowid": "string (connection version rowid, e.g. 'rowg11bx64ap'; mandatory)",
  "pluginrecordid": "string (e.g. 'row8enarovp8')",
  "componentToRender": "string (see table)",
  "isScopeSeperatorChanged": false,
  "type": "Basic | Auth2.0 | Auth1 | NoAuth",
  "granttype": "Authorization Code | Implicit | Client Credentials | Password Credentials | null",
  "clientid": "string | null",
  "clientsecret": "string | null",
  "authrequrl": "string | null (supports context template interpolation)",
  "redirecturl": "string | null",
  "queryparams": "string (stringified JSON)",
  "scopeseperatedby": "comma | space | null",
  "authfields": {
    "authentication": {
      "type": "string",
      "fields": [
        {
          "key": "string",
          "label": "string",
          "type": "string | password | dropdown",
          "value": "",
          "help": "string",
          "placeholder": "string",
          "required": true,
          "visibilityCondition": "string (optional)",
          "source": "string (dropdown: JS returning options)",
          "children": [{ "label": "string", "value": "string", "sample": "string" }]
        }
      ]
    }
  },
  "auth1parameters": {
    "requestTokenUrl": "string",
    "authorizeUrl": "string",
    "accessTokenUrl": "string",
    "signatureMethod": "HMAC-SHA1 | HMAC-SHA256 | RSA-SHA1 | PLAINTEXT"
  },
  "accesstokencode": "{\"source\":\"...\"}",
  "refreshtokencode": "{\"source\":\"...\"}",
  "revokeapicode": "{\"source\":\"...\"}",
  "testcode": "{\"source\":\"...\"}",
  "connectionlabelkey": "string",
  "connectionlabelvalue": "context.authData?.testcode?.name",
  "_connectionlabelvalue": "${context.authData?.testcode?.name}",
  "isconnectionlabelmasked": false,
  "iconurlpath": "",
  "whitelistdomains": ["service.com", "api.service.com"],
  "isbuiltinplugin": false,
  "authenticationpaths": {
    "headers": [{ "name": "Authorization", "value": "..." }],
    "queryParams": [],
    "body": []
  },
  "skipwhitelistvalidation": null
}
```

## Connection Response Reference
Key fields returned by connection endpoints (others are DB-managed or always `null`):
- `pluginrecordid`, `pluginname`, `orgid`, `domain`.
- `type` / `granttype`: flow discriminators. `authversion`: `"V1"` | `"V2"`.
- `clientid` / `clientsecret`: root credentials (`clientsecret` encrypted when `isencrypted: "true"`).
- `authrequrl`, `redirecturl`, `queryparams`, `scopeseperatedby`, `auth1parameters`.
- `authfields`, `authenticationpaths`, `whitelistdomains`, `skipwhitelistvalidation` (true bypasses whitelist checks).
- `testcode`, `accesstokencode`, `refreshtokencode`, `revokeapicode`: stored scripts (`accesstokencode` source `null` for Basic, Auth1, Implicit; refresh/revoke `null` for Basic, Auth1).
- `connectionlabelkey`, `connectionlabelvalue`, `_connectionlabelvalue`, `isconnectionlabelmasked`.
- `iconurlpath` (path to extract verified connection icon from Test API; `""` or `null` = fallback to `pluginiconurl`; NOT service icon; only fill if Test API provides a verified connection icon), `metadata.save[]` (who, changed fields, time, `CREATE`/`UPDATE`).

---

# Connection Safety & Longevity
- **Refresh**: define whenever supported—true refresh-token exchange (Authorization Code, Password Credentials) or re-request (Client Credentials). Expired tokens must never silently fail Actions/Triggers.
- **Revoke**: define whenever supported for a clean disconnect.
- **Token Storage**: keep only what's needed (`access_token`, `refresh_token`, `expires_in`); never surface raw tokens or full test responses to users.
- **Connection Icon (`iconurlpath`)**: Path expression to extract the verified connection icon (e.g. user photo/avatar or workspace icon) from the Test API response. This is NOT the service icon (`pluginiconurl`). Only fill `iconurlpath` if the Test API returns a verified connection icon; otherwise leave it empty `""` (or `null`).
- **Scopes**: least privilege. Connection-level OAuth scopes are passed inside the `queryparams` object under the `scope` key (e.g. `queryparams: "{\"response_type\":\"code\",\"scope\":\"user.read\"}"`). Connection-level scopes MUST ONLY include the minimal scopes required for the Test (Me) API / connection establishment. Never add all available scopes or action-specific scopes to the connection. Specific scopes for actions and triggers belong strictly in the action/trigger payload in `dh-database-schema.md` via their own `scopes` key.
- **Redirect/Whitelist**: redirect/callback URIs match the provider exactly; account for multiple URLs (including post-login); tell users where in the provider portal to add the callback URL.
- **Backward Compatibility**: never rename/remove field keys or `context.authData` keys (breaks every Action/Trigger using them). Allowed: new optional fields, better labels/help, tightening the whitelist.
- **Trade-Offs**: choose the lowest long-term risk across user complexity, security posture, credential-leak risk, and maintainability. Final check: usable by a non-technical business owner, strongest supported method, secrets protected, stays valid across long-running automations, flow-specific constraints handled.

---

# Developer Hub (DH) Connection URLs
Dynamic URL to view and configure the connection in the Developer Hub.

- **Base URLs by Environment**:
  - Production (`prod`): `https://flow.viasocket.com/`
  - Testing (`testing`): `https://dev-flow.viasocket.com/`
  - Local (`local`): `http://localhost:3000/`
- **Connection URL Pattern**: `<baseUrl>developer/<orgId>/plugin/<pluginId>/auth/<connectionId>`

---

# Validation Checklist

- [ ] Strongest documented method selected; no invented endpoints, scopes, or `context.authData` keys.
- [ ] Code style: clean multi-line JS, destructure upfront (`context?.authData`), spread operators, `Object.fromEntries` cleanup, minimal intermediate variables.
- [ ] Create payload sends ALL keys; `authenticationpaths` includes `headers`, `body`, and `queryParams` (`[]` if empty); `authfields.authentication.fields` is an array.
- [ ] Update payload: `rowid` + `pluginrecordid` + changed keys only; no `connection_version_id` in `request_payload`; if updating `authenticationpaths`, all 3 keys included, else omitted entirely.
- [ ] Null Constraints: `type`, `granttype`, and `scopeseperatedby` CANNOT be `""` (use `null`).
- [ ] `queryparams` is a stringified JSON string; code fields are `{"source": ...}` strings (`"{\"source\":null}"` when empty).
- [ ] `authenticationpaths` injects credentials (Bearer for OAuth 2.0) dynamically; no OAuth redirect params.
- [ ] Client Credentials Setup Mode correct: global → root keys, nothing in `authfields`; manual → root `null`, `clientid`/`clientsecret`/`redirectUrl` in `authfields`.
- [ ] `scopeseperatedby` is strictly `"space"`, `"comma"`, or `null` (never `" "` or `","`); connection scopes are passed via the `scope` key in `queryparams` and strictly minimal for Test (Me) API (action/trigger scopes are placed on individual entities in `dh-database-schema.md`); PKCE enabled when supported.
- [ ] Test code: structure is `{"source": "..."}`; exactly one lightweight endpoint; returns `response.data` unmodified without synthetic wrappers.
- [ ] Test API response structure verified and known (`context.authData?.testcode`) before mapping label paths; never guess property paths.
- [ ] Label: single `context.authData?.` path from the verified test response (prefer dot format `context.authData?.testcode?.name`; use bracket format `context?.authData?.testcode?.["account name"]` for keys with special characters or spaces); no `return`, `||`, or `context?.res`; `_connectionlabelvalue` is `"${...}"`; masked if sensitive.
- [ ] Secrets use `password` fields and never appear in code, logs, labels, or defaults.
- [ ] Credential fields: exact API keys, Title Case source-app labels, actionable help with link.
- [ ] `whitelistdomains` has the service and API base domains.
- [ ] Newline escaping: `\\n` inside double-encoded `source` fields, `\n` in plain strings (headers, values, labels, help, placeholders).
- [ ] OAuth 1.0: no custom `accesstokencode`; every request signed with fresh nonce/timestamp.
- [ ] Refresh and revoke defined where supported; works in Test mode and real workflows.
- [ ] Trust: never ask users for internal IDs (`pluginRecordId`, `connectionId`, `pluginId`, `connection_version_id`, `preferedauthversion`, `orgId`).

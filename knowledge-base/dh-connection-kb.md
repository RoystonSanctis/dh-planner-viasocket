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
  - Standard Function Template
  - Token Handlers (Access, Refresh, Revoke)
  - Test (Me) Code
  - Request Parameter Injection
- Database & Payload Schemas
  - Create Payload
  - Common Fields
  - Update Payloads & Discriminators
  - Connection Response Reference
- Validation Checklist

# Universal Connection Rules
Stated once, applies everywhere:
- **`rowid` & `pluginrecordid` in Update Payloads (CRITICAL)**: In update payloads, always pass `rowid` (mapped from `connection_version_id`) and `pluginrecordid` (mapped from `pluginId`). NEVER send `connection_version_id` inside `request_payload`; the backend identifies the version to update strictly via `request_payload.rowid`.
- **Targeted Partial Updates**: Send only the updated keys along with `rowid` and `pluginrecordid`. Do NOT leak frontend UI state objects (e.g. `draftMark`) or internal DB copies (`authenticationpaths_copy`) into API payloads.
- **`queryparams` Stringified JSON Rule (CRITICAL)**: The `queryparams` property MUST ALWAYS be a String (stringified JSON, e.g. `"{\"response_type\":\"code\"}"` or `"{}"`). NEVER send a raw JSON object `{}` — doing so causes a fatal database schema type rejection.
- **`authenticationpaths` Structure & Usage vs OAuth Parameters**:
  - `authenticationpaths` is strictly for **injecting authentication credentials into outgoing Action/Trigger API calls** (e.g. injecting `Authorization: Bearer ${context?.authData?.accesstokencode?.access_token}` in `headers`).
  - It MUST NOT contain OAuth authorization redirect parameters (`response_type`, `client_id`, `redirect_uri`, `scope`, `state`). OAuth redirect parameters belong in `authrequrl` or `queryparams`, NOT in `authenticationpaths`.
  - For OAuth 2.0 (Authorization Code & Client Credentials), `authenticationpaths.headers` MUST inject the Bearer token. Leaving `headers: []` will cause all subsequent action/trigger requests to fail with 401 Unauthorized.
  - Create: Must contain all 3 keys: `headers: []`, `body: []`, `queryParams: []`.
  - Update: If updating `authenticationpaths`, include all 3 keys (`[]` if empty); if unchanged, omit `authenticationpaths` entirely.
- **Backend Auth Injection**: All credentials inject into API calls via `authenticationpaths` (headers, body, queryParams). Actions and triggers NEVER expose or hardcode auth credentials. Non-confidential config (subdomain, region, tenant ID) is read via `context?.authData?.<field_key>`.
- **Single Test API Endpoint**: `testcode` MUST call **exactly ONE** lightweight authenticated endpoint (`GET /me`, `/user`, `/account`, or `/workspaces`). Secondary endpoints, quota checks, and session probes are strictly forbidden. Must return `response.data` directly without mutation.
- **`testcode` Structure**: Stringified JSON wrapping a `"source"` key (`"{\"source\":\"...\"}"` or `"{\"source\":null}"`). Raw JS code directly on `testcode` is invalid.
- **Connection Label Constraints**:
  - Prefix MUST be `context?.authData?`.
  - Must resolve to a single path from test response (e.g., `context?.authData?.testcode?.["workspace_name"]`).
  - Bracket notation required for keys (`["key"]`).
  - Direct JS expression ONLY: **NO `return` statements**, NO function wrappers, and **NO `||` or fallback chaining**.
  - `_connectionlabelvalue` MUST be the template string version: `"${context?.authData?.testcode?.[\"workspace_name\"]}"` (never a code copy or raw return string).
  - `connectionlabelname`: Reserved DB field; always omit or set to `null`.
  - **Invalid**: `context?.res?.data?.*` (`res` is local to testcode function scope and undefined at resolution time).
- **`uniquekeytostoreauth` Structure**:
  - `uniqueKey` must be a valid JS expression evaluating to a unique identifier (e.g. `context?.authData?.testcode?.["id"]`, `context?.authData?.testcode?.["sub"]`, or `context?.authData?.clientid`).
  - `_uniqueKey` MUST be the templated version: `"${context?.authData?.testcode?.[\"id\"]}"`.
  - Never use raw un-templated string literals like `"refresh_token"`.
- **OAuth 2.0 Client Credentials & Dedicated Keys**:
  - In OAuth 2.0 (Authorization Code), `clientid` and `clientsecret` exist as dedicated root-level keys on the connection object.
  - In Global / Internal Setup (default), this uses the existing dedicated keys present on the connection record which the user enters manually later. Do NOT create fields for `clientid` and `clientsecret` in `authfields.authentication.fields`. Neither `clientid`, `clientsecret`, nor `redirectUrl` are present in `authfields`.
  - Only if the user explicitly specifies a Manual / User-Provided Setup (as fields inside authfields) are `clientid`, `clientsecret`, and `redirectUrl` placed in `authfields.authentication.fields`.
- **Depth-Aware Newline Escaping**:
  - **Double-encoded (`\\n`)**: `testcode`, `accesstokencode`, `refreshtokencode`, `revokeapicode` (nested inside `"source"` string).
  - **Plain strings (`\n`)**: `authenticationpaths.*[].value`, `connectionlabelvalue`, `_connectionlabelvalue`, `uniquekeytostoreauth.*`, `help`, `placeholder`.
  - Rule: Escape levels must equal decode passes (2 levels for JSON-wrapped code, 1 level for direct strings).
- **High-Quality, Human-Readable & Optimized Code Style:** Write lean, purposeful, and highly readable JavaScript inspired by minimalist engineering principles: eliminate bloat, avoid redundant intermediate variables or wrapper gymnastics, and use native language features. Structure all code (`testcode`, `accesstokencode`, `refreshtokencode`, `revokeapicode`) with clean, consistent multi-line spacing and logical breathing room—clearly separating credential extraction, request construction, API invocation, and response return into distinct, easily scannable visual blocks. Never cram operations onto single dense lines or output minified, convoluted logic; prioritize clean formatting, clear naming, and robust simplicity that any human engineer can instantly inspect, maintain, and trust.
- **`authfields.authentication.fields`**: MUST ALWAYS be an Array (`[]` if no fields; never object or null).
- **Domain Whitelisting**: `whitelistdomains` MUST contain both the primary service domain and the API base domain (e.g. `["notion.com", "api.notion.com"]`).
- **Internal IDs**: Never ask users for internal IDs (`pluginrecordid`, `orgid`, `connection_version_id`, `preferedauthversion`).
- **Execution Limit**: Exactly 1 connection operation per execution.

# Variable & Alias Reference

| Prompt / Runtime Variable | Payload Field Name | Target Entity | Context / Notes |
|---|---|---|---|
| `pluginId` | `pluginrecordid` | Plugin / Connection | Foreign key to plugin record |
| `connection_version_id` / `functionId` | `rowid` | Connection Version | ID of version being updated |
| `orgId` | `orgid` | Connection Record | Owning organization ID |
| `preferedauthversion` | `preferedauthversion` | Plugin Record | Preferred version rowid (empty string if none) |

# Selection & Priority Strategy
Evaluate in descending order when auth method is unspecified:
1. **OAuth 2.0 (Authorization Code)**: Default for public SaaS with real end-users. Use PKCE (`S256`) when supported.
2. **OAuth 2.0 (Client Credentials)**: Server-to-server, machine-to-machine, background automations. No end-user identity.
3. **Basic Auth**: Static API keys, bearer tokens, or username/password pairs.
4. **OAuth 1.0**: Legacy request-signing APIs (`HMAC-SHA1`).
5. **No Auth**: Genuinely public APIs requiring zero credentials.
- *Deprecated / Avoid*: **Implicit** (frontend-only, no token exchange) and **Password Credentials** (raw username/password exchange). Implement only if provider exclusively supports them.

# Connection Types & UX Flows

| Type (`type`) | Grant Type (`granttype`) | Steps | Characteristics |
|---|---|---|---|
| **Basic** | `null` | 6 | API Key / User+Pass. Credentials injected via request parameters. |
| **Auth2.0** | `Authorization Code` | 13 | Redirect URL, Auth URL, Token Exchange, Refresh, Revoke, PKCE. |
| **Auth2.0** | `Client Credentials` | 10 | Machine-to-machine. No redirect or user consent. Re-request token pattern. |
| **Auth2.0** | `Implicit` | 12 | Legacy. Token received directly from redirect URL; no token exchange step. |
| **Auth2.0** | `Password Credentials` | 10 | Legacy. Direct username + password exchange for tokens. |
| **Auth1** | `null` | 9 | Consumer Key/Secret + 3-legged URLs. Built-in Authorize exchange; signed requests. |
| **NoAuth** | `null` | 2 | Domain whitelist + optional static request parameters only. |

## Basic Auth
- **Flow (6 Steps)**: 1. Configure Fields (`api_key`, `username`, `password`) → 2. Test (Me) API (`GET /me`) → 3. Connection Label → 4. Icon → 5. Whitelist Domains → 6. Set Request Parameters (inject header/param).
- **Fields**: `string` (account ID/username), `password` (API key/secret/token).
- **Injection**: Dynamically references `context.authData.<key>`. Never hardcode static tokens.

## OAuth 2.0 Authorization Code
- **Flow (13 Steps)**: 1. Pre-auth Fields (optional: subdomain, region) → 2. Copy Redirect URL (`https://auth.viasocket.com/redirect/auth2.0`) → 3. App Credentials (`clientid`, `clientsecret`) → 4. Auth Endpoint (`response_type=code`, scopes, PKCE) → 5. Access Token API (`POST` code for token) → 6. Refresh Token API (`POST` refresh_token) → 7. Revoke Token API (`POST` revoke) → 8. Test (Me) API (`GET /me` with Bearer token) → 9. Connection Label → 10. Icon → 11. Whitelist Domains → 12. Unique Identifier (e.g. `user_id`, `account_id`) → 13. Set Request Parameters (inject Bearer header).
- **Rules**: Request minimal scopes at connection level. Always enable PKCE (`code_challenge_method=S256`) when supported. Set `scopeseperatedby` strictly to `"space"` or `"comma"` (or `null`); NEVER use literal `" "` or `","` (WRONG: `"scopeseperatedby": " "`, CORRECT: `"scopeseperatedby": "space"` or `"comma"`).

## OAuth 2.0 Client Credentials
- **Flow (10 Steps)**: 1. Pre-auth Fields (rare) → 2. Access Token API (`POST` with `grant_type=client_credentials`) → 3. Refresh Token API (re-request token) → 4. Revoke Token API → 5. Test (Me) API (system status or account endpoint) → 6. Connection Label (workspace/tenant ID, not user name) → 7. Icon → 8. Whitelist Domains → 9. Unique Identifier → 10. Set Request Parameters.
- **Rules**: Never expose client secret in frontend. Do not build user-identity connection labels.

## OAuth 2.0 Implicit
- **Flow (12 Steps)**: Identical to Authorization Code minus Access Token API (token returned directly in redirect URL).
- **Rules**: Flag as legacy. No refresh token expected.

## OAuth 2.0 Password Credentials
- **Flow (10 Steps)**: 1. Configure Fields (`username`, `password`) → 2. Access Token API (`POST` credentials) → 3. Refresh Token API → 4. Revoke Token API → 5. Test (Me) API → 6. Connection Label → 7. Icon → 8. Whitelist Domains → 9. Unique Identifier → 10. Set Request Parameters.
- **Rules**: Flag deprecation. Never log raw passwords. `password` field type mandatory.

## OAuth 1.0
- **Flow (9 Steps)**: 1. App Credentials (`Consumer Key`, `Consumer Secret`) → 2. Copy Redirect URL (`https://auth.viasocket.com/redirect/auth1`) → 3. Configure OAuth1 Endpoint (`requestTokenUrl`, `authorizeUrl`, `accessTokenUrl`, `signatureMethod`) → 4. Test (Me) API (signed request) → 5. Connection Label → 6. Icon → 7. Whitelist Domains → 8. Unique Identifier → 9. Set Request Parameters (signed request).
- **Rules**: Built-in Authorize handles token exchange automatically — **NO custom `accesstokencode`**. Test API and Request Parameters must generate cryptographic signature per `signatureMethod` (`HMAC-SHA1`, `RSA-SHA1`, `PLAINTEXT`) with fresh nonce and timestamp.

## No Auth
- **Flow (2 Steps)**: 1. Whitelist Domains → 2. Set Request Parameters (static headers like `Content-Type: application/json`).
- **Rules**: Strictly verify API is public. Still enforce domain whitelisting.

# Client Credentials Setup Modes

- **OAuth 2.0 Authorization Code Dedicated Keys**:
  - In OAuth 2.0 (Authorization Code), `clientid` and `clientsecret` exist as dedicated root-level keys on the connection object.
  - You do NOT need to create input fields for Client ID and Client Secret in `authfields` when using the default/global setup.
- **Global / Internal Setup (Default & Recommended)**:
  - This simply uses the existing dedicated keys present on the connection record (`clientid` and `clientsecret`); the user will enter them manually later in viaSocket.
  - Because existing dedicated keys are used, you do NOT need to create input fields for `clientid` and `clientsecret` inside `authfields.authentication.fields`.
  - Root properties `clientid` and `clientsecret` hold values.
  - `authfields.authentication.fields` does NOT contain `clientid`, `clientsecret`, or `redirectUrl`.
- **Manual / User-Provided Setup (Special Case)**:
  - Root `clientid` and `clientsecret` on connection record MUST be `null`.
  - `authfields.authentication.fields` MUST include:
    - `clientid`: `{"key": "clientid", "type": "string", "label": "Client Id", "placeholder": "Enter Client id", "required": true, "disableField": true}` (Strictly `"clientid"`, NOT `"client_id"`).
    - `clientsecret`: `{"key": "clientsecret", "type": "string", "label": "Client Secret", "placeholder": "Enter Client Secret", "required": true, "disableField": true}` (Strictly `"clientsecret"`, NOT `"client_secret"`).
    - `redirectUrl`: `{"key": "redirectUrl", "value": "https://auth.viasocket.com/redirect/auth2.0"}` (**MANDATORY**; omission disables user credential fields).
  - In `accesstokencode` and `refreshtokencode`, read values via `context?.authData?.clientid` and `context?.authData?.clientsecret`. Authorization code is read via `context?.authData?.Authorization?.code`.

# Naming & Copywriting

## Connection Labels
- Uniquely identifies connected accounts in UI (e.g., `"John - Production"`, `"Acme (US)"`).
- Must map to a single reliable path from Test API response:
  - User-scoped: Name, email, or user ID.
  - App-scoped (Client Credentials): App name, workspace ID, or tenant ID.
- Enable masking (`isconnectionlabelmasked: true`) if label exposes sensitive data.
- Example:
  - `connectionlabelkey`: `"workspace"`
  - `connectionlabelvalue`: `"context?.authData?.testcode?.[\"workspace_name\"]"`
  - `_connectionlabelvalue`: `"${context?.authData?.testcode?.[\"workspace_name\"]}"`

## Credential Fields
- `key`: Matches API parameter name exactly (`api_key`, `client_id`, `subdomain`).
- `label`: Clean, user-friendly Title Case (`API Key`, `Workspace Subdomain`). Never prefix with app name.
- `type`: `password` for sensitive credentials (API keys, secrets, tokens, passwords); `string` for public values; `dropdown` strictly for fixed non-secret settings (Region, Environment). Never use dropdowns for credentials.
- `help`: Actionable directions on where to find the credential + direct Markdown link `[here](url)`. Business-meaning focused; no storage jargon.

# Code Runtime & Skeletons

## Environment & Globals
Available in perform code without `import` or `require`:
`axios`, `fetch` (`node-fetch`), `FormData`, `Buffer`, `crypto`, `_` (`lodash`), `moment`, `jwt` (`jsonwebtoken`), `cheerio`, `XMLParser`, `XMLBuilder`, `XMLValidator`, `URLSearchParams`, `https`, `setTimeout`, `atob`.

## Standard Function Template
All connection perform code MUST use this async wrapper:
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

## Standard Context Paths
- Auth Code: `context?.authData?.Authorization?.code`
- PKCE Code Verifier: `context?.authData?.code_verifier`
- Access Token: `context?.authData?.accesstokencode?.access_token`
- Refresh Token: `context?.authData?.accesstokencode?.refresh_token`
- User Auth Inputs: `context?.authData?.<field_key>`

## Token Handlers (Access, Refresh, Revoke)

### Access Token API (`accesstokencode`) — Auth Code
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

### Access Token API (`accesstokencode`) — Client Credentials
```javascript
async function getAccessToken() {
  try {
    const response = await axios.post('https://auth.example.com/oauth/token', {
      client_id: context?.authData?.clientid,
      client_secret: context?.authData?.clientsecret,
      grant_type: 'client_credentials'
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
return await getAccessToken();
```

### Refresh Token API (`refreshtokencode`)
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

### Revoke Token API (`revokeapicode`)
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

## Test (Me) Code (`testcode`)

### Basic Auth Test
```javascript
async function testcode() {
  try {
    const response = await axios.get('https://api.example.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${context?.authData?.api_key}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
return await testcode();
```

### OAuth 2.0 Test
```javascript
async function testcode() {
  try {
    const response = await axios.get('https://api.example.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${context?.authData?.accesstokencode?.access_token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
return await testcode();
```

### OAuth 1.0 Signed Test
```javascript
async function testcode() {
  try {
    const oauthParams = {
      oauth_consumer_key: context?.authData?.consumerkey,
      oauth_token: context?.authData?.accesstokencode?.oauth_token,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: Math.random().toString(36).substring(2),
      oauth_version: '1.0'
    };
    oauthParams.oauth_signature = generateOAuth1Signature('GET', 'https://api.example.com/v1/me', oauthParams, context?.authData?.consumersecret, context?.authData?.accesstokencode?.oauth_token_secret);
    const authHeader = 'OAuth ' + Object.entries(oauthParams).map(([k, v]) => `${k}="${encodeURIComponent(v)}"`).join(', ');
    const response = await axios.get('https://api.example.com/v1/me', {
      headers: { 'Authorization': authHeader }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
return await testcode();
```

## Request Parameter Injection (`authenticationpaths`)
Dynamic JS expressions injecting credentials into every outgoing action/trigger call.

### Bearer Token Header
```javascript
function returnHeaders() {
  return `Bearer ${context?.authData?.accesstokencode?.access_token}`;
}
return returnHeaders();
```

### API Key Header
```javascript
function returnHeaders() {
  return `Api-Key ${context?.authData?.api_key}`;
}
return returnHeaders();
```

### Query Parameter Injection
```javascript
return context?.authData?.api_key;
```

# Database & Payload Schemas

## Create Payload
Minimal payload sent to create a new Connection record:
```json
{
  "type": "Basic | Auth2.0 | Auth1 | NoAuth",
  "authversion": "V1 | V2",
  "granttype": "Authorization Code | Implicit | Client Credentials | Password Credentials | null",
  "pluginrecordid": "string",
  "redirecturl": "https://auth.viasocket.com/redirect/auth2.0 | https://auth.viasocket.com/redirect/auth1",
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
Included alongside auth-type-specific fields:
```json
{
  "preferedauthversion": "string | null",
  "description": "string | null"
}
```

## Update Payloads & Discriminators

### `componentToRender` by Auth Type
- **Basic**: `"authfields" | "testcode" | "connectionLabel" | "iconUrlPath" | "appeandHeaders"`
- **OAuth 2.0 Auth Code**: `"authfields" | "auth2Credentials" | "authorizationEndPointConfiguration" | "accesstokencode" | "refreshtokencode" | "revokeapicode" | "testcode" | "connectionLabel" | "iconUrlPath" | "authUniqueKey" | "appeandHeaders"`
- **OAuth 2.0 Client Credentials**: `"authfields" | "accesstokencode" | "refreshtokencode" | "revokeapicode" | "testcode" | "connectionLabel" | "iconUrlPath" | "appeandHeaders"`
- **OAuth 2.0 Implicit**: `"authfields" | "auth2Credentials" | "accesstokencode" | "refreshtokencode" | "revokeapicode" | "testcode" | "connectionLabel" | "iconUrlPath" | "authUniqueKey" | "appeandHeaders"`
- **OAuth 2.0 Password Credentials**: `"authfields" | "auth2Credentials" | "accesstokencode" | "refreshtokencode" | "revokeapicode" | "testcode" | "connectionLabel" | "iconUrlPath" | "authUniqueKey" | "appeandHeaders"`
- **OAuth 1.0**: `"authfields" | "auth2Credentials" | "auth1Urls" | "testcode" | "connectionLabel" | "iconUrlPath" | "authUniqueKey" | "appeandHeaders"`

### Comprehensive Update Payload Shape
```json
{
  "rowid": "string (Connection version row ID to update, e.g., 'rowg11bx64ap' — MANDATORY in update payload)",
  "pluginrecordid": "string (Plugin record ID, e.g., 'row8enarovp8')",
  "componentToRender": "string (Optional component discriminator)",
  "isScopeSeperatorChanged": false,
  "type": "Basic | Auth2.0 | Auth1 | NoAuth",
  "granttype": "Authorization Code | Implicit | Client Credentials | Password Credentials | null",
  "clientid": "string | null",
  "clientsecret": "string | null",
  "authrequrl": "string | null",
  "redirecturl": "string | null",
  "queryparams": "string (Stringified JSON, e.g. '{\"response_type\":\"code\"}' or '{}'; MUST be a string, NEVER an object)",
  "scopeseperatedby": "\"comma\" | \"space\" | null (STRICTLY literal word strings \"comma\" or \"space\", or null; NEVER literal \" \" or \",\")",
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
          "source": "string (dropdown only)",
          "children": []
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
  "connectionlabelvalue": "context?.authData?.testcode?.[\"key\"]",
  "_connectionlabelvalue": "${context?.authData?.testcode?.[\"key\"]}",
  "isconnectionlabelmasked": false,
  "iconurlpath": "",
  "whitelistdomains": ["service.com", "api.service.com"],
  "isbuiltinplugin": false,
  "uniquekeytostoreauth": {
    "uniqueKey": "context?.authData?.clientid",
    "_uniqueKey": "${context?.authData?.clientid}"
  },
  "authenticationpaths": {
    "headers": [{ "name": "Authorization", "value": "..." }],
    "queryParams": [],
    "body": []
  },
  "skipwhitelistvalidation": null
}
```

## Connection Response Reference
Key fields returned by connection endpoints:
- `pluginrecordid`: Plugin foreign key ID.
- `type` / `granttype`: Auth and sub-flow discriminator.
- `authfields`: Configured user inputs.
- `authenticationpaths`: Injected header/body/param rules.
- `whitelistdomains`: Permitted outbound domains.
- `testcode`, `accesstokencode`, `refreshtokencode`, `revokeapicode`: Stored perform scripts.
- `connectionlabelvalue`: Path for display label.
- `authversion`: Internal engine (`"V1"` or `"V2"`).

# Validation Checklist

- [ ] **`rowid` in Update Payload**: Update payload uses `"rowid": "<connection_version_id>"` and `"pluginrecordid": "<pluginId>"`. Never send `"connection_version_id"` inside `request_payload`.
- [ ] **`queryparams` String Format**: `queryparams` is strictly a stringified JSON string (e.g. `"{}"` or `"{\"response_type\":\"code\"}"`), NEVER a raw JSON object `{}`.
- [ ] **`authenticationpaths` Injection vs OAuth Redirect**: `authenticationpaths` injects runtime credentials (e.g. Bearer header in `headers`) for actions/triggers. OAuth redirect parameters belong in `authrequrl`/`queryparams`, never in `authenticationpaths`.
- [ ] **Minimal Scopes**: Baseline connection scopes only; action-specific scopes isolated to actions.
- [ ] **Secret Obscurity**: `password` type used for API keys, tokens, and secrets.
- [ ] **Single Test Endpoint**: Exactly one Me/User/Account API called; returns raw `response.data`.
- [ ] **Label Path Integrity**: Direct JS expression starting with `context?.authData?`, single path, bracket notation, NO `return` statements, NO `||` operators, no `context?.res`. `_connectionlabelvalue` formatted as template string `"${...}"`.
- [ ] **`uniquekeytostoreauth` Formatting**: `uniqueKey` is a valid JS expression (e.g. `context?.authData?.testcode?.["sub"]`) and `_uniqueKey` is `"${...}"`, never static string literals.
- [ ] **Domain Whitelist**: Contains both main service domain and API base domain.
- [ ] **Depth-Aware Escaping**: `\\n` for wrapper fields (`testcode`, token codes); `\n` for direct strings (`authenticationpaths`, labels).
- [ ] **`authenticationpaths` Completeness**: All 3 keys (`headers`, `body`, `queryParams`) present on create or update.
- [ ] **`authfields.authentication.fields`**: Strictly an array (`[]` if empty).
- [ ] **Client Credentials Setup Modes**: For standard/global setup, use dedicated root keys `clientid` and `clientsecret` and do not create them in `authfields`. If manual/user-provided setup is used, root keys are null, field keys in `authfields` are strictly `clientid` and `clientsecret` (no underscores), and `redirectUrl` is mandatory in `authfields`.
- [ ] **Dynamic Token Usage**: Request parameters dynamically resolve latest token via `context.authData`.

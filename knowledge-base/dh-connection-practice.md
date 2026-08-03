---
type: page
title: "Connection Practices Knowledge Base"
description: "This document contains structured UX guidelines and best practices for creating viaSocket plug Connections. It defines the standard UX patterns, common auth field types, field ordering conventions, and perform code references for each Connection/Auth type (No Auth, Basic Auth, OAuth 2.0 — Authorization Code, Implicit, Client Credentials, Password Credentials — and OAuth 1.0)."
published: true
---
# Page Index

- Connection Practices Knowledge Base
- Connections
  - Connection Selection & Priority Guidelines
  - Basic Auth
    - Basic Auth Purpose
    - Basic Auth UX Pattern
    - Basic Auth Common Auth Fields
    - Basic Auth Perform Code Reference
    - Basic Auth Best Practices
  - OAuth 2.0
    - OAuth 2.0 Grant Type Selection Guidelines
    - Authorization Code
      - Authorization Code Purpose
      - Authorization Code UX Pattern
      - Authorization Code Common Auth Fields
      - Authorization Code Perform Code Reference
      - Authorization Code Best Practices
    - Implicit
      - Implicit Purpose
      - Implicit UX Pattern
      - Implicit Common Auth Fields
      - Implicit Perform Code Reference
      - Implicit Best Practices
    - Client Credentials
      - Client Credentials Purpose
      - Client Credentials UX Pattern
      - Client Credentials Common Auth Fields
      - Client Credentials Perform Code Reference
      - Client Credentials Best Practices
    - Password Credentials
      - Password Credentials Purpose
      - Password Credentials UX Pattern
      - Password Credentials Common Auth Fields
      - Password Credentials Perform Code Reference
      - Password Credentials Best Practices
  - OAuth 1.0
    - OAuth 1.0 Purpose
    - OAuth 1.0 UX Pattern
    - OAuth 1.0 Common Auth Fields
    - OAuth 1.0 Perform Code Reference
    - OAuth 1.0 Best Practices
  - No Auth
    - No Auth Purpose
    - No Auth UX Pattern
    - No Auth Common Auth Fields
    - No Auth Perform Code Reference
    - No Auth Best Practices
- Connection Label & Field Naming Guidelines
  - Connection Label Naming & Description
    - Connection Value Path Rules (Single Value & Composite Keys)
  - Field Naming & Description
  - General Copywriting Guidelines
- Automation UX Builder & Architecture Instructions (Connections)
  - Role & Core Design Philosophy
    - Core Design Philosophy
    - Decision Evaluation Dimensions
    - Product & Use-Case Awareness
    - Auth Type Selection Principle
  - Pre-Design Analysis (Mandatory)
    - Technical Reasoning Principles
  - Connection Design Strategy
    - The Minimal Trust Principle
    - Identifier & Token Resolution
    - Grant Type Evaluation
  - Field Design & Dynamic UI Rules
  - Connection Safety & Token Protection
  - Required Output Structure
  - Behavior Constraints
    - Trade-Off Evaluation Protocol
    - Final Decision Reflection

# Connection Practices Knowledge Base

This document contains structured UX guidelines and best practices for creating viaSocket plug Connections. It defines the standard UX patterns, common auth field types, field ordering conventions, and perform code references for each Connection/Auth type.

# Connections

A Connection lets users prove their identity to a plug's target app and authorize viaSocket to access their data. Every Action and Trigger in a plug runs on top of a Connection. There are four Auth Types, one of which (OAuth 2.0) has four distinct Grant Types, giving **six total Connection UX flows**.

## Connection Selection & Priority Guidelines

When designing or planning a Connection, follow this structured priority flow to determine the Auth Type (and Grant Type, if OAuth 2.0) to implement, especially when the user has not specified their preferred method.

**1. Auth Type Priority Flow**
If the auth method is not specified, evaluate capabilities in this order:
**OAuth 2.0 (`Authorization Code`)** → **OAuth 2.0 (`Client Credentials`)** → **Basic Auth** → **OAuth 1.0** → **No Auth**

*   **Step 1: Check for OAuth 2.0 support** **(`if easily available`)**
    *   Verify if the external service provides an OAuth 2.0 Authorization Endpoint and Token Endpoint. If yes, and real end-users are involved, implement **OAuth 2.0 — Authorization Code** (with PKCE where supported). This is the default, industry-recommended choice for any public SaaS integration.
    *   If the service only needs to authenticate the *application itself* (no end-user identity, e.g. server-to-server, internal automation), implement **OAuth 2.0 — Client Credentials** instead.
    *   Never propose **Implicit** or **Password Credentials** for a new integration; only use them if the service exclusively supports that grant type and no alternative exists (see individual sections below for guardrails).
*   **Step 2: Check for Basic Auth support**
    *   If OAuth 2.0 is not supported, verify if the service issues a static API Key, or a Username + Password pair. If yes, implement **Basic Auth**.
*   **Step 3: Check for OAuth 1.0 support**
    *   If neither OAuth 2.0 nor Basic Auth is supported, and the service uses request-signing (Consumer Key/Secret + Access Token/Secret), implement **OAuth 1.0**.
*   **Step 4: Check for No Auth**
    *   If the service is a fully public API requiring no credentials at all, implement **No Auth**.
*   **Step 5: Ask the User**
    *   If none of the above options are clearly documented, ask the user for the Auth Type and request the API's authentication documentation.
    *   *Note:* At the beginning of the design phase, you can also directly ask the user which Auth Type (and Grant Type, if applicable) they want to build.

## Basic Auth

### Basic Auth Purpose
Basic Auth is a simple authentication method where credentials (username + password, or API key + secret) are sent with every API request. Easy to set up, widely used by developer-first APIs and internal systems.

**When to use:**
- The service authenticates via a static API Key (with or without a secret), or Username + Password.
- OAuth is not supported by the service.
- A simple, fast setup is preferred and acceptable for the risk profile of the data.

### Basic Auth UX Pattern
The standard field ordering/section flow for a Basic Auth Connection follows this sequence:

1. **Configure your Fields** → Credential Auth fields the user fills to authenticate (e.g. `api_key`, `username`, `password`). Values become available as `context.authData.<field_key>`.
2. **Configure Test (Me) API** *(Required)* → A lightweight authenticated `GET` request (e.g. `/me`, `/user`, `/profile`) that validates the entered credentials.
3. **Add Connection Label** → A dynamic, human-readable identifier for the saved connection, built from auth fields or the Test API response.
4. **Add Icon** → Visual icon for the connection.
5. **Add Urls to Whitelist** → Base domains this Connection is authorized to call.
6. **Set Request Parameters** *(Final, Required)* → Dynamic functions that inject the credential into every request's Header, Query Param, or Body — so it never needs to be re-specified inside individual Actions/Triggers.

### Basic Auth Common Auth Fields
- **String** — For non-sensitive credential parts (e.g. `username`, `account_id`).
- **Password** — For sensitive credential parts (e.g. `api_key`, `password`, `access_token`); obscures input.
- Each field supports: `key` (required, must match the API's expected parameter name), `label` (required, user-friendly), `type` (`string` | `password` | `dropdown` | `help`), `placeholder` (placeholder for the auth field, e.g. for email — `joy@gmail.com`), `required` (boolean), `help` (Markdown-enabled instructions with a direct link to where the credential is generated), `input format` (optional pattern hint), `default value` (optional).

### Basic Auth Perform Code Reference
- Basic Auth Connections inject credentials automatically via **Set Request Parameters** — Actions/Triggers do not need to manually attach auth headers.
- Test (Me) API and Request Parameter functions reference credentials via `context.authData.<field_key>`.

**testcode (Test (Me) API):**
```javascript
async function testcode() {
    try {
        const response = await axios.get('https://api.example.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${context?.authData?.api_key}`
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};
return await testcode();
```

### Basic Auth Best Practices
- **Match API field names exactly** — the `key` of each field must match what the target API expects as a parameter name.
- **Use `password` type for anything sensitive** — API keys, secrets, and tokens must obscure input.
- **Always link to the credential source in `help`** — e.g. `` `Get your API key` `` linking to the app's settings/developer page.
- **Prefer a lightweight Test endpoint** — `/me`, `/user`, `/profile`, or any authenticated endpoint requiring no extra parameters. The goal is only to confirm auth works.
- **Never hardcode credentials in Request Parameters** — always reference them dynamically via `context.authData.<field_key>`, never as static values, so token/key rotation is respected.
- **Mask sensitive Connection Labels** — if the label value could expose sensitive data, enable label masking.

---

## OAuth 2.0

### OAuth 2.0 Grant Type Selection Guidelines
OAuth 2.0 is not a single flow — it has four Grant Types, each suited to a different scenario. viaSocket's Connection Builder dynamically changes the number and order of sections based on the selected Grant Type.

| Grant Type | Total Steps | Use When |
|---|---|---|
| **Authorization Code** | 13 | Real end-users are involved; the service supports a full consent-redirect flow. **Default and recommended choice for production SaaS integrations.** |
| **Implicit** | 12 | Frontend-only app, no backend, and the provider still supports Implicit. **Legacy — avoid for new integrations.** |
| **Client Credentials** | 10 | No end-user involved; pure server-to-server / machine-to-machine access. |
| **Password Credentials** | 10 | Only for high-trust, first-party, legacy/internal systems where no redirect-based login is possible. **Deprecated — avoid for new integrations.** |

**Rule of thumb:** If the service supports Authorization Code, always choose it over the other three grant types unless there is no end-user identity involved at all (→ Client Credentials).

---

### Authorization Code

#### Authorization Code Purpose
The standard, most secure OAuth 2.0 method. Users authenticate via the provider's own consent screen; viaSocket never sees the user's password. A short-lived authorization code is exchanged server-side for an access token (and refresh token). viaSocket adds PKCE on top for additional protection in browser-based/plugin contexts.

**When to use:**
- Any production-grade SaaS integration involving real end-users.
- The service documents an Authorization Endpoint and a Token Endpoint supporting `grant_type=authorization_code`.

#### Authorization Code UX Pattern
The standard 13-step section flow:

1. **Configure your Fields** *(optional)* → Extra pre-auth info the Authorization/Token URLs may depend on (e.g. subdomain, region, environment, tenant ID). Available as `context.authData.<fieldName>`. Skip if the provider's endpoints don't depend on user-entered values.
2. **Copy your OAuth Redirect URL** → viaSocket-generated callback URL; pasted into the provider's "Redirect/Callback URL" dashboard setting.
3. **Enter Application Credentials** → `Client ID` and `Client Secret` from the provider's developer console. Used during Token Exchange (Step 5) and Refresh (Step 6). Secret is stored securely, never exposed to end users.
   * **Global/Internal vs. Manual Setup:** Always prefer the global/internal setup (developer pre-configures `clientid` and `clientsecret` globally on the connection model) so that no credentials input fields are created for the end-user. Do not create client ID and client secret input fields under `authfields` unless manual client-side credentials entry is explicitly requested.
   * **Manual Setup Requirements:** If the user specifies that customers will manually add client ID and client secret, the root-level `clientid` and `clientsecret` properties will be empty (`null`). Instead, define `clientid` (key: `"clientid"`, type: `"string"`, placeholder: `"Enter Client id"`, required: `true`, disableField: `true`) and `clientsecret` (key: `"clientsecret"`, type: `"string"`, placeholder: `"Enter Client Secret"`, required: `true`, disableField: `true`) inside `authfields.authentication.fields`. 
   * **Mandatory Redirect URL field:** In a manual setup, the `redirectUrl` field (e.g. `{"key": "redirectUrl", "value": "https://dev-auth.viasocket.com/redirect/auth2.0"}`) **must** also be present in `authfields.authentication.fields`. If `redirectUrl` is not present, the user-supplied credentials are invalid, and the `clientid` and `clientsecret` fields will be disabled.
4. **Configure Authorization Endpoint** *(Required)* → Authorization URL, requested Scopes (space- or comma-joined), core param `response_type=code`, PKCE params (`code_challenge_method=S256` recommended), and any additional provider-specific params (`access_type=offline`, `prompt=consent`, `audience=api`, etc.). Some providers require Base64-encoded client credentials — verify against the API docs.
5. **Configure Access Token API** *(Required)* → `POST` to the Token Endpoint exchanging the authorization code for `access_token` (+ optional `refresh_token`). Built with `axios`, returning `response.data`. Stored under a key such as `context.authData?.accesstokencode?.access_token`. The authorization code is read from `context?.authData?.Authorization?.code`. When PKCE is enabled, the code verifier is read from `context?.authData?.code_verifier` and must be included as `code_verifier` in the request body.
6. **Configure Refresh Token API** → `POST` to the Token Endpoint with `grant_type=refresh_token` and the stored `refresh_token`, returning a fresh `access_token`. Same code pattern as Step 5.
7. **Configure Revoke Token API** → Calls the provider's revoke endpoint with the active token, pulled from `context.authData`, to cleanly disconnect.
8. **Configure Test (Me) API** *(Required)* → Authenticated `GET /me` (or equivalent) using `Authorization: Bearer <access_token>`. Validates token exchange, header injection, and scope sufficiency together.
9. **Add Connection Label** → Human-friendly identifier mapped from the Test API response (e.g. `authData.testcode.profile.real_name`); maskable.
10. **Add Icon** → Visual icon for the connection.
11. **Add Urls to Whitelist** → Domains this Connection is authorized to call.
12. **Add Unique Connection Identifier** *(optional)* → Stable field from the Test/Token response (e.g. `user_id`, `workspace_id`) used to prevent duplicate connections for the same account; enables update-instead-of-duplicate behavior. Leave blank if no reliable stable field exists.
13. **Set Request Parameters** *(Final, Required)* → Dynamic JS functions building Headers (e.g. `Authorization: Bearer ${context.authData?.accesstokencode?.access_token}`), Query Params, and Body defaults for every request.

#### Authorization Code Common Auth Fields
- **String / Password / Dropdown** *(Step 1 only)* — Pre-auth contextual values (subdomain, region, environment, tenant ID).
- **String / Password** *(Step 3)* — `Client ID`, `Client Secret` (configured globally at root level by default, or inside `authfields.authentication.fields` under keys `"clientid"` and `"clientsecret"` along with `"redirectUrl"` for manual setup).
- **Key-Value pairs** *(Steps 4–7, 13)* — Authorization params, token request/response mapping, refresh/revoke request bodies, and request-parameter functions.

#### Authorization Code Perform Code Reference
- Token exchange, refresh, and revoke each use a `POST` request built via `axios` returning `response.data` / `res.data`.
- Request Parameters use small functions referencing `context.authData.<key>` so the latest token is always used, including seamlessly after a refresh.
- The authorization `code` path is `context?.authData?.Authorization?.code`, used inside `accesstokencode`.
- The refresh token path is `context?.authData?.accesstokencode?.refresh_token`, used inside `refreshtokencode`.
- The PKCE code verifier path is `context?.authData?.code_verifier`, included as `code_verifier` in `accesstokencode` when PKCE is enabled.

**accesstokencode (Access Token API):**
```javascript
async function getAccessToken() {
    try {
        const response = await axios.post('https://oauth2.googleapis.com/token', {
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

**refreshtokencode (Refresh Token API):**
```javascript
try {
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: context?.authData?.clientid,
    client_secret: context?.authData?.clientsecret,
    refresh_token: context?.authData?.accesstokencode?.refresh_token,
    grant_type: 'refresh_token'
  });
  return response.data;
} catch (error) {
  throw new Error(error.response.data.error);
}
```

**revokeapicode (Revoke Token API):**
```javascript
try {
  const response = await axios.post(`https://oauth2.googleapis.com/revoke?token=${context?.authData?.accesstokencode?.access_token}`);
  return response.data;
} catch (error) {
  throw new Error(error.response?.data?.error || 'Token revocation failed');
}
```

**testcode (Test/Me API):**
```javascript
async function testcode() {
  try {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
      headers: {
        'Authorization': `Bearer ${context?.authData?.accesstokencode?.access_token}`
      }
    };
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    throw error;
  }
};
return await testcode();
```

#### Authorization Code Best Practices
- **Always enable PKCE** (`code_challenge_method=S256`) when the provider supports it.
- **Request minimal scopes at the Connection level** — put broader/specific scopes at the individual Action/Trigger level instead of requesting everything upfront.
- **Never hardcode tokens in Request Parameters** — always resolve dynamically via `context.authData.<key>` so token refresh is respected transparently.
- **Use a stable Unique Connection Identifier when available** — prevents duplicate connections and keeps token management clean.
- **Verify Base64 client-credential encoding requirements** in the provider's docs before building the Access Token API step.
- **Prefer Global/Internal Client Setup:** Always prefer setting up `clientid` and `clientsecret` globally/internally. Do not create client ID and client secret input fields unless manual/client-side setup is explicitly specified.
- **Mandatory `redirectUrl` in Manual Setup:** If manual setup is used, `redirectUrl` (e.g. `{"key": "redirectUrl", "value": "https://dev-auth.viasocket.com/redirect/auth2.0"}`) must be included inside `authfields.authentication.fields` alongside `clientid` and `clientsecret`. Without it, user-entered client credentials will not be validated and will be disabled.

---

### Implicit

#### Implicit Purpose
Legacy OAuth 2.0 method originally designed for pure frontend apps with no backend. The access token is returned directly in the redirect URL — no authorization-code exchange step exists.

**When to use:**
- Only if the application is 100% frontend, has no backend at all, the provider still supports Implicit, and the accessed data is not highly sensitive.
- **Deprecated** — always prefer Authorization Code + PKCE if any backend exists.

#### Implicit UX Pattern
Identical to Authorization Code's 13-step flow **minus the "Configure Access Token API" step** (12 steps total), since the access token is delivered directly via the redirect — there is nothing to exchange server-side:

1. Configure your Fields *(optional)*
2. Copy your OAuth Redirect URL
3. Enter Application Credentials
4. Configure Authorization Endpoint *(Required)*
5. Configure Refresh Token API *(rarely available — Implicit typically issues no refresh token)*
6. Configure Revoke Token API
7. Configure Test (Me) API *(Required)*
8. Add Connection Label
9. Add Icon
10. Add Urls to Whitelist
11. Add Unique Connection Identifier *(optional)*
12. Set Request Parameters *(Final, Required)*

#### Implicit Common Auth Fields
- Same field types as Authorization Code, minus anything specific to the Access Token API step.

#### Implicit Perform Code Reference
- No server-side token-exchange code is written; the token is captured directly from the redirect and stored under `context.authData`.
- `accesstokencode` and `refreshtokencode` are not applicable for this grant type (no exchange step, and typically no refresh token issued).

**revokeapicode (Revoke Token API):**
```javascript
try {
  const response = await axios.post(`https://api.example.com/oauth/revoke?token=${context?.authData?.access_token}`);
  return response.data;
} catch (error) {
  throw new Error(error.response?.data?.error || 'Token revocation failed');
}
```

**testcode (Test/Me API):**
```javascript
async function testcode() {
  try {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://api.example.com/v1/me',
      headers: {
        'Authorization': `Bearer ${context?.authData?.access_token}`
      }
    };
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    throw error;
  }
};
return await testcode();
```

#### Implicit Best Practices
- **Warn the user this is legacy** — surface a note in the design output that Implicit is deprecated and recommend Authorization Code if any backend capability exists.
- **Expect no refresh token** — design the Refresh Token API step as optional/absent unless the provider explicitly documents one.
- **Never persist the token in browser storage insecurely** — flag this as a known risk in the Automation Safety section of the design output.

---

### Client Credentials

#### Client Credentials Purpose
Machine-to-machine authentication with no end-user involved. The application authenticates itself with its own `client_id` + `client_secret` and receives an access token representing the application, not a user.

**When to use:**
- Server-to-server sync, background jobs, webhooks processing, scheduled automation, microservice communication.
- **Never use** for user login, mobile/frontend auth, or any scenario where human identity matters.

#### Client Credentials UX Pattern
A reduced 10-step flow — no redirect, consent screen, or per-user credentials are needed:

1. **Configure your Fields** *(optional)* → Any pre-auth context values (rare for this grant type).
2. **Configure Access Token API** *(Required)* → `POST` to the Token Endpoint with `grant_type=client_credentials`, `client_id`, `client_secret`, and `scope`. Typically returns `access_token` + `expires_in` with **no refresh token**.
3. **Configure Refresh Token API** → In most implementations this simply re-requests a new token using the same client credentials rather than a distinct refresh call.
4. **Configure Revoke Token API** → `POST` to the revoke endpoint with the current token, `client_id`, `client_secret`.
5. **Configure Test (Me) API** *(Required)* → Authenticated system-level `GET` request confirming the token works.
6. **Add Connection Label** → Since no user is involved, label from a stable app/workspace identifier (e.g. `api_app_id`) rather than a person's name.
7. **Add Icon** → Visual icon for the connection.
8. **Add Urls to Whitelist** → Domains this Connection is authorized to call.
9. **Add Unique Connection Identifier** *(optional)* → Stable app/workspace-level identifier to prevent duplicate connections.
10. **Set Request Parameters** *(Final, Required)* → Dynamic functions injecting the Bearer token into every request.

#### Client Credentials Common Auth Fields
- **String / Password** — `Client ID`, `Client Secret` (may be collected in Configure your Fields if not handled as global App Credentials).
- **Key-Value pairs** — Token request/response mapping, revoke request body, request-parameter functions.

#### Client Credentials Perform Code Reference
- Access Token, "Refresh" (re-request), and Revoke all follow the same `POST` pattern with form-encoded or JSON bodies.

**accesstokencode (Access Token API):**
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

**refreshtokencode (re-requests a fresh token; most Client Credentials providers issue no refresh token):**
```javascript
try {
  const response = await axios.post('https://auth.example.com/oauth/token', {
    client_id: context?.authData?.clientid,
    client_secret: context?.authData?.clientsecret,
    grant_type: 'client_credentials'
  });
  return response.data;
} catch (error) {
  throw new Error(error.response.data.error);
}
```

**revokeapicode (Revoke Token API):**
```javascript
try {
  const response = await axios.post(`https://auth.example.com/oauth/revoke?token=${context?.authData?.accesstokencode?.access_token}`);
  return response.data;
} catch (error) {
  throw new Error(error.response?.data?.error || 'Token revocation failed');
}
```

**testcode (Test/Me API — system-level, since no user is involved):**
```javascript
async function testcode() {
  try {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://api.example.com/system/status',
      headers: {
        'Authorization': `Bearer ${context?.authData?.accesstokencode?.access_token}`
      }
    };
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    throw error;
  }
};
return await testcode();
```

#### Client Credentials Best Practices
- **Never expose the client secret in frontend-reachable code** — it must remain strictly backend/perform-code only.
- **Do not build a user-identity Connection Label** — there is no user; use an app, workspace, or tenant-level identifier instead.
- **Confirm no user data is being accessed** before selecting this grant type — if the target data is user-scoped, this is the wrong flow; use Authorization Code instead.

---

### Password Credentials

#### Password Credentials Purpose
The application collects the user's raw username and password directly and exchanges them for a token. No redirect, no consent screen. **Deprecated** — breaks the core OAuth principle that apps should never see user passwords.

**When to use:**
- Only for high-trust, first-party, legacy, or fully internal systems where the app and the authorization server are owned by the same organization and no safer alternative is available.
- **Never propose this for a new production integration if Authorization Code is supported.**

#### Password Credentials UX Pattern
Structurally identical to Client Credentials (10 steps), since neither flow involves a redirect/consent screen — but the credential-gathering step now collects the end-user's real username and password directly:

1. **Configure your Fields** *(Required)* → `username` and `password` fields (marked `required: true`, `password` type for the password field).
2. **Configure Access Token API** *(Required)* → `POST` to the Token Endpoint with `grant_type=password`, `client_id`, `client_secret`, `username`, `password`. Typically returns `access_token` **and** `refresh_token`.
3. **Configure Refresh Token API** → `POST` with `grant_type=refresh_token`, the stored `refresh_token`, `client_id`, `client_secret`.
4. **Configure Revoke Token API** → `POST` to the revoke endpoint with the active token.
5. **Configure Test (Me) API** *(Required)* → Authenticated `GET` confirming the token is valid.
6. **Add Connection Label** → Human-friendly identifier from the Test API response.
7. **Add Icon** → Visual icon for the connection.
8. **Add Urls to Whitelist** → Domains this Connection is authorized to call.
9. **Add Unique Connection Identifier** *(optional)* → Stable user identifier to prevent duplicates.
10. **Set Request Parameters** *(Final, Required)* → Dynamic functions injecting the Bearer token into every request.

#### Password Credentials Common Auth Fields
- **String** — `username`.
- **Password** — `password` (must obscure input).
- **Key-Value pairs** — Token request/response mapping, refresh/revoke bodies, request-parameter functions.

#### Password Credentials Perform Code Reference
- Same request/response pattern as Client Credentials, with `username`/`password` added to the Access Token API payload and a genuine refresh-token cycle available.

**accesstokencode (Access Token API):**
```javascript
async function getAccessToken() {
    try {
        const response = await axios.post('https://auth.example.com/oauth/token', {
            grant_type: 'password',
            client_id: context?.authData?.clientid,
            client_secret: context?.authData?.clientsecret,
            username: context?.authData?.username,
            password: context?.authData?.password
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};
return await getAccessToken();
```

**refreshtokencode (Refresh Token API):**
```javascript
try {
  const response = await axios.post('https://auth.example.com/oauth/token', {
    grant_type: 'refresh_token',
    client_id: context?.authData?.clientid,
    client_secret: context?.authData?.clientsecret,
    refresh_token: context?.authData?.accesstokencode?.refresh_token
  });
  return response.data;
} catch (error) {
  throw new Error(error.response.data.error);
}
```

**revokeapicode (Revoke Token API):**
```javascript
try {
  const response = await axios.post(`https://auth.example.com/oauth/revoke?token=${context?.authData?.accesstokencode?.access_token}`);
  return response.data;
} catch (error) {
  throw new Error(error.response?.data?.error || 'Token revocation failed');
}
```

**testcode (Test/Me API):**
```javascript
async function testcode() {
  try {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://api.example.com/user/profile',
      headers: {
        'Authorization': `Bearer ${context?.authData?.accesstokencode?.access_token}`
      }
    };
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    throw error;
  }
};
return await testcode();
```

#### Password Credentials Best Practices
- **Flag deprecation explicitly in the design output** — recommend Authorization Code + PKCE if the provider supports it at all.
- **Never log or persist the raw password** anywhere outside the immediate token-exchange call.
- **Use `password` field type** to obscure the credential in the UI at minimum, even though this flow is inherently riskier than others.

---

## OAuth 1.0

### OAuth 1.0 Purpose
The original OAuth protocol, built around cryptographically signed requests rather than bearer tokens. Every request is signed using a `Consumer Key`, `Consumer Secret`, `Access Token`, and `Token Secret`, combined with a timestamp, nonce, and a hash generated per the connection's chosen `signatureMethod`.

**When to use:**
- Only for legacy platforms that do not support OAuth 2.0 (e.g. older Trello/Twitter-style APIs).
- **Legacy** — OAuth 2.0 (Authorization Code or Client Credentials) is the modern replacement and should always be preferred for new integrations.

### OAuth 1.0 UX Pattern
The standard 9-step section flow:

1. **Enter Application Credentials** → `Consumer Key` and `Consumer Secret` from the provider's developer console.
2. **Copy your OAuth Redirect URL** → viaSocket-generated callback URL (e.g. `https://auth.viasocket.com/redirect/auth1`); add it to the provider's redirect/callback/allowed URL list if the provider requires one.
3. **Configure OAuth1 Endpoint** *(Required)* → `Request Token URL`, `Authorize URL`, `Access Token URL`, and `signatureMethod` (`HMAC-SHA1` | `RSA-SHA1` | `PLAINTEXT`). Clicking **Authorize** runs viaSocket's built-in three-legged OAuth 1.0 exchange (request token → user authorization → access token) automatically using these URLs and the selected signature method — **no custom perform code is written for this step.** The resulting token is stored under `context.authData.accesstokencode`.
4. **Configure Test (Me) API** *(Required)* → A signed authenticated request (per the selected `signatureMethod`, using the Consumer/Access Token secrets, a timestamp, and a nonce) confirming the credentials are valid.
5. **Add Connection Label** → Human-friendly identifier from the Test API response.
6. **Add Icon** → Visual icon for the connection.
7. **Add Urls to Whitelist** → Domains this Connection is authorized to call.
8. **Add Unique Connection Identifier** *(optional)* → Stable identifier to prevent duplicate connections.
9. **Set Request Parameters** *(Final, Required)* → Signing logic applied to every request's Header/Query/Body so every Action/Trigger is automatically signed and authenticated.

### OAuth 1.0 Common Auth Fields
- **String / Password** — `Consumer Key`, `Consumer Secret` (Step 1).
- **String (URL)** — `Request Token URL`, `Authorize URL`, `Access Token URL` (Step 3).
- **Radio / Select** — `signatureMethod`: `HMAC-SHA1` | `RSA-SHA1` | `PLAINTEXT` (Step 3).
- **Key-Value pairs** — Signature/request-parameter functions applied at the final step.

### OAuth 1.0 Perform Code Reference
- **`accesstokencode` requires no custom perform code.** Once `Request Token URL`, `Authorize URL`, `Access Token URL`, and `signatureMethod` are configured in **Configure OAuth1 Endpoint**, viaSocket runs the full request-token → authorize → access-token exchange internally when the user clicks **Authorize**; the result is stored under `context.authData.accesstokencode`.
- Every outbound request (Test API, and every Action/Trigger request) must be signed: HTTP method + full URL + all request parameters + Consumer Secret + Token Secret → hashed per `signatureMethod` (`HMAC-SHA1`, `RSA-SHA1`, or `PLAINTEXT`) → `oauth_signature`.
- There is no universal revoke standard; token invalidation is typically handled via the provider's dashboard, so `revokeapicode` is usually omitted.
- Only `axios` is used for the network call itself; signing uses the standard `crypto` module — no `require`/`import` for either.

**testcode (Test/Me API — signed with the automatically-issued access token):**
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
        oauthParams.oauth_signature = generateOAuth1Signature(
            'GET',
            'https://api.example.com/user/profile',
            oauthParams,
            context?.authData?.consumersecret,
            context?.authData?.accesstokencode?.oauth_token_secret
        );
        const authHeader = 'OAuth ' + Object.entries(oauthParams)
            .map(([key, value]) => `${key}="${encodeURIComponent(value)}"`)
            .join(', ');

        const response = await axios.get('https://api.example.com/user/profile', {
            headers: { 'Authorization': authHeader },
            maxBodyLength: Infinity
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};
return await testcode();
```

*Note: `generateOAuth1Signature` is a reusable signing helper (HTTP method + URL + params + Consumer Secret + Token Secret → hash per `signatureMethod` → Base64) — define it once as a Reusable Component and reference it across the Test (Me) API step and the Set Request Parameters signing function.*

### OAuth 1.0 Best Practices
- **Recommend OAuth 2.0 first** — only propose OAuth 1.0 if the service documentation offers no OAuth 2.0 or Basic Auth path.
- **Choose the correct `signatureMethod`** per the provider's documentation — `HMAC-SHA1` is most common; `RSA-SHA1` requires a private key; `PLAINTEXT` should only be used over HTTPS and only if the provider requires it.
- **Trust the built-in Authorize exchange** — do not attempt to hand-write `accesstokencode` logic; only the Test (Me) API and Set Request Parameters steps require custom signing code.
- **Always include a fresh nonce and timestamp per request** — never reuse values, to avoid replay rejection.
- **Document provider-specific signature quirks** — flag any deviations from the standard signing process found in the API docs.

---


---

## No Auth

### No Auth Purpose
Used when accessing public APIs or endpoints that do not require verifying the identity of the requester. Appropriate only for openly accessible resources where no user-specific or sensitive data is involved.

**When to use:**
- The API is intentionally public and returns general, non-sensitive information.
- Example: Public health/weather/maps data, open data services, static metadata endpoints (e.g. `/v1/countries`).

**When NOT to use:**
- Any endpoint returning user-specific, private, or sensitive data.
- Any endpoint requiring account context.

### No Auth UX Pattern
No credential collection step is required. The Connection is limited to the shared, non-auth sections only:

1. **Add URLs to Whitelist** → Restrict which domains this Connection is permitted to call.
2. **Set Request Parameters** *(optional)* → Static headers/query/body defaults common to every request (e.g. `Content-Type: application/json`), since there is no credential to inject dynamically.

### No Auth Common Auth Fields
- None. No credential-collecting `Configure your Fields` step is shown, since there is nothing for the user to authenticate with.

### No Auth Perform Code Reference
- Actions/Triggers built on a No Auth Connection call the API directly with no `Authorization` header or signed request.
- No credential-based perform code (Access Token / Refresh / Revoke / Test) is applicable, since there is no credential to exchange or validate.

### No Auth Best Practices
- **Confirm true public access** — verify with the API docs that genuinely no auth is required before proposing this; do not default to No Auth just because a quick test endpoint returned data without a key.
- **Still whitelist domains** — even with no credentials, restrict allowed domains to reduce the blast radius of a misconfigured or malicious perform-code call.
- **Recommend rate-limit awareness** — flag in the design notes that public/no-auth endpoints are prone to abuse and rate limiting.

---

# Connection Label & Field Naming Guidelines

This section outlines the standard conventions for generating user-facing names, labels, and help text for Connections in the viaSocket plug ecosystem.

## Connection Label Naming & Description
A Connection Label uniquely identifies a saved connection so users can distinguish between multiple connected accounts.
* **Format:** Build dynamically from Test API response data or auth fields — never a static generic string.
  * *Bad:* "My App Connection"
  * *Good:* "John – Production API", "Marketing Account – US", masked ID formats like "XXX-XXX-23433"
* **User-scoped auth (Basic Auth, Authorization Code, Implicit, Password Credentials, OAuth 1.0):** Prefer a real identifying value from the Test API response (name, email, workspace).
* **App-scoped auth (Client Credentials):** Prefer a stable app/workspace/tenant identifier, since no user exists.
* **Masking:** Enable masking whenever the label value is sensitive (e.g. partially hidden email or ID).

### Connection Value Path Rules (Single Value & Composite Keys)
* **Single Value Path Only:** The `connectionlabelvalue` (and `_connectionlabelvalue`) field MUST contain **exactly one single path** (e.g., `context?.res?.data?.workspace_name` or `context?.authData?.testcode?.bot?.workspace_name`).
* **No `||` Logical OR Operators:** Chaining multiple paths or fallback expressions using `||` in `connectionlabelvalue` is **STRICTLY PROHIBITED**.
  * *Bad (PROHIBITED):* `"context?.res?.data?.workspace_name || context?.res?.data?.bot?.owner?.name || context?.authData?.clientid"`
  * *Good:* `"context?.res?.data?.workspace_name"`
* **Composite or Fallback Keys in Test API Code:** If a fallback across multiple fields or a composite string (e.g., workspace name falling back to user name, or combining first and last name) is required to form the connection label:
  1. The composite/fallback logic **must be constructed inside the Test (Me) API perform code (`testcode`)**.
  2. The `testcode` function must set and return that composite property as a single key on its response object (e.g., `data.workspace_name = data.bot?.workspace_name || data.name || data.email;`).
  3. Map that single composite property directly in `connectionlabelvalue` (e.g., `context?.authData?.testcode?.workspace_name`).

**Example 1 — Single Direct Path (e.g., Notion/Workspace):**
* `connectionlabelkey`: `"workspace"`
* `connectionlabelvalue`: `"context?.res?.data?.workspace_name"`
* `_connectionlabelvalue`: `"${context?.res?.data?.workspace_name}"`

**Example 2 — Composite / Fallback Property inside Test (Me) API Perform Code (`testcode`):**
```javascript
async function testcode() {
    try {
        const response = await axios.get('https://api.example.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${context?.authData?.accesstokencode?.access_token}`
            }
        });
        const data = response.data;
        // Construct composite/fallback key inside testcode so connectionlabelvalue stays a single clean path without ||
        data.connection_label = data.bot?.workspace_name || data.user?.name || data.email || 'Connected Account';
        return data;
    } catch (error) {
        throw error;
    }
};
return await testcode();
```
* **Mapping in Connection configuration:**
  * `connectionlabelkey`: `"connection_label"`
  * `connectionlabelvalue`: `"context?.authData?.testcode?.connection_label"`
  * `_connectionlabelvalue`: `"${context?.authData?.testcode?.connection_label}"`

## Field Naming & Description
Applies to all credential Auth fields collected in "Configure your Fields":
* **Key:** Must exactly match the target API's expected parameter name (e.g. `api_key`, `client_id`, `username`).
* **Label:** User-friendly, specific, Title Case (e.g. "API Key", "Account Username").
* **Help Text:** Explain where to find the credential, with a direct Markdown link to the provider's settings/developer page. Focus on business meaning, not internal storage mechanics.
  * *Good:* `` `Get your API key` `` (linked)
  * *Bad:* "Paste the value found in the token JSON response"

## General Copywriting Guidelines
1. **Focus on outcomes:** Describe what the credential lets the user do, not the underlying protocol mechanics.
2. **Use simple, human language:** Avoid protocol jargon (grant type, nonce, bearer, HMAC) in user-facing labels/help text — reserve that language for internal documentation only.
3. **Minimize redundancy:** Don't repeat the app name in every field label; the app icon/context already establishes scope.
4. **Validation & Update Safety:** If existing field/label text already complies with these guidelines, preserve it without changes.
5. **Character discipline:** Keep labels and help text short and scannable — avoid multi-sentence help blocks where one clear sentence + a link suffices.

---

# Automation UX Builder & Architecture Instructions (Connections)

This section defines the core role, design philosophies, safety strategies, and response structure for the viaSocket Input Builder assistant when operating in Connection design/planning mode.

## Role & Core Design Philosophy

*Prioritizing trust minimization, hiding cryptographic/protocol complexity, and designing for safe, long-lived automation.*

You are a **Senior Automation UX Architect** and **viaSocket Connection Designer** operating in Connection design mode. Your responsibility is to analyze a target service's authentication documentation and design a scalable, security-conscious Connection architecture.

### Core Design Philosophy
Design Connections around a **mixture of non-technical simplicity and protocol-level correctness**. The end-user configuring the Connection should never need to understand OAuth grant types, signing algorithms, or token lifecycles — but the underlying implementation must be fully correct for whichever method the service requires.
* **Never Weaken Security for Convenience:** Do not select a lower-security Auth Type or Grant Type merely because it is easier to build; always follow the Connection Selection & Priority Guidelines.
* **Hide Protocol Complexity by Default:** Hide signing algorithms, raw token JSON, nonce/timestamp generation, and internal `context.authData` key names behind human-readable labels and help text.
* **Prioritize Stable, Non-Sensitive Identifiers:** For Connection Labels and Unique Connection Identifiers, favor stable, low-sensitivity fields (name, workspace ID) over volatile or highly sensitive ones (raw tokens, passwords).
* **Design for Deterministic, Long-Lived Access:** Connections must remain valid and safely refreshable across thousands of automation runs without manual reconnection, wherever the provider supports it.

### Decision Evaluation Dimensions
Every Connection design decision should be evaluated across five dimensions (balanced dynamically, not strictly prioritized):
1. **Accessibility:** Can a non-technical business owner complete this Connection confidently?
2. **Security Posture:** Does this follow the strongest Auth Type/Grant Type the service actually supports?
3. **Technical Feasibility:** Is this implementable and stable given the documented API?
4. **Longevity:** Will the Connection stay authenticated over time without unnecessary manual reconnection?
5. **Structural Constraints:** Does this respect the provider's documented auth capabilities?

### Product & Use-Case Awareness
Before proposing any Connection:
* Understand what data/actions the plug's Actions and Triggers will need access to.
* Identify whether real end-users or only the application itself will be authenticating.
* Avoid requesting broader access (scopes, credential types) than the plug's actual use cases require.

### Auth Type Selection Principle
An Auth Type/Grant Type choice is strong when:
* It matches the highest-security method the target service actually documents and supports.
* It fits the real relationship between the plug and the account (user-scoped vs. app-scoped).
* It does not introduce unnecessary complexity (e.g. proposing OAuth 1.0 signing when the service also offers OAuth 2.0).

---

## Pre-Design Analysis (Mandatory)

*Mandatory analysis checklist for auth documentation, token lifecycle, and identifier behavior.*

Before proposing any Connection architecture, perform a comprehensive analysis of the target service's authentication documentation:
* **Auth Methods Available:** Which of No Auth / Basic Auth / OAuth 2.0 (and which grant types) / OAuth 1.0 the service documents.
* **Endpoints:** Authorization Endpoint, Token Endpoint, Refresh Endpoint, Revoke Endpoint, and a lightweight Test/Me endpoint.
* **Token Lifecycle:** Expiry duration, whether refresh tokens are issued, whether refresh tokens rotate.
* **Scopes:** Available scopes, and the minimal set required for the Test API and the plug's core use cases.
* **Identifiers:** Stable fields usable for Connection Label and Unique Connection Identifier (user ID, workspace ID, email, etc.).

> [!IMPORTANT]
> *   Every documented auth requirement must be either represented in the Connection UX or handled implicitly by the perform code.
> *   **Security Constraint:** Client secrets, tokens, and passwords must **never** be exposed in frontend-reachable fields, logs, or Connection Labels without masking.

### Technical Reasoning Principles
* **Grant Type Confirmation:** Confirm with the API docs which OAuth 2.0 grant type(s) are actually supported before defaulting to Authorization Code.
* **PKCE Awareness:** If the provider supports PKCE, always enable it for Authorization Code and Implicit flows.
* **Encoding Requirements:** Check whether the provider requires Base64-encoded client credentials or specific content types (`application/x-www-form-urlencoded` vs `application/json`) for token requests.
* **Endpoint Validation:** If endpoints are undocumented or ambiguous, document the limitation clearly rather than assuming a standard OAuth shape.

---

## Connection Design Strategy

*Strategies for minimal-trust credential collection and safe identifier resolution.*

### The Minimal Trust Principle
Collect and request only what is strictly necessary:
* **Scopes:** Request only the scopes required for the Test API and the plug's actual Actions/Triggers at the Connection level; push additional/specific scopes down to individual Action/Trigger configuration where viaSocket supports it.
* **Fields:** Only add "Configure your Fields" entries the chosen Auth Type/Grant Type genuinely requires (e.g. do not add a Redirect URL step for Client Credentials).

### Identifier & Token Resolution
Use **response-derived resolution** rather than asking users to manually supply identifiers:
1. Resolve the Connection Label and Unique Connection Identifier from the Test (Me) API response wherever possible.
2. Ensure `connectionlabelvalue` maps to **exactly one path** (e.g., `context?.authData?.testcode?.bot?.workspace_name`). Never chain multiple paths with `||`.
3. If a composite or fallback label is required across multiple response fields, construct that composite key directly inside the Test (Me) API perform code (`testcode`) and map its single key path to `connectionlabelvalue`.
4. If no user-identifiable field exists in the response, fall back to a stable non-sensitive value (e.g. account/workspace ID) constructed in `testcode` or mapped directly, noting this fallback explicitly in the design output.
5. Never ask the user to manually paste internal system IDs when the Test API can supply them.

### Grant Type Evaluation
* **Single viable method:** If the service documents only one Auth Type/Grant Type, do not present a selector — implement it directly.
* **Multiple viable methods:** Default to the highest-priority method per the Connection Selection & Priority Guidelines, and note in the Clarification Questions section if a lower-security fallback (e.g. Password Credentials) is the only option the provider offers.

---

## Field Design & Dynamic UI Rules

*Principles for field ordering, field type selection, and context-variable handling specific to Connections.*

* **General Principles:**
  * **Field Ordering:** Required credential fields first; optional pre-auth context fields (region, environment) after. Help text always sits below the field it describes.
  * **Structural Respect:** Map the provider's documented parameter types to the correct field type (`string`, `password`, key-value pairs) — never fabricate unsupported UI structures.
* **Field Type Design Rules:**
  * **Use `password` type** for any credential value that is sensitive (API keys, secrets, tokens, passwords) so it is obscured in the UI.
  * **Use `string` type** only for genuinely non-sensitive values (usernames, subdomains, regions, environment names).
  * **Avoid dropdowns for credential values** — credential fields are user-supplied secrets, not selectable options. Dropdowns are only appropriate for non-secret configuration (e.g. Region, Environment) with a small, stable, known option set.
* **Dynamic Context Handling:**
  * For every value produced during the Connection flow (auth fields, tokens, test response data):
    * Reference it consistently via `context.authData.<keyname>`, using nested dot-notation when the value lives inside a nested response object (e.g. `context.authData.accesstokencode.access_token`, `context.authData.testcode.profile.real_name`).
    * Never invent a `context.authData` key that wasn't actually defined in "Configure your Fields" or produced by the Access Token / Test API steps.
* **Workflow Simplicity Principles:**
  * **Connection Purity:** Keep the Connection flow limited to authentication concerns; business-logic transformations belong in Action/Trigger perform code, not Connection perform code.
  * **customHelp Writing Guidelines:** Explain what the user should provide and where to find it, in business terms — not how viaSocket stores or transmits it internally.
    * *Good:* `"Enter the API key from your account's Developer Settings page."`
    * *Bad:* `"Paste the value that will be stored as context.authData.api_key."`
  * **Default Value Usage Rule:** Only set a default value for genuinely optional, non-sensitive fields (e.g. a default region). Never default a credential field.
* **Structural Constraint Handling:**
  * If a provider requires multiple values to be combined into a single header/param (e.g. a composite Basic Auth string), build that concatenation inside the Request Parameters function rather than asking the user to pre-format it.
* **Cross-Cutting UX Patterns:**
  * **Token Freshness Pattern** — Always resolve tokens dynamically inside Request Parameter functions (`context.authData?.accesstokencode?.access_token`) rather than caching a static value, so refreshed tokens are picked up automatically.
  * **Fallback Label Pattern** — When no user-identifiable field exists in the Test response or fallback field resolution is needed, construct a composite key (e.g. `data.connection_label`) inside `testcode` perform code and map `connectionlabelvalue` to that single path (`context?.authData?.testcode?.connection_label`), ensuring no `||` operators are present in `connectionlabelvalue`.
  * **Grant-Type-Aware Section Pruning** — Only render the Connection sections relevant to the selected Grant Type/Auth Type (e.g. omit Redirect URL / App Credentials / Authorization Endpoint for Client Credentials and Password Credentials; omit Access Token API for Implicit; OAuth 1.0 uses Configure OAuth1 Endpoint instead of a custom Access Token API step).

---

## Connection Safety & Token Protection

*Guidelines to protect secrets, preserve token lifecycle integrity, and sanitize connection-level responses.*

* **Secret Protection:**
  * **No Exposed Secrets:** Client secrets, consumer secrets, token secrets, and passwords must never be requested or displayed anywhere reachable by end users beyond the initial masked input.
  * **Masking:** Enable Connection Label masking whenever the label could reveal sensitive data (partial email, partial ID).
* **Token Lifecycle Safety:**
  * **Always define a Refresh strategy where the provider supports one** — either a true refresh-token exchange (Authorization Code, Password Credentials) or a re-request pattern (Client Credentials).
  * **Always define a Revoke strategy where the provider supports one** — ensures a clean, verifiable disconnect.
  * **Never let expired tokens silently fail Actions/Triggers** — the Request Parameters function should always pull the freshest stored token.
* **Response Handling:**
  * **Test (Me) API responses:** Extract only the fields needed for Connection Label / Unique Connection Identifier; do not surface the full raw response to the end user.
  * **Token responses:** Store only what's needed (`access_token`, `refresh_token`, `expires_in`); never surface raw token values in the visible UI.
* **Backward Compatibility Rules:**
  * Connection field keys and `context.authData` key names are stable contracts. When modifying an existing Connection:
    * **Never rename or remove existing `context.authData` keys** unless a migration strategy exists — this breaks every Action/Trigger perform code referencing them.
    * **Allowed changes:** Adding new optional fields, improving help text/labels, adding a Unique Connection Identifier retroactively, tightening the domain whitelist.

---

## Required Output Structure

*The standard structure required for every proposed Connection design.*

Your final proposed design must strictly output the following structure:

* **Auth Documentation Understanding Summary:** A breakdown of the target service's supported Auth Type(s)/Grant Type(s), required endpoints, token lifecycle, available scopes, and identifier fields.
* **Clarification Questions:** Ask clear, high-priority questions only when the Auth Type/Grant Type choice, scope requirements, or endpoint behavior is ambiguous.
* **Proposed Connection Architecture:** An organized JSON definition of the Connection's Auth Fields and section configuration, showing field grouping, custom helpers, placeholder text, and the grant-type-appropriate section list.

> [!WARNING]
> #### Connection Perform Code Constraints:
> *   The **CODE STRUCTURE TEMPLATE** above (`async function <functionName>() { try {...} catch (error) { throw error; } }; return await <functionName>();`) is **mandatory** for every Connection perform code step.
> *   `axios` is used for all network calls — never `require`/`import`/`fetch`/`window`/`document`.
> *   Client secrets, consumer secrets, and passwords must **never** be hardcoded in the perform code — always sourced from `context.authData`.
> *   The authorization code path is always `context?.authData?.Authorization?.code`; the refresh token path is always `context?.authData?.accesstokencode?.refresh_token`; the PKCE code verifier path is always `context?.authData?.code_verifier`.
> *   For OAuth 1.0, never generate custom `accesstokencode` — it is produced automatically by the Configure OAuth1 Endpoint step's built-in Authorize exchange.
> *   The perform code should focus strictly on token/signature handling and request dispatching.

* **Connection Safety & Longevity Check:** A robust analysis explaining the refresh strategy, revoke strategy, duplicate-connection prevention (Unique Connection Identifier), and runtime stability guarantees across long-lived automations.

---

## Behavior Constraints

*Prohibitions against exposed secrets, invented endpoints, and unnecessary security downgrades.*

*   **No Exposed Secrets:** Absolutely **never** expose or request client secrets, consumer secrets, token secrets, or passwords in a way visible beyond the initial masked/password input.
*   **No Security Downgrades Without Justification:** Never select a lower-security Auth Type or Grant Type (e.g. Implicit, Password Credentials) when a higher-security option (Authorization Code, Client Credentials) is documented as supported — unless explicitly instructed otherwise and the trade-off is stated.
*   **Adherence to Real Documentation:** Do **not** invent or assume endpoint URLs, grant types, or scopes that are not explicitly documented by the target service.

### Trade-Off Evaluation Protocol
When conflicts arise during Connection design, evaluate:
1.  Does this increase complexity for non-technical users configuring the Connection?
2.  Does this weaken the security posture relative to what the service actually supports?
3.  Does this increase the risk of token/credential leakage?
4.  Does this reduce long-term maintainability of the Connection (e.g. brittle manual reconnection requirements)?
*Choose the solution that minimizes long-term risk while preserving usability.*

### Final Decision Reflection
Before finalizing any Connection design recommendation, internally validate:
*   Is this usable by a traditional business owner with no OAuth/cryptography background?
*   Is this using the strongest Auth Type/Grant Type the service actually supports?
*   Are secrets and tokens fully protected from exposure?
*   Will this Connection remain valid over long-running automations without unnecessary reconnection?
*   Are grant-type-specific structural constraints (section pruning, missing refresh tokens, etc.) handled correctly?
*If trade-offs exist, explicitly acknowledge them and explain the reasoning.*
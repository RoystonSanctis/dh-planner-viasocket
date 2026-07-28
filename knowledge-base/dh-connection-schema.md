---
type: page
title: "Database Schema for the Connection Model"
description: "Technical specification of database and API objects required for viaSocket plug builder connections, including the Connection Response Schema, Create Connection Payload, and Update Connection Payload for all authentication types."
published: true
---

# Page Index
- Agent Variable ↔ Schema Field Alias Reference
- 1. Connection Object Schema (Response)
  - Connection Response JSON Schema
  - Connection Response TOON Schema
- 2. Create Connection Payload
  - Create Connection JSON Schema
  - Create Connection TOON Schema
- Common Fields (Plugin-Level, applicable to Create & Update)
  - Common Fields JSON Schema
  - Common Fields TOON Schema
- 3. Update Connection Payload
  - 3.1. Basic Auth Update Schema
    - Basic Auth Update JSON Schema
    - Basic Auth Update TOON Schema
  - 3.2. Auth2.0 Update Schemas
    - 3.2.1. Authorization Code
      - Authorization Code Update JSON Schema
      - Authorization Code Update TOON Schema
    - 3.2.2. Client Credentials
      - Client Credentials Update JSON Schema
      - Client Credentials Update TOON Schema
    - 3.2.3. Implicit
      - Implicit Update JSON Schema
      - Implicit Update TOON Schema
    - 3.2.4. Password Credentials
      - Password Credentials Update JSON Schema
      - Password Credentials Update TOON Schema
  - 3.3. Auth1.0 Update Schema
    - Auth1.0 Update JSON Schema
    - Auth1.0 Update TOON Schema

---

# Agent Variable ↔ Schema Field Alias Reference

Mapping of agent-provided runtime variables to their corresponding schema field names used in connection payloads.

| Agent Variable Name       | Schema Field Name (in payloads)       | Where it lives          | Notes                                                                 |
|---------------------------|---------------------------------------|-------------------------|-----------------------------------------------------------------------|
| `pluginId`                | `pluginrecordid`                      | Plugin record & all connection payloads | Same value, different name. Use `pluginrecordid` in payloads. |
| `connection_version_id`   | `rowid` of the connection version     | Connection version record | The ID of the connection version being updated.                     |
| `functionId`              | Same as `connection_version_id`        | Connection version record | Alias for the connection version row ID; same value.                |
| `threadId`                | Internal chat thread ID               | Metadata only           | Not used in connection payloads.                                     |
| `orgId`                   | `orgid`                               | Connection response     | Organization ID; auto-injected.                                      |
| `preferedauthversion`     | `preferedauthversion`                 | Plugin record (not connection version) | Row ID of the connection version currently set as preferred on the plugin; empty string means none is set. |

---

# Database Schema for the Connection Model

This document outlines the technical specification of the database and API objects required for managing viaSocket connections (authentication configurations for plugins/services) through the Response Schema, Create Connection Payload, and Update Connection Payload.

# 1. Connection Object Schema (Response)

A Connection represents a stored authentication configuration (e.g., "Notion - Basic Auth", "Trello - OAuth1.0") that links a plugin/service to its auth mechanism, credentials, and request-injection logic.

## Connection Response JSON Schema

```json
{
  "createdat": "String (ISO 8601 timestamp of when this record was created, e.g., \"2026-07-11T07:27:39.207Z\")",
  "createdby": {
    "id": "String (Actor identifier, e.g., \"developer_hub(PROD_BASE)\")"
  },
  "updatedat": "String (ISO 8601 timestamp of the last update to this record, e.g., \"2026-07-17T12:13:36.000Z\")",
  "updatedby": {
    "id": "String (Actor identifier, e.g., \"developer_hub(PROD_BASE)\")"
  },
  "created_by": "String | null (Human-readable creator name in format 'userId_Name', e.g., \"119899_Prince Chouksey\")",
  "updated_by": "String | null (Human-readable last updater name in format 'userId_Name', e.g., \"119899_Prince Chouksey\")",
  "pluginrecordid": "String (Foreign key referencing the parent plugin record, e.g., \"rowgt678e7la\")",
  "pluginname": "String (Human-readable name of the plugin/service, e.g., \"Notion\")",
  "pluginiconurl": "String | null (URL to the plugin icon hosted on CDN, e.g., \"https://stuff.thingsofbrand.com/notion.com/images/imgf_notion.png\")",
  "iconurlpath": "String | null (Custom override path for the icon; null means use pluginiconurl, e.g., \"ASDFGH\")",
  "domain": "String (Primary domain of the service, e.g., \"notion.com\")",
  "whitelistdomains": "Array (List of allowed domains for outgoing API requests, e.g., [\"notion.com\", \"www.notion.com\"])",
  "skipwhitelistvalidation": "Boolean | null (When true, bypasses domain whitelist checks; null means default validation applies)",
  "description": "String | null (Optional human-readable description of the connection; always null in observed data)",
  "orgid": "String (Organization ID that owns this connection configuration, e.g., \"69643\")",
  "authversion": "String (Internal auth engine version: \"V1\" | \"V2\"; V2 observed only on Password Credentials flow)",
  "isencrypted": "String (Whether sensitive fields are encrypted at rest: \"true\" | \"false\")",
  "linkrowversion": "null (Internal DB row versioning field; always null in observed data)",
  "lookupauthidversion": "null (Version key for auth ID lookup table; always null in observed data)",
  "needsdynamicdata": "null (Flag for dynamic data fetching during setup; always null in observed data)",
  "type": "String (Top-level auth type: \"Basic\" | \"Auth2.0\" | \"Auth1\" | \"NoAuth\")",
  "granttype": "String | null (OAuth2 sub-flow type: \"Authorization Code\" | \"Implicit\" | \"Client Credentials\" | \"Password Credentials\"; null for Basic, Auth1, NoAuth)",
  "clientid": "String | null (OAuth2 Client ID or OAuth1 Consumer Key stored at root level; null for Basic, NoAuth, Password Credentials, or for Authorization Code flow when custom client-side/manual credentials are used)",
  "clientsecret": "String | null (OAuth2 Client Secret or OAuth1 Consumer Secret; encrypted string when isencrypted=true; null for Implicit, Basic, NoAuth, Password Credentials, or for Authorization Code flow when custom client-side/manual credentials are used)",
  "authrequrl": "String | null (Authorization endpoint URL for OAuth redirect flows; supports context template interpolation; null for Basic, Auth1, NoAuth, and Password Credentials)",
  "redirecturl": "String | null (ViaSocket OAuth callback URL: \"https://auth.viasocket.com/redirect/auth2.0\" | \"https://auth.viasocket.com/redirect/auth1\" | null)",
  "queryparams": "String (Stringified JSON of static query params appended to authrequrl; \"{}\" when no params needed, e.g., \"{\\\"response_type\\\":\\\"code\\\"}\")",
  "scopeseperatedby": "String | null (Delimiter for joining OAuth scope values: \"comma\" | \"space\" | null)",
  "authrequrlhtml": "String | null (Custom HTML for overriding the auth request page; always null in observed data)",
  "auth1parameters": {
    "requestTokenUrl": "String (Step 1 OAuth1: URL to obtain temporary request token, e.g., \"https://trello.com/1/OAuthGetRequestToken\")",
    "authorizeUrl": "String (Step 2 OAuth1: URL to redirect user for authorization, e.g., \"https://trello.com/1/OAuthAuthorizeToken\")",
    "accessTokenUrl": "String (Step 3 OAuth1: URL to exchange verifier for access token, e.g., \"https://trello.com/1/OAuthGetAccessToken\")",
    "signatureMethod": "String (OAuth1 signing algorithm: \"HMAC-SHA1\" | \"HMAC-SHA256\" | \"RSA-SHA1\" | \"PLAINTEXT\")"
  },
  "testcode": "String (Stringified JSON with source JS code for testing the connection, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",
  "accesstokencode": "String (Stringified JSON with source JS code for fetching access token; source is null for Basic, Auth1, Implicit, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",
  "refreshtokencode": "String (Stringified JSON with source JS code for refreshing access token; source is null for Basic and Auth1, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",
  "revokeapicode": "String (Stringified JSON with source JS code for revoking token; source is null for Basic and Auth1, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",
  "authfields": {
    "authentication": {
      "type": "String (Auth type label in UI form: \"Basic\" | \"Auth2.0\" | \"Auth1.0\" | \"NoAuth\")",
      "fields": [
        {
          "key": "String (Unique field identifier referenced in code as context?.authData?.<key>, e.g., \"token\")",
          "label": "String (Human-readable display label shown in UI, e.g., \"API Key\")",
          "type": "String (Input field type: \"string\" | \"password\")",
          "required": "Boolean (Whether the user must fill this field to create the connection, e.g., true)",
          "help": "String (Help text or HTML displayed below the input; can be empty string, e.g., \"Enter client ID here.\")",
          "placeholder": "String (Example value shown inside the input, e.g., \"https://your-domain.okta.com\")",
          "value": "String (Default pre-filled value; empty string means no default, e.g., \"\")",
          "source": "String (URL linking to official docs where the user can find this field's value)",
          "visibilityCondition": "String (JS expression evaluated to determine field visibility; references context.authData)"
        }
      ]
    }
  },
  "authfields_copy": "null (Copy/snapshot of authfields; always null in observed data)",
  "authenticationpaths": {
    "headers": [
      {
        "name": "String (HTTP header name to inject, e.g., \"Authorization\")",
        "value": "String (JS expression or named function returning the header value, e.g., \"function returnHeaders(){ return `Bearer ${context?.authData?.accesstokencode?.access_token}` } return returnHeaders()\")"
      }
    ],
    "body": [
      {
        "name": "String (Body field key to inject, e.g., \"name\")",
        "value": "String (JS expression or named function returning the body value, e.g., \"return \\\"Prince\\\";\")"
      }
    ],
    "queryParams": [
      {
        "name": "String (Query parameter name to inject, e.g., \"api_key\")",
        "value": "String (JS expression or named function returning the query param value, e.g., \"return context?.authData?.clientsecret\")"
      }
    ]
  },
  "uniquekeytostoreauth": {
    "uniqueKey": "String (JS expression evaluating to unique identifier for stored auth; empty string means ViaSocket auto-assigns, e.g., \"context?.authData?.clientid\")",
    "_uniqueKey": "String (Template string version of uniqueKey, e.g., \"${context?.authData?.clientid}\")"
  },
  "connectionlabelkey": "String | null (Label for the type of identifier used to display the connected account in UI, e.g., \"workspace_name\")",
  "connectionlabelvalue": "String | null (JS expression extracting display value for connected account from authData; MUST be a single path without '||' fallback operators, e.g., \"context?.authData?.testcode?.bot?.workspace_name\"). If a composite value or fallback is needed, create the composite key in testcode perform code and map its single path here.",
  "_connectionlabelvalue": "String | null (Template string version of connectionlabelvalue, e.g., \"${context?.authData?.testcode?.bot?.workspace_name}\")",
  "connectionlabelname": "null (Reserved field; always null in observed data)",
  "_connectionlabelkey": "null (Reserved field; always null in observed data)",
  "connectionlabelkey_copy": "null (Reserved copy field; always null in observed data)",
  "isconnectionlabelmasked": "Boolean (When true, the connection label value is masked in the UI, e.g., false)",
  "metadata": {
    "save": [
      {
        "by": "String (Who performed the save in format 'userId_Name', e.g., \"119899_Prince Chouksey\")",
        "slug": "Array (List of field names changed in this save operation, e.g., [\"clientid\", \"queryparams\"])",
        "time": "String (ISO 8601 timestamp of when this save occurred, e.g., \"2026-07-17T12:13:36.534Z\")",
        "actionType": "String (Type of operation: \"UPDATE\" | \"CREATE\")"
      }
    ],
    "duplicatedfrom": {
      "rowid": "String (rowid of the source record this was duplicated from, e.g., \"rowgvz6gs8ce\")",
      "authversion": "String (authversion of the source record at time of duplication: \"V1\" | \"V2\")"
    }
  }
}
```

## Connection Response TOON Schema

```toon
createdat: String (ISO 8601 timestamp)
createdby: Object
  - id: String (actor identifier)
updatedat: String (ISO 8601 timestamp)
updatedby: Object
  - id: String (actor identifier)
created_by: String | null ('userId_Name' format)
updated_by: String | null ('userId_Name' format)
pluginrecordid: String (plugin ID)
pluginname: String
pluginiconurl: String | null
iconurlpath: String | null (override; null = use pluginiconurl)
domain: String
whitelistdomains: Array of Strings
skipwhitelistvalidation: Boolean | null
description: String | null (always null observed)
orgid: String
authversion: String ('V1' | 'V2')
isencrypted: String ('true' | 'false')
linkrowversion: null (always null observed)
lookupauthidversion: null (always null observed)
needsdynamicdata: null (always null observed)
type: String ('Basic' | 'Auth2.0' | 'Auth1' | 'NoAuth')
granttype: String | null ('Authorization Code' | 'Implicit' | 'Client Credentials' | 'Password Credentials'; null for Basic/Auth1/NoAuth)
clientid: String | null
clientsecret: String | null (encrypted when isencrypted=true)
authrequrl: String | null (supports template interpolation)
redirecturl: String | null ('https://auth.viasocket.com/redirect/auth2.0' | 'https://auth.viasocket.com/redirect/auth1' | null)
queryparams: String (stringified JSON, '{}' default)
scopeseperatedby: String | null ('comma' | 'space' | null)
authrequrlhtml: String | null (always null observed)
auth1parameters: Object (optional)
  - requestTokenUrl: String
  - authorizeUrl: String
  - accessTokenUrl: String
  - signatureMethod: String ('HMAC-SHA1' | 'HMAC-SHA256' | 'RSA-SHA1' | 'PLAINTEXT')
testcode: String (stringified JSON with source JS)
accesstokencode: String (stringified JSON with source JS; source null for Basic/Auth1/Implicit)
refreshtokencode: String (stringified JSON with source JS; source null for Basic/Auth1)
revokeapicode: String (stringified JSON with source JS; source null for Basic/Auth1)
authfields: Object
  - authentication: Object
    - type: String ('Basic' | 'Auth2.0' | 'Auth1.0' | 'NoAuth')
    - fields: Array of FieldObjects
      - key: String
      - label: String
      - type: String ('string' | 'password')
      - required: Boolean
      - help: String (can be empty)
      - placeholder: String
      - value: String (default '')
      - source: String (docs URL)
      - visibilityCondition: String (JS expression)
authfields_copy: null (always null observed)
authenticationpaths: Object
  - headers: Array of PathObjects
    - name: String (header name)
    - value: String (JS expression/function)
  - body: Array of PathObjects
    - name: String (body key)
    - value: String (JS expression/function)
  - queryParams: Array of PathObjects
    - name: String (query param name)
    - value: String (JS expression/function)
uniquekeytostoreauth: Object
  - uniqueKey: String (JS expression; empty = auto-assign)
  - _uniqueKey: String (templated version of uniqueKey)
connectionlabelkey: String | null
connectionlabelvalue: String | null (JS expression)
_connectionlabelvalue: String | null (templated version)
connectionlabelname: null (reserved, always null observed)
_connectionlabelkey: null (reserved, always null observed)
connectionlabelkey_copy: null (reserved, always null observed)
isconnectionlabelmasked: Boolean
metadata: Object
  - save: Array of SaveObjects
    - by: String ('userId_Name' format)
    - slug: Array of Strings (changed field names)
    - time: String (ISO 8601 timestamp)
    - actionType: String ('UPDATE' | 'CREATE')
  - duplicatedfrom: Object (optional)
    - rowid: String (source record ID)
    - authversion: String ('V1' | 'V2')
```

---

# 2. Create Connection Payload

The Create Connection Payload is the minimal set of fields sent by the client to create a new Connection record. DB-managed fields (`rowid`, `autonumber`, `createdat`/`updatedat`, `createdby`/`updatedby`, `metadata`) and plugin-display fields (`pluginname`, `pluginiconurl`, `domain`, `whitelistdomains`) are not part of this payload.

## Create Connection JSON Schema

```json
{
  "type": "String (Top-level auth type: \"Basic\" | \"Auth2.0\" | \"Auth1\" | \"NoAuth\")",
  "authversion": "String (Internal auth engine version: \"V1\" | \"V2\")",
  "granttype": "String | null (OAuth2 sub-flow type: \"Authorization Code\" | \"Implicit\" | \"Client Credentials\" | \"Password Credentials\"; null for Basic and Auth1)",
  "pluginrecordid": "String (Unique row ID of the plugin, e.g., \"rowx79hqzckx\")",
  "redirecturl": "String (ViaSocket OAuth callback URL: \"https://auth.viasocket.com/redirect/auth2.0\" | \"https://auth.viasocket.com/redirect/auth1\")",
  "queryparams": "String (Stringified JSON of static query params; \"{}\" when no params needed)",
  "isconnectionlabelmasked": "Boolean | null (Whether connection label value is masked in UI; null if not set)",
  "authfields": "Object | null (Auth fields definition; null for Basic auth)",
  "accesstokencode": "String (Stringified JSON for access token config, e.g., \"{\\\"source\\\":null}\")",
  "refreshtokencode": "String (Stringified JSON for refresh token config, e.g., \"{\\\"source\\\":null}\")",
  "revokeapicode": "String (Stringified JSON for revoke API config, e.g., \"{\\\"source\\\":null}\")",
  "testcode": "String (Stringified JSON for test API config, e.g., \"{\\\"source\\\":null}\")"
}
```

## Create Connection TOON Schema

```toon
type: String ('Basic' | 'Auth2.0' | 'Auth1' | 'NoAuth')
authversion: String ('V1' | 'V2')
granttype: String | null ('Authorization Code' | 'Implicit' | 'Client Credentials' | 'Password Credentials'; null for Basic/Auth1)
pluginrecordid: String (plugin ID)
redirecturl: String ('https://auth.viasocket.com/redirect/auth2.0' | 'https://auth.viasocket.com/redirect/auth1')
queryparams: String (stringified JSON, '{}' default)
isconnectionlabelmasked: Boolean | null
authfields: Object | null (null for Basic auth)
accesstokencode: String (stringified JSON, e.g. '{"source":null}')
refreshtokencode: String (stringified JSON, e.g. '{"source":null}')
revokeapicode: String (stringified JSON, e.g. '{"source":null}')
testcode: String (stringified JSON, e.g. '{"source":null}')
```

---

# Common Fields (Plugin-Level)

Plugin-level fields that can be included in a Create or Update payload alongside any auth-type-specific fields.

## Common Fields JSON Schema

```json
{
  "preferedauthversion": "String | null (Row ID of the connection version set as the plugin's default authentication version, e.g., \"row0c2kywqza\"; null or empty string means no preferred version is set)",
  "description": "String | null (Human-readable description of this connection version, e.g., \"OAuth 2.0 Authorization Code flow for Notion API v2026-03-11\")"
}
```

## Common Fields TOON Schema

```toon
preferedauthversion: String | null (row ID of the preferred connection version; null or empty = none set)
description: String | null (optional description of the connection version)
```

---

# 3. Update Connection Payload

The Update Connection Payload is sent by the client to modify an existing Connection. Its shape branches into six variants based on the `type` and `granttype` discriminators: Basic, and the four Auth2.0 grant types (Authorization Code, Client Credentials, Implicit, Password Credentials), and Auth1.0.

## 3.1. Basic Auth Update Schema

### Basic Auth Update JSON Schema

```json
{
  "componentToRender": "String (Which component to render, e.g., \"authfields\" | \"testcode\" | \"connectionLabel\" | \"iconUrlPath\" | \"appeandHeaders\")",
  "isScopeSeperatorChanged": "Boolean (Whether scope separator was changed, e.g., false)",

  "authfields": {
    "authentication": {
      "type": "String (Authentication type, e.g., \"basic\")",
      "fields": [
        {
          "key": "String (Unique field identifier, e.g., \"auth_key\")",
          "label": "String (Display label for the field, e.g., \"API Key\")",
          "type": "String (Field input type: \"string\" | \"password\" | \"dropdown\")",
          "value": "String (Current field value, e.g., \"\")",
          "help": "String (Help text shown below the field, e.g., \"enter api key\")",
          "placeholder": "String (Placeholder text shown inside the input, e.g., \"apiKey\")",
          "required": "Boolean (Whether the field is required, e.g., true)",
          "visibilityCondition": "String (JS code to control field visibility using context.authData)",
          "source": "String (Only for dropdown type: JS code returning array of options)",
          "children": [
            {
              "label": "String (Option display label, e.g., \"label1\")",
              "value": "String (Option value, e.g., \"value1\")",
              "sample": "String (Sample value for the option, e.g., \"sample1\")"
            }
          ]
        }
      ]
    }
  },

  "testcode": "String (Stringified JSON with source JS code for testing the connection, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",

  "connectionlabelkey": "String (Field name used as connection label, e.g., \"TestCodeName\")",
  "connectionlabelvalue": "String (JS expression to resolve connection label value, e.g., \"context?.authData?.token\")",
  "_connectionlabelvalue": "String (Template string version of connection label value, e.g., \"${context?.authData?.token}\")",
  "isconnectionlabelmasked": "Boolean (Whether connection label value is masked, e.g., true)",

  "iconurlpath": "String (URL path for the service icon, e.g., \"\")",

  "whitelistdomains": "Array (List of whitelisted domains, e.g., [\"arcsite.com\", \"www.arcsite.com\"])",
  "isbuiltinplugin": "Boolean (Whether this is a built-in plugin, e.g., false)",

  "authenticationpaths": {
    "headers": [
      {
        "name": "String (Header name, e.g., \"Authorization\")",
        "value": "String (JS code returning the header value)"
      }
    ],
    "queryParams": [
      {
        "name": "String (Query param name, e.g., \"api key\")",
        "value": "String (JS code returning the query param value, e.g., \"return \\\"qwertyuiop\\\";\")"
      }
    ],
    "body": [
      {
        "name": "String (Body param name, e.g., \"name\")",
        "value": "String (JS code returning the body param value, e.g., \"return \\\"prince\\\";\")"
      }
    ]
  },
  "skipwhitelistvalidation": "null (Whether to skip whitelist validation; null if not set)"
}
```

### Basic Auth Update TOON Schema

```toon
componentToRender: String ('authfields' | 'testcode' | 'connectionLabel' | 'iconUrlPath' | 'appeandHeaders')
isScopeSeperatorChanged: Boolean
authfields: Object
  - authentication: Object
    - type: String ('basic')
    - fields: Array of FieldObjects
      - key: String
      - label: String
      - type: String ('string' | 'password' | 'dropdown')
      - value: String
      - help: String
      - placeholder: String
      - required: Boolean
      - visibilityCondition: String (JS code)
      - source: String (dropdown only; JS code returning options)
      - children: Array of OptionObjects (dropdown only)
        - label: String
        - value: String
        - sample: String
testcode: String (stringified JSON with source JS)
connectionlabelkey: String
connectionlabelvalue: String (JS expression)
_connectionlabelvalue: String (templated version)
isconnectionlabelmasked: Boolean
iconurlpath: String
whitelistdomains: Array of Strings
isbuiltinplugin: Boolean
authenticationpaths: Object
  - headers: Array of PathObjects
    - name: String
    - value: String (JS code)
  - queryParams: Array of PathObjects
    - name: String
    - value: String (JS code)
  - body: Array of PathObjects
    - name: String
    - value: String (JS code)
skipwhitelistvalidation: null (null if not set)
```

## 3.2. Auth2.0 Update Schemas

### 3.2.1. Authorization Code

> [!IMPORTANT]
> **Client Credentials Setup Modes (Global/Internal vs. Manual/User-provided):**
> * **Default (Global/Internal Setup - Recommended):** The developer configures the `clientid` and `clientsecret` globally in the connection model. End-users do not see any Client ID or Client Secret input fields. Root-level `clientid` and `clientsecret` properties hold the values, and `authfields.authentication.fields` does not contain `clientid`, `clientsecret`, or `redirectUrl` fields.
> * **Special Case (Manual/User-provided Setup):** If the developer allows customers to supply their own custom `clientid` and `clientsecret` manually (to set up the application on the service themselves):
>   - The root-level `clientid` and `clientsecret` properties on the connection record must be `null` or empty.
>   - The credentials must instead be entered by the user, and the following fields MUST be defined inside `authfields.authentication.fields`:
>     - `clientid` (key: `"clientid"`, type: `"string"`, label: `"Client Id"`, placeholder: `"Enter Client id"`, required: `true`, disableField: `true`)
>     - `clientsecret` (key: `"clientsecret"`, type: `"string"`, label: `"Client Secret"`, placeholder: `"Enter Client Secret"`, required: `true`, disableField: `true`)
>     - `redirectUrl` (key: `"redirectUrl"`, value: `"https://dev-auth.viasocket.com/redirect/auth2.0"` or the appropriate callback URL).
>     > [!WARNING]
>     > Including `redirectUrl` in `authfields` is **mandatory** for manual setups. If `redirectUrl` is not present, the user-entered `clientid` and `clientsecret` will not be valid, and the keys will be disabled.

#### Authorization Code Update JSON Schema

```json
{
  "granttype": "String (OAuth grant type, e.g., \"Authorization Code\")",

  "componentToRender": "String (Which component to render, e.g., \"authfields\" | \"auth2Credentials\" | \"authorizationEndPointConfiguration\" | \"accesstokencode\" | \"refreshtokencode\" | \"revokeapicode\" | \"testcode\" | \"connectionLabel\" | \"iconUrlPath\" | \"authUniqueKey\" | \"appeandHeaders\")",
  "isScopeSeperatorChanged": "Boolean (Whether scope separator was changed, e.g., false)",

  "clientid": "String | null (OAuth client ID, e.g., \"123\"; null/empty if client credentials are entered manually by users under authfields)",
  "clientsecret": "String | null (OAuth client secret, e.g., \"1234565432\"; null/empty if client credentials are entered manually by users under authfields)",

  "authfields": {
    "authentication": {
      "type": "String (Authentication type, e.g., \"Auth2.0\")",
      "fields": [
        {
          "key": "String (Unique field identifier, e.g., \"apiKey\")",
          "label": "String (Display label for the field, e.g., \"apiKey\")",
          "type": "String (Field input type: \"string\" | \"password\" | \"dropdown\")",
          "value": "String (Current field value, e.g., \"\")",
          "help": "String (Help text shown below the field, e.g., \"enter api key\")",
          "placeholder": "String (Placeholder text shown inside the input, e.g., \"apiKey\")",
          "required": "Boolean (Whether the field is required, e.g., true)",
          "visibilityCondition": "String (JS code to control field visibility using context.authData)",
          "source": "String (Only for dropdown type: JS code returning array of options)",
          "children": [
            {
              "label": "String (Option display label, e.g., \"label1\")",
              "value": "String (Option value, e.g., \"value1\")",
              "sample": "String (Sample value for the option, e.g., \"sample1\")"
            }
          ]
        }
      ]
    }
  },

  "authrequrl": "String (Authorization endpoint URL, e.g., \"https://api.notion.com/v1/oauth/authorize\")",
  "queryparams": "String (Stringified JSON of query parameters, e.g., \"{\\\"response_type\\\":\\\"code\\\"}\")",
  "scopeseperatedby": "String (Scope separator type, e.g., \"comma\")",

  "accesstokencode": "String (Stringified JSON with source JS code for fetching access token, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",
  "refreshtokencode": "String (Stringified JSON with source JS code for refreshing access token, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",
  "revokeapicode": "String (Stringified JSON with source JS code for revoking token, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",
  "testcode": "String (Stringified JSON with source JS code for testing the connection, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",

  "connectionlabelkey": "String (Field name used as connection label, e.g., \"ClientId\")",
  "connectionlabelvalue": "String (JS expression to resolve connection label value, e.g., \"context?.authData?.clientid\")",
  "_connectionlabelvalue": "String (Template string version of connection label value, e.g., \"${context?.authData?.clientid}\")",
  "isconnectionlabelmasked": "Boolean (Whether connection label value is masked, e.g., false)",

  "iconurlpath": "String (URL path for the service icon, e.g., \"\")",

  "whitelistdomains": "Array (List of whitelisted domains, e.g., [\"arcsite.com\", \"www.arcsite.com\"])",
  "isbuiltinplugin": "Boolean (Whether this is a built-in plugin, e.g., false)",

  "uniquekeytostoreauth": {
    "uniqueKey": "String (JS expression used as unique key to store auth, e.g., \"context?.authData?.clientid\")"
  },

  "authenticationpaths": {
    "headers": [
      {
        "name": "String (Header name, e.g., \"Authorization\")",
        "value": "String (JS code returning the header value, e.g., \"function returnHeaders(){ return `Bearer ${context?.authData?.accesstokencode?.access_token}` } return returnHeaders()\")"
      }
    ],
    "queryParams": [
      {
        "name": "String (Query param name, e.g., \"Query params\")",
        "value": "String (JS code returning the query param value, e.g., \"return \\\"query\\\";\")"
      }
    ],
    "body": [
      {
        "name": "String (Body param name, e.g., \"body params\")",
        "value": "String (JS code returning the body param value, e.g., \"return \\\"body\\\";\")"
      }
    ]
  },
  "skipwhitelistvalidation": "null (Whether to skip whitelist validation; null if not set)"
}
```

#### Authorization Code Update TOON Schema

```toon
granttype: String ('Authorization Code')
componentToRender: String ('authfields' | 'auth2Credentials' | 'authorizationEndPointConfiguration' | 'accesstokencode' | 'refreshtokencode' | 'revokeapicode' | 'testcode' | 'connectionLabel' | 'iconUrlPath' | 'authUniqueKey' | 'appeandHeaders')
isScopeSeperatorChanged: Boolean
clientid: String | null (null for manual client-side setup)
clientsecret: String | null (null for manual client-side setup)
authfields: Object
  - authentication: Object
    - type: String ('Auth2.0')
    - fields: Array of FieldObjects
      - key: String
      - label: String
      - type: String ('string' | 'password' | 'dropdown')
      - value: String
      - help: String
      - placeholder: String
      - required: Boolean
      - visibilityCondition: String (JS code)
      - source: String (dropdown only; JS code returning options)
      - children: Array of OptionObjects (dropdown only)
        - label: String
        - value: String
        - sample: String
authrequrl: String (authorization endpoint URL)
queryparams: String (stringified JSON)
scopeseperatedby: String ('comma' | ...)
accesstokencode: String (stringified JSON with source JS)
refreshtokencode: String (stringified JSON with source JS)
revokeapicode: String (stringified JSON with source JS)
testcode: String (stringified JSON with source JS)
connectionlabelkey: String
connectionlabelvalue: String (JS expression)
_connectionlabelvalue: String (templated version)
isconnectionlabelmasked: Boolean
iconurlpath: String
whitelistdomains: Array of Strings
isbuiltinplugin: Boolean
uniquekeytostoreauth: Object
  - uniqueKey: String (JS expression)
authenticationpaths: Object
  - headers: Array of PathObjects
    - name: String
    - value: String (JS code/function)
  - queryParams: Array of PathObjects
    - name: String
    - value: String (JS code)
  - body: Array of PathObjects
    - name: String
    - value: String (JS code)
skipwhitelistvalidation: null (null if not set)
```

### 3.2.2. Client Credentials

#### Client Credentials Update JSON Schema

```json
{
  "granttype": "String (OAuth grant type, e.g., \"Client Credentials\")",

  "componentToRender": "String (Which component to render, e.g., \"authfields\" | \"accesstokencode\" | \"refreshtokencode\" | \"revokeapicode\" | \"testcode\" | \"connectionLabel\" | \"iconUrlPath\" | \"appeandHeaders\")",
  "isScopeSeperatorChanged": "Boolean (Whether scope separator was changed, e.g., false)",

  "authfields": {
    "authentication": {
      "type": "String (Authentication type, e.g., \"Auth2.0\")",
      "fields": [
        {
          "key": "String (Unique field identifier, e.g., \"clientid\")",
          "label": "String (Display label for the field, e.g., \"Client ID\")",
          "type": "String (Field input type: \"string\" | \"password\")",
          "value": "String (Current field value, e.g., \"\")",
          "help": "String (Help text shown below the field, e.g., \"Enter client ID here.\")",
          "placeholder": "String (Placeholder text shown inside the input, e.g., \"clientid\")",
          "required": "Boolean (Whether the field is required, e.g., true)",
          "visibilityCondition": "String (JS code to control field visibility using context.authData)",
          "source": "String (Only for dropdown type: JS code returning array of options)",
          "children": [
            {
              "label": "String (Option display label, e.g., \"label1\")",
              "value": "String (Option value, e.g., \"value1\")",
              "sample": "String (Sample value for the option, e.g., \"sample1\")"
            }
          ]
        }
      ]
    }
  },

  "accesstokencode": "String (Stringified JSON with source JS code for fetching access token, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",
  "refreshtokencode": "String (Stringified JSON with source JS code for refreshing access token, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",
  "revokeapicode": "String (Stringified JSON with source JS code for revoking token, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",
  "testcode": "String (Stringified JSON with source JS code for testing the connection, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",

  "connectionlabelkey": "String (Field name used as connection label, e.g., \"ClientId\")",
  "connectionlabelvalue": "String (JS expression to resolve connection label value, e.g., \"context?.authData?.clientid\")",
  "_connectionlabelvalue": "String (Template string version of connection label value, e.g., \"${context?.authData?.clientid}\")",
  "isconnectionlabelmasked": "Boolean (Whether connection label value is masked, e.g., false)",

  "iconurlpath": "String (URL path for the service icon, e.g., \"\")",

  "whitelistdomains": "Array (List of whitelisted domains, e.g., [\"arcsite.com\", \"www.arcsite.com\"])",
  "isbuiltinplugin": "Boolean (Whether this is a built-in plugin, e.g., false)",

  "uniquekeytostoreauth": {
    "uniqueKey": "String (JS expression used as unique key to store auth, e.g., \"context?.authData?.clientid\")"
  },

  "authenticationpaths": {
    "headers": [
      {
        "name": "String (Header name, e.g., \"Authorization\")",
        "value": "String (JS code returning the header value)"
      }
    ],
    "queryParams": [
      {
        "name": "String (Query param name, e.g., \"api_key\")",
        "value": "String (JS code returning the query param value)"
      }
    ],
    "body": [
      {
        "name": "String (Body param name, e.g., \"name\")",
        "value": "String (JS code returning the body param value)"
      }
    ]
  },
  "skipwhitelistvalidation": "null (Whether to skip whitelist validation; null if not set)"
}
```

#### Client Credentials Update TOON Schema

```toon
granttype: String ('Client Credentials')
componentToRender: String ('authfields' | 'accesstokencode' | 'refreshtokencode' | 'revokeapicode' | 'testcode' | 'connectionLabel' | 'iconUrlPath' | 'appeandHeaders')
isScopeSeperatorChanged: Boolean
authfields: Object
  - authentication: Object
    - type: String ('Auth2.0')
    - fields: Array of FieldObjects
      - key: String
      - label: String
      - type: String ('string' | 'password')
      - value: String
      - help: String
      - placeholder: String
      - required: Boolean
      - visibilityCondition: String (JS code)
      - source: String (dropdown only; JS code returning options)
      - children: Array of OptionObjects (dropdown only)
        - label: String
        - value: String
        - sample: String
accesstokencode: String (stringified JSON with source JS)
refreshtokencode: String (stringified JSON with source JS)
revokeapicode: String (stringified JSON with source JS)
testcode: String (stringified JSON with source JS)
connectionlabelkey: String
connectionlabelvalue: String (JS expression)
_connectionlabelvalue: String (templated version)
isconnectionlabelmasked: Boolean
iconurlpath: String
whitelistdomains: Array of Strings
isbuiltinplugin: Boolean
uniquekeytostoreauth: Object
  - uniqueKey: String (JS expression)
authenticationpaths: Object
  - headers: Array of PathObjects
    - name: String
    - value: String (JS code)
  - queryParams: Array of PathObjects
    - name: String
    - value: String (JS code)
  - body: Array of PathObjects
    - name: String
    - value: String (JS code)
skipwhitelistvalidation: null (null if not set)
```

### 3.2.3. Implicit

#### Implicit Update JSON Schema

```json
{
  "componentToRender": "String (Which component to render, e.g., \"authfields\" | \"auth2Credentials\" | \"accesstokencode\" | \"refreshtokencode\" | \"revokeapicode\" | \"testcode\" | \"connectionLabel\" | \"iconUrlPath\" | \"authUniqueKey\" | \"appeandHeaders\")",
  "isScopeSeperatorChanged": "Boolean (Whether scope separator was changed, e.g., false)",

  "granttype": "String (OAuth grant type, e.g., \"Implicit\")",

  "clientid": "String (OAuth client ID, e.g., \"1EBoguHBDd7PmNsEuENZjryI49VsPl8u\")",
  "clientsecret": "null (OAuth client secret; null if not required for this flow)",

  "authfields": {
    "authentication": {
      "type": "String (Authentication type, e.g., \"Auth2.0\")",
      "fields": [
        {
          "key": "String (Unique field identifier, e.g., \"instanceUrl\")",
          "label": "String (Display label for the field, e.g., \"instanceUrl\")",
          "type": "String (Field input type: \"string\" | \"password\" | \"dropdown\")",
          "value": "String (Current field value, e.g., \"\")",
          "help": "String (Help text shown below the field, e.g., \"Okta org/base URL used as the issuer for authorization.\")",
          "placeholder": "String (Placeholder text shown inside the input, e.g., \"https://your-domain.okta.com\")",
          "required": "Boolean (Whether the field is required, e.g., true)",
          "visibilityCondition": "String (JS code to control field visibility using context.authData)",
          "source": "String (Only for dropdown type: JS code returning array of options)",
          "children": [
            {
              "label": "String (Option display label, e.g., \"label1\")",
              "value": "String (Option value, e.g., \"value1\")",
              "sample": "String (Sample value for the option, e.g., \"sample1\")"
            }
          ]
        }
      ]
    }
  },

  "accesstokencode": "String (Stringified JSON with source JS code for fetching access token, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",
  "refreshtokencode": "String (Stringified JSON with source JS code for refreshing access token, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",
  "revokeapicode": "String (Stringified JSON with source JS code for revoking token, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",
  "testcode": "String (Stringified JSON with source JS code for testing the connection, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",

  "connectionlabelkey": "String (Field name used as connection label, e.g., \"Email\")",
  "connectionlabelvalue": "String (JS expression to resolve connection label value, e.g., \"context?.authData?.testcode.email\")",
  "_connectionlabelvalue": "String (Template string version of connection label value, e.g., \"${context?.authData?.testcode.email}\")",
  "isconnectionlabelmasked": "Boolean (Whether connection label value is masked, e.g., false)",

  "iconurlpath": "String (URL path for the service icon, e.g., \"\")",
  "whitelistdomains": "Array (List of whitelisted domains, e.g., [\"arcsite.com\", \"www.arcsite.com\"])",
  "isbuiltinplugin": "Boolean (Whether this is a built-in plugin, e.g., false)",

  "uniquekeytostoreauth": {
    "uniqueKey": "String (JS expression used as unique key to store auth, e.g., \"context?.authData?.instanceUrl\")",
    "_uniqueKey": "String (Template string version of unique key, e.g., \"${context?.authData?.instanceUrl}\")"
  },

  "authenticationpaths": {
    "headers": [
      {
        "name": "String (Header name, e.g., \"Authorization\")",
        "value": "String (JS code returning the header value)"
      }
    ],
    "queryParams": [
      {
        "name": "String (Query param name, e.g., \"api_key\")",
        "value": "String (JS code returning the query param value)"
      }
    ],
    "body": [
      {
        "name": "String (Body param name, e.g., \"name\")",
        "value": "String (JS code returning the body param value)"
      }
    ]
  },
  "skipwhitelistvalidation": "null (Whether to skip whitelist validation; null if not set)"
}
```

#### Implicit Update TOON Schema

```toon
componentToRender: String ('authfields' | 'auth2Credentials' | 'accesstokencode' | 'refreshtokencode' | 'revokeapicode' | 'testcode' | 'connectionLabel' | 'iconUrlPath' | 'authUniqueKey' | 'appeandHeaders')
isScopeSeperatorChanged: Boolean
granttype: String ('Implicit')
clientid: String
clientsecret: null (not required for this flow)
authfields: Object
  - authentication: Object
    - type: String ('Auth2.0')
    - fields: Array of FieldObjects
      - key: String
      - label: String
      - type: String ('string' | 'password' | 'dropdown')
      - value: String
      - help: String
      - placeholder: String
      - required: Boolean
      - visibilityCondition: String (JS code)
      - source: String (dropdown only; JS code returning options)
      - children: Array of OptionObjects (dropdown only)
        - label: String
        - value: String
        - sample: String
accesstokencode: String (stringified JSON with source JS)
refreshtokencode: String (stringified JSON with source JS)
revokeapicode: String (stringified JSON with source JS)
testcode: String (stringified JSON with source JS)
connectionlabelkey: String
connectionlabelvalue: String (JS expression)
_connectionlabelvalue: String (templated version)
isconnectionlabelmasked: Boolean
iconurlpath: String
whitelistdomains: Array of Strings
isbuiltinplugin: Boolean
uniquekeytostoreauth: Object
  - uniqueKey: String (JS expression)
  - _uniqueKey: String (templated version of uniqueKey)
authenticationpaths: Object
  - headers: Array of PathObjects
    - name: String
    - value: String (JS code)
  - queryParams: Array of PathObjects
    - name: String
    - value: String (JS code)
  - body: Array of PathObjects
    - name: String
    - value: String (JS code)
skipwhitelistvalidation: null (null if not set)
```

### 3.2.4. Password Credentials

#### Password Credentials Update JSON Schema

```json
{
  "componentToRender": "String (Which component to render, e.g., \"authfields\" | \"auth2Credentials\" | \"accesstokencode\" | \"refreshtokencode\" | \"revokeapicode\" | \"testcode\" | \"connectionLabel\" | \"iconUrlPath\" | \"authUniqueKey\" | \"appeandHeaders\")",
  "isScopeSeperatorChanged": "Boolean (Whether scope separator was changed, e.g., false)",

  "granttype": "String (OAuth grant type, e.g., \"Password Credentials\")",

  "clientid": "String (OAuth client ID, e.g., \"123\")",
  "clientsecret": "String (OAuth client secret, e.g., \"123456543\")",

  "authfields": {
    "authentication": {
      "type": "String (Authentication type, e.g., \"Auth2.0\")",
      "fields": [
        {
          "key": "String (Unique field identifier, e.g., \"username\")",
          "label": "String (Display label for the field, e.g., \"Username\")",
          "type": "String (Field input type: \"string\" | \"password\" | \"dropdown\")",
          "value": "String (Current field value, e.g., \"\")",
          "help": "String (Help text shown below the field, e.g., \"\")",
          "placeholder": "String (Placeholder text shown inside the input, e.g., \"username\")",
          "required": "Boolean (Whether the field is required, e.g., true)",
          "visibilityCondition": "String (JS code to control field visibility using context.authData)",
          "source": "String (Only for dropdown type: JS code returning array of options)",
          "children": [
            {
              "label": "String (Option display label, e.g., \"label1\")",
              "value": "String (Option value, e.g., \"value1\")",
              "sample": "String (Sample value for the option, e.g., \"sample1\")"
            }
          ]
        }
      ]
    }
  },

  "accesstokencode": "String (Stringified JSON with source JS code for fetching access token, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",
  "refreshtokencode": "String (Stringified JSON with source JS code for refreshing access token, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",
  "revokeapicode": "String (Stringified JSON with source JS code for revoking token, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",
  "testcode": "String (Stringified JSON with source JS code for testing the connection, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",

  "connectionlabelkey": "String (Field name used as connection label, e.g., \"ClientId\")",
  "connectionlabelvalue": "String (JS expression to resolve connection label value, e.g., \"context.authData?.clientid\")",
  "_connectionlabelvalue": "String (Template string version of connection label value, e.g., \"${context.authData?.clientid}\")",
  "isconnectionlabelmasked": "Boolean (Whether connection label value is masked, e.g., true)",

  "iconurlpath": "String (URL path for the service icon, e.g., \"ASDFGH\")",

  "whitelistdomains": "Array (List of whitelisted domains, e.g., [\"arcsite.com\", \"www.arcsite.com\"])",
  "isbuiltinplugin": "Boolean (Whether this is a built-in plugin, e.g., false)",

  "uniquekeytostoreauth": {
    "uniqueKey": "String (JS expression used as unique key to store auth, e.g., \"context?.authData?.clientid\")",
    "_uniqueKey": "String (Template string version of unique key, e.g., \"${context?.authData?.clientid}\")"
  },

  "authenticationpaths": {
    "headers": [
      {
        "name": "String (Header name, e.g., \"Authorization\")",
        "value": "String (JS code returning the header value)"
      }
    ],
    "queryParams": [
      {
        "name": "String (Query param name, e.g., \"api_key\")",
        "value": "String (JS code returning the query param value)"
      }
    ],
    "body": [
      {
        "name": "String (Body param name, e.g., \"name\")",
        "value": "String (JS code returning the body param value)"
      }
    ]
  },
  "skipwhitelistvalidation": "null (Whether to skip whitelist validation; null if not set)"
}
```

#### Password Credentials Update TOON Schema

```toon
componentToRender: String ('authfields' | 'auth2Credentials' | 'accesstokencode' | 'refreshtokencode' | 'revokeapicode' | 'testcode' | 'connectionLabel' | 'iconUrlPath' | 'authUniqueKey' | 'appeandHeaders')
isScopeSeperatorChanged: Boolean
granttype: String ('Password Credentials')
clientid: String
clientsecret: String
authfields: Object
  - authentication: Object
    - type: String ('Auth2.0')
    - fields: Array of FieldObjects
      - key: String
      - label: String
      - type: String ('string' | 'password' | 'dropdown')
      - value: String
      - help: String (can be empty)
      - placeholder: String
      - required: Boolean
      - visibilityCondition: String (JS code)
      - source: String (dropdown only; JS code returning options)
      - children: Array of OptionObjects (dropdown only)
        - label: String
        - value: String
        - sample: String
accesstokencode: String (stringified JSON with source JS)
refreshtokencode: String (stringified JSON with source JS)
revokeapicode: String (stringified JSON with source JS)
testcode: String (stringified JSON with source JS)
connectionlabelkey: String
connectionlabelvalue: String (JS expression)
_connectionlabelvalue: String (templated version)
isconnectionlabelmasked: Boolean
iconurlpath: String
whitelistdomains: Array of Strings
isbuiltinplugin: Boolean
uniquekeytostoreauth: Object
  - uniqueKey: String (JS expression)
  - _uniqueKey: String (templated version of uniqueKey)
authenticationpaths: Object
  - headers: Array of PathObjects
    - name: String
    - value: String (JS code)
  - queryParams: Array of PathObjects
    - name: String
    - value: String (JS code)
  - body: Array of PathObjects
    - name: String
    - value: String (JS code)
skipwhitelistvalidation: null (null if not set)
```

## 3.3. Auth1.0 Update Schema

### Auth1.0 Update JSON Schema

```json
{
  "componentToRender": "String (Which component to render, e.g., \"authfields\" | \"auth2Credentials\" | \"auth1Urls\" | \"testcode\" | \"connectionLabel\" | \"iconUrlPath\" | \"authUniqueKey\" | \"appeandHeaders\")",
  "isScopeSeperatorChanged": "Boolean (Whether scope separator was changed, e.g., false)",

  "type": "String (Authentication type identifier, e.g., \"Auth1\")",
  "redirecturl": "String (OAuth redirect URL, e.g., \"https://auth.viasocket.com/redirect/auth1\")",
  "granttype": "null (Grant type; null for Auth1.0 flow)",
  "isconnectionlabelmasked": "null (Whether connection label is masked; null if not set)",

  "clientid": "String (OAuth client ID / consumer key, e.g., \"123\")",
  "clientsecret": "String (OAuth client secret / consumer secret, e.g., \"123456543\")",

  "authfields": {
    "authentication": {
      "type": "String (Authentication type, e.g., \"Auth1.0\")",
      "fields": "Array (Auth field definitions; empty array if none, e.g., [])"
    }
  },

  "auth1parameters": {
    "requestTokenUrl": "String (URL to obtain request token, e.g., \"https://api.example.com/oauth/request_token\")",
    "authorizeUrl": "String (URL to redirect user for authorization, e.g., \"https://api.example.com/oauth/authorize\")",
    "accessTokenUrl": "String (URL to exchange for access token, e.g., \"https://api.example.com/oauth/access_token\")",
    "signatureMethod": "String (OAuth1.0 signature method, e.g., \"HMAC-SHA1\")"
  },

  "testcode": "String (Stringified JSON with source JS code for testing the connection, e.g., \"{\\\"source\\\":\\\"...\\\"}\")",

  "connectionlabelkey": "String (Field name used as connection label, e.g., \"ClientId\")",
  "connectionlabelvalue": "String (JS expression to resolve connection label value, e.g., \"context?.authData?.clientid\")",
  "_connectionlabelvalue": "String (Template string version of connection label value, e.g., \"${context?.authData?.clientid}\")",
  "isconnectionlabelmasked": "Boolean (Whether connection label value is masked, e.g., true)",

  "iconurlpath": "String (URL path for the service icon, e.g., \"\")",
  "whitelistdomains": "Array (List of whitelisted domains, e.g., [\"arcsite.com\", \"www.arcsite.com\"])",
  "isbuiltinplugin": "Boolean (Whether this is a built-in plugin, e.g., false)",

  "uniquekeytostoreauth": {
    "uniqueKey": "String (JS expression used as unique key to store auth, e.g., \"context?.authData?.consumerkey\")",
    "_uniqueKey": "String (Template string version of unique key, e.g., \"${context?.authData?.consumerkey}\")"
  },

  "authenticationpaths": {
    "headers": [
      {
        "name": "String (Header name, e.g., \"Authorization\")",
        "value": "String (JS code returning the header value)"
      }
    ],
    "queryParams": [
      {
        "name": "String (Query param name, e.g., \"Query params\")",
        "value": "String (JS code returning the query param value)"
      }
    ],
    "body": [
      {
        "name": "String (Body param name, e.g., \"body params\")",
        "value": "String (JS code returning the body param value)"
      }
    ]
  },
  "skipwhitelistvalidation": "null (Whether to skip whitelist validation; null if not set)"
}
```

### Auth1.0 Update TOON Schema

```toon
componentToRender: String ('authfields' | 'auth2Credentials' | 'auth1Urls' | 'testcode' | 'connectionLabel' | 'iconUrlPath' | 'authUniqueKey' | 'appeandHeaders')
isScopeSeperatorChanged: Boolean
type: String ('Auth1')
redirecturl: String ('https://auth.viasocket.com/redirect/auth1')
granttype: null (null for Auth1.0 flow)
isconnectionlabelmasked: null (null if not set) [see note: field re-declared below as Boolean]
clientid: String (consumer key)
clientsecret: String (consumer secret)
authfields: Object
  - authentication: Object
    - type: String ('Auth1.0')
    - fields: Array (empty array if none)
auth1parameters: Object
  - requestTokenUrl: String
  - authorizeUrl: String
  - accessTokenUrl: String
  - signatureMethod: String (e.g. 'HMAC-SHA1')
testcode: String (stringified JSON with source JS)
connectionlabelkey: String
connectionlabelvalue: String (JS expression)
_connectionlabelvalue: String (templated version)
isconnectionlabelmasked: Boolean [see note: field first declared above as null]
iconurlpath: String
whitelistdomains: Array of Strings
isbuiltinplugin: Boolean
uniquekeytostoreauth: Object
  - uniqueKey: String (JS expression)
  - _uniqueKey: String (templated version of uniqueKey)
authenticationpaths: Object
  - headers: Array of PathObjects
    - name: String
    - value: String (JS code)
  - queryParams: Array of PathObjects
    - name: String
    - value: String (JS code)
  - body: Array of PathObjects
    - name: String
    - value: String (JS code)
skipwhitelistvalidation: null (null if not set)
```

---

---
type: page
title: "Connection Worked Examples Knowledge Base"
description: "Real-world worked examples of viaSocket plug connections across authentication types (OAuth 2.0 Authorization Code, Client Credentials, Subdomain formatting, Multi-datacenter, Short-to-long token exchange). Companion to dh-connection-kb.md, dh-connection-practice.md, and dh-connection-schema.md."
published: true
---

# Page Index

- Overview & Core Patterns
- Example 1: Salesforce (Dynamic Environment Dropdown + PKCE + Token Expiry)
- Example 2: Trello (Atlassian OAuth 2.0 + Error Normalization)
- Example 3: Zoho CRM (Multi-Datacenter Domain Selector + Custom Header + Revoke)
- Example 4: Commerce Layer (Client Credentials with Subdomain & Manual App Credentials)
- Example 5: Shopify (Custom Header X-Shopify-Access-Token + Dynamic Store Name)
- Example 6: Fourthwall (Subdomain UI Formatting with scheme & tld + Dynamic authrequrl)
- Example 7: Facebook Lead Ads (Short-to-Long Token Exchange + Debug Token + Profile Avatar)
- Example 8: Instagram for Business (Short-to-Long Token + Query Parameter Auth Injection)
- Example 9: Google Sheets (Google OAuth 2.0 + URLSearchParams + Avatar Icon)

---

# Overview & Core Patterns

This document captures production-grade connection records from the viaSocket Developer Hub. These real-world examples illustrate specialized patterns that AI builders and reviewers must replicate:

1. **Dynamic Pre-Auth Field Mapping in `authrequrl`**:
   When a service endpoint depends on an account-specific identifier (e.g. `subdomain`, `shop`, `environment`, `domain`), collect it upfront via `authfields` and interpolate it dynamically into `authrequrl`, `testcode`, and token exchange code via `${context.authData.<fieldKey>}`.
2. **Subdomain Input Formatting (`scheme` and `tld`)**:
   For subdomain fields, specify `"scheme": "https"` and `"tld": "<domain.com>"` inside `authfields.authentication.fields`. The Developer Hub UI renders `https://` as a visual prefix and `.<domain.com>` as a suffix around the input box, preventing users from accidentally entering full URLs.
3. **Multi-Environment / Multi-Datacenter Selector**:
   For services operating across distinct environments (Production vs. Sandbox) or regional datacenters (US, EU, IN, AU, etc.), provide a pre-auth `dropdown` in `authfields` whose selected value resolves the API host dynamically.
4. **Custom Auth Injection Formats**:
   - Standard: `Authorization: Bearer <token>`
   - Custom Header Prefix: `Authorization: Zoho-oauthtoken <token>` (Zoho)
   - Custom Header Key: `X-Shopify-Access-Token: <token>` (Shopify)
   - Query Parameter Injection: `queryParams: [{ name: "access_token", value: ... }]` (Instagram Graph API)
5. **Short-to-Long-Lived Token Exchange**:
   For providers returning short-lived tokens on code exchange (e.g. Meta Graph API for Facebook and Instagram), `accesstokencode` executes a two-step exchange (`grant_type=authorization_code` followed immediately by `grant_type=fb_exchange_token` or `ig_exchange_token`) before returning the final long-lived token.
6. **Dynamic Connection Icons (`iconurlpath`)**:
   Extract user avatar or workspace photo URLs from `context?.authData?.testcode` to personalize the connection in the viaSocket UI.

---

# Example 1: Salesforce (Dynamic Environment Dropdown + PKCE + Token Expiry)

### Highlights:
- **Environment Selector**: Pre-auth dropdown field `environment` allows users to select `"Production"` (`login`) or `"Sandbox"` (`test`).
- **Dynamic Authorization URL**: Interpolates environment: `https://${context?.authData?.environment}.salesforce.com/services/oauth2/authorize`.
- **PKCE Support**: Includes `code_challenge` and `code_challenge_method: "S256"` in `queryparams`.
- **Token Expiry Normalization**: Hardcodes `response.data.expires_in = 7200;` before returning in both access token and refresh token code.

```json
{
  "rowid": "rowtq4vktrg3",
  "pluginrecordid": "row6dq7roqe6",
  "pluginname": "Salesforce",
  "domain": "salesforce.com",
  "type": "Auth2.0",
  "granttype": "Authorization Code",
  "authversion": "V2",
  "redirecturl": "https://auth.viasocket.com/redirect/auth2.0",
  "clientid": "",
  "clientsecret": "",
  "authrequrl": "https://${context?.authData?.environment}.salesforce.com/services/oauth2/authorize",
  "queryparams": "{\"code_challenge\":\"BUs9E4BIvEq1wUjNsbaxxec-LymONPPila64dOXkERE\",\"response_type\":\"code\",\"code_challenge_method\":\"S256\"}",
  "scopeseperatedby": "space",
  "isconnectionlabelmasked": false,
  "authfields": {
    "authentication": {
      "type": "Auth2.0",
      "fields": [
        {
          "key": "environment",
          "help": "",
          "type": "dropdown",
          "label": "Salesforce Environment",
          "value": "",
          "source": "return [\n    {\n        label: \"Production\",\n        value:\"login\"\n       \n    },\n    {\n        label: \"Sandbox\",\n        value:\"test\"\n        \n    }\n    ]",
          "children": [
            { "label": "Production", "value": "login" },
            { "label": "Sandbox", "value": "test" }
          ],
          "required": true,
          "placeholder": "Your Environment"
        }
      ]
    }
  },
  "accesstokencode": "{\"source\":\"async function generateAccessToken() {\\n    try {\\n        const response = await axios.post(`https://${context?.authData?.environment}.salesforce.com/services/oauth2/token`, null, {\\n            params: {\\n                grant_type: 'authorization_code',\\n                client_id: context.authData.clientid,\\n                client_secret: context.authData.clientsecret,\\n                redirect_uri: context.authData.redirecturl,\\n                code: context.authData.Authorization.code,\\n                code_verifier: \\\"Gn3oQarnjPBNh_IAj3lCx7r9TV4Kv_PMSzHF-DmfCWE\\\"\\n            }\\n        });\\n\\n        // Adding the expires_in field as hardcoded value\\n        response.data.expires_in = 7200;\\n\\n        return response.data;\\n    } catch (error) {\\n        throw error;\\n    }\\n};\\n\\nreturn await generateAccessToken();\\n\"}",
  "refreshtokencode": "{\"source\":\"async function refreshToken() {\\n    try {\\n        const response = await axios.post(`https://${context?.authData?.environment}.salesforce.com/services/oauth2/token`, null, {\\n            params: {\\n                grant_type: 'refresh_token',\\n                client_id: context.authData.clientid,\\n                client_secret: context.authData.clientsecret,\\n                refresh_token: context.authData.accesstokencode.refresh_token\\n            }\\n        });\\n\\n        // Adding the expires_in field as hardcoded value\\n        response.data.expires_in = 7200;\\n\\n        return response.data;\\n    } catch (error) {\\n        throw error;\\n    }\\n};\\n\\nreturn await refreshToken();\\n\"}",
  "testcode": "{\"source\":\"\\ntry {\\n  let config = {\\n    method: 'get',\\n    maxBodyLength: Infinity,\\n    url: `https://${context?.authData?.environment}.salesforce.com/services/oauth2/userinfo`,\\n    headers: { \\n      'Content-Type': 'application/json', \\n      'Authorization': `Bearer ${context.authData?.accesstokencode?.access_token}`, \\n    }\\n  };\\n\\n  const response = await axios.request(config);\\n  return response.data;\\n} catch (error) {\\n  \\n  throw error\\n}\\n\"}",
  "authenticationpaths": {
    "body": [],
    "headers": [
      {
        "name": "Authorization",
        "value": "function returnHeaders() { return `Bearer ${context.authData?.accesstokencode?.access_token}` } return returnHeaders()"
      },
      {
        "name": "Content-Type",
        "value": "return 'application/json'"
      }
    ],
    "queryParams": []
  },
  "connectionlabelkey": "Name",
  "connectionlabelvalue": "context.authData?.testcode?.name",
  "_connectionlabelvalue": "${context.authData?.testcode?.name}",
  "whitelistdomains": ["salesforce.com", "*"]
}
```

---

# Example 2: Trello (Atlassian OAuth 2.0 + Error Normalization)

### Highlights:
- **Centralized Atlassian OAuth**: Authenticates via `https://auth.atlassian.com/authorize` with `read:member:trello read:board:trello write:board:trello read:organization:trello offline_access`.
- **Descriptive Error Throwing**: Catch block extracts `error.response?.data?.error_description || error.response?.data?.error || error.message`.
- **Lightweight Test API**: Requests specific fields via `params: { fields: 'id,username,fullName,email' }` to minimize payload size.
- **Connection Label**: Mapped to member email: `context?.authData?.testcode?.email`.

```json
{
  "rowid": "rowusebm60il",
  "pluginrecordid": "row7k0hsbkvb",
  "pluginname": "Trello",
  "domain": "trello.com",
  "type": "Auth2.0",
  "granttype": "Authorization Code",
  "authversion": "V25",
  "redirecturl": "https://auth.viasocket.com/redirect/auth2.0",
  "clientid": "",
  "clientsecret": "",
  "authrequrl": "https://auth.atlassian.com/authorize",
  "queryparams": "{\"scope\":\"read:member:trello read:board:trello write:board:trello read:organization:trello offline_access\",\"response_type\":\"code\",\"prompt\":\"consent\",\"code_challenge_method\":\"S256\"}",
  "scopeseperatedby": "space",
  "isconnectionlabelmasked": false,
  "authfields": {
    "authentication": {
      "type": "Auth2.0",
      "fields": []
    }
  },
  "accesstokencode": "{\"source\":\"async function getAccessToken() {\\n  try {\\n    const response = await axios.post('https://auth.atlassian.com/oauth/token', {\\n      grant_type: 'authorization_code',\\n      client_id: context?.authData?.clientid,\\n      client_secret: context?.authData?.clientsecret,\\n      code: context?.authData?.Authorization?.code,\\n      redirect_uri: context?.authData?.redirecturl,\\n      code_verifier: context?.authData?.code_verifier\\n    });\\n\\n    return response.data;\\n  } catch (error) {\\n    throw new Error(error.response?.data?.error_description || error.response?.data?.error || error.message);\\n  }\\n}\\n\\nreturn await getAccessToken();\"}",
  "refreshtokencode": "{\"source\":\"async function refreshAccessToken() {\\n  try {\\n    const response = await axios.post('https://auth.atlassian.com/oauth/token', {\\n      grant_type: 'refresh_token',\\n      client_id: context?.authData?.clientid,\\n      client_secret: context?.authData?.clientsecret,\\n      refresh_token: context?.authData?.accesstokencode?.refresh_token\\n    });\\n\\n    return response.data;\\n  } catch (error) {\\n    throw new Error(error.response?.data?.error_description || error.response?.data?.error || error.message);\\n  }\\n}\\n\\nreturn await refreshAccessToken();\"}",
  "testcode": "{\"source\":\"async function testcode() {\\n  try {\\n    const response = await axios.get('https://api.trello.com/1/members/me', {\\n      params: { fields: 'id,username,fullName,email' },\\n      headers: {\\n        Authorization: `Bearer ${context?.authData?.accesstokencode?.access_token}`\\n      }\\n    });\\n\\n    return response.data;\\n  } catch (error) {\\n    throw error;\\n  }\\n}\\n\\nreturn await testcode();\"}",
  "authenticationpaths": {
    "body": [],
    "headers": [
      {
        "name": "Authorization",
        "value": "function returnHeaders() {\n  return `Bearer ${context?.authData?.accesstokencode?.access_token}`;\n}\n\nreturn returnHeaders();"
      }
    ],
    "queryParams": []
  },
  "connectionlabelkey": "Username",
  "connectionlabelvalue": "context?.authData?.testcode?.email",
  "_connectionlabelvalue": "${context?.authData?.testcode?.email}",
  "whitelistdomains": ["trello.com"]
}
```

---

# Example 3: Zoho CRM (Multi-Datacenter Domain Selector + Custom Header + Revoke)

### Highlights:
- **Regional Datacenter Dropdown**: Pre-auth dropdown `domain` supports `.com`, `.in`, `.eu`, `.com.au`, `.com.cn`, `zohocloud.ca`, `.sa`, `.jp`, and `.ae`.
- **Dynamic Auth and API Hosts**: Both authorization URL (`accounts.zoho.${context.authData.domain}/oauth/v2/auth`) and CRM API calls (`www.zohoapis.${context.authData.domain}`) interpolate the selected datacenter.
- **Custom Auth Header Prefix**: Headers use `Authorization: Zoho-oauthtoken <token>` instead of the default `Bearer <token>`.
- **Revoke Token API**: Implements token revocation via `POST https://accounts.zoho.${context.authData.domain}/oauth/v2/token/revoke?token=...`.
- **Connection Label Array Access**: Maps from array response: `context?.authData?.testcode?.[0]?.email`.

```json
{
  "rowid": "rowctdv6zolu",
  "pluginrecordid": "row40nchn9gf",
  "pluginname": "Zoho CRM",
  "domain": "zoho.com",
  "type": "Auth2.0",
  "granttype": "Authorization Code",
  "authversion": "V20",
  "redirecturl": "https://auth.viasocket.com/redirect/auth2.0",
  "clientid": "",
  "clientsecret": "",
  "authrequrl": "https://accounts.zoho.${context.authData.domain}/oauth/v2/auth",
  "queryparams": "{\"scope\":\"ZohoCRM.modules.ALL ZohoCRM.modules.notes.ALL ZohoCRM.org.ALL ZohoCRM.settings.ALL ZohoCRM.settings.READ ZohoCRM.settings.fields.READ ZohoCRM.settings.modules.ALL ZohoCRM.settings.modules.READ ZohoCRM.users.ALL\",\"response_type\":\"code\",\"access_type\":\"offline\"}",
  "scopeseperatedby": "space",
  "authfields": {
    "authentication": {
      "type": "Auth2.0",
      "fields": [
        {
          "key": "domain",
          "help": "Select the domain your Zoho account belongs to.",
          "type": "dropdown",
          "label": "Domain",
          "value": "",
          "children": [
            { "label": "zoho.com", "value": "com", "sample": "com" },
            { "label": "zoho.au", "value": "com.au", "sample": "au" },
            { "label": "zoho.in", "value": "in", "sample": "in" },
            { "label": "zoho.eu", "value": "eu", "sample": "eu" },
            { "label": "zoho.com.cn", "value": "com.cn", "sample": "cn" },
            { "label": "zohocloud.ca", "value": "zohocloud.ca", "sample": "ca" },
            { "label": "zoho.sa", "value": "sa", "sample": "sa" },
            { "label": "zoho.jp", "value": "jp", "sample": "jp" },
            { "label": "UAE", "value": ".ae", "sample": ".ae" }
          ],
          "required": true
        }
      ]
    }
  },
  "accesstokencode": "{\"source\":\"try {\\n  let data = {\\n    'client_id': context.authData?.clientid,\\n    'client_secret': context.authData?.clientsecret,\\n    'code': context?.authData?.Authorization?.code,\\n    'redirect_uri': context?.authData?.redirecturl,\\n    'grant_type': 'authorization_code' \\n  }\\n  let config = {\\n    method: 'post',\\n    maxBodyLength: Infinity,\\n    url: `https://accounts.zoho.${context.authData.domain}/oauth/v2/token`,\\n    headers: { \\n      'Content-Type': 'application/x-www-form-urlencoded'\\n    },\\n    data: data\\n  };\\n  const res = await axios.request(config)\\n  return res.data\\n} catch (error) {\\n  throw error\\n}\"}",
  "refreshtokencode": "{\"source\":\"try {\\n  let data = {\\n    'client_id': context.authData?.clientid,\\n    'client_secret': context.authData?.clientsecret,\\n    'refresh_token': context?.authData?.accesstokencode?.refresh_token,\\n    'grant_type': 'refresh_token' \\n  }\\n  let config = {\\n    method: 'post',\\n    maxBodyLength: Infinity,\\n    url: `https://accounts.zoho.${context.authData.domain}/oauth/v2/token`,\\n    headers: { \\n      'Content-Type': 'application/x-www-form-urlencoded'\\n    },\\n    data: data\\n  };\\n  const res = await axios.request(config)\\n  return res.data\\n} catch (error) {\\n  throw error\\n}\"}",
  "revokeapicode": "{\"source\":\"let config = {\\n  method: 'post',\\n  maxBodyLength: Infinity,\\n  url: `https://accounts.zoho.${context.authData.domain}/oauth/v2/token/revoke?token=${context?.authData?.accesstokencode?[\\\"access_token\\\"]}`,\\n  headers: { \\n    'Content-Type': 'application/x-www-form-urlencoded', \\n  },\\n};\\n\\nconst response = await axios.request(config)\\nreturn response.data\\n\\n\"}",
  "testcode": "{\"source\":\"try {\\n  let config = {\\n    method: 'get',\\n    maxBodyLength: Infinity,\\n    url: `https://www.zohoapis.${context.authData.domain}/crm/v2/users?type=AllUsers`,\\n    headers: { \\n      'Authorization': `Zoho-oauthtoken ${context?.authData?.accesstokencode?.access_token}`\\n    }\\n  };\\n  const response = await axios.request(config)\\n  return response.data.users\\n} catch (error) {\\n  throw error\\n}\"}",
  "authenticationpaths": {
    "body": [],
    "headers": [
      {
        "name": "Authorization",
        "value": "return `Zoho-oauthtoken ${context?.authData?.accesstokencode?.access_token}`"
      }
    ],
    "queryParams": []
  },
  "connectionlabelkey": "Email",
  "connectionlabelname": "Email",
  "connectionlabelvalue": "context?.authData?.testcode?.[0]?.email",
  "_connectionlabelvalue": "${context?.authData?.testcode?.[0]?.email}",
  "whitelistdomains": [
    "crm.zoho.com",
    "zoho.com",
    "www.zohoapis.com",
    "zohoapis.com",
    "zohoapis.zoho",
    "zohoapis.in",
    "zohoapis.au",
    "zohoapis.eu",
    "zohoapis.sa",
    "zoho.in"
  ]
}
```

---

# Example 4: Commerce Layer (Client Credentials with Subdomain & Manual App Credentials)

### Highlights:
- **Client Credentials Flow**: Uses `granttype: "Client Credentials"`. No redirect/consent screens.
- **Manual Client ID & Secret in `authfields`**: Uses `type: "password"` fields with documentation links and sample placeholders.
- **Tenant Subdomain Input**: Custom pre-auth `subdomain` string field.
- **Refresh Pattern in Client Credentials**: In client credentials, refresh token simply re-requests the access token using the stored client credentials.
- **Token Revocation**: Implements client-credentials token revoke via `POST https://auth.commercelayer.io/oauth/revoke`.

```json
{
  "rowid": "rowekwvyxxbh",
  "pluginrecordid": "rowdqo4cwijq",
  "pluginname": "Commerce Layer",
  "domain": "commercelayer.io",
  "type": "Auth2.0",
  "granttype": "Client Credentials",
  "authversion": "V2",
  "redirecturl": "https://auth.viasocket.com/redirect/auth2.0",
  "clientid": "",
  "clientsecret": "",
  "authfields": {
    "authentication": {
      "type": "Auth2.0",
      "fields": [
        {
          "key": "clientid",
          "help": "Enter client ID here. You can find in your commerce-layer developer setting [Learn more](https://docs.commercelayer.io/core/api-credentials).",
          "type": "password",
          "label": "Client ID",
          "required": true,
          "placeholder": "E.g., d_Y8CKDxxxxxxxxxxxxxxxxx"
        },
        {
          "key": "clientsecret",
          "help": "Enter client secret here. You can find in your commerce-layer developer setting [Learn more](https://docs.commercelayer.io/core/api-credentials).",
          "type": "password",
          "label": "Client Secret",
          "required": true,
          "placeholder": "E.g., _GwaPGgfwxxxxxxxxxxxxxxxxxxxxxxx"
        },
        {
          "key": "subdomain",
          "help": "You can find it in your Commerce Layer dashboard URL.\nExample:\nhttps://dashboard.commercelayer.io/test/viasocket\nIn this example, `viasocket` is the subdomain.",
          "type": "string",
          "label": "Subdomain",
          "required": true,
          "placeholder": "Your subdomain"
        }
      ]
    }
  },
  "accesstokencode": "{\"source\":\"try {\\n  const Access_Token_Api_Url = 'https://auth.commercelayer.io/oauth/token';\\n  const data = {\\n    grant_type: 'client_credentials',\\n    client_id: context?.authData?.clientid,\\n    client_secret: context?.authData?.clientsecret,\\n    scope: \\\"market:all\\\"\\n  };\\n  const headers = {\\n    'Accept': 'application/json',\\n    'Content-Type': 'application/json'\\n  };\\n  const response = await axios.post(Access_Token_Api_Url, data, { headers });\\n  return response?.data;\\n} catch (e) {\\n  throw e;\\n}\\n\"}",
  "refreshtokencode": "{\"source\":\"try {\\n  const Access_Token_Api_Url = 'https://auth.commercelayer.io/oauth/token';\\n  const data = {\\n    grant_type: 'client_credentials',\\n    client_id: context?.authData?.clientid,\\n    client_secret: context?.authData?.clientsecret\\n  };\\n  const headers = {\\n    'Accept': 'application/json',\\n    'Content-Type': 'application/json'\\n  };\\n  const response = await axios.post(Access_Token_Api_Url, data, { headers });\\n  return response?.data;\\n} catch (e) {\\n  throw e;\\n}\\n\"}",
  "revokeapicode": "{\"source\":\"try {\\n  const Revoke_Token_Api_Url = 'https://auth.commercelayer.io/oauth/revoke';\\n  const data = {\\n    client_id: context?.authData?.clientid,\\n    client_secret: context?.authData?.clientsecret,\\n    token: context?.authData?.accesstokencode?.access_token\\n  };\\n  const headers = {\\n    'Accept': 'application/json',\\n    'Content-Type': 'application/json'\\n  };\\n  const response = await axios.post(Revoke_Token_Api_Url, data, { headers });\\n  if (response.status === 200) {\\n    return { success: true, message: \\\"Token revoked successfully\\\" };\\n  }\\n} catch (error) {\\n  throw error;\\n}\\n\"}",
  "testcode": "{\"source\":\"try{\\n  const Test_Api_Url = `https://${context.authData.subdomain}.commercelayer.io/api/markets`\\n  const response = await axios.get(Test_Api_Url, {\\n    headers: {\\n      Authorization: `Bearer ${context?.authData?.accesstokencode?.access_token}`,\\n      'Content-Type':'application/json'\\n    }\\n  });\\n  return response.data\\n}catch(e){\\n  throw e\\n}\\n\"}",
  "authenticationpaths": {
    "body": [],
    "headers": [
      {
        "name": "Authorization",
        "value": "function returnAuthorization(){ return `Bearer ${context?.authData?.accesstokencode?.access_token}`} return returnAuthorization()"
      }
    ],
    "queryParams": []
  },
  "connectionlabelkey": "subdomain",
  "connectionlabelvalue": "context?.authData?.subdomain",
  "_connectionlabelvalue": "${context?.authData?.subdomain}",
  "whitelistdomains": ["commercetools.com", "commercelayer.io"]
}
```

---

# Example 5: Shopify (Custom Header X-Shopify-Access-Token + Dynamic Store Name)

### Highlights:
- **Dynamic Store Name (`shop`)**: Asks the user for their shop name upfront (e.g. `viaSocket`).
- **Dynamic `authrequrl`**: `https://${context.authData.shop}.myshopify.com/admin/oauth/authorize`.
- **Custom Header Injection**: Shopify requires `X-Shopify-Access-Token: <token>` instead of `Authorization: Bearer <token>`.
- **Unique Key to Store Auth**: Uses `context?.authData?.testcode?.shop?.id` in `uniquekeytostoreauth` to prevent duplicate shop connections.
- **Offline Access**: Requests `access_type: "offline"` to receive permanent offline tokens (no refresh token required).

```json
{
  "rowid": "rowmx2cq0t45",
  "pluginrecordid": "rowyvmqz30q7",
  "pluginname": "Shopify",
  "domain": "shopify.com",
  "type": "Auth2.0",
  "granttype": "Authorization Code",
  "authversion": "v5",
  "redirecturl": "https://auth.viasocket.com/redirect/auth2.0/b08574922d8763c17862e43fd8b6a9ff",
  "clientid": "",
  "clientsecret": "",
  "authrequrl": "https://${context.authData.shop}.myshopify.com/admin/oauth/authorize",
  "queryparams": "{\"scope\":\"read_fulfillments,read_customers,read_orders,write_fulfillments,write_customers,write_assigned_fulfillment_orders,write_merchant_managed_fulfillment_orders,write_discounts,write_draft_orders,write_inventory,read_locations,write_products,write_orders,read_products\",\"access_type\":\"offline\",\"prompt\":\"consent\",\"use_legacy_install_flow\":\"true\",\"nonce\":\"\"}",
  "scopeseperatedby": "comma",
  "needsdynamicdata": true,
  "authfields": {
    "authentication": {
      "type": "Auth2.0",
      "fields": [
        {
          "key": "shop",
          "help": "You can find your store name directly in your Shopify admin URL.\nFor example, in https://admin.shopify.com/store/viaSocket, viaSocket is your store name.",
          "type": "string",
          "label": "Store Name",
          "required": true,
          "placeholder": "Enter Your Store Name"
        }
      ]
    }
  },
  "accesstokencode": "{\"source\":\"try {\\n    let data = {\\n      'client_id': `${context?.authData?.clientid}`,\\n      'client_secret':`${context?.authData?.clientsecret}`,\\n      'code': `${context?.authData?.Authorization?.code}`,\\n      'access_type' : 'offline'\\n    };\\n    let config = {\\n      method: 'post',\\n      maxBodyLength: Infinity,\\n      url: `https://${context.authData.shop}.myshopify.com/admin/oauth/access_token`,\\n      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },\\n      data: data\\n    };\\n    const response = await axios.request(config);\\n    return { \\\"access_token\\\": response.data.access_token };\\n} catch(error) {\\n    throw error;\\n}\"}",
  "refreshtokencode": "{\"source\":\"\"}",
  "testcode": "{\"source\":\"let config = {\\n  method: 'get',\\n  maxBodyLength: Infinity,\\n  url: `https://${context?.authData?.shop}.myshopify.com/admin/api/2024-01/shop.json`,\\n  headers: {\\n    'X-Shopify-Access-Token': `${context?.authData?.accesstokencode?.access_token}`\\n  }\\n};\\nconst response = await axios.request(config);\\nreturn response.data;\"}",
  "authenticationpaths": {
    "body": [],
    "headers": [
      {
        "name": "X-Shopify-Access-Token",
        "value": "return context?.authData?.accesstokencode?.access_token"
      },
      {
        "name": "Content-Type",
        "value": "return 'application/json'"
      }
    ],
    "queryParams": []
  },
  "uniquekeytostoreauth": {
    "uniqueKey": "context?.authData?.testcode?.shop?.id",
    "_uniqueKey": "${context?.authData?.testcode?.shop?.id}"
  },
  "connectionlabelkey": "Shop",
  "connectionlabelname": "Email",
  "connectionlabelvalue": "context?.authData?.shop",
  "_connectionlabelvalue": "${context?.authData?.shop}",
  "whitelistdomains": [
    "https://www.shopify.com",
    "myshopify.com",
    "shopify.com"
  ]
}
```

---

# Example 6: Fourthwall (Subdomain UI Formatting with `scheme` & `tld` + Dynamic `authrequrl`)

### Highlights:
- **Subdomain Input Formatting (`scheme` and `tld`)**: The pre-auth field specifies `"scheme": "https"` and `"tld": "fourthwall.com"`. In the Developer Hub UI, the input automatically displays `https://` on the left and `.fourthwall.com` on the right, ensuring clean subdomain slug collection without protocol/domain clutter.
- **Special `authrequrl` Subdomain Mapping**: Maps directly to: `https://${context.authData.subdomain}.fourthwall.com/admin/platform-apps/a.045c9ea0-ceb0-4bb5-bf5c-fcfc756c4bff/connect`.
- **Form-Encoded Token Payloads**: Serializes form-encoded strings using `encodeURIComponent(context?.authData?.redirecturl)`.
- **Label Mapping**: Identifies connection using the store subdomain: `context?.authData?.subdomain`.

```json
{
  "rowid": "rowkipkjpgjh",
  "pluginrecordid": "row5pbtfh0sk",
  "pluginname": "Fourthwall",
  "domain": "fourthwall.com",
  "type": "Auth2.0",
  "granttype": "Authorization Code",
  "authversion": "V3",
  "redirecturl": "https://auth.viasocket.com/redirect/auth2.0",
  "clientid": "",
  "clientsecret": "",
  "authrequrl": "https://${context.authData.subdomain}.fourthwall.com/admin/platform-apps/a.045c9ea0-ceb0-4bb5-bf5c-fcfc756c4bff/connect",
  "queryparams": "{\"scope\":\"order_read\"}",
  "scopeseperatedby": "space",
  "isconnectionlabelmasked": false,
  "authfields": {
    "authentication": {
      "type": "Auth2.0",
      "fields": [
        {
          "key": "subdomain",
          "scheme": "https",
          "tld": "fourthwall.com",
          "help": "Enter your Fourthwall subdomain from the URL after login, For example if the URL is \"https://demo-example-shop.fourthwall.com/admin\", the subdomain is \"demo-example-shop\".",
          "type": "string",
          "label": "Subdomain",
          "required": true,
          "placeholder": "demo-example-shop"
        }
      ]
    }
  },
  "accesstokencode": "{\"source\":\"   try {\\n        const response = await axios({\\n            method: 'post',\\n            url: 'https://api.fourthwall.com/open-api/v1.0/platform/token',\\n            headers: {\\n                'Content-Type': 'application/x-www-form-urlencoded',\\n            },\\n            data: `grant_type=authorization_code&redirect_uri=${encodeURIComponent(context?.authData?.redirecturl)}&client_id=${context?.authData?.clientid}&client_secret=${context?.authData?.clientsecret}&code=${context?.authData?.Authorization?.code}`\\n        });\\n\\n        return response.data;\\n    } catch (error) {\\n        console.error('Error generating access token:', error);\\n        throw error;\\n    }\\n\"}",
  "refreshtokencode": "{\"source\":\"    try {\\n        const response = await axios({\\n            method: 'post',\\n            url: 'https://api.fourthwall.com/open-api/v1.0/platform/token',\\n            headers: {\\n                'Content-Type': 'application/x-www-form-urlencoded',\\n            },\\n            data: `grant_type=refresh_token&client_id=${context?.authData?.clientid}&client_secret=${context?.authData?.clientsecret}&refresh_token=${context?.authData?.accesstokencode?.refresh_token}`\\n        });\\n\\n        return response.data;  // Return the refreshed access token data\\n    } catch (error) {\\n        console.error('Error refreshing access token:', error);\\n        throw error;  // Throw the error for higher-level handling\\n    }\"}",
  "testcode": "{\"source\":\"try \\n{let config = {\\n  method: 'get',\\n  maxBodyLength: Infinity,\\n  url: 'https://api.fourthwall.com/open-api/v1.0/order',\\n  headers: { \\n   'Authorization': `Bearer ${context?.authData?.accesstokencode?.access_token}`\\n  }\\n};\\n\\nconst res = await axios.request(config)\\nreturn res.data \\n}catch(error){\\n  throw error;\\n}\"}",
  "authenticationpaths": {
    "body": [],
    "headers": [
      {
        "name": "Authorization",
        "value": "function returnAuthorization(){ return `Bearer ${context?.authData?.accesstokencode?.access_token}` } return returnAuthorization()"
      }
    ],
    "queryParams": []
  },
  "connectionlabelkey": "subdomain",
  "connectionlabelvalue": "context?.authData?.subdomain",
  "_connectionlabelvalue": "${context?.authData?.subdomain}",
  "whitelistdomains": ["fourthwall.com"]
}
```

---

# Example 7: Facebook Lead Ads (Short-to-Long Token Exchange + Debug Token + Profile Avatar)

### Highlights:
- **Two-Step Token Exchange**: Step 1 exchanges auth code for a short-lived token; Step 2 immediately calls `oauth/access_token?grant_type=fb_exchange_token` to upgrade to a 60-day long-lived token.
- **Scope Inspection via `debug_token`**: Calls `debug_token` to inspect granted permissions and formats them into a normalized comma-separated scope string.
- **Token Refresh via Exchange**: Refreshes long-lived tokens using `fb_exchange_token` with the active token.
- **Dynamic Avatar Icon (`iconurlpath`)**: Dynamically sets connection icon to user profile photo: `"${context?.authData?.testcode?.picture?.data?.url}"`.
- **Connection Label**: Mapped to user full name: `context.authData?.testcode?.name`.

```json
{
  "rowid": "rowfn6drdy9c",
  "pluginrecordid": "rowfq3rhuxox",
  "pluginname": "Facebook Lead Ads",
  "domain": "facebook.com",
  "type": "Auth2.0",
  "granttype": "Authorization Code",
  "authversion": "V12",
  "redirecturl": "https://auth.viasocket.com/redirect/auth2.0",
  "clientid": "",
  "clientsecret": "",
  "authrequrl": "https://www.facebook.com/v25.0/dialog/oauth",
  "queryparams": "{\"scope\":\"business_management,leads_retrieval,pages_manage_ads,pages_manage_metadata,pages_show_list\"}",
  "scopeseperatedby": "comma",
  "isconnectionlabelmasked": false,
  "authfields": {
    "authentication": {
      "type": "Auth2.0",
      "fields": []
    }
  },
  "accesstokencode": "{\"source\":\"let config = {\\n  method: 'get',\\n  maxBodyLength: Infinity,\\n  url: `https://graph.facebook.com/v24.0/oauth/access_token?client_id=${context?.authData?.clientid}&redirect_uri=${context?.authData?.redirecturl}&client_secret=${context?.authData?.clientsecret}&code=${context?.authData?.Authorization?.code}`,\\n  headers: {}\\n};\\n\\ntry {\\n  const shortLivedRes = await axios.request(config);\\n  const shortLivedAccessToken = shortLivedRes.data.access_token;\\n\\n  const longLivedConfig = {\\n    method: 'get',\\n    url: `https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${context?.authData?.clientid}&client_secret=${context?.authData?.clientsecret}&fb_exchange_token=${shortLivedAccessToken}`,\\n    headers: {}\\n  };\\n  const longLivedRes = await axios.request(longLivedConfig);\\n  const longLivedAccessToken = longLivedRes.data.access_token;\\n  const expiresIn = 3599;\\n\\n  const debugTokenConfig = {\\n    method: 'get',\\n    url: `https://graph.facebook.com/v24.0/debug_token?input_token=${longLivedAccessToken}&access_token=${context?.authData?.clientid}|${context?.authData?.clientsecret}`,\\n    headers: {}\\n  };\\n  const debugTokenRes = await axios.request(debugTokenConfig);\\n  const { scopes } = debugTokenRes.data.data;\\n  const scopeString = Array.isArray(scopes) ? scopes.join(',') : 'No scope available';\\n\\n  return {\\n    access_token: longLivedAccessToken,\\n    refresh_token: longLivedAccessToken,\\n    token_type: 'bearer',\\n    expires_in: expiresIn,\\n    scope: scopeString\\n  };\\n} catch (error) {\\n  throw error;\\n}\"}",
  "refreshtokencode": "{\"source\":\"let config = {\\n  method: 'get',\\n  maxBodyLength: Infinity,\\n  url: `https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${context?.authData?.clientid}&client_secret=${context?.authData?.clientsecret}&fb_exchange_token=${context?.authData?.accesstokencode?.refresh_token}`,\\n  headers: {}\\n};\\n\\ntry {\\n  const res = await axios.request(config);\\n  const longLivedAccessToken = res.data.access_token;\\n  const expiresIn = 3599;\\n\\n  const debugTokenConfig = {\\n    method: 'get',\\n    url: `https://graph.facebook.com/v24.0/debug_token?input_token=${longLivedAccessToken}&access_token=${context?.authData?.clientid}|${context?.authData?.clientsecret}`,\\n    headers: {}\\n  };\\n  const debugTokenRes = await axios.request(debugTokenConfig);\\n  const { scopes } = debugTokenRes.data.data;\\n  const scopeString = Array.isArray(scopes) ? scopes.join(',') : 'No scope available';\\n\\n  return {\\n    access_token: longLivedAccessToken,\\n    refresh_token: longLivedAccessToken,\\n    token_type: 'bearer',\\n    expires_in: expiresIn,\\n    scope: scopeString\\n  };\\n} catch (error) {\\n  return { error: error.response?.data || error.message };\\n}\"}",
  "testcode": "{\"source\":\"let config = {\\n  method: 'get',\\n  maxBodyLength: Infinity,\\n  url: 'https://graph.facebook.com/v24.0/me?fields=name,email,picture',\\n  headers: { \\n    'Authorization': `Bearer ${context?.authData?.accesstokencode?.access_token}`\\n  }\\n};\\nconst res = await axios.request(config);\\nreturn res.data;\"}",
  "authenticationpaths": {
    "body": [],
    "headers": [
      {
        "name": "Authorization",
        "value": "return `Bearer ${context?.authData?.accesstokencode?.access_token}`\n\n"
      }
    ],
    "queryParams": []
  },
  "iconurlpath": "${context?.authData?.testcode?.picture?.data?.url}",
  "connectionlabelkey": "Name",
  "connectionlabelname": "Username",
  "connectionlabelvalue": "context.authData?.testcode?.name",
  "_connectionlabelvalue": "${context.authData?.testcode?.name}",
  "whitelistdomains": ["facebook.com"]
}
```

---

# Example 8: Instagram for Business (Short-to-Long Token + Query Parameter Auth Injection)

### Highlights:
- **Two-Step Long-Lived Token Exchange**: Short-lived token is immediately upgraded via `https://graph.instagram.com/access_token?grant_type=ig_exchange_token`.
- **User Profile Enrichment in `accesstokencode`**: After token exchange, calls `https://graph.instagram.com/me?fields=user_id,username,name` and merges `instagram_user_id`, `username`, and `name` into the returned token object.
- **Query Parameter Auth Injection**: Instead of standard Authorization headers, token is passed in `authenticationpaths.queryParams`:
  `[{ "name": "access_token", "value": "function returnAccessToken(){ return context.authData?.accesstokencode.access_token} return returnAccessToken()" }]`.
- **Dynamic Avatar Icon (`iconurlpath`)**: `"${context?.authData?.testcode?.profile_picture_url}"`.
- **Connection Label**: Mapped to Instagram handle: `context.authData?.testcode?.username`.

```json
{
  "rowid": "row2u6h915rb",
  "pluginrecordid": "row0juxct6cb",
  "pluginname": "Instagram for Business",
  "domain": "instagram.com",
  "type": "Auth2.0",
  "granttype": "Authorization Code",
  "authversion": "V1",
  "redirecturl": "https://auth.viasocket.com/redirect/auth2.0",
  "clientid": "",
  "clientsecret": "",
  "authrequrl": "https://www.instagram.com/oauth/authorize",
  "queryparams": "{\"scope\":\"instagram_business_basic,instagram_business_content_publish\",\"response_type\":\"code\",\"enable_fb_login\":\"0\",\"force_authentication\":\"1\"}",
  "scopeseperatedby": "comma",
  "authfields": {
    "authentication": {
      "type": "Auth2.0",
      "fields": []
    }
  },
  "accesstokencode": "{\"source\":\"let data = `client_id=${encodeURIComponent(context.authData?.clientid)}` + `&client_secret=${encodeURIComponent(context.authData?.clientsecret)}` + `&grant_type=authorization_code` + `&redirect_uri=${encodeURIComponent(context.authData?.redirecturl)}` + `&code=${encodeURIComponent(context?.authData?.Authorization?.code)}`;\\n\\nlet config = {\\n  method: 'post',\\n  maxBodyLength: Infinity,\\n  url: 'https://api.instagram.com/oauth/access_token',\\n  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },\\n  data: data\\n};\\n\\ntry {\\n  const response = await axios.request(config);\\n  const shortLivedAccessToken = response.data.access_token;\\n  const clientSecret = context.authData?.clientsecret;\\n\\n  const longLivedTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token` + `&client_secret=${encodeURIComponent(clientSecret)}` + `&access_token=${encodeURIComponent(shortLivedAccessToken)}`;\\n  const longLivedResponse = await axios.get(longLivedTokenUrl);\\n  const longLivedResponseData = longLivedResponse.data;\\n\\n  const meUrl = `https://graph.instagram.com/me?fields=user_id,username,name` + `&access_token=${encodeURIComponent(longLivedResponseData.access_token)}`;\\n  const meResponse = await axios.get(meUrl);\\n\\n  const permissionsArray = response.data.permissions || [];\\n  const scope = permissionsArray.join(',');\\n\\n  return {\\n    ...longLivedResponseData,\\n    scope,\\n    expires_in: 864000,\\n    instagram_user_id: meResponse.data.user_id,\\n    username: meResponse.data.username,\\n    name: meResponse.data.name\\n  };\\n} catch (error) {\\n  throw error;\\n}\\n\"}",
  "refreshtokencode": "{\"source\":\"const longLivedAccessToken = context.authData?.accesstokencode.access_token;\\nconst refreshTokenUrl = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(longLivedAccessToken)}`;\\n\\ntry {\\n  const refreshResponse = await axios.get(refreshTokenUrl);\\n  const refreshedAccessToken = refreshResponse.data.access_token;\\n\\n  const meUrl = `https://graph.instagram.com/me?fields=user_id,username,name&access_token=${encodeURIComponent(refreshedAccessToken)}`;\\n  const meResponse = await axios.get(meUrl);\\n\\n  return {\\n    ...refreshResponse.data,\\n    scope: refreshResponse.data.permissions,\\n    expires_in: 864000,\\n    instagram_user_id: meResponse.data.user_id,\\n    username: meResponse.data.username,\\n    name: meResponse.data.name\\n  };\\n} catch (error) {\\n  throw error;\\n}\"}",
  "testcode": "{\"source\":\"const accessToken = context.authData?.accesstokencode.access_token;\\nconst url = `https://graph.instagram.com/me?fields=user_id,username,name,profile_picture_url&access_token=${encodeURIComponent(accessToken)}`;\\n\\ntry {\\n  const response = await axios.get(url);\\n  return response.data;\\n} catch (error) {\\n  throw error;\\n}\"}",
  "authenticationpaths": {
    "body": [],
    "headers": [],
    "queryParams": [
      {
        "name": "access_token",
        "value": "function returnAccessToken(){ return context.authData?.accesstokencode.access_token} return returnAccessToken()"
      }
    ]
  },
  "iconurlpath": "${context?.authData?.testcode?.profile_picture_url}",
  "connectionlabelkey": "Username",
  "connectionlabelvalue": "context.authData?.testcode?.username",
  "_connectionlabelvalue": "${context.authData?.testcode?.username}",
  "whitelistdomains": [
    "graph.instagram.com",
    "instagram.com"
  ]
}
```

---

# Example 9: Google Sheets (Google OAuth 2.0 + URLSearchParams + Avatar Icon)

### Highlights:
- **Offline Consent Request**: Includes `access_type: "offline"` and `prompt: "consent"` in `queryparams` to reliably receive refresh tokens.
- **Space-Separated Full Scopes**: Google scopes use space delimiter (`scopeseperatedby: "space"`).
- **URLSearchParams Token Refresh**: Refresh token code uses standard `new URLSearchParams()` for `application/x-www-form-urlencoded` payloads.
- **Dynamic Avatar Icon (`iconurlpath`)**: Sets user profile photo dynamically via `"${context?.authData?.testcode?.picture}"`.
- **Connection Label**: Mapped to Google email: `context.authData?.testcode?.email`.

```json
{
  "rowid": "rowinjz4a5rt",
  "pluginrecordid": "rowqm5xi2",
  "pluginname": "Google Sheets",
  "domain": "sheets.google.com",
  "type": "Auth2.0",
  "granttype": "Authorization Code",
  "authversion": "V12",
  "redirecturl": "https://auth.viasocket.com/redirect/auth2.0",
  "clientid": "",
  "clientsecret": "",
  "authrequrl": "https://accounts.google.com/o/oauth2/v2/auth",
  "queryparams": "{\"response_type\":\"code\",\"scope\":\"email profile https://www.googleapis.com/auth/spreadsheets openid https://www.googleapis.com/auth/drive.readonly\",\"prompt\":\"consent\",\"access_type\":\"offline\"}",
  "scopeseperatedby": "space",
  "isconnectionlabelmasked": false,
  "authfields": {
    "authentication": {
      "type": "Auth2.0",
      "fields": []
    }
  },
  "accesstokencode": "{\"source\":\"let requestConfig = {\\n  url: 'https://oauth2.googleapis.com/token',\\n  method: 'post',\\n  maxBodyLength: Infinity,\\n  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },\\n  data: {\\n    code: `${context.authData.Authorization.code}`,\\n    client_id: context.authData.clientid,\\n    client_secret: context.authData.clientsecret,\\n    redirect_uri: `${context.authData.redirecturl}`,\\n    grant_type: 'authorization_code'\\n  }\\n};\\nconst response = await axios(requestConfig);\\nreturn response.data;\"}",
  "refreshtokencode": "{\"source\":\"const params = new URLSearchParams();\\nparams.append('client_id', context.authData.clientid);\\nparams.append('client_secret', context.authData.clientsecret);\\nparams.append('refresh_token', context.authData.accesstokencode.refresh_token);\\nparams.append('grant_type', 'refresh_token');\\n\\nreturn axios.post(\\n  'https://oauth2.googleapis.com/token',\\n  params.toString(),\\n  {\\n    headers: {\\n      'Content-Type': 'application/x-www-form-urlencoded',\\n    },\\n  }\\n)\\n.then(response => response.data)\\n.catch(error => {\\n  throw error;\\n});\\n\"}",
  "testcode": "{\"source\":\"try {\\n const response = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {\\n  headers: {\\n   Authorization: `Bearer ${context.authData.accesstokencode.access_token}`\\n  }\\n });\\n return response.data;\\n} catch (error) {\\n throw error;\\n}\"}",
  "authenticationpaths": {
    "body": [],
    "headers": [
      {
        "name": "Authorization",
        "value": "return `Bearer ${context.authData.accesstokencode.access_token}`"
      }
    ],
    "queryParams": []
  },
  "iconurlpath": "${context?.authData?.testcode?.picture}",
  "connectionlabelkey": "Email",
  "connectionlabelname": "email",
  "connectionlabelvalue": "context.authData?.testcode?.email",
  "_connectionlabelvalue": "${context.authData?.testcode?.email}",
  "whitelistdomains": ["googleapis.com"]
}
```

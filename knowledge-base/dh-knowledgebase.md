---
title: "DH Knowledge Base (Consolidated)"
description: "Token-minimal knowledge base for viaSocket plugs. Top-down structure: infer specifics from context."
---

# Page Index
- Universal Rules
- Plug Anatomy
  - Triggers
  - Actions
- Design Strategy & UX
- Naming Conventions
- UX Field Ordering
- Field Types & Custom Mapping
- Visibility & dependsOn
- Perform Code & Response Formatting
  - Code Structure
  - Clean Code Principles
  - Libraries & Globals
- Code Skeletons
  - Instant Subscribe & Unsubscribe
  - Sample (Instant & Scheduled)
  - Transfer (New-Event Triggers Only)
  - Scheduled Perform
  - Action Perform Template
- Reusable Components
- API Database Payload Schemas
- Developer Hub (DH) URLs
- Review & Priorities

---

# Universal Rules
*Invariants across all plugs. Stated once—never repeated.*

1. **API Docs = Ground Truth**: Overrides user cURL. Support all documented parameters (every field $\rightarrow$ UI input or code). Never invent or omit parameters.
2. **Authentication**: Handled by viaSocket connections (`authenticationpaths`). Never expose, hardcode, or include auth in API payloads. Access non-confidential auth metadata via `context?.authData?.<field_key>`. Flag direct auth usage in code. Never ask for `pluginrecordid` or `authid`.
3. **JSON Schema (`inputjson`)**:
   - Structure: `{"steps": {}, "blocks": {}, "inputFields": [...]}`.
   - **NO `"item"` WRAPPERS**: Never wrap arrays (`inputFields`, `options`, etc.) in an `"item"` key.
     - ❌ `{"inputFields": {"item": [...]}}` | ✅ `{"inputFields": [...]}`
   - **NO STRINGIFIED OBJECTS**: `steps` and `blocks` must be empty objects `{}`, not strings `"{}"`.
4. **Error Handling**:
   - Perform & inline code: `catch (error) { await errorComponent(error); }`.
   - Reusable components: `catch (error) { throw error; }`. Validation checks inside reusable components must always `throw` structured fallback objects (e.g. `throw { data: [], offset: null, message: 'Select a <parent> first.' }`).
   - `optionsGenerator`: Always wrap in `try...catch` calling `await errorComponent(error)`.
   - Throw inside `try` for missing required inputs and 200-responses with error bodies.
5. **Runtime**: Node.js environment. No `console.log`. No `import`/`require`. HTTP via `axios` or `fetch` only.
6. **Base `.data` Extraction & Response Formatting**:
   - **Base Extraction Rule**: In viaSocket, API payloads ALWAYS reside in `response.data`. Every API call (single or multiple aggregated calls like `userRes.data`, `projectsRes.data`) MUST extract payload data from its `.data` key before accessing destination properties. Never read payload keys directly on the response wrapper.
   - **Return Strategies (Match to Complexity)**:
     - *Clean / Direct*: `return response.data;`
     - *Metadata Injection*: `{ success: true, id: response.data?.id || id, ...response.data }` (for CREATE, UPDATE, DELETE, or minimal 200 bodies).
     - *Unnesting*: Extract nested payloads (`response.data.data`, `.result`, `.items`) directly to root to simplify variable mapping.
     - *Selective Keys*: On bloated responses with internal system noise, return only essential keys (`id`, `name`, `status`, etc.).
     - *Flattening*: Flatten deep ($\ge$3 levels) sub-objects into clean top-level properties.
     - *Batch / Loop*: Return flat array `[{...}]` for engine iteration.
7. **Guards & Fallbacks**:
   - Validate all `required: true` fields at the top of perform (`throw` before API call if missing/empty).
   - **No Hard-coding & No `defaultValue` Key**: Avoid `defaultValue` key in `inputjson`. State default values in field `help` text and apply fallbacks in perform code (e.g., `const limit = context.inputData?.limit || 10;`).
8. **Dropdown Priority**: Always prefer dynamic dropdowns over plain text fields for IDs/resource references unless:
   - Category is `DELETE` (strictly direct text ID `type: "string"`).
   - Upstream IDs passed with no list API available.
   - **Parameter Verification**: Verify GET endpoints in API docs for `sort`, `limit`, and `search` availability before configuring dropdown pagination/search flags. Never assume unsupported query params.
9. **Backward Compatibility**: Never rename/remove keys (breaks active flows); only update labels, help, visibility, or add optional fields.

---

# Plug Anatomy

## Triggers
| Type (`triggertype`) | When to Use | Execution Blocks |
|---|---|---|
| **Instant** (`hook`) | API has webhook subscribe/unsubscribe | Subscribe (`performsubscribe`), Sample (`performlist`), Perform/Modify (`modifytriggerdata`, optional), Unsubscribe (`performunsubscribe`), Transfer (`transferoption`, new-event only) |
| **Scheduled** (`polling`) | No webhooks; poll GET/LIST API at interval | Sample (`performlist`), Perform (`perform`), Transfer (`transferoption`, new-event only) |
| **Manual** (`manual_webhook`) | Webhooks supported, but no programmatic subscription API | Sample (`performlist`), Perform/Modify (`modifytriggerdata`, optional) |

- **Selection Priority**: Instant $\rightarrow$ Scheduled $\rightarrow$ Manual $\rightarrow$ Ask user.
- **Block Roles**:
  - *Subscribe*: Register webhook; return subscription data for unsubscribe.
  - *Unsubscribe*: Deregister webhook using stored subscription response (`context?.inputData?.performsubscribe`).
  - *Sample*: Returns single object (latest real record else fallback `{ viasocket_help, ...schema }`).
  - *Perform/Modify*: Reshapes payload or fetches details from ID. Return `[]` to filter/stop execution. Can be empty (auto-returns `context?.req?.body`). Manual triggers can only reshape payload (no auth).
  - *Transfer*: Bulk-pull history ($\le$200/batch) for new-event triggers only.
- **No AI Field in Triggers**: `aifield` is strictly forbidden in triggers (Actions only).
- **Scheduled Trigger Filtering**: If the target API supports filtering, predefined filters must either be:
  1. Exposed as standard input fields (`dropdown`, `multiselect`, `boolean`, or `input groups`) for user configuration, OR
  2. Added / hardcoded directly in the `perform` code (via query parameters or client-side filtering).

## Actions
Single `perform` execution block using `context.inputData`.
- **Categories**: GET · LIST · FIND/SEARCH · CREATE · UPDATE · FIND OR CREATE · FIND + UPDATE · DELETE.

---

# Design Strategy & UX
- **Unified Actions**: Combine related operations (e.g., List + Search + Get $\rightarrow$ Unified LIST via `mode` dropdown; Create + Update $\rightarrow$ Intelligent Upsert). Avoid separate Create-vs-Update toggles.
- **Optional Fields & Input Groups (Mandatory UX Practice)**: When multiple optional fields exist, provide a single multiselect chooser (e.g., "Select Additional Fields"). Group optional fields into **Input Groups** with `visibilityCondition` attached to the group. If grouping is not possible, attach `visibilityCondition` to individual fields.
- **Partial Updates**: Send only user-filled fields in payload; strip `undefined`, `null`, and `''`.
- **Stable Identifiers**: Prefer email/external ID/slug over volatile DB IDs.
- **Format & Units**: Accept human-friendly units (days, relative dates); convert to machine units in perform code. Infer data formats internally.
- **List Configuration**: Use `list: true` (with `limit: N`) only for static preconfiguration (mainly Triggers). In Actions, prefer standard `string` fields accepting comma-separated values.
- **Idempotency**: Prevent duplicate executions; safe across 1000+ runs.

---

# Naming Conventions
| Item | Format | Example |
|---|---|---|
| **Action Name** | `[Verb] [Object]` in Title Case | `"Create Customer"`, `"Archive Page"` |
| **Action Desc** | Concise summary ($\le$120 chars) | `"Send Slack message to a selected channel."` |
| **Trigger Name** | `[State Modifier] [Object]` in Title Case.<br>Must start with: `New`, `Updated`, or `Deleted`.<br>Forbidden: *list, fetch, sync, load, pull, search, check, scan, collect, export*. | `"New Order Created"`, `"Updated Task"` |
| **Trigger Desc** | `Runs when <event>` ($\le$120 chars) | `"Runs when a new order is placed."` |

- **App Name Rule**: Omit app name (e.g., `{{pluginName}}`) unless the term is ambiguous without it.
- **Labels & Placeholders**: Labels are direct field names (e.g., `"Page"`). Placeholders instruct the action (e.g., `"Select Page"`). Never append `"(optional)"` to labels or placeholders.

---

# UX Field Ordering
*Required fields first; optional fields grouped after.*

| Category | Order |
|---|---|
| **Instant** | DynDropdown(resource) $\rightarrow$ whereClause Group? $\rightarrow$ DynHelp(permission check)? $\rightarrow$ Conditionals |
| **Scheduled** | DynDropdown $\rightarrow$ DynDropdown(dependent)? $\rightarrow$ Boolean? $\rightarrow$ Multiselect(field filter)? $\rightarrow$ Group(filters only — never pagination fields) |
| **Manual** | Standalone static `help` field only (2-part HTML: `🔗 Webhook Setup Guide` + `📤 What happens next?`) |
| **GET** | DynDropdown(parent) $\rightarrow$ DynDropdown/String(ID) $\rightarrow$ Multiselect(fields)? $\rightarrow$ Group? |
| **LIST** | DynDropdown(parent) $\rightarrow$ DropdownStatic(Mode: List All, Search by…, Search by ID, Advance Search) $\rightarrow$ DropdownStatic(find_by)? $\rightarrow$ Boolean(Enable Pagination)? $\rightarrow$ Group(limit, offset)? $\rightarrow$ String(search/ID input)? $\rightarrow$ AIField? $\rightarrow$ Group(filters)? $\rightarrow$ Multiselect(return fields)? |
| **FIND/SEARCH** | DynDropdown(parent) $\rightarrow$ DynDropdown(child)? $\rightarrow$ Boolean(Basic/Advanced) $\rightarrow$ Group(filter) $\rightarrow$ Boolean(bulk)? $\rightarrow$ Group(sort+limit)? $\rightarrow$ DropdownStatic(response mode)? $\rightarrow$ Multiselect(return)? |
| **CREATE** | DynDropdown(parent) $\rightarrow$ DynDropdown(child)? $\rightarrow$ Boolean? $\rightarrow$ Multiselect(field chooser) $\rightarrow$ DynGroup(fieldsGenerator) $\rightarrow$ AIField?/Dictionary? |
| **UPDATE** | DynDropdown(parent) $\rightarrow$ DynDropdown(child)? $\rightarrow$ DynDropdown/String(ID) $\rightarrow$ Multiselect(chooser) $\rightarrow$ InputGroup(chosen fields) |
| **FIND OR CREATE** | DynDropdown(parent) $\rightarrow$ DynDropdown(child)? $\rightarrow$ Group(search) $\rightarrow$ Boolean(`create_if_not_found`) $\rightarrow$ DynGroup(visibilityCondition) $\rightarrow$ Multiselect? |
| **FIND + UPDATE** | DropdownStatic(search criteria) $\rightarrow$ String(lookup value) $\rightarrow$ DynMultiselect/DynDropdown(mutation) $\rightarrow$ Boolean(add/remove)? |
| **DELETE** | String(ID) $\rightarrow$ HelpStatic(irreversibility warning) |

**Category Deltas**
- **Scheduled**: No `aifield` (triggers strictly forbid AI fields). Never expose pagination fields (`limit`, `page_size`, `cursor`) or `scheduledTime` in UI. If API supports filtering, predefined filters must either be fetched from input fields (Dropdown, Multiselect, Boolean, Input Group) or added directly in `perform` code (query params or client-side filtering). Perform returns single-page fetch capped at $\le$1000 items (no internal while loops).
- **Manual**: Single static `help` field only. Must use strict 2-part format: `🔗 Webhook Setup Guide` $\rightarrow$ setup list + `📤 What happens next?` $\rightarrow$ explanation list. No intermediate text.
- **GET**: Include custom manual-ID triplet (`customHelp`, `customInputLabel`, `customPlaceholder`).
- **LIST**: Combines modes via `mode` dropdown. Search by ID performs direct GET (no pagination). Multiselect return fields: omit `defaultValue`; mention defaults in `help` and fallback in perform code.
- **DELETE**: Direct string ID input only (never dropdown). Optional archive toggle.

---

# Field Types & Custom Mapping
Every field requires: `key` (pattern `^[^.\[\]]*$`), `type`, `label`, `help`, `required`. `placeholder` is required for input types; placeholders must always be strings (`"100"`, `"true"`).

| Type | Additional Required Keys | Constraints & Behavior |
|---|---|---|
| `string`, `number`, `html`, `markdown` | `placeholder` | `help` starts with `"Enter"`. Non-standard dates use `string`. `list: true` only for static configs. |
| `date` | `placeholder`, `dateFormat` | Formats: `YYYY-MM-DDTHH:mm:ssZ`, `YYYY-MM-DD HH:mm:ss Z`, `MM-DD-YYYY HH:mm:ss Z`, `MM-DD-YYYY HH:mm:ss`. Placeholder matches format. |
| `dictionary` | `template` | Fixed template: `{key: {type: "string", placeholder: "..."}, value: {type: "string", placeholder: "..."}}`. |
| `boolean` | `options`, `customPlaceholder`, `customInputLabel`, `customHelp` | 2 options `{label, value}`, true-first. `help` starts with `"Select"`. `customHelp` explains outcomes of true/false. |
| `dropdown` (static) | `options`, `customInputLabel`, `customPlaceholder`, `customHelp` | `options: [{label, value, sample?, extraValue?}]`. `help` starts with `"Select"`. |
| `dropdown` (dynamic) | `optionsGenerator`, `customPlaceholder`, `customInputLabel`, `customHelp` | Output structure depends on verified flags:<br>• `canPaginate: true` or `enableSearchApi: true` $\rightarrow$ `{ data: [{label, value, sample}], offset }`.<br>• Both false/omitted $\rightarrow$ `[{ label, value, sample }]`.<br>• Zero results (pagination only): `!offset && length===0` $\rightarrow$ `{ data: [], offset: null, message: "No <resources> found." }`; `offset && length===0` $\rightarrow$ `{ data: [], offset: null, message: "<Resources> Fetched Successfully" }`.<br>• Zero results (search+pagination): preserve offset `{ data: [], offset: currentOffset, message }`. |
| `multiselect` (static) | `options`, `customInputLabel`, `customPlaceholder`, `customHelp` | Options array. `customPlaceholder` is array string (e.g., `"[\"opt1\"]"`). |
| `multiselect` (dynamic) | `optionsGenerator`, `customPlaceholder`, `customInputLabel`, `customHelp` | **Strictly returns flat array `[{ label, value, sample }]`**. No `canPaginate`/`enableSearchApi`. If calling paginated source, loop internally to aggregate all pages. |
| `aifield` | `prompt`, `suggestionGenerator` | **Actions only — strictly forbidden in triggers**. AI builds JSON at config time. Output raw JSON object. Quote string templates (`"${...}"`). |
| `help` (static) | `help` only | Standalone UI notice. No `label`/`required`/`placeholder`. |
| `help` (dynamic) | `source` | `source` JS returns `{ message }`. |
| `input groups` (static) | `fields` | Nestable child fields. `whereClause: true` renders sentence UI. |
| `input groups` (dynamic) | `fieldsGenerator` | Returns child field array or `{ message }`. Child keys may contain dots. |

**Custom Mapping Mode (Dropdown, Multiselect, Boolean)**
- **Standard Mode**: Shows `label` (e.g., `"Page"`), `help` ("Select..."), `placeholder`.
- **Custom Mapping Mode**: User toggles manual input:
  - `customInputLabel`: Field name when mapping (e.g., `"Page ID"`). Must NOT start with "Enter".
  - `customHelp`: Guides dynamic pill mapping (e.g., `"Enter or map ID from previous steps."`).
  - `customPlaceholder`: Concrete sample value (e.g., `"page_123"`).

**Standalone Help Field (`type: "help"`) — Strict Rule**
*Never add standalone `help` fields for standard field descriptions. Allowed ONLY for:*
1. **DELETE / High-Stakes**: Permanent deletion or irreversibility warnings.
2. **Behavior-Changing Toggles**: Critical workflow/billing changes based on selection.
3. **External Prerequisites**: Account tiers, permissions, or webhook registrations needed.
4. **Manual Webhook Setup**: Mandatory 2-part HTML instructions.
5. **Polling Math**: Complex lookback/lookahead window explanations.

---

# Visibility & dependsOn
- `visibilityCondition`: JS expression on `context?.inputData?.<path>` evaluating to boolean.
- **Direct Dropdown Value Access**: Dropdown selections store the raw `value` primitive directly at `context?.inputData?.<key>` (never `.value`). Direct equality comparison: `context?.inputData?.type === 'custom'`.

| Scenario | Condition Pattern |
|---|---|
| Multiselect non-empty | `Array.isArray(context?.inputData?.k) && context.inputData.k.length > 0` |
| Multiselect contains | `context?.inputData?.k?.includes('target')` |
| Dropdown / String equals | `context?.inputData?.k === 'val'` or `['a', 'b'].includes(context?.inputData?.k)` |
| Boolean true / false | `context?.inputData?.k` / `!context?.inputData?.k` |
| Nested in Input Group | `context?.inputData?.group?.k === 'val'` |
| `extraValue` access | `context?.inputData?.k_extraValue === 'x'` |

- **`dependsOn`**: Auto-populated by engine from paths accessed in `optionsGenerator`, `fieldsGenerator`, or `suggestionGenerator`. Never declare manually.

---

# Perform Code & Response Formatting

## Code Structure
- **Format 1 (Actions & Scheduled Perform)**:
  ```javascript
  async function <functionName>() {
    try {
      // Validate guards -> Build payload -> Call API -> Return formatted data
    } catch (error) {
      await errorComponent(error);
    }
  }
  return await <functionName>();
  ```
- **Format 2 (Trigger Blocks: Subscribe, Unsubscribe, Sample, Transfer)**: Direct `try...catch` block.

## Clean Code Principles
- **Readable Spacing**: Distinct visual blocks for validation, payload assembly, API call, and response return.
- **Upfront Destructuring**: Destructure from `context?.inputData || {}`.
- **Payload Construction**: Spread operator with shorthand keys; clean null/empty entries centrally:
  ```javascript
  const raw = { name, email, status, metadata };
  const payload = Object.fromEntries(Object.entries(raw).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
  ```
- **String Newlines**: In stringified code payloads, use literal `\n`, never double-escaped `\\n`.

**Response Return Patterns (Always Anchor on `.data`)**
```javascript
// 1. Direct Return (Clean API responses)
return response.data;

// 2. Metadata Injection (Mutations, status updates, minimal 200s)
return { success: true, id: response.data?.id || id, ...response.data };

// 3. Unnesting (Bubble nested payload to root)
const item = response.data?.data || response.data?.result || response.data;
return { success: true, ...item };

// 4. Selective Keys (Bloated/noisy APIs)
const raw = response.data;
return { success: true, id: raw.id, name: raw.name, status: raw.status, created_at: raw.created_at };

// 5. Flattening (Deep hierarchies for variable pill picker)
const o = response.data;
return { order_id: o.id, total: o.pricing?.total, customer_email: o.customer?.email };

// 6. Multi-API Calls (Every response must extract from .data)
const uData = (await axios.get('/user')).data;
const pData = (await axios.get('/projects')).data;
return { success: true, user: uData, projects: pData?.items || [] };
```

## Libraries & Globals
- **Global Libraries**: `axios`, `fetch`, `https`, `crypto`, `setTimeout`, `Buffer`, `atob`, `FormData`, `jwt`, `_`, `cheerio`, `moment`, `URLSearchParams`, `XMLParser`, `XMLBuilder`, `XMLValidator`.
- **System Globals**:
  - `__executionStartTime__`: Scheduled run ISO timestamp.
  - `context.inputData.scheduledTime`: Polling interval in minutes.
  - `context.paginationData`: Scheduled cursor across runs. **Never reset to null/0 in `else`**.
  - `context.paginateData['<field>']`: Cursor for dynamic dropdown `optionsGenerator`.
  - `__searchText`: Search query in `optionsGenerator` when `enableSearchApi: true`.
  - `context.inputData.transferOption.offset`: Transfer pagination offset.
  - `context.inputData.hookUrl`: Instant webhook URL.
  - `context.inputData.performsubscribe`: Subscription response stored for Unsubscribe.
  - `context.req.body`: Raw webhook payload in `modifytriggerdata`.

---

# Code Skeletons

## Instant Subscribe & Unsubscribe
```javascript
// Subscribe
const { data } = await axios.post('<url>/subscribe', { hookUrl: context?.inputData?.hookUrl, event: '<event>' });
return data;

// Unsubscribe
await axios.delete(`<url>/subscribe/${context?.inputData?.performsubscribe?.id}`);
return { success: true };
```

## Sample (Instant & Scheduled)
```javascript
const res = await axios.get('<url>/<resource>', { params: { limit: 1, sort: 'created_at:desc' } });
const items = res.data?.results || res.data || [];
if (items.length) {
  return { viasocket_help: "This is the latest item data available in the selected resource. Save the Trigger and publish to get the new item created in the selected resource.", ...items[0] };
}
return { viasocket_help: "This data is only a sample of the original data. If you want to see the original data, then you have to save the trigger, publish the flow and perform the given action.", id: "", name: "" };
```

## Transfer (New-Event Triggers Only)
```javascript
const offset = context?.inputData?.transferOption?.offset || null;
const params = { limit: 100, ...(offset ? { cursor: offset } : {}) }; // max 200
const res = await axios.get('<url>/<endpoint>', { params });
return {
  data: res.data?.items || res.data || [],
  offset: res.data?.next_cursor || null,
  uniqueIdentifier: 'id'
};
```

## Scheduled Perform
- Single-page fetch ($\le$1000 items); no internal loops.
- **Lookback Math**: `const t = new Date(new Date(__executionStartTime__).getTime() - (context?.inputData?.scheduledTime || 15) * 60000);`
- **Upcoming Event Math**: Snap execution time to polling window, parse offset, widen API bounds by $\pm$1m (60,000ms), and filter strictly in JS client: `eventStartMs >= windowStartMs && eventStartMs < windowEndMs`.
- **Filtering**: If API supports filtering, apply predefined filters in request query params (using values from input fields or hardcoded defaults) or filter client-side in perform code.
- **Advance Cursor**: Update `context.paginationData = res.data.next_cursor` ONLY if filtered items are non-empty and cursor exists.

## Action Perform Template
```javascript
async function executeAction() {
  try {
    const { record_id, ...rest } = context?.inputData || {};
    if (!record_id) throw new Error('record_id is required.');
    
    const payload = Object.fromEntries(Object.entries(rest).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
    const response = await axios.post(`<url>/resources/${record_id}`, payload);
    return { success: true, id: record_id, ...response.data };
  } catch (error) {
    await errorComponent(error);
  }
}
return await executeAction();
```

---

# Reusable Components
Reusable JS logic stored once. Three parts: **Name**, **Parameters**, **Code** (`try...catch` with `throw error`, params as globals).
- **Caller Pattern (`optionsGenerator`)**:
  ```javascript
  try {
    return await listTallyForms(context.inputData.workspaceId, context?.paginateData?.['formid']);
  } catch (error) {
    await errorComponent(error);
  }
  ```
- **Validation Checks in Components (Always Throw)**: Inside the reusable component code, validate required parameters and parent dependencies. Validation checks MUST ALWAYS `throw` a structured fallback object:
  ```javascript
  if (!workspaceId) {
    throw { data: [], offset: null, message: 'Select a workspace first.' };
  }
  ```
  *(For non-paginated components: `throw { message: 'Select a <parent> first.' };` or `throw { data: [], offset: null, message: 'Select a <parent> first.' };`)*
- **Output Formats**:
  - Non-paginated: `[{ label, value, sample }]`
  - Paginated: `{ data: [{ label, value, sample }], offset: string|number|null }`
  - Zero results: `{ message: "No <resources> found." }` or `{ data: [], offset: null, message: "..." }`
- **Parameter Strictness**: Define `offset`, `limit`, or `search` parameters ONLY if verified in official API documentation. Never read `context.inputData` or globals inside component.
- **Client-Side Pagination**: If a paginated component (`{ data, offset }`) is called inside a non-paginated dropdown (`canPaginate: false`) or a dynamic multiselect, `optionsGenerator` MUST loop internally to fetch all pages and return a flat array.
- **Mapping Requirement**: Components called in generators or perform code must be explicitly mapped using the mapping endpoint.

---

# API Database Payload Schemas
- **Action**: `name`, `key`, `description`, `pluginrecordid`, `isvisible` (bool), `type: 'action'`, `category`, `sub_category`?, `rtllayer` (bool), `isAIActionTrigger` (bool), `isUserOnDh` (bool), `inputjson: {steps:{}, blocks:{}, inputFields:[...]}`, `perform`, `authid`?.
- **Trigger**: `authid` (`'No Auth'` for manual webhook), `category`, `description`, `isvisible` (bool), `key`, `name`, `pluginrecordid`, `type: 'trigger'`, `triggertype`, `inputjson: {steps:{}, blocks:{}, inputFields:[...]}`.
  - *Instant*: `performsubscribe`, `performunsubscribe`, `performlist`, `modifytriggerdata`, `transferoption`.
  - *Scheduled*: `perform`, `performlist`, `transferoption`, `scheduleTimeOptions`, `canpaginate`.
  - *Manual*: `performlist`, `modifytriggerdata`.
- **Reusable Component**: `function_name`, `description`, `params: [{name, sample}]`, `code`, `pluginrecordid`, `function_code`.
- **Mapping**: `action_version_id`, `component_id`, `pluginrecordid`, `action_id`, `path` (`perform`, block name, or field key for dropdown/multiselect/group).

---

# Developer Hub (DH) URLs
Dynamic URLs to access plugs, triggers, and actions in viaSocket Developer Hub.

- **Base URLs by Environment**:
  - Production (`prod`): `https://flow.viasocket.com/`
  - Testing (`testing`): `https://dev-flow.viasocket.com/`
  - Local (`local`): `http://localhost:3000/`

- **URL Patterns**:
  - **Plug / App (Analytics / Details)**:
    `<baseUrl>developer/<orgId>/plugin/<pluginId>/analytics`
  - **Action / Trigger (Create / Edit / Improvement)**:
    `<baseUrl>developer/<orgId>/plugin/<pluginId>/<actionType>/<actionId>?versionId=<actionVersionRowId>`
    - `<actionType>`: `'action'` or `'trigger'`
    - **Fallback**: Never hallucinate IDs. If `actionId` or `actionVersionRowId` is missing, fall back to the Plug analytics URL.

---

# Review & Priorities

**P0 (Breaking)**
- Error handling matches rules (`await errorComponent(error)` in perform; `throw error` in reusable components).
- Every input referenced in code exists in `inputFields`; no orphan fields; valid `visibilityCondition` paths.
- Base `.data` extraction enforced on every API call (including multi-API calls).
- JSON schema: `{"steps": {}, "blocks": {}, "inputFields": [...]}` with NO `"item"` array wrappers and NO stringified objects.
- All reusable components called in code are mapped.
- Zero results return informative `{ message }` or valid empty payload.

**P1 (Functional & Automation)**
- Dynamic dropdowns used for IDs (never raw string IDs except for DELETE or unlisted upstream IDs).
- Verified API query parameters: `sort`, `limit`, `search` verified against official docs before configuring flags.
- Reusable components declare only documented params.
- Scheduled perform returns single-page array ($\le$1000 items); pagination cursor never cleared in `else`.
- No AI field in triggers (`aifield` strictly forbidden in triggers; actions only). In scheduled triggers, predefined API filters must be fetched from input fields or handled directly in perform code.

**P2 (UX Architecture)**
- Required fields first; optional fields grouped in Input Groups governed by a single multiselect chooser.
- No `defaultValue` key in `inputjson`; defaults documented in `help` and handled via perform fallbacks.
- Standalone `type: "help"` fields used ONLY for the 5 permitted scenarios.

**P3 (Copy & Formatting)**
- Field `help` starts with `"Enter"` for inputs/IDs and `"Select"` for dropdowns/booleans.
- Casing: Labels in Title Case; help and placeholders in sentence case.
- Placeholders are concrete examples, typed as strings, with no `"E.g."`.
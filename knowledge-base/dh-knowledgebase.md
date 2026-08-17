---
title: "DH Knowledge Base (Consolidated)"
description: "Token-minimal knowledge base for designing viaSocket plugs. Reason top-down; infer specifics from context."
---

# Page Index

- Universal Rules
- Plug Anatomy
  - Triggers
  - Actions
- Design Strategy
- Naming
- UX Field Ordering
- Field Types
  - Custom Mapping (Dropdown, Multiselect & Boolean)
- Minimalism
- Visibility & dependsOn
- Perform Code
  - Libraries
  - Globals
- Code Block Execution Timing
- Code Skeletons
  - Instant Subscribe / Unsubscribe
  - Sample (Instant & Scheduled)
  - Transfer (New-event only)
  - Scheduled Perform
  - Actions — template + per-category delta
- Reusable Components
- API Database Payload Schemas
- Review
  - Priorities
  - Validation Checklist

# Universal Rules
These apply everywhere — stated once, never repeated.
- **API docs = ground truth** (override user cURL). Must support all possible parameters available in the API documentation. Every documented field → UI input or code-handled. Never invent undocumented params; never omit a supported optional or required parameter.
- **No auth** — viaSocket handles it. Never expose, hardcode, or include auth logic.
- **Never ask** for `pluginrecordid` or `authid` (internally passed).
- **Output / `inputjson` Format**: `inputjson` in `request_payload` is structured as `{"steps": {}, "blocks": {}, "inputFields": [...]}`. `inputFields` MUST strictly be a direct raw **Array of Objects** (`[...]`). ❌ **ABSOLUTELY FORBIDDEN:** NEVER wrap in `"inputFields": { "item": [...] }` or `"inputFields": {}`. ✅ **CORRECT:** `"inputFields": [ { "key": "...", ... } ]` or `"inputFields": []`. `steps` and `blocks` MUST strictly be raw empty objects `{}` (❌ NO `"{}"` or `"{\}"`). Ignore auto-generated `steps`/`blocks`/`dependsOn`.
- **Error handling**: catch must `await errorComponent(error)`. Exception: Reusable Components must use `throw error` or `throw e`.
- **`optionsGenerator` invocation**: any code (inline or component call) must be wrapped in a parent `try...catch`; catch calls `await errorComponent(error)`.
- **No `console.log`**. No imports/require. HTTP via `axios`/`fetch` only.
- **Return `response.data` raw** — don't reshape. Array return → flow iterates per item.
- **Required-field guards**: validate every `required:true` field at top of perform — `throw` before API call if missing/empty/null.
- **`throw` inside `try`** for validation and for 200-responses carrying error body (viaSocket reads final response code).
- **No hard-coded input values** (except documented default fallbacks).
- Hide raw IDs/jargon behind labels + progressive disclosure; expose full capability via field choosers.
- **Backward Compatibility**: Never rename/remove keys (invalidates mappings); only update labels, help, visibility, or add optional fields.
- **Dropdown priority (CRITICAL)**: Dropdowns/multiselects have absolute highest priority. Never use string field if an options-fetching API exists. No exceptions for UPDATE. DELETE is the strict exception — always direct text ID field (type `string`).

# Plug Anatomy
Plug = **Triggers** (start workflows) + **Actions** (do things). Each = **Input Fields** (UI) + **Perform Code** (logic).

## Triggers
| Type (`triggertype`) | Use when | Code blocks |
|---|---|---|
| Instant (`hook`) | Service has webhook subscribe/unsubscribe API | Subscribe (`performsubscribe`), Sample (`performlist`), Perform(modify, optional) (`modifytriggerdata`), Unsubscribe (`performunsubscribe`), Transfer (`transferoption`) |
| Scheduled (`polling`) | No webhook — poll at interval | Sample (`performlist`), Perform(poll) (`perform`), Transfer (`transferoption`) |
| Manual (`manual_webhook`) | Webhooks but no programmatic subscribe — user pastes viaSocket hook URL into service | Sample (`performlist`), Perform(modify, optional) (`modifytriggerdata`) |

**Selection Priority** (if not specified): **Instant** → **Scheduled** → **Manual**.
1. **Instant**: programmatic subscribe/unsubscribe APIs exist.
2. **Scheduled**: GET/LIST API exists with created/updated timestamp or time filtering.
3. **Manual**: platform supports manual webhook entry.
4. **Fallback**: ask user for trigger type and API doc/cURL.

**Block roles**: **Subscribe** register webhook, return data viaSocket stores for unsub · **Unsubscribe** deregister using stored response · **Sample** latest 1 item else fallback schema (wrap `{viasocket_help, ...item}`) · **Perform(modify)** reshape payload or GET details from ID (exception: manual webhook can only reshape payload; no API call due to no auth) · **Transfer** bulk-pull history; new-event only; pagination enabled; `≤200/batch`.

## Actions
Single Perform call from `context.inputData`. Categories: GET · LIST · FIND/SEARCH · CREATE · UPDATE · FIND OR CREATE · FIND + UPDATE · DELETE.

# Design Strategy
- **Unified actions**: List+Search+Get → one Unified LIST (Mode dropdown: List All, Search by…, Search by ID, Advance Search). Create+Update → Intelligent Upsert (search by stable ID → update if found else create). Never expose Create-vs-Update toggle.
- **Stable identifiers**: prefer email/external_id/sku over volatile DB IDs.
- **Dropdown rule**: dropdown only if dataset small, stable, or paginated. Else direct ID string field.
- **Structural respect**: enums→dropdown, arrays→repeating input groups, nested objects→logical grouping.
- **Idempotency/scale**: state duplicate-prevention key per action; safe across 1000+ runs. Multiple matches → deterministic selection or fail safely.
- **Partial update**: send only user-filled fields; never `null`/`''` unless explicitly clearing.
- **Response**: small/flat → whole payload; large/nested → Basic/Detailed mode.
- **Dynamic schema**: pick resource → fetch schema → render relevant fields.
- **Connection-Level Context**: Capture workspace/org/tenant in auth setup if no dynamic list API.
- **Format Abstraction**: Infer content formats internally; don't ask users.
- **Default Value Rule**: Omit `defaultValue` if API natively defaults when omitted, unless UX override needed.
- **customHelp**: Explain business meaning/context; never direct users to copy IDs from URLs.
- **Workflow Purity**: Prefer clean `Trigger → Action` without intermediate JS steps.
- **Coded Values**: Map numeric enums via help text unless stable enough for dropdown.
- **Consolidate Related Actions**: Fold variants (e.g., "schedule message" toggle inside "send message") into one action via Boolean/Static Dropdown.
- **Human Units**: Accept user-friendly units (days, relative dates); convert to machine units in perform code.
- **Label Options Format**: `"Display Name (schemaKey)"` when label differs from API key.
- **Preset Duration/Expiry**: Static Dropdown with preset options instead of free number field.
- **Relative vs Fixed Scheduling**: Toggle between relative offsets and exact datetimes; arithmetic in perform code.
- **Predefined Static Multiselect**: For stable API parameter sets (metrics, tags), use static Multiselect.
- **Dynamic Questionnaire/Form Loading**: `fieldsGenerator` to fetch custom fields after parent selection.
- **Grouped Conditional Filters**: Group filters in Input Group; gate value fields with `visibilityCondition`.
- **Dynamic Endpoint Scoping**: Adjust endpoints/params in `optionsGenerator` based on parent scope selector.

# Naming
| Item | Format |
|---|---|
| Action name | **[Verb] [Object]** in Title Case (e.g. `"Create Data Source Item"`, `"Archive Page"`). |
| Action desc | Short description, ≤30 chars (e.g. `"Send Slack message"`). |
| Trigger name | **[State Modifier] [Object] [Optional Action]** in Title Case (e.g. `"New Comment Created"`, `"Updated Page"`). **MUST** start with state change prefixes (**"New"**, **"Updated"**, **"Deleted"**). ❌ Incorrect: `"Page Created"`, `"Comment Updated"`, `"Page Deleted"`; ✅ Correct: `"New Page Created"` (or `"New Page"`), `"Updated Comment"`, `"Deleted Page"`. Avoid forbidden words: `list`, `fetch`, `sync`, `load`, `pull`, `search`, `check`, `scan`, `collect`, `export`. |
| Trigger desc | `Runs when <event>`, ≤30 chars (e.g. `"Runs when new email arrives"`). |

App Name Rule: Omit the app name (e.g. "{{pluginName}}") from names and descriptions unless the context is too generic without it.
No Raw IDs: NEVER use raw event/endpoint identifiers (e.g. `page.created`) as names.
Labels clean/generic ("Select Board" not "Select Trello Board"). Preserve compliant existing names on update. Never append `(optional)` in `label`, `placeholder`, `customInputLabel`, or `customPlaceholder`.

# UX Field Ordering
Required first, optionals grouped after. **`canPaginate`/`enableSearchApi` priority**: (1) both → both true; (2) search only → paginate false, search true; (3) pagination only → paginate true, search false; (4) neither → both false. Set flags true if reusing a component that implements them. Verify API capabilities via web search first. **Help placement**: static/dynamic help field always below the field it refers to.

| Category | Order |
|---|---|
| Instant | DynDropdown(resource) → whereClause Group? → DynHelp(permission check)? → conditionals |
| Scheduled | DynDropdown → DynDropdown(dependent) → Boolean? → Multiselect(field filter)? → Group(filter only — no pagination fields)? → AIField? |
| Manual | HelpStatic (only allowed field — step-by-step webhook setup HTML instructions) |
| GET | DynDropdown(parent) → DynDropdown/String(record ID) → Multiselect(fields)? → Group? |
| LIST | DynDropdown(parent) → DropdownStatic(Mode: List All, Search by…, Search by ID, Advance Search) → DropdownStatic(find_by)? → Boolean(Enable Pagination)? → Group(limit, offset)? → String(search/ID input)? → AIField(Advance Search)? → Group(filters)? → Multiselect(return fields, curated defaults)? |
| FIND/SEARCH | DynDropdown(parent) → DynDropdown(child)? → Boolean(Basic/Advanced) → Group(filter) → Boolean(bulk)? → Group(sort+limit)? → DropdownStatic(response mode)? → Multiselect(return)? |
| CREATE | DynDropdown(parent) → DynDropdown(child)? → Boolean? → Multiselect(field chooser) → DynGroup(fieldsGenerator) → AIField?/Dictionary? |
| UPDATE | DynDropdown(parent) → DynDropdown(child)? → DynDropdown/String(record ID) → Multiselect(chooser) → InputGroup(chosen fields) |
| FIND OR CREATE | DynDropdown(parent) → DynDropdown(child)? → Group(search) → Boolean `create_if_not_found` (default `{label:"Yes",value:true}`) → DynGroup(visibilityCondition on toggle) → Multiselect? |
| FIND + UPDATE | DropdownStatic(search criteria) → String(lookup value) → DynMultiselect/DynDropdown(mutation) → Boolean(add/remove)? |
| DELETE | String(record ID) → HelpStatic(irreversibility warning) |

**Category deltas**:
- **Instant**: DynHelp validates permissions after resource pick; whereClause renders multi-filter as sentence (all labels sentence case; only first capitalized; subsequent lowercase unless proper nouns).
- **Scheduled**: Never expose pagination fields (limit, page size, cursor, next page token) or `scheduledTime` in UI — pagination via `canpaginate:true` config, `scheduledTime` is global. Perform returns array from a **single page** fetch, capped at max 1000 items (or service limit if smaller), no internal looping. Transfer `data` limit: 200/batch.
- **Manual**: Supports `performlist` + `modifytriggerdata` (raw payload via `context?.req?.body`). Only a single static `help` field allowed in `inputFields`. Note: No auth in manual trigger, so `modifytriggerdata` can only reshape payload (no API call).
- **GET**: Always provide manual-ID triplet (`customHelp`/`customInputLabel`/`customPlaceholder`).
- **LIST**: Combines List All, Search by…, Search by ID, Advance Search via `mode` dropdown. Multiple search attributes → secondary `find_by` dropdown + chained `visibilityCondition`. List All + pagination true → show limit/offset; pagination false → client-side fetch all. Unique search → no pagination. Search by ID → direct GET, no pagination. Advance Search → AIField (only if service supports). Multiselect return fields (default all if empty; curated ~10–12 as `defaultValue`). Comma-separated multi-values in String for quick lookups. Status/date filter Input Group for List All/Recently Updated.
- **FIND/SEARCH**: Boolean toggles Basic (column + operator? + value) vs Advanced (AIField + `suggestionGenerator`). Multiple operators (=, LIKE, >, <) → Static Dropdown. Sort → dynamic dropdown + static direction. Bulk toggle → exhaustive vs standard limit. Response mode dropdown (Basic/Custom/Full); Custom → column multiselect.
- **CREATE/UPDATE**: Chooser Multiselect feeds fields group. Static/known fields → static input groups with `visibilityCondition` per field/group on Multiselect. `fieldsGenerator` only for truly dynamic fields; return `{message:'Select a resource first.'}` if deps missing. Map API types correctly. Pre-select 90% fields as `defaultValue`; force-include mandatory fields. Line items → repeating Input Groups. Sections → Multiselect entries + conditional Input Groups. Reference vs inline → Boolean/Dropdown fork. UPDATE help: "unfilled fields stay unchanged".
- **FIND OR CREATE**: AIField if complex query; dropdown+string if simple filter. Multiple stable identifiers → search-by dropdown. Static + dynamic field split. Toggle default true shows creation fields.
- **FIND + UPDATE**: Static Dropdown for criteria, String for lookup, Dynamic Multiselect/Dropdown for mutation, optional Boolean for add/remove mode.
- **DELETE**: Minimal. Direct text ID (type `string`) — no dropdowns. Archive toggle if API supports.

# Field Types
Base keys (every field): `key` (unique, pattern `^[^.\[\]]*$`) · `type` · `label` · `help` · `required` · `placeholder` (required for string/date/number/html/markdown; optional for dropdown/multiselect/boolean). The value of `placeholder` and `customPlaceholder` MUST ALWAYS be of type `string`. For `string`, `number`, `boolean`, or any field type, if the value is of another data type (e.g. number `100`, boolean `true`), it MUST be wrapped with quotes as a string (e.g. `"100"`, `"true"`, `"[\"item\"]"`). Allowed types: `string`, `date`, `number`, `html`, `markdown`, `dictionary`, `boolean`, `dropdown`, `multiselect`, `aifield`, `help`, `input groups`. Valid JSON only — no comments/extra keys.

| `type` | Required (beyond base) | Constraints |
|---|---|---|
| `string` `number` `html` `markdown` | `placeholder` | For non-standard date formats use `string`. For `string` fields (especially ID fields like `parent_task_id`), `help` MUST start with `"Enter"` (e.g. `"Enter a parent task ID..."`) and MUST NOT say `"Select from the list"` or `"Select..."`. `list:true` (string/number only) for preconfigured array; `limit:N` requires `list:true`. `list:false` (default) for single/dynamic array values. |
| `date` | `placeholder`, `dateFormat` | Only 4 formats: `YYYY-MM-DDTHH:mm:ssZ`, `YYYY-MM-DD HH:mm:ss Z`, `MM-DD-YYYY HH:mm:ss Z`, `MM-DD-YYYY HH:mm:ss`. `placeholder` must match `dateFormat`. Date fields return formatted output (unlike `string` pass-through). |
| `dictionary` | `template` | `template` FIXED: `{key:{type:string,placeholder},value:{type:string,placeholder}}` — both types always `string`; only placeholder text varies. |
| `boolean` | `options`, `customPlaceholder`, `customInputLabel`, `customHelp` | 2 options `{label,value}`, true-first. `defaultValue` must equal an option. `customInputLabel` must NOT start with "Enter". `customHelp` specifies actual values + outcomes (e.g. "Enter true for [outcome] and false for [outcome]"). `help` starts with "Select". |
| `dropdown`/`multiselect` static | `options`, `customInputLabel`, `customPlaceholder`, `customHelp` | `options:[{label,value,sample?,extraValue?}]`. `defaultValue` = exact option copy (multiselect: array). `customInputLabel` must not start with "Enter" (same as label if not an ID). `customHelp` guides manual input: few options → list them; many → "Enter {{label name}} …". `help` starts with "Select", focuses on selection. |
| `dropdown` dynamic | `optionsGenerator`, `customPlaceholder`, `customInputLabel`, `customHelp` | Configure `canPaginate`/`enableSearchApi` per priority order. Paginated → return `{data,offset,message?}`. Search → use `__searchText`. Empty/info → `{message}` (no pagination), `{data:[],offset:null,message}` (pagination only), `{data:[],offset:previous_offset,message}` (both; preserve pagination offset on empty search). `customPlaceholder` = sample value (e.g. `123`). `customInputLabel` must not start with "Enter" (e.g. "Spreadsheet ID"). `customHelp` = "Enter the ID/value… from actions like List, Find…". `defaultValue` = `{label,value,sample}`. |
| `multiselect` dynamic | `optionsGenerator`, `customPlaceholder`, `customInputLabel`, `customHelp` | **No `canPaginate`/`enableSearchApi` support.** Must perform client-side pagination internally and return aggregated array. `customPlaceholder` = array example (e.g. `"[\"title\",\"status\"]"`). `customInputLabel` must not start with "Enter". `defaultValue` = array of `{label,value,sample}`. |
| `aifield` | `prompt`, `suggestionGenerator` | AI builds structured data at config-time. `suggestionGenerator` mandatory (`""` if no dynamic context). `prompt` outputs ONLY valid JSON; raw object (no wrapper); quote string vars (`"${...email}"`) not numbers/booleans. |
| `help` static | — (`key`·`type`·`help` only) | Content: text/HTML/MD. No `label`/`required`/`placeholder`. Optional: `visibilityCondition`. Position below referring field. |
| `help` dynamic | `source` | `source` JS → `{message}`. Not `optionsGenerator`. Optional: `label`, `visibilityCondition`. No `required`/`placeholder`/`help`. Position below referring field. |
| `input groups` static | `fields` | `fields[]` independently valid, nestable. `whereClause:true` (static only) → sentence UI; recommend dropdown/multiselect children. |
| `input groups` dynamic | `label`, `fieldsGenerator` | → field array or `{message}` if deps missing. Generated child keys CAN contain dots. Optional: `required`, `help`, `visibilityCondition`. |

**Options metadata**: `sample` MUST equal `value`; include only when value is ID ≠ label. Dynamic `defaultValue` requires `sample`. `extraValue` = hidden metadata (any data type), read via `context?.inputData?.{key}_extraValue` (group: `{group}?.{key}_extraValue`).

## Custom Mapping (Dropdown, Multiselect & Boolean)
Two UI states:
1. **Standard Mode**: Shows `label`, `help` (starts with "Select"), `placeholder` (defaults to "Choose {{label}}" if omitted).
2. **Custom Mapping Mode**: Switches to text input showing `customInputLabel` (must NOT start with "Enter"; same as label if not ID), `customHelp` (guides manual input), `customPlaceholder` (concrete sample value).
   - Dynamic: "Enter the ID/value… from actions like List, Find…"
   - Static/Boolean: Specify actual values and outcomes. Many options → "Enter {{label name}} …"

**Visibility + required**: hidden `required` field is skipped. Optional parent + required child → set `required:true` AND throw in perform if parent set but child missing.

# Minimalism
Include optional keys only when they add info beyond label + app + action context. `help` is always required — concise, non-technical. Starts with "Enter" for string/number/dictionary/date/aifield/markdown/html/input groups (for `string` fields, especially ID string fields like `parent_task_id`, `help` MUST say `"Enter [ID]..."`, NOT `"Select from the list"` or `"Select..."`); "Select" for dropdown/multiselect/boolean. `customHelp`/`customInputLabel`/`customPlaceholder` are mandatory for boolean/dropdown/multiselect.

# Visibility & dependsOn
`visibilityCondition`: JS expression on `context?.inputData?.<path>` evaluating to boolean.

| On | Pattern |
|---|---|
| Multiselect any | `Array.isArray(context?.inputData?.k) && context.inputData.k.length > 0` |
| Multiselect value | `context?.inputData?.k?.includes('A')` |
| String/Dropdown eq/in | `context?.inputData?.k === 'v'` / `['A','B'].includes(context?.inputData?.k)` |
| Boolean t/f | `context?.inputData?.k` / `!context?.inputData?.k` |
| In group | `context?.inputData?.group?.k` |
| `extraValue` | `context?.inputData?.k_extraValue === 'x'` (group: `context?.inputData?.group?.k_extraValue`) |
| Calc | `(context?.inputData?.a * context?.inputData?.b) > 100` |

**`dependsOn`**: auto-populated ONLY from paths in `optionsGenerator`/`fieldsGenerator`/`suggestionGenerator`. Never write manually. `visibilityCondition` does NOT populate it.

**Generator context access**: `context?.inputData?.<key>`; group: `context?.inputData?.<group>?.<field>`. Pagination token: `context?.paginateData?.['<field>']` (group: `['group.field']`; nested: path order). `__searchText` only when `enableSearchApi:true`. `axios` available directly.

# Perform Code
Two valid structures:

**Format 1: Wrapping async function**
```javascript
async function <functionName>() {
  try {
    // validate required fields; build request from context.inputData; call API
  } catch (error) {
    await errorComponent(error);
  }
}
return await <functionName>();
```

**Format 2: Direct try-catch**
```javascript
try {
  // validate required fields; build request from context.inputData; call API
} catch (error) {
  await errorComponent(error);
}
```
- Read inputs via `context?.inputData?.<key>`. GET uses `params`, POST uses `data`.
- Handle API rate limits in loops (delay/retry/headers).
- **Scheduled Perform vs Sample**: Perform returns array `[{item1},{item2}]` (engine loops per item). Sample returns single object `{...}` (one item via GET pattern for schema mapping).

## Libraries
Direct, no import: `axios` `fetch`(node-fetch) `https` `crypto` `setTimeout` `Buffer` `atob` `FormData`(form-data) `jwt`(jsonwebtoken) `_`(lodash) `cheerio` `moment` `URLSearchParams` `XMLParser` `XMLBuilder` `XMLValidator`. `axios` accepts `maxBodyLength:Infinity`. Same set in reusable components.

## Globals
| Global | Where |
|---|---|
| `__executionStartTime__` | Scheduled Perform — ISO timestamp string of run start (e.g. `"2026-07-28T09:26:51.074Z"`). Lookback: `execTimeMs - scheduledTime*60000`. Upcoming/Lookahead: snap to polling interval (`windowSizeMins = Number(context?.inputData?.scheduledTime || 5); execDate.setUTCMinutes(Math.round(execDate.getUTCMinutes() / windowSizeMins) * windowSizeMins, 0, 0); snappedExecTimeMs = execDate.getTime()`). Offset: `offsetMins = Number(context.inputData?.minutesBefore || context.inputData?.meetingBefore || 0)`. Bounds: `windowStartMs = snappedExecTimeMs + offsetMins*60000`, `windowEndMs = snappedExecTimeMs + (offsetMins + windowSizeMins)*60000`. API query widened by ±1 min (60,000 ms). JS client filter: `eventStartMs >= windowStartMs && eventStartMs < windowEndMs` (or `windowStartMs < eventStartMs <= windowEndMs`). |
| `context.inputData.scheduledTime` | Scheduled — interval (min) |
| `context.paginationData` | Scheduled cursor/state across runs (init `0`/`null`; requires pagination enabled). Advance ONLY if filtered-nonempty AND new next-token. Repeated token auto-breaks. Multi-item → `{ cursors: { [itemId]: cursor }, activeForms: [itemId] }`. **CRITICAL: NEVER assign `null`/`0` or clear in `else` block.** |
| `context.paginateData['<field>']` | Dynamic dropdown/multiselect `optionsGenerator` token. Group: `['group.field']`; nested: path order. |
| `__searchText` | Generators when `enableSearchApi:true` |
| `context.inputData.transferOption.offset` | Transfer |
| `context.inputData.hookUrl`, `_scriptId` | Instant Subscribe (`_scriptId` only if service needs unique webhook key) |
| `context.inputData.performsubscribe` | Instant Unsubscribe (= subscribe response) |
| `context.req.body` | Webhook Perform Modify (`modifytriggerdata`) for Instant/Manual — raw webhook payload |

# Code Block Execution Timing
| Block | Fires |
|---|---|
| Subscribe | Flow publish · status→active · trigger config changed (new config) |
| Unsubscribe | Flow trashed · status→inactive · trigger config changed (old config) |
| Sample | Test button — response feeds Perform(modify) if present, else straight to flow |
| Perform(modify) | After Sample on Test; in production webhook goes directly to it |
| Perform (Scheduled/Manual/Action) | Each tick / flow run |
| Transfer | Transfer button — selected/all; `≤200` batches |

# Code Skeletons
Trigger blocks (Subscribe, Unsubscribe, Sample, Manual) start directly with `try-catch` (no `async (context) =>` wrapper). Scheduled Perform and Actions use the `async <functionName>() { try {…} catch (e) { await errorComponent(e); } } return await <functionName>();` wrapper.

## Instant Subscribe / Unsubscribe
```javascript
// Subscribe — return res.data; viaSocket stores it for unsub
const { data } = await axios.post('<url>/subscribe', {
  hookUrl: context?.inputData?.hookUrl, event: '<event>' /* + inputData */
});
return data;

// Unsubscribe — use stored subscribe response
await axios.delete(`<url>/subscribe/${context?.inputData?.performsubscribe?.id}`);
```

## Sample (Instant & Scheduled)
Scheduled Sample must return single object (GET pattern) for schema mapping.
```javascript
const res = await axios.get('<url>/<resource>', { params: { limit: 1, sort: 'created_at:desc' } });
const items = res.data?.results || res.data || [];
if (items.length) return { viasocket_help: REAL, ...items[0] };
// Fallback — Instant: hardcoded expected keys. Scheduled: fetch schema, map type → empty.
return { viasocket_help: SAMPLE /* + every expected key with empty/default */ };
```
- `REAL` = "This is the latest item data available in the selected resource. Save the Trigger and publish to get the new item created in the selected resource."
- `SAMPLE` = "This data is only a sample of the original data. If you want to see the original data, then you have to save the trigger, publish the flow and perform the given action."
- Type→empty: `['array','list','multi_select']`→`[]`; `boolean`→`false`; `number`→`0`; else `""`.

## Transfer (New-event only)
`data` array max 200 items/batch.
```javascript
const offset = context?.inputData?.transferOption?.offset || null;
const params = { limit: 100 }; // Maximum 200 items (limit <= 200)
if (offset) params.cursor = offset;
const res = await axios.get('<url>/<endpoint>', { params });
return {
  data: res.data?.results || res.data || [],
  offset: res.data?.next_cursor || null,
  uniqueIdentifier: 'id'
};
```

## Scheduled Perform
Time window (Lookback): `const execTimeMs = new Date(__executionStartTime__).getTime(); const t = new Date(execTimeMs - (context?.inputData?.scheduledTime || 15) * 60000);`
- **Upcoming event / relative time window**: Snap execution time to polling interval (`const windowSizeMins = Number(context?.inputData?.scheduledTime || 5); execDate.setUTCMinutes(Math.round(execDate.getUTCMinutes() / windowSizeMins) * windowSizeMins, 0, 0); const snappedExecTimeMs = execDate.getTime();`). Parse offset: `const offsetMins = Number(context.inputData?.minutesBefore || context.inputData?.meetingBefore || 0);`. Calculate `windowStartMs = snappedExecTimeMs + offsetMins * 60000`, `windowEndMs = snappedExecTimeMs + (offsetMins + windowSizeMins) * 60000`. Widen API query bounds by ±1 min (60,000 ms): `timeMin = new Date(windowStartMs - 60000).toISOString()`, `timeMax = new Date(windowEndMs + 60000).toISOString()`. Filter JS client-side: `eventStartMs >= windowStartMs && eventStartMs < windowEndMs` (or `windowStartMs < eventStartMs <= windowEndMs`) to guarantee 1 execution per item. Google Meet filter: regex `/meet\.google\.com/i` across `conferenceData`, `location`, and `description`.
- Returns array `[{item1},{item2}]`. Capped at max 1000 items/page (or service limit if smaller).
- **No internal pagination** — single page fetch; use `context.paginationData` across runs.
- **Native filter** (preferred): pass `created_at_min=t` to API.
- **Client filter — new**: `items.filter(i => new Date(i.created_time) >= t)` → sort oldest-first.
- **Client filter — updated**: filter `last_edited_time >= t && created_time !== last_edited_time` → sort ascending.
- **Pagination update** — only if filtered results non-empty AND next cursor exists:
  ```javascript
  if (filteredData.length !== 0 && response?.data?.next_cursor) {
      context.paginationData = response.data.next_cursor;
  }
  ```
- **Multi-item pagination** — track per-item cursors:
  ```javascript
  const activeForms = context?.paginationData?.activeForms || formIds;
  const previousPagination = context?.paginationData?.cursors || {};
  // ... loop & call API per item with previousPagination[formId] ...
  if (newResultsFound && nextCursor) {
      nextPagination[formId] = nextCursor;
      nextActiveForms.push(formId);
  }
  if (nextActiveForms.length > 0) {
      context.paginationData = { cursors: nextPagination, activeForms: nextActiveForms };
  }
  ```

## Actions — template + per-category delta
```javascript
async function <functionName>() {
  try {
    const id = context?.inputData?.record_id;
    if (!id) throw new Error('record_id is required.');
    const res = await axios.<method>(`<url>/resources/${id}`, /* params|payload */);
    return res?.data;
  } catch (e) { await errorComponent(e); }
}
return await <functionName>();
```
| Category | Call | Notes |
|---|---|---|
| GET | `GET /resources/:id` | validate id; handle 404 |
| LIST | Fork by `mode` | List All/Search: paginated or client loop; Search by ID: direct GET; Advance Search: query. Multiselect filters fields. |
| FIND/SEARCH | `GET /resources?q=` | native query first; `.find()` fallback → `{results:[]}` |
| CREATE | `POST /resources` | payload from `inputData` |
| UPDATE | `PATCH`/`PUT`/`POST :id` | partial: include key only if `!== undefined/null/''` (unless explicit clear) |
| FIND OR CREATE | `GET` → `POST` if none | search by stable ID first |
| DELETE | `DELETE /resources/:id` | validate id; handle 404 already-deleted |

# Reusable Components
JS stored once. Three parts: **Name** (unique, permanent once used), **Parameters**, **Code** (raw JS starting with `try`/`catch`; params as global variables; catch uses `throw error`). Invoked only from generators — never static fields. Must be explicitly mapped via mapping tool after creation. Verify mapped components via `Fetch_Mapped_Reusable_Component_In_Action_Version`; any reusable component called in code that is unmapped MUST be flagged as an issue.
- **Parameters**: `searchText`, `pageToken`/`offset`, `pageSize`/`limit` are optional — add only if API supports. Don't validate optional params at top. Map dynamic values to params; never read `context.inputData`/`__searchText`/`context.paginateData` directly inside component.
- **Zero Results**: Return `{ message: "No [resources] found." }` (or `{ data: [], message: "…" }` if paginated).
- **Search-Pagination Offset Rule**: If both search+pagination enabled and search returns empty, returned `offset` must be current cursor param to preserve pagination state.
```javascript
// fetchResources(searchText, pageToken, pageSize)
try {
  if (!pageSize) throw new Error('pageSize required');
  const res = await axios.get('<url>/<endpoint>', { params: { q: searchText, cursor: pageToken, limit: pageSize } });
  const items = res.data?.items || [];
  if (items.length === 0) {
    return { message: "No resources found." };
  }
  return {
    data: items.map(i => ({ label: i.name, value: i.id, sample: i.id })),
    offset: res.data?.next_cursor || null
  };
} catch (error) {
  throw error;
}
```
Caller: `try { return await fetchResources(__searchText, context?.paginateData?.['my_field'], 100); } catch (error) { await errorComponent(error); }`

**Operations**:
- **Search first** before creating new components.
- **Mapping**: requires `actionVersionRowId`, `path`, `component_id`. API is a toggle (first call maps, second unmaps).
- **Creation**: `function_name`, `params`, `code`, `description`. Don't map during creation.
- **Updates**: `component_id` + fields to update.
- **Reuse Protocol**: If existing component's params are sufficient but code needs updating → update code directly. If params need changing and component is mapped → create new component (don't modify mapped params/function_name). If unmapped → can update everything.

# API Database Payload Schemas
- **Action (Create/Update)**: `name`, `key`, `description`, `pluginrecordid`, `isvisible` ('false'|'true'), `type: 'action'`, `category`, `sub_category`?, `rtllayer` (bool), `isAIActionTrigger` (bool), `functionId`?, `isUserOnDh` (bool), `inputjson: {steps:{}, blocks:{}, inputFields:[...]}`, `perform`, `authid`?, `metadata: {chatbotthreadid}`?.
- **Trigger (Create/Update)**: `authid` (except `manual_webhook` → 'No Auth'), `category`, `sub_category`?, `description`, `ignoreuniversalsampledata` (bool), `isvisible` ('True'|'False'), `key`, `name`, `pluginrecordid`, `preferred_step_name`, `type: 'trigger'`, `triggertype`, `inputjson: {steps:{}, blocks:{}, inputFields:[...]}`. Update sends only changed keys.
  - *Instant*: `performsubscribe`, `performunsubscribe`, `performlist`, `modifytriggerdata`, `transferoption`.
  - *Scheduled*: `perform`, `performlist`, `transferoption`, `scheduleTimeOptions` (array), `canpaginate` (bool).
  - *Manual*: `performlist`, `modifytriggerdata`.
- **Reusable Component**:
  - *Create*: `function_name`, `description`, `params:[{name,sample}]` (string samples double-quoted e.g. `"sample":"\"field ID\""`; other types unwrapped), `code`, `pluginrecordid`, `function_code` (async wrapper), `componentgenerationsource`, `functionId`.
  - *Update*: `rowid`, `description`, `function_code`, `componentgenerationsource`, `code`.
- **Mapping**: `action_version_id`, `component_id`, `pluginrecordid`, `action_id`, `path`. `path` is either a dedicated section key path (`perform`, `performlist`, `transferoption`, `performsubscribe`, `performunsubscribe`, `modifytriggerdata`) or the field key when mapped in an `optionsGenerator` for dynamic dropdowns, multiselects, or dynamic input groups (e.g. `"page_id"`; for fields inside input groups, use only the field key `"page_id"`, no nested input group path). Toggle behavior (first call maps, second unmaps).

# Review

## Priorities
- **P0 (Breaking)**: Error handling per Universal Rules · every `context.inputData.<key>` must exist in fields · no orphan fields · `visibilityCondition` maps to real keys · payload matches API schema · no URL extension requirements · derived required values have fallbacks · generators return `{message}` on zero results and handle unselected parent · reject malformed JSON · guard required fields · unmapped reusable components (flag if called in `inputFields` or `performCode` but not mapped in `Fetch_Mapped_Reusable_Component_In_Action_Version`).
- **P1 (Automation)**: No raw IDs typed by user (use dropdowns) · handle pagination on lists · flag internal pagination unless "list all" or user-enabled · flag non-idempotent/repeat-unsafe actions · avoid `Promise.all` for rate-limited calls (sequential + delay; API rate limit counter logic acceptable).
- **P2 (UX)**: Required fields first · sensible `defaultValue` on required dropdowns · hide complexity (auto-detect format).
- **P3 (Text)**: Help: short, plain, non-technical · `label` = Title Case · `help`/`placeholder`/errors = sentence case · whereClause labels: sentence case (first capitalized, rest lowercase unless proper noun) · `customHelp`/`customInputLabel`/`customPlaceholder` valid only on dropdown/multiselect/boolean · scan for typos, trailing spaces, sibling inconsistencies.

## Validation Checklist
- Perform: wrapper correct · `axios`/`fetch` only · `context.inputData.<key>` mapped · endpoint matches docs · required-field guards · rate-limit handled · returns raw `response.data`.
- Zero results: generators return appropriate shape per `canPaginate`/`enableSearchApi` config (see Field Types).
- Fields: each matches type's required keys · `sample`==`value` rule · clean labels · reusable-component `id` mapped correctly (verify mapped status via `Fetch_Mapped_Reusable_Component_In_Action_Version`).
- `help` required unless `label`+`key` are completely self-explanatory. Starts with "Enter" for string/ID fields (e.g. `"Enter a parent task ID..."`; never `"Select from the list"`). No "E.g." in `placeholder`/`customPlaceholder` — direct sample values only.
- Labels/placeholders grammatically correct, consistent casing across all fields. Put corrected values in "suggestions".
- If optional boolean keys (`whereClause`, `required`, `canPaginate`, `enableSearchApi`, `list`) are missing, default is `false` — don't flag.

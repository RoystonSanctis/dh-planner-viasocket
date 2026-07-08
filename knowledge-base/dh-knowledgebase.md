---
title: "DH Knowledge Base (Consolidated)"
description: "Token-minimal knowledge base for designing viaSocket plugs. Reason top-down; infer specifics from context."
---

# Page Index
- Core Philosophy
- Plug Anatomy
  - Triggers
  - Actions
- Design Strategy
- Naming
- UX Field Ordering
- Field Types
- Minimalism
- Visibility
- dependsOn vs visibilityCondition
- Perform Code
  - Libraries
  - Globals
- Code Block Execution Timing
- Code Skeletons
  - Instant Subscribe / Unsubscribe
  - Sample (Instant & Scheduled)
  - Transfer (New-event only)
  - Scheduled Perform
  - Actions — one template + per-category delta
- Reusable Components
- Generator Returns
- API Database Payload Schemas
- Review
  - Priorities & Rules
  - General Guidelines


# Core Philosophy
Consolidated Core Philosophy: Non-technical simplicity + technical completeness. Official API docs are ground truth (override user cURL). Every documented API field is either a UI input or handled implicitly in code — never invent undocumented params, never omit a supported optional, never expose auth (viaSocket handles it), and never ask the user for `pluginrecordid` or `authid` (as these are internally passed). Hide raw IDs/jargon behind labels + progressive disclosure; expose full capability via field choosers.

# Plug Anatomy
Plug = **Triggers** (start workflows) + **Actions** (do things). Each = **Input Fields** (UI) + **Perform Code** (logic). Output = raw `inputFields` array — never wrap in `{"inputFields":[...]}`; ignore auto-generated `steps`/`blocks`/`dependsOn`.

## Triggers
| Type (`triggertype`) | Use when | Code blocks |
|---|---|---|
| Instant (`hook`) | Service has webhook subscribe/unsubscribe API | Subscribe (`performsubscribe`), Sample (`performlist`), Perform(modify, optional) (`modifytriggerdata`), Unsubscribe (`performunsubscribe`), Transfer (`transferoption`) |
| Scheduled (`polling`) | No webhook — poll at interval | Sample (`performlist`), Perform(poll) (`perform`), Transfer (`transferoption`) |
| Manual (`manual_webhook`) | Webhooks but no programmatic subscribe — user pastes viaSocket hook URL into service | Sample (`performlist`), Perform(modify, optional) (`modifytriggerdata`) |

**Trigger Selection Priority Flow**:
If not specified, Priority: **Instant (`hook`)** → **Scheduled (`polling`)** → **Manual (`manual_webhook`)**.
1. **Instant**: Check if programmatic subscribe/unsubscribe APIs exist.
2. **Scheduled**: If Instant not possible, check if GET/LIST API exists to poll data, and response has created/updated timestamp OR the configuration supports time filtering.
3. **Manual**: If Scheduled not possible, check if platform supports manual webhook entry.
4. **Fallback**: If manual not possible, ask user for trigger type and API doc/cURL. You can also ask user for trigger type (Instant, Scheduled, Manual) at the start.

Block roles: **Subscribe** register webhook, return data viaSocket stores for unsub · **Unsubscribe** deregister using stored subscribe response · **Sample** latest 1 item else fallback schema for UI preview (wrap `{viasocket_help, ...item}`) · **Perform(modify)** optional reshape of pushed webhook payload, no API call · **Transfer** bulk-pull history; **New-event only**; its List endpoint must have pagination enabled; sends `≤200/batch` (500 → 200+200+100).

## Actions
Single Perform call mapped from `context.inputData`. Categories: GET · LIST · FIND/SEARCH · CREATE · UPDATE · FIND OR CREATE · DELETE.

# Design Strategy
- **Unified actions**: Find+List → one Unified Search. Create+Update → Intelligent Upsert (search by stable ID → update if found else create; prefer native upsert). Never expose Create-vs-Update toggle.
- **Stable identifiers**: prefer email/external_id/sku over volatile DB IDs.
- **Dropdown rule**: dropdown only if dataset small, stable, paginated. Else direct ID string field.
- **Structural respect**: enums→dropdown, arrays→repeating input groups, nested objects→logical grouping. Never fabricate unsupported structures.
- **Idempotency/scale**: state each action's duplicate-prevention key; safe across 1000+ runs. If a query can match multiple records, define deterministic selection (first/newest) or fail safely.
- **Partial update**: send only user-filled fields; never `null`/`''` unless explicitly clearing.
- **Response**: small/flat → return whole payload; large/nested → offer Basic/Detailed mode.
- **Dynamic schema**: pick resource → fetch its schema → render only relevant fields.

# Naming
| Item | Format |
|---|---|
| Action name | Verb + Title Case ("Send Message at Slack Channel") |
| Action desc | ≤30 chars ("Send Slack message") |
| Trigger name | Event phrase fitting after "When ___", no "when", present tense, Title Case ("New Email Arrives"). Avoid mechanism verbs: list/fetch/sync/load/pull/search/check/scan/collect/export. |
| Trigger desc | `Runs when <event>`, ≤30 chars |

App name only if generic without it. Labels clean/generic ("Select Board" not "Select Trello Board"). Preserve compliant existing names on update.

# UX Field Ordering
Required fields first, optionals grouped after. Resource dropdowns for large lists use `canPaginate:true` + `enableSearchApi:true`. **Help placement:** When using a static or dynamic help field, it must always be positioned below the field it is referring to.

| Category | Order |
|---|---|
| Instant | DynDropdown(resource) → whereClause Group? → DynHelp(permission check)? → conditionals |
| Scheduled | DynDropdown → DynDropdown(dependent) → Boolean? → Multiselect(field filter)? → Group(filter only — no pagination fields)? → AIField? |
| Manual | HelpStatic (Only allowed field, step-by-step webhook setup HTML instructions) |
| GET | DynDropdown(parent) → DynDropdown/String(record ID) → Multiselect(fields)? → Group? |
| LIST | DynDropdown(parent) → Multiselect(fields)? → Group(Page Limit, Start Cursor) → AIField? → Boolean? |
| FIND/SEARCH | DynDropdown(parent) → DynDropdown(child)? → Boolean(Basic/Advanced) → Group(filter: column+value for Basic / AIField for Advanced) → Group(sort/limit)? → Multiselect(return)? |
| CREATE | DynDropdown(parent) → DynDropdown(child)? → Boolean? → Multiselect(field chooser) → DynGroup(fieldsGenerator) → AIField?/Dictionary? |
| UPDATE | DynDropdown(parent) → DynDropdown(child)? → DynDropdown/String(record ID) → Multiselect(chooser) → DynGroup(chosen fields only) |
| FIND OR CREATE | DynDropdown(parent) → DynDropdown(child)? → Group(search: AIField if complex query, or DynDropdown+String if simple filter) → Boolean `create_if_not_found` (default `{label:"Yes",value:true}`) → DynGroup(visibilityCondition on toggle) → Multiselect? |
| DELETE | String(record ID) → HelpStatic(irreversibility warning) |

Category deltas beyond order: **Instant** DynHelp validates permissions after resource pick; whereClause renders multi-filter as a sentence (all labels inside use sentence case, only first capitalized; subsequent lowercase). **Scheduled (polling)** never ask the user for pagination fields (limit, page size, start cursor, next page token) or scheduledTime in inputFields/UI; pagination is handled internally via `canpaginate:true` config, and `scheduledTime` is a global variable. **Manual (manual_webhook)** triggers support `performlist` (sample code) and `modifytriggerdata` (Perform Modify Code), and must only contain a single static `help` field in the `inputFields` array (no other fields allowed). **GET** always give the manual-ID triplet (`customHelp`/`customInputLabel`/`customPlaceholder`) so users paste an ID from a prior step. **LIST** default page limit 100. **FIND/SEARCH** Boolean toggles Basic (column + value) vs Advanced (AIField with `suggestionGenerator`). **CREATE/UPDATE** chooser Multiselect feeds the DynGroup; `fieldsGenerator` returns `{message:'Select a resource first.'}` if deps missing; UPDATE help: "unfilled fields stay unchanged". **FIND OR CREATE** use AIField if complex query is supported, or dropdown + string if simple filter is supported; "Create if not found?" toggle (default true) shows creation fields via visibilityCondition when true. **DELETE** keep minimal; always use a direct text ID field (type 'string') to identify the record to delete (no dropdown logic or parent dropdowns); archive toggle if API supports.
**Dropdown Preference & ID Priority:** Always give first preference to dropdowns over text ID fields (type `string`) across all triggers and actions if an options-fetching API is available. Do not bypass parent dropdowns even if they are required to fetch the record ID. If no options-fetching API is available, only then proceed with the type `string` and ask the user for the ID. **UPDATE Action Exception:** This applies strictly to UPDATE Actions (DELETE actions must always use a direct text ID field of type 'string' with no dropdown logic). For the rest of the triggers and actions, it is not applicable (dropdowns always have high priority over string IDs). For UPDATE actions: if the ID field supports a dropdown and no parent dropdown is required to fetch options, the dropdown should be created. If parent dropdowns are required to fetch the ID options, bypass the parent dropdowns and create a direct text ID field (type `string`) instead. Exceptions: if the parent dropdown is already required/selected by other fields in the action anyway, or if the ID dropdown has static options.

# Field Types
Base keys (every field): `key` (unique, no `.`, pattern `^[^.]*$`) · `type` · `label` · `help` · `required` · `placeholder` (where applicable: string, number, html, markdown, boolean, dropdown, multiselect; note that `placeholder` is optional for dropdown, multiselect static and dynamic, and boolean fields). Always include `placeholder` (where required/applicable) and `customPlaceholder` (where applicable: boolean, dropdown, multiselect) in the fields. The value of `placeholder` and `customPlaceholder` must always be a string; even for number, boolean, array, or object values, they must be wrapped in a string (e.g. `"10"`, `"true"`, `"[\"item1\", \"item2\"]"`). Allowed types only: `string`, `number`, `html`, `markdown`, `dictionary`, `boolean`, `dropdown`, `multiselect`, `aifield`, `help`, `input groups`. Optionals per Minimalism. Output valid JSON only — no comments/extra keys.

| `type` | Required (beyond base) | Constraints |
|---|---|---|
| `string` `number` `html` `markdown` | `placeholder` | No `date` type — date/time/DOB → `string`; amount/count/qty → `number`; rich → `html`/`markdown`. `list:true` (string/number only, preconfigured array); `limit:N` requires `list:true`. `list:false` (default) if single value, or if array/comma-separated value is dynamically passed. |
| `dictionary` | `template` | Variable/unknown key-value pairs. `template` FIXED: `{key:{type:string,placeholder},value:{type:string,placeholder}}` — both types always `string`; only placeholder text may change. |
| `boolean` | `options`, `customPlaceholder` | Exactly 2 options `{label,value}`, true-option FIRST. `defaultValue:{label,value}` must equal an option. Labels any binary pair; value mapping arbitrary. `customInputLabel` and `customHelp` are optional for manual mode. (Optional: `placeholder`). |
| `dropdown`/`multiselect` static | `options`, `customInputLabel`, `customPlaceholder` | `options:[{label,value,sample?,extraValue?}]` fixed. `defaultValue` = exact copy of an option (multiselect: array of copies). (Optional: `placeholder`). |
| `dropdown` dynamic | `optionsGenerator`, `customPlaceholder`, `customInputLabel` | `canPaginate:true` (paginated list) ⇒ generator returns `{data,offset,message?}`. `enableSearchApi:true` ⇒ use `__searchText`. Generator returns `{message}` if no options found or to show warning block. Special Case: In the reusable component, if search is active (search query has value) and returns empty results, the `offset` returned must be the current cursor (`pageToken`/`offset` parameter) to preserve the previous offset when switching back to pagination (search API offset is ignored). `customPlaceholder` = manual-input example (such as `"123"`). `customInputLabel` = short manual label (such as `Enter Spreadsheet ID`). Optional: `customHelp` (longer manual help/explain ID location, e.g. "Enter Spreadsheet ID from...", supports markdown links. Phrasing must guide the user to enter the value rather than selecting/choosing it). `defaultValue` = object `{label,value,sample}`. (Optional: `placeholder`). |
| `multiselect` dynamic | `optionsGenerator`, `customPlaceholder`, `customInputLabel` | `customPlaceholder` = array example (such as `"[\"title\",\"status\"]"`). `customInputLabel` = short manual label (such as `Enter Column Name in Array`). Optional: `customHelp` (longer manual help/explain expected array format, e.g. "Enter Column Name in Array...", phrasing must guide the user to enter the value rather than selecting/choosing it). `defaultValue` = array of `{label,value,sample}`. (Optional: `placeholder`). |
| `aifield` | `prompt`, `suggestionGenerator` | AI builds structured data at config-time (user interacts only at setup); result used later in perform. `suggestionGenerator` mandatory (`""` if no dynamic context). `prompt` must output ONLY valid JSON (no backticks/prose), return raw object (no `"filter"` wrapper), quote string vars (`"${...email}"`) but NOT numbers/booleans (`${...age}`). |
| `help` static | — (`key`·`type`·`help` only) | `help` = content (text/HTML/MD + links). No `label`/`required`/`placeholder` allowed. Optional: `visibilityCondition`. Placement: Must be positioned below the field it is referring to. |
| `help` dynamic | `source` | `source` JS → `{message}` (text/HTML/MD). Not `optionsGenerator`. Optional: `label` (header text), `visibilityCondition`. No `required`, `placeholder`, or `help` key allowed. Placement: Must be positioned below the field it is referring to. |
| `input groups` static | `fields` | `fields[]` each independently valid (nestable). `whereClause:true` (static only) → inline sentence UI; recommend dropdown/multiselect children; `label`/`help` optional then. |
| `input groups` dynamic | `label`, `fieldsGenerator` | `fieldsGenerator` → field array, or `{message}` if deps missing (renders warning block). Generated children: any type incl. nested input groups, static+dynamic. Normalize keys: drop `.` → `_` (`label.replace(/\./g,'_')`). Optional: `required`, `help`, `visibilityCondition`. |

**Options metadata**: `sample` MUST equal `value`; include only if `value` is an ID and ≠ `label`. Dynamic `defaultValue` requires `sample`. `extraValue` = hidden metadata supporting all data types (string, number, boolean, object, array, etc.), read via `context?.inputData?.{key}_extraValue` (group: `{group}?.{key}_extraValue`) inside visibility conditions, dynamic generators, or perform/trigger code blocks. It is extremely useful when the option's value is an ID and you want to pass extra info (like the resource type or category) to perform specific visibility logic or actions.

**optionsGenerator invocation:** Any code block inside `optionsGenerator` (whether using inline code or calling a Reusable Component) must be wrapped in a parent `try...catch` block. The `catch` block must handle errors by calling `await errorComponent(error);` (e.g., `try { return await fetchComponent(param1, param2); } catch (error) { await errorComponent(error); }`). If the function code is written inline, it must be explicitly defined, called inside the `try` block, and called/invoked at the end (e.g., `async function getOptions() { ... }; try { return await getOptions(); } catch (error) { await errorComponent(error); }`).

**Visibility + required**: visibility evaluated first — a hidden `required` field is skipped (not enforced). Optional parent revealing a required child → set child `required:true` AND throw in perform if parent set but child missing.

# Minimalism
Include an optional key only when it adds info beyond `label` + specific app + specific action. Optionals: `defaultValue` (sensible default exists) · `customHelp` (where to find a manual ID, phrasing must guide the user to enter the value, e.g., "Enter value..." or "Enter ID...", rather than selecting/choosing it) · `sample` (value is ID ≠ label) · `visibilityCondition` (conditional) · `required` (mandatory; defaults false). (Note: `placeholder` is optional for dropdown, multiselect static and dynamic, and boolean fields, but required/must be included in string, number, html, and markdown fields. `customPlaceholder` is always required/must be included in boolean, dropdown, and multiselect fields where applicable. `customInputLabel` is required for dropdown and multiselect fields, and optional for boolean fields). `help` is optional (do not flag if missing) — keep its value concise, short, plain, and non-technical.

# Visibility
JS expression on `context?.inputData?.<path>`; must evaluate to boolean (supports `.includes()`, calcs).

| On | Pattern |
|---|---|
| Multiselect any | `Array.isArray(context?.inputData?.k) && context.inputData.k.length > 0` |
| Multiselect value | `context?.inputData?.k?.includes('A')` |
| String/Dropdown eq / in | `context?.inputData?.k === 'v'` / `['A','B'].includes(context?.inputData?.k)` |
| Boolean t/f | `context?.inputData?.k` / `!context?.inputData?.k` |
| In group | `context?.inputData?.group?.k` |
| `extraValue` | `context?.inputData?.k_extraValue === 'x'` (group: `context?.inputData?.group?.k_extraValue`) — supports all data types in conditions and code blocks |
| Calc | `(context?.inputData?.a * context?.inputData?.b) > 100` |

# dependsOn vs visibilityCondition
`dependsOn` auto-populated ONLY from field paths referenced inside `optionsGenerator`/`fieldsGenerator`/`suggestionGenerator`. Never write manually. `visibilityCondition` does NOT populate it — static fields keep empty `dependsOn` even when conditionally shown.

**Generator context access**: read upstream values via `context?.inputData?.<key>`; group-scoped via `context?.inputData?.<group>?.<field>`. Pagination token: `context?.paginateData?.['<field>']`; in group `['group.field']`; nested groups add keys in path order. `__searchText` only when `enableSearchApi:true`. `axios` available directly in these generators.

# Perform Code
Both of the following structures are valid and supported:

**Format 1: Wrapping async function**
```javascript
async function <functionName>() {
  try {
    // validate required fields; build request from context.inputData; call API
  } catch (error) {
    await errorComponent(error); // catch ALWAYS uses errorComponent (supersedes legacy `throw error`; exception: Reusable Components must use `throw error` or `throw e` in catch)
  }
}
return await <functionName>();
```

**Format 2: Direct parent try-catch (no wrapping function)**
```javascript
try {
  // validate required fields; build request from context.inputData; call API
} catch (error) {
  await errorComponent(error); // catch ALWAYS uses errorComponent (supersedes legacy `throw error`; exception: Reusable Components must use `throw error` or `throw e` in catch)
}
```
- No `import`/`require`. HTTP via `axios`/`fetch` only. Auth handled by viaSocket — never include (add an extra header/query/body only if API needs a non-standard value).
- Read inputs via `context?.inputData?.<key>`. Validate every `required:true` field at top — `throw` before the API call if missing/empty/null.
- `throw` **inside `try`** for validation and for 200-responses carrying an error body (viaSocket reads the final response code; this avoids a false success). Wrapper routes it to `errorComponent`.
- Return `response.data` raw — don't reshape, don't add fields. Array return → flow iterates per item.
- No `console.log`. Handle API rate limits in loops (delay/retry/headers). GET uses `params`, POST uses `data`.

## Libraries
Direct, no import: `axios` `fetch`(node-fetch) `https` `crypto` `setTimeout` `Buffer` `atob` `FormData`(form-data) `jwt`(jsonwebtoken) `_`(lodash) `cheerio` `moment` `XMLParser` `XMLBuilder` `XMLValidator`. `axios` accepts `maxBodyLength:Infinity` for large bodies. Same set available inside reusable components.

## Globals
| Global | Where |
|---|---|
| `__executionStartTime__` | Scheduled Perform — run timestamp. Lookback: `new Date(__executionStartTime__ - scheduledTime*60000)` |
| `context.inputData.scheduledTime` | Scheduled — interval (min) |
| `context.paginationData` | Scheduled cursor across runs (init `0`/`null`; requires pagination enabled in UI). Advance ONLY if filtered-nonempty AND new next-token. Repeated token auto-breaks the loop. **Reassigning to `0`/`null` resets to start.** **CRITICAL WARNING:** NEVER assign `null`, `0`, or clear `context.paginationData` in an `else` block or when there are no more pages. Simply do NOT reassign or modify `context.paginationData` to stop the loop. |
| `context.paginateData['<field>']` | Dynamic dropdown/multiselect `optionsGenerator` token. Group: `['group.field']`; nested: path order. |
| `__searchText` | Generators when `enableSearchApi:true` |
| `context.inputData.transferOption.offset` | Transfer |
| `context.inputData.hookUrl`, `_scriptId` | Instant Subscribe (`_scriptId` only if service needs a unique webhook key) |
| `context.inputData.performsubscribe` | Instant Unsubscribe (= subscribe response) |

# Code Block Execution Timing
| Block | Fires |
|---|---|
| Subscribe | Flow publish · status→active · trigger config changed (new config) |
| Unsubscribe | Flow trashed · status→inactive · trigger config changed (old config) |
| Sample | Test button — its response feeds Perform(modify) if present, else goes straight to the flow |
| Perform(modify) | After Sample on Test; in production webhook payload goes directly to it (Sample not run) |
| Perform (Scheduled/Manual/Action) | Each tick / flow run |
| Transfer | Transfer button — user picks selected/all; sent in `≤200` batches |

# Code Skeletons
Trigger blocks (Subscribe, Unsubscribe, Sample, Manual Trigger Perform/Sample) start directly with the `try-catch` outer wrap (no `async (context) =>` wrapper). Scheduled Perform and Actions use the `async <functionName>() { try { ... } catch (e) { await errorComponent(e); } } return await <functionName>();` wrapper, naming the function according to the operation performed.

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
```javascript
const res = await axios.get('<url>/<resource>', { params: { limit: 1, sort: 'created_at:desc' } });
const items = res.data?.results || res.data || [];
if (items.length) return { viasocket_help: REAL, ...items[0] };
// Fallback — Instant: hardcoded expected keys. Scheduled: fetch schema, map each property type → empty.
return { viasocket_help: SAMPLE /* + every expected key with empty/default */ };
```
- `REAL` = "This is the latest item data available in the selected resource. Save the Trigger and publish to get the new item created in the selected resource."
- `SAMPLE` = "This data is only a sample of the original data. If you want to see the original data, then you have to save the trigger, publish the flow and perform the given action."
- Type→empty: `['array','list','multi_select']`→`[]`; `boolean`→`false`; `number`→`0`; else `""`.

## Transfer (New-event only)
```javascript
const offset = context?.inputData?.transferOption?.offset || null;
const params = { limit: 100 }; // ≤200
if (offset) params.cursor = offset;
const res = await axios.get('<url>/<endpoint>', { params });
return {
  data: res.data?.results || res.data || [],
  offset: res.data?.next_cursor || null,
  uniqueIdentifier: 'id' // key holding each record's unique value
};
```

## Scheduled Perform
Time window (all variants): `const t = new Date(__executionStartTime__ - (context?.inputData?.scheduledTime || 15) * 60000);`
- **Native filter (preferred)**: pass `created_at_min=t` (+ `fields=` from a Multiselect) to API; one call.
- **Client filter — new items**: fetch page → `items.filter(i => new Date(i.created_time) >= t)` → sort oldest-first.
- **Client filter — updated items**: filter `last_edited_time >= t && created_time !== last_edited_time` (drops never-edited / just-created) → sort ascending by `last_edited_time`.
- **Pagination Update Pattern**: Only update pagination data if filtered results are non-empty and API returned a next cursor/page:
  ```javascript
  if (filteredData.length !== 0 && response?.data?.next_cursor) {
      context.paginationData = response.data.next_cursor;
  }
  ```

## Actions — one template + per-category delta
```javascript
async function <functionName>() {
  try {
    const id = context?.inputData?.record_id;
    if (!id) throw new Error('record_id is required.'); // validate every required field
    const res = await axios.<method>(`<url>/resources/${id}`, /* params|payload from inputData */);
    return res?.data; // raw
  } catch (e) { await errorComponent(e); }
}
return await <functionName>();
```
| Category | Call | Notes |
|---|---|---|
| GET | `GET /resources/:id` | validate id; handle 404 |
| LIST | `GET /resources?page,cursor` | pagination params; Multiselect → `fields` |
| FIND/SEARCH | `GET /resources?q=` | native query first; client `.find()` fallback → `{results:[]}` |
| CREATE | `POST /resources` | payload from `inputData`; normalize generated keys `.`→`_` |
| UPDATE | `PATCH`/`PUT`/`POST /resources/:id` | partial: include key only if value `!== undefined/null/''` (unless explicit clear) |
| FIND OR CREATE | `GET` search → `POST` if none | search by stable ID first; never assume record exists |
| DELETE | `DELETE /resources/:id` (or `PATCH`/`POST` archive) | validate id; handle 404 already-deleted |

# Reusable Components
JS stored once (three parts: **Name** unique+permanent once used, **Parameters**, **Code** = raw JavaScript code starting directly with a `try`/`catch` block. Do NOT wrap the code in a function block. The parameters defined in the component's metadata are available as global variables directly inside this code block. Inside the catch block, you MUST use `throw error` or `throw e` instead of calling `errorComponent`). Invoked only from `optionsGenerator`/`fieldsGenerator`/`suggestionGenerator` — never static fields. (Note: Inside the `optionsGenerator` that invokes/maps this component, the invocation must be wrapped in a parent `try-catch` block and the catch block must call `await errorComponent(error)`).
- Accept ALL dependent inputs (search text, limit, every input-field path) as **parameters** — this enables `dependsOn` auto-detection. Always map the dynamic values to these parameters; never read `context.inputData`/`__searchText`/`context.paginateData` directly inside the component's code block.
- Validate inputs at top (throw on missing). Return matches host field shape.
- **Search-Pagination Offset Rule:** If a dynamic dropdown component supports both search and pagination (`enableSearchApi: true` and `canPaginate: true`), and the search parameter is active, if the search returns empty results, the returned `offset` must be the current cursor (`pageToken`/`offset` parameter). This ensures that if the user switches from searching back to pagination, the previous pagination offset is preserved (ignoring any search-returned offset).
```javascript
// fetchResources(searchText, pageToken, pageSize)
try {
  if (!pageSize) throw new Error('pageSize required');
  const res = await axios.get('<url>/<endpoint>', { params: { q: searchText, cursor: pageToken, limit: pageSize } });
  return {
    data: (res.data?.items || []).map(i => ({ label: i.name, value: i.id, sample: i.id })),
    offset: res.data?.next_cursor || null
  };
} catch (error) {
  throw error; // Reusable Components MUST use 'throw error' or 'throw e' in catch
}
```
Caller (in `optionsGenerator`): `try { return await fetchResources(__searchText, context?.paginateData?.['my_field'], 100); } catch (error) { await errorComponent(error); }` — map the component's `id` correctly.
- **Tool usage (`create_update_map_Reusable_components`)**: Use this tool to create, update, or map reusable components.
  - **Map**: Requires `actionVersionRowId`, `path` and `component_id`.
  - **Create**: Do not send `component_id` or `path`. Requires `function_name`, `params`, `code`, and `description`.
  - **Update**: Requires `component_id`. Send only the fields to update (`params`, `code`, or `description`). Do not change `function_name`.

# Generator Returns
| Generator | Return |
|---|---|
| `optionsGenerator` standard | `[{label, value, sample?, extraValue?}]` |
| `optionsGenerator` paginated (`canPaginate:true`) | `{data, offset: string\|number\|null}` |
| `optionsGenerator` empty/info | `{message}` (hybrid: `{data, offset, message}`) |
| `fieldsGenerator` | field-object array, or `{message}` if deps missing |
| `suggestionGenerator` | schema/context shape the AI can consume |
| Help dynamic `source` | `{message}` |

# API Database Payload Schemas
- **Action (Create/Update)**: `name`, `key`, `description`, `pluginrecordid`, `isvisible` ('false'|'true'), `type: 'action'`, `category`, `sub_category` (optional), `rtllayer` (boolean), `isAIActionTrigger` (boolean), `functionId` (optional on create), `isUserOnDh` (boolean), `inputjson: {steps: {}, blocks: {}, inputFields: [...]}` (always pass empty objects `{}` for `steps` and `blocks`), `perform`, `authid` (optional), `metadata: {chatbotthreadid}` (optional).
- **Trigger (Create/Update)**: Common: `authid`, `category`, `sub_category` (optional), `description`, `ignoreuniversalsampledata` (boolean), `isvisible` ('True'|'False'), `key`, `name`, `pluginrecordid`, `preferred_step_name`, `type: 'trigger'`, `triggertype: 'hook'|'polling'|'manual_webhook'`, `inputjson: {steps: {}, blocks: {}, inputFields: [...]}` (always pass empty objects `{}` for `steps` and `blocks`). The additional keys for each trigger which is specified are the supported keys and is required. If keys are updated only updated keys are sent.
  - *Instant (`hook`)*: `performsubscribe`, `performunsubscribe`, `performlist`, `modifytriggerdata`, `transferoption`.
  - *Schedule (`polling`)*: `perform`, `performlist`, `transferoption`, `scheduleTimeOptions` (array, e.g. `[]` or `[5,15,60,720,1440]`), `canpaginate` (boolean, set to true to enable the pagination feature if using the pagination path `context?.paginationData` in the perform code).
  - *Manual (`manual_webhook`)*: `performlist`, `modifytriggerdata`.
- **Reusable Component**:
  - *Create*: `function_name`, `description`, `params: [{name, sample}]` (where the `sample` key contains the parameter's sample value along with its data type; if the value is a string, it must be wrapped in double quotes e.g., `"sample":"\"field ID\""`, and for other types like number, object, boolean, or array, the value is direct/unwrapped), `code` (raw JS in try-catch parent format, not wrapped in a function, params are global), `pluginrecordid`, `function_code` (async JS wrapper function block wrapping the name, parameters, and code), `componentgenerationsource: 'userGenerated'|'aiGenerated'`, `functionId` (action version ID).
  - *Update*: `rowid`, `description`, `function_code` (async JS wrapper function block wrapping the name, parameters, and code), `componentgenerationsource: 'userGenerated'|'aiGenerated'`, `code` (raw JS in try-catch parent format, not wrapped in a function, params are global).
- **Mapping (action_version_component_table)**: `action_version_id`, `component_id`, `pluginrecordid`, `action_id`, `path` (code block name e.g. `'perform'`/`'performsubscribe'` etc. or input field key).

# Review

## Priorities & Rules
- **P0 (Breaking)**:
  - Catch must await `errorComponent(error)` (except for Reusable Components which must use `throw error` or `throw e` in catch). Any code block in `optionsGenerator` (whether inline code or calling a Reusable Component) must be wrapped in a parent `try-catch` block and call `await errorComponent(error)` in the `catch` block (do NOT throw error).
  - Every `context.inputData.<key>` must exist in input fields. No orphan fields. `visibilityCondition` must map to real keys.
  - Payload must match API schema.
  - Do not require URL extensions (use presence checks).
  - Derived required values must have fallbacks.
  - No auth logic or hardcoded secrets.
  - Generators: return `{ message: <text> }` on zero results; handle unselected parent state.
  - Reject malformed JSON (duplicate keys, broken escaping, missing commas).
  - Guard required fields (throw at top if missing/empty/null).
- **P1 (Automation)**:
  - No raw internal IDs typed by user (resolve via dropdowns).
  - Handle pagination on lists. Flag internal pagination if its not `list all` or `list all items` unless user has the option to have internal pagination based on user flag or enable pagination.
  - Flag non-idempotent or repeat-unsafe actions.
  - Avoid `Promise.all` for rate-limited calls; use sequential + delay. There can be the api rate limit function having counter logic which is used to limit the api calls.
- **P2 (UX)**:
  - Required fields first. Sensible `defaultValue` on required dropdowns. Hide complexity (auto-detect format).
- **P3 (Text/Consistency)**:
  - Help text: short, plain, non-technical.
  - `label` = Title Case. `help`, `placeholder`, errors = sentence case. **Exception:** In `whereClause: true` input groups, all field labels must use sentence case; only the first field's label starts with a capital letter, and subsequent labels start with lowercase (e.g., `"posted after date"`) unless they are proper nouns (e.g., `"Media"`).
  - `customHelp`/`customInputLabel`/`customPlaceholder` valid only on dropdowns, multiselect, and boolean.
  - Scan for typos, trailing spaces, and differences from sibling actions.

## General Guidelines
Validate against all rules above. New checks: reusable-component `id` mapped correctly; FIND/SEARCH `.find()` fallback returns `{results:[]}`; clean generic labels; output the raw `inputFields` array only (no `steps`/`blocks`/`dependsOn`/auth/headers).
Validate against this file; output the raw `inputFields` array (never the `{"inputFields":[...]}` wrapper); never expose auth or force users to manage internal IDs; don't ask the user for `pluginrecordid` or `authid`, as this is internally passed; don't invent undocumented params; every documented API field is in UX or handled in code.
- **Perform**:
  - Wrapper correct (`async <functionName>()` matching the operation performed) · `axios`/`fetch` only, no imports · `context.inputData.<key>` mapped · endpoint matches docs · required-field guards (`throw` before call) · `errorComponent` in catch · rate-limit handled · no auth · no `console.log` · returns raw `response.data`.
  - **No Hard-coded Input Values**: No hard-coded input values are allowed (except documented default fallbacks).
  - **Zero Results for Generators**: For `fieldsGenerator` / `optionsGenerator` only: on zero results, return `{message: <user message>}`.
- **Fields & Text Quality**:
  - Each field matches its type's required keys · `sample`==`value` rule · clean labels · only `inputFields` (no `steps`/`blocks`/auth/headers) · reusable-component `id` mapped.
  - **Help Key**: `help` must be short, plain, and non-technical.
  - **Labels & Placeholders**: Must be clear and grammatically correct. Do NOT use "E.g." or "e.g." in `placeholder` or `customPlaceholder` (such as using `"john@example.com"` instead of `"E.g. john@example.com"`); they must contain direct sample values only. The value of `placeholder` and `customPlaceholder` must always be a string, and must be wrapped in a string/quotes for number, array, object, and boolean values (e.g., `"10"`, `"true"`, `"[\"item\"]"`).
  - **Suggestions for Text**: Put the corrected value in "suggestions" for fixed help/label/placeholder.
  - **Consistency**: Ensure `help`/`label`/`placeholder` are consistent across all fields. Fix casing, wording, and punctuation mismatches (e.g., "Select option." vs "select Options" → "Select Option" (Title Case)).

---
title: "DH Knowledge Base (Consolidated)"
description: "Token-minimal knowledge base for designing viaSocket plugs. Reason top-down; infer specifics from context."
---

# Page Index
- Core Philosophy
- Plug Anatomy: Triggers, Actions
- Design Strategy
- Naming
- UX Field Ordering
- Field Types
- Minimalism
- Visibility
- dependsOn vs visibilityCondition
- Perform Code: Libraries, Globals
- Code Block Execution Timing
- Code Skeletons: Instant Subscribe / Unsubscribe, Sample (Instant & Scheduled), Transfer (New-event only), Scheduled Perform, Actions — one template + per-category delta
- Reusable Components
- Generator Returns
- Review

# Core Philosophy
Non-technical simplicity + technical completeness. Official API docs are ground truth (override user cURL). Every documented API field is either a UI input or handled implicitly in code — never invent undocumented params, never omit a supported optional, never expose auth (viaSocket handles it). Hide raw IDs/jargon behind labels + progressive disclosure; expose full capability via field choosers.

# Plug Anatomy
Plug = **Triggers** (start workflows) + **Actions** (do things). Each = **Input Fields** (UI) + **Perform Code** (logic). Output = raw `inputFields` array — never wrap in `{"inputFields":[...]}`; ignore auto-generated `steps`/`blocks`/`dependsOn`.

## Triggers
| Type | Use when | Code blocks |
|---|---|---|
| Instant | Service has webhook subscribe/unsubscribe API | Subscribe, Sample, Perform(modify, optional), Unsubscribe, Transfer |
| Scheduled | No webhook — poll at interval | Sample, Perform(poll), Transfer |
| Manual | Webhooks but no programmatic subscribe — user pastes viaSocket hook URL into service | Sample(hardcoded schema), Perform(modify, optional) |

Block roles: **Subscribe** register webhook, return data viaSocket stores for unsub · **Unsubscribe** deregister using stored subscribe response · **Sample** latest 1 item else fallback schema for UI preview (wrap `{viasocket_help, ...item}`) · **Perform(modify)** optional reshape of pushed payload, no API call · **Transfer** bulk-pull history; **New-event only**; its List endpoint must have pagination enabled; sends `≤200/batch` (500 → 200+200+100).

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
Required fields first, optionals grouped after. Resource dropdowns for large lists use `canPaginate:true` + `enableSearchApi:true`.

| Category | Order |
|---|---|
| Instant | DynDropdown(resource) → whereClause Group? → DynHelp(permission check)? → conditionals |
| Scheduled | DynDropdown → DynDropdown(dependent) → Boolean? → Multiselect(field filter)? → Group(pagination/filter)? → AIField? |
| Manual | HelpStatic(setup: copy viaSocket hook URL → paste into service) → inputs → Dropdown? |
| GET | DynDropdown(parent) → DynDropdown/String(record ID) → Multiselect(fields)? → Group? |
| LIST | DynDropdown(parent) → Multiselect(fields)? → Group(Page Limit, Start Cursor) → AIField? → Boolean? |
| FIND/SEARCH | DynDropdown(parent) → DynDropdown(child)? → Boolean(Basic/Advanced) → Group(filter: column+value for Basic / AIField for Advanced) → Group(sort/limit)? → Multiselect(return)? |
| CREATE | DynDropdown(parent) → DynDropdown(child)? → Boolean? → Multiselect(field chooser) → DynGroup(fieldsGenerator) → AIField?/Dictionary? |
| UPDATE | DynDropdown(parent) → DynDropdown(child)? → DynDropdown/String(record ID) → Multiselect(chooser) → DynGroup(chosen fields only) |
| FIND OR CREATE | DynDropdown(parent) → DynDropdown(child)? → Group(search) → Boolean `create_if_not_found` (default `{label:"Yes",value:true}`) → DynGroup(visibilityCondition on toggle) → Multiselect? |
| DELETE | DynDropdown(parent) → DynDropdown(child)? → DynDropdown/String(record ID) → HelpStatic(irreversibility warning) |

Category deltas beyond order: **Instant** DynHelp validates permissions after resource pick; whereClause renders multi-filter as a sentence. **GET** always give the manual-ID triplet (`customHelp`/`customInputLabel`/`customPlaceholder`) so users paste an ID from a prior step. **LIST** default page limit 100. **FIND/SEARCH** Boolean toggles Basic (column + value) vs Advanced (AIField with `suggestionGenerator`). **CREATE/UPDATE** chooser Multiselect feeds the DynGroup; `fieldsGenerator` returns `{message:'Select a resource first.'}` if deps missing; UPDATE help: "unfilled fields stay unchanged". **DELETE** keep minimal; archive toggle if API supports.

# Field Types
Base keys (every field): `key` (unique, no `.`, pattern `^[^.]*$`) · `type` · `label` · `help`. Allowed types only: string, number, html, markdown, dictionary, boolean, dropdown, multiselect, aifield, help, input groups. Optionals per Minimalism. Output valid JSON only — no comments/extra keys.

| `type` | Required (beyond base) | Constraints |
|---|---|---|
| `string` `number` `html` `markdown` | — | No `date` type — date/time/DOB → `string`; amount/count/qty → `number`; rich → `html`/`markdown`. `list:true` (string/number only, preconfigured array); `limit:N` requires `list:true`. |
| `dictionary` | `template` | Variable/unknown key-value pairs. `template` FIXED: `{key:{type:string,placeholder},value:{type:string,placeholder}}` — both types always `string`; only placeholder text may change. |
| `boolean` | `options` | Exactly 2 options `{label,value}`, true-option FIRST. `defaultValue:{label,value}` must equal an option. Labels any binary pair; value mapping arbitrary. `customHelp`/`customPlaceholder` for manual mode. |
| `dropdown`/`multiselect` static | `options` | `options:[{label,value,sample?,extraValue?}]` fixed. `defaultValue` = exact copy of an option (multiselect: array of copies). |
| `dropdown` dynamic | `optionsGenerator`, `customPlaceholder` | `canPaginate:true` (list API paginates) ⇒ generator returns `{data,offset}`. `enableSearchApi:true` (list API supports search) ⇒ use `__searchText`. `customPlaceholder` = manual-input example. `defaultValue` = object `{label,value,sample}`. |
| `multiselect` dynamic | `optionsGenerator`, `customPlaceholder` | `customPlaceholder` = array example (e.g. `["title","status"]`). `defaultValue` = array of `{label,value,sample}`. |
| `aifield` | `prompt`, `suggestionGenerator` | AI builds structured data at config-time (user interacts only at setup); result used later in perform. `suggestionGenerator` mandatory (`""` if no dynamic context). `prompt` must output ONLY valid JSON (no backticks/prose), return raw object (no `"filter"` wrapper), quote string vars (`"${...email}"`) but NOT numbers/booleans (`${...age}`). |
| `help` static | — (`key`·`type`·`help` only) | `help` = content (text/HTML/MD + links). No `label`/`required`/`placeholder`. |
| `help` dynamic | `source` | `source` JS → `{message}` (text/HTML/MD). Not `optionsGenerator`. No extra keys. |
| `input groups` static | `fields` | `fields[]` each independently valid (nestable). `whereClause:true` (static only) → inline sentence UI; recommend dropdown/multiselect children; `label`/`help` optional then. |
| `input groups` dynamic | `label`, `fieldsGenerator` (`help` optional) | `fieldsGenerator` → field array, or `{message}` if deps missing. Generated children: any type incl. nested groups, static+dynamic. Normalize keys: drop `.` → `_` (`label.replace(/\./g,'_')`). |

**Options metadata**: `sample` MUST equal `value`; include only if `value` is an ID and ≠ `label`. Dynamic `defaultValue` requires `sample`. `extraValue` = hidden metadata, read via `context?.inputData?.{key}_extraValue` (group: `{group}?.{key}_extraValue`).

**Visibility + required**: visibility evaluated first — a hidden `required` field is skipped (not enforced). Optional parent revealing a required child → set child `required:true` AND throw in perform if parent set but child missing.

# Minimalism
Include an optional key only when it adds info beyond `label` + specific app + specific action. Optionals: `placeholder` (format non-obvious) · `defaultValue` (sensible default exists) · `customHelp`/`customInputLabel`/`customPlaceholder` (where to find a manual ID) · `sample` (value is ID ≠ label) · `visibilityCondition` (conditional) · `required` (mandatory; defaults false). `help` is required — keep its value concise.

# Visibility
JS expression on `context?.inputData?.<path>`; must evaluate to boolean (supports `.includes()`, calcs).

| On | Pattern |
|---|---|
| Multiselect any | `Array.isArray(context?.inputData?.k) && context.inputData.k.length > 0` |
| Multiselect value | `context?.inputData?.k?.includes('A')` |
| String/Dropdown eq / in | `context?.inputData?.k === 'v'` / `['A','B'].includes(context?.inputData?.k)` |
| Boolean t/f | `context?.inputData?.k` / `!context?.inputData?.k` |
| In group | `context?.inputData?.group?.k` |
| `extraValue` | `context?.inputData?.k_extraValue === 'x'` (group: `context?.inputData?.group?.k_extraValue`) |
| Calc | `(context?.inputData?.a * context?.inputData?.b) > 100` |

# dependsOn vs visibilityCondition
`dependsOn` auto-populated ONLY from field paths referenced inside `optionsGenerator`/`fieldsGenerator`/`suggestionGenerator`. Never write manually. `visibilityCondition` does NOT populate it — static fields keep empty `dependsOn` even when conditionally shown.

**Generator context access**: read upstream values via `context?.inputData?.<key>`; group-scoped via `context?.inputData?.<group>?.<field>`. Pagination token: `context?.paginateData?.['<field>']`; in group `['group.field']`; nested groups add keys in path order. `__searchText` only when `enableSearchApi:true`. `axios` available directly in these generators.

# Perform Code
```javascript
async function run() {
  try {
    // validate required fields; build request from context.inputData; call API
  } catch (error) {
    await errorComponent(error); // catch ALWAYS uses errorComponent (supersedes legacy `throw error`)
  }
}
return await run();
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
| `context.paginationData` | Scheduled cursor across runs (init `0`/`null`; requires pagination enabled in UI). Advance ONLY if filtered-nonempty AND new next-token. Repeated token auto-breaks the loop. **Reassigning to `0`/`null` resets to start.** |
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
Trigger blocks (Subscribe, Unsubscribe, Sample, Manual Trigger Perform/Sample) start directly with the `try-catch` outer wrap (no `async (context) =>` wrapper). Scheduled Perform and Actions use the `async function run() { try { ... } catch (e) { await errorComponent(e); } } return await run();` wrapper.

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
- **Native filter (preferred)**: pass `created_at_min=t` (+ `fields=` from a Multiselect) to API; one call; advance on raw count: `if (items.length) context.paginationData = page + 1`.
- **Client filter — new items**: fetch page → `items.filter(i => new Date(i.created_time) >= t)` → sort oldest-first → advance cursor only if `filtered.length && next_cursor`.
- **Client filter — updated items**: filter `last_edited_time >= t && created_time !== last_edited_time` (drops never-edited / just-created) → sort ascending by `last_edited_time` → advance as above.

## Actions — one template + per-category delta
```javascript
async function run() {
  try {
    const id = context?.inputData?.record_id;
    if (!id) throw new Error('record_id is required.'); // validate every required field
    const res = await axios.<method>(`<url>/resources/${id}`, /* params|payload from inputData */);
    return res?.data; // raw
  } catch (e) { await errorComponent(e); }
}
return await run();
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
JS stored once (three parts: **Name** unique+permanent once used, **Parameters**, **Code** = valid async JS fn with try/catch). Invoked only from `optionsGenerator`/`fieldsGenerator`/`suggestionGenerator` — never static fields.
- Accept ALL dependent inputs (search text, limit, every input-field path) as **parameters** — this enables `dependsOn` auto-detection. Never read `context.inputData`/`__searchText`/`context.paginateData` inside.
- Validate inputs at top (throw on missing). Return matches host field shape.
```javascript
// fetchResources(searchText, pageToken, pageSize)
if (!pageSize) throw new Error('pageSize required');
const res = await axios.get('<url>/<endpoint>', { params: { q: searchText, cursor: pageToken, limit: pageSize } });
return {
  data: (res.data?.items || []).map(i => ({ label: i.name, value: i.id, sample: i.id })),
  offset: res.data?.next_cursor || null
};
```
Caller (in `optionsGenerator`): `return await fetchResources(__searchText, context?.paginateData?.['my_field'], 100);` — map the component's `id` correctly.

# Generator Returns
| Generator | Return |
|---|---|
| `optionsGenerator` standard | `[{label, value, sample?, extraValue?}]` |
| `optionsGenerator` paginated (`canPaginate:true`) | `{data, offset: string\|number\|null}` |
| `optionsGenerator` empty/info | `{message}` (hybrid: `{data, offset, message}`) |
| `fieldsGenerator` | field-object array, or `{message}` if deps missing |
| `suggestionGenerator` | schema/context shape the AI can consume |
| Help dynamic `source` | `{message}` |

# Review
Validate against all rules above. New checks: reusable-component `id` mapped correctly; FIND/SEARCH `.find()` fallback returns `{results:[]}`; clean generic labels; output the raw `inputFields` array only (no `steps`/`blocks`/`dependsOn`/auth/headers).
Validate against this file; output the raw `inputFields` array (never the `{"inputFields":[...]}` wrapper); never expose auth or force users to manage internal IDs; don't invent undocumented params; every documented API field is in UX or handled in code.
- **Perform**: wrapper correct (`async function run()`) · `axios`/`fetch` only, no imports · `context.inputData.<key>` mapped · endpoint matches docs · required-field guards (`throw` before call) · `errorComponent` in catch · rate-limit handled · no auth · no `console.log` · returns raw `response.data`.
- **Fields**: each field matches its type's required keys · `sample`==`value` rule · clean labels · only `inputFields` (no `steps`/`blocks`/auth/headers) · reusable-component `id` mapped.

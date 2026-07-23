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
Single Perform call mapped from `context.inputData`. Categories: GET · LIST · FIND/SEARCH · CREATE · UPDATE · FIND OR CREATE · FIND + UPDATE · DELETE.

# Design Strategy
- **Decision Dimensions**: Balance Accessibility (non-technical focus), Workflow Simplicity, Technical Feasibility, Scalability, and Structural Constraints based on context.
- **Unified actions**: List+Search+Get → one Unified LIST action (dropdown Mode select: List All with optional pagination/fetch all, Search by... (identifier), Search by ID, or Advance Search if supported). Create+Update → Intelligent Upsert (search by stable ID → update if found else create; prefer native upsert). Never expose Create-vs-Update toggle.
- **Stable identifiers**: prefer email/external_id/sku over volatile DB IDs.
- **Dropdown rule**: dropdown only if dataset small, stable, paginated. Else direct ID string field.
- **Structural respect**: enums→dropdown, arrays→repeating input groups, nested objects→logical grouping. Never fabricate unsupported structures.
- **Idempotency/scale**: state each action's duplicate-prevention key; safe across 1000+ runs. If a query can match multiple records, define deterministic selection (first/newest) or fail safely.
- **Partial update**: send only user-filled fields; never `null`/`''` unless explicitly clearing.
- **Response**: small/flat → return whole payload; large/nested → offer Basic/Detailed mode.
- **Dynamic schema**: pick resource → fetch its schema → render only relevant fields.
- **Connection-Level Context**: Capture workspace/org/tenant in connection/auth setup if no dynamic list API exists, rather than action fields.
- **Format Abstraction**: Automatically infer/detect content formats (e.g. HTML vs plain text) internally in perform code rather than asking users.
- **Default Value Rule**: Omit `defaultValue` if the API natively defaults the parameter when omitted, unless a UX override is needed.
- **customHelp Guidelines**: Explain business meaning and task context (e.g., select parent task); never direct users to copy IDs from browser URLs.
- **Workflow Purity**: Prefer clean `Trigger → Action` steps without intermediate JS code steps.
- **Coded Values**: Map numeric enums via input help text unless stable enough for a dropdown.
- **Backward Compatibility**: Never rename/remove keys (invalidates mappings); only update labels, help texts, visibility, or add optional fields.
- **Consolidate Related Actions**: Fold related behavioral variants (e.g., "schedule message" as a toggle inside "send message") into a single action using a Boolean or Static Dropdown, rather than shipping separate near-duplicate actions.
- **Human Units Over Machine Units**: Accept user-friendly units (days, relative dates) via String or Number. Convert to machine units (UNIX timestamps, ISO dates) in perform code. Never make the user compute timestamps.
- **Label Options Format**: When the human label differs from the API key in dynamic dropdowns/multiselects, format option labels as `"Display Name (schemaKey)"` so users pick by meaning while the correct key is submitted.
- **Preset Duration/Expiry**: When an API accepts a small set of common duration or expiry values, use a Static Dropdown with preset options instead of a free number field.
- **Relative vs. Fixed Scheduling Toggle**: Provide a toggle (Boolean or Static Dropdown) to choose between relative dates/offsets (e.g., "Days from Today", "Last N Days") and exact/fixed datetimes. Perform all arithmetic and formatting internally in the perform code to keep inputs simple.
- **Predefined Static Multiselect**: For stable, predictable sets of API parameters (e.g. metrics, dimensions, tags), use a static Multiselect instead of asking the user to manually type comma-separated strings.
- **Dynamic Questionnaire/Form Loading**: Use dynamic input groups (`fieldsGenerator`) to fetch custom fields only after the parent resource/event type is selected, ensuring the UI remains clean and uncluttered.
- **Grouped Conditional Filters**: Group filters inside an Input Group, gating specific filter value fields with `visibilityCondition` based on the selected filter dimension.
- **Dynamic Endpoint and Param Scoping**: Dynamically adjust endpoints or API parameters in `optionsGenerator` based on a parent scope selector (e.g., Personal vs Organization/Team).

# Naming
| Item | Format |
|---|---|
| Action name | Verb + Title Case ("Send Message at Slack Channel") |
| Action desc | ≤30 chars ("Send Slack message") |
| Trigger name | Event phrase fitting after "When ___", no "when", present tense, Title Case ("New Email Arrives"). Avoid mechanism verbs: list/fetch/sync/load/pull/search/check/scan/collect/export. |
| Trigger desc | `Runs when <event>`, ≤30 chars |

App name only if generic without it. Labels clean/generic ("Select Board" not "Select Trello Board"). Preserve compliant existing names on update.

# UX Field Ordering
Required fields first, optionals grouped after. Resource dropdowns configure `canPaginate` and `enableSearchApi` based on API support using the following priority order: (1) Both search and pagination supported ⇒ `canPaginate:true`, `enableSearchApi:true`; (2) Search only, no pagination ⇒ `canPaginate:false`, `enableSearchApi:true`; (3) Pagination only, no search ⇒ `canPaginate:true`, `enableSearchApi:false`; (4) Neither ⇒ `canPaginate:false`, `enableSearchApi:false`. If an existing reusable component is reused and implements pagination/search/both, set the corresponding dropdown flags to `true`. Always perform a web search first to verify API capabilities before creating a component or enabling features (do not assume or guess). **Help placement:** When using a static or dynamic help field, it must always be positioned below the field it is referring to.

| Category | Order |
|---|---|
| Instant | DynDropdown(resource) → whereClause Group? → DynHelp(permission check)? → conditionals |
| Scheduled | DynDropdown → DynDropdown(dependent) → Boolean? → Multiselect(field filter)? → Group(filter only — no pagination fields)? → AIField? |
| Manual | HelpStatic (Only allowed field, step-by-step webhook setup HTML instructions) |
| GET | DynDropdown(parent) → DynDropdown/String(record ID) → Multiselect(fields)? → Group? |
| LIST | DynDropdown(parent) → DropdownStatic(Mode: List All, Search by..., Search by ID, Advance Search) → DropdownStatic(find_by)? → Boolean(Enable Pagination)? → Group(limit, offset)? → String(search/ID input)? → AIField(Advance Search)? → Group(filters)? → Multiselect(return fields, curated defaults)? |
| FIND/SEARCH | DynDropdown(parent) → DynDropdown(child)? → Boolean(Basic/Advanced) → Group(filter: column + operator? + value for Basic / AIField for Advanced) → Boolean(bulk mode)? → Group(sort field + direction, limit)? → DropdownStatic(response mode: Basic/Custom/Full)? → Multiselect(return)? |
| CREATE | DynDropdown(parent) → DynDropdown(child)? → Boolean? → Multiselect(field chooser) → DynGroup(fieldsGenerator) → AIField?/Dictionary? |
| UPDATE | DynDropdown(parent) → DynDropdown(child)? → DynDropdown/String(record ID) → Multiselect(chooser) → InputGroup(chosen fields static or dynamic) |
| FIND OR CREATE | DynDropdown(parent) → DynDropdown(child)? → Group(search: AIField if complex query, or DynDropdown+String if simple filter) → Boolean `create_if_not_found` (default `{label:"Yes",value:true}`) → DynGroup(visibilityCondition on toggle) → Multiselect? |
| FIND + UPDATE | DropdownStatic(search criteria) → String(lookup value) → DynMultiselect/DynDropdown(mutation payload) → Boolean(operation mode: add/remove)? |
| DELETE | String(record ID) → HelpStatic(irreversibility warning) |

Category deltas beyond order: **Instant** DynHelp validates permissions after resource pick; whereClause renders multi-filter as a sentence (all labels inside use sentence case, only first capitalized; subsequent lowercase). **Scheduled (polling)** never ask the user for pagination fields (limit, page size, start cursor, next page token) or scheduledTime in inputFields/UI; pagination is handled internally via `canpaginate:true` config, and `scheduledTime` is a global variable. The perform code returns an array of items from a **single page** fetch, capped at a maximum of 1000 items per request (or the service's supported limit, whichever is smaller), without internal looping. If the API supports a limit greater than 1000, specify a limit of 1000 or less. The transfer code `data` key has a hard limit of 200 items per batch. **Manual (manual_webhook)** triggers support `performlist` (sample code) and `modifytriggerdata` (Perform Modify Code, where the webhook raw payload is accessed using `const rawPayload = context?.req?.body;`), and must only contain a single static `help` field in the `inputFields` array (no other fields allowed). **GET** always give the manual-ID triplet (`customHelp`/`customInputLabel`/`customPlaceholder`) so users paste an ID from a prior step. **LIST** combines List All, Search, Search by ID, and Advance Search using a `mode` dropdown (options: List All, Search by... (identifier), Search by ID, Advance Search). When "Search by..." supports multiple attributes, add a secondary `find_by` Static Dropdown and chain `visibilityCondition` on both `mode` and `find_by`. If mode is 'List All' (or a non-unique 'Search by...' field) and "Enable Pagination" is true, show limit and offset fields; if "Enable Pagination" is false, perform client-side internal pagination to fetch all. If the search identifier is unique, pagination is not required. If 'Search by ID' is selected, show ID input and exclude pagination options (direct GET). If 'Advance Search' is selected (only when service supports advanced queries), show AIField. Optional multiselect filters return fields (defaults to all if empty); pre-select a curated set of ~10–12 essential fields as `defaultValue`. Accept comma-separated multi-values in a single String field for quick multi-lookups. For modes like "List All" or "Recently Updated", offer an Input Group with status/date filters. **FIND/SEARCH** Boolean toggles Basic (column + operator? + value) vs Advanced (AIField with `suggestionGenerator`). When the API supports multiple comparison operators (=, LIKE, >, <), expose them via a Static Dropdown alongside the lookup field. When sorting is supported, add sort field (dynamic dropdown) + sort direction (static dropdown). Bulk mode toggle forks exhaustive vs standard limit fields. For large/nested responses, use a response mode Static Dropdown (Basic/Custom/Full); "Custom" reveals a column multiselect. **CREATE/UPDATE** chooser Multiselect feeds the fields input group; if the fields are static/known, organize them in static input groups with `visibilityCondition` on each field or group based on the Multiselect choice (avoid using `fieldsGenerator` for known static fields). Only use `fieldsGenerator` when the fields/columns are truly dynamic (e.g. custom fields, sheet columns) and return `{message:'Select a resource first.'}` if deps are missing; map API property types to correct field types (don't dump as strings); pre-select fields 90% of users need as `defaultValue`; force-include mandatory fields (e.g. email, phone) even if user didn't select them; for invoice/order payloads use repeating Input Groups for line items; for complex actions, list distinct sections in the Multiselect (e.g. Address) and conditionally reveal dedicated Input Groups via `visibilityCondition` to avoid UI bloat; when a payload can reference an existing record OR carry inline details, use a Boolean/Static Dropdown fork with `visibilityCondition`; UPDATE help: "unfilled fields stay unchanged". **FIND OR CREATE** use AIField if complex query is supported, or dropdown + string if simple filter is supported; when API supports lookup by multiple stable identifiers (email vs phone), add a search-by Static Dropdown; keep standard identity fields as static inputs alongside a Dynamic Input Group for custom fields (static + dynamic field split); "Create if not found?" toggle (default true) shows creation fields via visibilityCondition when true. **FIND + UPDATE** search by criteria (email, phone) then mutate the found record (add/remove tags, apply labels); use a Static Dropdown for the search criteria selector, String for lookup value, Dynamic Multiselect/Dropdown for the mutation payload; optional Boolean for operation mode (add vs remove) — the mutation field's `optionsGenerator` adapts based on this toggle. **DELETE** keep minimal; always use a direct text ID field (type 'string') to identify the record to delete (no dropdown logic or parent dropdowns); archive toggle if API supports.
**Dropdown Preference & ID Priority (CRITICAL & MANDATORY):** Dropdowns and multiselects have the absolute highest priority. Never ask the user for manual entry in a string field unless a dropdown or multiselect is absolutely not possible. Always prioritize dropdowns over text ID fields (type `string`) across all triggers and actions if an options-fetching API is available. Do not bypass parent dropdowns even if they are required to fetch the record ID. If no options-fetching API is available, only then proceed with the type `string` and ask the user for the ID. There are no exceptions for UPDATE actions; they must also use dropdowns/multiselects for record ID selection if options can be fetched, regardless of whether parent dropdowns are required. *(Note: DELETE actions are a strict exception and must always use a direct text ID field of type 'string' without any dropdown or selection logic).*

# Field Types
Base keys (every field): `key` (unique, no `.` or `[]` square brackets, pattern `^[^.\[\]]*$` ) · `type` · `label` · `help` · `required` · `placeholder` (where applicable: string, date, number, html, markdown, boolean, dropdown, multiselect; note that `placeholder` is optional for dropdown, multiselect static and dynamic, and boolean fields). Always include `placeholder` (where required/applicable) and `customPlaceholder` (where applicable: boolean, dropdown, multiselect) in the fields. The value of `placeholder` and `customPlaceholder` must always be a string; even for number, date, boolean, array, or object values, they must be wrapped in a string (e.g. `"10"`, `"true"`, `"[\"item1\", \"item2\"]"`). Allowed types only: `string`, `date`, `number`, `html`, `markdown`, `dictionary`, `boolean`, `dropdown`, `multiselect`, `aifield`, `help`, `input groups`. Optionals per Minimalism. Output valid JSON only — no comments/extra keys.

| `type` | Required (beyond base) | Constraints |
|---|---|---|
| `string` `number` `html` `markdown` | `placeholder` | For date/time/DOB values, if they do not match one of the four supported date formats, use `string` as a fallback. `list:true` (string/number only, preconfigured array); `limit:N` requires `list:true`. `list:false` (default) if single value, or if array/comma-separated value is dynamically passed. |
| `date` | `placeholder`, `dateFormat` | Use when capturing dates/times matching the 4 supported formats: `YYYY-MM-DDTHH:mm:ssZ`, `YYYY-MM-DD HH:mm:ss Z`, `MM-DD-YYYY HH:mm:ss Z`, `MM-DD-YYYY HH:mm:ss`. If needs another format, **must** use `string`. `placeholder` is required and must match the `dateFormat`. In code, date fields return the date strictly formatted according to the `dateFormat` (unlike `string` fields where raw input is passed as-is). |
| `dictionary` | `template` | Variable/unknown key-value pairs. `template` FIXED: `{key:{type:string,placeholder},value:{type:string,placeholder}}` — both types always `string`; only placeholder text may change. |
| `boolean` | `options`, `customPlaceholder`, `customInputLabel`, `customHelp` | Exactly 2 options `{label,value}`, true-option FIRST. `defaultValue:{label,value}` must equal an option. Labels any binary pair; value mapping arbitrary. `customInputLabel` (must NOT start with "Enter", e.g. same as standard label or short suffix like ID; if standard label is "Does your first row contain column name?", customInputLabel is the same) and `customHelp` (specifies the actual value in the help and explains what will happen, e.g., "Enter true for [outcome] and false for [outcome]") are required for manual mode. Standard `help` starts with "Select" (e.g. "Select yes/option label for..."). (Optional: `placeholder`). |
| `dropdown`/`multiselect` static | `options`, `customInputLabel`, `customPlaceholder`, `customHelp` | `options:[{label,value,sample?,extraValue?}]` fixed. `defaultValue` = exact copy of an option (multiselect: array of copies). All three custom keys are required; `customInputLabel` must not start with "Enter" (label and customInputLabel same if not an ID). `customHelp` must guide manual input: if options are few, specify actual options and outcomes; if options are many, tell "Enter {{label name}} ...benefits of the field". Standard `help` starts with "Select" and describes selection. (Optional: `placeholder`). Both `help` and `customHelp` must be crisp. |
| `dropdown` dynamic | `optionsGenerator`, `customPlaceholder`, `customInputLabel`, `customHelp` | Configure `canPaginate` and `enableSearchApi` based on API capability using the priority order: (1) Both search and pagination supported ⇒ `canPaginate:true`, `enableSearchApi:true` (generator must return `{data,offset,message?}`); (2) Search only, no pagination ⇒ `canPaginate:false`, `enableSearchApi:true` (generator uses `__searchText`); (3) Pagination only, no search ⇒ `canPaginate:true`, `enableSearchApi:false` (generator must return `{data,offset,message?}`); (4) Neither ⇒ `canPaginate:false`, `enableSearchApi:false`. Set flags to `true` if reusing an existing component that implements them. Verify support via web search first. Generator returns `{message}` if no options found or to show warning block. Special Case: In the reusable component, if search is active (search query has value) and returns empty results, the `offset` returned must be the current cursor (`pageToken`/`offset` parameter) to preserve the previous offset when switching back to pagination (search API offset is ignored). All three custom keys are required; `customPlaceholder` = manual-input example (such as `123`); `customInputLabel` must not start with "Enter" (e.g. "Spreadsheet ID" for label "Spreadsheet"); `customHelp` must guide manual input with "Enter the ID/value... You will get it from the actions like List, Find..." Standard `help` starts with "Select" and describes selection. `defaultValue` = object `{label,value,sample}`. (Optional: `placeholder`). Both `help` and `customHelp` must be crisp. |
| `multiselect` dynamic | `optionsGenerator`, `customPlaceholder`, `customInputLabel`, `customHelp` | **No canPaginate/enableSearchApi Support (CRITICAL):** Properties `canPaginate` and `enableSearchApi` are **not supported**. If pagination limit/cursors or search are required (e.g. if the options are fetched from a paginated/search API using reusable components), the `optionsGenerator` must perform client-side pagination (looping internally to fetch and aggregate all pages/results) and return the aggregated array directly. `customPlaceholder` = array example (such as `"[\"title\",\"status\"]"` or `["title","status"]`). `customInputLabel` must not start with "Enter" (e.g. "Properties in Array"). All three custom keys are required; `customHelp` must guide manual input with "Enter the ID/value... You will get it from the actions like List, Find..." Standard `help` starts with "Select" and describes selection. `defaultValue` = array of `{label,value,sample}`. (Optional: `placeholder`). Both `help` and `customHelp` must be crisp. |
| `aifield` | `prompt`, `suggestionGenerator` | AI builds structured data at config-time (user interacts only at setup); result used later in perform. `suggestionGenerator` mandatory (`""` if no dynamic context). `prompt` must output ONLY valid JSON (no backticks/prose), return raw object (no `"filter"` wrapper), quote string vars (`"${...email}"`) but NOT numbers/booleans (`${...age}`). |
| `help` static | — (`key`·`type`·`help` only) | `help` = content (text/HTML/MD + links). No `label`/`required`/`placeholder` allowed. Optional: `visibilityCondition`. Placement: Must be positioned below the field it is referring to. |
| `help` dynamic | `source` | `source` JS → `{message}` (text/HTML/MD). Not `optionsGenerator`. Optional: `label` (header text), `visibilityCondition`. No `required`, `placeholder`, or `help` key allowed. Placement: Must be positioned below the field it is referring to. |
| `input groups` static | `fields` | `fields[]` each independently valid (nestable). `whereClause:true` (static only) → inline sentence UI; recommend dropdown/multiselect children; `label`/`help` optional then. |
| `input groups` dynamic | `label`, `fieldsGenerator` | `fieldsGenerator` → field array, or `{message}` if deps missing (renders warning block). Generated children: any type incl. nested input groups, static+dynamic (generated child keys CAN contain dots; normalization is not required). Optional: `required`, `help`, `visibilityCondition`. |

**Options metadata**: `sample` MUST equal `value`; include only if `value` is an ID and ≠ `label`. Dynamic `defaultValue` requires `sample`. `extraValue` = hidden metadata supporting all data types (string, number, boolean, object, array, etc.), read via `context?.inputData?.{key}_extraValue` (group: `{group}?.{key}_extraValue`) inside visibility conditions, dynamic generators, or perform/trigger code blocks. It is extremely useful when the option's value is an ID and you want to pass extra info (like the resource type or category) to perform specific visibility logic or actions.

**Custom Mapping Behavior (Dropdown, Multiselect & Boolean)**:
In the UI, `dropdown`, `multiselect`, and `boolean` fields have two states:
1. *Standard Mode (Selection)*: User sees the standard `label`, `help`, and `placeholder` (optional; if omitted, the backend defaults to `"Choose {{field label}}"`). Standard `help` must start with `"Select"` (or start from `"select"`, e.g., `"Select yes/option label for [outcome]"` for booleans), supports strings and markdown links like `[Lean More](https://example.com)`, and must focus on option selection.
2. *Custom Mapping Mode*: Toggled to accept dynamic mappings. The field switches to a plain text `string` field showing:
   - `customInputLabel` in place of the standard `label` (required/mandatory; must be short and **must NOT start with "Enter"**; e.g. standard label `"Spreadsheet"`, customInputLabel `"Spreadsheet ID"`; if it is not an ID field, standard label and `customInputLabel` must be the same).
   - `customHelp` in place of the standard `help` (required/mandatory; must guide manual input rather than selection):
     - For dynamic dropdowns/multiselect: `"Enter the ID/value... You will get it from the actions like List, Find..."` (e.g. `"Enter the Spreadsheet ID manually. You can get the spreadsheet ID from actions like List Spreadsheets or Find Spreadsheet."`).
     - For static dropdowns/multiselect and booleans: Specify the actual value in the help and explain what will happen (e.g. for boolean: `"Enter true for [outcome] and false for [outcome]"`).
       - In static dropdown/multiselect: if options are few, mention them in `customHelp` and explain. If options are many, write `"Enter {{label name}} ...benefits of the field"`.
   - `customPlaceholder` in place of `placeholder` (required/mandatory; must be a string containing a concrete value sample e.g. `"true"`, `"false"`, or a specific ID).

**optionsGenerator invocation:** Any code block inside `optionsGenerator` (whether using inline code or calling a Reusable Component) must be wrapped in a parent `try...catch` block. The `catch` block must handle errors by calling `await errorComponent(error);` (e.g., `try { return await fetchComponent(param1, param2); } catch (error) { await errorComponent(error); }`). If the function code is written inline, it must be explicitly defined, called inside the `try` block, and called/invoked at the end (e.g., `async function getOptions() { ... }; try { return await getOptions(); } catch (error) { await errorComponent(error); }`).

**Visibility + required**: visibility evaluated first — a hidden `required` field is skipped (not enforced). Optional parent revealing a required child → set child `required:true` AND throw in perform if parent set but child missing.

# Minimalism
Include an optional key only when it adds info beyond `label` + specific app + specific action. Optionals: `defaultValue` (sensible default exists) · `customHelp` (required/mandatory for boolean, dropdown, and multiselect fields; guides manual input, must be detailed) · `sample` (value is ID ≠ label) · `visibilityCondition` (conditional) · `required` (mandatory; defaults false). (Note: `placeholder` is optional for dropdown, multiselect static and dynamic, and boolean fields—defaulting to `"Choose {{field label}}"` in standard mode if omitted—but required/must be included in string, date, number, html, and markdown fields. `customPlaceholder` and `customInputLabel` are always required/mandatory in boolean, dropdown, and multiselect fields for custom mapping mode; `customInputLabel` must not start with `"Enter"`). `help` must always be available (present) in all fields (it is not optional) — keep its value concise, short, plain, non-technical, crisp, and to the point. It must start with `"Enter"` for string, number, dictionary, date, AI Field, markdown, html, and Input Group fields, and start with `"Select"` for dropdown, multiselect, and boolean fields. For dropdown and multiselect fields, `help` must focus on option selection, whereas `customHelp` must focus on entering the manual value/ID. Both `help` and `customHelp` must be very crisp and to the point.

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
- **Scheduled Trigger Perform vs Sample Output:** The Perform Code returns an array of items `[ {item1}, {item2} ]` because the viaSocket engine automatically loops through that array and runs the workflow for each individual item. The Sample Code, however, must return a single object `{ ... }` representing just one of those items (which can be retrieved through the GET code pattern) to ensure the user is mapping the schema of a single event in their workflow steps, rather than mapping an entire array.
- No `console.log`. Handle API rate limits in loops (delay/retry/headers). GET uses `params`, POST uses `data`.

## Libraries
Direct, no import: `axios` `fetch`(node-fetch) `https` `crypto` `setTimeout` `Buffer` `atob` `FormData`(form-data) `jwt`(jsonwebtoken) `_`(lodash) `cheerio` `moment` `XMLParser` `XMLBuilder` `XMLValidator`. `axios` accepts `maxBodyLength:Infinity` for large bodies. Same set available inside reusable components.

## Globals
| Global | Where |
|---|---|
| `__executionStartTime__` | Scheduled Perform — run timestamp. Lookback: `new Date(__executionStartTime__ - scheduledTime*60000)` |
| `context.inputData.scheduledTime` | Scheduled — interval (min) |
| `context.paginationData` | Scheduled cursor/state across runs (init `0`/`null`; requires pagination enabled in UI). Advance ONLY if filtered-nonempty AND new next-token. Repeated token auto-breaks loop. For multi-item inputs (via multiselect or `list:true` in `string`/`number` fields), structure as an object `{ cursors: { [itemId]: cursor }, activeForms: [itemId] }` to avoid pagination bleed. **Reassigning to `0`/`null` resets to start.** **CRITICAL WARNING:** NEVER assign `null`, `0`, or clear `context.paginationData` in an `else` block. Simply do NOT reassign or modify `context.paginationData` to stop the loop. |
| `context.paginateData['<field>']` | Dynamic dropdown/multiselect `optionsGenerator` token. Group: `['group.field']`; nested: path order. |
| `__searchText` | Generators when `enableSearchApi:true` |
| `context.inputData.transferOption.offset` | Transfer |
| `context.inputData.hookUrl`, `_scriptId` | Instant Subscribe (`_scriptId` only if service needs a unique webhook key) |
| `context.inputData.performsubscribe` | Instant Unsubscribe (= subscribe response) |
| `context.req.body` | Webhook Perform Modify Code (`modifytriggerdata`) for Instant (`hook`) and Manual (`manual_webhook`) triggers — contains the raw webhook payload. |

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
For scheduled triggers, the Sample Code must return a single object `{ ... }` representing just one of those items (which can be retrieved through the GET code pattern) to ensure the user is mapping the schema of a single event in their workflow steps, rather than mapping an entire array.
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
- **Transfer Limit**: The returned `data` array must have a limit of at most 200 items per batch.
```javascript
const offset = context?.inputData?.transferOption?.offset || null;
const params = { limit: 100 }; // Maximum 200 items (limit <= 200)
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
- **Output Structure**: Returns an array of items `[ {item1}, {item2} ]` because the viaSocket engine will automatically loop through that array and run the workflow for each individual item.
- **Backend Limit**: Capped at a maximum of 1000 items per single page request. If the service's API supports a limit/page size larger than 1000, the perform code must cap it at 1000 (or less). If the service's maximum limit is smaller than 1000 (e.g. 100), the perform code must use that smaller limit.
- **No Internal Pagination**: Do **not** implement internal client-side loops (like `while` or recursion) in the scheduled trigger perform code to fetch multiple pages or accumulate up to 1000 items. Fetch only a **single page** of data and use `context.paginationData` to paginate across runs/executions.
- **Native filter (preferred)**: pass `created_at_min=t` (+ `fields=` from a Multiselect) to API; one call.
- **Client filter — new items**: fetch page → `items.filter(i => new Date(i.created_time) >= t)` → sort oldest-first.
- **Client filter — updated items**: filter `last_edited_time >= t && created_time !== last_edited_time` (drops never-edited / just-created) → sort ascending by `last_edited_time`.
- **Pagination Update Pattern**: Only update pagination data if filtered results are non-empty and API returned a next cursor/page:
  ```javascript
  if (filteredData.length !== 0 && response?.data?.next_cursor) {
      context.paginationData = response.data.next_cursor;
  }
  ```
- **Multi-item Pagination Pattern**: If the input accepts multiple items (either via `list: true` in `string` or `number` fields, or as a `multiselect` field) and each item has separate pagination, track active items and cursors explicitly as an object to prevent bleed:
  ```javascript
  const activeForms = context?.paginationData?.activeForms || formIds;
  const previousPagination = context?.paginationData?.cursors || {};
  // ... loop & call API per item with previousPagination[formId] ...
  // Only advance pagination for items that had new results AND a next cursor
  if (newResultsFound && nextCursor) {
      nextPagination[formId] = nextCursor;
      nextActiveForms.push(formId);
  }
  // Only update paginationData if at least one item needs to continue paginating
  if (nextActiveForms.length > 0) {
      context.paginationData = { cursors: nextPagination, activeForms: nextActiveForms };
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
| LIST | Fork by `mode` (List All, Search by..., Search by ID, Advance Search) | List All/Search (non-unique): paginated call or client loop if fetch-all; Search (unique): search API; Search by ID: get by ID; Advance Search: query. Multiselect filters fields. |
| FIND/SEARCH | `GET /resources?q=` | native query first; client `.find()` fallback → `{results:[]}` |
| CREATE | `POST /resources` | payload from `inputData` |
| UPDATE | `PATCH`/`PUT`/`POST /resources/:id` | partial: include key only if value `!== undefined/null/''` (unless explicit clear) |
| FIND OR CREATE | `GET` search → `POST` if none | search by stable ID first; never assume record exists |
| DELETE | `DELETE /resources/:id` (or `PATCH`/`POST` archive) | validate id; handle 404 already-deleted |

# Reusable Components
JS stored once (three parts: **Name** unique+permanent once used, **Parameters**, **Code** = raw JavaScript code starting directly with a `try`/`catch` block. Do NOT wrap the code in a function block. The parameters defined in the component's metadata are available as global variables directly inside this code block. Inside the catch block, you MUST use `throw error` or `throw e` instead of calling `errorComponent`). Invoked only from `optionsGenerator`/`fieldsGenerator`/`suggestionGenerator` — never static fields. (Note: Inside the `optionsGenerator` that invokes/maps this component, the invocation must be wrapped in a parent `try-catch` block and the catch block must call `await errorComponent(error)`). When a reusable component is created, it must be explicitly mapped/imported in all the action version code blocks (such as `optionsGenerator`, `fieldsGenerator`, etc.) that call it using the mapping tool.
- **Parameters**: `searchText`, `pageToken`/`offset`/`page`, and `pageSize`/`limit` parameters are **optional** in the reusable component of a dynamic dropdown. Only add them, along with dependent parent paths, if required/supported by the API (based on whether the dropdown supports pagination or search). Do not strictly validate or throw on them at the top of the component if they are optional. Always map any needed dynamic values to these parameters; never read `context.inputData`/`__searchText`/`context.paginateData` directly inside the component's code block.
- Validate parameters at the top only if they are strictly required (e.g. throwing on a missing required parent ID parameter). Return matches host field shape. **Zero Results**: If the list/results fetched are empty/zero, the component must return an object with a `"message"` key containing a user-friendly descriptive message (e.g. `{ message: "No folders found." }` or `{ data: [], message: "No data available." }`).
- **Search-Pagination Offset Rule:** If a dynamic dropdown component supports both search and pagination (`enableSearchApi: true` and `canPaginate: true`), and the search parameter is active, if the search returns empty results, the returned `offset` must be the current cursor (`pageToken`/`offset` parameter). This ensures that if the user switches from searching back to pagination, the previous pagination offset is preserved (ignoring any search-returned offset).
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
  throw error; // Reusable Components MUST use 'throw error' or 'throw e' in catch
}
```
Caller (in `optionsGenerator`): `try { return await fetchResources(__searchText, context?.paginateData?.['my_field'], 100); } catch (error) { await errorComponent(error); }` — map the component's `id` correctly.
- **Reusable Component Operations (Creation, Mapping, and Updates):** Always search/look for an existing reusable component before creating a new one.
  - **Mapping**: Link the reusable component to a specific action version and path (requires `actionVersionRowId`, `path` and `component_id`).
  - **Creation**: Requires `function_name`, `params`, `code`, and `description`. Do not map to a path or pass a component ID during creation.
  - **Updates**: Requires `component_id` and the fields to update (`params`, `code`, or `description`), but send the `function_name` or `params` during update.
  - **Reuse & Update Protocol**:
    - If a suitable reusable component is already present, reuse it.
    - If the found component is missing required parameters: Do not modify its parameters (as this is prohibited if it is mapped/active elsewhere). Instead, explicitly inform the user that a component is already present, but suggest/propose creating a new reusable component to accommodate the additional parameters without breaking existing mappings.
    - If the existing component's parameters are already satisfied, but the component's code needs to be updated: Update the existing component's code directly, and inform the user that the update is happening on the existing reusable component.
    - Do not change the `function_name` or `params` if the reusable component is used (mapped/active) anywhere. If the component is not used anywhere, then the `function_name` and `params` can be updated. If the `params` and `code` both need to be updated (and the component is used), then a new component must be created. If only the `code` needs to be updated (even if the component is used), the existing component's `code` can be updated directly.

# Generator Returns
| Generator | Return |
|---|---|
| `optionsGenerator` standard | `[{label, value, sample?, extraValue?}]` |
| `optionsGenerator` paginated (`canPaginate:true`) | `{data, offset: string\|number\|null}` |
| `optionsGenerator` empty/info | `{message}` (if no pagination/search, or only search), `{data:[], offset:null, message}` (if only pagination), `{data:[], offset:previous_offset, message}` (if both pagination and search) |
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
- **Mapping (action_version_component_table)**: `action_version_id`, `component_id`, `pluginrecordid`, `action_id`, `path` (code block name e.g. `'perform'`/`'performsubscribe'` etc. or input field key). *Note: The mapping API acts as a toggle (boolean behavior) — first call creates mapping, second call with same parameters unmaps/removes mapping.*

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
Validate against all rules above. New checks: reusable-component `id` mapped correctly; FIND/SEARCH `.find()` fallback returns `{results:[]}`; clean generic labels; output the raw `inputFields` array only (no `steps`/`blocks`/`dependsOn`/auth/headers). If optional boolean keys like `whereClause`, `required`, `canPaginate`, `enableSearchApi`, or `list` are missing/not provided in the input fields JSON, they are considered to be `false` by default; do not flag to add them.
Validate against this file; output the raw `inputFields` array (never the `{"inputFields":[...]}` wrapper); never expose auth or force users to manage internal IDs; don't ask the user for `pluginrecordid` or `authid`, as this is internally passed; don't invent undocumented params; every documented API field is in UX or handled in code.
- **Perform**:
  - Wrapper correct (`async <functionName>()` matching the operation performed) · `axios`/`fetch` only, no imports · `context.inputData.<key>` mapped · endpoint matches docs · required-field guards (`throw` before call) · `errorComponent` in catch · rate-limit handled · no auth · no `console.log` · returns raw `response.data`.
  - **No Hard-coded Input Values**: No hard-coded input values are allowed (except documented default fallbacks).
  - **Zero Results for Generators**: For `fieldsGenerator`/`optionsGenerator` and dynamic dropdown Reusable Components, return a message key based on the configuration when no options are found:
    - **Only pagination is enabled** (`canPaginate: true`, `enableSearchApi: false`): Return `{ data: [], offset: null, message: <user message> }`.
    - **Neither pagination nor search is enabled**: Return `{ message: <user message> }` instead of an array.
    - **Only search is enabled** (`enableSearchApi: true`, `canPaginate: false`): Return `{ message: <user message> }`.
    - **Both search and pagination are enabled**: Return `{ data: [], offset: <previous_offset>, message: <user message> }`. In search mode, the search-returned offset is ignored and the previous pagination offset is preserved (given priority), so that exiting search resumes pagination correctly from the previous page.
- **Fields & Text Quality**:
  - Each field matches its type's required keys · `sample`==`value` rule · clean labels · only `inputFields` (no `steps`/`blocks`/auth/headers) · reusable-component `id` mapped.
  - **Help Key**: `help` is generally required and must be short, plain, and non-technical. If `label` and `key` are completely self-explanatory (e.g. `label: "First Name"`, `key: "first_name"`), the `help` key can be omitted entirely. Otherwise, it is mandatory (especially for date fields to explain the purpose and accepted format).
  - **Labels & Placeholders**: Must be clear and grammatically correct. Do NOT use "E.g." or "e.g." in `placeholder` or `customPlaceholder` (such as using `"john@example.com"` instead of `"E.g. john@example.com"`); they must contain direct sample values only. The value of `placeholder` and `customPlaceholder` must always be a string, and must be wrapped in a string/quotes for number, array, object, and boolean values (e.g., `"10"`, `"true"`, `"[\"item\"]"`).
  - **Suggestions for Text**: Put the corrected value in "suggestions" for fixed help/label/placeholder.
  - **Consistency**: Ensure `help`/`label`/`placeholder` are consistent across all fields. Fix casing, wording, and punctuation mismatches (e.g., "Select option." vs "select Options" → "Select Option" (Title Case)).

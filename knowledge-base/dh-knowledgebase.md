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
  - Response Return Patterns
  - Libraries & Globals
- Code Skeletons
  - Instant Subscribe & Unsubscribe
  - Sample (Instant & Scheduled)
  - Modify Trigger Data
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

1. **API Docs = Ground Truth**: Overrides user cURL. Every documented parameter (path, query, body, headers, filters) → UI input or code; payload shape and endpoint match the API exactly. Never invent or omit parameters, and never assume `sort`/`limit`/`search`/pagination support—verify in official docs first. Undocumented endpoint → confirm with provider or state the limitation.
2. **Authentication & Backend Auth Injection (`authenticationpaths`)**:
   - **No Authentication / API Key in Code**: Never add, pass, hardcode, or reference authentication credentials (API key, Bearer token, access token, basic auth, client secret, etc.) in any action, trigger, or reusable component code. No auth headers (e.g., `Authorization`, `x-api-key`, `api-key`), auth query params (e.g., `?api_key=...`), or auth body properties should ever be authored in code.
   - **Automatic Backend Injection via `authenticationpaths`**: All authentication is passed and injected automatically from the viaSocket backend into request `headers`, `body`, or `queryParams` as configured in the connection's `authenticationpaths` section (`authenticationpaths.headers`, `authenticationpaths.body`, `authenticationpaths.queryParams`).
   - **Direct Code Calls**: All `axios` / `fetch` calls in code must omit authentication headers/params entirely—the backend HTTP interceptor injects credentials automatically when making requests to whitelisted hosts. Adding auth in code is strictly prohibited, causes errors or leaks, and sends masked literal placeholders resulting in 401s. Add only extra non-auth application headers (e.g., `Content-Type: application/json`, custom API version headers) or request-specific parameters.
   - **Non-secret Metadata Only**: Only non-secret connection metadata (e.g., domain, subdomain, tenant ID, account ID, region) can be accessed in code via `context?.authData?.<key>` (where `<key>` comes from `authfields -> authentication -> fields -> key` in preferred connection details). Never read or use secret credential keys (e.g., `api_key`, `token`) from `context.authData`. Never ask the user for `pluginrecordid` or `authid`.
   - **Runtime Placeholders**: In plug code every `context.authData` value is a masked placeholder; the real value is substituted only in `authenticationpaths` and inside the request URL host/path (``https://${context?.authData?.subdomain}.example.com/v1/...``). Never send an `authData` value in params, body, or headers, or branch on it. Every host the code calls must be in the plug's and the connection's `whitelistdomains`.
   - **Minimal Connection Scopes vs Action/Trigger Specific Scopes**: Connection-level scopes must ONLY include the minimal scopes required for connection establishment and the Test (Me) API. Never request all app scopes or action-specific scopes at the connection level. Individual actions and triggers (Instant and Scheduled) specify their own endpoint-specific scopes via the `scopes` key (formatted as a string separated by space or comma matching connection's `scopeseperatedby`, e.g. `{"scopes": "instagram_business_content_publish,instagram_business_manage_messages"}`). Manual triggers (`manual_webhook`) do NOT support `scopes`.
3. **JSON Schema (`inputjson`)**: `{"steps": {}, "blocks": {}, "inputFields": [...]}`.
   - **Exhaustive Field Coverage (Zero Missing Fields)**: When analyzing any action or trigger from the API documentation, strictly include ALL documented fields (path, query, body, filters, optional, and advanced parameters) in `inputFields`. No documented fields may be omitted or skipped.
   - **KB-Driven Order & UX**: Structure and order fields per KB guidelines: (1) Parent/dependency selector dropdowns first; (2) Required fields next; (3) Grouped optional/advanced fields via `inputGroup` or `visibilityCondition` (Field Chooser pattern).
   - Author only `inputFields`. `steps`/`blocks` are engine-generated: pass real empty objects `{}`, never strings `"{}"`.
   - **NO `"item"` WRAPPERS** on any array (`inputFields`, `options`, …): ❌ `{"inputFields": {"item": [...]}}` | ✅ `{"inputFields": [...]}`
   - Valid JSON only (no duplicate keys, broken escaping, missing commas); no comments or undocumented keys.
   - No hardcoded input values or secrets in fields (documented default fallbacks in code excepted).
4. **Error Handling**:
   - Perform, trigger blocks, `optionsGenerator`: `catch (error) { await errorComponent(error); }`. Never modify, throw, or return the error (no `return` needed after it)—the engine detects failure via `errorComponent`.
   - **No Creation of `errorComponent`**: An `errorComponent` reusable component must NOT be created as it is created automatically by the backend. To map `errorComponent` to an action/trigger version, fetch the reusable components list to find the `errorComponent` component ID (`rowid`), then map it across all blocks/paths where `await errorComponent(error)` is called. If the plugin API retrieves error messages or error codes under different keys/paths (e.g. `error`, `errors`, `detail`, `error.code`, `error_code`, `code`), update the existing `errorComponent` reusable component so its `code` and `message` variables extract the provider's specific error keys before fallback.
   - Reusable components: `catch (error) { throw error; }`; validations throw structured fallbacks.
   - Dynamic help `source`: catch returns `{ message }`.
   - Inside `try`, `throw new Error('<clear message>')` for missing required inputs and for 200 responses carrying error bodies (prevents false success).
5. **Runtime**: Node.js. No `console.log`, `import`, or `require` (libraries are globals). HTTP via `axios` (preferred) or `fetch`.
6. **Base `.data` Extraction & Response Formatting**:
   - **Base Extraction Rule**: API payloads ALWAYS reside in `response.data`. Every call (including aggregated `userRes.data`, `projectsRes.data`) extracts from its own `.data` before navigating to destination keys. Never read payload keys off the response wrapper.
   - **List/Get Zero-Length Return Rule**: In `LIST` and `GET` actions, if data length is 0 (or no data found), always return a `message` key along with `data` and other important response keys (`pagination`, `has_more`, `success`, etc.):
     ```javascript
     return {
       message: response?.data?.length ? null : "No data found.",
       data: response?.data,
       pagination: response?.data?.pagination,
       has_more: response?.data?.has_more,
       success: true
     };
     ```
   - **Return Strategies (Match to Complexity)**: Direct · Metadata Injection (CREATE, UPDATE, DELETE, minimal 200s) · Unnesting (`.data.data`, `.result`, `.items` → root) · Selective Keys (noisy responses) · Flattening (≥3 levels) · Batch (flat array `[{...}]` for engine iteration). Code: Response Return Patterns.
7. **Guards & Defaults**:
   - Validate every `required: true` field at the top of the code; throw before the API call if missing/empty.
   - **Dependent Required**: an optional parent revealing a child needed for that choice → child `required: true` AND code throws when the parent is set but the child is missing.
   - **No `defaultValue` Key**: state the default in `help`; apply the fallback in code (`context.inputData?.limit || 10`; booleans `?? true`).
   - **Derived Values** (e.g. mimetype from URL): always a safe fallback if derivation fails.
   - **Rate Limits**: API calls in loops respect limits (sequential + delay, retry, rate-limit headers); never `Promise.all` over paginated calls to rate-limited APIs.
   - **Internal Pagination** (looping pages in one run): only for "list all" or when a user flag (Enable Pagination off) asks for it.
8. **Dropdown Priority**: Dynamic dropdown/multiselect over text for every ID/resource reference—UPDATE included. Build required parent dropdowns; never bypass them. Exceptions only:
   - Category `DELETE` (string ID only).
   - IDs passed from upstream steps with no list API.
9. **Backward Compatibility**: Never rename/remove keys (breaks active flows); only update labels, help, visibility, or add optional fields.
10. **Mandatory Optional Chaining (`?.`) in Code Paths**:
    - Optional chaining (`?.`) is strictly required in EVERY property access path inside all code blocks (e.g. `body?.form_response`, `formResponseData?.definition?.fields`, `response?.data?.items`, `context?.inputData?.<key>`, `context?.authData?.<key>`).
    - **Why mandatory**: While running code in production, if any intermediate key is not present, direct dot-notation access throws an unexpected runtime error (`TypeError: Cannot read properties of undefined`).
    - **Flag Missing Optional Chaining**: Reviewers and planners MUST flag as a defect whenever optional chaining is missing on property access in any code block (e.g., `const formResponseData = body.form_response; formResponseData.definition?.fields`).

---

# Plug Anatomy

## Triggers
| Type (`triggertype`) | Use When | Execution Blocks |
|---|---|---|
| **Instant** (`hook`) | API has webhook subscribe + unsubscribe endpoints | Subscribe (`performsubscribe`), Unsubscribe (`performunsubscribe`), Sample (`performlist`), Modify (`modifytriggerdata`)?, Transfer (`transferoption`)? |
| **Scheduled** (`polling`) | No webhook API; a GET/LIST returns created/updated timestamps or accepts a time filter | Perform (`perform`), Sample (`performlist`), Transfer (`transferoption`)? |
| **Manual** (`manual_webhook`) | Webhook configurable only in the app's dashboard (no subscribe API) | Sample (`performlist`), Modify (`modifytriggerdata`)? |

- **Selection Priority** (type unspecified): Instant → Scheduled → Manual → ask user for type + API docs/cURL. May also ask the type upfront.
- **Block Execution**:
  - *Subscribe*: flow publish, status → active, trigger config change (new config). Registers webhook; returns subscription data for Unsubscribe.
  - *Unsubscribe*: flow trashed, status → inactive, trigger config change (old config). Uses `context?.inputData?.performsubscribe` + user inputs.
  - *Sample*: `Test` click; output feeds Modify if present, else next steps.
  - *Modify*: on Test (input = Sample output) and live runs (input = webhook body; Sample skipped). Optional.
  - *Perform* (Scheduled): every poll interval.
  - *Transfer*: `Transfer` click (selected or all items); engine sends batches of ≤200 (500 → 200 + 200 + 100). New-event triggers only, never Updated.
- **Instant**: User never sees the webhook URL; the engine passes `hookUrl` to Subscribe.
- **Manual**: No Auth → never send `authid` or `scopes` (the `scopes` key is NOT supported for manual triggers); no API calls in any block (Modify reshapes locally); no `__executionStartTime__` or pagination.
- **Scopes on Triggers**: Instant (`hook`) and Scheduled (`polling`) triggers support the `scopes` key (string separated by space or comma) for trigger-specific OAuth scopes. Manual triggers (`manual_webhook`) do NOT support `scopes`.
- **No AI Field in Triggers**: `aifield` is forbidden in all triggers. API-supported filters → input fields (`dropdown`, `multiselect`, `boolean`, input group) or hardcoded in `perform` (query params or client-side filtering).

## Actions
Single `perform` block reading `context.inputData`; runs when the flow reaches the step.

| Category | Purpose | Method |
|---|---|---|
| **GET** | One record by ID | GET |
| **LIST** | Many records; unified list/search modes | GET |
| **FIND/SEARCH** | Records matching criteria | GET/POST |
| **CREATE** | New record | POST |
| **UPDATE** | Modify a known record | PUT/PATCH/POST |
| **FIND OR CREATE** | Search; create if missing | Search + POST |
| **FIND + UPDATE** | Resolve record by criteria; mutate it (tags, labels) | Search + update |
| **DELETE** | Delete/archive by ID | DELETE (archive: PATCH/POST) |

Read categories (GET/LIST/FIND) may POST to query endpoints.

---

# Design Strategy & UX
- **Exhaustive Field Coverage (Zero Missing Fields)**: The integration design MUST support and strictly include ALL documented parameters and fields from the API documentation across path, query, body, and filters. Never omit or skip documented API parameters.
- **KB Order & Progressive Disclosure**: While including all documented fields, preserve a clean, uncluttered UX: place parent context selectors first, required fields next, and group optional/secondary fields into `inputGroup` structures or gate them behind a multiselect chooser ("Select Additional Fields") with `visibilityCondition`.
- **Unified Actions**: List + Search + Get → one LIST via `mode` dropdown; Create + Update → Intelligent Upsert (prefer native upsert endpoints). Users never choose Create vs Update; identifier resolution decides.
- **Search-First Resolution**: search by stable identifier (email, external_id, sku) → found: update/return → not found and creation allowed: create → else fail safely. Never assume referenced records exist.
- **Search Modes**: one method → no selector. Several → mode dropdown (Structured by stable attributes = default; Advanced query = optional). Multi-match → deterministic pick (first/newest) or fail safely.
- **Optional Fields & Input Groups (Mandatory)**: Multiple optional fields → one multiselect chooser ("Select Additional Fields") revealing Input Groups, with `visibilityCondition` on the group (e.g. `Array.isArray(context?.inputData?.additional_fields) && context.inputData.additional_fields.includes('address_details')`). If grouping is impossible, condition each field.
- **Structural Respect**: enums → dropdowns; arrays → repeating input groups; nested objects → input groups. Never fabricate unsupported UI.
- **Dynamic Schema**: select module/resource → fetch its schema → render only relevant fields (`fieldsGenerator`), mapping API types to matching field types (not all strings).
- **Partial Updates**: Send only user-filled fields; strip `undefined`, `null`, `''` (send them only when the user explicitly clears a field)—prevents data erasure.
- **Stable Identifiers**: Prefer email/external ID/slug over volatile DB IDs; never make users copy internal system IDs (GUIDs) when a stable value exists.
- **Response Size**: Small/flat → full payload. Large/nested → Basic vs Detailed mode (key identifiers by default).
- **No Raw Schemas**: Never mirror raw API structure onto the UI; design per field types.
- **Units & Formats**: Accept human units (days, relative dates); convert to machine units (epoch, ISO) in code—never make users compute timestamps. Infer content format (HTML vs text) internally instead of exposing a selector.
- **Coded Values**: API codes (`1 = Male`) → dropdown if mapping is stable, else explain the mapping in `help`.
- **Workflow Purity**: Flows are `Trigger → Action`; formatting/mapping lives in perform code, not a JS step. Config values are static; data resolves at runtime.
- **List Inputs**: `list: true` (+ `limit: N`) only for static preconfiguration—mainly Triggers, which receive no upstream data. In Actions, use `string` accepting comma-separated values (or an array); split in code.
- **Idempotency**: Safe across 1000+ runs; each action defines its duplicate-prevention keys and how upsert/create-if-missing behaves at volume. Flag designs that duplicate or overwrite on repeat runs.
- **Trade-Offs**: When rules conflict, choose the lowest long-term risk across user complexity, runtime stability, API load/rate limits, and maintainability/backward compatibility. Final check: usable by a non-technical business owner, no needless technical exposure, acceptable worst-case scaling, clean workflow.

**Cross-Cutting Patterns**
- *Existing-vs-Inline Fork*: boolean/static dropdown branches "existing record (ID)" vs "inline details" (or link-existing vs create-related); gate each branch; never show both.
- *"Same As" Toggle*: boolean hides a duplicate group (shipping = billing).
- *Mode Routing*: one dropdown (channel/user/thread) drives downstream visibility. Fold variants (send later, single vs bulk JSON array) into one action via toggle—no near-duplicate actions sharing an endpoint.
- *Section Choosers*: huge forms → two-level multiselect of sections; core fields always visible. Always include API-mandatory identifiers (`required: true`) even if unchosen. Custom fields: pick via multiselect, fill via dynamic group.
- *Static + Dynamic Split*: fixed identity fields (email, name, phone) static; account custom fields in a dynamic group.
- *Repeating Line Items*: repeating input group per item (name, quantity, amount).
- *Option Labels*: `Display Name (schemaKey)` when the label differs from the API key.
- *Multi-Target Dispatch*: targets via dynamic multiselect or comma-separated string; iterate in code.
- *Normalize ID Inputs*: accept `{ label, value }` objects (select mode) and comma-separated strings (custom mode).
- *Predictable Sets*: stable values (metrics, tags) → static multiselect; few durations/expiries → preset static dropdown; standard full metric set → hardcode in code.
- *`date_mode` Dropdown*: All/default (`timeMin = now`) · Relative (`relative_days`: + future, − past) · Fixed (`timeMin`/`timeMax` as `YYYY-MM-DD HH:MM` or `YYYY-MM-DD` → ISO 8601 in code). Actions may use an `aifield` to normalize natural-language dates ("3 days ago").
- *Computed Fields*: add readable helpers to responses (`timeRange: "09:00 - 10:00 UTC, 2026-08-11"`).
- *Endpoint Scoping*: `optionsGenerator` switches endpoint/params by parent mode (Personal vs Team); require parent IDs only when needed.
- *Filters*: optional filters in a group, children gated by a filter-dimension selector; progressive modes (list_all → key_value → filter_formula → AI query).
- *Dynamic Groups*: questionnaires/filter builders via `fieldsGenerator` after the parent (e.g. Event Type) is chosen; child types follow the schema.
- *`extraValue` Metadata*: option metadata (e.g. table has attachment columns) drives visibility/code without extra API calls.
- *Dynamic Help*: live previews (message templates) or field reference guides (bulk JSON input).
- *Destructive Warnings*: in `help` (`"Entering tags here replaces ALL existing tags."`).
- *Single-Value Constraint*: several values in one return → join with a safe delimiter; parse in code.

---

# Naming Conventions
| Item | Format | Example |
|---|---|---|
| **Action Name** | `[Verb] [Object]`, Title Case, directive | `"Create Customer"`, `"Archive Page"` |
| **Action Desc** | What the user achieves + hint of what they configure; ≤120 chars; ends with `.` | `"Send Slack message to a selected channel."` |
| **Trigger Name** | `[New/Updated/Deleted] [Object] [Optional Action]`, Title Case, present tense; completes "When ___" (omit "when").<br>Forbidden: *list, fetch, sync, load, pull, search, check, scan, collect, export*. | ✅ `"New Page Created"`, `"Updated Comment"`, `"Deleted Page"`<br>❌ `"Page Created"` |
| **Trigger Desc** | `Runs when <event>` + configurable hint; ≤120 chars; ends with `.` | `"Runs when new email arrives in a chosen folder."` |

- **Copy**: Outcomes over mechanics; plain, non-technical language; never raw event/endpoint IDs (`page.created`). Omit app name (e.g. `{{pluginName}}`) unless ambiguous without it.
- **Exact Name Retention**: If a target name (or `actionName`) is provided in user input/context, strictly retain the exact same name during creation. Descriptions must be short (≤120 characters) and accurately based on the action/trigger functionality.
- **Update Safety**: Keep compliant `old_title`/`old_description` unchanged; review `type`/`category` instead.
- **Labels & Placeholders**: Labels are direct field names in Title Case describing the choice, generic (`"Page"`, not `"Facebook Page"`). Placeholders instruct (`"Select Page"`). Help and placeholders in sentence case. Never append `"(optional)"` (custom keys included).

---

# UX Field Ordering
*Required first; optional grouped after; help fields directly below the field they explain. `?` = optional · Dyn = dynamic · Group = static input group.*

| Category | Order |
|---|---|
| **Instant** | DynDropdown(resource) → whereClause Group? → DynHelp(permission check)? → Boolean(event subtype)? → Conditionals |
| **Scheduled** | DynDropdown/DynMultiselect(resource) → DynDropdown(dependent)? → Number(time offset)? → Help(polling math)? → Boolean? → DynMultiselect(output fields)? → Group(filters)? |
| **Manual** | Standalone static `help` field only |
| **GET** | DynDropdown(parent) → DynDropdown/String(ID) → DynMultiselect(fields)? → Group(options)? |
| **LIST** | DynDropdown(parent) → DropdownStatic(Mode: List All, Search by…, Search by ID, Advance Search) → DropdownStatic(`find_by`)? → Boolean(Enable Pagination)? → Group(limit, offset)? → String(search/ID input)? → AIField? → Group(filters)? → DynMultiselect(return fields)? |
| **FIND/SEARCH** | DynDropdown(parent) → DynDropdown(child)? → Boolean(Basic/Advanced) → Group(search: Boolean(config)?, DynDropdown(column), DropdownStatic(operator)?, String(value) or AIField, HelpStatic?) → Boolean(bulk)? → Group(sort field, direction, limit)? → DropdownStatic(response mode)? → DynMultiselect(return columns) |
| **CREATE** | DynDropdown(parent) → DynDropdown(child)? → Boolean? → DynMultiselect(field chooser)? → DynGroup(`fieldsGenerator`) → AIField? → Dictionary? |
| **UPDATE** | DynDropdown(parent) → DynDropdown(child)? → DynDropdown/String(ID) → Multiselect(chooser)? → Group(known fields, each gated) or DynGroup(schema fields) |
| **FIND OR CREATE** | DynDropdown(parent) → DynDropdown(child)? → Group(search: AIField, or DynDropdown(field) + String(value)) → Boolean(`create_if_not_found`) → DynGroup(create fields) → DynMultiselect(create fields)? |
| **FIND + UPDATE** | DropdownStatic(search criteria) → String(lookup value) → DynMultiselect/DynDropdown(mutation) → Boolean(add/remove)? |
| **DELETE** | String(ID) → HelpStatic(irreversibility warning)? → Boolean(delete vs archive)? |

**Category Deltas**
- **Instant**: Resource dropdown narrows webhook scope. DynHelp checks permissions/eligibility after resource selection. Several filter dropdowns → whereClause group.
- **Scheduled**: No pagination fields or toggle (`limit`, `page_size`, `cursor`, `offset`, next token) and no `scheduledTime` field—code handles them (`canpaginate: true`). Dependent dropdowns cascade via `visibilityCondition`. Upcoming-event triggers: resource ID(s) + optional number offset (`minutesBefore`/`meetingBefore`) followed by a help field visible once it is set: *"Enter minutes before the event start to get notified. Trigger polls every 5 min, so events starting between (minutesBefore) and (minutesBefore + 5) minutes from now are caught."* `list: true` inputs: validate a non-empty array before iterating.
- **Manual**: `help` HTML wrapped in `<div style="font-family: Arial, sans-serif; line-height: 1.6;">`, UI labels/buttons in `<strong>`. Exactly 2 parts, each heading → list, no other text:
  1. `<p><strong>🔗 Webhook Setup Guide</strong></p>` + `<ul>`/`<ol>`: open dashboard location → create/connect webhook → select events → paste copied **Webhook URL** → save.
  2. `<p><strong>📤 What happens next?</strong></p>` + `<ul>`: what event data the app sends.
- **GET**: Custom triplet guides ID mapping from prior steps. Single record (many → LIST). Handle 404. Reports/analytics: `date_mode` + hardcoded metric set.
- **LIST**:
  - *List All*: Enable Pagination true → one request with `limit`/`offset`; false → loop all pages internally.
  - *Search by…*: `find_by` when several attributes (Name/Email vs Employee ID); input visibility chained on `mode` + `find_by`; non-unique identifier → pagination UI required (same on/off behavior as List All); unique → none.
  - *Search by ID*: direct GET; no pagination.
  - *Advance Search*: only if the API supports advanced filtering; AIField.
  - Filters group only for narrowing modes (may hold an AIField for date normalization). Return-field multiselect empty → all fields (curated defaults stated in `help`). Comma-separated multi-lookups.
- **FIND/SEARCH**: Basic (`true`) = single-column match; Advanced (`false`) = AIField query with schema-fetching `suggestionGenerator`. Operators (=, LIKE, >, <, >=, <=, <>) only if supported. Bulk toggle forks bulk vs standard limit via mirrored `visibilityCondition`s. Response mode Basic/Custom/Full (Custom reveals column multiselect). HelpStatic states match semantics (`"exact, case-sensitive match"`). Native search params first; client-side filtering only as fallback.
- **CREATE**: DynGroup gated on parent selection; returns `{ message: "Please select a resource first." }` when dependencies are missing. Bulk mode: JSON array input + dynamic help field reference.
- **UPDATE**: `help` states unfilled fields stay unchanged. Known fields → static group; truly dynamic (custom fields, columns) → `fieldsGenerator`.
- **FIND OR CREATE**: Find and create in separate groups (search follows FIND/SEARCH, create follows CREATE). `create_if_not_found` defaults true. Create group `visibilityCondition: "context?.inputData?.create_if_not_found"`. AIField search only for complex-query APIs.
- **FIND + UPDATE**: Resolve the record internally by stable identifier—never ask for raw IDs. One lookup field whose label/placeholder adapts to the criteria. Add/remove toggle switches the `optionsGenerator` (Add → all tags; Remove → tags on the record).
- **DELETE**: String ID only—no dropdowns or parent selectors. Archive toggle ("Delete permanently" vs "Move to archive") if supported. Handle 404 (already deleted).

---

# Field Types & Custom Mapping
**Common Keys**
- `key`: unique, stable identifier (`message_type`). Static keys match `^[^.\[\]]*$`; `fieldsGenerator` children may contain `.`/`[]` (no normalization).
- `label`: clean, human-readable name.
- `help`: omit only when label + key are self-explanatory (`first_name`). Starts with `"Enter"` (text inputs incl. string ID fields—never "Select from the list", dictionary, aifield, groups) or `"Select"` (dropdown, multiselect, boolean). Short, plain, non-technical; markdown links allowed (`[Learn More](https://...)`). Length limits apply to `help` keys, not `type: "help"` panels.
- `required`: an empty required field blocks the run with a UI error.
- `placeholder`: always a string (`"100"`, `"true"`), concrete, no `"E.g."`. Required for text inputs; optional for `aifield` and for dropdown/multiselect/boolean (defaults to `"Choose <label>"`).
- `visibilityCondition`: only when dependent; else omit.
- Omitted booleans = `false` (never flag as missing): `required`, `list`, `whereClause`, `canPaginate`, `enableSearchApi`.

| Type | Additional Keys | Constraints & Behavior |
|---|---|---|
| `string`, `number`, `html`, `markdown` | `placeholder`, `list`?, `limit`? | By purpose: amount/price/count/quantity → `number`; rich HTML → `html`; Markdown → `markdown`; else `string`. `list` only on string/number; `limit` only with `list: true`. |
| `date` | `placeholder`, `dateFormat` | `dateFormat`: `YYYY-MM-DDTHH:mm:ssZ`, `YYYY-MM-DD HH:mm:ss Z`, `MM-DD-YYYY HH:mm:ss Z`, `MM-DD-YYYY HH:mm:ss`. Code receives the value in that format (`string` passes raw). `help` states the format; placeholder uses it exactly. Other formats → `string` (same `help` rule). |
| `dictionary` | `template` | Variable key-value pairs (headers, metadata, buttons). Fixed template, never altered: `{key: {type: "string", placeholder: "Enter key"}, value: {type: "string", placeholder: "Enter value"}}`. |
| `boolean` | `options`, custom triplet | Exactly 2 `{label, value}`, true first. Labels may vary (Yes/No, Basic/Advanced); label may be a question. |
| `dropdown` (static) | `options`, custom triplet | Single select. Fixed `options: [{label, value, sample?, extraValue?}]`; `value` string/number. |
| `multiselect` (static) | `options`, custom triplet | Fixed `options: [{label, value, sample?}]`. |
| `dropdown` (dynamic) | `optionsGenerator`, custom triplet, `canPaginate`?, `enableSearchApi`? | See **Dynamic Dropdown**. |
| `multiselect` (dynamic) | `optionsGenerator`, custom triplet | **Strictly returns flat `[{ label, value, sample }]`**. No `canPaginate`/`enableSearchApi`. Paginated source → loop internally (`do { … } while (cursor)`) and aggregate. |
| `aifield` | `prompt`, `suggestionGenerator` | **Actions only.** AI builds structured data at config time for perform. `prompt` = role + output spec: raw JSON only (no markdown/explanations); string variables quoted (`"${context.req.body.email}"`), numbers/booleans unquoted. `suggestionGenerator` JS returns schema/context; always present (`""` if none). |
| `help` (static) | `help` | Text/HTML/Markdown content. No `label`/`required`/`placeholder`. |
| `help` (dynamic) | `source` | JS returns `{ message }` (text/HTML/Markdown). Optional `label`; no `help`/`placeholder`. |
| `input groups` (static) | `fields` | Each child a complete valid field (any type; nestable). `help` optional. `whereClause: true` → sentence layout. |
| `input groups` (dynamic) | `fieldsGenerator` | Returns an array of complete fields (any type, nested groups included) or `{ message }` (UI warning box). Reads `context?.inputData?.['<key>']`. |

**Options** (dropdown & multiselect)
- `sample`: string equal to `value` (`value: 100` → `sample: "100"`; UI shows it in brackets); required when `value` is an ID; omit when identical to `label`.
- `extraValue` (dropdown only; any JSON type): hidden metadata for visibility, generators, and code at `context?.inputData?.<key>_extraValue`.

**Dynamic Dropdown**
Set flags from verified API capability; an existing component that already paginates/searches → set its flag `true`. Enabling an unsupported flag breaks at runtime.

| API Supports | `canPaginate` | `enableSearchApi` | Output | Zero Results |
|---|---|---|---|---|
| Neither | false | false | `[{ label, value, sample }]` | `{ message: "No <resources> found." }` |
| Search only | false | true | `{ data: [...], offset }` | `{ message: "No <resources> found." }` |
| Pagination only | true | false | `{ data: [...], offset }` | First page (`!offset`): `{ data: [], offset: null, message: "No <resources> found." }`<br>Later page: `{ data: [], offset: null, message: "<Resources> Fetched Successfully" }` |
| Both | true | true | `{ data: [...], offset }` | `{ data: [], offset: <current offset>, message }` |

- `offset` = next cursor; `null` at the end.
- Both flags, while `__searchText` is set: don't send the stored cursor; return the current cursor as `offset` (ignore the search API's) so exiting search resumes paging.
- **Dynamic Dropdowns, Multiselects & Dynamic Fields**: Prefer a reusable component for dynamic dropdowns and multiselects (`optionsGenerator`), and dynamic input groups (`fieldsGenerator`). Creation of new reusable components is strictly focused on dynamic fields (`optionsGenerator` and `fieldsGenerator`) rather than creating components for the request API or standard perform code. Do not create reusable components for generic request API (`appRequest`); actions and triggers execute API requests directly. Inline code defines the function and invokes it at the end, inside `try/catch → errorComponent`.

**Custom Mapping Mode** (dropdown, multiselect, boolean—static and dynamic; triplet mandatory there, invalid on other types)
- **Standard Mode**: shows `label` (`"Page"`), `help` (`"Select..."`), `placeholder`.
- **Custom Mapping Mode**: the field becomes a string input showing:
  - `customInputLabel`: short; never starts with "Enter". ID fields → `"<Entity> ID"` (`"Page"` → `"Page ID"`); otherwise equals `label`.
  - `customHelp`: crisp manual-input guidance in business terms (never "copy the ID from the URL"):
    - Dynamic: `"Enter the Spreadsheet ID manually. You can get it from actions like List Spreadsheets or Find Spreadsheet."`
    - Static, few options: list values + effect (`"Enter 'text', 'image', or 'audio' to set message type."`); many: `"Enter <label> to <benefit>."`
    - Boolean: `"Enter true to <outcome>, or false to <outcome>."`
    - Multiselect: also say values go in array format.
  - `customPlaceholder`: concrete value (`"true"`, `"page_123"`); multiselect → serialized array (`"[\"title\",\"status\"]"`).

**Standalone Help Field (`type: "help"`) — Strict Rule**
*Never for standard field descriptions (use the field's `help`). Allowed ONLY for:*
1. **DELETE / High-Stakes**: Permanent deletion or irreversibility warnings.
2. **Behavior-Changing Toggles**: Selections that change workflow, billing, or downstream behavior.
3. **External Prerequisites**: Account tiers, permissions, or webhook registrations needed.
4. **Manual Webhook Setup**: Mandatory 2-part HTML instructions.
5. **Polling Math**: Lookback/lookahead window explanations.

Dynamic help serves these via live checks: auth/permissions, resource existence, eligibility, unsupported settings, previews.

**whereClause** (static input groups only)
Children render inline as a sentence (end users see it without edit mode), e.g. *"When commented on [specific media] Media [choose media]"*. Group `label`/`help` optional. Prefer `dropdown`/`multiselect` children (other types may not render inline). Labels in sentence case: first child capitalized (`"When commented on"`), later ones lowercase (`"posted after date"`) except proper nouns (`"Media"`).

---

# Visibility & dependsOn
- `visibilityCondition`: any JS expression returning a boolean over `context?.inputData` (math, `.includes`, `.some`, `Object.keys`). Evaluated before `required`: hidden fields are not enforced.
- **Direct Dropdown Value Access**: Dropdowns store the raw `value` primitive at `context?.inputData?.<key>` (never `.value`): `context?.inputData?.type === 'custom'`.

| Scenario | Condition Pattern |
|---|---|
| Field filled | `context?.inputData?.k` |
| Multiselect non-empty | `Array.isArray(context?.inputData?.k) && context.inputData.k.length > 0` |
| Multiselect contains | `context?.inputData?.k?.includes('target')` |
| Dropdown / String equals | `context?.inputData?.k === 'val'` or `['a', 'b'].includes(context?.inputData?.k)` |
| Boolean true / false | `context?.inputData?.k` / `!context?.inputData?.k` |
| Nested in Input Group | `context?.inputData?.group?.k === 'val'` (nested group keys chained in order) |
| `extraValue` access | `context?.inputData?.k_extraValue === 'x'` / `context?.inputData?.group?.k_extraValue` |
| Computed | `(context?.inputData?.price * context?.inputData?.quantity) > 100` |

- **`dependsOn`**: Engine-generated from input paths read in `optionsGenerator`, `fieldsGenerator`, or `suggestionGenerator` (write them literally as `context?.inputData?.<key>`, never destructured); never declare manually. Visibility paths don't count; static fields get `[]`. Pass every input path (plus search/limit) into components as params so dependencies are detected.
- **`steps` / `blocks`** (engine output, never authored): `steps = { root: [top-level keys], <group>: ["<group>.<key>"] }`; `blocks` = flat map of every field with its `dependsOn`.

---

# Perform Code & Response Formatting

## Code Structure
Identify intent (read, create, update, find-or-create, delete) → pick the matching skeleton → adapt endpoint, method, params, body, and response path. Both formats are valid in any block (convention: Format 1 for `perform`, Format 2 for trigger blocks).
- **Format 1 (Function Wrapper)**:
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
- **Format 2 (Direct)**: parent `try { … } catch (error) { await errorComponent(error); }`.

## Clean Code Principles
Lean, readable, native JS; no bloat or wrapper gymnastics.
- **Readable Spacing**: Distinct blocks for validation, payload assembly, API call, and response return. No dense one-liners or minified logic.
- **Upfront Destructuring**: From `context?.inputData || {}` (`context?.inputData?.<key>` also valid).
- **Mandatory Optional Chaining (`?.`) on Paths**: Optional chaining (`?.`) is required in EVERY path in the code block (e.g., `body?.form_response`, `formResponseData?.definition?.fields`, `response?.data?.items`). Direct property access like `body.form_response` or `formResponseData.definition?.fields` throws an unexpected runtime error if the key is not present. Flag if optional chaining is missing.
  - ✅ **CORRECT**:
    ```javascript
    const formResponseData = body?.form_response;
    formResponseData?.definition?.fields
    ```
  - ❌ **WRONG** (FLAG IT):
    ```javascript
    const formResponseData = body.form_response;
    formResponseData.definition?.fields
    ```
- **Payload Construction**: Spread with shorthand keys; one central cleanup (no per-field `if` checks):
  ```javascript
  const raw = { name, email, status, metadata };
  const payload = Object.fromEntries(Object.entries(raw).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
  ```
- **No Redundant Variables**.
- **Update Payloads**: Exclude identifier keys; send the full object only if the API requires replacement.
- **URL IDs**: `encodeURIComponent(id)`.
- **String Newlines**: In stringified code (`perform`, `testcode`), use raw `\n`, never double-escaped `\\n`.

## Response Return Patterns
*Always anchor on `.data` with optional chaining.*
```javascript
// 1. Direct Return (Clean API responses)
return response?.data;

// 1b. List / Get Actions (Zero-length message with data & important keys)
return {
  message: response?.data?.length ? null : "No data found.",
  data: response?.data,
  pagination: response?.data?.pagination,
  has_more: response?.data?.has_more,
  success: true
};

// 2. Metadata Injection (Mutations, status updates, minimal 200s)
return { success: true, id: response?.data?.id || id, ...response?.data };

// 3. Unnesting (Bubble nested payload to root)
const item = response?.data?.data || response?.data?.result || response?.data;
return { success: true, ...item };

// 4. Selective Keys (Bloated/noisy APIs)
const raw = response?.data;
return { success: true, id: raw?.id, name: raw?.name, status: raw?.status, created_at: raw?.created_at };

// 5. Flattening (Deep hierarchies for variable pill picker)
const o = response?.data;
return { order_id: o?.id, total: o?.pricing?.total, customer_email: o?.customer?.email };

// 6. Multi-API Calls (Every response must extract from .data)
const uData = (await axios.get('/user'))?.data;
const pData = (await axios.get('/projects'))?.data;
return { success: true, user: uData, projects: pData?.items || [] };

// 7. Confirmation (Empty DELETE bodies)
return response?.data || { id, deleted: true };
```

## Libraries & Globals
- **Global Libraries** (never imported): `axios`, `fetch` (node-fetch), `FormData` (form-data), `jwt` (jsonwebtoken), `_` (lodash), `https`, `crypto`, `setTimeout`, `Buffer`, `atob`, `cheerio`, `moment`, `URLSearchParams`, `XMLParser`, `XMLBuilder`, `XMLValidator`. Extras: `usaProxy`, `__findFromMemory` / `__updateInMemory`.
- **Unavailable** (runtime error): `URL`, `btoa` (use `Buffer`), `TextEncoder`, `structuredClone`, `setInterval`, `clearTimeout`, `AbortController`, `Blob`, `require`, `process`, `module`, `import`. `axios`: only `axios(config)` and `.get/.post/.put/.patch/.delete/.request`—no `axios.create`, `axios.isAxiosError()` (use `error?.isAxiosError`), `defaults`, or interceptors. `console`: only `log`/`error`.
- **VM**: Every block is the body of `async function step(context)`—top-level `await`, must `return`. Never redeclare `context`, `axios`, `fetch`, `console`, `authData`, or component names. Limits: 5–15 s per block (polling perform ~5 min), 256 MB.
- **System Globals**:
  - `context.inputData.<key>`: User inputs. Empty optionals arrive as `''` (numbers `0`)—treat as unset; never send them.
  - `context.authData.<key>`: Non-secret connection metadata only (e.g., domain, subdomain, account ID, region). Secret keys (API key, token, secret) are masked by the backend and must never be referenced in code (auth is automatically injected via `authenticationpaths`).
  - `__executionStartTime__`: Scheduled run ISO timestamp (`"2026-07-28T09:26:51.074Z"`); compute via `new Date(__executionStartTime__).getTime()`.
  - `context.inputData.scheduledTime`: Polling interval in minutes.
  - `context.paginationData`: Scheduled cursor across runs. **Never reset to null/0 in `else`**.
  - `context.paginateData['<field>']`: Cursor for dynamic dropdown `optionsGenerator`.
  - `__searchText`: Search query in `optionsGenerator` when `enableSearchApi: true`.
  - `context.inputData.transferOption.offset`: Transfer pagination offset.
  - `context.inputData.hookUrl`: Instant webhook URL.
  - `_scriptId`: Unique script ID, for apps requiring a unique webhook key.
  - `context.inputData.performsubscribe`: Subscription response stored for Unsubscribe.
  - `context.req.body` / `.headers` / `.query`: Raw webhook request in `modifytriggerdata`.

---

# Code Skeletons

## Instant Subscribe & Unsubscribe
Subscribe sends `hookUrl` (+ event, user config from `context.inputData`, `_scriptId` if needed) and returns `response.data` (stored as `performsubscribe`). Unsubscribe with no stored subscription id → `return { success: true }`.
```javascript
// Subscribe
const { data } = await axios.post('<url>/subscribe', { hookUrl: context?.inputData?.hookUrl, event: '<event>' });
return data;

// Unsubscribe
await axios.delete(`<url>/subscribe/${context?.inputData?.performsubscribe?.id}`);
return { success: true };
```

## Sample (Instant & Scheduled)
- Return one object (single-event schema matching the live payload), never an array: latest item (`limit: 1`, newest first) or any item, with `viasocket_help`.
- None found → fallback matching the real structure: build from a schema endpoint if available (`array`/`list`/`multi_select` → `[]`, `boolean` → `false`, `number` → `0`, else `""`), else hardcode fields.
- Manual: hardcoded schema sample (no auth).
```javascript
const res = await axios.get('<url>/<resource>', { params: { limit: 1, sort: 'created_at:desc' } });
const items = res.data?.results || res.data || [];
if (items.length) {
  return { viasocket_help: "This is the latest item data available in the selected resource. Save the Trigger and publish to get the new item created in the selected resource.", ...items[0] };
}
return { viasocket_help: "This data is only a sample of the original data. If you want to see the original data, then you have to save the trigger, publish the flow and perform the given action.", id: "", name: "" };
```

## Modify Trigger Data
`modifytriggerdata` reshapes data before the flow. Input: `context?.req?.body` (live) or Sample output (Test).
- Uses: ID-only payload → fetch full record; array of IDs → fetch each, return array; nested payload → flatten. Manual: local reshaping only.
- Return an object or array (flow runs once per item); `[]` drops the event; an empty block ≡ `return context?.req?.body;`.
```javascript
try {
  const { id } = context?.req?.body || {};
  if (!id) throw new Error('No ID found in the webhook payload.');

  const response = await axios.get(`<url>/records/${encodeURIComponent(id)}`);
  return response?.data;
} catch (error) {
  await errorComponent(error);
}
```

## Transfer (New-Event Triggers Only)
Optional—needed only when a history list API exists for a new-item trigger. Requires a paginated list endpoint; cursor param name per API; user inputs in `context.inputData`. Returns `{ data, offset, uniqueIdentifier }`: `data` ≤200 items, `offset` = next cursor (`null` = done), `uniqueIdentifier` = key name holding each record's unique value.
```javascript
const offset = context?.inputData?.transferOption?.offset || null;
const params = { limit: 100, ...(offset ? { cursor: offset } : {}) }; // max 200
const res = await axios.get('<url>/<endpoint>', { params });
return {
  data: res?.data?.items || res?.data || [],
  offset: res?.data?.next_cursor || null,
  uniqueIdentifier: 'id'
};
```

## Scheduled Perform
- Returns an array; the engine runs the flow per item. One page per run, ≤ min(1000, API max); no internal loops—paginate across runs.
- **Filtering**: Prefer native API params (`created_at_min`, updated-since, field selection)—most optimized. Else client-side: parse item timestamps to `Date`, filter the window, keep selected fields. Apply predefined filters from input fields or hardcoded defaults.
- Sort results oldest first. New items: `created >= windowStart`. Updated items: `edited >= windowStart && created !== edited`.
- **Lookback Math**: `const windowStart = new Date(new Date(__executionStartTime__).getTime() - (context?.inputData?.scheduledTime || 15) * 60000);`
- **Advance Cursor** (`canpaginate: true`): `context.paginationData` starts `0`/`null`. Assign the next cursor/page ONLY if filtered items are non-empty AND a next token exists (page-number APIs: `items.length >= pageSize`; native time filter: `items.length > 0`). Otherwise leave it untouched—the engine stops on a repeated token. Resetting to `null`/`0` restarts pagination (infinite loop).
- **Multi-Item Pagination** (multiselect/`list` input, cursor per item): `context.paginationData = { cursors: { [id]: nextCursor }, activeForms: [ids] }`. Read `activeForms || inputIds` and `cursors || {}`; advance an item only if it yielded results and has a next token; reassign only if ≥1 item continues.
- **Upcoming Event Math** (relative future window):
  ```javascript
  const windowSizeMins = Number(context?.inputData?.scheduledTime || 5);
  const execDate = new Date(__executionStartTime__);
  execDate.setUTCMinutes(Math.round(execDate.getUTCMinutes() / windowSizeMins) * windowSizeMins, 0, 0); // snap cron drift

  const rawOffset = context?.inputData?.minutesBefore ?? context?.inputData?.meetingBefore;
  const offsetMins = rawOffset !== undefined && rawOffset !== '' ? Number(rawOffset) : 0;
  const windowStartMs = execDate.getTime() + offsetMins * 60000;
  const windowEndMs = windowStartMs + windowSizeMins * 60000;

  const timeMin = new Date(windowStartMs - 60000).toISOString(); // ±1m API buffer
  const timeMax = new Date(windowEndMs + 60000).toISOString();
  // Post-fetch strict filter (one tick per item): eventStartMs >= windowStartMs && eventStartMs < windowEndMs (or > start && <= end)
  ```
  Fetch each selected resource once (`singleEvents: true`); tag items with `resourceId`. Google Meet: match `/meet\.google\.com/i` across `conferenceData.entryPoints`, `location`, `description`.

## Action Perform Template
```javascript
async function executeAction() {
  try {
    const { record_id, ...rest } = context?.inputData || {};
    if (!record_id) throw new Error('record_id is required.');

    const payload = Object.fromEntries(Object.entries(rest).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
    const response = await axios.post(`<url>/resources/${record_id}`, payload);
    return { success: true, id: record_id, ...response?.data };
  } catch (error) {
    await errorComponent(error);
  }
}
return await executeAction();
```
- **FIND OR CREATE**: search → return existing if found → else create when `create_if_not_found ?? true`.
- **GET / DELETE**: treat 404 as not found / already deleted.
- **FIND / SEARCH**: no match → empty success result (`{ success: true, items: [] }`), not an error.

---

# Reusable Components
Reusable components are supported across all code blocks (`perform`, `performlist`, `transferoption`, `performsubscribe`, `performunsubscribe`, `modifytriggerdata`) and field generators (`optionsGenerator`, `fieldsGenerator`).
- **No Request API Component**: Do NOT create reusable components for the request API (such as `appRequest` or generic HTTP fetcher/wrapper functions). Actions and triggers execute their API requests directly using `axios` or `fetch`.
- **Creation Focus**: While reusable components are supported across all code blocks, creation focus is strictly on **`optionsGenerator`** in case of dynamic dropdowns and multiselects, and **`fieldsGenerator`** in case of dynamic input groups. Avoid creating reusable components for perform code or general utilities when direct code execution is sufficient.
- **Mapping Path Rules**:
  - **Dedicated Section Key Path**: For code blocks, `path` MUST be the dedicated section key: `perform`, `performlist`, `transferoption`, `performsubscribe`, `performunsubscribe`, or `modifytriggerdata`.
  - **Field Key Path**: When mapping a component in the `optionsGenerator` of a dynamic `dropdown`, `multiselect`, or dynamic input group (`fieldsGenerator`), `path` MUST be the field key (e.g., `"page_id"`).
  - **No Nested Input Group Path**: In case of fields present inside an input group, `path` is STILL strictly the field key itself (e.g., `"page_id"`), NOT a nested input group path (such as `"input_group_key.page_id"`).
- **No Component-in-Component Calls (Single Component Rule)**: **Avoid calling components inside components.** Each reusable component must be a single, standalone component created and added/mapped for its specific dynamic dropdown, multiselect, dynamic field, or code block. For example, in Google Sheets:
  - For the `spreadsheet` dropdown: create a single reusable component `fetchSpreadsheet` (fetches and returns spreadsheets directly).
  - For the `subsheet` dropdown: create a separate single reusable component `fetchSubsheet` (takes `spreadsheetId` as a parameter and fetches subsheets directly using `axios`).
  - `fetchSubsheet` must **NEVER** call `fetchSpreadsheet` or any other reusable component. Each component is completely self-contained.
- **Parts**: **Name** (unique camelCase; immutable once used), **Parameters**, **Code** (raw `try...catch` body, no function wrapper, params as globals, `catch (error) { throw error; }`).
- **Caller Pattern (`optionsGenerator` / `fieldsGenerator`)**: reads inputs/globals and passes them as params:
  ```javascript
  try {
    return await listTallyForms(context.inputData.workspaceId, context?.paginateData?.['formid']);
  } catch (error) {
    await errorComponent(error);
  }
  ```
- **Validation Checks (Always Throw)**: Validate required params and parent dependencies first; always `throw` a structured fallback:
  ```javascript
  if (!workspaceId) {
    throw { data: [], offset: null, message: 'Select a workspace first.' };
  }
  ```
  *(Non-paginated: `throw { message: 'Select a <parent> first.' };`)*
- **Output Formats**: Non-paginated `[{ label, value, sample }]`; paginated `{ data: [{ label, value, sample }], offset: string|number|null }`; zero results and search-cursor handling per **Dynamic Dropdown**.
- **Parameter Strictness**: `offset`/`limit`/`search` params ONLY if documented; these and parent paths are optional params—validate only required ones. Never read `context.inputData`, `__searchText`, or `context.paginateData` inside the component—pass every input path as a param.
- **Client-Side Pagination**: Paginated component (`{ data, offset }`) inside a non-paginated dropdown (`canPaginate: false`) or dynamic multiselect → `optionsGenerator` loops all pages and returns a flat array.
- **Reuse & Update**: Search existing components first; reuse if suitable. Mapped/active: never change `function_name`/`params`—code-only changes update in place; new params needed → new component. Unused: fully editable.
- **No Creation of `errorComponent` (Backend Auto-Created)**: An `errorComponent` reusable component must **NEVER** be created manually or via `create/reusable_components` payloads—it is created automatically by the backend. To map it to an action or trigger version, fetch the reusable components (`get/reusable_components?identifier=${pluginId}&filter=dhGetReusableComponentDetails` or `Fetch_Reusable_Components_Details`) to find the `errorComponent` component ID (`rowid`), and map it using that component ID across all blocks/paths where `await errorComponent(error)` is invoked. If the plugin API returns error messages or codes in different keys/paths (e.g., `error`, `errors`, `detail`, `error.code`, `error_code`, `code`), update the existing `errorComponent` reusable component so its `code` and `message` assignments check those provider-specific error keys before fallback.
- **Mapping Requirement**: Every component called in code blocks or field generators must be mapped to its corresponding `path` (see Mapping payload).

---

# API Database Payload Schemas
- **Key**: `name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')` (`"New Lead"` → `"New_Lead"`).
- **Category**: operation (`GET`, `CREATE`, `UPDATE`, `DELETE`, `FIND`, `FIND OR CREATE`, `CREATE OR UPDATE`). **Sub Category**: UPPERCASE business entity tag (`PAGE`, `DATA SOURCE`), chosen from existing sub-categories or newly created representing the domain entity; consistent across related plugs. Both `""` for triggers.
- Updates send only changed keys. `sampledata`?: sample output object aiding flow mapping.
- **Action**: `name`, `key`, `description`, `pluginrecordid`, `isvisible` (bool), `type: 'action'`, `category`, `sub_category`, `scopes`? (action-specific OAuth scopes string separated by space or comma, e.g. `'instagram_business_content_publish,instagram_business_manage_messages'`), `rtllayer` (bool), `isAIActionTrigger` (bool), `isUserOnDh` (bool), `functionId` (version row ID; required on update), `inputjson: {steps:{}, blocks:{}, inputFields:[...]}`, `perform`, `authid`?, `metadata: {chatbotthreadid}`?, `sampledata`?.
- **Trigger**: `name`, `key`, `description`, `pluginrecordid`, `isvisible` (bool), `ignoreuniversalsampledata` (bool), `preferred_step_name` (usually `''`), `type: 'trigger'`, `triggertype`, `category: ''`, `sub_category: ''`, `inputjson: {steps:{}, blocks:{}, inputFields:[...]}`, `authid`? (never for Manual), `scopes`? (trigger-specific OAuth scopes string separated by space or comma; supported in Instant and Scheduled, NEVER in Manual), `sampledata`?, plus its type's block keys—all required on create (`""` for an empty optional block):
  - *Instant*: `performsubscribe`, `performunsubscribe`, `performlist`, `modifytriggerdata`, `transferoption`.
  - *Scheduled*: `perform`, `performlist`, `transferoption`, `scheduleTimeOptions` (allowed minutes; `[]` = all; restrict e.g. `[5, 15, 60, 720, 1440]` for rate limits), `canpaginate` (`true` when perform uses `context.paginationData`).
  - *Manual*: `performlist`, `modifytriggerdata`.
- **Reusable Component**:
  - *Create*: `function_name` (camelCase; creation focus is strictly on `optionsGenerator` for dynamic dropdowns and multiselects, and `fieldsGenerator` for dynamic input groups; do NOT create reusable components for the request API [e.g. `appRequest`] or perform code; NEVER create `errorComponent` as it is created automatically by the backend), `description`, `params: [{name, sample}]` (string samples double-quoted `'"field ID"'`; other types raw), `code` (raw try-catch body), `function_code` (full async function wrapping name, params, code), `pluginrecordid`, `componentgenerationsource` (`userGenerated`/`aiGenerated`), `functionId` (action version ID).
  - *Update*: `rowid`, `description`, `code`, `function_code`, `componentgenerationsource`.
- **Mapping**: `action_version_id`, `component_id`, `pluginrecordid`, `action_id`, `path`. Acts as a toggle: the same call again unmaps.
  - Dedicated Section Key Path: For code blocks, `path` is one of `perform`, `performlist`, `transferoption`, `performsubscribe`, `performunsubscribe`, `modifytriggerdata`.
  - Field Key Path: When mapping a component in the `optionsGenerator` of a dynamic `dropdown`, `multiselect`, or dynamic input group (`fieldsGenerator`), `path` MUST be the field key (e.g., `page_id`, not `group.page_id`).
  - For `errorComponent`, fetch reusable components to find its auto-created `component_id` and map it across all blocks invoking `await errorComponent(error)`.

---

# Developer Hub (DH) URLs
Dynamic URLs to plugs, triggers, and actions in the viaSocket Developer Hub.

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
- Error handling matches rules (`await errorComponent(error)` in code blocks; `throw error` in reusable components).
- Mandatory Optional Chaining (`?.`) in paths: Optional chaining (`?.`) is strictly required in EVERY property access path in code blocks (e.g. `body?.form_response`, `formResponseData?.definition?.fields`, `response?.data?.items`, `context?.inputData?.<key>`). Flag as a defect if optional chaining is missing (e.g., `body.form_response` or `formResponseData.definition?.fields`). Rationale: If a key is missing or undefined at runtime, direct access throws an unhandled runtime error (`TypeError: Cannot read properties of undefined`).
- Every input referenced in code exists in `inputFields`; no orphan fields; valid `visibilityCondition` paths.
- Base `.data` extraction on every API call (including multi-API calls).
- All reusable components called in code are mapped with a valid `path` (dedicated section key for code blocks, field key for dynamic fields). Do not create reusable components for the request API (no `appRequest` or generic HTTP wrappers); creation focus is strictly on `optionsGenerator` for dynamic fields (dynamic dropdowns, multiselects) and `fieldsGenerator` for dynamic input groups. No component-in-component calls: every reusable component must be a single standalone component and never call another component.
- Zero results return an informative `{ message }` or valid empty payload per flag combination. In `LIST`/`GET` actions, if data length is 0, return `message: response?.data?.length ? null : "No data found."` along with `data` and important keys (`pagination`, `has_more`, `success`).
- **No authentication / API key in code**: Code must NEVER pass API keys, tokens, or credentials in headers (`Authorization`, `x-api-key`, etc.), query parameters, or body payloads. All authentication is injected automatically by the backend via the connection's `authenticationpaths` (`headers`, `body`, or `queryParams`). Flag any direct auth or API key in code as a critical defect. Manual triggers send no `authid` and make no API calls.
- Required inputs (dependent required included) validated before API calls.
- **Exhaustive Field Coverage**: All documented API fields (path, query, body, filters, optional/advanced) are strictly included in `inputFields` with zero omissions; ordered parent-first, required-first, with optional fields grouped cleanly.
- Payload shape/endpoint match the API; all documented params supported; derived values have fallbacks.

**P1 (Functional & Automation)**
- Dynamic dropdowns for IDs (except DELETE or unlisted upstream IDs); parent dropdowns never bypassed.
- `canPaginate`/`enableSearchApi` flags and component params match documented API support.
- Scheduled perform: single page ≤1000; cursor advanced only on results + token, never reset; `canpaginate: true` when used; no pagination or `scheduledTime` fields.
- Sample returns one object with `viasocket_help`; Transfer only on new-event triggers, ≤200 per batch.
- No `aifield` in triggers; trigger filters via input fields or perform code. Every `aifield` has `suggestionGenerator`.
- Repeat-safe (no duplicates/overwrites on reruns); rate limits respected in loops; internal pagination only when justified.
- Don't flag: either code format, structured/selective returns, omitted default-false booleans, omitted self-explanatory `help`.

**P2 (UX Architecture)**
- Required fields first; optional fields grouped in Input Groups governed by a single multiselect chooser.
- Category field order and deltas followed; unified actions over near-duplicates.
- No `defaultValue` key in `inputjson`; defaults documented in `help` and handled via perform fallbacks.
- Standalone `type: "help"` fields used ONLY for the 5 permitted scenarios, placed below the field they explain.

**P3 (Copy & Formatting)**
- Names and descriptions follow Naming Conventions.
- Field `help` starts with `"Enter"` for inputs/IDs and `"Select"` for dropdowns/booleans; custom triplet present; `customInputLabel` never starts with "Enter".
- Casing: Labels in Title Case (sentence case inside whereClause); help, placeholders, and error messages in sentence case; no `"(optional)"`.
- Consistency: no typos or trailing spaces; wording, casing, and punctuation match sibling fields and actions.
- Placeholders are concrete examples, typed as strings, with no `"E.g."`.

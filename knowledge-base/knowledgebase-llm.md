---
type: page
title: "DH Knowledge Base (Consolidated)"
description: "Single-shot consolidated index of all viaSocket plug knowledge bases. Reason from this; drill into deep docs only for schemas, examples, or edge cases."
published: true
---

# DH Knowledge Base Page Index

- DH Knowledge Base
- Deep Docs
- Plug Anatomy
  - Trigger Types
  - Action Categories
- Pre-Design
- UX Field Ordering
- Field Types Cheatsheet
  - Universal Field Rules
  - Special Cases
- Visibility Condition Patterns
- Perform Code Rules
  - Wrapper
  - Available Libraries
  - Context Globals
- Code Blocks by Type
- Reusable Components
- Generator Return Formats
- Naming Guidelines
- Design Strategy
- Review Checklist
- Deep-Doc Section Map

# Deep Docs
- `knowledge-base/ux-practice.md` — UX patterns, field ordering, naming, design philosophy.
- `knowledge-base/dh-Input-fields-json-builder.md` — Field JSON/TOON schemas, examples, special notes.
- `knowledge-base/perform-code.md` — Code structures, pagination, sample/transfer code, patterns.
- `knowledge-base/dh-review.md` — Final validation checklist.

Query protocol: fetch the doc's `Page Index` first → then the exact heading(s) you need. Prefer TOON over JSON.

# Plug Anatomy
A plug has **Triggers** (start workflows) and **Actions** (do things). Each has **Input Fields** (UI) + **Perform Code** (logic).

## Trigger Types
| Type | Fires | Use when |
|---|---|---|
| Instant | Webhook push, real-time | Service supports webhook subscribe/unsubscribe |
| Scheduled | Polling at interval | No webhook; check periodically |
| Manual | User pastes webhook URL into service | Service supports webhook but no programmatic subscribe |

## Action Categories
GET (one by ID) · LIST (many) · FIND/SEARCH (by criteria) · CREATE · UPDATE · FIND OR CREATE (upsert) · DELETE.

# Pre-Design
1. Web-search official API docs → ground truth (overrides user cURL).
2. Identify: required vs optional params, identifiers, pagination, search/filter support, webhook capability.
3. Never expose auth in UX. Never invent fields not in docs. Every doc field is either UI or implicit in code.
4. Design for **non-technical simplicity + technical completeness**: hide IDs behind labels, but include all optional API params via progressive disclosure (field chooser).

# UX Field Ordering

| Category | Standard order |
|---|---|
| Instant Trigger | Dynamic Dropdown (resource) → whereClause Input Group (optional filter sentence) → Help Dynamic (permission check) → conditional fields |
| Scheduled Trigger | Dropdown (primary) → Dropdown (dependent) → Boolean toggles → Multiselect (field filter) → Input Group (pagination) → AI Field (filter) |
| Manual Trigger | Help Static (setup steps) → simple inputs → Dropdown (optional resource) |
| GET | Dropdown (parent) → Dropdown/String (record ID) → Multiselect (return fields) → Input Group (options) |
| LIST | Dropdown (parent) → Multiselect (return fields) → Input Group (pagination) → AI Field (filter) → Boolean |
| FIND/SEARCH | Dropdown (parent) → Dropdown (child) → Boolean (Basic/Advanced) → Input Group (search filter) → Input Group (sort/limit) → Multiselect (return) |
| CREATE | Dropdown (parent) → Dropdown (child) → Boolean → Multiselect (field chooser) → Dynamic Input Group (schema fields) → AI Field / Dictionary |
| UPDATE | Dropdown (parent) → Dropdown (child) → Dropdown/String (record ID) → Multiselect (field chooser) → Dynamic Input Group |
| FIND OR CREATE | Dropdown (parent) → Dropdown (child) → Input Group (search) → Boolean (create_if_not_found, default true) → Dynamic Input Group (visible if create) → Multiselect |
| DELETE | Dropdown (parent) → Dropdown (child) → Dropdown/String (record ID) → Help Static (warning) |

**Universal UX rules**: required fields first; group optionals; clean generic labels ("Select Board", not "Select Trello Board"); hide raw IDs; field-chooser pattern for many optionals; no auth fields; ignore auto-generated `steps`/`blocks` — emit raw `inputFields` array only.

# Field Types Cheatsheet

## Universal Field Rules
Every field has: `key` (unique, no `.`), `type`, `label`, `help`. `required` defaults false. `visibilityCondition` is a JS expression on `context?.inputData?.<path>`.

| `type` | Use for | Distinctive keys |
|---|---|---|
| `string` / `number` / `html` / `markdown` | Plain text, numeric, rich text, formatted text. String covers dates/times. | `list` (array-mode, string/number only), `limit` (with list), `placeholder`, `defaultValue` |
| `dictionary` | Variable key-value pairs | `template:{key:{type:string,placeholder}, value:{type:string,placeholder}}` |
| `boolean` | Two mutually-exclusive choices | `options` (exactly 2, true-option first), `defaultValue:{label,value}`, `customHelp`, `customPlaceholder` |
| `dropdown` static | Fixed list, single select | `options:[{label,value,sample?,extraValue?}]`, `defaultValue` |
| `dropdown` dynamic | API-fetched single select | `optionsGenerator` JS, `canPaginate`, `enableSearchApi`, `customPlaceholder` (required), `customInputLabel`, `customHelp` |
| `multiselect` static | Fixed list, multi select | `options` as above |
| `multiselect` dynamic | API-fetched multi select | `optionsGenerator` → `[{label,value,sample}]`, `customPlaceholder` (required, array example) |
| `aifield` | AI generates structured data | `prompt` (system prompt), `suggestionGenerator` JS (mandatory key — `""` if none) |
| `help` static | Inline content (HTML/MD) | `help` only (no label/required/placeholder) |
| `help` dynamic | Runtime contextual help | `source` JS → `{ message }`; `label` optional |
| `input groups` static | Logical grouping | `fields:[...]`, `whereClause?:bool` (sentence layout) |
| `input groups` dynamic | Schema-driven field generation | `fieldsGenerator` JS → field-object array, or `{ message }` if deps missing. Normalize keys (`.` → `_`) |

**Allowed types only**: dropdown, multiselect, boolean, string, number, html, markdown, dictionary, aifield, help, input groups.

## Special Cases
- **Dropdown/multiselect options**: `sample` MUST equal `value`. Include `sample` only if value is an ID. If label===sample, omit. `extraValue` carries hidden metadata, reachable via `context?.inputData?.{key}_extraValue` (nest input-group keys).
- **`whereClause` Input Group**: renders inline as a sentence. Recommended children: dropdown/multiselect. Static-only.
- **`list`/`limit`**: only on string/number. `list:true` = preconfigured array; `limit:N` requires `list:true`.
- **`required`**: visibility evaluated first; hidden required fields are ignored. Optional parent revealing a required child → mark child `required:true` AND guard in perform code.
- **`dependsOn`**: auto-generated from `optionsGenerator`/`fieldsGenerator`/`suggestionGenerator` references. Never write manually. `visibilityCondition` does NOT populate it.

# Visibility Condition Patterns

| Depending on | Pattern |
|---|---|
| Multiselect any | `Array.isArray(context?.inputData?.k) && context.inputData.k.length > 0` |
| Multiselect value | `context?.inputData?.k?.includes('A')` |
| String/Dropdown equals | `context?.inputData?.k === 'v'` |
| String/Dropdown in set | `['A','B'].includes(context?.inputData?.k)` |
| Boolean true / false | `context?.inputData?.k` / `!context?.inputData?.k` |
| Field present | `context?.inputData?.k` |
| Inside input group | `context?.inputData?.group?.k` |
| Dropdown `extraValue` | `context?.inputData?.k_extraValue === 'x'` |
| Calculation | `(context?.inputData?.price * context?.inputData?.qty) > 100` |

# Perform Code Rules

## Wrapper
```javascript
async function fnName() {
  try {
    // logic
  } catch (error) {
    await errorComponent(error); // default; or `throw error`
  }
}
return await fnName();
```

Rules:
- No `import`/`require`. Use `axios` or `fetch`. Auth handled by viaSocket — never include.
- Read inputs via `context?.inputData?.<key>`.
- Validate every `required:true` field at top; throw before API call if missing/empty/null.
- Return `response.data` (not the axios wrapper). Don't reshape success responses; don't add fields.
- In `catch`, throw raw error — do not modify. Throw on 200-with-error-body too.
- No `console.log`. Handle API rate limits in loops (delays/retries/headers).

## Available Libraries
Direct use, no import: `axios`, `fetch` (`node-fetch`), `https`, `crypto`, `setTimeout`, `Buffer`, `atob`, `form-data` as `FormData`, `jsonwebtoken` as `jwt`, `lodash` as `_`, `cheerio`, `moment`, `XMLParser`, `XMLBuilder`, `XMLValidator`.

## Context Globals
- `__executionStartTime__` — current run timestamp (Scheduled).
- `context?.inputData?.scheduledTime` — user-defined interval (minutes).
- `context?.paginationData` — pagination cursor persisted across runs. Initial `0`/`null`. Update only when (filtered results non-empty) AND (API returned next token). Loop auto-breaks on repeated token.
- `context?.paginateData?.['<fieldKey>']` — pagination token for dynamic dropdown (bracket path; nest input-group key for grouped fields).
- `__searchText` — search query in `optionsGenerator` when `enableSearchApi:true`.
- `context?.inputData?.transferOption?.offset` — pagination input for Transfer Code.
- `context?.inputData?.hookUrl`, `_scriptId` — Instant subscribe code.
- `context?.inputData?.performsubscribe` — Instant unsubscribe input (subscribe response).

# Code Blocks by Type

| Block | Trigger/Action | Purpose |
|---|---|---|
| Subscribe | Instant | Register webhook. Returns data viaSocket stores for unsubscribe. |
| Sample | Instant, Scheduled | Fetch latest 1 record or fallback schema for UI preview. Wrap fallback in `{ viasocket_help, ...item }`. |
| Perform (modify) | Instant (optional) | Reshape webhook payload before flow. Skip if already correct. |
| Unsubscribe | Instant | Deregister webhook. |
| Transfer | Instant, Scheduled (optional, "New Event" only) | Bulk-pull historical data. Return `{ data, offset, uniqueIdentifier }`, max 200/page. |
| Perform | Scheduled, Manual, Actions | Main API call + filter + return. |

**Scheduled Perform**: prefer native API filters (`created_at_min` etc.). Else client-filter via `__executionStartTime__ - scheduledTime*60*1000`. Sort oldest-first. Update `paginationData` only on success.

**Action patterns** (drill `perform-code.md` for code):
- GET single → `axios.get(/resources/${id})`.
- LIST → `axios.get(/resources)` with pagination params.
- FIND/SEARCH → native query first; client `.find()` only as fallback.
- CREATE → `POST` payload from `inputData`.
- UPDATE → `PATCH/PUT/POST`. Only send filled fields. Skip undefined/null/'' unless explicitly clearing.
- FIND OR CREATE → search first; create only if not found.
- DELETE → `DELETE`; `PATCH/POST` if service archives.

# Reusable Components
JS functions stored once, invoked from `optionsGenerator`/`fieldsGenerator`/`suggestionGenerator`. Hide tokens, dedupe logic.

Rules:
- Unique name (permanent once referenced).
- Accept all dependent inputs as **parameters** (pass from caller). Never read `context.inputData` / `__searchText` / `context.paginateData` directly inside — required for `dependsOn` auto-detection.
- `try/catch` mandatory. Validate inputs at top.
- Return format matches host field: `[{label,value,sample?}]` or `{ data, offset, message? }`.

Caller: `return await fetchSpreadsheets(__searchText, context?.paginateData?.['spreadsheet_id'], 100);`

# Generator Return Formats

| Generator / mode | Return |
|---|---|
| `optionsGenerator` standard | `[{label, value, sample?, extraValue?}]` |
| `optionsGenerator` paginated (`canPaginate:true`) | `{ data:[...], offset: string\|number\|null }` |
| `optionsGenerator` no options | `{ message: 'markdown text' }` |
| `optionsGenerator` hybrid | `{ data:[...], offset:null, message:'...' }` |
| `fieldsGenerator` | full field-object array, or `{ message }` if deps missing |
| `suggestionGenerator` | context data (schema, columns) for AI |
| Dynamic help `source` | `{ message }` |

# Naming Guidelines

| Item | Format | Example |
|---|---|---|
| Action name | Verb + Title Case | "Send Message at Slack Channel" |
| Action description | ≤30 chars | "Send Slack message" |
| Trigger name | Event phrase (no "when"), present tense, Title Case. Avoid: list/fetch/sync/pull/search. | "New Email Arrives" |
| Trigger description | `Runs when <event>`, ≤30 chars | "Runs when new email arrives" |

Mention app name only if generic without it. Preserve compliant existing titles/descriptions on update.

# Design Strategy

- **Unified actions**: Find+List → Unified Search. Create+Update → Intelligent Upsert (search by stable ID → update if found, else create). No "Create vs Update" toggle exposed.
- **Stable identifiers**: prefer email/external_id/sku over volatile DB IDs.
- **Dropdown rule**: use only if dataset is small, stable, paginated. Else direct ID string field.
- **Field chooser**: many optionals → multiselect picks which to render via dynamic input group.
- **Idempotency**: state the duplicate-prevention key per action; safe under 1000+ runs.
- **Partial updates**: send only user-provided fields; never `null`/`''` unless explicit clear.
- **Response handling**: small/flat → return whole payload. Large/nested → offer Basic/Detailed mode.

# Review Checklist

**Perform code**: wrapper correct · no imports · `axios`/`fetch` only · `context.inputData.<key>` mapped · no auth · endpoint matches cURL · rate-limit handled in loops · required-field guards present.

**Input fields**: schema matches type's TOON schema (drill deep doc) · clean generic labels · no auth fields · ignore headers · only `inputFields` (no `steps`/`blocks`) · `sample` rules followed · reusable-component `id` mapping correct.

**Output format**: emit raw `inputFields` array — never `{"inputFields":[...]}` wrapper.

# Deep-Doc Section Map

Query these headings when you need exact schemas/examples.

**ux-practice.md** (per category: Purpose / UX Pattern / Common Input Fields / Perform Code Reference / Best Practices): `Instant Trigger` · `Scheduled Trigger` · `Manual Trigger` · `GET` · `LIST` · `FIND/SEARCH` · `CREATE` · `UPDATE` · `FIND OR CREATE` · `DELETE` · `Title & Description Naming Guidelines` · `Automation UX Builder & Architecture Instructions`.

**dh-Input-fields-json-builder.md** (per type: Generation Rules / JSON Schema / TOON Schema / Examples): `String | Date | Number | HTML | Markdown` · `Dictionary` · `Boolean` · `Dropdown Static` · `Multiselect Static` · `AI Field` · `Help Static` · `Input Group Static` · `Dropdown Dynamic` (+ `Reusable Component In Dropdown Dynamic`) · `Multi Select Dynamic` (+ Reusable Component) · `Help Dynamic` · `Input Group Dynamic`.
Special Notes: `whereClause` · `Dropdown & Multiselect` (sample/extraValue) · `Visibility Condition Rules` · `list`/`limit` · `dependsOn` vs `visibilityCondition` · `required`.

**perform-code.md**:
- `Instant Trigger` → `Subscribe Code Rules` · `Sample Code` · `Perform Code (Modify…)` · `Unsubscribe Code Rules` · `Transfer Code Rules/Patterns`.
- `Scheduled Trigger` → `Perform Code Rules/Patterns` (new+pagination · updated+pagination · client-filter+page-num · native-API) · `Sample Code Rules/Pattern` · `Transfer Code`.
- `Manual Trigger` → `Perform Code Pattern` · `Sample Code Pattern`.
- `Actions` → `Action Perform Code Rules` · `Action Perform Code Patterns` (Read A–E · Create A–B · Update · Delete).
- `Special Note` → `API Request Error Handling` · `Success Code Handling` · `Final Code Review`.

**dh-review.md**: `Review Checklist` → `Perform API & Generators JS Code` · `Input Fields`.

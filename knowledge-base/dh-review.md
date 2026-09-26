---
type: page
title: "DH Reviewer"
description: "Knowledge base for final review of perform code and input fields of viaSocket actions."
published: true
---

# Page Index

- Objective
- Review Checklist
  - 🎯 Core Principles Checklist (Apply Everywhere)
  - Review Priorities (Strict Order)
    - P0 — Breaking (Fail if any triggers; approved: false)
    - P1 — Automation Safety
    - P2 — UX
    - P3 — Text & Consistency
  - Perform API & Generators JS Code
  - Input Fields
  - Text Quality & Consistency
  - Automation Safety & Overwrite Protection
  - Behavior Constraints
  - Trade-Off Evaluation Protocol

# Objective
You must strictly validate the code and JSON against these Knowledge Bases:
- **[DH Input Fields Knowledge Base](knowledge-base/dh-Input-fields-json-builder.md)**
- **[Perform Code Knowledge Base](knowledge-base/perform-code.md)**

# Review Checklist

## 🎯 Core Principles Checklist (Apply Everywhere)

Every trigger and action design and perform code must strictly be validated against these core principles:
* [ ] **Configuration values are static; data resolution happens at runtime:** Field configuration values and structural setups are defined statically at design time; all dynamic data mapping and entity/ID resolution execute dynamically at flow runtime.
* [ ] **Use dropdowns and selection fields instead of requiring manual ID entry:** Always resolve resource references via user-friendly dropdowns and selection fields.
  * *Exceptions:* Direct ID entry is allowed for `Get by ID` (when manual entry from upstream steps is intended) and `DELETE` actions (which strictly use direct text ID fields of type `string` without selection logic).
* [ ] **Implement proper visibility conditions and dependencies:** Ensure cascading dropdowns and dependent fields properly use `visibilityCondition` to depend on parent selections.
* [ ] **Maintain consistent, predictable behaviour across all components:** Keep field ordering, naming conventions, casing, error handling, and response payloads predictable across all triggers, actions, and reusable components.
* [ ] **Never hardcode sensitive values (credentials, secrets, API keys):** Strictly forbid exposing credentials or API tokens in input fields, default values, or perform code; all authentication must run through connection auth.
* [ ] **Handle pagination, dates, arrays, and error cases properly:** Implement engine or client-side pagination where required, normalize human dates to ISO timestamps in perform code, handle repeating line items with input groups, and route errors through `await errorComponent(error)`.
* [ ] **Avoid `defaultValue` key in input JSON:** Never use the `defaultValue` key in input JSON fields. Mention default values in `help` text and handle default fallbacks in perform code.
* [ ] **No Search, Only Pagination Dropdown Pattern:** When `canPaginate: true` and `enableSearchApi: false`, output strictly returns `{ data, offset }`. Empty results must distinguish initial load (`!currentOffset && length === 0` → `{ data: [], offset: null, message: 'No <resources> found.' }`) from pagination end (`currentOffset && length === 0` → `{ data: [], offset: null, message: '<Resources> Fetched Successfully' }`).

## Review Priorities (Strict Order)

### P0 — Breaking (Fail if any triggers; approved: false)
- **errorComponent**: `catch` must await `errorComponent(error)` (except for Reusable Components which must use `throw error` or `throw e` in catch). For `optionsGenerator` using component mapping, the block must be wrapped with a parent `try-catch` and call `await errorComponent(error)` in the catch block (do NOT throw error). No `return` required; do not flag missing return.
- **JSON ↔ Code Alignment**: Every `context.inputData.<key>` read must exist as a JSON input field key. Flag orphan fields (defined in JSON but never used in code). Every `visibilityCondition` must reference a real field key.
- **Payload Shape**: Must match the API schema exactly. The final endpoint must match the provided cURL.
- **API Parameter Completeness**: Input fields and perform code MUST support all possible parameters available in the target API documentation (required and optional parameters across query, body, headers, and filters). Flag any omitted documented API parameters.
- **Auto-Derivation Fallback**: If a required value is derived (e.g., mimetype from URL) and could fail, require a safe fallback.
- **Auth**: Strictly do not include the authentication path in the code, as it is passed from the backend. No auth logic or hardcoded secrets where the platform handles it (non-secret default fallbacks OK).
- **Generators & Reusable Components**: On zero results, return a message key based on the configuration: (a) if ONLY pagination is enabled: return `{ data: [], offset: null, message: <user message> }`; (b) if neither pagination nor search is enabled: return `{ message: <user message> }`; (c) if ONLY search is enabled: return `{ message: <user message> }`; (d) if BOTH search and pagination are enabled: return `{ data: [], offset: <previous_offset>, message: <user message> }` (ignoring search offset and prioritizing the previous pagination offset so exiting search resumes pagination correctly). Handle "parent not selected yet": inside reusable components, validation checks for missing parent dependencies must always throw structured fallbacks (e.g. `if (!workspaceId) { throw { data: [], offset: null, message: 'Select a workspace first.' }; }`), which the calling `optionsGenerator` catches via `await errorComponent(error);`.
- **JSON Validity**: Reject malformed JSON (duplicate keys, broken escaping, missing commas).
- **Required Fields**: Code must throw error at top (before API call) if a required input field is missing/empty/null (e.g. `if (!context.inputData.date) { throw new Error('Date is required.'); }`).
- **Reusable Component Mapping**: Ensure the `"id"` key is correctly mapped to the reusable component's `"id"` key, and verify that `path` is set to either a dedicated section key path (`perform`, `performlist`, `transferoption`, `performsubscribe`, `performunsubscribe`, `modifytriggerdata`) or the field key (e.g., `"page_id"`; for fields inside an input group, use only the field key `"page_id"`, no nested input group path). Confirm mapped components using `Fetch_Mapped_Reusable_Component_In_Action_Version`. Flag as a P0 issue during review if any reusable component called in `inputFields` or `performCode` is not mapped.

### P1 — Automation Safety
- **No Raw IDs & Dropdown Priority (CRITICAL & MANDATORY)**: In UX, always prefer dynamic dropdowns/multiselects over plain text fields for resource references/IDs. Resolve IDs via dropdown/multiselect by readable name. Do not bypass parent dropdowns even if they are required to fetch options. Special exceptions: (1) Category `DELETE` actions are a strict exception and must always use a direct text ID field of type `string` without any dropdown or selection logic; (2) Special apps/workflows where IDs are specifically passed from an upstream/previous step in the flow or where no options-fetching API endpoint exists.
- **Pagination & Generator Output Format (CRITICAL)**: Dynamic dropdowns MUST return `{ data: [{label, value, sample}], offset: string|number|null }` if `canPaginate: true`, `enableSearchApi: true`, or both. If both are `false` (or omitted), dynamic dropdowns MUST return a flat array `[{label, value, sample}]`. Dynamic multiselects strictly return `[{label, value, sample}]` and must handle client-side pagination if consuming a paginated component. For **No Search, Only Pagination (`canPaginate: true, enableSearchApi: false`)**, ensure the output structure is strictly `{ data, offset }` and verify the empty/zero result checks: if `!currentOffset && items.length === 0`, return `{ data: [], offset: null, message: 'No <resources> found.' }`; if `currentOffset && items.length === 0`, return `{ data: [], offset: null, message: '<Resources> Fetched Successfully' }`. Check API docs for limit/offset/cursor on list/fetch endpoints. Flag if code uses internal pagination unless it's `list all items` or the UI has an option to have internal pagination based on user flag or enable pagination (applies to both triggers and actions). Flag if `context.paginationData` (used in scheduled triggers/polling) is reset/cleared to `null` or `0` when pagination ends (e.g. in an `else` block); to stop the loop, the code must simply do nothing (avoid reassigning `context.paginationData`).
- **Multiselect Pagination and Search Limitation (CRITICAL)**: Dynamic `multiselect` fields do **not** support `canPaginate` and `enableSearchApi` properties. If a dynamic multiselect needs pagination or search, its `optionsGenerator` must implement client-side pagination (looping internally to fetch and aggregate all pages/results) and return the aggregated array. Flag if `canPaginate` or `enableSearchApi` are configured for a `multiselect` type field.
- **Repeat-Safety**: Flag actions that can duplicate or overwrite data on repeated runs.
- **Rate Limits**: Flag `Promise.all` over paginated calls to rate-limited APIs. Prefer sequential execution + delay.

### P2 — UX
- **Simplicity First**: Required fields first. Group optionals. Mention default values in `help` & apply fallbacks in perform code (avoid `defaultValue` in input JSON). Auto-detect formats instead of asking. Flag complex UX with concrete simpler alternatives.
- **Help and Placeholders**: `help` must always be available (present) in all fields. It must start with `Enter` for `"string"`, `"number"`, `"dictionary"`, `"date"`, `"AI Field"`, `"markdown"`, `"html"`, and `"Input Group"`. For `"string"` fields (especially ID fields like `parent_task_id`), `help` MUST start with `"Enter"` (e.g. `"Enter a parent task ID..."`) and MUST NOT say `"Select from the list"` or `"Select..."`. For `"dropdown"`, `"multiselect"`, and `"boolean"`, it must start with `"Select"` (or start from `"select"`, e.g., `"Select yes/option label for [outcome]"` for booleans). The `help` value supports string format and markdown links highlighted like `[Lean More](https://example.com)`. Both `help` and `customHelp` must be very crisp and to the point.
- **Placeholders**: `placeholder` must be available in `string`, `date`, `number`, `html`, and `markdown` fields; for `dropdown`, `multiselect`, and `boolean` fields, the `label` should be the direct field name (e.g., `label: "Page"`) and the `placeholder` should instruct the action (e.g., `placeholder: "Select Page"`). The value of `placeholder` and `customPlaceholder` MUST ALWAYS be of type `string`. For `string`, `number`, `boolean`, or any other field types, if the sample placeholder value is of another data type (e.g. number `100`, boolean `true`, array `["item"]`), it MUST be wrapped with quotes as a string (e.g., `"100"`, `"true"` instead of raw `100` or `true`). However, `customPlaceholder`, `customInputLabel`, and `customHelp` are mandatory/must always be included for those three types. For `date` fields, the `placeholder` value must be formatted exactly like the specified `dateFormat`.

### P3 — Text & Consistency
- **Help text**: Short, plain, non-technical. Do not flag length of static/dynamic `type: "help"` panels, only normal fields.
- **Casing**: `label` must be Title Case (clean & generic labels: e.g. "Select Board", NOT "Select Trello Board"). `help`, `placeholder`, and errors must be sentence case (do not Title-Case).
- **Custom Keys**: `customHelp`, `customInputLabel`, and `customPlaceholder` are valid ONLY on dropdown, multiselect, and boolean (flag elsewhere) and are mandatory for these fields.
  - **customInputLabel**: Must be short and **must NOT start with "Enter"** (e.g. if standard label is `"Spreadsheet"`, then `customInputLabel` is `"Spreadsheet ID"`; if it is not an ID field, standard label and `customInputLabel` must be the same).
  - **customHelp**: Must guide manual input:
    - For dynamic dropdowns/multiselect: `"Enter the ID/value... You will get it from the actions like List, Find..."` (e.g. `"Enter the Spreadsheet ID manually. You can get the spreadsheet ID from actions like List Spreadsheets or Find Spreadsheet."`).
    - For static dropdowns/multiselect and booleans: Specify the actual value in the help and explain what will happen (e.g. for boolean: `"Enter true for [outcome] and false for [outcome]"`).
      - In static dropdown/multiselect: if options are few, mention them in `customHelp` and explain. If options are many, write `"Enter {{label name}} ...benefits of the field"` (e.g., `"Enter priority level... to filter tasks."`).
  - Both `help` key and `customHelp` must be very crisp and to the point.
- **Consistency**: Scan for typos, trailing spaces, and mismatches with sibling actions.
---

## Perform API & Generators JS Code
- Verify correct `async`/`try-catch` structure (see required structure below).
- **Libraries**: No imports allowed. Use only `axios` or `fetch`.
- **Below are supported libraries to use directly in code:**
    - `form-data` as `FormData`
    - `https`
    - `crypto`
    - `setTimeout`
    - `axios`
    - `jsonwebtoken` as `jwt`
    - `lodash` as `_`
    - `node-fetch` as `fetch`
    - `cheerio`
    - `moment`
    - `fetch`
    - `Buffer`
    - `atob`
    - `URLSearchParams`
    - `XMLParser`   (for XML → JS Object conversion)
    - `XMLBuilder`  (for JS Object → XML conversion)
    - `XMLValidator`(for XML validation)
- **Payload Mapping**: Ensure `context.inputData.<key>` is correctly mapped to the API payload.
- **No Auth**: Strictly do not include the authentication path in the code, as it is passed from the backend. Ensure absolutely **no authentication logic** is present.
- **Endpoint**: Ensure the final endpoint correctly matches the provided cURL.
- **API Rate Limiting**: If the code calls an API inside a loop, it must handle the API rate limit of the service (e.g., add delays, retry logic, or respect rate limit headers).
- **Required Field Validation**: For every input field marked `required: true` in the input fields JSON, the perform code **must** throw an error at the top of the function (before the API call) if that field's value is missing, empty, or `null`. Example: `if (!context.inputData.date) { throw new Error('Date is required.'); }`
- **Response Return & Formatting (Base `.data` Extraction Rule)**: The actual raw API response is always accessible from the `response.data` key. The base return must always extract from the `"data"` key (including across multiple API calls, e.g. `userRes.data`, `ordersRes.data`), and then navigate to destination path keys as needed. Perform code can inject metadata (`success`, `id`, `has_more`), unnest actual data, filter bloated responses with selective keys, or flatten complex objects to make the output response more structured or organised for downstream workflow. Do NOT flag structured, selective, or modified response returns as an issue.

**Required Structure:**
The code block can use either of the two formats below. The reviewer must not flag either as an issue. The `context` object is available globally.

**Format 1: Wrapping async function**
```javascript
async function <functionName>() {
try { 
  // actual code to perform
} catch (error) { 
  await errorComponent(error); // await errorComponent(error) is used by default in code blocks (except for Reusable Components which must use "throw error" or "throw e"). It is required instead of "throw error".
}
}
return await <functionName>();
```

**Format 2: Direct parent try-catch (no wrapping function)**
```javascript
try {
  // actual code to perform
} catch (error) {
  await errorComponent(error); // await errorComponent(error) is used by default in code blocks (except for Reusable Components which must use "throw error" or "throw e"). It is required instead of "throw error".
}
```

## Input Fields
Each input field must strictly adhere to the structure, formats, and validation rules specified in the **DH Input Fields Knowledge Base** for its given type.

**Review Process for Input Fields:**
- **Schema Validation**: When reviewing each field type, query the knowledge base for the "TOON Schema" of that specific type (found via the "Page Index"). You must strictly follow the TOON Schema and ensure that all required fields specified in the schema are always present in the input JSON.
- **Examples**: If required for further clarification, fetch the Examples for that field type from the knowledge base.
- **Special Notes**: Check the "Page Index" to see if there are any "Special Note:" sections relevant to the specific field type being reviewed, and ensure those rules are applied.

**Field Guidelines:**
- **Clean Labels**: Labels must be clean and generic (e.g., "Select Board", NOT "Select Trello Board").
- **Exclusions**: Do not include Auth fields. Ignore Headers. Validate ONLY `inputFields` (ignore auto-generated `steps`/`blocks`). If optional boolean keys like `whereClause`, `required`, `canPaginate`, `enableSearchApi`, or `list` are missing/not provided in the input fields JSON, they are considered to be `false` by default; do not flag to add them.
- **Allowed Types**: Dropdown, Input Group, Multi-select (all static/dynamic), Boolean, Text Input, HTML, Markdown, Dictionary, AI Field, Number, Help, Help Static.

- **Reusable Component Mapping**: Reusable Components are imported in dynamic dropdowns and multiselects. When generating the field JSON and using the fields key in the Reusable Component mapping list tool, ensure that the `"id"` key is correctly mapped to the reusable component's `"id"` key. The mapping `path` must be set to the field key (e.g., `"page_id"`), and for fields inside an input group, the `path` is STILL strictly the field key itself (e.g., `"page_id"`), not a nested input group path. Dedicated section key paths (`perform`, `performlist`, `transferoption`, `performsubscribe`, `performunsubscribe`, `modifytriggerdata`) are used for code blocks. Also, inside the `optionsGenerator` where the component is called (using component mapping), the call must be wrapped in a `try-catch` block and the `catch` block must call `await errorComponent(error)` (do NOT use `throw error` or `throw e`). **Optional Parameters**: Dropdown parameters like `searchText`, `pageToken`/`page`, `pageSize`/`limit`, and dependent parent paths are optional. Only define and pass them if required/supported by the API (based on search/pagination capabilities). Do not require or flag strict validation/error throwing at the top of the reusable component for these optional parameters.
- **No Hard-coded Input Values**: No hard-coded input values are allowed (except documented default fallbacks).
- **Help and Placeholders**: `help` is generally required and must be present. **Exception:** If the `label` and `key` are completely self-explanatory (e.g., `label: "First Name"`, `key: "first_name"`), the `help` key can be omitted entirely; do not flag it. However, if a field is not completely self-explanatory—for example, a date field with `label: "Date"` which requires explaining the purpose of the date and the accepted format—the `help` key is mandatory. When present, it must start with `Enter` for `"string"`, `"number"`, `"dictionary"`, `"date"`, `"AI Field"`, `"markdown"`, `"html"`, and `"Input Group"`, and start with `"Select"` (or start from `"select"`) for `"dropdown"`, `"multiselect"`, and `"boolean"` fields. The value of `help` supports string format and markdown links like `[Lean More](https://example.com)`. `placeholder` must be available in `string`, `date`, `number`, `html`, and `markdown` fields; for `dropdown`, `multiselect`, and `boolean` fields, the `label` should be the direct field name (e.g., `label: "Page"`) and the `placeholder` should instruct the action (e.g., `placeholder: "Select Page"`). However, `customPlaceholder`, `customInputLabel`, and `customHelp` are mandatory/must always be included for those three types. `customInputLabel` must be short and must NOT start with `"Enter"`. `customHelp` must guide manual input (see P3 guidelines). For `date` fields, the `placeholder` value must be formatted exactly like the specified `dateFormat`. Both `help` and `customHelp` must be very crisp and to the point.
- **Custom Mapping Mode UI Behavior**: For dropdown, multiselect, and boolean fields, verify they support both Standard Mode (direct field name label, help, placeholder instructing the action) and Custom Mapping Mode (displaying `customInputLabel` in place of standard label, `customHelp` in place of standard help, and `customPlaceholder` in place of standard placeholder with a concrete value sample e.g. `"true"`, `"false"`, or a specific ID).
- **Zero Results for Generators & Reusable Components**: When no options/fields are found (zero results), return a message key based on the configuration: (a) if ONLY pagination is enabled: return `{ data: [], offset: null, message: <user message> }`; (b) if neither pagination nor search is enabled: return `{ message: <user message> }`; (c) if ONLY search is enabled: return `{ message: <user message> }`; (d) if BOTH search and pagination are enabled: return `{ data: [], offset: <previous_offset>, message: <user message> }` (in search mode, ignore the search-returned offset and prioritize the previous pagination offset so exiting search resumes pagination correctly).

## Text Quality & Consistency
- **Help Key**: It must be short, plain, non-technical, crisp, and to the point. It must start with "Enter" for string fields (especially ID string fields, e.g., `"Enter a parent task ID to..."`; do NOT use `"Select from the list"` or `"Select..."`) or "Select" for dropdown/multiselect/boolean fields.
- **Labels & Placeholders**: Must be clear and grammatically correct. Do NOT use "E.g." or "e.g." in `placeholder` or `customPlaceholder` (such as using `"john@example.com"` instead of `"E.g. john@example.com"`); they must contain direct sample values only.
- **customInputLabel**: Must be short and must NOT start with "Enter". E.g., label: "Spreadsheet", customInputLabel: "Spreadsheet ID". If not an ID field, label and customInputLabel must be the same.
- **Length Checking Constraint**: The length checking constraint applies to the `help` KEY only; never flag `type: "help"` panels for length.
- **Consistency**: Ensure `help`/`label`/`placeholder`/`customHelp`/`customInputLabel` are consistent across all fields. Fix casing, wording, and punctuation mismatches (e.g., "Select option." vs "select Options" → "Select Option" (Title Case)).

## Automation Safety & Overwrite Protection

Guidelines to preserve idempotency, ensure partial-update safety, and sanitize payloads during review:

* **Idempotency Preservation:**
  * Ensure that the design enforces repeat-run safety. Every action must explicitly state:
    * Which fields act as the primary duplicate prevention keys.
    * How the "Upsert" or "Create if missing" logic acts under high-volume executions (e.g., running 1,000 times).
* **Update Safety & Overwrite Protection:**
  * **Partial Updates Only:** The perform code must only send fields that are explicitly provided by the user.
  * **Payload Sanitization:** Never send `null` or empty strings (`""`) unless the user is explicitly trying to clear that field. This prevents accidental data erasure in the destination CRM/database.
* **Response Handling:**
  * **Small & Flat Responses:** Return the entire API payload.
  * **Large / Nested Responses:** Implement **Basic** vs **Detailed** response modes, returning key identifiers by default with optional detail expansion.
* **Backward Compatibility Rules (Key Stability):**
  * Field keys are stable contracts. When modifying an existing action, trigger, or field:
    * **Never rename or remove existing keys** unless a migration strategy exists. Renaming keys invalidates existing user mappings.
    * **Allowed changes:** Label updates, help text updates, visibility improvements, and adding optional fields. Always prioritize workflow continuity for existing users.

## Behavior Constraints

Prohibitions against raw schemas, exposed credentials, manual database IDs, and unverified API fields:

* **No Raw Schemas:** Avoid generating raw JSON schemas or mirroring raw API structure straight onto the interface. Refer to the **[DH Input Fields Knowledge Base](dh-Input-fields-json-builder.md)**.
* **No Exposed Secrets:** Absolutely **never** expose or request authentication values (tokens, credentials, API keys) in the input fields configuration.
* **No Direct System IDs:** Never force users to manage or copy internal system IDs (such as GUIDs or serial keys) manually when stable, user-friendly values exist.
* **Adherence to Real Schemas:** Do **not** invent or assume API parameter names, payloads, or field endpoints that are not explicitly documented.
* **No Assumed Dropdown or Reusable Component Parameters:** Never assume `sort`, `limit`, `search`, or `offset` query parameter availability on GET API endpoints in dropdowns. Strictly verify against documented API references. Only add `offset`, `limit`, or `search` parameters to reusable components if the API explicitly supports and documents them.
* **Endpoint Validation:** If endpoints are undocumented, attempt provider confirmation, or document the limitation clearly (avoid assumptions that cause unstable integrations).
* **Strict Review Validation:** All final configurations and perform codes must strictly be validated against the checklist in this document.

## Trade-Off Evaluation Protocol

When conflicts arise during review or design evaluation, assess:
1. **Accessibility:** Does this increase complexity for non-technical users?
2. **System Stability:** Does this increase system instability or runtime fragility?
3. **API Load Risk:** Does this increase API load risk or rate-limit hazards?
4. **Maintainability:** Does this reduce long-term maintainability or backward compatibility?
*Enforce the solution that minimizes long-term risk while preserving usability.*

### Final Decision Reflection
Before issuing an approval or revision recommendation:
* Is this usable by a traditional business owner?
* Is this unnecessarily exposing technical complexity?
* Is worst-case scaling acceptable?
* Is the workflow still logically clean?
* Are constraints handled responsibly?
---
type: page
title: "DH Reviewer"
description: "Knowledge base for final review of perform code and input fields of viaSocket actions."
published: true
---

# Page Index

- Objective
- Review Checklist
  - Review Priorities (Strict Order)
    - P0 — Breaking (Fail if any triggers; approved: false)
    - P1 — Automation Safety
    - P2 — UX
    - P3 — Text & Consistency
  - Perform API & Generators JS Code
  - Input Fields
  - Text Quality & Consistency

# Objective
You must strictly validate the code and JSON against these Knowledge Bases:
- **[DH Input Fields Knowledge Base](knowledge-base/dh-Input-fields-json-builder.md)**
- **[Perform Code Knowledge Base](knowledge-base/perform-code.md)**

# Review Checklist

## Review Priorities (Strict Order)

### P0 — Breaking (Fail if any triggers; approved: false)
- **errorComponent**: `catch` must await `errorComponent(error)` (except for Reusable Components which must use `throw error` or `throw e` in catch). For `optionsGenerator` using component mapping, the block must be wrapped with a parent `try-catch` and call `await errorComponent(error)` in the catch block (do NOT throw error). No `return` required; do not flag missing return.
- **JSON ↔ Code Alignment**: Every `context.inputData.<key>` read must exist as a JSON input field key. Flag orphan fields (defined in JSON but never used in code). Every `visibilityCondition` must reference a real field key.
- **Payload Shape**: Must match the API schema exactly. The final endpoint must match the provided cURL.
- **Auto-Derivation Fallback**: If a required value is derived (e.g., mimetype from URL) and could fail, require a safe fallback.
- **Auth**: No auth logic or hardcoded secrets where the platform handles it (non-secret default fallbacks OK).
- **Generators & Reusable Components**: On zero results, return a message key based on the configuration: (a) if ONLY pagination is enabled: return `{ data: [], offset: null, message: <user message> }`; (b) if neither pagination nor search is enabled: return `{ message: <user message> }`; (c) if ONLY search is enabled: return `{ message: <user message> }`; (d) if BOTH search and pagination are enabled: return `{ data: [], offset: <previous_offset>, message: <user message> }` (ignoring search offset and prioritizing the previous pagination offset so exiting search resumes pagination correctly). Handle "parent not selected yet" (return warning block).
- **JSON Validity**: Reject malformed JSON (duplicate keys, broken escaping, missing commas).
- **Required Fields**: Code must throw error at top (before API call) if a required input field is missing/empty/null (e.g. `if (!context.inputData.date) { throw new Error('Date is required.'); }`).
- **Reusable Component Mapping**: Ensure the `"id"` key is correctly mapped to the reusable component's `"id"` key.

### P1 — Automation Safety
- **No Raw IDs (CRITICAL & MANDATORY)**: Dropdowns and multiselects have the absolute highest priority. Never ask the user for manual entry in a string field (like a record ID) unless a dropdown/multiselect is absolutely not possible. Resolve IDs via dropdown/multiselect by readable name. Do not bypass parent dropdowns even if they are required to fetch the record ID. There are no exceptions for UPDATE or DELETE actions; they must also use dropdowns/multiselects if options can be fetched. (Note: DELETE actions may use a direct text ID field of type 'string' only if no options-fetching API is available).
- **Pagination**: Check API docs for limit/offset/cursor on list/fetch endpoints. Flag if code uses internal pagination unless it's `list all items` or the UI has an option to have internal pagination based on user flag or enable pagination (applies to both triggers and actions). Flag if `context.paginationData` (used in scheduled triggers/polling) is reset/cleared to `null` or `0` when pagination ends (e.g. in an `else` block); to stop the loop, the code must simply do nothing (avoid reassigning `context.paginationData`).
- **Multiselect Pagination and Search Limitation (CRITICAL)**: Dynamic `multiselect` fields do **not** support `canPaginate` and `enableSearchApi` properties. If a dynamic multiselect needs pagination or search, its `optionsGenerator` must implement client-side pagination (looping internally to fetch and aggregate all pages/results) and return the aggregated array. Flag if `canPaginate` or `enableSearchApi` are configured for a `multiselect` type field.
- **Repeat-Safety**: Flag actions that can duplicate or overwrite data on repeated runs.
- **Rate Limits**: Flag `Promise.all` over paginated calls to rate-limited APIs. Prefer sequential execution + delay.

### P2 — UX
- **Simplicity First**: Required fields first. Group optionals. Use `defaultValue` on required dropdowns. Auto-detect formats instead of asking. Flag complex UX with concrete simpler alternatives.
- **Help and Placeholders**: `help` must always be available (present) in all fields. It must start with `Enter` for `"string"`, `"number"`, `"dictionary"`, `"date"`, `"AI Field"`, `"markdown"`, `"html"`, and `"Input Group"`. For `"dropdown"`, `"multiselect"`, and `"boolean"`, it must start with `"Select"` (or start from `"select"`, e.g., `"Select yes/option label for [outcome]"` for booleans). The `help` value supports string format and markdown links highlighted like `[Lean More](https://example.com)`. Both `help` and `customHelp` must be very crisp and to the point.
- **Placeholders**: `placeholder` must be available in `string`, `date`, `number`, `html`, and `markdown` fields; it is optional in `dropdown`, `multiselect`, and `boolean` fields. However, `customPlaceholder`, `customInputLabel`, and `customHelp` are mandatory/must always be included for those three types. For `date` fields, the `placeholder` value must be formatted exactly like the specified `dateFormat`.

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
    - `XMLParser`   (for XML → JS Object conversion)
    - `XMLBuilder`  (for JS Object → XML conversion)
    - `XMLValidator`(for XML validation)
- **Payload Mapping**: Ensure `context.inputData.<key>` is correctly mapped to the API payload.
- **No Auth**: Ensure absolutely **no authentication logic** is present.
- **Endpoint**: Ensure the final endpoint correctly matches the provided cURL.
- **API Rate Limiting**: If the code calls an API inside a loop, it must handle the API rate limit of the service (e.g., add delays, retry logic, or respect rate limit headers).
- **Required Field Validation**: For every input field marked `required: true` in the input fields JSON, the perform code **must** throw an error at the top of the function (before the API call) if that field's value is missing, empty, or `null`. Example: `if (!context.inputData.date) { throw new Error('Date is required.'); }`

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

- **Reusable Component Mapping**: Reusable Components are imported in dynamic dropdowns and multiselects. When generating the field JSON and using the fields key in the Reusable Component mapping list tool, ensure that the `"id"` key is correctly mapped to the reusable component's `"id"` key. Also, inside the `optionsGenerator` where the component is called (using component mapping), the call must be wrapped in a `try-catch` block and the `catch` block must call `await errorComponent(error)` (do NOT use `throw error` or `throw e`). **Optional Parameters**: Dropdown parameters like `searchText`, `pageToken`/`page`, `pageSize`/`limit`, and dependent parent paths are optional. Only define and pass them if required/supported by the API (based on search/pagination capabilities). Do not require or flag strict validation/error throwing at the top of the reusable component for these optional parameters.
- **No Hard-coded Input Values**: No hard-coded input values are allowed (except documented default fallbacks).
- **Help and Placeholders**: `help` is generally required and must be present. **Exception:** If the `label` and `key` are completely self-explanatory (e.g., `label: "First Name"`, `key: "first_name"`), the `help` key can be omitted entirely; do not flag it. However, if a field is not completely self-explanatory—for example, a date field with `label: "Date"` which requires explaining the purpose of the date and the accepted format—the `help` key is mandatory. When present, it must start with `Enter` for `"string"`, `"number"`, `"dictionary"`, `"date"`, `"AI Field"`, `"markdown"`, `"html"`, and `"Input Group"`, and start with `"Select"` (or start from `"select"`) for `"dropdown"`, `"multiselect"`, and `"boolean"` fields. The value of `help` supports string format and markdown links like `[Lean More](https://example.com)`. `placeholder` must be available in `string`, `date`, `number`, `html`, and `markdown` fields; it is optional in `dropdown`, `multiselect`, and `boolean` fields (if omitted, standard selection mode defaults to `"Choose {{field label}}"`). However, `customPlaceholder`, `customInputLabel`, and `customHelp` are mandatory/must always be included for those three types. `customInputLabel` must be short and must NOT start with `"Enter"`. `customHelp` must guide manual input (see P3 guidelines). For `date` fields, the `placeholder` value must be formatted exactly like the specified `dateFormat`. Both `help` and `customHelp` must be very crisp and to the point.
- **Custom Mapping Mode UI Behavior**: For dropdown, multiselect, and boolean fields, verify they support both Standard Mode (standard label, help, optional placeholder) and Custom Mapping Mode (displaying `customInputLabel` in place of standard label, `customHelp` in place of standard help, and `customPlaceholder` in place of standard placeholder with a concrete value sample e.g. `"true"`, `"false"`, or a specific ID).
- **Zero Results for Generators & Reusable Components**: When no options/fields are found (zero results), return a message key based on the configuration: (a) if ONLY pagination is enabled: return `{ data: [], offset: null, message: <user message> }`; (b) if neither pagination nor search is enabled: return `{ message: <user message> }`; (c) if ONLY search is enabled: return `{ message: <user message> }`; (d) if BOTH search and pagination are enabled: return `{ data: [], offset: <previous_offset>, message: <user message> }` (in search mode, ignore the search-returned offset and prioritize the previous pagination offset so exiting search resumes pagination correctly).

## Text Quality & Consistency
- **Help Key**: It must be short, plain, non-technical, crisp, and to the point. It must start with "Enter" or "Select" depending on the field type.
- **Labels & Placeholders**: Must be clear and grammatically correct. Do NOT use "E.g." or "e.g." in `placeholder` or `customPlaceholder` (such as using `"john@example.com"` instead of `"E.g. john@example.com"`); they must contain direct sample values only.
- **customInputLabel**: Must be short and must NOT start with "Enter". E.g., label: "Spreadsheet", customInputLabel: "Spreadsheet ID". If not an ID field, label and customInputLabel must be the same.
- **Length Checking Constraint**: The length checking constraint applies to the `help` KEY only; never flag `type: "help"` panels for length.
- **Consistency**: Ensure `help`/`label`/`placeholder`/`customHelp`/`customInputLabel` are consistent across all fields. Fix casing, wording, and punctuation mismatches (e.g., "Select option." vs "select Options" → "Select Option" (Title Case)).
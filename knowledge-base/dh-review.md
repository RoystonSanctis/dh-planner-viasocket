---
type: page
title: "DH Reviewer"
description: "Knowledge base for final review of perform code and input fields of viaSocket actions."
published: true
---

# DH Reviewer Knowledge Base Page Index

- DH Reviewer Knowledge Base
- Objective
- Review Checklist
    - Perform API & Generators JS Code
    - Input Fields
  - Output Format
    - Reviewer JSON Schema
    - Reviewer TOON Schema
    - Valid Output Example
    
# Objective
You must strictly validate the code and JSON against these Knowledge Bases:
- **[DH Input Fields Knowledge Base](knowledge-base/dh-Input-fields-json-builder.md)**
- **[Perform Code Knowledge Base](knowledge-base/perform-code.md)**

# Review Checklist

## Review Priorities (Strict Order)

### P0 — Breaking (Fail if any triggers; approved: false)
- **errorComponent**: `catch` must await `errorComponent(error)`. No `return` required; do not flag missing return.
- **JSON ↔ Code Alignment**: Every `context.inputData.<key>` read must exist as a JSON input field key. Flag orphan fields (defined in JSON but never used in code). Every `visibilityCondition` must reference a real field key.
- **Payload Shape**: Must match the API schema exactly. The final endpoint must match the provided cURL.
- **Auto-Derivation Fallback**: If a required value is derived (e.g., mimetype from URL) and could fail, require a safe fallback.
- **Auth**: No auth logic or hardcoded secrets where the platform handles it (non-secret default fallbacks OK).
- **Generators**: Return `{ message: <text> }` on zero results (never empty array). Handle "parent not selected yet" (return warning block).
- **JSON Validity**: Reject malformed JSON (duplicate keys, broken escaping, missing commas).
- **Required Fields**: Code must throw error at top (before API call) if a required input field is missing/empty/null (e.g. `if (!context.inputData.date) { throw new Error('Date is required.'); }`).
- **Reusable Component Mapping**: Ensure the `"id"` key is correctly mapped to the reusable component's `"id"` key.

### P1 — Automation Safety
- **No Raw IDs**: Resolve IDs internally or via dropdown by readable name. Do not ask users to type raw IDs.
- **Pagination**: Check API docs for limit/offset/cursor on list/fetch endpoints. Flag if code uses internal pagination unless it's `list all items` or the UI has an option to have internal pagination based on user flag or enable pagination (applies to both triggers and actions). Flag if `context.paginationData` (used in scheduled triggers/polling) is reset/cleared to `null` or `0` when pagination ends (e.g. in an `else` block); to stop the loop, the code must simply do nothing (avoid reassigning `context.paginationData`).
- **Repeat-Safety**: Flag actions that can duplicate or overwrite data on repeated runs.
- **Rate Limits**: Flag `Promise.all` over paginated calls to rate-limited APIs. Prefer sequential execution + delay.

### P2 — UX
- **Simplicity First**: Required fields first. Group optionals. Use `defaultValue` on required dropdowns. Auto-detect formats instead of asking. Flag complex UX with concrete simpler alternatives.

### P3 — Text & Consistency
- **Help text**: Short, plain, non-technical. Do not flag length of static/dynamic `type: "help"` panels, only normal fields.
- **Casing**: `label` must be Title Case (clean & generic labels: e.g. "Select Board", NOT "Select Trello Board"). `help`, `placeholder`, and errors must be sentence case (do not Title-Case).
- **Custom Keys**: `customHelp`, `customInputLabel`, and `customPlaceholder` are valid ONLY on dropdown/multiselect (flag elsewhere).
- **Consistency**: Scan for typos, trailing spaces, and mismatches with sibling actions.
---

## 1. Perform API & Generators JS Code
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
  await errorComponent(error); // await errorComponent(error) is used by default in code blocks. It is required instead of "throw error".
}
}
return await <functionName>();
```

**Format 2: Direct parent try-catch (no wrapping function)**
```javascript
try {
  // actual code to perform
} catch (error) {
  await errorComponent(error); // await errorComponent(error) is used by default in code blocks. It is required instead of "throw error".
}
```

## 2. Input Fields
Each input field must strictly adhere to the structure, formats, and validation rules specified in the **DH Input Fields Knowledge Base** for its given type.

**Review Process for Input Fields:**
- **Schema Validation**: When reviewing each field type, query the knowledge base for the "TOON Schema" of that specific type (found via the "Page Index"). You must strictly follow the TOON Schema and ensure that all required fields specified in the schema are always present in the input JSON.
- **Examples**: If required for further clarification, fetch the Examples for that field type from the knowledge base.
- **Special Notes**: Check the "Page Index" to see if there are any "Special Note:" sections relevant to the specific field type being reviewed, and ensure those rules are applied.

**Field Guidelines:**
- **Clean Labels**: Labels must be clean and generic (e.g., "Select Board", NOT "Select Trello Board").
- **Exclusions**: Do not include Auth fields. Ignore Headers. Validate ONLY `inputFields` (ignore auto-generated `steps`/`blocks`).
- **Allowed Types**: Dropdown, Input Group, Multi-select (all static/dynamic), Boolean, Text Input, HTML, Markdown, Dictionary, AI Field, Number, Help, Help Static.

- **Reusable Component Mapping**: Reusable Components are imported in dynamic dropdowns and multiselects. When generating the field JSON and using the fields key in the Reusable Component mapping list tool, ensure that the `"id"` key is correctly mapped to the reusable component's `"id"` key.
- **No Hard-coded Input Values**: No hard-coded input values are allowed (except documented default fallbacks).
- **Zero Results for Generators**: For `fieldsGenerator` / `optionsGenerator` only: on zero results, return `{message: <user message>}`.

## 3. Text Quality & Consistency
- **Help Key**: It must be short, plain, and non-technical.
- **Labels & Placeholders**: Must be clear and grammatically correct.
- **Length Checking Constraint**: The length checking constraint applies to the `help` KEY only; never flag `type: "help"` panels for length.
- **Consistency**: Ensure `help`/`label`/`placeholder` are consistent across all fields. Fix casing, wording, and punctuation mismatches (e.g., "Select option." vs "select Options" → "Select Option" (Title Case)).
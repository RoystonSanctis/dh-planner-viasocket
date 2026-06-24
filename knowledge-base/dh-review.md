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

**Instructions for Querying the Knowledge Base:**
1. First query "Page Index", this will fetch all the page index hierarchy structure, which can be used to exactly query and get an exact result.
2. Once you know the Page Index, you can focus every time on the exact query headings.

# Review Checklist

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
All code blocks (Triggers, Scheduled/Manual Perform, Actions) start directly with the `try-catch` outer wrap. There is no outer function wrapper (`async (context) =>` or `async function run()`). The `context` object is available globally.

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
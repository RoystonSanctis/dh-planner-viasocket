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

**Required Structure:**
```javascript
async function <functionName>() {
  try { 
    // actual code to perform
  } catch (error) { 
    throw error;
  }
}; return await <functionName>();
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
- **Allowed Types**: Dropdown, Input Group, Multi-select (all static/dynamic), Boolean, Text Input, HTML, Markdown, Dictionary, AI Field, Number, Help.

# Output Format

## Reviewer JSON Schema
```json
{
    "name": "reviewer_schema",
    "schema": {
        "type": "object",
        "properties": {
            "approved": {
                "type": "boolean",
                "description": "This shows the input JSON, and the perform code is production-ready and approved."
            },
            "issues": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "The list of issues present"
            },
            "review": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "The list of points that are good to go and reviewed, with positive feedback."
            },
            "score": {
                "type": "number",
                "description": "Review score from 1 to 100 for the accuracy."
            }
        },
        "required": [
            "approved",
            "issues",
            "review",
            "score"
        ],
        "additionalProperties": false
    },
    "strict": true
}
```

## Reviewer TOON Schema
```toon
name: reviewer_schema
schema:
  type: object
  properties:
    approved:
      type: boolean
      description: "This shows the input JSON, and the perform code is production-ready and approved."
    issues:
      type: array
      items:
        type: string
      description: The list of issues present
    review:
      type: array
      items:
        type: string
      description: "The list of points that are good to go and reviewed, with positive feedback."
    score:
      type: number
      description: Review score from 1 to 100 for the accuracy.
  required[4]: approved,issues,review,score
  additionalProperties: false
strict: true
```
Always return output **strictly as a single JSON object**. Do not add conversational text or markdown labels before the JSON. Reviews and issues should be short, simple, and easy to understand.

## Valid Output Example:

```json
{
  "approved": boolean,
  "issues": ["list of specific violations"],
  "review": ["positive validation notes"],
  "score": 0-100
}
```

```json
{
  "approved": false,
  "issues": [
    "add try-catch block in performAPI",
    "field project_id has an invalid key 'data' in the input json"
  ],
  "review": [
    "try-catch handled correctly in other generators",
    "dropdown schema looks good"
  ],
  "score": 0
}
```

# 🤖 API Integration Architect
**Task:** Extract exactly 5 highest-value Actions and 5 Triggers for **{{service}}** (**{{domain}}**) strictly from official documentation. 


## 🔍 1. Research & Selection Rules
- **Mandatory Search:** Run **GTWY Web Search** first (max 3 searches) targeting official API documentation.
- **Context:** Use **{{categories}}** and **{{tags}}** to identify core business workflows.
- **Strictly Official:** Use documented endpoints only. Zero inference or hallucination.
- **Target:** Primary business workflows. Prefer webhooks for triggers (polling only if explicitly documented).
- **Exclude:** Auth, admin, config, analytics, reporting, import/export, dev, org, maintenance, bulk, experimental, and niche endpoints.

## ✍️ 2. Naming & Formatting Standards
Follow these exact patterns based on optimal platform standards. 

| Type | Name Format (Title Case) | Description Format (1-2 sentences) |
|---|---|---|
| **Action** | **[Verb] [Object]**<br>_Ex: "Create Data Source Item", "Archive Page"_ | Clear explanation of what it does and its target.<br>_Ex: "Creates a new page inside a parent page."_ |
| **Trigger** | **[State Modifier] [Object] [Optional Action]**<br>_Ex: "New Comment Created", "Updated Page"_ | **MUST** start with **"Runs when..."** or **"Triggers when..."**.<br>_Ex: "Runs when a new comment is created."_ |


## 🚫 3. Strict Deduplication (CRITICAL)
- **Analyze Existing List:** You MUST cross-check the JSON array in `{{pre_function}}`.
- **Zero Overlap:** DO NOT output any action or trigger that is already in the list. Generating duplicates (e.g., suggesting "Create Page" or "Append Block Children" when they already exist) is a FATAL ERROR. Search strictly for *missing*, unmapped endpoints.

**Strict Trigger Naming Rules:**
- **MUST** use prefixes for state changes (**"New"**, **"Updated"**, **"Deleted"**).
- ❌ **Incorrect:** "Page Created", "Comment Updated", "Page Deleted"
- ✅ **Correct:** "New Page Created" (or "New Page"), "Updated Comment", "Deleted Page"
- **Forbidden Words:** NEVER use `list`, `fetch`, `sync`, `load`, `pull`, `search`, `check`, `scan`, `collect`, or `export` in Trigger names.

**General Naming Rules:**
- **App Name Rule:** Omit the app name (e.g., "{{pluginName}}") from names and descriptions unless the context is too generic without it. 
- **No Raw IDs:** NEVER use raw event/endpoint identifiers (e.g., `page.created`) as names. 

## 📋 Existing Actions & Triggers List
{{pre_function}}

## 📤 Output
Return exactly one JSON object strictly matching the schema below.

```json
{
    "name": "generate_actions_and_triggers",
    "schema": {
        "type": "object",
        "properties": {
            "action": {
                "type": "array",
                "description": "A list of workflow actions.",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "The name of the action (e.g., 'Create a new data source item')."
                        },
                        "description": {
                            "type": "string",
                            "description": "A concise explanation of what the action does (≤30 chars)."
                        }
                    },
                    "required": [
                        "name",
                        "description"
                    ],
                    "additionalProperties": false
                }
            },
            "trigger": {
                "type": "array",
                "description": "A list of workflow triggers.",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "The name of the trigger (e.g., 'New Data Source Item')."
                        },
                        "description": {
                            "type": "string",
                            "description": "A concise explanation of the trigger event ('Runs when...', ≤30 chars)."
                        }
                    },
                    "required": [
                        "name",
                        "description"
                    ],
                    "additionalProperties": false
                }
            }
        },
        "required": [
            "action",
            "trigger"
        ],
        "additionalProperties": false
    },
    "strict": true
}
```
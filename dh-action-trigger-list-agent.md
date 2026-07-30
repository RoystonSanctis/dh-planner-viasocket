# 🤖 API Integration Architect
**Task:** Extract exactly 5 highest-value Actions and 5 Triggers for **{{pluginName}}** (**{{domain}}**) strictly from official documentation. 

## 🔍 1. Research 
- **Mandatory:** Run **GTWY Web Search** first (max 3 searches). Target official API docs only.
- **Context:** Use **{{categories}}** and **{{tags}}** to identify core business objects.

## 🎯 2. Selection Rules
- **Strictly Official:** Documented endpoints only. Zero inference or hallucination.
- **Target:** Primary business workflows.
- **Triggers:** Prefer webhooks; use polling only if explicitly documented.
- **Exclude:** Auth, admin, config, analytics, reporting, import/export, dev, org, maintenance, bulk, experimental, and niche endpoints.

## ✍️ 3. Formatting Standards
- **Names:** Use clean, user-friendly automation names (e.g., "New Page"). Do not use raw event IDs (e.g., `page.created`) as names.
- **Descriptions:** 20–30 words (max 2 sentences). Define exactly *what* it does, *when* it fires, and the *target object*. Include raw event IDs here only if highly relevant.

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
                            "description": "A detailed explanation of what the action does and its use case."
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
                            "description": "A detailed explanation of the event that activates this trigger."
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
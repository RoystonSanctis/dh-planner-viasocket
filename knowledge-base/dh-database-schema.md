---
type: page
title: "Database Schema for the Tool Call Model"
description: "Technical specification of database and API objects required for viaSocket plug builder tool calls, including Actions, Triggers, and Reusable Components."
published: true
---

# Database Schema for the Tool Call Model

This document outlines the technical specification of the database and API objects required for managing viaSocket actions, triggers, and reusable components through LLM tool calls (such as `create_update_ai_actions`).

---

# 1. Action Object Schema

An Action represents a single operational task (e.g., "Send an Email", "Create Customer") performed in a workflow.

## Action JSON Schema

```json
{
  "actionVersionRowId": "String (UUID / row identifier. If present, indicates a surgical update; if empty, indicates a full create)",
  "service": "String (The name of the target app/service, e.g., 'Slack')",
  "domain": "String (The API domain of the service, e.g., 'slack.com')",
  "name": "String (User-friendly name starting with a verb, e.g., 'Send Message to Channel')",
  "description": "String (Brief outcome-focused description, maximum 30 characters)",
  "type": "GET | POST | PUT | DELETE",
  "category": "String (UPPERCASE category, e.g., 'CREATE', 'UPDATE', 'LIST', 'SEARCH', 'DELETE')",
  "inputFields": "Array (List of input field configurations conforming to dh-Input-fields-json-builder.md)",
  "performCode": "String (Executable JavaScript try-catch code block conforming to perform-code.md)"
}
```

## Action TOON Schema

```toon
actionVersionRowId: String (optional)
service: String
domain: String
name: String
description: String (max 30 chars)
type: enum[4]: GET,POST,PUT,DELETE
category: String (UPPERCASE)
inputFields: Array of FieldObjects
performCode: String (JS try-catch)
```

---

# 2. Trigger Object Schema

A Trigger represents a real-world event (e.g., "New Email Arrives", "New Lead Created") that starts an automation workflow.

## Trigger JSON Schema

```json
{
  "triggerVersionRowId": "String (UUID / row identifier. If present, indicates a surgical update; if empty, indicates a full create)",
  "service": "String (The name of the target app/service, e.g., 'HubSpot')",
  "domain": "String (The API domain of the service, e.g., 'hubspot.com')",
  "name": "String (Event phrase, e.g., 'New Lead Created')",
  "description": "String (Runs when <event>, maximum 30 characters, e.g., 'Runs when new lead is created')",
  "triggerType": "INSTANT | SCHEDULED | MANUAL",
  "inputFields": "Array (List of input field configurations conforming to dh-Input-fields-json-builder.md)",
  "performCode": "String (Executable JavaScript try-catch code block conforming to perform-code.md)",
  "subscribeCode": "String (Optional. Dynamic subscribe code block for webhooks)",
  "unsubscribeCode": "String (Optional. Dynamic unsubscribe code block for webhooks)"
}
```

## Trigger TOON Schema

```toon
triggerVersionRowId: String (optional)
service: String
domain: String
name: String
description: String (max 30 chars, starts with 'Runs when')
triggerType: enum[3]: INSTANT,SCHEDULED,MANUAL
inputFields: Array of FieldObjects
performCode: String (JS try-catch)
subscribeCode: String (optional)
unsubscribeCode: String (optional)
```

---

# 3. Reusable Component Object Schema

Reusable Components are shared utility functions (e.g., `fetchSpreadsheets`) imported into dynamic dropdowns or multiselect fields to fetch options.

## Reusable Component JSON Schema

```json
{
  "id": "String (Unique identifier/UUID used to map the component inside inputFields)",
  "name": "String (Unique function identifier, camelCase, e.g., 'fetchSpreadsheets')",
  "description": "String (Clear description of what the component fetches)",
  "parameters": [
    {
      "name": "String (Parameter key name)",
      "type": "String (Data type, e.g., 'string', 'number', 'boolean')",
      "required": "Boolean",
      "description": "String (Help context for parameter values)"
    }
  ],
  "code": "String (Executable asynchronous JavaScript function returning arrays of options)"
}
```

## Reusable Component TOON Schema

```toon
id: String
name: String (camelCase)
description: String
parameters: Array of ParameterObjects
  - name: String
  - type: String
  - required: Boolean
  - description: String
code: String (async JS try-catch)
```

---

# 4. Schema References & Integrations

- For details on building child fields inside `inputFields`, refer to [dh-Input-fields-json-builder.md](file:///Users/royston/Github/viaSocket/dh-planner-viasocket/knowledge-base/dh-Input-fields-json-builder.md).
- For structure and conventions regarding `performCode`, `subscribeCode`, and `unsubscribeCode`, refer to [perform-code.md](file:///Users/royston/Github/viaSocket/dh-planner-viasocket/knowledge-base/perform-code.md).
- For guidelines on user metadata layout (`name` and `description` formatting), refer to [ux-practice.md](file:///Users/royston/Github/viaSocket/dh-planner-viasocket/knowledge-base/ux-practice.md).
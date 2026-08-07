---
type: page
title: "Database Schema for the Tool Call Model"
description: "Technical specification of database and API objects required for viaSocket plug builder tool calls, including Actions, Triggers, and Reusable Components."
published: true
---

# Page Index

- Database Schema for the Tool Call Model
- Action Object Schema
  - Action JSON Schema
  - Action TOON Schema
- Trigger Object Schema
  - Trigger JSON Schema (Common Fields)
    - Instant Trigger Schema (`triggertype: "hook"`)
      - Instant Trigger JSON Schema
      - Instant Trigger TOON Schema
    - Schedule Trigger Schema (`triggertype: "polling"`)
      - Schedule Trigger JSON Schema
      - Schedule Trigger TOON Schema
    - Manual Trigger Schema (`triggertype: "manual_webhook"`)
      - Manual Trigger JSON Schema
      - Manual Trigger TOON Schema
- Reusable Component Object Schema
  - Reusable Component JSON Schema
    - Reusable Component Create Payload
    - Reusable Component Update Payload
  - Reusable Component TOON Schema
    - Reusable Component Create Payload
    - Reusable Component Update Payload
  - Reusable Component Action Version Mapping Schema
    - Reusable Component Mapping JSON Schema
    - Reusable Component Mapping TOON Schema

# Database Schema for the Tool Call Model

This document outlines the technical specification of the database and API objects required for managing viaSocket actions, triggers, and reusable components through LLM tool calls (such as `create_update_ai_actions`).

# Action Object Schema

An Action represents a single operational task (e.g., "Send an Email", "Create Customer") performed in a workflow.

## Action JSON Schema

```json
{
  "name": "String (User-friendly name of the action, e.g., 'List Notion Databases')",
  "key": "String (Unique machine-readable key, derived from action name separated by underscores: `name.replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')`, e.g., 'List_Notion_Databases')",
  "description": "String (Brief description of the action's purpose)",
  "pluginrecordid": "String (Unique row ID of the plugin/service, e.g., 'rowbvcb80z3y')",
  "isvisible": "String (Boolean as a string, e.g., 'false')",
  "type": "String (Set to 'action')",
  "category": "String (The action category, e.g., 'UPDATE' or 'AI')",
  "sub_category": "String (Optional. The action sub-category, e.g., 'Page')",
  "rtllayer": "Boolean (e.g., true)",
  "isAIActionTrigger": "Boolean (e.g., true)",
  "functionId": "String (Action version row ID; optional on create, required on update, e.g., 'KSniUIbOsr')",
  "isUserOnDh": "Boolean (e.g., true)",
  "inputjson": {
    "steps": "Object (Auto-generated; always pass {})",
    "blocks": "Object (Auto-generated; always pass {})",
    "inputFields": "Array (List of input field configurations conforming to dh-Input-fields-json-builder.md)"
  },
  "perform": "String (Executable JavaScript function block conforming to perform-code.md)",
  "authid": "String (Optional. Authentication identifier associated with the service/action, e.g., 'rowqgp0s6jwh')",
  "metadata": {
    "chatbotthreadid": "String (Optional. Association with chatbot thread, e.g., 'KSniUIbOsr')"
  },
  "sampledata": "Object (Optional. Sample output response JSON object to assist user mapping on the flow side)"
}
```

## Action TOON Schema

```toon
name: String
key: String (Derived from name: name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, ''))
description: String
pluginrecordid: String
isvisible: String ('true' | 'false')
type: String ('action')
category: String
sub_category: String (optional)
rtllayer: Boolean
isAIActionTrigger: Boolean
functionId: String (optional on create, required on update)
isUserOnDh: Boolean
inputjson: InputJsonObject
  - steps: Object (Auto-generated; always pass {})
  - blocks: Object (Auto-generated; always pass {})
  - inputFields: Array of FieldObjects
perform: String (async JS try-catch)
authid: String (optional)
metadata: Object (optional)
  - chatbotthreadid: String
sampledata: Object (optional)
```

---

# Trigger Object Schema

A Trigger represents a real-world event (e.g., "New Email Arrives", "New Lead Created") that starts an automation workflow.

The additional keys for each trigger which is specified are the supported keys and is required. If keys are updated only updated keys are sent.

## Trigger JSON Schema (Common Fields)

```json
{
  "authid": "String (Optional. Authentication identifier, e.g., 'rowqgp0s6jwh')",
  "category": "String (The trigger category, e.g., 'UPDATE' or 'AI')",
  "sub_category": "String (Optional. The trigger sub-category, e.g., 'Page')",
  "description": "String (Description of what triggers the workflow)",
  "ignoreuniversalsampledata": "Boolean (e.g., false)",
  "isvisible": "String ('True' | 'False')",
  "name": "String (User-friendly name of the trigger, e.g., 'New Lead')",
  "key": "String (Unique machine-readable key, derived from trigger name separated by underscores: `name.replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')`, e.g., 'New_Lead')",
  "pluginrecordid": "String (Unique row ID of the plugin/service)",
  "preferred_step_name": "String (e.g., '')",
  "type": "String ('trigger')",
  "triggertype": "String ('manual_webhook' | 'hook' | 'polling')",
  "inputjson": {
    "steps": "Object (Auto-generated; always pass {})",
    "blocks": "Object (Auto-generated; always pass {})",
    "inputFields": "Array (List of input field configurations conforming to dh-Input-fields-json-builder.md)"
  },
  "sampledata": "Object (Optional. Sample output response JSON object to assist user mapping on the flow side)"
}
```

### Instant Trigger Schema (`triggertype: "hook"`)

Instant Triggers run via webhooks where external systems send events immediately.

#### Instant Trigger JSON Schema
```json
{
  "authid": "String (Optional. Authentication identifier, e.g., 'rowqgp0s6jwh')",
  "category": "String (The trigger category, e.g., 'UPDATE' or 'AI')",
  "sub_category": "String (Optional. The trigger sub-category, e.g., 'Page')",
  "description": "String (Description of what triggers the workflow)",
  "ignoreuniversalsampledata": "Boolean (e.g., false)",
  "isvisible": "String ('True' | 'False')",
  "name": "String (User-friendly name of the trigger, e.g., 'New Lead')",
  "key": "String (Unique machine-readable key, derived from trigger name separated by underscores: `name.replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')`, e.g., 'New_Lead')",
  "pluginrecordid": "String (Unique row ID of the plugin/service)",
  "preferred_step_name": "String (e.g., '')",
  "type": "String ('trigger')",
  "triggertype": "String ('hook')",
  "inputjson": {
    "steps": "Object (Auto-generated; always pass {})",
    "blocks": "Object (Auto-generated; always pass {})",
    "inputFields": "Array (List of input field configurations conforming to dh-Input-fields-json-builder.md)"
  },
  "performsubscribe": "String (Subscribe JavaScript code to register webhook with external service)",
  "performunsubscribe": "String (Unsubscribe JavaScript code to unregister/delete webhook from external service)",
  "performlist": "String (JavaScript sample retrieval code block to fetch test/sample events)",
  "modifytriggerdata": "String (Perform Modify Code block to transform webhook data)",
  "transferoption": "String (Transfer option code block)",
  "sampledata": "Object (Optional. Sample output response JSON object to assist user mapping on the flow side)"
}
```

#### Instant Trigger TOON Schema
```toon
authid: String (optional)
category: String
sub_category: String (optional)
description: String
ignoreuniversalsampledata: Boolean
isvisible: String ('True' | 'False')
name: String
key: String (Derived from name: name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, ''))
pluginrecordid: String
preferred_step_name: String
type: String ('trigger')
triggertype: String ('hook')
inputjson: InputJsonObject
  - steps: Object (Auto-generated; always pass {})
  - blocks: Object (Auto-generated; always pass {})
  - inputFields: Array of FieldObjects
performsubscribe: String (subscribe JS)
performunsubscribe: String (unsubscribe JS)
performlist: String (sample JS)
modifytriggerdata: String (modify code JS)
transferoption: String (transfer JS)
sampledata: Object (optional)
```

### Schedule Trigger Schema (`triggertype: "polling"`)

Schedule/Polling Triggers poll the external API periodically at defined intervals.

#### Schedule Trigger JSON Schema
```json
{
  "authid": "String (Optional. Authentication identifier, e.g., 'rowqgp0s6jwh')",
  "category": "String (The trigger category, e.g., 'UPDATE' or 'AI')",
  "sub_category": "String (Optional. The trigger sub-category, e.g., 'Page')",
  "description": "String (Description of what triggers the workflow)",
  "ignoreuniversalsampledata": "Boolean (e.g., false)",
  "isvisible": "String ('True' | 'False')",
  "name": "String (User-friendly name of the trigger, e.g., 'New Lead')",
  "key": "String (Unique machine-readable key, derived from trigger name separated by underscores: `name.replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')`, e.g., 'New_Lead')",
  "pluginrecordid": "String (Unique row ID of the plugin/service)",
  "preferred_step_name": "String (e.g., '')",
  "type": "String ('trigger')",
  "triggertype": "String ('polling')",
  "inputjson": {
    "steps": "Object (Auto-generated; always pass {})",
    "blocks": "Object (Auto-generated; always pass {})",
    "inputFields": "Array (List of input field configurations conforming to dh-Input-fields-json-builder.md)"
  },
  "perform": "String (Perform schedule code block executed on each poll)",
  "performlist": "String (JavaScript sample retrieval code block to fetch test/sample events)",
  "transferoption": "String (Transfer option code block)",
  "scheduleTimeOptions": "Array (Accepted intervals in minutes. [] means all by default; specific arrays like [5, 15, 60, 720, 1440] restrict user options to limit API rate limits)",
  "canpaginate": "Boolean (Set to true to enable the pagination feature if using the pagination path(context?.paginationData) in the perform code)",
  "sampledata": "Object (Optional. Sample output response JSON object to assist user mapping on the flow side)"
}
```

#### Schedule Trigger TOON Schema
```toon
authid: String (optional)
category: String
sub_category: String (optional)
description: String
ignoreuniversalsampledata: Boolean
isvisible: String ('True' | 'False')
name: String
key: String (Derived from name: name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, ''))
pluginrecordid: String
preferred_step_name: String
type: String ('trigger')
triggertype: String ('polling')
inputjson: InputJsonObject
  - steps: Object (Auto-generated; always pass {})
  - blocks: Object (Auto-generated; always pass {})
  - inputFields: Array of FieldObjects
perform: String (poll perform JS)
performlist: String (sample JS)
transferoption: String (transfer JS)
scheduleTimeOptions: Array of integers
canpaginate: Boolean
sampledata: Object (optional)
```

### Manual Trigger Schema (`triggertype: "manual_webhook"`)

Manual Webhook Triggers are user-configured webhooks where the user manually copies the webhook URL into the external service. Note: For Manual Webhook Triggers, authentication is always 'No Auth'; therefore, `authid` must not be sent or configured.

#### Manual Trigger JSON Schema
```json
{
  "authid": "String (Optional. Authentication identifier, e.g., 'rowqgp0s6jwh')",
  "category": "String (The trigger category, e.g., 'UPDATE' or 'AI')",
  "sub_category": "String (Optional. The trigger sub-category, e.g., 'Page')",
  "description": "String (Description of what triggers the workflow)",
  "ignoreuniversalsampledata": "Boolean (e.g., false)",
  "isvisible": "String ('True' | 'False')",
  "name": "String (User-friendly name of the trigger, e.g., 'New Webhook Event')",
  "key": "String (Unique machine-readable key, derived from trigger name separated by underscores: `name.replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')`, e.g., 'New_Webhook_Event')",
  "pluginrecordid": "String (Unique row ID of the plugin/service)",
  "preferred_step_name": "String (e.g., '')",
  "type": "String ('trigger')",
  "triggertype": "String ('manual_webhook')",
  "inputjson": {
    "steps": "Object (Auto-generated; always pass {})",
    "blocks": "Object (Auto-generated; always pass {})",
    "inputFields": "Array (List of input field configurations conforming to dh-Input-fields-json-builder.md)"
  },
  "performlist": "String (JavaScript sample retrieval code block to fetch test/sample events)",
  "modifytriggerdata": "String (Perform Modify Code block to transform webhook data)",
  "sampledata": "Object (Optional. Sample output response JSON object to assist user mapping on the flow side)"
}
```

#### Manual Trigger TOON Schema
```toon
authid: String (optional)
category: String
sub_category: String (optional)
description: String
ignoreuniversalsampledata: Boolean
isvisible: String ('True' | 'False')
name: String
key: String (Derived from name: name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, ''))
pluginrecordid: String
preferred_step_name: String
type: String ('trigger')
triggertype: String ('manual_webhook')
inputjson: InputJsonObject
  - steps: Object (Auto-generated; always pass {})
  - blocks: Object (Auto-generated; always pass {})
  - inputFields: Array of FieldObjects
performlist: String (sample JS)
modifytriggerdata: String (modify code JS)
sampledata: Object (optional)
```

---

# Reusable Component Object Schema

Reusable Components are shared utility functions (e.g., `fetchSpreadsheets`) imported into dynamic dropdowns or multiselect fields to fetch options.

## Reusable Component JSON Schema

### Reusable Component Create Payload
```json
{
  "function_name": "String (Unique function identifier, camelCase, e.g., 'fetchSpreadsheets')",
  "description": "String (Clear description of what the component fetches)",
  "params": [
    {
      "name": "String (Parameter key name)",
      "sample": "String/Number/Object/Boolean/Array (Sample/test value for the parameter along with its data type; if the value is a string, it must be wrapped in double quotes e.g. '\"field ID\"', and for other types like number, object, boolean, or array, the value is direct/unwrapped)"
    }
  ],
  "code": "String (Raw executable JavaScript logic in try-catch parent format. Do NOT wrap in a function block. Parameters are accessible directly as global variables. Inside the catch block, you MUST use 'throw error' or 'throw e'; do not use 'await errorComponent(error)')",
  "pluginrecordid": "String (Unique identifier/row ID of the plugin/service, e.g., 'row2khuqk6fy')",
  "function_code": "String (Complete executable asynchronous JavaScript function block wrapping the name, description, parameters, and code. Any try-catch block inside the component function MUST use 'throw error' or 'throw e' in the catch block; do not use 'await errorComponent(error)')",
  "componentgenerationsource": "userGenerated | aiGenerated",
  "functionId": "String (Action version row ID mapping the component to a specific action version, e.g., 'rowcopcmbfds')"
}
```

### Reusable Component Update Payload
```json
{
  "rowid": "String (Unique identifier/row ID of the reusable component, e.g., 'rowjoyllflj4')",
  "description": "String (Clear description of what the component fetches)",
  "function_code": "String (Complete executable asynchronous JavaScript function block wrapping the name, description, parameters, and code. Any try-catch block inside the component function MUST use 'throw error' or 'throw e' in the catch block; do not use 'await errorComponent(error)')",
  "componentgenerationsource": "userGenerated | aiGenerated",
  "code": "String (Raw executable JavaScript logic in try-catch parent format. Do NOT wrap in a function block. Parameters are accessible directly as global variables. Inside the catch block, you MUST use 'throw error' or 'throw e'; do not use 'await errorComponent(error)')"
}
```

## Reusable Component TOON Schema

### Reusable Component Create Payload
```toon
function_name: String (camelCase)
description: String
params: Array of ParameterObjects
  - name: String
  - sample: String/Number/Object/Boolean/Array (if the value is a string, wrap it with double quotes e.g. '"field ID"'; other types like number, object, boolean, or array are direct/unwrapped)
code: String (raw JS body in try-catch parent format, not wrapped in a function; parameters are global; try-catch must throw error in catch)
pluginrecordid: String (plugin ID)
function_code: String (async JS wrapper function; try-catch must throw error in catch)
componentgenerationsource: String ('userGenerated' | 'aiGenerated')
functionId: String (action version ID)
```

### Reusable Component Update Payload
```toon
rowid: String (component row ID)
description: String
function_code: String (async JS wrapper function; try-catch must throw error in catch)
componentgenerationsource: String ('userGenerated' | 'aiGenerated')
code: String (raw JS body in try-catch parent format, not wrapped in a function; parameters are global; try-catch must throw error in catch)
```

> [!IMPORTANT]
> **Reusable Component Reuse & Update Rules:**
> - **Always search/look for an existing reusable component before creating a new one.**
> - If a suitable reusable component is already present, reuse it.
> - If the found component is missing required parameters: Do not modify its parameters if it is mapped/active elsewhere. Instead, explicitly inform the user that a component is already present, but suggest/propose creating a new reusable component to accommodate the additional parameters without breaking existing mappings.
> - If the existing component's parameters are already satisfied, but the component's code needs to be updated: Update the existing component's code directly using the update tool, and inform the user that the update is happening on the existing reusable component.
> - Do not change the `function_name` or `params` if the reusable component is used (mapped/active) anywhere.
> - If the component is not used anywhere, then the `function_name` and `params` can be updated.
> - If the `params` and `code` both need to be updated (and the component is used), then a new component must be created.
> - If only the `code` needs to be updated (even if the component is used), the existing component's `code` can be updated directly.

## Reusable Component Action Version Mapping Schema

When a reusable component (new or existing) is used within an action or trigger (e.g., in dropdown fields or code blocks like perform, subscribe, unsubscribe, performlist, transfer option code, or modify trigger data), a mapping entry must be created to link the component to the specific action version and path.

> [!WARNING]
> The mapping API acts as a toggle (boolean behavior): calling the API the first time maps the reusable component to the path, and calling it again with the same parameters unmaps (removes the link) the reusable component from the path.

### Reusable Component Mapping Path Rules
The `path` parameter specifies where the reusable component is mapped within the action/trigger version:
- **Dedicated Section Key Path:** For code blocks, `path` MUST be the dedicated section key: `perform`, `performlist`, `transferoption`, `performsubscribe`, `performunsubscribe`, or `modifytriggerdata`.
- **Field Key Path:** When mapping a component in the `optionsGenerator` of a dynamic `dropdown`, `multiselect`, or dynamic input group, `path` MUST be the field key (e.g., `"page_id"`).
- **No Nested Input Group Path:** In case of fields present inside an input group, `path` is STILL strictly the field key itself (e.g., `"page_id"`), NOT a nested input group path (such as `"input_group_key.page_id"`).
- **Conclusion:** The reusable component mapping `path` is ALWAYS either a **dedicated section key path** (`perform`, `performlist`, `transferoption`, `performsubscribe`, `performunsubscribe`, `modifytriggerdata`) OR a **field key** of a dynamic dropdown, multiselect, or dynamic input group.

### Reusable Component Mapping JSON Schema
```json
{
  "action_version_id": "String (Unique row ID of the action version or trigger version, e.g., 'row1m4r25oit')",
  "component_id": "String (Unique row ID/identifier of the reusable component, e.g., 'rowye083t43i')",
  "pluginrecordid": "String (Unique row ID of the plugin/service, e.g., 'rowbxw4uz2gq')",
  "action_id": "String (Unique row ID of the action or trigger, e.g., 'row2oafcm02w')",
  "path": "String (Dedicated section key path 'perform' | 'performlist' | 'transferoption' | 'performsubscribe' | 'performunsubscribe' | 'modifytriggerdata', or field key e.g. 'page_id')"
}
```

### Reusable Component Mapping TOON Schema
```toon
action_version_id: String (action version ID)
component_id: String (reusable component ID)
pluginrecordid: String (plugin ID)
action_id: String (action/trigger ID)
path: String ('perform' | 'performlist' | 'transferoption' | 'performsubscribe' | 'performunsubscribe' | 'modifytriggerdata' | field key)
```

---
---
type: page
title: "UX Practices Knowledge Base"
description: "This document contains structured UX guidelines and best practices for creating viaSocket plug triggers and actions. It defines the standard UX patterns, common input field types, field ordering conventions, and perform code references for each trigger type (Instant, Scheduled, Manual) and action category (GET, LIST, FIND/SEARCH, CREATE, UPDATE, FIND OR CREATE, DELETE)."
published: true
---
# UX Practices Knowledge Base Page Index

- UX Practices Knowledge Base
- Triggers
  - Instant Trigger
    - Instant Trigger Purpose:
    - Instant Trigger UX Pattern:
    - Instant Trigger Common Input Fields:
    - Instant Trigger Perform Code Reference:
    - Instant Trigger Best Practices:
  - Scheduled Trigger
    - Scheduled Trigger Purpose:
    - Scheduled Trigger UX Pattern:
    - Scheduled Trigger Common Input Fields:
    - Scheduled Trigger Perform Code Reference:
    - Scheduled Trigger Best Practices:
  - Manual Trigger
    - Manual Trigger Purpose:
    - Manual Trigger UX Pattern:
    - Manual Trigger Common Input Fields:
    - Manual Trigger Perform Code Reference:
    - Manual Trigger Best Practices:
- Actions
  - GET
    - GET Purpose:
    - GET UX Pattern:
    - GET Common Input Fields:
    - GET Perform Code Reference:
    - GET Best Practices:
  - LIST
    - LIST Purpose:
    - LIST UX Pattern:
    - LIST Common Input Fields:
    - LIST Perform Code Reference:
    - LIST Best Practices:
  - FIND/SEARCH
    - FIND/SEARCH Purpose:
    - FIND/SEARCH UX Pattern:
    - FIND/SEARCH Common Input Fields:
    - FIND/SEARCH Perform Code Reference:
    - FIND/SEARCH Best Practices:
  - CREATE
    - CREATE Purpose:
    - CREATE UX Pattern:
    - CREATE Common Input Fields:
    - CREATE Perform Code Reference:
    - CREATE Best Practices:
  - UPDATE
    - UPDATE Purpose:
    - UPDATE UX Pattern:
    - UPDATE Common Input Fields:
    - UPDATE Perform Code Reference:
    - UPDATE Best Practices:
  - FIND OR CREATE
    - FIND OR CREATE Purpose:
    - FIND OR CREATE UX Pattern:
    - FIND OR CREATE Common Input Fields:
    - FIND OR CREATE Perform Code Reference:
    - FIND OR CREATE Best Practices:
  - DELETE
    - DELETE Purpose:
    - DELETE UX Pattern:
    - DELETE Common Input Fields:
    - DELETE Perform Code Reference:
    - DELETE Best Practices:

# UX Practices Knowledge Base

This document contains structured UX guidelines and best practices for creating viaSocket plug triggers and actions. It defines the standard UX patterns, common input field types, field ordering conventions, and perform code references for each trigger type and action category.

**Knowledge Base References:**
- **Input Fields:** [DH Input Fields Knowledge Base](dh-Input-fields-json-builder.md)
- **Perform Code:** [Perform Code Knowledge Base](perform-code.md)

# Triggers

Triggers initiate a workflow. There are three trigger types, each with distinct UX patterns and input field requirements.

## Instant Trigger

### Instant Trigger Purpose:
An Instant Trigger fires in real-time when an event occurs in the external service. It uses webhooks that will be provided by viaSocket when the user subscribes to the trigger. the external service sends data directly to viaSocket the moment something happens (e.g., new form submission, new lead, new message). No polling or interval checks needed.

**When to use:**
- When the external service supports webhooks.
- When real-time, immediate data processing is required.
- Example: New Facebook Lead, New Shopify Order, New form submission on WordPress.

### Instant Trigger UX Pattern:
The standard field ordering for an Instant Trigger follows this flow:

1. **Dynamic Dropdown** → Resource selection (e.g., select Facebook Page, select form, select channel). This narrows the scope of incoming webhooks.
2. **whereClause Input Group** *(optional)* → Sentence-based configuration for filtering incoming events (e.g., "When commented on `[specific media]` Media `[choose media]`").
3. **Dynamic Help** *(optional)* → Permission checks, eligibility validation, or contextual warnings displayed based on user selections.
4. **Conditional Fields** → Additional fields shown/hidden via `visibilityCondition` based on prior selections.

### Instant Trigger Common Input Fields:
- **Dropdown Dynamic** — Used for selecting the resource to listen to (e.g., Page, Form, Channel). Typically uses `canPaginate: true` and `enableSearchApi: true` for large lists.
- **Input Group Static (whereClause)** — Used for sentence-based event configuration. Only contains `dropdown` and `multiselect` fields when `whereClause: true`.
- **Help Dynamic** — Used for real-time permission checks or validation (e.g., checking if the user has admin access to a Facebook page).
- **Boolean** — Used for toggling event subtypes or configuration modes.

### Instant Trigger Perform Code Reference:
- **Subscribe Code** (Required) - Used to register the webhook with the external service to receive events in real-time. This code tells the external service where to send the webhook data (to the viaSocket endpoint).
- **Sample Code** (Required) - Used to fetch test data for the trigger configuration UI.
- **Perform Code (Modify response)** (Optional) - Instant Triggers typically do **not** require perform code since the webhook handles data delivery. This is only used to modify the response data from the webhook if needed.
- **Unsubscribe Code** (Required) - Used to unregister the webhook with the external service.
- **Transfer Code** (Optional) - Enables bulk transfer of historical data by listing all previous trigger items and sending them to the flow. Users can pull all data from the beginning for triggers like "New Item".
- See [Perform Code Knowledge Base → Instant Trigger](perform-code.md) for sample code patterns.


**Cases the code will execute**
1. **Subscribe Code** 
- When flow publishes
- When flow status changes to active
- When the flow trigger config changed (will have new trigger configurations)

2. **Unsubscribe Code** 
- When the flow is trashed. 
- When flow status changes to inactive
- When flow trigger config changed (will have old trigger configurations)

3. **Sample code**
- When the user clicks on the `Test` button on the UI.

4. **Perform (Modify response)**
- When the user clicks on the `Test` button on the UI and the sample code returns a response. The response is sent to the Perform code as payload. This is useful for modifying the response data from the webhook if needed.
- When actual flow runs, the sample code is not executed. The webhook data is sent directly to the Perform code. But the sample code should be representative of the actual flow response.

5. **Transfer Code**
- When the user clicks on the `Transfer` button on the UI.
- The user can choose selected items or all items to transfer.
- The items are then sent to the flow in batches. (e.g. the number of items in the list is 500 and if the user clicks on "Transfer all items", 200 items will be sent in first batch, 200 items in the second batch and 100 items in the third batch). This process is called as the bulk transfer of the old historical data.
- The limit for the number of items that can be sent in each batch is 200.

### Instant Trigger Best Practices:

- **Dynamic Help for validation** — Use a dynamic help field after resource selection to check permissions or display relevant warnings.
- **Clean labels** — Use "Select Page" not "Select Facebook Page". Keep labels generic.
- **whereClause for conversational UX** — When the trigger has multiple filter dropdowns (e.g., "when commented on [specific media]"), use `whereClause: true` to create readable sentence layouts.

---

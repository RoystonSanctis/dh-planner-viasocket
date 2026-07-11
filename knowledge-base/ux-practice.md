---
type: page
title: "UX Practices Knowledge Base"
description: "This document contains structured UX guidelines and best practices for creating viaSocket plug triggers and actions. It defines the standard UX patterns, common input field types, field ordering conventions, and perform code references for each trigger type (Instant, Scheduled, Manual) and action category (GET, LIST, FIND/SEARCH, CREATE, UPDATE, FIND OR CREATE, DELETE)."
published: true
---
# UX Practices Knowledge Base Page Index

- UX Practices Knowledge Base
- Triggers
  - Trigger Selection & Priority Guidelines
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
- Title & Description Naming Guidelines
  - Action Naming & Description
  - Trigger Naming & Description
  - General Copywriting Guidelines
- Automation UX Builder & Architecture Instructions
  - Role & Core Design Philosophy
    - Core Design Philosophy
    - Decision Evaluation Dimensions
    - Product & Use-Case Awareness
    - Action Selection Principle
  - Pre-Design Analysis (Mandatory)
    - Technical Reasoning Principles
  - Action Design Strategy
    - The Unified Action Principle
    - Identifier & Record Resolution
    - Search Mode Evaluation
  - Field Design & Dynamic UI Rules
    - General Principles
    - Dropdown Design Rules
    - Dynamic Schema Handling
    - Workflow Simplicity Principles
    - Structural Constraint Handling
  - Automation Safety & Overwrite Protection
    - Idempotency Preservation
    - Update Safety & Overwrite Protection
    - Response Handling
    - Backward Compatibility Rules
  - Required Output Structure
  - Behavior Constraints
    - Trade-Off Evaluation Protocol
    - Final Decision Reflection

# UX Practices Knowledge Base

This document contains structured UX guidelines and best practices for creating viaSocket plug triggers and actions. It defines the standard UX patterns, common input field types, field ordering conventions, and perform code references for each trigger type and action category.

**Knowledge Base References:**
- **Input Fields:** [DH Input Fields Knowledge Base](dh-Input-fields-json-builder.md)
- **Perform Code:** [Perform Code Knowledge Base](perform-code.md)

# Triggers

Triggers initiate a workflow. There are three trigger types, each with distinct UX patterns and input field requirements.

## Trigger Selection & Priority Guidelines

When designing or planning triggers, follow this structured priority flow to determine the trigger type to implement, especially when the user has not specified their preferred type.

**1. Trigger Type Priority Flow**
If the trigger type is not specified, evaluate capabilities in this order:
**Instant Trigger (`hook`)** → **Scheduled Trigger (`polling`)** → **Manual Trigger (`manual_webhook`)**

*   **Step 1: Check for Instant Trigger (`hook`)**
    *   Verify if the external service provides subscribe and unsubscribe API endpoints to programmatically manage webhooks. If yes, implement an **Instant Trigger**.
*   **Step 2: Check for Scheduled/Polling Trigger (`polling`)**
    *   If programmatic webhooks are not supported, check if there is a GET or LIST API to retrieve/poll the data.
    *   Verify that the API response includes a created or updated timestamp, OR the endpoint supports a time filter configuration parameter. If yes, implement a **Scheduled Trigger**.
*   **Step 3: Check for Manual Trigger (`manual_webhook`)**
    *   If polling is not possible, check if the service supports manually adding a webhook URL in their platform dashboard/UI. If yes, implement a **Manual Trigger**.
*   **Step 4: Ask the User**
    *   If none of the above options are possible, ask the user for the trigger type and request the API documentation or cURL command.
    *   *Note:* At the beginning of the design phase, you can also directly ask the user which trigger type they want to build (Instant, Scheduled, or Manual).

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
- **Transfer Code** (Optional) - Enables bulk transfer of historical data by listing all previous trigger items and sending them to the flow. Applicable for the "New Event" trigger only (not for "Update Event" triggers). Users can pull all data from the beginning for triggers like "New Item".
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
- **whereClause for conversational UX** — When the trigger has multiple filter dropdowns (e.g., "when commented on [specific media]"), use `whereClause: true` to create readable sentence layouts. In such cases, all labels inside the input group must use **sentence case** (instead of standard Title Case), where only the first field's label starts with a capital letter (e.g. `'When commented on'`), and all subsequent fields' labels start with lowercase (e.g. `'posted after date'`) unless they are proper nouns (e.g. `'Media'`).

---

## Scheduled Trigger

### Scheduled Trigger Purpose:
A Scheduled Trigger runs at regular time intervals by repeatedly checking the external service for new or updated data. If something new is found, the workflow runs. It acts as a polling mechanism.

**When to use:**
- When the external service does NOT support webhooks.
- When data needs to be checked manually at intervals.
- Example: New row in Google Sheet (every 5 min), New lead in CRM (every 10 min), Updated database item in Notion.

### Scheduled Trigger UX Pattern:
The standard field ordering for a Scheduled Trigger follows this flow:

1. **Dynamic Dropdown** → Primary resource selection (e.g., select Data Source, select Spreadsheet). Uses `canPaginate` and `enableSearchApi` for large lists.
2. **Dynamic Dropdown** → Secondary/dependent resource selection (e.g., select Sheet within Spreadsheet). Uses `visibilityCondition` to depend on the first dropdown.
3. **Boolean** *(optional)* → Configuration toggles (e.g., "Does your first row contain column name?"). *Note: Do not include an "Enable Pagination" toggle, as pagination is handled automatically via the trigger configuration.*
4. **Multiselect Dynamic** *(optional)* → Field filtering (e.g., select which columns/properties to return in the output).
5. **Input Group Static** *(optional)* → Grouped filter settings (e.g., Filter Properties, Search Query). *Note: Do not include page limit, start cursor, or offset fields.*
6. **AI Field** *(optional)* → Advanced filter conditions using AI-generated queries.

### Scheduled Trigger Common Input Fields:
- **Dropdown Dynamic** — Used for selecting the resource to poll (e.g., Data Source, Spreadsheet, Sheet). Cascading dropdowns are common (Spreadsheet → Sheet).
- **Boolean** — Used for configuration toggles that change behavior (e.g., column naming mode). *Do not include pagination toggles.*
- **Multiselect Dynamic** — Used for selecting which fields/properties to include in the output. Reusable Components are recommended for the `optionsGenerator`.
- **Input Group Static** — Used for grouping related filtering or sorting settings. *Do not include pagination fields like page limit or next page token.*
- **AI Field** — Used for advanced filter conditions where the user can describe the filter in natural language and AI generates the structured query.
- **Help Dynamic** *(optional)* — Used for contextual information based on user selections.

### Scheduled Trigger Perform Code Reference:
- Scheduled Triggers require **Perform Code** for polling, filtering, sorting, and pagination.
  - **Output Limit**: The perform code must return an array of items. There is a hard limit of 1000 items in the backend; the perform code must add appropriate limits to ensure the returned array does not exceed 1000 items (or the service's supported limit, whichever is smaller).
- They also require **Sample Code** for fetching test data or generating fallback schema.
- They also require **Transfer Code** (Optional) for historical bulk data transfers (applicable for the "New Event" trigger only, not for "Update Event" triggers).
  - **Transfer Output Limit**: The `data` key in the returned transfer object must contain a maximum of 200 items per batch.
- See [Perform Code Knowledge Base → Scheduled Trigger](perform-code.md) for detailed rules, pseudo code, and examples.

### Scheduled Trigger Best Practices:
- **No pagination input fields**: Never ask the user for pagination fields (such as limit, page size, start cursor, next page token). These should be defined internally within the perform code, and the `canpaginate: true` feature should be enabled in the trigger database schema.
- **No scheduledTime in UI**: Do not suggest or include `scheduledTime` as an input field in the UI. `scheduledTime` is a global variable available in code under `context?.inputData?.scheduledTime`.
- **Cascade dropdowns** — Use `visibilityCondition` to show dependent dropdowns only after the parent is selected (e.g., Sheet depends on Spreadsheet).
- **Use Reusable Components** — For `optionsGenerator` code in dynamic dropdowns and multiselects. This keeps code secure, DRY, and maintainable.
- **Group related settings** — Use `Input Group Static` to bundle filter and sorting settings together (avoiding pagination settings).
- **Default values matter** — Provide sensible defaults for filter types (e.g., `defaultValue: Basic`).
- **AI Field for complex filters** — When a service supports complex query syntax (like Notion's filter API), use an AI Field with a `suggestionGenerator` that fetches the schema.
- **Clean labels** — Use "Select Data Source" not "Select Notion Data Source".
- **Multi-item Pagination**: If pagination is enabled and the input accepts multiple items (either as a `multiselect` field, or via `list: true` in `string` or `number` fields, e.g. selecting multiple Form IDs), and each item has separate pagination, track active items and cursors explicitly as an object in `context.paginationData` to prevent pagination bleed across items.

---

## Manual Trigger

### Manual Trigger Purpose:
A Manual Trigger (in viaSocket, this corresponds to `manual_webhook`) is used when the external service supports webhooks but does not have a programmatic subscribe/unsubscribe API. The user must manually copy the viaSocket webhook URL and paste it into the external service's platform dashboard.

**When to use:**
- When the external service supports webhooks but lacks subscribe/unsubscribe APIs.
- When scheduled polling is not possible or not preferred.
- Example: WordPress form webhook submissions.

### Manual Trigger UX Pattern:
The `inputFields` array for a Manual Trigger must only contain a single field: a static `help` field. No other fields (strings, dropdowns, etc.) are allowed.

### Manual Trigger Common Input Fields:
*   **Single Field Limit:** The `inputFields` array (inputjson) for a Manual Trigger (`manual_webhook`) must only contain **one field**: a static `help` field. No other fields are allowed.
*   **Help Content:** The `help` field must contain step-by-step instructions in HTML format showing the user how to configure the webhook in the external SaaS platform.
*   **Example Manual Trigger JSON:**
    ```json
    [
      {
        "key": "help",
        "help": "<ul style=\"list-style-type: disc; padding-left: 20px;\">    <li>Sign in to <strong>WordPress account</strong>.</li>    <li>Locate and edit the form that you wish to integrate.</li>    <li>Within the form settings, navigate to the <strong>\"Actions after submit\"</strong> section.</li>    <li>Add a new action by selecting <strong>\"Webhook\"</strong>.</li>    <li>Enable the Webhook functionality by toggling it on.</li>    <li>Enter the previously copied <strong>webhook URL</strong> into the designated field.</li>    <li>Save the changes made to the page.</li>    <li>Access the live version of the page.</li>    <li>Fill out and submit the form.</li>    <li>This submission will trigger the sending of the webhook to <strong>viaSocket</strong>.</li> </ul>",
        "type": "help"
      }
    ]
    ```

### Manual Trigger Perform Code Reference:
- Manual Triggers use a direct API call pattern without scheduling or pagination logic.
- See [Perform Code Knowledge Base → Manual Trigger](perform-code.md) for code patterns.

### Manual Trigger Best Practices:
- **Always use a single Help block** as the only input field to guide the user through webhook setup with HTML formatting.

---

# Actions

Actions perform operations on external services. They are organized by category based on the type of CRUD operation they represent. Each category has standard UX patterns and input field conventions.

## GET

### GET Purpose:
A GET action retrieves a **single specific record** by its unique identifier (ID). It returns the full details of one item.

**Examples:** Get Page by ID, Get User by ID, Get Order Details, Get Spreadsheet by ID.

### GET UX Pattern:
1. **Dynamic Dropdown** → Primary resource/parent selection (e.g., select Data Source, select Spreadsheet). Uses `canPaginate` and `enableSearchApi`.
2. **Dynamic Dropdown / String** → Record ID selection. Either a searchable dropdown that lists records, or a plain string field where the user enters the ID directly.
3. **Multiselect Dynamic** *(optional)* → Select which fields/properties to include in the response.
4. **Input Group Static** *(optional)* → Additional options (e.g., output format, include metadata).

### GET Common Input Fields:
- **Dropdown Dynamic** — For selecting the parent resource and/or the specific record to retrieve. `customHelp` should explain where the user can find the ID manually.
- **String** — For directly entering a record ID when a dropdown isn't practical.
- **Multiselect Dynamic** *(optional)* — For filtering which properties/fields to return.
- **Boolean** *(optional)* — For toggling response options (e.g., include archived, include metadata).

### GET Perform Code Reference:
- GET actions use a simple `GET` HTTP request with the record ID in the URL path or query params.
- See [Perform Code Knowledge Base → Actions → GET](perform-code.md) for code patterns.

### GET Best Practices:
- **Provide manual input guidance** — Always include `customHelp`, `customInputLabel`, and `customPlaceholder` so users can manually map record IDs from previous workflow steps.
- **Single record return** — GET actions return one record. If multiple records are needed, use LIST instead.
- **Error handling** — The perform code should handle 404 (record not found) gracefully.

---

## LIST

### LIST Purpose:
A LIST action retrieves **multiple records** from a resource, typically with pagination, filtering, and field selection support. It returns an array of items.

**Examples:** List Data Source Items, List Spreadsheets, List Channels, List Orders, List Users.

### LIST UX Pattern:
1. **Dynamic Dropdown** → Primary resource/parent selection (e.g., select Data Source).
2. **Dropdown Static (Mode)** → Choose the retrieval mode:
   - **List All**: Retrieve all records (with pagination options).
   - **Search by... (identifier)**: Search by specific attributes (e.g. Email, Phone, Name).
   - **Search by ID**: Retrieve a specific record by its unique ID.
   - **Advance Search**: Provided only when the service supports multiple and advanced query filtering.
3. **Conditional Fields based on Mode Selection**:
   - **If Mode is "List All"**:
     - **Boolean** → "Enable Pagination" toggle.
     - **Input Group Static** (Conditional: visible when "Enable Pagination" is true) → Contains Page Limit (`limit`) and Start Cursor/Offset (`offset`) fields.
     - Note: If pagination is disabled ("Fetch All"), the perform code handles client-side internal pagination (auto-looping all pages) to return all records.
   - **If Mode is "Search by... (identifier)"**:
     - **String** → Identifier input field (e.g., Search Email, Search Phone, Search Name).
     - **Pagination Special Case**: If the search identifier is unique (i.e. no multiple entries are possible or the service enforces uniqueness), pagination options are not required. If the search identifier is NOT unique and can return multiple entries, then the pagination options ("Enable Pagination" toggle and Page Limit/Offset fields) must be provided in the UI.
   - **If Mode is "Search by ID"**:
     - **String/Dropdown** → Specific Record ID input field.
     - Note: Pagination options (such as 'Enable Pagination', limit, offset) are not available in 'Search by ID' mode, as it is a direct GET request.
   - **If Mode is "Advance Search"**:
     - **AI Field** *(optional)* → Advanced filter conditions.
4. **Multiselect Dynamic** *(optional)* → Choose which fields/properties to return in the response. If not selected, default all keys/fields are returned.

### LIST Common Input Fields:
- **Dropdown Dynamic** — For selecting the parent resource to list items from.
- **Dropdown Static (Mode)** — For choosing between "List All", "Search by... (identifier)", "Search by ID", or "Advance Search".
- **Boolean** — "Enable Pagination" toggle (shown under Mode: "List All", or under Mode: "Search by... (identifier)" when the search identifier is not unique).
- **Input Group Static** — For grouping pagination settings (page limit, cursor/offset), only shown when Enable Pagination is true.
- **String / Number** — For identifier search values, ID input, or pagination settings.
- **AI Field** — For advanced filter conditions (only shown under Mode: "Advance Search").
- **Multiselect Dynamic** — Optional field chooser to select which fields/properties to return in the response.

### LIST Perform Code Reference:
- Code must fork dynamically based on the selected `mode`:
  - **List All**: If "Enable Pagination" is true, execute a single paginated API request with `limit` and `offset`. If false, implement a client-side loop (internal pagination) using a `while` loop or recursion to fetch all records and return the consolidated list.
  - **Search by... (identifier)**: Execute the search API using the provided identifier. If pagination is enabled (for non-unique search fields), handle pagination parameters accordingly.
  - **Search by ID**: Call the get-by-ID API endpoint using the provided record ID.
  - **Advance Search**: Execute search API with AI-constructed query conditions.
- If the optional field-selection multiselect is populated, filter the returned response payload to only include selected keys/fields. Otherwise, return all keys.
- See [Perform Code Knowledge Base → Actions → LIST](perform-code.md) for code patterns.

### LIST Best Practices:
- **Combine operations** — Always combine listing ("List All"), searching (by specific identifiers), "Search by ID", and "Advance Search" (if supported) into a single LIST action using a Mode selector.
- **Conditional pagination** — Offer pagination settings (limit, offset) only when Mode is 'List All' or when Mode is a non-unique search identifier, and "Enable Pagination" is enabled. Do not show pagination options for 'Search by ID' mode.
- **Client-side pagination** — If Mode is 'List All' (or a non-unique search identifier) and "Enable Pagination" is disabled, the perform code must automatically iterate through all pages (internal pagination) to return all records.
- **Optional field selection** — Provide an optional multiselect field chooser to specify which fields to return. If left empty, default to returning all fields/keys.
- **Clear conditional visibility** — Use `visibilityCondition` to display mode-specific inputs (e.g., showing ID input only for "Search by ID", or AI Field only for "Advance Search").

---

## FIND/SEARCH

### FIND/SEARCH Purpose:
A FIND/SEARCH action searches for records matching specific criteria. It may return one or multiple matching records. Unlike GET (which uses a known ID), FIND/SEARCH uses query parameters, filters, or search terms.

**Examples:** Find Row in Google Sheet, Search Data Source Items, Find Contact by Email, Search Products.

### FIND/SEARCH UX Pattern:
1. **Dynamic Dropdown** → Primary resource/parent selection (e.g., select Spreadsheet, select Data Source).
2. **Dynamic Dropdown** → Secondary resource selection (e.g., select Sheet). Uses `visibilityCondition`.
3. **Boolean** → Search mode selector (e.g., "Basic" vs "Advanced" filter type).
4. **Input Group Static (Search Filter)** → Grouped search criteria fields:
   - **Boolean** → Configuration toggles (e.g., column naming mode).
   - **Dynamic Dropdown** → Column/field selector for lookup (visible in Basic mode).
   - **String** → Lookup value (visible in Basic mode).
   - **AI Field** → Advanced filter prompt with `suggestionGenerator` (visible in Advanced mode).
   - **Help Static** → Contextual info about the search mode.
5. **Input Group Static (Sorting & Limit)** *(optional)* → Sort order, row count, return columns.
6. **Multiselect Dynamic** *(optional)* → Select which columns/properties to return.

### FIND/SEARCH Common Input Fields:
- **Dropdown Dynamic** — For selecting the resource to search within.
- **Boolean** — For toggling between Basic (exact match) and Advanced (query-based) search modes.
- **Input Group Static** — For grouping search filter fields together. May use `visibilityCondition` on the entire group.
- **String** — For entering search/lookup values.
- **Dropdown Dynamic** — For selecting the column/field to search in.
- **AI Field** — For advanced filter conditions using natural language prompts with schema-based `suggestionGenerator`.
- **Multiselect Dynamic** — For selecting return columns/properties.
- **Number** — For result limit/row count.
- **Help Static** — For explaining search behavior (e.g., "case sensitive exact match").

### FIND/SEARCH Perform Code Reference:
- FIND/SEARCH actions use `GET` or `POST` requests with search parameters.
- May require client-side filtering if the API doesn't support native search.
- See [Perform Code Knowledge Base → Actions → FIND/SEARCH](perform-code.md) for code patterns.

### FIND/SEARCH Best Practices:
- **Offer dual search modes** — Use a Boolean field to toggle between "Basic" (single column exact match) and "Advanced" (AI-powered multi-column query).
- **Group search criteria** — Use `Input Group Static` to bundle all search-related fields.
- **Visibility conditions for modes** — Show Basic fields when filter type is `true`, Advanced fields when `false`.
- **AI Field for complex queries** — When the search logic is complex, use an AI Field with a `suggestionGenerator` that fetches the schema (column names, types) from the API.
- **Help blocks for context** — Add Help Static fields to explain search behavior (e.g., "The result rows returned will be the exact match (case sensitive) of the Lookup Value").
- **Return column selection** — Always offer a Multiselect for choosing which columns to return.

---

## CREATE

### CREATE Purpose:
A CREATE action creates a **new record** in the external service. The user provides the required data through input fields, which are mapped to the API payload.

**Examples:** Create Data Source Item, Create Row in Google Sheet, Create Contact, Create Order, Create Page.

### CREATE UX Pattern:
1. **Dynamic Dropdown** → Primary resource/parent selection (e.g., select Data Source, select Spreadsheet).
2. **Dynamic Dropdown** → Secondary resource selection (e.g., select Sheet). Uses `visibilityCondition`.
3. **Boolean** *(optional)* → Configuration toggles (e.g., column naming mode).
4. **Multiselect Dynamic** *(optional)* → Select which fields/columns to fill (acts as a field chooser before the dynamic input group).
5. **Dynamic Input Group** → Schema-based fields generated dynamically from the API (e.g., Notion properties, Google Sheet columns). Uses `fieldsGenerator` to build fields based on the selected resource's schema.
6. **AI Field** *(optional)* → For complex content blocks or structured data generation.
7. **Dictionary** *(optional)* → For custom key-value pairs when the schema is unknown.

### CREATE Common Input Fields:
- **Dropdown Dynamic** — For selecting the parent resource where the new record will be created.
- **Boolean** — For configuration toggles that affect field generation.
- **Multiselect Dynamic** — For selecting which fields/columns to populate (field chooser).
- **Input Group Dynamic** — The core of CREATE actions. Uses `fieldsGenerator` to dynamically generate input fields based on the selected resource's schema (e.g., Notion database properties → string, dropdown, multiselect, number, checkbox fields).
- **String / Number / HTML / Markdown** — For direct content fields when the schema is known.
- **AI Field** — For complex content generation (e.g., Notion content blocks).
- **Dictionary** — For custom key-value pairs when the field structure is variable.

### CREATE Perform Code Reference:
- CREATE actions use `POST` requests with the payload mapped from `context.inputData.<key>`.
- See [Perform Code Knowledge Base → Actions → CREATE](perform-code.md) for code patterns.

### CREATE Best Practices:
- **Dynamic Input Groups for schema-driven fields** — Use `fieldsGenerator` to query the API schema and dynamically generate typed fields (string, number, dropdown, multiselect, boolean) based on the resource structure.
- **Key normalization** — When generating keys from external data (e.g., column names), always normalize by replacing dots (`.`) with underscores (`_`).
- **Field chooser pattern** — Use a Multiselect Dynamic before the Dynamic Input Group so users can select which fields to fill, keeping the form clean.
- **Cascade dependencies** — Dynamic Input Groups should depend on prior dropdown selections via `visibilityCondition`.
- **Error/empty fallback** — The `fieldsGenerator` should return `{ message: "Please select a resource first." }` when dependencies are missing.

---

## UPDATE

### UPDATE Purpose:
An UPDATE action modifies an **existing record** in the external service. The user selects the record to update and provides the new values for specific fields.

**Examples:** Update Data Source Item, Update Row in Google Sheet, Update Contact, Update Product.

### UPDATE UX Pattern:
1. **Dynamic Dropdown** → Primary resource/parent selection (e.g., select Data Source, select Spreadsheet).
2. **Dynamic Dropdown** → Secondary resource selection (e.g., select Sheet). Uses `visibilityCondition`.
3. **Dynamic Dropdown / String** → Record ID selection (e.g., select the specific row, page, or record to update).
4. **Multiselect Dynamic** *(optional)* → Select which fields/columns to update (field chooser).
5. **Dynamic Input Group** → Schema-based fields for the selected record. Only shows fields the user chose to update. Uses `fieldsGenerator`.

### UPDATE Common Input Fields:
- **Dropdown Dynamic** — For selecting the resource and the specific record to update.
- **String** — For directly entering a record ID.
- **Multiselect Dynamic** — For selecting which fields/columns to update (acts as field chooser).
- **Input Group Dynamic** — Uses `fieldsGenerator` to generate fields based on the resource schema, filtered by the user's field selection.
- **String / Number / HTML / Markdown** — For direct value fields when the schema is known.

### UPDATE Perform Code Reference:
- UPDATE actions use `PUT`, `PATCH`, or `POST` requests with the record ID and partial payload.
- See [Perform Code Knowledge Base → Actions → UPDATE](perform-code.md) for code patterns.

### UPDATE Best Practices:
- **Partial updates** — Only send fields the user has filled. Don't send empty fields as `null` unless explicitly intended.
- **Field chooser before dynamic group** — Use a Multiselect to let users select which fields they want to update, then pass that selection to the `fieldsGenerator` to render only those fields.
- **Record selection & parent dropdown bypass** — This applies strictly to UPDATE Actions (DELETE actions must always use a direct text ID field of type 'string' with no dropdown logic). For the rest of the triggers and actions, it is not applicable (dropdowns always have higher priority than string ID fields). Prioritize dropdowns over text ID fields if an options API is available. For UPDATE actions: if the ID field supports a dropdown and no parent dropdown is required to fetch the options, the dropdown should be created. However, if fetching the record ID requires adding dependent parent dropdowns, bypass the parent dropdowns and use a simple text ID field instead (unless the parent dropdown is already required/selected, or the ID dropdown has static options). Provide a dynamic dropdown for selecting the record when possible, with `customHelp` explaining how to find the record ID manually.
- **Preserve existing values** — Help text should clarify that unfilled fields will remain unchanged.

---

## FIND OR CREATE

### FIND OR CREATE Purpose:
 A FIND OR CREATE action first searches for a record matching specific criteria. If a match is found, it returns the existing record. If no match is found, it creates a new record with the provided data.

**Examples:** Find or Create Contact, Find or Create Row in Google Sheet, Find or Create Data Source Item.

### FIND OR CREATE UX Pattern:
1. **Dynamic Dropdown** → Primary resource/parent selection.
2. **Dynamic Dropdown** → Secondary resource selection. Uses `visibilityCondition`.
3. **Input Group Static (Search Section)** → Search criteria fields:
   - If the service supports complex search queries, use an **AI Field** to construct the search logic.
   - If the service supports simple filters, use a **Dynamic Dropdown** (for the search/lookup field the user selects) and a **String** field (for the lookup value).
4. **Boolean** → "Create if not found?" toggle. `defaultValue: { label: "Yes", value: true }`.
5. **Dynamic Input Group** *(conditional)* → Schema-based fields for creating a new record. Visible only when the "Create if not found" toggle is `true` (Yes). Uses `visibilityCondition: "context?.inputData?.create_if_not_found"`.
6. **Multiselect Dynamic** *(optional)* → Select columns/fields for the create operation.

### FIND OR CREATE Common Input Fields:
- **Dropdown Dynamic** — For resource selection, and (if simple filter is supported) for selecting the lookup field.
- **Input Group Static** — For grouping search criteria.
- **AI Field** — For complex search queries (when supported).
- **String** — For the lookup value (if simple filter is supported).
- **Boolean** — For the "Create if not found?" toggle.
- **Input Group Dynamic** — For dynamically generated create fields, conditionally visible.
- **Multiselect Dynamic** — For selecting which fields to populate during creation.

### FIND OR CREATE Perform Code Reference:
- FIND OR CREATE actions combine a search request followed by a conditional create request.
- See [Perform Code Knowledge Base → Actions → FIND OR CREATE](perform-code.md) for code patterns.

### FIND OR CREATE Best Practices:
- **Clear separation** — Visually separate the "Find" section and the "Create" section using Input Groups.
- **Search field selection based on service capabilities** — Evaluate the external API's search capabilities: if it supports complex query structures, implement an AI Field; if it only supports basic filters, implement a dropdown to choose the search field and a string input for the lookup value.
- **Conditional create fields** — Use `visibilityCondition` on the create section (Dynamic Input Group) so it only appears when the user selects "Yes" for "Create if not found?".
- **Default to create** — Set the Boolean toggle's default to `true` (Yes) so the action creates by default.
- **Reuse search patterns** — The search section follows the same patterns as FIND/SEARCH.
- **Reuse create patterns** — The create section follows the same patterns as CREATE.

---

## DELETE

### DELETE Purpose:
A DELETE action removes or archives a **specific record** from the external service. The user selects the record to delete by its ID.

**Examples:** Delete Data Source Item, Delete Row, Delete Contact, Archive Page.

### DELETE UX Pattern:
1. **String** → Record ID (the specific record to delete directly, no dropdown logic).
2. **Help Static** *(optional)* → Warning message about the permanence of the deletion.

### DELETE Common Input Fields:
- **String** — For directly entering a record ID. No dropdown or parent dropdown is allowed.
- **Help Static** *(optional)* — For displaying warnings about irreversible actions.
- **Boolean** *(optional)* — For confirming the delete action or choosing between "delete" and "archive".

### DELETE Perform Code Reference:
- DELETE actions use `DELETE` HTTP requests with the record ID in the URL path.
- Some services use `PATCH`/`POST` for archiving instead of hard deletion.
- See [Perform Code Knowledge Base → Actions → DELETE](perform-code.md) for code patterns.

### DELETE Best Practices:
- **Keep it minimal** — DELETE actions must only require the record ID directly. Do not use dropdowns or resource/parent selection dropdowns.
- **Warn about permanence** — Use a Help Static field to warn users if the deletion is irreversible.
- **Archive vs Delete** — If the service supports archiving, offer a Boolean toggle ("Delete permanently" vs "Move to archive").
- **Error handling** — Handle 404 (already deleted) gracefully in the perform code.
- **No Dropdowns for DELETE** — Never use dropdowns or dynamic/static options to select the record ID in DELETE actions. Always use a direct text ID field (type 'string').

---

# Title & Description Naming Guidelines

This section outlines the standard conventions for generating user-facing names and descriptions for triggers and actions in the viaSocket plug ecosystem. All generated metadata must follow these UX copywriting rules.

## Action Naming & Description
An action is an operation that the system performs (e.g., creating a record, sending an alert).
* **Name Format:** Start with a clear verb. Use Title Case (Camel case with spaces, starting with a capital letter). Keep the name simple, directive, and instruction-like.
  * *Examples:* "Send an Email", "Send Message at Slack Channel"
* **Description Format:** Must explain what this action helps the user do using the shortest possible words.

## Trigger Naming & Description
A trigger represents a real-world event that initiates a workflow.
* **Name Format:** Event phrase only. It must fit naturally when appended to the phrase "When ____". Do **NOT** include the word "when" in the name. Use present tense and Title Case (Camel case with spaces, starting with a capital letter).
* **Avoid Technical Verbs:** Describe the real-world event from the user's perspective, not the underlying API mechanism. Do not use technical verbs such as: *list, fetch, sync, load, pull, search, check, scan, collect, export*.
* **Description Format:** Must follow the format: `"Runs when <same event>"` (keep it short and simple).
  * *Example:*
    * **Name:** "New Email Arrives"
    * **Description:** "Runs when new email arrives"

## General Copywriting Guidelines
1. **Focus on outcomes:** Focus on what the user achieves, not the technical implementation or how it works behind the scenes.
2. **Use simple, human language:** Write in non-technical, jargon-free terminology that app users (e.g., marketers, HR managers) understand instantly without referencing documentation.
3. **Minimize Redundancy:** Mention the app name in the action/trigger name only if the action is highly generic or unclear without it (otherwise, the app icon itself establishes the scope).
4. **Validation & Update Safety:** If existing titles (`old_title`) and descriptions (`old_description`) comply with these guidelines, preserve them without changes; check other fields (like `type` and `category`) instead.
5. **Character Limits:** Action and trigger descriptions **MUST NOT** exceed 30 characters in length.
6. **Label Casing & whereClause Exception:** Labels must use Title Case. Exception: In conversational `whereClause: true` input groups, all field labels must use sentence case, where only the first field's label starts with a capital letter and subsequent labels start with a lowercase letter unless they are proper nouns.

---

# Automation UX Builder & Architecture Instructions

This section defines the core role, design philosophies, automation safety strategies, and response structures for the viaSocket Input Builder assistant when operating in planning/design mode.

## Role & Core Design Philosophy

*Prioritizing user intent, hiding technical complexity, and designing for deterministic scale.*

You are a **Senior Automation UX Architect** and **viaSocket Input Builder Designer** operating in automation design mode. Your responsibility is to analyze API documentation and design a scalable, automation-safe Input Builder architecture.

### Core Design Philosophy
Design workflows around a **mixture of non-technical simplicity and technical completeness**. While the primary user experience should prioritize ease of use for non-technical users, we must also cater to advanced/technical users by fully supporting API capabilities.
*   **Inclusion of Complex & Optional Fields:** Do not omit complex or optional parameters. If the API supports them, they **must** be included as input fields so that technical users have access to all capabilities.
*   **Hide Technical Complexity by Default:** Hide raw system IDs, API keys, and internal technical jargon behind human-readable labels and descriptive help text. For optional complex fields, utilize progressive disclosure (e.g., field choosers or conditional groupings) to keep the initial form clean for non-technical users while keeping technical options available.
*   **Prioritize Stable Identifiers:** Favor robust identifiers (e.g., email, external ID) over brittle or time-sensitive ones (e.g., database IDs).
*   **Design for Deterministic Scale:** Automation configurations must run safely across thousands of executions without duplicate records or accidental data loss.

### Decision Evaluation Dimensions
Every design decision should be evaluated across five key dimensions (balanced dynamically based on context, rather than strictly prioritizing one):
1.  **Accessibility:** Can a non-technical business owner configure this confidently?
2.  **Workflow Simplicity:** Does the flow remain clean, pure, and minimal?
3.  **Technical Feasibility:** Is this technically implementable and stable?
4.  **Scalability:** Will this hold under worst-case usage and API rate limits?
5.  **Structural Constraints:** Does this respect platform limitations?
*The assistant should not blindly enforce simplicity; it must evaluate context and decide intelligently.*

### Product & Use-Case Awareness
Before proposing any trigger or action:
*   Understand the purpose of the application.
*   Identify practical, real-world user automation scenarios.
*   Avoid exposing features that are technically possible but workflow-irrelevant. Focus on meaningful automation over feature completeness.

### Action Selection Principle
An action is strong when:
*   It naturally fits into Trigger → Action workflows.
*   It solves a repeatable automation problem.
*   It does not introduce unnecessary complexity. Avoid priority for rarely used actions.

---

## Pre-Design Analysis (Mandatory)

*Mandatory analysis checklist for API parameters, identifiers, data structures, and webhook capabilities.*

Before proposing any Input Builder architecture, perform a comprehensive analysis of the API documentation:
*   **Parameters:** Required vs. optional fields, validation constraints, data formats, and enumerations (enums).
*   **Identifiers:** Primary keys, external reference numbers, database IDs, and foreign key dependencies.
*   **Data Structure:** Nested objects, repeating structures (arrays), and dynamic keys.
*   **Logic & Behavior:** Conditional dependencies, system-generated fields, and timezone/timestamp configurations.
*   **API Capabilities:** Search/List capabilities, Create/Update/Upsert behaviors, and query filtering features.

> [!IMPORTANT]
> *   Every documented API field must be either represented in the UX or handled implicitly by the backend code.
> *   **Security Constraint:** Authentication parameters must **never** be exposed in the UX configuration.

### Technical Reasoning Principles
*   **Dynamic URL Awareness:** If base URLs differ per user, prefer programmatic retrieval. Avoid user-specific structures unless programmatic retrieval is too unstable.
*   **Connection-Level Context Selection:** If a context (e.g., workspace, tenant, organization, or account) is required but no API is available to fetch options dynamically:
    *   Capture the selection during connection/authentication setup.
    *   Store it as part of the connection.
    *   Actions must use this connection-level value automatically without repeatedly asking the user in every action.
*   **Parameter Exposure:** Avoid exposing system-level complexity unless necessary. If exposure is unavoidable, provide guidance and clarity.
*   **Endpoint Validation:** If endpoints are undocumented, attempt provider confirmation, or document the limitation clearly (avoid assumptions that cause unstable integrations).

---

## Action Design Strategy

*Strategies for consolidated actions (Unified Search/Intelligent Upsert) and search-first record resolution.*

### 1. The Unified Action Principle
Consolidate operations whenever possible to simplify user choice and prevent workflow fragmentation:
*   **List + Search + Get → Unified LIST Action:** Consolidate listing ("List All"), searching/filtering (by unique identifiers like email, phone, etc.), "Search by ID", and "Advance Search" (if supported) into a single unified LIST action using a Mode dropdown.
*   **Create + Update → Intelligent Upsert:** Consolidate insertion and editing logic into a single action. Always prefer native Upsert endpoints if available.
*   **No Manual Choice:** Users should never have to explicitly choose "Create" vs "Update". The system must automatically determine the appropriate behavior through identifier resolution.

### 2. Identifier & Record Resolution
Use **search-first logic** to automatically resolve internal database IDs:
1. Search for existing record using a stable identifier (e.g., `email`, `external_id`, `sku`).
2. If found → update existing record.
3. If not found and creation is allowed → create a new record.
4. If creation is not supported → fail safely and log a warning.
Never assume referenced records exist.

### 3. Search Mode Evaluation
*   **Single Search Method:** Do not show any search mode selectors. Keep it simple.
*   **Multiple Search Methods:** Provide a **Search Mode Selector** dropdown:
    *   *Structured Search:* Search by stable attributes (e.g., email, phone, ID). **(Default)**
    *   *Advanced Query Filtering:* Native query syntax or conditions. **(Optional)**
*   **Uniqueness Guard:** If query mode can return multiple records, define clear, deterministic selection logic (e.g., select the first/newest) or fail safely.

---

## Field Design & Dynamic UI Rules

*Principles for field ordering, dropdown rules, and custom module-specific schema handling.*

### 1. General Principles
*   **Field Ordering:** Always position **Required** fields first. Group **Optional** fields together. When using static or dynamic help fields, they must always be positioned below the field they are referring to.
*   **Field Chooser Pattern:** If there are many optional fields, hide them behind a **"Select Additional Fields"** multi-select list. Render only the chosen fields dynamically.
*   **Structural Respect:** Map API enums to Dropdowns, arrays to repeating input groups, and nested objects to clean logical grouping. Never fabricate unsupported UI structures.

### 2. Dropdown Design Rules
*   **Dropdown Preference:** Always prioritize dropdowns (static or dynamic) over direct text ID fields. Check if an API/endpoint is available to fetch options first. Fall back to a text ID field only if no API is available or if dropdown nesting rules apply.
*   **Use Dropdowns Only When:** The dataset is small, stable, and backed by a highly reliable, paginated `GET` API.
*   **Avoid Dropdowns When:** Datasets are large, values shift frequently, or the options list depends dynamically on upstream trigger data. Use a direct **Identifier Input** (string field) instead.
*   **UPDATE Record ID Selection Rule:** This applies strictly to UPDATE Actions (DELETE actions must always use a direct text ID field of type 'string' with no dropdown logic).
    *   If the ID field supports a dropdown and no parent dropdown is required to fetch options, the dropdown should be created.
    *   If fetching the ID options requires creating dependent parent dropdowns, **do not create the parent dropdowns**. Instead, just create a **text field** asking the user for the ID directly.
    *   *Exceptions:* If the dropdown has static options for update, or if the parent dropdown is already required/selected by other fields in the action anyway, proceed with the dropdown selection.

### 3. Dynamic Schema Handling
For APIs supporting custom fields, custom properties, or module-specific schemas:
1. Allow the user to select the **Module / Resource** first.
2. Dynamically retrieve the schema for that selection.
3. Render only the fields relevant to the selected resource to prevent UI bloat and schema drift.

### 4. Workflow Simplicity Principles
*   **Workflow Purity:** Design flows as `Trigger → Action`. If a Javascript step is needed solely for formatting or mapping, move that logic internally inside the perform code.
*   **Coded Value Handling:** If an API expects numeric codes or enums (e.g., `1 = Male`, `2 = Female`), prefer input fields with clear help text explaining the mapping, unless the mappings are guaranteed stable, in which case a dropdown is viable.
*   **Format Abstraction Principle:** Users describe intent, not technical formatting. If a content format (e.g., HTML vs. plain text) can be safely inferred internally, detect it automatically in perform code instead of exposing format-selection fields.
*   **Default Value Usage Rule:** Before using `defaultValue`, verify if the API has native default behavior. If the API applies a default when omitted, avoid setting `defaultValue` in the builder. Allow the API to apply its own default behavior unless there is a strong UX override benefit.
*   **customHelp Writing Guidelines:** Focus on business meaning and explain what the user should provide rather than how the system stores it. Avoid explaining internal IDs or instructing users to copy task IDs from browser URLs.
    *   *Good:* `"Select the parent task under which the subtask should be created."`
    *   *Bad:* `"Open Asana, copy the task ID from the URL, and paste it here."`

### 5. Structural Constraint Handling
*   If only one return value is allowed but multiple are needed, concatenate values using a consistent, safe delimiter and parse internally. Redesign the generator if constraints severely impact clarity.

---

## Automation Safety & Overwrite Protection

*Guidelines to preserve idempotency, ensure partial-update safety, and sanitize payloads.*

### 1. Idempotency Preservation
Ensure that the design enforces repeat-run safety. Every action must explicitly state:
*   Which fields act as the primary duplicate prevention keys.
*   How the "Upsert" or "Create if missing" logic acts under high-volume executions (e.g., running 1,000 times).

### 2. Update Safety & Overwrite Protection
*   **Partial Updates Only:** The perform code must only send fields that are explicitly provided by the user.
*   **Payload Sanitization:** Never send `null` or empty strings (`""`) unless the user is explicitly trying to clear that field. This prevents accidental data erasure in the destination CRM/database.

### 3. Response Handling
*   **Small & Flat Responses:** Return the entire API payload.
*   **Large / Nested Responses:** Implement **Basic** vs **Detailed** response modes, returning key identifiers by default with optional detail expansion.

### 4. Backward Compatibility Rules
Field keys are stable contracts. When modifying an existing action, trigger, or field:
*   **Never rename or remove existing keys** unless a migration strategy exists. Renaming keys invalidates existing user mappings.
*   **Allowed changes:** Label updates, help text updates, visibility improvements, and adding optional fields. Always prioritize workflow continuity for existing users.

---

## Required Output Structure

*The standard 5-part structure required for every proposed integration design and perform code.*

Your final proposed design must strictly output the following **five-part** structure:

### 1. API Understanding Summary
A breakdown of the target endpoint, required vs. optional fields, identifier dependencies, data types, enums, and response complexity.

### 2. Clarification Questions
Ask clear, high-priority questions only when critical behavior, API limits, or lookup endpoints are ambiguous.

### 3. Proposed UX Architecture
An organized JSON definition of the Input Fields, showing hierarchy, field groupings, custom helpers, placeholder texts, dynamic selectors, and conditional visibility conditions.

> [!NOTE]
> Detailed field schemas, option generators, dynamic field builders, and allowed types **MUST** follow the rules defined in the **[DH Input Fields Knowledge Base](dh-Input-fields-json-builder.md)**.

### 4. API Configuration Perform Code
JavaScript code that maps input fields to the API payload. Both of the following structures are fully valid and supported:

**Format 1: Wrapping async function**
```javascript
async function <functionName>() {
  try {
    // validate required fields; build request from context.inputData; call API
  } catch (error) {
    await errorComponent(error); // catch ALWAYS uses errorComponent (supersedes legacy `throw error`; exception: Reusable Components must use `throw error` or `throw e` in catch)
  }
}
return await <functionName>();
```

**Format 2: Direct parent try-catch (no wrapping function)**
```javascript
try {
  // validate required fields; build request from context.inputData; call API
} catch (error) {
  await errorComponent(error); // catch ALWAYS uses errorComponent (supersedes legacy `throw error`; exception: Reusable Components must use `throw error` or `throw e` in catch)
}
```

> [!WARNING]
> #### Perform Code Constraints:
> *   Either of the two formats above is **mandatory**.
> *   Authentication values must **never** be hardcoded or managed in the perform code.
> *   The perform code should focus strictly on payload mapping and request dispatching.
> *   For full perform code templates, pagination logic, sample API request wrappers, and helper generators, refer to the **[Perform Code Knowledge Base](perform-code.md)**.

### 5. Automation Safety & Scalability Check
A robust analysis explaining the duplicate prevention strategy, idempotency safety, update-overwrite protection, and runtime stability guarantees.

---

## Behavior Constraints

*Prohibitions against raw schemas, exposed credentials, manual database IDs, and unverified API fields.*

*   **No Raw Schemas:** Avoid generating raw JSON schemas or mirroring raw API structure straight onto the interface. Refer to the **[DH Input Fields Knowledge Base](dh-Input-fields-json-builder.md)**.
*   **No Exposed Secrets:** Absolutely **never** expose or request authentication values (tokens, credentials, API keys) in the input fields configuration.
*   **No Direct System IDs:** Never force users to manage or copy internal system IDs (such as GUIDs or serial keys) manually when stable, user-friendly values exist.
*   **Adherence to Real Schemas:** Do **not** invent or assume API parameter names, payloads, or field endpoints that are not explicitly documented.
*   **Strict Review Validation:** All final configurations and perform codes must strictly be validated against the checklist in the **[DH Reviewer Instructions](dh-review.md)**.

### Trade-Off Evaluation Protocol
When conflicts arise during design, evaluate:
1.  Does this increase complexity for non-technical users?
2.  Does this increase system instability?
3.  Does this increase API load risk?
4.  Does this reduce long-term maintainability?
*Choose the solution that minimizes long-term risk while preserving usability.*

### Final Decision Reflection
Before finalizing any design recommendation, internally validate:
*   Is this usable by a traditional business owner?
*   Is this unnecessarily exposing technical complexity?
*   Is worst-case scaling acceptable?
*   Is the workflow still logically clean?
*   Are constraints handled responsibly?
*If trade-offs exist, explicitly acknowledge them and explain the reasoning.*

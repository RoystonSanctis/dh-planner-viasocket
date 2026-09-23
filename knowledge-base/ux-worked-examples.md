---
type: page
title: "UX Worked Examples Knowledge Base"
description: "Real-world worked examples of viaSocket plug actions, organized by action category. Each example pairs the UX rationale (supporting API usage, UI components, field-design reasoning) with the concrete implementation (input fields JSON + perform code) so the AI can pattern-match when building and reviewing action UIs. Companion to the UX Practices Knowledge Base (theory/rules) and the Perform Code Knowledge Base (code patterns)."
published: true
---
# Page Index

- UX Worked Examples Knowledge Base
- How to Use This Document
- Example Anatomy
- CREATE Examples
  - HubSpot — Create New Contact
  - ResourceGuru — Create Resource
  - OneDeck — Create Contact
  - Google Task — Create Task
  - Livestorm — Create Registration
  - Xero — Create Invoice
  - Cal ID — Create Booking
  - Calendly — Create Booking
  - Sangam CRM — Insert or Update Data with Linking Module
  - Razorpay — Create New Invoice
  - Google Sheet — Add New Row to Sheet
  - viaSocket Table — Add Records To Table
  - Keka — Add a New Employee
  - Freshsales classic — Create Deal
- UPDATE Examples
  - Cin7 Core — Update Customer
  - Keka — Update Employee Details
- LIST Examples
  - Keka — List All Employees
  - viaSocket Table — Get Table Rows
- FIND / SEARCH Examples
  - LeadSquared — Search Leads by Criteria
  - Google Calendar — List all Events
  - GoHighLevel — Add Tags on Contact
  - Gmail — Add Label to Email
  - ActiveCampaign — Add or Remove Tag on Contact
- GET Examples
  - LeadSquared — Get Lead by ID
  - YouTube Studio — Get Channel Analytics
- FIND OR CREATE (Upsert) Examples
  - LeadSquared — Create or Update Lead
  - Leadconnector — Create Or Update Contact
- Composite / Advanced Action Examples
  - Slack — Schedule Message
  - Slack — Send Message
  - MSG91 — Send WhatsApp Template Message
  - Gmail — Send Email
- SCHEDULED TRIGGER Examples
  - Google Calendar — New Upcoming Events (Scheduled Trigger)
  - Google Meet — New Upcoming Meeting (Scheduled Trigger)
  - RSS Feed — RSS Feed Update Tracker (Scheduled Trigger)
- MANUAL TRIGGER Examples
  - CallHippo — Call Log Activity (Manual Trigger)
- Dropdown Examples
  - Botse — Fetch Templates - No Search, Only Pagination
- Cross-Cutting UX Patterns (Extracted)
- Perform Code Reference

# UX Worked Examples Knowledge Base

This document contains real, shipped viaSocket plug actions used as reference examples. It is the **examples companion** to two other knowledge bases:

- **UX Practices Knowledge Base** — the rules, field-ordering conventions, and best practices for each trigger type and action category.
- **Perform Code Knowledge Base** — the code templates for trigger/action perform logic.

Where those files describe *what to do*, this file shows *what a correct implementation actually looks like*. Use it to pattern-match a new action against the closest existing example before proposing a design.

# How to Use This Document

1. Identify the action category (CREATE, LIST, FIND/SEARCH, GET, UPDATE, FIND OR CREATE, DELETE, or Composite).
2. Jump to that section and read the closest example(s) by shape — not by app. "Create Invoice" and "Create Contact" teach the same UX moves even though the apps differ.
3. Copy the *pattern* (field ordering, conditional visibility, field-chooser + generator combo, JSON→payload mapping), then adapt endpoints, keys, and schema to the target API.
4. Read the **Cross-Cutting UX Patterns** section at the end — it distills the recurring lessons that appear across multiple examples.

> [!NOTE]
> Some examples include both a UX breakdown and full code; some (documented from English design notes only) include the UX breakdown without code. The UX breakdown and the input-fields JSON are the primary UI/UX artifacts. The perform code is secondary and shows how the UI maps into the API payload.

# Example Anatomy

Every fully-documented example follows this structure:

- **Metadata** — App, Category, Action, Action Type.
- **Supporting API Usage** — which extra GET/LIST endpoints power the dynamic UI (dropdowns, field generators). Auth is never an input field.
- **UX Components & Field Design** — each field and *why* it exists in that form (dropdown vs string, input group, field chooser, conditional visibility).
- **Input Fields JSON** — the actual `inputFields` array.
- **API Configuration Perform Code** — the JS that maps inputs to the API call (where available).
- **UX Takeaways** — the reusable lesson(s) this example teaches.

---

# CREATE Examples

CREATE actions build a new record. The recurring UX challenge is collecting a possibly-large, possibly-nested payload without overwhelming the user — solved with input groups, conditional branches (existing ID vs. inline details), field choosers, and schema-driven dynamic input groups.

## HubSpot — Create New Contact

**Metadata**
- **App:** HubSpot
- **Category:** Marketing, Sales & CRM
- **Action:** Create New Contact
- **Action Type:** CREATE

**Supporting API Usage**
- **Get All Properties API** (`/properties/v2/contacts/properties`) — feeds both the field-chooser multiselect and the dynamic input-group generator, so the form always reflects the account's live schema (including custom properties).

**UX Components & Field Design**
- **`selected_properties` (dynamic multiselect / field chooser)** — the user first picks *which* contact properties they want to set. Options are generated live from the properties API and sorted alphabetically. Sensible defaults are pre-selected (email, first name, last name, company, phone, job title, lifecycle stage).
- **`contact_properties` (dynamic input group via `fieldsGenerator`)** — for each chosen property, a correctly-typed field is rendered: HubSpot `boolean`→boolean, `number`→number, `datetime`→date, `enumeration`→dropdown (with its options), everything else→string. `email` is forced `required`.
- **`additional_properties_to_retrieve` (string, optional)** — lets advanced users name extra properties to echo back.

This is the canonical **field-chooser → schema-driven dynamic input group** pattern: keep the form clean by only rendering fields the user opted into, and derive each field's type from the API schema instead of hardcoding.

**Input Fields JSON**
```json
[
  {
    "key": "selected_properties",
    "help": "Select the contact properties you want to include in this action. Email must be provided at runtime.",
    "type": "multiselect",
    "label": "Select Contact Properties",
    "required": true,
    "defaultValue": [
      { "label": "Email", "value": "email" },
      { "label": "First name", "value": "firstname" },
      { "label": "Last name", "value": "lastname" },
      { "label": "Company", "value": "company" },
      { "label": "Phone", "value": "phone" },
      { "label": "Job title", "value": "jobtitle" },
      { "label": "Lifecycle stage", "value": "lifecyclestage" }
    ],
    "optionsGenerator": "async function getOptions() { try { const resp = await axios.get('https://api.hubapi.com/properties/v2/contacts/properties', { headers: { 'Content-Type': 'application/json' } }); const fields = resp.data || []; return fields.map(f => ({ label: f.label || f.name, value: f.name, sample: f.name, type: f.type || f.fieldType || 'string', options: Array.isArray(f.options) ? f.options.map(o => ({ label: o.label, value: o.value })) : [] })).sort((a,b) => (a.label||'').localeCompare(b.label||'')); } catch (err) { throw err; } }\n\nreturn await getOptions();"
  },
  {
    "key": "contact_properties",
    "help": "Enter values for each selected property. Email is required.",
    "type": "input groups",
    "label": "Contact Properties",
    "fieldsGenerator": "async function generateFields() { try { const selected = context.inputData.selected_properties || []; if (!Array.isArray(selected) || selected.length === 0) { return [{ message: 'Please select at least one contact property above to configure the fields.' }]; } const resp = await axios.get('https://api.hubapi.com/properties/v2/contacts/properties', { headers: { 'Content-Type': 'application/json' } }); const properties = resp.data || []; const out = selected.map(name => { const meta = properties.find(p => p.name === name) || { name, label: name, type: 'string' }; const field = { key: meta.name, label: meta.label || meta.name, required: meta.name === 'email', help: meta.description || ('Enter ' + (meta.label || meta.name)), type: 'string', placeholder: '' }; if (meta.type === 'boolean') { field.type = 'boolean'; field.options = [{ label: 'Yes', value: true }, { label: 'No', value: false }]; } else if (meta.type === 'number') { field.type = 'number'; field.placeholder = 'Enter ' + (meta.label || meta.name); } else if (meta.type === 'datetime' || meta.fieldType === 'date') { field.type = 'date'; field.placeholder = 'YYYY-MM-DD or ISO8601'; } else if (meta.type === 'enumeration' || meta.fieldType === 'select') { field.type = 'dropdown'; field.options = Array.isArray(meta.options) ? meta.options.map(o => ({ label: o.label, value: o.value })) : []; } else { field.type = 'string'; field.placeholder = 'Enter ' + (meta.label || meta.name); } return field; }); return out; } catch (err) { throw err; } }\n\nreturn await generateFields();"
  },
  {
    "key": "additional_properties_to_retrieve",
    "help": "Select the additional properties you want to retrieve",
    "type": "string",
    "label": "Additional properties",
    "required": false,
    "placeholder": "E.g., hs_object_id, createdate"
  }
]
```

**API Configuration Perform Code**
```javascript
async function performAction() {
  try {
    if (!context.inputData?.contact_properties || typeof context.inputData.contact_properties !== 'object') {
      throw new Error('No contact properties provided. Please fill in contact properties in the action settings.');
    }

    const inputProps = context.inputData.contact_properties;
    const properties = {};

    Object.entries(inputProps).forEach(([k, v]) => {
      if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) return;

      if (k === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(v).trim())) {
          throw new Error('Please provide a valid email address in the email field.');
        }
        properties[k] = String(v).trim();
        return;
      }

      if (typeof v === 'boolean' || typeof v === 'number') {
        properties[k] = v;
      } else {
        properties[k] = String(v).trim();
      }
    });

    if (!properties.email) {
      throw new Error('Email address is required to create a contact.');
    }

    const body = { properties };

    const config = {
      method: 'post',
      url: 'https://api.hubapi.com/crm/v3/objects/contacts',
      headers: { 'Content-Type': 'application/json' },
      data: body
    };

    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    if (error?.response?.data) {
      const apiErr = error.response.data;
      if (apiErr?.status === 'CONFLICT' || apiErr?.category === 'CONFLICT') {
        throw new Error('A contact with this email already exists (409 - conflict). This action is configured as create-only.');
      }
      if (apiErr?.message) {
        throw new Error(apiErr.message);
      }
      if (Array.isArray(apiErr?.errors) && apiErr.errors.length > 0 && apiErr.errors[0].message) {
        throw new Error(apiErr.errors[0].message);
      }
    }
    throw error;
  }
}

return await performAction();
```

**UX Takeaways**
- **Field chooser + `fieldsGenerator`** is the go-to CREATE pattern for schema-rich CRMs: pick properties → render typed inputs for only those properties.
- Map API property types to the correct viaSocket field type (boolean/number/date/dropdown/string) instead of dumping everything as strings.
- When the chooser is empty, return `[{ message: "..." }]` from the generator so the user gets a clear instruction instead of a broken form.
- Pre-select the fields 90% of users need as `defaultValue`, keeping the common path one click away.

---

## ResourceGuru — Create Resource

**Metadata**
- **App:** ResourceGuru
- **Category:** Project Management / Resource Management / Scheduling
- **Action:** Create Resource
- **Action Type:** CREATE

**Supporting API Usage**
- **Get Accounts API** — lists available ResourceGuru accounts.
- **Get Resource Type API** — resource types available for creation.
- **Get Custom Fields API** — custom fields addable to a resource during creation.

**UX Components & Field Design (from design notes)**
- **Dropdown — Accounts** — choose the account the resource belongs to.
- **Input Group — Resource Details** — color, name, timezone (static dropdown or fetched), job title, phone, bookable (boolean), notes, first/last name, capacity, registration number, invite (boolean), role (static dropdown: `basic_user`, `manager`, `administrator`, `custom`), permissions, email, booking approver IDs (array of strings).
- **Input Group — Custom Fields** — rendered dynamically per resource type via the custom-fields API.
- **Visibility conditions** — only the fields relevant to the selected resource type appear.

**Input Fields JSON (invoice-style variant shipped for this action)**
```json
[
  { "key": "description", "type": "string", "label": "Invoice Description", "required": true, "placeholder": "e.g. Consulting services for August" },
  { "key": "draft", "type": "boolean", "label": "Create as Draft", "options": [ { "label": "Yes", "value": true }, { "label": "No", "value": false } ], "required": false },
  { "key": "currency", "type": "dropdown", "label": "Invoice Currency", "options": [ { "label": "INR", "value": "INR" }, { "label": "USD", "value": "USD" }, { "label": "EUR", "value": "EUR" } ], "required": true },
  { "key": "expiry_days", "type": "dropdown", "label": "Invoice Expiry", "options": [ { "label": "1 Day", "value": 1 }, { "label": "7 Days", "value": 7 }, { "label": "15 Days", "value": 15 }, { "label": "30 Days", "value": 30 } ], "required": true },
  { "key": "customer_mode", "type": "dropdown", "label": "Customer Selection Method", "options": [ { "label": "Use Existing Customer ID", "value": "id" }, { "label": "Enter Customer Details", "value": "details" } ], "required": true },
  { "key": "customer_id", "type": "string", "label": "Customer ID", "required": true, "placeholder": "e.g. cust_ABC123", "visibilityCondition": "context.inputData.customer_mode === 'id'" },
  { "key": "customer", "type": "input groups", "label": "Customer Details", "required": true, "visibilityCondition": "context.inputData.customer_mode === 'details'", "fields": [ { "key": "name", "type": "string", "label": "Customer Name", "required": true, "placeholder": "e.g. John Doe" }, { "key": "contact", "type": "string", "label": "Contact Number", "required": false, "placeholder": "e.g. 9876543210" }, { "key": "email", "type": "string", "label": "Email Address", "required": false, "placeholder": "e.g. john@example.com" } ] },
  { "key": "billing_address", "type": "input groups", "label": "Billing Address", "required": false, "fields": [ { "key": "line1", "type": "string", "label": "Address Line 1", "required": false }, { "key": "line2", "type": "string", "label": "Address Line 2", "required": false }, { "key": "zipcode", "type": "string", "label": "Zip Code", "required": false }, { "key": "city", "type": "string", "label": "City", "required": false }, { "key": "state", "type": "string", "label": "State", "required": false }, { "key": "country", "type": "string", "label": "Country", "required": false } ] },
  { "key": "same_shipping", "type": "boolean", "label": "Shipping Address Same as Billing", "options": [ { "label": "Yes", "value": true }, { "label": "No", "value": false } ], "required": false },
  { "key": "shipping_address", "type": "input groups", "label": "Shipping Address", "required": false, "visibilityCondition": "context.inputData.same_shipping !== true", "fields": [ { "key": "line1", "type": "string", "label": "Address Line 1", "required": false }, { "key": "line2", "type": "string", "label": "Address Line 2", "required": false }, { "key": "zipcode", "type": "string", "label": "Zip Code", "required": false }, { "key": "city", "type": "string", "label": "City", "required": false }, { "key": "state", "type": "string", "label": "State", "required": false }, { "key": "country", "type": "string", "label": "Country", "required": false } ] },
  { "key": "line_items", "type": "input groups", "label": "Line Items", "required": true, "fields": [ { "key": "name", "type": "string", "label": "Item Name", "required": true, "placeholder": "e.g. Master Cloud Computing in 30 Days" }, { "key": "description", "type": "string", "label": "Item Description", "required": false }, { "key": "amount", "type": "number", "label": "Amount (smallest currency unit)", "required": true }, { "key": "quantity", "type": "number", "label": "Quantity", "required": true } ] },
  { "key": "partial_payment", "type": "boolean", "label": "Allow Partial Payment", "options": [ { "label": "Yes", "value": true }, { "label": "No", "value": false } ], "required": false },
  { "key": "sms_notify", "type": "boolean", "label": "Send SMS Notification", "options": [ { "label": "Yes", "value": true }, { "label": "No", "value": false } ], "required": false },
  { "key": "email_notify", "type": "boolean", "label": "Send Email Notification", "options": [ { "label": "Yes", "value": true }, { "label": "No", "value": false } ], "required": false },
  { "key": "notes", "type": "string", "label": "Notes", "required": false, "placeholder": "Additional notes for this invoice (max 2048 characters)" }
]
```

**API Configuration Perform Code**
```javascript
async function performAction() {
  try {
    const account = context.inputData.account;
    const id = context.inputData.id;

    if (!account) {
      throw new Error('Account ID is required.');
    }
    if (!id) {
      throw new Error('Resource ID is required.');
    }

    const url = `https://api.resourceguruapp.com/v1/${account}/resources/${id}`;

    const response = await axios.get(url, {
      headers: { 'Accept': 'application/json' }
    });

    return { success: true, data: response.data };
  } catch (error) {
    await errorComponent(error);
  }
}

return await performAction();
```

**UX Takeaways**
- Where an API exposes per-type custom fields, resolve resource type first, then render a **dynamic custom-fields input group** so only relevant fields show.
- The "expiry as a dropdown of preset day counts" pattern (1/7/15/30 days) is a friendlier alternative to a free number field when the API accepts a small set of common values.

---

## OneDeck — Create Contact

**Metadata**
- **App:** OneDeck
- **Category:** CRM / Boards
- **Action:** Create Contact
- **Action Type:** CREATE
- *(Documented from design notes; no shipped code included.)*

**Supporting API Usage**
- **Get Boards API** — lists boards where a contact record can be added.
- **Get Fields API** — fields usable when creating/updating a record on the selected board.

**UX Components & Field Design**
- **Dropdown — Board Selection** — choose the board (parent resource).
- **String — Name** — the contact's name.
- **Multiselect — Select Fields (field chooser)** — pick which fields to send data for.
- **Dynamic Input Group — Selected Fields** — renders an input per chosen field.

**UX Takeaways**
- Same **board → field chooser → dynamic inputs** shape as HubSpot Create Contact; the parent resource here is a "board" instead of an account. When you see "boards / workspaces / bases / modules", expect a parent dropdown before the field chooser.

---

## Google Task — Create Task

**Metadata**
- **App:** Google Task
- **Category:** Productivity / Task Management
- **Action:** Create Task
- **Action Type:** CREATE
- *(Documented from design notes.)*

**Supporting API Usage**
- **Task List API** — lists task lists a new task can be created in.

**UX Components & Field Design**
- **Dropdown — Select Task List** — parent resource.
- **String — Title**.
- **String — Due Date (in days from today)** — the user enters a number of days (e.g. `7`); perform code computes the actual due date. Human intent over raw date math.
- **String — Notes**.
- **Static Dropdown — Status** — `Need Action` / `Completed`.

**UX Takeaways**
- Accepting a **relative due date ("in N days")** and computing the absolute date server-side is friendlier than forcing an ISO date, when the automation intent is "due N days after it runs".

---

## Livestorm — Create Registration

**Metadata**
- **App:** Livestorm
- **Category:** Webinars / Events
- **Action:** Create Registration
- **Action Type:** CREATE
- *(Documented from design notes.)*

**Supporting API Usage**
- **Get All Events API** — lists events.
- **Get All Sessions API** — lists sessions for the selected event.

**UX Components & Field Design**
- **Static Dropdown — Status** — Upcoming / Live / On Demand / Past / Past Not Started / Canceled / Draft. Narrows which events are relevant.
- **Dropdown — Select Event** — depends on status.
- **Dropdown — Select Session** — depends on the selected event.
- **String — Email** — registrant email.
- **Dynamic Input Group — Fields from Event** — event-specific registration fields, generated from the event schema.

**UX Takeaways**
- A **three-level cascade** (status → event → session) is acceptable when each level genuinely narrows the next. Use `visibilityCondition` so later dropdowns appear only after earlier ones are chosen.

---

## Xero — Create Invoice

**Metadata**
- **App:** Xero
- **Category:** Accounting
- **Action:** Create Invoice
- **Action Type:** CREATE
- *(Documented from design notes.)*

**Supporting API Usage**
- **Get All Contacts API**, **Currencies list**, **Account Codes**, **Invoice Status** — feed the respective dropdowns.

**UX Components & Field Design**
- **Boolean — Contact Selection** — true: pick an existing contact from a dynamic dropdown; false: enter email/name/phone inline. (Same "existing vs inline" fork as Razorpay.)
- **Static Dropdowns** — Invoice Type (ACCREC/ACCPAY), Invoice Status (Draft/Submitted/Paid…).
- **Strings** — Invoice Date, Due Date.
- **Line-Item fork** — use an existing line item (dropdown) or create a new one (description, quantity, unit price, account code dropdown, tax type dropdown).
- **Dropdown — Currency**.

**UX Takeaways**
- Accounting integrations layer **multiple existing-vs-new forks** (contact fork, line-item fork). Keep each fork's fields in a conditionally-visible group so the form stays readable.
- Default dates sensibly (invoice date = today, due date = +30 days) inside perform code rather than forcing the user to type them.

---

## Cal ID — Create Booking

**Metadata**
- **App:** Cal ID · **Category:** Scheduling · **Action:** Create Booking · **Action Type:** CREATE

**Supporting API Usage**
- **List Teams API** — fetches available teams for a user to select from in the dropdown.
- **List Event Types API** — fetches event types (filtered by team if team scope is selected).
- **Get Event Type Custom Fields API** — fetches custom fields configured for the specific event type.

**UX Components & Field Design**
- **Dropdown (Static) — Event Type Scope** — allows user to choose between personal event types and team event types.
- **Dropdown (Dynamic) — Team** — dynamically lists teams, visible only when Event Type Scope is "team".
- **Dropdown (Dynamic) — Event Type** — dynamically lists event types based on the selected scope and team.
- **Boolean — Schedule Booking Using** — toggles between relative date ("Days from Today") and fixed date/time ("Exact Date & Time").
- **Number — Start Date (Days from Today)** and **String — Start Time (HH:mm)** — visible when scheduling using "Days from Today".
- **String — Start Date & Time** — visible when scheduling using "Exact Date & Time".
- **Dropdown — Time Zone** — dropdown with common timezones to interpret the start time.
- **Input Group — Attendee Details** — groups attendee's name, email, and phone.
- **Dropdown (Static) — Meeting Location** — options for meeting location, revealing location details if custom option is chosen.
- **String — Location Detail** — visible when a custom location option is chosen.
- **Input Group — Booking Questionnaire** — dynamically renders questionnaire fields using `fieldsGenerator` after Event Type is selected.

**Input Fields JSON**
```json
[
  {
    "key": "event_scope",
    "help": "Select Personal for your own event types or Team for a shared team event.",
    "type": "dropdown",
    "label": "Event Type Scope",
    "options": [
      {
        "label": "Personal",
        "value": "personal"
      },
      {
        "label": "Team",
        "value": "team"
      }
    ],
    "required": true,
    "defaultValue": {
      "label": "Personal",
      "value": "personal"
    }
  },
  {
    "key": "team_id",
    "help": "Select the team whose event type you want to book.",
    "type": "dropdown",
    "label": "Team",
    "required": true,
    "customInputLabel": "Enter Team ID manually",
    "optionsGenerator": "try {\n  const res = await axios.get('https://api.cal.id/teams/', { params: { limit: 100 } });\n  const teams = res.data?.data || [];\n  if (!teams.length) {\n    return { message: 'No teams found. Make sure you are a member or admin of at least one team.' };\n  }\n  return teams.map(t => ({\n    label: t.name || `Team ${t.id}`,\n    value: String(t.id),\n    sample: String(t.id)\n  }));\n} catch (error) {\n  throw error;\n}",
    "customPlaceholder": "1234",
    "visibilityCondition": "context.inputData.event_scope === 'team'"
  },
  {
    "key": "event_type",
    "help": "Select the event type you want to book.",
    "type": "dropdown",
    "label": "Event Type",
    "required": true,
    "customInputLabel": "Enter Event Type ID manually",
    "optionsGenerator": "try {\n  const scope = context.inputData?.event_scope;\n  const teamId = context.inputData?.team_id;\n\n  if (scope === 'team') {\n    if (!teamId) {\n      return { message: 'Please select a Team first.' };\n    }\n    const res = await axios.get(`https://api.cal.id/teams/${teamId}/event-types`, {\n      params: { limit: 100, orderBy: 'id', orderDir: 'desc', hidden: false }\n    });\n    const collection = res.data?.data || [];\n    if (!collection.length) {\n      return { message: 'No event types found for this team.' };\n    }\n    return collection.map(e => ({\n      label: e.title || e.slug || String(e.id),\n      value: String(e.id),\n      sample: String(e.id)\n    }));\n  }\n\n  const res = await axios.get('https://api.cal.id/event-types/', {\n    params: { limit: 100, orderBy: 'id', orderDir: 'desc', hidden: false }\n  });\n  const collection = res.data?.data || [];\n  if (!collection.length) {\n    return { message: 'No event types found. Please create an event type in Cal.id first.' };\n  }\n  return collection.map(e => ({\n    label: e.title || e.slug || String(e.id),\n    value: String(e.id),\n    sample: String(e.id)\n  }));\n\n} catch (error) {\n  throw error;\n}",
    "customPlaceholder": "123456"
  },
  {
    "key": "date_selection_mode",
    "help": "Use Days from Today for relative scheduling or Exact Date & Time for a fixed slot.",
    "type": "boolean",
    "label": "Schedule Booking Using",
    "options": [
      {
        "label": "Days from Today",
        "value": true
      },
      {
        "label": "Exact Date & Time",
        "value": false
      }
    ],
    "required": true,
    "defaultValue": {
      "label": "Days from Today",
      "value": true
    }
  },
  {
    "key": "start_no_of_days",
    "help": "Enter 0 for today, 1 for tomorrow, and so on.",
    "type": "number",
    "label": "Start Date (Days from Today)",
    "required": true,
    "placeholder": "0 for today, 1 for tomorrow",
    "visibilityCondition": "context.inputData.date_selection_mode === true"
  },
  {
    "key": "start_time",
    "help": "Enter time in 24-hour format.",
    "type": "string",
    "label": "Start Time (HH:mm)",
    "required": true,
    "placeholder": "14:30",
    "visibilityCondition": "context.inputData.date_selection_mode === true"
  },
  {
    "key": "start_date",
    "help": "Enter date and time in YYYY-MM-DD HH:mm format or paste an ISO 8601 string from a trigger.",
    "type": "string",
    "label": "Start Date & Time",
    "required": true,
    "placeholder": "2026-05-18 14:30",
    "visibilityCondition": "context.inputData.date_selection_mode === false"
  },
  {
    "key": "timeZone",
    "help": "The start time will be interpreted in this timezone.",
    "type": "dropdown",
    "label": "Time Zone",
    "options": [
      {
        "label": "India Standard Time (Asia/Kolkata)",
        "value": "Asia/Kolkata"
      },
      {
        "label": "US Eastern Time (America/New_York)",
        "value": "America/New_York"
      },
      {
        "label": "US Central Time (America/Chicago)",
        "value": "America/Chicago"
      },
      {
        "label": "US Mountain Time (America/Denver)",
        "value": "America/Denver"
      },
      {
        "label": "US Pacific Time (America/Los_Angeles)",
        "value": "America/Los_Angeles"
      },
      {
        "label": "UTC",
        "value": "UTC"
      },
      {
        "label": "UK Time (Europe/London)",
        "value": "Europe/London"
      },
      {
        "label": "Central European Time (Europe/Berlin)",
        "value": "Europe/Berlin"
      },
      {
        "label": "Eastern European Time (Europe/Helsinki)",
        "value": "Europe/Helsinki"
      },
      {
        "label": "Moscow Time (Europe/Moscow)",
        "value": "Europe/Moscow"
      },
      {
        "label": "Gulf Standard Time (Asia/Dubai)",
        "value": "Asia/Dubai"
      },
      {
        "label": "Pakistan Standard Time (Asia/Karachi)",
        "value": "Asia/Karachi"
      },
      {
        "label": "Bangladesh Time (Asia/Dhaka)",
        "value": "Asia/Dhaka"
      },
      {
        "label": "Indochina Time (Asia/Bangkok)",
        "value": "Asia/Bangkok"
      },
      {
        "label": "China / Singapore Time (Asia/Singapore)",
        "value": "Asia/Singapore"
      },
      {
        "label": "Japan / Korea Time (Asia/Tokyo)",
        "value": "Asia/Tokyo"
      },
      {
        "label": "Australia Eastern Time (Australia/Sydney)",
        "value": "Australia/Sydney"
      },
      {
        "label": "Australia Central Time (Australia/Adelaide)",
        "value": "Australia/Adelaide"
      },
      {
        "label": "Australia Western Time (Australia/Perth)",
        "value": "Australia/Perth"
      },
      {
        "label": "New Zealand Time (Pacific/Auckland)",
        "value": "Pacific/Auckland"
      },
      {
        "label": "Brazil Time (America/Sao_Paulo)",
        "value": "America/Sao_Paulo"
      },
      {
        "label": "Argentina Time (America/Argentina/Buenos_Aires)",
        "value": "America/Argentina/Buenos_Aires"
      },
      {
        "label": "Mexico City Time (America/Mexico_City)",
        "value": "America/Mexico_City"
      },
      {
        "label": "Canada Eastern Time (America/Toronto)",
        "value": "America/Toronto"
      },
      {
        "label": "Canada Pacific Time (America/Vancouver)",
        "value": "America/Vancouver"
      },
      {
        "label": "West Africa Time (Africa/Lagos)",
        "value": "Africa/Lagos"
      },
      {
        "label": "East Africa Time (Africa/Nairobi)",
        "value": "Africa/Nairobi"
      },
      {
        "label": "South Africa Time (Africa/Johannesburg)",
        "value": "Africa/Johannesburg"
      }
    ],
    "required": true,
    "defaultValue": {
      "label": "India Standard Time (Asia/Kolkata)",
      "value": "Asia/Kolkata"
    },
    "customInputLabel": "Enter Timezone",
    "customPlaceholder": "America/New_York"
  },
  {
    "key": "attendee",
    "help": "Details of the person being booked into this meeting.",
    "type": "input groups",
    "label": "Attendee Details",
    "required": true,
    "fields": [
      {
        "key": "name",
        "help": "Full name of the attendee.",
        "type": "string",
        "label": "Full Name",
        "required": true,
        "placeholder": "John Doe"
      },
      {
        "key": "email",
        "help": "Booking confirmation will be sent to this email.",
        "type": "string",
        "label": "Email Address",
        "required": true,
        "placeholder": "john@example.com"
      },
      {
        "key": "phone",
        "help": "Required only if the event uses Attendee Phone as the meeting location.",
        "type": "string",
        "label": "Phone Number",
        "required": false,
        "placeholder": "+91XXXXXXXXXX"
      }
    ]
  },
  {
    "key": "location_kind",
    "help": "Select the meeting location. Ensure the integration is connected in your Cal.id account.",
    "type": "dropdown",
    "label": "Meeting Location",
    "options": [
      {
        "label": "Google Meet",
        "value": "integrations:google:meet"
      },
      {
        "label": "Zoom",
        "value": "integrations:zoom:video"
      },
      {
        "label": "Microsoft Teams",
        "value": "integrations:office365_video:video"
      },
      {
        "label": "In Person — Attendee Address",
        "value": "attendeeInPerson"
      },
      {
        "label": "Attendee Phone",
        "value": "attendeePhone"
      },
      {
        "label": "Host Phone",
        "value": "userPhone"
      },
      {
        "label": "Somewhere Else",
        "value": "somewhereElse"
      }
    ],
    "required": false,
    "defaultValue": {
      "label": "Google Meet",
      "value": "integrations:google:meet"
    },
    "customInputLabel": "Enter location value manually",
    "customPlaceholder": "integrations:zoom:video"
  },
  {
    "key": "location_detail",
    "help": "Enter the address, phone number, or custom location text.",
    "type": "string",
    "label": "Location Detail",
    "required": true,
    "placeholder": "123 Main Street or +14155551234",
    "visibilityCondition": "context.inputData.location_kind === 'attendeeInPerson' || context.inputData.location_kind === 'somewhereElse' || context.inputData.location_kind === 'attendeePhone' || context.inputData.location_kind === 'userPhone'"
  },
  {
    "key": "guests",
    "help": "Enter comma-separated email addresses. Each guest will receive a calendar invite.",
    "type": "string",
    "label": "Additional Guests",
    "required": false,
    "placeholder": "guest1@example.com, guest2@example.com"
  },
  {
    "key": "notes",
    "help": "Any notes or context the attendee wants to share for this booking.",
    "type": "string",
    "label": "Notes",
    "required": false,
    "placeholder": "Please bring the project brief"
  },
  {
    "key": "custom_booking_fields",
    "help": "Additional questions configured for this event type.",
    "type": "input groups",
    "label": "Booking Questionnaire",
    "required": false,
    "fieldsGenerator": "try {\n  const scope = context.inputData?.event_scope;\n  const teamId = Number(context.inputData?.team_id);\n  const eventTypeId = Number(context.inputData?.event_type);\n\n  if (!eventTypeId) {\n    return [{ key: '_info', label: 'Please select an Event Type above to load its custom fields.', type: 'string', required: false }];\n  }\n\n  const fetchUrl = scope === 'team' && teamId\n    ? `https://api.cal.id/teams/${teamId}/event-types/${eventTypeId}`\n    : `https://api.cal.id/event-types/${eventTypeId}`;\n\n  const response = await axios.get(fetchUrl);\n  const bookingFields = response.data?.data?.bookingFields;\n\n  if (!Array.isArray(bookingFields)) {\n    return [{ message: 'Could not load booking fields for this event type. Please re-select the event type.' }];\n  }\n\n  const alreadyCovered = new Set(['name', 'email', 'attendeePhoneNumber', 'location', 'guests', 'notes', 'rescheduleReason', 'title']);\n\n  const typeMap = {\n    text: 'string', textarea: 'string', address: 'string', phone: 'string',\n    number: 'number', boolean: 'boolean', checkbox: 'boolean',\n    multiemail: 'string', select: 'dropdown', multiselect: 'multiselect'\n  };\n\n  const fields = bookingFields\n    .filter(field => {\n      if (alreadyCovered.has(field.name)) return false;\n      if (field.hidden === true) return false;\n      if (field.type === 'radioInput') return false;\n      if (Array.isArray(field.views) && field.views.every(v => v.id === 'reschedule')) return false;\n      return true;\n    })\n    .map((field, index) => {\n      const safeKey = `cf__${index}__${field.name}`;\n      const mapped = {\n        key: safeKey,\n        label: field.label || field.defaultLabel || field.name,\n        type: typeMap[field.type] || 'string',\n        required: field.required === true\n      };\n      const rawPlaceholder = field.placeholder || field.defaultPlaceholder || '';\n      const isI18nKey = /^[a-z][a-z0-9_]*$/.test(rawPlaceholder) && rawPlaceholder.includes('_');\n      if (rawPlaceholder && !isI18nKey) mapped.placeholder = rawPlaceholder;\n      if ((field.type === 'select' || field.type === 'multiselect') && Array.isArray(field.options)) {\n        mapped.options = field.options.map(opt => ({ label: opt.label || opt, value: opt.value || opt }));\n      }\n      return mapped;\n    });\n\n  if (!fields.length) {\n    return { message: 'No additional custom fields found for this event type.' };\n  }\n\n  return fields;\n\n} catch (err) {\n  throw err;\n}"
  },
  {
    "key": "language",
    "help": "Language for booking confirmation emails sent to the attendee.",
    "type": "dropdown",
    "label": "Confirmation Email Language",
    "options": [
      {
        "label": "English",
        "value": "en"
      },
      {
        "label": "French",
        "value": "fr"
      },
      {
        "label": "German",
        "value": "de"
      },
      {
        "label": "Spanish",
        "value": "es"
      },
      {
        "label": "Portuguese",
        "value": "pt"
      },
      {
        "label": "Italian",
        "value": "it"
      },
      {
        "label": "Japanese",
        "value": "ja"
      },
      {
        "label": "Arabic",
        "value": "ar"
      }
    ],
    "required": false,
    "defaultValue": {
      "label": "English",
      "value": "en"
    }
  },
  {
    "key": "show_advanced",
    "help": "Attach custom metadata to this booking for tracking or CRM purposes.",
    "type": "boolean",
    "label": "Add Custom Metadata?",
    "options": [
      {
        "label": "Yes",
        "value": true
      },
      {
        "label": "No",
        "value": false
      }
    ],
    "required": false,
    "defaultValue": {
      "label": "No",
      "value": false
    }
  },
  {
    "key": "metadata",
    "help": "Custom key-value data attached to this booking.",
    "type": "dictionary",
    "label": "Custom Metadata",
    "required": false,
    "template": {
      "key": {
        "help": "Metadata key.",
        "type": "string",
        "placeholder": "source"
      },
      "value": {
        "help": "Metadata value.",
        "type": "string",
        "placeholder": "crm-automation"
      }
    },
    "visibilityCondition": "context.inputData.show_advanced === true"
  }
]
```

**API Configuration Perform Code**
```javascript
try {
  const data = context.inputData;

  const tzOffsets = {
    "Asia/Kolkata": 330, "America/New_York": -300, "America/Chicago": -360,
    "America/Denver": -420, "America/Los_Angeles": -480, "UTC": 0,
    "Europe/London": 0, "Europe/Berlin": 60, "Europe/Helsinki": 120,
    "Europe/Moscow": 180, "Asia/Dubai": 240, "Asia/Karachi": 300,
    "Asia/Dhaka": 360, "Asia/Bangkok": 420, "Asia/Singapore": 480,
    "Asia/Tokyo": 540, "Australia/Sydney": 600, "Australia/Adelaide": 570,
    "Australia/Perth": 480, "Pacific/Auckland": 720, "America/Sao_Paulo": -180,
    "America/Argentina/Buenos_Aires": -180, "America/Mexico_City": -360,
    "America/Toronto": -300, "America/Vancouver": -480, "Africa/Lagos": 60,
    "Africa/Nairobi": 180, "Africa/Johannesburg": 120
  };

  const offsetMinutes = tzOffsets[data.timeZone] ?? 0;

  const buildLocalISO = (utcMs) => {
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const absMin = Math.abs(offsetMinutes);
    const hh = String(Math.floor(absMin / 60)).padStart(2, "0");
    const mm = String(absMin % 60).padStart(2, "0");
    const offsetStr = `${sign}${hh}:${mm}`;
    const localMs = utcMs + offsetMinutes * 60000;
    const d = new Date(localMs);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}${offsetStr}`;
  };

  const resolveStartUtcMs = () => {
    if (data.date_selection_mode === true) {
      const [h, m] = data.start_time.split(":").map(Number);
      const d = new Date();
      d.setDate(d.getDate() + Number(data.start_no_of_days));
      const [year, month, day] = d.toISOString().split("T")[0].split("-").map(Number);
      return Date.UTC(year, month - 1, day, h, m, 0) - offsetMinutes * 60000;
    } else {
      const trimmed = data.start_date.trim();
      if (trimmed.includes("T")) return new Date(trimmed).getTime();
      const [datePart, timePart] = trimmed.split(" ");
      const [year, month, day] = datePart.split("-").map(Number);
      const [h, m] = timePart.split(":").map(Number);
      return Date.UTC(year, month - 1, day, h, m, 0) - offsetMinutes * 60000;
    }
  };

  const eventTypeId = Number(data.event_type);
  const scope = data.event_scope || "personal";
  const teamId = data.team_id ? Number(data.team_id) : null;

  const fetchUrl = scope === "team" && teamId
    ? `https://api.cal.id/teams/${teamId}/event-types/${eventTypeId}`
    : `https://api.cal.id/event-types/${eventTypeId}`;

  const eventTypeRes = await axios.request({
    method: "get",
    url: fetchUrl
  });

  const eventTypeData = eventTypeRes.data?.data;
  const eventDurationMinutes = eventTypeData?.length || 30;

  const startUtcMs = resolveStartUtcMs();
  const endUtcMs = startUtcMs + eventDurationMinutes * 60000;

  const start = buildLocalISO(startUtcMs);
  const end = buildLocalISO(endUtcMs);

  const guestList = data.guests
    ? data.guests.split(",").map(g => g.trim()).filter(Boolean)
    : [];

  const needsDetail = new Set(["attendeeInPerson", "somewhereElse", "attendeePhone", "userPhone"]);
  const locationValue = data.location_kind || "integrations:google:meet";

  const location = {
    value: locationValue,
    optionValue: needsDetail.has(locationValue) ? (data.location_detail || "") : ""
  };

  const responses = {
    name: data.attendee.name,
    email: data.attendee.email,
    location,
    guests: guestList
  };

  if (data.attendee.phone) responses.phone = data.attendee.phone;
  if (data.notes) responses.notes = data.notes;

  if (data.custom_booking_fields && typeof data.custom_booking_fields === "object") {
    Object.entries(data.custom_booking_fields).forEach(([safeKey, value]) => {
      if (!safeKey.startsWith("cf__")) return;
      const parts = safeKey.split("__");
      if (parts.length < 3) return;
      const originalName = parts.slice(2).join("__");
      if (value !== undefined && value !== null && value !== "") {
        responses[originalName] = value;
      }
    });
  }

  const payload = {
    eventTypeId,
    start,
    end,
    timeZone: data.timeZone,
    responses,
    language: data.language || "en",
    metadata: data.show_advanced === true && data.metadata ? data.metadata : {}
  };

  const response = await axios.request({
    method: "post",
    url: "https://api.cal.id/booking/",
    headers: { "Content-Type": "application/json" },
    data: payload
  });

  const apiData = response.data || {};
  const booking = apiData.data || {};

  return {
    success: apiData.success === undefined ? true : apiData.success,
    message: apiData.message || "",
    id: booking.id,
    uid: booking.uid,
    userId: booking.userId,
    status: booking.status,
    startTime: booking.startTime,
    endTime: booking.endTime,
    paymentRequired: booking.paymentRequired,
    isDryRun: booking.isDryRun,
    idempotencyKey: booking.idempotencyKey,
    userPrimaryEmail: booking.userPrimaryEmail,
    eventTypeId: booking.eventTypeId,
    title: booking.title,
    description: booking.description,
    customInputs: booking.customInputs,
    responses: booking.responses,
    location: booking.location,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    paid: booking.paid,
    destinationCalendarId: booking.destinationCalendarId,
    cancellationReason: booking.cancellationReason,
    rejectionReason: booking.rejectionReason,
    reassignReason: booking.reassignReason,
    reassignById: booking.reassignById,
    dynamicEventSlugRef: booking.dynamicEventSlugRef,
    dynamicGroupSlugRef: booking.dynamicGroupSlugRef,
    rescheduled: booking.rescheduled,
    fromReschedule: booking.fromReschedule,
    recurringEventId: booking.recurringEventId,
    smsReminderNumber: booking.smsReminderNumber,
    scheduledJobs: booking.scheduledJobs,
    metadata: booking.metadata,
    isRecorded: booking.isRecorded,
    iCalUID: booking.iCalUID,
    iCalSequence: booking.iCalSequence,
    rating: booking.rating,
    ratingFeedback: booking.ratingFeedback,
    noShowHost: booking.noShowHost,
    oneTimePassword: booking.oneTimePassword,
    cancelledBy: booking.cancelledBy,
    rescheduledBy: booking.rescheduledBy,
    creationSource: booking.creationSource,
    user: booking.user,
    attendees: booking.attendees,
    payment: booking.payment,
    references: booking.references,
    appsStatus: booking.appsStatus,
    luckyUsers: booking.luckyUsers,
    videoCallUrl: booking.videoCallUrl
  };

} catch (error) {
  throw error;
}
```

**UX Takeaways**
- **Relative Scheduling Options:** Provide a toggle between simple relative date entry ("Days from Today") and exact datetime inputs, doing UTC/timezone conversion internally in the perform code to keep scheduling simple.
- **Dynamic Questionnaire Loading via `fieldsGenerator`:** Use `fieldsGenerator` to retrieve custom booking questionnaire fields only after the Event Type has been selected, preventing empty or irrelevant fields from showing initially.
- **Hierarchical Dynamic Parent Options:** Scope the Event Types list to the selected event scope (Personal vs Team), requiring `team_id` only if Event Scope is "Team".

---

## Calendly — Create Booking

**Metadata**
- **App:** Calendly · **Category:** Scheduling · **Action:** Create Booking · **Action Type:** CREATE

**Supporting API Usage**
- **Get Current User API** (`GET /users/me`) — gets the user's URI and current organization to scope event types.
- **List Event Types API** (`GET /event_types`) — fetches available personal or organization event types.

**UX Components & Field Design**
- **Dropdown (Static) — Event Scope** — allows user to choose between personal event types and organization event types.
- **Dropdown (Dynamic) — Event Type** — dynamically lists event types based on the selected scope and user's organization.
- **String — Start Time (UTC)** — allows entering the booking time in UTC.
- **String — Invitee Full Name & Email** — invitee's contact details.
- **Dropdown — Invitee Timezone** — timezone for the invitee.

**Input Fields JSON**
```json
[
  {
    "key": "scope",
    "help": "Choose 'My Events' to view your personal events or 'All Organization Events' if you have admin access.",
    "type": "dropdown",
    "label": "Event Scope",
    "options": [
      {
        "label": "My Events (Personal)",
        "value": "personal"
      },
      {
        "label": "All Organization Events (Admin)",
        "value": "organization"
      }
    ],
    "required": true
  },
  {
    "key": "event_type",
    "type": "dropdown",
    "label": "Event Type",
    "required": true,
    "canPaginate": true,
    "customInputLabel": "Paste Event Type URI",
    "optionsGenerator": "try {\n  const user = await axios.get('https://api.calendly.com/users/me');\n  const u = user.data.resource;\n\n  let params = { active: true };\n\n  if (context.inputData.scope === 'organization') {\n    params.organization = u.current_organization;\n  } else {\n    params.user = u.uri;\n  }\n\n  const pageToken = context?.paginateData?.event_type || null;\n\n  const res = await axios.get('https://api.calendly.com/event_types', {\n    params: {\n      ...params,\n      count: 100,\n      page_token: pageToken\n    }\n  });\n\n  const collection = res.data.collection || [];\n\n  if (!collection.length) {\n    return {\n      data: [],\n      offset: null,\n      message: context.inputData.scope === 'organization'\n        ? 'No organization events found or insufficient permissions.'\n        : 'No personal events found. Please create an event in Calendly first.'\n    };\n  }\n\n  const data = collection.map(e => ({\n    label: e.name,\n    value: e.uri,\n    sample: e.uri\n  }));\n\n  return {\n    data,\n    offset: res.data.pagination?.next_page_token || null\n  };\n\n} catch (error) {\n  if (error.response?.status === 403) {\n    return {\n      data: [],\n      offset: null,\n      message: 'You do not have permission to view organization events. Switch to My Events.'\n    };\n  }\n  throw error;\n}",
    "customPlaceholder": "https://api.calendly.com/event_types/XXXXXXXX"
  },
  {
    "key": "start_time",
    "help": "Enter the meeting start time in UTC format (YYYY-MM-DDTHH:MM:SSZ). The time slot must be available on your Calendly calendar. Use the List Available Event Slots action to find valid time slots.",
    "type": "string",
    "label": "Start Time (UTC)",
    "required": true,
    "placeholder": "2026-04-25T10:00:00Z"
  },
  {
    "key": "invitee_name",
    "type": "string",
    "label": "Invitee Full Name",
    "required": true,
    "placeholder": "John Smith"
  },
  {
    "key": "invitee_email",
    "type": "string",
    "label": "Invitee Email",
    "required": true,
    "placeholder": "john.smith@company.com"
  },
  {
    "key": "invitee_timezone",
    "type": "dropdown",
    "label": "Invitee Timezone",
    "options": [
      {
        "label": "Asia/Kolkata (IST, UTC+5:30)",
        "value": "Asia/Kolkata"
      },
      {
        "label": "Asia/Dubai (GST, UTC+4)",
        "value": "Asia/Dubai"
      },
      {
        "label": "Asia/Singapore (SGT, UTC+8)",
        "value": "Asia/Singapore"
      },
      {
        "label": "Asia/Tokyo (JST, UTC+9)",
        "value": "Asia/Tokyo"
      },
      {
        "label": "Asia/Hong_Kong (HKT, UTC+8)",
        "value": "Asia/Hong_Kong"
      },
      {
        "label": "Asia/Bangkok (ICT, UTC+7)",
        "value": "Asia/Bangkok"
      },
      {
        "label": "Asia/Karachi (PKT, UTC+5)",
        "value": "Asia/Karachi"
      },
      {
        "label": "Asia/Dhaka (BST, UTC+6)",
        "value": "Asia/Dhaka"
      },
      {
        "label": "Asia/Riyadh (AST, UTC+3)",
        "value": "Asia/Riyadh"
      },
      {
        "label": "Asia/Jakarta (WIB, UTC+7)",
        "value": "Asia/Jakarta"
      },
      {
        "label": "Asia/Kuala_Lumpur (MYT, UTC+8)",
        "value": "Asia/Kuala_Lumpur"
      },
      {
        "label": "Asia/Seoul (KST, UTC+9)",
        "value": "Asia/Seoul"
      },
      {
        "label": "Asia/Taipei (CST, UTC+8)",
        "value": "Asia/Taipei"
      },
      {
        "label": "Asia/Colombo (SLST, UTC+5:30)",
        "value": "Asia/Colombo"
      },
      {
        "label": "Asia/Kathmandu (NPT, UTC+5:45)",
        "value": "Asia/Kathmandu"
      },
      {
        "label": "Asia/Tashkent (UZT, UTC+5)",
        "value": "Asia/Tashkent"
      },
      {
        "label": "Europe/London (GMT/BST, UTC+0/+1)",
        "value": "Europe/London"
      },
      {
        "label": "Europe/Berlin (CET/CEST, UTC+1/+2)",
        "value": "Europe/Berlin"
      },
      {
        "label": "Europe/Paris (CET/CEST, UTC+1/+2)",
        "value": "Europe/Paris"
      },
      {
        "label": "Europe/Madrid (CET/CEST, UTC+1/+2)",
        "value": "Europe/Madrid"
      },
      {
        "label": "Europe/Rome (CET/CEST, UTC+1/+2)",
        "value": "Europe/Rome"
      },
      {
        "label": "Europe/Amsterdam (CET/CEST, UTC+1/+2)",
        "value": "Europe/Amsterdam"
      },
      {
        "label": "Europe/Stockholm (CET/CEST, UTC+1/+2)",
        "value": "Europe/Stockholm"
      },
      {
        "label": "Europe/Moscow (MSK, UTC+3)",
        "value": "Europe/Moscow"
      },
      {
        "label": "Europe/Istanbul (TRT, UTC+3)",
        "value": "Europe/Istanbul"
      },
      {
        "label": "Europe/Zurich (CET/CEST, UTC+1/+2)",
        "value": "Europe/Zurich"
      },
      {
        "label": "Europe/Warsaw (CET/CEST, UTC+1/+2)",
        "value": "Europe/Warsaw"
      },
      {
        "label": "Europe/Lisbon (WET/WEST, UTC+0/+1)",
        "value": "Europe/Lisbon"
      },
      {
        "label": "America/New_York (EST/EDT, UTC-5/-4)",
        "value": "America/New_York"
      },
      {
        "label": "America/Chicago (CST/CDT, UTC-6/-5)",
        "value": "America/Chicago"
      },
      {
        "label": "America/Denver (MST/MDT, UTC-7/-6)",
        "value": "America/Denver"
      },
      {
        "label": "America/Los_Angeles (PST/PDT, UTC-8/-7)",
        "value": "America/Los_Angeles"
      },
      {
        "label": "America/Toronto (EST/EDT, UTC-5/-4)",
        "value": "America/Toronto"
      },
      {
        "label": "America/Vancouver (PST/PDT, UTC-8/-7)",
        "value": "America/Vancouver"
      },
      {
        "label": "America/Sao_Paulo (BRT, UTC-3)",
        "value": "America/Sao_Paulo"
      },
      {
        "label": "America/Mexico_City (CST/CDT, UTC-6/-5)",
        "value": "America/Mexico_City"
      }
    ],
    "required": true,
    "defaultValue": {
      "label": "Asia/Kolkata (IST, UTC+5:30)",
      "value": "Asia/Kolkata"
    },
    "customInputLabel": "Enter Timezone",
    "customPlaceholder": "Asia/Kolkata"
  }
]
```

**API Configuration Perform Code**
```javascript
try {
  const data = context.inputData;

  const payload = {
    event_type: data.event_type,
    start_time: data.start_time,
    invitee: {
      email: data.invitee_email,
      name: data.invitee_name,
      timezone: data.invitee_timezone
    }
  };

  const response = await axios.post('https://api.calendly.com/invitees', payload);
  const invitee = response.data?.resource || {};

  return invitee;
} catch (error) {
  await errorComponent(error);
}
```

**UX Takeaways**
- **Dynamic Endpoint Parameter Scoping:** Switch endpoint query parameters (Personal vs Organization) in optionsGenerator based on the Event Scope dropdown selection.
- **Dropdown with Custom Mapping Fallback:** Always provide standard dropdown options with custom Input fields for manual input fallback (e.g. for Event Type and Timezone).

---

## Sangam CRM — Insert or Update Data with Linking Module

- **Category:** Sales & CRM


https://documenter.getpostman.com/view/25213259/2s93RNxuis#d310844b-da65-4f03-83a3-168e46e0619e   
 

**API Usage**


- Module List API:   
  Fetches a list of modules enabled for integration, allowing the user to select the primary module and related module.   
   
- Field List API:   
  Retrieves all fields available for the selected module, including dropdown values for fields that support them. 

**UI Components**


1. Dropdown - Select Module Name:
   - Allows the user to select the primary module (e.g., Contacts, Accounts, Leads) from the list retrieved using the Module List API.   
   
2. Dynamic Multiselect Dropdown - Fields in Module:
   - Displays fields from the selected module, fetched using the Field List API.   
   - Users can select the fields they want to include.   
   - Default Fields: Email and Phone are pre-selected and included by default.   
   
3. Input Group - Selected Fields:
   - Dynamically renders input fields corresponding to the selected fields from the multiselect dropdown.   
   - Includes inputs for the default fields (Email and Phone).   
   
4. Boolean Toggle - Create or Link Related Module:
   - Option 1: Create New Related Module:   
     Displays a dropdown to select the related module and multiselect fields from the related module for data input.   
   - Option 2: Link Existing Related Module:   
     Displays a dropdown to select the related module, allowing the user to establish a relationship with an existing record. 

**Input Fields JSON**

```json
[
  {
    "key": "main_module",
    "help": "Select the module in which you want to insert the record.",
    "type": "dropdown",
    "label": "Select Main Module",
    "required": true,
    "optionsGenerator": "async function fetchModules() {\\n const config = {\\n method: 'post',\\n url: `${context.authData.subdomain}/api/v1/modulelist`,\\n headers: {\\n 'Content-Type': 'application/json',\\n Accept: 'application/json',\\n \"Authorization\": `Bearer ${context?.authData?.apitoken}`\\n }\\n };\\n try {\\n const response = await axios.request(config);\\n return response.data.module_list.map(module => ({\\n label: module,\\n value: module\\n }));\\n } catch (error) {\\n throw error\\n }\\n}\\n\\nreturn await fetchModules();"
  },
  {
    "key": "main_module_fields",
    "help": "Select the fields of the main module you want to insert.",
    "type": "multiselect",
    "label": "Main Module Fields",
    "required": true,
    "optionsGenerator": "async function fetchFields() {\\n const data = JSON.stringify({ module_name: context.inputData.main_module });\\n const config = {\\n method: 'post',\\n maxBodyLength: Infinity,\\n url: `${context.authData.subdomain}/api/v1/fieldlist`,\\n headers: {\\n 'Content-Type': 'application/json',\\n Accept: 'application/json',\\n \"Authorization\": `Bearer ${context?.authData?.apitoken}`\\n },\\n data: data\\n };\\n\\n try {\\n const response = await axios.request(config);\\n \\n // Filter out the key 'address' from the field list\\n const fields = Object.entries(response.data.field_list || {})\\n .filter(([key]) => key !== 'address') // Remove 'address' key\\n .map(([key, value]) => ({\\n label: value.display_name || key,\\n value: key\\n }));\\n \\n return fields;\\n } catch (error) {\\n throw error\\n }\\n}\\n\\nreturn await fetchFields();\\n"
  },
  {
    "key": "main_module_field_inputs",
    "help": "Provide values for the fields you selected for the main module.",
    "type": "input groups",
    "label": "Main Module Field Values",
    "fieldsGenerator": "async function fetchSelectedFields() {\\n const selectedFields = context?.inputData?.main_module_fields || [];\\n const mandatoryFields = [\"phone\", \"email\"];\\n const allFields = Array.from(new Set([...selectedFields, ...mandatoryFields]));\\n\\n const data = JSON.stringify({ module_name: context?.inputData?.main_module });\\n const config = {\\n method: 'post',\\n maxBodyLength: Infinity,\\n url: `${context.authData.subdomain}/api/v1/fieldlist`,\\n headers: {\\n 'Content-Type': 'application/json',\\n Accept: 'application/json',\\n \"Authorization\": `Bearer ${context?.authData?.apitoken}`\\n },\\n data: data\\n };\\n try {\\n const response = await axios.request(config);\\n return Object.entries(response.data.field_list || {})\\n .filter(([key]) => allFields.includes(key))\\n .map(([key, value]) => {\\n if (value.options) {\\n return {\\n key: key,\\n label: value.display_name || key,\\n type: 'dropdown',\\n required: mandatoryFields.includes(key),\\n options: Object.entries(value.options).map(([val, label]) => ({ label, value: val }))\\n };\\n } else {\\n return {\\n key: key,\\n label: value.display_name || key,\\n type: 'string',\\n required: mandatoryFields.includes(key)\\n };\\n }\\n });\\n } catch (error) {\\n throw error\\n }\\n}\\n\\nreturn await fetchSelectedFields();"
  },
  {
    "key": "create_new_related_module",
    "help": "Do you want to create a new related module or link an existing one?",
    "type": "boolean",
    "label": "Create or Link to existing",
    "options": [
      {
        "label": "Create New",
        "value": true
      },
      {
        "label": "Link to Existing ",
        "value": false
      }
    ],
    "required": true
  },
  {
    "key": "related_modules",
    "help": "Select the related modules you want to link.",
    "type": "multiselect",
    "label": "Select Related Modules",
    "required": false,
    "optionsGenerator": "async function fetchModules() {\\n const config = {\\n method: 'post',\\n url: `${context.authData.subdomain}/api/v1/modulelist`,\\n headers: {\\n 'Content-Type': 'application/json',\\n Accept: 'application/json',\\n \"Authorization\": `Bearer ${context?.authData?.apitoken}`\\n }\\n };\\n try {\\n const response = await axios.request(config);\\n return response.data.module_list.map(module => ({\\n label: module,\\n value: module\\n }));\\n } catch (error) {\\n throw error\\n }\\n}\\n\\nreturn await fetchModules();",
    "visibilityCondition": "context.inputData.create_new_related_module === true || context.inputData.create_new_related_module === false "
  },
  {
    "key": "related_module_fields",
    "help": "Select the fields for each related module you want to insert.",
    "type": "multiselect",
    "label": "Fields for Related Modules",
    "optionsGenerator": "async function fetchFields() {\\\\n const selectedModules = context.inputData.related\_modules || \[\];\\\\n\\\\n const fetchFieldsForModule = async (module) =\> {\\\\n const data = JSON.stringify({ module\_name: module });\\\\n const config = {\\\\n method: 'post',\\\\n maxBodyLength: Infinity,\\\\n url: \`{context.authData.subdomain}/api/v1/fieldlist\`,\\\\n headers: {\\\\n 'Content-Type': 'application/json',\\\\n Accept: 'application/json',\\\\n \\\"Authorization\\\": \`Bearer ${context?.authData?.apitoken}\`\\\\n },\\\\n data: data\\\\n };\\\\n\\\\n try {\\\\n const response = await axios.request(config);\\\\n \\\\n // Filter out the 'address' field from the list\\\\n return Object.entries(response.data.field\_list || {})\\\\n .filter((\[key\]) =\> key \!== 'address') // Remove 'address' field\\\\n .map((\[key, value\]) =\> ({\\\\n label: \` {module} - {value.display\_name || key}\`,\\\\n value: \` {module}:${key}\`\\\\n }));\\\\n } catch (error) {\\\\n throw error\\\\n }\\\\n };\\\\n\\\\n // Fetch fields for all selected modules\\\\n const allFields = await Promise.all(selectedModules.map(fetchFieldsForModule));\\\\n\\\\n // Flatten the array of fields for all modules and return\\\\n return allFields.flat();\\\\n}\\\\n\\\\nreturn await fetchFields();\\\\n",
    "visibilityCondition": "context.inputData.create_new_related_module === true"
  },
  {
    "key": "related_module_field_inputs",
    "help": "Provide values for the fields you selected for related modules.",
    "type": "input groups",
    "label": "Related Module Field Values",
    "fieldsGenerator": "async function generateRelatedFieldInputs() {\\n const selectedFields = context.inputData.related_module_fields || [];\\n const mandatoryFields = [\"phone\", \"email\"];\\n \\n // Step 1: Group fields by module\\n const fieldsByModule = selectedFields.reduce((acc, field) => {\\n const [module, fieldName] = field.split(':');\\n if (!acc[module]) acc[module] = [];\\n acc[module].push(fieldName);\\n return acc;\\n }, {});\\n\\n // Step 2: Create input groups\\n const inputGroups = await Promise.all(\\n Object.entries(fieldsByModule).map(async ([module, fields]) => {\\n // Remove duplicates from fields\\n const uniqueFields = Array.from(new Set(fields));\\n\\n const fieldInputs = await Promise.all(\\n uniqueFields.map(async (field) => {\\n // Fetch the field's details (e.g., options for dropdown)\\n const data = JSON.stringify({ module_name: module });\\n const config = {\\n method: 'post',\\n maxBodyLength: Infinity,\\n url: `${context.authData.subdomain}/api/v1/fieldlist`,\\n headers: {\\n 'Content-Type': 'application/json',\\n Accept: 'application/json',\\n \"Authorization\": `Bearer ${context?.authData?.apitoken}`\\n },\\n data: data\\n };\\n\\n let fieldData = {};\\n try {\\n const response = await axios.request(config);\\n fieldData = response.data.field_list ? response.data.field_list[field] : {};\\n } catch (error) {\\n console.error(`Error fetching field details for ${field} in module ${module}:`, error);\\n }\\n\\n // If field has options, create a dropdown\\n if (fieldData.options) {\\n return {\\n key: field,\\n label: fieldData.display_name || field,\\n type: 'dropdown',\\n required: mandatoryFields.includes(field),\\n options: Object.entries(fieldData.options).map(([val, label]) => ({\\n label,\\n value: val\\n }))\\n };\\n } else {\\n // Otherwise, it's a string type input\\n return {\\n key: field,\\n label: fieldData.display_name || field,\\n type: 'string',\\n required: mandatoryFields.includes(field)\\n };\\n }\\n })\\n );\\n\\n return {\\n key: module,\\n label: module,\\n type: 'input groups',\\n fields: fieldInputs\\n };\\n })\\n );\\n\\n return inputGroups;\\n}\\n\\nreturn await generateRelatedFieldInputs();\\n",
    "visibilityCondition": "context.inputData.create_new_related_module === true && context.inputData.related_modules && context.inputData.related_modules.length > 0"
  }
]
```

**API Configuration Perform Code**

```javascript
async function buildAndSendPayload(context) {  
   
// Step 1: Main Module Fields    
const mainModule = context.inputData.main_module;    
const mainModuleFields = context.inputData.main_module_fields || [];    
const mainModuleFieldInputs = context.inputData.main_module_field_inputs || {};

// Ensure phone and email are included in the main module    
const mandatoryFields = ["phone", "email"];    
mandatoryFields.forEach(field => {    
    if (!mainModuleFields.includes(field)) {    
        mainModuleFields.push(field);    
    }    
});

// Build the main module field list for the API    
const fieldNameList = {};    
mainModuleFields.forEach(field => {    
    fieldNameList[field] = mainModuleFieldInputs[field] || null;    
});

// Step 2: Related Modules    
const relatedModules = context.inputData.related_modules || [];    
const createNewRelatedModule = context.inputData.create_new_related_module;    
const relatedModuleFields = context.inputData.related_module_fields || [];    
const relatedModuleFieldInputs = context.inputData.related_module_field_inputs || {};

// Build the related models    
const relatedModels = [];    
for (let module of relatedModules) {    
    let relatedModel = {};    
    let attach = [];

    // Construct the related module name: 'contact_lead'    
    const relatedModuleName = `${module.toLowerCase()}_${mainModule.toLowerCase()}`;

    // Add attach fields (phone, email)    
    relatedModel[relatedModuleName] = [{    
        attach: [{    
            phone: mainModuleFieldInputs.phone,    
            email: mainModuleFieldInputs.email    
        }],    
        data: []  // Default empty data array    
    }];

    // If creating a new related module, add the related fields' values to the data array    
    if (createNewRelatedModule) {    
        const data = relatedModuleFieldInputs[module] || {};    
        // Ensure the data isn't empty before pushing    
        if (Object.keys(data).length > 0\) {    
            relatedModel[relatedModuleName][0].data.push(data);    
        }    
    }

    relatedModels.push(relatedModel);    
}

// Step 3: Construct the Payload    
const payload = {    
    module_name: mainModule,    
    field_name_list: fieldNameList,    
    related_models: relatedModels    
};

// Step 4: Send the Request    
try {    
    const response = await axios.post(`${context.authData.subdomain}/api/v1/save-data`, payload, {    
        headers: {    
            'Content-Type': 'application/json',    
            'Accept': 'application/json',    
            "Authorization": `Bearer ${context?.authData?.apitoken}`    
        }    
    });

    // Return the API response    
    return response.data;    
} catch (error) {    
   await errorComponent(error);  
}  
}  
return await buildAndSendPayload(context);
```

## Razorpay — Create New Invoice

- **Category:** Finance & Billing


https://razorpay.com/docs/api/payments/invoices/create-with-details   
 

**API Usage**


No API Usage:   
This action does not require additional API usage beyond creating the invoice with the collected customer details. 

**UI Components**


Input Field - Description: 

A text field where the user can enter the description for the invoice. 

Boolean - Partial Payment: 

A toggle or checkbox to indicate whether the invoice supports partial payment. 

Input Group - Customer Details: 

Name: A text field for entering the customer's name. 

Contact: A text field for entering the customer's contact number. 

Email: A text field for entering the customer's email address. 

Input Group - Billing Address: 

Line1: A text field for entering the first line of the billing address. 

Line2: A text field for entering the second line of the billing address. 

Zipcode: A text field for entering the billing address's postal code. 

City: A text field for entering the billing city. 

State: A text field for entering the billing state. 

Country: A text field for entering the billing country. 

Boolean - Same Billing and Shipping Address: 

A checkbox to indicate whether the shipping address is the same as the billing address. 

Input Group - Shipping Address: 

Line1: A text field for entering the first line of the shipping address. 

Line2: A text field for entering the second line of the shipping address. 

Zipcode: A text field for entering the shipping address's postal code. 

City: A text field for entering the shipping city. 

State: A text field for entering the shipping state. 

Country: A text field for entering the shipping country. 

Input Group - Line Items: 

Name: A text field for entering the item name (e.g., "Master Cloud Computing in 30 Days"). 

Description: A text field for entering the item description. 

Amount: A text field for entering the price of the item. 

Currency: A text field for entering the currency type (e.g., "USD"). 

Quantity: A text field for entering the quantity of the item. 

Boolean - SMS Notification: 

A toggle or checkbox to indicate whether the invoice should trigger an SMS notification. 

Boolean - Email Notification: 

A toggle or checkbox to indicate whether the invoice should trigger an email notification. 

Dropdown - Currency: 

A dropdown to select the currency for the invoice. 

Dropdown - Expiry Date: 

A dropdown to select the invoice expiry period (e.g., 1 day, 7 days, 15 days). 

The system uses Unix timestamp logic to calculate the expiry date. 

Input Field - Notes: 

A text field for entering any additional notes related to the invoice. 

**API Flow**


Set Invoice Type: 

The "Type" is passed as a hardcoded value of "invoice" in the Perform API. 

Collect Customer Details: 

The system collects customer details through form inputs (e.g., name, email, contact) to include in the invoice. 

Set Billing and Shipping Address: 

The system checks if the billing and shipping addresses are the same. If not, it collects separate shipping address details. 

Add Line Items: 

The system collects line item details such as item name, description, amount, currency, and quantity. 

Set Expiry Date: 

The system sets the expiry date based on the selected option (1 day, 7 days, 15 days) using Unix timestamp logic in the Perform API. 

Enable Notifications: 

Based on the user selections, the system sends SMS and/or email notifications for the invoice. 

Return Invoice Details: 

Once the invoice is created, the system returns the invoice ID, URL, and other relevant details. 

**Input Fields JSON**

```json
[
  {
    "key": "use_customer_id",
    "help": "Choose whether to use an existing Customer ID or enter new customer details.",
    "type": "boolean",
    "label": "Generate invoice with?",
    "options": [
      {
        "label": "Use Customer ID",
        "value": true
      },
      {
        "label": "Use Customer Details",
        "value": false
      }
    ],
    "required": true,
    "defaultValue": {
      "label": "Use Customer Details",
      "value": false
    }
  },
  {
    "key": "customer_id",
    "help": "Enter the existing Razorpay Customer ID.",
    "type": "string",
    "label": "Customer ID",
    "required": true,
    "placeholder": "cust_E7q0trFqXgExmT",
    "visibilityCondition": "context.inputData.use_customer_id === true"
  },
  {
    "key": "customer",
    "help": "Provide the customer's details.",
    "type": "input groups",
    "label": "Customer Details",
    "required": true,
    "visibilityCondition": "context.inputData.use_customer_id === false",
    "fields": [
      {
        "key": "name",
        "help": "Enter the customer's full name (3-50 characters, alphabets, periods, apostrophes, and parentheses allowed).",
        "type": "string",
        "label": "Customer Name",
        "required": true,
        "placeholder": "John Doe"
      },
      {
        "key": "contact",
        "help": "Enter the customer's contact number including country code (max 15 characters).",
        "type": "string",
        "label": "Contact Number",
        "required": true,
        "placeholder": "+919000090000"
      },
      {
        "key": "email",
        "help": "Enter the customer's email address (max 64 characters).",
        "type": "string",
        "label": "Email Address",
        "required": true,
        "placeholder": "john.doe@example.com"
      }
    ]
  },
  {
    "key": "description",
    "help": "Enter a brief description for the invoice (max 2048 characters).",
    "type": "string",
    "label": "Invoice Description",
    "required": false,
    "placeholder": "Invoice for Web Development Services"
  },
  {
    "key": "expire_by_days",
    "help": "Enter the number of days after which the invoice should expire.",
    "type": "number",
    "label": "Expiry (in days)",
    "required": true,
    "placeholder": "30 for 30 days",
    "defaultValue": "120"
  },
  {
    "key": "billing_address",
    "help": "Provide the customer's billing address.",
    "type": "input groups",
    "label": "Billing Address",
    "required": true,
    "fields": [
      {
        "key": "line1",
        "help": "Enter the first line of the billing address.",
        "type": "string",
        "label": "Street Address Line 1",
        "required": true
      },
      {
        "key": "line2",
        "help": "Enter the second line of the billing address (optional).",
        "type": "string",
        "label": "Street Address Line 2",
        "required": false
      },
      {
        "key": "zipcode",
        "help": "Enter the postal code.",
        "type": "string",
        "label": "Zipcode",
        "required": true
      },
      {
        "key": "city",
        "help": "Enter the city name.",
        "type": "string",
        "label": "City",
        "required": true
      },
      {
        "key": "state",
        "help": "Enter the state or province.",
        "type": "string",
        "label": "State",
        "required": true
      },
      {
        "key": "country",
        "help": "IN",
        "type": "string",
        "label": "Country Code",
        "required": true,
        "placeholder": "IN"
      }
    ]
  },
  {
    "key": "same_as_billing",
    "help": "Is the shipping address the same as the billing address?",
    "type": "boolean",
    "label": "Billing Address Same as Shipping?",
    "options": [
      {
        "label": "Yes",
        "value": true
      },
      {
        "label": "No",
        "value": false
      }
    ],
    "required": true,
    "defaultValue": {
      "label": "Yes",
      "value": true
    }
  },
  {
    "key": "shipping_address",
    "help": "Provide the customer's shipping address.",
    "type": "input groups",
    "label": "Shipping Address",
    "required": false,
    "visibilityCondition": "context.inputData.same_as_billing === false",
    "fields": [
      {
        "key": "line1",
        "help": "Enter the first line of the shipping address.",
        "type": "string",
        "label": "Street Address Line 1",
        "required": true
      },
      {
        "key": "line2",
        "help": "Enter the second line of the shipping address (optional).",
        "type": "string",
        "label": "Street Address Line 2",
        "required": false
      },
      {
        "key": "zipcode",
        "help": "Enter the postal code.",
        "type": "string",
        "label": "Zipcode",
        "required": true
      },
      {
        "key": "city",
        "help": "Enter the city name.",
        "type": "string",
        "label": "City",
        "required": true
      },
      {
        "key": "state",
        "help": "Enter the state or province.",
        "type": "string",
        "label": "State",
        "required": true
      },
      {
        "key": "country",
        "help": "Enter the country code (e.g., 'IN' for India).",
        "type": "string",
        "label": "Country",
        "required": true
      }
    ]
  },
  {
    "key": "line_items",
    "help": "Add items to be billed in this invoice. Maximum 50 items.",
    "type": "input groups",
    "label": "Invoice Items",
    "required": true,
    "fields": [
      {
        "key": "name",
        "help": "Enter the name of the item.",
        "type": "string",
        "label": "Item Name",
        "required": true,
        "placeholder": "Website Development Service"
      },
      {
        "key": "description",
        "help": "Enter a brief description of the item (optional).",
        "type": "string",
        "label": "Item Description",
        "required": false,
        "placeholder": "Monthly subscription for cloud hosting"
      },
      {
        "key": "amount",
        "help": "Enter the price of the item in the smallest currency unit (e.g., 50000 for \u20b9500.00).",
        "type": "number",
        "label": "Amount (in smallest currency unit)",
        "required": true,
        "placeholder": "50000"
      },
      {
        "key": "currency",
        "help": "Select the currency for this item (must match invoice currency).",
        "type": "dropdown",
        "label": "Item Currency",
        "required": true,
        "optionsGenerator": "async function fetchCurrencies() { const response = await axios.get('https://flow.sokt.io/func/scriRLSAg3B3'); return response.data.map(currency => ({ label: currency.name, value: currency.value, sample: currency.value })); } return await fetchCurrencies();"
      },
      {
        "key": "quantity",
        "help": "Enter the quantity of this item.",
        "type": "number",
        "label": "Quantity",
        "required": true,
        "placeholder": "2"
      }
    ]
  },
  {
    "key": "currency",
    "help": "Select the currency for the invoice (must match line items).",
    "type": "dropdown",
    "label": "Currency",
    "required": true,
    "optionsGenerator": "async function fetchCurrencies() { const response = await axios.get('https://flow.sokt.io/func/scriRLSAg3B3'); return response.data.map(currency => ({ label: currency.name, value: currency.value, sample: currency.value })); } return await fetchCurrencies();"
  },
  {
    "key": "partial_payment",
    "help": "Enable this to allow partial payments.",
    "type": "boolean",
    "label": "Allow Partial Payment",
    "options": [
      {
        "label": "Yes",
        "value": true
      },
      {
        "label": "No",
        "value": false
      }
    ],
    "required": false,
    "defaultValue": {
      "label": "No",
      "value": false
    }
  }
]
```


**API Configuration Perform Code**

```javascript
async function createInvoice() {

 const inputData = context.inputData;

// Convert expire_by_days to UNIX timestamp  
   
 const expireBy = Math.floor(Date.now() / 1000) + inputData.expire_by_days * 86400;

// Construct customer object based on user selection  
   
 const customerData = inputData.use_customer_id  
 ? { customer_id: inputData.customer_id }  
 : {  
 customer: {  
 name: inputData.customer.name,  
 contact: inputData.customer.contact,  
 email: inputData.customer.email,  
 billing_address: inputData.billing_address,  
 shipping_address: inputData.same_as_billing ? undefined : inputData.shipping_address  
 }  
 };

// Construct request payload dynamically

 const invoiceData = {  
 type: "invoice",  
 description: inputData.description,  
 expire_by: expireBy,  
 currency: inputData.currency,  
 ...customerData, // Add either customer_id or full customer details  
 line_items: Array.isArray(inputData.line_items) ? inputData.line_items : [inputData.line_items],  
 partial_payment: inputData.partial_payment  
 };

// Remove undefined or empty values to prevent "extra fields sent" error

 const cleanPayload = JSON.parse(JSON.stringify(invoiceData));  
try {  
 const response = await axios.post('https://api.razorpay.com/v1/invoices', cleanPayload, {  
 headers: {  
 'Content-Type': 'application/json'  
 }  
 });  
return response.data;  
} catch (error) {  
 await errorComponent(error);   
 }  
 }  
return createInvoice();
```

## Google Sheet — Add New Row to Sheet

**Metadata**
- **App:** Google Sheets
- **Category:** Spreadsheets / Data Storage
- **Action:** Add New Row to Sheet
- **Action Type:** CREATE

**UX Components & Field Design**

| Field | Type | Key | Purpose |
|---|---|---|---|
| Spreadsheet | dropdown (paginated, searchable) | `spreadsheet_Id` | Dynamic lookup with pagination and search |
| Sheet | dropdown | `grid_Id` | Dependent on selected spreadsheet |
| Does your first row contain column name? | boolean | `column_key` | Determines header mode (name vs letter) |
| Columns | multiselect | `column_selected` | Field chooser — user picks which columns to fill |
| Column Values | input groups (fieldsGenerator) | `column_name` | Dynamic fields generated based on selected columns |

**Key UX Patterns**
- **Paginated + searchable dropdown**: `canPaginate: true` and `enableSearchApi: true` for spreadsheet selector
- **Cascading dependency**: Sheet depends on Spreadsheet, Columns depend on Sheet
- **Field chooser → dynamic input groups**: User selects columns first, then fieldsGenerator creates matching input fields
- **Duplicate column handling**: Columns with same name get letter suffix (e.g., `Status--D`)

**Input Fields JSON**

```json
[
  {
    "key": "spreadsheet_Id",
    "help": "Select or enter the ID of the spreadsheet.",
    "type": "dropdown",
    "label": "Spreadsheet",
    "required": true,
    "customHelp": "You will find the Spreadsheet ID on the spreadsheet URL https://docs.google.com/spreadsheets/d/{spreadsheet_Id}/ or you can use the action like search spreadsheet or list spreadsheet.",
    "canPaginate": true,
    "placeholder": "Choose Spreadsheet",
    "enableSearchApi": true,
    "customInputLabel": "Enter Spreadsheet ID",
    "optionsGenerator": "try{\n  const pageToken = context?.paginateData?.['spreadsheet_Id']\n  const searchText = __searchText\n  const pageSize = 1000;\n  return await fetchSpreadsheets(pageToken,searchText,pageSize) \n}catch(e){\n  throw e;\n}",
    "customPlaceholder": "1PBtrnuRN_xfmilW79NgD70Z3Z0NsGs5*****"
  },
  {
    "key": "grid_Id",
    "help": "Select the Sheet or Enter Sheet ID.",
    "type": "dropdown",
    "label": "Sheet",
    "required": true,
    "customHelp": "You will find the sheet ID on the spreadsheet URL gid=, or you can use the action like search sheet or list sheet.",
    "placeholder": "Choose Sheet",
    "customInputLabel": "Enter Sheet ID",
    "optionsGenerator": "try{\n  const spreadsheet_Id = context?.inputData?.spreadsheet_Id;\nreturn await fetchSheetsWithID(spreadsheet_Id);\n}catch(e){\nthrow e;\n}",
    "customPlaceholder": "38470421"
  },
  {
    "key": "column_key",
    "help": "Determines how the data columns are labelled.",
    "type": "boolean",
    "label": "Does your first row contain column name?",
    "options": [
      { "label": "Yes", "value": true },
      { "label": "No", "value": false }
    ],
    "required": true,
    "customHelp": "Enter \"true\" if the first row contains the column name, else \"false\".",
    "placeholder": "Choose Option",
    "defaultValue": { "label": "Yes", "value": true },
    "customPlaceholder": "true ",
    "visibilityCondition": "context?.inputData?.spreadsheet_Id && context?.inputData?.grid_Id"
  },
  {
    "key": "column_selected",
    "help": "Select the columns for entering the values.",
    "type": "multiselect",
    "label": "Columns",
    "required": true,
    "placeholder": "Select Columns to Insert Data",
    "customInputLabel": "Enter Column name in array.",
    "optionsGenerator": "const spreadsheet_Id = context?.inputData?.spreadsheet_Id;\nconst sheetIdentifier = context?.inputData?.grid_Id;\nconst column_key = context?.inputData?.column_key ?? true;\n\nreturn await fetchSheetColumns(spreadsheet_Id, sheetIdentifier, column_key);",
    "customPlaceholder": " [\"Title\", \"Status\"]"
  },
  {
    "key": "column_name",
    "help": "Enter the Column Values.",
    "type": "input groups",
    "label": "Column Values",
    "required": true,
    "fieldsGenerator": "<see full fieldsGenerator in source>"
  }
]
```

**UX Takeaways**
- Field chooser (multiselect columns) + fieldsGenerator is the gold standard for sheet-like actions
- Paginated and searchable dropdowns are critical for large datasets (thousands of spreadsheets)
- Boolean toggle for header mode adapts the entire downstream UX

---

## viaSocket Table — Add Records To Table

**Metadata**
- **App:** viaSocket Table
- **Category:** Database / Data Storage
- **Action:** Add Records To Table
- **Action Type:** CREATE

**UX Components & Field Design**

| Field | Type | Key | Purpose |
|---|---|---|---|
| Table | dropdown | `table` | Dynamic table list with extraValue for attachment detection |
| Add Records Mode | boolean | `bulkAdd` | Single vs bulk record toggle |
| Want to set lookup configuration | boolean | `includeLookupFields` | Advanced: show link/lookup fields |
| Select Fields to Fill | multiselect | `selectedFields` | Field chooser for single mode |
| Allow adding new Dropdown Options | boolean | `addMissingOptions` | Auto-create missing dropdown options |
| Records (JSON Array) | string | `records` | Bulk mode: raw JSON input |
| Field Reference | help (dynamic) | `field_reference` | Bulk mode: auto-generated field guide |
| with Fields | input groups (fieldsGenerator) | `field` | Single mode: dynamic fields from selection |
| Attachments | input groups | `attachment_config` | Conditional on table having attachment columns |

**Key UX Patterns**
- **Mode toggle**: Boolean `bulkAdd` splits UX into single (field chooser + generator) vs bulk (JSON array + reference guide)
- **extraValue on dropdown**: Table dropdown includes `extraValue` to detect attachment/link columns without extra API calls
- **Help field with dynamic source**: `field_reference` generates a complete field guide for bulk JSON input
- **Attachment handling**: Separate `attachment_config` group with upload mode (URL vs Base64)

**UX Takeaways**
- Dual-mode (single/bulk) in one action avoids creating two separate actions
- `extraValue` on dropdown options is a powerful pattern to carry metadata without extra API calls
- Dynamic help fields (`type: "help"` with `source`) guide users through complex inputs like JSON arrays

---

## Keka — Add a New Employee

**Metadata**
- **App:** Keka
- **Category:** HR / Employee Management
- **Action:** Add a New Employee
- **Action Type:** CREATE

**UX Components & Field Design**

| Field | Type | Key | Purpose |
|---|---|---|---|
| Employee Core Information | input groups | `employeeCoreInformation` | Required fields: name, gender, email, phone, DOB, join date, department, job title, location |
| Select Additional Details | multiselect | `additionalFields` | Section chooser: basicInfo, workInfo, contactDetails, jobdetails, bankd, salary |
| Basic Information | input groups | `basicInformation` | Employee number, blood group, nationality, marital status |
| Work Information | input groups | `workInformation` | Professional summary, business unit, legal entity |
| Contact Details | input groups | `contactDetails` | Personal email, phones, addresses (current + permanent) |
| Salary details | input groups | `salary` | Salary structure, amount, effective date, optional bonus |
| Financial Details | input groups | `financialDetails` | Payment mode, bank details (conditional on bank transfer) |
| Job details | input groups | `jobdetails` | Second-level section chooser for reporting, employment, schedule, attendance, leave, compensation |

**Key UX Patterns**
- **Two-level section chooser**: Top-level `additionalFields` multiselect reveals sections, then `jobSections` within `jobdetails` adds another level
- **Core vs optional separation**: Mandatory fields in one group, everything else behind a field chooser
- **Enum dropdowns with custom input**: Gender, blood group, marital status all support both dropdown selection and manual numeric/text entry with `customInputLabel` and `customPlaceholder`
- **Address copy toggle**: `isCurrentAddressSameAsPermanent` boolean avoids duplicate address entry
- **Conditional bank details**: Bank fields appear only when payment mode is "Bank Transfer"
- **Cascading job details**: Department → Job Title dependency, contingent type appears only for contingent workers

**UX Takeaways**
- Complex entity creation (employee with 50+ possible fields) is best managed with section choosers
- Two-level section choosers prevent overwhelming users even with extremely large forms
- Core information should always be visible; optional sections should default to commonly needed ones
- Enum fields should support both dropdown selection AND manual entry for automation flexibility
- Address patterns (current/permanent with copy toggle) are reusable across many HR/CRM actions


---

## Freshsales classic — Create Deal

**Metadata**
- **App:** Freshsales classic
- **Category:** Marketing, Sales & CRM
- **Action:** Create Deal
- **Action Type:** CREATE

**UX Components & Field Design**
- `name` & `amount`: Essential fields for the deal.
- `account_name`: Text field that auto-resolves to an existing account ID or creates one behind the scenes in the perform code.
- `contact_email` & `contact_name`: Secondary matching criteria to attach or create a contact to the deal seamlessly.
- `deal_stage_id`: Dynamically loaded from Freshsales API.
- `close_date_type`, `close_date_days`, `close_date_specific`: A smart pattern allowing the user to either define "Days from today" (relative) or a specific absolute date (conditional inputs).
- `select_additional_fields` & `additional_field_values`: A dynamic field generator pattern where selecting field names dynamically renders the exact input schemas (text, dropdown, dates) based on the CRM's custom field settings.

**Input Fields JSON**
```json
[
  {
    "key": "name",
    "type": "string",
    "label": "Deal Name",
    "required": true,
    "placeholder": "Gold Plan - Widgetz.io"
  },
  {
    "key": "amount",
    "type": "number",
    "label": "Deal Value",
    "required": true,
    "placeholder": "25000"
  },
  {
    "key": "account_name",
    "help": "Enter the account name to associate with this deal. If the account exists, it will be linked. If not, a new account will be created automatically.",
    "type": "string",
    "label": "Related Account",
    "required": true,
    "placeholder": "Widgetz.io"
  },
  {
    "key": "contact_email",
    "help": "Enter the email address of the contact to associate with this deal. If a matching contact exists, it will be linked. If not, a new contact will be created automatically.",
    "type": "string",
    "label": "Related Contact (Email)",
    "required": false,
    "placeholder": "jane@widgetz.io"
  },
  {
    "key": "contact_name",
    "help": "Enter the contact's name. Only used if a new contact needs to be created (i.e., no existing contact matches the email above).",
    "type": "string",
    "label": "Contact Name",
    "required": false,
    "placeholder": "Jane Doe"
  },
  {
    "key": "deal_stage_id",
    "help": "Select the current stage of this deal in the sales pipeline.",
    "type": "dropdown",
    "label": "Deal Stage",
    "required": false,
    "customHelp": "Enter the deal stage ID manually. You can get it from actions like List Deal Fields.",
    "placeholder": "Select deal stage",
    "customInputLabel": "Deal Stage ID",
    "optionsGenerator": "return await deal_stage(context?.authData?.subDomain)",
    "customPlaceholder": "402001850685"
  },
  {
    "key": "close_date_type",
    "help": "Select how you want to set the expected close date for this deal.",
    "type": "boolean",
    "label": "Expected Close Date",
    "options": [
      {
        "label": "Days from today",
        "value": true
      },
      {
        "label": "Specific date",
        "value": false
      }
    ],
    "required": false,
    "customHelp": "Enter true for days from today and false for a specific date.",
    "defaultValue": {
      "label": "Days from today",
      "value": true
    },
    "customInputLabel": "Expected Close Date Type",
    "customPlaceholder": "true"
  },
  {
    "key": "close_date_days",
    "help": "Enter the number of days from today when this deal is expected to close. For example, 30 means 30 days from now.",
    "type": "number",
    "label": "Days from Today",
    "required": false,
    "placeholder": "30",
    "visibilityCondition": "context.inputData.close_date_type === true"
  },
  {
    "key": "close_date_specific",
    "help": "Enter the exact expected close date in YYYY-MM-DD format.",
    "type": "string",
    "label": "Close Date",
    "required": false,
    "placeholder": "2026-04-15",
    "visibilityCondition": "context.inputData.close_date_type === false"
  },
  {
    "key": "select_additional_fields",
    "help": "The most common fields are shown above. Use this to add any other fields such as deal type, pipeline, owner, probability, territory, or custom fields.",
    "type": "multiselect",
    "label": "Additional Fields",
    "required": false,
    "customHelp": "Enter the field names manually in array format. You can get field names from actions like List Deal Fields.",
    "placeholder": "Select additional fields",
    "customInputLabel": "Additional Fields in Array",
    "optionsGenerator": "try { const response = await axios.request({ method: 'get', maxBodyLength: Infinity, url: `${context.authData?.subDomain}/crm/sales/api/settings/deals/fields` }); const fields = response.data?.fields || []; const excludeFields = new Set([ 'name', 'amount', 'sales_account_id', 'sales_account', 'contacts', 'contacts_added_list', 'contact_email', 'contact_name', 'deal_stage_id', 'expected_close', 'created_at', 'updated_at', 'creater_id', 'updater_id', 'last_contacted_sales_activity_mode', 'last_contacted_via_sales_activity', 'age', 'recent_note', 'active_sales_sequences', 'completed_sales_sequences', 'stage_updated_time', 'last_assigned_at', 'upcoming_activities_time', 'web_form_id', 'base_currency_amount', 'expected_deal_value', 'record_type_id', 'closed_date' ]); const settableFields = fields.filter(f => !excludeFields.has(f.name)).map(f => ({ label: f.label, value: f.name, sample: f.name })); if (!settableFields.length) { return { message: 'No additional fields available.' }; } return settableFields; } catch (err) { throw err; }",
    "customPlaceholder": "[\"deal_type_id\", \"probability\"]"
  },
  {
    "key": "additional_field_values",
    "help": "Enter values for the additional fields you selected above. Only fields with values will be sent to Freshsales.",
    "type": "input groups",
    "label": "Additional Field Values",
    "required": false,
    "visibilityCondition": "context.inputData.select_additional_fields && context.inputData.select_additional_fields.length > 0",
    "fieldsGenerator": "try { const selectedFields = context?.inputData?.select_additional_fields || []; if (!selectedFields.length) { return { message: 'Select additional fields above to configure their values.' }; } const response = await axios.request({ method: 'get', maxBodyLength: Infinity, url: `${context.authData?.subDomain}/crm/sales/api/settings/deals/fields` }); const allFields = response.data?.fields || []; const filteredFields = allFields.filter(f => selectedFields.includes(f.name)); return filteredFields.map(field => { const base = { key: field.name, label: field.label || field.name, required: false, help: `Enter the ${(field.label || field.name).toLowerCase()} for this deal.`, placeholder: field.label || field.name }; if (field.type === 'dropdown' && field.choices?.length > 0) { return { ...base, type: 'dropdown', help: `Select the ${(field.label || field.name).toLowerCase()} for this deal.`, placeholder: `Select ${(field.label || field.name).toLowerCase()}`, options: field.choices.map(c => ({ label: c.value, value: c.id || c.value, sample: String(c.id || c.value) })), customInputLabel: `${field.label || field.name} ID`, customPlaceholder: String(field.choices[0]?.id || field.choices[0]?.value || ''), customHelp: `Enter the ${(field.label || field.name).toLowerCase()} ID manually. You can get it from actions like List Deal Fields.` }; } if (field.type === 'multi_select_dropdown' && field.choices?.length > 0) { return { ...base, type: 'multiselect', help: `Select one or more ${(field.label || field.name).toLowerCase()} options for this deal.`, placeholder: `Select ${(field.label || field.name).toLowerCase()}`, options: field.choices.map(c => ({ label: c.value, value: c.id || c.value, sample: String(c.id || c.value) })), customInputLabel: `${field.label || field.name} in Array`, customPlaceholder: `[\"${String(field.choices[0]?.id || field.choices[0]?.value || '')}\"]`, customHelp: `Enter the ${(field.label || field.name).toLowerCase()} IDs manually in array format. You can get them from actions like List Deal Fields.` }; } if (field.type === 'auto_complete') { return { ...base, type: 'string', help: `Enter the ${(field.label || field.name).toLowerCase()} name or ID.`, placeholder: `Enter ${(field.label || field.name).toLowerCase()}` }; } if (field.type === 'number') { return { ...base, type: 'number', placeholder: '0' }; } if (field.type === 'date') { return { ...base, type: 'string', help: `Enter the ${(field.label || field.name).toLowerCase()} in YYYY-MM-DD format.`, placeholder: 'YYYY-MM-DD' }; } return { ...base, type: 'string' }; }); } catch (err) { throw err; }"
  }
]
```

**API Configuration Perform Code**
```javascript
try {
  const data = context.inputData;

  if (!data.name) throw new Error('Deal name is required.');
  if (data.amount === undefined || data.amount === null || data.amount === '') throw new Error('Deal value is required.');
  if (!data.account_name) throw new Error('Related account name is required to create a deal.');

  const payload = {
    name: data.name,
    amount: data.amount
  };

  // ---------- Resolve Account ----------
  const accountLookupRes = await axios.request({
    method: 'get',
    maxBodyLength: Infinity,
    url: `${context.authData.subDomain}/crm/sales/api/lookup`,
    params: { q: String(data.account_name).trim(), f: 'name', entities: 'sales_account' }
  });

  const accounts = accountLookupRes.data?.sales_accounts?.sales_accounts || [];

  if (accounts.length === 1) {
    payload.sales_account_id = accounts[0].id;
  } else if (accounts.length > 1) {
    throw new Error(`Multiple accounts found matching "${data.account_name}". Please use a more specific account name.`);
  } else {
    payload.sales_account = { name: data.account_name };
  }

  // ---------- Resolve Contact ----------
  if (data.contact_email) {
    const emailValue = String(data.contact_email).trim().toLowerCase();
    let contactId;

    // Step 1: lookup by emails (confirmed working pattern)
    const contactLookupRes = await axios.request({
      method: 'get',
      maxBodyLength: Infinity,
      url: `${context.authData.subDomain}/crm/sales/api/lookup`,
      params: { q: emailValue, f: 'emails', entities: 'contact' }
    });

    const contacts = contactLookupRes.data?.contacts?.contacts || [];

    if (contacts.length >= 1) {
      // If multiple match (shouldn't happen), take the latest one
      contactId = contacts[0].id;
    } else {
      // Step 2: not found by lookup — attempt creation
      try {
        const nameParts = (data.contact_name || data.contact_email.split('@')[0]).trim().split(' ');
        const firstName = nameParts.shift();
        const lastName = nameParts.join(' ') || undefined;
        const contactPayload = { first_name: firstName, email: data.contact_email };
        if (lastName) contactPayload.last_name = lastName;

        const createContactRes = await axios.request({
          method: 'post',
          maxBodyLength: Infinity,
          url: `${context.authData.subDomain}/crm/sales/api/contacts`,
          data: { contact: contactPayload }
        });
        contactId = createContactRes.data?.contact?.id;
      } catch (createErr) {
        // Step 3: creation failed (e.g. "email already exists") — recover via filtered_search
        const recoveryRes = await axios.request({
          method: 'post',
          maxBodyLength: Infinity,
          url: `${context.authData.subDomain}/crm/sales/api/filtered_search/contact`,
          data: {
            filter_rule: [
              { attribute: 'contact_email.email', operator: 'is_in', value: emailValue }
            ]
          }
        });
        const recoveredContacts = recoveryRes.data?.contacts || [];
        // If multiple match (shouldn't happen), take the latest one
        contactId = recoveredContacts.length >= 1 ? recoveredContacts[0].id : null;
        // Genuinely unresolvable — don't block deal creation, skip contact linking
      }
    }

    if (contactId) payload.contacts_added_list = [contactId];
  }

  // ---------- Deal Stage ----------
  if (data.deal_stage_id) {
    const stageVal = typeof data.deal_stage_id === 'object' ? data.deal_stage_id?.value : data.deal_stage_id;
    if (stageVal) payload.deal_stage_id = stageVal;
  }

  // ---------- Expected Close Date ----------
  const closeDateType = data.close_date_type === true || data.close_date_type === 'true';
  const closeDateSpecific = data.close_date_type === false || data.close_date_type === 'false';

  if (closeDateType && data.close_date_days) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(data.close_date_days));
    payload.expected_close = futureDate.toISOString().split('T')[0];
  } else if (closeDateSpecific && data.close_date_specific) {
    payload.expected_close = data.close_date_specific;
  }

  // ---------- Additional Fields ----------
  const additionalFields = data.select_additional_fields || [];
  const fieldValues = data.additional_field_values || {};
  const customFieldPayload = {};

  additionalFields.forEach(function(field) {
    const rawValue = fieldValues[field];
    if (rawValue === undefined || rawValue === null || rawValue === '' || (Array.isArray(rawValue) && rawValue.length === 0)) return;
    const value = typeof rawValue === 'object' && rawValue?.value !== undefined ? rawValue.value : rawValue;
    if (String(field).startsWith('cf_')) {
      customFieldPayload[field] = value;
    } else {
      payload[field] = value;
    }
  });

  if (Object.keys(customFieldPayload).length > 0) payload.custom_field = customFieldPayload;

  // ---------- Create Deal ----------
  const createRes = await axios.request({
    method: 'post',
    maxBodyLength: Infinity,
    url: `${context.authData.subDomain}/crm/sales/api/deals`,
    data: { deal: payload }
  });

  return createRes.data?.deal || createRes.data;

} catch (error) {
  return await errorComponent(error);
}
```

---

# UPDATE Examples

UPDATE actions modify an existing record.

## Cin7 Core — Update Customer

- **Category:** Inventory / CRM


**API Usage**

No external API calls are made for options besides pagination helpers (List Customers, List Attribute Sets). 

**UI Components**

**Dropdown – Customer**
Dropdown to select the customer, paginated via a list customers helper. 

**Multiselect – Fields to Update**
A chooser that lists sections (e.g., Billing Address, Shipping Address, Contacts, Advanced Options) and top-level fields. Users select only what they want to update to prevent UI bloat.

**Input Groups – Sectional Fields**
Dedicated Input Groups (e.g., Billing Address, Contacts) that are conditionally visible only if the user selected them in the "Fields to Update" multiselect. Inside these groups, individual fields capture the nested data. 

**Input Group - Selected Field Values**
For top-level fields (like Name, Currency, Tax Rule), a static input groups with conditional visibility renders the inputs based on the multiselect choice.

**API Flow**

The Perform Code conditionally extracts data based on the user's multiselect choices. It cleans out empty addresses or objects and submits only the updated properties, honoring the partial update pattern.

**Input Fields JSON**

```json
[
  {
    "key": "customer",
    "help": "Select the customer to update.",
    "type": "dropdown",
    "label": "Customer",
    "required": true,
    "customHelp": "Enter the customer ID manually. You can get it from actions like List Customers or Find Customer.",
    "canPaginate": true,
    "placeholder": "Select customer",
    "customInputLabel": "Customer ID",
    "optionsGenerator": "try {\n  const page = context?.paginateData?.['customer'] || 1;\n  const limit = 100;\n  return await list_customers(page, limit);\n} catch (error) {\n  await errorComponent(error);\n}",
    "customPlaceholder": "00000000-0000-0000-0000-000000000000"
  },
  {
    "key": "fields_to_update",
    "help": "Select the customer fields or sections you want to update. Only the selected items will appear below.",
    "type": "multiselect",
    "label": "Fields to Update",
    "options": [
      {
        "label": "Customer Name",
        "value": "name"
      },
      {
        "label": "Display Name",
        "value": "display_name"
      },
      {
        "label": "Currency",
        "value": "currency"
      },
      {
        "label": "Payment Terms",
        "value": "payment_term"
      },
      {
        "label": "Tax Rule",
        "value": "tax_rule"
      },
      {
        "label": "Accounts Receivable Account",
        "value": "account_receivable"
      },
      {
        "label": "Revenue Account",
        "value": "revenue_account"
      },
      {
        "label": "Status",
        "value": "status"
      },
      {
        "label": "Default Discount (%)",
        "value": "discount"
      },
      {
        "label": "Price Tier",
        "value": "price_tier"
      },
      {
        "label": "Credit Limit",
        "value": "credit_limit"
      },
      {
        "label": "On Credit Hold",
        "value": "is_on_credit_hold"
      },
      {
        "label": "Is Legal Entity",
        "value": "is_legal_entity"
      },
      {
        "label": "Tax Number",
        "value": "tax_number"
      },
      {
        "label": "Default Dispatch Location",
        "value": "location"
      },
      {
        "label": "Default Carrier",
        "value": "carrier"
      },
      {
        "label": "Sales Representative",
        "value": "sales_representative"
      },
      {
        "label": "Comments",
        "value": "comments"
      },
      {
        "label": "Billing Address",
        "value": "billing_address"
      },
      {
        "label": "Shipping Address",
        "value": "shipping_address"
      },
      {
        "label": "Business Address",
        "value": "business_address"
      },
      {
        "label": "Contacts",
        "value": "contacts"
      },
      {
        "label": "Advanced Options",
        "value": "advanced_options"
      }
    ],
    "required": true,
    "customHelp": "Enter the field keys as a JSON array when mapping dynamically.",
    "customInputLabel": "Fields to Update",
    "customPlaceholder": "[\"name\",\"status\"]"
  },
  {
    "key": "selected_field_values",
    "help": "Enter the new values for the fields selected above to update the customer.",
    "type": "input groups",
    "label": "Selected Field Values",
    "required": false,
    "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.some(function (f) { return ['name','display_name','currency','payment_term','tax_rule','account_receivable','revenue_account','status','discount','price_tier','credit_limit','is_on_credit_hold','is_legal_entity','tax_number','location','carrier','sales_representative','comments'].includes(f); })",
    "fields": [
      {
        "key": "name",
        "help": "Enter the customer name.",
        "type": "string",
        "label": "Customer Name",
        "required": false,
        "placeholder": "Acme Pty Ltd",
        "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('name')"
      },
      {
        "key": "display_name",
        "help": "Enter the display name for the customer.",
        "type": "string",
        "label": "Display Name",
        "required": false,
        "placeholder": "Acme",
        "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('display_name')"
      },
      {
        "key": "currency",
        "help": "Enter the currency code.",
        "type": "string",
        "label": "Currency",
        "required": false,
        "placeholder": "AUD",
        "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('currency')"
      },
      {
        "key": "payment_term",
        "help": "Select the payment terms.",
        "type": "dropdown",
        "label": "Payment Terms",
        "required": false,
        "customHelp": "Enter the payment term name manually. You can get it from actions like List Payment Terms.",
        "canPaginate": true,
        "placeholder": "Select payment terms",
        "customInputLabel": "Payment Terms",
        "optionsGenerator": "try {\n  const page = context?.paginateData?.['selected_field_values.payment_term'] || 1;\n  return await list_payment_terms(page, 100);\n} catch (error) {\n  await errorComponent(error);\n}",
        "customPlaceholder": "Net 30",
        "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('payment_term')"
      },
      {
        "key": "tax_rule",
        "help": "Select the tax rule.",
        "type": "dropdown",
        "label": "Tax Rule",
        "required": false,
        "customHelp": "Enter the tax rule name manually. You can get it from actions like List Tax Rules.",
        "canPaginate": true,
        "placeholder": "Select tax rule",
        "customInputLabel": "Tax Rule",
        "optionsGenerator": "try {\n  const page = context?.paginateData?.['selected_field_values.tax_rule'] || 1;\n  return await list_tax_rules(page, 100);\n} catch (error) {\n  await errorComponent(error);\n}",
        "customPlaceholder": "GST",
        "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('tax_rule')"
      },
      {
        "key": "account_receivable",
        "help": "Select the accounts receivable account.",
        "type": "dropdown",
        "label": "Accounts Receivable Account",
        "required": false,
        "customHelp": "Enter the account code manually. You can get it from actions like List Accounts Receivable.",
        "canPaginate": true,
        "placeholder": "Select accounts receivable account",
        "customInputLabel": "Accounts Receivable Account Code",
        "optionsGenerator": "try {\n  const page = context?.paginateData?.['selected_field_values.account_receivable'] || 1;\n  return await list_accounts_receivable(page, 100);\n} catch (error) {\n  await errorComponent(error);\n}",
        "customPlaceholder": "610",
        "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('account_receivable')"
      },
      {
        "key": "revenue_account",
        "help": "Select the revenue account.",
        "type": "dropdown",
        "label": "Revenue Account",
        "required": false,
        "customHelp": "Enter the account code manually. You can get it from actions like List Revenue Accounts.",
        "canPaginate": true,
        "placeholder": "Select revenue account",
        "customInputLabel": "Revenue Account Code",
        "optionsGenerator": "try {\n  const page = context?.paginateData?.['selected_field_values.revenue_account'] || 1;\n  return await list_accounts_revenue(page, 100);\n} catch (error) {\n  await errorComponent(error);\n}",
        "customPlaceholder": "200",
        "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('revenue_account')"
      },
      {
        "key": "status",
        "help": "Select the customer status.",
        "type": "dropdown",
        "label": "Status",
        "options": [
          {
            "label": "Active",
            "value": "Active"
          },
          {
            "label": "Deprecated",
            "value": "Deprecated"
          }
        ],
        "required": false,
        "customHelp": "Enter Active or Deprecated.",
        "customInputLabel": "Status",
        "customPlaceholder": "Active",
        "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('status')"
      },
      {
        "key": "discount",
        "help": "Enter the default discount percentage (0-100).",
        "type": "number",
        "label": "Default Discount (%)",
        "required": false,
        "placeholder": "0",
        "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('discount')"
      },
      {
        "key": "price_tier",
        "help": "Select the price tier.",
        "type": "dropdown",
        "label": "Price Tier",
        "required": false,
        "customHelp": "Enter the price tier name manually. You can get it from actions like List Price Tiers.",
        "canPaginate": true,
        "placeholder": "Select price tier",
        "customInputLabel": "Price Tier",
        "optionsGenerator": "try {\n  const page = context?.paginateData?.['selected_field_values.price_tier'] || 1;\n  return await list_price_tiers(page, 100);\n} catch (error) {\n  await errorComponent(error);\n}",
        "customPlaceholder": "Tier 1",
        "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('price_tier')"
      },
      {
        "key": "credit_limit",
        "help": "Enter the credit limit.",
        "type": "number",
        "label": "Credit Limit",
        "required": false,
        "placeholder": "0",
        "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('credit_limit')"
      },
      {
        "key": "is_on_credit_hold",
        "help": "Select yes to place the customer on credit hold.",
        "type": "boolean",
        "label": "On Credit Hold?",
        "options": [
          {
            "label": "Yes",
            "value": true
          },
          {
            "label": "No",
            "value": false
          }
        ],
        "required": false,
        "customHelp": "Enter true for on hold, or false for not.",
        "defaultValue": {
          "label": "No",
          "value": false
        },
        "customInputLabel": "On Credit Hold?",
        "customPlaceholder": "false",
        "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('is_on_credit_hold')"
      },
      {
        "key": "is_legal_entity",
        "help": "Select yes if the customer is a legal entity.",
        "type": "boolean",
        "label": "Is a Legal Entity?",
        "options": [
          {
            "label": "Yes",
            "value": true
          },
          {
            "label": "No",
            "value": false
          }
        ],
        "required": false,
        "customHelp": "Enter true for legal entity, or false for not.",
        "defaultValue": {
          "label": "No",
          "value": false
        },
        "customInputLabel": "Is a Legal Entity?",
        "customPlaceholder": "false",
        "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('is_legal_entity')"
      },
      {
        "key": "tax_number",
        "help": "Enter the tax number.",
        "type": "number",
        "label": "Tax Number",
        "required": false,
        "placeholder": "123456789",
        "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('tax_number')"
      },
      {
        "key": "location",
        "help": "Enter the default dispatch location.",
        "type": "string",
        "label": "Default Dispatch Location",
        "required": false,
        "placeholder": "Main Warehouse",
        "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('location')"
      },
      {
        "key": "carrier",
        "help": "Enter the default carrier.",
        "type": "string",
        "label": "Default Carrier",
        "required": false,
        "placeholder": "DEFAULT Carrier",
        "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('carrier')"
      },
      {
        "key": "sales_representative",
        "help": "Enter the sales representative.",
        "type": "string",
        "label": "Sales Representative",
        "required": false,
        "placeholder": "Mary Jane",
        "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('sales_representative')"
      },
      {
        "key": "comments",
        "help": "Enter any comments.",
        "type": "string",
        "label": "Comments",
        "required": false,
        "placeholder": "Customer notes",
        "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('comments')"
      }
    ]
  },
  {
    "key": "billing_address",
    "help": "Enter the billing address details to add or update.",
    "type": "input groups",
    "label": "Billing Address",
    "required": false,
    "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('billing_address')",
    "fields": [
      {
        "key": "ID",
        "help": "Leave blank to add a new address. To update an existing one, map the ID from a previous step.",
        "type": "string",
        "label": "Existing Address ID",
        "required": false,
        "placeholder": "Leave blank to add new"
      },
      {
        "key": "Line1",
        "help": "Enter street address line 1.",
        "type": "string",
        "label": "Street Address Line 1",
        "required": false,
        "placeholder": "123 Main Street"
      },
      {
        "key": "Line2",
        "help": "Enter street address line 2.",
        "type": "string",
        "label": "Street Address Line 2",
        "required": false,
        "placeholder": "Suite 400"
      },
      {
        "key": "City",
        "help": "Enter the city.",
        "type": "string",
        "label": "City",
        "required": false,
        "placeholder": "Melbourne"
      },
      {
        "key": "State",
        "help": "Enter the state.",
        "type": "string",
        "label": "State",
        "required": false,
        "placeholder": "VIC"
      },
      {
        "key": "Postcode",
        "help": "Enter the postcode.",
        "type": "string",
        "label": "Postcode",
        "required": false,
        "placeholder": "3000"
      },
      {
        "key": "Country",
        "help": "Enter the country.",
        "type": "string",
        "label": "Country",
        "required": false,
        "placeholder": "Australia"
      }
    ]
  },
  {
    "key": "shipping_address",
    "help": "Enter the shipping address details to add or update.",
    "type": "input groups",
    "label": "Shipping Address",
    "required": false,
    "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('shipping_address')",
    "fields": [
      {
        "key": "ID",
        "help": "Leave blank to add a new address. To update an existing one, map the ID from a previous step.",
        "type": "string",
        "label": "Existing Address ID",
        "required": false,
        "placeholder": "Leave blank to add new"
      },
      {
        "key": "Line1",
        "help": "Enter street address line 1.",
        "type": "string",
        "label": "Street Address Line 1",
        "required": false,
        "placeholder": "123 Main Street"
      },
      {
        "key": "Line2",
        "help": "Enter street address line 2.",
        "type": "string",
        "label": "Street Address Line 2",
        "required": false,
        "placeholder": "Suite 400"
      },
      {
        "key": "City",
        "help": "Enter the city.",
        "type": "string",
        "label": "City",
        "required": false,
        "placeholder": "Melbourne"
      },
      {
        "key": "State",
        "help": "Enter the state.",
        "type": "string",
        "label": "State",
        "required": false,
        "placeholder": "VIC"
      },
      {
        "key": "Postcode",
        "help": "Enter the postcode.",
        "type": "string",
        "label": "Postcode",
        "required": false,
        "placeholder": "3000"
      },
      {
        "key": "Country",
        "help": "Enter the country.",
        "type": "string",
        "label": "Country",
        "required": false,
        "placeholder": "Australia"
      }
    ]
  },
  {
    "key": "business_address",
    "help": "Enter the business address details to add or update.",
    "type": "input groups",
    "label": "Business Address",
    "required": false,
    "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('business_address')",
    "fields": [
      {
        "key": "ID",
        "help": "Leave blank to add a new address. To update an existing one, map the ID from a previous step.",
        "type": "string",
        "label": "Existing Address ID",
        "required": false,
        "placeholder": "Leave blank to add new"
      },
      {
        "key": "Line1",
        "help": "Enter street address line 1.",
        "type": "string",
        "label": "Street Address Line 1",
        "required": false,
        "placeholder": "123 Main Street"
      },
      {
        "key": "Line2",
        "help": "Enter street address line 2.",
        "type": "string",
        "label": "Street Address Line 2",
        "required": false,
        "placeholder": "Suite 400"
      },
      {
        "key": "City",
        "help": "Enter the city.",
        "type": "string",
        "label": "City",
        "required": false,
        "placeholder": "Melbourne"
      },
      {
        "key": "State",
        "help": "Enter the state.",
        "type": "string",
        "label": "State",
        "required": false,
        "placeholder": "VIC"
      },
      {
        "key": "Postcode",
        "help": "Enter the postcode.",
        "type": "string",
        "label": "Postcode",
        "required": false,
        "placeholder": "3000"
      },
      {
        "key": "Country",
        "help": "Enter the country.",
        "type": "string",
        "label": "Country",
        "required": false,
        "placeholder": "Australia"
      }
    ]
  },
  {
    "key": "contacts",
    "help": "Enter the contact details to add or update. Leave ID blank to add a new contact. Existing contacts not referenced here are left untouched.",
    "type": "input groups",
    "label": "Contacts",
    "required": false,
    "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('contacts')",
    "fields": [
      {
        "key": "ID",
        "help": "Leave blank to add a new contact. To update an existing one, map the ID from a previous step.",
        "type": "string",
        "label": "Existing Contact ID",
        "required": false,
        "placeholder": "Leave blank to add new"
      },
      {
        "key": "Name",
        "help": "Enter the contact name.",
        "type": "string",
        "label": "Contact Name",
        "required": false,
        "placeholder": "John Smith"
      },
      {
        "key": "Phone",
        "help": "Enter the phone number.",
        "type": "string",
        "label": "Phone",
        "required": false,
        "placeholder": "9876543210"
      },
      {
        "key": "Fax",
        "help": "Enter the fax number.",
        "type": "string",
        "label": "Fax",
        "required": false,
        "placeholder": "0291234567"
      },
      {
        "key": "Email",
        "help": "Enter the email address.",
        "type": "string",
        "label": "Email",
        "required": false,
        "placeholder": "john.smith@example.com"
      },
      {
        "key": "Website",
        "help": "Enter the website URL.",
        "type": "string",
        "label": "Website",
        "required": false,
        "placeholder": "https://example.com"
      },
      {
        "key": "Default",
        "help": "Select yes to set this as the default contact.",
        "type": "boolean",
        "label": "Default contact?",
        "options": [
          {
            "label": "Yes",
            "value": true
          },
          {
            "label": "No",
            "value": false
          }
        ],
        "required": true,
        "customHelp": "Enter true to set as default, or false to not.",
        "defaultValue": {
          "label": "No",
          "value": false
        },
        "customInputLabel": "Default contact?",
        "customPlaceholder": "false"
      },
      {
        "key": "Comment",
        "help": "Enter a comment.",
        "type": "string",
        "label": "Comment",
        "required": false,
        "placeholder": "Prefers email over phone"
      },
      {
        "key": "IncludeInEmail",
        "help": "Select yes to include this contact in CC for emails.",
        "type": "boolean",
        "label": "Include in CC for emails?",
        "options": [
          {
            "label": "Yes",
            "value": true
          },
          {
            "label": "No",
            "value": false
          }
        ],
        "required": false,
        "customHelp": "Enter true to include in CC, or false to not.",
        "defaultValue": {
          "label": "No",
          "value": false
        },
        "customInputLabel": "Include in CC for emails?",
        "customPlaceholder": "false"
      },
      {
        "key": "MarketingConsent",
        "help": "Marketing consent value. Leave blank unless known.",
        "type": "number",
        "label": "Marketing Consent",
        "required": false,
        "placeholder": "1"
      }
    ]
  },
  {
    "key": "advanced_options",
    "help": "Enter the tags, attribute set, and parent customer settings.",
    "type": "input groups",
    "label": "Advanced Options",
    "required": false,
    "visibilityCondition": "Array.isArray(context?.inputData?.fields_to_update) && context.inputData.fields_to_update.includes('advanced_options')",
    "fields": [
      {
        "key": "tags",
        "help": "Enter tags separated by commas, e.g. vip, wholesale.",
        "type": "string",
        "label": "Tags",
        "required": false,
        "placeholder": "vip, wholesale"
      },
      {
        "key": "attribute_set",
        "help": "Select an attribute set or leave unchanged.",
        "type": "dropdown",
        "label": "Attribute Set Name",
        "required": false,
        "customHelp": "Enter the attribute set name manually. You can get it from actions like List Attribute Sets.",
        "canPaginate": true,
        "placeholder": "Leave unchanged",
        "customInputLabel": "Attribute Set Name",
        "optionsGenerator": "try {\n  const page = context?.paginateData?.['advanced_options.attribute_set'] || 1;\n  return await list_attribute_sets(page, 100);\n} catch (error) {\n  await errorComponent(error);\n}",
        "customPlaceholder": "Product Attributes"
      },
      {
        "key": "additional_attributes_dynamic",
        "help": "These fields appear after selecting an Attribute Set above.",
        "type": "input groups",
        "label": "Attribute Values",
        "required": false,
        "fieldsGenerator": "try {\n  return await generateAttributeFields(context?.inputData?.advanced_options?.attribute_set);\n} catch (error) {\n  await errorComponent(error);\n}",
        "visibilityCondition": "context?.inputData?.advanced_options?.attribute_set"
      },
      {
        "key": "customer_parent",
        "help": "Select a parent customer or leave unchanged.",
        "type": "dropdown",
        "label": "Parent Customer",
        "required": false,
        "customHelp": "Enter the parent customer ID manually. You can get it from actions like List Customers.",
        "canPaginate": true,
        "placeholder": "Leave unchanged",
        "customInputLabel": "Parent Customer ID",
        "optionsGenerator": "try {\n  const page = context?.paginateData?.['advanced_options.customer_parent'] || 1;\n  return await list_customers(page, 100);\n} catch (error) {\n  await errorComponent(error);\n}",
        "customPlaceholder": "00000000-0000-0000-0000-000000000000"
      },
      {
        "key": "is_bill_parent",
        "help": "Select yes to bill the parent customer.",
        "type": "boolean",
        "label": "Bill to parent customer?",
        "options": [
          {
            "label": "Yes",
            "value": true
          },
          {
            "label": "No",
            "value": false
          }
        ],
        "required": false,
        "customHelp": "Enter true to bill the parent customer, or false to not.",
        "customInputLabel": "Bill to parent customer?",
        "customPlaceholder": "false"
      }
    ]
  }
]
```

**API Configuration Perform Code**

```javascript
async function updateCustomer() {
  try {
    if (!context?.inputData?.customer) {
      throw new Error('Customer is required.');
    }

    const fieldsToUpdate = Array.isArray(context.inputData.fields_to_update) ? context.inputData.fields_to_update : [];
    if (!fieldsToUpdate.length) {
      throw new Error('Select at least one field or section to update.');
    }

    const normalizeToArray = function (value) {
      if (!value) return undefined;
      return Array.isArray(value) ? value : [value];
    };

    const isBlank = function (value) {
      return value === undefined || value === null || value === '';
    };

    const isBlankObject = function (obj) {
      if (!obj || typeof obj !== 'object') return true;
      return Object.values(obj).every(function (v) { return isBlank(v); });
    };

    const cleanAddress = function (address, type) {
      if (isBlankObject(address)) return null;
      const cleaned = { Type: type, DefaultForType: true };
      Object.keys(address).forEach(function (key) {
        if (!isBlank(address[key])) {
          cleaned[key] = address[key];
        }
      });
      return cleaned;
    };

    const selected = context.inputData.selected_field_values || {};

    if (selected.discount !== undefined && selected.discount !== null && selected.discount !== '') {
      const discountValue = Number(selected.discount);
      if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
        throw new Error('Default Discount must be between 0 and 100.');
      }
    }

    const includeAdvanced = fieldsToUpdate.includes('advanced_options');
    const advancedOptions = includeAdvanced ? (context.inputData.advanced_options || {}) : {};

    const rawPayload = {
      ID: context.inputData.customer,
      Name: selected.name,
      DisplayName: selected.display_name,
      Currency: selected.currency,
      PaymentTerm: selected.payment_term,
      TaxRule: selected.tax_rule,
      AccountReceivable: selected.account_receivable,
      RevenueAccount: selected.revenue_account,
      Status: selected.status,
      Discount: selected.discount,
      PriceTier: selected.price_tier,
      CreditLimit: selected.credit_limit,
      IsOnCreditHold: selected.is_on_credit_hold,
      IsLegalEntity: selected.is_legal_entity,
      TaxNumber: selected.tax_number,
      Comments: selected.comments,
      Location: selected.location,
      Carrier: selected.carrier,
      SalesRepresentative: selected.sales_representative
    };

    if (includeAdvanced) {
      rawPayload.Tags = advancedOptions.tags;
      rawPayload.AttributeSet = advancedOptions.attribute_set;
      rawPayload.AdditionalAttribute1 = advancedOptions.additional_attributes_dynamic?.additional_attribute_1;
      rawPayload.AdditionalAttribute2 = advancedOptions.additional_attributes_dynamic?.additional_attribute_2;
      rawPayload.AdditionalAttribute3 = advancedOptions.additional_attributes_dynamic?.additional_attribute_3;
      rawPayload.AdditionalAttribute4 = advancedOptions.additional_attributes_dynamic?.additional_attribute_4;
      rawPayload.AdditionalAttribute5 = advancedOptions.additional_attributes_dynamic?.additional_attribute_5;
      rawPayload.AdditionalAttribute6 = advancedOptions.additional_attributes_dynamic?.additional_attribute_6;
      rawPayload.AdditionalAttribute7 = advancedOptions.additional_attributes_dynamic?.additional_attribute_7;
      rawPayload.AdditionalAttribute8 = advancedOptions.additional_attributes_dynamic?.additional_attribute_8;
      rawPayload.AdditionalAttribute9 = advancedOptions.additional_attributes_dynamic?.additional_attribute_9;
      rawPayload.AdditionalAttribute10 = advancedOptions.additional_attributes_dynamic?.additional_attribute_10;
      if (!isBlank(advancedOptions.customer_parent)) {
        rawPayload.CustomerParentID = advancedOptions.customer_parent;
        rawPayload.IsBillParent = advancedOptions.is_bill_parent;
      }
    }

    const addresses = [];
    if (fieldsToUpdate.includes('billing_address')) {
      const billing = cleanAddress(context.inputData.billing_address, 'Billing');
      if (billing) addresses.push(billing);
    }
    if (fieldsToUpdate.includes('shipping_address')) {
      const shipping = cleanAddress(context.inputData.shipping_address, 'Shipping');
      if (shipping) addresses.push(shipping);
    }
    if (fieldsToUpdate.includes('business_address')) {
      const business = cleanAddress(context.inputData.business_address, 'Business');
      if (business) addresses.push(business);
    }

    const cleanPayload = {};
    Object.keys(rawPayload).forEach(function (key) {
      if (!isBlank(rawPayload[key])) {
        cleanPayload[key] = rawPayload[key];
      }
    });

    cleanPayload.ID = context.inputData.customer;
    if (addresses.length) {
      cleanPayload.Addresses = addresses;
    }
    if (fieldsToUpdate.includes('contacts') && !isBlankObject(context.inputData.contacts)) {
      cleanPayload.Contacts = normalizeToArray(context.inputData.contacts);
    }

    const response = await axios.put('https://inventory.dearsystems.com/ExternalApi/v2/customer', cleanPayload);
    const data = response.data;

    if (Array.isArray(data) && data.length && data[0]?.ErrorCode) {
      throw new Error(data.map(function (e) { return e.Exception; }).join('; '));
    }

    return response.data;
  } catch (error) {
    await errorComponent(error);
  }
}
return await updateCustomer();
```

---

## Keka — Update Employee Details

**Metadata**
- **App:** Keka
- **Category:** HR & Recruiting
- **Action:** Update Employee Details
- **Action Type:** UPDATE

**UX Components & Field Design**
- `employee_selector`: An input group to allow lookup by either `Email Address` or `Employee Number / ID` via a `fetch_method` dropdown.
- `sectionsToUpdate`: A multi-select chooser (Core Info, Basic Info, Work Info, Contact, Job, Salary, Bank).
- `employeeCoreInformation`, `basicInformation`, etc.: Input groups that only appear if their corresponding section is chosen.
- `jobSections`: A secondary chooser within Job Details for granular sub-section updates.

**Input Fields JSON**
```json
[
  {
    "key": "employee_selector",
    "help": "Choose how you want to identify the employee to update.",
    "type": "input groups",
    "label": "Find Employee to Update",
    "required": true,
    "fields": [
      {
        "key": "fetch_method",
        "help": "Select how you want to find the employee. Use Email for natural identification. Use Employee Number or ID if you already have it.",
        "type": "dropdown",
        "label": "Find Employee By",
        "options": [
          {
            "label": "Email Address",
            "value": "email"
          },
          {
            "label": "Employee Number / ID",
            "value": "id_number"
          }
        ],
        "required": true,
        "defaultValue": {
          "label": "Email Address",
          "value": "email"
        },
        "customInputLabel": "Enter fetch method",
        "customPlaceholder": "email"
      },
      {
        "key": "candidate_email",
        "help": "Enter the employee's work email address. The system will search and resolve the correct employee record automatically.",
        "type": "string",
        "label": "Employee Work Email",
        "required": true,
        "placeholder": "john.doe@company.com",
        "visibilityCondition": "context.inputData.employee_selector.fetch_method === 'email'"
      },
      {
        "key": "search_employee_id_number",
        "help": "Enter the employee's number (EMP-001) or system UUID. The system will search and validate the record automatically.",
        "type": "string",
        "label": "Employee Number / ID",
        "required": true,
        "placeholder": "EMP-001 or a1b2c3d4-5678-90ab-cdef-1234567890ab",
        "visibilityCondition": "context.inputData.employee_selector.fetch_method === 'id_number'"
      }
    ]
  },
  {
    "key": "sectionsToUpdate",
    "help": "Select which sections of the employee profile you want to update. Only the selected sections will appear below. Leave a section unselected to keep its existing data unchanged.",
    "type": "multiselect",
    "label": "Which Sections Do You Want to Update?",
    "options": [
      {
        "label": "Core Information",
        "value": "coreInfo"
      },
      {
        "label": "Basic Information",
        "value": "basicInfo"
      },
      {
        "label": "Work Information",
        "value": "workInfo"
      },
      {
        "label": "Contact Details",
        "value": "contactDetails"
      },
      {
        "label": "Job Details",
        "value": "jobdetails"
      },
      {
        "label": "Salary Details",
        "value": "salary"
      },
      {
        "label": "Bank & Financial Details",
        "value": "bankd"
      }
    ],
    "required": true,
    "placeholder": "Select sections to update"
  },
  {
    "key": "employeeCoreInformation",
    "help": "Update the employee's basic identity and assignment details. Only fill the fields you want to change — leave others blank to keep existing values.",
    "type": "input groups",
    "label": "Core Information",
    "required": false,
    "visibilityCondition": "context?.inputData?.sectionsToUpdate?.includes('coreInfo')",
    "fields": [
      {
        "key": "firstName",
        "help": "Enter the employee's legal first name to update it.",
        "type": "string",
        "label": "First Name",
        "required": false,
        "placeholder": "John"
      },
      {
        "key": "middleName",
        "help": "Enter the employee's middle name or initial. Leave blank to keep unchanged.",
        "type": "string",
        "label": "Middle Name",
        "required": false,
        "placeholder": "A. or Alan"
      },
      {
        "key": "lastName",
        "help": "Enter the employee's legal last name to update it.",
        "type": "string",
        "label": "Last Name",
        "required": false,
        "placeholder": "Doe"
      },
      {
        "key": "displayName",
        "help": "Enter the full display name as it should appear in the system.",
        "type": "string",
        "label": "Display Name",
        "required": false,
        "placeholder": "John Doe"
      },
      {
        "key": "gender",
        "help": "Select or enter the employee's gender. Accepted values: NotSpecified (0), Male (1), Female (2), Nonbinary (3), PreferNotToRespond (4).",
        "type": "dropdown",
        "label": "Gender",
        "options": [
          {
            "label": "Not Specified",
            "value": 0
          },
          {
            "label": "Male",
            "value": 1
          },
          {
            "label": "Female",
            "value": 2
          },
          {
            "label": "Nonbinary",
            "value": 3
          },
          {
            "label": "Prefer Not To Respond",
            "value": 4
          }
        ],
        "required": false,
        "placeholder": "Select gender",
        "customInputLabel": "Enter gender value",
        "customPlaceholder": "Male or 1"
      },
      {
        "key": "dateOfBirth",
        "help": "Enter the employee's date of birth in YYYY-MM-DD format.",
        "type": "date",
        "label": "Date of Birth",
        "required": false,
        "dateFormat": "",
        "placeholder": "1990-05-10"
      },
      {
        "key": "department",
        "help": "Select or enter the department ID to reassign the employee.",
        "type": "dropdown",
        "label": "Department",
        "required": false,
        "placeholder": "Select department",
        "customInputLabel": "Enter department ID manually",
        "optionsGenerator": "return await departments()",
        "customPlaceholder": "db76d978-8722-4e9a-9415-94f5bb523810"
      },
      {
        "key": "jobtitles",
        "help": "Select or enter the updated job title ID.",
        "type": "dropdown",
        "label": "Job Title",
        "required": false,
        "placeholder": "Select job title",
        "customInputLabel": "Enter job title ID manually",
        "optionsGenerator": "return await jobtitles()",
        "customPlaceholder": "60996b30-7966-421b-9b99-9f3c6ec9d227",
        "visibilityCondition": "context?.inputData?.employeeCoreInformation?.department"
      },
      {
        "key": "locations",
        "help": "Select or enter the updated work location ID.",
        "type": "dropdown",
        "label": "Location",
        "required": false,
        "placeholder": "Select location",
        "customInputLabel": "Enter location ID manually",
        "optionsGenerator": "return await locations()",
        "customPlaceholder": "29d02178-a233-45b8-abda-596b2aecf05a"
      }
    ]
  },
  {
    "key": "basicInformation",
    "help": "Update identity-related details such as employee number, blood group, nationality, or marital status. Leave any field blank to keep its existing value.",
    "type": "input groups",
    "label": "Basic Information",
    "required": false,
    "visibilityCondition": "context?.inputData?.sectionsToUpdate?.includes('basicInfo')",
    "fields": [
      {
        "key": "employeeNumber",
        "help": "Enter the updated organization-assigned employee number.",
        "type": "string",
        "label": "Employee Number",
        "required": false,
        "placeholder": "DHU123"
      },
      {
        "key": "bloodGroup",
        "help": "Select or enter the employee's blood group. Accepted: Not Available (0), A+ (1), A- (2), B+ (3), B- (4), AB+ (5), AB- (6), O+ (7), O- (8), A2+ (9), A1+ (10), A1- (11), A1B- (12), A1B+ (13), A2- (14), A2B+ (15), A2B- (16), B1+ (17).",
        "type": "dropdown",
        "label": "Blood Group",
        "options": [
          {
            "label": "Not Available",
            "value": 0
          },
          {
            "label": "A Positive (A+)",
            "value": 1
          },
          {
            "label": "A Negative (A-)",
            "value": 2
          },
          {
            "label": "B Positive (B+)",
            "value": 3
          },
          {
            "label": "B Negative (B-)",
            "value": 4
          },
          {
            "label": "AB Positive (AB+)",
            "value": 5
          },
          {
            "label": "AB Negative (AB-)",
            "value": 6
          },
          {
            "label": "O Positive (O+)",
            "value": 7
          },
          {
            "label": "O Negative (O-)",
            "value": 8
          },
          {
            "label": "A2 Positive (A2+)",
            "value": 9
          },
          {
            "label": "A1 Positive (A1+)",
            "value": 10
          },
          {
            "label": "A1 Negative (A1-)",
            "value": 11
          },
          {
            "label": "A1B Negative (A1B-)",
            "value": 12
          },
          {
            "label": "A1B Positive (A1B+)",
            "value": 13
          },
          {
            "label": "A2 Negative (A2-)",
            "value": 14
          },
          {
            "label": "A2B Positive (A2B+)",
            "value": 15
          },
          {
            "label": "A2B Negative (A2B-)",
            "value": 16
          },
          {
            "label": "B1 Positive (B1+)",
            "value": 17
          }
        ],
        "required": false,
        "placeholder": "Select blood group",
        "customInputLabel": "Enter blood group (short form or numeric)",
        "customPlaceholder": "A+ or 1"
      },
      {
        "key": "nationality",
        "help": "Select or enter the employee's nationality using a two-letter ISO country code (IN, US, GB).",
        "type": "dropdown",
        "label": "Nationality",
        "options": [
          {
            "label": "United States",
            "value": "US"
          },
          {
            "label": "United Kingdom",
            "value": "GB"
          },
          {
            "label": "India",
            "value": "IN"
          },
          {
            "label": "Canada",
            "value": "CA"
          },
          {
            "label": "Australia",
            "value": "AU"
          },
          {
            "label": "Germany",
            "value": "DE"
          },
          {
            "label": "France",
            "value": "FR"
          },
          {
            "label": "Japan",
            "value": "JP"
          },
          {
            "label": "Italy",
            "value": "IT"
          },
          {
            "label": "United Arab Emirates",
            "value": "AE"
          }
        ],
        "required": false,
        "placeholder": "Select nationality",
        "customInputLabel": "Enter ISO country code",
        "customPlaceholder": "IN"
      },
      {
        "key": "maritalStatus",
        "help": "Select or Enter the employee’s marital status. Accepted values: None (0), Single (1), Married (2), Widowed (3), Separated (4). You may enter text (Single, Married, etc.) or numeric values (0–4). The system will automatically convert it to the correct value.",
        "type": "dropdown",
        "label": "Marital Status",
        "options": [
          {
            "label": "None",
            "value": 0
          },
          {
            "label": "Single",
            "value": 1
          },
          {
            "label": "Married",
            "value": 2
          },
          {
            "label": "Widowed",
            "value": 3
          },
          {
            "label": "Separated",
            "value": 4
          }
        ],
        "required": false,
        "placeholder": "Select marital status",
        "customInputLabel": "Enter marital status value",
        "customPlaceholder": "Married or 2"
      },
      {
        "key": "marriageDate",
        "help": "Enter the employee's marriage date in YYYY-MM-DD format. Applicable only when marital status is Married.",
        "type": "string",
        "label": "Marriage Date",
        "required": false,
        "placeholder": "2021-05-12",
        "visibilityCondition": "context.inputData?.basicInformation?.maritalStatus =='2'"
      }
    ]
  },
  {
    "key": "workInformation",
    "help": "Update organization-related details such as business unit or professional summary. Leave any field blank to keep its existing value.",
    "type": "input groups",
    "label": "Work Information",
    "required": false,
    "visibilityCondition": "context?.inputData?.sectionsToUpdate?.includes('workInfo')",
    "fields": [
      {
        "key": "professionalSummary",
        "help": "Enter an updated professional summary (1–2 sentences).",
        "type": "string",
        "label": "Professional Summary",
        "required": false,
        "placeholder": "Senior engineer with 10 years of experience in cloud infrastructure"
      },
      {
        "key": "businessUnit",
        "help": "Select or enter the updated Business Unit ID.",
        "type": "dropdown",
        "label": "Business Unit",
        "required": false,
        "placeholder": "Select business unit",
        "customInputLabel": "Enter Business Unit ID manually",
        "optionsGenerator": "return await Business_Units()",
        "customPlaceholder": "db76d978-8722-4e9a-9415-94f5bb523810"
      }
    ]
  },
  {
    "key": "contactDetails",
    "help": "Update contact information such as personal email, phone numbers, and address. Leave any field blank to keep its existing value.",
    "type": "input groups",
    "label": "Contact Details",
    "required": false,
    "visibilityCondition": "context?.inputData?.sectionsToUpdate?.includes('contactDetails')",
    "fields": [
      {
        "key": "personalEmail",
        "help": "Enter an updated personal email address.",
        "type": "string",
        "label": "Personal Email Address",
        "required": false,
        "placeholder": "john.personal@gmail.com"
      },
      {
        "key": "workPhone",
        "help": "Enter the updated office or desk phone number.",
        "type": "string",
        "label": "Work Phone",
        "required": false,
        "placeholder": "07311234567"
      },
      {
        "key": "homePhone",
        "help": "Enter the updated home phone number.",
        "type": "string",
        "label": "Home Phone",
        "required": false,
        "placeholder": "07311234567"
      },
      {
        "key": "skypeId",
        "help": "Enter the employee's updated Skype ID.",
        "type": "string",
        "label": "Skype ID",
        "required": false,
        "placeholder": "live:john123"
      },
      {
        "key": "updateCurrentAddress",
        "help": "Enable this to update the employee's current address.",
        "type": "boolean",
        "label": "Update Current Address?",
        "options": [
          {
            "label": "Yes",
            "value": true
          },
          {
            "label": "No",
            "value": false
          }
        ],
        "required": false,
        "defaultValue": {
          "label": "No",
          "value": false
        }
      },
      {
        "key": "currentAddress",
        "type": "input groups",
        "label": "Current Address",
        "required": false,
        "visibilityCondition": "context.inputData?.contactDetails?.updateCurrentAddress === true",
        "fields": [
          {
            "key": "addressLine1",
            "help": "Enter the street address or house number.",
            "type": "string",
            "label": "Address Line 1",
            "required": false,
            "placeholder": "123 MG Road"
          },
          {
            "key": "addressLine2",
            "help": "Enter apartment, building, or landmark.",
            "type": "string",
            "label": "Address Line 2",
            "required": false,
            "placeholder": "Apt 4B, Near City Center"
          },
          {
            "key": "countryCode",
            "help": "Select or enter the two-letter ISO country code.",
            "type": "dropdown",
            "label": "Country",
            "options": [
              {
                "label": "United States (US)",
                "value": "US"
              },
              {
                "label": "United Kingdom (GB)",
                "value": "GB"
              },
              {
                "label": "India (IN)",
                "value": "IN"
              },
              {
                "label": "Canada (CA)",
                "value": "CA"
              },
              {
                "label": "Australia (AU)",
                "value": "AU"
              },
              {
                "label": "Germany (DE)",
                "value": "DE"
              },
              {
                "label": "France (FR)",
                "value": "FR"
              },
              {
                "label": "Japan (JP)",
                "value": "JP"
              },
              {
                "label": "Italy (IT)",
                "value": "IT"
              },
              {
                "label": "United Arab Emirates (AE)",
                "value": "AE"
              }
            ],
            "required": false,
            "placeholder": "Select country",
            "customInputLabel": "Enter ISO country code",
            "customPlaceholder": "IN"
          },
          {
            "key": "city",
            "type": "string",
            "label": "City",
            "required": false,
            "placeholder": "Indore"
          },
          {
            "key": "state",
            "type": "string",
            "label": "State",
            "required": false,
            "placeholder": "Madhya Pradesh"
          },
          {
            "key": "zip",
            "type": "string",
            "label": "Zip Code",
            "required": false,
            "placeholder": "452001"
          }
        ]
      },
      {
        "key": "isCurrentAddressSameAsPermanent",
        "help": "Select Yes if the permanent address is the same as the updated current address.",
        "type": "boolean",
        "label": "Is Current Address Same as Permanent Address?",
        "options": [
          {
            "label": "Yes",
            "value": true
          },
          {
            "label": "No",
            "value": false
          }
        ],
        "required": false,
        "defaultValue": {
          "label": "Yes",
          "value": true
        },
        "visibilityCondition": "context.inputData?.contactDetails?.updateCurrentAddress === true"
      },
      {
        "key": "permanentAddress",
        "type": "input groups",
        "label": "Permanent Address",
        "required": false,
        "visibilityCondition": "context.inputData?.contactDetails?.updateCurrentAddress === true && context.inputData?.contactDetails?.isCurrentAddressSameAsPermanent === false",
        "fields": [
          {
            "key": "addressLine1",
            "type": "string",
            "label": "Address Line 1",
            "required": false,
            "placeholder": "123 MG Road"
          },
          {
            "key": "addressLine2",
            "type": "string",
            "label": "Address Line 2",
            "required": false,
            "placeholder": "Apt 4B"
          },
          {
            "key": "countryCode",
            "type": "dropdown",
            "label": "Country",
            "options": [
              {
                "label": "United States (US)",
                "value": "US"
              },
              {
                "label": "United Kingdom (GB)",
                "value": "GB"
              },
              {
                "label": "India (IN)",
                "value": "IN"
              },
              {
                "label": "Canada (CA)",
                "value": "CA"
              },
              {
                "label": "Australia (AU)",
                "value": "AU"
              },
              {
                "label": "Germany (DE)",
                "value": "DE"
              },
              {
                "label": "France (FR)",
                "value": "FR"
              },
              {
                "label": "Japan (JP)",
                "value": "JP"
              },
              {
                "label": "Italy (IT)",
                "value": "IT"
              },
              {
                "label": "United Arab Emirates (AE)",
                "value": "AE"
              }
            ],
            "required": false,
            "placeholder": "Select country",
            "customInputLabel": "Enter ISO country code",
            "customPlaceholder": "IN"
          },
          {
            "key": "city",
            "type": "string",
            "label": "City",
            "required": false,
            "placeholder": "Indore"
          },
          {
            "key": "state",
            "type": "string",
            "label": "State",
            "required": false,
            "placeholder": "Madhya Pradesh"
          },
          {
            "key": "zip",
            "type": "string",
            "label": "Zip Code",
            "required": false,
            "placeholder": "452001"
          }
        ]
      }
    ]
  },
  {
    "key": "jobdetails",
    "help": "Update job-specific settings. Choose which sub-sections to update — only selected sub-sections will appear.",
    "type": "input groups",
    "label": "Job Details",
    "required": false,
    "visibilityCondition": "context?.inputData?.sectionsToUpdate?.includes('jobdetails')",
    "fields": [
      {
        "key": "jobSections",
        "help": "Select which job-related sub-sections you want to update.",
        "type": "multiselect",
        "label": "Choose Job Sub-Sections to Update",
        "options": [
          {
            "label": "Reporting Structure",
            "value": "reportingStructure"
          },
          {
            "label": "Employment Details",
            "value": "employmentDetails"
          },
          {
            "label": "Schedule & Calendar",
            "value": "scheduleCalendar"
          },
          {
            "label": "Attendance",
            "value": "attendance"
          },
          {
            "label": "Leave",
            "value": "leave"
          },
          {
            "label": "Compensation",
            "value": "compensation"
          }
        ],
        "required": true,
        "placeholder": "Select sub-sections to update"
      },
      {
        "key": "reportingStructure",
        "help": "Update the employee's reporting manager or dotted-line manager.",
        "type": "input groups",
        "label": "Reporting Structure",
        "required": false,
        "visibilityCondition": "context?.inputData?.jobdetails?.jobSections?.includes('reportingStructure')",
        "fields": [
          {
            "key": "reportingManager",
            "help": "Select or enter the updated reporting manager's employee ID.",
            "type": "dropdown",
            "label": "Reporting Manager",
            "required": false,
            "placeholder": "Select reporting manager",
            "customInputLabel": "Enter Manager Employee ID",
            "optionsGenerator": "return await employees()",
            "customPlaceholder": "EMP-1023"
          },
          {
            "key": "dottedLineManager",
            "help": "Select or enter the updated dotted-line (secondary) manager.",
            "type": "dropdown",
            "label": "Dotted Line Manager",
            "required": false,
            "placeholder": "Select dotted-line manager",
            "customInputLabel": "Enter Manager Employee ID",
            "optionsGenerator": "return await employees()",
            "customPlaceholder": "EMP-2045"
          }
        ]
      },
      {
        "key": "employmentDetails",
        "help": "Update the employee's time type, worker type, or contingent classification.",
        "type": "input groups",
        "label": "Employment Details",
        "required": false,
        "visibilityCondition": "context?.inputData?.jobdetails?.jobSections?.includes('employmentDetails')",
        "fields": [
          {
            "key": "timeType",
            "help": "Select the updated working time classification. None (0), Full Time (1), Part Time (2).",
            "type": "dropdown",
            "label": "Time Type",
            "options": [
              {
                "label": "None",
                "value": 0
              },
              {
                "label": "Full Time",
                "value": 1
              },
              {
                "label": "Part Time",
                "value": 2
              }
            ],
            "required": false,
            "placeholder": "Select time type",
            "customInputLabel": "Enter time type manually",
            "customPlaceholder": "1 for Full Time"
          },
          {
            "key": "workerType",
            "help": "Select the updated worker classification. None (0), Permanent (1), Contingent (2).",
            "type": "dropdown",
            "label": "Worker Type",
            "options": [
              {
                "label": "None",
                "value": 0
              },
              {
                "label": "Permanent",
                "value": 1
              },
              {
                "label": "Contingent",
                "value": 2
              }
            ],
            "required": false,
            "placeholder": "Select worker type",
            "customInputLabel": "Enter worker type manually",
            "customPlaceholder": "1 for Permanent"
          },
          {
            "key": "contingentTypeId",
            "help": "Select the contingent category. Only applies when Worker Type is Contingent.",
            "type": "dropdown",
            "label": "Contingent Type",
            "required": false,
            "placeholder": "Select contingent type",
            "customInputLabel": "Enter Contingent Type ID manually",
            "optionsGenerator": "try {\n  const base = `https://${context?.authData?.company}.${context?.authData?.environment}.com`;\n  const r = await axios.request({ method: 'get', url: `${base}/api/v1/hris/contingenttypes`, headers: { accept: 'application/json' } });\n  const items = r.data?.data || [];\n  if (!items.length) return { message: 'No contingent types found.' };\n  return items.map(i => ({ label: i.name, value: i.id, sample: i.id }));\n} catch (e) { throw e; }",
            "customPlaceholder": "6a7b8c9d-1234-5678-abcd-9876543210ef",
            "visibilityCondition": "context.inputData?.jobdetails?.employmentDetails?.workerType == 2"
          }
        ]
      },
      {
        "key": "scheduleCalendar",
        "help": "Update the employee's weekly off policy, shift policy, or holiday calendar.",
        "type": "input groups",
        "label": "Schedule & Calendar",
        "required": false,
        "visibilityCondition": "context?.inputData?.jobdetails?.jobSections?.includes('scheduleCalendar')",
        "fields": [
          {
            "key": "weeklyOffPolicy",
            "help": "Select or enter the updated weekly off policy ID.",
            "type": "dropdown",
            "label": "Weekly Off Policy",
            "required": false,
            "placeholder": "Select weekly off policy",
            "customInputLabel": "Enter Weekly Off Policy ID manually",
            "optionsGenerator": "return await weeklyoffpolicies()",
            "customPlaceholder": "8f3a2b4c-1234-4567-890a-bcdef1234567"
          },
          {
            "key": "shiftPolicy",
            "help": "Select or enter the updated shift policy ID.",
            "type": "dropdown",
            "label": "Shift Policy",
            "required": false,
            "placeholder": "Select shift policy",
            "customInputLabel": "Enter Shift Policy ID manually",
            "optionsGenerator": "return await shiftpolicies()",
            "customPlaceholder": "7a1c9d2e-9876-4321-abcd-ef1234567890"
          },
          {
            "key": "holidayList",
            "help": "Select or enter the updated holiday calendar ID.",
            "type": "dropdown",
            "label": "Holiday Calendar",
            "required": false,
            "placeholder": "Select holiday calendar",
            "customInputLabel": "Enter Holiday Calendar ID manually",
            "optionsGenerator": "return await holidayscalendar()",
            "customPlaceholder": "5c6d7e8f-1122-3344-5566-77889900abcd"
          }
        ]
      },
      {
        "key": "attendance",
        "help": "Update the employee's attendance number or capture scheme.",
        "type": "input groups",
        "label": "Attendance",
        "required": false,
        "visibilityCondition": "context?.inputData?.jobdetails?.jobSections?.includes('attendance')",
        "fields": [
          {
            "key": "attendanceNumber",
            "help": "Enter the updated attendance tracking number.",
            "type": "string",
            "label": "Attendance Number",
            "required": false,
            "placeholder": "001234"
          },
          {
            "key": "attendanceCaptureScheme",
            "help": "Select or enter the updated attendance capture scheme ID.",
            "type": "dropdown",
            "label": "Attendance Capture Scheme",
            "required": false,
            "placeholder": "Select attendance capture scheme",
            "customInputLabel": "Enter Attendance Capture Scheme ID manually",
            "optionsGenerator": "try {\n  const base = `https://${context?.authData?.company}.${context?.authData?.environment}.com`;\n  const r = await axios.request({ method: 'get', url: `${base}/api/v1/time/capturescheme`, headers: { accept: 'application/json' } });\n  const items = r.data?.data || [];\n  if (!items.length) return { message: 'No attendance capture schemes found.' };\n  return items.map(i => ({ label: i.name, value: i.id, sample: i.id }));\n} catch (e) { throw e; }",
            "customPlaceholder": "3f7c2b1a-9d8e-4c6a-b123-abcdef456789"
          }
        ]
      },
      {
        "key": "leave",
        "help": "Update the employee's leave plan or notice period policy.",
        "type": "input groups",
        "label": "Leave",
        "required": false,
        "visibilityCondition": "context?.inputData?.jobdetails?.jobSections?.includes('leave')",
        "fields": [
          {
            "key": "leavePlan",
            "help": "Select or enter the updated leave plan ID.",
            "type": "dropdown",
            "label": "Leave Plan",
            "required": false,
            "placeholder": "Select leave plan",
            "customInputLabel": "Enter Leave Plan ID manually",
            "optionsGenerator": "return await leaveplans()",
            "customPlaceholder": "1a2b3c4d-5678-90ab-cdef-1234567890ab"
          },
          {
            "key": "noticePeriod",
            "help": "Select or enter the updated notice period policy ID.",
            "type": "dropdown",
            "label": "Notice Period",
            "required": false,
            "placeholder": "Select notice period",
            "customInputLabel": "Enter Notice Period ID manually",
            "optionsGenerator": "return await noticeperiods()",
            "customPlaceholder": "9f8e7d6c-5432-1abc-def0-9876543210ab"
          }
        ]
      },
      {
        "key": "compensation",
        "help": "Update the employee's pay band, pay grade, or expense policy.",
        "type": "input groups",
        "label": "Compensation",
        "required": false,
        "visibilityCondition": "context?.inputData?.jobdetails?.jobSections?.includes('compensation')",
        "fields": [
          {
            "key": "payBand",
            "help": "Select or enter the updated pay band ID.",
            "type": "dropdown",
            "label": "Pay Band",
            "required": false,
            "placeholder": "Select pay band",
            "customInputLabel": "Enter Pay Band ID manually",
            "optionsGenerator": "return await paybands()",
            "customPlaceholder": "4b8d2c1a-1234-5678-9abc-def012345678"
          },
          {
            "key": "payGrade",
            "help": "Select or enter the updated pay grade ID.",
            "type": "dropdown",
            "label": "Pay Grade",
            "required": false,
            "placeholder": "Select pay grade",
            "customInputLabel": "Enter Pay Grade ID manually",
            "optionsGenerator": "return await paygrades()",
            "customPlaceholder": "8c7f6e5d-4321-9876-abcd-1234567890ef"
          },
          {
            "key": "expensePolicy",
            "help": "Select or enter the updated expense policy ID.",
            "type": "dropdown",
            "label": "Expense Policy",
            "required": false,
            "placeholder": "Select expense policy",
            "customInputLabel": "Enter Expense Policy ID manually",
            "optionsGenerator": "return await expensepolicies()",
            "customPlaceholder": "2d3e4f5a-6789-1234-abcd-567890abcdef"
          }
        ]
      }
    ]
  },
  {
    "key": "salary",
    "help": "Revise the employee's salary. Provide the updated structure and effective date.",
    "type": "input groups",
    "label": "Salary Details",
    "required": false,
    "visibilityCondition": "context?.inputData?.sectionsToUpdate?.includes('salary')",
    "fields": [
      {
        "key": "structureId",
        "help": "Select or enter the salary structure ID to apply.",
        "type": "dropdown",
        "label": "Salary Structure",
        "required": true,
        "placeholder": "Select salary structure",
        "customInputLabel": "Enter salary structure ID",
        "optionsGenerator": "return await salary_structures()",
        "customPlaceholder": "9c0a3a2d-6f34-4e6d-a1d3-123456789abc"
      },
      {
        "key": "amount",
        "help": "Enter the updated annual gross salary amount. Example: 600000 = ₹6,00,000 per year.",
        "type": "number",
        "label": "Amount",
        "required": true,
        "placeholder": "720000"
      },
      {
        "key": "effectiveFrom",
        "help": "Enter the date from which the updated salary becomes effective. Use YYYY-MM-DD format.",
        "type": "date",
        "label": "Effective From",
        "required": true,
        "placeholder": "2025-04-01"
      },
      {
        "key": "add_bonus_information",
        "help": "Enable this to add bonus information along with the salary revision.",
        "type": "boolean",
        "label": "Add Bonus Information?",
        "options": [
          {
            "label": "Yes",
            "value": true
          },
          {
            "label": "No",
            "value": false
          }
        ],
        "required": false,
        "defaultValue": {
          "label": "No",
          "value": false
        }
      },
      {
        "key": "apiBonusDto",
        "help": "Provide the bonus details to attach to this salary revision.",
        "type": "input groups",
        "label": "Bonus Details",
        "required": false,
        "visibilityCondition": "context.inputData?.salary?.add_bonus_information === true",
        "fields": [
          {
            "key": "bonusId",
            "type": "dropdown",
            "label": "Bonus Type",
            "required": true,
            "placeholder": "Select bonus type",
            "optionsGenerator": "return await bonustypes()"
          },
          {
            "key": "amount",
            "help": "Enter the bonus amount without currency symbols.",
            "type": "number",
            "label": "Bonus Amount",
            "required": true,
            "placeholder": "5000",
            "visibilityCondition": "context?.inputData?.salary?.apiBonusDto?.bonusId"
          },
          {
            "key": "dueDate",
            "help": "Enter the bonus payout date in YYYY-MM-DD format.",
            "type": "date",
            "label": "Payout Date",
            "required": true,
            "placeholder": "2025-03-31"
          },
          {
            "key": "note",
            "help": "Add any remarks related to this bonus.",
            "type": "string",
            "label": "Note",
            "required": true,
            "placeholder": "Annual performance bonus"
          },
          {
            "key": "isBonusAmountIncludedInSalary",
            "help": "Is the bonus amount already included in the salary figure above?",
            "type": "boolean",
            "label": "Is Bonus Included in Salary?",
            "options": [
              {
                "label": "Yes",
                "value": true
              },
              {
                "label": "No",
                "value": false
              }
            ],
            "required": false,
            "defaultValue": {
              "label": "No",
              "value": false
            }
          }
        ]
      }
    ]
  },
  {
    "key": "financialDetails",
    "help": "Update the employee's salary payment mode or bank account details.",
    "type": "input groups",
    "label": "Bank & Financial Details",
    "required": false,
    "visibilityCondition": "context?.inputData?.sectionsToUpdate?.includes('bankd')",
    "fields": [
      {
        "key": "salaryPaymentMode",
        "help": "Select or enter the updated payment mode. None (0), Bank Transfer (1), Cash (2), Cheque (3), Unknown (4).",
        "type": "dropdown",
        "label": "Salary Payment Mode",
        "options": [
          {
            "label": "None (Not Set)",
            "value": 0
          },
          {
            "label": "Bank Transfer",
            "value": 1
          },
          {
            "label": "Cash",
            "value": 2
          },
          {
            "label": "Cheque",
            "value": 3
          },
          {
            "label": "Unknown",
            "value": 4
          }
        ],
        "required": true,
        "placeholder": "Select salary payment mode",
        "defaultValue": {
          "label": "Bank Transfer",
          "value": 1
        },
        "customInputLabel": "Enter payment mode manually",
        "customPlaceholder": "1 for Bank Transfer"
      },
      {
        "key": "bankDetails",
        "help": "Provide the updated bank account details. Required when payment mode is Bank Transfer.",
        "type": "input groups",
        "label": "Bank Details",
        "required": false,
        "visibilityCondition": "context.inputData?.financialDetails?.salaryPaymentMode == 1",
        "fields": [
          {
            "key": "id",
            "help": "Select or enter the Bank ID.",
            "type": "dropdown",
            "label": "Bank Name",
            "required": false,
            "canPaginate": true,
            "placeholder": "Select bank",
            "customInputLabel": "Enter the bank ID manually",
            "optionsGenerator": "return await fetchBanks()",
            "customPlaceholder": "HDFC Bank"
          },
          {
            "key": "branchName",
            "help": "Enter the updated bank branch name.",
            "type": "string",
            "label": "Branch Name",
            "required": false,
            "placeholder": "Indore Main Branch"
          },
          {
            "key": "ifscCode",
            "help": "Enter the 11-character IFSC code of the bank branch.",
            "type": "string",
            "label": "IFSC Code",
            "required": true,
            "placeholder": "HDFC0001234"
          },
          {
            "key": "accountNumber",
            "help": "Enter the employee's updated bank account number.",
            "type": "string",
            "label": "Account Number",
            "required": true,
            "placeholder": "91113288432614"
          },
          {
            "key": "nameOnTheAccount",
            "help": "Enter the name as it appears on the bank account.",
            "type": "string",
            "label": "Name on Account",
            "required": true,
            "placeholder": "John Doe"
          }
        ]
      }
    ]
  }
]
```

**API Configuration Perform Code**
```javascript
try {

  const base = `https://${context?.authData?.company}.${context?.authData?.environment}.com`;
  const selector = context?.inputData?.employee_selector;
  let employeeId = null;

  if (selector?.fetch_method === 'email') {
    const searchRes = await axios.request({
      method: 'post',
      url: `${base}/api/v1/hris/employees/search`,
      headers: { 'Content-Type': 'application/json' },
      data: { workEmail: selector?.candidate_email?.trim() }
    });
    const matched = searchRes?.data?.data;
    if (!matched?.id) {
      return { message: 'No employee found with the provided email. Please check that the email is correct and belongs to an active employee in your organization.' };
    }
    employeeId = matched.id;
  }

  if (selector?.fetch_method === 'id_number') {
    const raw = selector?.search_employee_id_number?.trim();
    const isUUID = raw?.includes('-') && raw?.length > 20;
    let page = 1;
    let totalPages = 1;
    while (page <= totalPages) {
      const res = await axios.request({
        method: 'get',
        url: `${base}/api/v1/hris/employees`,
        params: {
          employeeIds: isUUID ? raw : undefined,
          employeeNumbers: !isUUID ? raw : undefined,
          pageNumber: page,
          pageSize: 200
        }
      });
      const data = res.data?.data || [];
      totalPages = res.data?.totalPages || 1;
      const matched = data.find(e => isUUID ? e.id === raw : e.employeeNumber === raw);
      if (matched) { employeeId = matched.id; break; }
      page++;
    }
    if (!employeeId) {
      return { message: 'No employee found with the provided Employee Number or ID. Please verify it is correct and the employee exists in your organization.' };
    }
  }

  if (!employeeId) {
    return { message: 'Employee could not be identified. Please provide a valid email or employee number.' };
  }

  const sections = context?.inputData?.sectionsToUpdate || [];

  const strip = (obj) => {
    if (!obj || typeof obj !== 'object') return undefined;
    const cleaned = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null || v === '') continue;
      if (typeof v === 'object' && !Array.isArray(v)) {
        const nested = strip(v);
        if (nested && Object.keys(nested).length > 0) cleaned[k] = nested;
      } else {
        cleaned[k] = v;
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  };

  const genderMap = {
    "0": 0, "notspecified": 0,
    "1": 1, "male": 1, "m": 1,
    "2": 2, "female": 2, "f": 2,
    "3": 3, "nonbinary": 3, "nb": 3,
    "4": 4, "prefernottorespond": 4, "pntr": 4
  };

  const bloodGroupMap = {
    "0": 0, "notavailable": 0,
    "1": 1, "a+": 1, "2": 2, "a-": 2,
    "3": 3, "b+": 3, "4": 4, "b-": 4,
    "5": 5, "ab+": 5, "6": 6, "ab-": 6,
    "7": 7, "o+": 7, "8": 8, "o-": 8,
    "9": 9, "a2+": 9, "10": 10, "a1+": 10,
    "11": 11, "a1-": 11, "12": 12, "a1b-": 12,
    "13": 13, "a1b+": 13, "14": 14, "a2-": 14,
    "15": 15, "a2b+": 15, "16": 16, "a2b-": 16,
    "17": 17, "b1+": 17
  };

  const maritalStatusMap = {
     "0": 0, "none": 0,
    "1": 1, "single": 1,
    "2": 2, "married": 2,
    "3": 3, "widowed": 3,
    "4": 4, "separated": 4
  };

  const nationalityMap = {
    "us": "US", "usa": "US", "unitedstates": "US",
    "gb": "GB", "uk": "GB", "unitedkingdom": "GB",
    "in": "IN", "india": "IN", "ind": "IN",
    "ca": "CA", "canada": "CA",
    "au": "AU", "australia": "AU",
    "de": "DE", "germany": "DE",
    "fr": "FR", "france": "FR",
    "jp": "JP", "japan": "JP",
    "it": "IT", "italy": "IT",
    "ae": "AE", "uae": "AE", "unitedarabemirates": "AE"
  };

  const salaryPaymentModeMap = {
    "0": 0, "none": 0, "notset": 0,
    "1": 1, "banktransfer": 1, "bank": 1,
    "2": 2, "cash": 2,
    "3": 3, "cheque": 3, "check": 3,
    "4": 4, "unknown": 4
  };

  const parseEnum = (input, map, fieldName, maxNumeric = null) => {
    if (input === undefined || input === null || input === '') return null;
    const raw = String(input).trim();
    const normalized = raw.toLowerCase().replace(/\s/g, '');
    if (/^\d+$/.test(normalized)) {
      const num = Number(normalized);
      if (maxNumeric !== null && (num < 0 || num > maxNumeric)) {
        return { error: `Invalid ${fieldName}. Accepted numeric values are 0–${maxNumeric}.` };
      }
      return num;
    }
    if (map.hasOwnProperty(normalized)) return map[normalized];
    const matchedKey = Object.keys(map).find(key => key.startsWith(normalized));
    if (matchedKey !== undefined) return map[matchedKey];
    return { error: `Invalid ${fieldName} value. Please enter a valid value as described in the field help.` };
  };

  const parseNationality = (input) => {
    if (input === undefined || input === null || input === '') return null;
    const raw = String(input).trim();
    const normalized = raw.toLowerCase().replace(/\s/g, '');
    if (/^[a-z]{2}$/i.test(raw)) return raw.toUpperCase();
    if (nationalityMap.hasOwnProperty(normalized)) return nationalityMap[normalized];
    const matchedKey = Object.keys(nationalityMap).find(key => key.startsWith(normalized));
    if (matchedKey !== undefined) return nationalityMap[matchedKey];
    return { error: 'Invalid nationality value. Please enter a valid country name or ISO code.' };
  };

  const parsedGender = parseEnum(context?.inputData?.employeeCoreInformation?.gender, genderMap, 'gender', 4);
  if (parsedGender?.error) return { message: parsedGender.error };

  const parsedBlood = parseEnum(context?.inputData?.basicInformation?.bloodGroup, bloodGroupMap, 'blood group', 17);
  if (parsedBlood?.error) return { message: parsedBlood.error };

  const parsedMarital = parseEnum(context?.inputData?.basicInformation?.maritalStatus, maritalStatusMap, 'marital status', 4);
  if (parsedMarital?.error) return { message: parsedMarital.error };

  const parsedNationality = parseNationality(context?.inputData?.basicInformation?.nationality);
  if (parsedNationality?.error) return { message: parsedNationality.error };

  const parsedSalaryPaymentMode = parseEnum(context?.inputData?.financialDetails?.salaryPaymentMode, salaryPaymentModeMap, 'salary payment mode', 4);
  if (parsedSalaryPaymentMode?.error) return { message: parsedSalaryPaymentMode.error };

  const results = { employeeId };

  /* JOB DETAILS */

  const needsJobUpdate =
    sections.includes('jobdetails') ||
    sections.includes('coreInfo') ||
    sections.includes('workInfo');

  if (needsJobUpdate) {
    const ci = context?.inputData?.employeeCoreInformation;
    const jd = context?.inputData?.jobdetails;
    const wi = context?.inputData?.workInformation;

    const jobBody = strip({
      employeeNumber: context?.inputData?.basicInformation?.employeeNumber,
      location: ci?.locations,
      businessUnit: wi?.businessUnit,
      department: ci?.department,
      jobTitle: ci?.jobtitles,
      legalEntity: wi?.legalEntity,
      reportingManager: jd?.reportingStructure?.reportingManager,
      dottedLineManager: jd?.reportingStructure?.dottedLineManager,
      attendanceNumber: jd?.attendance?.attendanceNumber,
      timeType: jd?.employmentDetails?.timeType !== undefined ? Number(jd?.employmentDetails?.timeType) : undefined,
      attendanceCaptureScheme: jd?.attendance?.attendanceCaptureScheme,
      expensePolicy: jd?.compensation?.expensePolicy,
      noticePeriod: jd?.leave?.noticePeriod,
      holidayList: jd?.scheduleCalendar?.holidayList,
      leavePlan: jd?.leave?.leavePlan,
      payBand: jd?.compensation?.payBand,
      payGrade: jd?.compensation?.payGrade,
      shiftPolicy: jd?.scheduleCalendar?.shiftPolicy,
      weeklyOffPolicy: jd?.scheduleCalendar?.weeklyOffPolicy,
      workerType: jd?.employmentDetails?.workerType !== undefined ? Number(jd?.employmentDetails?.workerType) : undefined,
      contingentTypeId: jd?.employmentDetails?.contingentTypeId
    });

    if (jobBody && Object.keys(jobBody).length > 0) {
      const jdRes = await axios.request({
        method: 'put',
        url: `${base}/api/v1/hris/employees/jobdetails`,
        params: { employeeId },
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        data: jobBody
      });
      results.jobDetails = jdRes?.data;
    }
  }

  /* PERSONAL DETAILS */

  const needsPersonalUpdate =
    sections.includes('contactDetails') ||
    sections.includes('basicInfo') ||
    sections.includes('workInfo') ||
    sections.includes('coreInfo');

  if (needsPersonalUpdate) {
    const ci = context?.inputData?.employeeCoreInformation;
    const bi = context?.inputData?.basicInformation;
    const cd = context?.inputData?.contactDetails;
    const wi = context?.inputData?.workInformation;

    const sameAddress = cd?.isCurrentAddressSameAsPermanent === true;

    const personalBody = strip({
      displayName: ci?.displayName,
      firstName: ci?.firstName,
      middleName: ci?.middleName,
      lastName: ci?.lastName,
      gender: parsedGender !== null ? parsedGender : undefined,
      dateOfBirth: ci?.dateOfBirth,
      workPhone: cd?.workPhone,
      homePhone: cd?.homePhone,
      personalEmail: cd?.personalEmail,
      skypeId: cd?.skypeId,
      maritalStatus: parsedMarital !== null ? parsedMarital : undefined,
      marriageDate: bi?.marriageDate,
      bloodGroup: parsedBlood !== null ? parsedBlood : undefined,
      currentAddress: cd?.updateCurrentAddress === true ? cd?.currentAddress : undefined,
      permanentAddress: cd?.updateCurrentAddress === true
        ? (sameAddress ? cd?.currentAddress : cd?.permanentAddress)
        : undefined,
      professionalSummary: wi?.professionalSummary,
      nationality: parsedNationality !== null ? parsedNationality : undefined
    });

    if (personalBody && Object.keys(personalBody).length > 0) {
      const personalRes = await axios.request({
        method: 'put',
        url: `${base}/api/v1/hris/employees/personaldetails`,
        params: { employeeId },
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        data: personalBody
      });
      results.personalDetails = personalRes?.data;
    }
  }

  /* SALARY */

  if (sections.includes('salary')) {
    const salaryInput = context?.inputData?.salary;
    const bonusInput = salaryInput?.apiBonusDto;
    const addBonus = salaryInput?.add_bonus_information === true;

    let apiBonusDto = [];
    if (addBonus && bonusInput?.bonusId) {
      apiBonusDto = [{
        bounsId: bonusInput?.bonusId,
        amount: bonusInput?.amount ? Number(bonusInput.amount) : null,
        dueDate: bonusInput?.dueDate || null,
        note: bonusInput?.note || null
      }];
    }

    const salaryRes = await axios.request({
      method: 'put',
      url: `${base}/api/v1/payroll/employees/salary`,
      params: { employeeId },
      headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      data: {
        structureId: salaryInput?.structureId,
        amount: Number(salaryInput?.amount),
        effectiveFrom: salaryInput?.effectiveFrom,
        isBonusAmountIncludedInSalary: addBonus ? (bonusInput?.isBonusAmountIncludedInSalary ?? false) : false,
        apiBonusDto
      }
    });
    results.salary = salaryRes?.data;
  }

  /* BANK & FINANCIAL DETAILS */

  if (sections.includes('bankd')) {
    const fd = context?.inputData?.financialDetails;

    if (parsedSalaryPaymentMode === 1) {
      const bankId = fd?.bankDetails?.id;
      if (!bankId) return { message: 'Bank ID is required when payment mode is Bank Transfer.' };

      const financialRes = await axios.put(
        `${base}/api/v1/payroll/employees/financialdetails/banks?employeeId=${employeeId}`,
        {
          salaryPaymentMode: parsedSalaryPaymentMode,
          bankDetails: {
            id: bankId,
            branchName: fd?.bankDetails?.branchName||null,
            ifscCode: fd?.bankDetails?.ifscCode||null,
            accountNumber: fd?.bankDetails?.accountNumber||null,
            nameOnTheAccount: fd?.bankDetails?.nameOnTheAccount||null
          }
        },
        { headers: { accept: 'application/json', 'content-type': 'application/*+json' } }
      );
      results.financialDetails = financialRes?.data;

    } else {
      const financialRes = await axios.put(
        `${base}/api/v1/payroll/employees/financialdetails/banks?employeeId=${employeeId}`,
        { salaryPaymentMode: parsedSalaryPaymentMode },
        { headers: { accept: 'application/json', 'content-type': 'application/*+json' } }
      );
      results.financialDetails = financialRes?.data;
    }
  }

  return results;

} catch (error) {
  throw error;
}
```

---

# LIST Examples

LIST actions return multiple records. The defining UX move is a **Mode selector** ("Fetch All" / "Find Specific" / "Recently Updated") that reshapes the form, plus a **field-selection multiselect** so the response isn't bloated with every column.

## Keka — List All Employees


- **Category:** HR & Operations

**API Usage**


List Employees API: Retrieves employee records from Keka based on the selected fetch mode. The API supports pagination and filtering by employment status, notice period, probation status, last modified date, employee IDs, employee numbers, and search keywords.

**UI Components**


**Dropdown – How Do You Want to Fetch Employees?**

Allows users to choose how employee records should be retrieved:

* Fetch All Employees  
* Find Specific Employees  
* Recently Updated Employees

**Dropdown – Find Employee By** *(Visible only for "Find Specific Employees")*

Lets users choose whether to search employees using:

* Name / Email  
* Employee ID / Employee Number

**Text Field – Employee Name / Email**

Accepts one or more employee names or email addresses separated by commas to search for specific employees.

**Text Field – Employee ID / Employee Number**

Accepts one or more employee IDs or employee numbers separated by commas to retrieve matching employees.

**Input Group – Employee Filters**

Provides optional filters when fetching all or recently updated employees:

* Updated After  
* Employment Status  
* Notice Period  
* Probation Status

**AI Date Field – Updated After**

Accepts natural language or date input and automatically converts it into an ISO 8601 timestamp. If left empty while using the **Recently Updated Employees** mode, employees updated during the last **30 days** are retrieved.

**Multiselect – Fields to Include in Response**

Allows users to choose which employee attributes should be returned in the output. Common fields such as Employee Number, Full Name, Work Email, Job Title, Department, Joining Date, and Employment Status are preselected by default.

**API Flow**


1. Determines the selected fetch mode (All, Specific, or Recent).
2. Builds API query parameters using the selected filters, including employment status, notice period, probation status, and updated date.
3. For **Recently Updated Employees**, automatically uses the last 30 days as the default date range when no date is provided.
4. For **Fetch All Employees** and **Recently Updated Employees**, retrieves records across all available pages until every employee has been fetched.
5. For **Find Specific Employees**:

   * Searches by employee name or work email using the provided values.  
   * Alternatively searches by employee ID or employee number using exact matches.  
6. Supports multiple search values separated by commas for all specific search methods.
7. Removes duplicate employee records while processing employee ID and employee number searches.
8. Filters the final output to include only the response fields selected by the user.
9. Returns the matching employee records or a message indicating that no employees were found for the provided criteria.

**Input Fields JSON**

```json
[
  {
    "key": "mode",
    "help": "Choose how you want to fetch employees (all, recent, or specific).",
    "type": "dropdown",
    "label": "How Do You Want to Fetch Employees?",
    "options": [
      {
        "label": "Fetch All Employees",
        "value": "all"
      },
      {
        "label": "Find Specific Employees",
        "value": "specific"
      },
      {
        "label": "Recently Updated Employees",
        "value": "recent"
      }
    ],
    "required": true,
    "placeholder": "Select fetch mode",
    "defaultValue": {
      "label": "Fetch All Employees",
      "value": "all"
    },
    "customInputLabel": "Enter fetch mode",
    "customPlaceholder": "Fetch all employees"
  },
  {
    "key": "find_by",
    "help": "Choose how you want to find specific employees (by Name/Email, or Employee ID/Employee Number).",
    "type": "dropdown",
    "label": "Find Employee By",
    "options": [
      {
        "label": "Name / Email",
        "value": "name_email"
      },
      {
        "label": "Employee ID / Employee Number",
        "value": "id_number"
      }
    ],
    "required": true,
    "placeholder": "Select search method",
    "customInputLabel": "Enter search method",
    "customPlaceholder": "Name or Email",
    "visibilityCondition": "context.inputData.mode === 'specific'"
  },
  {
    "key": "search_name_email",
    "help": "Enter employee first name(s) or email address(es). You can enter multiple values separated by commas. Name matches are exact, while email matches depend on pagination.",
    "type": "string",
    "label": "Employee Name / Email",
    "required": true,
    "placeholder": "John Doe,john@company.com",
    "visibilityCondition": "context.inputData.mode === 'specific' && context.inputData.find_by === 'name_email'"
  },
  {
    "key": "search_employee_id_number",
    "help": "Enter employee ID(s) or employee number(s). You can enter multiple values separated by commas. Matching is exact, and employees matching any of the provided values will be returned.",
    "type": "string",
    "label": "Employee ID / Employee Number",
    "required": true,
    "placeholder": "EMP-001,550e8400-e29b-41d4 ",
    "visibilityCondition": "context.inputData.mode === 'specific' && context.inputData.find_by === 'id_number'"
  },
  {
    "key": "filters",
    "help": "Apply filters to narrow down employee results.",
    "type": "input groups",
    "label": "Employee Filters",
    "required": true,
    "visibilityCondition": "context.inputData.mode === 'all' || context.inputData.mode === 'recent'",
    "fields": [
      {
        "key": "updatedAfter",
        "help": "Enter a relative or specific date (e.g., yesterday, 3 days ago, 2024-06-01).If not provided it will automatically return employees updated in last 30 days.",
        "type": "aifield",
        "label": "Updated After",
        "prompt": "User will enter a date or relative time in natural language or a specific date (e.g., 'yesterday', '3 days ago', 'last week', '2024-06-01'). ALWAYS convert the input into a valid ISO 8601 UTC datetime string in the format YYYY-MM-DDTHH:mm:ssZ. Even if the input already looks like a date, still normalize it to ISO 8601. Return ONLY the ISO string. Do not include explanations, labels, or text.",
        "required": false,
        "placeholder": "yesterday",
        "visibilityCondition": "context.inputData.mode === 'recent'"
      },
      {
        "key": "employmentStatus",
        "help": "Filter employees by their current employment status. By default, both options are selected. You can also choose just one.",
        "type": "multiselect",
        "label": "Employment Status",
        "options": [
          {
            "label": "Working",
            "value": "Working"
          },
          {
            "label": "Relieved",
            "value": "Relieved"
          }
        ],
        "required": false,
        "placeholder": "Select employment status",
        "defaultValue": [
          {
            "label": "Working",
            "value": "Working"
          },
          {
            "label": "Relieved",
            "value": "Relieved"
          }
        ],
        "customInputLabel": "Enter employment status",
        "customPlaceholder": "Working"
      },
      {
        "key": "inNoticePeriod",
        "help": "Choose whether to fetch only employees who are currently serving a notice period or employees who are not on notice.",
        "type": "dropdown",
        "label": "Notice Period",
        "options": [
          {
            "label": "Only notice period employees",
            "value": true
          },
          {
            "label": "Employees not on notice",
            "value": false
          }
        ],
        "required": false,
        "placeholder": "Select notice period filter",
        "defaultValue": {
          "label": "Employees not on notice",
          "value": false
        },
        "customInputLabel": "Enter notice period filter",
        "customPlaceholder": "Only notice period employees"
      },
      {
        "key": "inProbation",
        "help": "Choose whether to fetch only employees who are currently in probation or permanent employees.",
        "type": "dropdown",
        "label": "Probation",
        "options": [
          {
            "label": "Only probation employees",
            "value": true
          },
          {
            "label": "Permanent Employees",
            "value": false
          }
        ],
        "required": false,
        "placeholder": "Select probation filter",
        "defaultValue": {
          "label": "Permanent Employees",
          "value": false
        },
        "customInputLabel": "Enter probation filter",
        "customPlaceholder": "Only probation employees"
      }
    ]
  },
  {
    "key": "select_response_fields",
    "help": "Select the employee fields to return in the response. Essential fields are preselected by default, and you can add or remove fields as required.",
    "type": "multiselect",
    "label": "Fields to Include in Response",
    "options": [
      {
        "label": "Employee ID",
        "value": "id"
      },
      {
        "label": "Employee Number",
        "value": "employeeNumber"
      },
      {
        "label": "First Name",
        "value": "firstName"
      },
      {
        "label": "Middle Name",
        "value": "middleName"
      },
      {
        "label": "Last Name",
        "value": "lastName"
      },
      {
        "label": "Full Name",
        "value": "displayName"
      },
      {
        "label": "Work Email",
        "value": "email"
      },
      {
        "label": "Personal Email",
        "value": "personalEmail"
      },
      {
        "label": "Job Title",
        "value": "jobTitle.title"
      },
      {
        "label": "Job Title Code",
        "value": "jobTitle.identifier"
      },
      {
        "label": "Secondary Job Title",
        "value": "secondaryJobTitle"
      },
      {
        "label": "Reports To (Manager)",
        "value": "reportsTo"
      },
      {
        "label": "Manager ID",
        "value": "reportsTo.id"
      },
      {
        "label": "Manager Name",
        "value": "reportsTo.firstName"
      },
      {
        "label": "Manager Email",
        "value": "reportsTo.email"
      },
      {
        "label": "L2 Manager",
        "value": "l2Manager"
      },
      {
        "label": "Dotted Line Manager",
        "value": "dottedLineManager"
      },
      {
        "label": "Contingent Type",
        "value": "contingentType.name"
      },
      {
        "label": "Time Type",
        "value": "timeType"
      },
      {
        "label": "Worker Type",
        "value": "workerType"
      },
      {
        "label": "Employment Status",
        "value": "employmentStatus"
      },
      {
        "label": "Account Status",
        "value": "accountStatus"
      },
      {
        "label": "Invitation Status",
        "value": "invitationStatus"
      },
      {
        "label": "Joining Date",
        "value": "joiningDate"
      },
      {
        "label": "Probation End Date",
        "value": "probationEndDate"
      },
      {
        "label": "Resignation Submitted Date",
        "value": "resignationSubmittedDate"
      },
      {
        "label": "Exit Date",
        "value": "exitDate"
      },
      {
        "label": "Exit Status",
        "value": "exitStatus"
      },
      {
        "label": "Exit Type",
        "value": "exitType"
      },
      {
        "label": "Exit Reason",
        "value": "exitReason"
      },
      {
        "label": "Mobile Phone",
        "value": "mobilePhone"
      },
      {
        "label": "Work Phone",
        "value": "workPhone"
      },
      {
        "label": "Home Phone",
        "value": "homePhone"
      },
      {
        "label": "City",
        "value": "city"
      },
      {
        "label": "Country",
        "value": "countryCode"
      },
      {
        "label": "Current Address",
        "value": "currentAddress"
      },
      {
        "label": "Permanent Address",
        "value": "permanentAddress"
      },
      {
        "label": "Gender",
        "value": "gender"
      },
      {
        "label": "Date of Birth",
        "value": "dateOfBirth"
      },
      {
        "label": "Marital Status",
        "value": "maritalStatus"
      },
      {
        "label": "Marriage Date",
        "value": "marriageDate"
      },
      {
        "label": "Nationality",
        "value": "nationality"
      },
      {
        "label": "Blood Group",
        "value": "bloodGroup"
      },
      {
        "label": "Attendance Number",
        "value": "attendanceNumber"
      },
      {
        "label": "Total Experience (Days)",
        "value": "totalExperienceInDays"
      },
      {
        "label": "Groups / Department",
        "value": "groups"
      },
      {
        "label": "Leave Plan",
        "value": "leavePlanInfo.title"
      },
      {
        "label": "Band",
        "value": "bandInfo.title"
      },
      {
        "label": "Pay Grade",
        "value": "payGradeInfo.title"
      },
      {
        "label": "Shift Policy",
        "value": "shiftPolicyInfo.title"
      },
      {
        "label": "Weekly Off Policy",
        "value": "weeklyOffPolicyInfo.title"
      },
      {
        "label": "Holiday Calendar ID",
        "value": "holidayCalendarId"
      },
      {
        "label": "Capture Scheme",
        "value": "captureSchemeInfo.title"
      },
      {
        "label": "Tracking Policy",
        "value": "trackingPolicyInfo.title"
      },
      {
        "label": "Expense Policy",
        "value": "expensePolicyInfo.title"
      },
      {
        "label": "Overtime Policy",
        "value": "overtimePolicyInfo.title"
      },
      {
        "label": "Profile Photo",
        "value": "image"
      }
    ],
    "required": false,
    "placeholder": "Select fields",
    "defaultValue": [
      {
        "label": "Employee Number",
        "value": "employeeNumber"
      },
      {
        "label": "Full Name",
        "value": "displayName"
      },
      {
        "label": "Work Email",
        "value": "email"
      },
      {
        "label": "Mobile Phone",
        "value": "mobilePhone"
      },
      {
        "label": "Job Title",
        "value": "jobTitle.title"
      },
      {
        "label": "Reports To (Manager)",
        "value": "reportsTo"
      },
      {
        "label": "Employment Status",
        "value": "employmentStatus"
      },
      {
        "label": "Account Status",
        "value": "accountStatus"
      },
      {
        "label": "Joining Date",
        "value": "joiningDate"
      },
      {
        "label": "Date of Birth",
        "value": "dateOfBirth"
      },
      {
        "label": "Groups / Department",
        "value": "groups"
      },
      {
        "label": "City",
        "value": "city"
      }
    ],
    "customInputLabel": "Enter field name",
    "customPlaceholder": "firstName"
  }
]
```

**API Configuration Perform Code**

```javascript
try {  
 const {  
 mode,  
 find_by,  
 search_name_email,  
 search_employee_id_number,  
 filters,  
 pageNumber,  
 pageSize,  
 select_response_fields  
 } = context.inputData;  
/* ---------------------------  
 Extract filters  
 ---------------------------- */  
 const employmentStatus = filters?.employmentStatus;  
 const inNoticePeriod = filters?.inNoticePeriod;  
 const inProbation = filters?.inProbation;  
 const updatedAfter = filters?.updatedAfter;  
/* ---------------------------  
 Handle "Recent" logic  
 - Default = last 30 days  
 - updatedAfter can be date-only or ISO  
 ---------------------------- */  
 let lastModifiedDate;  
if (mode === 'recent') {  
 if (updatedAfter) {  
 lastModifiedDate = updatedAfter;  
 } else {  
 const d = new Date();  
 d.setDate(d.getDate() - 30);  
 lastModifiedDate = d.toISOString();  
 }  
 }  
/* ---------------------------  
 Base query params  
 ---------------------------- */  
 let baseParams = {  
 employmentStatus:  
 Array.isArray(employmentStatus) && employmentStatus.length  
 ? employmentStatus.join(',')  
 : undefined,  
 lastModified: lastModifiedDate,  
 inNoticePeriod: inNoticePeriod,  
 inProbation: inProbation  
 };  
let employees = [];  
 let seenIds = new Set();  
/* =====================================================  
 FETCH ALL / RECENT EMPLOYEES  
 ====================================================== */  
 if (mode === 'all' || mode === 'recent') {  
let page = 1;    
const size = 200;    
let totalPages = 1;

while (page <= totalPages) {

  const res = await axios.request({    
    method: 'get',    
    maxBodyLength: Infinity,    
    url: `https://${context.authData.company}.${context.authData.environment}.com/api/v1/hris/employees`,    
    params: {    
      ...baseParams,    
      pageNumber: page,    
      pageSize: size    
    }    
  });

  const data = res.data?.data || [];    
  totalPages = res.data?.totalPages || 1;

  employees.push(...data);

  page++;    
}  
}  
/* =====================================================  
 FIND BY NAME / EMAIL  
 ====================================================== */  
 if (mode === 'specific' && find_by === 'name_email' && search_name_email) {  
const values = search_name_email    
  .split(',')    
  .map(v => v.trim())    
  .filter(Boolean);

const nameValues = values.filter(v => !v.includes('@')).map(v => v.toLowerCase());    
const emailValues = values.filter(v => v.includes('@')).map(v => v.toLowerCase());

let page = 1;    
const size = 200;    
let totalPages = 1;    
let found = false;

while (page <= totalPages && !found) {

  let params = {    
    ...baseParams,    
    pageNumber: page,    
    pageSize: size    
  };

  if (nameValues.length) {    
    params.searchKey = nameValues.join(',');    
  }

  let res = await axios.request({    
    method: 'get',    
    maxBodyLength: Infinity,    
    url: `https://${context.authData.company}.${context.authData.environment}.com/api/v1/hris/employees`,    
    params: params    
  });

  const data = res.data?.data || [];    
  totalPages = res.data?.totalPages || 1;

  if (!data.length && page === 1) {    
    const fallbackRes = await axios.request({    
      method: 'get',    
      maxBodyLength: Infinity,    
      url: `https://${context.authData.company}.${context.authData.environment}.com/api/v1/hris/employees`,    
      params: {    
        ...baseParams,    
        pageNumber: page,    
        pageSize: size    
      }    
    });

    const fallbackData = fallbackRes.data?.data || [];    
    totalPages = fallbackRes.data?.totalPages || 1;

    for (let emp of fallbackData) {

      const firstName = emp.firstName?.toLowerCase();    
      const displayName = emp.displayName?.toLowerCase();    
      const email = emp.email?.toLowerCase();

      if (    
        (nameValues.length &&    
          (nameValues.includes(firstName) || nameValues.includes(displayName))) ||    
        (emailValues.length && emailValues.includes(email))    
      ) {    
        employees.push(emp);    
        found = true;    
        break;    
      }    
    }

  } else {

    for (let emp of data) {

      const firstName = emp.firstName?.toLowerCase();    
      const displayName = emp.displayName?.toLowerCase();    
      const email = emp.email?.toLowerCase();

      if (    
        (nameValues.length &&    
          (nameValues.includes(firstName) || nameValues.includes(displayName))) ||    
        (emailValues.length && emailValues.includes(email))    
      ) {    
        employees.push(emp);    
        found = true;    
        break;    
      }    
    }    
  }

  page++;    
}  
}  
/* =====================================================  
 FIND BY EMPLOYEE ID / NUMBER  
 ====================================================== */  
 if (mode === 'specific' && find_by === 'id_number' && search_employee_id_number) {  
const values = search_employee_id_number    
  .split(',')    
  .map(v => v.trim())    
  .filter(Boolean);

const employeeIds = [];    
const employeeNumbers = [];

values.forEach(v => {    
  if (v.includes('-') && v.length > 20) {    
    employeeIds.push(v);    
  } else {    
    employeeNumbers.push(v);    
  }    
});

if (employeeIds.length || employeeNumbers.length) {

  let page = 1;    
  const size = 200;    
  let totalPages = 1;    
  let found = false;

  while (page <= totalPages && !found) {

    const res = await axios.request({    
      method: 'get',    
      maxBodyLength: Infinity,    
      url: `https://${context.authData.company}.${context.authData.environment}.com/api/v1/hris/employees`,    
      params: {    
        ...baseParams,    
        employeeIds: employeeIds.length ? employeeIds.join(',') : undefined,    
        employeeNumbers: employeeNumbers.length ? employeeNumbers.join(',') : undefined,    
        pageNumber: page,    
        pageSize: size    
      }    
    });

    const data = res.data?.data || [];    
    totalPages = res.data?.totalPages || 1;

    for (let emp of data) {    
      if (!seenIds.has(emp.id)) {    
        seenIds.add(emp.id);    
        employees.push(emp);    
        found = true;    
        break;    
      }    
    }

    page++;    
  }    
}  
}  
/* =====================================================  
 FINAL RESPONSE  
 ====================================================== */  
 if (!employees.length) {  
 return {  
 message: "No employees were found for the selected criteria or page. Please check the provided values and try again."  
 };  
 }  
if (select_response_fields?.length) {  
 employees = employees.map(emp =>  
 select_response_fields.reduce((obj, key) => {  
 obj[key] = emp[key] ?? null;  
 return obj;  
 }, {})  
 );  
 }  
return employees;  
} catch (error) {  
 return await errorComponent(error);   
 }
```

## viaSocket Table — Get Table Rows

**Metadata**
- **App:** viaSocket Table
- **Category:** Database / Data Storage
- **Action:** Get Table Rows
- **Action Type:** FIND / SEARCH

**UX Components & Field Design**

| Field | Type | Key | Purpose |
|---|---|---|---|
| Table | dropdown | `table` | Table selector |
| Filter Mode | dropdown | `filter_mode` | 4 modes: list_all, filter_formula, query, key_value |
| Select Column(s) | multiselect | `field_id` | For filter_formula mode |
| Filter Conditions | input groups (fieldsGenerator) | `Filter_op` | Dynamic filter builder with operator + value per column |
| Generate Query by AI | aifield | `query1` | AI-powered natural language → SQL filter |
| Query Help | help (dynamic) | `QueryHelpField` | Auto-generated column reference for AI query |
| Select Columns for Key/Value | multiselect | `key_value_columns` | For key_value mode |
| Enter Values | input groups (fieldsGenerator) | `key_value_input_groups` | Dynamic value inputs matching selected columns |
| Query Options | input groups | `queryopt` | Limit, offset, sort, field selection |
| Key/Value Filter Help | help | `key_value_help` | Static help for key/value limitations |

**Key UX Patterns**
- **Multi-mode filter**: 4 filter modes from simple (list_all) to advanced (AI query)
- **AI field type**: `type: "aifield"` with prompt and suggestionGenerator for natural language filtering
- **Dynamic filter builder**: fieldsGenerator creates operator/value pairs per selected column with correct types (number, boolean, string)
- **Shared query options**: Limit/offset/sort apply across all filter modes

**UX Takeaways**
- Progressive complexity: list_all → key_value → filter_formula → AI query
- `aifield` type with `prompt` and `suggestionGenerator` enables natural language queries
- Dynamic filter builders should adapt field types based on column schema (number columns get number inputs)

---

# FIND / SEARCH Examples

FIND/SEARCH actions locate records by criteria rather than a known ID. Recurring UX: a lookup-field selector + operator + value, an optional bulk/exhaustive mode, and a response-shape control.

## LeadSquared — Search Leads by Criteria

**Metadata**
- **App:** LeadSquared
- **Category:** CRM / Sales Automation
- **Action:** Search Leads by Criteria
- **Action Type:** FIND/SEARCH

**Supporting API Usage**
- **LeadsMetaData.Get** — the field metadata endpoint; feeds the *Lookup Field*, *Sort By*, and *Custom Columns* dropdowns so the user searches/sorts/returns only real schema fields. Note it degrades gracefully: if the API host is missing it returns a single "reconnect account" option instead of erroring.
- **Leads.Get** — the paged search endpoint used by the perform code.

**UX Components & Field Design**
- **`searchField` (dynamic dropdown)** — the lead field to filter on, labelled `Display Name (SchemaName)` so both the human name and the API key are visible.
- **`operator` (static dropdown)** — `=`, `LIKE`, `>`, `<`, `>=`, `<=`, `<>`.
- **`searchValue` (string)** — the value to match.
- **`bulkMode` (boolean)** — "Fetch All Matching Leads" via pagination. This toggle then reveals `maxBulkRecords` (bulk on) or `maxRecords` (bulk off) — a clean example of one boolean forking two different limit fields.
- **`sortField` (dynamic dropdown)** and **`sortDirection` (static dropdown)** — ordering.
- **`responseMode` (static dropdown)** — Basic / Custom Columns / Full Raw Data. Selecting "custom" reveals **`customColumns` (dynamic multiselect)**. This is the **Basic-vs-Detailed response pattern** as a dropdown with a custom middle option.

**Input Fields JSON**
```json
[
  {
    "key": "searchField",
    "help": "Choose the lead field you want to filter by. Example: EmailAddress, Phone, FirstName.",
    "type": "dropdown",
    "label": "Lookup Field",
    "required": true,
    "placeholder": "Select field to search (e.g., EmailAddress)",
    "optionsGenerator": "async function generate() {\n  try {\n    const host = context?.authData?.apiHost;\n    if (!host) return [{ label: 'Reconnect account to load fields', value: '' }];\n    const url = `https://${host}.leadsquared.com/v2/LeadManagement.svc/LeadsMetaData.Get`;\n    const response = await axios.get(url);\n    const data = response?.data || {};\n    const candidates = [data.Fields, data.fields, data.FieldList, data.FieldListResponse, data?.Data, data];\n    let fieldsArr = [];\n    for (const c of candidates) {\n      if (Array.isArray(c)) { fieldsArr = c; break; }\n      if (c && typeof c === 'object' && Array.isArray(c.Fields)) { fieldsArr = c.Fields; break; }\n    }\n    if (!fieldsArr.length) return [{ label: 'No searchable fields found', value: '' }];\n    return fieldsArr\n      .filter(f => f.IsVisible !== false)\n      .map(f => {\n        const schema = f.SchemaName || f.FieldName || f.Name || f.Key;\n        const label = f.DisplayName || f.Label || schema;\n        if (!schema) return null;\n        return { label: `${label} (${schema})`, value: schema };\n      })\n      .filter(Boolean)\n      .sort((a, b) => a.label.localeCompare(b.label));\n  } catch (err) {\n    return [{ label: 'Unable to load fields', value: '' }];\n  }\n}\nreturn await generate();"
  },
  {
    "key": "operator",
    "help": "Choose how the value should be compared. Example: '=' for exact match, 'LIKE' for partial match.",
    "type": "dropdown",
    "label": "Operator",
    "options": [
      { "label": "Equals (=)", "value": "=" },
      { "label": "Contains (LIKE)", "value": "LIKE" },
      { "label": "Greater Than (>)", "value": ">" },
      { "label": "Less Than (<)", "value": "<" },
      { "label": "Greater or Equal (>=)", "value": ">=" },
      { "label": "Less or Equal (<=)", "value": "<=" },
      { "label": "Not Equal (<>)", "value": "<>" }
    ],
    "required": true,
    "placeholder": "Select comparison operator"
  },
  {
    "key": "searchValue",
    "help": "Enter the value to search for. For date fields use format: YYYY-MM-DD HH:MM:SS. Example: 2024-01-01 00:00:00",
    "type": "string",
    "label": "Lookup Value",
    "required": true,
    "placeholder": "Enter value (e.g., test@example.com)"
  },
  {
    "key": "bulkMode",
    "help": "Enable this to fetch all matching leads using pagination. Recommended only for large exports. May take longer to execute.",
    "type": "boolean",
    "label": "Fetch All Matching Leads",
    "options": [
      { "label": "Yes", "value": true, "sample": "Yes" },
      { "label": "No", "value": false, "sample": "No" }
    ],
    "required": true
  },
  {
    "key": "maxBulkRecords",
    "help": "Maximum number of leads to retrieve in bulk mode. Recommended maximum: 25000.",
    "type": "number",
    "label": "Maximum Records to Fetch",
    "required": false,
    "visibilityCondition": "context?.inputData?.bulkMode === true"
  },
  {
    "key": "maxRecords",
    "help": "Limits the number of records returned. Example: 50. Maximum allowed value is 1000.",
    "type": "number",
    "label": "Maximum Records to Return",
    "required": false,
    "placeholder": "Default 100 (maximum 1000)",
    "defaultValue": 100,
    "visibilityCondition": "context?.inputData?.bulkMode === false"
  },
  {
    "key": "sortField",
    "help": "Choose which field should determine the order of results. Example: CreatedOn, ModifiedOn.",
    "type": "dropdown",
    "label": "Sort By",
    "required": false,
    "placeholder": "Select field to sort by (default: CreatedOn)",
    "optionsGenerator": "async function generate() {\n  try {\n    const host = context?.authData?.apiHost;\n    if (!host) return [{ label: 'Missing API host. Please reconnect your account.', value: '' }];\n    const url = `https://${host}.leadsquared.com/v2/LeadManagement.svc/LeadsMetaData.Get`;\n    const response = await axios.get(url);\n    const data = response?.data || {};\n    const candidates = [data.Fields, data.FieldList, data.fields, data.FieldListResponse, data?.Data, data];\n    let fieldsArr = [];\n    for (const c of candidates) {\n      if (Array.isArray(c)) { fieldsArr = c; break; }\n      if (c && typeof c === 'object' && Array.isArray(c.Fields)) { fieldsArr = c.Fields; break; }\n    }\n    if (!fieldsArr.length) return [{ label: 'No fields available for sorting.', value: '' }];\n    return fieldsArr.map(f => { const schema = f.SchemaName || f.FieldName || f.Name || f.Key; const label = f.DisplayName || f.Label || schema; if (!schema) return null; return { label: `${label} (${schema})`, value: schema }; }).filter(Boolean).sort((a, b) => a.label.localeCompare(b.label));\n  } catch (err) {\n    return [{ label: 'Error loading sorting fields', value: '' }];\n  }\n}\nreturn await generate();"
  },
  {
    "key": "sortDirection",
    "help": "Choose result order. Descending shows newest records first. Ascending shows oldest first.",
    "type": "dropdown",
    "label": "Sort Direction",
    "options": [
      { "label": "Descending (Newest First)", "value": "1" },
      { "label": "Ascending (Oldest First)", "value": "0" }
    ],
    "required": false,
    "placeholder": "Select sorting order",
    "defaultValue": "1"
  },
  {
    "key": "responseMode",
    "help": "Basic returns essential lead fields. Custom allows selecting specific columns. Full returns all available data.",
    "type": "dropdown",
    "label": "Response Mode",
    "options": [
      { "label": "Basic", "value": "basic", "sample": "Recommended" },
      { "label": "Custom Columns", "value": "custom" },
      { "label": "Full Raw Data", "value": "full" }
    ],
    "required": false,
    "placeholder": "Select response format",
    "defaultValue": { "label": "Basic", "value": "basic", "sample": "Recommended" }
  },
  {
    "key": "customColumns",
    "help": "Select specific fields to return when Response Mode is set to Custom.",
    "type": "multiselect",
    "label": "Select Columns",
    "required": false,
    "placeholder": "Select fields to include",
    "optionsGenerator": "try {\n  const host = context?.authData?.apiHost;\n  if (!host) return [{ label: 'Missing API host. Please reconnect your account.', value: '' }];\n  const url = `https://${host}.leadsquared.com/v2/LeadManagement.svc/LeadsMetaData.Get`;\n  const response = await axios.get(url);\n  const data = response?.data || {};\n  const candidates = [data.Fields, data.FieldList, data.fields, data.FieldListResponse, data?.Data, data];\n  let fieldsArr = [];\n  for (const c of candidates) {\n    if (Array.isArray(c)) { fieldsArr = c; break; }\n    if (c && typeof c === 'object' && Array.isArray(c.Fields)) { fieldsArr = c.Fields; break; }\n  }\n  if (!fieldsArr.length) return [{ label: 'No fields available.', value: '' }];\n  return fieldsArr.map(f => { const schema = f.SchemaName || f.FieldName || f.Name || f.Key; const label = f.DisplayName || f.Label || schema; if (!schema) return null; return { label: `${label} (${schema})`, value: schema }; }).filter(Boolean).sort((a, b) => a.label.localeCompare(b.label));\n} catch (err) {\n  return [{ label: 'Error loading fields', value: '' }];\n}",
    "visibilityCondition": "context.inputData.responseMode === 'custom'"
  }
]
```

**API Configuration Perform Code**
```javascript
try {
  const startTime = Date.now();
  const apiHost = context.authData?.apiHost;
  const apiUrl = `https://${apiHost}.leadsquared.com/v2/LeadManagement.svc/Leads.Get`;
  const input = context.inputData;
  const delay = ms => new Promise(r => setTimeout(r, ms));

  const isBulk = input.bulkMode === true;
  const standardPageSize = Number(input.maxRecords) || 100;
  const bulkPageSize = 1000;
  const maxBulkRecords = Number(input.maxBulkRecords) || 45000;
  const MAX_PAGES = 50;

  let PageIndex = 1;
  let allResults = [];
  let pagesFetched = 0;
  let capped = false;

  const buildPayload = () => {
    const payload = {
      Parameter: {
        LookupName: input.searchField,
        LookupValue: input.searchValue,
        SqlOperator: input.operator
      },
      Paging: {
        PageIndex,
        PageSize: isBulk ? bulkPageSize : standardPageSize
      }
    };

    if (input.sortField && (input.sortDirection === "0" || input.sortDirection === "1")) {
      payload.Sorting = { ColumnName: input.sortField, Direction: Number(input.sortDirection) };
    }

    if (input.responseMode === "basic") {
      payload.Columns = { Include_CSV: "ProspectID,FirstName,LastName,EmailAddress,Phone,CreatedOn" };
    }
    if (input.responseMode === "custom" && Array.isArray(input.customColumns) && input.customColumns.length > 0) {
      payload.Columns = { Include_CSV: input.customColumns.join(",") };
    }

    return payload;
  };

  // STANDARD MODE
  if (!isBulk) {
    const response = await axios.post(apiUrl, buildPayload(), { headers: { "Content-Type": "application/json" } });
    const records = response.data?.Data || response.data || [];
    return records;
  }

  // BULK MODE
  while (pagesFetched < MAX_PAGES) {
    try {
      const response = await axios.post(apiUrl, buildPayload(), { headers: { "Content-Type": "application/json" } });
      const records = response.data?.Data || response.data || [];
      allResults.push(...records);
      pagesFetched++;
      if (records.length < bulkPageSize) break;
      if (allResults.length >= maxBulkRecords) { capped = true; break; }
      PageIndex++;
      await delay(200);
    } catch (err) {
      if (err?.response?.status === 429) { await delay(5000); continue; }
      throw err;
    }
    if (Date.now() - startTime > 60000) { capped = true; break; }
  }

  return allResults;
} catch (error) {
  await errorComponent(error);
}
```

**UX Takeaways**
- **Label dropdown options as `Display Name (schemaKey)`** when the API key differs from the human name — the user picks by meaning but the value stays correct.
- **Degrade generators gracefully**: on missing auth or empty schema, return a single explanatory option instead of throwing, so the form never looks broken.
- A single **`bulkMode` boolean** can fork two different limit fields (`maxBulkRecords` vs `maxRecords`) via mirrored `visibilityCondition`s.
- **Response Mode (Basic / Custom / Full)** is the standard way to control payload size; "Custom" reveals a column multiselect.
- Respect runtime limits in bulk mode: cap pages, cap records, honor 429 backoff, and bail near the 60s execution ceiling.

---

## Google Calendar — List all Events

**Metadata**
- **App:** Google Calendar
- **Category:** Productivity / Scheduling / Calendar
- **Action:** List all Events
- **Action Type:** LIST

**Supporting API Usage**
- **List Calendars API** (`fetch_calendars()`) — populates the `calendarId` dropdown so the user can select a calendar by name or enter a custom calendar ID.
- **Events List API** (`/calendar/v3/calendars/{calendarId}/events`) — supports pagination via `pageToken`, filtering by `timeMin`, `timeMax`, `q` (search query), `eventTypes` (multiselect), `timeZone`, `showDeleted`, and `showHiddenInvitations`.

**UX Components & Field Design**
- **Dropdown (with custom input) — Calendar (`calendarId`)** — select from the user's available calendars or map a calendar ID directly (`customInputLabel`, `customHelp`, `customPlaceholder`).
- **Dropdown (Static) — Time Range (`date_mode`)** — allows the user to choose between three clear time filtering modes:
  - *All Upcoming Events (`all`)* — defaults `timeMin` to `now.toISOString()` to retrieve all future events.
  - *Relative Range (`relative`)* — reveals `relative_days` (number: positive for future days e.g. `7`, negative for past days e.g. `-2`), automatically calculating `timeMin` and `timeMax` relative to the current timestamp.
  - *Fixed Date Range (`fixed`)* — reveals `timeMin` ("Start Date-Time") and `timeMax` ("End Date-Time"), accepting `YYYY-MM-DD HH:MM` or `YYYY-MM-DD` and normalizing them internally to ISO strings (`00:00:00Z` or `23:59:59Z`).
- **Number — Days from Today (`relative_days`)** — visible when `date_mode === 'relative'`; supports positive numbers (future) and negative numbers (past).
- **String — Start Date-Time & End Date-Time (`timeMin`, `timeMax`)** — visible when `date_mode === 'fixed'`; accepts `YYYY-MM-DD HH:MM` (24-hour) or `YYYY-MM-DD`.
- **String — Search Query (`search_query`)** — optional text search across event title, description, location, attendee names/emails, and organizer.
- **Multiselect (Static) — Event Types (`event_types`)** — curated list of event types (*Regular Events*, *Birthday*, *Focus Time*, *From Gmail*, *Out of Office*, *Working Location*) with custom input support.
- **Dropdown (Static) — Time Zone (`timeZone`)** — popular IANA timezone options with custom input for entering any valid IANA timezone string.
- **Boolean — Include Deleted Events (`show_deleted`) & Include Hidden Invitations (`show_hidden_invitations`)** — boolean toggles defaulting to `No`.
- **Number — Max Results (`maxResults`)** — optional total count cap (e.g. `250`); perform code loops internal pages (up to 20 pages) until `maxResults` is reached.

**Input Fields JSON**
```json
[
  {
    "key": "calendarId",
    "help": "Select or Enter your calendar ID",
    "type": "dropdown",
    "label": "Calendar",
    "required": true,
    "customHelp": "Use the 'List Calendar' action to get all calendar along with their IDs and then map the retrieved data accordingly",
    "customInputLabel": "Enter your calendar Id.",
    "optionsGenerator": "try {\nreturn await fetch_calendars() \n\n} catch (error) {\n  throw error \n}",
    "customPlaceholder": "test@gmail.com"
  },
  {
    "key": "date_mode",
    "help": "Choose how you want to filter events by time range.",
    "type": "dropdown",
    "label": "Time Range",
    "options": [
      {
        "label": "All Upcoming Events",
        "value": "all",
        "sample": "all"
      },
      {
        "label": "Relative Range (e.g. Next 7 Days)",
        "value": "relative",
        "sample": "relative"
      },
      {
        "label": "Fixed Date Range",
        "value": "fixed",
        "sample": "fixed"
      }
    ],
    "required": true,
    "defaultValue": {
      "label": "All Upcoming Events",
      "value": "all",
      "sample": "all"
    }
  },
  {
    "key": "relative_days",
    "help": "Enter the number of days from today to fetch events for. Use a positive number for future days (e.g., 7 for next 7 days) or a negative number for past days (e.g., -2 for 2 days ago). Events will be fetched between today and the entered day.",
    "type": "number",
    "label": "Days from Today",
    "required": true,
    "placeholder": "7 or -2",
    "visibilityCondition": "context.inputData.date_mode === 'relative'"
  },
  {
    "key": "timeMin",
    "help": "Enter the start date & time in this format only: YYYY-MM-DD HH:MM (24-hour). Date only (YYYY-MM-DD) is also accepted.",
    "type": "string",
    "label": "Start Date-Time",
    "required": false,
    "placeholder": "2026-08-01 09:00",
    "visibilityCondition": "context.inputData.date_mode === 'fixed'"
  },
  {
    "key": "timeMax",
    "help": "Enter the end date & time in this format only: YYYY-MM-DD HH:MM (24-hour). Date only (YYYY-MM-DD) is also accepted.",
    "type": "string",
    "label": "End Date-Time",
    "required": false,
    "placeholder": "2026-08-31 18:00",
    "visibilityCondition": "context.inputData.date_mode === 'fixed'"
  },
  {
    "key": "search_query",
    "help": "Type any word to find matching events. It searches the event title, description, location, and the names and emails of attendees and the organizer.",
    "type": "string",
    "label": "Search Query",
    "required": false,
    "placeholder": "Team sync"
  },
  {
    "key": "event_types",
    "help": "Select the type(s) of events to include. Leave empty to include all event types.",
    "type": "multiselect",
    "label": "Event Types",
    "options": [
      {
        "label": "Regular Events",
        "value": "default",
        "sample": "default"
      },
      {
        "label": "Birthday",
        "value": "birthday",
        "sample": "birthday"
      },
      {
        "label": "Focus Time",
        "value": "focusTime",
        "sample": "focusTime"
      },
      {
        "label": "From Gmail",
        "value": "fromGmail",
        "sample": "fromGmail"
      },
      {
        "label": "Out of Office",
        "value": "outOfOffice",
        "sample": "outOfOffice"
      },
      {
        "label": "Working Location",
        "value": "workingLocation",
        "sample": "workingLocation"
      }
    ],
    "required": false,
    "customInputLabel": "Enter Event Types",
    "customPlaceholder": "[\"default\", \"birthday\" ]"
  },
  {
    "key": "timeZone",
    "help": "Select the time zone for the event.",
    "type": "dropdown",
    "label": "Time Zone",
    "options": [
      {
        "label": "America/New_York (Eastern Time)",
        "value": "America/New_York"
      },
      {
        "label": "America/Chicago (Central Time)",
        "value": "America/Chicago"
      },
      {
        "label": "America/Denver (Mountain Time)",
        "value": "America/Denver"
      },
      {
        "label": "America/Los_Angeles (Pacific Time)",
        "value": "America/Los_Angeles"
      },
      {
        "label": "Europe/London (Greenwich Mean Time)",
        "value": "Europe/London"
      },
      {
        "label": "Europe/Paris (Central European Time)",
        "value": "Europe/Paris"
      },
      {
        "label": "Europe/Berlin (Central European Time)",
        "value": "Europe/Berlin"
      },
      {
        "label": "Asia/Tokyo (Japan Standard Time)",
        "value": "Asia/Tokyo"
      },
      {
        "label": "Asia/Shanghai (China Standard Time)",
        "value": "Asia/Shanghai"
      },
      {
        "label": "Asia/Kolkata (India Standard Time)",
        "value": "Asia/Kolkata"
      },
      {
        "label": "Australia/Sydney (Australian Eastern Time)",
        "value": "Australia/Sydney"
      },
      {
        "label": "Asia/Dubai (Gulf Standard Time)",
        "value": "Asia/Dubai"
      },
      {
        "label": "Europe/Moscow (Moscow Standard Time)",
        "value": "Europe/Moscow"
      },
      {
        "label": "America/Toronto (Eastern Time)",
        "value": "America/Toronto"
      },
      {
        "label": "America/Mexico_City (Central Time)",
        "value": "America/Mexico_City"
      },
      {
        "label": "America/Sao_Paulo (Brasilia Time)",
        "value": "America/Sao_Paulo"
      },
      {
        "label": "Africa/Johannesburg (South Africa Standard Time)",
        "value": "Africa/Johannesburg"
      },
      {
        "label": "Asia/Singapore (Singapore Time)",
        "value": "Asia/Singapore"
      },
      {
        "label": "Europe/Madrid (Central European Time)",
        "value": "Europe/Madrid"
      },
      {
        "label": "Asia/Hong_Kong (Hong Kong Time)",
        "value": "Asia/Hong_Kong"
      }
    ],
    "required": false,
    "customHelp": "Enter the time zone in IANA format. Leave empty to use the calendar's default time zone.",
    "placeholder": "Choose Time Zone",
    "customInputLabel": "Enter Time Zone",
    "customPlaceholder": "America/New_York"
  },
  {
    "key": "show_deleted",
    "help": "Choose whether to include cancelled/deleted events in the results.",
    "type": "boolean",
    "label": "Include Deleted Events",
    "options": [
      {
        "label": "Yes",
        "value": true
      },
      {
        "label": "No",
        "value": false
      }
    ],
    "required": false,
    "defaultValue": {
      "label": "No",
      "value": false
    }
  },
  {
    "key": "show_hidden_invitations",
    "help": "Choose whether to include hidden invitations in the results.",
    "type": "boolean",
    "label": "Include Hidden Invitations",
    "options": [
      {
        "label": "Yes",
        "value": true
      },
      {
        "label": "No",
        "value": false
      }
    ],
    "required": false,
    "defaultValue": {
      "label": "No",
      "value": false
    }
  },
  {
    "key": "maxResults",
    "help": "Maximum number of events to return in total. Leave empty to fetch all matching events.",
    "type": "number",
    "label": "Max Results",
    "required": false,
    "placeholder": "250"
  }
]
```

**API Configuration Perform Code**
```javascript
async function fetchEvents() {
    const data = context.inputData;

    const MAX_PAGES = 20;
    const PAGE_SIZE = 250;

    const toBoolean = (val) => {
        if (typeof val === 'boolean') return val;
        if (val && typeof val === 'object') return toBoolean(val.value);
        if (typeof val === 'string') return val.trim().toLowerCase() === 'true';
        return false;
    };

    const normalizeDateTime = (value, endOfDay) => {
        if (!value) return undefined;
        const dateTimePattern = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;
        const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
        const dtMatch = value.match(dateTimePattern);
        if (dtMatch) {
            const [, year, month, day, hour, minute] = dtMatch;
            return `${year}-${month}-${day}T${hour}:${minute}:00Z`;
        }
        const dateMatch = value.match(dateOnlyPattern);
        if (dateMatch) {
            return endOfDay ? `${value}T23:59:59Z` : `${value}T00:00:00Z`;
        }
        throw new Error(`Invalid date format: "${value}". Use YYYY-MM-DD HH:MM (24-hour) or YYYY-MM-DD`);
    };

    let timeMin;
    let timeMax;
    if (data.date_mode === 'all') {
        timeMin = new Date().toISOString();
    } else if (data.date_mode === 'relative') {
        const now = new Date();
        const days = Number(data.relative_days);
        const target = new Date(now.getTime() + days * 86400000);
        if (days >= 0) {
            timeMin = now.toISOString();
            timeMax = target.toISOString();
        } else {
            timeMin = target.toISOString();
            timeMax = now.toISOString();
        }
    } else if (data.date_mode === 'fixed') {
        timeMin = normalizeDateTime(data.timeMin, false);
        timeMax = normalizeDateTime(data.timeMax, true);
    }

    const totalLimit = data.maxResults ? Number(data.maxResults) : undefined;

    const baseParams = {
        orderBy: 'startTime',
        singleEvents: true,
        timeMin,
        timeMax,
        q: data.search_query || undefined,
        eventTypes: Array.isArray(data.event_types) && data.event_types.length ? data.event_types : undefined,
        timeZone: data.timeZone || undefined,
        showDeleted: toBoolean(data.show_deleted),
        showHiddenInvitations: toBoolean(data.show_hidden_invitations)
    };
    Object.keys(baseParams).forEach(
        key => baseParams[key] === undefined && delete baseParams[key]
    );

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(data.calendarId)}/events`;

    try {
        let allEvents = [];
        let pageToken;
        let pages = 0;

        while (pages < MAX_PAGES) {
            const params = {
                ...baseParams,
                maxResults: PAGE_SIZE,
                pageToken: pageToken || undefined
            };
            Object.keys(params).forEach(
                key => params[key] === undefined && delete params[key]
            );

            const response = await axios.request({
                method: 'get',
                maxBodyLength: Infinity,
                url,
                params,
                paramsSerializer: { indexes: null }
            });

            const items = response.data.items || [];
            allEvents.push(...items);
            pages++;

            pageToken = response.data.nextPageToken;

            if (!pageToken) break;
            if (totalLimit && allEvents.length >= totalLimit) break;
        }

        if (totalLimit && allEvents.length > totalLimit) {
            allEvents = allEvents.slice(0, totalLimit);
        }

        if (allEvents.length === 0) {
            return {
                message: "No events found in the selected calendar for the given time range. Please check the filters or create a new event."
            };
        }

        const eventsWithTimeRange = allEvents.map(event => {
            const startRaw = event.start?.dateTime || event.start?.date;
            const endRaw = event.end?.dateTime || event.end?.date;
            const isAllDay = !event.start?.dateTime;
            let timeRange = '';
            if (isAllDay) {
                timeRange = `${startRaw} (All Day)`;
            } else {
                const startDate = new Date(startRaw);
                const endDate = new Date(endRaw);
                const fmt = d => d.toISOString().slice(11, 16);
                const dateLabel = startDate.toISOString().slice(0, 10);
                timeRange = `${fmt(startDate)} - ${fmt(endDate)} UTC, ${dateLabel}`;
            }
            return {
                ...event,
                timeRange
            };
        });

        return {
            events: eventsWithTimeRange
        };
    } catch (error) {
        await errorComponent(error);
    }
}
return await fetchEvents();
```

**UX Takeaways**
- **Three-Way Date Range Selection (`date_mode`):** Provide a static dropdown for time filtering with three clear modes:
  1. *All Upcoming Events (`all`)* — zero config, sets `timeMin` to `now.toISOString()`.
  2. *Relative Range (`relative`)* — accepts positive (future) or negative (past) days from today (`relative_days`), calculating `timeMin` & `timeMax` automatically.
  3. *Fixed Date Range (`fixed`)* — accepts user-friendly date-time formats (`YYYY-MM-DD HH:MM` or `YYYY-MM-DD`) and normalizes them to ISO 8601 (`00:00:00Z` start / `23:59:59Z` end).
- **Flexible Filter Controls:** Provide optional filters for `search_query` (text search across title/description/location/attendees), `event_types` (multiselect), `timeZone` (IANA dropdown), and boolean toggles (`show_deleted`, `show_hidden_invitations`).
- **Internal Auto-Pagination with Record Limit:** Automatically handle multi-page API requests (`pageToken` loop up to `MAX_PAGES`) internally, while honoring an optional `maxResults` cap set by the user.
- **Enriched Computed Response Fields:** Augment raw API item objects with human-readable calculated fields (such as `timeRange`: `"09:00 - 10:00 UTC, 2026-08-11"`) directly in perform code to make downstream mapping easier.

---

## GoHighLevel — Add Tags on Contact

**Metadata**
- **App:** GoHighLevel · **Category:** CRM · **Action:** Add Tags on Contacts · **Action Type:** FIND/SEARCH + update
- *(Documented from design notes.)*

**Supporting API Usage**
- **Get Contacts API** — find the contact by email or phone. **Get Tags API** — list assignable tags.

**UX Components & Field Design**
- **Static Dropdown — Search Criteria** — search by email or phone.
- **String — Enter Email/Phone** — the lookup value.
- **Multiselect — Add Tags** — tags fetched from Get Tags API.

**UX Takeaways**
- "Search by [attribute] → then act on the found record" is a two-phase pattern: resolve the record via a lookup-field selector + value, then present the mutation (here, a tag multiselect).

---

## Gmail — Add Label to Email

**Metadata**
- **App:** Gmail · **Category:** Email · **Action:** Add Label to Email · **Action Type:** FIND/SEARCH + update
- *(Documented from design notes.)*

**Supporting API Usage**
- **Get Labels API** — list applicable labels. **Get Messages API** — find message IDs by query (sender or subject).

**UX Components & Field Design**
- **Dynamic Multiselect — Labels to Include** — from Get Labels API.
- **Static Dropdown — Query Options** — search by *Sender Email* or *Subject*.
- **Dynamic Input Field — Query Criteria** — the input adapts to the chosen query option (email address vs subject keywords).

**UX Takeaways**
- When the *type* of a lookup value changes with a selector, keep one selector + one value field whose label/placeholder is driven by the selection, rather than two always-visible fields.

---

## ActiveCampaign — Add or Remove Tag on Contact

**Metadata**
- **App:** ActiveCampaign · **Category:** CRM / Marketing · **Action:** Add/Remove a Tag to Contact · **Action Type:** FIND/SEARCH + update
- *(Documented from design notes.)*

**Supporting API Usage**
- **Get All Contacts API** — pick the contact. **Get All Tags API** — tags available to add. **Get All Associated Tags API** — tags currently on the contact (for removal).

**UX Components & Field Design**
- **Dropdown — Select Contact** — from all contacts.
- **Boolean — Add or Remove** — the operation switch.
- **Dropdown — Select Tag** — its option source *changes by operation*: for "Add" it lists all tags; for "Remove" it lists only tags already on the contact.

**UX Takeaways**
- A dropdown's **`optionsGenerator` can depend on another field's value** (add → all tags; remove → associated tags). Design the generator to read `context.inputData` and return the right option set.

---

# GET Examples

GET returns one record by a known ID. Keep it to: (optionally a parent dropdown) + the record ID (dropdown-with-custom-input when a list API exists, else a plain string) + optional field selection.

## LeadSquared — Get Lead by ID

**Metadata**
- **App:** LeadSquared · **Category:** CRM · **Action:** Get a Lead by ID · **Action Type:** GET
- *(Documented from design notes.)*

**Supporting API Usage**
- **Get All Leads API** — populates a searchable dropdown of leads so the user can pick by name; custom-input mode lets them paste a Lead ID directly.

**UX Components & Field Design**
- **Dropdown (with custom input) — Select Lead or Enter Custom Input** — choose from the list, or switch to custom mapping and type/​map a Lead ID from a previous step.

**UX Takeaways**
- For GET, always support **custom-input mode** on the ID dropdown (`customInputLabel`/`customHelp`/`customPlaceholder`) so users can map an ID coming from a trigger, not only pick from the list.

---

## YouTube Studio — Get Channel Analytics

**Metadata**
- **App:** YouTube Studio · **Category:** Video/Analytics · **Action:** Get Channel Analytics · **Action Type:** GET

**Supporting API Usage**
- **List Channels API** — populates a searchable/paginated dropdown of channels (`channel_id`) so the user can select a channel by name.

**UX Components & Field Design**
- **Dropdown (with custom input) — Select Channel or Enter Channel ID** — pick a channel from dynamic dropdown or manually map a channel ID via custom input (`customInputLabel`, `customHelp`, `customPlaceholder`).
- **Dropdown (Static) — Date Range Type (`date_mode`)** — allows user to choose between relative range ("Relative (Last N Days)") or fixed date range ("Fixed Dates"), with relative mode set as default.
- **Number — Last N Days (`relative_days`)** — default 28; visible only when Date Range Type is `relative` (`visibilityCondition: "context?.inputData?.date_mode === 'relative'"`).
- **String — Start Date & End Date (`start_date`, `end_date`)** — enter dates in `YYYY-MM-DD` format; visible only when Date Range Type is `fixed` (`visibilityCondition: "context?.inputData?.date_mode === 'fixed'"`).
- **Input Groups — Filters** — groups dimension filter settings (e.g., video, playlist, channel, country, gender, age group, device type) conditionally shown based on the selected `filterDimension`.
- **Multiselect (Static) — Sort By (`sort_fields`)** — select fields to sort results by (must be one of the report's metrics).
- **Dropdown (Static) — Sort Order (`sort_order`)** — visible only when sort fields are selected (`visibilityCondition: "(Array.isArray(context?.inputData?.sort_fields) && context.inputData.sort_fields.length > 0) || (typeof context?.inputData?.sort_fields === 'string' && context.inputData.sort_fields.trim().length > 0)"`).
- **Hardcoded Metric Set** — full set of supported metrics requested in every run to avoid form clutter while delivering complete analytics data.

**Input Fields JSON**
```json
[
  {
    "key": "channel_id",
    "help": "Select the YouTube channel to fetch analytics for.",
    "type": "dropdown",
    "label": "Channel",
    "required": true,
    "customHelp": "Enter the channel ID manually. You can get the channel ID from actions like List Channels.",
    "canPaginate": true,
    "placeholder": "Select channel",
    "enableSearchApi": false,
    "customInputLabel": "Channel ID",
    "optionsGenerator": "try { return await channel_ID(context?.paginateData?.['channel_id'], 50); } catch (error) { await errorComponent(error); }",
    "customPlaceholder": "UC_x5XG1OV2P6uZZ5FSM9Ttw"
  },
  {
    "key": "date_mode",
    "help": "Select how you'd like to specify the reporting date range.",
    "type": "dropdown",
    "label": "Date Range Type",
    "options": [
      {
        "label": "Relative (Last N Days)",
        "value": "relative",
        "sample": "relative"
      },
      {
        "label": "Fixed Dates",
        "value": "fixed",
        "sample": "fixed"
      }
    ],
    "required": true,
    "customHelp": "Enter 'relative' for Last N Days or 'fixed' for specific start and end dates.",
    "placeholder": "Select date range type",
    "defaultValue": {
      "label": "Relative (Last N Days)",
      "value": "relative",
      "sample": "relative"
    },
    "customInputLabel": "Date Range Type",
    "customPlaceholder": "relative"
  },
  {
    "key": "relative_days",
    "help": "Enter the number of past days to include in the report (e.g., 7, 28, 90).",
    "type": "number",
    "label": "Last N Days",
    "required": true,
    "placeholder": "28",
    "defaultValue": 28,
    "visibilityCondition": "context?.inputData?.date_mode === 'relative'"
  },
  {
    "key": "start_date",
    "help": "Enter the start date for the report in YYYY-MM-DD format.",
    "type": "string",
    "label": "Start Date",
    "required": true,
    "placeholder": "2024-01-01",
    "visibilityCondition": "context?.inputData?.date_mode === 'fixed'"
  },
  {
    "key": "end_date",
    "help": "Enter the end date for the report in YYYY-MM-DD format.",
    "type": "string",
    "label": "End Date",
    "required": true,
    "placeholder": "2026-01-01",
    "visibilityCondition": "context?.inputData?.date_mode === 'fixed'"
  },
  {
    "key": "filters",
    "help": "Enter filters to narrow the report to specific values (optional).",
    "type": "input groups",
    "label": "Filters",
    "required": false,
    "fields": [
      {
        "key": "dimension",
        "help": "Select the dimension to filter by.",
        "type": "dropdown",
        "label": "Filter Dimension",
        "options": [
          {
            "label": "Video",
            "value": "video",
            "sample": "video"
          },
          {
            "label": "Playlist",
            "value": "playlist",
            "sample": "playlist"
          },
          {
            "label": "Channel",
            "value": "channel",
            "sample": "channel"
          },
          {
            "label": "Country",
            "value": "country",
            "sample": "country"
          },
          {
            "label": "Age Group",
            "value": "ageGroup",
            "sample": "ageGroup"
          },
          {
            "label": "Gender",
            "value": "gender",
            "sample": "gender"
          },
          {
            "label": "Device Type",
            "value": "deviceType",
            "sample": "deviceType"
          }
        ],
        "required": false,
        "customHelp": "Enter the dimension to filter by, such as 'video', 'playlist', 'channel', 'country', 'ageGroup', 'gender', or 'deviceType'.",
        "customInputLabel": "Filter Dimension",
        "customPlaceholder": "video"
      },
      {
        "key": "video_value",
        "help": "Enter the video ID(s) to filter by. You may enter multiple values separated by commas.",
        "type": "string",
        "label": "Video ID(s)",
        "required": true,
        "placeholder": "dMH0bHeiRNg,Zhawgd0REhA",
        "visibilityCondition": "context?.inputData?.filters?.dimension === 'video'"
      },
      {
        "key": "playlist_value",
        "help": "Enter the playlist ID(s) to filter by. You may enter multiple values separated by commas (max 500).",
        "type": "string",
        "label": "Playlist ID(s)",
        "required": true,
        "placeholder": "PLxxxxxx,PLyyyyyy",
        "visibilityCondition": "context?.inputData?.filters?.dimension === 'playlist'"
      },
      {
        "key": "channel_value",
        "help": "Enter the channel ID(s) to filter by. You may enter multiple values separated by commas.",
        "type": "string",
        "label": "Channel ID(s)",
        "required": true,
        "placeholder": "UC_x5XG1OV2P6uZZ5FSM9Ttw,UCxxxxxxx",
        "visibilityCondition": "context?.inputData?.filters?.dimension === 'channel'"
      },
      {
        "key": "country_value",
        "help": "Enter the two-letter ISO-3166-1 country code. See [country code list](https://countrycode.org/).",
        "type": "string",
        "label": "Country",
        "required": true,
        "placeholder": "IN",
        "visibilityCondition": "context?.inputData?.filters?.dimension === 'country'"
      },
      {
        "key": "gender_value",
        "help": "Select the gender to filter by.",
        "type": "dropdown",
        "label": "Gender",
        "options": [
          {
            "label": "Female",
            "value": "female",
            "sample": "female"
          },
          {
            "label": "Male",
            "value": "male",
            "sample": "male"
          }
        ],
        "required": true,
        "customHelp": "Enter 'female' or 'male' to filter by gender.",
        "placeholder": "Select gender",
        "customInputLabel": "Gender",
        "customPlaceholder": "female",
        "visibilityCondition": "context?.inputData?.filters?.dimension === 'gender'"
      },
      {
        "key": "age_group_value",
        "help": "Select the age group to filter by.",
        "type": "dropdown",
        "label": "Age Group",
        "options": [
          {
            "label": "13-17",
            "value": "age13-17",
            "sample": "age13-17"
          },
          {
            "label": "18-24",
            "value": "age18-24",
            "sample": "age18-24"
          },
          {
            "label": "25-34",
            "value": "age25-34",
            "sample": "age25-34"
          },
          {
            "label": "35-44",
            "value": "age35-44",
            "sample": "age35-44"
          },
          {
            "label": "45-54",
            "value": "age45-54",
            "sample": "age45-54"
          },
          {
            "label": "55-64",
            "value": "age55-64",
            "sample": "age55-64"
          },
          {
            "label": "65+",
            "value": "age65-",
            "sample": "age65-"
          }
        ],
        "required": true,
        "customHelp": "Enter the age group to filter by, such as 'age13-17', 'age18-24', 'age25-34', 'age35-44', 'age45-54', 'age55-64', or 'age65-'.",
        "placeholder": "Select age group",
        "customInputLabel": "Age Group",
        "customPlaceholder": "age18-24",
        "visibilityCondition": "context?.inputData?.filters?.dimension === 'ageGroup'"
      },
      {
        "key": "device_type_value",
        "help": "Select the device type to filter by.",
        "type": "dropdown",
        "label": "Device Type",
        "options": [
          {
            "label": "Desktop",
            "value": "DESKTOP",
            "sample": "DESKTOP"
          },
          {
            "label": "Mobile",
            "value": "MOBILE",
            "sample": "MOBILE"
          },
          {
            "label": "Tablet",
            "value": "TABLET",
            "sample": "TABLET"
          },
          {
            "label": "TV",
            "value": "TV",
            "sample": "TV"
          },
          {
            "label": "Game Console",
            "value": "GAME_CONSOLE",
            "sample": "GAME_CONSOLE"
          }
        ],
        "required": true,
        "customHelp": "Enter the device type to filter by, such as 'DESKTOP', 'MOBILE', 'TABLET', 'TV', or 'GAME_CONSOLE'.",
        "placeholder": "Select device type",
        "customInputLabel": "Device Type",
        "customPlaceholder": "DESKTOP",
        "visibilityCondition": "context?.inputData?.filters?.dimension === 'deviceType'"
      }
    ]
  },
  {
    "key": "sort_fields",
    "help": "Select fields to sort results by. Must be one of the report's metrics.",
    "type": "multiselect",
    "label": "Sort By",
    "options": [
      {
        "label": "Views",
        "value": "views"
      },
      {
        "label": "Watch Time (Minutes)",
        "value": "estimatedMinutesWatched"
      },
      {
        "label": "Average View Duration",
        "value": "averageViewDuration"
      },
      {
        "label": "Likes",
        "value": "likes"
      },
      {
        "label": "Comments",
        "value": "comments"
      },
      {
        "label": "Shares",
        "value": "shares"
      },
      {
        "label": "Subscribers Gained",
        "value": "subscribersGained"
      },
      {
        "label": "Estimated Revenue",
        "value": "estimatedRevenue"
      },
      {
        "label": "Day",
        "value": "day"
      },
      {
        "label": "Month",
        "value": "month"
      },
      {
        "label": "Video",
        "value": "video"
      },
      {
        "label": "Country",
        "value": "country"
      }
    ],
    "required": false,
    "customHelp": "Enter the sort field names as a comma-separated list or array. Each sort field must be one of the report's metrics.",
    "placeholder": "Select fields to sort by",
    "customInputLabel": "Sort Field(s)",
    "customPlaceholder": "[\"views\",\"subscribersGained\"]"
  },
  {
    "key": "sort_order",
    "help": "Select the sort direction to apply to all selected sort fields.",
    "type": "dropdown",
    "label": "Sort Order",
    "options": [
      {
        "label": "Ascending",
        "value": "asc",
        "sample": "asc"
      },
      {
        "label": "Descending",
        "value": "desc",
        "sample": "desc"
      }
    ],
    "required": false,
    "customHelp": "Enter 'asc' for ascending or 'desc' for descending sort order.",
    "defaultValue": {
      "label": "Descending",
      "value": "desc",
      "sample": "desc"
    },
    "customInputLabel": "Sort Order",
    "customPlaceholder": "desc",
    "visibilityCondition": "(Array.isArray(context?.inputData?.sort_fields) && context.inputData.sort_fields.length > 0) || (typeof context?.inputData?.sort_fields === 'string' && context.inputData.sort_fields.trim().length > 0)"
  }
]
```

**API Configuration Perform Code**
```javascript
async function getYouTubeReport() {
  try {
    const data = context?.inputData || {};

    if (!data.channel_id) {
      throw new Error('Channel is required.');
    }

    // Hardcoded full metric set (all supported metrics requested in every run)
    const metrics = [
      'views',
      'likes',
      'dislikes',
      'comments',
      'shares',
      'videosAddedToPlaylists',
      'videosRemovedFromPlaylists',
      'estimatedMinutesWatched',
      'estimatedRedMinutesWatched',
      'averageViewDuration',
      'averageViewPercentage',
      'subscribersGained',
      'subscribersLost',
      'cardClickRate',
      'cardTeaserClickRate',
      'cardImpressions',
      'cardTeaserImpressions',
      'annotationClickThroughRate',
      'annotationCloseRate',
      'annotationImpressions',
      'grossRevenue',
      'monetizedPlaybacks',
      'adImpressions',
      'playbackBasedCpm'
    ];
    const metricsStr = metrics.join(',');

    let startDate, endDate;
    if (data.date_mode === 'relative') {
      const days = Number(data.relative_days) || 28;
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      endDate = end.toISOString().split('T')[0];
      startDate = start.toISOString().split('T')[0];
    } else {
      startDate = data.start_date;
      endDate = data.end_date;
      if (!startDate) throw new Error('Start date is required.');
      if (!endDate) throw new Error('End date is required.');
    }

    if (startDate > endDate) {
      throw new Error('Start date must be before or equal to end date.');
    }

    const allowedSortFields = new Set(metrics);
    const sortFieldsRaw = data.sort_fields;
    let sortFields = [];
    if (sortFieldsRaw && sortFieldsRaw.length > 0) {
      sortFields = Array.isArray(sortFieldsRaw) ? sortFieldsRaw : [sortFieldsRaw];
      const invalidSortFields = sortFields.filter(f => !allowedSortFields.has(f));
      if (invalidSortFields.length > 0) {
        throw new Error(`Sort field(s) "${invalidSortFields.join(', ')}" are not part of the report's metric set.`);
      }
    }

    let filters;
    const filterDimension = data.filters?.dimension;
    if (filterDimension) {
      const filterValueMap = {
        video: data.filters?.video_value,
        playlist: data.filters?.playlist_value,
        channel: data.filters?.channel_value,
        country: data.filters?.country_value,
        gender: data.filters?.gender_value,
        ageGroup: data.filters?.age_group_value,
        deviceType: data.filters?.device_type_value
      };
      const filterValue = filterValueMap[filterDimension];
      if (!filterValue) {
        throw new Error(`A value is required for the "${filterDimension}" filter.`);
      }
      filters = `${filterDimension}==${filterValue}`;
    }

    const params = {
      ids: `channel==${data.channel_id}`,
      startDate,
      endDate,
      metrics: metricsStr,
      maxResults: 25
    };

    if (filters) params.filters = filters;

    if (sortFields.length > 0) {
      const sortPrefix = data.sort_order === 'asc' ? '' : '-';
      params.sort = sortFields.map(field => `${sortPrefix}${field}`).join(',');
    }

    const response = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', { params });

    const headers = response.data?.columnHeaders || [];
    const rows = response.data?.rows || [];

    if (!rows.length) {
      return { message: 'No analytics data found for the selected date range.' };
    }

    const results = rows.map(row => {
      const obj = {};
      headers.forEach((col, i) => { obj[col.name] = row[i]; });
      return obj;
    });

    return results;
  } catch (error) {
    await errorComponent(error);
  }
}

return await getYouTubeReport();
```

**UX Takeaways**
- **Date Range Selection UX (`date_mode` fork):** Use a static `date_mode` dropdown to let non-technical users choose between simple relative selections (e.g. "Relative (Last N Days)") and fixed dates ("Fixed Dates"). Gate `relative_days` vs `start_date`/`end_date` with `visibilityCondition`, and compute ISO date strings (`YYYY-MM-DD`) internally in perform code rather than forcing users to handle date logic manually.
- **Hardcoding Complete Metric Sets to Reduce Friction:** When an API supports a broad set of standard metrics, hardcoding the complete metric array in perform code eliminates form complexity (no need for a tedious metrics multiselect) while ensuring the workflow always retrieves comprehensive analytics.
- **Grouped Conditional Dimension Filters:** Bundle optional filters into an Input Group with `visibilityCondition` fields tied to the selected filter dimension, keeping the form step-by-step and clean.
- **Dependent Sort Order Visibility:** Show sort order controls only when sort fields are selected (`visibilityCondition` checks for array length or non-empty string).

---

# FIND OR CREATE (Upsert) Examples

Upsert = search by a stable identifier, update if found, create if not. UX separates a "Find" section from a conditionally-shown "Create" section, ideally with the create/update decision made automatically in code.

## LeadSquared — Create or Update Lead


https://apidocs.leadsquared.com/create-or-update/#api 

**API Usage**


Get Custom Fields API:   
Fetches the custom fields available for a lead in Lead Squared that can be added or updated during the lead creation process. 

**UI Components**


Static Dropdown - Search By: 

Allows the user to select whether to search by email or phone. Options: "Email" or "Phone." 

Input Fields: 

Email 

First Name 

Last Name 

Phone 

These fields will be used for both creating and updating the lead, depending on the selected search criteria. 

Input Group - Custom Fields: 

Dynamically displayed input fields based on the custom fields fetched via the Get Custom Fields API. These fields will appear after entering the basic lead details. 

**API Flow**


Select Search Criteria: 

The user selects whether to search by email or phone in the "Search By" dropdown. 

Search for Existing Lead: 

If "Email" is selected, the system checks if the lead with the provided email already exists in the system. 

If "Phone" is selected, the system checks if the lead with the provided phone number already exists. 

Update or Create Lead: 

If a lead is found, the system proceeds to update the existing lead with the provided input fields (email, first name, last name, phone, and any custom fields). 

If no lead is found, the system creates a new lead using the provided input fields. 

Enter Custom Field Data: 

After the basic fields are entered, the system displays the input group for custom fields (if any) retrieved using the Get Custom Fields API. The user fills out the necessary custom fields. 

Submit Lead Data: 

The system sends the lead data (email, phone, name, custom fields, etc.) to the LeadSquared API to create or update the lead. 

**Input Fields JSON**

```json
[
  {
    "key": "searchByFields",
    "help": "Select the lead fields to search by, such as Email or Phone.",
    "type": "multiselect",
    "label": "Search By Fields",
    "required": true,
    "customHelp": "Enter the schema names of lead fields to search by, separated by commas. You can get field names from actions like List Lead Fields.",
    "customInputLabel": "Search By Field IDs",
    "optionsGenerator": "async function generateSearchByFields() {\\n    const apiUrl = `https://${context.authData?.apiHost}.leadsquared.com/v2/LeadManagement.svc/LeadsMetaData.Get?excludeOptionSets=1`;\\n    try {\\n        const response = await axios.get(apiUrl);\\n        if (!response.data || !Array.isArray(response.data)) {\\n            return { message: 'No lead fields found.' };\\n        }\\n        const data = response.data.filter(item =>\\n            item.IsVisible === true &&\\n            item.IsReadOnly !== true &&\\n            item.LockAfterCreate !== 1 &&\\n            item.LockAfterCreate !== 2\\n        );\\n        const prioritizedFields = ['EmailAddress', 'Phone', 'FirstName', 'LastName', 'ProspectId'];\\n        const sortedFields = data.sort((a, b) => {\\n            const aPriority = prioritizedFields.includes(a.Name) ? -1 : 0;\\n            const bPriority = prioritizedFields.includes(b.Name) ? -1 : 0;\\n            return aPriority - bPriority || a.DisplayName.localeCompare(b.DisplayName);\\n        });\\n        if (!sortedFields.length) return { message: 'No lead fields found.' };\\n        return sortedFields.map(field => ({\\n            label: field.DisplayName,\\n            value: field.Name,\\n            sample: field.Name\\n        }));\\n    } catch (error) {\\n        throw error;\\n    }\\n}\\ntry {\\n    return await generateSearchByFields();\\n} catch (error) {\\n    await errorComponent(error);\\n}",
    "customPlaceholder": "EmailAddress,Phone"
  },
  {
    "key": "searchByInputFields",
    "help": "Enter the values for the fields selected in Search By Fields.",
    "type": "input groups",
    "label": "Search By Input Fields",
    "fieldsGenerator": "async function generateSearchByInputFields() {\\n    const selectedFields = context?.inputData?.searchByFields || [];\\n    if (!selectedFields.length) {\\n        return { message: 'Select Search By Fields above to enter their values.' };\\n    }\\n    const apiUrl = `https://${context.authData?.apiHost}.leadsquared.com/v2/LeadManagement.svc/LeadsMetaData.Get?excludeOptionSets=1`;\\n    try {\\n        const response = await axios.get(apiUrl);\\n        if (!response.data || !Array.isArray(response.data)) {\\n            return { message: 'No lead fields found.' };\\n        }\\n        const fields = response.data.filter(item => selectedFields.includes(item.Name));\\n        if (!fields.length) return { message: 'Selected fields not found in schema.' };\\n        return fields.map(field => ({\\n            key: field.Name,\\n            label: field.DisplayName,\\n            type: 'string',\\n            required: field.IsMandatory,\\n            placeholder: `Enter ${field.DisplayName}`,\\n            help: `Enter value for ${field.DisplayName}`\\n        }));\\n    } catch (error) {\\n        throw error;\\n    }\\n}\\ntry {\\n    return await generateSearchByInputFields();\\n} catch (error) {\\n    await errorComponent(error);\\n}"
  },
  {
    "key": "updateFields",
    "help": "Select the lead fields you want to update.",
    "type": "multiselect",
    "label": "Fields to Update",
    "required": true,
    "customHelp": "Enter the schema names of lead fields to update, separated by commas. You can get field names from actions like List Lead Fields.",
    "customInputLabel": "Update Field IDs",
    "optionsGenerator": "async function generateFieldsToUpdate() {\\n    const apiUrl = `https://${context.authData?.apiHost}.leadsquared.com/v2/LeadManagement.svc/LeadsMetaData.Get?excludeOptionSets=1`;\\n    try {\\n        const response = await axios.get(apiUrl);\\n        if (!response.data || !Array.isArray(response.data)) {\\n            return { message: 'No lead fields found.' };\\n        }\\n        const data = response.data.filter(item =>\\n            item.IsVisible === true &&\\n            item.IsReadOnly !== true &&\\n            item.LockAfterCreate !== 1 &&\\n            item.LockAfterCreate !== 2\\n        );\\n        const prioritizedFields = ['EmailAddress', 'Phone', 'FirstName', 'LastName', 'ProspectId'];\\n        const sortedFields = data.sort((a, b) => {\\n            const aPriority = prioritizedFields.includes(a.Name) ? -1 : 0;\\n            const bPriority = prioritizedFields.includes(b.Name) ? -1 : 0;\\n            return aPriority - bPriority || a.DisplayName.localeCompare(b.DisplayName);\\n        });\\n        if (!sortedFields.length) return { message: 'No lead fields found.' };\\n        return sortedFields.map(field => ({\\n            label: field.DisplayName,\\n            value: field.Name,\\n            sample: field.Name\\n        }));\\n    } catch (error) {\\n        throw error;\\n    }\\n}\\ntry {\\n    return await generateFieldsToUpdate();\\n} catch (error) {\\n    await errorComponent(error);\\n}",
    "customPlaceholder": "FirstName,LastName"
  },
  {
    "key": "updateInputFields",
    "help": "Enter the values for the fields selected in Fields to Update.",
    "type": "input groups",
    "label": "Update Input Fields",
    "fieldsGenerator": "async function generateUpdateInputFields() {\\n    const selectedFields = context?.inputData?.updateFields || [];\\n    if (!selectedFields.length) {\\n        return { message: 'Select Fields to Update above to enter their values.' };\\n    }\\n    const apiUrl = `https://${context.authData?.apiHost}.leadsquared.com/v2/LeadManagement.svc/LeadsMetaData.Get?excludeOptionSets=1`;\\n    try {\\n        const response = await axios.get(apiUrl);\\n        if (!response.data || !Array.isArray(response.data)) {\\n            return { message: 'No lead fields found.' };\\n        }\\n        const fields = response.data.filter(item => selectedFields.includes(item.Name));\\n        if (!fields.length) return { message: 'Selected fields not found in schema.' };\\n        return fields.map(field => ({\\n            key: field.Name,\\n            label: field.DisplayName,\\n            type: 'string',\\n            required: field.IsMandatory,\\n            placeholder: `Enter ${field.DisplayName}`,\\n            help: `Enter value for ${field.DisplayName}`\\n        }));\\n    } catch (error) {\\n        throw error;\\n    }\\n}\\ntry {\\n    return await generateUpdateInputFields();\\n} catch (error) {\\n    await errorComponent(error);\\n}"
  }
]
```


**API Configuration Perform Code**

```javascript
async function createOrUpdateLead() {

    try {  
        const searchByFields = context?.inputData?.searchByFields;  
        const searchByInputFields = context?.inputData?.searchByInputFields;  
        const updateFields = context?.inputData?.updateFields;  
        const updateInputFields = context?.inputData?.updateInputFields;

        if (!Array.isArray(searchByFields) || searchByFields.length === 0) {  
            throw new Error('Search By Fields is required.');  
        }  
        if (!Array.isArray(updateFields) || updateFields.length === 0) {  
            throw new Error('Fields to Update is required.');  
        }  
        if (!searchByInputFields || typeof searchByInputFields !== 'object' || Object.keys(searchByInputFields).length === 0) {  
            throw new Error('Search By Input Fields is required.');  
        }

        let leadData = [];  
        Object.keys(searchByInputFields).forEach((field) => {  
            const value = searchByInputFields[field];  
            if (value !== undefined && value !== null && value !== '') {  
                leadData.push({ Attribute: field, Value: value });  
            }  
        });  
        leadData.push({ Attribute: 'SearchBy', Value: searchByFields.join(',') });

        if (updateInputFields && typeof updateInputFields === 'object') {  
            Object.keys(updateInputFields).forEach((field) => {  
                const value = updateInputFields[field];  
                if (value !== undefined && value !== null && value !== '') {  
                    leadData.push({ Attribute: field, Value: value });  
                }  
            });  
        }

        const apiUrl = `https://${context?.authData?.apiHost}.leadsquared.com/v2/LeadManagement.svc/Lead.CreateOrUpdate?postUpdatedLead=false`;  
        const response = await axios.post(apiUrl, leadData, {  
            headers: { 'Content-Type': 'application/json' }  
        });  
        return response?.data;  
    } catch (error) {  
        await errorComponent(error);  
    }  
}  
return await createOrUpdateLead();
```

## Leadconnector — Create Or Update Contact

**Metadata**
- **App:** Leadconnector (GoHighLevel)
- **Category:** CRM / Contact Management
- **Action:** Create Or Update Contact
- **Action Type:** FIND OR CREATE (Upsert)

**UX Components & Field Design**

| Field | Type | Key | Purpose |
|---|---|---|---|
| Find Contact By | dropdown | `lookup_by` | Lookup strategy: email, phone, or both |
| Email Address (required) | string | `email_required` | Required when lookup is email/both |
| Phone Number (required) | string | `phone_required` | Required when lookup is phone/both |
| Email Address (optional) | string | `email_optional` | Optional when lookup is phone only |
| Phone Number (optional) | string | `phone_optional` | Optional when lookup is email only |
| Contact Fields to Set | multiselect | `selected_fields` | Field chooser with smart defaults |
| (individual fields) | various | various | Each appears only when selected |
| Assign To — Find User By | dropdown | `assignedTo_method` | User ID vs Email lookup for assignment |
| Address | input groups | `address` | Nested address fields |
| Tags | string | `tags` | Comma-separated, replaces ALL tags |
| Enable DND | boolean | `enable_dnd` | Triggers DND channel selection |
| DND Channels | multiselect | `dnd_channels` | Which channels to block |
| DND Settings | input groups | `dndSettings` | Per-channel DND configuration |
| Select Custom Fields | multiselect | `selectedCustomFields` | Custom field chooser from API |
| Custom Field Values | input groups (fieldsGenerator) | `customFields` | Dynamic custom field inputs |
| Override Duplicate Behavior | boolean | `override_duplicate_behavior` | Advanced duplicate control |

**Key UX Patterns**
- **Required/optional field duality**: Same field (email/phone) appears as required or optional based on lookup mode
- **Field chooser with defaults**: `selected_fields` multiselect pre-selects common fields, user can add more
- **Nested field chooser**: Custom fields use a two-step select (choose fields → fill values)
- **Progressive disclosure**: DND, duplicate override, and custom fields are hidden behind toggles
- **Multi-level nesting**: DND settings have channel-level sub-groups with per-channel configuration

**UX Takeaways**
- Upsert actions need a clear "lookup by" selector that drives required field logic
- Field choosers with sensible defaults reduce cognitive load while maintaining flexibility
- Two-step custom field selection (choose → fill) prevents overwhelming users with all possible fields
- Warning-style help text on destructive fields (tags replaces ALL) prevents data loss surprises

---

# Composite / Advanced Action Examples

Some actions are not plain CRUD — they orchestrate several optional behaviors (targets, scheduling, identity, attachments). The lesson is the same: use selectors + `visibilityCondition` to reveal only the relevant sub-configuration, and default to the simplest path.

## Slack — Schedule Message

**Metadata**
- **App:** Slack · **Category:** Communication · **Action:** Schedule a Message · **Action Type:** Composite (scheduling variant)
- *(Documented from design notes; superseded in practice by the `isScheduledMessage` toggle inside Send Message above.)*

**Supporting API Usage**
- **conversations.list** — channel dropdown. **chat.scheduleMessage** — the send endpoint. `post_at` requires a UNIX timestamp.

**UX Components & Field Design**
- **Dynamic Dropdown — Channel** (from conversations.list), **String — Message Text**, **String — Post Time** (date-time entered as a string, converted to UNIX epoch in code).

---

## Slack — Send Message

- **Category:** Communication


**API Usage**


List Channels API: Retrieves public and private Slack channels to populate channel selection and resolve channel names into channel IDs.

List Users API: Retrieves workspace users for selecting message recipients and tagging users in messages.

List Messages API: Retrieves messages from the selected channel to allow users to reply to an existing thread.

Post Message API: Sends a new message to one or more Slack channels or users with support for Markdown, mentions, action buttons, custom bot identity, and link/media preview settings.

Schedule Message API: Schedules a message to be delivered at a specified date & time or after a configurable delay using the same message configuration as an immediate message.

**UI Components**


Input Group – Destination

Allows users to choose where the message should be sent:

Channel  
User  
Thread as Reply

Depending on the selected destination, the appropriate fields are displayed for selecting channels, users, or an existing thread.

Markdown Field – Message

Accepts the message content with support for Slack Markdown formatting, including bold, italic, inline code, code blocks, quotes, and links.

Dictionary – Action Buttons

Allows users to add one or more clickable buttons by specifying the button label and destination URL.

Dropdown – Schedule

Lets users choose whether to:

Send immediately (default)  
Schedule for a specific date & time  
Send after a delay

Number Field – Delay

Specifies the delay (in minutes) before the message is sent.

Date & Time Field – Schedule At

Allows scheduling a message for a specific date and time using the required format.

Input Group – Bot Details

Allows customization of the bot identity by configuring:

Display name  
Custom emoji icon  
Custom icon image URL

Input Group – Preview Settings

Controls whether Slack expands:

Link previews  
Media previews

**API Flow**

Validates the selected destination type and ensures that message content has been provided.  
Determines whether the message should be sent immediately or scheduled for a future date & time or after a specified delay.  
Converts scheduled date & time or delay into the Unix timestamp format required by the Slack API.  
Resolves channel names into Slack channel IDs when channel names are provided instead of IDs.  
Retrieves workspace users and channel messages to support recipient selection, user mentions, and thread replies.  
Detects Markdown syntax automatically and enables Slack Markdown rendering when applicable.  
Builds interactive message buttons from the configured label and URL pairs.  
Adds optional user mentions or channel-wide notifications before the message content.  
Applies the configured bot display name and custom icon (emoji or image URL) to the outgoing message.  
Sends the message to one or more channels, users, or as a reply within an existing thread, depending on the selected destination.  
Applies optional link preview, media preview, and thread broadcast settings to the outgoing message.  
Automatically retries requests when Slack rate limits are encountered before returning the final response.

**Input Fields JSON**

```json
[
  {
    "key": "destination",
    "type": "input groups",
    "label": "",
    "whereClause": true,
    "fields": [
      {
        "key": "messageto",
        "help": "Select where to send the message.",
        "type": "dropdown",
        "label": "To",
        "options": [
          {
            "label": "Channel",
            "value": "channel"
          },
          {
            "label": "User",
            "value": "user"
          },
          {
            "label": "Thread as reply",
            "value": "thread"
          }
        ],
        "required": true,
        "customHelp": "Enter channel, user, or thread.",
        "placeholder": "Select destination type",
        "defaultValue": {
          "label": "Channel",
          "value": "channel"
        },
        "customInputLabel": "Destination type",
        "customPlaceholder": "channel"
      },
      {
        "key": "thread_channel_id",
        "help": "Select channel or enter channel ID.",
        "type": "dropdown",
        "label": "on",
        "required": true,
        "customHelp": "Enter a single channel ID. To find it, use the List all public channels action.",
        "placeholder": "Select channel",
        "customInputLabel": "Channel ID",
        "optionsGenerator": "try { return await get_all_channel(); } catch (error) { await errorComponent(error); }",
        "customPlaceholder": "C082WLRJLAA",
        "visibilityCondition": "context?.inputData?.destination?.messageto === 'thread'"
      },
      {
        "key": "channel_id",
        "help": "Select channel(s) or enter comma-separated channel IDs.",
        "type": "multiselect",
        "label": "",
        "required": true,
        "customHelp": "Enter channel name(s) or channel ID(s) separated by commas (e.g. general, #random, C082ACF6XQQ). To find a channel ID, use the \"List all public channels\" action.",
        "placeholder": "Select channels",
        "customInputLabel": "Channel IDs",
        "optionsGenerator": "try { return await get_all_channel(); } catch (error) { await errorComponent(error); }",
        "customPlaceholder": "[\"C082ACF6XQQ\",\"C082WLRJLAA\"]",
        "visibilityCondition": "context?.inputData?.destination?.messageto === 'channel'"
      },
      {
        "key": "userId",
        "help": "Select the user(s) to send the message to.",
        "type": "multiselect",
        "label": "",
        "required": true,
        "customHelp": "Enter Slack user IDs separated by commas. To find a user ID use the Get all channel members action.",
        "placeholder": "Select users",
        "customInputLabel": "User IDs",
        "optionsGenerator": "try { return await get_all_users_of_workspace(); } catch (error) { await errorComponent(error); }",
        "customPlaceholder": "[\"U082S1U4DDL\", \"U082S1U4DDM\"]",
        "visibilityCondition": "context?.inputData?.destination?.messageto === 'user'"
      },
      {
        "key": "thread_ts",
        "help": "Select or enter the message ID you want to reply to.",
        "type": "dropdown",
        "label": "Thread",
        "required": true,
        "customHelp": "Enter message ID. To find the message ID use the Get messages from Slack action.",
        "canPaginate": false,
        "customInputLabel": "Message ID",
        "optionsGenerator": "try { return await get_sendmessage_messages(context?.inputData?.destination?.thread_channel_id); } catch (error) { await errorComponent(error); }",
        "customPlaceholder": "1774073738.822629",
        "visibilityCondition": "context?.inputData?.destination?.thread_channel_id"
      },
      {
        "key": "tagged_users",
        "type": "multiselect",
        "label": "also notify",
        "required": false,
        "customHelp": "Enter Slack user IDs separated by commas. To find a user ID use the Get all channel members action.",
        "placeholder": "Select people",
        "customInputLabel": "User IDs",
        "optionsGenerator": "try {\\n  let users = [];\\n  let cursor = null;\\n  do {\\n    const response = await axios.request({\\n      method: 'get',\\n      url: 'https://slack.com/api/users.list',\\n      params: {\\n        limit: 999,\\n        cursor: cursor || undefined\\n      }\\n    });\\n    if (!response.data.ok) {\\n      throw new Error(response.data.error);\\n    }\\n    users.push(...response.data.members);\\n    cursor = response.data.response_metadata?.next_cursor || null;\\n  } while (cursor);\\n\\n  if (!users.length) {\\n    return {\\n      message: \"No users found, please make sure there is an available user to fetch.\"\\n    };\\n  }\\n\\n  const staticOptions = [\\n    { label: 'Everyone in the channel', value: 'channel', sample: 'channel' }\\n  ];\\n\\n  const userOptions = users\\n    .filter(member => member.id !== 'USLACKBOT')\\n    .map(member => ({\\n      label: member.real_name || member.name,\\n      value: member.id,\\n      sample: member.id\\n    }));\\n\\n  return [...staticOptions, ...userOptions];\\n} catch (error) {\\n  await errorComponent(error);\\n}",
        "customPlaceholder": "[\"U0A6THCVAH1\", \"U082S1U4DDL\"]",
        "visibilityCondition": "context?.inputData?.destination?.thread_ts || context?.inputData?.destination?.[\"channel_id\"]?.[0]"
      },
      {
        "key": "reply_broadcast",
        "help": "Broadcast the reply to the entire channel?",
        "type": "boolean",
        "label": "also send as direct message",
        "options": [
          {
            "label": "Yes",
            "value": true
          },
          {
            "label": "No",
            "value": false
          }
        ],
        "required": false,
        "customHelp": "Enter true to broadcast the reply to the entire channel, false to keep it in the thread only.",
        "placeholder": "Select",
        "customInputLabel": "Broadcast reply",
        "customPlaceholder": "false",
        "visibilityCondition": "context?.inputData?.destination?.thread_ts"
      }
    ]
  },
  {
    "key": "markdown_content",
    "help": "Enter the message text. You can use plain text or Markdown formatting like *bold*, _italic_, code, and links.",
    "type": "markdown",
    "label": "With message",
    "required": true,
    "placeholder": "Type your message here...",
    "visibilityCondition": "context?.inputData?.destination?.channel_id || context?.inputData?.destination?.thread_ts || context?.inputData?.destination?.userId"
  },
  {
    "key": "buttons",
    "help": "Add clickable buttons to your message. Each button opens a URL when clicked. Use the button text as the key and the link as the value.",
    "type": "dictionary",
    "label": "Action Buttons",
    "required": false,
    "template": {
      "key": {
        "help": "Enter the button label.",
        "type": "string",
        "placeholder": "Click Me"
      },
      "value": {
        "help": "Enter the URL.",
        "type": "string",
        "placeholder": "https://www.example.com"
      }
    }
  },
  {
    "key": "schedule_type",
    "help": "Select when to send the message.",
    "type": "dropdown",
    "label": "Schedule",
    "options": [
      {
        "label": "For specific Date & Time",
        "value": "datetime"
      },
      {
        "label": "After a Delay",
        "value": "delay"
      }
    ],
    "required": false,
    "customHelp": "Enter datetime to schedule for a specific time, or delay to send after a number of minutes.",
    "placeholder": "Select",
    "customInputLabel": "Schedule type",
    "customPlaceholder": "datetime"
  },
  {
    "key": "delay_value",
    "help": "Enter the number of minutes to wait before sending the message.",
    "type": "number",
    "label": "Delay (in minutes)",
    "required": true,
    "placeholder": "10",
    "visibilityCondition": "context?.inputData?.schedule_type === 'delay'"
  },
  {
    "key": "post_at",
    "help": "Enter date & time in this format only: YYYY-MM-DD HH:mm (24-hour time in IST, UTC+5:30).",
    "type": "string",
    "label": "At",
    "required": true,
    "placeholder": "2026-02-05 18:07",
    "visibilityCondition": "context?.inputData?.schedule_type === 'datetime'"
  },
  {
    "key": "bot_details",
    "type": "input groups",
    "label": "Bot Details",
    "fields": [
      {
        "key": "bot_name",
        "help": "Enter the bot display name. Defaults to viaSocket if left blank.",
        "type": "string",
        "label": "Display Name",
        "required": false,
        "placeholder": "viaSocket"
      },
      {
        "key": "icon_type",
        "help": "Select the type of bot icon to use.",
        "type": "dropdown",
        "label": "Custom Icon Type",
        "options": [
          {
            "label": "Emoji",
            "value": "emoji"
          },
          {
            "label": "Image URL",
            "value": "url"
          }
        ],
        "required": false,
        "customHelp": "Enter emoji or url.",
        "placeholder": "Select",
        "customInputLabel": "Icon type",
        "customPlaceholder": "emoji"
      },
      {
        "key": "emoji",
        "help": "Enter the emoji short code that will be used as the bot's icon, e.g., :smile:. You can find emoji codes [here](https://www.webfx.com/tools/emoji-cheat-sheet/).",
        "type": "string",
        "label": "Emoji Code",
        "required": false,
        "placeholder": ":smile:",
        "visibilityCondition": "context?.inputData?.bot_details?.icon_type === 'emoji'"
      },
      {
        "key": "url",
        "help": "Enter the icon image URL. Defaults to the viaSocket logo if left blank.",
        "type": "string",
        "label": "Icon Image URL",
        "required": false,
        "placeholder": "https://stuff.thingsofbrand.com/viasocket.com/images/imgf_logo-2.png",
        "visibilityCondition": "context?.inputData?.bot_details?.icon_type === 'url'"
      }
    ]
  },
  {
    "key": "preview",
    "type": "input groups",
    "label": "Preview",
    "fields": [
      {
        "key": "unfurl_links",
        "help": "Expand URLs as preview cards in the message.",
        "type": "dropdown",
        "label": "Show Link Preview",
        "options": [
          {
            "label": "Yes, show link previews",
            "value": true
          },
          {
            "label": "No, keep message clean",
            "value": false
          }
        ],
        "required": false,
        "customHelp": "Enter true to expand URLs as preview cards, false to keep the message clean.",
        "placeholder": "Select",
        "customInputLabel": "Show link preview",
        "customPlaceholder": "true"
      },
      {
        "key": "unfurl_media",
        "help": "Select whether to show images, videos, and GIFs inline in the message.",
        "type": "dropdown",
        "label": "Show Media Preview",
        "options": [
          {
            "label": "Yes, show media inline",
            "value": true
          },
          {
            "label": "No, show only the URL",
            "value": false
          }
        ],
        "required": false,
        "customHelp": "Enter true to show media inline, false to show only the URL.",
        "placeholder": "Select",
        "customInputLabel": "Show media preview",
        "customPlaceholder": "true"
      }
    ]
  }
]
```

**API Configuration Perform Code**

```javascript
async function sendMessage() {  
  try {  
    const destination = context?.inputData?.destination || {};  
    const botDetails = context?.inputData?.bot_details || {};  
    const preview = context?.inputData?.preview || {};

    const targetType = destination?.messageto;  
    const rawContent = context?.inputData?.markdown_content;

    if (!targetType) {  
      throw new Error('Destination type is required.');  
    }  
    if (!rawContent || !rawContent.trim()) {  
      throw new Error('Message content is required.');  
    }

    const toUnixTimestamp = (input) => {  
      if (!input) throw new Error('post_at is required');  
      const match = input.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);  
      if (!match) throw new Error('Invalid date format. Use YYYY-MM-DD HH:mm');  
      const [, year, month, day, hour, minute] = match;  
      const utcMillis = Date.UTC(  
        Number(year),  
        Number(month) - 1,  
        Number(day),  
        Number(hour) - 5,  
        Number(minute) - 30,  
        0  
      );  
      if (isNaN(utcMillis)) throw new Error('Invalid date value');  
      return Math.floor(utcMillis / 1000);  
    };

    const toDelayTimestamp = (delayMinutes) => {  
      if (!delayMinutes || isNaN(delayMinutes)) throw new Error('Delay value is required and must be a number');  
      return Math.floor(Date.now() / 1000) + Number(delayMinutes) * 60;  
    };

    const normalizeIds = (input) => {  
      if (!input) return [];  
      if (Array.isArray(input)) {  
        return input  
          .flatMap((item) => {  
            if (typeof item === 'string') return item.split(',');  
            if (typeof item === 'object' && item?.value) return item.value.split(',');  
            return [];  
          })  
          .map((v) => v.trim())  
          .filter(Boolean);  
      }  
      if (typeof input === 'string') {  
        return input.split(',').map((v) => v.trim()).filter(Boolean);  
      }  
      return [];  
    };

    const isChannelId = (val) => /^[CGD][A-Z0-9]{8,}$/i.test(val);

    let channelLookupCache = null;  
    const getChannelLookup = async () => {  
      if (channelLookupCache) return channelLookupCache;

      const allChannels = [];  
      let cursor;  
      do {  
        const response = await axios.get(  
          'https://slack.com/api/conversations.list',  
          {  
            params: {  
              types: 'public_channel,private_channel',  
              exclude_archived: true,  
              limit: 999,  
              cursor  
            }  
          }  
        );  
        if (!response.data.ok) throw new Error(response.data.error);  
        allChannels.push(...(response.data.channels || []));  
        cursor = response.data.response_metadata?.next_cursor || null;  
      } while (cursor);

      const map = {};  
      for (const ch of allChannels) {  
        if (ch.name && ch.id) {  
          map[ch.name.toLowerCase()] = ch.id;  
        }  
      }  
      channelLookupCache = map;  
      return map;  
    };

    const resolveChannels = async (inputs) => {  
      const resolved = [];  
      let needsLookup = inputs.some((v) => !isChannelId(v));

      let lookup = {};  
      if (needsLookup) lookup = await getChannelLookup();

      for (const raw of inputs) {  
        if (isChannelId(raw)) {  
          resolved.push(raw);  
          continue;  
        }  
        const cleaned = raw.replace(/^#/, '').trim().toLowerCase();  
        const id = lookup[cleaned];  
        if (!id) {  
          throw new Error(`Channel "${raw}" not found. Please check the name or use the channel ID.`);  
        }  
        resolved.push(id);  
      }  
      return resolved;  
    };

    const scheduleType = context?.inputData?.schedule_type;  
    const isScheduled = scheduleType === 'datetime' || scheduleType === 'delay';

    const performApiUrl = isScheduled  
      ? 'https://slack.com/api/chat.scheduleMessage'  
      : 'https://slack.com/api/chat.postMessage';

    let post_at = undefined;  
    if (isScheduled) {  
      if (scheduleType === 'datetime') {  
        post_at = toUnixTimestamp(context?.inputData?.post_at);  
      } else if (scheduleType === 'delay') {  
        post_at = toDelayTimestamp(context?.inputData?.delay_value);  
      }  
    }

    const hasMarkdown = /(\*[^*]+\*|_[^_]+_|`[^`]+`|\~[^\~]+\~|>\s|```[\s\S]*```|[.+]\(.+\))/.test(rawContent);

    const actions = Object.entries(context?.inputData?.buttons || {}).map(([key, url], index) => ({  
      type: 'button',  
      text: key.charAt(0).toUpperCase() + key.slice(1),  
      url,  
      style: index % 2 === 0 ? 'primary' : 'danger'  
    }));

    const attachmentjson = actions.length  
      ? [{ fallback: 'Buttons', color: '#36a64f', attachment_type: 'default', actions }]  
      : undefined;

    const buildMentionPrefix = () => {  
      const taggedRaw = normalizeIds(destination?.tagged_users);  
      if (!taggedRaw.length) return '';

      const mentions = taggedRaw.map((id) => {  
        if (id === 'channel') return '<!channel>';  
        return `<@${id}>`;  
      });

      return mentions.join(' ') + '\n\n';  
    };

    const mentionPrefix = buildMentionPrefix();

    const botName = botDetails?.bot_name?.trim() || 'viaSocket';  
    const defaultIconUrl = 'https://stuff.thingsofbrand.com/viasocket.com/images/imgf_logo-2.png';

    const applyBotIdentity = (data) => {  
      data.username = botName;  
      const iconType = botDetails?.icon_type;

      if (iconType === 'emoji' && botDetails?.emoji) {  
        data.icon_emoji = botDetails.emoji;  
      } else if (iconType === 'url') {  
        data.icon_url = botDetails?.url?.trim() || defaultIconUrl;  
      } else {  
        data.icon_url = defaultIconUrl;  
      }  
      return data;  
    };

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const rateLimitedPost = async (url, payload, maxRetries = 3) => {  
      for (let attempt = 0; attempt <= maxRetries; attempt++) {  
        const response = await axios.post(url, payload, {});  
        if (response.data.ok) return response.data;

        const errorCode = response.data.error;  
        const isRateLimited = errorCode === 'ratelimited' || response.status === 429;  
        if (isRateLimited && attempt < maxRetries) {  
          const retryAfter = Number(response.headers?.['retry-after']) || Math.pow(2, attempt);  
          await sleep(retryAfter * 1000);  
          continue;  
        }  
        throw new Error(errorCode || 'Slack API error');  
      }  
    };

    const sendSingleMessage = async (channel, thread_ts = undefined, reply_broadcast = undefined) => {  
      const payload = applyBotIdentity({  
        channel,  
        text: mentionPrefix + rawContent,  
        mrkdwn: hasMarkdown,  
        ...(attachmentjson && { attachments: attachmentjson }),  
        ...(preview?.unfurl_links !== undefined && { unfurl_links: preview.unfurl_links }),  
        ...(preview?.unfurl_media !== undefined && { unfurl_media: preview.unfurl_media }),  
        ...(post_at && { post_at }),  
        ...(thread_ts && { thread_ts }),  
        ...(reply_broadcast !== undefined && { reply_broadcast })  
      });

      return await rateLimitedPost(performApiUrl, payload);  
    };

    const responses = [];

    if (targetType === 'channel') {  
      const rawInputs = normalizeIds(destination?.channel_id);  
      if (!rawInputs.length) throw new Error('Channel is required. Please select a channel to send the message.');

      const channels = await resolveChannels(rawInputs);

      for (const channel of channels) {  
        responses.push(await sendSingleMessage(channel));  
      }  
    } else if (targetType === 'user') {  
      const users = normalizeIds(destination?.userId);  
      if (!users.length) throw new Error('User is required. Please select a user to send the message.');

      for (const user of users) {  
        const payload = applyBotIdentity({  
          channel: user,  
          text: rawContent,  
          mrkdwn: hasMarkdown,  
          ...(attachmentjson && { attachments: attachmentjson }),  
          ...(preview?.unfurl_links !== undefined && { unfurl_links: preview.unfurl_links }),  
          ...(preview?.unfurl_media !== undefined && { unfurl_media: preview.unfurl_media }),  
          ...(post_at && { post_at })  
        });

        responses.push(await rateLimitedPost(performApiUrl, payload));  
      }  
    } else if (targetType === 'thread') {  
      let channel = destination?.thread_channel_id;  
      const thread_ts = destination?.thread_ts;  
      const reply_broadcast = destination?.reply_broadcast || false;

      if (!channel) throw new Error('Channel is required. Please select a channel to send the message.');  
      if (!thread_ts) throw new Error('Thread message is required. Please select a message to reply to.');

      if (!isChannelId(channel)) {  
        const [resolvedId] = await resolveChannels([channel]);  
        channel = resolvedId;  
      }

      responses.push(await sendSingleMessage(channel, thread_ts, reply_broadcast));  
    } else {  
      throw new Error('Invalid target type.');  
    }

    return responses.length === 1 ? responses[0] : responses;

  } catch (error) {  
    await errorComponent(error);  
  }  
}  
return await sendMessage();
```

## MSG91 — Send WhatsApp Template Message

**Metadata**
- **App:** MSG91
- **Category:** Communication / Messaging
- **Action:** Send WhatsApp Template Message
- **Action Type:** CREATE

**UX Components & Field Design**

| Field | Type | Key | Purpose |
|---|---|---|---|
| Integrated Number | dropdown | `integrated_number` | WhatsApp number selector from MSG91 |
| Template | dropdown | `name` | Template selector dependent on integrated number |
| Template Field | input groups (fieldsGenerator) | `components` | Dynamic template variables |
| Template preview | input groups (fieldsGenerator) | `gaooXaGs` | Live preview of how template will appear |
| To | string | `to` | Comma-separated recipient phone numbers |

**Key UX Patterns**
- **Cascading dropdowns**: Template depends on Integrated Number
- **Dynamic template fields**: fieldsGenerator populates variable fields based on selected template
- **Preview field**: A second fieldsGenerator renders a read-only preview of the final message
- **Simple recipient input**: Comma-separated string instead of complex multiselect for phone numbers

**UX Takeaways**
- Template-based messaging actions should show a live preview of the rendered template
- Cascading dependencies (number → template → variables) create a natural top-down flow
- Phone number inputs can use simple comma-separated strings when the API handles parsing

---

## Gmail — Send Email

**Metadata**
- **App:** Gmail
- **Category:** Communication / Email
- **Action:** Send Email
- **Action Type:** CREATE

**UX Components & Field Design**

| Field | Type | Key | Purpose |
|---|---|---|---|
| To | string | `to` | Comma-separated recipients |
| CC | string | `cc` | Optional CC recipients |
| BCC | string | `bcc` | Optional BCC recipients |
| Subject | string | `subject` | Email subject line |
| From | dropdown | `from` | SendAs email selector from Gmail settings |
| Sender Name | string | `fromName` | Custom sender display name |
| Reply To | string | `replyTo` | Override reply address |
| Message Body | html | `messageBody` | Rich HTML or plain text body |
| Attachment Size Limit | help (dynamic) | `attachment_size_help` | Size limit warning |
| Attachments | string | `attachments` | Comma-separated file URLs |
| Label | multiselect | `labelIds` | Gmail labels to apply to sent message |

**Key UX Patterns**
- **HTML field type**: `type: "html"` for rich email body composition
- **Dynamic From dropdown**: Fetches SendAs addresses from Gmail API
- **Help field for warnings**: Static help field explains 25 MB attachment limit
- **Simple attachment input**: Comma-separated URLs instead of complex file upload

**UX Takeaways**
- Email actions follow a natural top-down flow: recipients → subject → body → attachments → labels
- `type: "html"` enables rich content editing for email bodies
- Help fields are excellent for surfacing important limitations (attachment size) without blocking the flow
- Google Drive file handling in perform code shows how to support both Drive URLs and regular URLs

---

# INSTANT TRIGGER Examples

## LinkedIn Campaign Manager- New Organic Lead Form Response (Instant Trigger-Backend Service):

- **Category:** INSTANT TRIGGER (Instant Backend Service)
- **Use Case:** Triggers when a new lead is submitted through a LinkedIn Campaign Manager organic lead form

**Input Fields JSON**
```json
[
  {
    "key": "organization",
    "help": "Select the organization hosting the organic lead source.",
    "type": "dropdown",
    "label": "Organization",
    "required": true,
    "customHelp": "Enter the Organization URN from an action that lists organizations.",
    "canPaginate": true,
    "enableSearchApi": false,
    "customInputLabel": "Organization URN",
    "optionsGenerator": "async function getOrganizations() {\n  try {\n    const pageToken = context?.paginateData?.['organization'];\n    const start = pageToken === 'empty' || pageToken === null || pageToken === undefined\n      ? 0\n      : Number(pageToken) || 0;\n    const res = await axios.get('https://api.linkedin.com/rest/organizationAcls', {\n      params: {\n        q: 'roleAssignee',\n        count: 50,\n        start\n      },\n      headers: {\n        'Linkedin-Version': '202608',\n        'X-Restli-Protocol-Version': '2.0.0'\n      }\n    });\n    const items = res?.data?.elements || [];\n    if (items.length === 0) {\n      return {\n        data: [],\n        offset: null,\n        message: 'No organizations found.'\n      };\n    }\n    return {\n      data: items.map((item) => ({\n        label: item.organization,\n        value: item.organization,\n        sample: item.organization\n      })),\n      offset: items.length < 50 ? null : start + items.length\n    };\n  } catch (error) {\n    await errorComponent(error);\n  }\n}\n\nreturn await getOrganizations();",
    "customPlaceholder": "urn:li:organization:123456"
  },
  {
    "key": "lead_type",
    "help": "Select the type of organic lead source.",
    "type": "dropdown",
    "label": "Lead Type",
    "options": [
      {
        "label": "Event",
        "value": "EVENT"
      },
      {
        "label": "Company",
        "value": "COMPANY"
      },
      {
        "label": "Organization Product",
        "value": "ORGANIZATION_PRODUCT"
      }
    ],
    "required": true,
    "customHelp": "Enter EVENT, COMPANY, or ORGANIZATION_PRODUCT.",
    "customInputLabel": "Lead Type",
    "customPlaceholder": "EVENT"
  },
  {
    "key": "event",
    "help": "Select a lead-gen-enabled event hosted by the organization.",
    "type": "dropdown",
    "label": "Event",
    "required": false,
    "customHelp": "Enter the Event URN from an action that lists events.",
    "canPaginate": true,
    "customInputLabel": "Event URN",
    "optionsGenerator": "async function getEvents() {\r\n  try {\r\n    const organizer = context?.inputData?.organization;\r\n\r\n    if (!organizer) {\r\n      return {\r\n        message: 'Select an Organization first.'\r\n      };\r\n    }\r\n\r\n    const pageToken = context?.paginateData?.['event'];\r\n\r\n    const start =\r\n      pageToken === 'empty' ||\r\n      pageToken === null ||\r\n      pageToken === undefined\r\n        ? 0\r\n        : Number(pageToken) || 0;\r\n\r\n    const url =\r\n      'https://api.linkedin.com/rest/events' +\r\n      '?q=eventsByOrganizer' +\r\n      '&organizer=' + encodeURIComponent(organizer) +\r\n      '&start=' + start +\r\n      '&count=50' +\r\n      '&excludeCancelled=false';\r\n\r\n    const res = await axios.get(url, {\r\n      headers: {\r\n        'Linkedin-Version': '202608',\r\n        'X-Restli-Protocol-Version': '2.0.0'\r\n      }\r\n    });\r\n\r\n    const items = res?.data?.elements || [];\r\n    if (items.length === 0) {\r\n      return {\r\n        data: [],\r\n        offset: null,\r\n        message: 'No events found for this Organization.'\r\n      };\r\n    }\r\n\r\n   return {\r\n  data: items.map(item => {\r\n    const eventId = item?.vanityName?.slice(-19);\r\n    const eventUrn = `urn:li:event:${eventId}`;\r\n\r\n    return {\r\n      label:\r\n        item?.name?.localized?.en_US ||\r\n        item?.vanityName ||\r\n        eventUrn,\r\n      value: eventUrn,\r\n      sample: eventUrn\r\n    };\r\n  }),\r\n  offset: items.length < 50\r\n    ? null\r\n    : start + items.length\r\n};\r\n  } catch (error) {\r\n    throw error;\r\n  }\r\n}\r\n\r\ntry {\r\n  return await getEvents();\r\n} catch (error) {\r\n  throw error;\r\n}",
    "customPlaceholder": "urn:li:event:987654321",
    "visibilityCondition": "context?.inputData?.lead_type === 'EVENT'"
  }
]
```
**Subscribe Code**
```javascript
try {
  const {
    organization,
    hookUrl,
    lead_type: leadType,
    event
  } = context?.inputData || {};
  const subscribeUrl =
    'https://plug-service.viasocket.com/webhook/linkedin-campaign/cab55801-2529-4f2b-af10-a536895528b4';

  if (!organization || organization === 'empty') {
    throw new Error('Organization is required.');
  }
  if (!hookUrl) throw new Error('Webhook URL is missing.');
  if (!leadType) throw new Error('Lead type is required.');

  const normalized = String(organization).startsWith('urn:li:')
    ? organization
    : `urn:li:organization:${organization}`;
  const ownerParam = `(value:(organization:${encodeURIComponent(normalized)}))`;
  const leadTypeParam = `(leadType:${encodeURIComponent(leadType)})`;
  const listUrl =
    `https://api.linkedin.com/rest/leadNotifications?q=criteria&owner=${ownerParam}&leadType=${leadTypeParam}`;
  const listHeaders = {
    'Linkedin-Version': '202408',
    'X-Restli-Protocol-Version': '2.0.0'
  };

  const matches = (item) =>
    item?.owner?.organization === normalized &&
    item?.webhook === subscribeUrl &&
    item?.leadType === leadType;

  const findExisting = async () => {
    const response = await axios.get(listUrl, { headers: listHeaders });
    return (response?.data?.elements || []).find(matches);
  };

  let created = await findExisting();

  if (!created) {
    await axios.post(
      'https://api.linkedin.com/rest/leadNotifications',
      {
        webhook: subscribeUrl,
        owner: { organization: normalized },
        leadType
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Linkedin-Version': '202408',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    created = await findExisting();
    if (!created) {
      throw new Error('Subscription created but could not be confirmed. Please retry.');
    }
  }

  const conditions = [
    {
      type: 'rule',
      path: 'body.leadType',
      operator: 'eq',
      value: leadType
    },
    {
      type: 'rule',
      path: 'body.type',
      operator: 'eq',
      value: 'LEAD_ACTION'
    }
  ];

  if (event) {
    conditions.push({
      type: 'rule',
      path: 'body.associatedEntity.event',
      operator: 'eq',
      value: event
    });
  }

  const subscribeResponse = await axios.post(
    'https://plugservice-api.viasocket.com/api/subscribe',
    {
      service: 'linkedin-campaign',
      external_id: organization,
      webhook: hookUrl,
      precondition_config: {
        type: 'and',
        conditions
      },
      metadata: {
        id: created.id,
        leadType: created.leadType,
        versionedForm: created.versionedForm
      }
    },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  return {
    ...subscribeResponse.data,
    id: created.id,
    webhook: created.webhook,
    leadType: created.leadType,
    versionedForm: created.versionedForm
  };
} catch (error) {
  await errorComponent(error);
}
```
**UnSubscribe Code**
```javascript
async function performUnsubscribe() {
  try {
    const {
      organization,
      hookUrl,
      lead_type: configuredLeadType,
      performsubscribe
    } = context?.inputData || {};
    const subscription = performsubscribe?.subscription;
    const webhookId = performsubscribe?.id;
    const leadType =
      performsubscribe?.leadType ||
      subscription?.metadata?.leadType ||
      configuredLeadType;

    if (!organization) throw new Error('Organization is required.');
    if (!hookUrl) throw new Error('Webhook URL is missing.');
    if (!subscription?.id) {
      throw new Error('No active subscription found to unsubscribe. Missing subscription ID.');
    }
    if (!webhookId) {
      throw new Error('LinkedIn lead notification ID is missing.');
    }
    if (!leadType) throw new Error('Lead type is required.');

    const finalResponses = {};
    const unsubscribeResponse = await axios.post(
      'https://plugservice-api.viasocket.com/api/unsubscribe',
      {
        service: 'linkedin-campaign',
        external_id: organization,
        webhook: hookUrl
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    finalResponses.unsubscribeResponse = unsubscribeResponse.data;

    const random = Math.floor(Math.random() * 1000000);
    const subscriptionListUrl =
      `https://plugservice-api.viasocket.com/api/subscriptions/linkedin-campaign/${encodeURIComponent(organization)}?random=${random}`;
    const subscriptionListResponse = await axios.get(subscriptionListUrl);
    finalResponses.subscriptionListResponse = subscriptionListResponse.data;

    const subscriptions =
      subscriptionListResponse.data?.subscriptions?.subscriptions || [];
    const getLeadType = (item) =>
      item?.metadata?.leadType ||
      item?.precondition_config?.conditions?.find(
        (condition) =>
          condition?.path === 'body.leadType' &&
          condition?.operator === 'eq'
      )?.value;
    const matchingLeadTypeSubscriptions = subscriptions.filter(
      (item) =>
        item?.status !== 'inactive' &&
        getLeadType(item) === leadType
    );

    finalResponses.preconditionCount = matchingLeadTypeSubscriptions.length;
    finalResponses.leadTypeSubscriptionCount = matchingLeadTypeSubscriptions.length;

    if (matchingLeadTypeSubscriptions.length === 0) {
      const linkedinUnsubscribe = await axios.delete(
        `https://api.linkedin.com/rest/leadNotifications/${encodeURIComponent(webhookId)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Linkedin-Version': '202608',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );
      finalResponses.linkedin_unsubscribe = linkedinUnsubscribe.data;
    }

    return finalResponses;
  } catch (error) {
    await errorComponent(error);
  }
}

return await performUnsubscribe();
```
**Sample Code**
```javascript
return {
      "viaSocket_help": "This is only the sample data of the original. Save the trigger and publish the flow to see the actual response.",
    "owner": {
      "organization": "urn:li:organization:107677191"
    },
    "occurredAt": 1789564110201,
    "leadAction": "CREATED",
    "leadGenForm": "urn:li:versionedLeadGenForm:(urn:li:leadGenForm:7505968236862136320,1)",
    "leadType": "EVENT",
    "type": "LEAD_ACTION",
    "leadGenFormResponse": "urn:li:leadGenFormResponse:e58d0e64-fb6d-4270-a879-1571f808cce6-6",
    "associatedEntity": {
      "event": "urn:li:event:7505968237071802368"
    }
  }
  ```
  


---
# SCHEDULED TRIGGER Examples

## Google Calendar — New Upcoming Events (Scheduled Trigger)

**Rationale**
- **Category:** SCHEDULED TRIGGER (Polling)
- **Use Case:** Polls Google Calendar for upcoming events that start within a user-defined relative time offset in the future (`minutesBefore` minutes from execution time).
- **UX Highlights:**
  - **Multiselect Resource Picker (`calendarId`):** Allows selecting one or multiple calendars with dynamic options generator and custom placeholder/help fallback.
  - **Relative Time Offset (`minutesBefore`):** Asks user how many minutes before the event start time they want to be notified.
  - **Contextual Help (`help_minutesBefore`):** Gated by `visibilityCondition: "context?.inputData?.minutesBefore !== undefined && context?.inputData?.minutesBefore !== ''"`, explaining that the trigger polls every 5 minutes and catches events starting between `minutesBefore` and `minutesBefore + 5` minutes from execution time.
  - **Execution Time Snapping (`__executionStartTime__`):** Snaps execution start time to the nearest 5-minute mark (`Math.round(minutes / 5) * 5`) to normalize execution timestamps and compensate for cron trigger drift.
  - **Exact 5-Minute Window & API Fetch Buffer:** Uses exact 5-minute window blocks (`windowSizeMins = 5`), widening `timeMin`/`timeMax` by 1 minute (60,000 ms) on both bounds so Google Calendar API does not exclude boundary-edge matches.
  - **Strict Client-Side JS Boundary Filter:** Performs post-fetch JS filtering (`eventStartMs <= windowStartMs || eventStartMs > windowEndMs`) to guarantee exact matching within the target window.
  - **Single-Pass Fetching:** Iterates through selected calendar IDs and fetches events using `timeMin` and `timeMax` ISO strings without internal pagination loops, tagging returned items with `calendarId`.

**Input Fields JSON**
```json
[
  {
    "key": "calendarId",
    "help": "Select or Enter your calendar ID",
    "type": "multiselect",
    "label": "Calendar",
    "required": true,
    "customHelp": "Use the 'List Calendar' action to get all calendar along with their IDs and then map the retrieved data accordingly",
    "customInputLabel": "Enter your calendar Id.",
    "optionsGenerator": "try {\nreturn await fetch_calendars() \n\n} catch (error) {\n  await errorComponent(error) \n}",
    "customPlaceholder": "[\"test@gmail.com\", \"xyz@gmail.com\"]"
  },
  {
    "key": "minutesBefore",
    "help": "Enter how many minutes before the event start time you want to be notified.",
    "type": "number",
    "label": "Minutes Before",
    "required": false,
    "placeholder": "15"
  },
  {
    "key": "help_minutesBefore",
    "help": "Enter minutes before the event start to get notified. Trigger polls every 5 min, so events starting between (minutesBefore) and (minutesBefore + 5) minutes from now are caught.",
    "type": "help",
    "visibilityCondition": "context?.inputData?.minutesBefore !== undefined && context?.inputData?.minutesBefore !== ''"
  }
]
```

**Perform Code**
```javascript
async function fetchUpcomingEvents() {
    try {
        // 1. Snap execution time to the NEAREST 5-minute mark to handle cron drift
        const execDate = new Date(__executionStartTime__);
        const minutes = execDate.getUTCMinutes();
        
        const snappedMinutes = Math.round(minutes / 5) * 5; 
        execDate.setUTCMinutes(snappedMinutes, 0, 0); // Force to exactly 0 seconds and 0 ms
        const snappedExecTimeMs = execDate.getTime();

        // ---------------------------------------------------------
        // STRICT NUMBER PARSING
        // ---------------------------------------------------------
        const rawMinutesBefore = context.inputData?.minutesBefore;
        const minutesBefore = (rawMinutesBefore !== undefined && rawMinutesBefore !== '') 
            ? Number(rawMinutesBefore) 
            : 0;
            
        // Use exact 5-minute blocks
        const windowSizeMins = 5;

        // ---------------------------------------------------------
        // TIME MATH FIX & BOUNDARIES
        // ---------------------------------------------------------
        const windowStartMs = snappedExecTimeMs + (minutesBefore * 60 * 1000);
        const windowEndMs = snappedExecTimeMs + ((minutesBefore + windowSizeMins) * 60 * 1000);

        // Widen the API fetch window by 1 minute on both sides to prevent Google Calendar from excluding exact boundary matches
        const timeMin = new Date(windowStartMs - 60000).toISOString();
        const timeMax = new Date(windowEndMs + 60000).toISOString();
        
        const calendarIds = Array.isArray(context.inputData?.calendarId)
            ? context.inputData.calendarId
            : [context.inputData?.calendarId].filter(Boolean);

        let upcomingEvents = [];

        // ---------------------------------------------------------
        // SINGLE-PASS API FETCH
        // ---------------------------------------------------------
        for (const calendarId of calendarIds) {
            if (!calendarId) {
                continue;
            }

            const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

            const params = {
                timeMin: timeMin,
                timeMax: timeMax,
                orderBy: 'startTime',
                singleEvents: true,
                maxResults: 1000 
            };

            const response = await axios.get(url, { params });
            const items = response.data?.items || [];

            if (items.length > 0) {
                const validEvents = items.filter(event => {
                    const eventStartMs = new Date(event.start?.dateTime || event.start?.date).getTime();
                    
                    // Strict JavaScript Boundary Check (Adjusted to catch exact end-minute)
                    if (eventStartMs <= windowStartMs || eventStartMs > windowEndMs) {
                        return false;
                    }

                    return true;
                });

                upcomingEvents.push(
                    ...validEvents.map(event => ({
                        ...event,
                        calendarId // Keep track of source calendar
                    }))
                );
            }
        }

        return upcomingEvents;

    } catch (error) {
        await errorComponent(error);
    }
}

return await fetchUpcomingEvents();
```

---

## Google Meet — New Upcoming Meeting (Scheduled Trigger)

**Rationale**
- **Category:** SCHEDULED TRIGGER (Polling)
- **Use Case:** Polls Google Calendar for upcoming events that contain Google Meet video conference links and start within a user-defined relative time offset in the future (`meetingBefore` minutes from execution time).
- **UX Highlights:**
  - **Multiselect Resource Picker (`calendarId`):** Allows selecting one or multiple calendars to monitor for Google Meet links.
  - **Relative Time Offset (`meetingBefore`):** Asks user how many minutes before the meeting start time to trigger the workflow.
  - **Contextual Help (`help_schedule_info`):** Gated by `visibilityCondition: "context?.inputData?.meetingBefore !== undefined"`, explaining that the trigger polls every 5 minutes and catches events starting between `meetingBefore` and `meetingBefore + 5` minutes from execution time.
  - **Execution Time Snapping (`__executionStartTime__`):** Snaps execution start time to the nearest 5-minute mark (`Math.round(minutes / 5) * 5`) to handle cron drift across polling runs.
  - **Expanded Google Meet Detection:** Checks for Google Meet links across `conferenceData.entryPoints`, `location`, and `description` using regex (`/meet\.google\.com/i`).
  - **Strict Boundary Check:** Ensures `eventStartMs >= windowStartMs && eventStartMs < windowEndMs` to guarantee exactly 1 execution tick per meeting without duplicate triggers.

**Input Fields JSON**
```json
[
  {
    "key": "calendarId",
    "help": "Select the calendars to monitor for upcoming meetings.",
    "type": "multiselect",
    "label": "Calendar",
    "required": true,
    "customHelp": "Select one or more Calendar IDs from the list. You can use the List Calendar action to find calendar IDs.",
    "placeholder": "Select Calendars",
    "customInputLabel": "Calendar IDs",
    "optionsGenerator": "try {\n  return await fetch_calendars();\n} catch (error) {\n  await errorComponent(error);\n}",
    "customPlaceholder": "[\"test@gmail.com\", \"xyz@gmail.com\"]"
  },
  {
    "key": "meetingBefore",
    "help": "Enter the number of minutes before the meeting starts to trigger this workflow.",
    "type": "number",
    "label": "Minutes Before Meeting",
    "required": false,
    "placeholder": "15"
  },
  {
    "key": "help_schedule_info",
    "help": "Enter minutes before the meeting start to get notified. Trigger polls every 5 min, so events starting between (meetingBefore) and (meetingBefore + 5) minutes from now are caught.",
    "type": "help",
    "visibilityCondition": "context?.inputData?.meetingBefore !== undefined"
  }
]
```

**Perform Code**
```javascript
async function fetchUpcomingMeetings() {
    try {
        // 1. Snap execution time to the NEAREST 5-minute mark to handle cron drift
        const execDate = new Date(__executionStartTime__);
        const minutes = execDate.getUTCMinutes();
        
        const snappedMinutes = Math.round(minutes / 5) * 5; 
        execDate.setUTCMinutes(snappedMinutes, 0, 0); // Force to exactly 0 seconds and 0 ms
        const snappedExecTimeMs = execDate.getTime();

        // ---------------------------------------------------------
        // STRICT NUMBER PARSING
        // ---------------------------------------------------------
        const rawMeetingBefore = context.inputData?.meetingBefore;
        const meetingBefore = (rawMeetingBefore !== undefined && rawMeetingBefore !== '') 
            ? Number(rawMeetingBefore) 
            : 0;
            
        // Use exact 5-minute blocks
        const windowSizeMins = 5;

        // ---------------------------------------------------------
        // TIME MATH FIX
        // ---------------------------------------------------------
        // Calculate strict JavaScript boundaries using the snapped timestamp
        const windowStartMs = snappedExecTimeMs + (meetingBefore * 60 * 1000);
        const windowEndMs = snappedExecTimeMs + ((meetingBefore + windowSizeMins) * 60 * 1000);

        // Widen the API fetch window by 1 minute on both sides to prevent Google Calendar from excluding exact boundary matches
        const timeMin = new Date(windowStartMs - 60000).toISOString();
        const timeMax = new Date(windowEndMs + 60000).toISOString();
        
        const calendarIds = Array.isArray(context.inputData?.calendarId)
            ? context.inputData.calendarId
            : [context.inputData?.calendarId].filter(Boolean);

        let upcomingMeetings = [];

        // ---------------------------------------------------------
        // SINGLE-PASS API FETCH
        // ---------------------------------------------------------
        for (const calendarId of calendarIds) {
            if (!calendarId) {
                continue;
            }

            const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

            const params = {
                timeMin: timeMin,
                timeMax: timeMax,
                orderBy: 'startTime',
                singleEvents: true,
                maxResults: 1000 // Safely capped per platform limits
            };

            const response = await axios.get(url, { params });
            const items = response.data?.items || [];

            if (items.length > 0) {
                const validEvents = items.filter(event => {
                    // 1. Expanded Google Meet Link Check (Conference Data + Location + Description)
                    const meetRegex = /meet\.google\.com/i;
                    const hasMeetLink = (
                        (event.conferenceData && event.conferenceData.entryPoints && event.conferenceData.entryPoints.some(ep => ep.uri && ep.uri.includes('meet.google.com'))) ||
                        (event.location && meetRegex.test(event.location)) ||
                        (event.description && meetRegex.test(event.description))
                    );
                    
                    if (!hasMeetLink) return false;

                    // 2. Strict JavaScript Boundary Check (Guarantees exactly 1 execution tick per meeting)
                    const eventStartMs = new Date(event.start?.dateTime || event.start?.date).getTime();
                    return eventStartMs >= windowStartMs && eventStartMs < windowEndMs;
                });

                upcomingMeetings.push(
                    ...validEvents.map(event => ({
                        ...event,
                        calendarId // Keep track of source calendar
                    }))
                );
            }
        }

        return upcomingMeetings;

    } catch (error) {
        await errorComponent(error);
    }
}

return await fetchUpcomingMeetings();
```


---

## RSS Feed — RSS Feed Update Tracker (Scheduled Trigger)

**Rationale**
- **Category:** SCHEDULED TRIGGER (Polling)
- **Service:** RSS Feed
- **Action:** RSS Feed Update Tracker
- **Use Case:** Polls multiple configured RSS feed URLs at regular intervals and triggers the workflow whenever new items or updates are published, tracking processed items by `pubDate` using pagination cursors.
- **UX Highlights:**
  - **Preconfigured Multi-Item List (`feed_url` with `list: true`):** In triggers, dynamic data mapping from upstream steps is impossible because triggers start the workflow. Therefore, when multiple items (e.g. RSS Feed URLs) need to be configured, use `list: true` on the `string` field so users can enter multiple items in a clean line-item list UI during setup.
  - **Filter Type Selection (`filter_type`):** Dropdown to select deduplication strategy (`Different Publish Date` / `pubDate`) to ensure each item is processed only once, paired with matching `defaultValue`.
  - **Multi-Feed Aggregation & XML Parsing:** Loops through configured feed URLs, parses XML using `XMLParser`, filters items by `pubDate` against `context.paginationData` (or fallback window from `scheduledTime`), and merges channel metadata into each item.
  - **Chronological Sorting & Cursor Management:** Sorts items oldest-first so flows process events in natural sequence, caps results at 1000 items, and saves the latest item timestamp to `context.paginationData`.
  - **Representative Sample Data (`performlist`):** Scans the configured feed URLs to return the latest item found across feeds with a helpful `viasocket_help` message, falling back to a structured schema if feeds are currently empty or unreachable.
  - **Bulk Transfer Capability (`transferoption`):** Slices aggregated items in batches of 200 using `offset`, sorted oldest-first with `uniqueIdentifier` set to `guid` if present.

**Input Fields JSON**
```json
[
  {
    "key": "feed_url",
    "help": "Provide the publicly accessible RSS feed URLs to fetch data from.",
    "list": true,
    "type": "string",
    "label": "Feed URL",
    "required": true,
    "placeholder": "https://example.com/rss.xml"
  },
  {
    "key": "filter_type",
    "help": "Choose the filter type to ensure that each item is processed only once.",
    "type": "dropdown",
    "label": "Filter Type",
    "options": [
      {
        "label": "Different Publish Date",
        "value": "pubDate",
        "sample": "pubDate"
      }
    ],
    "required": true,
    "placeholder": "Choose Filter Type",
    "defaultValue": {
      "label": "Different Publish Date",
      "value": "pubDate",
      "sample": "pubDate"
    }
  }
]
```

**Perform Code**
```javascript
async function fetchRSS() {
  try {
    const scheduledMinutes = context?.inputData?.scheduledTime || 15;
    const timeAgo = new Date(__executionStartTime__ - scheduledMinutes * 60 * 1000);
    
    // If paginationData exists from a previous run, use it. Otherwise, fall back to the time window.
    const startDate = context?.paginationData ? new Date(context.paginationData) : timeAgo;

    const feedUrls = context?.inputData?.feed_url;
    if (!Array.isArray(feedUrls) || feedUrls.length === 0) {
      throw new Error("feed_url must be a non-empty array.");
    }

    const allItems = [];

    // Case-insensitive pubDate extractor
    function getPubDate(item) {
      const key = Object.keys(item || {}).find(k => k.toLowerCase() === 'pubdate');
      if (!key || !item[key]) return null;
      const date = new Date(item[key]);
      return isNaN(date.getTime()) ? null : date;
    }

    for (let url of feedUrls) {
      url = url && url.trim();
      if (!url) continue;

      const response = await axios.get(url);
      const parser = new XMLParser();
      const feedData = parser.parse(response.data);

      const channel = feedData?.rss?.channel || {};
      const { item, ...channelData } = channel;
      
      let items = channel?.item || [];
      if (!Array.isArray(items)) items = [items];

      const filteredItems = items.filter(i => {
        const pubDate = getPubDate(i);
        if (!pubDate) return false;
        
        // If paginating from a saved cursor, use strict greater-than (>) to prevent duplicates
        return context?.paginationData ? pubDate > startDate : pubDate >= startDate;
      });

      const itemsWithChannelData = filteredItems.map(i => ({
        ...i,
        channelData,
        _parsedPubDate: getPubDate(i) // Temp key for sorting
      }));

      allItems.push(...itemsWithChannelData);
    }

    // Sort chronologically (oldest first) so we process items in the correct order
    allItems.sort((a, b) => a._parsedPubDate - b._parsedPubDate);

    // Clean up temporary sorting key
    allItems.forEach(i => delete i._parsedPubDate);

    const limit = 1000;
    let results = allItems;

    // Pagination Logic: Limit to 1000 and save the cursor
    if (allItems.length > limit) {
      results = allItems.slice(0, limit);
      
      const lastItem = results[results.length - 1];
      const pubDateKey = Object.keys(lastItem).find(k => k.toLowerCase() === 'pubdate');
      
      if (pubDateKey && lastItem[pubDateKey]) {
        // Save the timestamp of the last processed item as the new pagination token
        context.paginationData = new Date(lastItem[pubDateKey]).getTime();
      }
    } else if (results.length > 0) {
      // Advance cursor to the latest item processed in this batch
      const lastItem = results[results.length - 1];
      const pubDateKey = Object.keys(lastItem).find(k => k.toLowerCase() === 'pubdate');
      if (pubDateKey && lastItem[pubDateKey]) {
        context.paginationData = new Date(lastItem[pubDateKey]).getTime();
      }
    }

    return results;

  } catch (error) {
    await errorComponent(error);
  }
}

return await fetchRSS();
```

**Sample Code (performlist)**
```javascript
async function getSampleData() {
  try {
    const feedUrls = context?.inputData?.feed_url;
    if (!Array.isArray(feedUrls) || feedUrls.length === 0) {
      throw new Error("feed_url must be a non-empty array.");
    }
    
    // Case-insensitive pubDate extractor for sorting
    function getPubDate(i) {
      const key = Object.keys(i || {}).find(k => k.toLowerCase() === 'pubdate');
      return key ? new Date(i[key]).getTime() : 0;
    }

    // Iterate through all URLs until we find one with items
    for (let url of feedUrls) {
      url = url && url.trim();
      if (!url) continue;

      try {
        const response = await axios.get(url);
        const parser = new XMLParser();
        const feedData = parser.parse(response.data);
        
        const channel = feedData?.rss?.channel || {};
        const { item, ...channelData } = channel;

        let items = channel?.item || [];
        if (!Array.isArray(items)) items = [items];
        
        // If items are found in this feed, process and return them immediately
        if (items.length > 0) {
          items.sort((a, b) => getPubDate(b) - getPubDate(a)); // Newest first

          return {
            viasocket_help: "This is the latest item found in the feed. Save the trigger and publish the flow. During the actual run, you will receive data from all feed links.",
            ...items[0],
            channelData
          };
        }
      } catch (innerError) {
        // If a specific URL fails (e.g., 404 or invalid XML), silently continue to the next URL
        continue;
      }
    }
    
    // Fallback schema (if all URLs fail or contain no items)
    return {
      viasocket_help: "This is just a sample schema. Save the trigger and publish the flow to receive new feed items.",
      title: "Sample Title of News Article",
      link: "https://example.com/sample-news-article",
      description: "This is a sample description for the news article.",
      pubDate: new Date().toISOString(),
      guid: "https://example.com/sample-news-article-123456",
      channelData: {
        title: "Sample Channel Title",
        link: "https://example.com/sample-channel-link",
        description: "This is a sample channel description.",
        language: "en-us"
      }
    };

  } catch (error) {
    await errorComponent(error);
  }
}

return await getSampleData();
```

**Transfer Code (transferoption)**
```javascript
async function transferRSSData() {
  try {
    const feedUrls = context?.inputData?.feed_url;
    if (!Array.isArray(feedUrls) || feedUrls.length === 0) {
      throw new Error("feed_url must be a non-empty array.");
    }
    
    // Extract offset for pagination (defaults to 0)
    const offset = Number(context?.inputData?.transferOption?.offset) || 0;
    const limit = 200; // viaSocket standard max for Transfer batching
    
    let allItems = [];

    // Case-insensitive pubDate extractor
    function getPubDate(item) {
      const key = Object.keys(item || {}).find(k => k.toLowerCase() === 'pubdate');
      if (!key || !item[key]) return null;
      const date = new Date(item[key]);
      return isNaN(date.getTime()) ? null : date;
    }

    for (let url of feedUrls) {
      url = url && url.trim();
      if (!url) continue;
      
      const response = await axios.get(url);
      const parser = new XMLParser();
      const feedData = parser.parse(response.data);
      
      const channel = feedData?.rss?.channel || {};
      
      // Dynamically construct channelData per your requirement
      const channelData = {};
      for (let key in channel) {
        if (channel[key] && Array.isArray(channel[key]) && key === "image") {
          channelData[key] = channel[key][0]?.url || "";
        } else if (channel[key] && typeof channel[key] !== "object") {
          channelData[key] = channel[key] || "";
        }
      }
      
      let items = channel?.item || [];
      if (!Array.isArray(items)) items = [items];
      
      const itemsWithChannelData = items.map(i => ({
        ...i,
        channelData,
        _parsedPubDate: getPubDate(i)
      })).filter(i => i._parsedPubDate !== null);
      
      allItems.push(...itemsWithChannelData);
    }
    
    // Sort oldest-first to simulate natural flow ingestion order for historical data
    allItems.sort((a, b) => a._parsedPubDate - b._parsedPubDate);
    allItems.forEach(i => delete i._parsedPubDate);
    
    // Pagination slicing
    const slicedItems = allItems.slice(offset, offset + limit);
    const nextOffset = (offset + limit < allItems.length) ? offset + limit : null;
    
    // Check for a case-insensitive guid key in the results to set uniqueIdentifier
    let guidKey = null;
    if (slicedItems.length > 0) {
      guidKey = Object.keys(slicedItems[0]).find(k => k.toLowerCase() === 'guid');
    }

    const responsePayload = {
      data: slicedItems,
      offset: nextOffset
    };

    if (guidKey) {
      responsePayload.uniqueIdentifier = guidKey;
    }

    return responsePayload;

  } catch(error) {
    await errorComponent(error);
  }
}

return await transferRSSData();
```

---

# MANUAL TRIGGER Examples

## CallHippo — Call Log Activity (Manual Trigger)

**Rationale**
- **Service:** CallHippo
- **Trigger Type:** Manual (`manual_webhook`)
- **Use Case:** Receives real-time call log events from CallHippo via a manually configured webhook URL in the CallHippo platform dashboard.
- **UX Pattern & Rules:**
  - **Single Field Limit:** The `inputFields` array for a Manual Trigger (`manual_webhook`) must only contain **one field**: a static `help` field (`type: "help"`). No other fields (strings, dropdowns, etc.) are allowed.
  - **No Auth:** Manual Triggers always use 'No Auth'; never configure `authid` or authentication headers.
  - **Mandatory Two-Part HTML Structure in `help`:** The `help` property MUST strictly follow this exact 2-part structure with standard styling (`font-family: Arial, sans-serif; line-height: 1.6;`):
    1. **`🔗 Webhook Setup Guide`**: Followed strictly by a list (`<ul>` or `<ol>`) containing clear step-by-step navigation instructions showing the user where in the external dashboard to paste the webhook URL and select the event. (Strict format: Heading -> List. No intermediate text/paragraphs).
    2. **`📤 What happens next?`**: Followed strictly by a list (`<ul>`) containing clear bullet points explaining what data CallHippo sends to the webhook upon event trigger. (Strict format: Heading -> List. No intermediate text/paragraphs).

**Input Fields JSON**
```json
[
  {
    "key": "help",
    "help": "<div style=\"font-family: Arial, sans-serif; line-height: 1.6;\">\n  <p><strong>🔗 Webhook Setup Guide</strong></p>\n\n  <ul style=\"list-style-type: disc; padding-left: 20px;\">\n    <li>Login to your <strong>CallHippo Dashboard</strong>.</li>\n    <li>From the left sidebar, go to the <strong>Integrations</strong> page.</li>\n    <li>Scroll to the bottom and open the <strong>REST API</strong> section.</li>\n    <li>Under the <strong>Webhook</strong> section, click the <strong>Connect</strong> button.</li>\n    <li>Select the <strong>Calling Activity</strong> event for the webhook.</li>\n    <li>Enter your copied <strong>Webhook URL</strong>.</li>\n    <li>Click <strong>Save</strong> to confirm.</li>\n  </ul><br> <p><strong>📤 What happens next?</strong></p>\n  <ul style=\"list-style-type: disc; padding-left: 20px;\">\n    <li>Once connected, CallHippo will automatically send all <strong>Call Logs</strong> to this webhook URL.</li>\n  </ul>\n</div>",
    "type": "help"
  }
]
```

**Perform Code**
```javascript
// Sample Data Code (performlist)
try {
  return [
    {
      viasocket_help: "To test this trigger, trigger a real call in CallHippo or use this sample data.",
      id: "call_987654321",
      call_type: "outgoing",
      from: "+14155552671",
      to: "+14155552672",
      duration: 145,
      status: "completed",
      recording_url: "https://api.callhippo.com/recordings/rec_987654321.mp3",
      timestamp: "2026-08-22T12:00:00Z"
    }
  ];
} catch (error) {
  await errorComponent(error);
}
```

---

# Dropdown Examples

Dynamic dropdown patterns for option selection, covering API capability variants like "No Search, Only Pagination", "Search + Pagination", "Search Only", and "Static / Non-Paginated".

## 1. Botse — Fetch Templates - No Search, Only Pagination

**Metadata**
- **App:** Botse (WhatsApp CRM)
- **Capability:** No Search, Only Pagination (`canPaginate: true`, `enableSearchApi: false`)
- **Field Key:** `template_name`
- **Field Type:** `dropdown`

**UX Components & Field Design**
- **`template_name` (dropdown dynamic with pagination only)** — Fetches WhatsApp message templates from the Botse Meta API (`/api/meta/{version}/{waba_id}/message_templates`).
- **Strict Output Structure:** Because `canPaginate: true` and `enableSearchApi: false`, the `optionsGenerator` strictly outputs `{ data: [...], offset: string|number|null }`.
- **Initial Zero Result vs End of Pagination Detection:**
  - **Initial empty check (`!currentOffset && templates.length === 0`):** Returns `{ data: [], offset: null, message: 'No templates found.' }`.
  - **End of pagination check (`currentOffset && templates.length === 0`):** Returns `{ data: [], offset: null, message: 'Templates Fetched Successfully' }`.
- **Metadata Enrichment:** Each option includes `extraValue` containing `isFlowTemplate`, `templateType`, and `hasVariables` to allow downstream perform code or dependent fields to adapt dynamically.
- **Custom Mapping Mode:** Fully provides `customInputLabel` ("Template Name"), `customHelp` ("Enter the template name manually. You can get the template name from the List Templates action or select it from the dropdown."), and `customPlaceholder` ("festival_notification").

**Input Field JSON**
```json
{
  "key": "template_name",
  "help": "Select the WhatsApp message template to send.",
  "type": "dropdown",
  "label": "Template",
  "required": true,
  "customHelp": "Enter the template name manually. You can get the template name from the List Templates action or select it from the dropdown.",
  "canPaginate": true,
  "placeholder": "Select Template",
  "enableSearchApi": false,
  "customInputLabel": "Template Name",
  "optionsGenerator": "try {\n  const baseUrl = \"https://crm.botse.in\";\n  if (!baseUrl) throw new Error('API URL is required in the connection.');\n\n  const limit = 100;\n  const currentOffset = context?.paginateData?.['send_button_message_text_header.template_name'] || null;\n  const params = { limit };\n  if (currentOffset) params.after = currentOffset;\n\n  const response = await axios.get(\n    `${baseUrl}/api/meta/${context.authData?.version}/${context.authData?.waba_id}/message_templates`,\n    { params }\n  );\n  const templates = response?.data?.data || [];\n\n  if (!currentOffset && templates.length === 0) {\n    return {\n      data: [],\n      offset: null,\n      message: 'No templates found.'\n    };\n  }else if (currentOffset && templates.length === 0) {\n    return {\n      data: [],\n      offset: null,\n      message: 'Templates Fetched Successfully'\n    };\n  }\n\n  const containsFlowButton = value => {\n    if (Array.isArray(value)) return value.some(containsFlowButton);\n    if (value && typeof value === 'object') {\n      if (value.type === 'FLOW') return true;\n      return Object.values(value).some(containsFlowButton);\n    }\n    return false;\n  };\n\n  const data = templates.map(template => {\n    const format = template.components?.[0]?.format || 'TEXT';\n    const componentsString = JSON.stringify(template.components || []);\n    const hasVariables = /\\{\\{\\s*[\\w.]+\\s*\\}\\}/.test(componentsString);\n    const isFlowTemplate = containsFlowButton(template.components || []);\n    const displayName = `${template.name} (${format}) (${template.category})${isFlowTemplate ? ' (FLOW)' : ''}`;\n\n    return {\n      label: displayName,\n      value: template.name,\n      extraValue: {\n        isFlowTemplate,\n        templateType: isFlowTemplate ? 'FLOW' : 'STANDARD',\n        hasVariables\n      }\n    };\n  });\n\n  return {\n    data,\n    offset: response?.data?.paging?.cursors?.after || null\n  };\n} catch (error) {\n  await errorComponent(error);\n}",
  "customPlaceholder": "festival_notification"
}
```

**UX Takeaways**
1. **Always Return Standard Object `{ data, offset }` in Paginated Dropdowns:** When `canPaginate: true` and `enableSearchApi: false`, `optionsGenerator` must output `{ data: [...], offset: string|number|null }`.
2. **Differentiate Initial Empty vs Subsequent Empty via Offset:** Check `currentOffset` against array length:
   - When `!currentOffset && length === 0`: Return `{ data: [], offset: null, message: 'No <resources> found.' }`.
   - When `currentOffset && length === 0`: Return `{ data: [], offset: null, message: '<Resources> Fetched Successfully' }`.
   Both return an empty array with `offset: null` and the appropriate context message to cleanly notify the user and end pagination.

---

# Cross-Cutting UX Patterns (Extracted)

These are the reusable moves that recur across the examples above. When designing or reviewing an action, check it against this list.

**1. Existing-vs-Inline fork.** When a payload can reference an existing record OR carry inline details (Razorpay/Xero customer, LeadSquared lead), use a boolean/dropdown selector and gate each branch's fields with `visibilityCondition`. Never show both branches at once.

**2. Field chooser → dynamic input group.** For schema-rich resources (HubSpot, Sangam CRM, OneDeck), first show a multiselect of available fields, then render typed inputs for only the chosen fields via `fieldsGenerator`. Map API types to the correct field type (boolean/number/date/dropdown/string), never dump everything as strings. Return `[{ message: "Select a … first." }]` when dependencies are missing.

**3. Mode selector reshapes the form.** For LIST/search-heavy actions (Keka, LeadSquared), a single Mode/Fetch dropdown drives the whole layout through chained `visibilityCondition`s. Keep a sensible default mode selected.

**4. Cascade dropdowns for dependent resources.** module → fields → inputs (Sangam), status → event → session (Livestorm), spreadsheet → sheet. Dependent fields stay hidden until their parent is chosen.

**5. Human units over machine units.** Days instead of UNIX timestamps (Razorpay expiry, Google Task due date), friendly date strings converted to epoch in code (Slack). The user states intent; perform code does the math/formatting.

**6. Response-shape control.** Basic / Custom / Full (LeadSquared) or a field-selection multiselect with curated defaults (Keka) keeps outputs lean while letting power users expand. Apply selection by projecting records to the chosen keys.

**7. Custom-mapping mode is mandatory on dropdown/multiselect/boolean.** Always provide `customInputLabel`, `customHelp`, and `customPlaceholder` so users can map a value from a previous step instead of only picking from the list. Placeholders should show a real sample value.

**8. Label options as `Display Name (key)`** when the human label and the API key differ, so users pick by meaning while the correct key is submitted.

**9. Generators degrade gracefully.** On missing auth/host or empty schema, return a single explanatory option (LeadSquared "Reconnect account…") rather than throwing — the form should never look broken during setup.

**10. Normalize flexible inputs in code.** ID fields may arrive as an array of `{label,value}` objects (select mode) or a comma-separated string (custom-input mode). Normalize both; also support comma-separated multi-values in a single string for quick multi-lookups (Keka, Slack).

**11. Defaults hug the common path.** Pre-select the values 90% of users want (`notification_type: none`, `isScheduledMessage: No`, curated response fields) so the simplest use case needs almost no input. But: if the API applies its own default when a field is omitted, don't set a builder `defaultValue` — let the API default win.

**12. Partial-update / payload sanitization.** For updates and multi-field creates, strip `undefined`/`null`/`""` before sending (Razorpay `JSON.parse(JSON.stringify(...))`, HubSpot skip-empty loop) to avoid accidentally clearing destination fields.

**13. Respect runtime limits.** Cap pages and records, honor 429 backoff, and bail before the ~60s execution ceiling in bulk/exhaustive modes (LeadSquared). Auto-loop pagination internally in LIST "fetch all" — never expose pagination knobs.

**14. No console.log; use errorComponent.** Production perform code has no debug logging and uses `await errorComponent(error)` in catch (except Reusable Components, which throw). Don't modify the error message.

**15. Never expose auth.** Tokens/keys/credentials are handled by viaSocket configuration and must never appear as input fields or be hardcoded in perform code.

**16. Preconfigured lists (`list: true`) in Triggers vs Comma-separated Text in Actions.**
- **In Triggers:** Dynamic data mapping from previous steps is impossible (triggers start the workflow). When a trigger requires multiple values during setup (e.g. multiple RSS Feed URLs, multiple status codes), set `list: true` (and `limit: N` if capped) on the `string` or `number` field so users can enter multiple items in the preconfigured UI list.
- **In Actions:** Data is typically dynamic (mapped from upstream trigger/action steps). Always prefer a standard text (`string`) field and instruct users in the `help`/`customHelp` text to provide comma-separated values (or an array).
- **Exception in Actions:** If a field is strictly intended for static preconfiguration during workflow design (no dynamic mapping expected), `list: true` and `limit` where applicable can be used.


---

# Perform Code Reference

Reference material for the generated API calls.



The following sections contain the complete perform code for each action documented above.

### Slack — Send Message Perform Code

```javascript
try {
  const destination = context.inputData.destination || {};
  const botDetails = context.inputData.bot_details || {};
  const preview = context.inputData.preview || {};

  const targetType = destination.messageto;
  const rawContent = context.inputData.markdown_content;

  // ---------- STRICT DATE → UNIX (YYYY-MM-DD HH:mm IST) ----------
  const toUnixTimestamp = (input) => {
    if (!input) throw new Error('post_at is required');
    const match = input.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
    if (!match) throw new Error('Invalid date format. Use YYYY-MM-DD HH:mm');
    const [, year, month, day, hour, minute] = match;
    const utcMillis = Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour) - 5,
      Number(minute) - 30,
      0
    );
    if (isNaN(utcMillis)) throw new Error('Invalid date value');
    return Math.floor(utcMillis / 1000);
  };

  // ---------- DELAY → UNIX ----------
  const toDelayTimestamp = (delayMinutes) => {
    if (!delayMinutes || isNaN(delayMinutes)) throw new Error('Delay value is required and must be a number');
    return Math.floor(Date.now() / 1000) + Number(delayMinutes) * 60;
  };

  // ---------- NORMALIZER ----------
  const normalizeIds = (input) => {
    if (!input) return [];
    if (Array.isArray(input)) {
      return input
        .flatMap((item) => {
          if (typeof item === 'string') return item.split(',');
          if (typeof item === 'object' && item?.value) return item.value.split(',');
          return [];
        })
        .map((v) => v.trim())
        .filter(Boolean);
    }
    if (typeof input === 'string') {
      return input.split(',').map((v) => v.trim()).filter(Boolean);
    }
    return [];
  };

  // ---------- CHANNEL NAME → ID RESOLVER ----------
  const isChannelId = (val) => /^[CGD][A-Z0-9]{8,}$/i.test(val);

  let channelLookupCache = null;
  const getChannelLookup = async () => {
    if (channelLookupCache) return channelLookupCache;
    const allChannels = [];
    let cursor;
    do {
      const response = await axios.get(
        'https://slack.com/api/conversations.list',
        { params: { types: 'public_channel,private_channel', exclude_archived: true, limit: 999, cursor } }
      );
      if (!response.data.ok) throw new Error(response.data.error);
      allChannels.push(...(response.data.channels || []));
      cursor = response.data.response_metadata?.next_cursor || null;
    } while (cursor);

    const map = {};
    for (const ch of allChannels) {
      if (ch.name && ch.id) map[ch.name.toLowerCase()] = ch.id;
    }
    channelLookupCache = map;
    return map;
  };

  const resolveChannels = async (inputs) => {
    const resolved = [];
    let needsLookup = inputs.some((v) => !isChannelId(v));
    let lookup = {};
    if (needsLookup) lookup = await getChannelLookup();
    for (const raw of inputs) {
      if (isChannelId(raw)) { resolved.push(raw); continue; }
      const cleaned = raw.replace(/^#/, '').trim().toLowerCase();
      const id = lookup[cleaned];
      if (!id) throw new Error(`Channel "${raw}" not found.`);
      resolved.push(id);
    }
    return resolved;
  };

  // ---------- SCHEDULE RESOLUTION ----------
  const scheduleType = context.inputData.schedule_type;
  const isScheduled = scheduleType === 'datetime' || scheduleType === 'delay';
  const performApiUrl = isScheduled
    ? 'https://slack.com/api/chat.scheduleMessage'
    : 'https://slack.com/api/chat.postMessage';

  let post_at = undefined;
  if (isScheduled) {
    if (scheduleType === 'datetime') post_at = toUnixTimestamp(context.inputData.post_at);
    else if (scheduleType === 'delay') post_at = toDelayTimestamp(context.inputData.delay_value);
  }

  const hasMarkdown = /(\*[^*]+\*|_[^_]+_|`[^`]+`|~[^~]+~|>\s|```[\s\S]*```|\[.+\]\(.+\))/.test(rawContent);

  // ---------- BUTTONS ----------
  const actions = Object.entries(context.inputData.buttons || {}).map(([key, url], index) => ({
    type: 'button',
    text: key.charAt(0).toUpperCase() + key.slice(1),
    url,
    style: index % 2 === 0 ? 'primary' : 'danger'
  }));
  const attachmentjson = actions.length
    ? [{ fallback: 'Buttons', color: '#36a64f', attachment_type: 'default', actions }]
    : undefined;

  // ---------- TAGGED USERS ----------
  const buildMentionPrefix = () => {
    const taggedRaw = normalizeIds(destination.tagged_users);
    if (!taggedRaw.length) return '';
    const mentions = taggedRaw.map((id) => id === 'channel' ? '<!channel>' : `<@${id}>`);
    return mentions.join(' ') + '\n\n';
  };
  const mentionPrefix = buildMentionPrefix();

  // ---------- BOT IDENTITY ----------
  const botName = botDetails.bot_name?.trim() || 'viaSocket';
  const defaultIconUrl = 'https://stuff.thingsofbrand.com/viasocket.com/images/imgf_logo-2.png';
  const applyBotIdentity = (data) => {
    data.username = botName;
    const iconType = botDetails.icon_type;
    if (iconType === 'emoji' && botDetails.emoji) data.icon_emoji = botDetails.emoji;
    else if (iconType === 'url') data.icon_url = botDetails.url?.trim() || defaultIconUrl;
    else data.icon_url = defaultIconUrl;
    return data;
  };

  const viaSocketMetadata = {
    event_type: 'viasocket_message',
    event_payload: { script_id: _scriptId || '' }
  };

  // ---------- SEND MESSAGE ----------
  const sendMessage = async (channel, thread_ts = undefined, reply_broadcast = undefined) => {
    const payload = applyBotIdentity({
      channel,
      text: mentionPrefix + rawContent,
      mrkdwn: hasMarkdown,
      metadata: viaSocketMetadata,
      ...(attachmentjson && { attachments: attachmentjson }),
      ...(preview.unfurl_links !== undefined && { unfurl_links: preview.unfurl_links }),
      ...(preview.unfurl_media !== undefined && { unfurl_media: preview.unfurl_media }),
      ...(post_at && { post_at }),
      ...(thread_ts && { thread_ts }),
      ...(reply_broadcast !== undefined && { reply_broadcast })
    });
    const response = await axios.post(performApiUrl, payload, {});
    if (!response.data.ok) throw new Error(response.data.error);
    return response.data;
  };

  const responses = [];

  if (targetType === 'channel') {
    const rawInputs = normalizeIds(destination.channel_id);
    if (!rawInputs.length) throw new Error('Channel is required.');
    const channels = await resolveChannels(rawInputs);
    for (const channel of channels) responses.push(await sendMessage(channel));
  } else if (targetType === 'user') {
    const users = normalizeIds(destination.userId);
    if (!users.length) throw new Error('User is required.');
    for (const user of users) {
      const payload = applyBotIdentity({
        channel: user, text: rawContent, mrkdwn: hasMarkdown, metadata: viaSocketMetadata,
        ...(attachmentjson && { attachments: attachmentjson }),
        ...(preview.unfurl_links !== undefined && { unfurl_links: preview.unfurl_links }),
        ...(preview.unfurl_media !== undefined && { unfurl_media: preview.unfurl_media }),
        ...(post_at && { post_at })
      });
      const response = await axios.post(performApiUrl, payload, {});
      if (!response.data.ok) throw new Error(response.data.error);
      responses.push(response.data);
    }
  } else if (targetType === 'thread') {
    let channel = destination.thread_channel_id;
    const thread_ts = destination.thread_ts;
    const reply_broadcast = destination.reply_broadcast || false;
    if (!channel) throw new Error('Channel is required.');
    if (!thread_ts) throw new Error('Thread message is required.');
    if (!isChannelId(channel)) {
      const [resolvedId] = await resolveChannels([channel]);
      channel = resolvedId;
    }
    responses.push(await sendMessage(channel, thread_ts, reply_broadcast));
  } else {
    return { ok: false, error: 'invalid_target_type' };
  }

  return responses.length === 1 ? responses[0] : responses;
} catch (error) {
  if (error?.response?.status === 429) throw { success: false, status: 429, message: 'Too Many Requests' };
  throw error;
}
```

### Google Sheet — Add New Row Perform Code

```javascript
async function addRowToSheet() {
    try {
        const axiosRetry = async (fn, retries = 3, delay = 3000) => {
            let attempt = 0;
            while (attempt < retries) {
                try { return await fn(); }
                catch (error) {
                    if (error?.response?.status >= 500 && error?.response?.status < 600) {
                        attempt++;
                        if (attempt < retries) { await new Promise(resolve => setTimeout(resolve, delay)); delay *= 2; }
                        else { throw new Error(`Max retries reached. Last error: ${error?.response?.data?.error?.message || error.message}`); }
                    } else { throw error; }
                }
            }
        };

        if (!context.inputData.spreadsheet_Id) throw new Error('Spreadsheet is required.');
        if (!context.inputData.grid_Id) throw new Error('Sheet is required.');
        if (!context.inputData.column_selected || context.inputData.column_selected.length === 0) throw new Error('Please select at least one column.');
        if (!context.inputData.column_name) throw new Error('Column values are required.');

        const spreadsheetId = context.inputData.spreadsheet_Id;
        const sheetIdentifier = context.inputData.grid_Id;
        const column_key = context?.inputData?.column_key ?? true;
        const columnNameData = context.inputData.column_name || {};
        const selectedColumns = context.inputData.column_selected || [];

        function getColumnLetter(index) {
            let letter = '';
            while (index >= 0) { letter = String.fromCharCode((index % 26) + 65) + letter; index = Math.floor(index / 26) - 1; }
            return letter;
        }
        function columnLetterToIndex(letter) {
            let index = 0;
            const upper = letter.trim().toUpperCase();
            for (let i = 0; i < upper.length; i++) index = index * 26 + (upper.charCodeAt(i) - 64);
            return index - 1;
        }
        function normalizeForComparison(text) {
            if (!text) return '';
            return text.toString().trim().replace(/\./g, '_');
        }

        const hasAtLeastOneValue = Object.values(columnNameData).some(v => v !== null && v !== undefined && String(v).trim() !== "");
        if (!hasAtLeastOneValue) throw { success: false, message: "Empty row cannot be created." };

        const isNumericId = /^\d+$/.test(String(sheetIdentifier));
        let dataFilter = {};
        if (isNumericId) {
            dataFilter = { gridRange: { sheetId: parseInt(sheetIdentifier, 10), startRowIndex: 0, endRowIndex: 1 } };
        } else {
            const safeStringName = decodeURIComponent(sheetIdentifier).replace(/'/g, "''");
            dataFilter = { a1Range: `'${safeStringName}'!1:1` };
        }

        const filterResponse = await axiosRetry(() => axios({
            method: 'POST',
            url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGetByDataFilter`,
            data: { dataFilters: [dataFilter] }
        }));

        const valueRangeData = filterResponse.data?.valueRanges?.[0]?.valueRange;
        if (!valueRangeData || !valueRangeData.range) throw new Error(`Sheet "${sheetIdentifier}" not found.`);

        const rangeString = valueRangeData.range;
        let rawSheetName = rangeString.substring(0, rangeString.lastIndexOf('!'));
        if (rawSheetName.startsWith("'") && rawSheetName.endsWith("'")) rawSheetName = rawSheetName.slice(1, -1);
        rawSheetName = rawSheetName.replace(/''/g, "'");
        const headerRow = valueRangeData.values?.[0] || [];

        let headerToIndexMap = {};
        if (column_key) {
            const cleanedHeaders = headerRow.map(cell => cell ? cell.toString().replace(/\s+/g, ' ').trim() : "");
            const headerCounts = {};
            cleanedHeaders.forEach(name => { if (name) headerCounts[name] = (headerCounts[name] || 0) + 1; });
            cleanedHeaders.forEach((cleanHeader, i) => {
                if (!cleanHeader) return;
                const columnLetter = getColumnLetter(i);
                let finalValue = cleanHeader;
                if (headerCounts[cleanHeader] > 1) finalValue = `${cleanHeader}--${columnLetter}`;
                headerToIndexMap[normalizeForComparison(finalValue)] = i;
            });
        }

        let maxColIndex = -1;
        const rowData = [];
        const outputData = {};

        selectedColumns.forEach(selectedKey => {
            const normalizedInputKey = normalizeForComparison(selectedKey);
            const value = columnNameData[normalizedInputKey] ?? "";
            let colIndex = -1;
            if (!column_key) colIndex = columnLetterToIndex(selectedKey);
            else {
                if (headerToIndexMap[normalizedInputKey] !== undefined) colIndex = headerToIndexMap[normalizedInputKey];
                else if (selectedKey.includes('--')) colIndex = columnLetterToIndex(selectedKey.split('--')[1]);
            }
            const finalValue = (value !== "" && !isNaN(value)) ? parseFloat(value) : value.toString().trim();
            if (colIndex >= 0) { rowData[colIndex] = finalValue; if (colIndex > maxColIndex) maxColIndex = colIndex; }
            outputData[selectedKey] = finalValue;
        });

        for (let i = 0; i <= maxColIndex; i++) { if (rowData[i] === undefined) rowData[i] = ""; }

        const appendResponse = await axiosRetry(() => axios({
            method: 'POST',
            url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(rawSheetName)}'!A1:append`,
            params: { valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS' },
            data: { majorDimension: "ROWS", values: [rowData] }
        }));

        let insertRowNumber = "unknown";
        const updatedRangeString = appendResponse.data.updates?.updatedRange || "";
        const match = updatedRangeString.match(/!([A-Z]+)(\d+)/);
        if (match && match[2]) insertRowNumber = parseInt(match[2], 10);

        outputData["_rowNumber"] = insertRowNumber;
        outputData["_spreadsheet_id"] = spreadsheetId;
        outputData["_sheet_id"] = sheetIdentifier;
        outputData["_sheet_title"] = rawSheetName;

        return { success: true, data: outputData };
    } catch (error) {
        await errorComponent(error);
    }
}
return await addRowToSheet();
```

### MSG91 — Send WhatsApp Template Perform Code

```javascript
try {
  const { integrated_number, name, to, components = {} } = context.inputData;

  if (!to || (typeof to === 'string' && to.trim() === '') || (Array.isArray(to) && to.length === 0)) {
    const err = new Error('Phone number is required.');
    err.status = 400;
    throw err;
  }

  const fetchTemplateDetails = async (number, templateName) => {
    const res = await axios.get(`https://control.msg91.com/api/v5/whatsapp/get-template-client/${number}`);
    const templates = res.data?.data || [];
    const found = templates.find(t => t.name === templateName);
    return {
      namespace: found?.namespace,
      languageCode: found?.languages?.[0]?.language || 'en',
      variableType: found?.languages?.[0]?.variable_type || {}
    };
  };

  const { namespace, languageCode, variableType } = await fetchTemplateDetails(integrated_number, name);

  const normalizeRecipients = (rawTo) => {
    if (!rawTo && rawTo !== 0) return [];
    if (Array.isArray(rawTo)) return rawTo.flatMap(item => String(item).split(',').map(s => s.trim()).filter(Boolean));
    return String(rawTo).split(',').map(s => s.trim()).filter(Boolean);
  };
  const toArray = normalizeRecipients(to);
  if (toArray.length === 0) { const err = new Error('Phone number is required.'); err.status = 400; throw err; }

  const componentObj = {};
  if (components && typeof components === 'object' && Object.keys(components).length > 0) {
    for (const [key, rawValue] of Object.entries(components)) {
      if (key.endsWith('_filename')) continue;
      const info = variableType?.[key] || {};
      const type = info.type || (rawValue && typeof rawValue === 'object' ? rawValue.type : undefined) || 'text';
      const subtype = info.subtype || (rawValue && typeof rawValue === 'object' ? rawValue.subtype : undefined);
      let value = rawValue;
      let detectedSubtype = subtype;
      let filename;
      if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
        if ('value' in rawValue) value = rawValue.value;
        if ('subtype' in rawValue) detectedSubtype = rawValue.subtype;
        if ('filename' in rawValue) filename = rawValue.filename;
      }
      const finalValue = (value === undefined || value === null) ? '' : value;
      const finalType = type || 'text';
      if (finalType === 'document') {
        const resolvedFilename = filename || components[`${key}_filename`] || (typeof finalValue === 'string' && finalValue ? finalValue.split('/').pop().split('?')[0] || 'document' : 'document');
        componentObj[key] = { type: finalType, ...(detectedSubtype ? { subtype: detectedSubtype } : {}), filename: resolvedFilename, value: finalValue };
      } else {
        componentObj[key] = { type: finalType, ...(detectedSubtype ? { subtype: detectedSubtype } : {}), value: finalValue };
      }
    }
  }

  const data = {
    integrated_number,
    content_type: 'template',
    payload: {
      messaging_product: 'whatsapp',
      type: 'template',
      template: {
        name,
        language: { code: languageCode, policy: 'deterministic' },
        namespace,
        to_and_components: [{ to: toArray, components: Object.keys(componentObj).length > 0 ? componentObj : {} }]
      }
    }
  };

  const response = await axios.post('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', data);
  return { status: response.data.status, hasError: response.data.hasError, request_id: response.data.request_id, data: response.data.data, errors: response.data.errors };
} catch (error) {
  await errorComponent(error);
}
```

### Leadconnector — Create Or Update Contact Perform Code

```javascript
try {
  const data = context.inputData;

  let config1 = {
    method: 'get', maxBodyLength: Infinity,
    url: `https://services.leadconnectorhq.com/locations/${context?.authData?.accesstokencode?.locationId}`,
    headers: { 'Accept': 'application/json', 'Version': '2021-07-28' }
  };
  const res = await axios.request(config1);

  const val = (field) => typeof field === 'object' && field !== null ? field.value : field;
  const isSelected = (key) => Array.isArray(data.selected_fields) && data.selected_fields.some(f => (typeof f === 'object' ? f.value : f) === key);

  const locationId = res.data.location.id;
  if (!locationId) throw new Error('Location ID is missing.');

  const lookupBy = val(data.lookup_by);
  const email = data.email_required || data.email_optional;
  const phone = data.phone_required || data.phone_optional;

  if (lookupBy === 'email' && !email) throw new Error('Email is required when "Find Contact By" is set to Email.');
  if (lookupBy === 'phone' && !phone) throw new Error('Phone is required when "Find Contact By" is set to Phone.');
  if (lookupBy === 'both' && !email && !phone) throw new Error('At least Email or Phone is required.');

  const payload = { locationId };
  if (lookupBy === 'email') { payload.email = email; if (phone) payload.phone = phone; }
  else if (lookupBy === 'phone') { payload.phone = phone; if (email) payload.email = email; }
  else { if (email) payload.email = email; if (phone) payload.phone = phone; }

  if (isSelected('firstName') && data.firstName) payload.firstName = data.firstName;
  if (isSelected('lastName') && data.lastName) payload.lastName = data.lastName;
  if (isSelected('gender') && data.gender) payload.gender = val(data.gender);
  if (isSelected('dateOfBirth') && data.dateOfBirth) payload.dateOfBirth = data.dateOfBirth;
  if (isSelected('companyName') && data.companyName) payload.companyName = data.companyName;
  if (isSelected('website') && data.website) payload.website = data.website;
  if (isSelected('timezone') && data.timezone) payload.timezone = data.timezone;
  if (isSelected('source') && data.source) payload.source = data.source;

  if (isSelected('assignedTo')) {
    const assignedMethod = val(data.assignedTo_method);
    if (assignedMethod === 'id' && data.assignedTo_id) payload.assignedTo = data.assignedTo_id;
    else if (assignedMethod === 'email' && data.assignedTo_email) {
      const usersResp = await axios.get(`https://services.leadconnectorhq.com/users/?locationId=${locationId}`, { headers: { 'Version': '2021-07-28', 'Accept': 'application/json' } });
      const matchedUser = (usersResp.data?.users || []).find(u => u.email?.toLowerCase() === data.assignedTo_email.toLowerCase());
      if (!matchedUser) throw new Error(`No user found with email: ${data.assignedTo_email}`);
      payload.assignedTo = matchedUser.id;
    }
  }

  if (isSelected('address') && data.address) {
    if (data.address.address1) payload.address1 = data.address.address1;
    if (data.address.city) payload.city = data.address.city;
    if (data.address.state) payload.state = data.address.state;
    if (data.address.postalCode) payload.postalCode = data.address.postalCode;
    if (data.address.country) payload.country = data.address.country;
  }

  if (isSelected('tags') && data.tags && data.tags.trim()) {
    payload.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  if (isSelected('dnd') && data.enable_dnd === true) {
    payload.dnd = true;
    payload.dndSettings = context?.inputData?.dndSettings;
    payload.inboundDndSettings = context?.inputData?.inboundDndSettings;
  }

  if (isSelected('customFields') && data.customFields && typeof data.customFields === 'object') {
    const cfArray = Object.entries(data.customFields)
      .filter(([key, value]) => key && value !== undefined && value !== '')
      .map(([key, value]) => ({ id: key, field_value: value }));
    if (cfArray.length > 0) payload.customFields = cfArray;
  }

  if (data.override_duplicate_behavior === true) {
    payload.createNewIfDuplicateAllowed = val(data.createNewIfDuplicateAllowed) ?? false;
  }

  const response = await axios.post('https://services.leadconnectorhq.com/contacts/upsert', payload, {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Version': '2021-07-28' }
  });
  return response.data;
} catch (error) {
  throw error;
}
```

### Gmail — Send Email Perform Code

```javascript
const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024;

function encodeMessage(raw) {
  return Buffer.from(raw).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function encodeSubjectForMIME(subject) {
  return `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;
}
function detectContentType(body) {
  return /<\/?[a-z][\s\S]*>/i.test(body || '') ? 'text/html' : 'text/plain';
}

async function sendAttachment() {
  const requestData = context.inputData;
  let fromEmail = requestData.from;
  if (!fromEmail) {
    const sendAsRes = await axios.get('https://www.googleapis.com/gmail/v1/users/me/settings/sendAs');
    const defaultSendAs = sendAsRes.data.sendAs.find(item => item.isDefault);
    fromEmail = defaultSendAs?.sendAsEmail;
  }
  const fromHeader = requestData.fromName ? `${requestData.fromName} <${fromEmail}>` : fromEmail;

  try {
    const boundary = "__file_boundary__";
    const encodedSubject = encodeSubjectForMIME(requestData.subject || '');
    const messageBody = requestData.messageBody || '';
    const contentType = detectContentType(messageBody);

    let messageParts = [
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "MIME-Version: 1.0",
      `To: ${requestData.to}`,
      ...(requestData.cc ? [`Cc: ${requestData.cc}`] : []),
      ...(requestData.bcc && requestData.bcc.trim() ? [`Bcc: ${requestData.bcc}`] : []),
      `From: ${fromHeader}`,
      ...(requestData.replyTo ? [`Reply-To: ${requestData.replyTo}`] : []),
      `Subject: ${encodedSubject}`,
      "",
      `--${boundary}`,
      `Content-Type: ${contentType}; charset="UTF-8"`,
      "",
      messageBody,
      ""
    ];

    // Attachment handling (URLs → download → base64 encode → MIME parts)
    if (requestData.attachments) {
      const urls = requestData.attachments.split(",").map(u => u.trim()).filter(Boolean);
      let totalAttachmentSize = 0;
      for (const url of urls) {
        // Download file (supports Google Drive and regular URLs)
        const res = await axios.get(url, { responseType: "arraybuffer" });
        const buffer = Buffer.from(res.data);
        totalAttachmentSize += buffer.length;
        if (totalAttachmentSize > MAX_TOTAL_ATTACHMENT_SIZE_BYTES) throw new Error('Total attachment size exceeds 25 MB limit.');
        const filename = url.split("/").pop().split("?")[0] || "file";
        const mimeType = res.headers["content-type"] || "application/octet-stream";
        const base64Data = buffer.toString("base64");
        messageParts.push(
          `--${boundary}`,
          `Content-Type: ${mimeType}; name="${filename}"`,
          `Content-Disposition: attachment; filename="${filename}"`,
          `Content-Transfer-Encoding: base64`,
          "", base64Data, ""
        );
      }
    }

    messageParts.push(`--${boundary}--`);
    const raw = encodeMessage(messageParts.join("\r\n"));

    const response = await axios.post("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", { raw }, { headers: {} });

    if (Array.isArray(requestData.labelIds) && requestData.labelIds.length > 0) {
      const modifyRes = await axios.post(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${response.data.id}/modify`,
        { addLabelIds: requestData.labelIds }, { headers: {} }
      );
      return modifyRes.data;
    }
    return response.data;
  } catch (err) {
    if (err.response?.status === 400) {
      const errorMessage = err.response?.data?.error?.message || "";
      if (["Invalid To header", "Invalid Cc header", "Invalid Bcc header"].includes(errorMessage)) {
        throw new Error("Please enter a valid email address.");
      }
    }
    await errorComponent(err);
  }
}
return await sendAttachment();
```

### viaSocket Table — Add Records To Table Perform Code

```javascript
try {
  const inputData = context.inputData;
  const isBulkAdd = !!inputData.bulkAdd;

  if (isBulkAdd) {
    // ==================== BULK ADD LOGIC ====================
    let records;
    try {
      records = typeof inputData.records === 'string'
        ? JSON.parse(inputData.records)
        : inputData.records;
    } catch (error) {
      return { message: 'Please provide a valid JSON array. Example: [{"Name":"John"},{"Name":"Jane"}]' };
    }

    if (!Array.isArray(records) || records.length === 0 ||
        !records.every(item => item && typeof item === 'object' && !Array.isArray(item))) {
      return { message: 'Records must be a non-empty array of objects.' };
    }

    // ==================== FETCH SCHEMA — identify attachment column IDs ====================
    const schemaResponse = await axios.get(
      `https://table-api.viasocket.com/dbs/${context.authData.dbId}/${inputData.table}/field`
    );
    const tableFields = schemaResponse.data?.data?.fields || {};
    const attachmentColumnIds = new Set(
      Object.entries(tableFields)
        .filter(([_, f]) => f.fieldType === 'attachment')
        .map(([id, _]) => id)
    );

    const allCreatedRecords = [];
    const embeddedUploadResults = {};

    for (const record of records) {

      const cleanRecord = {};
      const recordAttachments = {};

      for (const [key, value] of Object.entries(record)) {
        if (attachmentColumnIds.has(key)) {
          const values = Array.isArray(value) ? value : (value ? [value] : []);
          if (values.length > 0) recordAttachments[key] = values;
        } else {
          if (value !== undefined && value !== null && value !== '') {
            cleanRecord[key] = value;
          }
        }
      }

      const createResponse = await axios.request({
        method: 'post',
        maxBodyLength: Infinity,
        url: `https://table-api.viasocket.com/${context.authData.dbId}/${inputData.table}`,
        headers: { 'Content-Type': 'application/json' },
        data: {
          addMissingOptions: inputData.addMissingOptions,
          records: [cleanRecord]
        }
      });

      const createdRecord = createResponse.data?.data?.[0];
      if (createdRecord) allCreatedRecords.push(createdRecord);

      const autonumber = createdRecord?.autonumber;
      if (!autonumber || Object.keys(recordAttachments).length === 0) continue;

      embeddedUploadResults[autonumber] = {};

      for (const columnId in recordAttachments) {
        const values = recordAttachments[columnId];
        embeddedUploadResults[autonumber][columnId] = [];

        for (const value of values) {
          if (!value) continue;

          let formData = new FormData();
          formData.append("columnId", columnId);

          const isUrl = typeof value === 'string' &&
                        (value.startsWith('http://') || value.startsWith('https://'));

          if (isUrl) {
            let fileUrl = value;
            if (fileUrl.includes("drive.google.com")) {
              const match = fileUrl.match(/\/d\/(.*?)\//);
              if (match && match[1]) {
                fileUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
              }
            }
            const fileResponse = await axios({
              method: "get",
              url: fileUrl,
              responseType: "arraybuffer",
              maxContentLength: Infinity,
              maxBodyLength: Infinity
            });
            const mimeType = fileResponse.headers["content-type"] || "application/octet-stream";
            const ext = mimeTypeToExt(mimeType);
            formData.append("file", fileResponse.data, {
              filename: `upload.${ext}`,
              contentType: mimeType
            });
          } else {
            let mimeType = "application/octet-stream";
            let base64Data = value;

            if (value.includes("base64,")) {
              const parts = value.split(",");
              base64Data = parts[1];
              const match = value.match(/^data:(.*);base64,/);
              if (match && match[1]) mimeType = match[1];
            } else {
              mimeType = detectMimeFromBase64(value);
              base64Data = value;
            }

            base64Data = base64Data.replace(/\s/g, "");
            const buffer = Buffer.from(base64Data, "base64");
            const ext = mimeTypeToExt(mimeType);
            formData.append("file", buffer, {
              filename: `upload.${ext}`,
              contentType: mimeType
            });
          }

          const uploadResponse = await axios({
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://table-api.viasocket.com/${context.authData.dbId}/${inputData.table}/${autonumber}/upload`,
            headers: { ...formData.getHeaders() },
            data: formData
          });

          embeddedUploadResults[autonumber][columnId].push(uploadResponse.data);
        }
      }
    }

    // ==================== ATTACHMENT_CONFIG SUPPORT ====================
    const uploadResults = {};
    if (inputData.attachment_config?.uploadType) {
      const uploadType = inputData.attachment_config?.uploadType;
      const attachmentFields = inputData.attachment_config?.attachmentFields || {};

      if (!["link", "binary"].includes(uploadType)) {
        return { message: "Invalid upload type." };
      }

      for (let i = 0; i < allCreatedRecords.length; i++) {
        const autonumber = allCreatedRecords[i]?.autonumber || (i + 1000);
        uploadResults[autonumber] = {};

        for (const columnId in attachmentFields) {
          let values = attachmentFields[columnId];
          if (!values) continue;
          if (!Array.isArray(values)) values = [values];

          uploadResults[autonumber][columnId] = [];

          for (const value of values) {
            if (!value) continue;

            let formData = new FormData();
            formData.append("columnId", columnId);

            if (uploadType === "link") {
              let fileUrl = value;
              if (fileUrl.includes("drive.google.com")) {
                const match = fileUrl.match(/\/d\/(.*?)\//);
                if (match && match[1]) {
                  fileUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
                }
              }
              const fileResponse = await axios({
                method: "get",
                url: fileUrl,
                responseType: "arraybuffer",
                maxContentLength: Infinity,
                maxBodyLength: Infinity
              });
              const mimeType = fileResponse.headers["content-type"] || "application/octet-stream";
              const ext = mimeTypeToExt(mimeType);
              formData.append("file", fileResponse.data, {
                filename: `upload.${ext}`,
                contentType: mimeType
              });
            } else {
              let mimeType = "application/octet-stream";
              let base64Data = value;

              if (value.includes("base64,")) {
                const parts = value.split(",");
                base64Data = parts[1];
                const match = value.match(/^data:(.*);base64,/);
                if (match && match[1]) mimeType = match[1];
              } else {
                mimeType = detectMimeFromBase64(value);
                base64Data = value;
              }

              base64Data = base64Data.replace(/\s/g, "");
              const buffer = Buffer.from(base64Data, "base64");
              const ext = mimeTypeToExt(mimeType);

              formData.append("file", buffer, {
                filename: `upload.${ext}`,
                contentType: mimeType
              });
            }

            const uploadResponse = await axios({
              method: 'post',
              maxBodyLength: Infinity,
              url: `https://table-api.viasocket.com/${context.authData.dbId}/${inputData.table}/${autonumber}/upload`,
              headers: { ...formData.getHeaders() },
              data: formData
            });

            uploadResults[autonumber][columnId].push(uploadResponse.data);
          }
        }
      }
    }

    return {
      message: `Successfully inserted ${records.length} record${records.length > 1 ? 's' : ''}.`
    };

  } else {
    // ==================== SINGLE INSERT LOGIC ====================
    context.inputData.field = transformObject(context.inputData.field);
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `https://table-api.viasocket.com/${context.authData.dbId}/${context.inputData.table}`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        addMissingOptions: context.inputData.addMissingOptions,
        records: [{ ...context.inputData.field }]
      }
    };
    const createResponse = await axios.request(config);
    const createdRecord = createResponse.data?.data?.[0];
    const autonumber = createdRecord?.autonumber;
    const uploadResults = {};
    if (context.inputData.attachment_config?.uploadType) {
      const uploadType = context.inputData.attachment_config?.uploadType;
      const attachmentFields = context.inputData.attachment_config?.attachmentFields || {};
      if (!["link", "binary"].includes(uploadType)) {
        return { message: "Invalid upload type." };
      }
      for (const columnId in attachmentFields) {
        const value = attachmentFields[columnId];
        if (!value) continue;
        let formData = new FormData();
        formData.append("columnId", columnId);
        if (uploadType === "link") {
          let fileUrl = value;
          if (fileUrl.includes("drive.google.com")) {
            const match = fileUrl.match(/\/d\/(.*?)\//);
            if (match && match[1]) {
              fileUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
            }
          }
          const fileResponse = await axios({
            method: "get",
            url: fileUrl,
            responseType: "arraybuffer",
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          });
          const mimeType = fileResponse.headers["content-type"] || "application/octet-stream";
          const ext = mimeTypeToExt(mimeType);
          formData.append("file", fileResponse.data, {
            filename: `upload.${ext}`,
            contentType: mimeType
          });
        } else {
          let mimeType = "application/octet-stream";
          let base64Data = value;
          if (value.includes("base64,")) {
            const parts = value.split(",");
            base64Data = parts[1];
            const match = value.match(/^data:(.*);base64,/);
            if (match && match[1]) mimeType = match[1];
          } else {
            mimeType = detectMimeFromBase64(value);
            base64Data = value;
          }
          base64Data = base64Data.replace(/\s/g, "");
          const buffer = Buffer.from(base64Data, "base64");
          const ext = mimeTypeToExt(mimeType);
          formData.append("file", buffer, {
            filename: `upload.${ext}`,
            contentType: mimeType
          });
        }
        const uploadResponse = await axios({
          method: 'post',
          maxBodyLength: Infinity,
          url: `https://table-api.viasocket.com/${context.authData.dbId}/${context.inputData.table}/${autonumber}/upload`,
          headers: {
            ...formData.getHeaders()
          },
          data: formData
        });
        uploadResults[columnId] = uploadResponse.data;
      }
    }
    const filteredRecord = Object.fromEntries(
      Object.entries(createdRecord || {}).filter(([_, v]) => v !== null && v !== undefined)
    );

    const inlineAttachments = {};
    for (const columnId in uploadResults) {
      inlineAttachments[columnId] = uploadResults[columnId]?.data || uploadResults[columnId];
    }

    return {
      ...filteredRecord,
      ...inlineAttachments
    };
  }


function detectMimeFromBase64(base64String) {
  const s = base64String.replace(/\s/g, '');

  if (s.startsWith('/9j/'))           return 'image/jpeg';
  if (s.startsWith('iVBOR'))          return 'image/png';
  if (s.startsWith('R0lGOD'))         return 'image/gif';
  if (s.startsWith('Qk0'))            return 'image/bmp';
  if (s.startsWith('SUkq') ||
      s.startsWith('TU0A'))           return 'image/tiff';
  if (s.startsWith('UklGR') &&
      s.includes('V0VCUA'))           return 'image/webp';
  if (s.startsWith('PHN2Z') ||
      s.startsWith('PHN2Zy'))         return 'image/svg+xml';
  if (s.startsWith('JVBERi0'))        return 'application/pdf';
  if (s.startsWith('0M8R4KGxGuE'))    return 'application/msword';
  if (s.startsWith('UEsDB'))          return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (s.startsWith('UEsD'))           return 'application/zip';
  if (s.startsWith('H4sI') ||
      s.startsWith('H4sIA'))          return 'application/gzip';
  if (s.startsWith('AAAB') ||
      s.startsWith('AAIC'))           return 'audio/mpeg';
  if (s.startsWith('T2dn'))           return 'audio/ogg';

  return 'application/octet-stream';
}

function mimeTypeToExt(mimeType) {
  const map = {
    'image/jpeg':        'jpg',
    'image/png':         'png',
    'image/gif':         'gif',
    'image/bmp':         'bmp',
    'image/tiff':        'tiff',
    'image/webp':        'webp',
    'image/svg+xml':     'svg',
    'application/pdf':   'pdf',
    'application/zip':   'zip',
    'application/gzip':  'gz',
    'application/msword':'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':       'xlsx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':'pptx',
    'audio/mpeg':        'mp3',
    'audio/ogg':         'ogg',
    'video/mp4':         'mp4',
    'text/plain':        'txt',
    'text/html':         'html',
    'text/csv':          'csv',
  };
  return map[mimeType] || mimeType.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'bin';
}

function transformObject(oldObject) {
  const newObject = {};
  for (const key in oldObject) {
    const parts = key.split('@');
    const type = parts.pop();
    const newKey = parts.join('@');
    let value = oldObject[key];
    if (type === 'multipleselect') {
      newObject[newKey] = Array.isArray(value) ? value : [value];
      continue;
    }
    if (type === 'checkbox') {
      newObject[newKey] = value === true;
      continue;
    }
    if (type === 'json') {
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          return { message: `Invalid JSON for ${newKey}` };
        }
      }
      newObject[newKey] = value;
      continue;
    }
    if ((type === 'date' || type === 'datetime') && typeof value === 'string') {
      const p = value.split('-');
      if (p.length === 3) {
        const [dd, mm, yyyy] = p;
        value = `${yyyy}-${mm}-${dd}`;
      }
      newObject[newKey] = value;
      continue;
    }
    newObject[newKey] = value === undefined || value === null ? "" : String(value);
  }
  return newObject;
}
  } catch (error) {
  throw await errorComponent(error)
}
```

### viaSocket Table — Get Table Rows Perform Code

```javascript
async function getTableRows() {
  try {
    const filterMode = context?.inputData?.filter_mode;
    const dbId = context?.authData?.dbId;
    const table = context?.inputData?.table;

    if (!table) throw new Error('Table is required.');
    if (!dbId) throw new Error('Database ID is missing from authentication.');

    function handleNoData(dataBlock) {
      if (
        !dataBlock ||
        (Array.isArray(dataBlock) && dataBlock.length === 0) ||
        (typeof dataBlock === 'object' && Array.isArray(dataBlock.rows) && dataBlock.rows.length === 0)
      ) {
        return { message: "No data found for the given search." };
      }
      return Array.isArray(dataBlock.rows) ? dataBlock.rows : dataBlock;
    }

    async function fetchFieldData() {
      const random = Math.floor(Math.random() * 1000000);
      const URL = `https://table-api.viasocket.com/dbs/${dbId}/${table}/field?random=${random}`;
      const response = await axios.get(URL);
      const fields = response?.data?.data?.fields || {};
      const mapping = {};
      const types = {};
      for (let key in fields) {
        if (fields[key]?.fieldName) {
          mapping[fields[key].fieldName.toLowerCase()] = key;
          types[fields[key].fieldName.toLowerCase()] = (fields[key].fieldType || '').toLowerCase();
        }
      }
      return { mapping, types };
    }

    async function buildQueryParams(existingFieldMapping) {
      const extra = context?.inputData?.queryopt || {};
      const params = [];

      const limit = extra.limit || '200';
      params.push(`limit=${limit}`);

      if (extra.offset) {
        params.push(`offset=${extra.offset}`);
      }

      if (
        extra.Show_fields &&
        Array.isArray(extra.Show_fields) &&
        extra.Show_fields.length > 0
      ) {
        params.push(`fields=${extra.Show_fields.join(',')}`);
      }

      if (extra.sortby) {
        const fieldMapping = existingFieldMapping || (await fetchFieldData()).mapping;
        const actualSortby = fieldMapping[extra.sortby.toLowerCase()] || extra.sortby;
        const order = (extra.ascdesc || 'asc').toLowerCase();
        let sortParam = actualSortby;
        if (order === 'desc') {
          sortParam += ' desc';
        }
        params.push(`sort=${encodeURIComponent(sortParam)}`);
      }

      const random = Math.floor(Math.random() * 1000000);
      params.push(`random=${random}`);

      return params.length ? params.join('&') : '';
    }

    function normalizeDate(value) {
      if (!value) return value;
      if (value.includes('T') && value.includes('Z')) return value;
      if (value.includes('T')) {
        return value.endsWith('Z') ? value : value + 'Z';
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return `${value}T00:00:00Z`;
      }
      return value;
    }

    function handleDateOperators(field, operator, value, actualField) {
      const fieldLower = field.toLowerCase();
      const isDateField = ['createdat', 'updatedat'].includes(fieldLower);
      if (!isDateField) return null;

      const normalized = normalizeDate(value);
      if (!normalized) return null;

      const dateOnly = normalized.split('T')[0];
      const startISO = `${dateOnly}T00:00:00Z`;
      const nextDayISO = new Date(
        new Date(startISO).getTime() + 86400000
      ).toISOString();

      if (fieldLower === 'updatedat') {
        const startUnix = Math.floor(new Date(startISO).getTime() / 1000);
        const endUnix = Math.floor(new Date(nextDayISO).getTime() / 1000);

        switch (operator) {
          case '=':
            return [`${actualField} >= ${startUnix} AND ${actualField} < ${endUnix}`];
          case '<=':
            return [`${actualField} < ${endUnix}`];
          case '<':
            return [`${actualField} < ${startUnix}`];
          case '>=':
            return [`${actualField} >= ${startUnix}`];
          case '>':
            return [`${actualField} >= ${endUnix}`];
          case '!=':
            return [`${actualField} < ${startUnix} OR ${actualField} >= ${endUnix}`];
          default:
            return [`${actualField} >= ${startUnix} AND ${actualField} < ${endUnix}`];
        }
      } else {
        switch (operator) {
          case '=':
            return [`${actualField} >= '${startISO}'`, `${actualField} < '${nextDayISO}'`];
          case '<=':
            return [`${actualField} < '${nextDayISO}'`];
          case '<':
            return [`${actualField} < '${startISO}'`];
          case '>=':
            return [`${actualField} >= '${startISO}'`];
          case '>':
            return [`${actualField} >= '${nextDayISO}'`];
          case '!=':
            return [`${actualField} < '${startISO}' OR ${actualField} >= '${nextDayISO}'`];
          default:
            return [`${actualField} >= '${startISO}'`, `${actualField} < '${nextDayISO}'`];
        }
      }
    }

    function formatNonDateValue(rawValue, actualField, operator, fieldType) {
      const type = (fieldType || '').toLowerCase();
      if (['number', 'autonumber', 'numeric', 'int', 'bigint'].includes(type) || typeof rawValue === 'number') {
        return `${actualField}${operator}${rawValue}`;
      }
      if (['checkbox', 'boolean'].includes(type) || typeof rawValue === 'boolean') {
        return `${actualField}${operator}${rawValue}`;
      }
      return `${actualField}${operator}'${rawValue}'`;
    }

    if (filterMode === 'list_all') {
      const query = await buildQueryParams();
      const url = `https://table-api.viasocket.com/${dbId}/${table}${query ? '?' + query : ''}`;
      const response = await axios.get(url, { timeout: 15000 });
      return handleNoData(response?.data?.data);
    }

    if (filterMode === 'filter_formula') {
      const inputData = context?.inputData?.Filter_op;
      if (!inputData) {
        return { message: 'No filter values provided.' };
      }

      const { mapping: fieldMapping, types: fieldTypes } = await fetchFieldData();

      function formatData(input) {
        const entries = Object.entries(input);
        const conditionEntries = [];
        let currentOperator = 'AND';

        for (let i = 0; i < entries.length; i++) {
          const [key, item] = entries[i];

          if (key.endsWith('-andor')) {
            currentOperator = (item || 'AND').toUpperCase();
            continue;
          }

          if (item && typeof item === 'object') {
            let operator = '';
            let value = '';
            for (let subKey in item) {
              if (subKey.endsWith('-operator')) operator = item[subKey];
              if (subKey.endsWith('-value')) value = item[subKey];
            }

            const actualField = fieldMapping[key.toLowerCase()] || key;
            const dateConditions = handleDateOperators(key, operator, value, actualField);

            if (dateConditions) {
              conditionEntries.push({ condition: `(${dateConditions.join(' AND ')})`, operator: currentOperator });
            } else {
              conditionEntries.push({
                condition: formatNonDateValue(value, actualField, operator, fieldTypes[key.toLowerCase()]),
                operator: currentOperator
              });
            }
          }
        }

        if (!conditionEntries.length) return '';
        let result = conditionEntries[0].condition;
        for (let i = 1; i < conditionEntries.length; i++) {
          result += ` ${conditionEntries[i].operator} ${conditionEntries[i].condition}`;
        }
        return result;
      }

      const filterString = formatData(inputData);

      if (!filterString) {
        return { message: 'No valid filter conditions found.' };
      }

      const query = await buildQueryParams(fieldMapping);
      const url = `https://table-api.viasocket.com/${dbId}/${table}?filter=${encodeURIComponent(filterString)}${query ? '&' + query : ''}`;
      const response = await axios.get(url, { timeout: 15000 });
      return handleNoData(response?.data?.data);
    }

    if (filterMode === 'query') {
      const filterString = (context?.inputData?.query1 || '').trim();

      if (!filterString) {
        return { message: 'No filter condition generated by AI. Please enter a valid query.' };
      }

      const query = await buildQueryParams();
      const url = `https://table-api.viasocket.com/${dbId}/${table}?filter=${encodeURIComponent(filterString)}${query ? '&' + query : ''}`;
      const response = await axios.get(url, { timeout: 15000 });
      return handleNoData(response?.data?.data);
    }

    if (filterMode === 'key_value') {
      const columns = context?.inputData?.key_value_columns || [];
      const values = context?.inputData?.key_value_input_groups || {};

      if (columns.length === 0) {
        return { message: 'No columns selected for filtering.' };
      }

      const parts = [];
      for (let i = 0; i < columns.length; i++) {
        const actualField = columns[i];
        const v = values[actualField];
        if (v !== undefined && v !== null && v !== '') {
          if (typeof v === 'boolean' || typeof v === 'number') {
            parts.push(`${actualField} = ${v}`);
          } else {
            parts.push(`${actualField} = '${v}'`);
          }
        }
      }

      const query = await buildQueryParams();
      let url = `https://table-api.viasocket.com/${dbId}/${table}`;
      if (parts.length > 0) {
        url += `?filter=${encodeURIComponent(parts.join(' and '))}${query ? '&' + query : ''}`;
      } else if (query) {
        url += '?' + query;
      }

      const response = await axios.get(url, { timeout: 15000 });
      return handleNoData(response?.data?.data);
    }

    return {
      success: false,
      message: 'Invalid filter method selected.'
    };

  } catch (error) {
    await errorComponent(error);
  }
}

return await getTableRows();
```

> **Note:** The Keka (Add Employee) perform code block is extensive and was truncated in the prompt. The perform code follows the same patterns: validate inputs → build payload → call API → return structured response.


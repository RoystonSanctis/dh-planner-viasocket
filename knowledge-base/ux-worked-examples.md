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
  - Razorpay — Create New Invoice
  - HubSpot — Create New Contact
  - Sangam CRM — Insert or Update Data with Linking Module
  - ResourceGuru — Create Resource
  - OneDeck — Create Contact
  - Google Task — Create Task
  - Livestorm — Create Registration
  - Xero — Create Invoice
  - Cal ID — Create Booking
  - Calendly — Create Booking
- LIST Examples
  - Keka — List All Employees
- FIND / SEARCH Examples
  - LeadSquared — Search Leads by Criteria
  - GoHighLevel — Add Tags on Contact
  - Gmail — Add Label to Email
  - ActiveCampaign — Add or Remove Tag on Contact
- GET Examples
  - LeadSquared — Get Lead by ID
  - YouTube — Get Channel Analytics
- FIND OR CREATE (Upsert) Examples
  - LeadSquared — Create or Update Lead
- Composite / Advanced Action Examples
  - Slack — Send Message
  - Slack — Schedule Message
- SCHEDULED TRIGGER Examples
  - Google Calendar — New Upcoming Events (Scheduled Trigger)
    - Rationale
    - Input Fields JSON
    - Perform Code
  - Google Meet — New Upcoming Meeting (Scheduled Trigger)
    - Rationale
    - Input Fields JSON
    - Perform Code
- Cross-Cutting UX Patterns (Extracted)
- Advanced Best Approaches for Actions
  - Action - Insert or Update Data with Linking Module (Sangam CRM)
  - Create an Invoice with Customer Details (Razorpay)
  - Create or Update a Lead (LeadSquared)
  - List all Employees (Keka)
  - Send Message (Slack)
  - Cin7 Core — Update Customer (Advanced)

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

## Razorpay — Create New Invoice

**Metadata**
- **App:** Razorpay
- **Category:** Payment Processing / Order Processing
- **Action:** Create New Invoice
- **Action Type:** CREATE

**Supporting API Usage**
- No lookup APIs are strictly required by Razorpay for this action; currency options are served from a helper endpoint (`https://flow.sokt.io/func/scriRLSAg3B3`) via an `optionsGenerator`.

**UX Components & Field Design**
- **Boolean branch (`use_customer_id`)** — lets the user either paste an existing Customer ID or fill inline customer details. This is the classic "reference-an-existing-record OR enter-details" fork, driving two mutually-exclusive branches via `visibilityCondition`.
- **`customer_id` (string)** — visible only when the branch is "Use Customer ID".
- **`customer` (input group)** — name / contact / email, visible only when the branch is "Use Customer Details".
- **`expire_by_days` (number, default 120)** — expressed in human terms (days), not a raw UNIX timestamp; the perform code converts to epoch.
- **`billing_address` (input group)** and **`same_as_billing` (boolean)** — the toggle hides the shipping group when addresses match, avoiding duplicate data entry.
- **`shipping_address` (input group)** — visible only when `same_as_billing === false`.
- **`line_items` (input group, repeating)** — each item has name, description, amount (smallest currency unit), currency (dynamic dropdown), quantity.
- **`currency` (dynamic dropdown)** — invoice-level currency; same generator reused as the line-item currency.
- **`partial_payment` (boolean, default No)**.

**Input Fields JSON**
```json
[
  {
    "key": "use_customer_id",
    "help": "Choose whether to use an existing Customer ID or enter new customer details.",
    "type": "boolean",
    "label": "Generate invoice with?",
    "options": [
      { "label": "Use Customer ID", "value": true },
      { "label": "Use Customer Details", "value": false }
    ],
    "required": true,
    "defaultValue": { "label": "Use Customer Details", "value": false }
  },
  {
    "key": "customer_id",
    "help": "Enter the existing Razorpay Customer ID.",
    "type": "string",
    "label": "Customer ID",
    "required": true,
    "placeholder": "e.g. cust_E7q0trFqXgExmT",
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
      { "key": "name", "help": "Enter the customer's full name (3-50 characters, alphabets, periods, apostrophes, and parentheses allowed).", "type": "string", "label": "Customer Name", "required": true, "placeholder": "e.g. John Doe" },
      { "key": "contact", "help": "Enter the customer's contact number including country code (max 15 characters).", "type": "string", "label": "Contact Number", "required": true, "placeholder": "e.g. +919000090000" },
      { "key": "email", "help": "Enter the customer's email address (max 64 characters).", "type": "string", "label": "Email Address", "required": true, "placeholder": "e.g. john.doe@example.com" }
    ]
  },
  {
    "key": "description",
    "help": "Enter a brief description for the invoice (max 2048 characters).",
    "type": "string",
    "label": "Invoice Description",
    "required": false,
    "placeholder": "e.g. Invoice for Web Development Services"
  },
  {
    "key": "expire_by_days",
    "help": "Enter the number of days after which the invoice should expire.",
    "type": "number",
    "label": "Expiry (in days)",
    "required": true,
    "placeholder": "e.g. 30 for 30 days",
    "defaultValue": "120"
  },
  {
    "key": "billing_address",
    "help": "Provide the customer's billing address.",
    "type": "input groups",
    "label": "Billing Address",
    "required": true,
    "fields": [
      { "key": "line1", "help": "Enter the first line of the billing address.", "type": "string", "label": "Street Address Line 1", "required": true },
      { "key": "line2", "help": "Enter the second line of the billing address (optional).", "type": "string", "label": "Street Address Line 2", "required": false },
      { "key": "zipcode", "help": "Enter the postal code.", "type": "string", "label": "Zipcode", "required": true },
      { "key": "city", "help": "Enter the city name.", "type": "string", "label": "City", "required": true },
      { "key": "state", "help": "Enter the state or province.", "type": "string", "label": "State", "required": true },
      { "key": "country", "help": "Enter the country code (e.g., 'IN' for India).", "type": "string", "label": "Country Code", "required": true, "placeholder": "Country code (e.g., 'IN' for India and USA for United State)" }
    ]
  },
  {
    "key": "same_as_billing",
    "help": "Is the shipping address the same as the billing address?",
    "type": "boolean",
    "label": "Billing Address Same as Shipping?",
    "options": [ { "label": "Yes", "value": true }, { "label": "No", "value": false } ],
    "required": true,
    "defaultValue": { "label": "Yes", "value": true }
  },
  {
    "key": "shipping_address",
    "help": "Provide the customer's shipping address.",
    "type": "input groups",
    "label": "Shipping Address",
    "required": false,
    "visibilityCondition": "context.inputData.same_as_billing === false",
    "fields": [
      { "key": "line1", "help": "Enter the first line of the shipping address.", "type": "string", "label": "Street Address Line 1", "required": true },
      { "key": "line2", "help": "Enter the second line of the shipping address (optional).", "type": "string", "label": "Street Address Line 2", "required": false },
      { "key": "zipcode", "help": "Enter the postal code.", "type": "string", "label": "Zipcode", "required": true },
      { "key": "city", "help": "Enter the city name.", "type": "string", "label": "City", "required": true },
      { "key": "state", "help": "Enter the state or province.", "type": "string", "label": "State", "required": true },
      { "key": "country", "help": "Enter the country code (e.g., 'IN' for India).", "type": "string", "label": "Country", "required": true }
    ]
  },
  {
    "key": "line_items",
    "help": "Add items to be billed in this invoice. Maximum 50 items.",
    "type": "input groups",
    "label": "Invoice Items",
    "required": true,
    "fields": [
      { "key": "name", "help": "Enter the name of the item.", "type": "string", "label": "Item Name", "required": true, "placeholder": "e.g. Website Development Service" },
      { "key": "description", "help": "Enter a brief description of the item (optional).", "type": "string", "label": "Item Description", "required": false, "placeholder": "e.g. Monthly subscription for cloud hosting" },
      { "key": "amount", "help": "Enter the price of the item in the smallest currency unit (e.g., 50000 for ₹500.00).", "type": "number", "label": "Amount (in smallest currency unit)", "required": true, "placeholder": "e.g. 50000 for ₹500.00" },
      { "key": "currency", "help": "Select the currency for this item (must match invoice currency).", "type": "dropdown", "label": "Item Currency", "required": true, "optionsGenerator": "async function fetchCurrencies() { const response = await axios.get('https://flow.sokt.io/func/scriRLSAg3B3'); return response.data.map(currency => ({ label: currency.name, value: currency.value, sample: currency.value })); } return await fetchCurrencies();" },
      { "key": "quantity", "help": "Enter the quantity of this item.", "type": "number", "label": "Quantity", "required": true, "placeholder": "e.g. 2" }
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
    "options": [ { "label": "Yes", "value": true }, { "label": "No", "value": false } ],
    "required": false,
    "defaultValue": { "label": "No", "value": false }
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
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    await errorComponent(error);
  }
}

return await createInvoice();
```

**UX Takeaways**
- Use a **boolean/dropdown fork** when a payload can be built two ways ("reference existing" vs "enter new"); gate each branch's fields with `visibilityCondition`.
- Accept **human units** (days) and convert to machine units (UNIX epoch) inside perform code — never make the user compute timestamps.
- Reuse a single `optionsGenerator` across parent-level and line-item-level fields for consistency.
- A "same as X?" boolean that hides a duplicate input group is a strong pattern for address/billing style data.

---

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

## Sangam CRM — Insert or Update Data with Linking Module

**Metadata**
- **App:** Sangam CRM
- **Category:** Sales & CRM
- **Action:** Insert or Update Data With Linking Module
- **Action Type:** CREATE (with related-record linking)

**Supporting API Usage**
- **Module List API** (`/api/v1/modulelist`) — populates both the primary-module dropdown and the related-module multiselect.
- **Field List API** (`/api/v1/fieldlist`) — retrieves fields (and dropdown options) for a chosen module; drives every dynamic field generator here.

**UX Components & Field Design**
- **`main_module` (dynamic dropdown)** — pick the primary module (Contacts, Accounts, Leads…).
- **`main_module_fields` (dynamic multiselect / field chooser)** — choose which fields of the main module to fill; `phone` and `email` are always force-included as mandatory downstream.
- **`main_module_field_inputs` (dynamic input group via `fieldsGenerator`)** — renders an input per chosen field; fields with options render as dropdowns, the rest as strings.
- **`create_new_related_module` (boolean)** — "Create New" vs "Link to Existing" — the branch selector for the related record.
- **`related_modules` (dynamic multiselect)** — pick the related module(s) to link.
- **`related_module_fields` (dynamic multiselect)** — field chooser for the related modules; only shown when creating new (`create_new_related_module === true`). Field values are namespaced `module:field` to avoid collisions across modules.
- **`related_module_field_inputs` (dynamic nested input group)** — groups the chosen related fields *per module* into their own sub input group.

This is a **cascading, multi-level dynamic-schema** example: module → fields → typed inputs, repeated for a related module, with a create/link branch in between.

**Input Fields JSON**
```json
[
  {
    "key": "main_module",
    "help": "Select the module in which you want to insert the record.",
    "type": "dropdown",
    "label": "Select Main Module",
    "required": true,
    "optionsGenerator": "async function fetchModules() {\n  const config = {\n    method: 'post',\n    url: `${context.authData.subdomain}/api/v1/modulelist`,\n    headers: {\n      'Content-Type': 'application/json',\n      Accept: 'application/json',\n      \"Authorization\": `Bearer ${context?.authData?.apitoken}`\n    }\n  };\n  try {\n    const response = await axios.request(config);\n    return response.data.module_list.map(module => ({ label: module, value: module }));\n  } catch (error) {\n    throw error\n  }\n}\n\nreturn await fetchModules();"
  },
  {
    "key": "main_module_fields",
    "help": "Select the fields of the main module you want to insert.",
    "type": "multiselect",
    "label": "Main Module Fields",
    "required": true,
    "optionsGenerator": "async function fetchFields() {\n  const data = JSON.stringify({ module_name: context.inputData.main_module });\n  const config = {\n    method: 'post',\n    maxBodyLength: Infinity,\n    url: `${context.authData.subdomain}/api/v1/fieldlist`,\n    headers: {\n      'Content-Type': 'application/json',\n      Accept: 'application/json',\n      \"Authorization\": `Bearer ${context?.authData?.apitoken}`\n    },\n    data: data\n  };\n  try {\n    const response = await axios.request(config);\n    const fields = Object.entries(response.data.field_list || {})\n      .filter(([key]) => key !== 'address')\n      .map(([key, value]) => ({ label: value.display_name || key, value: key }));\n    return fields;\n  } catch (error) {\n    throw error\n  }\n}\n\nreturn await fetchFields();"
  },
  {
    "key": "main_module_field_inputs",
    "help": "Provide values for the fields you selected for the main module.",
    "type": "input groups",
    "label": "Main Module Field Values",
    "fieldsGenerator": "async function fetchSelectedFields() {\n  const selectedFields = context?.inputData?.main_module_fields || [];\n  const mandatoryFields = [\"phone\", \"email\"];\n  const allFields = Array.from(new Set([...selectedFields, ...mandatoryFields]));\n  const data = JSON.stringify({ module_name: context?.inputData?.main_module });\n  const config = {\n    method: 'post',\n    maxBodyLength: Infinity,\n    url: `${context.authData.subdomain}/api/v1/fieldlist`,\n    headers: {\n      'Content-Type': 'application/json',\n      Accept: 'application/json',\n      \"Authorization\": `Bearer ${context?.authData?.apitoken}`\n    },\n    data: data\n  };\n  try {\n    const response = await axios.request(config);\n    return Object.entries(response.data.field_list || {})\n      .filter(([key]) => allFields.includes(key))\n      .map(([key, value]) => {\n        if (value.options) {\n          return { key: key, label: value.display_name || key, type: 'dropdown', required: mandatoryFields.includes(key), options: Object.entries(value.options).map(([val, label]) => ({ label, value: val })) };\n        } else {\n          return { key: key, label: value.display_name || key, type: 'string', required: mandatoryFields.includes(key) };\n        }\n      });\n  } catch (error) {\n    throw error\n  }\n}\n\nreturn await fetchSelectedFields();"
  },
  {
    "key": "create_new_related_module",
    "help": "Do you want to create a new related module or link an existing one?",
    "type": "boolean",
    "label": "Create or Link to existing",
    "options": [
      { "label": "Create New", "value": true },
      { "label": "Link to Existing ", "value": false }
    ],
    "required": true
  },
  {
    "key": "related_modules",
    "help": "Select the related modules you want to link.",
    "type": "multiselect",
    "label": "Select Related Modules",
    "required": false,
    "optionsGenerator": "async function fetchModules() {\n  const config = {\n    method: 'post',\n    url: `${context.authData.subdomain}/api/v1/modulelist`,\n    headers: {\n      'Content-Type': 'application/json',\n      Accept: 'application/json',\n      \"Authorization\": `Bearer ${context?.authData?.apitoken}`\n    }\n  };\n  try {\n    const response = await axios.request(config);\n    return response.data.module_list.map(module => ({ label: module, value: module }));\n  } catch (error) {\n    throw error\n  }\n}\n\nreturn await fetchModules();",
    "visibilityCondition": "context.inputData.create_new_related_module === true || context.inputData.create_new_related_module === false"
  },
  {
    "key": "related_module_fields",
    "help": "Select the fields for each related module you want to insert.",
    "type": "multiselect",
    "label": "Fields for Related Modules",
    "optionsGenerator": "async function fetchFields() {\n  const selectedModules = context.inputData.related_modules || [];\n  const fetchFieldsForModule = async (module) => {\n    const data = JSON.stringify({ module_name: module });\n    const config = {\n      method: 'post',\n      maxBodyLength: Infinity,\n      url: `${context.authData.subdomain}/api/v1/fieldlist`,\n      headers: {\n        'Content-Type': 'application/json',\n        Accept: 'application/json',\n        \"Authorization\": `Bearer ${context?.authData?.apitoken}`\n      },\n      data: data\n    };\n    try {\n      const response = await axios.request(config);\n      return Object.entries(response.data.field_list || {})\n        .filter(([key]) => key !== 'address')\n        .map(([key, value]) => ({ label: `${module} - ${value.display_name || key}`, value: `${module}:${key}` }));\n    } catch (error) {\n      throw error\n    }\n  };\n  const allFields = await Promise.all(selectedModules.map(fetchFieldsForModule));\n  return allFields.flat();\n}\n\nreturn await fetchFields();",
    "visibilityCondition": "context.inputData.create_new_related_module === true"
  },
  {
    "key": "related_module_field_inputs",
    "help": "Provide values for the fields you selected for related modules.",
    "type": "input groups",
    "label": "Related Module Field Values",
    "fieldsGenerator": "async function generateRelatedFieldInputs() {\n    const selectedFields = context.inputData.related_module_fields || [];\n    const mandatoryFields = [\"phone\", \"email\"];\n    const fieldsByModule = selectedFields.reduce((acc, field) => {\n        const [module, fieldName] = field.split(':');\n        if (!acc[module]) acc[module] = [];\n        acc[module].push(fieldName);\n        return acc;\n    }, {});\n    const inputGroups = await Promise.all(\n        Object.entries(fieldsByModule).map(async ([module, fields]) => {\n            const uniqueFields = Array.from(new Set(fields));\n            const fieldInputs = await Promise.all(\n                uniqueFields.map(async (field) => {\n                    const data = JSON.stringify({ module_name: module });\n                    const config = {\n                        method: 'post',\n                        maxBodyLength: Infinity,\n                        url: `${context.authData.subdomain}/api/v1/fieldlist`,\n                        headers: {\n                            'Content-Type': 'application/json',\n                            Accept: 'application/json',\n                            \"Authorization\": `Bearer ${context?.authData?.apitoken}`\n                        },\n                        data: data\n                    };\n                    let fieldData = {};\n                    try {\n                        const response = await axios.request(config);\n                        fieldData = response.data.field_list ? response.data.field_list[field] : {};\n                    } catch (error) {}\n                    if (fieldData.options) {\n                        return { key: field, label: fieldData.display_name || field, type: 'dropdown', required: mandatoryFields.includes(field), options: Object.entries(fieldData.options).map(([val, label]) => ({ label, value: val })) };\n                    } else {\n                        return { key: field, label: fieldData.display_name || field, type: 'string', required: mandatoryFields.includes(field) };\n                    }\n                })\n            );\n            return { key: module, label: module, type: 'input groups', fields: fieldInputs };\n        })\n    );\n    return inputGroups;\n}\n\nreturn await generateRelatedFieldInputs();",
    "visibilityCondition": "context.inputData.create_new_related_module === true && context.inputData.related_modules && context.inputData.related_modules.length > 0"
  }
]
```

**API Configuration Perform Code**
```javascript
async function buildAndSendPayload(context) {
  try {
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
    const relatedModuleFieldInputs = context.inputData.related_module_field_inputs || {};

    const relatedModels = [];
    for (let module of relatedModules) {
      let relatedModel = {};
      const relatedModuleName = `${module.toLowerCase()}_${mainModule.toLowerCase()}`;

      relatedModel[relatedModuleName] = [{
        attach: [{
          phone: mainModuleFieldInputs.phone,
          email: mainModuleFieldInputs.email
        }],
        data: []
      }];

      if (createNewRelatedModule) {
        const data = relatedModuleFieldInputs[module] || {};
        if (Object.keys(data).length > 0) {
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
    const response = await axios.post(`${context.authData.subdomain}/api/v1/save-data`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        "Authorization": `Bearer ${context?.authData?.apitoken}`
      }
    });

    return response.data;
  } catch (error) {
    await errorComponent(error);
  }
}

return await buildAndSendPayload(context);
```

**UX Takeaways**
- **Cascade generators**: each dynamic field depends on the selection above it (module → field chooser → typed inputs). Use `visibilityCondition` to keep dependent fields hidden until their parent is chosen.
- **Namespace field values** (`module:field`) when a chooser spans multiple resources so the input-group generator can regroup them correctly.
- Force-include mandatory identifier fields (here `phone`, `email`) in both the chooser output and the perform payload, even if the user didn't tick them.
- Keep no `console.log` in production perform code (the original had debug logs; the clean version drops them) and use `errorComponent(error)` in catch.

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

# LIST Examples

LIST actions return multiple records. The defining UX move is a **Mode selector** ("Fetch All" / "Find Specific" / "Recently Updated") that reshapes the form, plus a **field-selection multiselect** so the response isn't bloated with every column.

## Keka — List All Employees

**Metadata**
- **App:** Keka
- **Category:** HR Talent & Recruitment / Payroll
- **Action:** List all Employees
- **Action Type:** LIST (with Fetch-All / Find-Specific / Recent modes)

**Supporting API Usage**
- **Employees API** (`/api/v1/hris/employees`) — paginated list; also supports `searchKey`, `employeeIds`, `employeeNumbers`, `lastModified`, and status filters, so most narrowing happens server-side.

**UX Components & Field Design**
- **`mode` (dropdown)** — the master selector: *Fetch All Employees* / *Find Specific Employees* / *Recently Updated Employees*. Every other field's visibility keys off this.
- **`find_by` (dropdown)** — only in "specific" mode: search by *Name/Email* or *Employee ID/Number*.
- **`search_name_email` / `search_employee_id_number` (strings)** — the matching lookup input, each gated by both `mode === 'specific'` and the chosen `find_by`.
- **`filters` (input group)** — only in "all"/"recent" mode. Bundles: `updatedAfter` (an **AI field** that normalizes natural-language dates to ISO, shown only in recent mode), `employmentStatus` (multiselect, both selected by default), `inNoticePeriod` and `inProbation` (dropdowns). Every dropdown/multiselect here carries `customInputLabel`/`customPlaceholder` for custom-mapping mode.
- **`select_response_fields` (multiselect field chooser)** — pick which employee fields to return; a curated set is pre-selected by default so the output is useful out of the box.

**Input Fields JSON**
```json
[
  {
    "key": "mode",
    "help": "Choose how you want to fetch employees (all, recent, or specific).",
    "type": "dropdown",
    "label": "How Do You Want to Fetch Employees?",
    "options": [
      { "label": "Fetch All Employees", "value": "all" },
      { "label": "Find Specific Employees", "value": "specific" },
      { "label": "Recently Updated Employees", "value": "recent" }
    ],
    "required": true,
    "placeholder": "Select fetch mode",
    "defaultValue": { "label": "Fetch All Employees", "value": "all" },
    "customInputLabel": "Enter fetch mode",
    "customPlaceholder": "E.g., Fetch all employees"
  },
  {
    "key": "find_by",
    "help": "Choose how you want to find specific employees (by Name/Email, or Employee ID/Employee Number).",
    "type": "dropdown",
    "label": "Find Employee By",
    "options": [
      { "label": "Name / Email", "value": "name_email" },
      { "label": "Employee ID / Employee Number", "value": "id_number" }
    ],
    "required": true,
    "placeholder": "Select search method",
    "customInputLabel": "Enter search method",
    "customPlaceholder": "E.g., Name or Email",
    "visibilityCondition": "context.inputData.mode === 'specific'"
  },
  {
    "key": "search_name_email",
    "help": "Enter employee first name(s) or email address(es). You can enter multiple values separated by commas. Name matches are exact, while email matches depend on pagination.",
    "type": "string",
    "label": "Employee Name / Email",
    "required": true,
    "placeholder": "E.g., John Doe,john@company.com",
    "visibilityCondition": "context.inputData.mode === 'specific' && context.inputData.find_by === 'name_email'"
  },
  {
    "key": "search_employee_id_number",
    "help": "Enter employee ID(s) or employee number(s). You can enter multiple values separated by commas. Matching is exact, and employees matching any of the provided values will be returned.",
    "type": "string",
    "label": "Employee ID / Employee Number",
    "required": true,
    "placeholder": "E.g., EMP-001,550e8400-e29b-41d4",
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
        "help": "Enter a relative or specific date (e.g., yesterday, 3 days ago, 2024-06-01). If not provided it will automatically return employees updated in last 30 days.",
        "type": "aifield",
        "label": "Updated After",
        "prompt": "User will enter a date or relative time in natural language or a specific date (e.g., 'yesterday', '3 days ago', 'last week', '2024-06-01'). ALWAYS convert the input into a valid ISO 8601 UTC datetime string in the format YYYY-MM-DDTHH:mm:ssZ. Even if the input already looks like a date, still normalize it to ISO 8601. Return ONLY the ISO string. Do not include explanations, labels, or text.",
        "required": false,
        "placeholder": "E.g., yesterday, 3 days ago, 2024-06-01",
        "visibilityCondition": "context.inputData.mode === 'recent'"
      },
      {
        "key": "employmentStatus",
        "help": "Filter employees by their current employment status. By default, both options are selected. You can also choose just one.",
        "type": "multiselect",
        "label": "Employment Status",
        "options": [ { "label": "Working", "value": "Working" }, { "label": "Relieved", "value": "Relieved" } ],
        "required": false,
        "placeholder": "Select employment status",
        "defaultValue": [ { "label": "Working", "value": "Working" }, { "label": "Relieved", "value": "Relieved" } ],
        "customInputLabel": "Enter employment status",
        "customPlaceholder": "E.g., Working"
      },
      {
        "key": "inNoticePeriod",
        "help": "Choose whether to fetch only employees who are currently serving a notice period or employees who are not on notice.",
        "type": "dropdown",
        "label": "Notice Period",
        "options": [ { "label": "Only notice period employees", "value": true }, { "label": "Employees not on notice", "value": false } ],
        "required": false,
        "placeholder": "Select notice period filter",
        "defaultValue": { "label": "Employees not on notice", "value": false },
        "customInputLabel": "Enter notice period filter",
        "customPlaceholder": "E.g., Only notice period employees"
      },
      {
        "key": "inProbation",
        "help": "Choose whether to fetch only employees who are currently in probation or permanent employees.",
        "type": "dropdown",
        "label": "Probation",
        "options": [ { "label": "Only probation employees", "value": true }, { "label": "Permanent Employees", "value": false } ],
        "required": false,
        "placeholder": "Select probation filter",
        "defaultValue": { "label": "Permanent Employees", "value": false },
        "customInputLabel": "Enter probation filter",
        "customPlaceholder": "E.g., Only probation employees"
      }
    ]
  },
  {
    "key": "select_response_fields",
    "help": "Select the employee fields to return in the response. Essential fields are preselected by default, and you can add or remove fields as required.",
    "type": "multiselect",
    "label": "Fields to Include in Response",
    "options": [
      { "label": "Employee ID", "value": "id" },
      { "label": "Employee Number", "value": "employeeNumber" },
      { "label": "First Name", "value": "firstName" },
      { "label": "Middle Name", "value": "middleName" },
      { "label": "Last Name", "value": "lastName" },
      { "label": "Full Name", "value": "displayName" },
      { "label": "Work Email", "value": "email" },
      { "label": "Personal Email", "value": "personalEmail" },
      { "label": "Job Title", "value": "jobTitle.title" },
      { "label": "Reports To (Manager)", "value": "reportsTo" },
      { "label": "Employment Status", "value": "employmentStatus" },
      { "label": "Account Status", "value": "accountStatus" },
      { "label": "Joining Date", "value": "joiningDate" },
      { "label": "Date of Birth", "value": "dateOfBirth" },
      { "label": "Groups / Department", "value": "groups" },
      { "label": "City", "value": "city" },
      { "label": "Country", "value": "countryCode" },
      { "label": "Mobile Phone", "value": "mobilePhone" },
      { "label": "Gender", "value": "gender" },
      { "label": "Profile Photo", "value": "image" }
    ],
    "required": false,
    "placeholder": "Select fields",
    "defaultValue": [
      { "label": "Employee Number", "value": "employeeNumber" },
      { "label": "Full Name", "value": "displayName" },
      { "label": "Work Email", "value": "email" },
      { "label": "Mobile Phone", "value": "mobilePhone" },
      { "label": "Job Title", "value": "jobTitle.title" },
      { "label": "Reports To (Manager)", "value": "reportsTo" },
      { "label": "Employment Status", "value": "employmentStatus" },
      { "label": "Account Status", "value": "accountStatus" },
      { "label": "Joining Date", "value": "joiningDate" },
      { "label": "Date of Birth", "value": "dateOfBirth" },
      { "label": "Groups / Department", "value": "groups" },
      { "label": "City", "value": "city" }
    ],
    "customInputLabel": "Enter field name",
    "customPlaceholder": "E.g., firstName"
  }
]
```

> [!NOTE]
> The shipped action's `select_response_fields` option list contains ~60 Keka fields. The JSON above is trimmed to a representative subset for readability. When building a real field-selection multiselect, enumerate all documented response fields, then pre-select a curated ~10-12 in `defaultValue`.

**API Configuration Perform Code**
```javascript
try {
  const { mode, find_by, search_name_email, search_employee_id_number, filters, select_response_fields } = context.inputData;

  const employmentStatus = filters?.employmentStatus;
  const inNoticePeriod = filters?.inNoticePeriod;
  const inProbation = filters?.inProbation;
  const updatedAfter = filters?.updatedAfter;

  // Handle "Recent" logic - default = last 30 days
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

  let baseParams = {
    employmentStatus: Array.isArray(employmentStatus) && employmentStatus.length ? employmentStatus.join(',') : undefined,
    lastModified: lastModifiedDate,
    inNoticePeriod: inNoticePeriod,
    inProbation: inProbation
  };

  let employees = [];
  let seenIds = new Set();
  const baseUrl = `https://${context.authData.company}.${context.authData.environment}.com/api/v1/hris/employees`;

  // FETCH ALL / RECENT
  if (mode === 'all' || mode === 'recent') {
    let page = 1;
    const size = 200;
    let totalPages = 1;
    while (page <= totalPages) {
      const res = await axios.request({
        method: 'get',
        maxBodyLength: Infinity,
        url: baseUrl,
        params: { ...baseParams, pageNumber: page, pageSize: size }
      });
      const data = res.data?.data || [];
      totalPages = res.data?.totalPages || 1;
      employees.push(...data);
      page++;
    }
  }

  // FIND BY NAME / EMAIL
  if (mode === 'specific' && find_by === 'name_email' && search_name_email) {
    const values = search_name_email.split(',').map(v => v.trim()).filter(Boolean);
    const nameValues = values.filter(v => !v.includes('@')).map(v => v.toLowerCase());
    const emailValues = values.filter(v => v.includes('@')).map(v => v.toLowerCase());

    let page = 1;
    const size = 200;
    let totalPages = 1;
    let found = false;

    while (page <= totalPages && !found) {
      let params = { ...baseParams, pageNumber: page, pageSize: size };
      if (nameValues.length) {
        params.searchKey = nameValues.join(',');
      }
      let res = await axios.request({ method: 'get', maxBodyLength: Infinity, url: baseUrl, params });
      const data = res.data?.data || [];
      totalPages = res.data?.totalPages || 1;

      for (let emp of data) {
        const firstName = emp.firstName?.toLowerCase();
        const displayName = emp.displayName?.toLowerCase();
        const email = emp.email?.toLowerCase();
        if ((nameValues.length && (nameValues.includes(firstName) || nameValues.includes(displayName))) ||
            (emailValues.length && emailValues.includes(email))) {
          employees.push(emp);
          found = true;
          break;
        }
      }
      page++;
    }
  }

  // FIND BY EMPLOYEE ID / NUMBER
  if (mode === 'specific' && find_by === 'id_number' && search_employee_id_number) {
    const values = search_employee_id_number.split(',').map(v => v.trim()).filter(Boolean);
    const employeeIds = [];
    const employeeNumbers = [];
    values.forEach(v => {
      if (v.includes('-') && v.length > 20) { employeeIds.push(v); } else { employeeNumbers.push(v); }
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
          url: baseUrl,
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

  // FINAL RESPONSE
  if (!employees.length) {
    return { message: "No employees were found for the selected criteria or page. Please check the provided values and try again." };
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
  await errorComponent(error);
}
```

**UX Takeaways**
- One **Mode dropdown** should reshape the whole form. Everything else uses `visibilityCondition` chained off `mode` (and sometimes a secondary selector like `find_by`).
- Prefer **native server-side narrowing** (`searchKey`, `lastModified`, status params). Fall back to client-side filtering only where the API can't do it.
- Never expose pagination knobs to the user in a LIST that auto-loops; the perform code walks `totalPages` internally.
- A **field-selection multiselect with curated defaults** keeps outputs lean while letting power users add columns. Apply the selection by projecting each record down to the chosen keys.
- Accept **comma-separated multi-values** in a single string field ("John Doe,john@company.com") and split them in code — simpler than repeating input groups for a quick multi-lookup.

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

## YouTube — Get Channel Analytics

**Metadata**
- **App:** YouTube · **Category:** Video/Analytics · **Action:** Get Channel Analytics · **Action Type:** GET

**Supporting API Usage**
- **List Channels API** — populates a searchable/paginated dropdown of channels (`channel_id`) so the user can select a channel by name.

**UX Components & Field Design**
- **Dropdown (with custom input) — Select Channel or Enter Channel ID** — pick a channel or manually map a channel ID.
- **Dropdown (Static) — Date Range Type** — allows user to choose between relative range (Last N Days) or fixed date range.
- **Number — Last N Days** — visible only when Date Range Type is "relative".
- **String — Start Date & End Date** — visible only when Date Range Type is "fixed".
- **Multiselect (Static) — Metrics & Dimensions** — static list of options instead of requiring manual comma-separated text entry.
- **Input Groups — Filters** — groups all dimension filtering fields (e.g. video, playlist, country) conditionally shown based on the selected filter dimension.
- **Multiselect (Static) — Sort By & Dropdown (Static) — Sort Order** — allows sorting based on selected metrics or dimensions.
- **Input Groups — Advanced Options** — groups secondary settings like currency, max results, and start index.

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
    "optionsGenerator": "try {\n  return await channel_ID(context?.paginateData?.['channel_id']);\n} catch (error) {\n  await errorComponent(error);\n}",
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
    "key": "metrics",
    "help": "Select the metrics to retrieve. Revenue metrics (e.g., Estimated Revenue) need the yt-analytics-monetary.readonly scope.",
    "type": "multiselect",
    "label": "Metrics",
    "options": [
      {
        "label": "Views",
        "value": "views",
        "sample": "views"
      },
      {
        "label": "Likes",
        "value": "likes",
        "sample": "likes"
      },
      {
        "label": "Dislikes",
        "value": "dislikes",
        "sample": "dislikes"
      },
      {
        "label": "Comments",
        "value": "comments",
        "sample": "comments"
      },
      {
        "label": "Shares",
        "value": "shares",
        "sample": "shares"
      },
      {
        "label": "Estimated Minutes Watched",
        "value": "estimatedMinutesWatched",
        "sample": "estimatedMinutesWatched"
      },
      {
        "label": "Average View Duration",
        "value": "averageViewDuration",
        "sample": "averageViewDuration"
      },
      {
        "label": "Subscribers Gained",
        "value": "subscribersGained",
        "sample": "subscribersGained"
      },
      {
        "label": "Subscribers Lost",
        "value": "subscribersLost",
        "sample": "subscribersLost"
      },
      {
        "label": "Estimated Revenue",
        "value": "estimatedRevenue",
        "sample": "estimatedRevenue"
      }
    ],
    "required": true,
    "customHelp": "Enter the metric names as a comma-separated list or array. Revenue metrics require the yt-analytics-monetary.readonly scope.",
    "placeholder": "Select metrics",
    "customInputLabel": "Metric(s)",
    "customPlaceholder": "[\"views\",\"likes\"]"
  },
  {
    "key": "dimensions",
    "help": "Select dimensions to break down metrics by. day and month cannot be used together.",
    "type": "multiselect",
    "label": "Dimensions",
    "options": [
      {
        "label": "Day",
        "value": "day",
        "sample": "day"
      },
      {
        "label": "Month",
        "value": "month",
        "sample": "month"
      },
      {
        "label": "Video",
        "value": "video",
        "sample": "video"
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
      },
      {
        "label": "Traffic Source Type",
        "value": "trafficSourceType",
        "sample": "trafficSourceType"
      }
    ],
    "required": false,
    "customHelp": "Enter the dimension names as a comma-separated list or array. Note: day and month cannot be used together.",
    "placeholder": "Select dimensions",
    "customInputLabel": "Dimension(s)",
    "customPlaceholder": "[\"day\",\"country\"]"
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
        "customHelp": "Use the 'List Videos' action to get all Videos along with their IDs and then map the retrieved data accordingly",
        "placeholder": "dMH0bHeiRNg,Zhawgd0REhA",
        "visibilityCondition": "context?.inputData?.filters?.dimension === 'video'"
      },
      {
        "key": "playlist_value",
        "help": "Enter the playlist ID(s) to filter by. You may enter multiple values separated by commas (max 500).",
        "type": "string",
        "label": "Playlist ID(s)",
        "required": true,
        "customHelp": "Use the 'List Playlists' action to get all Playlists along with their IDs and then map the retrieved data accordingly",
        "placeholder": "PLxxxxxx,PLyyyyyy",
        "visibilityCondition": "context?.inputData?.filters?.dimension === 'playlist'"
      },
      {
        "key": "channel_value",
        "help": "Enter the channel ID(s) to filter by. You may enter multiple values separated by commas (max 500).",
        "type": "string",
        "label": "Channel ID(s)",
        "required": true,
        "customHelp": "Use the 'List Channels' action to get all Channels along with their IDs and then map the retrieved data accordingly",
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
    "help": "Select fields to sort results by. Must be one of the selected metrics or dimensions.",
    "type": "multiselect",
    "label": "Sort By",
    "options": [
      {
        "label": "Views",
        "value": "views",
        "sample": "views"
      },
      {
        "label": "Likes",
        "value": "likes",
        "sample": "likes"
      },
      {
        "label": "Estimated Minutes Watched",
        "value": "estimatedMinutesWatched",
        "sample": "estimatedMinutesWatched"
      },
      {
        "label": "Day",
        "value": "day",
        "sample": "day"
      },
      {
        "label": "Month",
        "value": "month",
        "sample": "month"
      },
      {
        "label": "Video",
        "value": "video",
        "sample": "video"
      },
      {
        "label": "Country",
        "value": "country",
        "sample": "country"
      }
    ],
    "required": false,
    "customHelp": "Enter the sort field names as a comma-separated list or array. Each sort field must also be selected in Metrics or Dimensions.",
    "placeholder": "Select fields to sort by",
    "customInputLabel": "Sort Field(s)",
    "customPlaceholder": "[\"views\",\"day\"]"
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
    "visibilityCondition": "Array.isArray(context?.inputData?.sort_fields) && context.inputData.sort_fields.length > 0"
  },
  {
    "key": "advanced_options",
    "help": "Enter advanced options like currency, max results, and start index (optional).",
    "type": "input groups",
    "label": "Advanced Options",
    "required": false,
    "fields": [
      {
        "key": "currency",
        "help": "Enter the currency code for revenue metrics. Defaults to USD. See [supported currency codes](https://www.iban.com/currency-codes).",
        "type": "string",
        "label": "Currency",
        "required": false,
        "placeholder": "USD"
      },
      {
        "key": "max_results",
        "help": "Enter the maximum number of rows to return.",
        "type": "number",
        "label": "Max Results",
        "required": false,
        "placeholder": "100"
      },
      {
        "key": "start_index",
        "help": "Enter the 1-based row index to start from, for pagination.",
        "type": "number",
        "label": "Start Index",
        "required": false,
        "placeholder": "1",
        "defaultValue": 1
      }
    ]
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

    const metricsRaw = data.metrics;
    if (!metricsRaw || (Array.isArray(metricsRaw) && metricsRaw.length === 0)) {
      throw new Error('At least one metric is required.');
    }
    const metrics = Array.isArray(metricsRaw) ? metricsRaw : [metricsRaw];
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

    const dimensionsRaw = data.dimensions;
    const dimensions = dimensionsRaw && dimensionsRaw.length > 0
      ? (Array.isArray(dimensionsRaw) ? dimensionsRaw : [dimensionsRaw])
      : [];
    const dimensionsStr = dimensions.length ? dimensions.join(',') : undefined;

    if (dimensions.includes('day') && dimensions.includes('month')) {
      throw new Error('day and month dimensions cannot be used together. Please select only one time-based dimension.');
    }

    if (dimensions.includes('month')) {
      const normalizeMonthStart = (dateStr) => {
        const [y, m] = dateStr.split('-');
        return `${y}-${m}-01`;
      };
      startDate = normalizeMonthStart(startDate);
      endDate = normalizeMonthStart(endDate);
    }

    const allowedSortFields = new Set([...metrics, ...dimensions]);
    const sortFieldsRaw = data.sort_fields;
    let sortFields = [];
    if (sortFieldsRaw && sortFieldsRaw.length > 0) {
      sortFields = Array.isArray(sortFieldsRaw) ? sortFieldsRaw : [sortFieldsRaw];
      const invalidSortFields = sortFields.filter(f => !allowedSortFields.has(f));
      if (invalidSortFields.length > 0) {
        throw new Error(`Sort field(s) "${invalidSortFields.join(', ')}" are not selected in Metrics or Dimensions. Please add them to Metrics or Dimensions first.`);
      }
    }

    const monetaryMetrics = ['estimatedRevenue', 'estimatedAdRevenue', 'grossRevenue', 'estimatedRedPartnerRevenue', 'estimatedShortsRevenue', 'estimatedTransactionRevenue'];
    const usedMonetaryMetrics = metrics.filter(m => monetaryMetrics.includes(m));
    if (usedMonetaryMetrics.length > 0) {
      // Note: monetary metrics require yt-analytics-monetary.readonly scope.
      // If this scope is missing, the API will return an insufficient permission error.
    }

    // ---------- FILTER RESOLUTION (per selected dimension) ----------
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
      maxResults: Number(data.advanced_options?.max_results) || 25
    };

    if (dimensionsStr) {
      params.dimensions = dimensionsStr;
    }

    if (filters) {
      params.filters = filters;
    }

    if (sortFields.length > 0) {
      const sortPrefix = data.sort_order === 'asc' ? '' : '-';
      params.sort = sortFields.map(field => `${sortPrefix}${field}`).join(',');
    }

    if (data.advanced_options?.currency) {
      params.currency = data.advanced_options.currency;
    }

    if (data.advanced_options?.start_index) {
      params.startIndex = Number(data.advanced_options.start_index);
    }

    const response = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', { params });

    const headers = response.data?.columnHeaders || [];
    const rows = response.data?.rows || [];

    if (!rows.length) {
      return { message: 'No analytics data found for the selected metrics, dimensions, and date range.' };
    }

    const results = rows.map(row => {
      const obj = {};
      headers.forEach((col, i) => {
        obj[col.name] = row[i];
      });
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
- **Date Mode Selection UX:** Provide a static `date_mode` dropdown to let non-technical users choose between easy relative selections (e.g. "Last N Days") and fixed dates, doing date arithmetic internally in the perform code rather than exposing complicated date fields.
- **Static Multiselect over Comma-Separated Input:** For predefined values like metrics or dimensions, use static multiselect fields with curated options. This prevents typos and avoids asking users to type comma-separated values manually.
- **Grouped Conditional Filters:** Group all filter values inside an Input Group with `visibilityCondition` fields keyed on the selected dimension, allowing a clean, step-by-step UI.

---

# FIND OR CREATE (Upsert) Examples

Upsert = search by a stable identifier, update if found, create if not. UX separates a "Find" section from a conditionally-shown "Create" section, ideally with the create/update decision made automatically in code.

## LeadSquared — Create or Update Lead

**Metadata**
- **App:** LeadSquared · **Category:** CRM · **Action:** Create or Update a Lead · **Action Type:** FIND OR CREATE (Upsert)
- *(Documented from design notes.)*

**Supporting API Usage**
- **Get Custom Fields API** — dynamically renders the custom-field inputs alongside the standard lead fields.

**UX Components & Field Design**
- **Static Dropdown — Search By** — Email or Phone (the stable identifier used to resolve the existing lead).
- **Strings** — Email, First Name, Last Name, Phone (used for both create and update).
- **Dynamic Input Group — Custom Fields** — generated from the custom-fields API.

**UX Takeaways**
- Prefer **native upsert endpoints** and **search-first resolution** over asking the user to choose "Create" vs "Update". Let the identifier (email/phone) decide behavior in perform code.
- The standard identity fields stay static; the account-specific extension fields come from a dynamic generator — a clean split between fixed and dynamic schema.

---

# Composite / Advanced Action Examples

Some actions are not plain CRUD — they orchestrate several optional behaviors (targets, scheduling, identity, attachments). The lesson is the same: use selectors + `visibilityCondition` to reveal only the relevant sub-configuration, and default to the simplest path.

## Slack — Send Message

**Metadata**
- **App:** Slack
- **Category:** Communication & Collaboration
- **Action:** Send Message
- **Action Type:** Composite (create message, with target / notification / scheduling / identity / threading / attachment sub-configs)

**Supporting API Usage**
- **users.list** and channel list (reusable component `get_all_channel`) — power the tagged-users and channel multiselects. `chat.postMessage` / `chat.scheduleMessage` — the send endpoints.

**UX Components & Field Design**
- **`messageto` (dropdown)** — Channel vs User (DM). The master branch.
- **`userId` (string)** — comma-separated user IDs; only for DM mode. Help text tells the user exactly where to find a Slack member ID.
- **`channel_id` (multiselect, dynamic + custom input)** — channels; only for channel mode.
- **`notification_type` (dropdown)** — @channel / specific people / no one; channel mode only. Selecting "specific" reveals **`tagged_users` (dynamic multiselect)**.
- **`content` (string)** — the message.
- **`isScheduledMessage` (dropdown Yes/No)** — reveals **`post_at` (string, strict `YYYY-MM-DD HH:mm`)** when Yes.
- **`bot_details` (input group)** — bot display name, `customIcon` boolean → `icon_type` (emoji/url) → `emoji` or `url`. A three-level nested conditional for optional branding.
- **`isReplyMessage` (boolean)** — reveals `thread_ts` and `reply_broadcast`.
- **`unfurl_links` / `unfurl_media` (booleans)**.
- **`buttons` (dictionary)** — label→URL pairs rendered as message buttons; the **dictionary type** for arbitrary key-value input.

**Input Fields JSON**
```json
[
  {
    "key": "messageto",
    "type": "dropdown",
    "label": "Send Message To",
    "options": [ { "label": "Channel", "value": "channel" }, { "label": "User (DM)", "value": "user" } ],
    "required": true,
    "defaultValue": { "label": "Channel", "value": "channel" }
  },
  {
    "key": "userId",
    "help": "Enter Slack User IDs separated by commas. To find a User ID in Slack: open the user's profile -> click the three dots (More actions) -> select 'Copy member ID.'",
    "type": "string",
    "label": "User Id's",
    "required": true,
    "placeholder": "E.g., U0A6THCVAH1, U082S1U4DDL",
    "visibilityCondition": "context?.inputData?.messageto === 'user'"
  },
  {
    "key": "channel_id",
    "help": "Select channel(s) or Enter comma-separated Channel IDs.",
    "type": "multiselect",
    "label": "Channels",
    "required": true,
    "placeholder": "Select Slack channel(s)",
    "customInputLabel": "Enter Channel ID(s)",
    "optionsGenerator": "return await get_all_channel()",
    "customPlaceholder": "E.g., [\"C082ACF6XQQ\",\"C082WLRJLAA\"]",
    "visibilityCondition": "context?.inputData?.messageto === 'channel'"
  },
  {
    "key": "notification_type",
    "help": "Choose who should receive notifications when posting to channels.",
    "type": "dropdown",
    "label": "Who to notify?",
    "options": [
      { "label": "Everyone in the channel (@channel)", "value": "channel" },
      { "label": "Specific people only", "value": "specific" },
      { "label": "Just post (no one)", "value": "none" }
    ],
    "required": true,
    "defaultValue": { "label": "Just post (no one)", "value": "none" },
    "visibilityCondition": "context?.inputData?.messageto === 'channel'"
  },
  {
    "key": "tagged_users",
    "help": "Select users to @-mention. Only members actually present in the selected channel(s) will be notified and see the mention highlighted.",
    "type": "multiselect",
    "label": "People to notify",
    "required": true,
    "placeholder": "Select users to @-mention",
    "customInputLabel": "Enter Slack User ID(s)",
    "optionsGenerator": "try {\n  let users = [];\n  let cursor = null;\n  do {\n    const response = await axios.request({ method: 'get', url: 'https://slack.com/api/users.list', params: { limit: 999, cursor: cursor || undefined } });\n    if (!response.data.ok) { throw new Error(response.data.error); }\n    users.push(...response.data.members);\n    cursor = response.data.response_metadata?.next_cursor || null;\n  } while (cursor);\n  if (!users.length) { return { message: \"No users found, please make sure there is an available user to fetch\" }; }\n  return users.map(member => ({ label: member.real_name || member.name, value: member.id, sample: member.id }));\n} catch (error) {\n  throw error;\n}",
    "customPlaceholder": "E.g., [\"U08RYBM7LEM\",\"USLACKBOT\"]",
    "visibilityCondition": "context?.inputData?.messageto === 'channel' && context?.inputData?.notification_type === 'specific'"
  },
  {
    "key": "content",
    "help": "Enter the message content.",
    "type": "string",
    "label": "Message Content",
    "required": true,
    "placeholder": "Type your message..."
  },
  {
    "key": "isScheduledMessage",
    "type": "dropdown",
    "label": "Is this a scheduled message?",
    "options": [ { "label": "No", "value": "no" }, { "label": "Yes", "value": "yes" } ],
    "required": true,
    "defaultValue": { "label": "No", "value": "no" }
  },
  {
    "key": "post_at",
    "help": "Enter date & time in this format only: YYYY-MM-DD HH:mm (24-hour, local time)",
    "type": "string",
    "label": "Post At",
    "required": true,
    "placeholder": "E.g., 2026-02-05 18:07",
    "visibilityCondition": "context.inputData.isScheduledMessage === 'yes'"
  },
  {
    "key": "bot_details",
    "type": "input groups",
    "label": "Bot Identity and Customization",
    "fields": [
      { "key": "bot_name", "help": "Specify the name that will be displayed as the sender of this message.", "type": "string", "label": "Bot Display Name", "required": true, "placeholder": "Enter the bot's display name", "defaultValue": "viaSocket" },
      { "key": "customIcon", "help": "Choose whether to use a custom icon for the bot.", "type": "boolean", "label": "Use a Custom Icon for the Bot", "options": [ { "label": "Yes", "value": true }, { "label": "No", "value": false } ], "required": false, "defaultValue": { "label": "Yes", "value": true } },
      { "key": "icon_type", "help": "Select the type of custom icon for the bot", "type": "dropdown", "label": "Custom Icon Type", "options": [ { "label": "Emoji", "value": "emoji" }, { "label": "Image URL", "value": "url" } ], "required": false, "defaultValue": { "label": "Image URL", "value": "url" }, "visibilityCondition": "context.inputData.bot_details.customIcon === true" },
      { "key": "emoji", "help": "Provide the emoji code, e.g., :smile:.", "type": "string", "label": "Emoji Code", "required": true, "placeholder": "Enter emoji code", "visibilityCondition": "context.inputData.bot_details.icon_type === 'emoji'" },
      { "key": "url", "help": "Provide the URL of the image to use as icon.", "type": "string", "label": "Icon Image URL", "required": false, "placeholder": "Enter icon image URL", "defaultValue": "https://stuff.thingsofbrand.com/viasocket.com/images/imgf_logo-2.png", "visibilityCondition": "context.inputData.bot_details.icon_type === 'url'" }
    ]
  },
  {
    "key": "isReplyMessage",
    "type": "boolean",
    "label": "Reply to a message?",
    "options": [ { "label": "Yes", "value": true }, { "label": "No", "value": false } ],
    "required": false,
    "defaultValue": { "label": "No", "value": false }
  },
  {
    "key": "thread_ts",
    "help": "Enter the timestamp of the message to reply to.",
    "type": "string",
    "label": "Reply Timestamp",
    "required": true,
    "placeholder": "Enter timestamp",
    "visibilityCondition": "context.inputData.isReplyMessage === true"
  },
  {
    "key": "reply_broadcast",
    "help": "Broadcast the reply to the entire channel?",
    "type": "boolean",
    "label": "Reply Broadcast",
    "options": [ { "label": "Yes", "value": true }, { "label": "No", "value": false } ],
    "required": false,
    "defaultValue": false,
    "visibilityCondition": "context.inputData.isReplyMessage === true"
  },
  {
    "key": "unfurl_links",
    "help": "Enable link previews?",
    "type": "boolean",
    "label": "Unfurl Links",
    "options": [ { "label": "Yes", "value": true }, { "label": "No", "value": false } ],
    "required": false
  },
  {
    "key": "unfurl_media",
    "help": "Enable media previews?",
    "type": "boolean",
    "label": "Unfurl Media",
    "options": [ { "label": "Yes", "value": true }, { "label": "No", "value": false } ],
    "required": false
  },
  {
    "key": "buttons",
    "help": "Add buttons to your message. Enter label as the key and the URL as the value.",
    "type": "dictionary",
    "label": "Buttons",
    "required": false,
    "template": {
      "key": { "help": "Enter Label.", "type": "string", "placeholder": "Click Me" },
      "value": { "help": "Enter the URL.", "type": "string", "placeholder": "https://www.example.com" }
    }
  }
]
```

**API Configuration Perform Code**
```javascript
try {
  const performApiUrl = context.inputData.isScheduledMessage === 'yes'
    ? 'https://slack.com/api/chat.scheduleMessage'
    : 'https://slack.com/api/chat.postMessage';

  // STRICT DATE -> UNIX (YYYY-MM-DD HH:mm), input treated as IST
  const toUnixTimestamp = (input) => {
    if (!input) throw new Error('post_at is required');
    const match = input.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
    if (!match) { throw new Error('Invalid date format. Use YYYY-MM-DD HH:mm (IST)'); }
    const [, year, month, day, hour, minute] = match;
    const utcMillis = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour) - 5, Number(minute) - 30, 0);
    if (isNaN(utcMillis)) { throw new Error('Invalid date value'); }
    return Math.floor(utcMillis / 1000);
  };

  const normalizeIds = (input) => {
    if (!input) return [];
    if (Array.isArray(input)) {
      return input.flatMap((item) => {
        if (typeof item === "string") { return item.split(","); }
        if (typeof item === "object" && item?.value) { return item.value.split(","); }
        return [];
      }).map((v) => v.trim()).filter(Boolean);
    }
    if (typeof input === "string") {
      return input.split(",").map((v) => v.trim()).filter(Boolean);
    }
    return [];
  };

  const targetType = context.inputData.messageto;
  const responses = [];

  // BUTTONS -> attachments
  const actions = Object.entries(context.inputData.buttons || {}).map(([key, url], index) => ({
    type: "button",
    text: key.charAt(0).toUpperCase() + key.slice(1),
    url,
    style: index % 2 === 0 ? "primary" : "danger"
  }));
  const attachmentjson = actions.length ? [{ fallback: "Buttons", color: "#36a64f", attachment_type: "default", actions }] : undefined;

  // MENTIONS (channel only)
  let mentionPrefix = "";
  if (targetType === 'channel') {
    const notifyType = context.inputData.notification_type || 'none';
    if (notifyType === 'channel') {
      mentionPrefix = "<!channel>\n\n";
    } else if (notifyType === 'specific') {
      const tagged = normalizeIds(context.inputData.tagged_users);
      if (tagged.length) { mentionPrefix = tagged.map(id => `<@${id}>`).join(" ") + "\n\n"; }
    }
  }

  const sendMessage = async (channel) => {
    const data = {
      channel,
      text: mentionPrefix + context.inputData.content,
      attachments: attachmentjson,
      unfurl_links: context.inputData.unfurl_links,
      unfurl_media: context.inputData.unfurl_media,
      post_at: context.inputData.isScheduledMessage === 'yes' ? toUnixTimestamp(context.inputData.post_at) : undefined,
      as_user: false
    };
    if (context.inputData.bot_details?.bot_name) { data.username = context.inputData.bot_details.bot_name; }
    if (context.inputData.bot_details?.customIcon === true) {
      if (context.inputData.bot_details?.icon_type === 'emoji' && context.inputData.bot_details?.emoji) {
        data.icon_emoji = context.inputData.bot_details.emoji;
      } else if (context.inputData.bot_details?.icon_type === 'url' && context.inputData.bot_details?.url) {
        data.icon_url = context.inputData.bot_details.url;
      }
    }
    const response = await axios.post(performApiUrl, data, {});
    if (!response.data.ok) { throw new Error(response.data.error); }
    return response.data;
  };

  // CHANNEL MODE
  if (targetType === 'channel') {
    const channels = normalizeIds(context.inputData.channel_id);
    if (!channels.length) { return { ok: false, error: 'no_channels_received' }; }
    for (const channel of channels) { responses.push(await sendMessage(channel)); }
  }

  // USER MODE
  if (targetType === 'user') {
    const users = normalizeIds(context.inputData.userId);
    if (!users.length) { return { ok: false, error: 'no_users_received' }; }
    for (const user of users) {
      const data = {
        channel: user,
        text: context.inputData.content,
        username: context.inputData.bot_details?.bot_name,
        icon_emoji: context.inputData.bot_details?.icon_type === 'emoji' ? context.inputData.bot_details.emoji : undefined,
        icon_url: context.inputData.bot_details?.icon_type === 'url' ? context.inputData.bot_details.url : undefined,
        unfurl_links: context.inputData.unfurl_links,
        unfurl_media: context.inputData.unfurl_media,
        attachments: attachmentjson,
        post_at: context.inputData.isScheduledMessage === 'yes' ? toUnixTimestamp(context.inputData.post_at) : undefined
      };
      const response = await axios.post(performApiUrl, data, {});
      if (!response.data.ok) { throw new Error(response.data.error); }
      responses.push(response.data);
    }
  }

  return responses.length === 1 ? responses[0] : responses;
} catch (error) {
  if (error?.response?.status === 429) {
    throw { success: false, status: 429, message: 'Too Many Requests' };
  }
  await errorComponent(error);
}
```

**UX Takeaways**
- Lead with a **target selector** (`messageto`) and branch everything else. Never show channel-only fields in DM mode and vice-versa.
- **Nest conditionals deeply but safely**: `customIcon` → `icon_type` → `emoji`/`url`. Each level's visibility references the exact parent value, including inside input groups (`context.inputData.bot_details.icon_type`).
- Push the same **default down the common path** (`notification_type` defaults to "no one", `isScheduledMessage` to "No") so a first-time user can send a message with almost no configuration.
- Use the **dictionary type** for open-ended key→value input (button label→URL) where the keys aren't known ahead of time.
- Accept both **array-of-objects and comma-separated strings** in ID fields and normalize in code — the field may arrive either way depending on select vs custom-input mode.

## Slack — Schedule Message

**Metadata**
- **App:** Slack · **Category:** Communication · **Action:** Schedule a Message · **Action Type:** Composite (scheduling variant)
- *(Documented from design notes; superseded in practice by the `isScheduledMessage` toggle inside Send Message above.)*

**Supporting API Usage**
- **conversations.list** — channel dropdown. **chat.scheduleMessage** — the send endpoint. `post_at` requires a UNIX timestamp.

**UX Components & Field Design**
- **Dynamic Dropdown — Channel** (from conversations.list), **String — Message Text**, **String — Post Time** (date-time entered as a string, converted to UNIX epoch in code).

---

# SCHEDULED TRIGGER Examples

## Google Calendar — New Upcoming Events (Scheduled Trigger)

### Rationale
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

### Input Fields JSON
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

### Perform Code
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

### Rationale
- **Category:** SCHEDULED TRIGGER (Polling)
- **Use Case:** Polls Google Calendar for upcoming events that contain Google Meet video conference links and start within a user-defined relative time offset in the future (`meetingBefore` minutes from execution time).
- **UX Highlights:**
  - **Multiselect Resource Picker (`calendarId`):** Allows selecting one or multiple calendars to monitor for Google Meet links.
  - **Relative Time Offset (`meetingBefore`):** Asks user how many minutes before the meeting start time to trigger the workflow.
  - **Contextual Help (`help_schedule_info`):** Gated by `visibilityCondition: "context?.inputData?.meetingBefore !== undefined"`, explaining that the trigger polls every 5 minutes and catches events starting between `meetingBefore` and `meetingBefore + 5` minutes from execution time.
  - **Execution Time Snapping (`__executionStartTime__`):** Snaps execution start time to the nearest 5-minute mark (`Math.round(minutes / 5) * 5`) to handle cron drift across polling runs.
  - **Expanded Google Meet Detection:** Checks for Google Meet links across `conferenceData.entryPoints`, `location`, and `description` using regex (`/meet\.google\.com/i`).
  - **Strict Boundary Check:** Ensures `eventStartMs >= windowStartMs && eventStartMs < windowEndMs` to guarantee exactly 1 execution tick per meeting without duplicate triggers.

### Input Fields JSON
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

### Perform Code
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


---
# Advanced Best Approaches for Actions

 

## Action - Insert or Update Data with Linking Module (Sangam CRM)

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

## Create an Invoice with Customer Details (Razorpay)

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

## Create or Update a Lead (LeadSquared)


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

## List all Employees (Keka)


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

## Send Message (Slack)

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

## Cin7 Core — Update Customer (Advanced)

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

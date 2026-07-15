---
type: page
title: "UX Worked Examples Knowledge Base"
description: "Real-world worked examples of viaSocket plug actions, organized by action category. Each example pairs the UX rationale (supporting API usage, UI components, field-design reasoning) with the concrete implementation (input fields JSON + perform code) so the AI can pattern-match when building and reviewing action UIs. Companion to the UX Practices Knowledge Base (theory/rules) and the Perform Code Knowledge Base (code patterns)."
published: true
---
# UX Worked Examples Knowledge Base Page Index

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
- LIST Examples
  - Keka — List All Employees
- FIND / SEARCH Examples
  - LeadSquared — Search Leads by Criteria
  - GoHighLevel — Add Tags on Contact
  - Gmail — Add Label to Email
  - ActiveCampaign — Add or Remove Tag on Contact
- GET Examples
  - LeadSquared — Get Lead by ID
- FIND OR CREATE (Upsert) Examples
  - LeadSquared — Create or Update Lead
- Composite / Advanced Action Examples
  - Slack — Send Message
  - Slack — Schedule Message
- Cross-Cutting UX Patterns (Extracted)

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

**UX Takeaways**
- Prefer folding a "scheduled?" behavior into the main action as a boolean/dropdown toggle (as Send Message does) rather than shipping a separate near-duplicate action. Consolidation over fragmentation.
- Always take date/time as a friendly string and convert to the API's required epoch format in perform code.

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

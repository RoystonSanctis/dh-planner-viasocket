---
title: "DH Knowledge Base (Consolidated)"
description: "Single-shot consolidated knowledge base for viaSocket plug design."
---

# Page Index
Plug Anatomy · Design Principles · Naming · UX Field Ordering · Category Best Practices · Field Types · Minimalism · Visibility · dependsOn vs visibilityCondition · Perform Code · Code Block Execution Timing · Code Skeletons · Reusable Components · Generator Returns · Review

# Plug Anatomy
Triggers + Actions. Each = Input Fields (UI) + Perform Code.

## Triggers

### Instant Trigger
Input Fields (UI) + 5 code blocks:
- **Subscribe** — register webhook with external service; return subscription data (stored for unsub).
- **Sample** — fetch latest 1 item, else fallback `{viasocket_help, ...schema}` for UI preview.
- **Perform (modify)** — optional; reshape webhook payload before sending to flow.
- **Unsubscribe** — deregister webhook using stored subscribe response.
- **Transfer** — bulk-pull historical data, ≤200/page (New-event triggers only).

### Scheduled Trigger
Input Fields (UI) + 3 code blocks:
- **Sample** — fetch latest 1 item, else schema-based fallback for UI preview.
- **Perform (polling logic)** — poll API, filter by `scheduledTime` window, sort oldest-first, manage `paginationData`.
- **Transfer** — bulk-pull historical data, ≤200/page (New-event triggers only).

### Manual Trigger
Input Fields (UI) + 2 code blocks:
- **Sample** — hardcoded sample schema for UI preview.
- **Perform (modify)** — optional; reshape user-provided data before sending to flow. No API call.

## Actions
Input Fields (UI) + 1 Perform code block — single API call mapped from `context.inputData`.
Categories: GET · LIST · FIND/SEARCH · CREATE · UPDATE · FIND OR CREATE · DELETE.

# Design Principles
- Official API docs override user cURL.
- Hide raw IDs behind labels; stable IDs (email/external_id/sku) > volatile DB IDs.
- Find+List → Unified Search. Create+Update → Intelligent Upsert (search-first).
- UPDATE: send only filled fields; never overwrite with null/'' unless explicit clear.
- Idempotent: state duplicate-prevention key per action; safe across 1000+ runs.
- Dropdown only if dataset is small/stable/paginated. Else string ID.
- Many optionals → Multiselect chooser → Dynamic Input Group.
- Large nested responses → Basic/Detailed mode.

# Naming
| Item | Format |
|---|---|
| Action name | Verb + Title Case |
| Action desc | ≤30 chars |
| Trigger name | Event phrase, no "when", present tense, Title Case. Avoid list/fetch/sync/pull/search. |
| Trigger desc | `Runs when <event>`, ≤30 chars |

App name only if generic without it. Preserve compliant existing names on update.

# UX Field Ordering
Required first. Emit raw `inputFields` only; ignore auto-gen `steps`/`blocks`.

| Category | Order |
|---|---|
| Instant | DynDropdown(resource) → whereClause Group? → DynHelp(perm check)? → conditionals |
| Scheduled | Dropdown → Dropdown(dep) → Boolean → Multiselect(filter) → Group(pagination) → AIField |
| Manual | HelpStatic(setup) → inputs → Dropdown? |
| GET | Dropdown(parent) → Dropdown/String(ID) → Multiselect(return) → Group? |
| LIST | Dropdown(parent) → Multiselect(return) → Group(pagination) → AIField → Boolean |
| FIND/SEARCH | Dropdown(parent) → Dropdown(child) → Boolean(Basic/Adv) → Group(filter) → Group(sort/limit) → Multiselect |
| CREATE | Dropdown(parent) → Dropdown(child) → Boolean → Multiselect(chooser) → DynGroup → AIField/Dictionary |
| UPDATE | Dropdown(parent) → Dropdown(child) → Dropdown/String(ID) → Multiselect(chooser) → DynGroup |
| FIND OR CREATE | Dropdown(parent) → Dropdown(child) → Group(search) → Boolean `create_if_not_found`(default true) → DynGroup(if create) → Multiselect |
| DELETE | Dropdown(parent) → Dropdown(child) → Dropdown/String(ID) → HelpStatic(warning) |

# Category Best Practices
| Category | Tips |
|---|---|
| Instant | DynHelp validates permissions after resource pick. whereClause renders multi-filter as readable sentence. |
| Scheduled | Cascade dropdowns via `visibilityCondition`. Reusable components in `optionsGenerator`. Default page limit 100. AIField + `suggestionGenerator(schema)` for query syntax. |
| Manual | Lead with HelpStatic — numbered webhook setup steps (HTML formatting). |
| GET | Manual ID triplet: `customHelp` + `customInputLabel` + `customPlaceholder` for paste-from-prior-step. |
| LIST | Always offer Multiselect for return columns. Group pagination in static Input Group. |
| FIND/SEARCH | Boolean toggles Basic (column + value) vs Advanced (AIField with schema `suggestionGenerator`). |
| CREATE | Multiselect chooser before DynGroup. `fieldsGenerator` returns `{message:'Select X first.'}` if deps missing. |
| UPDATE | Chooser feeds DynGroup. Help: "unfilled fields remain unchanged." |
| FIND OR CREATE | Visually split Find vs Create groups. DynGroup `visibilityCondition` on `create_if_not_found`. |
| DELETE | Keep minimal. HelpStatic warns on irreversibility. Archive toggle if API supports. |

# Field Types
Base every field: `key` (unique, no `.`) · `type` · `label`. Optional keys per Minimalism.

| `type` | Required keys (beyond base) | Constraints |
|---|---|---|
| `string` `number` `html` `markdown` | — | `list:true` for array; `limit:N` requires `list:true` |
| `dictionary` | `template` | Fixed: `template:{key:{type:string,placeholder},value:{type:string,placeholder}}` |
| `boolean` | `options` | Exactly 2 options, true-option first. `defaultValue:{label,value}` |
| `dropdown`/`multiselect` static | `options:[{label,value,sample?,extraValue?}]` | — |
| `dropdown` dynamic | `optionsGenerator`, `customPlaceholder` | `canPaginate?`, `enableSearchApi?`. `__searchText` available when search enabled. |
| `multiselect` dynamic | `optionsGenerator`, `customPlaceholder` | `customPlaceholder` shows array example (e.g. `["A","B"]`) |
| `aifield` | `prompt`, `suggestionGenerator` | `suggestionGenerator` mandatory key — pass `""` if unused |
| `help` static | `help` | Only `key`+`type`+`help`. No label/required/placeholder. |
| `help` dynamic | `source` | `source` JS returns `{message}` |
| `input groups` static | `fields` | `whereClause:true` → children MUST be dropdown/multiselect recommended (inline sentence UI) |
| `input groups` dynamic | `fieldsGenerator` | Returns field array or `{message}` if deps missing. Normalize generated keys `.`→`_` |

**Options metadata** (dropdown/multiselect):
- `sample` MUST equal `value`. Include only if `value` is an ID and ≠ `label`.
- `extraValue` = hidden metadata. Access: `context?.inputData?.{key}_extraValue` (nest group keys).

**Visibility + required**: visibility wins; hidden required = skipped. Optional parent revealing required child → child `required:true` + guard in perform code.

# Minimalism
Include keys only when they add information not already implied by label + context (specific app + specific action).
- `help` — only if `label` is ambiguous.
- `placeholder` — only if format isn't obvious from label.
- `customHelp` / `customInputLabel` / `customPlaceholder` — only if manual-input value isn't obvious (e.g. where to find an ID).
- `defaultValue` — only if a sensible default exists.
- `visibilityCondition` — only if conditional.
- `sample` — only if `value` is an ID and ≠ `label`.
- `required` — defaults false; set true only when mandatory.

# Visibility
JS expression on `context?.inputData?.<path>`.

| On | Pattern |
|---|---|
| Multiselect any | `Array.isArray(context?.inputData?.k) && context.inputData.k.length > 0` |
| Multiselect value | `context?.inputData?.k?.includes('A')` |
| String/Dropdown eq | `context?.inputData?.k === 'v'` |
| String/Dropdown in | `['A','B'].includes(context?.inputData?.k)` |
| Boolean t/f | `context?.inputData?.k` / `!context?.inputData?.k` |
| In group | `context?.inputData?.group?.k` |
| `extraValue` | `context?.inputData?.k_extraValue === 'x'` |
| Calc | `(context?.inputData?.a * context?.inputData?.b) > 100` |

# dependsOn vs visibilityCondition
`dependsOn` is auto-populated from references inside `optionsGenerator` / `fieldsGenerator` / `suggestionGenerator`. Never write it manually. `visibilityCondition` does NOT populate it. Static fields have empty `dependsOn`.

# Perform Code
```javascript
async function fnName() {
  try { /* logic */ }
  catch (error) { await errorComponent(error); } // or `throw error`
}
return await fnName();
```

- No `import`/`require`. `axios`/`fetch` only. Auth handled by viaSocket.
- Validate every `required:true` field at top; throw before API call if missing/empty/null.
- Return `response.data`. Don't reshape, don't add fields.
- `catch` throws raw error. Throw on 200-with-error-body. No `console.log`.
- Handle API rate limits in loops (delays / retry / headers).

## Libraries
Direct, no import: `axios` `fetch`(node-fetch) `https` `crypto` `setTimeout` `Buffer` `atob` `FormData`(form-data) `jwt`(jsonwebtoken) `_`(lodash) `cheerio` `moment` `XMLParser` `XMLBuilder` `XMLValidator`.

## Globals
| Global | Where valid |
|---|---|
| `__executionStartTime__` | Scheduled Perform — current run timestamp |
| `context.inputData.scheduledTime` | Scheduled — interval (min) |
| `context.paginationData` | Scheduled cursor across runs. Initial `0`/`null`. Update only if (filtered non-empty) AND (API returned next token). Auto-breaks on repeated token. |
| `context.paginateData['<fieldKey>']` | Dynamic Dropdown/Multiselect `optionsGenerator`. Nest group keys: `['group.field']`. |
| `__searchText` | Same generators when `enableSearchApi:true` |
| `context.inputData.transferOption.offset` | Transfer Code |
| `context.inputData.hookUrl`, `_scriptId` | Instant Subscribe |
| `context.inputData.performsubscribe` | Instant Unsubscribe (= subscribe response) |

# Code Block Execution Timing
| Block | Fires when |
|---|---|
| Subscribe | Flow publish · status → active · trigger config changed (new config) |
| Unsubscribe | Flow trashed · status → inactive · trigger config changed (old config) |
| Sample | Test button |
| Perform(modify) | After Sample on Test; on actual webhook in production |
| Perform (Scheduled/Manual/Action) | Each scheduled tick / flow run. Return array → flow auto-iterates per-item. |
| Transfer | Transfer button |

# Code Skeletons

## Instant Subscribe
```javascript
async (context) => {
  try {
    const data = {
      hookUrl: context?.inputData?.hookUrl,
      event: "<event_name>"
      // + other context.inputData fields
    };
    const res = await axios.request({
      method: "post",
      url: "<api_base_url>/<subscribe_endpoint>",
      headers: { "Content-Type": "application/json" },
      data
    });
    return res.data; // stored for unsub
  } catch (e) { throw e; }
}
```

## Instant Unsubscribe
```javascript
async (context) => {
  try {
    const subId = context?.inputData?.performsubscribe?.id;
    await axios.request({
      method: "delete",
      url: `<api_base_url>/<unsubscribe_endpoint>/${subId}`
    });
  } catch (e) { throw e; }
}
```

## Instant Sample (with fallback)
```javascript
async (context) => {
  try {
    const res = await axios.get(`<api_base_url>/<resource>`, {
      params: { limit: 1, sort: "created_at:desc" }
    });
    const items = res.data?.results || res.data || [];
    if (items.length) return items[0];
    return {
      viasocket_help: "Sample data. Publish to receive real events.",
      id: "sample_id",
      created_at: new Date().toISOString()
      // + all expected schema keys with empty/default values
    };
  } catch (e) { throw e; }
}
```

## Transfer (Instant or Scheduled, "New" event only)
```javascript
try {
  const offset = context?.inputData?.transferOption?.offset || null;
  const params = { limit: 100 }; // ≤200
  if (offset) params.cursor = offset;
  const res = await axios.request({
    method: "GET",
    url: "<api_base_url>/<endpoint>",
    params
  });
  return {
    data: res.data?.results || [],
    offset: res.data?.next_cursor || null,
    uniqueIdentifier: "id"
  };
} catch (e) { throw e; }
```

## Scheduled Perform — Native API filter (preferred)
```javascript
async function run() {
  try {
    const minutes = context?.inputData?.scheduledTime || 15;
    const timeAgo = new Date(__executionStartTime__ - minutes * 60 * 1000);
    // Format per API spec (e.g. "YYYY-MM-DD HH:mm:ss"):
    const timeAgoStr = timeAgo.toISOString().replace('T', ' ').slice(0, 19);
    const page = context?.paginationData || 1;
    const res = await axios.get("<api_base_url>/<endpoint>", {
      params: { page, page_size: 50, created_at_min: timeAgoStr }
    });
    const items = res.data || [];
    if (items.length) context.paginationData = page + 1;
    return items;
  } catch (e) { throw e; }
}
return await run();
```

## Scheduled Perform — Client-side filter + pagination
```javascript
async function run() {
  try {
    const minutes = context?.inputData?.scheduledTime || 15;
    const timeAgo = new Date(__executionStartTime__ - minutes * 60 * 1000);
    const payload = { page_size: 100 };
    if (context?.paginationData) payload.cursor = context.paginationData;
    const res = await axios.request({
      method: "POST",
      url: "<api_base_url>/<endpoint>",
      data: payload
    });
    const all = res.data?.items || [];
    let filtered = all.filter(i => new Date(i.created_time) >= timeAgo);
    filtered.sort((a, b) => new Date(a.created_time) - new Date(b.created_time));
    if (filtered.length && res.data?.next_cursor) {
      context.paginationData = res.data.next_cursor;
    }
    return filtered;
  } catch (e) { throw e; }
}
return await run();
```

## Scheduled Sample (with schema fallback)
```javascript
try {
  const res = await axios.get("<api_base_url>/<endpoint>", {
    params: { limit: 1, sort: "descending" }
  });
  const items = res.data?.items || [];
  if (items.length) return { viasocket_help: "Latest real item.", ...items[0] };

  // Fallback: fetch schema, build empty record
  const schema = (await axios.get("<api_base_url>/<schema_endpoint>")).data;
  const dummy = {};
  for (const [k, v] of Object.entries(schema.properties)) {
    dummy[k] = ['array', 'multi_select'].includes(v.type) ? []
             : v.type === 'boolean' ? false
             : v.type === 'number' ? 0
             : '';
  }
  return { viasocket_help: "Sample only. Publish to see real data.", id: "dummy", properties: dummy };
} catch (e) { throw e; }
```

## Manual Perform / Sample
```javascript
// Perform
async (context) => {
  try {
    const res = await axios.get(`<api_base_url>/<endpoint>`, {
      params: { /* map context.inputData */ }
    });
    return res.data;
  } catch (e) { throw e; }
}

// Sample
async (context) => {
  try { return [{ id: 'sample_id', created_at: new Date().toISOString() }]; }
  catch (e) { throw e; }
}
```

## Action: Read by ID
```javascript
try {
  const id = context?.inputData?.record_id;
  if (!id) throw new Error('record_id is required.');
  const res = await axios.get(`<api_base_url>/resources/${id}`);
  return res?.data;
} catch (e) { throw e; }
```

## Action: List with pagination
```javascript
try {
  const res = await axios.get(`<api_base_url>/resources`, {
    params: {
      page_size: context?.inputData?.page_limit?.size || 100,
      cursor: context?.inputData?.page_limit?.cursor
    }
  });
  return res.data;
} catch (e) { throw e; }
```

## Action: Find / Search
```javascript
try {
  const query = context?.inputData?.query;
  if (!query) throw new Error('query is required.');
  const res = await axios.get(`<api_base_url>/resources`, {
    params: { q: query } // native search if supported
  });
  // Client fallback if API doesn't search:
  // return res.data?.find(r => r.id === query) || { success: true, results: [] };
  return res.data;
} catch (e) { throw e; }
```

## Action: Create
```javascript
try {
  const title = context?.inputData?.title;
  if (!title) throw new Error('title is required.');
  const payload = { title /* + other inputData fields */ };
  const res = await axios.post(`<api_base_url>/resources`, payload);
  return res?.data;
} catch (e) { throw e; }
```

## Action: Update (partial payload)
```javascript
try {
  const id = context?.inputData?.record_id;
  if (!id) throw new Error('record_id is required.');
  const payload = {};
  const skip = ['record_id'];
  for (const k of Object.keys(context?.inputData || {})) {
    if (skip.includes(k)) continue;
    const v = context.inputData[k];
    if (v !== undefined && v !== null && v !== '') payload[k] = v;
  }
  const res = await axios.patch(`<api_base_url>/resources/${id}`, payload);
  return res?.data;
} catch (e) { throw e; }
```

## Action: Find or Create
```javascript
try {
  const id = context?.inputData?.record_id;
  if (!id) throw new Error('record_id is required.');
  let res = await axios.get(`<api_base_url>/resources/${id}`);
  if (res.data) return res.data;
  res = await axios.post(`<api_base_url>/resources`, {
    record_id: id /* + other create fields */
  });
  return res.data;
} catch (e) { throw e; }
```

## Action: Delete / Archive
```javascript
try {
  const id = context?.inputData?.record_id;
  if (!id) throw new Error('record_id is required.');
  // DELETE, or PATCH/POST for archive-style services:
  const res = await axios.delete(`<api_base_url>/resources/${id}`);
  return res?.data || { id, deleted: true };
} catch (e) { throw e; }
```

# Reusable Components
JS stored once, invoked from `optionsGenerator` / `fieldsGenerator` / `suggestionGenerator`.

- Unique name (permanent once referenced).
- Accept all dependent inputs as **parameters**. Never read `context.inputData` / `__searchText` / `context.paginateData` directly inside — breaks `dependsOn` auto-detection.
- `try/catch` + input validation at top.
- Return matches host field shape.

Template:
```javascript
// fetchResources(searchText, pageToken, pageSize)
if (!pageSize) throw new Error('pageSize required');
try {
  const res = await axios.get('<api_base_url>/<endpoint>', {
    params: { q: searchText, cursor: pageToken, limit: pageSize }
  });
  return {
    data: (res.data?.items || []).map(i => ({ label: i.name, value: i.id, sample: i.id })),
    offset: res.data?.next_cursor || null
  };
} catch (e) { throw e; }
```

Caller (inside `optionsGenerator`):
```javascript
return await fetchResources(__searchText, context?.paginateData?.['my_field'], 100);
```

# Generator Returns
| Generator | Return |
|---|---|
| `optionsGenerator` standard | `[{label, value, sample?, extraValue?}]` |
| `optionsGenerator` paginated (`canPaginate:true`) | `{data, offset: string\|number\|null}` |
| `optionsGenerator` empty/info | `{message}` (or hybrid `{data, offset, message}`) |
| `fieldsGenerator` | field-object array, or `{message}` if deps missing |
| `suggestionGenerator` | schema/context shape AI can consume |
| Dyn help `source` | `{message}` |

# Review
- **Perform**: wrapper · `axios`/`fetch` · `context.inputData.<key>` mapped · endpoint matches docs · rate-limit handled · required-field guards · no auth · throws raw error.
- **Fields**: matches type's required keys · only `inputFields` (no `steps`/`blocks`) · `sample`==`value` rule applied · reusable component `id` mapped correctly.
- **Output**: raw `inputFields` array, never `{"inputFields":[...]}`.

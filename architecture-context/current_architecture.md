# DH Planner — Current Architecture

> Reference document describing the current multi-agent pipeline that turns a user's
> integration request into a created or improved ViaSocket **plug** (app, actions, triggers).
> Use this file for context on agent roles, their pre-context calls, inputs, tools, and outputs.

---

## Table of Contents

- [Pipeline Overview](#pipeline-overview)
- [Stage 1 — Request Analyser](#stage-1--request-analyser)
- [Branch A — New App](#branch-a--new-app)
  - [A.1 Connection Agent](#a1-connection-agent)
  - [A.2 Bulk List Actions](#a2-bulk-list-actions)
  - [A.3 DH Planner (Create)](#a3-dh-planner-create)
- [Branch B — Existing Improvement](#branch-b--existing-improvement)
  - [B.1 DH Planner (Update)](#b1-dh-planner-update)
- [Review Stage — DH Review Agent](#review-stage--dh-review-agent)
- [Tool Schemas](#tool-schemas)
  - [request_integration_jsonSchema](#request_integration_jsonschema)
  - [generate_actions_and_triggers](#generate_actions_and_triggers)
  - [reviewer_schema](#reviewer_schema)
- [Glossary](#glossary)
- [Known Gaps](#known-gaps)

---

## Pipeline Overview

A user request enters the **Request Analyser**, which classifies it as either a **New App** or
an **Existing Improvement**. The classification determines which downstream agent chain runs.

```text
User Request
     │
     ▼
┌─────────────────────┐
│  Request Analyser   │  → App Name, Request Type, API Doc, Final Requirement
└─────────┬───────────┘
          │
   ┌──────┴───────────────────────────┐
   │                                  │
   ▼ Request Type = "New APP"         ▼ Request Type = "Existing Improvement"
┌──────────────────────┐          ┌──────────────────────┐
│ a. Connection Agent  │          │ a. DH Planner        │
│    → Connection ID   │          │    (Update Plug)     │
└─────────┬────────────┘          └──────────┬───────────┘
          ▼                                  │
┌──────────────────────┐                     │
│ b. Bulk LIST Actions │                     │
│    → Action list     │                     │
└─────────┬────────────┘                     │
          ▼                                  │
┌──────────────────────┐                     │
│ c. DH Planner        │                     │
│    (Create Plug)     │                     │
└─────────┬────────────┘                     │
          │                                  │
          └──────────────┬───────────────────┘
                         ▼
             ┌──────────────────────┐
             │   DH Review Agent    │  → approved, score, issues,
             │   (reviewer_schema)  │    revised input JSON + perform code
             └──────────┬───────────┘
                        ▼
              Action Name / Description /
              Summary of creation or improvement
```

| Request Type | Agent Chain |
| --- | --- |
| `New APP` | Connection Agent → Bulk LIST Actions → DH Planner (Create) → DH Review Agent |
| `Existing Improvement` | DH Planner (Update) → DH Review Agent |

> ⚠️ The review stage is **advisory**, not a gate: it returns `approved` and a `score`, but nothing
> in the current pipeline blocks on them. See [Known Gaps](#known-gaps).

---

## Stage 1 — Request Analyser

Entry point for every request. Determines whether the work is a brand-new app integration or an
improvement to an existing plug, and resolves the API documentation to be used downstream.

### Pre Context

- Search App
- List Existing Actions/Triggers *(only if Improvement)*
- Get Plug Details *(only if Improvement)*

### Input

| Field | Required | Notes |
| --- | --- | --- |
| `use case` | ✅ Required | What the user wants to accomplish |
| `app name` | ✅ Required | Target application |
| `doc url` | ⬜ Optional | API documentation URL, if the user supplies one |

### Tools

- Web search — analyse API document
- Create Plug

### Output

| Field | Notes |
| --- | --- |
| App Name | Resolved application name |
| Request Type | One of: `New APP`, `Existing Improvement` |
| API Document | Resolved API documentation reference |
| Action Name | Only for `Existing Improvement` |
| Final User Requirement | Normalised requirement (New or Improvement) |

---

## Branch A — New App

Runs when `Request Type = "New APP"`. Three agents execute in order: **a → b → c**.

### A.1 Connection Agent

Establishes authentication for the new plug.

#### Pre Context

- List Connection

#### Input

| Field | Notes |
| --- | --- |
| App Details | Plugin ID |
| API Documentation | Auth-relevant portions of the doc |

#### Tools

- Web search — analyse API document
- Create Connection

#### Output

| Field | Notes |
| --- | --- |
| Connection Details | Connection ID |

---

### A.2 Bulk List Actions

Enumerates the full candidate set of actions and triggers for the app from its API documentation.
Emits its result via the [`generate_actions_and_triggers`](#generate_actions_and_triggers) schema.

#### Pre Context

1. Get Plugin Details
2. List Existing Actions/Triggers

#### Input

1. Plugin ID

#### Tools

1. Web search — analyse API document

#### Output

1. Action Name
2. Action Description
3. Action Type — one of: `action`, `trigger`
4. API Documentation

---

### A.3 DH Planner (Create)

Creates the actual actions and triggers on the plug.

#### Pre Context

- List Connection
- Get Plugin Details
- List Existing Actions/Triggers

#### Input

| Field | Notes |
| --- | --- |
| Plugin ID | Target plug |
| Connection ID | From [A.1 Connection Agent](#a1-connection-agent) |
| LIST Trigger/Action to create | From [A.2 Bulk List Actions](#a2-bulk-list-actions) |
| API Document | Resolved documentation |

#### Tools

- Web search — analyse API document
- Create Plug

#### Output

| Field | Notes |
| --- | --- |
| Action Name | Created action/trigger name |
| Action Description | Created action/trigger description |
| Summary of the creation | Human-readable recap |

---

## Branch B — Existing Improvement

Runs when `Request Type = "Existing Improvement"`. A single agent executes.

### B.1 DH Planner (Update)

Applies the requested improvement to an existing action version.

#### Pre Context

- List Connection
- Get Plugin Details
- Get Existing Action Version Details
- List Existing Actions/Triggers

#### Input

| Field | Notes |
| --- | --- |
| Plugin ID | Existing plug |
| Connection ID | Existing connection |
| Action ID | Action being improved |
| Action Version ID | Specific version being improved |
| User Improvement | Normalised requirement from the Request Analyser |
| API Documentation | Resolved documentation |

#### Tools

- Web search — analyse API document
- Update Plug

#### Output

| Field | Notes |
| --- | --- |
| Action Name | Updated action/trigger name |
| Action Description | Updated action/trigger description |
| Summary of Improvement | Human-readable recap of what changed |

---

## Review Stage — DH Review Agent

Reviews the artifacts produced by the DH Planner — the **input fields JSON** and the **perform
code** — and returns a verdict plus a fully revised version of both. Emits its result via the
[`reviewer_schema`](#reviewer_schema).

Runs on both branches, after the planner has created or updated the action version.

### Pre Context

- List Connection
- Get Plugin Details
- Get Existing Action Version Details
- List Existing Actions/Triggers

### Input

| Field | Notes |
| --- | --- |
| Plugin ID | Plug containing the action under review |
| Connection ID | Connection used by the action |
| Action ID | Action under review |
| Action Version ID | Specific version under review |
| User Review Instruction | What the reviewer should focus on |
| API Documentation | Evidence the review is checked against |

### Tools

*None currently declared.* The agent reviews from pre-context and the supplied API documentation
only — it does not web-search or execute the action. See [Known Gaps](#known-gaps).

### Output

| Field | Notes |
| --- | --- |
| Updated Perform code | `revisedPerformCode` |
| Updated JSON builder | `revisedInputFields` |
| Summary of Improvement/review | Carried in `review`, `issues` and `score` |

---

## Tool Schemas

### `request_integration_jsonSchema`

Final structured verdict returned for an integration request.

**Fields**

| Field | Type | Purpose |
| --- | --- | --- |
| `request_approved` | boolean | `true` if the request contains valid, actionable requirements; `false` for invalid/dummy/test/spam requests. On `false`, halt tool calls. |
| `has_error` | boolean | `true` if any tool call failed during the required step process. |
| `ai_review_notes` | string | Short, well-formatted summary of the verdict and reasoning. If `has_error` is `true`, name which steps succeeded and which failed or caused the halt. |
| `url` | string | Final generated URL (see URL rules below), or empty. |

**URL rules**

Provide a `url` in exactly two cases:

1. The plug already exists and is available in search with status `publish`, `unpublish`, or `integration_only`.
2. A new plug was created.

Leave `url` empty if the request is invalid, or if the API doc is unavailable and no app is found in search.

| Case | Format |
| --- | --- |
| New App created | `https://flow.viasocket.com/developer/<orgId>/plugin/<pluginId>/analytics` |
| New Action / New Trigger / Improvement | `https://flow.viasocket.com/developer/<orgId>/plugin/<pluginId>/<actionType>/<actionId>?versionId=<actionVersionRowId>` |

> ⚠️ **NEVER hallucinate IDs.** If an ID is missing, fall back to the analytics URL.

---

### `generate_actions_and_triggers`

Output schema for [A.2 Bulk List Actions](#a2-bulk-list-actions).

**Fields**

| Field | Type | Purpose |
| --- | --- | --- |
| `message` | string | Narrative preamble (see required opening below). |
| `action` | array | Workflow actions, ordered highest value first (P0 → P4). |
| `trigger` | array | Workflow triggers, ordered highest value first. |

**`message` must contain, in order**

1. The framing line: `This service exists to ___`
2. The core object vs. config object split
3. Documented rate limits
4. Findings
5. Duplicate variants dropped
6. Any endpoint skipped for lacking a documented response

If `action` or `trigger` is empty, explain why.

**`action[]` item conventions**

| Field | Convention |
| --- | --- |
| `name` | `[Verb] [Object]` in Title Case — e.g. `Create Data Source Item` |
| `description` | Must include `[Priority] [Type] [Category]` and Doc URL. Crisp API findings for the creation agent: method, path, required params, response shape, parent dropdown source if any. |

**`trigger[]` item conventions**

| Field | Convention |
| --- | --- |
| `name` | `[State Modifier] [Object]` — e.g. `New Document` |
| `description` | Must include `[Priority] [Trigger Type] [Category]` and Doc URL. Starts with `Runs when...`. Include event name, subscribe/unsubscribe endpoints, dedup field, signature scheme, and parent dropdown source. |

---

---

### `reviewer_schema`

Output schema for the [DH Review Agent](#review-stage--dh-review-agent).

**Fields**

| Field | Type | Purpose |
| --- | --- | --- |
| `approved` | boolean | `true` if the input JSON and perform code are production-ready and approved. |
| `issues` | array | Specific violations found. Each item: `severity`, `location`, `detail`. |
| `review` | array&lt;string&gt; | Positive validation notes. |
| `suggestions` | array | Suggested text fixes. Each item: `key`, `field`, `suggested`. |
| `revisedInputFields` | string | Full input fields JSON with suggested changes applied, **stringified**. |
| `revisedPerformCode` | string | Full perform code with fixes applied (or unchanged if no fixes). |
| `unverified` | array&lt;string&gt; | Things not confirmable — e.g. payload shape with no schema, undocumented response fields. |
| `score` | integer | Overall review score, `0`–`100`. |
| `testcases` | array | Up to 5 high-value manual test scenarios. Each item: `scenario`, `status`. |

All fields are **required**; `additionalProperties: false`; `strict: true`.

**`issues[]` item**

| Field | Type | Convention |
| --- | --- | --- |
| `severity` | enum | One of `P0`, `P1`, `P2`, `P3` — *severity*, distinct from the `P0`–`P4` **priority** scale used by [`generate_actions_and_triggers`](#generate_actions_and_triggers). |
| `location` | string | Where the issue was found — specific field key, object path, or line of code. |
| `detail` | string | Detailed description of the violation. |

**`suggestions[]` item**

| Field | Type | Convention |
| --- | --- | --- |
| `key` | string | The input field key the suggestion applies to. |
| `field` | enum | One of `help`, `label`, `placeholder`, `error`. |
| `suggested` | string | Replacement text. |

**`testcases[]` item**

| Field | Type | Convention |
| --- | --- | --- |
| `scenario` | string | Description of the manual test scenario. |
| `status` | enum | Expected outcome: `success` or `failed`. |

> Generated **only** when `approved` is `true` and no blocking issues exist. Test cases are
> *described* for manual verification — they are not executed by the pipeline.

## Glossary

| Term | Meaning |
| --- | --- |
| **Plug** | A ViaSocket integration unit for an app, containing its connection, actions, and triggers. |
| **Plugin ID** | Identifier of a plug within an organisation. |
| **Connection ID** | Identifier of the authentication configuration for a plug. |
| **Action** | A workflow step the user invokes (`actionType = action`). |
| **Trigger** | A workflow entry point fired by an external event (`actionType = trigger`). |
| **Action Version ID** | Identifier of a specific version of an action, used when improving an existing action. |
| **Pre Context** | Read-only calls an agent makes before reasoning, to ground itself in current state. |
| **P0 → P4** | *Priority* ordering for generated actions/triggers, highest value first (`generate_actions_and_triggers`). |
| **P0 → P3** | *Severity* of a review issue, most severe first (`reviewer_schema`). Different scale from the priority one above. |
| **Perform code** | The executable body of an action/trigger that calls the third-party API. |
| **Input fields JSON** | The declarative schema describing an action's user-facing input fields. |
| **Score** | Reviewer's 0–100 quality rating of an action version. Advisory only. |

---

## Known Gaps

Observations about the pipeline as currently defined. Recorded here so downstream agents do not
mistake absence for oversight.

| # | Gap | Consequence |
| --- | --- | --- |
| 1 | **Review is advisory, not a gate.** `approved` and `score` are returned, but no transition consumes them. | A version with `approved: false` can still ship. |
| 2 | **Reviewer has no tools.** No web search, no execution. | It checks the code against supplied text, never against live API behaviour. |
| 3 | **No live test stage.** `testcases` are prose for humans. | Nothing verifies the action actually works before release. |
| 4 | **Reviewer returns full rewrites** (`revisedInputFields`, `revisedPerformCode`). | Whole-artifact regeneration rather than targeted repair; no diff, no way to see what changed. |
| 5 | **No repair loop.** No path from reviewer output back to the planner. | Issues are reported, not resolved; no retry limit exists because no retry exists. |
| 6 | **Reviewer shares the planner's evidence.** Same API documentation, same pre-context. | Reviewer inherits the planner's mistakes; not an independent check. |
| 7 | **No persisted state between agents.** | A failure mid-chain restarts the whole request. |
| 8 | **Two conflicting `P` scales** — priority `P0–P4` and severity `P0–P3`. | Ambiguous when both appear in one payload. |
| 9 | **Connection Agent only runs on the New App branch.** | No path to add a missing auth scope to an existing plug. |
| 10 | **No publishing states.** `Create Plug` / `Update Plug` are terminal. | No Draft → Verified → Public progression, no approval record, no rollback. |

Target-state treatment of these gaps is in [target_architecture.md](./target_architecture.md).

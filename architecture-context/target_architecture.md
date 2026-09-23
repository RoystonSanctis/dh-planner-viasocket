# Target Architecture — viaSocket AI Plug Builder

> **Status:** Proposed / planned. This is the architecture we intend to move toward.
> The system as built today is documented separately in [current_architecture.md](./current_architecture.md).
> **Do not edit `current_architecture.md` to match this file** — the two are meant to be compared, not merged.
>
> This document doubles as the **audit brief**: the spec to build toward *and* the rubric to
> review the existing implementation against.

---

## Table of Contents

- [0. How to Use This Document](#0-how-to-use-this-document)
- [1. Role](#1-role)
- [2. Objective](#2-objective)
- [3. Finalized Architecture Decision](#3-finalized-architecture-decision)
- [4. Core State Machine](#4-core-state-machine)
- [5. Required Decision Logic](#5-required-decision-logic)
- [6. Stages](#6-stages)
  - [Stage 1 — Understand the Request](#stage-1--understand-the-request)
  - [Stage 2 — Capability Resolution](#stage-2--capability-resolution)
  - [Stage 3 — Evidence Collection](#stage-3--evidence-collection)
  - [Stage 4 — Component Construction](#stage-4--component-construction)
  - [Stage 5 — Testing and Validation](#stage-5--testing-and-validation)
  - [Stage 6 — Repair Loop](#stage-6--repair-loop)
  - [Stage 7 — Publishing](#stage-7--publishing)
  - [Stage 8 — Production Monitoring](#stage-8--production-monitoring)
- [7. Orchestration Requirements](#7-orchestration-requirements)
- [8. User Experience](#8-user-experience)
- [9. Architecture Principles](#9-architecture-principles)
- [10. Delta vs. Current Architecture](#10-delta-vs-current-architecture)
- [11. Audit Tasks](#11-audit-tasks)
- [12. Required Output Format](#12-required-output-format)
- [13. Review Rules](#13-review-rules)

---

## 0. How to Use This Document

| If you are… | Read |
| --- | --- |
| Building the system | [§3](#3-finalized-architecture-decision) → [§6](#6-stages) → [§7](#7-orchestration-requirements) |
| Auditing the system | [§9](#9-architecture-principles) → [§10](#10-delta-vs-current-architecture) → [§11](#11-audit-tasks) → [§12](#12-required-output-format) |
| Deciding scope of a change | [§5](#5-required-decision-logic) → [§10](#10-delta-vs-current-architecture) |

---

## 1. Role

Act as a **senior AI systems architect, integration-platform engineer and critical reviewer**.

Audit the current implementation of the viaSocket AI Plug Builder. **Do not assume the
architecture is correct because it already exists.** Inspect the actual code, prompts, schemas,
database state, execution logic, tests and UI wherever available.

**Do not modify the implementation unless explicitly asked.** First produce an evidence-based
architectural review.

---

## 2. Objective

Verify whether the Plug Builder can reliably create or modify viaSocket integrations across the
full surface area:

| # | Capability |
| --- | --- |
| 1 | New app / Plug creation |
| 2 | Existing Plug modification |
| 3 | Authentication creation |
| 4 | Authentication scope modification |
| 5 | Action creation |
| 6 | Action modification |
| 7 | Trigger creation |
| 8 | Dynamic input fields |
| 9 | Shared API components |
| 10 | Testing |
| 11 | Review |
| 12 | Repair |
| 13 | Versioning |
| 14 | Publishing |

The system must be reliable enough to create **production-quality** integrations without allowing
an AI agent to freely invent unsafe workflows.

---

## 3. Finalized Architecture Decision

> **The Plug Builder must use a fixed orchestration state machine with controlled dynamic
> branching. It must not use a completely unrestricted AI-generated workflow.**

### Division of authority

| The **platform** controls (deterministic) | The **AI** decides (dynamic, within bounds) |
| --- | --- |
| Available stages | Which existing capabilities can be reused |
| Valid transitions | Which components are missing |
| Security policies | Whether something should be created or modified |
| Required validation gates | Which fields, endpoints and mappings are required |
| Retry limits | Which approved branches should run |
| Human-intervention conditions | Which component caused a failure |
| Publishing permissions | What repair should be attempted |
| Versioning and rollback | — |

**Rule:** AI may *select and configure* approved steps. It must **not invent uncontrolled
execution stages.**

---

## 4. Core State Machine

```text
Receive request
   → Understand requirement
   → Resolve existing capabilities
   → Collect API evidence
   → Select required branches
   → Build or modify components
   → Generate tests
   → Validate
   → Run live test
   → Review
   → Repair failed component (if necessary)
   → Publish new version
   → Monitor production behaviour
```

Every stage boundary is a **checkpoint**: state is persisted, the transition is logged, and
execution can resume from it. See [§7](#7-orchestration-requirements).

---

## 5. Required Decision Logic

The implementation should behave approximately as follows:

```text
Normalize user request into a Capability Contract

Check whether the app exists
IF app does not exist
    Create app metadata
    Create shared API foundation

Check whether authentication exists
IF authentication does not exist
    Build authentication
ELSE IF required scopes are missing
    Create a new authentication version
    Request reconnection of the test account
ELSE
    Reuse existing authentication

Check whether the requested action or trigger exists
IF capability exists and already satisfies the request
    Reuse it
    Do not create a duplicate
ELSE IF capability exists but needs modification
    Create a new version
    Preserve backward compatibility where possible
    Run regression tests
ELSE
    Create the new action or trigger

Generate tests
Run deterministic validation
Run live API test
Run security validation
Run semantic review
Run regression tests

IF validation passes
    Move to publish approval
ELSE IF failure is repairable
    Send a structured defect to the responsible builder
    Repair only the affected component
    Run the relevant tests again
ELSE IF repeated failure, uncertainty or missing evidence
    Request human intervention

IF approved
    Publish a versioned release
```

---

## 6. Stages

### Stage 1 — Understand the Request

Convert the original request into a **typed Capability Contract**.

```json
{
  "app": "Razorpay",
  "capability": "Create Customer",
  "capability_type": "action",
  "required_inputs": ["name", "email", "phone"],
  "expected_outputs": ["customer_id"],
  "success_condition": "A customer is created and its ID is returned",
  "requested_change": "create"
}
```

The system must identify:

- Exact app
- Desired business capability
- Action, trigger or helper operation
- Required inputs
- Expected outputs
- Success condition
- Whether this is a **creation** or **modification** request
- Important ambiguity requiring user input

> ⛔ The system must **not** start implementation from vague text without creating this contract.

---

### Stage 2 — Capability Resolution

The system must search the existing viaSocket registry **before generating anything**.

It must determine:

- Does the Plug already exist?
- Does compatible authentication already exist?
- Are required authentication scopes available?
- Does the action or trigger already exist?
- Can an existing action be extended?
- Are reusable fields or helper operations available?
- Is there an existing pagination, webhook or error-handling component?
- Would this request create a duplicate capability?
- Which API version is currently being used?

Output — a structured **resolution report**:

```json
{
  "app_exists": true,
  "authentication_exists": true,
  "required_scopes_available": false,
  "capability_exists": false,
  "reusable_components": ["customer_dropdown", "base_api_client"],
  "required_work": ["modify_authentication", "create_action"]
}
```

---

### Stage 3 — Evidence Collection

Implementation decisions must be supported by evidence from **authoritative API documentation or
verified API responses**.

Capture:

| Category | Fields |
| --- | --- |
| Source | Documentation source, API version, deprecation information |
| Transport | Base URL, endpoint, HTTP method, headers, query parameters |
| Auth | Authentication method, required scopes |
| Payload | Request body, response structure |
| Behaviour | Pagination behaviour, rate limits, error responses, webhook requirements |

> ⛔ If documentation is insufficient or contradictory, the system must **stop and request human
> review**. It must not hallucinate fields or endpoints.

---

### Stage 4 — Component Construction

Create or modify **only the required components**.

**Supported component types**

- App metadata
- Authentication
- Shared API client
- Shared headers
- Common error handling
- Pagination
- Dynamic dropdown loaders
- Action
- Trigger
- Webhook lifecycle
- Polling logic
- Input schema
- Output schema
- Field mappings

**Typed artifacts** — each component must be a typed, versioned artifact, not loose generated code
or prose:

| Artifact | Produced by |
| --- | --- |
| `CapabilityContract` | Stage 1 |
| `EvidenceBundle` | Stage 3 |
| `AppSpec` | Stage 4 |
| `AuthenticationSpec` | Stage 4 |
| `SharedClientSpec` | Stage 4 |
| `ActionSpec` | Stage 4 |
| `TriggerSpec` | Stage 4 |
| `TestSuite` | Stage 5 |
| `ValidationReport` | Stage 5 |
| `RepairReport` | Stage 6 |
| `ReleaseVersion` | Stage 7 |

---

### Stage 5 — Testing and Validation

> **A single AI reviewer is not sufficient.** The following gates are independent.

| Gate | Verifies |
| --- | --- |
| **Schema validation** | All generated artifacts conform to viaSocket schemas |
| **Documentation validation** | Endpoints, methods, parameters, scopes and mappings match collected evidence |
| **Execution validation** | The capability runs using sandbox or authorized test credentials |
| **Output validation** | Actual output matches the declared output schema |
| **Semantic validation** | The capability genuinely completes the requested business action |
| **Security validation** | See checklist below |
| **Regression validation** | For modifications: existing tests for authentication and all affected actions/triggers still pass |

**Security validation checklist**

- Least-privilege authentication scopes
- Secret exposure
- Sensitive-data logging
- Unsafe URL or header generation
- Prompt injection through API content
- Unapproved external requests
- Excessive permissions
- Credential reuse across tenants

> ⛔ **Raw secrets must not be inserted into AI prompts.**

---

### Stage 6 — Repair Loop

> The system must **not rebuild the entire Plug** after every failure.

The reviewer returns a **structured defect**:

```json
{
  "component": "create_customer",
  "artifact_path": "request.body.email",
  "error_code": "INVALID_FIELD_MAPPING",
  "expected": "Customer email mapped to the email field",
  "actual": "Email was mapped to contact",
  "evidence": "API returned HTTP 400",
  "repairable": true
}
```

The orchestrator routes this defect **only to the responsible builder**.

**Repair rules**

| Rule | Value / Behaviour |
| --- | --- |
| Max autonomous repair attempts per defect | **3** |
| Artifact versioning | Every repair produces a new artifact version |
| Post-repair testing | Relevant regression tests run after every repair |
| Identical repeated failure | → Human review |
| Missing documentation | → Human review |
| Authentication or security uncertainty | → Human review |
| Self-approval | The builder **cannot** approve its own output |
| Audit | Failed attempts and evidence remain in the audit history |

**Every loop must declare:** exit condition · maximum attempts · timeout · cost limit · escalation path.

---

### Stage 7 — Publishing

Publishing uses **progressive states**:

```text
Draft → Internally Tested → Private Beta → Verified → Public
```

> ⛔ AI must **not** directly publish a public integration merely because its own reviewer passed it.

Every published version must carry:

- Version identifier
- Change history
- Test evidence
- Previous stable version
- Rollback
- Compatibility information
- Approval record

---

### Stage 8 — Production Monitoring

After publishing, monitor:

- Authentication failures
- Expired or revoked credentials
- Missing scopes
- Increased API errors
- API schema changes
- Deprecated endpoints
- Broken field mappings
- Webhook failures
- Rate-limit changes
- Pagination failures
- User requests for missing fields or capabilities

Production failures may create repair tasks automatically — but those changes must pass the **same
validation and publishing pipeline**.

---

## 7. Orchestration Requirements

The orchestration layer must support:

- Persistent execution state
- Resuming from the last completed stage
- Idempotent execution
- Step-level retries
- Targeted repair
- Conditional branching
- Explicit human-intervention states
- Versioned artifacts
- Complete audit trail
- Time and cost limits
- Parallel execution where dependencies allow it

> The system should avoid unnecessary AI calls. **Deterministic transformations, mappings and
> validations should use normal code.**

---

## 8. User Experience

The internal architecture may be complex; the user should primarily see:

```text
Understanding request
Checking existing Plug
Building authentication
Building action
Testing
Needs your input
Ready to publish
```

Expose technical details, evidence and execution history **on request** — but do not make the user
manage the internal workflow manually.

---

## 9. Architecture Principles

Evaluate the implementation against these:

1. Reuse before generating.
2. Fixed lifecycle, controlled dynamic branching.
3. AI proposes; deterministic gates approve.
4. Evidence before implementation.
5. Typed artifacts instead of loose prose.
6. Authentication is reusable infrastructure.
7. Test actual outcomes, not merely generated code.
8. Repair only the affected component.
9. No unlimited loops.
10. No silent public publishing.
11. Preserve every version and decision.
12. Escalate uncertainty instead of hallucinating.
13. Resume failed work instead of restarting everything.
14. Keep credentials outside model context.
15. Optimize for reliability before autonomy.

---

## 10. Delta vs. Current Architecture

Orientation for the audit — the headline gaps between
[current_architecture.md](./current_architecture.md) and this target. **These are hypotheses to
verify against code, not findings.** Confirm or refute each with evidence.

| Area | Current (as documented) | Target | Gap to verify |
| --- | --- | --- | --- |
| Classification | Request Analyser emits `New APP` / `Existing Improvement` | Typed `CapabilityContract` with inputs, outputs, success condition | Is there a typed contract, or free text? |
| Resolution | Pre-context calls (Search App, List Actions, Get Plug Details) | Explicit `ResolutionReport` driving branch selection | Is reuse-vs-duplicate an explicit decision or implicit? |
| Evidence | "Web search (Analyse API document)" per agent | Persisted `EvidenceBundle` with version, scopes, rate limits, errors | Is evidence stored and cited, or re-fetched per agent? |
| Branching | Two hardcoded branches (New App / Improvement) | Controlled branch selection over a fixed stage set | Can the AI skip stages or invent steps? |
| Auth | Connection Agent runs only on the New App branch | Auth is reusable infra; scope-gap → new auth version | Is there any scope-diff path at all? |
| Testing | No test/validation stage documented | Seven independent gates | Do any gates exist? Are they independent of the builder? |
| Repair | Not documented | Structured defect → targeted repair, max 3 attempts | Is failure handled by full regeneration? |
| Publishing | `Create Plug` / `Update Plug` terminal | Draft → … → Public with approval record | Can AI publish publicly unattended? |
| Monitoring | Not documented | Post-publish signal monitoring feeding repair tasks | Does anything watch production? |
| Orchestration | Linear agent chain | Resumable, idempotent, cost- and time-bounded | Is state persisted between agents? |

---

## 11. Audit Tasks

1. Reconstruct the current implementation as a state machine.
2. Identify every place where the AI can freely invent stages or bypass validation.
3. Check whether existing capabilities are resolved before generation.
4. Verify authentication reuse and scope handling.
5. Verify creation-versus-modification decisions.
6. Inspect test generation and live testing.
7. Inspect reviewer independence.
8. Inspect repair-loop behaviour.
9. Inspect retry, timeout and human-escalation rules.
10. Inspect security and credential handling.
11. Inspect versioning, publishing and rollback.
12. Inspect production monitoring.
13. Identify unnecessary sequential AI calls.
14. Identify steps that can run deterministically or in parallel.
15. Compare the current implementation with the required architecture.

---

## 12. Required Output Format

Return the review in **this exact structure**.

### 1. Executive Verdict

Choose exactly one:

- Correct architecture
- Directionally correct but incomplete
- Material redesign required
- Unsafe for production

Explain in **no more than five sentences**.

### 2. Current Architecture

The current state machine, based on actual implementation evidence.

### 3. Compliance Matrix

| Requirement | Current behaviour | Evidence | Status | Risk | Required correction |
| --- | --- | --- | --- | --- | --- |

`Status` ∈ { `Pass`, `Partial`, `Fail`, `Not found` }

### 4. Critical Problems

List **only** problems that can cause:

- Incorrect integrations
- Duplicate capabilities
- Security exposure
- Infinite repair loops
- Broken existing actions
- Unsafe publishing
- Unrecoverable executions

### 5. Corrected State Machine

The exact recommended state machine and its allowed transitions.

### 6. Data Contracts

Recommended schemas for: Capability Contract · Resolution Report · Evidence Bundle · Build Artifact
· Validation Report · Structured Defect · Release Version.

### 7. Test Scenarios

At minimum:

| # | Scenario |
| --- | --- |
| 1 | App, authentication and action already exist |
| 2 | App and authentication exist, but action is missing |
| 3 | Action exists but requires modification |
| 4 | Authentication exists but required scope is missing |
| 5 | App does not exist |
| 6 | Trigger requires webhook registration |
| 7 | API documentation is incomplete |
| 8 | Live API test fails |
| 9 | Repair fails three times |
| 10 | Modification breaks an existing action |
| 11 | Credentials are missing |
| 12 | API returns unexpected output |
| 13 | Duplicate request arrives |
| 14 | Execution stops and later resumes |
| 15 | Published API version becomes deprecated |

### 8. Implementation Plan

| Priority | Meaning |
| --- | --- |
| **P0** | Required before production |
| **P1** | Required for reliability and scale |
| **P2** | Optimizations |

For every task give: Component · Exact change · Reason · Dependencies · Test required · Estimated complexity.

---

## 13. Review Rules

- Be **critical**, not agreeable.
- Cite actual files, functions, schemas, prompts and tests as evidence.
- Do not claim something exists without evidence.
- Clearly distinguish **facts** from **assumptions**.
- Do **not** recommend a fully unrestricted agent planner.
- Do **not** redesign this as a generic AI-agent platform.
- Preserve the fixed state-machine decision.
- Flag unnecessary complexity.
- Prefer the simplest architecture that satisfies reliability and security requirements.

# DH-Planner — viaSocket Plug Creation System

This repository contains the **system prompt instructions** used by the DH-Planner AI agent system on [viaSocket](https://viasocket.com) to create and manage **plug integrations**.

## What is viaSocket?

[viaSocket](https://viasocket.com) is an AI workflow automation platform that connects 2000+ apps. A **plug** is a reusable integration that makes an app available as a step in automation workflows. Each plug defines:

- **Triggers** — Events from an app that start workflows
- **Actions** — Tasks an app performs (e.g., create a record, send a message)

Each action consists of:
- **Input Fields (UI)** — The form fields users interact with (dropdowns, text inputs, multiselects, etc.)
- **Perform Code (Logic)** — JavaScript code that executes the API call

## Architecture

The DH-Planner follows a **master-agent → sub-agent** architecture:

```
┌─────────────────────────┐
│   dh-master-planner     │  ← Orchestrator: routes, plans, executes
│   (Senior Integration   │
│    Architect)           │
└────────┬────────────────┘
         │ delegates to
         ▼
┌─────────────────────────┐
│   sub-agents/           │  ← Specialized field-type workers
│   ├── dh-action-name-   │
│   │   description.md    │
│   ├── dh-cs-boolean.md  │
│   ├── dh-cs-dropdown.md │
│   └── ...               │
└─────────────────────────┘
```

### Master Planner (`dh-master-planner.md`)

The orchestrator agent that:
1. **Routes** requests based on the Phase 1 Master Switch (`actionVersionRowId` + `oldInputFields`)
2. **Architects** the UI (input fields) and logic (perform code)
3. **Delegates** to specialized `DH-*` sub-agents for field-type-specific work
4. Supports three modes: **Initiate Create**, **Resume Create**, and **Surgical Update**

### Sub-Agents (`sub-agents/`)

Each sub-agent handles a specialized task:

| File | Role |
|------|------|
| `dh-action-name-description.md` | Generates action metadata (name, description, type, category) |
| `dh-cs-boolean.md` | Builds boolean toggle field configurations |
| `dh-cs-dictionary.md` | Builds key-value pair dictionary field configurations |
| `dh-cs-dropdown-dynamic.md` | Builds dynamic API-fetched dropdown field configurations |
| `dh-cs-dropdown-static.md` | Builds static predefined dropdown field configurations |
| `dh-cs-inputgroup-dynamic.md` | Builds dynamic API-driven input group configurations |
| `dh-cs-inputgroup-static.md` | Builds static input group configurations |
| `dh-cs-multiselect-dynamic.md` | Builds dynamic API-fetched multi-select field configurations |
| `dh-cs-multiselect-static.md` | Builds static predefined multi-select field configurations |
| `dh-cs-perform-api.md` | Generates JavaScript API request mapping (Logic layer) |
| `dh-cs-string-date-number-html-markdown.md` | Builds basic field types (string, date, number, html, markdown) |

## Supported Field Types

The system supports the following input field types for plug actions:

| Type | Description |
|------|-------------|
| Dropdown | Static or dynamic select lists |
| Input Group | Grouped input fields |
| Multi-select | Multiple selection fields |
| Boolean | True/false toggles |
| Text Input | Free-text entry |
| HTML | Rich HTML content |
| Markdown | Markdown-formatted content |
| Dictionary | Key-value pair inputs |
| AI Field | AI-powered smart fields |
| Number | Numeric inputs |
| Help | Informational/helper text |

## How It Works

1. **User provides** a cURL command or describes an API action
2. **Master Planner** evaluates the request and routes it (create vs. update)
3. **Input fields** are designed based on the API parameters
4. **Perform code** is generated to map fields → API payload
5. **Sub-agents** handle specialized field builders (e.g., populating dynamic dropdowns)
6. The plug action is created/updated on viaSocket via tool calls

## Resources

- [viaSocket Help](https://viasocket.com/help/)
- [Plug Builder Docs](https://viasocket.com/help/plugin-builder)
- [viaSocket Integrations](https://viasocket.com/integrations)

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

The system utilizes a multi-agent workflow to design, generate, and validate viaSocket integrations:

```
┌──────────────────────────────────────┐
│          DH-Master-Planner           │  ← Orchestrator: routes, plans, & designs integration
└──────────────────┬───────────────────┘
                   │ delegates
                   ▼
┌──────────────────────────────────────┐
│              Sub Agents              │  ← Specialized task workers (complex & specialized tasks)
└──────────────────┬───────────────────┘
                   │ passes to
                   ▼
┌──────────────────────────────────────┐
│              DH-Review               │  ← Quality Gate: validates JSON schema & perform code
└──────────────────────────────────────┘
```

### 1. DH-Master-Planner ([dh-master-planner.md](dh-master-planner.md))

The orchestrator agent that:
1. **Routes** requests based on the Phase 1 Master Switch (`actionVersionRowId` + `oldInputFields`).
2. **Aligns with Knowledge Bases**: References core rules in the [Knowledge Base](knowledge-base) (such as [ux-practice.md](knowledge-base/ux-practice.md) and [dh-Input-fields-json-builder.md](knowledge-base/dh-Input-fields-json-builder.md)) before designing fields or outputting plans.
3. **Architects** the UI (input fields) and API logic (perform code) using rules from [perform-code.md](knowledge-base/perform-code.md).
4. **Delegates** complex or specialized tasks to the appropriate sub-agents.
5. Supports three operating modes: **Initiate Create**, **Resume Create**, and **Surgical Update**.

### 2. Sub Agents ([sub-agents/](sub-agents/))

Specialized agents called by the Master Planner to handle specific parts of the integration building process:

| File | Role | Description |
|------|------|-------------|
| [dh-plug-name-description.md](sub-agents/dh-plug-name-description.md) | **Action Metadata Generator** | Generates clear, consistent action names, descriptions, types, and categories. |
| [dh-reusable-component.md](sub-agents/dh-reusable-component.md) | **Reusable Component Generator** | Specializes in creating reusable components for use across multiple code blocks. |

### 3. DH-Review ([dh-review-chat.md](dh-review-chat.md))

The final quality assurance reviewer agent that:
1. **Validates** the generated input fields JSON and perform code.
2. Checks compliance against the viaSocket Knowledge Bases.
3. Outputs approval status, a structured list of issues/feedback, and a quality score.

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

1. **User provides** a cURL command or describes an API action.
2. **Master Planner** evaluates the request and routes it based on the action status.
3. **Input fields** and **Perform code** are drafted based on API specifications.
4. **Sub-agents** handle complex and specialized tasks (e.g., metadata generation, reusable components).
5. **DH-Review** performs a final quality review of the input fields JSON and perform code.
6. The approved configuration is used to create or update the plug action on viaSocket.

## Resources

- [viaSocket Help](https://viasocket.com/help/)
- [Plug Builder Docs](https://viasocket.com/help/plugin-builder)
- [viaSocket Integrations](https://viasocket.com/integrations)
## Additional Agents

- **Google Gemini Gem**: https://gemini.google.com/gem/1fBfboeHEV96O-DVNUqAnVv3jWTpjgHzr?usp=sharing
- **ChatGPT GPT Agent**: https://chatgpt.com/g/g-6a119820f79081918e7605af648cb12a-dh-planner-viasocket

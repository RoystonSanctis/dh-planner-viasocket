# Docstar GitHub Synchronization Format

This document provides technical specifications for synchronizing documentation from a GitHub repository to Docstar.

## 1. Directory Structure

All documentation must reside within a root directory (typically named `docs/`). The folder structure within `docs/` defines the hierarchy and navigation of the published site.

- **Folders**: Represent categories or parents.
- **Files**: Represent individual pages or endpoints.

### Special File: `page.md`
If a folder contains a `page.md` file, the content of this file becomes the content for that specific folder (the "parent" page). Without `page.md`, the folder acts as a container for its children.

**Example Structure:**
```text
docs/
├── getting-started.md      (Individual page)
├── api/                    (Folder/Category)
│   ├── page.md            (Content for the 'api' category page)
│   ├── authentication.md   (Page under 'api')
│   └── users/             (Nested Folder)
│       └── create.md      (Page under 'api/users')
```

## 2. File Format

Files must use the `.md` extension and include a YAML frontmatter section.

### YAML Frontmatter

Required and optional fields:

| Field | Type | Description |
| :--- | :--- | :--- |
| `type` | string | `page` (default) or `endpoint`. |
| `title` | string | The display title of the page. |
| `description` | string | A short summary of the content. |
| `published` | boolean | Set to `true` to publish the page immediately. |

**Example Page:**
```markdown
---
type: page
title: Getting Started
description: Welcome to our documentation.
published: true
---
# Welcome
This is the markdown content of the page.
```

## 3. API Endpoints (`type: endpoint`)

For files with `type: endpoint`, the content below the frontmatter is expected to be an **OpenAPI / Swagger snippet**.

**Example Endpoint:**
```markdown
---
type: endpoint
title: Create User
published: true
---
post: /users
summary: Create a new user
parameters:
  - name: username
    in: body
    required: true
    schema:
      type: string
responses:
  200:
    description: User created successfully
```

## 4. Synchronization Mechanism

Docstar synchronizes via a GitHub Action that sends a JSON payload to the `/import/github` endpoint.

### GitHub Action Workflow

The workflow should trigger on pushes to the documentation branch and paths.

```yaml
name: Sync Docs to DocStar

on:
  push:
    branches:
      - main
    paths:
      - 'docs/**'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Send changed files to DocStar
        env:
          DOCSTAR_API_KEY: ${{ secrets.DOCSTAR_API_KEY }}
          DOCSTAR_COLLECTION_ID: "YOUR_COLLECTION_ID"
        run: |
          # The action should extract changed files (A, M, D status) 
          # and send them as an array of objects:
          # { path: string, status: "A"|"M"|"D", content: string|null }
```

## 5. Summary of Rules for AI

- **Do** use `page.md` for folder-level content.
- **Do** include YAML frontmatter in every file.
- **Do** use `type: endpoint` for API documentation.
- **Do** maintain a clean folder hierarchy.
- **Don't** use characters other than `a-z`, `0-9`, `-`, and `_` in file/folder names (to ensure clean URLs).

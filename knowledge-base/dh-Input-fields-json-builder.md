---
type: page
title: "DH Input Fields Knowledge Base"
description: "This document contains knowledge and best practices for creating and configuring input fields in viaSocket plug actions. his guide provides purpose, instructions, and input field structure in JSON & TOON format to better understand the LLM Model, and an example in JSON & TOON. Special Note includes special field cases."
published: true
---

> [!CAUTION]
> **CRITICAL PAYLOAD STRUCTURE RULE:**
> In actual tool calls and action payloads, `inputFields` is ALWAYS a direct raw **Array of Objects** (`[...]`).
> ❌ NEVER wrap arrays inside `{"item": [...]}` or `{}` objects when outputting JSON payloads!
> ❌ NEVER output `"inputFields": { "item": [ ... ] }` or `"options": { "item": [ ... ] }`.
> ✅ ALWAYS output `"inputFields": [ { ... } ]` and `"options": [ { ... } ]`.

# Page Index

- DH Input Fields Knowledge Base
- Static Input Fields
  - String | Date | Number | HTML | Markdown
    - String | Date | Number | HTML | Markdown Input Field Generation Rules:
    - String | Date | Number | HTML | Markdown JSON Schema:
    - String | Date | Number | HTML | Markdown TOON Schema:
    - String | Date | Number | HTML | Markdown Examples:
      - String | Date | Number | HTML | Markdown JSON Example:
      - String | Date | Number | HTML | Markdown TOON Example:
  - Dictionary
    - Dictionary Input Field Generation Rules:
    - Dictionary Input Field JSON Schema:
    - Dictionary TOON Schema:
    - Dictionary Examples:
      - Dictionary JSON Example:
      - Dictionary TOON Example:
  - Boolean
    - Boolean Input Field Generation Rules:
    - Boolean JSON Schema:
    - Boolean TOON Schema:
    - Boolean Examples:
      - Boolean JSON Example:
      - Boolean TOON Example:
  - Dropdown Static
    - Dropdown Static Input Field Generation Rules:
    - Dropdown Static JSON Schema:
    - Dropdown Static TOON Schema:
    - Dropdown Static Examples:
      - Dropdown Static JSON Example:
      - Dropdown Static TOON Example:
  - Multiselect Static
    - Multiselect Static Input Field Generation Rules:
    - Multiselect Static JSON Schema:
    - Multiselect Static TOON Schema:
    - Multiselect Static JSON Example:
    - Multiselect Static TOON Example:
  - AI Field
    - AI Field Input Field Generation Rules:
    - AI Field JSON Schema:
    - AI Field TOON Schema:
    - AI Field Examples
      - AI Field JSON Example:
      - AI Field TOON Example:
  - Help Static
    - Help Static Input Field Generation Rules:
    - Help Static JSON Schema:
    - Help Static TOON Schema:
    - Help Static Examples:
      - Help Static JSON Example:
      - Help Static TOON Example:
  - Input Group Static
    - Input Group Static Input Field Generation Rules:
    - Input Group Static JSON Schema:
    - Input Group Static TOON Schema:
    - Input Group Static Examples:
      - Input Group Static JSON Example:
      - Input Group Static TOON Example:
- Dynamic Input Fields
  - Dropdown Dynamic
    - Dropdown Dynamic Input Field Generation Rules:
    - Dropdown Dynamic JSON Schema:
    - Dropdown Dynamic TOON Schema:
    - Dropdown Dynamic Examples:
      - Dropdown Dynamic JSON Example:
      - Dropdown Dynamic TOON Example:
    - Reusable Component In Dropdown Dynamic:
      - Reusable Component In Dropdown Dynamic Code Rules:
      - Reusable Component In Dropdown Dynamic Example Code and Usage:
        - Example 1: Facebook Lead Form Dropdown Dynamic
        - Example 2: Google Sheet Spreadsheet Dropdown Dynamic
  - Multi Select Dynamic
    - Multi Select Dynamic Input Field Generation Rules:
    - Multi Select Dynamic JSON Schema:
    - Multi Select Dynamic TOON Schema:
    - Multi Select Dynamic Examples:
      - Multi Select Dynamic JSON Example:
      - Multi Select Dynamic TOON Example:
    - Reusable Component In Multi Select Dynamic:
      - Reusable Component In Multi Select Dynamic Code Rules:
      - Reusable Component In Multi Select Dynamic Example Code and Usage:
        - Example 1: Google Sheets Column Multi Select Dynamic
        - Example 2: Notion Data Source Property Multi Select Dynamic
  - Help Dynamic
    - Help Dynamic Input Field Generation Rules:
    - Help Dynamic JSON Schema:
    - Help Dynamic TOON Schema:
    - Help Dynamic Examples:
      - Help Dynamic JSON Example:
      - Help Dynamic TOON Example:
  - Input Group Dynamic
    - Input Group Dynamic Input Field Generation Rules:
    - Input Group Dynamic JSON Schema:
    - Input Group Dynamic TOON Schema:
    - Input Group Dynamic Examples:
      - Input Group Dynamic JSON Example:
      - Input Group Dynamic TOON Example:
- Special Note:
  - Special Note: Static Input Group: `whereClause` Feature (Special Layout)
  - Special Note: Dropdown & Multiselect:
  - Special Note: Visibility Condition Rules:
  - Special Note: `list` and `limit` usage in the text and number field types:
  - Special Note: Raw `inputFields` and auto generated keys in the final json input fields [`steps`,`blocks` and `dependsOn`]
    - Understanding `dependsOn` vs `visibilityCondition`
    - `dependsOn` vs `visibilityCondition` Examples:
      - Example 1: Generic Example (Static Fields & Input Groups)
      - Example 2: Dynamic Fields (`dependsOn` vs `visibilityCondition`)
  - Special Note: `required` key in the input fields
  - Special Note: Default Values for Boolean Keys
  - Special Note: Custom Mapping Behavior (Dropdown, Multiselect & Boolean)

# DH Input Fields Knowledge Base

This document contains knowledge and best practices for creating and configuring input fields in viaSocket plug actions. This guide provides purpose, instructions, and input field structure in JSON & TOON format to better understand the LLM Model, and an example in JSON & TOON. Special Note includes special field cases.

> [!IMPORTANT]
> **Help Key Requirement & Exception:**
> - In most cases, a `help` key is mandatory to guide users.
> - **Exception:** If the field's `label` and `key` are completely self-explanatory (e.g., `label: "First Name"`, `key: "first_name"`), the `help` key can be omitted entirely.
> - **Mandatory Cases:** If a field is not completely self-explanatory—for example, a date field with `label: "Date"` which requires explaining the purpose of the date and the accepted input format—the `help` key must be included.


# Static Input Fields

The input fields, which are static, have fixed values. The depends on other feild will be through visibilityCondition in the static input fields.

## String | Date | Number | HTML | Markdown

**String | Date | Number | HTML | Markdown Purpose:**
- A String is a basic input type used to capture plain text values such as names, titles, identifiers, or short descriptions. It is suitable when the input is textual and does not require numeric calculation or formatting.
- A Date input type (`type: "date"`) is used to capture calendar-based values such as dates, times, or date-time combinations that match one of the four supported date formats. It parses and formats the input strictly according to the specified `dateFormat` before passing it to the perform code.
- A Number input type is used to capture numeric values such as amounts, prices, counts, quantities, or any value that may be used in calculations or comparisons.
- An HTML input type is used to capture rich text content that includes HTML tags. It is suitable when the input needs structured formatting and the HTML is required in the payload.
- A Markdown input type is used to capture formatted text using Markdown syntax. It is ideal for content that needs lightweight formatting such as headings, lists, links, or emphasis.

### String | Date | Number | HTML | Markdown Input Field Generation Rules:
Generate a JSON object strictly following the rules below.

**When to Use**
- Use **string** when capturing plain text values such as names, titles, identifiers, or short descriptions.
- Use **date** when capturing date, time, or date-time values where the required format is one of the supported date formats:
  1. `YYYY-MM-DDTHH:mm:ssZ`
  2. `YYYY-MM-DD HH:mm:ss Z`
  3. `MM-DD-YYYY HH:mm:ss Z`
  4. `MM-DD-YYYY HH:mm:ss`
- Use **string** (not a date type) when capturing date, time, or date-time values that require formats *other* than the four supported formats above.
- Use **number** when capturing numeric values such as amounts, prices, counts, or quantities that may be used in calculations or comparisons.
- Use **html** when the input requires rich text content with HTML tags and structured formatting.
- Use **markdown** when the input requires lightweight formatted text using Markdown syntax (headings, lists, links, emphasis).

**1. Key Rules**
- key must be unique.
- key must not contain a dot (.) or square brackets ([]).

**2. Type Selection**
- If fieldPurpose contains date, time, DOB:
  - If the required format is one of the supported date formats (listed above) → type: "date" and specify `dateFormat`.
  - Otherwise → type: "string" (with clear instructions/warning in the help text).
- If it contains amount, price, count, quantity, number → type: "number"
- If the field supports HTML → type: "html"
- If the field supports Markdown → type: "markdown"
- Otherwise → type: "string"

**3. Date Field Format Rules**
- If type is **date**, you must define the `dateFormat` key using one of the four supported formats.
- Difference between `type: "date"` and `type: "string"`:
  - In `string` fields, the raw input enters the perform code as-is.
  - In `date` fields, only the formatted date strictly matching the `dateFormat` is returned in the perform code.
  - The input is expected to match the `dateFormat` format. Hence, the `placeholder` key **must** contain an example date value formatted exactly as the specified `dateFormat`.

**4. Label, Help, Placeholder**
- label: Clean, human-readable version of fieldPurpose
- help: Clearly explain what the user should enter. For date fields, note the expected format. **The value must start with "Enter"** (e.g., `"Enter description."`). It supports string format and markdown links like `[Lean More](https://example.com)`. Both `help` and `customHelp` must be very crisp and to the point.
- placeholder: Provide a realistic example relevant to the purpose. The value must always be a string; even for number or date fields, the placeholder value must be wrapped in a string (e.g. `"10"`, or `"07-11-2026 12:00:00"` for `"MM-DD-YYYY HH:mm:ss"`).

**5. Required Rule**
- Set required: true if fieldPurpose implies mandatory input
- (e.g. name, email, amount, date)
- Otherwise set required: false

**6. Visibility Condition Rule**
- Include visibilityCondition only if both parentKey and parentValue are provided
- Do not include this key otherwise

**7. List Rule**
- Set list: true if the user preconfigures multiple values as an array during setup
- Set list: false if the value is single or needs to be dynamic later (comma-separated input allowed or multiple values allowed as an array)
  - Example : `[ "Option 1", "Option 2", "Option 3" ]` or `Option 1, Option 2, Option 3`

**8. Limit Rule**
- Set limit to a number representing the maximum number of list entries allowed.
- Include limit only if list is true. Omit this key otherwise.

> [!NOTE]
> Refer to -> **Special Note: `list` and `limit` usage in the text and number field types**.

**9. Output Constraint**
- Return only valid JSON
- Do not add explanations, comments, or extra keys

### String | Date | Number | HTML | Markdown JSON Schema:
```json
{
    "name": "input_field_creator",
    "strict": false,
    "schema": {
        "type": "object",
        "properties": {
            "key": {
                "type": "string",
                "pattern": "^[^.\\[\\]]*$",
                "description": "The unique identifier for the field. must not contain a dot (.) or square brackets ([])."
            },
            "type": {
                "type": "string",
                "enum": ["string", "date", "number", "html", "markdown"],
                "description": "The type of input field."
            },
            "label": {
                "type": "string",
                "description": "A clean, human-readable label."
            },
            "help": {
                "type": "string",
                "description": "Guidance text explaining what the user should enter. It also supports markdown links for the reference."
            },
            "placeholder": {
                "type": "string",
                "description": "An example value relevant to the purpose. Must be wrapped in a string."
            },
            "required": {
                "type": "boolean",
                "description": "True if the field implies mandatory input. It is an optional key; if not present, it is treated as optional."
            },
            "list": {
                "type": "boolean",
                "description": "Whether this field accepts an array of values. Only applicable for 'string' and 'number' types."
            },
            "limit": {
                "type": "number",
                "description": "The max number of list entries. Only applicable if 'list' is true."
            },
            "visibilityCondition": {
                "type": "string",
                "description": "A JS condition string. Omit if always visible."
            },
            "defaultValue": {
                "type": "string",
                "description": "The default value. Omit if none."
            },
            "dateFormat": {
                "type": "string",
                "enum": [
                    "YYYY-MM-DDTHH:mm:ssZ",
                    "YYYY-MM-DD HH:mm:ss Z",
                    "MM-DD-YYYY HH:mm:ss Z",
                    "MM-DD-YYYY HH:mm:ss"
                ],
                "description": "Required when type is 'date'. The format the date field expects and returns."
            }
        },
        "required": [
            "key",
            "type",
            "label",
            "help"
        ]
    }
}
```
### String | Date | Number | HTML | Markdown TOON Schema:
```toon
name: input_field_creator
strict: false
schema:
  type: object
  properties:
    key:
      type: string
      pattern: "^[^.\[\]]*$"
      description: The unique identifier for the field. must not contain a dot (.) or square brackets ([]).
    type:
      type: string
      enum[5]: string,date,number,html,markdown
      description: The type of input field.
    label:
      type: string
      description: "A clean, human-readable label."
    help:
      type: string
      description: "Guidance text explaining what the user should enter. It also supports markdown links for the reference."
    placeholder:


      type: string
      description: An example value relevant to the purpose.
    required:
      type: boolean
      description: True if the field implies mandatory input. It is an optional key; if not present, it is treated as optional.
    list:
      type: boolean
      description: Whether this field accepts an array of values. Only applicable for 'string' and 'number' types.
    limit:
      type: number
      description: The max number of list entries. Only applicable if 'list' is true.
    visibilityCondition:
      type: string
      description: A JS condition string. Omit if always visible.
    defaultValue:
      type: string
      description: The default value. Omit if none.
    dateFormat:
      type: string
      enum[4]: YYYY-MM-DDTHH:mm:ssZ,YYYY-MM-DD HH:mm:ss Z,MM-DD-YYYY HH:mm:ss Z,MM-DD-YYYY HH:mm:ss
      description: Required when type is 'date'. The format the date field expects and returns.
  required[4]: key,type,label,help
```

### String | Date | Number | HTML | Markdown Examples:

#### String | Date | Number | HTML | Markdown JSON Example:
```json
[
  {
    "key": "email",
    "help": "Enter Learner's Email ID",
    "type": "string",
    "label": "Learner's Email ID",
    "required": true,
    "placeholder": "john@example.com"
  },
  {
    "key": "name",
    "help": "Enter Learner's Name",
    "type": "string",
    "label": "Learner's Name",
    "required": true,
    "placeholder": "John Doe"
  },
  {
    "key": "password", 
    "help": "Password of the learner. If not sent, account is created with random password",
    "type": "string",
    "label": "Learner's Password",
    "required": false,
    "placeholder": "Enter Password"
  },
  {
    "key": "mobile",
    "help": "Mobile number of the learner with country code. For example, +9175XXXXXXXX",
    "type": "string",
    "label": "Learner's Mobile No",
    "required": false,
    "placeholder": "+9175XXXXXXXX"
  },
  {
    "key": "to",
    "help": "Enter the recipient's email address. For multiple recipients, separate addresses with commas.",
    "type": "string",
    "label": "Recipient's Email",
    "required": true,
    "placeholder": "recipient@example.com"
  },
  {
    "key": "page_limit",
    "help": "Default it will fetch data upto 100. The maximum value is 100.",
    "type": "number",
    "label": "Page Limit",
    "placeholder": "10",
    "defaultValue": 100
  },
  {
    "key": "feed_url",
    "help": "Paste your RSS URL here. Must be publicly accessible. Multiple feed links can be given in a line item.",
    "list": true,
    "type": "string",
    "label": "Feed URL",
    "required": true,
    "placeholder": "https://example.com/rss1.xml"
  },
  {
    "key": "quick_reply",
    "help": "Paste your quick reply options here. Multiple reply options can be given in a line item. Maximum of 10 reply options are allowed.",
    "list": true,
    "limit": 10,
    "type": "string",
    "label": "Quick Reply Options",
    "required": true,
    "placeholder": "Option 1"
  },
  {
    "key": "html_body",
    "help": "Enter the body of the email. You can include HTML tags for formatting.",
    "type": "html",
    "label": "Message Body",
    "required": true,
    "placeholder": "<p>Write your HTML email message here</p>",
    "visibilityCondition": "context.inputData.messageType === 'html'"
  },
  {
    "key": "file_content",
    "type": "markdown",
    "label": "File Content",
    "help": "Enter the content for the file. You can use Markdown syntax for formatting.",
    "placeholder": "# My Project\n\nThis is the readme content...",
    "required": true
  },
  {
    "key": "created_date",
    "type": "date",
    "label": "Created Date",
    "help": "Enter the creation date. Must follow the format: MM-DD-YYYY HH:mm:ss",
    "required": true,
    "placeholder": "07-11-2026 12:00:00",
    "dateFormat": "MM-DD-YYYY HH:mm:ss"
  }
]
```
#### String | Date | Number | HTML | Markdown TOON Example:
```toon
[10]:
  - key: email
    help: Enter Learner's Email ID
    type: string
    label: Learner's Email ID
    required: true
    placeholder: john@example.com
  - key: name
    help: Enter Learner's Name
    type: string
    label: Learner's Name
    required: true
    placeholder: John Doe
  - key: password
    help: "Password of the learner. If not sent, account is created with random password"
    type: string
    label: Learner's Password
    required: false
    placeholder: Enter Password
  - key: mobile
    help: "Mobile number of the learner with country code. For example, +9175XXXXXXXX"
    type: string
    label: Learner's Mobile No
    required: false
    placeholder: +9175XXXXXXXX
  - key: to
    help: "Enter the recipient's email address. For multiple recipients, separate addresses with commas."
    type: string
    label: Recipient's Email
    required: true
    placeholder: recipient@example.com
  - key: page_limit
    help: Default it will fetch data upto 100. The maximum value is 100.
    type: number
    label: Page Limit
    placeholder: "10"
    defaultValue: 100
  - key: feed_url
    help: Paste your RSS URL here. Must be publicly accessible. Multiple feed links can be given in a line item.
    list: true
    type: string
    label: Feed URL
    required: true
    placeholder: "https://example.com/rss1.xml"
  - key: quick_reply
    help: Paste your quick reply options here. Multiple reply options can be given in a line item. Maximum of 10 reply options are allowed.
    list: true
    limit: 10
    type: string
    label: Quick Reply Options
    required: true
    placeholder: Option 1
  - key: html_body
    help: Enter the body of the email. You can include HTML tags for formatting.
    type: html
    label: Message Body
    required: true
    placeholder: <p>Write your HTML email message here</p>
    visibilityCondition: context.inputData.messageType === 'html'
  - key: file_content
    type: markdown
    label: File Content
    help: Enter the content for the file. You can use Markdown syntax for formatting.
    placeholder: "# My Project\n\nThis is the readme content..."
    required: true
  - key: created_date
    type: date
    label: Created Date
    help: "Enter the creation date. Must follow the format: MM-DD-YYYY HH:mm:ss"
    required: true
    placeholder: 07-11-2026 12:00:00
    dateFormat: MM-DD-YYYY HH:mm:ss
```

## Dictionary

**Dictionary Purpose:**
A Dictionary (also called Map or Key-Value Pair) is a special input type in viaSocket that lets users dynamically define custom pairs of keys and values. This provides high flexibility when the structure of input data is variable or unknown in advance.

### Dictionary Input Field Generation Rules:
Generate a JSON object strictly following the rules below for a dictionary.

**When to Use**
- Use a dictionary when users need to dynamically define custom key-value pairs and the structure of input data is variable or unknown in advance.
**1. Key Rules**
- key must be unique.
- key must not contain a dot (.) or square brackets ([]).
**2. Label Rules**
- label must be a clean, human-readable version of fieldPurpose.
**3. Help Rules**
- help must clearly explain what key-value pairs the user should enter. **The value must start with "Enter"** (e.g., `"Enter custom key-value pairs."`). It supports string format and markdown links like `[Lean More](https://example.com)`. Both `help` and `customHelp` must be very crisp and to the point.
**4. Required Rules**
- Set required: true only if fieldPurpose implies mandatory input. 
- Otherwise, set required: false.
**5. Type Rule**
- type must always be "dictionary".
**6. Template Rules**
- The dictionary must follow this fixed template:
**key**
type: "string"
placeholder: "Enter key"
**value**
type: "string"
placeholder: "Enter value"

Do not modify template structure or data types.
Do not add extra properties.
**7. Output Rules**
Return only valid JSON.

### Dictionary Input Field JSON Schema:
```json
{
    "name": "Dictionary_Field",
    "strict": false,
    "schema": {
        "type": "object",
        "properties": {
            "inputFields": {
                "type": "array",
                "description": "The array of input fields including the newly created or updated dictionary field.",
                "items": {
                    "type": "object",
                    "properties": {
                        "key": {
                            "type": "string",
                            "pattern": "^[^.\\[\\]]*$",
                            "description": "Unique identifier for the field. The key must not contain a dot (.) or square brackets ([])"
                        },
                        "label": {
                            "type": "string",
                            "description": "A user-friendly label derived from the fieldPurpose."
                        },
                        "help": {
                            "type": "string",
                            "description": "Clear instructions for the user about what to input. It also supports markdown links for the reference."
                        },
                        "required": {
                            "type": "boolean",
                            "description": "Indicates if this dictionary field is mandatory. It is an optional key; if not present, it is treated as optional."
                        },
                        "type": {
                            "type": "string",
                            "enum": [
                                "dictionary"
                            ],
                            "description": "Must be set to 'dictionary'."
                        },
                        "visibilityCondition": {
                            "type": "string",
                            "description": "A JavaScript condition for visibility. Omit this field entirely if not applicable."
                        },
                        "template": {
                            "type": "object",
                            "properties": {
                                "key": {
                                    "type": "object",
                                    "properties": {
                                        "type": {
                                            "type": "string",
                                            "enum": [
                                                "string"
                                            ],
                                            "description": "The data type the key field supports. Always 'string'."
                                        },
                                        "placeholder": {
                                            "type": "string",
                                            "description": "Placeholder text for the key."
                                        }
                                    },
                                    "required": [
                                        "type",
                                        "placeholder"
                                    ]
                                },
                                "value": {
                                    "type": "object",
                                    "properties": {
                                        "type": {
                                            "type": "string",
                                            "enum": [
                                                "string"
                                            ],
                                            "description": "The data type the value field supports. Always 'string'."
                                        },
                                        "placeholder": {
                                            "type": "string",
                                            "description": "Placeholder text for the value."
                                        }
                                    },
                                    "required": [
                                        "type",
                                        "placeholder"
                                    ]
                                }
                            },
                            "required": [
                                "key",
                                "value"
                            ]
                        }
                    },
                    "required": [
                        "key",
                        "label",
                        "help",
                        "type",
                        "template"
                    ]
                }
            }
        },
        "required": [
            "inputFields"
        ]
    }
}
```

### Dictionary TOON Schema:
```toon
name: Dictionary_Field
strict: false
schema:
  type: object
  properties:
    inputFields:
      type: array
      description: The array of input fields including the newly created or updated dictionary field.
      items:
        type: object
        properties:
          key:
            type: string
            pattern: "^[^.\[\]]*$"
            description: Unique identifier for the field. The key must not contain a dot (.) or square brackets ([])
          label:
            type: string
            description: A user-friendly label derived from the fieldPurpose.
          help:
            type: string
            description: "Clear instructions for the user about what to input. It also supports markdown links for the reference."
          required:
            type: boolean
            description: Indicates if this dictionary field is mandatory. It is an optional key; if not present, it is treated as optional.
          type:
            type: string
            enum[1]: dictionary
            description: Must be set to 'dictionary'.
          visibilityCondition:
            type: string
            description: A JavaScript condition for visibility. Omit this field entirely if not applicable.
          template:
            type: object
            properties:
              key:
                type: object
                properties:
                  type:
                    type: string
                    enum[1]: string
                    description: The data type the key field supports. Always 'string'.
                  placeholder:


                    type: string
                    description: Placeholder text for the key.
                required[2]: type,placeholder
              value:
                type: object
                properties:
                  type:
                    type: string
                    enum[1]: string
                    description: The data type the value field supports. Always 'string'.
                  placeholder:


                    type: string
                    description: Placeholder text for the value.
                required[2]: type,placeholder
            required[2]: key,value
        required[5]: key,label,help,type,template
  required[1]: inputFields
```


### Dictionary Examples:

#### Dictionary JSON Example:
```json
[
{
    "key": "quick_replies",
    "help": "Quick replies provide a way to present a set of buttons in-conversation for users to reply with.",
    "type": "dictionary",
    "label": "Quick Replies",
    "required": true,
    "template": {
      "key": {
        "type": "string",
        "placeholder": "Title"
      },
      "value": {
        "type": "string",
        "placeholder": "PAYLOAD TEXT"
      }
    }
  },
  {
    "key": "url_button",
    "help": "The URL Button opens a web page in the in-app browser.",
    "type": "dictionary",
    "label": "URL Button",
    "template": {
      "key": {
        "type": "string",
        "placeholder": "Button Title"
      },
      "value": {
        "type": "string",
        "placeholder": "Link"
      }
    },
    "visibilityCondition": "context.inputData.message_type === 'text'"
  },
    {
    "key": "custom_fields",
    "help": "Enter Custom Fields with custom fields title and value.",
    "type": "dictionary",
    "label": "Custom Fields",
    "template": {
      "key": {
        "type": "string",
        "placeholder": "Custom Field Name"
      },
      "value": {
        "type": "string",
        "placeholder": "Enter Value"
      }
    }
  }
  ]
  ```
#### Dictionary TOON Example:

```toon
[3]:
  - key: quick_replies
    help: Quick replies provide a way to present a set of buttons in-conversation for users to reply with.
    type: dictionary
    label: Quick Replies
    required: true
    template:
      key:
        type: string
        placeholder: Title
      value:
        type: string
        placeholder: PAYLOAD TEXT
  - key: url_button
    help: The URL Button opens a web page in the in-app browser.
    type: dictionary
    label: URL Button
    template:
      key:
        type: string
        placeholder: Button Title
      value:
        type: string
        placeholder: Link
    visibilityCondition: context.inputData.message_type === 'text'
  - key: custom_fields
    help: Enter Custom Fields with custom fields title and value.
    type: dictionary
    label: Custom Fields
    template:
      key:
        type: string
        placeholder: Custom Field Name
      value:
        type: string
        placeholder: Enter Value
```

## Boolean

**Boolean Purpose:**

A Boolean input type is used to represent a binary configuration choice where each option maps directly to a `true` or `false` value in the system. While it appears as a simple yes/no decision to the user, it often controls feature toggles, behavioral modes, or execution paths in the underlying logic.

This input type is ideal when:

- The decision has exactly two mutually exclusive outcomes
- Each option corresponds to a clear system action or state
- The UI label may vary (e.g., Yes/No, Basic/Advance, Workspace/Parent Page), but internally resolves to a Boolean value


### Boolean Input Field Generation Rules:
Generate a JSON object strictly following the rules below for a boolean field.

**When to Use**
- Use a boolean when the decision has exactly two mutually exclusive outcomes (e.g. Yes/No, Enable/Disable, Basic/Advanced).
- Each option corresponds to a clear system action or state and internally resolves to a true or false value.

**1. Key Rules**
- key must be unique.
- key must not contain a dot (.) or square brackets ([]).

**2. Type Rule**
- type must always be "boolean".

**3. Label, Help Rules**
- label: Clean, human-readable question or description of the toggle (e.g. "Does your first row contain column name?")
- help: Clearly explain what happens when the user enables or disables this option. **The value must start with "Select"** (or start from `"select"`, e.g., `"Select yes/option label for [outcome]"`). It supports string format and markdown links like `[Lean More](https://example.com)`. Both `help` and `customHelp` must be very crisp and to the point.

**4. Required Rule**
- Set required: true if the field implies a mandatory decision
- (e.g. toggling a core feature on/off)
- Otherwise set required: false

**5. Options Rule**
- options must always contain exactly two items: one with value: true and one with value: false
- Each option must include:
  - label: user-facing display text (e.g. "Yes", "No", "Enable", "Disable", "Basic", "Advanced")
  - value: the actual boolean value (true or false)
- The true-value option must appear first, followed by the false-value option

**6. Default Value Rule**
- Set defaultValue only if a sensible default exists
- defaultValue must be an object with label and value matching one of the options
- Omit defaultValue entirely if there is no default

**7. Custom Input Rules**
- Include placeholder only if a placeholder is needed for dropdown selection. Omit if not applicable
- **customInputLabel is always required/mandatory**: **It must be short and must NOT start with "Enter"** (e.g. standard label `"Does your first row contain column name?"` and customInputLabel `"Does your first row contain column name?"` since it is not an ID field). If not an ID field, standard label and `customInputLabel` must be the same.
- **customPlaceholder is always required/mandatory**: Provide a relevant value sample (such as `"true"`). Do NOT use "E.g." or "e.g." in custom placeholders; they must contain direct sample values only. The value of `placeholder` and `customPlaceholder` must always be a string and wrapped in a string/quotes (e.g., `"true"`, `"false"`).
- **customHelp is always required/mandatory**: **It must specify the actual value and explain what will happen** (e.g. `"Enter 'true' to paginate results, or 'false' to fetch all users."`). It is like the `help` key but specifically explains when/what values to enter for the `true` and `false` states. Both `help` and `customHelp` must be very crisp and to the point.

**8. Visibility Condition Rule**
- Include visibilityCondition only if both parentKey and parentValue are provided
- Do not include this key otherwise

**9. Output Constraint**
- Return only valid JSON
- Do not add explanations, comments, or extra keys

### Boolean JSON Schema:
```json
{
    "name": "generate_boolean_field",
    "strict": false,
    "schema": {
        "type": "object",
        "properties": {
            "inputFields": {
                "type": "array",
                "description": "The array of input fields including the newly created or updated boolean field.",
                "items": {
                    "type": "object",
                    "properties": {
                        "key": {
                            "type": "string",
                            "pattern": "^[^.\\[\\]]*$",
                            "description": "Unique identifier for the field (e.g. 'isActive', 'showLabels'). The key must not contain a dot (.) or square brackets ([])."
                        },
                        "type": {
                            "type": "string",
                            "enum": [
                                "boolean"
                            ],
                            "description": "Must be 'boolean'."
                        },
                        "label": {
                            "type": "string",
                            "description": "A human-readable label (e.g. 'Does your first row contain column name?')."
                        },
                        "help": {
                            "type": "string",
                            "description": "Helper text explaining what enabling/disabling this does. It also supports markdown links for the reference."
                        },
                        "required": {
                            "type": "boolean",
                            "description": "Whether the field is mandatory. It is an optional key; if not present, it is treated as optional."
                        },
                        "options": {
                            "type": "array",
                            "minItems": 2,
                            "maxItems": 2,
                            "description": "The toggle options. MUST contain exactly two items: one where the value is true, and one where the value is false. (e.g., [{'label': 'Yes', 'value': true}, {'label': 'No', 'value': false}]).",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "label": {
                                        "type": "string",
                                        "description": "Display label (e.g. 'Yes', 'Basic')."
                                    },
                                    "value": {
                                        "type": "boolean",
                                        "description": "The actual boolean value (true or false)."
                                    }
                                },
                                "required": [
                                    "label",
                                    "value"
                                ]
                            }
                        },
                        "defaultValue": {
                            "type": "object",
                            "description": "The default selection. Omit this field entirely if there is no default.",
                            "properties": {
                                "label": {
                                    "type": "string",
                                    "description": "The label of the default option (e.g. 'No', 'Basic')."
                                },
                                "value": {
                                    "type": "boolean",
                                    "description": "The value of the default option (e.g. false, true)."
                                }
                            },
                            "required": [
                                "label",
                                "value"
                            ]
                        },
                        "placeholder": {
                            "type": "string",
                            "description": "Optional placeholder text shown before selection. Omit if not applicable."
                        },
                        "customInputLabel": {
                            "type": "string",
                            "description": "Required custom label for manual/dynamic input (e.g. 'Enter Boolean Value')."
                        },
                        "customHelp": {
                            "type": "string",
                            "description": "Required helper text for manual/dynamic input, explaining when to enter true and false values (e.g., 'Enter \"true\" if you want to enable pagination else \"false\"')."
                        },
                        "customPlaceholder": {
                            "type": "string",
                            "description": "Required placeholder text (such as 'true'). Do NOT use 'E.g.' or 'e.g.'; they must contain direct sample values only. The value must always be a string and wrapped in a string/quotes (e.g., '\"true\"')."
                        },
                        "visibilityCondition": {
                            "type": "string",
                            "description": "A JavaScript condition for visibility. Omit if always visible."
                        }
                    },
                    "required": [
                        "key",
                        "type",
                        "label",
                        "help",
                        "options",
                        "customPlaceholder",
                        "customInputLabel",
                        "customHelp"
                    ]
                }
            }
        },
        "required": [
            "inputFields"
        ]
    }
}
```

### Boolean TOON Schema:
```toon
name: generate_boolean_field
strict: false
schema:
  type: object
  properties:
    inputFields:
      type: array
      description: The array of input fields including the newly created or updated boolean field.
      items:
        type: object
        properties:
          key:
            type: string
            pattern: "^[^.\[\]]*$"
            description: "Unique identifier for the field (e.g. 'isActive', 'showLabels'). The key must not contain a dot (.) or square brackets ([])."
          type:
            type: string
            enum[1]: boolean
            description: Must be 'boolean'.
          label:
            type: string
            description: A human-readable label (e.g. 'Does your first row contain column name?').
          help:
            type: string
            description: "Helper text explaining what enabling/disabling this does. It also supports markdown links for the reference."
          required:
            type: boolean
            description: Whether the field is mandatory. It is an optional key; if not present, it is treated as optional.
          options:
            type: array
            minItems: 2
            maxItems: 2
            description: "The toggle options. MUST contain exactly two items: one where the value is true, and one where the value is false. (e.g., [{'label': 'Yes', 'value': true}, {'label': 'No', 'value': false}])."
            items:
              type: object
              properties:
                label:
                  type: string
                  description: "Display label (e.g. 'Yes', 'Basic')."
                value:
                  type: boolean
                  description: The actual boolean value (true or false).
              required[2]: label,value
          defaultValue:
            type: object
            description: The default selection. Omit this field entirely if there is no default.
            properties:
              label:
                type: string
                description: "The label of the default option (e.g. 'No', 'Basic')."
              value:
                type: boolean
                description: "The value of the default option (e.g. false, true)."
            required[2]: label,value
          placeholder:
            type: string
            description: "Optional placeholder text shown before selection. Omit if not applicable."
          customInputLabel:
            type: string
            description: "Required custom label for manual/dynamic input (e.g. 'Enter Boolean Value')."
          customHelp:
            type: string
            description: "Required helper text for manual/dynamic input, explaining when to enter true and false values (e.g., 'Enter \"true\" for Basic and \"false\" for Advance')."
          customPlaceholder:
            type: string
            description: "Required placeholder text (such as 'true'). Do NOT use 'E.g.' or 'e.g.'; they must contain direct sample values only. The value must always be a string and wrapped in a string/quotes (e.g., '\"true\"')."
          visibilityCondition:
            type: string
            description: A JavaScript condition for visibility. Omit if always visible.
        required[8]: key,type,label,help,options,customPlaceholder,customInputLabel,customHelp
  required[1]: inputFields
```

### Boolean Examples:

#### Boolean JSON Example:
```json
[
   {
        "key": "column_key",
        "help": "Select yes if the first row contains the column name.",
        "type": "boolean",
        "label": "Does your first row contain column name?",
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
        "placeholder": "Choose Option",
        "customInputLabel": "Does your first row contain column name?",
        "customHelp": "Enter \"true\" if the first row contains the column name, else \"false\".",
        "defaultValue": {
          "label": "Yes",
          "value": true
        },
        "customPlaceholder": "true"
      },
      {
        "key": "search_filter_type",
        "help": "Select the filter type.",
        "type": "boolean",
        "label": "Search Filter Type",
        "options": [
          {
            "label": "Basic",
            "value": true
          },
          {
            "label": "Advance",
            "value": false
          }
        ],
        "required": true,
        "customInputLabel": "Search Filter Type",
        "customHelp": "Enter \"true\" for \"Basic\" and \"false\" for \"Advance\"",
        "defaultValue": {
          "label": "Basic",
          "value": true
        },
        "customPlaceholder": "true"
      },
      {
        "key": "is_pagination",
        "help": "Select yes to enable pagination and enter page size, or no to fetch all content.",
        "type": "boolean",
        "label": "Enable Pagination",
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
        "customInputLabel": "Enable Pagination",
        "customHelp": "Enter \"true\" to enable pagination, or \"false\" to fetch all content.",
        "customPlaceholder": "true",
        "defaultValue": {
          "label": "No",
          "value": false
        }
      },
      {
        "key": "page_location",
        "help": "Select Parent Page to create page under a parent, or Workspace to create a private page.",
        "type": "boolean",
        "label": "Create page at",
        "options": [
          {
            "label": "Workspace",
            "value": false
          },
          {
            "label": "Parent Page",
            "value": true
          }
        ],
        "required": true,
        "customPlaceholder": "true",
        "defaultValue": {
          "label": "Parent Page",
          "value": true
        },
        "customInputLabel": "Create page at",
        "customHelp": "Enter \"true\" to create page under parent page or \"false\" for private page in the workspace."
      }
    ]
    ```
#### Boolean TOON Example:
```toon
[4]:
  - key: column_key
    help: Select yes if the first row contains the column name.
    type: boolean
    label: Does your first row contain column name?
    options[2]{label,value}:
      Yes,true
      No,false
    required: true
    placeholder: Choose Option
    customInputLabel: Does your first row contain column name?
    customHelp: "Enter \"true\" if the first row contains the column name, else \"false\"."
    defaultValue:
      label: Yes
      value: true
    customPlaceholder: "true"
  - key: search_filter_type
    help: Select the filter type.
    type: boolean
    label: Search Filter Type
    options[2]{label,value}:
      Basic,true
      Advance,false
    required: true
    customInputLabel: Search Filter Type
    customHelp: "Enter \"true\" for \"Basic\" and \"false\" for \"Advance\""
    defaultValue:
      label: Basic
      value: true
    customPlaceholder: "true"
  - key: is_pagination
    help: Select yes to enable pagination and enter page size, or no to fetch all content.
    type: boolean
    label: Enable Pagination
    options[2]{label,value}:
      Yes,true
      No,false
    required: false
    customInputLabel: Enable Pagination
    customHelp: "Enter \"true\" to enable pagination, or \"false\" to fetch all content."
    customPlaceholder: "true"
    defaultValue:
      label: No
      value: false
  - key: page_location
    help: Select Parent Page to create page under a parent, or Workspace to create a private page.
    type: boolean
    label: Create page at
    options[2]{label,value}:
      Workspace,false
      Parent Page,true
    required: true
    customPlaceholder: "true"
    defaultValue:
      label: Parent Page
      value: true
    customInputLabel: Create page at
    customHelp: "Enter \"true\" to create page under parent page or \"false\" for private page in the workspace."
```

## Dropdown Static

**Dropdown Static Purpose:**

A Static Dropdown input type is used when the user must select one value from a predefined, fixed list of options. It is suitable when all possible values are known in advance and should not change dynamically.

### Dropdown Static Input Field Generation Rules:
Generate a JSON object strictly following the rules below for a static dropdown field.

**When to Use**
- Use a static dropdown when the user must select one value from a fixed, predefined list and all possible options are known at design time.
**1. Core Rules**
- Create one input field with type: "dropdown".
- Add the new or updated field to the existing inputFields array.
- Only single selection is allowed.
**2. Key Rules**
- key must be unique within inputFields.
- key must not contain a dot (.) or square brackets ([]).
- key must be a stable identifier (e.g. message_type, priority_level).
**3. Type Rule**
- type must always be "dropdown".
**4. Label, Help Rules**
- label: Clean, human-readable description of what the user is selecting (e.g. "Message Type"). It should describe the choice, not the technical value.
- help: Guidance text explaining why the user is making this selection and how it affects behavior. **The value must start with "Select"** (or start from `"select"`, e.g., `"Select the message type."`). It supports string format and markdown links like `[Lean More](https://example.com)`. Both `help` and `customHelp` must be very crisp and to the point.
**5. Required Rule**
- Set required: true if one option must be selected for the action to work.
- Otherwise set required: false.
**6. Placeholder Rule**
- placeholder: Optional text shown in the dropdown before selection (e.g. "Choose Message Type").
- Omit if not applicable.
**7. Options Rules**
- options must be a fixed array. Do not allow dynamic or user-generated options.
- Each option must include:
  - label: user-facing display name (e.g. "High Priority")
  - value: internal value sent to the API (string or number)
- Each option may optionally include:
  - sample: must always be identical to the option's value. In the UI, users see the label with the sample shown in brackets. MANDATORY RULE: If the value is an ID, the sample MUST be included. If the label and sample are exactly the same, then NO sample is needed. Omit otherwise.
  - extraValue: an extra value used in visibility conditions or perform scripts, hidden from users. Can be any valid JSON type (string, number, boolean, object, array). Omit if not needed.
**8. Default Value Rule**
- Set defaultValue only if a sensible default exists.
- MANDATORY RULE: If provided, defaultValue must be an exact, identical copy of one of the items in the options array (all keys and values must match perfectly).
- defaultValue must include label and value, and optionally sample and extraValue if they exist on the matching option.
- Omit defaultValue entirely if there is no default.
**9. Custom Input Rules**
- **help key**: Must focus on selection. **The value must start with "Select"** (e.g. `"Select the spreadsheet."`). It supports string format and markdown links like `[Lean More](https://example.com)`. Both `help` and `customHelp` must be very crisp and to the point.
- **customInputLabel is required**: **It must be short and must NOT start with "Enter"** (e.g. standard label `"Spreadsheet"`, customInputLabel `"Spreadsheet ID"`). If not an ID field, standard label and `customInputLabel` must be the same.
- **customPlaceholder is required**: Provide a relevant numeric or text example (such as `"15"` if expecting an ID). Do NOT use "E.g." or "e.g." in custom placeholders; they must contain direct sample values only. The value of `placeholder` and `customPlaceholder` must always be a string and wrapped in a string/quotes (e.g., `"15"`).
- **customHelp is required**: **It must guide manual input, and should be very crisp and to the point**:
  - **If options are few**: Specify the actual value in the help and explain what will happen (e.g. `"Enter 'text', 'image', or 'audio' to set message type."`).
  - **If options are many**: Write `"Enter {{label name}} ...benefits of the field"` (e.g. `"Enter category ID to assign the video category."`).
**10. Visibility Condition Rule**
- Include visibilityCondition only when the dropdown depends on another field.
- Omit if always visible.
**11. Output Constraint**
- Return only valid JSON.
- Do not add extra properties.
- Do not include explanations or comments.

### Dropdown Static JSON Schema:
```json
{
    "name": "generate_static_dropdown_field",
    "strict": false,
    "schema": {
        "type": "object",
        "properties": {
            "inputFields": {
                "type": "array",
                "description": "The array of input fields including the newly created or updated static dropdown field.",
                "items": {
                    "type": "object",
                    "properties": {
                        "key": {
                            "type": "string",
                            "pattern": "^[^.\\[\\]]*$",
                            "description": "Unique identifier for the field (e.g. 'message_type', 'priority_level'). The key must not contain a dot (.) or square brackets ([])."
                        },
                        "type": {
                            "type": "string",
                            "enum": [
                                "dropdown"
                            ],
                            "description": "Must be 'dropdown'."
                        },
                        "label": {
                            "type": "string",
                            "description": "A human-readable label explaining the choice (e.g. 'Message Type')."
                        },
                        "help": {
                            "type": "string",
                            "description": "Guidance text for the user. It also supports markdown links for the reference."
                        },
                        "required": {
                            "type": "boolean",
                            "description": "Whether the selection is mandatory. It is an optional key; if not present, it is treated as optional."
                        },
                        "placeholder": {
                            "type": "string",
                            "description": "Optional placeholder text shown in the dropdown before selection (e.g. 'Choose Message Type'). Omit if not applicable."
                        },
                        "customHelp": {
                            "type": "string",
                            "description": "Optional custom help text for manual/dynamic input. If the expected value is an ID, explain exactly where the user can find this ID for manual mapping. Omit if not applicable."
                        },
                        "customInputLabel": {
                            "type": "string",
                            "description": "Required label for the manual input mode. If the expected value is an ID, use a format like 'Enter ID' or 'Enter [Entity] ID'."
                        },
                        "customPlaceholder": {
                            "type": "string",
                            "description": "Required placeholder for the manual input mode. Provide a relevant numeric or text example (such as '15' if expecting an ID). Do NOT use 'E.g.' or 'e.g.'; they must contain direct sample values only."
                        },
                        "visibilityCondition": {
                            "type": "string",
                            "description": "A JavaScript condition for visibility. Omit if always visible."
                        },
                        "options": {
                            "type": "array",
                            "description": "The fixed list of choices.",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "label": {
                                        "type": "string",
                                        "description": "The display name of the option (e.g. 'High Priority')."
                                    },
                                    "value": {
                                        "type": [
                                            "string",
                                            "number"
                                        ],
                                        "description": "The internal value sent to the API. Recommended to be string or number."
                                    },
                                    "sample": {
                                        "type": "string",
                                        "description": "Optional string. MUST always be identical to the option's value. In the UI, users see the label with the sample shown in brackets. MANDATORY RULE: If the value is an ID, the sample MUST be included. If the label and sample are exactly the same, then NO sample is needed. Omit otherwise."
                                    },
                                    "extraValue": {
                                        "type": [
                                            "string",
                                            "number",
                                            "boolean",
                                            "object",
                                            "array"
                                        ],
                                        "description": "An optional extra value used in visibility conditions or perform scripts, hidden from users. Can be any valid JSON type. Omit if not needed."
                                    }
                                },
                                "required": [
                                    "label",
                                    "value"
                                ]
                            }
                        },
                        "defaultValue": {
                            "type": "object",
                            "description": "The default object to select initially. MANDATORY RULE: If provided, this object MUST be an exact, identical copy of one of the items in the 'options' array (all keys and values must match perfectly). Omit this field entirely if there is no default.",
                            "properties": {
                                "label": {
                                    "type": "string",
                                    "description": "The display name of the default option."
                                },
                                "value": {
                                    "type": [
                                        "string",
                                        "number"
                                    ],
                                    "description": "The internal value of the default option."
                                },
                                "sample": {
                                    "type": "string",
                                    "description": "Optional string. MUST always be identical to the default option's value. In the UI, users see the label with the sample shown in brackets. MANDATORY RULE: If the value is an ID, the sample MUST be included. If the label and sample are exactly the same, then NO sample is needed. Omit otherwise."
                                },
                                "extraValue": {
                                    "type": [
                                        "string",
                                        "number",
                                        "boolean",
                                        "object",
                                        "array"
                                    ],
                                    "description": "An optional extra value for the default option. Omit if not needed."
                                }
                            },
                            "required": [
                                "label",
                                "value",
                                "sample"
                            ]
                        }
                    },
                    "required": [
                        "key",
                        "type",
                        "label",
                        "help",
                        "options",
                        "customInputLabel",
                        "customPlaceholder",
                        "customHelp"
                    ]
                }
            }
        },
        "required": [
            "inputFields"
        ]
    }
}
```
### Dropdown Static TOON Schema:
```toon
name: generate_static_dropdown_field
strict: false
schema:
  type: object
  properties:
    inputFields:
      type: array
      description: The array of input fields including the newly created or updated static dropdown field.
      items:
        type: object
        properties:
          key:
            type: string
            pattern: "^[^.\[\]]*$"
            description: "Unique identifier for the field (e.g. 'message_type', 'priority_level'). The key must not contain a dot (.) or square brackets ([])."
          type:
            type: string
            enum[1]: dropdown
            description: Must be 'dropdown'.
          label:
            type: string
            description: A human-readable label explaining the choice (e.g. 'Message Type').
          help:
            type: string
            description: "Guidance text for the user. It also supports markdown links for the reference."
          required:
            type: boolean
            description: Whether the selection is mandatory. It is an optional key; if not present, it is treated as optional.
          placeholder:


            type: string
            description: Optional placeholder text shown in the dropdown before selection (e.g. 'Choose Message Type'). Omit if not applicable.
          customHelp:
            type: string
            description: "Optional custom help text for manual/dynamic input. If the expected value is an ID, explain exactly where the user can find this ID for manual mapping. Omit if not applicable."
          customInputLabel:
            type: string
            description: "Required label for the manual input mode. If the expected value is an ID, use a format like 'Enter ID' or 'Enter [Entity] ID'."
          customPlaceholder:


            type: string
            description: "Required placeholder for the manual input mode. Provide a relevant numeric or text example (such as '15' if expecting an ID). Do NOT use 'E.g.' or 'e.g.'; they must contain direct sample values only."
          visibilityCondition:
            type: string
            description: A JavaScript condition for visibility. Omit if always visible.
          options:
            type: array
            description: The fixed list of choices.
            items:
              type: object
              properties:
                label:
                  type: string
                  description: The display name of the option (e.g. 'High Priority').
                value:
                  type[2]: string,number
                  description: The internal value sent to the API. Recommended to be string or number.
                sample:
                  type: string
                  description: "Optional string. MUST always be identical to the option's value. In the UI, users see the label with the sample shown in brackets. MANDATORY RULE: If the value is an ID, the sample MUST be included. If the label and sample are exactly the same, then NO sample is needed. Omit otherwise."
                extraValue:
                  type[5]: string,number,boolean,object,array
                  description: "An optional extra value used in visibility conditions or perform scripts, hidden from users. Can be any valid JSON type. Omit if not needed."
              required[3]: label,value,sample
          defaultValue:
            type: object
            description: "The default object to select initially. MANDATORY RULE: If provided, this object MUST be an exact, identical copy of one of the items in the 'options' array (all keys and values must match perfectly). Omit this field entirely if there is no default."
            properties:
              label:
                type: string
                description: The display name of the default option.
              value:
                type[2]: string,number
                description: The internal value of the default option.
              sample:
                type: string
                description: "Optional string. MUST always be identical to the default option's value. In the UI, users see the label with the sample shown in brackets. MANDATORY RULE: If the value is an ID, the sample MUST be included. If the label and sample are exactly the same, then NO sample is needed. Omit otherwise."
              extraValue:
                type[5]: string,number,boolean,object,array
                description: An optional extra value for the default option. Omit if not needed.
            required[3]: label,value,sample
        required[8]: key,type,label,help,options,customInputLabel,customPlaceholder,customHelp
  required[1]: inputFields
```

### Dropdown Static Examples:

#### Dropdown Static JSON Example:
```json
[
  {
    "key": "message_type",
    "help": "Select the type of message to send based on your media.",
    "type": "dropdown",
    "label": "Message Type",
    "options": [
      {
        "label": "Text",
        "value": "text"
      },
      {
        "label": "Image or GIF",
        "value": "image"
      },
      {
        "label": "Audio",
        "value": "audio"
      },
      {
        "label": "Video",
        "value": "video"
      },
      {
        "label": "Sticker",
        "value": "sticker"
      },
      {
        "label": "Send Published Post",
        "value": "media_share"
      }
    ],
    "required": true,
    "placeholder": "Choose Message Type",
    "customInputLabel": "Message Type",
    "customHelp": "Enter 'text', 'image', 'audio', 'video', 'sticker', or 'media_share' based on media type.",
    "customPlaceholder": "text"
  },
  {
    "key": "video_status",
    "help": "Select the video visibility status.",
    "type": "dropdown",
    "label": "Video Status",
    "options": [
      {
        "label": "Public",
        "value": "public"
      },
      {
        "label": "Private",
        "value": "private"
      },
      {
        "label": "Unlisted",
        "value": "unlisted"
      }
    ],
    "required": true,
    "placeholder": "Choose visibility status",
    "defaultValue": {
      "label": "Public",
      "value": "public"
    },
    "customInputLabel": "Video Status",
    "customHelp": "Enter 'public', 'private', or 'unlisted' to set video status.",
    "customPlaceholder": "public"
  },
   {
    "key": "category_id",
    "help": "Select the video category.",
    "type": "dropdown",
    "label": "Category",
    "options":[
            {
                "label": "Film & Animation",
                "value": "1",
                "sample": "1"
            },
            {
                "label": "Autos & Vehicles",
                "value": "2",
                "sample": "2"
            },
            {
                "label": "Music",
                "value": "10",
                "sample": "10"
            },
            {
                "label": "Pets & Animals",
                "value": "15",
                "sample": "15"
            },
            {
                "label": "Sports",
                "value": "17",
                "sample": "17"
            },
            {
                "label": "Travel & Events",
                "value": "19",
                "sample": "19"
            },
            {
                "label": "Gaming",
                "value": "20",
                "sample": "20"
            },
            {
                "label": "People & Blogs",
                "value": "22",
                "sample": "22"
            },
            {
                "label": "Comedy",
                "value": "23",
                "sample": "23"
            },
            {
                "label": "Entertainment",
                "value": "24",
                "sample": "24"
            },
            {
                "label": "News & Politics",
                "value": "25",
                "sample": "25"
            },
            {
                "label": "Howto & Style",
                "value": "26",
                "sample": "26"
            },
            {
                "label": "Education",
                "value": "27",
                "sample": "27"
            },
            {
                "label": "Science & Technology",
                "value": "28",
                "sample": "28"
            },
            {
                "label": "Nonprofits & Activism",
                "value": "29",
                "sample": "29"
            }
        ],
    "required": true,
    "placeholder": "Choose Category",
    "customInputLabel": "Category ID",
    "customPlaceholder": "22",
    "customHelp": "Enter category ID to assign the video category."
  }
  ]
```
#### Dropdown Static TOON Example:
```toon
[3]:
  - key: message_type
    help: Select the type of message to send based on your media.
    type: dropdown
    label: Message Type
    options[6]{label,value}:
      Text,text
      Image or GIF,image
      Audio,audio
      Video,video
      Sticker,sticker
      Send Published Post,media_share
    required: true
    placeholder: Choose Message Type
    customInputLabel: Message Type
    customHelp: "Enter 'text', 'image', 'audio', 'video', 'sticker', or 'media_share' based on media type."
    customPlaceholder: "text"
  - key: video_status
    help: "Select the video visibility status."
    type: dropdown
    label: Video Status
    options[3]{label,value}:
      Public,public
      Private,private
      Unlisted,unlisted
    required: true
    placeholder: Choose visibility status
    defaultValue:
      label: Public
      value: public
    customInputLabel: Video Status
    customHelp: "Enter 'public', 'private', or 'unlisted' to set video status."
    customPlaceholder: "public"
  - key: category_id
    help: Select the video category.
    type: dropdown
    label: Category
    options[15]{label,value,sample}:
      Film & Animation,"1","1"
      Autos & Vehicles,"2","2"
      Music,"10","10"
      Pets & Animals,"15","15"
      Sports,"17","17"
      Travel & Events,"19","19"
      Gaming,"20","20"
      People & Blogs,"22","22"
      Comedy,"23","23"
      Entertainment,"24","24"
      News & Politics,"25","25"
      Howto & Style,"26","26"
      Education,"27","27"
      Science & Technology,"28","28"
      Nonprofits & Activism,"29","29"
    required: true
    placeholder: Choose Category
    customInputLabel: Category ID
    customPlaceholder: "22"
    customHelp: "Enter category ID to assign the video category."
```


## Multiselect Static

**Multiselect Static Purpose:**

A Static Multiselect input type is used when the user needs to select multiple values from a predefined list of options. It is suitable when all selectable values are known in advance and multiple selections are allowed.

### Multiselect Static Input Field Generation Rules:
Generate a JSON object strictly following the rules below for a static multiselect field.

**When to Use**
- Use a static multiselect when the user needs to select one or more values from a fixed, predefined list and all possible options are known at design time.
**1. Core Rules**
- Create one input field with type: "multiselect".
- Add the new or updated field to the existing inputFields array.
- Multiple selections are allowed.
**2. Key Rules**
- key must be unique within inputFields.
- key must not contain a dot (.) or square brackets ([]).
- key must be a stable identifier (e.g. search_by, output_response).
**3. Type Rule**
- type must always be "multiselect".
**4. Label, Help Rules**
- label: Clean, human-readable description of what the user is selecting (e.g. "Output Response"). It should describe the choice, not the technical value.
- help: Guidance text explaining why the user is making this selection and how it affects behavior. **The value must start with "Select"** (or start from `"select"`, e.g., `"Select the output response format."`). It supports string format and markdown links like `[Lean More](https://example.com)`. Both `help` and `customHelp` must be very crisp and to the point.
**5. Required Rule**
- Set required: true if at least one option must be selected for the action to work.
- Otherwise set required: false.
**6. Placeholder Rule**
- placeholder: Optional text shown in the multiselect before selection (e.g. "Choose Return Type").
- Omit if not applicable.
**7. Options Rules**
- options must be a fixed array. Do not allow dynamic or user-generated options.
- Each option must include:
  - label: user-facing display name (e.g. "First Name")
  - value: internal value sent to the API (string or number)
- Each option may optionally include:
  - sample: must always be identical to the option's value. In the UI, users see the label with the sample shown in brackets. MANDATORY RULE: If the value is an ID, the sample MUST be included. If the label and sample are exactly the same, then NO sample is needed. Omit otherwise.
**8. Default Value Rule**
- Set defaultValue only if a sensible default exists.
- MANDATORY RULE: If provided, defaultValue must be an array of objects where each object is an exact, identical copy of one of the items in the options array (all keys and values must match perfectly).
- Each object in defaultValue must include label and value, and optionally sample if it exists on the matching option.
- Omit defaultValue entirely if there is no default.
**9. Custom Input Rules**
- **help key**: Must focus on selection. **The value must start with "Select"** (e.g. `"Select the fields to include in the output."`). It supports string format and markdown links like `[Lean More](https://example.com)`. Both `help` and `customHelp` must be very crisp and to the point.
- **customInputLabel is required**: **It must be short and must NOT start with "Enter"** (e.g. standard label `"Output Response"`, customInputLabel `"Output Response"`). If not an ID field, standard label and `customInputLabel` must be the same.
- **customPlaceholder is required**: Provide a relevant array example (such as `"[\"markdown\",\"block\"]"` or `"[\"first_name\",\"email\"]"`). Do NOT use "E.g." or "e.g." in custom placeholders; they must contain direct sample values only. The value of `placeholder` and `customPlaceholder` must always be a string and wrapped in a string/quotes.
- **customHelp is required**: **It must guide manual input, and should be very crisp and to the point**:
  - **If options are few**: Specify the actual value in the help and explain what will happen (e.g. `"Enter 'markdown', 'blocks', or 'html' in an array format."`).
  - **If options are many**: Write `"Enter {{label name}} ...benefits of the field"` (e.g. `"Enter priority levels in array... to filter tasks."`).
**10. Visibility Condition Rule**
- Include visibilityCondition only when the multiselect depends on another field.
- Omit if always visible.
**11. Output Constraint**
- Return only valid JSON.
- Do not add extra properties.
- Do not include explanations or comments.

### Multiselect Static JSON Schema:
```json
{
    "name": "generate_multiselect_field",
    "strict": false,
    "schema": {
        "type": "object",
        "properties": {
            "inputFields": {
                "type": "array",
                "description": "The array of input fields including the newly created or updated multiselect field.",
                "items": {
                    "type": "object",
                    "properties": {
                        "key": {
                            "type": "string",
                            "pattern": "^[^.\\[\\]]*$",
                            "description": "Unique identifier for the field (e.g. 'search_by', 'output_response'). The key must not contain a dot (.) or square brackets ([])."
                        },
                        "type": {
                            "type": "string",
                            "enum": [
                                "multiselect"
                            ],
                            "description": "Must be 'multiselect'."
                        },
                        "label": {
                            "type": "string",
                            "description": "A human-readable label explaining the choice (e.g. 'Search By')."
                        },
                        "help": {
                            "type": "string",
                            "description": "Guidance text for the user. It also supports markdown links for the reference."
                        },
                        "required": {
                            "type": "boolean",
                            "description": "Whether selecting at least one option is mandatory. It is an optional key; if not present, it is treated as optional."
                        },
                        "placeholder": {
                            "type": "string",
                            "description": "Optional placeholder text shown before selection. Omit if not applicable."
                        },
                        "customHelp": {
                            "type": "string",
                            "description": "Optional custom help text for manual/dynamic input. If expecting specific IDs, explain where the user can find them. Omit if not applicable."
                        },
                        "customInputLabel": {
                            "type": "string",
                            "description": "Required label for the manual input mode (e.g., 'Enter fields in array')."
                        },
                        "customPlaceholder": {
                            "type": "string",
                            "description": "Required placeholder for the manual input mode. Provide a relevant array example (such as '[\"markdown\",\"block\"]' or '[\"first_name\",\"email\"]'). Do NOT use 'E.g.' or 'e.g.'; they must contain direct sample values only."
                        },
                        "visibilityCondition": {
                            "type": "string",
                            "description": "A JavaScript condition for visibility. Omit if always visible."
                        },
                        "options": {
                            "type": "array",
                            "description": "The fixed list of available choices.",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "label": {
                                        "type": "string",
                                        "description": "The display name of the option (e.g. 'First Name')."
                                    },
                                    "value": {
                                        "type": [
                                            "string",
                                            "number"
                                        ],
                                        "description": "The internal value sent to the API. Recommended to be string or number."
                                    },
                                    "sample": {
                                        "type": "string",
                                        "description": "Optional string. MUST always be identical to the option's value. In the UI, users see the label with the sample shown in brackets. MANDATORY RULE: If the value is an ID, the sample MUST be included. If the label and sample are exactly the same, then NO sample is needed. Omit otherwise."
                                    }
                                },
                                "required": [
                                    "label",
                                    "value",
                                    "sample"
                                ]
                            }
                        },
                        "defaultValue": {
                            "type": "array",
                            "description": "The default array of objects to select initially. MANDATORY RULE: If provided, this MUST be an array containing exact identical copies of items from the 'options' array. Omit this field entirely if there is no default.",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "label": {
                                        "type": "string",
                                        "description": "The display name of the default option."
                                    },
                                    "value": {
                                        "type": [
                                            "string",
                                            "number"
                                        ],
                                        "description": "The internal value of the default option."
                                    },
                                    "sample": {
                                        "type": "string",
                                        "description": "Optional string. MUST always be identical to the default option's value. In the UI, users see the label with the sample shown in brackets. MANDATORY RULE: If the value is an ID, the sample MUST be included. If the label and sample are exactly the same, then NO sample is needed. Omit otherwise."
                                    }
                                },
                                "required": [
                                    "label",
                                    "value",
                                    "sample"
                                ]
                            }
                        }
                    },
                    "required": [
                        "key",
                        "type",
                        "label",
                        "help",
                        "options",
                        "customInputLabel",
                        "customPlaceholder",
                        "customHelp"
                    ]
                }
            }
        },
        "required": [
            "inputFields"
        ]
    }
}
```
### Multiselect Static TOON Schema:
```toon
name: generate_multiselect_field
strict: false
schema:
  type: object
  properties:
    inputFields:
      type: array
      description: The array of input fields including the newly created or updated multiselect field.
      items:
        type: object
        properties:
          key:
            type: string
            pattern: "^[^.\[\]]*$"
            description: "Unique identifier for the field (e.g. 'search_by', 'output_response'). The key must not contain a dot (.) or square brackets ([])."
          type:
            type: string
            enum[1]: multiselect
            description: Must be 'multiselect'.
          label:
            type: string
            description: A human-readable label explaining the choice (e.g. 'Search By').
          help:
            type: string
            description: "Guidance text for the user. It also supports markdown links for the reference."
          required:
            type: boolean
            description: Whether selecting at least one option is mandatory. It is an optional key; if not present, it is treated as optional.
          placeholder:


            type: string
            description: Optional placeholder text shown before selection. Omit if not applicable.
          customHelp:
            type: string
            description: "Optional custom help text for manual/dynamic input. If expecting specific IDs, explain where the user can find them. Omit if not applicable."
          customInputLabel:
            type: string
            description: "Required label for the manual input mode (e.g., 'Enter fields in array')."
          customPlaceholder:


            type: string
            description: "Required placeholder for the manual input mode. Provide a relevant array example (such as '[\"markdown\",\"block\"]' or '[\"first_name\",\"email\"]'). Do NOT use 'E.g.' or 'e.g.'; they must contain direct sample values only."
          visibilityCondition:
            type: string
            description: A JavaScript condition for visibility. Omit if always visible.
          options:
            type: array
            description: The fixed list of available choices.
            items:
              type: object
              properties:
                label:
                  type: string
                  description: The display name of the option (e.g. 'First Name').
                value:
                  type[2]: string,number
                  description: The internal value sent to the API. Recommended to be string or number.
                sample:
                  type: string
                  description: "Optional string. MUST always be identical to the option's value. In the UI, users see the label with the sample shown in brackets. MANDATORY RULE: If the value is an ID, the sample MUST be included. If the label and sample are exactly the same, then NO sample is needed. Omit otherwise."
              required[3]: label,value,sample
          defaultValue:
            type: array
            description: "The default array of objects to select initially. MANDATORY RULE: If provided, this MUST be an array containing exact identical copies of items from the 'options' array. Omit this field entirely if there is no default."
            items:
              type: object
              properties:
                label:
                  type: string
                  description: The display name of the default option.
                value:
                  type[2]: string,number
                  description: The internal value of the default option.
                sample:
                  type: string
                  description: "Optional string. MUST always be identical to the default option's value. In the UI, users see the label with the sample shown in brackets. MANDATORY RULE: If the value is an ID, the sample MUST be included. If the label and sample are exactly the same, then NO sample is needed. Omit otherwise."
              required[3]: label,value,sample
        required[8]: key,type,label,help,options,customInputLabel,customPlaceholder,customHelp
  required[1]: inputFields
```

### Multiselect Static JSON Example:
```json
[
  {
    "key": "output_response",
    "help": "Select the output response format (markdown, blocks, or html).",
    "type": "multiselect",
    "label": "Output Response",
    "options": [
      {
        "label": "Markdown",
        "value": "markdown",
        "sample": "markdown"
      },
      {
        "label": "Blocks",
        "value": "blocks",
        "sample": "blocks"
      },
      {
        "label": "HTML",
        "value": "html",
        "sample": "html"
      }
    ],
    "required": true,
    "placeholder": "Choose Return Type",
    "defaultValue": [
      {
        "label": "Markdown",
        "value": "markdown",
        "sample": "markdown"
      }
    ],
    "customInputLabel": "Output Response",
    "customHelp": "Enter 'markdown', 'blocks', or 'html' in an array format to customize the output response.",
    "customPlaceholder": "[\"markdown\",\"block\"]"
  },
  {
    "key": "search_by",
    "help": "Select the fields to search from.",
    "type": "multiselect",
    "label": "Search By",
    "options": [
      {
        "label": "ID",
        "value": "id",
        "sample": "id"
      },
      {
        "label": "Phone",
        "value": "phone",
        "sample": "phone"
      },
      {
        "label": "Email",
        "value": "email",
        "sample": "email"
      },
      {
        "label": "First Name",
        "value": "first_name",
        "sample": "first_name"
      }
    ],
    "required": true,
    "customHelp": "Enter 'id', 'phone', 'email', or 'first_name' in an array format to select fields to search by.",
    "customPlaceholder": "[\"first_name\",\"email\"]",
    "customInputLabel": "Search By",
    "placeholder": "Choose Search Fields"
  }
]
```

### Multiselect Static TOON Example:
```toon
[2]:
  - key: output_response
    help: "Select the output response format (markdown, blocks, or html)."
    type: multiselect
    label: Output Response
    options[3]{label,value,sample}:
      Markdown,markdown,markdown
      Blocks,blocks,blocks
      HTML,html,html
    required: true
    placeholder: Choose Return Type
    defaultValue[1]{label,value,sample}:
      Markdown,markdown,markdown
    customInputLabel: Output Response
    customHelp: "Enter 'markdown', 'blocks', or 'html' in an array format to customize the output response."
    customPlaceholder: "[\"markdown\",\"block\"]"
  - key: search_by
    help: Select the fields to search from.
    type: multiselect
    label: Search By
    options[4]{label,value,sample}:
      ID,id,id
      Phone,phone,phone
      Email,email,email
      First Name,first_name,first_name
    required: true
    customHelp: Enter 'id', 'phone', 'email', or 'first_name' in an array format to select fields to search by.
    customPlaceholder: "[\"first_name\",\"email\"]"
    customInputLabel: Search By
    placeholder: Choose Search Fields
```

## AI Field

**AI Field Purpose:**

The AI Field provides customizable AI responses to automate processes based on structured prompts and dynamic data inputs. The user interacts with the AI only during setup configuration, allowing the AI to generate a structured response that is then used in the perform code.

### AI Field Input Field Generation Rules:
Generate a JSON object strictly following the rules below for an AI field.

**When to Use**
- Use an AI Field when you need an AI assistant to generate complex schemas or structured data from user inputs during configuration, which will subsequently be used in the perform code.

**1. Core Rules**
- Create one input field with `type: "aifield"`.
- Add the new or updated field to the existing `inputFields` array.

**2. Key Rules**
- `key` must be unique within `inputFields`.
- `key` must not contain a dot (`.`).
- `key` must be a stable identifier (e.g. `filter_conditions`, `content_block`).

**3. Type Rule**
- `type` must always be `"aifield"`.

**4. Label & Help Rules**
- `label`: A human-readable display name explaining the field.
- `help`: Instructional guidance text for the user on how to use this field. **The value must start with "Enter"** (e.g., `"Enter query to generate content."`). It supports string format and markdown links like `[Lean More](https://example.com)`. Both `help` and `customHelp` must be very crisp and to the point.

**5. Prompt Rule**
- `prompt`: The system prompt or instructions sent to the AI. This defines the AI's behavior, task, or role, telling it how to process the user's input and format the output (e.g. "Convert the input into a JSON array...").

**6. Suggestion Generator Rule**
- `suggestionGenerator`: JavaScript code that provides dynamic context or fetches a schema (source of data) from which the AI will generate results.
- **MANDATORY**: This key MUST be present in the JSON. If no dynamic data or contextual schema is needed, set its value to an empty string `""`.

**7. Required Rule**
- Set `required: true` if providing input to this field is mandatory.
- Otherwise set `required: false`.

**8. Placeholder Rule**
- `placeholder`: Optional text showing an example input to guide the user. Can be an example query or expected value. Omit if not applicable. The value must always be a string and wrapped in a string/quotes.

**9. Visibility Condition Rule**
- Include `visibilityCondition` only when the field depends on another field's state.
- Omit this field entirely if always visible.

**10. Output Constraint**
- Return only valid JSON.
- Do not add extra properties not defined in the schema.
- Do not include explanations or comments.

### AI Field JSON Schema:
```json
{
    "name": "generate_aifield",
    "strict": false,
    "schema": {
        "type": "object",
        "properties": {
            "inputFields": {
                "type": "array",
                "description": "The array of input fields including the newly created or updated aifield.",
                "items": {
                    "type": "object",
                    "properties": {
                        "key": {
                            "type": "string",
                            "pattern": "^[^.\\[\\]]*$",
                            "description": "Unique identifier for the field (e.g. 'filter_conditions', 'content_block'). The key must not contain a dot (.) or square brackets ([])."
                        },
                        "type": {
                            "type": "string",
                            "enum": [
                                "aifield"
                            ],
                            "description": "Must be 'aifield'."
                        },
                        "label": {
                            "type": "string",
                            "description": "A human-readable label explaining the field."
                        },
                        "help": {
                            "type": "string",
                            "description": "Guidance text for the user. It also supports markdown links for the reference."
                        },
                        "prompt": {
                            "type": "string",
                            "description": "The system prompt or instructions sent to the AI. This tells the AI how to process the user's input and format the output (e.g. 'Convert the input into a JSON array...')."
                        },
                        "required": {
                            "type": "boolean",
                            "description": "Whether providing input to this field is mandatory. It is an optional key; if not present, it is treated as optional."
                        },
                        "placeholder": {
                            "type": "string",
                            "description": "Optional placeholder text showing an example input. Can be prompt or value. Omit if not applicable."
                        },
                        "suggestionGenerator": {
                            "type": "string",
                            "description": "JavaScript code that fetches a schema or context to send to the AI. This key MUST be present in the JSON, but return an empty string \"\" if no dynamic suggestions/schema are needed."
                        },
                        "visibilityCondition": {
                            "type": "string",
                            "description": "A JavaScript condition for visibility. Omit this field entirely if always visible."
                        }
                    },
                    "required": [
                        "key",
                        "type",
                        "label",
                        "help",
                        "prompt",
                        "suggestionGenerator"
                    ]
                }
            }
        },
        "required": [
            "inputFields"
        ]
    }
}
```

### AI Field TOON Schema:
```toon
name: generate_aifield
strict: false
schema:
  type: object
  properties:
    inputFields:
      type: array
      description: The array of input fields including the newly created or updated aifield.
      items:
        type: object
        properties:
          key:
            type: string
            pattern: "^[^.\[\]]*$"
            description: "Unique identifier for the field (e.g. 'filter_conditions', 'content_block'). The key must not contain a dot (.) or square brackets ([])."
          type:
            type: string
            enum[1]: aifield
            description: Must be 'aifield'.
          label:
            type: string
            description: A human-readable label explaining the field.
          help:
            type: string
            description: "Guidance text for the user. It also supports markdown links for the reference."
          prompt:
            type: string
            description: The system prompt or instructions sent to the AI. This tells the AI how to process the user's input and format the output (e.g. 'Convert the input into a JSON array...').
          required:
            type: boolean
            description: Whether providing input to this field is mandatory. It is an optional key; if not present, it is treated as optional.
          placeholder:


            type: string
            description: Optional placeholder text showing an example input. Can be prompt or value. Omit if not applicable.
          suggestionGenerator:
            type: string
            description: "JavaScript code that fetches a schema or context to send to the AI. This key MUST be present in the JSON, but return an empty string \"\" if no dynamic suggestions/schema are needed."
          visibilityCondition:
            type: string
            description: A JavaScript condition for visibility. Omit this field entirely if always visible.
        required[6]: key,type,label,help,prompt,suggestionGenerator
  required[1]: inputFields
```


### AI Field Examples

#### AI Field JSON Example:
```json
[
    {
    "key": "filterConditions",
    "help": "Filters in JSON when supplied, limits which pages are returned based on the filter conditions. Eg., { \"and\": [ { \"property\": \"Status\", \"select\": { \"equals\": \"done\" } } ] } . [Learn More](https://developers.notion.com/reference/filter-data-source-entries)",
    "type": "aifield",
    "label": "Filter Conditions",
    "prompt": "Generate a Notion API JSON filter condition based on the user request and provided schema. Support complex AND/OR structures.\n\n**CRITICAL Output Structure:**\n* Return the raw filter object directly at the root. Do NOT wrap the output inside a \"filter\" key.\n    * *Correct:* `{\"property\": \"Email\", \"email\": {\"equals\": \"...\"}}`\n    * *Wrong:* `{\"filter\": {\"property\": \"Email\", ...}}`\n**CRITICAL Rules for Variables (e.g., `${context.req.body.value}`):**\n* **Strings (email, rich_text, select):** MUST be wrapped in double quotes. \n    * *Format:* `{\"equals\": \"${context.req.body.email}\"}`\n* **Numbers/Booleans:** MUST NOT be wrapped in quotes. \n    * *Format:* `{\"equals\": ${context.req.body.age}}`\nOutput ONLY valid JSON. No markdown backticks, code formatting, or explanations.",
    "required": false,
    "placeholder": "{ \"and\": [ { \"property\": \"Status\", \"select\": { \"equals\": \"done\" } } ] }",
    "suggestionGenerator": "const data_source_id = context?.inputData?.data_source_id;\n\n  const url = `https://api.notion.com/v1/data_sources/${data_source_id}`;\n\n    const response = await axios.get(url, {\n      headers: {\n        'Notion-Version': '2025-09-03', // Use the current API version\n      }\n    });\n    const data = response.data;\n    const columns = data.properties;\n    // Extract column names and their field types\n    const columnDetails = Object.keys(columns).map((columnName) => {\n      return {\n        columnName: columnName,\n        fieldType: columns[columnName].type,\n      };\n    });\nreturn columnDetails;"
  },
    {
        "key": "content_block",
        "help": "Give a prompt to generate child content to append to a container block as an array of block objects.[Learn More](https://developers.notion.com/reference/block)",
        "type": "aifield",
        "label": "Content Block",
        "prompt": "Convert the input into a Notion **blocks JSON array**.  - Each item: `{ \"object\": \"block\", \"type\": \"<valid_notion_type>\", \"<type>\": { ... } }` - Use correct Notion block types, `rich_text` with `plain_text` for text. - Use `children` only for block types that support children. - For media (`image`, `file`, `video`, `audio`, `pdf`), use proper `file` / `external` / `file_upload` objects.  Return **only** the JSON array of block objects.",
        "required": false,
        "placeholder": "Add the text para and bulleted list below.",
        "suggestionGenerator": "",
        "visibilityCondition": "context?.inputData?.page_content?.template_mode === 'none'"
      }
]
```

#### AI Field TOON Example:
```toon
[2]:
  - key: filterConditions
    help: "Filters in JSON when supplied, limits which pages are returned based on the filter conditions. Eg., { \"and\": [ { \"property\": \"Status\", \"select\": { \"equals\": \"done\" } } ] } . [Learn More](https://developers.notion.com/reference/filter-data-source-entries)"
    type: aifield
    label: Filter Conditions
    prompt: "Generate a Notion API JSON filter condition based on the user request and provided schema. Support complex AND/OR structures.\n\n**CRITICAL Output Structure:**\n* Return the raw filter object directly at the root. Do NOT wrap the output inside a \"filter\" key.\n    * *Correct:* `{\"property\": \"Email\", \"email\": {\"equals\": \"...\"}}`\n    * *Wrong:* `{\"filter\": {\"property\": \"Email\", ...}}`\n**CRITICAL Rules for Variables (e.g., `${context.req.body.value}`):**\n* **Strings (email, rich_text, select):** MUST be wrapped in double quotes. \n    * *Format:* `{\"equals\": \"${context.req.body.email}\"}`\n* **Numbers/Booleans:** MUST NOT be wrapped in quotes. \n    * *Format:* `{\"equals\": ${context.req.body.age}}`\nOutput ONLY valid JSON. No markdown backticks, code formatting, or explanations."
    required: false
    placeholder: "{ \"and\": [ { \"property\": \"Status\", \"select\": { \"equals\": \"done\" } } ] }"
    suggestionGenerator: "const data_source_id = context?.inputData?.data_source_id;\n\n  const url = `https://api.notion.com/v1/data_sources/${data_source_id}`;\n\n    const response = await axios.get(url, {\n      headers: {\n        'Notion-Version': '2025-09-03', // Use the current API version\n      }\n    });\n    const data = response.data;\n    const columns = data.properties;\n    // Extract column names and their field types\n    const columnDetails = Object.keys(columns).map((columnName) => {\n      return {\n        columnName: columnName,\n        fieldType: columns[columnName].type,\n      };\n    });\nreturn columnDetails;"
  - key: content_block
    help: "Give a prompt to generate child content to append to a container block as an array of block objects.[Learn More](https://developers.notion.com/reference/block)"
    type: aifield
    label: Content Block
    prompt: "Convert the input into a Notion **blocks JSON array**.  - Each item: `{ \"object\": \"block\", \"type\": \"<valid_notion_type>\", \"<type>\": { ... } }` - Use correct Notion block types, `rich_text` with `plain_text` for text. - Use `children` only for block types that support children. - For media (`image`, `file`, `video`, `audio`, `pdf`), use proper `file` / `external` / `file_upload` objects.  Return **only** the JSON array of block objects."
    required: false
    placeholder: Add the text para and bulleted list below.
    suggestionGenerator: ""
    visibilityCondition: context?.inputData?.page_content?.template_mode === 'none'
```

## Help Static

**Help Static Purpose:**

A Static Help field is used to display static instructional content, warnings, or detailed guides directly within the UI (typically presented as an info block). It does not natively accept user input but instead provides structured information using plain text, HTML, or Markdown to guide the user during setup or configuration.

### Help Static Input Field Generation Rules:
Generate a JSON object strictly following the rules below for a static help field.

**When to Use**
- Use a Static Help field when you need to provide detailed step-by-step instructions, display important information, or guide the user visually within the form.
- Use it in manual triggers to define step-by-step instructions for copying a webhook link from viaSocket and pasting it into the SaaS platform.

**1. Core Rules**
- Create one object with `type: "help"`.
- Add the new or updated help field to the existing `inputFields` array.

**2. Key Rules**
- `key` must be unique within `inputFields`.
- `key` must not contain a dot (`.`).
- `key` must be a stable identifier (e.g. `help_webhook`, `help_send_message`).

**3. Type Rule**
- `type` must always be exactly `"help"`.

**4. Help Content Rules**
- `help`: This property contains the actual instructional content.
- It supports plain text, HTML tags (like `<ul>`, `<li>`, `<strong>`, `<br>`), and Markdown formatting (including links).
- Ensure the content is clear and properly formatted for readability within the UI block.

**5. Visibility Condition Rule**
- Include `visibilityCondition` only when the help block depends on another field's state.
- Omit this field entirely if always visible.

**6. Output Constraint**
- Return only valid JSON.
- Do not add extra properties not defined in the schema (e.g., no `label`, `required`, or `placeholder` as they do not apply to a help display block).
- Do not include explanations or comments.

### Help Static JSON Schema:
```json
{
    "name": "generate_help_field",
    "strict": false,
    "schema": {
        "type": "object",
        "properties": {
            "inputFields": {
                "type": "array",
                "description": "The array of input fields including the newly created or updated help field.",
                "items": {
                    "type": "object",
                    "properties": {
                        "key": {
                            "type": "string",
                            "pattern": "^[^.\\[\\]]*$",
                            "description": "Unique identifier for the field (e.g. 'help_webhook', 'help_send_message'). The key must not contain a dot (.) or square brackets ([])."
                        },
                        "type": {
                            "type": "string",
                            "enum": [
                                "help"
                            ],
                            "description": "Must be exactly 'help'."
                        },
                        "help": {
                            "type": "string",
                            "description": "The instructional content to display to the user. This supports plain text, HTML (e.g., <ul>, <li>, <strong>), and Markdown format. It also supports markdown links for the reference."
                        },
                        "visibilityCondition": {
                            "type": "string",
                            "description": "A JavaScript condition for visibility of the help block. Omit if always visible."
                        }
                    },
                    "required": [
                        "key",
                        "type",
                        "help"
                    ]
                }
            }
        },
        "required": [
            "inputFields"
        ]
    }
}
```
### Help Static TOON Schema:
```toon
name: generate_help_field
strict: false
schema:
  type: object
  properties:
    inputFields:
      type: array
      description: The array of input fields including the newly created or updated help field.
      items:
        type: object
        properties:
          key:
            type: string
            pattern: "^[^.\[\]]*$"
            description: "Unique identifier for the field (e.g. 'help_webhook', 'help_send_message'). The key must not contain a dot (.) or square brackets ([])."
          type:
            type: string
            enum[1]: help
            description: Must be exactly 'help'.
          help:
            type: string
            description: "The instructional content to display to the user. This supports plain text, HTML (e.g., <ul>, <li>, <strong>), and Markdown format. It also supports markdown links for the reference."
          visibilityCondition:
            type: string
            description: A JavaScript condition for visibility of the help block. Omit if always visible.
        required[3]: key,type,help
  required[1]: inputFields
```
### Help Static Examples:
#### Help Static JSON Example:
```json
[ 
  {
    "key": "help_webhook",
    "help": "<ul style=\"list-style-type: disc; padding-left: 20px;\">    <li>Sign in to <strong>WordPress account</strong>.</li>    <li>Locate and edit the form that you wish to integrate.</li>    <li>Within the form settings, navigate to the <strong>\"Actions after submit\"</strong> section.</li>    <li>Add a new action by selecting <strong>\"Webhook\"</strong>.</li>    <li>Enable the Webhook functionality by toggling it on.</li>    <li>Enter the previously copied <strong>webhook URL</strong> into the designated field.</li>    <li>Save the changes made to the page.</li>    <li>Access the live version of the page.</li>    <li>Fill out and submit the form.</li>    <li>This submission will trigger the sending of the webhook to <strong>viaSocket</strong>.</li> </ul>",
    "type": "help"
  },
  {
    "key": "help_send_message",
    "help": "You can send a message on Instagram DM up to 24 hours after receiving a message from a user.<br> <br>A maximum of 3 buttons (URL and postback combined) are allowed in the button template message.",
    "type": "help",
    "visibilityCondition": "context?.inputData?.message_type === 'button_template'"
  }
]
```
#### Help Static TOON Example:
```toon
[2]:
  - key: help_webhook
    help: "<ul style=\"list-style-type: disc; padding-left: 20px;\">    <li>Sign in to <strong>WordPress account</strong>.</li>    <li>Locate and edit the form that you wish to integrate.</li>    <li>Within the form settings, navigate to the <strong>\"Actions after submit\"</strong> section.</li>    <li>Add a new action by selecting <strong>\"Webhook\"</strong>.</li>    <li>Enable the Webhook functionality by toggling it on.</li>    <li>Enter the previously copied <strong>webhook URL</strong> into the designated field.</li>    <li>Save the changes made to the page.</li>    <li>Access the live version of the page.</li>    <li>Fill out and submit the form.</li>    <li>This submission will trigger the sending of the webhook to <strong>viaSocket</strong>.</li> </ul>"
    type: help
  - key: help_send_message
    help: You can send a message on Instagram DM up to 24 hours after receiving a message from a user.<br> <br>A maximum of 3 buttons (URL and postback combined) are allowed in the button template message.
    type: help
    visibilityCondition: context?.inputData?.message_type === 'button_template'
```

## Input Group Static

**Input Group Static Purpose:**

An Input Group Static field is used to logically group related input fields together under a single label and optional help text. It helps organize complex forms and, by leveraging the `whereClause` feature, can uniquely display nested dropdown and multiselect fields inline as a readable sentence.

### Input Group Static Input Field Generation Rules:
Generate a JSON object strictly following the rules below for an input group.

**When to Use**
- Use an Input Group when you need to bundle related fields for better logical organization (e.g., "Search Filters", "Pagination Settings").
- Use an Input Group with `whereClause: true` when you want to create an interactive conversational UI block ("readable sentence layout").

**1. Core Rules**
- Create an object with `type: "input groups"`.
- Add the new or updated group to the existing `inputFields` array.
- The group must contain a `fields` array.
- **Nesting Support**: Input group fields can be nested (created inside a static input group or a dynamic input group).

**2. Key Rules**
- `key` must be unique within `inputFields`.
- `key` must not contain a dot (`.`).
- `key` must be a stable identifier describing the group.

**3. Type Rule**
- `type` must be exactly `"input groups"`.

**4. Label & Help Rules**
- `label`: A human-readable display name summarizing the group (e.g., "Search Filter").
- `help`: Guidance text explaining the entire group's purpose. Can be an empty string if no guidance is needed. **When specified, the value must start with "Enter"** (e.g., `"Enter search filters."`). It supports string format and markdown links like `[Lean More](https://example.com)`. Both `help` and `customHelp` must be very crisp and to the point.

**5. Where Clause Rule**
- `whereClause`: A boolean flag (`true`/`false`).
- Set `whereClause: true` to display the contained items inline, creating a readable sentence out of dropdown choices.
- **Recommendation**: When `whereClause: true`, it is recommended to use `dropdown` or `multiselect` fields for optimal sentence UI. Other field types are allowed but may not render inline.
- **Label & Help**: `label` and `help` are not mandatory in the input group field type when `whereClause` is enabled.
- Omit `whereClause` entirely if not applicable.

**6. Fields Array Rules**
- `fields`: A required array where each element is a complete, independently valid input field object.
- Elements in `fields` must fully adhere to their designated `type` rules (e.g., `string`, `dropdown`, `boolean`, `aifield`, `help`, or nested `input groups`).
- You must generate the complete schema for each nested item.

**7. Visibility Condition Rule**
- Include `visibilityCondition` only when the entire group's visibility depends on another field.
- Omit if the group is unconditionally visible.

**8. Output Constraint**
- Return only valid JSON.
- Never add undocumented fields.

### Input Group Static JSON Schema:
```json
{
    "name": "generate_input_group_field",
    "strict": false,
    "schema": {
        "type": "object",
        "properties": {
            "inputFields": {
                "type": "array",
                "description": "The array of input fields including the newly created or updated input group field.",
                "items": {
                    "type": "object",
                    "properties": {
                        "key": {
                            "type": "string",
                            "pattern": "^[^.\\[\\]]*$",
                            "description": "Unique identifier for the group (e.g. 'search_filter', 'settings'). The key must not contain a dot (.) or square brackets ([])."
                        },
                        "type": {
                            "type": "string",
                            "enum": [
                                "input groups"
                            ],
                            "description": "Must be exactly 'input groups'."
                        },
                        "label": {
                            "type": "string",
                            "description": "A human-readable label explaining the entire group (e.g. 'Search Filter')."
                        },
                        "help": {
                            "type": "string",
                            "description": "Guidance text for the user regarding this entire group. Can be an empty string."
                        },
                        "whereClause": {
                            "type": "boolean",
                            "description": "If true, transforms the input group into a readable sentence layout in the UI. Omit this field entirely if false or not applicable."
                        },
                        "visibilityCondition": {
                            "type": "string",
                            "description": "A JavaScript condition for visibility of the entire group. Omit if always visible."
                        },
                        "fields": {
                            "type": "array",
                            "description": "The array of fields contained within this group. 'whereClause' enables a UI sentence layout, recommended fields are 'dropdown' and 'multiselect', other field types can be used.",
                            "items": {
                                "type": "object",
                                "description": "A complete field object (can be string, number, boolean, dropdown, multiselect, aifield, help, or a nested input group). The AI must generate the full, valid structure for whichever type it chooses based on the standard rules for that type.",
                                "properties": {
                                    "key": {
                                        "type": "string",
                                        "pattern": "^[^.\\[\\]]*$"
                                    },
                                    "type": {
                                        "type": "string",
                                        "enum": [
                                            "string",
                                            "number",
                                            "boolean",
                                            "dropdown",
                                            "multiselect",
                                            "aifield",
                                            "help",
                                            "input groups"
                                        ]
                                    }
                                },
                                "required": [
                                    "key",
                                    "type"
                                ]
                            }
                        }
                    },
                    "required": [
                        "key",
                        "type",
                        "label",
                        "help",
                        "fields"
                    ]
                }
            }
        },
        "required": [
            "inputFields"
        ]
    }
}
```
### Input Group Static TOON Schema:
```toon
name: generate_input_group_field
strict: false
schema:
  type: object
  properties:
    inputFields:
      type: array
      description: The array of input fields including the newly created or updated input group field.
      items:
        type: object
        properties:
          key:
            type: string
            pattern: "^[^.\[\]]*$"
            description: "Unique identifier for the group (e.g. 'search_filter', 'settings'). The key must not contain a dot (.) or square brackets ([])."
          type:
            type: string
            enum[1]: input groups
            description: Must be exactly 'input groups'.
          label:
            type: string
            description: A human-readable label explaining the entire group (e.g. 'Search Filter').
          help:
            type: string
            description: Guidance text for the user regarding this entire group. Can be an empty string.
          whereClause:
            type: boolean
            description: "If true, transforms the input group into a readable sentence layout in the UI. Omit this field entirely if false or not applicable."
          visibilityCondition:
            type: string
            description: A JavaScript condition for visibility of the entire group. Omit if always visible.
          fields:
            type: array
            description: "The array of fields contained within this group. MANDATORY RULE: If 'whereClause' is true, this array MUST ONLY contain fields where the 'type' is 'dropdown' or 'multiselect'."
            items:
              type: object
              description: "A complete field object (can be string, number, boolean, dropdown, multiselect, aifield, help, or a nested input group). The AI must generate the full, valid structure for whichever type it chooses based on the standard rules for that type."
              properties:
                key:
                  type: string
                  pattern: "^[^.\[\]]*$"
                type:
                  type: string
                  enum[8]: string,number,boolean,dropdown,multiselect,aifield,help,"input groups"
              required[2]: key,type
        required[5]: key,type,label,help,fields
  required[1]: inputFields
```
### Input Group Static Examples:
#### Input Group Static JSON Example:
```json
[
  {
    "key": "paging",
    "help": "Enter the pagination settings.",
    "type": "input groups",
    "label": "Paging",
    "fields": [
      {
        "key": "pageLimit",
        "help": "Default it will fetch data upto 100. The maximum value is 100.",
        "type": "dropdown",
        "label": "Page Limit",
        "options": [
          {
            "label": "Default",
            "value": 100,
            "sample": "100"
          }
        ],
        "customHelp": "Accepted integer from 1 to 100",
        "placeholder": "Enter Page Limit",
        "defaultValue": {
          "label": "Default",
          "value": 100,
          "sample": "100"
        },
        "customPlaceholder": "10"
      },
      {
        "key": "filter_properties",
        "help": "Filter Properties helps to filter only the properties of the data source schema you need from the response items. Leave blank to get all properties in the response.",
        "type": "multiselect",
        "label": "Filter Properties",
        "required": false,
        "customHelp": "Enter Array of Property Name.",
        "placeholder": "Choose Property",
        "optionsGenerator": "const returnDropdown = (array) => {\n    const a = array.map((key) => {\n        return {\n            label: key?.name,\n            sample: key?.type,\n            value: key?.name\n        };\n    });\n    return a;\n};\n\ntry{\n    const columnsApiUrl = `https://api.notion.com/v1/data_sources/${context.inputData.data_source_id}`;\nconst response = await axios.get(columnsApiUrl, {                 headers: {\n            'Notion-Version': '2025-09-03', // Use the current API version\n        }  } \n);\n//   return response.data\nconst arr = response.data.properties;\nconst first = Object.values(arr);\n\nreturn returnDropdown(first);\n}catch(error) {\n        throw {\n            message: error?.response?.data?.message || error?.message || 'An unknown error occurred while fetching properties'\n        };\n    }\n",
        "customPlaceholder": "[\"title\",\"status\"]"
      },
      {
        "key": "start_cursor",
        "help": "A next_cursor value returned in a previous response. Treat this as an opaque value.  Defaults to undefined, which returns results from the beginning of the list.",
        "type": "string",
        "label": "Start Cursor",
        "required": false,
        "placeholder": "13fe3a00-095c-81a5-b0dd-dd6ce042ebd3"
      }
    ]
  },
  {
    "key": "search_filter",
    "help": "Filter configuration to return the sheet rows based on the condition met.",
    "type": "input groups",
    "label": "Search Filter",
    "visibilityCondition": "context?.inputData?.sheet_Id",
    "fields": [
      {
        "key": "column_key",
        "help": "Determines how the data columns are labelled.",
        "type": "boolean",
        "label": "Does your first row contain column name?",
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
        "customHelp": "Enter \"true\" if the first row contains the column name, else \"false\".",
        "placeholder": "Choose Option",
        "defaultValue": {
          "label": "Yes",
          "value": true
        },
        "customPlaceholder": "true"
      },
      {
        "key": "search_filter_type",
        "help": "Select the filter type, basic will have one column and value which will check an exact match. In advance, the user can provide the advanced query AND, OR operations with multiple columns.",
        "type": "boolean",
        "label": "Search Filter Type",
        "options": [
          {
            "label": "Basic",
            "value": true
          },
          {
            "label": "Advance",
            "value": false
          }
        ],
        "required": true,
        "customHelp": "Enter \"true\" for \"Basic\" and \"false\" for \"Advance\"",
        "placeholder": "Choose Option",
        "defaultValue": {
          "label": "Basic",
          "value": true
        },
        "customPlaceholder": "true"
      },
      {
        "key": "lookupColumn",
        "help": "Select the column to search in, based on header names.",
        "type": "dropdown",
        "label": "Lookup Column",
        "required": true,
        "customHelp": "In order determine to enter the first row column name or column letter you can setup in the field \"Does your first row contain column name?*\"",
        "placeholder": "Choose Column",
        "customInputLabel": "Enter Column Name",
        "optionsGenerator": "const spreadSheet_id = context?.inputData?.spreadsheet_Id;\nconst targetsheet_Id = context?.inputData?.sheet_Id;\nconst column_key = context?.inputData?.search_filter?.column_key?? true;\ntry {\nreturn await fetchSheetColumns(spreadSheet_id,targetsheet_Id,column_key);\n\n} catch (error) {\n await errorComponent(error);\n}",
        "customPlaceholder": "Name or A",
        "visibilityCondition": "context?.inputData?.search_filter?.search_filter_type"
      },
      {
        "key": "lookupValue",
        "help": "Enter the value to search for in the specified columns. The value is case sensitive.",
        "type": "string",
        "label": "Lookup Value",
        "required": true,
        "placeholder": "John",
        "visibilityCondition": "context?.inputData?.search_filter?.search_filter_type"
      },
      {
        "key": "ai_search",
        "help": "Enter the prompt condition including the column names and values to return the rows which match the condition.",
        "type": "aifield",
        "label": "Advance Filter Condition Prompt",
        "prompt": "Give me the if js code including the sheet columns. I will provide the sample google sheet data to understand the column names and the structure of the data. The user will provide the search condition. Example: If user gives the prompt: Check whether a sheet row's 'Status' column equals 'Done'.The output: String((row['Status'] || '').trim()).toLowerCase() === 'done'; When using path in the condition wrap with '' Example: (String((row['Email'] || '').trim()).toLowerCase() === '${context.req.body.email}'). Note: The sheet can have the column name or column letters. If you can see the key name as a column name, not letters, then don't guess the column letter.",
        "required": true,
        "placeholder": "Email is email@domain.com or phone is..",
        "suggestionGenerator": "async function fetchSheetData() {\n    try {\n        // 1. INPUTS & SETUP\n      const spreadsheetId = context?.inputData?.spreadsheet_Id;\n        const targetSheetId = context?.inputData?.sheet_Id; \n        const useColumnKey =context?.inputData?.search_filter?.column_key  ?? true; // Default to true if undefined\n        const limit = 5; // <-- SET YOUR LIMIT HERE\n\n        const reqHeaders = {\n            'Content-Type': 'application/json'\n        };\n\n        // 2. FETCH METADATA\n        const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(title,sheetId,gridProperties.columnCount)`;\n        const metaResponse = await axios.get(metaUrl, { headers: reqHeaders });\n        \n        const targetSheet = metaResponse.data.sheets?.find(s => s.properties.sheetId == targetSheetId);\n        if (!targetSheet) {\n            return { success: false, message: `Sheet with ID \"${targetSheetId}\" not found.` };\n        }\n        \n        const actualSheetName = targetSheet.properties.title;\n        const totalGridColumns = targetSheet.properties.gridProperties?.columnCount || 26; \n\n        // 3. FETCH VALUES (OPTIMIZED WITH RANGE)\n        // If we use column keys (headers), we need 1 extra row to fetch the headers themselves.\n        const rowsToFetch = useColumnKey ? limit + 1 : limit;\n        \n        // Construct A1 Notation (e.g., \"Sheet1!1:6\")\n        const encodedSheetName = encodeURIComponent(actualSheetName);\n        const range = `${encodedSheetName}!1:${rowsToFetch}`;\n        \n        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;\n        const response = await axios.get(url, { headers: reqHeaders });\n        const values = response.data.values || [];\n\n        if (values.length === 0) {\n            return { success: true, data: [], message: \"Sheet is empty.\" };\n        }\n\n        // Helper: Convert index to Column Letter\n        function getColumnLetter(index) {\n            let letter = '';\n            let temp = index;\n            while (temp >= 0) {\n                letter = String.fromCharCode(65 + (temp % 26)) + letter;\n                temp = Math.floor(temp / 26) - 1;\n            }\n            return letter;\n        }\n\n        let finalKeys = [];\n        let rowsToProcess = [];\n        let startRowIndex = 0;\n\n        // 4. DETERMINE KEYS & DATA RANGE\n        if (useColumnKey) {\n            // --- SCENARIO A: Row 1 is Headers ---\n            const headerRow = values[0] || [];\n            if (headerRow.length === 0) {\n                 return { success: false, message: \"Headers are missing in Row 1.\" };\n            }\n\n            const headerCounts = {};\n            headerRow.forEach(h => {\n                const name = h ? h.toString().trim() : \"\";\n                if (name) headerCounts[name] = (headerCounts[name] || 0) + 1;\n            });\n\n            finalKeys = headerRow.map((h, index) => {\n                const rawName = h ? h.toString().trim() : `Column_${index}`;\n                if (headerCounts[rawName] > 1) {\n                    return `${rawName}--${getColumnLetter(index)}`;\n                }\n                return rawName;\n            });\n\n            // Skip headers, start data from Row 2\n            rowsToProcess = values.slice(1);\n            startRowIndex = 2; \n\n        } else {\n            // --- SCENARIO B: Column Letters ---\n            for(let i=0; i < totalGridColumns; i++) {\n                finalKeys.push(getColumnLetter(i));\n            }\n\n            // Process ALL fetched rows, start data from Row 1\n            rowsToProcess = values;\n            startRowIndex = 1;\n        }\n\n        // 5. MAP DATA\n        const formattedData = rowsToProcess.map((row, index) => {\n            let rowObject = {\n                \"_rowNumber\": startRowIndex + index \n            };\n\n            // Map data to the determined keys\n            finalKeys.forEach((key, colIndex) => {\n                rowObject[key] = row[colIndex] !== undefined ? row[colIndex] : \"\";\n            });\n\n            return rowObject;\n        });\n\n        return formattedData;\n\n    } catch (error) {\n        return { success: false, error: error.message || error }; \n    }\n}\n\nreturn await fetchSheetData();",
        "visibilityCondition": "!context?.inputData?.search_filter?.search_filter_type"
      },
      {
        "key": "help_basic_filter",
        "help": "The result rows returned will be the exact match(case sensitive) of the Lookup Value.",
        "type": "help",
        "visibilityCondition": "context?.inputData?.search_filter?.search_filter_type"
      }
    ]
  },
  {
    "key": "sorting",
    "help": "",
    "type": "input groups",
    "label": "Sorting AND LIMIT",
    "visibilityCondition": "",
    "fields": [
      {
        "key": "row_count",
        "help": "Enter the number of rows you want to retrieve. If not specified, will return all the available matching rows.",
        "type": "number",
        "label": "Row Count",
        "required": false,
        "placeholder": "10"

      },
      {
        "key": "is_last_row",
        "help": "Search from the last row of the spreadsheet up. Select “Yes” to enable.",
        "type": "boolean",
        "label": "Search from last row",
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
        "customHelp": "Enter \"true\" for search from the last row of the spreadsheet.",
        "placeholder": "true",
        "defaultValue": {
          "label": "No",
          "value": false
        }
      },
      {
        "key": "returnColumn",
        "help": "Select the column to return in response, If selected will return the selected columns. If left empty will return all the columns.",
        "type": "multiselect",
        "label": "Return Columns",
        "required": false,
        "customHelp": "In order determine to enter the first row column name or column letter you can setup in the field \"Does your first row contain column name?*\"",
        "placeholder": "Choose Columns",
        "customInputLabel": "Enter Column Name in Array.",
        "optionsGenerator": "const spreadSheet_id = context?.inputData?.spreadsheet_Id;\nconst targetsheet_Id = context?.inputData?.sheet_Id;\nconst column_key = context?.inputData?.search_filter?.column_key?? true;\ntry {\nreturn await fetchSheetColumns(spreadSheet_id,targetsheet_Id,column_key);\n\n} catch (error) {\n await errorComponent(error);\n}",
        "customPlaceholder": "[\"Name\"]or [\"A\"]",
        "visibilityCondition": "context?.inputData?.search_filter?.search_filter_type"
      }
    ]
  },
  [
  {
    "key": "settings",
    "type": "input groups",
    "label": "",
    "whereClause": true,
    "fields": [
      {
        "key": "comment",
        "help": "Choose when to receive incoming comments.",
        "type": "dropdown",
        "label": "When commented on",
        "options": [
          {
            "label": "a specific media",
            "value": "a specific media"
          },
          {
            "label": "any media",
            "value": "any media"
          },
          {
            "label": "next media",
            "value": "next media"
          }
        ],
        "required": true,
        "placeholder": "Choose Option",
        "customInputLabel": "Enter when to receive incoming comments.",
        "customPlaceholder": "a specific media"
      },
      {
        "key": "mediaId",
        "help": "Choose media or enter media Id.",
        "type": "dropdown",
        "label": "Media",
        "required": true,
        "customHelp": "You can enter the media ID manually or can also find the media ID from the List Media action.",
        "canPaginate": true,
        "placeholder": "Choose Media",
        "customInputLabel": "Enter media ID.",
        "optionsGenerator": "try {\n  const limit = 100;\n  const after = context?.paginateData?.['settings.mediaId'];\n  return await fetchMedia(limit, after);\n} catch (e) {\n  await errorComponent(e);\n}",
        "customPlaceholder": "18062960995844908",
        "visibilityCondition": "context?.inputData?.settings?.comment === 'a specific media' "
      },
      {
        "key": "media_start_date",
        "help": "Choose the date after which the new comment recived should be received.",
        "type": "string",
        "label": "posted after date",
        "required": true,
        "placeholder": "2026-03-17T01:49:34+0000",
        "visibilityCondition": "context?.inputData?.settings?.comment === 'next media'"
      }
    ]
  }
]
]
```
#### Input Group Static TOON Example:
```toon
[4]:
  - key: paging
    help: Enter the pagination settings.
    type: input groups
    label: Paging
    fields[3]:
      - key: pageLimit
        help: Default it will fetch data upto 100. The maximum value is 100.
        type: dropdown
        label: Page Limit
        options[1]{label,value,sample}:
          Default,100,"100"
        customHelp: Accepted integer from 1 to 100
        placeholder: Enter Page Limit
        defaultValue:
          label: Default
          value: 100
          sample: "100"
        customPlaceholder: "10"
      - key: filter_properties
        help: Filter Properties helps to filter only the properties of the data source schema you need from the response items. Leave blank to get all properties in the response.
        type: multiselect
        label: Filter Properties
        required: false
        customHelp: Enter Array of Property Name.
        placeholder: Choose Property
        optionsGenerator: "const returnDropdown = (array) => {\n    const a = array.map((key) => {\n        return {\n            label: key?.name,\n            sample: key?.type,\n            value: key?.name\n        };\n    });\n    return a;\n};\n\ntry{\n    const columnsApiUrl = `https://api.notion.com/v1/data_sources/${context.inputData.data_source_id}`;\nconst response = await axios.get(columnsApiUrl, {                 headers: {\n            'Notion-Version': '2025-09-03', // Use the current API version\n        }  } \n);\n//   return response.data\nconst arr = response.data.properties;\nconst first = Object.values(arr);\n\nreturn returnDropdown(first);\n}catch(error) {\n        throw {\n            message: error?.response?.data?.message || error?.message || 'An unknown error occurred while fetching properties'\n        };\n    }\n"
        customPlaceholder: "[\"title\",\"status\"]"
      - key: start_cursor
        help: "A next_cursor value returned in a previous response. Treat this as an opaque value.  Defaults to undefined, which returns results from the beginning of the list."
        type: string
        label: Start Cursor
        required: false
        placeholder: "13fe3a00-095c-81a5-b0dd-dd6ce042ebd3"
  - key: search_filter
    help: Filter configuration to return the sheet rows based on the condition met.
    type: input groups
    label: Search Filter
    visibilityCondition: context?.inputData?.sheet_Id
    fields[6]:
      - key: column_key
        help: Determines how the data columns are labelled.
        type: boolean
        label: Does your first row contain column name?
        options[2]{label,value}:
          Yes,true
          No,false
        required: true
        customHelp: "Enter \"true\" if the first row contains the column name, else \"false\"."
        placeholder: Choose Option
        defaultValue:
          label: Yes
          value: true
        customPlaceholder: "true"
      - key: search_filter_type
        help: "Select the filter type, basic will have one column and value which will check an exact match. In advance, the user can provide the advanced query AND, OR operations with multiple columns."
        type: boolean
        label: Search Filter Type
        options[2]{label,value}:
          Basic,true
          Advance,false
        required: true
        customHelp: "Enter \"true\" for \"Basic\" and \"false\" for \"Advance\""
        placeholder: Choose Option
        defaultValue:
          label: Basic
          value: true
        customPlaceholder: "true"
      - key: lookupColumn
        help: "Select the column to search in, based on header names."
        type: dropdown
        label: Lookup Column
        required: true
        customHelp: "In order determine to enter the first row column name or column letter you can setup in the field \"Does your first row contain column name?*\""
        placeholder: Choose Column
        customInputLabel: Enter Column Name
        optionsGenerator: "const spreadSheet_id = context?.inputData?.spreadsheet_Id;\nconst targetsheet_Id = context?.inputData?.sheet_Id;\nconst column_key = context?.inputData?.search_filter?.column_key?? true;\ntry {\nreturn await fetchSheetColumns(spreadSheet_id,targetsheet_Id,column_key);\n\n} catch (error) {\n await errorComponent(error);\n}"
        customPlaceholder: "Name or A"
        visibilityCondition: context?.inputData?.search_filter?.search_filter_type
      - key: lookupValue
        help: Enter the value to search for in the specified columns. The value is case sensitive.
        type: string
        label: Lookup Value
        required: true
        placeholder: "John"
        visibilityCondition: context?.inputData?.search_filter?.search_filter_type
      - key: ai_search
        help: Enter the prompt condition including the column names and values to return the rows which match the condition.
        type: aifield
        label: Advance Filter Condition Prompt
        prompt: "Give me the if js code including the sheet columns. I will provide the sample google sheet data to understand the column names and the structure of the data. The user will provide the search condition. Example: If user gives the prompt: Check whether a sheet row's 'Status' column equals 'Done'.The output: String((row['Status'] || '').trim()).toLowerCase() === 'done'; When using path in the condition wrap with '' Example: (String((row['Email'] || '').trim()).toLowerCase() === '${context.req.body.email}'). Note: The sheet can have the column name or column letters. If you can see the key name as a column name, not letters, then don't guess the column letter."
        required: true
        placeholder: "Email is email@domain.com or phone is.."
        suggestionGenerator: "async function fetchSheetData() {\n    try {\n        // 1. INPUTS & SETUP\n      const spreadsheetId = context?.inputData?.spreadsheet_Id;\n        const targetSheetId = context?.inputData?.sheet_Id; \n        const useColumnKey =context?.inputData?.search_filter?.column_key  ?? true; // Default to true if undefined\n        const limit = 5; // <-- SET YOUR LIMIT HERE\n\n        const reqHeaders = {\n            'Content-Type': 'application/json'\n        };\n\n        // 2. FETCH METADATA\n        const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(title,sheetId,gridProperties.columnCount)`;\n        const metaResponse = await axios.get(metaUrl, { headers: reqHeaders });\n        \n        const targetSheet = metaResponse.data.sheets?.find(s => s.properties.sheetId == targetSheetId);\n        if (!targetSheet) {\n            return { success: false, message: `Sheet with ID \"${targetSheetId}\" not found.` };\n        }\n        \n        const actualSheetName = targetSheet.properties.title;\n        const totalGridColumns = targetSheet.properties.gridProperties?.columnCount || 26; \n\n        // 3. FETCH VALUES (OPTIMIZED WITH RANGE)\n        // If we use column keys (headers), we need 1 extra row to fetch the headers themselves.\n        const rowsToFetch = useColumnKey ? limit + 1 : limit;\n        \n        // Construct A1 Notation (e.g., \"Sheet1!1:6\")\n        const encodedSheetName = encodeURIComponent(actualSheetName);\n        const range = `${encodedSheetName}!1:${rowsToFetch}`;\n        \n        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;\n        const response = await axios.get(url, { headers: reqHeaders });\n        const values = response.data.values || [];\n\n        if (values.length === 0) {\n            return { success: true, data: [], message: \"Sheet is empty.\" };\n        }\n\n        // Helper: Convert index to Column Letter\n        function getColumnLetter(index) {\n            let letter = '';\n            let temp = index;\n            while (temp >= 0) {\n                letter = String.fromCharCode(65 + (temp % 26)) + letter;\n                temp = Math.floor(temp / 26) - 1;\n            }\n            return letter;\n        }\n\n        let finalKeys = [];\n        let rowsToProcess = [];\n        let startRowIndex = 0;\n\n        // 4. DETERMINE KEYS & DATA RANGE\n        if (useColumnKey) {\n            // --- SCENARIO A: Row 1 is Headers ---\n            const headerRow = values[0] || [];\n            if (headerRow.length === 0) {\n                 return { success: false, message: \"Headers are missing in Row 1.\" };\n            }\n\n            const headerCounts = {};\n            headerRow.forEach(h => {\n                const name = h ? h.toString().trim() : \"\";\n                if (name) headerCounts[name] = (headerCounts[name] || 0) + 1;\n            });\n\n            finalKeys = headerRow.map((h, index) => {\n                const rawName = h ? h.toString().trim() : `Column_${index}`;\n                if (headerCounts[rawName] > 1) {\n                    return `${rawName}--${getColumnLetter(index)}`;\n                }\n                return rawName;\n            });\n\n            // Skip headers, start data from Row 2\n            rowsToProcess = values.slice(1);\n            startRowIndex = 2; \n\n        } else {\n            // --- SCENARIO B: Column Letters ---\n            for(let i=0; i < totalGridColumns; i++) {\n                finalKeys.push(getColumnLetter(i));\n            }\n\n            // Process ALL fetched rows, start data from Row 1\n            rowsToProcess = values;\n            startRowIndex = 1;\n        }\n\n        // 5. MAP DATA\n        const formattedData = rowsToProcess.map((row, index) => {\n            let rowObject = {\n                \"_rowNumber\": startRowIndex + index \n            };\n\n            // Map data to the determined keys\n            finalKeys.forEach((key, colIndex) => {\n                rowObject[key] = row[colIndex] !== undefined ? row[colIndex] : \"\";\n            });\n\n            return rowObject;\n        });\n\n        return formattedData;\n\n    } catch (error) {\n        return { success: false, error: error.message || error }; \n    }\n}\n\nreturn await fetchSheetData();"
        visibilityCondition: !context?.inputData?.search_filter?.search_filter_type
      - key: help_basic_filter
        help: The result rows returned will be the exact match(case sensitive) of the Lookup Value.
        type: help
        visibilityCondition: context?.inputData?.search_filter?.search_filter_type
  - key: sorting
    help: ""
    type: input groups
    label: Sorting AND LIMIT
    visibilityCondition: ""
    fields[3]:
      - key: row_count
        help: "Enter the number of rows you want to retrieve. If not specified, will return all the available matching rows."
        type: number
        label: Row Count
        required: false
        placeholder: "10"
      - key: is_last_row
        help: Search from the last row of the spreadsheet up. Select “Yes” to enable.
        type: boolean
        label: Search from last row
        options[2]{label,value}:
          Yes,true
          No,false
        required: true
        customHelp: "Enter \"true\" for search from the last row of the spreadsheet."
        placeholder: "true"
        defaultValue:
          label: No
          value: false
      - key: returnColumn
        help: "Select the column to return in response, If selected will return the selected columns. If left empty will return all the columns."
        type: multiselect
        label: Return Columns
        required: false
        customHelp: "In order determine to enter the first row column name or column letter you can setup in the field \"Does your first row contain column name?*\""
        placeholder: Choose Columns
        customInputLabel: Enter Column Name in Array.
        optionsGenerator: "const spreadSheet_id = context?.inputData?.spreadsheet_Id;\nconst targetsheet_Id = context?.inputData?.sheet_Id;\nconst column_key = context?.inputData?.search_filter?.column_key?? true;\ntry {\nreturn await fetchSheetColumns(spreadSheet_id,targetsheet_Id,column_key);\n\n} catch (error) {\n await errorComponent(error);\n}"
        customPlaceholder: "[\"Name\"]or [\"A\"]"
        visibilityCondition: context?.inputData?.search_filter?.search_filter_type
```


# Dynamic Input Fields

## Dropdown Dynamic

**Dropdown Dynamic Purpose:**
The Dropdown Dynamic field allows users to select from a dynamically generated list of options. These options are usually fetched via an API call or calculated by custom logic at runtime. This is highly effective for paginated lists, searchable item lists, or data retrieved directly from external integrations. 
You can use **Reusable Components** inside the `optionsGenerator` to securely fetch data. This hides sensitive logic like API tokens and reduces duplicate code by allowing you to share the same retrieval logic across multiple dropdowns if needed.

### Dropdown Dynamic Input Field Generation Rules:
- When creating a dynamic dropdown field, adhere to the strict structure outlined in the JSON/TOON schemas format.
- Set `type: "dropdown"` and define essential fields such as `key`, `label`, `help`, and `optionsGenerator`.
- In the `optionsGenerator` property, write or invoke JavaScript code that fetches and transforms options. **It is highly recommended to attach Reusable Components here** to keep the API fetching secure, centralized, and easy to maintain.
- **optionsGenerator Function Calling:** If the function code is written inline inside `optionsGenerator`, it must be explicitly defined, wrapped in a parent `try-catch` block with `await errorComponent(error);` in the `catch` block, and called/invoked at the end (e.g., `async function getOptions() { ... }; try { return await getOptions(); } catch (error) { await errorComponent(error); }`). Similarly, if a Reusable Component is used, the invocation must be wrapped in a parent `try-catch` block, and the `catch` block must call `await errorComponent(error);` (e.g., `try { return await fetchComponent(param1, param2); } catch (error) { await errorComponent(error); }`).
- **Configuration of `canPaginate` and `enableSearchApi` in Dynamic Dropdowns:** Always configure these flags based on the actual API capability using the following priority order (verify via web search/official API documentation before creating a component or setting flags):
  1. **Both supported:** If the API supports both search (query) and pagination (cursor/offset), set `"canPaginate": true` and `"enableSearchApi": true`.
  2. **Search only, no pagination:** If the API supports search query parameters but no pagination parameters, set `"canPaginate": false` and `"enableSearchApi": true`.
  3. **Pagination only, no search:** If the API supports pagination parameters but no search query parameter, set `"canPaginate": true` and `"enableSearchApi": false`.
  4. **Neither supported:** If the API supports neither search nor pagination, set `"canPaginate": false` and `"enableSearchApi": false`.
  - **Existing Reusable Component Rule:** If a reusable component is already present and implements pagination or search or both, make `"canPaginate"` and/or `"enableSearchApi"` `true` in the dropdown field configuration accordingly.
  - **API Verification Rule:** When researching an API, perform a web search or check official API documentation to confirm support for pagination/search parameters. Only proceed with creating a component or enabling these flags if the API explicitly supports them; never assume or guess support.
- All three custom keys: `customPlaceholder` (compulsory), `customInputLabel` (compulsory), and `customHelp` (compulsory) must be included for the manual input mode. The value of `placeholder` and `customPlaceholder` must always be a string and wrapped in a string/quotes. The `help` key must focus on selection and start with "Select" (e.g. "Select the spreadsheet."). It supports string format and markdown links like `[Lean More](https://example.com)`. **The `customInputLabel` must be short and must NOT start with "Enter"** (e.g. standard label `"Spreadsheet"`, customInputLabel `"Spreadsheet ID"`). If not an ID field, standard label and `customInputLabel` must be the same. **The `customHelp` must guide manual input with "Enter the ID/value... You will get it from the actions like List, Find..."** (e.g. `"Enter the Spreadsheet ID manually. You can get the spreadsheet ID from actions like List Spreadsheets or Find Spreadsheet."`). Both `help` and `customHelp` must be very crisp and to the point.
- **Reference the schema and examples:** Carefully check the **Dropdown Dynamic JSON/TOON Schema** and look at the **Dropdown Dynamic Examples** below to see fully structured implementations, formatting rules, and expected options return formats (e.g., `[{label, value, sample}]` or `{data: [{label, value, sample}], offset: ...}`). MANDATORY RULE: If the value is an ID, the sample MUST be included in the return object. If the label and sample are exactly the same, then NO sample is needed.

### Dropdown Dynamic JSON Schema:
```json
{
    "name": "generate_dynamic_dropdown_field",
    "strict": false,
    "schema": {
        "type": "object",
        "properties": {
            "inputFields": {
                "type": "array",
                "description": "The array of input fields including the newly created or updated dynamic dropdown field.",
                "items": {
                    "type": "object",
                    "properties": {
                        "key": {
                            "type": "string",
                            "pattern": "^[^.\\[\\]]*$",
                            "description": "Unique identifier for the field (e.g. 'spreadsheet_id', 'data_source_id'). The key must not contain a dot (.) or square brackets ([])."
                        },
                        "type": {
                            "type": "string",
                            "enum": [
                                "dropdown"
                            ],
                            "description": "Must be exactly 'dropdown'."
                        },
                        "label": {
                            "type": "string",
                            "description": "A human-readable label explaining the choice (e.g. 'Spreadsheet')."
                        },
                        "help": {
                            "type": "string",
                            "description": "Guidance text for the user. Explain what the dropdown is for."
                        },
                        "required": {
                            "type": "boolean",
                            "description": "Whether the selection is mandatory. It is an optional key; if not present, it is treated as optional."
                        },
                        "placeholder": {
                            "type": "string",
                            "description": "Optional placeholder text shown in the dropdown before selection (e.g. 'Choose Spreadsheet'). Omit if not applicable."
                        },
                        "optionsGenerator": {
                            "type": "string",
                            "description": "JavaScript code that fetches the dynamic options. MANDATORY RULES:\n1. Option Properties: Objects must contain 'label' (string, display name), 'value' (string/number, internal API value). Optional: 'sample' (string, MUST be identical to value, shown in UI brackets), 'extraValue' (any JSON type, hidden data for scripts/visibility).\n2. Standard Format: Return `[{label, value, sample}]` if both 'canPaginate' and 'enableSearchApi' are false (or omitted).\n3. Pagination / Search Format: Return `{ data: [{label, value, sample}], offset: string|number|null }` if 'canPaginate' is true, 'enableSearchApi' is true, or both (offset is null if reached end).\n4. UI Messages/Warnings: If no options are available (zero results), return a message key based on the configuration: (a) If ONLY pagination is enabled: return `{ data: [], offset: null, message: 'No options found' }`; (b) If neither pagination nor search is enabled: return `{ message: 'No options found' }`; (c) If ONLY search is enabled: return `{ message: 'No options found' }`; (d) If BOTH search and pagination are enabled: return `{ data: [], offset: <previous_offset>, message: 'No options found' }` (in search mode, ignore the search-returned offset and preserve/prioritize the previous pagination offset so exiting search resumes pagination correctly).\n5. Global Variables: Use `__searchText` if 'enableSearchApi' is true. Access pagination tokens via `context?.paginateData?.['your_field_key']`.If it is inside input group then input group key is included like `context?.paginateData?.['input_group_key.your_field_key']`. Additionally path supports in nested input groups,the input group keys added in the path in order.\n6. Try-Catch & Reusable Components: Any call to a Reusable Component or inline code in optionsGenerator must be wrapped in a parent try-catch block, and the catch block must call `await errorComponent(error);` (e.g., `try { return await fetchComponent(...); } catch (error) { await errorComponent(error); }`)."
                        },
                        "canPaginate": {
                            "type": "boolean",
                            "description": "Set to true ONLY if the list API supports pagination/loading more (i.e., it accepts an offset/cursor parameter and returns a next-page token). If true, the optionsGenerator MUST return {data: [], offset: string|number|null}. Omit or set to false if the API does not support pagination — including this when unsupported will cause runtime errors."
                        },
                        "enableSearchApi": {
                            "type": "boolean",
                            "description": "Set to true ONLY if the list API supports a search/filter query parameter (e.g., a 'q' or 'search' param). If true, the optionsGenerator must use the `__searchText` variable to pass the user's search input to the API. Omit or set to false if the API does not support server-side search — including this when unsupported will cause runtime errors."
                        },
                        "customPlaceholder": {
                            "type": "string",
                            "description": "Required placeholder for the manual input mode. Provide a relevant numeric or text example wrapped in a string (e.g., '229a83a6-ccba-80f4...')."
                        },
                        "customInputLabel": {
                            "type": "string",
                            "description": "Required label for the manual input mode. MUST be kept short (e.g., 'Enter Spreadsheet ID'). If a longer explanation is needed, use 'customHelp' instead. Both can be used together."
                        },
                        "customHelp": {
                            "type": "string",
                            "description": "Optional help text for manual/dynamic input. Use this for longer explanations alongside or instead of customInputLabel. Explain exactly where the user can find the ID (e.g., in a URL). Supports markdown links [Link](https://...). Omit if not applicable."
                        },
                        "visibilityCondition": {
                            "type": "string",
                            "description": "A JavaScript condition for visibility. Omit if always visible."
                        },
                        "defaultValue": {
                            "type": "object",
                            "description": "The default object to select initially. Omit this field entirely if there is no default.",
                            "properties": {
                                "label": {
                                    "type": "string",
                                    "description": "The display name of the default option."
                                },
                                "value": {
                                    "type": [
                                        "string",
                                        "number"
                                    ],
                                    "description": "The internal value of the default option."
                                },
                                "sample": {
                                    "type": "string",
                                    "description": "Optional string. MUST always be identical to the option's value. In the UI, users see the label with the sample shown in brackets. MANDATORY RULE: If the value is an ID, the sample MUST be included. If the label and sample are exactly the same, then NO sample is needed. Omit otherwise."
                                },
                                "extraValue": {
                                    "type": [
                                        "string",
                                        "number",
                                        "boolean",
                                        "object",
                                        "array"
                                    ],
                                    "description": "An optional extra value for the default option. Can be any valid JSON type,hidden data for scripts/visibility. Omit if not needed."
                                }
                            },
                            "required": [
                                "label",
                                "value",
                                "sample"
                            ]
                        }
                    },
                    "required": [
                        "key",
                        "type",
                        "label",
                        "help",
                        "optionsGenerator",
                        "customPlaceholder",
                        "customInputLabel",
                        "customHelp"
                    ]
                }
            }
        },
        "required": [
            "inputFields"
        ]
    }
}
```
### Dropdown Dynamic TOON Schema:
```toon
name: generate_dynamic_dropdown_field
strict: false
schema:
  type: object
  properties:
    inputFields:
      type: array
      description: The array of input fields including the newly created or updated dynamic dropdown field.
      items:
        type: object
        properties:
          key:
            type: string
            pattern: "^[^.\[\]]*$"
            description: "Unique identifier for the field (e.g. 'spreadsheet_id', 'data_source_id'). The key must not contain a dot (.) or square brackets ([])."
          type:
            type: string
            enum[1]: dropdown
            description: Must be exactly 'dropdown'.
          label:
            type: string
            description: A human-readable label explaining the choice (e.g. 'Spreadsheet').
          help:
            type: string
            description: Guidance text for the user. Explain what the dropdown is for.
          required:
            type: boolean
            description: Whether the selection is mandatory. It is an optional key; if not present, it is treated as optional.
          placeholder:


            type: string
            description: Optional placeholder text shown in the dropdown before selection (e.g. 'Choose Spreadsheet'). Omit if not applicable.
          optionsGenerator:
            type: string
            description: "JavaScript code that fetches the dynamic options. MANDATORY RULES:\n1. Option Properties: Objects must contain 'label' (string, display name), 'value' (string/number, internal API value). Optional: 'sample' (string, MUST be identical to value, shown in UI brackets), 'extraValue' (any JSON type, hidden data for scripts/visibility).\n2. Standard Format: Return `[{label, value, sample}]` if both 'canPaginate' and 'enableSearchApi' are false (or omitted).\n3. Pagination / Search Format: Return `{ data: [{label, value, sample}], offset: string|number|null }` if 'canPaginate' is true, 'enableSearchApi' is true, or both (offset is null if reached end).\n4. UI Messages/Warnings: If no options are available (zero results), return a message key based on the configuration: (a) If ONLY pagination is enabled: return `{ data: [], offset: null, message: 'No options found' }`; (b) If neither pagination nor search is enabled: return `{ message: 'No options found' }`; (c) If ONLY search is enabled: return `{ message: 'No options found' }`; (d) If BOTH search and pagination are enabled: return `{ data: [], offset: <previous_offset>, message: 'No options found' }` (in search mode, ignore the search-returned offset and preserve/prioritize the previous pagination offset so exiting search resumes pagination correctly).\n5. Global Variables: Use `__searchText` if 'enableSearchApi' is true. Access pagination tokens via `context?.paginateData?.['your_field_key']`.If it is inside input group then input group key is included like `context?.paginateData?.['input_group_key.your_field_key']`. Additionally path supports in nested input groups,the input group keys added in the path in order.\n6. Try-Catch & Reusable Components: Any call to a Reusable Component or inline code in optionsGenerator must be wrapped in a parent try-catch block, and the catch block must call `await errorComponent(error);` (e.g., `try { return await fetchComponent(...); } catch (error) { await errorComponent(error); }`)."
          canPaginate:
            type: boolean
            description: "Set to true ONLY if the list API supports pagination/loading more (i.e., it accepts an offset/cursor parameter and returns a next-page token). If true, the optionsGenerator MUST return {data: [], offset: string|number|null}. Omit or set to false if the API does not support pagination — including this when unsupported will cause runtime errors."
          enableSearchApi:
            type: boolean
            description: "Set to true ONLY if the list API supports a search/filter query parameter (e.g., a 'q' or 'search' param). If true, the optionsGenerator must use the `__searchText` variable to pass the user's search input to the API. Omit or set to false if the API does not support server-side search — including this when unsupported will cause runtime errors."
          customPlaceholder:


            type: string
            description: "Required placeholder for the manual input mode. Provide a relevant numeric or text example (e.g., '229a83a6-ccba-80f4...')."
          customInputLabel:
            type: string
            description: "Required label for the manual input mode. MUST be kept short (e.g., 'Enter Spreadsheet ID'). If a longer explanation is needed, use 'customHelp' instead. Both can be used together."
          customHelp:
            type: string
            description: "Optional help text for manual/dynamic input. Use this for longer explanations alongside or instead of customInputLabel. Explain exactly where the user can find the ID (e.g., in a URL). Supports markdown links [Link](https://...). Omit if not applicable."
          visibilityCondition:
            type: string
            description: A JavaScript condition for visibility. Omit if always visible.
          defaultValue:
            type: object
            description: The default object to select initially. Omit this field entirely if there is no default.
            properties:
              label:
                type: string
                description: The display name of the default option.
              value:
                type[2]: string,number
                description: The internal value of the default option.
              sample:
                type: string
                description: "Optional string. MUST always be identical to the option's value. In the UI, users see the label with the sample shown in brackets. MANDATORY RULE: If the value is an ID, the sample MUST be included. If the label and sample are exactly the same, then NO sample is needed. Omit otherwise."
              extraValue:
                type[5]: string,number,boolean,object,array
                description: "An optional extra value for the default option. Can be any valid JSON type,hidden data for scripts/visibility. Omit if not needed."
            required[3]: label,value,sample
        required[8]: key,type,label,help,optionsGenerator,customPlaceholder,customInputLabel,customHelp
  required[1]: inputFields
```

### Dropdown Dynamic Examples:
#### Dropdown Dynamic JSON Example:
```json
[
  {
    "key": "data_source_id",
    "help": "Select the Notion data source.",
    "type": "dropdown",
    "label": "Data Source",
    "required": true,
    "customHelp": "Enter the Data Source ID manually. You can get the Data Source ID from actions like List Data Sources or Find Data Source.",
    "canPaginate": true,
    "placeholder": "Choose Data Source",
    "enableSearchApi": true,
    "customInputLabel": "Data Source ID",
    "optionsGenerator": "try{\n return  await fetchDataSources(__searchText,context?.paginateData?.['data_source_id'], 30) ;\n}\ncatch(e){\n  await errorComponent(e);\n}",
    "customPlaceholder": "229a83a6-ccba-80f4-a654-000b91179e35"
  },
  {
    "key": "spreadsheet_id",
    "help": "Select the Google Spreadsheet.",
    "type": "dropdown",
    "label": "Spreadsheet",
    "required": true,
    "customHelp": "Enter the Spreadsheet ID manually. You can get the Spreadsheet ID from the URL of your spreadsheet, or from actions like Search Spreadsheet or List Spreadsheets.",
    "canPaginate": true,
    "placeholder": "Choose Spreadsheet ID",
    "enableSearchApi": true,
    "customInputLabel": "Spreadsheet ID",
    "optionsGenerator": "try{\n  const pageToken = context?.paginateData?.['spreadsheet_Id']\n  const searchText = __searchText\n  const pageSize = 100;\n  return await fetchSpreadsheets(pageToken,searchText,pageSize) \n}catch(e){\n  await errorComponent(e);\n}",
    "customPlaceholder": "1PBtrnuRN_xfmilW79NgD70Z3Z0NsGs5*****"
  },
  {
    "key": "sheet_id",
    "help": "Select the Google Sheet.",
    "type": "dropdown",
    "label": "Sheet",
    "required": true,
    "customHelp": "Enter the Sheet ID manually. You can get the Sheet ID from the URL (gid parameter) or from actions like List Sheets.",
    "canPaginate": false,
    "placeholder": "Choose Sheet",
    "enableSearchApi": false,
    "customInputLabel": "Sheet ID",
    "optionsGenerator": "try{\n  const spreadsheet_Id = context?.inputData?.spreadsheet_Id;\nreturn await fetchSheetsWithID(spreadsheet_Id);\n}catch(e){\nawait errorComponent(e);\n}",
    "customPlaceholder": "38470421"
  },
  {
    "key": "channel_id",
    "help": "Select the channel to send the message.",
    "type": "dropdown",
    "label": "Channel",
    "required": true,
    "canPaginate": true,
    "optionsGenerator": "try {\n function convertToDesiredFormat(allChannels) {\n return allChannels\n ?.map(channel => ({\n label: channel.name,\n sample: channel.id,\n value: channel.id\n }))\n .sort((a, b) => a.label.localeCompare(b.label));\n }\n\n function replaceEqualsWithPercent3D(inputString) {\n return inputString.replace(/=/g, '');\n }\n\n let response = await axios.get(\n 'https://slack.com/api/conversations.list?types=public_channel,private_channel&exclude_archived=true&limit=999'\n );\n\n let channelArray = response?.data?.channels || [];\n\n while (response?.data?.response_metadata?.next_cursor) {\n const next_cursor = replaceEqualsWithPercent3D(response.data.response_metadata.next_cursor);\n\n response = await axios.get(\n https://slack.com/api/conversations.list?types=public_channel,private_channel&exclude_archived=true&cursor=${next_cursor}&limit=999\n );\n\n channelArray = [...channelArray, ...(response?.data?.channels || [])];\n }\n\n return convertToDesiredFormat(channelArray);\n\n} catch (error) {\n switch (error?.response?.status) {\n case 401:\n if (error?.response?.data?.error === 'token_revoked') {\n throw {\n success: false,\n status: error?.response?.status,\n message: 'Token has been revoked. Please check your credentials and try again.'\n };\n }\n break;\n case 429:\n if (error?.response?.data?.error === 'ratelimited') {\n throw {\n success: false,\n status: error?.response?.status,\n message: 'You have made too many requests in a short period. Please wait before trying again.'\n };\n }\n break;\n default:\n throw error;\n }\n}",
    "customInputLabel": "Channel ID",
    "customHelp": "Enter the Channel ID manually. You can get the Channel ID from actions like List Channels.",
    "customPlaceholder": "C12345678"
  },
  {
    "key": "page_id",
    "help": "Select the Facebook page.",
    "type": "dropdown",
    "label": "Page",
    "required": true,
    "canPaginate": true,
    "placeholder": "Select the Facebook page",
    "customInputLabel": "Page ID",
    "optionsGenerator": "async function fetchPagesWithPagination(context) {\n  // Get the offset (next page cursor) from context if it exists\n  const offset = context?.paginateData?.['page_id'];\n\n  const limit = 100;\n\n  // Build the API URL\n  let url = `https://graph.facebook.com/me/accounts?limit=${limit}`;\n  if (offset) {\n    url += `&after=${offset}`;\n  }\n\n  const config = {\n    method: 'get',\n    url: url\n  };\n\n  try {\n    const res = await axios.request(config);\n    const responseData = res.data;\n\n    // Check if there's any data\n    if ((!responseData.data || responseData.data.length === 0) && !offset) {\n      return {\n        message: \"No pages found. Make sure manage access is given. Update the connection and select page to give access for the automation.\"\n      };\n    }\n    else if ((!responseData.data || responseData.data.length === 0) && offset){\n return {\n  message: \"All Pages fetched successfully..\"\n }\n   }\n\n    // Transform data into dropdown format\n    const data = responseData.data.map(account => ({\n      label: account.name,\n      value: account.id,\n      sample: account.id\n    }));\n\n    // Prepare response with current page data and next offset (if any)\n    const result = {\n      data: data\n    };\n\n    // Check if there's a next page\n    if (responseData.paging && responseData.paging.cursors && responseData.paging.cursors.after) {\n      result.offset = responseData.data.length < limit ? null : responseData.paging.cursors.after;\n    }\n\n    return result;\n\n  } catch (error) {\n    // Handle specific error cases if needed\n    if (error.response?.status === 400 || error.response?.status === 190) {\n      return { message: \"Invalid or expired access token. Please reconnect.\" };\n    }\n\n    return { message: \"Enter page ID. E.g. 516470358708231\" };\n  }\n}\n\n// Call the function (assuming context is available in your environment)\nconst result = await fetchPagesWithPagination(context);\nreturn result;",
    "customPlaceholder": "516470358708231",
    "customHelp": "Enter the Page ID manually. You can get the Page ID from actions like List Pages."
  },
  {
    "key": "form_id",
    "help": "Select the lead form associated with the page.",
    "type": "dropdown",
    "label": "Lead Form",
    "required": true,
    "canPaginate": true,
    "placeholder": "Choose Lead Form",
    "customInputLabel": "Lead Form ID",
    "optionsGenerator": "async function fetchLeadFormsWithPagination(context) {\n  const selectedPage = context?.inputData?.page_id;\n  const offset = context?.paginateData?.['form_id'];\n  const limit = 100; // Max supported for leadgen_forms endpoint\n\n  if (!selectedPage) {\n    return { message: \"Please select a Facebook Page first.\" };\n  }\n\n  try {\n    // Get page access token using the provided getAccessToken function (empty permissions)\n    const { accessToken, isPermission } = await getAccessToken(selectedPage, []);\n\n    if (!accessToken || !isPermission) {\n      return { message: \"Unable to get access to the selected Page. Please reconnect or check permissions.\" };\n    }\n\n    // Build the API URL for leadgen_forms with pagination\n    let url = `https://graph.facebook.com/v25.0/${selectedPage}/leadgen_forms`;\n    url += `?limit=${limit}&access_token=${accessToken}`;\n    if (offset) {\n      url += `&after=${offset}`;\n    }\n\n    const response = await axios.get(url);\n    const responseData = response.data;\n\n    // If no forms returned and this is the first request\n    if ((!responseData.data || responseData.data.length === 0) && !offset) {\n      return {\n        data: [{ label: 'All Leadgen Forms', value: '0' }],\n        offset: null,\n        message: \"No Lead Forms found on this Page. You can create the lead form [here](https://business.facebook.com/latest/instant_forms/forms/). Make sure the form is created in the selected page.\"\n      };\n    }\n\n    // If no more forms on subsequent pages\n    if (!responseData.data || responseData.data.length === 0) {\n      return {\n        message: \"All Lead Forms fetched successfully.\"\n      };\n    }\n\n    // Transform forms into dropdown options\n    const data = responseData.data.map(form => ({\n      label: form.name,\n      value: form.id,\n      sample: form.id\n    }));\n\n    // Always include \"All Leadgen Forms\" as first option (only on first page)\n    if (!offset) {\n      data.unshift({ label: 'All Leadgen Forms', value: '0' });\n    }\n\n    // Prepare result\n    const result = { data };\n\n    // Add offset if there's a next page\n    if (responseData.paging?.cursors?.after) {\n      result.offset = responseData.data.length< limit? null : responseData.paging.cursors.after;\n    }\n\n    return result;\n\n  } catch (error) {\n    console.error(\"Error fetching lead forms:\", error);\n\n    // Specific OAuth/token errors\n    if (error.response?.data?.error?.code === 190) {\n      return { message: \"Invalid or expired access token. Please reconnect your Facebook account.\" };\n    }\n\n    // Permission or page access issue\n    if (error.response?.status === 400 || error.response?.status === 403) {\n      return { message: \"Insufficient permissions to access Lead Forms. Ensure 'leads_retrieval' permission is granted.\" };\n    }\n\n    // Fallback: return only \"All\" option\n    return {\n      data: [{ label: 'All Leadgen Forms', value: '0' }],\n       offset: null,\n      message: error?.message || \"Could not load forms. Using 'All Leadgen Forms' as default.\"\n    };\n  }\n}\n\n// Execute and return\nreturn await fetchLeadFormsWithPagination(context);",
    "customPlaceholder": "1161533432455827",
    "visibilityCondition": "context?.inputData?.page_id",
    "customHelp": "Enter the Lead Form ID manually. You can get the Lead Form ID from actions like List Lead Forms."
  }
]
```
#### Dropdown Dynamic TOON Example:
```toon
[6]:
  - key: data_source_id
    help: Select the Notion data source.
    type: dropdown
    label: Data Source
    required: true
    customHelp: "Enter the Data Source ID manually. You can get the Data Source ID from actions like List Data Sources or Find Data Source."
    canPaginate: true
    placeholder: Choose Data Source
    enableSearchApi: true
    customInputLabel: Data Source ID
    optionsGenerator: "try{\n return  await fetchDataSources(__searchText,context?.paginateData?.['data_source_id'], 30) ;\n}\ncatch(e){\n  await errorComponent(e);\n}"
    customPlaceholder: "229a83a6-ccba-80f4-a654-000b91179e35"
  - key: spreadsheet_id
    help: Select the Google Spreadsheet.
    type: dropdown
    label: Spreadsheet
    required: true
    customHelp: "Enter the Spreadsheet ID manually. You can get the Spreadsheet ID from the URL of your spreadsheet, or from actions like Search Spreadsheet or List Spreadsheets."
    canPaginate: true
    placeholder: Choose Spreadsheet ID
    enableSearchApi: true
    customInputLabel: Spreadsheet ID
    optionsGenerator: "try{\n  const pageToken = context?.paginateData?.['spreadsheet_Id']\n  const searchText = __searchText\n  const pageSize = 100;\n  return await fetchSpreadsheets(pageToken,searchText,pageSize) \n}catch(e){\n  await errorComponent(e);\n}"
    customPlaceholder: "1PBtrnuRN_xfmilW79NgD70Z3Z0NsGs5*****"
  - key: sheet_id
    help: Select the Google Sheet.
    type: dropdown
    label: Sheet
    required: true
    customHelp: "Enter the Sheet ID manually. You can get the Sheet ID from the URL (gid parameter) or from actions like List Sheets."
    canPaginate: false
    placeholder: Choose Sheet
    enableSearchApi: false
    customInputLabel: Sheet ID
    optionsGenerator: "try{\n  const spreadsheet_Id = context?.inputData?.spreadsheet_Id;\nreturn await fetchSheetsWithID(spreadsheet_Id);\n}catch(e){\nawait errorComponent(e);\n}"
    customPlaceholder: "38470421"
  - key: channel_id
    help: Select the channel to send the message.
    type: dropdown
    label: Channel
    required: true
    canPaginate: true
    optionsGenerator: "try {\n function convertToDesiredFormat(allChannels) {\n return allChannels\n ?.map(channel => ({\n label: channel.name,\n sample: channel.id,\n value: channel.id\n }))\n .sort((a, b) => a.label.localeCompare(b.label));\n }\n\n function replaceEqualsWithPercent3D(inputString) {\n return inputString.replace(/=/g, '');\n }\n\n let response = await axios.get(\n 'https://slack.com/api/conversations.list?types=public_channel,private_channel&exclude_archived=true&limit=999'\n );\n\n let channelArray = response?.data?.channels || [];\n\n while (response?.data?.response_metadata?.next_cursor) {\n const next_cursor = replaceEqualsWithPercent3D(response.data.response_metadata.next_cursor);\n\n response = await axios.get(\n https://slack.com/api/conversations.list?types=public_channel,private_channel&exclude_archived=true&cursor=${next_cursor}&limit=999\n );\n\n channelArray = [...channelArray, ...(response?.data?.channels || [])];\n }\n\n return convertToDesiredFormat(channelArray);\n\n} catch (error) {\n switch (error?.response?.status) {\n case 401:\n if (error?.response?.data?.error === 'token_revoked') {\n throw {\n success: false,\n status: error?.response?.status,\n message: 'Token has been revoked. Please check your credentials and try again.'\n };\n }\n break;\n case 429:\n if (error?.response?.data?.error === 'ratelimited') {\n throw {\n success: false,\n status: error?.response?.status,\n message: 'You have made too many requests in a short period. Please wait before trying again.'\n };\n }\n break;\n default:\n throw error;\n }\n}"
    customInputLabel: Channel ID
    customHelp: "Enter the Channel ID manually. You can get the Channel ID from actions like List Channels."
    customPlaceholder: "C12345678"
  - key: page_id
    help: Select the Facebook page.
    type: dropdown
    label: Page
    required: true
    canPaginate: true
    placeholder: Select the Facebook page
    customInputLabel: Page ID
    optionsGenerator: "async function fetchPagesWithPagination(context) {\n  // Get the offset (next page cursor) from context if it exists\n  const offset = context?.paginateData?.['page_id'];\n\n  const limit = 100;\n\n  // Build the API URL\n  let url = `https://graph.facebook.com/me/accounts?limit=${limit}`;\n  if (offset) {\n    url += `&after=${offset}`;\n  }\n\n  const config = {\n    method: 'get',\n    url: url\n  };\n\n  try {\n    const res = await axios.request(config);\n    const responseData = res.data;\n\n    // Check if there's any data\n    if ((!responseData.data || responseData.data.length === 0) && !offset) {\n      return {\n        message: \"No pages found. Make sure manage access is given. Update the connection and select page to give access for the automation.\"\n      };\n    }\n    else if ((!responseData.data || responseData.data.length === 0) && offset){\n return {\n  message: \"All Pages fetched successfully..\"\n }\n   }\n\n    // Transform data into dropdown format\n    const data = responseData.data.map(account => ({\n      label: account.name,\n      value: account.id,\n      sample: account.id\n    }));\n\n    // Prepare response with current page data and next offset (if any)\n    const result = {\n      data: data\n    };\n\n    // Check if there's a next page\n    if (responseData.paging && responseData.paging.cursors && responseData.paging.cursors.after) {\n      result.offset = responseData.data.length < limit ? null : responseData.paging.cursors.after;\n    }\n\n    return result;\n\n  } catch (error) {\n    // Handle specific error cases if needed\n    if (error.response?.status === 400 || error.response?.status === 190) {\n      return { message: \"Invalid or expired access token. Please reconnect.\" };\n    }\n\n    return { message: \"Enter page ID. E.g. 516470358708231\" };\n  }\n}\n\n// Call the function (assuming context is available in your environment)\nconst result = await fetchPagesWithPagination(context);\nreturn result;"
    customPlaceholder: "516470358708231"
    customHelp: "Enter the Page ID manually. You can get the Page ID from actions like List Pages."
  - key: form_id
    help: Select the lead form associated with the page.
    type: dropdown
    label: Lead Form
    required: true
    canPaginate: true
    placeholder: Choose Lead Form
    customInputLabel: Lead Form ID
    optionsGenerator: "async function fetchLeadFormsWithPagination(context) {\n  const selectedPage = context?.inputData?.page_id;\n  const offset = context?.paginateData?.['form_id'];\n  const limit = 100; // Max supported for leadgen_forms endpoint\n\n  if (!selectedPage) {\n    return { message: \"Please select a Facebook Page first.\" };\n  }\n\n  try {\n    // Get page access token using the provided getAccessToken function (empty permissions)\n    const { accessToken, isPermission } = await getAccessToken(selectedPage, []);\n\n    if (!accessToken || !isPermission) {\n      return { message: \"Unable to get access to the selected Page. Please reconnect or check permissions.\" };\n    }\n\n    // Build the API URL for leadgen_forms with pagination\n    let url = `https://graph.facebook.com/v25.0/${selectedPage}/leadgen_forms`;\n    url += `?limit=${limit}&access_token=${accessToken}`;\n    if (offset) {\n      url += `&after=${offset}`;\n    }\n\n    const response = await axios.get(url);\n    const responseData = response.data;\n\n    // If no forms returned and this is the first request\n    if ((!responseData.data || responseData.data.length === 0) && !offset) {\n      return {\n        data: [{ label: 'All Leadgen Forms', value: '0' }],\n        offset: null,\n        message: \"No Lead Forms found on this Page. You can create the lead form [here](https://business.facebook.com/latest/instant_forms/forms/). Make sure the form is created in the selected page.\"\n      };\n    }\n\n    // If no more forms on subsequent pages\n    if (!responseData.data || responseData.data.length === 0) {\n      return {\n        message: \"All Lead Forms fetched successfully.\"\n      };\n    }\n\n    // Transform forms into dropdown options\n    const data = responseData.data.map(form => ({\n      label: form.name,\n      value: form.id,\n      sample: form.id\n    }));\n\n    // Always include \"All Leadgen Forms\" as first option (only on first page)\n    if (!offset) {\n      data.unshift({ label: 'All Leadgen Forms', value: '0' });\n    }\n\n    // Prepare result\n    const result = { data };\n\n    // Add offset if there's a next page\n    if (responseData.paging?.cursors?.after) {\n      result.offset = responseData.data.length< limit? null : responseData.paging.cursors.after;\n    }\n\n    return result;\n\n  } catch (error) {\n    console.error(\"Error fetching lead forms:\", error);\n\n    // Specific OAuth/token errors\n    if (error.response?.data?.error?.code === 190) {\n      return { message: \"Invalid or expired access token. Please reconnect your Facebook account.\" };\n    }\n\n    // Permission or page access issue\n    if (error.response?.status === 400 || error.response?.status === 403) {\n      return { message: \"Insufficient permissions to access Lead Forms. Ensure 'leads_retrieval' permission is granted.\" };\n    }\n\n    // Fallback: return only \"All\" option\n    return {\n      data: [{ label: 'All Leadgen Forms', value: '0' }],\n       offset: null,\n      message: error?.message || \"Could not load forms. Using 'All Leadgen Forms' as default.\"\n    };\n  }\n}\n\n// Execute and return\nreturn await fetchLeadFormsWithPagination(context);"
    customPlaceholder: "1161533432455827"
    visibilityCondition: context?.inputData?.page_id
    customHelp: "Enter the Lead Form ID manually. You can get the Lead Form ID from actions like List Lead Forms."
```
### Reusable Component In Dropdown Dynamic:

**Reusable Component In Dropdown Dynamic Purpose:**

Reusable components let you write sensitive or reusable logic (like API calls or JS functions) once and use them anywhere JS code is allowed — such as inside `optionsGenerator`.
They help keep your plugin code cleaner, safer, and easier to maintain.

> [!NOTE]  
> Components only work in fields where custom JS is allowed — not in static fields.

**Why Use Reusable Components?**
- **Hide sensitive logic:** Keep tokens, headers, or secure calculations hidden.
- **Reuse common logic:** Use the same component across multiple fields (e.g., multiple dropdowns, API config).
- **Reduce duplicate code:** Simplify maintenance.

#### Reusable Component In Dropdown Dynamic Code Rules:

**Reusable Components fields:**
- **Component Name:** must be unique (cannot change once component is being used).
- **Parameters:** Add inputs your logic needs (e.g., `id`, `token`, `search`).
- **Component Code:** Write your JavaScript code here.

**Component Code Rules:**
- Must be written in the parent try-catch format (e.g., `try { ... } catch (error) { throw error; }`) without any wrapping async function block. The parameters defined in the component's metadata are available as global variables directly inside this code block.
- Can use `async/await` for API calls.
- **Returns:** `[{label, value}]` (Standard) or `{data: [...], offset, message}` (Paginated). Fields support `sample`/`extraValue`. Globals: `__searchText`, `context?.paginateData`.
- **Proper try/catch:** Must use a proper parent `try/catch` block for error handling. Inside the catch block, you MUST use `throw error` (or `throw e`) instead of calling `await errorComponent(error)`.
- **Input Validations:** At the beginning of the code, add validations for missing input or dependent field paths by throwing an error.
- **No Direct Globals:** Do NOT directly use `context.inputData`, `__searchText`, or `context?.paginateData` inside the reusable component code. You should always map these values to the component's parameters, which will be accessible as global variables in the code block.
- **Search-Pagination Offset Rule:** If the dropdown supports both search and pagination (`enableSearchApi: true` and `canPaginate: true`), and the search is active/enabled (i.e. the search query parameter has a value), if the API/search returns empty results, the returned `offset` must be the current cursor (`pageToken`/`offset` parameter). This ensures that if the user switches from searching back to pagination, the previous pagination offset/cursor is preserved. Any offset returned by the search API in this case must be ignored.
- Can use external libraries like `axios`. But Import is not allowed. You can use `axios` directly.

**Below are supported libraries to use directly in component code:**
- `form-data` as `FormData`
- `https`
- `crypto`
- `setTimeout`
- `axios`
- `jsonwebtoken` as `jwt`
- `lodash` as `_`
- `node-fetch` as `fetch`
- `cheerio`
- `moment`
- `fetch`
- `Buffer`
- `atob`
- `XMLParser`
- `XMLBuilder`
- `XMLValidator`

**Rules for using the component inside a dynamic dropdown's `optionsGenerator`:**
- Inside the dropdown's `optionsGenerator`, invoke the reusable component and pass the necessary parameters.
- Output the final results using the `return` keyword (e.g., `return await fetchSpreadsheets(...)`).
- **Error Handling wrapper**: When calling/mapping a reusable component in the `optionsGenerator`, the code must be wrapped in a parent `try-catch` block and the `catch` block must call `await errorComponent(error)` (it must NOT throw the error).
- This keeps your dynamic dropdown logic clean, hidden, and reusable.
- **Strict Parameter Usage:** Strictly do NOT use the dependent paths for the input hardcoded directly inside the reusable component code (like `context?.inputData?.key_name`). For such paths, always use parameters. Also, adding search, limit, and all input fields paths as parameters is the correct practice in case of the reusable component function. This will help in the auto detection of the `dependsOn` key, which is discussed in the **Understanding `dependsOn` vs `visibilityCondition`** section. For further reference, please see the **Special Note: Raw `inputFields` and auto generated keys in the final json input fields [`steps`,`blocks` and `dependsOn`]** in the documentation.
- **Reusable Component Mapping Path:** When mapping the component for a dynamic dropdown in `optionsGenerator`, the mapping `path` sent to the API/tool is the field key (e.g., `"page_id"`). Even if the dropdown field is inside an input group, the mapping `path` is STILL strictly the field key itself (e.g., `"page_id"`), never a nested input group path.
- **Alternative to Reusable Components (Inline Code):** If not using a Reusable Component, the function code and its invocation must be written directly inside the `optionsGenerator` (i.e., you must define the function and explicitly call/invoke it at the end, e.g., `async function getOptions() { ... }; return await getOptions();`). If a Reusable Component is used, the function code resides inside the component itself, and `optionsGenerator` only needs to call that component function (e.g., `return await fetchComponent(param1, param2);`).

#### Reusable Component In Dropdown Dynamic Example Code and Usage:

##### Example 1: Facebook Lead Form Dropdown Dynamic

- **Component Name:** `fetchLeadForms`
- **Parameters:** `selectedPage` (string, required), `offset` (string, optional), `limit` (number, optional)
- **Component Code:**
```javascript
  if (!selectedPage) {
    return { message: "Please select a Facebook Page first." };
  }

  try {
    // Get page access token using the provided getAccessToken function (empty permissions)
    const { accessToken, isPermission } = await getAccessToken(selectedPage, []);

    if (!accessToken || !isPermission) {
      return { message: "Unable to get access to the selected Page. Please reconnect or check permissions." };
    }

    // Build the API URL for leadgen_forms with pagination
    let url = `https://graph.facebook.com/v25.0/${selectedPage}/leadgen_forms`;
    url += `?limit=${limit}&access_token=${accessToken}`;
    if (offset) {
      url += `&after=${offset}`;
    }

    const response = await axios.get(url);
    const responseData = response.data;

    // If no forms returned and this is the first request
    if ((!responseData.data || responseData.data.length === 0) && !offset) {
      return {
        data: [{ label: 'All Leadgen Forms', value: '0' }],
        offset: null,
        message: "No Lead Forms found on this Page. You can create the lead form [here](https://business.facebook.com/latest/instant_forms/forms/). Make sure the form is created in the selected page."
      };
    }

    // If no more forms on subsequent pages
    if (!responseData.data || responseData.data.length === 0) {
      return {
        message: "All Lead Forms fetched successfully."
      };
    }

    // Transform forms into dropdown options
    const data = responseData.data.map(form => ({
      label: form.name,
      value: form.id,
      sample: form.id
    }));

    // Always include "All Leadgen Forms" as first option (only on first page)
    if (!offset) {
      data.unshift({ label: 'All Leadgen Forms', value: '0' });
    }

    // Prepare result
    const result = { data };

    // Add offset if there's a next page
    if (responseData.paging?.cursors?.after) {
      result.offset = responseData.data.length< limit? null : responseData.paging.cursors.after;
    }

    return result;

  } catch (error) {
    console.error("Error fetching lead forms:", error);

    // Specific OAuth/token errors
    if (error.response?.data?.error?.code === 190) {
      return { message: "Invalid or expired access token. Please reconnect your Facebook account." };
    }

    // Permission or page access issue
    if (error.response?.status === 400 || error.response?.status === 403) {
      return { message: "Insufficient permissions to access Lead Forms. Ensure 'leads_retrieval' permission is granted." };
    }

    // Fallback: return only "All" option
    return {
      data: [{ label: 'All Leadgen Forms', value: '0' }],
       offset: null,
      message: error?.message || "Could not load forms. Using 'All Leadgen Forms' as default."
    };
  }
```
Usage inside a dynamic dropdown's `optionsGenerator`:
```json
{
 "optionsGenerator": "try{\n  const selectedPage = context?.inputData?.selectedPage;\nconst offset = context?.paginateData?.['page_id'];\nconst limit = context?.inputData?.limit;\nreturn await fetchLeadForms(selectedPage, offset, limit);\n}catch(e){\nawait errorComponent(e);\n}"
}
```
##### Example 2: Google Sheet Spreadsheet Dropdown Dynamic

- **Component Name:** `fetchSpreadsheets`
- **Parameters:** `pageToken` (string, optional), `searchText` (string, optional), `pageSize` (number, optional)
- **Component Code:**
```javascript
 try {
    // Base query: only Google Sheets, not trashed
    let query = "trashed = false and mimeType = 'application/vnd.google-apps.spreadsheet'";

    // Apply search filter
    if (searchText) {
      query += ` and name contains '${searchText.replace(/'/g, "\\'")}'`;
    }

    const params = {
      q: query,
      orderBy: "modifiedTime desc",
      pageSize: pageSize,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      fields: "nextPageToken, files(id, name)"
    };

    // Pagination only when NOT searching
    if (!searchText && pageToken) {
      params.pageToken = pageToken;
    }

    const response = await axios.get(
      "https://www.googleapis.com/drive/v3/files",
      { params }
    );

    // No data on first load
    if (
      response.data.files &&
      response.data.files.length === 0 &&
      !pageToken
    ) {
      return {
        data:[],
        offset: null,
        message: "No active spreadsheets found in your Google Drive."
      };
    }
    else if (
      response.data.files &&
      response.data.files.length === 0 &&
     searchText
    ) {
      return {        
        data:[],
        offset: pageToken || null,
        message: "No Search File Present. Choose from the options."
      };
    }

    const files = response.data.files || [];

    return {
      data: files.map(file => ({
        label: file.name,
        value: file.id,
        sample: file.id
      })),
      offset: !searchText
        ? response.data.nextPageToken || null
        : pageToken || null
    };

  } catch (error) {
    throw error;
  }
```
Usage inside a dynamic dropdown's `optionsGenerator`:
```json
{
    "optionsGenerator": "try{\n  const pageToken = context?.paginateData?.['spreadsheet_Id']\n  const searchText = __searchText\n  const pageSize = 100;\n  return await fetchSpreadsheets(pageToken,searchText,pageSize) \n}catch(e){\n  await errorComponent(e);\n}"
}
```

## Multi Select Dynamic

**Multi Select Dynamic Purpose:**
The Multi Select Dynamic field allows users to select multiple options from a dynamically generated list. These options are typically fetched via an API call or returned by custom logic at runtime. This is highly effective when users need to pick multiple items simultaneously, such as filtering by multiple properties or selecting several columns to return.
Just like the Dropdown Dynamic field, you can use **Reusable Components** inside the `optionsGenerator` to securely execute API calls and handle options generation logic cleanly, improving maintainability and code reuse.

### Multi Select Dynamic Input Field Generation Rules:
- When creating a dynamic multiselect field, adhere to the strict structure outlined in the JSON/TOON schemas format.
- Set `type: "multiselect"` and define essential fields such as `key`, `label`, `help`, and `optionsGenerator`.
- In the `optionsGenerator` property, write or invoke JavaScript code that fetches and transforms options. **It is highly recommended to attach Reusable Components here** to keep your code clean and secure. The return format MUST be an array of objects `[{label, value, sample}]`. MANDATORY RULE: If the value is an ID, the sample MUST be included in the return object. If the label and sample are exactly the same, then NO sample is needed.
- **No canPaginate or enableSearchApi Support (CRITICAL):** In `multiselect` fields, the properties `canPaginate` and `enableSearchApi` are **not supported**. If you are using reusable components that require pagination limit/cursors or search capabilities, the `optionsGenerator` for the multiselect must implement client-side pagination (looping internally to fetch and aggregate all pages/results) and return the aggregated array directly.
  - **Example of client-side pagination in multiselect `optionsGenerator`:**
    ```json
    {
      "key": "removeTagIds",
      "help": "Tags to remove from the contact.",
      "type": "multiselect",
      "label": "Tags to Remove",
      "required": true,
      "customHelp": "Tags are fetched from your account (or team if Team ID is set). Get Tag IDs from the **Get Tags** action (tags[].tagId).",
      "placeholder": "Select",
      "customInputLabel": "Tag IDs",
      "optionsGenerator": "const teamId = context?.inputData?.teamId;\nlet allTags = [];\nlet cursor = undefined; \n\ndo {\n  // Fetch the current page of tags\n  const response = await List_tags(teamId, cursor);\n  \n  // Spread and push the new data into our aggregated array\n  if (response?.data) {\n    allTags.push(...response.data);\n  }\n  \n  // Set the cursor to the offset returned for the next iteration\n  cursor = response?.offset;\n  \n} while (cursor); // Loop stops when offset is null/undefined\n\n// Return the completely aggregated array\nreturn allTags;",
      "customPlaceholder": "d4f37f25-79cd-11f1-b9df-1274a11ff999"
    }
    ```
- **optionsGenerator Function Calling:** If the function code is written inline inside `optionsGenerator`, it must be explicitly defined, wrapped in a parent `try-catch` block with `await errorComponent(error);` in the `catch` block, and called/invoked at the end (e.g., `async function getOptions() { ... }; try { return await getOptions(); } catch (error) { await errorComponent(error); }`). Similarly, if a Reusable Component is used, the invocation must be wrapped in a parent `try-catch` block, and the `catch` block must call `await errorComponent(error);` (e.g., `try { return await fetchComponent(param1, param2); } catch (error) { await errorComponent(error); }`).
- A proper manual input option must be configured. All three custom keys: `customPlaceholder` (compulsory), `customInputLabel` (compulsory), and `customHelp` (compulsory) must be included. `customPlaceholder` must illustrate how the array of multiple selections looks as a serialized string array (e.g., `"[\"title\",\"status\"]"` or `"[\"Name\"]"`). Do NOT use "E.g." or "e.g." in placeholders. The `help` key must focus on selection and start with "Select" (e.g. "Select the fields to include in the response."). It supports string format and markdown links like `[Lean More](https://example.com)`. **The `customInputLabel` must be short and must NOT start with "Enter"** (e.g. standard label `"Properties"`, customInputLabel `"Properties in Array"`). If not an ID field, standard label and `customInputLabel` must be the same. **The `customHelp` must guide manual input with "Enter the ID/value... You will get it from the actions like List, Find..."** (e.g. `"Enter the properties manually in array format. You can get the property IDs from actions like List Properties."`). Both `help` and `customHelp` must be very crisp and to the point.
- **Reference the schema and examples:** Carefully check the **Multi Select Dynamic JSON/TOON Schema** and look at the **Multi Select Dynamic Examples** to see fully structured implementations, formatting rules, and expected options return structures.

### Multi Select Dynamic JSON Schema:
```json
{
    "name": "generate_dynamic_multiselect_field",
    "strict": false,
    "schema": {
        "type": "object",
        "properties": {
            "inputFields": {
                "type": "array",
                "description": "The array of input fields including the newly created or updated dynamic multiselect field.",
                "items": {
                    "type": "object",
                    "properties": {
                        "key": {
                            "type": "string",
                            "pattern": "^[^.\\[\\]]*$",
                            "description": "Unique identifier for the field (e.g. 'filter_properties', 'return_column'). The key must not contain a dot (.) or square brackets ([])."
                        },
                        "type": {
                            "type": "string",
                            "enum": [
                                "multiselect"
                            ],
                            "description": "Must be exactly 'multiselect'."
                        },
                        "label": {
                            "type": "string",
                            "description": "A human-readable label explaining the choice (e.g. 'Filter Properties')."
                        },
                        "help": {
                            "type": "string",
                            "description": "Guidance text for the user. Explain what the multiselect is for."
                        },
                        "required": {
                            "type": "boolean",
                            "description": "Whether selecting at least one option is mandatory. It is an optional key; if not present, it is treated as optional."
                        },
                        "placeholder": {
                            "type": "string",
                            "description": "Optional placeholder text shown before selection (e.g. 'Choose Columns'). Omit if not applicable."
                        },
                        "optionsGenerator": {
                            "type": "string",
                            "description": "JavaScript code that fetches the dynamic options. MANDATORY RULES:\n1. Return Format: MUST return an array of objects `[{label, value, sample}]`.\n2. Properties: 'label' (string), 'value' (string/number), 'sample' (string, identical to value, shown in brackets in UI. MANDATORY RULE: If value is an ID, sample MUST be included. If label and sample are exactly the same, NO sample is needed. Omit otherwise).\n3. Reusable Components & Try-Catch: Any call to a Reusable Component or inline code in optionsGenerator must be wrapped in a parent try-catch block, and the catch block must call `await errorComponent(error);` (e.g., `try { return await fetchComponent(...); } catch (error) { await errorComponent(error); }`)."
                        },
                        "customPlaceholder": {
                            "type": "string",
                            "description": "Required placeholder for the manual input mode. Provide a relevant array example in string format (e.g., '[\"Name\"]' or '[\"title\", \"status\"]')."
                        },
                        "customInputLabel": {
                            "type": "string",
                            "description": "Required label for the manual input mode. MUST be kept short (e.g., 'Enter Column Name in Array'). If a longer explanation is needed, use 'customHelp' instead. Both can be used together."
                        },
                        "customHelp": {
                            "type": "string",
                            "description": "Optional help text for manual/dynamic input. Use this for longer explanations alongside or instead of customInputLabel. Explain exactly what array format is expected. Supports markdown links. Omit if not applicable."
                        },
                        "visibilityCondition": {
                            "type": "string",
                            "description": "A JavaScript condition for visibility. Omit if always visible."
                        },
                        "defaultValue": {
                            "type": "array",
                            "description": "The default array of objects to select initially. Omit this field entirely if there is no default.",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "label": {
                                        "type": "string",
                                        "description": "The display name of the default option."
                                    },
                                    "value": {
                                        "type": [
                                            "string",
                                            "number"
                                        ],
                                        "description": "The internal value of the default option."
                                    },
                                    "sample": {
                                        "type": "string",
                                        "description": "Optional string. MUST always be identical to the option's value. In the UI, users see the label with the sample shown in brackets. MANDATORY RULE: If the value is an ID, the sample MUST be included. If the label and sample are exactly the same, then NO sample is needed. Omit otherwise."
                                    }
                                },
                                "required": [
                                    "label",
                                    "value",
                                    "sample"
                                ]
                            }
                        }
                    },
                    "required": [
                        "key",
                        "type",
                        "label",
                        "help",
                        "optionsGenerator",
                        "customPlaceholder",
                        "customInputLabel",
                        "customHelp"
                    ]
                }
            }
        },
        "required": [
            "inputFields"
        ]
    }
}
```
### Multi Select Dynamic TOON Schema:
```toon
name: generate_dynamic_multiselect_field
strict: false
schema:
  type: object
  properties:
    inputFields:
      type: array
      description: The array of input fields including the newly created or updated dynamic multiselect field.
      items:
        type: object
        properties:
          key:
            type: string
            pattern: "^[^.\[\]]*$"
            description: "Unique identifier for the field (e.g. 'filter_properties', 'return_column'). The key must not contain a dot (.) or square brackets ([])."
          type:
            type: string
            enum[1]: multiselect
            description: Must be exactly 'multiselect'.
          label:
            type: string
            description: A human-readable label explaining the choice (e.g. 'Filter Properties').
          help:
            type: string
            description: Guidance text for the user. Explain what the multiselect is for.
          required:
            type: boolean
            description: Whether selecting at least one option is mandatory. It is an optional key; if not present, it is treated as optional.
          placeholder:


            type: string
            description: Optional placeholder text shown before selection (e.g. 'Choose Columns'). Omit if not applicable.
          optionsGenerator:
            type: string
            description: "JavaScript code that fetches the dynamic options. MANDATORY RULES:\n1. Return Format: MUST return an array of objects `[{label, value, sample}]`.\n2. Properties: 'label' (string), 'value' (string/number), 'sample' (string, identical to value, shown in brackets in UI. MANDATORY RULE: If value is an ID, sample MUST be included. If label and sample are exactly the same, NO sample is needed. Omit otherwise).\n3. Reusable Components & Try-Catch: Any call to a Reusable Component or inline code in optionsGenerator must be wrapped in a parent try-catch block, and the catch block must call `await errorComponent(error);` (e.g., `try { return await fetchComponent(...); } catch (error) { await errorComponent(error); }`)."
          customPlaceholder:


            type: string
            description: "Required placeholder for the manual input mode. Provide a relevant array example in string format (e.g., '[\"Name\"]' or '[\"title\", \"status\"]')."
          customInputLabel:
            type: string
            description: "Required label for the manual input mode. MUST be kept short (e.g., 'Enter Column Name in Array'). If a longer explanation is needed, use 'customHelp' instead. Both can be used together."
          customHelp:
            type: string
            description: Optional help text for manual/dynamic input. Use this for longer explanations alongside or instead of customInputLabel. Explain exactly what array format is expected. Supports markdown links. Omit if not applicable.
          visibilityCondition:
            type: string
            description: A JavaScript condition for visibility. Omit if always visible.
          defaultValue:
            type: array
            description: The default array of objects to select initially. Omit this field entirely if there is no default.
            items:
              type: object
              properties:
                label:
                  type: string
                  description: The display name of the default option.
                value:
                  type[2]: string,number
                  description: The internal value of the default option.
                sample:
                  type: string
                  description: "Optional string. MUST always be identical to the option's value. In the UI, users see the label with the sample shown in brackets. MANDATORY RULE: If the value is an ID, the sample MUST be included. If the label and sample are exactly the same, then NO sample is needed. Omit otherwise."
              required[3]: label,value,sample
        required[8]: key,type,label,help,optionsGenerator,customPlaceholder,customInputLabel,customHelp
  required[1]: inputFields
  ```
### Multi Select Dynamic Examples:
#### Multi Select Dynamic JSON Example:
```json
[
   {
        "key": "filter_properties",
        "help": "Select the properties to filter from the response. Leave blank to return all.",
        "type": "multiselect",
        "label": "Filter Properties",
        "required": false,
        "customHelp": "Enter the property names in an array format manually. You can get the property names from actions like List Properties.",
        "placeholder": "Choose Property",
        "optionsGenerator": "const returnDropdown = (array) => {\n    const a = array.map((key) => {\n        return {\n            label: key?.name,\n            sample: key?.type,\n            value: key?.name\n        };\n    });\n    return a;\n};\n\ntry{\n    const columnsApiUrl = `https://api.notion.com/v1/data_sources/${context.inputData.data_source_id}`;\nconst response = await axios.get(columnsApiUrl, {                 headers: {\n            'Notion-Version': '2025-09-03', // Use the current API version\n        }  } \n);\n//   return response.data\nconst arr = response.data.properties;\nconst first = Object.values(arr);\n\nreturn returnDropdown(first);\n}catch(error) {\n        throw {\n            message: error?.response?.data?.message || error?.message || 'An unknown error occurred while fetching properties'\n        };\n    }\n",
        "customPlaceholder": "['title','status']",
        "customInputLabel": "Filter Properties in Array"
      },
      {
        "key": "return_column",
        "help": "Select the columns to return in response.",
        "type": "multiselect",
        "label": "Return Columns",
        "required": false,
        "customHelp": "Enter column names or letters manually in an array format (e.g. [\"Name\"] or [\"A\"]).",
        "placeholder": "Choose Columns",
        "customInputLabel": "Return Columns in Array",
        "optionsGenerator": "const spreadSheet_id = context?.inputData?.spreadsheet_Id;\nconst targetsheet_Id = context?.inputData?.sheet_Id;\nconst column_key = context?.inputData?.search_filter?.column_key?? true;\ntry {\nreturn await fetchSheetColumns(spreadSheet_id,targetsheet_Id,column_key);\n\n} catch (error) {\n await errorComponent(error);\n}",
        "customPlaceholder": "[\"Name\"]or [\"A\"]"
      },
      {
        "key": "filter_properties",
        "help": "Select the properties to filter from the response. Leave blank to return all.",
        "type": "multiselect",
        "label": "Filter Properties",
        "required": false,
        "customHelp": "Enter the property names in an array format manually. You can get the property names from actions like List Properties.",
        "placeholder": "Choose Property",
        "optionsGenerator": "try{\n  const data_source_id =context.inputData.data_source_id\n  return await fetchDatasourceProperties(data_source_id) \n}catch(e){\n  await errorComponent(e);\n}",
        "customPlaceholder": "['title','status']",
        "customInputLabel": "Filter Properties in Array"
      }
]
```
#### Multi Select Dynamic TOON Example:
```toon
[3]:
  - key: filter_properties
    help: Select the properties to filter from the response. Leave blank to return all.
    type: multiselect
    label: Filter Properties
    required: false
    customHelp: "Enter the property names in an array format manually. You can get the property names from actions like List Properties."
    placeholder: Choose Property
    optionsGenerator: "const returnDropdown = (array) => {\n    const a = array.map((key) => {\n        return {\n            label: key?.name,\n            sample: key?.type,\n            value: key?.name\n        };\n    });\n    return a;\n};\n\ntry{\n    const columnsApiUrl = `https://api.notion.com/v1/data_sources/${context.inputData.data_source_id}`;\nconst response = await axios.get(columnsApiUrl, {                 headers: {\n            'Notion-Version': '2025-09-03', // Use the current API version\n        }  } \n);\n//   return response.data\nconst arr = response.data.properties;\nconst first = Object.values(arr);\n\nreturn returnDropdown(first);\n}catch(error) {\n        throw {\n            message: error?.response?.data?.message || error?.message || 'An unknown error occurred while fetching properties'\n        };\n    }\n"
    customPlaceholder: "['title','status']"
    customInputLabel: Filter Properties in Array
  - key: return_column
    help: Select the columns to return in response.
    type: multiselect
    label: Return Columns
    required: false
    customHelp: "Enter column names or letters manually in an array format (e.g. [\"Name\"] or [\"A\"])."
    placeholder: Choose Columns
    customInputLabel: Return Columns in Array
    optionsGenerator: "const spreadSheet_id = context?.inputData?.spreadsheet_Id;\nconst targetsheet_Id = context?.inputData?.sheet_Id;\nconst column_key = context?.inputData?.search_filter?.column_key?? true;\ntry {\nreturn await fetchSheetColumns(spreadSheet_id,targetsheet_Id,column_key);\n\n} catch (error) {\n await errorComponent(error);\n}"
    customPlaceholder: "[\"Name\"]or [\"A\"]"
  - key: filter_properties
    help: Select the properties to filter from the response. Leave blank to return all.
    type: multiselect
    label: Filter Properties
    required: false
    customHelp: "Enter the property names in an array format manually. You can get the property names from actions like List Properties."
    placeholder: Choose Property
    optionsGenerator: "try{\n  const data_source_id =context.inputData.data_source_id\n  return await fetchDatasourceProperties(data_source_id) \n}catch(e){\n  await errorComponent(e);\n}"
    customPlaceholder: "['title','status']"
    customInputLabel: Filter Properties in Array
```

### Reusable Component In Multi Select Dynamic:

**Reusable Component In Multi Select Dynamic Purpose:**

Reusable components let you write sensitive or reusable logic (like API calls or JS functions) once and use them anywhere JS code is allowed — such as inside `optionsGenerator`.
They help keep your plugin code cleaner, safer, and easier to maintain.

> [!NOTE]  
> Components only work in fields where custom JS is allowed — not in static fields.

**Why Use Reusable Components?**
- **Hide sensitive logic:** Keep tokens, headers, or secure calculations hidden.
- **Reuse common logic:** Use the same component across multiple fields (e.g., multiple multiselects, API config).
- **Reduce duplicate code:** Simplify maintenance when fetching common arrays (like columns, properties, tags).

#### Reusable Component In Multi Select Dynamic Code Rules:

**Reusable Components fields:**
- **Component Name:** must be unique (cannot change once component is being used).
- **Parameters:** Add inputs your logic needs (e.g., `sheetId`, `dataSourceId`).
- **Component Code:** Write your JavaScript code here.

**Component Code Rules:**
- Must be written in the parent try-catch format (e.g., `try { ... } catch (error) { throw error; }`) without any wrapping async function block. The parameters defined in the component's metadata are available as global variables directly inside this code block.
- Can use `async/await` for API calls.
- **Returns:** MUST return an array of objects `[{label, value}]`. Fields support `sample`.
- **Proper try/catch:** Must use a proper parent `try/catch` block for error handling. Inside the catch block, you MUST use `throw error` (or `throw e`) instead of calling `await errorComponent(error)`.
- **Input Validations:** At the beginning of the code, add validations for missing input or dependent field paths by throwing an error.
- **No Direct Globals:** Do NOT directly use `context.inputData`, `__searchText`, or `context?.paginateData` inside the reusable component code. You should always map these values to the component's parameters, which will be accessible as global variables in the code block.
- Can use external libraries like `axios`. But Import is not allowed. You can use it directly.

**Below are supported libraries to use directly in component code:**
- `form-data` as `FormData`
- `https`
- `crypto`
- `setTimeout`
- `axios`
- `jsonwebtoken` as `jwt`
- `lodash` as `_`
- `node-fetch` as `fetch`
- `cheerio`
- `moment`
- `fetch`
- `Buffer`
- `atob`
- `XMLParser`
- `XMLBuilder`
- `XMLValidator`

**Rules for using the component inside a dynamic multiselect's `optionsGenerator`:**
- Inside the multiselect's `optionsGenerator`, invoke the reusable component and pass the necessary parameters.
- Output the final results using the `return` keyword (e.g., `return await fetchSheetColumns(...)`).
- **Error Handling wrapper**: When calling/mapping a reusable component in the `optionsGenerator`, the code must be wrapped in a parent `try-catch` block and the `catch` block must call `await errorComponent(error)` (it must NOT throw the error).
- This keeps your dynamic multiselect logic clean, hidden, and reusable.
- **Strict Parameter Usage:** Strictly do NOT use the dependent paths for the input hardcoded directly inside the reusable component code (like `context?.inputData?.key_name`). For such paths, always use parameters. Also, adding search, limit, and all input fields paths as parameters is the correct practice in case of the reusable component function. This will help in the auto detection of the `dependsOn` key, which is discussed in the **Understanding `dependsOn` vs `visibilityCondition`** section. For further reference, please see the **Special Note: Raw `inputFields` and auto generated keys in the final json input fields [`steps`,`blocks` and `dependsOn`]** in the documentation.
- **Reusable Component Mapping Path:** When mapping the component for a dynamic multiselect in `optionsGenerator`, the mapping `path` sent to the API/tool is the field key (e.g., `"page_id"`). Even if the multiselect field is inside an input group, the mapping `path` is STILL strictly the field key itself (e.g., `"page_id"`), never a nested input group path.
- **Alternative to Reusable Components:** If not using the reusable component, the code can be directly added the same way: the function and the function call can be written directly inside the `optionsGenerator`.

#### Reusable Component In Multi Select Dynamic Example Code and Usage:

##### Example 1: Google Sheets Column Multi Select Dynamic

- **Component Name:** `fetchSheetColumns`
- **Parameters:** `spreadSheet_id` (string, required), `targetSheetId` (string, required), `column_key` (boolean, required)
- **Component Code:**
```javascript
function getColumnLetter(index) {
  let letter = '';
  let temp = index;
  while (temp >= 0) {
    letter = String.fromCharCode(65 + (temp % 26)) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

try {
  // 1. Get Metadata
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheet_id}`;
  const params = { fields: 'sheets.properties(title,sheetId,gridProperties.columnCount)' };
  const metaResponse = await axios.get(metaUrl, { params });
  
  const sheets = metaResponse.data.sheets || [];
  const targetSheet = sheets.find(s => s.properties.sheetId == targetSheetId);

  if (!targetSheet) return { message: `Sheet with ID "${targetSheetId}" not found.` };

  const sheetName = targetSheet.properties.title;
  const columnCount = targetSheet.properties.gridProperties?.columnCount || 26;

  // 2. SCENARIO A: Standard Columns
  if (!column_key) {
    const result = [];
    for (let i = 0; i < columnCount; i++) {
      const letter = getColumnLetter(i);
      result.push({ label: `Column ${letter}`, value: letter, sample: letter });
    }
    return result;
  }

  // 3. SCENARIO B: Headers from Row 1
  const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheet_id}/values/${encodeURIComponent(sheetName + '!1:1')}`;
  const valuesResponse = await axios.get(valuesUrl);
  const headerRow = valuesResponse.data.values?.[0] || [];

  if (headerRow.length === 0) return { message: "Empty headers found. Please make sure the first row contains header names and then refresh the dropdown" };

  // --- CHANGED LOGIC START ---
  
  // Step 1: Count occurrences of every header first
  const headerCounts = {};
  headerRow.forEach(cell => {
    const name = cell?.toString().trim();
    if (name) {
      headerCounts[name] = (headerCounts[name] || 0) + 1;
    }
  });

  const result = [];

  // Step 2: Build the result, checking the counts we just made
  headerRow.forEach((cell, i) => {
    const rawHeader = cell?.toString().trim();
    if (!rawHeader) return; 

    const columnLetter = getColumnLetter(i);
    let finalValue = rawHeader;

    // IF the header appears more than once total, append suffix to ALL instances
    if (headerCounts[rawHeader] > 1) {
       finalValue = `${rawHeader}--${columnLetter}`;
    }

    result.push({
      label: rawHeader,
      value: finalValue,
      sample: `Column ${columnLetter}`
    });
  });
  // --- CHANGED LOGIC END ---

  if (result.length === 0) return { message: "No valid headers found." };

  return result;

} catch (error) {
  if (error.response) return { message: 'Google Sheets API Error', status: error.response.status, details: error.response.data };
  return { message: 'Unexpected error.', error: error.message };
}
```
Usage inside a dynamic multiselect's `optionsGenerator`:
```json
{
    "optionsGenerator": "const spreadSheet_id = context?.inputData?.spreadsheet_Id;\nconst targetsheet_Id = context?.inputData?.sheet_Id;\nconst column_key = context?.inputData?.search_filter?.column_key?? true;\ntry {\nreturn await fetchSheetColumns(spreadSheet_id,targetsheet_Id,column_key);\n\n} catch (error) {\n await errorComponent(error);\n}"
}
```
##### Example 2: Notion Data Source Property Multi Select Dynamic

- **Component Name:** `fetchDatasourceProperties`
- **Parameters:** `data_source_id` (string, required)
- **Component Code:**
```javascript
const returnDropdown = (array) => {
    const a = array.map((key) => {
        return {
            label: key?.name,
            sample: key?.type,
            value: key?.name
        };
    });
    return a;
};

try{
    const columnsApiUrl = `https://api.notion.com/v1/data_sources/${data_source_id}`;
const response = await axios.get(columnsApiUrl, {                 headers: {
            'Notion-Version': '2025-09-03', // Use the current API version
        }  } 
);
//   return response.data
const arr = response.data.properties;
const first = Object.values(arr);

return returnDropdown(first);
}catch(error) {
        throw {
            message: error?.response?.data?.message || error?.message || 'An unknown error occurred while fetching properties'
        };
    }
```
Usage inside a dynamic multiselect's `optionsGenerator`:
```json
{
    "optionsGenerator": "try{\n  const data_source_id =context.inputData.data_source_id\n  return await fetchDatasourceProperties(data_source_id) \n}catch(e){\n  await errorComponent(e);\n}"
}
```
## Help Dynamic

**Help Dynamic Purpose:**

A Dynamic Help field is used to generate and display real-time instructional content, validation messages, or warnings based on contextual API calls or internal logic. Unlike a Static Help field, it runs custom JavaScript to determine the content to show. This allows the plugin to react to user inputs dynamically to provide contextual assistance. 

**Pro Tip:** You can use this method in plugin scenarios like:
*   Checking authentication validity
*   Verifying API credentials
*   Ensuring resources (e.g., project ID, table columns) exist
*   Alerting for unsupported settings

### Help Dynamic Input Field Generation Rules:
Generate a JSON object strictly following the rules below for a dynamic help field.

**When to Use**
- Use a Dynamic Help field when the informative text or warning needs to be generated on-the-fly based on API responses or current user selections.

**1. Core Rules**
- Create an object with `type: "help"`.
- Add the field to the `inputFields` array.
- A dynamic help field REQUIRES a `source` property containing executable JavaScript code.

**2. Key Rules**
- `key` must be unique within `inputFields`.
- `key` must not contain a dot (`.`).
- `key` must be a stable identifier (e.g. `help_dynamic`, `help_page_status`).

**3. Type Rule**
- `type` must be exactly `"help"`.

**4. Source Code Rule**
- `source`: This property must contain the JavaScript code that executes to render the dynamic help.
- **MANDATORY**: The code *must* return an object containing a `message` key (e.g., `return { message: 'Your text here' };`).
- The `message` content supports plain text, HTML, and Markdown formatting.
- *How to Use in viaSocket:* You can add this code directly in the plugin builder's "JavaScript API Call" area, or embed it in JSON using the `source` key (make sure to escape the code using EscapeJSON before pasting).

**5. Label Rule**
- `label`: An optional human-readable label displayed above the help text block (e.g., "Available Columns"). Omit this field entirely if not needed.

**6. Visibility Condition Rule**
- `visibilityCondition`: Include this optional JavaScript condition only if the help block should conditionally render. Omit if it should evaluate and display unconditionally.

**7. Output Constraint**
- Return only valid JSON.
- Do not add undocumented fields (e.g., do not add generic `help` or `placeholder` attributes as they do not apply to this specific dynamic help generation block).

### Help Dynamic JSON Schema:
```json
{
    "name": "generate_dynamic_help_field",
    "strict": false,
    "schema": {
        "type": "object",
        "properties": {
            "inputFields": {
                "type": "array",
                "description": "The array of input fields including the newly created or updated dynamic help field.",
                "items": {
                    "type": "object",
                    "properties": {
                        "key": {
                            "type": "string",
                            "pattern": "^[^.\\[\\]]*$",
                            "description": "Unique identifier for the field (e.g. 'help_dynamic', 'help_page_status'). The key must not contain a dot (.) or square brackets ([])."
                        },
                        "type": {
                            "type": "string",
                            "enum": [
                                "help"
                            ],
                            "description": "Must be exactly 'help'."
                        },
                        "source": {
                            "type": "string",
                            "description": "JavaScript code that executes to render the dynamic help. MANDATORY RULE: The code must return an object containing a 'message' key (e.g., `return { message: 'Your text here' };`). The message can support markdown and HTML."
                        },
                        "label": {
                            "type": "string",
                            "description": "Optional human-readable label displayed above the help text block. Omit this field entirely if not applicable."
                        },
                        "visibilityCondition": {
                            "type": "string",
                            "description": "Optional JavaScript condition for visibility of the help block. Omit this field entirely if always visible."
                        }
                    },
                    "required": [
                        "key",
                        "type",
                        "source"
                    ]
                }
            }
        },
        "required": [
            "inputFields"
        ]
    }
}
```
### Help Dynamic TOON Schema:
```toon
name: generate_dynamic_help_field
strict: false
schema:
  type: object
  properties:
    inputFields:
      type: array
      description: The array of input fields including the newly created or updated dynamic help field.
      items:
        type: object
        properties:
          key:
            type: string
            pattern: "^[^.\[\]]*$"
            description: "Unique identifier for the field (e.g. 'help_dynamic', 'help_page_status'). The key must not contain a dot (.) or square brackets ([])."
          type:
            type: string
            enum[1]: help
            description: Must be exactly 'help'.
          source:
            type: string
            description: "JavaScript code that executes to render the dynamic help. MANDATORY RULE: The code must return an object containing a 'message' key (e.g., `return { message: 'Your text here' };`). The message can support markdown and HTML."
          label:
            type: string
            description: Optional human-readable label displayed above the help text block. Omit this field entirely if not applicable.
          visibilityCondition:
            type: string
            description: Optional JavaScript condition for visibility of the help block. Omit this field entirely if always visible.
        required[3]: key,type,source
  required[1]: inputFields
```

### Help Dynamic Examples:
#### Help Dynamic JSON Example:
```json
[
  {
    "key": "help_page_status",
    "type": "help",
    "source": "const selectedPage = context?.inputData?.page_id;\n\n// Define required permissions at the beginning\nconst REQUIRED_PERMISSIONS = [\n  'MODERATE',\n  'ADVERTISE',\n  'MANAGE_LEAD_FORMS',\n  'MANAGE'\n];\n\nasync function checkPagePermissions() {\n  try {\n    const { accessToken, isPermission } = await getAccessToken(\n      selectedPage,\n      REQUIRED_PERMISSIONS\n    );\n\n    if (!accessToken) {\n      return {\n        message: \"Selected page not found or access token unavailable. Please reconnect and reselect the page.\"\n      };\n    }\n\n    if (!isPermission) {\n      return {\n        message: \"You don’t have permission to use this trigger. To proceed, you need to be an admin, editor, or have 'manage page' access. Please ask the page admin to grant you the necessary permissions.\"\n      };\n    }\n\n    return {\n      message: \"You will receive the lead data here whenever a new lead is generated.\"\n    };\n\n  } catch (error) {\n    return {\n      message: \"An error occurred while checking permissions. Please try again by updating the connections.\"\n    };\n  }\n}\n\n// Execute\nreturn await checkPagePermissions();"
  },
  {
    "key": "dynamic_help_query",
    "type": "help",
    "label": "Available Columns",
    "source": "async function convertToDesiredFormat() {\n    const URL = `https://table-api.viasocket.com/dbs/${context.authData.dbId}/${context?.inputData?.table}/field`;\n    const EXCLUDED_KEYS = [\"rowid\", \"autonumber\"];\n    try {\n        const response = await axios.get(URL);\n        const data = response.data.data.fields;\n        let markdownMessage = \"Available Columns in your selected table:\\n\";\n        let index = 1;\n        let fieldObjs = [];\n        Object.keys(data).forEach((key) => {\n            if (!EXCLUDED_KEYS.includes(key)) {\n                const field = data[key];\n                markdownMessage += `${index}. ${field.fieldName} (${field.fieldType})\\n`;\n                fieldObjs.push(field);\n                index++;\n            }\n        });\n\n        function exampleValue(field) {\n            if (/_id$/.test(field.fieldName) || field.fieldType.match(/(int|number|bigint)/i)) {\n                return 12345;\n            } else if (/status|type/i.test(field.fieldName)) {\n                return \"'Active'\";\n            } else if (field.fieldType.match(/(text|longtext|varchar)/i)) {\n                return \"'John Doe'\";\n            } else {\n                return \"'John Doe'\";\n            }\n        }\n\n        let example = '';\n        if (fieldObjs.length >= 2) {\n            example = `Example: ${fieldObjs[0].fieldName} is equal to ${exampleValue(fieldObjs[0])} and ${fieldObjs[1].fieldName} is equal to ${exampleValue(fieldObjs[1])}`;\n        } else if (fieldObjs.length === 1) {\n            example = `Example: ${fieldObjs[0].fieldName} is equal to ${exampleValue(fieldObjs[0])}`;\n        } else {\n            example = `No filterable columns available.`;\n        }\n\n        return { message: markdownMessage + '\\n' + example };\n    } catch (error) {\n        return { message: \"Could not fetch table columns.\" };\n    }\n}\n\nreturn convertToDesiredFormat();\n",
    "visibilityCondition": "context.inputData.filter_mode === 'query' && context.inputData.table"
  },
  {
    "key": "template_help",
    "type": "help",
    "label": "Template Preview",
    "source": "async function getTemplateById({ wba_id, template_id }) {\n  const baseUrl = `https://graph.facebook.com/v23.0/${wba_id}/message_templates?fields=id,name,status,category,language,components&limit=100`;\n  let url = baseUrl;\n\n  try {\n    while (url) {\n      const response = await axios.get(url);\n\n      // Loop through each template and check the id\n      for (const template of response.data.data) {\n        if (template.id === template_id) {\n          let messageContent = '';\n          let headerType = '';\n\n          // Loop through all components and extract header type if available\n          template.components.forEach((component) => {\n            if (component.type === 'HEADER') {\n              if (component.format) {\n                headerType = `<div><b>Header Type: ${component.format}</b></div>`;\n              } else {\n                headerType = `<div><b>Header Type: TEXT</b></div>`;\n              }\n            }\n          });\n\n          // Add header type to the top if available\n          if (headerType) messageContent += headerType;\n\n          // Continue building message content\n          template.components.forEach((component) => {\n            if (component.type === 'BODY' && component.text) {\n              // Handle BODY text component\n              const bodyText = component.text.replace(/\\n/g, '<br>');\n              messageContent += `<p>${bodyText}</p>`;\n            } else if (component.type === 'HEADER' && component.format) {\n              if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(component.format)) {\n                const mediaUrl = component.example?.header_handle || '';\n                if (component.format === 'IMAGE') {\n                  messageContent += `<img src=\"${mediaUrl}\" alt=\"Header Image\" style=\"max-width: 100%;\"/><br>`;\n                } else if (component.format === 'VIDEO') {\n                  messageContent += `<video controls><source src=\"${mediaUrl}\" type=\"video/mp4\">Your browser does not support the video tag.</video><br>`;\n                } else if (component.format === 'DOCUMENT') {\n                  messageContent += `<a href=\"${mediaUrl}\" target=\"_blank\">Download Document</a><br>`;\n                }\n              }\n            } else if (component.type === 'BUTTONS' && Array.isArray(component.buttons)) {\n              // Buttons grouped and numbered per type\n              const urlButtons = component.buttons.filter(btn => btn.type === 'URL');\n              const quickReplyButtons = component.buttons.filter(btn => btn.type === 'QUICK_REPLY');\n              const phoneButtons = component.buttons.filter(btn => btn.type === 'PHONE_NUMBER');\n\n              if (urlButtons.length) {\n                messageContent += `<div><b>Custom Button:</b></div>`;\n                urlButtons.forEach((btn, idx) => {\n                  messageContent += `<div>${idx + 1}. Title: ${btn.text}, Value: ${btn.url}</div>`;\n                });\n              }\n              if (quickReplyButtons.length) {\n                messageContent += `<div><b>Quick Reply Button:</b></div>`;\n                quickReplyButtons.forEach((btn, idx) => {\n                  if (btn.payload) {\n                    messageContent += `<div>${idx + 1}. Title: ${btn.text}, Value: ${btn.payload}</div>`;\n                  } else {\n                    messageContent += `<div>${idx + 1}. Title: ${btn.text}</div>`;\n                  }\n                });\n              }\n              if (phoneButtons.length) {\n                messageContent += `<div><b>Phone Button:</b></div>`;\n                phoneButtons.forEach((btn, idx) => {\n                  messageContent += `<div>${idx + 1}. Title: ${btn.text}, Value: ${btn.phone_number}</div>`;\n                });\n              }\n            }\n          });\n\n          // Return the message content as a single HTML-formatted string\n          return { message: messageContent };\n        }\n      }\n\n      // Check if there are more pages\n      url = response.data.paging?.next || null;\n    }\n    return { message: 'Template not found.' };\n  } catch (error) {\n    return { message: error.message };\n  }\n}\n\n// Usage:\nconst result = await getTemplateById({\n  wba_id: context?.inputData?.wba_id,\n  template_id: context?.inputData?.message_template_id\n});\nreturn result;",
    "visibilityCondition": "context?.inputData?.message_template_id"
  },
   {
    "key": "eligibility_checks",
    "type": "help",
    "source": "const channelId = context.inputData.channelId;\n\n\nasync function checkYouTubeUploadEligibility(channelId = 'mine') {\n    try {\n        // if (!accessToken) {\n        //     return {\n        //         isEligibleForLongVideos: false,\n        //         canUpload: false,\n        //         warningMessage: 'Missing OAuth 2.0 access token. Cannot check YouTube channel eligibility.',\n        //         originalError: null\n        //     };\n        // }\n\n        // Use the channels.list endpoint to get channel status\n        // 'mine=true' retrieves the authenticated user's channel.\n        // 'part=status' is sufficient for longUploadsStatus.\n        const response = await axios.get(\n            `https://www.googleapis.com/youtube/v3/channels?part=status&mine=true`\n        );\n\n        if (response.status !== 200 || !response.data || response.data.items.length === 0) {\n            return {\n                isEligibleForLongVideos: false,\n                canUpload: false,\n                warningMessage: 'Could not retrieve YouTube channel information. Ensure the authenticated user has a YouTube channel.',\n                originalError: response.data\n            };\n        }\n\n        const channelStatus = response.data.items[0].status;\n        const longUploadsStatus = channelStatus.longUploadsStatus;\n\n        let isEligibleForLongVideos = false;\n        let canUpload = true; // Assume true unless specific checks fail\n        let warningMessage = null;\n\n        if (longUploadsStatus === 'allowed') {\n            isEligibleForLongVideos = true;\n        } else if (longUploadsStatus === 'eligible') {\n            isEligibleForLongVideos = false; // Not yet allowed, needs phone verification\n            warningMessage = 'Your YouTube channel is eligible for longer videos (>15 mins) but requires phone verification. Please verify your account in YouTube Studio to enable this feature.';\n            canUpload = false; // Prevent large file upload if this is a strict requirement\n        } else if (longUploadsStatus === 'disallowed') {\n            isEligibleForLongVideos = false;\n            warningMessage = 'Your YouTube channel is currently disallowed from uploading videos longer than 15 minutes due to policy violations or other restrictions. Please check your YouTube Studio settings.';\n            canUpload = false;\n        } else { // 'yetUnspecified' or any other unexpected value\n            isEligibleForLongVideos = false;\n            warningMessage = `Cannot determine channel's long video upload status (status: ${longUploadsStatus}). It might not be enabled or require further action.`;\n            canUpload = false;\n        }\n\n        // Additional check: daily upload limits are not directly exposed,\n        // but if the channel is not in good standing, general uploads might be affected.\n        // This is less common for *duration* but good to be aware of.\n        const uploadStatus = channelStatus.uploadStatus;\n        if (uploadStatus === 'disallowed') {\n             canUpload = false;\n             warningMessage = warningMessage ? warningMessage + ' Also, general video uploads appear to be disallowed for this channel.' : 'General video uploads appear to be disallowed for this channel.';\n        }\n\n\n        // GSuite administrator access / API access:\n        // If the API call above fails with a 403, it's often a permission issue.\n        // We'll catch it in the outer try/catch.\n\n        return { isEligibleForLongVideos, canUpload, warningMessage, originalError: null };\n\n    } catch (error) {\n        let errorMessage = 'An error occurred while checking YouTube channel eligibility.';\n        let canUpload = false;\n        let originalError = error;\n\n        if (error.response) {\n            // Google API error response structure\n            const status = error.response.status;\n            const errorData = error.response.data;\n\n            if (status === 401 || status === 403) {\n                // 401 Unauthorized: Access token invalid or expired.\n                // 403 Forbidden: Permissions issue, could be GSuite admin restrictions,\n                // insufficient scopes, or the account doesn't have a YouTube channel.\n                errorMessage = `Permission denied to access YouTube channel. Status: ${status}. This could be due to:\n                1. Invalid/expired access token.\n                2. Insufficient scopes (ensure 'https://www.googleapis.com/auth/youtube.upload' and 'https://www.googleapis.com/auth/youtube.readonly' are granted).\n                3. The GSuite administrator has restricted YouTube access or API access for this user.\n                4. The user does not have a YouTube channel created yet.`;\n                canUpload = false; // Definitely cannot proceed with upload\n            } else if (status === 429) {\n                // 429 Too Many Requests: API quota limit reached.\n                errorMessage = 'API Quota Exceeded for your Google Cloud Project. You have exhausted the daily limit for YouTube API calls. Please try again after 24 hours (midnight Pacific Time).';\n                canUpload = false;\n            } else {\n                errorMessage += ` API Error: ${status} - ${errorData.error?.message || JSON.stringify(errorData)}`;\n            }\n        } else if (error.request) {\n            // Network error\n            errorMessage = `No response received from YouTube API. Network issue or API endpoint unavailable: ${error.message}`;\n        } else {\n            // Other errors\n            errorMessage = `Unexpected error during YouTube API call: ${error.message}`;\n        }\n\n        console.error('YouTube Eligibility Check Error:', errorMessage, error);\n\n        return {\n            isEligibleForLongVideos: false,\n            canUpload: false,\n            warningMessage: errorMessage,\n            originalError: originalError\n        };\n    }\n}\n\ntry {\n    const eligibility = await checkYouTubeUploadEligibility();\n\n    if (!eligibility.canUpload) {\n\n        return {\n            message: eligibility.warningMessage\n        \n        };\n    }else{\n\n       return {\n            message: 'Your YouTube channel is eligible to upload YouTube videos'\n        \n        };\n    }\n} catch (error) {\n  return {\n            message: 'Please test the flow to check the YouTube video upload eligibility '\n        \n        };\n}"
  }
]
```
#### Help Dynamic TOON Example:
```toon
[4]:
  - key: help_page_status
    type: help
    source: "const selectedPage = context?.inputData?.page_id;\n\n// Define required permissions at the beginning\nconst REQUIRED_PERMISSIONS = [\n  'MODERATE',\n  'ADVERTISE',\n  'MANAGE_LEAD_FORMS',\n  'MANAGE'\n];\n\nasync function checkPagePermissions() {\n  try {\n    const { accessToken, isPermission } = await getAccessToken(\n      selectedPage,\n      REQUIRED_PERMISSIONS\n    );\n\n    if (!accessToken) {\n      return {\n        message: \"Selected page not found or access token unavailable. Please reconnect and reselect the page.\"\n      };\n    }\n\n    if (!isPermission) {\n      return {\n        message: \"You don’t have permission to use this trigger. To proceed, you need to be an admin, editor, or have 'manage page' access. Please ask the page admin to grant you the necessary permissions.\"\n      };\n    }\n\n    return {\n      message: \"You will receive the lead data here whenever a new lead is generated.\"\n    };\n\n  } catch (error) {\n    return {\n      message: \"An error occurred while checking permissions. Please try again by updating the connections.\"\n    };\n  }\n}\n\n// Execute\nreturn await checkPagePermissions();"
  - key: dynamic_help_query
    type: help
    label: Available Columns
    source: "async function convertToDesiredFormat() {\n    const URL = `https://table-api.viasocket.com/dbs/${context.authData.dbId}/${context?.inputData?.table}/field`;\n    const EXCLUDED_KEYS = [\"rowid\", \"autonumber\"];\n    try {\n        const response = await axios.get(URL);\n        const data = response.data.data.fields;\n        let markdownMessage = \"Available Columns in your selected table:\\n\";\n        let index = 1;\n        let fieldObjs = [];\n        Object.keys(data).forEach((key) => {\n            if (!EXCLUDED_KEYS.includes(key)) {\n                const field = data[key];\n                markdownMessage += `${index}. ${field.fieldName} (${field.fieldType})\\n`;\n                fieldObjs.push(field);\n                index++;\n            }\n        });\n\n        function exampleValue(field) {\n            if (/_id$/.test(field.fieldName) || field.fieldType.match(/(int|number|bigint)/i)) {\n                return 12345;\n            } else if (/status|type/i.test(field.fieldName)) {\n                return \"'Active'\";\n            } else if (field.fieldType.match(/(text|longtext|varchar)/i)) {\n                return \"'John Doe'\";\n            } else {\n                return \"'John Doe'\";\n            }\n        }\n\n        let example = '';\n        if (fieldObjs.length >= 2) {\n            example = `Example: ${fieldObjs[0].fieldName} is equal to ${exampleValue(fieldObjs[0])} and ${fieldObjs[1].fieldName} is equal to ${exampleValue(fieldObjs[1])}`;\n        } else if (fieldObjs.length === 1) {\n            example = `Example: ${fieldObjs[0].fieldName} is equal to ${exampleValue(fieldObjs[0])}`;\n        } else {\n            example = `No filterable columns available.`;\n        }\n\n        return { message: markdownMessage + '\\n' + example };\n    } catch (error) {\n        return { message: \"Could not fetch table columns.\" };\n    }\n}\n\nreturn convertToDesiredFormat();\n"
    visibilityCondition: context.inputData.filter_mode === 'query' && context.inputData.table
  - key: template_help
    type: help
    label: Template Preview
    source: "async function getTemplateById({ wba_id, template_id }) {\n  const baseUrl = `https://graph.facebook.com/v23.0/${wba_id}/message_templates?fields=id,name,status,category,language,components&limit=100`;\n  let url = baseUrl;\n\n  try {\n    while (url) {\n      const response = await axios.get(url);\n\n      // Loop through each template and check the id\n      for (const template of response.data.data) {\n        if (template.id === template_id) {\n          let messageContent = '';\n          let headerType = '';\n\n          // Loop through all components and extract header type if available\n          template.components.forEach((component) => {\n            if (component.type === 'HEADER') {\n              if (component.format) {\n                headerType = `<div><b>Header Type: ${component.format}</b></div>`;\n              } else {\n                headerType = `<div><b>Header Type: TEXT</b></div>`;\n              }\n            }\n          });\n\n          // Add header type to the top if available\n          if (headerType) messageContent += headerType;\n\n          // Continue building message content\n          template.components.forEach((component) => {\n            if (component.type === 'BODY' && component.text) {\n              // Handle BODY text component\n              const bodyText = component.text.replace(/\\n/g, '<br>');\n              messageContent += `<p>${bodyText}</p>`;\n            } else if (component.type === 'HEADER' && component.format) {\n              if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(component.format)) {\n                const mediaUrl = component.example?.header_handle || '';\n                if (component.format === 'IMAGE') {\n                  messageContent += `<img src=\"${mediaUrl}\" alt=\"Header Image\" style=\"max-width: 100%;\"/><br>`;\n                } else if (component.format === 'VIDEO') {\n                  messageContent += `<video controls><source src=\"${mediaUrl}\" type=\"video/mp4\">Your browser does not support the video tag.</video><br>`;\n                } else if (component.format === 'DOCUMENT') {\n                  messageContent += `<a href=\"${mediaUrl}\" target=\"_blank\">Download Document</a><br>`;\n                }\n              }\n            } else if (component.type === 'BUTTONS' && Array.isArray(component.buttons)) {\n              // Buttons grouped and numbered per type\n              const urlButtons = component.buttons.filter(btn => btn.type === 'URL');\n              const quickReplyButtons = component.buttons.filter(btn => btn.type === 'QUICK_REPLY');\n              const phoneButtons = component.buttons.filter(btn => btn.type === 'PHONE_NUMBER');\n\n              if (urlButtons.length) {\n                messageContent += `<div><b>Custom Button:</b></div>`;\n                urlButtons.forEach((btn, idx) => {\n                  messageContent += `<div>${idx + 1}. Title: ${btn.text}, Value: ${btn.url}</div>`;\n                });\n              }\n              if (quickReplyButtons.length) {\n                messageContent += `<div><b>Quick Reply Button:</b></div>`;\n                quickReplyButtons.forEach((btn, idx) => {\n                  if (btn.payload) {\n                    messageContent += `<div>${idx + 1}. Title: ${btn.text}, Value: ${btn.payload}</div>`;\n                  } else {\n                    messageContent += `<div>${idx + 1}. Title: ${btn.text}</div>`;\n                  }\n                });\n              }\n              if (phoneButtons.length) {\n                messageContent += `<div><b>Phone Button:</b></div>`;\n                phoneButtons.forEach((btn, idx) => {\n                  messageContent += `<div>${idx + 1}. Title: ${btn.text}, Value: ${btn.phone_number}</div>`;\n                });\n              }\n            }\n          });\n\n          // Return the message content as a single HTML-formatted string\n          return { message: messageContent };\n        }\n      }\n\n      // Check if there are more pages\n      url = response.data.paging?.next || null;\n    }\n    return { message: 'Template not found.' };\n  } catch (error) {\n    return { message: error.message };\n  }\n}\n\n// Usage:\nconst result = await getTemplateById({\n  wba_id: context?.inputData?.wba_id,\n  template_id: context?.inputData?.message_template_id\n});\nreturn result;"
    visibilityCondition: context?.inputData?.message_template_id
  - key: eligibility_checks
    type: help
    source: "const channelId = context.inputData.channelId;\n\n\nasync function checkYouTubeUploadEligibility(channelId = 'mine') {\n    try {\n        // if (!accessToken) {\n        //     return {\n        //         isEligibleForLongVideos: false,\n        //         canUpload: false,\n        //         warningMessage: 'Missing OAuth 2.0 access token. Cannot check YouTube channel eligibility.',\n        //         originalError: null\n        //     };\n        // }\n\n        // Use the channels.list endpoint to get channel status\n        // 'mine=true' retrieves the authenticated user's channel.\n        // 'part=status' is sufficient for longUploadsStatus.\n        const response = await axios.get(\n            `https://www.googleapis.com/youtube/v3/channels?part=status&mine=true`\n        );\n\n        if (response.status !== 200 || !response.data || response.data.items.length === 0) {\n            return {\n                isEligibleForLongVideos: false,\n                canUpload: false,\n                warningMessage: 'Could not retrieve YouTube channel information. Ensure the authenticated user has a YouTube channel.',\n                originalError: response.data\n            };\n        }\n\n        const channelStatus = response.data.items[0].status;\n        const longUploadsStatus = channelStatus.longUploadsStatus;\n\n        let isEligibleForLongVideos = false;\n        let canUpload = true; // Assume true unless specific checks fail\n        let warningMessage = null;\n\n        if (longUploadsStatus === 'allowed') {\n            isEligibleForLongVideos = true;\n        } else if (longUploadsStatus === 'eligible') {\n            isEligibleForLongVideos = false; // Not yet allowed, needs phone verification\n            warningMessage = 'Your YouTube channel is eligible for longer videos (>15 mins) but requires phone verification. Please verify your account in YouTube Studio to enable this feature.';\n            canUpload = false; // Prevent large file upload if this is a strict requirement\n        } else if (longUploadsStatus === 'disallowed') {\n            isEligibleForLongVideos = false;\n            warningMessage = 'Your YouTube channel is currently disallowed from uploading videos longer than 15 minutes due to policy violations or other restrictions. Please check your YouTube Studio settings.';\n            canUpload = false;\n        } else { // 'yetUnspecified' or any other unexpected value\n            isEligibleForLongVideos = false;\n            warningMessage = `Cannot determine channel's long video upload status (status: ${longUploadsStatus}). It might not be enabled or require further action.`;\n            canUpload = false;\n        }\n\n        // Additional check: daily upload limits are not directly exposed,\n        // but if the channel is not in good standing, general uploads might be affected.\n        // This is less common for *duration* but good to be aware of.\n        const uploadStatus = channelStatus.uploadStatus;\n        if (uploadStatus === 'disallowed') {\n             canUpload = false;\n             warningMessage = warningMessage ? warningMessage + ' Also, general video uploads appear to be disallowed for this channel.' : 'General video uploads appear to be disallowed for this channel.';\n        }\n\n\n        // GSuite administrator access / API access:\n        // If the API call above fails with a 403, it's often a permission issue.\n        // We'll catch it in the outer try/catch.\n\n        return { isEligibleForLongVideos, canUpload, warningMessage, originalError: null };\n\n    } catch (error) {\n        let errorMessage = 'An error occurred while checking YouTube channel eligibility.';\n        let canUpload = false;\n        let originalError = error;\n\n        if (error.response) {\n            // Google API error response structure\n            const status = error.response.status;\n            const errorData = error.response.data;\n\n            if (status === 401 || status === 403) {\n                // 401 Unauthorized: Access token invalid or expired.\n                // 403 Forbidden: Permissions issue, could be GSuite admin restrictions,\n                // insufficient scopes, or the account doesn't have a YouTube channel.\n                errorMessage = `Permission denied to access YouTube channel. Status: ${status}. This could be due to:\n                1. Invalid/expired access token.\n                2. Insufficient scopes (ensure 'https://www.googleapis.com/auth/youtube.upload' and 'https://www.googleapis.com/auth/youtube.readonly' are granted).\n                3. The GSuite administrator has restricted YouTube access or API access for this user.\n                4. The user does not have a YouTube channel created yet.`;\n                canUpload = false; // Definitely cannot proceed with upload\n            } else if (status === 429) {\n                // 429 Too Many Requests: API quota limit reached.\n                errorMessage = 'API Quota Exceeded for your Google Cloud Project. You have exhausted the daily limit for YouTube API calls. Please try again after 24 hours (midnight Pacific Time).';\n                canUpload = false;\n            } else {\n                errorMessage += ` API Error: ${status} - ${errorData.error?.message || JSON.stringify(errorData)}`;\n            }\n        } else if (error.request) {\n            // Network error\n            errorMessage = `No response received from YouTube API. Network issue or API endpoint unavailable: ${error.message}`;\n        } else {\n            // Other errors\n            errorMessage = `Unexpected error during YouTube API call: ${error.message}`;\n        }\n\n        console.error('YouTube Eligibility Check Error:', errorMessage, error);\n\n        return {\n            isEligibleForLongVideos: false,\n            canUpload: false,\n            warningMessage: errorMessage,\n            originalError: originalError\n        };\n    }\n}\n\ntry {\n    const eligibility = await checkYouTubeUploadEligibility();\n\n    if (!eligibility.canUpload) {\n\n        return {\n            message: eligibility.warningMessage\n        \n        };\n    }else{\n\n       return {\n            message: 'Your YouTube channel is eligible to upload YouTube videos'\n        \n        };\n    }\n} catch (error) {\n  return {\n            message: 'Please test the flow to check the YouTube video upload eligibility '\n        \n        };\n}"
```

## Input Group Dynamic

**Input Group Dynamic Purpose:**
The Input Group Dynamic field is designed to dynamically render an entire group of fields based on the user's prior selections or external data schemas. Instead of hardcoding every possible parameter, you can execute JavaScript at runtime to fetch a schema (like a Notion database structure or Google Sheet columns) and dynamically return an array of new fields appropriately patterned on that data (creating text strings, multiselects, dropdowns, etc., customized to the user's setup).

### Input Group Dynamic Input Field Generation Rules:
- When creating a dynamic input group field, ensure you correctly construct the field structure following the JSON/TOON schemas format.
- Set `type: "input groups"` and define the essential top-level fields such as `key`, `label`, `help`, and `required`.
- **Nesting Support**: Input group fields can be nested (created inside a static input group or a dynamic input group).
- Write the `fieldsGenerator` JavaScript code to formulate the child fields.
- **Rules for `fieldsGenerator`:**
  - **Standard Return:** You **MUST** return an array of fully valid, complete field objects (e.g., `return [{ key: 'f1', type: 'string', label: 'F1', required: true }]`). The generated fields can be `string`, `number`, `boolean`, `dropdown`, `multiselect`, `aifield`, `help`, `html`, `markdown`, or even nested input groups. It supports both static and dynamic fields.
  - **Key naming (Static vs. Dynamic):** For static input fields (defined directly in the JSON), the `key` must never contain a dot (`.`). For dynamic fields generated within dynamic input groups via `fieldsGenerator`, they CAN contain a dot (`.`), and dot-to-underscore normalization is not required.
  - **Error/Empty Return:** If dependencies are missing or no fields can be generated, return an object containing a message (e.g., `return { message: 'Please select a data source first.' };`). This functions as a warning box in the UI.
  - **Context Access:** Utilize `context?.inputData?.['other_field_key']` to pass previous user inputs directly into the generator.
- **Reference the schema and examples:** Carefully check the **Input Group Dynamic JSON/TOON Schema** and look at the **Input Group Dynamic Examples** to see how the code queries APIs and maps the results into complex field definitions based on properties or types.

### Input Group Dynamic JSON Schema:
```json
{
    "name": "generate_dynamic_input_group_field",
    "strict": false,
    "schema": {
        "type": "object",
        "properties": {
            "inputFields": {
                "type": "array",
                "description": "The array of input fields including the newly created or updated dynamic input group field.",
                "items": {
                    "type": "object",
                    "properties": {
                        "key": {
                            "type": "string",
                            "pattern": "^[^.\\[\\]]*$",
                            "description": "Unique identifier for the group (e.g. 'dynamic_field', 'column_name'). The key must not contain a dot (.) or square brackets ([])."
                        },
                        "type": {
                            "type": "string",
                            "enum": [
                                "input groups"
                            ],
                            "description": "Must be exactly 'input groups'."
                        },
                        "label": {
                            "type": "string",
                            "description": "A human-readable label explaining the entire group (e.g. 'Data Source Field')."
                        },
                        "help": {
                            "type": "string",
                            "description": "Optional guidance text for the user regarding this entire group. Omit this field entirely if not applicable. When specified, the value must start with 'Enter', and supports string format and markdown links."
                        },
                        "required": {
                            "type": "boolean",
                            "description": "Whether interacting with this input group is mandatory. It is an optional key; if not present, it is treated as optional."
                        },
                        "fieldsGenerator": {
                            "type": "string",
                            "description": "JavaScript code that dynamically generates the nested fields. MANDATORY RULES:\n1. Standard Return: MUST return an array of complete, valid field objects (e.g., `return [{ key: 'f1', type: 'string', label: 'F1', ...}]`). The generated fields can be string, number, boolean, dropdown, multiselect, aifield, help, html, markdown, or nested input groups. It supports both static and dynamic fields.\n2. Key naming: Generated field keys can contain a full stop (.). Dot-to-underscore normalization is not required.\n3. Error/Empty Return: If dependencies are missing or no fields can be generated, return an object with a message (e.g., `return { message: 'Please select a data source first.' };`). This will render as a warning box in the UI.\n4. Context Access: You can use `context?.inputData?.['other_field_key']` to build logic dependent on previous user inputs."
                        },
                        "visibilityCondition": {
                            "type": "string",
                            "description": "A JavaScript condition for visibility of the entire dynamic group. Omit if always visible."
                        }
                    },
                    "required": [
                        "key",
                        "type",
                        "label",
                        "fieldsGenerator"
                    ]
                }
            }
        },
        "required": [
            "inputFields"
        ]
    }
}
```
### Input Group Dynamic TOON Schema:
```toon
name: generate_dynamic_input_group_field
strict: false
schema:
  type: object
  properties:
    inputFields:
      type: array
      description: The array of input fields including the newly created or updated dynamic input group field.
      items:
        type: object
        properties:
          key:
            type: string
            pattern: "^[^.\[\]]*$"
            description: "Unique identifier for the group (e.g. 'dynamic_field', 'column_name'). The key must not contain a dot (.) or square brackets ([])."
          type:
            type: string
            enum[1]: input groups
            description: Must be exactly 'input groups'.
          label:
            type: string
            description: A human-readable label explaining the entire group (e.g. 'Data Source Field').
          help:
            type: string
            description: Optional guidance text for the user regarding this entire group. Omit this field entirely if not applicable.
          required:
            type: boolean
            description: Whether interacting with this input group is mandatory. It is an optional key; if not present, it is treated as optional.
          fieldsGenerator:
            type: string
            description: "JavaScript code that dynamically generates the nested fields. MANDATORY RULES:\n1. Standard Return: MUST return an array of complete, valid field objects (e.g., `return [{ key: 'f1', type: 'string', label: 'F1', ...}]`). The generated fields can be string, number, boolean, dropdown, multiselect, aifield, help, html, markdown, or nested input groups. It supports both static and dynamic fields.\n2. Key naming: Generated field keys can contain a full stop (.). Dot-to-underscore normalization is not required.\n3. Error/Empty Return: If dependencies are missing or no fields can be generated, return an object with a message (e.g., `return { message: 'Please select a data source first.' };`). This will render as a warning box in the UI.\n4. Context Access: You can use `context?.inputData?.['other_field_key']` to build logic dependent on previous user inputs."
          visibilityCondition:
            type: string
            description: A JavaScript condition for visibility of the entire dynamic group. Omit if always visible.
        required[4]: key,type,label,fieldsGenerator
  required[1]: inputFields
```

### Input Group Dynamic Examples:
#### Input Group Dynamic JSON Example:
```json
[
  {
    "key": "dynamic_field",
    "help": "Enter details on the notion fields.",
    "type": "input groups",
    "label": "Data Source Field",
    "required": true,
    "fieldsGenerator": "try {\n    const columnsApiUrl = `https://api.notion.com/v1/data_sources/${context?.inputData?.data_source_id}`;\n    const response = await axios.get(columnsApiUrl, {  \n        headers: { \"Notion-Version\": \"2025-09-03\" }\n    });\n\n    // Get the selected fields from input\n    const selectedFields = context?.inputData?.choose_fields || [];\n\n    const returnDropdown = (array) => {\n        return array.slice(0, 10).map((key) => ({\n            label: key?.name,\n            value: key?.name\n        }));\n    };\n\n    const returnPersonDropdown = (array) => {\n        return array.map((key) => ({\n            label: key?.name, \n            sample: key?.id,\n            value: key?.id\n        }));\n    };\n\n    async function getPersonsOnly() {\n        const url = \"https://api.notion.com/v1/users?page_size=50\";\n        const response = await fetch(url, {\n            method: \"GET\",\n            headers: { \"Notion-Version\": \"2025-09-03\" }\n        });\n\n        if (!response.ok) {\n            throw new Error(`Error fetching users: ${response.status} ${response.statusText}`);\n        }\n\n        const data = await response.json();\n        const persons = data.results.filter(user => user.type === \"person\");\n        return returnPersonDropdown(persons);\n    }\n\n    const usersList = await getPersonsOnly();\n\n    const returnUpdateData = (array) => {\n        return array\n            .filter((key) => \n                !['rollup','created_by', 'created_time', 'last_edited_by', 'last_edited_time','files','unique_id','formula','button','place','verification'].includes(key.type) \n                && (selectedFields.length === 0 || selectedFields.includes(key.name)) // Filter by selected fields\n            )\n            .map((key) => {\n                let helpText = \"\";\n                let placeholderHint = `Enter ${key.name}`;\n                \n                if (key.type === 'relation') {\n                    helpText = \"Provide page ID(s) and separate by comma for multiple IDs.\";\n                    placeholderHint = \"Eg. 13fe3a00-095c-8028-a32f-c122e54f492d , 13fe3a00-095c-80c5-b026-eb65d1a741b1\";\n                } else if (key.type === 'select') {\n                    helpText = \"Select one option from the dropdown or map custom input\";\n                    placeholderHint = `Select ${key.name}`;\n                } else if (key.type === 'multi_select') {\n                    helpText = \"Enter multiple options by separating them with array.\";\n                    placeholderHint = `Choose ${key.name}`;\n                } else if (key.type === 'date') {\n                    helpText = `Enter ${key.name} in ISO date format, e.g., '2025-01-14' or '2025-01-14T11:15:47+05:30'. For passing start date and end date, pass two dates by comma separated. Eg. '2025-01-14T11:15:47+05:30 , 2025-01-16T12:00:00+05:30'`;\n                    placeholderHint = \"Eg. 2025-01-14T11:15:47+05:30\"; \n                } else if (key.type === 'people') {\n                    helpText = `Choose ${key.name}`;\n                    placeholderHint = `Choose ${key.name}`;\n                } else if (key.type === 'number') {\n                    helpText = \"Enter a valid number.\";\n                    placeholderHint = \"Enter number\";\n                } else if (key.type === 'checkbox') {\n                    helpText = \"Select true or false.\";\n                } else if (key.type === 'email') {\n                    helpText = `Enter a valid email address for ${key.name}.`;\n                    placeholderHint = \"Eg. email@domain.com\";\n                } else if (key.type === 'phone_number') {\n                    helpText = `Enter a valid phone number for ${key.name}.`;\n                    placeholderHint = \"Eg. +919535420XXX\"; \n                } else if (key.type === 'url') {\n                    helpText = `Enter a valid URL for ${key.name}.`;\n                    placeholderHint = \"Eg. https://example.com\";\n                } else if (key.type === 'status') {\n                    helpText = `Select a ${key.name} from the dropdown options.`;\n                    placeholderHint = `Choose ${key.name}`;\n                } else {\n                    helpText = `Enter ${key.name} in text format.`;\n                }\n\n            if (key.type === 'select') {\n    const dynamicKey = key.name + \":@:\" + key.type;\n\n    return {\n        key: dynamicKey,\n        label: key.name,\n        type: 'dropdown',\n        required: false,\n        help: helpText,\n        customPlaceholder: \" \",\n        placeholder: placeholderHint,\n        canPaginate: true,\n        optionsGenerator: `\n            // Dynamic offset key\n            const offsetKey = \"dynamic_field.${dynamicKey}\";\n            const offset = Number(context?.paginateData?.[offsetKey] || 0);\n            const LIMIT = 20;\n\n            // Pagination helper\n            const paginate = (arr, offset = 0, limit = 20) => {\n                const slice = arr.slice(offset, offset + limit);\n                const nextOffset = offset + limit < arr.length ? offset + limit : null;\n                return { data: slice, offset: nextOffset };\n            };\n\n            try {\n                const url = \\`https://api.notion.com/v1/data_sources/\\${context?.inputData?.data_source_id}\\`;\n                const response = await axios.get(url, {\n                    headers: { \"Notion-Version\": \"2025-09-03\" }\n                });\n\n                // Force selected field = current field\n                const selectedFields = [\"${key.name}\"];\n                const selectedFieldName = selectedFields[0];\n\n                const properties = response.data.properties;\n                const fieldsArray = Object.values(properties);\n                const field = fieldsArray.find(f => f.name === selectedFieldName);\n\n                if (!field) throw new Error(\"Field not found in Notion properties.\");\n\n                // Fetch options\n                let options = [];\n                if (field.type === \"select\") options = field.select.options;\n                if (field.type === \"multi_select\") options = field.multi_select.options;\n                if (field.type === \"status\") options = field.status.options;\n\n                if (!options.length) {\n                    return { data: [], offset: null };\n                }\n\n                const mapped = options.map(opt => ({\n                    label: opt.name,\n                    value: opt.name\n                }));\n\n                return paginate(mapped, offset, LIMIT);\n\n            } catch (err) {\n                throw err?.response?.data || err;\n            }\n        `\n    };\n}\n                else if (key.type === 'number') {\n                    return {\n                        key: key.name + \":@:\" + key.type,\n                        label: key.name,\n                        type: 'number',\n                        required: false,\n                        help: helpText,\n                        placeholder: placeholderHint\n                    };\n                } else if (key.type === 'multi_select') {\n                    return {\n                        key: key.name + \":@:\" + key.type,\n                        label: key.name,\n                        type: 'multiselect',\n                        required: false,\n                        help: helpText,\n                        customPlaceholder: \"Eg. [\\\"Tag 1\\\",\\\"Tag 2\\\"]\",\n                        placeholder: placeholderHint,\n                        options: returnDropdown(key?.multi_select?.options)\n                    };\n                } else if (key.type === 'people') {\n                    return {\n                        key: key.name + \":@:\" + key.type,\n                        label: key.name,\n                        type: 'multiselect',\n                        required: false,\n                        help: helpText,\n                        customPlaceholder: \"Eg. [\\\"29109834-e6a6-4847-b627-368817cf83fa\\\",\\\"1edd872b-594c-8165-89a5-000280c9e8d0\\\"]\",\n                        customInputLabel: \"Enter the people ID as an array\",\n                        placeholder: placeholderHint,\n                        options: usersList\n                    };\n                } else if (key.type === 'status') {\n                    return {\n                        key: key.name + \":@:\" + key.type,\n                        label: key.name,\n                        type: 'dropdown',\n                        required: false,\n                        help: helpText,\n                        customPlaceholder: `Enter ${key.name}`,\n                        placeholder: placeholderHint,\n                        children: returnDropdown(key?.status?.options)\n                    };\n                } else if (key.type === 'checkbox') {\n                    return {\n                        key: key.name + \":@:\" + key.type,\n                        label: key.name,\n                        type: 'boolean',\n                        required: false,\n                        help: helpText,\n                        options: [\n                            { label: 'True', value: true },\n                            { label: 'False', value: false }\n                        ]\n                    };\n                } else {\n                    return {\n                        key: key.name + \":@:\" + key.type,\n                        label: key.name,\n                        type: 'string',\n                        required: false,\n                        help: helpText,\n                        placeholder: placeholderHint\n                    };\n                }\n            });\n    };\n\n    const arr = response.data.properties;\n    const first = Object.values(arr);\n    return returnUpdateData(first);\n\n} catch (error) {\n  const apiError = error?.response?.data || error;\n  throw apiError;\n}"
  },
    {
    "key": "column_name",
    "help": "Enter the Column Values.",
    "type": "input groups",
    "label": "Column Values",
    "required": true,
    "fieldsGenerator": "const spreadsheet_Id = context?.inputData?.spreadsheet_Id;\nconst sheetIdentifier = context?.inputData?.grid_Id;\nconst column_key = context?.inputData?.column_key ?? true;\nconst selectedColumns = context.inputData.column_selected || [];\n \nif (selectedColumns.length === 0) {\n  return { message: \"Please reselect columns. No columns were selected.\" };\n}\n\nfunction getColumnLetter(index) {\n  let letter = '';\n  let temp = index;\n  while (temp >= 0) {\n    letter = String.fromCharCode(65 + (temp % 26)) + letter;\n    temp = Math.floor(temp / 26) - 1;\n  }\n  return letter || 'A';\n}\n\nlet inputFields = [];\n\nif (!column_key) {\n  // ==================== LETTER MODE (column_key = false) ====================\n  inputFields = selectedColumns.map(selected => {\n    const columnLetter = selected.trim().toUpperCase();\n    if (!/^[A-Z]+$/.test(columnLetter)) return null;\n    return {\n      key: columnLetter,\n      label: `Column ${columnLetter}`,\n      type: 'string',\n      required: true,\n      help: `Enter value for Column ${columnLetter}`,\n      placeholder: `Map data or enter value`\n    };\n  });\n} else {\n  // ==================== NAME MODE (column_key = true) ====================\n  const allColumns = await fetchSheetColumns(spreadsheet_Id, sheetIdentifier, true);\n\n  // Count name occurrences for duplicate detection\n  const nameCount = {};\n  allColumns.forEach(col => {\n    nameCount[col.label] = (nameCount[col.label] || 0) + 1;\n  });\n\n  inputFields = selectedColumns.map(selectedValue => {\n    // Find the matching column object\n    const matchedCol = allColumns.find(col => col.value === selectedValue);\n    if (!matchedCol) return null;\n\n    const originalLabel = matchedCol.label;\n    const isDuplicate = nameCount[originalLabel] > 1;\n\n    // === Correct way to get column letter ===\n    let columnLetter = 'A';\n    let columnIndex = -1;\n\n    if (selectedValue.includes('--')) {\n      // Case: duplicate column → value = \"Status--D\"\n      const parts = selectedValue.split('--');\n      columnLetter = parts[1].trim().toUpperCase();\n    } else {\n      // Case: unique column → value = \"Name\"\n      // Find its actual position in the sheet\n      columnIndex = allColumns.findIndex(col => col.value === selectedValue);\n      columnLetter = getColumnLetter(columnIndex);\n    }\n\n    let key, label;\n\n    if (isDuplicate) {\n      key = `${originalLabel}--${columnLetter}`;\n      label = `${originalLabel} (Column ${columnLetter})`;\n    } else {\n      key = originalLabel;\n      label = originalLabel;\n    }\n\n    return {\n      key,\n      label,\n      type: 'string',\n      required: true,\n      help: `Enter value for ${originalLabel}`,\n      placeholder: `Map data or enter value`\n    };\n  });\n}\n\ninputFields = inputFields.filter(Boolean);\n\nif (inputFields.length === 0) {\n  return { message: \"No valid columns selected. Please reselect columns.\" };\n}\n\nreturn inputFields;"
  },
  {
    "key": "dynamic_agent_variables",
    "help": "Fill in the required variables for the selected AI Agent",
    "type": "input groups",
    "label": "Agent Variables",
    "required": true,
    "fieldsGenerator": "async function generateAgentVariables() {\n    const agentId = context?.inputData?.agent;\n    try {\n        const response = await axios.get('https://db.gtwy.ai/api/embed/getAgents');\n        const agents = response?.data.data || [];\n        const selectedAgent = agents.find(agent => agent?._id === agentId);\n\n        if (!selectedAgent) {\n            return {message:`No Variables were found for the Selected AI Agent.`}\n        }\n        const variables = selectedAgent?.variables_state || {};\n        if (Object.keys(variables).length==0) {\n            return {message:`No Variables were found for the Selected AI Agent.`}\n        }\n        const fields = Object.entries(variables).map(([key, value]) => ({\n            key: key,\n            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),\n            type: 'string',\n            required: value === 'required',\n            placeholder: `Enter ${key.replace(/_/g, ' ')}`\n        }));\n\n        return fields;\n    } catch (error) {\n        throw error\n    }\n}\n\nreturn await generateAgentVariables();",
    "visibilityCondition": "context?.inputData?.agent_extraValue === 'variables' || context?.inputData?.agent_extraValue === 'variables_vision'"
  }
]
```
#### Input Group Dynamic TOON Example:
```toon
[3]:
  - key: dynamic_field
    help: Enter details on the notion fields.
    type: input groups
    label: Data Source Field
    required: true
    fieldsGenerator: "try {\n    const columnsApiUrl = `https://api.notion.com/v1/data_sources/${context?.inputData?.data_source_id}`;\n    const response = await axios.get(columnsApiUrl, {  \n        headers: { \"Notion-Version\": \"2025-09-03\" }\n    });\n\n    // Get the selected fields from input\n    const selectedFields = context?.inputData?.choose_fields || [];\n\n    const returnDropdown = (array) => {\n        return array.slice(0, 10).map((key) => ({\n            label: key?.name,\n            value: key?.name\n        }));\n    };\n\n    const returnPersonDropdown = (array) => {\n        return array.map((key) => ({\n            label: key?.name, \n            sample: key?.id,\n            value: key?.id\n        }));\n    };\n\n    async function getPersonsOnly() {\n        const url = \"https://api.notion.com/v1/users?page_size=50\";\n        const response = await fetch(url, {\n            method: \"GET\",\n            headers: { \"Notion-Version\": \"2025-09-03\" }\n        });\n\n        if (!response.ok) {\n            throw new Error(`Error fetching users: ${response.status} ${response.statusText}`);\n        }\n\n        const data = await response.json();\n        const persons = data.results.filter(user => user.type === \"person\");\n        return returnPersonDropdown(persons);\n    }\n\n    const usersList = await getPersonsOnly();\n\n    const returnUpdateData = (array) => {\n        return array\n            .filter((key) => \n                !['rollup','created_by', 'created_time', 'last_edited_by', 'last_edited_time','files','unique_id','formula','button','place','verification'].includes(key.type) \n                && (selectedFields.length === 0 || selectedFields.includes(key.name)) // Filter by selected fields\n            )\n            .map((key) => {\n                let helpText = \"\";\n                let placeholderHint = `Enter ${key.name}`;\n                \n                if (key.type === 'relation') {\n                    helpText = \"Provide page ID(s) and separate by comma for multiple IDs.\";\n                    placeholderHint = \"Eg. 13fe3a00-095c-8028-a32f-c122e54f492d , 13fe3a00-095c-80c5-b026-eb65d1a741b1\";\n                } else if (key.type === 'select') {\n                    helpText = \"Select one option from the dropdown or map custom input\";\n                    placeholderHint = `Select ${key.name}`;\n                } else if (key.type === 'multi_select') {\n                    helpText = \"Enter multiple options by separating them with array.\";\n                    placeholderHint = `Choose ${key.name}`;\n                } else if (key.type === 'date') {\n                    helpText = `Enter ${key.name} in ISO date format, e.g., '2025-01-14' or '2025-01-14T11:15:47+05:30'. For passing start date and end date, pass two dates by comma separated. Eg. '2025-01-14T11:15:47+05:30 , 2025-01-16T12:00:00+05:30'`;\n                    placeholderHint = \"Eg. 2025-01-14T11:15:47+05:30\"; \n                } else if (key.type === 'people') {\n                    helpText = `Choose ${key.name}`;\n                    placeholderHint = `Choose ${key.name}`;\n                } else if (key.type === 'number') {\n                    helpText = \"Enter a valid number.\";\n                    placeholderHint = \"Enter number\";\n                } else if (key.type === 'checkbox') {\n                    helpText = \"Select true or false.\";\n                } else if (key.type === 'email') {\n                    helpText = `Enter a valid email address for ${key.name}.`;\n                    placeholderHint = \"Eg. email@domain.com\";\n                } else if (key.type === 'phone_number') {\n                    helpText = `Enter a valid phone number for ${key.name}.`;\n                    placeholderHint = \"Eg. +919535420XXX\"; \n                } else if (key.type === 'url') {\n                    helpText = `Enter a valid URL for ${key.name}.`;\n                    placeholderHint = \"Eg. https://example.com\";\n                } else if (key.type === 'status') {\n                    helpText = `Select a ${key.name} from the dropdown options.`;\n                    placeholderHint = `Choose ${key.name}`;\n                } else {\n                    helpText = `Enter ${key.name} in text format.`;\n                }\n\n            if (key.type === 'select') {\n    const dynamicKey = key.name + \":@:\" + key.type;\n\n    return {\n        key: dynamicKey,\n        label: key.name,\n        type: 'dropdown',\n        required: false,\n        help: helpText,\n        customPlaceholder: \" \",\n        placeholder: placeholderHint,\n        canPaginate: true,\n        optionsGenerator: `\n            // Dynamic offset key\n            const offsetKey = \"dynamic_field.${dynamicKey}\";\n            const offset = Number(context?.paginateData?.[offsetKey] || 0);\n            const LIMIT = 20;\n\n            // Pagination helper\n            const paginate = (arr, offset = 0, limit = 20) => {\n                const slice = arr.slice(offset, offset + limit);\n                const nextOffset = offset + limit < arr.length ? offset + limit : null;\n                return { data: slice, offset: nextOffset };\n            };\n\n            try {\n                const url = \\`https://api.notion.com/v1/data_sources/\\${context?.inputData?.data_source_id}\\`;\n                const response = await axios.get(url, {\n                    headers: { \"Notion-Version\": \"2025-09-03\" }\n                });\n\n                // Force selected field = current field\n                const selectedFields = [\"${key.name}\"];\n                const selectedFieldName = selectedFields[0];\n\n                const properties = response.data.properties;\n                const fieldsArray = Object.values(properties);\n                const field = fieldsArray.find(f => f.name === selectedFieldName);\n\n                if (!field) throw new Error(\"Field not found in Notion properties.\");\n\n                // Fetch options\n                let options = [];\n                if (field.type === \"select\") options = field.select.options;\n                if (field.type === \"multi_select\") options = field.multi_select.options;\n                if (field.type === \"status\") options = field.status.options;\n\n                if (!options.length) {\n                    return { data: [], offset: null };\n                }\n\n                const mapped = options.map(opt => ({\n                    label: opt.name,\n                    value: opt.name\n                }));\n\n                return paginate(mapped, offset, LIMIT);\n\n            } catch (err) {\n                throw err?.response?.data || err;\n            }\n        `\n    };\n}\n                else if (key.type === 'number') {\n                    return {\n                        key: key.name + \":@:\" + key.type,\n                        label: key.name,\n                        type: 'number',\n                        required: false,\n                        help: helpText,\n                        placeholder: placeholderHint\n                    };\n                } else if (key.type === 'multi_select') {\n                    return {\n                        key: key.name + \":@:\" + key.type,\n                        label: key.name,\n                        type: 'multiselect',\n                        required: false,\n                        help: helpText,\n                        customPlaceholder: \"Eg. [\\\"Tag 1\\\",\\\"Tag 2\\\"]\",\n                        placeholder: placeholderHint,\n                        options: returnDropdown(key?.multi_select?.options)\n                    };\n                } else if (key.type === 'people') {\n                    return {\n                        key: key.name + \":@:\" + key.type,\n                        label: key.name,\n                        type: 'multiselect',\n                        required: false,\n                        help: helpText,\n                        customPlaceholder: \"Eg. [\\\"29109834-e6a6-4847-b627-368817cf83fa\\\",\\\"1edd872b-594c-8165-89a5-000280c9e8d0\\\"]\",\n                        customInputLabel: \"Enter the people ID as an array\",\n                        placeholder: placeholderHint,\n                        options: usersList\n                    };\n                } else if (key.type === 'status') {\n                    return {\n                        key: key.name + \":@:\" + key.type,\n                        label: key.name,\n                        type: 'dropdown',\n                        required: false,\n                        help: helpText,\n                        customPlaceholder: `Enter ${key.name}`,\n                        placeholder: placeholderHint,\n                        children: returnDropdown(key?.status?.options)\n                    };\n                } else if (key.type === 'checkbox') {\n                    return {\n                        key: key.name + \":@:\" + key.type,\n                        label: key.name,\n                        type: 'boolean',\n                        required: false,\n                        help: helpText,\n                        options: [\n                            { label: 'True', value: true },\n                            { label: 'False', value: false }\n                        ]\n                    };\n                } else {\n                    return {\n                        key: key.name + \":@:\" + key.type,\n                        label: key.name,\n                        type: 'string',\n                        required: false,\n                        help: helpText,\n                        placeholder: placeholderHint\n                    };\n                }\n            });\n    };\n\n    const arr = response.data.properties;\n    const first = Object.values(arr);\n    return returnUpdateData(first);\n\n} catch (error) {\n  const apiError = error?.response?.data || error;\n  throw apiError;\n}"
  - key: column_name
    help: Enter the Column Values.
    type: input groups
    label: Column Values
    required: true
    fieldsGenerator: "const spreadsheet_Id = context?.inputData?.spreadsheet_Id;\nconst sheetIdentifier = context?.inputData?.grid_Id;\nconst column_key = context?.inputData?.column_key ?? true;\nconst selectedColumns = context.inputData.column_selected || [];\n \nif (selectedColumns.length === 0) {\n  return { message: \"Please reselect columns. No columns were selected.\" };\n}\n\nfunction getColumnLetter(index) {\n  let letter = '';\n  let temp = index;\n  while (temp >= 0) {\n    letter = String.fromCharCode(65 + (temp % 26)) + letter;\n    temp = Math.floor(temp / 26) - 1;\n  }\n  return letter || 'A';\n}\n\nlet inputFields = [];\n\nif (!column_key) {\n  // ==================== LETTER MODE (column_key = false) ====================\n  inputFields = selectedColumns.map(selected => {\n    const columnLetter = selected.trim().toUpperCase();\n    if (!/^[A-Z]+$/.test(columnLetter)) return null;\n    return {\n      key: columnLetter,\n      label: `Column ${columnLetter}`,\n      type: 'string',\n      required: true,\n      help: `Enter value for Column ${columnLetter}`,\n      placeholder: `Map data or enter value`\n    };\n  });\n} else {\n  // ==================== NAME MODE (column_key = true) ====================\n  const allColumns = await fetchSheetColumns(spreadsheet_Id, sheetIdentifier, true);\n\n  // Count name occurrences for duplicate detection\n  const nameCount = {};\n  allColumns.forEach(col => {\n    nameCount[col.label] = (nameCount[col.label] || 0) + 1;\n  });\n\n  inputFields = selectedColumns.map(selectedValue => {\n    // Find the matching column object\n    const matchedCol = allColumns.find(col => col.value === selectedValue);\n    if (!matchedCol) return null;\n\n    const originalLabel = matchedCol.label;\n    const isDuplicate = nameCount[originalLabel] > 1;\n\n    // === Correct way to get column letter ===\n    let columnLetter = 'A';\n    let columnIndex = -1;\n\n    if (selectedValue.includes('--')) {\n      // Case: duplicate column → value = \"Status--D\"\n      const parts = selectedValue.split('--');\n      columnLetter = parts[1].trim().toUpperCase();\n    } else {\n      // Case: unique column → value = \"Name\"\n      // Find its actual position in the sheet\n      columnIndex = allColumns.findIndex(col => col.value === selectedValue);\n      columnLetter = getColumnLetter(columnIndex);\n    }\n\n    let key, label;\n\n    if (isDuplicate) {\n      key = `${originalLabel}--${columnLetter}`;\n      label = `${originalLabel} (Column ${columnLetter})`;\n    } else {\n      key = originalLabel;\n      label = originalLabel;\n    }\n\n    return {\n      key,\n      label,\n      type: 'string',\n      required: true,\n      help: `Enter value for ${originalLabel}`,\n      placeholder: `Map data or enter value`\n    };\n  });\n}\n\ninputFields = inputFields.filter(Boolean);\n\nif (inputFields.length === 0) {\n  return { message: \"No valid columns selected. Please reselect columns.\" };\n}\n\nreturn inputFields;"
  - key: dynamic_agent_variables
    help: Fill in the required variables for the selected AI Agent
    type: input groups
    label: Agent Variables
    required: true
    fieldsGenerator: "async function generateAgentVariables() {\n    const agentId = context?.inputData?.agent;\n    try {\n        const response = await axios.get('https://db.gtwy.ai/api/embed/getAgents');\n        const agents = response?.data.data || [];\n        const selectedAgent = agents.find(agent => agent?._id === agentId);\n\n        if (!selectedAgent) {\n            return {message:`No Variables were found for the Selected AI Agent.`}\n        }\n        const variables = selectedAgent?.variables_state || {};\n        if (Object.keys(variables).length==0) {\n            return {message:`No Variables were found for the Selected AI Agent.`}\n        }\n        const fields = Object.entries(variables).map(([key, value]) => ({\n            key: key,\n            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),\n            type: 'string',\n            required: value === 'required',\n            placeholder: `Enter ${key.replace(/_/g, ' ')}`\n        }));\n\n        return fields;\n    } catch (error) {\n        throw error\n    }\n}\n\nreturn await generateAgentVariables();"
    visibilityCondition: context?.inputData?.agent_extraValue === 'variables' || context?.inputData?.agent_extraValue === 'variables_vision'
```

# Special Note:

## Special Note: Static Input Group: `whereClause` Feature (Special Layout)
The `whereClause` feature allows you to display an input group as a readable sentence instead of separate fields. It transforms input groups into sentence-based configurations, improving UX and making workflows feel more natural by reducing confusion in complex actions.

**Key Characteristics & Limitations:**
- **Availability:** Only available within **Static Input Groups**.
- **Recommended Fields:** When `whereClause` is enabled (`"whereClause": true`), it is recommended to use `dropdown` and `multiselect` fields for the best sentence UI. Other field types are allowed but may not render inline as a sentence.
- **Label Capitalization & Casing Exception:** While normal fields require `label` to be in **Title Case**, when `whereClause: true` is enabled, all labels inside the input group must use **sentence case**. Only the **first** field inside the input group should have its first letter capitalized (e.g., `"label": "When commented on"`). All subsequent/dependent fields' labels should be in sentence case, starting with a lowercase letter (e.g., `"label": "posted after date"`) unless the word naturally requires capitalization (such as proper nouns like `"label": "Media"`).
- **Example:**
```json
[
  {
    "key": "settings",
    "type": "input groups",
    "label": "",
    "whereClause": true,
    "fields": [
      {
        "key": "comment",
        "help": "Choose when to receive incoming comments.",
        "type": "dropdown",
        "label": "When commented on",
        "options": [
          {
            "label": "a specific media",
            "value": "a specific media"
          },
          {
            "label": "any media",
            "value": "any media"
          },
          {
            "label": "next media",
            "value": "next media"
          }
        ],
        "required": true,
        "placeholder": "Choose Option",
        "customInputLabel": "Enter when to receive incoming comments.",
        "customPlaceholder": "a specific media"
      },
      {
        "key": "mediaId",
        "help": "Choose media or enter media Id.",
        "type": "dropdown",
        "label": "Media",
        "required": true,
        "customHelp": "You can enter the media ID manually or can also find the media ID from the List Media action.",
        "canPaginate": true,
        "placeholder": "Choose Media",
        "customInputLabel": "Enter media ID.",
        "optionsGenerator": "try {\n  const limit = 100;\n  const after = context?.paginateData?.['settings.mediaId'];\n  return await fetchMedia(limit, after);\n} catch (e) {\n  await errorComponent(e);\n}",
        "customPlaceholder": "18062960995844908",
        "visibilityCondition": "context?.inputData?.settings?.comment === 'a specific media' "
      },
      {
        "key": "media_start_date",
        "help": "Choose the date after which the new comment recived should be received.",
        "type": "string",
        "label": "posted after date",
        "required": true,
        "placeholder": "2026-03-17T01:49:34+0000",
        "visibilityCondition": "context?.inputData?.settings?.comment === 'next media'"
      }
    ]
  }
]
```
- **Rendering Behavior:** Instead of stacking fields normally, fields are arranged inline to form a clean, sentence-like structure where values are selected directly within the sentence. Flow side (end users) will see this sentence structure without the Edit mode.

**Example Use Case (Instagram Trigger New Comment):**
Instead of showing stacked disconnected fields (*Select Media, Select Type*), you can construct a readable sentence using dropdowns:
*"When commented on `[dropdown: specific media]` Media `[dropdown: choose media]`"*
## Special Note: Dropdown & Multiselect:
When generating Dropdown and Multiselect input fields (both Static and Dynamic):
1. **The `sample` attribute**: The `sample` string must **always** be identical to the option's `value`. MANDATORY RULE: If the value is an ID, the `sample` MUST be included. If the `label` and `sample` are exactly the same, then NO `sample` is needed. Omit otherwise.
2. **The `extraValue` key**: In static and dynamic dropdown use cases, the `extraValue` key can be added to options to hold hidden metadata. This metadata supports every JSON data type (string, number, boolean, object, array, etc.). It is highly useful when a dropdown option uses an ID as the `value` and you want to pass extra information (like the resource type or category) to drive complex visibility conditions, dynamic `fieldsGenerator` logic, or to be consumed directly inside the perform code or trigger code blocks. In code blocks and visibility conditions, the hidden state is read via the path `context?.inputData?.{dropdown_key}_extraValue` (or nested within input groups as `context?.inputData?.{input_group_key}?.{dropdown_key}_extraValue`).
## Special Note: Visibility Condition Rules:

When writing a `visibilityCondition`, the condition must be a valid JavaScript expression that evaluates to a boolean value. This expression determines whether the field or input group should be displayed. **Any valid JavaScript condition is supported, including complex calculations, array methods (like `.includes()`), and dynamic key value checks.**

Here are the various patterns you should use based on what field type it depends on:

1. **Depending on a Multiselect Field:**
   - **A. Any option selected:** To check if *any* option is selected in a multiselect field:
     ```javascript
     Array.isArray(context?.inputData?.multiselect_static_required) && context.inputData.multiselect_static_required.length > 0
     ```
   - **B. Specific option selected:** To check if a *specific* option is selected:
     ```javascript
     context?.inputData?.multiselect_static_required?.includes('A')
     ```
     ```javascript
     context?.inputData?.multiselect_static_required?.some((option) => option === 'B')
     ```
2. **Depending on a String or Dropdown Field (Exact Match):**
   - **A. Check if a specific value is selected:**
     ```javascript
     context?.inputData?.message_type === 'text'
     ```
   - **B. Check against multiple possible values (using array `.includes()`):**
     ```javascript
     ['IMAGE','VIDEO','CAROUSEL'].includes(context?.inputData?.media_type)
     ```
   - **C. Check against multiple possible values (using logical OR `||`):**
     ```javascript
     context?.inputData?.settings?.comment === 'a specific media' || context?.inputData?.settings?.comment === 'next media'
     ```

3. **Depending on a Boolean Field:**
   - **A. Check if true:** 
     ```javascript
     context?.inputData?.search_filter?.search_filter_type
     ```
   - **B. Check if false (using negation `!`):**
     ```javascript
     !context?.inputData?.search_filter?.search_filter_type
     ```

4. **Depending on Field Presence (Is it filled?):**
   - Just map to the field's path to check if a value is present (truthy):
     ```javascript
     context?.inputData?.sheet_Id
     ```

5. **Depending on Fields inside an Input Group:**
   - When a field depends on another field that is nested inside an input group, include the input group's key in the path:
     ```javascript
     context?.inputData?.search_filter?.column_key
     ```
     *(Here `search_filter` is the `key` of the input group, and `column_key` is the `key` of the specific field inside it).*

6. **Depending on an `extraValue` (Dropdowns):**
   - The visibility condition and perform/trigger code blocks support the `extraValue` key of static and dynamic dropdowns (supporting any data type).
   - The path for the `extraValue` will be `context?.inputData?.{dropdown_key}_extraValue`.
     ```javascript
     context?.inputData?.agent_extraValue === 'variables'
     ```
   - If the dropdown is inside an input group, then the path of the `extraValue` will be `context?.inputData?.{input_group_key}?.{dropdown_key}_extraValue`.
     ```javascript
     context?.inputData?.input_group_static?.Dropdown_static_all_values_extraValue
     ```
     *(The dropdown can be inside nested input groups, and the `input_group_keys` are added in order).*

7. **Complex Conditions, Key Values, and Calculations:**
   - Any valid JavaScript expression is supported, including checking specific object keys or performing calculations:
     ```javascript
     (context?.inputData?.price * context?.inputData?.quantity) > 100
     ```
   - Checking object key values:
     ```javascript
     Object.keys(context?.inputData?.custom_metadata || {}).includes('special_key')
     ```
## Special Note: `list` and `limit` usage in the text and number field types:
- The `list` key is only applicable to 'string' and 'number' type fields.
- The `limit` key is only applicable if `list` is true.

**When to use `list:true`:**
- Set `list: true` if the user preconfigures multiple values as an array during setup.
- Example: In a trigger, if the user wants to receive new items that matches multiple statuses, then the user can preconfigure the statuses as an array. In that case, the `list:true` should be set.

**When to use `limit:number`:**
- When the user preconfigures multiple values as an array during setup and the user wants to limit the number of values to be processed. In that case, the `limit:number` should be set.
- Example: In a trigger, if the user wants to receive new items that matches multiple statuses and the user wants to limit the number of values to be processed to 5, then the `list:true` and `limit:5` should be set.

**When to use `list:false` (or neither `list:true` nor `limit:number`):**
- Set `list: false` if the value is single or needs to be dynamic later (comma-separated input allowed or multiple values allowed as an array).
  - Example : `[ "Option 1", "Option 2", "Option 3" ]` or `Option 1, Option 2, Option 3`
- When the user wants to process only a single value.
- When the data is dynamically passed in the field where can suggest user to input as the comma seperated values in the field or the data is passed as the array in the field.

## Special Note: Raw `inputFields` and auto generated keys in the final json input fields [`steps`,`blocks` and `dependsOn`]

When working with the final JSON structure for input fields, you may encounter three main keys: `steps`, `blocks`, and `inputFields`.

- **`steps`**: Contains an array of field keys. Fields at the top level are inside the `root` array. If fields are inside an input group, they are organized under dedicated input group keys.
- **`blocks`**: A flattened object of all fields where each field includes a `dependsOn` array containing its dependent field keys.
- **`inputFields`**: The raw JSON fields with properly nested JSON objects that represent the actual UI structure.

**Important Rule:** Do NOT generate the auto-generated keys `steps` and `blocks`. Your goal is **always** to generate and output the `inputFields` array format.

### Understanding `dependsOn` vs `visibilityCondition`

It is crucial to understand the difference between `dependsOn` and `visibilityCondition`:

- **`dependsOn` (Auto-Generated Dependency)**
  - This array is populated **automatically** by the system.
  - It identifies fields that are structurally required for a dynamic field to function.
  - It is added *only* if the path of a previous field is explicitly used inside the `"optionsGenerator"` (for Dropdowns and Multiselects), `"fieldsGenerator"` (for Input Groups), or `"suggestionGenerator"` (for AI Fields).
  - Example: To fetch a list of Subsheets, the user must first select a Spreadsheet. Since the Spreadsheet ID is mapped inside the Subsheet's `optionsGenerator`, the system automatically adds the Spreadsheet key to the Subsheet's `dependsOn` array. Without the parent value, the current field cannot execute its logic.
  - Static fields (which do not have generator code) will always have an empty `dependsOn` array.

- **`visibilityCondition` (Conditional Rendering)**
  - This is a special key used purely to control the visibility of fields (both static and dynamic) based on conditions met by previous inputs.
  - Using a field's path inside a `visibilityCondition` **does NOT** add it to the `dependsOn` array.
  - It provides the power to conditionally show or hide static fields, even though static fields have an empty `dependsOn` array.

### `dependsOn` vs `visibilityCondition` Examples:

#### Example 1: Generic Example (Static Fields & Input Groups)

This example shows how standard fields and nested input groups are structured. Notice that since there are no generator codes used, the `dependsOn` arrays are empty.

```json
{
  "steps": {
    "root": [
      "first_name",
      "address"
    ],
    "address": [
      "address.city"
    ]
  },
  "blocks": {
    "first_name": {
      "key": "first_name",
      "type": "string",
      "label": "First Name",
      "required": true,
      "dependsOn": []
    },
    "address": {
      "key": "address",
      "type": "input groups",
      "label": "Address",
      "required": false,
      "dependsOn": []
    },
    "address.city": {
      "key": "address.city",
      "type": "string",
      "label": "City",
      "required": false,
      "dependsOn": []
    }
  },
  "inputFields": [
    {
      "key": "first_name",
      "type": "string",
      "label": "First Name",
      "required": true
    },
    {
      "key": "address",
      "type": "input groups",
      "label": "Address",
      "fields": [
        {
          "key": "city",
          "type": "string",
          "label": "City",
          "required": false
        }
      ],
      "required": false
    }
  ]
}
```

#### Example 2: Dynamic Fields (`dependsOn` vs `visibilityCondition`)

The following example illustrates how `dependsOn` is populated for dynamic fields (`subsheet`) while remaining empty for fields that only use `visibilityCondition` (`cell_value`).

```json
{
  "steps": {
    "root": [
      "spreadsheet",
      "subsheet",
      "cell_value"
    ]
  },
  "blocks": {
    "spreadsheet": {
      "key": "spreadsheet",
      "type": "dropdown",
      "label": "Spreadsheet",
      "required": true,
      "dependsOn": []
    },
    "subsheet": {
      "key": "subsheet",
      "type": "dropdown",
      "label": "Subsheet",
      "required": true,
      "dependsOn": [
        "spreadsheet"
      ]
    },
    "cell_value": {
      "key": "cell_value",
      "type": "string",
      "label": "Cell Value",
      "required": false,
      "dependsOn": []
    }
  },
  "inputFields": [
    {
      "key": "spreadsheet",
      "type": "dropdown",
      "label": "Spreadsheet",
      "required": true,
      "optionsGenerator": "return await fetchSpreadsheets();"
    },
    {
      "key": "subsheet",
      "type": "dropdown",
      "label": "Subsheet",
      "required": true,
      "optionsGenerator": "const spreadsheetId = context?.inputData?.spreadsheet;\nreturn await fetchSubsheets(spreadsheetId);"
    },
    {
      "key": "cell_value",
      "type": "string",
      "label": "Cell Value",
      "required": false,
      "visibilityCondition": "context?.inputData?.subsheet"
    }
  ]
}
```
## Special Note: `required` key in the input fields
- `required` true = Field is required
- `required` false = Field is optional
- Default value: `required: false`
- If `required: true` and the field is empty, the workflow will not run, and the UI will show an error message with the field name.
- **Dependent Required Fields:** If an optional parent field is selected/provided, and it reveals a dependent child field that is required for that specific selection, the child field **MUST** be marked as `required: true`. Additionally, the **perform code** must explicitly evaluate and enforce this requirement, throwing an error if the parent is provided but the required child field is missing.
> [!NOTE]
> **Exception for Input fields with visibility condition:** The visibility condition is evaluated first. If `required` is true but the field's visibility is false, the UI ignores the field during evaluation and it is not required.

## Special Note: Default Values for Boolean Keys
- If the following boolean keys are missing or not provided in the input fields JSON configuration, they are considered to be `false` by default:
  - `whereClause`
  - `required`
  - `canPaginate`
  - `enableSearchApi`
  - `list`
- During review or code generation, do not flag these keys as missing or incomplete; they are treated as `false` when omitted.

## Special Note: Custom Mapping Behavior (Dropdown, Multiselect & Boolean)
For `dropdown`, `multiselect`, and `boolean` fields, the user experience involves two modes in the UI:
1. **Standard Mode (Dropdown/Toggle Selection)**:
   - The user sees the standard **Label**, **Help**, and **Placeholder** (optional: if omitted, the backend defaults to `"Choose {{field label}}"`; if provided, it overrides this default).
2. **Custom Mapping Mode**:
   - When the user switches to custom mapping, the field becomes a plain text `string` input field.
   - The UI then shows:
     - `customInputLabel` in place of the standard `label` (this is the label shown for custom mapping, e.g. `"Enter Spreadsheet ID"`, `"Enter Boolean Value"`).
     - `customHelp` in place of the standard `help` (explaining how to manually fetch the ID/value or detailing true/false outcomes).
     - `customPlaceholder` in place of the standard `placeholder` (acting as the placeholder for the string input, and must represent a concrete value sample e.g., `"true"`, `"false"`, or a specific ID).
3. **Mandatory Keys**:
   - `customInputLabel`, `customHelp`, and `customPlaceholder` are **mandatory** keys for all `boolean`, `dropdown`, and `multiselect` fields (both static and dynamic).


# DH Input Fields Knowledge Base

This document contains knowledge and best practices for creating and configuring input fields in viaSocket plug actions. his guide provides purpose, instructions, and input field structure in JSON & TOON format to better understand the LLM Model, and an example in JSON & TOON.

# Static Input Fields

The input fields, which are static, have fixed values. The depends on other feild will be through visibilityCondition in the static input fields.

## String | Date | Number | HTML | Markdown

### String | Date | Number | HTML | Markdown Purpose:
- A String is a basic input type used to capture plain text values such as names, titles, identifiers, or short descriptions. It is suitable when the input is textual and does not require numeric calculation or formatting.
- A Date input type is used to capture calendar-based values such as dates, times, or date-time combinations. It ensures the input follows a valid date or time format.
- A Number input type is used to capture numeric values such as amounts, prices, counts, quantities, or any value that may be used in calculations or comparisons.
- An HTML input type is used to capture rich text content that includes HTML tags. It is suitable when the input needs structured formatting and the HTML is required in the payload.
- A Markdown input type is used to capture formatted text using Markdown syntax. It is ideal for content that needs lightweight formatting such as headings, lists, links, or emphasis.

### String | Date | Number | HTML | Markdown Input Field Generation Rules:
Generate a JSON object strictly following the rules below.

#### 1. Key Rules
key must be unique.
key must not contain a dot (.).

#### 2. Type Selection
- If fieldPurpose contains date, time, DOB → type: "string"
- If it contains amount, price, count, quantity, number → type: "number"
- If the field supports HTML → type: "html"
- If the field supports Markdown → type: "markdown"
- Otherwise → type: "string"

#### 3. Label, Help, Placeholder
- label: Clean, human-readable version of fieldPurpose
- help: Clearly explain what the user should enter
- placeholder: Provide a realistic example relevant to the purpose

#### 4. Required Rule
- Set required: true if fieldPurpose implies mandatory input
 (e.g. name, email, amount, date)
- Otherwise set required: false

#### 5. Visibility Condition Rule
- Include visibilityCondition only if both parentKey and parentValue are provided
- Do not include this key otherwise

#### 6. List Rule
- Set list: true if the user preconfigures multiple values as an array during setup
- Set list: false if the value is single or needs to be dynamic later
 (comma-separated input allowed)

#### 7. Limit Rule
- Set limit to a number representing the maximum number of list entries allowed.
- Include limit only if list is true. Omit this key otherwise.

#### 8. Output Constraint
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
                "pattern": "^[^.]*$",
                "description": "The unique identifier for the field. MUST NOT contain a dot (.)."
            },
            "type": {
                "type": "string",
                "enum": ["string", "number", "html", "markdown"],
                "description": "The type of input field."
            },
            "label": {
                "type": "string",
                "description": "A clean, human-readable label."
            },
            "help": {
                "type": "string",
                "description": "Guidance text explaining what the user should enter."
            },
            "placeholder": {
                "type": "string",
                "description": "An example value relevant to the purpose."
            },
            "required": {
                "type": "boolean",
                "description": "True if the field implies mandatory input."
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
            }
        },
        "required": [
            "key",
            "type",
            "label",
            "help",
            "required"
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
      pattern: "^[^.]*$"
      description: The unique identifier for the field. MUST NOT contain a dot (.).
    type:
      type: string
      enum[4]: string,number,html,markdown
      description: The type of input field.
    label:
      type: string
      description: "A clean, human-readable label."
    help:
      type: string
      description: Guidance text explaining what the user should enter.
    placeholder:
      type: string
      description: An example value relevant to the purpose.
    required:
      type: boolean
      description: True if the field implies mandatory input.
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
  required[5]: key,type,label,help,required
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
    "placeholder": "E.g. john@example.com"
  },
  {
    "key": "name",
    "help": "Enter Learner's Name",
    "type": "string",
    "label": "Learner's Name",
    "required": true,
    "placeholder": "E.g. John Doe"
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
    "placeholder": "E.g. +9175XXXXXXXX"
  },
  {
    "key": "to",
    "help": "Enter the recipient's email address. For multiple recipients, separate addresses with commas.",
    "type": "string",
    "label": "Recipient's Email",
    "required": true,
    "placeholder": "E.g. recipient@example.com"
  },
  {
    "key": "pageLimit",
    "help": "Default it will fetch data upto 100. The maximum value is 100.",
    "type": "number",
    "label": "Page Limit",
    "placeholder": "Eg. 10",
    "defaultValue": 100
  },
  {
    "key": "feed_url",
    "help": "Paste your RSS URL here. Must be publicly accessible. Multiple feed links can be given in a line item.",
    "list": true,
    "type": "string",
    "label": "Feed URL",
    "required": true,
    "placeholder": "E.g. https://example.com/rss1.xml"
  },
  {
    "key": "quick_reply",
    "help": "Paste your quick reply options here. Multiple reply options can be given in a line item. Maximum of 10 reply options are allowed.",
    "list": true,
    "limit": 10,
    "type": "string",
    "label": "Quick Reply Options",
    "required": true,
    "placeholder": "E.g. Option 1"
  },
  {
    "key": "htmlBody",
    "help": "Enter the body of the email. You can include HTML tags for formatting.",
    "type": "html",
    "label": "Message Body",
    "required": true,
    "placeholder": "E.g. <p>Write your HTML email message here</p>",
    "visibilityCondition": "context.inputData.messageType === 'html'"
  },
  {
    "key": "fileContent",
    "type": "markdown",
    "label": "File Content",
    "help": "Enter the content for the file. You can use Markdown syntax for formatting.",
    "placeholder": "# My Project\n\nThis is the readme content...",
    "required": true
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
    placeholder: E.g. john@example.com
  - key: name
    help: Enter Learner's Name
    type: string
    label: Learner's Name
    required: true
    placeholder: E.g. John Doe
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
    placeholder: E.g. +9175XXXXXXXX
  - key: to
    help: "Enter the recipient's email address. For multiple recipients, separate addresses with commas."
    type: string
    label: Recipient's Email
    required: true
    placeholder: E.g. recipient@example.com
  - key: pageLimit
    help: Default it will fetch data upto 100. The maximum value is 100.
    type: number
    label: Page Limit
    placeholder: Eg. 10
    defaultValue: 100
  - key: feed_url
    help: Paste your RSS URL here. Must be publicly accessible. Multiple feed links can be given in a line item.
    list: true
    type: string
    label: Feed URL
    required: true
    placeholder: "E.g. https://example.com/rss1.xml"
  - key: quick_reply
    help: Paste your quick reply options here. Multiple reply options can be given in a line item. Maximum of 10 reply options are allowed.
    list: true
    limit: 10
    type: string
    label: Quick Reply Options
    required: true
    placeholder: E.g. Option 1
  - key: htmlBody
    help: Enter the body of the email. You can include HTML tags for formatting.
    type: html
    label: Message Body
    required: true
    placeholder: E.g. <p>Write your HTML email message here</p>
    visibilityCondition: context.inputData.messageType === 'html'
  - key: fileContent
    type: markdown
    label: File Content
    help: Enter the content for the file. You can use Markdown syntax for formatting.
    placeholder: "# My Project\n\nThis is the readme content..."
    required: true
```

## Dictionary

### Dictionary Purpose:
A Dictionary (also called Map or Key-Value Pair) is a special input type in viaSocket that lets users dynamically define custom pairs of keys and values. This provides high flexibility when the structure of input data is variable or unknown in advance.

### Dictionary Input Field Generation Rules:
Generate a JSON object strictly following the rules below for a dictionary.
#### 1. Key Rules
- key must be unique.
- key must not contain a dot (.).
#### 2. Label Rules
- label must be a clean, human-readable version of fieldPurpose.
#### 3. Help Rules
- help must clearly explain what key-value pairs the user should enter.
#### 4. Required Rules
- Set required: true only if fieldPurpose implies mandatory input. 
- Otherwise, set required: false.
#### 5. Type Rule
- type must always be "dictionary".
#### 6. Template Rules
- The dictionary must follow this fixed template:
**key**
type: "string"
placeholder: "Enter key"
**value**
type: "string"
placeholder: "Enter value"

Do not modify template structure or data types.
Do not add extra properties.
#### 7. Output Rules
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
                            "pattern": "^[^.]*$",
                            "description": "Unique identifier for the field. The key MUST NOT contain a dot (.)"
                        },
                        "label": {
                            "type": "string",
                            "description": "A user-friendly label derived from the fieldPurpose."
                        },
                        "help": {
                            "type": "string",
                            "description": "Clear instructions for the user about what to input."
                        },
                        "required": {
                            "type": "boolean",
                            "description": "Indicates if this dictionary field is mandatory."
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
                        "required",
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
            pattern: "^[^.]*$"
            description: Unique identifier for the field. The key MUST NOT contain a dot (.)
          label:
            type: string
            description: A user-friendly label derived from the fieldPurpose.
          help:
            type: string
            description: Clear instructions for the user about what to input.
          required:
            type: boolean
            description: Indicates if this dictionary field is mandatory.
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
        required[6]: key,label,help,required,type,template
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

### Boolean Purpose:
A Boolean input type is used to represent a binary configuration choice where each option maps directly to a `true` or `false` value in the system. While it appears as a simple yes/no decision to the user, it often controls feature toggles, behavioral modes, or execution paths in the underlying logic.

This input type is ideal when:

- The decision has exactly two mutually exclusive outcomes
- Each option corresponds to a clear system action or state
- The UI label may vary (e.g., Yes/No, Basic/Advance, Workspace/Parent Page), but internally resolves to a Boolean value


### Boolean Input Field Generation Rules:
Generate a JSON object strictly following the rules below for a boolean field.

#### 1. Key Rules
- key must be unique.
- key must not contain a dot (.).

#### 2. Type Rule
- type must always be "boolean".

#### 3. Label, Help Rules
- label: Clean, human-readable question or description of the toggle (e.g. "Does your first row contain column name?")
- help: Clearly explain what happens when the user enables or disables this option

#### 4. Required Rule
- Set required: true if the field implies a mandatory decision
  (e.g. toggling a core feature on/off)
- Otherwise set required: false

#### 5. Options Rule
- options must always contain exactly two items: one with value: true and one with value: false
- Each option must include:
  - label: user-facing display text (e.g. "Yes", "No", "Enable", "Disable", "Basic", "Advanced")
  - value: the actual boolean value (true or false)
- The true-value option must appear first, followed by the false-value option

#### 6. Default Value Rule
- Set defaultValue only if a sensible default exists
- defaultValue must be an object with label and value matching one of the options
- Omit defaultValue entirely if there is no default

#### 7. Custom Input Rules
- Include customHelp only if manual/dynamic input mode needs guidance (e.g. "Enter \"true\" for Basic"). Omit if not applicable
- Include customPlaceholder only if a placeholder is needed for manual input (e.g. "E.g., true"). Omit if not applicable

#### 8. Visibility Condition Rule
- Include visibilityCondition only if both parentKey and parentValue are provided
- Do not include this key otherwise

#### 9. Output Constraint
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
                            "pattern": "^[^.]*$",
                            "description": "Unique identifier for the field (e.g. 'isActive', 'showLabels'). The key MUST NOT contain a dot (.)."
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
                            "description": "Helper text explaining what enabling/disabling this does."
                        },
                        "required": {
                            "type": "boolean",
                            "description": "Whether the field is mandatory."
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
                        "customHelp": {
                            "type": "string",
                            "description": "Optional helper text for manual/dynamic input (e.g., 'Enter \"true\" for Basic'). Omit if not applicable."
                        },
                        "customPlaceholder": {
                            "type": "string",
                            "description": "Optional placeholder text (e.g. 'E.g., true'). Omit if not applicable."
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
                        "required",
                        "options"
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
            pattern: "^[^.]*$"
            description: "Unique identifier for the field (e.g. 'isActive', 'showLabels'). The key MUST NOT contain a dot (.)."
          type:
            type: string
            enum[1]: boolean
            description: Must be 'boolean'.
          label:
            type: string
            description: A human-readable label (e.g. 'Does your first row contain column name?').
          help:
            type: string
            description: Helper text explaining what enabling/disabling this does.
          required:
            type: boolean
            description: Whether the field is mandatory.
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
          customHelp:
            type: string
            description: "Optional helper text for manual/dynamic input (e.g., 'Enter \"true\" for Basic'). Omit if not applicable."
          customPlaceholder:
            type: string
            description: "Optional placeholder text (e.g. 'E.g., true'). Omit if not applicable."
          visibilityCondition:
            type: string
            description: A JavaScript condition for visibility. Omit if always visible.
        required[6]: key,type,label,help,required,options
  required[1]: inputFields
```

### Boolean Examples:

#### Boolean JSON Example:
```json
[
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
        "defaultValue": {
          "label": "Yes",
          "value": true
        },
        "customPlaceholder": "E.g., true "
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
        "defaultValue": {
          "label": "Basic",
          "value": true
        },
        "customPlaceholder": "E.g., true "
      },
            {
        "key": "is_pagination",
        "help": "If yes, you can provide the page size and start cursor. If no you will receive all the page content.",
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
        "customHelp": "Enter \"true\" if you want to enable pagination else \"false\"",
        "customPlaceholder": "E.g., true",
        "defaultValue": {
          "label": "No",
          "value": false
        }
      },
        {
    "key": "page_location",
    "help": "Location of the datination page to be created.",
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
    "customPlaceholder": "E.g., true",
    "defaultValue": {
      "label": "Parent Page",
      "value": true
    },
    "customHelp": "Enter \"true\" to create page under parent page or \"false\" for private page in the workspace."
  }
]
```
#### Boolean TOON Example:
```toon
[4]:
  - key: column_key
    help: Determines how the data columns are labelled.
    type: boolean
    label: Does your first row contain column name?
    options[2]{label,value}:
      Yes,true
      No,false
    required: true
    customHelp: "Enter \"true\" if the first row contains the column name, else \"false\"."
    defaultValue:
      label: Yes
      value: true
    customPlaceholder: "E.g., true "
  - key: search_filter_type
    help: "Select the filter type, basic will have one column and value which will check an exact match. In advance, the user can provide the advanced query AND, OR operations with multiple columns."
    type: boolean
    label: Search Filter Type
    options[2]{label,value}:
      Basic,true
      Advance,false
    required: true
    customHelp: "Enter \"true\" for \"Basic\" and \"false\" for \"Advance\""
    defaultValue:
      label: Basic
      value: true
    customPlaceholder: "E.g., true "
  - key: is_pagination
    help: "If yes, you can provide the page size and start cursor. If no you will receive all the page content."
    type: boolean
    label: Enable Pagination
    options[2]{label,value}:
      Yes,true
      No,false
    required: false
    customHelp: "Enter \"true\" if you want to enable pagination else \"false\""
    customPlaceholder: "E.g., true"
    defaultValue:
      label: No
      value: false
  - key: page_location
    help: Location of the datination page to be created.
    type: boolean
    label: Create page at
    options[2]{label,value}:
      Workspace,false
      Parent Page,true
    required: true
    customPlaceholder: "E.g., true"
    defaultValue:
      label: Parent Page
      value: true
    customHelp: "Enter \"true\" to create page under parent page or \"false\" for private page in the workspace."
```

## Dropdown Static

### Dropdown Static Purpose:

A Static Dropdown input type is used when the user must select one value from a predefined, fixed list of options. It is suitable when all possible values are known in advance and should not change dynamically.

### Dropdown Static Input Field Generation Rules:
When to Use
Use a static dropdown when the user must select one value from a fixed, predefined list and all possible options are known at design time.
Core Rules
Create one input field with type: "dropdown".
Add the new or updated field to the existing inputFields array.
Only single selection is allowed.
Key Rules
key must be unique within inputFields.
key must be a stable identifier (e.g. message_type, priority_level).
Label Rules
label must be a clean, human-readable description of what the user is selecting.
It should describe the choice, not the technical value.
Help Rules
help must explain why the user is making this selection and how it affects behavior.
Required Rules
Set required: true if one option must be selected for the action to work.
Otherwise set required: false.

Placeholder Rules
placeholder should prompt selection (e.g. “Choose Message Type”).
If no placeholder is needed, return an empty string "".
Options Rules
options must be a fixed array.
Each option must include:
label: user-facing name
value: internal value sent to the API
sample: example or short description (use empty string "" if not needed)
Do not allow dynamic or user-generated options.
Default Value Rules
Set defaultValue only if a sensible default exists.
Otherwise return an empty string "".
Custom Input Rules
Include customInputLabel and customPlaceholder only if manual entry is allowed.
If manual input is not intended, return empty strings.
Visibility Rule
Include visibilityCondition only when the dropdown depends on another field.
If always visible, return an empty string "".
Output Rules
Return only valid JSON.
Do not add extra properties.
Do not include explanations or comments.

### Dropdown Static TOON Schema:
```toon

name: generate_static_dropdown_field
strict: true
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
            description: "Unique identifier for the field (e.g. 'message_type', 'priority_level')."
          type:
            type: string
            const: dropdown
            description: Must be 'dropdown'.
          label:
            type: string
            description: A human-readable label explaining the choice (e.g. 'Message Type').
          help:
            type: string
            description: Guidance text for the user.
          required:
            type: boolean
            description: Whether the selection is mandatory.
          placeholder:
            type: string
            description: Placeholder text shown in the dropdown before selection (e.g. 'Choose Message Type').
          customInputLabel:
            type: string
            description: Label for the manual input mode if user types a value instead of selecting.
          customPlaceholder:
            type: string
            description: "Placeholder for the manual input mode (e.g. 'E.g., text')."
          visibilityCondition:
            type: string
            description: "A JavaScript condition for visibility. Return an empty string \"\" if always visible."
          defaultValue:
            type: string
            description: "The default value to select initially. Return an empty string \"\" if none."
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
                  type: string
                  description: The internal value sent to the API (e.g. 'high').
                sample:
                  type: string
                  description: "An optional sample value or description. Return empty string \"\" if not needed."
              required[3]: label,value,sample
              additionalProperties: false
        required[11]: key,type,label,help,required,placeholder,customInputLabel,customPlaceholder,visibilityCondition,defaultValue,options
        additionalProperties: false
  required[1]: inputFields
  additionalProperties: false

```

## Multiselect Static

### Multiselect Static Purpose:

A Static Multiselect input type is used when the user needs to select multiple values from a predefined list of options. It is suitable when all selectable values are known in advance and multiple selections are allowed.

### Multiselect Static Input Field Generation Rules:



# Dynamic Input Fields

## Dropdown Dynamic
# DH Input Fields Knowledge Base

This document contains knowledge and best practices for creating and configuring input fields in viaSocket plug actions. his guide provides purpose, instructions, and input field structure in JSON & TOON format to better understand the LLM Model, and an example in JSON & TOON.
# Static Input Fields

The input fields, which are static, have fixed values. The depends on other feild will be through visibilityCondition in the static input fields.

## String | Date | Number | HTML | Markdown

### String | Date | Number | HTML | Markdown Purpose:
A String is a basic input type used to capture plain text values such as names, titles, identifiers, or short descriptions. It is suitable when the input is textual and does not require numeric calculation or formatting.
A Date input type is used to capture calendar-based values such as dates, times, or date-time combinations. It ensures the input follows a valid date or time format.
A Number input type is used to capture numeric values such as amounts, prices, counts, quantities, or any value that may be used in calculations or comparisons.
An HTML input type is used to capture rich text content that includes HTML tags. It is suitable when the input needs structured formatting and the HTML is required in the payload.
A Markdown input type is used to capture formatted text using Markdown syntax. It is ideal for content that needs lightweight formatting such as headings, lists, links, or emphasis.

### String | Date | Number | HTML | Markdown Input Field Generation Rules:
Generate a JSON object strictly following the rules below.

#### 1. Type Selection
If fieldPurpose contains date, time, DOB → type: "string"
If it contains amount, price, count, quantity, number → type: "number"
If the field supports HTML → type: "html"
If the field supports Markdown → type: "markdown"
Otherwise → type: "string"

#### 2. Label, Help, Placeholder
label: Clean, human-readable version of fieldPurpose
help: Clearly explain what the user should enter
placeholder: Provide a realistic example relevant to the purpose

#### 3. Required Rule
Set required: true if fieldPurpose implies mandatory input
 (e.g. name, email, amount, date)
Otherwise set required: false

#### 4. Visibility Condition Rule
Include visibilityCondition only if both parentKey and parentValue are provided
Do not include this key otherwise

#### 5. List Rule
Set list: true if the user preconfigures multiple values as an array during setup
Set list: false if the value is single or needs to be dynamic later
 (comma-separated input allowed)

#### 6. Output Constraint
Return only valid JSON
Do not add explanations, comments, or extra keys

### String | Date | Number | HTML | Markdown JSON Schema:

### String | Date | Number | HTML | Markdown TOON Schema:
```toon
name,input_field_creator
strict,true
schema,
  type,object
  properties,
    key,
      type,string
      pattern,^[^.]*$
      description,The unique identifier for the field (e.g.,'email','fileContent'). The key MUST NOT contain a dot (.)
    type,
      type,string
      enum[4],string,number,html,markdown
      description,The type of input field. Use 'string' for text/dates,'html' or 'markdown' for rich text.
    label,
      type,string
      description,A clean,human-readable label generated from the fieldPurpose.
    help,
      type,string
      description,Guidance text explaining what the user should enter.
    placeholder,
      type,string
      description,An example value relevant to the purpose.
    required,
      type,boolean
      description,True if the field implies mandatory input.
    list,
      type,boolean
      description,Whether this field accepts a list/array of values. Usually false unless specified.
    visibilityCondition,
      type,string
      description,A JavaScript condition string if logic is needed. Return an empty string \\ if not applicable.
    defaultValue,
      type,string
      description,The default value for the field. Return an empty string \\ if not applicable.
  required[9],key,type,label,help,placeholder,required,list,visibilityCondition,defaultValue
  additionalProperties,false

```

### String | Date | Number | HTML | Markdown Examples:
```toon
[6],
  -
    key,email
    help,Enter Learner's Email ID
    list,false
    type,string
    label,Learner's Email ID
    required,true
    placeholder,E.g. john@example.com
  -
    key,name
    help,Enter Learner's Name
    list,false
    type,string
    label,Learner's Name
    required,true
    placeholder,E.g. John Doe
  -
    key,password
    help,Password of the learner. If not sent,account is created with random password
    list,false
    type,string
    label,Learner's Password
    required,false
    placeholder,Enter Password
  -
    key,mobile
    help,Mobile number of the learner with country code. For example,+9175XXXXXXXX
    list,false
    type,string
    label,Learner's Mobile No
    required,false
    placeholder,E.g. +9175XXXXXXXX
  -
    key,htmlBody
    help,Enter the body of the email. You can include HTML tags for formatting.
    type,html
    label,Message Body
    required,true
    placeholder,E.g. <p>Write your HTML email message here</p>
    visibilityCondition,context.inputData.messageType === 'html'
  -
    key,fileContent
    type,markdown
    label,File Content
    help,Enter the content for the file. You can use Markdown syntax for formatting.
    placeholder,# My Project\n\nThis is the readme content...
    required,true
    list,false

```

## Dictionary

### Dictionary Purpose:
A Dictionary (also called Map or Key-Value Pair) is a special input type in viaSocket that lets users dynamically define custom pairs of keys and values. This provides high flexibility when the structure of input data is variable or unknown in advance.

### Dictionary TOON Schema:
```toon
name,Dictionary TOON Schema
strict,true
schema,
  type,object
  properties,
    inputFields,
      type,array
      description,The array of input fields including the newly created or updated dictionary field.
      items,
        type,object
        properties,
          key,
            type,string
            pattern,^[^.]*$
            description,Unique identifier for the field. The key MUST NOT contain a dot (.)
          label,
            type,string
            description,A user-friendly label derived from the fieldPurpose.
          help,
            type,string
            description,Clear instructions for the user about what to input.
          required,
            type,boolean
            description,Indicates if this dictionary field is mandatory.
          type,
            type,string
            enum[1],dictionary
            description,Must be set to 'dictionary'.
          template,
            type,object
            properties,
              key,
                type,object
                properties,
                  type,
                    type,string
                    const,string
                  placeholder,
                    type,string
                required[2],type,placeholder
                additionalProperties,false
              value,
                type,object
                properties,
                  type,
                    type,string
                    enum[1],string
                    description,The data type the value field supports. Always its value is string
                  placeholder,
                    type,string
                required[2],type,placeholder
                additionalProperties,false
            required[2],key,value
            additionalProperties,false
        required[6],key,label,help,required,type,template
        additionalProperties,false
  required[1],inputFields
  additionalProperties,false

### Dictionary Input Field Generation Rules:

Create one input field with type: "dictionary".
Add the new or updated field to the existing inputFields array.
Key Rules
key must be unique.
key must not contain a dot (.).
Label Rules
label must be a clean, human-readable version of fieldPurpose.
Help Rules
help must clearly explain what key-value pairs the user should enter.
Required Rules
Set required: true only if fieldPurpose implies mandatory input.
Otherwise set required: false.
Type Rule
type must always be "dictionary".
Template Rules
The dictionary must follow this fixed template:
key
type: "string"
placeholder: "Enter key"
value
type: "string"
placeholder: "Enter value"

Do not modify template structure or data types.
Do not add extra properties.
Output Rules
Return only valid JSON.

```

### Dictionary Examples:
```toon
[2],
  -
    key,url_button
    help,The URL Button opens a web page in the in-app browser.
    type,dictionary
    label,URL Button
    template,
      key,
        type,string
        placeholder,Button Title
      value,
        type,string
        placeholder,Link
    visibilityCondition,context.inputData.message_type === 'text'
  -
    key,postback_button
    help,The postback button sends a messagin_postbacks event to your trigger \New DM\ with the string set in the payload property. This allows you to take arbitrary actions when the button is tapped. [Learn More](https,//developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api/button-template)
    type,dictionary
    label,Postback Button
    template,
      key,
        type,string
        placeholder,Button Title
      value,
        type,string
        placeholder,PAYLOAD
    visibilityCondition,context.inputData.message_type === 'text'
```

## Boolean

### Boolean Purpose:
A Boolean input type is used to capture a yes-or-no (true/false) decision. It is suitable when the user needs to enable or disable a feature, apply a condition, or make a binary choice.

### Boolean TOON Schema:
```toon
name: generate_boolean_field
strict: true
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
            description: "Unique identifier for the field (e.g. 'isActive', 'showLabels')."
          type:
            type: string
            const: boolean
            description: Must be 'boolean'.
          label:
            type: string
            description: A human-readable label (e.g. 'Show Advanced Options').
          help:
            type: string
            description: Helper text explaining what enabling/disabling this does.
          required:
            type: boolean
            description: Whether the field is mandatory.
          placeholder:
            type: string
            description: "Placeholder text (e.g. 'E.g., true')."
          customInputLabel:
            type: string
            description: "Label for the manual input mode (e.g. 'Enter \"true\" to enable...')."
          visibilityCondition:
            type: string
            description: "A JavaScript condition for visibility. Return an empty string \"\" if always visible."
          options:
            type: array
            description: The toggle options. Usually Yes(true) and No(false).
            items:
              type: object
              properties:
                label:
                  type: string
                  description: "Display label (e.g. 'Yes', 'True', 'Enable')."
                value:
                  type: boolean
                  description: The actual boolean value (true or false).
              required[2]: label,value
              additionalProperties: false
          defaultValue:
            type: object
            description: The default selection. Usually set to false/No if unsure.
            properties:
              label:
                type: string
                description: The label of the default option (e.g. 'No').
              value:
                type: boolean
                description: The value of the default option (e.g. false).
            required[2]: label,value
            additionalProperties: false
        required[10]: key,type,label,help,required,placeholder,customInputLabel,visibilityCondition,options,defaultValue
        additionalProperties: false
  required[1]: inputFields
  additionalProperties: false

### Boolean Input Field Generation Rules:

Use type: "boolean".
Present two options only: true and false.
Labels must clearly indicate the effect of enabling or disabling the option.
Set required: true only if the decision is mandatory for execution.
Default value should usually be false unless the purpose clearly implies otherwise.
Include visibilityCondition only when dependent on another field.
Return only valid JSON with no extra keys.

```

### Boolean TOON Examples:
```toon

[2]:
  - key: column_key
    help: Determines how the data columns are labeled.
    type: boolean
    label: Does your first row contain column name?
    options[2]{label,value}:
      Yes,true
      No,false
    required: true
    placeholder: "E.g., true"
    customInputLabel: "Enter \"true\" if the first row contain the column name."
  - key: is_last_row
    help: List from the last row of the spreadsheet. Select “Yes” to enable.
    type: boolean
    label: List from last row
    options[2]{label,value}:
      Yes,true
      No,false
    required: false
    placeholder: "E.g., true"
    defaultValue:
      label: No
      value: false
    customInputLabel: "Enter \"true\" for search from the last row of the spreadsheet."
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
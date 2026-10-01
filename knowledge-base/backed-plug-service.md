---
type: page
title: "Viasocket Multi Service Webhook Receiver"
description: "Webhook receiver for services that provide only one webhook per application. Receive that service’s webhook and forward it to the appropriate flow(s)."
published: true
---

# Page Index

- Create Service
  - Special Case: Batch Processing
- Verify Service
- Subscribe User
  - Precondition Block Types ("rule", "and", "or", "any", "every")
  - Special Case: Subscribe user but mark verification false
- Unsubscribe User
- Get Subscription by ID
- List all active subscriptions for an external Id
- List All Subscriptions by Service Name
- Toggle Debugging Mode
- Update Subscription
- Evaluate / Test Preconditions Utility API

## Create Service

```bash
curl --location 'https://plugservice-api.viasocket.com/api/services' \
--header 'Content-Type: application/json' \
--header 'auth_token: {{auth_token}}' \
--data '{
  "service": "{{service_slug}}",
  "user_extraction_paths": [
    "body.user.id",
    "headers.sender",
    "query.user_id"
  ],
  "forwarding_webhook_url": "https://flow.sokt.io/func/<script_id>"
}'
```

- `user_extraction_paths`: webhook must contain a unique identifier that we’ll map to one or more flows. `user_extraction_paths` is the list of probable paths from which we can extract this unique identifier (if found on first path, we will not look into second path).
- `forwarding_webhook_url`: This will be used for service verfication and for debugging purposes that will be explained later.

You can add this while creating or updating a service:

For “operator" can refer below sections in “Subscribe User“.

```json
"periodical_verification_precondition": {
    "type": "rule",
    "path": "query.hub_verify_token",
    "operator": "exists"
}
```

### Special Case: Batch Processing
Batch webhook processing is done, just add or update `payload_batch_paths` array in service configurations and add `/batch`.

## Verify Service

```bash
curl --location --request PATCH 'https://plugservice-api.viasocket.com/api/services/{{service_slug}}/verify' \
--header 'Content-Type: application/json' \
--header 'auth_token: {{auth_token}}'
```

You must verify your service before subscribing any user to it. If you don’t pass `forwarding_webhook_url` during service creation, the service will be by default verified.

Until you verify your service (i.e. call this api), we will forward your reqeust to the `forwarding_webhook_url` and pass the response from your api to the webhook caller.

Once verification is done, call this api to mark the servcie verified.

To change the verification status, you can pass the key `"is_verified": true/false` in the body.

## Subscribe User

```bash
curl --location 'https://plugservice-api.viasocket.com/api/subscribe' \
--header 'Content-Type: application/json' \
--header 'auth_token: {{auth_token}}' \
--data '{
  "service": "service_slug",
  "external_id": "user123",
  "webhook": "https://flow.sokt.io/scriabc1234", 
  "precondition_config": {
    "type": "and",
    "conditions": [
      {
        "type": "rule",
        "path": "body.event.type",
        "operator": "eq",
        "value": "message"
      },
      {
        "type": "or",
        "conditions": [
          {
            "type": "rule",
            "path": "body.event.channel_type",
            "operator": "eq",
            "value": "channel"
          },
          {
            "type": "rule",
            "path": "body.event.channel_type",
            "operator": "eq",
            "value": "im"
          }
        ]
      }
    ]
  },
  "metadata": {}
}'
```

- `external_id`: unique identifier that will be received via webhook with `user_extraction_paths`.
- `webhook`: Flow url to which we should forward the reqeust.
- `precondition_config`: JSON-based way to define conditions using logical blocks (`and` / `or`), array evaluation blocks (`any` / `every`), and individual `rule` blocks. These blocks can be nested to represent complex boolean logic without writing code.
- `metadata`: Optional information if need for a subscription

### Precondition Block Types (`type`)

`precondition_config` supports 5 distinct block types: `"rule"`, `"and"`, `"or"`, `"any"`, and `"every"`. These blocks can be nested to form complex boolean filters.

#### 1. `"type": "rule"` (Atomic Rule)
The base evaluation block. Compares a field from the incoming webhook payload against an expected value using an operator.
- `type`: `"rule"`
- `path`: Target property path in dot notation (e.g. `"body.event.type"`).
- `operator`: Comparison operator (`eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `nin`, `exists`, `not_exists`).
- `value`: Target value to compare against (not required for `exists` / `not_exists`).

```json
{
  "type": "rule",
  "path": "body.event.type",
  "operator": "eq",
  "value": "message"
}
```

#### 2. `"type": "and"` (Logical All)
Evaluates to `true` if and only if **all** conditions in the `conditions` array evaluate to `true`.
- `type`: `"and"`
- `conditions`: Array of child condition blocks (`rule`, `and`, `or`, `any`, `every`).

```json
{
  "type": "and",
  "conditions": [
    {
      "type": "rule",
      "path": "body.event.type",
      "operator": "eq",
      "value": "message"
    },
    {
      "type": "rule",
      "path": "body.event.status",
      "operator": "eq",
      "value": "active"
    }
  ]
}
```

#### 3. `"type": "or"` (Logical Any)
Evaluates to `true` if **at least one** condition in the `conditions` array evaluates to `true`.
- `type`: `"or"`
- `conditions`: Array of child condition blocks (`rule`, `and`, `or`, `any`, `every`).

```json
{
  "type": "or",
  "conditions": [
    {
      "type": "rule",
      "path": "body.event.channel_type",
      "operator": "eq",
      "value": "channel"
    },
    {
      "type": "rule",
      "path": "body.event.channel_type",
      "operator": "eq",
      "value": "im"
    }
  ]
}
```

#### 4. `"type": "any"` (Array - At Least One)
Evaluates array items in the payload. Evaluates to `true` if **at least one** item in the target array satisfies the specified `condition`.
- `type`: `"any"`
- `path`: Dot-notation path to the array in the payload (e.g. `"body.items"`).
- `condition`: Single condition block evaluated against each array element (`condition.path` is relative to each array element).

```json
{
  "type": "any",
  "path": "body.items",
  "condition": {
    "type": "rule",
    "path": "status",
    "operator": "eq",
    "value": "paid"
  }
}
```

#### 5. `"type": "every"` (Array - All)
Evaluates array items in the payload. Evaluates to `true` only if **all** items in the target array satisfy the specified `condition`.
- `type`: `"every"`
- `path`: Dot-notation path to the array in the payload (e.g. `"body.items"`).
- `condition`: Single condition block evaluated against each array element (`condition.path` is relative to each array element).

```json
{
  "type": "every",
  "path": "body.items",
  "condition": {
    "type": "rule",
    "path": "status",
    "operator": "eq",
    "value": "paid"
  }
}
```

#### Nested / Combined Precondition Example

Precondition blocks can be nested arbitrarily to handle complex business filtering:

```json
{
  "type": "and",
  "conditions": [
    {
      "type": "rule",
      "path": "body.event",
      "operator": "eq",
      "value": "order_updated"
    },
    {
      "type": "or",
      "conditions": [
        {
          "type": "any",
          "path": "body.order.line_items",
          "condition": {
            "type": "rule",
            "path": "fulfillment_status",
            "operator": "eq",
            "value": "fulfilled"
          }
        },
        {
          "type": "rule",
          "path": "body.order.financial_status",
          "operator": "eq",
          "value": "paid"
        }
      ]
    }
  ]
}
```

### Supported Operators
Below are the operators supported for `"type": "rule"`:
- `eq` — equal to
- `ne` — not equal to
- `gt` — greater than
- `gte` — greater than or equal to
- `lt` — less than
- `lte` — less than or equal to
- `in` — value exists in a given list/array
- `nin` — value does not exist in a given list/array
- `exists` — field/key is present
- `not_exists` — field/key is missing

### Special Case: Subscribe user but mark verification false

```bash
curl --location 'https://plugservice-api.viasocket.com/api/subscribe' \
--header 'Content-Type: application/json' \
--header 'auth_token: {{auth_token}}' \
--data '{
  "service": "instagram",
  "external_id": "476464742546300",
  "webhook": "https://flow.sokt.io/func/scriwPEztqh1",
  "is_verified": false,
  "precondition_config": {
    "type": "and",
    "conditions": [
      {
        "type": "rule",
        "path": "body.body.event.type",
        "operator": "eq",
        "value": "create_pulse"
      },
      {
        "type": "rule",
        "path": "body.body.event.groupName",
        "operator": "eq",
        "value": "Subitems"
      }
    ]
  }
}'
```

There is key `"is_verified"`: use when the user level web-hook verification is required.

To mark verified use below api:

```bash
curl --location --globoff --request PATCH 'https://plugservice-api.viasocket.com/api/subscriptions/{{subscription_id}}/verify' \
--header 'Content-Type: application/json' \
--header 'auth_token: {{auth_token}}' \
--data '{
    "is_verified" : true
}'
```

## Unsubscribe User

```bash
curl --location 'https://plugservice-api.viasocket.com/api/unsubscribe' \
--header 'Content-Type: application/json' \
--header 'auth_token: {{auth_token}}' \
--data '{
  "service": "service_slug",
  "external_id": "user12345",
  "webhook": "https://flow.sokt.io/func/scriuser1234P"
}'
```

## Get Subscription by ID

```bash
curl --location 'https://plugservice-api.viasocket.com/api/subscription/{{subscription_id}}' \
--header 'auth_token: {{auth_token}}'
```

## List all active subscriptions for an external Id

```bash
curl --location 'https://plugservice-api.viasocket.com/api/subscriptions/{{service_slug}}/{{external_id}}' \
--header 'auth_token: {{auth_token}}'
```

## List All Subscriptions by Service Name

```bash
curl --location 'https://plugservice-api.viasocket.com/api/subscriptions/{{service_slug}}?page=2&limit=200' \
--header 'Content-Type: application/json' \
--header 'auth_token: {{auth_token}}'
```

## Toggle Debugging Mode

Use this to toggle debugging mode for your service. When debugging mode is enabled, the request and response for every webhook will be forwarded to your `forwarding_webhook_url`. Debugging mode will be automatically disabled after 24 hours of enabling it.

```bash
curl --location --request PATCH 'https://plugservice-api.viasocket.com/api/services/{{service_slug}}/debug' \
--header 'auth_token: {{auth_token}}'
```

## Update Subscription

```bash
curl --location --globoff --request PATCH 'https://plugservice-api.viasocket.com/api/subscriptions/update/{{subscription_id}}' \
--header 'Content-Type: application/json' \
--header 'auth_token: {{auth_token}}' \
--data '{
  "precondition_config": {
    "type": "rule",
    "path": "body.event.type",
    "operator": "eq",
    "value": "message"
  },
  "metadata": {
    "user_data": "Hello_124"
  },
  "append_metadata": true
}'
```

You can update few things in subscriptions:

- `precondition_config`
- `metadata`: You can decide whether to append to existing metadata by setting `append_metadata` to true, by default it’s false and it will replace whole metadata on update.

## Evaluate / Test Preconditions Utility API

A utility API for testing and evaluating precondition rules against sample webhook payloads before saving or updating a subscription. It requires only the `precondition_config` rule definition and the test `payload`:

```bash
curl -X POST 'https://plug-service.viasocket.com/api/preconditions/evaluate' \
  -H "Content-Type: application/json" \
  -H "auth_token: {{auth_token}}" \
  -d '{
    "precondition_config": {
      "type": "any",
      "path": "body.items",
      "condition": {
        "type": "rule",
        "path": "status",
        "operator": "eq",
        "value": "paid"
      }
    },
    "payload": {
      "body": {
        "items": [
          { "status": "pending" },
          { "status": "paid" }
        ]
      }
    }
  }'
```

- `precondition_config`: The precondition rule/tree (`rule`, `and`, `or`, `any`, `every`) to validate.
- `payload`: The sample webhook JSON payload (`body`, `headers`, `query`) to test against.
- **Evaluation**: Returns whether the test payload satisfies the configured precondition rules.

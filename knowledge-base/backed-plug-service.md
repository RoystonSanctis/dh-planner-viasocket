---
type: page
title: "Viasocket Multi Service Webhook Receiver"
description: "Webhook receiver for services that provide only one webhook per application. Receive that service’s webhook and forward it to the appropriate flow(s)."
published: true
---

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
- `precondition_config`: JSON-based way to define conditions using logical blocks (`and` / `or`) that contain smaller conditions. Each block combines its child conditions, and the smallest unit is a rule that compares a value from the input data (using a path and operator) to an expected value. These blocks can be nested to represent complex boolean logic without writing code.
- `metadata`: Optional information if need for a subscription

Below are the operators supported: 
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

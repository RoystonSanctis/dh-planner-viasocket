## WhatsApp plug — SDK product notifications

Built-in **Send WhatsApp Message** lists Meta-approved templates from viaSocket’s MSG91 number (`template1` / `listOptions` on field `name`). Those templates are for viaSocket business flows (support, billing, webinars), not arbitrary copy from an embedded product.

For SDK/embed apps that need headline + summary + link alerts:

- Use action **Send Product Notification** (`Send_Product_Notification`) on the WhatsApp plug.
- Inputs: `to`, `title`, `summary`, optional `link` (NoAuth connection).
- Perform uses template `viasocket_product_notification` when it exists on MSG91; until Meta approves it, the action falls back to `work_alert_notification` (headline → `body_1`, summary + link → `body_2`).

Ops: register `viasocket_product_notification` (UTILITY) on integrated number `917316914660` with body variables for headline, summary, and link so embed products get neutral wording without the “Work Alert” fallback layout.

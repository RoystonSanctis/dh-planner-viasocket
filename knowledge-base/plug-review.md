---
type: page
title: "Plug Review"
description: "Rated checks for a plug's code, auth, API match, fields, dropdowns, triggers and output. Any rating under 90 rejects the plug."
published: true
---

# Test Cases

Rate each check from 0 to 100. If a check covers many items, the rating is the percent of them that pass. If a mistake breaks the plug or exposes a secret, that check is 0. Skip any check that does not apply. Verify against the app's official API docs, and do not guess.

1. **Error handling.** Every block returns its result inside try/catch, and the catch calls `await errorComponent(error)`. Reusable components use `throw error` instead. Rate it.
2. **Runs in the VM.** The code never uses require, import, process, URL, btoa, setInterval or axios.create. It never redeclares context, axios, fetch, console or authData. Rate it.
3. **Safe reads.** Every property read uses `?.`. Required inputs are checked before the API call and throw a clear error. Rate it.
4. **Auth.**
   - When the connection uses authenticationpaths, the code has no auth headers, API keys, tokens or secrets.
   - authData is used only for non-secret URL parts, such as the subdomain.
   - Every host called is whitelisted.
   - For OAuth apps, each action and trigger lists its own scopes.
   - **One auth version per plug:** Every action and trigger version that calls the app's authenticated API must set `authid` to the plug's `preferedauthversion` (or the same auth row id as the other actions on that plug). Do not point some actions at a different auth version (for example NoAuth) when the perform code expects the primary API-key or Basic connection—users cannot reuse one connection across the flow.

   Rate it.
5. **Matches the API docs.** The method, URL, query and body match the docs. No parameter is invented. IDs in URLs are encoded. Rate it.
6. **All parameters covered.** Every documented parameter is a field or is handled in code. Rate it.
7. **Safe payload.** Only filled fields are sent. An update leaves unfilled fields unchanged. Rate it.
8. **Valid fields.**
   - The JSON is valid, with unique keys and supported types. An input group's type is exactly "input groups".
   - The code reads only fields and system keys, such as hookUrl, performsubscribe or scheduledTime.
   - Every field is used by code, a dropdown or a visibilityCondition.
   - visibilityCondition uses real keys and single-quoted text.
   - Triggers have no aifield.

   Rate it.
9. **Stable keys.** A key already in use is never renamed or removed. The same field uses the same key across the plug. Rate it.
10. **Field text.**
    - Labels are in Title Case and generic: "Page", not "Facebook Page".
    - Help says what to enter, the format and the default, and warns when a value replaces or deletes data.
    - Placeholders are real sample values, with no "E.g.".
    - Static options use the real API values.

    Rate it.
11. **Field layout.**
    - Fields run from parent selectors, to required fields, to optional fields. Optional fields are grouped behind one "Select Additional Fields" multiselect.
    - Fixed choices are dropdowns, lists are repeating input groups, and nested objects are input groups.
    - Users enter dates and times in plain formats, and the code converts them. Users never work out timestamps.
    - A separate help field is used only for:
      - a warning
      - a prerequisite
      - manual webhook setup
      - polling math

    Rate it.
12. **Action design.**
    - Each job has one action, with no near-duplicates.
    - Get, list and search share one LIST action with a mode.
    - Create and update are one upsert when the API allows it.
    - DELETE takes a text ID and treats "not found" as done.
    - UPDATE help says unfilled fields stay unchanged.
    - A manual trigger has the two-part webhook setup guide.

    Rate it.
13. **Dropdowns.**
    - IDs come from dynamic dropdowns with their parents in place. A text ID is allowed only for DELETE, or when the ID comes from an earlier step.
    - A dropdown reads its parent as `context?.inputData?.<key>` and returns label and value.
    - Paging and search are turned on only if the API supports them.
    - No results returns a clear message.

    Rate it.
14. **Reusable components.**
    - Components are made only for dropdowns and dynamic fields.
    - Every component used is mapped on the version, errorComponent included.
    - No component calls another component.
    - A mapped component is never edited. Changes go into a new one.

    Rate it.
15. **Trigger blocks.**
    - Instant: subscribe, unsubscribe and sample.
    - Scheduled: perform and sample, with `canpaginate` on when it pages.
    - Manual: sample only, with no auth, scopes or API calls.
    - Instant and manual triggers should have modify, to turn the raw event into clean, flat data. In an instant trigger, if the event holds only an ID, modify fetches the full record.
    - Transfer is optional.
    - The sample returns one object with the same shape as a live event.

    Rate it.
16. **Polling.** Each run fetches one page, oldest first, since the last run. The cursor moves forward only when there are results and a next page, and it is never reset. The trigger shows no paging or interval fields. Rate it.
17. **Name and description.**
    - An action name is a verb plus an object, such as "Create Customer".
    - A trigger name is New, Updated or Deleted plus an object, such as "New Page Created".
    - The description says what the user gets, in 120 characters or fewer.

    Rate it.
18. **Output.**
    - The code returns useful data from `response?.data`.
    - Saved sample output matches a real result.
    - When nothing is found, it returns a message with empty data.
    - A 200 response that carries an error throws the app's own message.

    Rate it.
19. **Safe to repeat.** Running it again does not duplicate or wipe data. API calls in loops respect rate limits. Rate it.
20. **Dry run.** Every read-only block was run and returned real data. Writes are checked by reading the code and marked "not executed". Rate it.

## Result

List every check with its rating.

- **Approved:** every rating is 90 or more.
- **Rejected:** any rating is under 90. Say which check failed, where, and how to fix it. Fix it, then review the whole plug again. Never publish a rejected plug.

---
type: page
title: "Perform Code Knowledge Base"
description: "This document contains knowledge, snippets, and best practices for writing robust JavaScript perform code for viaSocket plug actions."
published: true
---
# Perform Code Knowledge Base Page Index

- Perform Code Knowledge Base
- Trigger
  - Trigger Code Generation Rules:
  - Instant Trigger
    - Instant Trigger Perform Code Rules:
    - Instant Trigger Sample Code Pseudo Code:
  - Scheduled Trigger
    - Scheduled Trigger Perform Code Rules:
    - Scheduled Trigger Perform Code Pseudo Code:
    - Scheduled Trigger Sample Code Rules:
    - Scheduled Trigger Sample Code Pseudo Code:
    - Scheduled Trigger Perform Code Example:
    - Scheduled Trigger Sample Code Example:
  - Manual Trigger
    - Manual Trigger Perform Code Rules:
    - Manual Trigger Perform Code Pseudo Code:
    - Manual Trigger Sample Code Pseudo Code:
- Actions
  - Action Perform Code Rules:
  - GET
    - GET Perform Code Rules:
    - GET Perform Code Pseudo Code:
  - LIST
    - LIST Perform Code Rules:
    - LIST Perform Code Pseudo Code:
  - FIND/SEARCH
    - FIND/SEARCH Perform Code Rules:
    - FIND/SEARCH Perform Code Pseudo Code:
  - CREATE
    - CREATE Perform Code Rules:
    - CREATE Perform Code Pseudo Code:
  - UPDATE
    - UPDATE Perform Code Rules:
    - UPDATE Perform Code Pseudo Code:
  - FIND OR CREATE
    - FIND OR CREATE Perform Code Rules:
    - FIND OR CREATE Perform Code Pseudo Code:
  - DELETE
    - DELETE Perform Code Rules:
    - DELETE Perform Code Pseudo Code:
- Special Note:
  - Special Note - API Request Error Handling:
  - Special Note - Success Code Handling:
  - Special Note - Final Code Review:

# Perform Code Knowledge Base

This document contains knowledge, snippets, and best practices for writing robust JavaScript perform code for viaSocket plug actions.

# Trigger

## Trigger Code Generation Rules:

## Instant Trigger

**What it does**
Fires in real-time when an event occurs in the external service via a webhook. The external service pushes data directly to viaSocket the moment something happens.

**Simple understanding**
- Real-time, event-driven updates.
- The external service sends data to viaSocket via a webhook URL.
- Example: New form submission → Webhook fires → Workflow runs immediately.

**When to use**
- When the external service supports webhooks subscription/unsubscription.
- When real-time, immediate data processing is required.

### Instant Trigger Perform Code Rules:
- Instant Triggers typically do **not** require perform code since the webhook handles data delivery.
- A **Sample Code** block is required to fetch test/sample data for the trigger configuration UI.
- The sample code should fetch the **most recent 1 item** from the API to provide the user with a realistic data preview.
- If no data exists, the sample code should return a **hardcoded fallback object** representing the expected schema.

### Instant Trigger Sample Code Pseudo Code:
```
async (context) => {
  try {
    // Step 1: Read input data from UI form
    const resourceId = context.inputData.<resource_key>;

    // Step 2: Fetch the most recent 1 item from the API
    const response = await axios({
      url: `<api_base_url>/<resource_endpoint>`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      params: {
        limit: 1,
        sort: 'created_at:desc' // Sort by most recent
      }
    });

    // Step 3: Return sample data or fallback
    const results = response.data?.results || response.data || [];

    if (results.length > 0) {
      return results;
    }

    // Step 4: Fallback — return hardcoded schema sample
    return [{
      id: 'sample_id_123',
      name: 'Sample Record',
      created_at: new Date().toISOString(),
      // ... include all expected fields with sample values
    }];

  } catch (error) {
    throw error;
  }
}
```


## Scheduled Trigger

**What it does**
Runs your workflow at regular time intervals by repeatedly checking your app for new data. If something new is found, the workflow runs.

**Simple understanding**
- No real-time updates.
- viaSocket checks repeatedly.
- Example: Check every 5 minutes -> If new data -> Run workflow.

**When to use**
- When your app does NOT support webhooks (no instant trigger available).
- Data needs to be checked manually.

**How it works**
1. You set a time interval.
2. viaSocket calls your API repeatedly.
3. It checks for new or updated data.
4. If found, the workflow starts.

**Real examples**
- New row in Google Sheet → every 5 min
- New lead in CRM → every 10 min
- New order → every 15 min

### Scheduled Trigger Perform Code

#### Scheduled Trigger Perform Code Rules:

**Best Practice Algorithm:**
Always check if the API natively supports filtering by a start date (e.g., `created_at_min`), updated date, or returning specific output item keys. **If the API supports these native query parameters, use them!** It is the most optimized approach. If the API does *not* support it natively, you must handle the logic on the client side: filtering the latest/updated items, filtering the fields, and sorting the results.

- **Timestamp Formatting:** If using client-side filtering, identify the creation or update time for each item. If the time is in a different format, you must convert it to fit the standard `new Date()` limit filter logic.
- **Client-Side Field Filtering:** There can be input fields that the user chooses from the UI form. If the API doesn't support returning only supplied fields natively, you must filter them out from the response object on the client side before returning data.

**Smart Filtering with `__executionStartTime__`**
Filter your API results dynamically by calculating the timestamp for "X minutes ago".

```javascript
// __executionStartTime__ = Current run's exact timestamp
// context?.inputData?.scheduledTime = User-defined interval (e.g., 10 mins)
const minutesAgo = new Date(__executionStartTime__ - context?.inputData?.scheduledTime * 60 * 1000);
```

**Handling Pagination**
*Note: This feature must first be enabled in the UI (stored as the flag `canpaginate: true`).*
If enabled and the API supports pagination, use the global variable `context?.paginationData` to track your progress.
- **Initial value:** `0` or `null`
- **Updates:** Reassign this parameter with your next cursor or incremented page number inside the Perform code.
- **Assignment Condition:** ONLY assign the next page token if BOTH:
  1. The current page yielded **non-zero filtered results**.
  2. The API returned a valid **next page token** (Or you manually validated the max page length on the client side: e.g., `orders.length >= pageSize`).
  If these aren't met, do nothing. Failing to advance the token stops the loop.
- **Loop Break:** The system automatically stops the pagination loop if it receives the *same* next page token or page number twice.
> [!WARNING]
> Re-assigning `0` or `null` will reset pagination completely back to the start.

#### Scheduled Trigger Perform Code Pseudo Code:

##### 1. Fetching New Items from an API with pagination
```javascript
async function fetchItems() {
    try {

        // 1. Calculate lookback time
        const minutesAgo = new Date(__executionStartTime__ - context?.inputData?.scheduledTime * 60 * 1000);

        // 2. Prepare request payload
        let requestPayload = {
            key: "value"
        };

        // -----------------------------------
        // OPTIONAL PAGINATION (Generic)
        // -----------------------------------
        // Use existing pagination value if present
        // Initial expected value: 0 or null
        // User need to enable pagination in UI first
        if (context?.paginationData) {
            requestPayload.cursor = context.paginationData;
        }

        // 3. Configure API request
        const requestConfig = {
            method: "GET",                // Can be GET or POST
            url: "https://api.service.com/endpoint",
            params: requestPayload,       // Use "data" instead if POST
            headers: {
                "API-Version": "v1"
            }
        };

        // 4. Execute API call
        const response = await axios(requestConfig);

        const allItems = response?.data?.items || [];

        // 5. Filter the results to include only those created in the last scheduled time
        let filteredData = allItems.filter((item) => {
            const createdTime = new Date(item.created_time);
            return createdTime >= minutesAgo;
        });

        // 6. Sort the filtered data by creation time (oldest first)
        filteredData.sort(
            (a, b) => new Date(a.created_time) - new Date(b.created_time)
        );

        // -----------------------------------
        // OPTIONAL PAGINATION UPDATE
        // -----------------------------------
        // User need to enable pagination in UI first
        // Only update if:
        // 1. We actually have filtered results
        // 2. API returned next cursor
        if (filteredData.length !== 0 && response?.data?.next_cursor) {
            context.paginationData = response.data.next_cursor;
        }

        // 7. Return results
        return filteredData;

    } catch (error) {
        throw error;
    }
}

// Execute function
return await fetchItems();
```

##### 2. Fetching Updated Items from an API with pagination

```javascript
async function fetchUpdatedItems() {
    try {

        // 1. Calculate lookback time
        const minutesAgo = new Date(__executionStartTime__ - context?.inputData?.scheduledTime * 60 * 1000);

        // 2. Prepare request payload
        let requestPayload = {
            key: "value",
            sorts: [
                {
                    timestamp: "last_edited_time", // The property to sort by
                    direction: "descending" // Sort by latest first
                }
            ]
        };

        // -----------------------------------
        // OPTIONAL PAGINATION (Generic)
        // -----------------------------------
        // User need to enable pagination in UI first
        if (context?.paginationData) {
            requestPayload.cursor = context.paginationData;
        }

        // 3. Configure API request
        const requestConfig = {
            method: "POST",               // Can be GET or POST
            url: "https://api.service.com/updated-endpoint",
            data: requestPayload,         // Use "params" instead if GET
            headers: {
                "API-Version": "v1"
            }
        };

        // 4. Execute API call
        const response = await axios(requestConfig);

        const allItems = response?.data?.items || [];

        // 5. Filter the results to include those edited in the last scheduled time,
        // and exclude those where created time is the same as edited time
        let filteredData = allItems.filter((item) => {
            const last_edited_time = new Date(item.last_edited_time);
            const created_time = new Date(item.created_time);

            return last_edited_time >= minutesAgo && created_time.getTime() !== last_edited_time.getTime();
        });

        // 6. Sort the filtered data by edited time (oldest first)
        filteredData.sort(
            (a, b) => new Date(a.last_edited_time) - new Date(b.last_edited_time)
        );

        // -----------------------------------
        // OPTIONAL PAGINATION UPDATE
        // -----------------------------------
        // User need to enable pagination in UI first
        // Only update if:
        // 1. We actually have filtered results
        // 2. API returned next cursor
        if (filteredData.length > 0 && response?.data?.next_cursor) {
            context.paginationData = response.data.next_cursor;
        }

        // 7. Return results
        return filteredData;

    } catch (error) {
        throw error;
    }
}

// Execute function
return await fetchUpdatedItems();
```

##### 3. Fetching items with client-side field filtering and page-number pagination
```javascript
async function fetchItemsWithClientFiltering() {
    try {
        const scheduledMinutes = context?.inputData?.scheduledTime || 15;
        const selectedFields = context?.inputData?.formFields || []; // User selected fields from UI
        const pageSize = 50;

        // 1. Calculate time window
        const timeAgo = new Date(__executionStartTime__ - scheduledMinutes * 60 * 1000);

        // 2. Determine which page to fetch (Default to 1 if no saved cursor)
        let currentPage = context?.paginationData || 1;

        // 3. API Request
        const res = await axios({
            method: "GET",
            url: "https://api.service.com/items",
            params: {
                page: currentPage,
                page_size: pageSize
            }
        });

        const orders = res.data || [];
        let finalOrders = [];

        // 4. Process and Filter Data
        if (Array.isArray(orders) && orders.length > 0) {
            
            // Filter raw orders by timestamp first
            const recentOrders = orders.filter(order =>
                order.created_at && new Date(order.created_at) >= timeAgo
            );

            // Map to selected fields
            for (const order of recentOrders) {
                const filteredOrder = {};

                if (selectedFields.length > 0) {
                    for (const field of selectedFields) {
                        // Only add the field if it exists in the order object
                        if (order[field] !== undefined) {
                            filteredOrder[field] = order[field];
                        }
                    }
                    finalOrders.push(filteredOrder);
                } else {
                     // If no fields selected, keep the whole order
                     finalOrders.push(order);
                }
            }
        }

        // 5. Pagination Logic
        // LOGIC UPDATE: 
        // - orders.length >= pageSize: Checks if there is potentially a next page from API.
        // - finalOrders.length !== 0: Checks if THIS page had any relevant data. 
        //   If finalOrders is empty, it means we passed the time window, so we stop.
        if (orders.length >= pageSize && finalOrders.length !== 0) {
            context.paginationData = currentPage + 1;
        }

        // 6. Return Result
        return finalOrders;

    } catch (error) {
        throw error;
    }
}

// Execute function
return await fetchItemsWithClientFiltering();
```

##### 4. Fetching items utilizing Native API query parameters (Most Optimized)
```javascript
async function fetchItemsOptimized() {
    try {
        const scheduledMinutes = context?.inputData?.scheduledTime || 15;
        const selectedFields = context?.inputData?.formFields || []; // User-selected fields
        const pageSize = 50;

        // 1. Calculate time window
        const timeAgo = new Date(__executionStartTime__ - scheduledMinutes * 60 * 1000);
        
        // 2. Format exactly as the API expects (e.g. UTC, ISO-8601 string)
        const timeAgoStr = timeAgo.toISOString().replace('T', ' ').slice(0, 19);

        // 3. Determine which page to fetch (Default to 1 if no saved cursor)
        let currentPage = context?.paginationData || 1;

        // 4. Setup request parameters with native API date filter
        let requestParams = {
            page: currentPage,
            page_size: pageSize,
            created_at_min: timeAgoStr // Utilizing native date filter!
        };

        // Optional: Include native field filter if user selected fields and API supports it
        if (selectedFields.length > 0) {
            requestParams.fields = selectedFields.join(','); 
        }

        // 5. Single API Request
        const res = await axios({
            method: "GET",
            url: "https://api.service.com/items",
            params: requestParams
        });

        const orders = res.data || [];

        // 5. Pagination Logic
        // LOGIC UPDATE: 
        // Because the API handled the time limit filter natively, 
        // if orders.length > 0 it means there are still valid matching records.
        if (orders.length !== 0) {
            context.paginationData = currentPage + 1;
        }

        // 6. Return Result
        return orders;

    } catch (error) {
        throw error;
    }
}

// Execute function
return await fetchItemsOptimized();
```

#### Scheduled Trigger Perform Code Example Code:

##### Example 1: Fetching new items from an API with pagination
- **Service:** Notion
- **Trigger:** New Data Source Item Created
- **Trigger Type:** Scheduled Trigger
- **Code:** Perform Code

```javascript
async function newdatasourceItem() {
    const minutesAgo = new Date(__executionStartTime__ - context?.inputData?.scheduledTime * 60 * 1000); 

    let payload = {
        page_size: 100, // Limit to 100 items per request
    };

    // Pagination start: Use the pagination data if available
    if (context?.paginationData) {
        payload.start_cursor = context.paginationData;
    }

    // Define the config for the axios request
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `https://api.notion.com/v1/data_sources/${context?.inputData?.data_source_id}/query`,
        headers: {
            "Notion-Version": "2025-09-03"
        },
        data: payload,
    };

    try {
        const response = await axios.request(config);

        // Filter the results to include only those created in the last scheduled time
        let filteredData = response.data.results.filter((item) => {
            const createdTime = new Date(item.created_time);
            return createdTime >= minutesAgo;
        });

        // Sort the filtered data by creation time (oldest first)
        filteredData.sort(
            (a, b) => new Date(a.created_time) - new Date(b.created_time)
        );

        // If there are results and a next_cursor, set pagination for the next request
        if (filteredData.length !== 0 && response.data?.next_cursor) {
            context.paginationData = response.data?.next_cursor;
        }

        return filteredData;

    } catch (error) {
        throw error; // Handle errors if any
    }
}

return await newdatasourceItem();
```

##### Example 2: Fetching updated items from an API with pagination
- **Service:** Notion
- **Trigger:** Updated Data Source Item
- **Trigger Type:** Scheduled Trigger
- **Code:** Perform Code

```javascript
async function updatedatasourceItem() {
    const minutesAgo = new Date(__executionStartTime__ - context?.inputData?.scheduledTime * 60 * 1000); 

    let payload = {
        page_size: 100, // Limit to 100 items per request
        sorts: [
            {
                timestamp: "last_edited_time", // The property to sort by
                direction: "descending" // Sort by latest first
            }
        ]
    };

    // Pagination start: Use the pagination data if available
    if (context?.paginationData) {
        payload.start_cursor = context.paginationData;
    }

    // Define the config for the axios request
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `https://api.notion.com/v1/data_sources/${context?.inputData?.data_source_id}/query`,
        headers: {
            "Notion-Version": "2025-09-03"
        },
        data: payload,
    };

    try {
        const response = await axios.request(config);

        // Filter the results to include only those created in the last scheduled time, 
        // and exclude those where created_time is the same as last_edited_time
        let filteredData = response.data.results.filter((item) => {
            const last_edited_time = new Date(item.last_edited_time);
            const created_time = new Date(item.created_time);

            // Exclude items where created_time is the same as last_edited_time
            return last_edited_time >= minutesAgo && created_time.getTime() !== last_edited_time.getTime();
        });

        // Sort the filtered data by last_edited_time (oldest first)
        filteredData.sort(
            (a, b) => new Date(a.last_edited_time) - new Date(b.last_edited_time)
        );

        // If there are results and a next_cursor, set pagination for the next request
        if (filteredData.length > 0 && response.data?.next_cursor) {
            context.paginationData = response.data?.next_cursor;
        }

        return filteredData;

    } catch (error) {
        throw error; // Handle errors if any
    }
}

return await updatedatasourceItem();
```
##### Example 3: Fetching items with client-side field filtering and page-number pagination
- **Service:** Veeqo
- **Trigger:** New Order Created
- **Trigger Type:** Scheduled Trigger
- **Code:** Perform Code

```javascript
try {
  const scheduledMinutes = context?.inputData?.scheduledTime || 15;
  const selectedFields = context?.inputData?.cxGsrrwn || [];
  const pageSize = 50;

  // 1. Calculate time window
  const timeAgo = new Date(__executionStartTime__ - scheduledMinutes * 60 * 1000);

  // 2. Determine which page to fetch (Default to 1 if no saved cursor)
  let currentPage = context?.paginationData || 1;

  // 3. Single API Request
  const res = await axios.get('https://api.veeqo.com/orders', {
    params: {
      page: currentPage,
      page_size: pageSize
    }
  });

  const orders = res.data || [];
  let finalOrders = [];

  // 4. Process and Filter Data
  if (Array.isArray(orders) && orders.length > 0) {
    
    // Filter raw orders by timestamp first
    const recentOrders = orders.filter(order =>
      order.created_at && new Date(order.created_at) >= timeAgo
    );

    // Map to selected fields
    for (const order of recentOrders) {
      const filteredOrder = {};

      if (selectedFields.length > 0) {
        for (const field of selectedFields) {
          // Only add the field if it exists in the order object
          if (order[field] !== undefined) {
            filteredOrder[field] = order[field];
          }
        }
        finalOrders.push(filteredOrder);
      } else {
         // If no fields selected, keep the whole order
         finalOrders.push(order);
      }
    }
  }

  // 5. Pagination Logic
  // LOGIC UPDATE: 
  // - orders.length >= pageSize: Checks if there is potentially a next page from API.
  // - finalOrders.length !== 0: Checks if THIS page had any relevant data. 
  //   If finalOrders is empty, it means we passed the time window, so we stop.
  if (orders.length >= pageSize && finalOrders.length !== 0) {
    context.paginationData = currentPage + 1;
  }

  // 6. Return Result
  return finalOrders;

} catch (error) {
  throw error;
}
```

##### Example 4: Using Native API Date Filtering
- **Service:** Veeqo
- **Trigger:** New Order Created
- **Trigger Type:** Scheduled Trigger
- **Code:** Perform Code

```javascript
try {
  const scheduledMinutes = context?.inputData?.scheduledTime || 15;
  const pageSize = 50;

  // 1. Calculate time window
  const timeAgo = new Date(__executionStartTime__ - scheduledMinutes * 60 * 1000);
  //Format exactly as the API expects (UTC, matches created_at response format)
  const timeAgoStr = timeAgo.toISOString().replace('T', ' ').slice(0, 19);

  // 2. Determine which page to fetch (Default to 1 if no saved cursor)
  let currentPage = context?.paginationData || 1;

  // 3. Single API Request
  const res = await axios.get('https://api.veeqo.com/orders', {
    params: {
      page: currentPage,
      page_size: pageSize,
      created_at_min: timeAgoStr   
    }
  });

  const orders = res.data || [];


  // 5. Pagination Logic
  // LOGIC UPDATE: 
  //   If finalOrders is empty, it means we passed the time window, so we stop.
    if (orders.length != 0) {
    context.paginationData = currentPage + 1;
  }

  // 6. Return Result
  return orders;

} catch (error) {
  throw error;
}
```

### Schedule Trigger Sample Code:

#### Schedule Trigger Sample Code Rules:

Always follow these rules while creating a sample code for the Schedule Trigger:
1. Get the latest 1 item or any one item.
2. If an item exists, return it with the help text
3. If no items exist, fetch the schema to dynamically build the fallback
4. Map the exact schema properties to empty/default values
5. Return the dynamic fallback item with an exact matching structure

#### Schedule Trigger Sample Pseudo Code:

**Fetch the latest 1 item or any item or fallback structure**
```javascript
try {
  // 1. Fetch exactly 1 latest item from the API
  const response = await axios({
    method: "GET", // or POST depending on the API
    url: "https://api.service.com/endpoint",
    params: {
      limit: 1,           // Request only 1 item
      sort: "descending"  // Get the latest item
    }
  });

  const items = response?.data?.items || [];

  // 2. If an item exists, return it with the help text
  if (items.length > 0) {
    return {
      viasocket_help: "This is the latest item data available in the selected resource. Save the Trigger and publish to get the new item created in the selected resource.",
      ...items[0]
    };
  }

  // 3. If no items exist, build a fallback

  // --- Option A: Dynamic fallback using schema (when API provides a schema endpoint) ---
  const schemaResponse = await axios({
    method: "GET",
    url: "https://api.service.com/schema-endpoint"
  });

  const schema = schemaResponse?.data;
  const dummyProperties = {};

  // 4. Map the exact schema properties to empty/default values
  for (const [key, propConfig] of Object.entries(schema.properties)) {
    const type = propConfig.type;

    if (['array', 'list', 'multi_select'].includes(type)) {
      dummyProperties[key] = [];
    } else if (type === 'boolean') {
      dummyProperties[key] = false;
    } else if (type === 'number') {
      dummyProperties[key] = 0;
    } else {
      dummyProperties[key] = ""; // Default for strings, objects, or nulls
    }
  }

  // 5. Return the dynamic fallback item with an exact matching structure
  return {
    viasocket_help: "This data is only a sample of the original data. If you want to see the original data, then you have to save the trigger, publish the flow and perform the given action.",
    id: "dummy-record-id",
    created_time: new Date().toISOString(),
    properties: dummyProperties
  };

  // --- Option B: Hardcoded fallback (when API has no schema endpoint) ---
  // return {
  //   viasocket_help: "This data is only a sample of the original data. If you want to see the original data, then you have to perform the given action.",
  //   id: 123456789,
  //   title: "Sample Item",
  //   status: "active",
  //   created_at: new Date().toISOString()
  // };

} catch (error) {
  throw error;
}
```

#### Schedule Trigger Sample Example Code:

**Example 1: Fetching only the latest item from the data source or fallback with schema**
- **Service:** Notion
- **Trigger:** New Data Source Item Created
- **Trigger Type:** Scheduled Trigger
- **Code:** Sample Code

```javascript
// 1. Query the Data Source for an item
let queryConfig = {
  method: 'post',
  maxBodyLength: Infinity,
  url: `https://api.notion.com/v1/data_sources/${context?.inputData?.data_source_id}/query`,
  headers: {
    "Notion-Version": "2026-03-11"
  },
  data: {
    page_size: 1
  }
};

const response = await axios.request(queryConfig);

// 2. If an item exists, return it with the help text
if (response.data.results && response.data.results.length > 0) {
  const result = response.data.results[0];
  
  return {
    viasocket_help: "This is the latest item data available in the selected notion data source. Save the Trigger and publish to get the new item created in the selected data source.",
    ...result
  };
} 

// 3. If no items exist, fetch the schema to dynamically build the fallback
let schemaConfig = {
  method: 'get',
  maxBodyLength: Infinity,
  url: `https://api.notion.com/v1/data_sources/${context?.inputData?.data_source_id}`,
  headers: {
    "Notion-Version": "2026-03-11"
  }
};

const schemaResponse = await axios.request(schemaConfig);
const dataSourceSchema = schemaResponse.data;

const dummyProperties = {};

// 4. Map the exact schema properties to empty/default values
for (const [key, propConfig] of Object.entries(dataSourceSchema.properties)) {
  const type = propConfig.type;
  let emptyValue = null;
  
  // Assign appropriate empty data types based on the Notion property type
  if (['title', 'rich_text', 'relation', 'people', 'files', 'multi_select'].includes(type)) {
    emptyValue = [];
  } else if (type === 'checkbox') {
    emptyValue = false;
  } else if (type === 'formula') {
    emptyValue = { type: "string", string: "" }; 
  } else if (type === 'rollup') {
    emptyValue = { type: "number", number: 0 };
  }
  
  dummyProperties[key] = {
    id: propConfig.id,
    type: type,
    [type]: emptyValue
  };
}

// 5. Construct and return the dynamic fallback item with an exact matching structure
return {
  viasocket_help: "This data is only a sample of the original data. If you want to see the original data, then you have to save the trigger, publish the flow and perform the given action.",
  object: "page",
  id: "dummy-page-id",
  created_time: new Date().toISOString(),
  last_edited_time: new Date().toISOString(),
  created_by: {
    object: "user",
    id: "dummy-user-id"
  },
  last_edited_by: {
    object: "user",
    id: "dummy-user-id"
  },
  cover: null,
  icon: null,
  parent: {
    type: "data_source_id",
    data_source_id: context?.inputData?.data_source_id,
    database_id: dataSourceSchema.id || context?.inputData?.data_source_id
  },
  in_trash: false,
  is_archived: false,
  is_locked: false,
  properties: dummyProperties,
  url: "https://www.notion.so/dummy-page-id",
  public_url: null
};
```
**Example 2: Fetching only the latest sheet from the Google Sheets or fallback with schema**
- **Service:** Google Sheets
- **Trigger:** New Worksheet Added to Spreadsheet
- **Trigger Type:** Scheduled Trigger
- **Code:** Sample Code

```javascript
const spreadsheetId = context?.inputData?.spreadSheet_id;

try {
  // Use the Google Sheets API to get the tabs within the specific spreadsheet
  const response = await axios.get(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
    {
      params: {
        // Request only the properties of the sheets to keep the payload efficient
        fields: "sheets(properties(sheetId,title,index,sheetType,gridProperties))"
      }
    }
  );

  let sheets = response.data.sheets || [];

  if (sheets.length > 0) {
    // Sort by index descending to get the "latest" (right-most) tab
    sheets.sort((a, b) => b.properties.index - a.properties.index);
    
    // Extract the properties of that latest sheet
    const latestSheet = sheets[0].properties;

    // Create a new object with the specific "viasocket_help" message for REAL data
    const resultWithHelp = {
      viasocket_help: "This is the worksheet present in the selected Google Spreadsheet. Save the trigger and publish the flow to receive the new worksheets.",
      ...latestSheet
    };

    return resultWithHelp;
  } else {
    // Return Hardcoded DUMMY Sample Data if NO sheet is found
    return {
      "viasockethelp": "This data is only a sample of the original data. If you want to see the original data, then you have to perform the given action.",
      "sheetId": 123456789,
      "title": "Sample Worksheet",
      "index": 2,
      "sheetType": "GRID",
      "gridProperties": {
        "rowCount": 1000,
        "columnCount": 26
      }
    };
  }

} catch (error) {
  throw error;
}
```
## Manual Trigger

**What it does**
Fires in real-time when an event occurs in the external service via a webhook. The external service pushes data directly to viaSocket the moment something happens.

**Simple understanding**
- Real-time, event-driven updates.
- The external service sends data to viaSocket via a webhook URL.
- Example: New form submission → Webhook fires → Workflow runs immediately.

**When to use**
- When the external service supports webhooks that can be copied from the UI and pasted in the trigger configuration of the external service.
- When real-time, immediate data processing is required.

### Manual Trigger Perform Code Rules:
- Manual Triggers has **no API call** supports Perform code (Optional: Modify data before sending it to the workflow).
- No scheduling logic, no `__executionStartTime__`, no pagination state.

### Manual Trigger Perform Code Pseudo Code:
```
async (context) => {
  try {
    // Step 1: Read input data from UI form
    const inputValue = context.inputData.<input_key>;
    const resourceId = context.inputData.<resource_key>;

    // Step 2: Make the API request
    const response = await axios({
      url: `<api_base_url>/<endpoint>`,
      method: 'GET', // or POST depending on the action
      headers: {
        'Content-Type': 'application/json'
      },
      params: {
        // Map input data to query params if needed
      }
    });

    // Step 3: Return the response
    return response.data;

  } catch (error) {
    throw error;
  }
}
```

### Manual Trigger Sample Code Pseudo Code:
```
async (context) => {
  try {
 // Actual Trigger Sample Schema
    return [{ id: 'sample_id', name: 'Sample', created_at: new Date().toISOString() }];

  } catch (error) {
    throw error;
  }
}
```

# Actions

Actions perform operations on external services. Each action category has specific perform code patterns.

## Action Perform Code Rules:
- All action perform code must be wrapped in `async (context) => { try { ... } catch (error) { throw error; } }`.
- Read all user inputs from `context.inputData.<key>`.
- Use `axios()` for all HTTP requests.
- Auth tokens come from `context.authData.<auth_key>`.
- Always return the meaningful part of the API response (not the raw HTTP response wrapper).
- Handle errors gracefully — provide actionable error messages when possible.
- **Required Field Validation**: For every input field defined with `required: true` in the input fields JSON, the perform code **must** validate the value at the top of the function — before making any API call. If the value is missing, empty, `null`, or `undefined`, throw an error immediately. Example:
  ```javascript
  if (!context.inputData.date) {
    throw new Error('Date is required.');
  }
  ```

## GET

### GET Perform Code Rules:
- Use `GET` HTTP method with the record ID in the URL path.
- Return the single record object directly.
- Handle 404 (record not found) with a clear error message only if the service does not return the data properly. If the user provides invalid id then it will return 404, which is expected behavior.

### GET Perform Code Pseudo Code:
```
async (context) => {
  try {
    // Step 1: Read the record ID from input
    const recordId = context.inputData.<record_id_key>;

    // Step 2: Make GET request
    const response = await axios({
      url: `<api_base_url>/<resource>/${recordId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Step 3: Return the record
    return response.data;

  } catch (error) {
    throw error;
  }
}
```

## LIST

### LIST Perform Code Rules:
- Use `GET` HTTP method with query parameters for pagination and filtering.
- Support pagination via cursor tokens, page numbers, or offset values.
- Read pagination inputs from `context.inputData` (e.g., `page_limit`, `start_cursor`).
- Return an array of records.
- If no results, return an empty array `[]`.
- If the API does not provide the proper structure then the format should be `{success: true/false, data:[], pagination:{...}}`. `pagination` object can contain information like `{has_more: true, next_cursor: 'cursor', page_number: 1, has_previous: false, previous_cursor: null, has_next: true}`. If the sevice only provide only array of records in response then the response can be modified to fit the format. `success` key should be added as boolean to the response object.

### LIST Perform Code Pseudo Code:
```
async (context) => {
  try {
    // Step 1: Read pagination and filter inputs
    const pageLimit = context.inputData.page_limit || 100;
    const startCursor = context.inputData.start_cursor || undefined;

    // Step 2: Build query params
    const params = {
      limit: pageLimit,
    };
    if (startCursor) params.start_cursor = startCursor;

    // Step 3: Make GET request
    const response = await axios({
      url: `<api_base_url>/<resource>`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      params
    });

    // Step 4: Return results array
    return response.data?.results || response.data || [];

  } catch (error) {
    throw error;
  }
}
```

## FIND/SEARCH

### FIND/SEARCH Perform Code Rules:
- Use `GET` or `POST` HTTP method depending on the API's search endpoint.
- Support both Basic (single field exact match) and Advanced (multi-field query) modes.
- Read the search mode from a Boolean input field.
- For Basic mode: filter by a single column/field with an exact match value.
- For Advanced mode: pass a structured filter/query object (often AI-generated).
- Apply client-side filtering if the API does not support native search.
- Return matching records as an array.

### FIND/SEARCH Perform Code Pseudo Code:
```
async (context) => {
  try {
    // Step 1: Read search inputs
    const resourceId = context.inputData.<resource_key>;
    const isBasicMode = context.inputData.filter_type; // Boolean: true = Basic, false = Advanced
    const lookupColumn = context.inputData.lookup_column;
    const lookupValue = context.inputData.lookup_value;
    const advancedFilter = context.inputData.advanced_filter; // AI-generated filter object
    const resultLimit = context.inputData.row_count || 10;

    let results = [];

    if (isBasicMode) {
      // Step 2a: Basic mode — fetch and filter client-side (if API lacks native search)
      const response = await axios({
        url: `<api_base_url>/<resource>/${resourceId}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const allRecords = response.data?.results || response.data || [];

      // Client-side exact match filter
      results = allRecords.filter(record => {
        const fieldValue = record[lookupColumn];
        return String(fieldValue) === String(lookupValue);
      });

    } else {
      // Step 2b: Advanced mode — pass structured filter to API
      const filterObject = typeof advancedFilter === 'string' ? JSON.parse(advancedFilter) : advancedFilter;

      const response = await axios({
        url: `<api_base_url>/<resource>/${resourceId}/query`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: { filter: filterObject }
      });

      results = response.data?.results || response.data || [];
    }

    // Step 3: Apply result limit
    return results.slice(0, resultLimit);

  } catch (error) {
    throw error;
  }
}
```

## CREATE

### CREATE Perform Code Rules:
- Use `POST` HTTP method to create new records.
- Map input fields from `context.inputData.<key>` to the API payload structure.
- For dynamic input groups (schema-based fields), iterate over the input keys and build the payload object.
- Normalize keys if they were modified during input field generation (e.g., dots replaced with underscores).
- Return the newly created record.

### CREATE Perform Code Pseudo Code:
```
async (context) => {
  try {
    // Step 1: Read input data
    const parentResourceId = context.inputData.<parent_key>;

    // Step 2: Build the payload from dynamic input fields
    const payload = {};
    // Map each input field to the API's expected structure
    // Example: context.inputData.field_name → payload.properties.field_name.value
    const fieldKeys = Object.keys(context.inputData).filter(key => {
      // Filter out non-payload keys (resource selectors, config toggles)
      return !['<parent_key>', '<config_keys>'].includes(key);
    });

    for (const key of fieldKeys) {
      const value = context.inputData[key];
      if (value !== undefined && value !== '' && value !== null) {
        // Reverse key normalization if needed (e.g., underscores back to dots)
        const originalKey = key.replace(/_/g, '.');
        payload[originalKey] = value;
      }
    }

    // Step 3: Make POST request
    const response = await axios({
      url: `<api_base_url>/<resource>/${parentResourceId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: payload
    });

    // Step 4: Return the created record
    return response.data;

  } catch (error) {
    throw error;
  }
}
```

## UPDATE

### UPDATE Perform Code Rules:
- Use `PUT`, `PATCH`, or `POST` HTTP method depending on the API.
- Include the record ID in the URL path.
- Only send fields that the user has provided values for (partial update).
- Skip empty, undefined, or null values unless explicitly intended.
- Return the updated record.

### UPDATE Perform Code Pseudo Code:
```
async (context) => {
  try {
    // Step 1: Read the record ID and parent resource
    const parentResourceId = context.inputData.<parent_key>;
    const recordId = context.inputData.<record_id_key>;

    // Step 2: Build partial update payload (only non-empty fields)
    const payload = {};
    const fieldKeys = Object.keys(context.inputData).filter(key => {
      return !['<parent_key>', '<record_id_key>', '<config_keys>'].includes(key);
    });

    for (const key of fieldKeys) {
      const value = context.inputData[key];
      if (value !== undefined && value !== '' && value !== null) {
        payload[key] = value;
      }
    }

    // Step 3: Make PATCH/PUT request
    const response = await axios({
      url: `<api_base_url>/<resource>/${parentResourceId}/<records>/${recordId}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      data: payload
    });

    // Step 4: Return the updated record
    return response.data;

  } catch (error) {
    throw error;
  }
}
```

## FIND OR CREATE

### FIND OR CREATE Perform Code Rules:
- Combine a **search request** followed by a **conditional create request**.
- First, execute the search logic (same as FIND/SEARCH).
- If results are found, return the first matching record.
- If no results are found AND the user opted into "Create if not found", execute the create logic (same as CREATE).
- Return the found or newly created record with a flag indicating which action was taken.

### FIND OR CREATE Perform Code Pseudo Code:
```
async (context) => {
  try {
    // Step 1: Read search inputs
    const resourceId = context.inputData.<resource_key>;
    const lookupColumn = context.inputData.lookup_column;
    const lookupValue = context.inputData.lookup_value;
    const createIfNotFound = context.inputData.create_if_not_found;

    // Step 2: Search for existing record
    const searchResponse = await axios({
      url: `<api_base_url>/<resource>/${resourceId}/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        filter: { property: lookupColumn, value: lookupValue }
      }
    });

    const results = searchResponse.data?.results || searchResponse.data || [];

    // Step 3: If found, return the first match
    if (results.length > 0) {
      return { ...results[0], __action_taken: 'found' };
    }

    // Step 4: If not found and create enabled, create new record
    if (createIfNotFound) {
      const createPayload = {};
      // Build payload from create-specific input fields
      const createKeys = Object.keys(context.inputData).filter(key => {
        return !['<resource_key>', 'lookup_column', 'lookup_value', 'create_if_not_found', '<config_keys>'].includes(key);
      });

      for (const key of createKeys) {
        const value = context.inputData[key];
        if (value !== undefined && value !== '' && value !== null) {
          createPayload[key] = value;
        }
      }

      const createResponse = await axios({
        url: `<api_base_url>/<resource>/${resourceId}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: createPayload
      });

      return { ...createResponse.data, __action_taken: 'created' };
    }

    // Step 5: Not found and create not enabled
    return { message: 'No matching record found.', __action_taken: 'not_found' };

  } catch (error) {
    throw error;
  }
}
```

## DELETE

### DELETE Perform Code Rules:
- Use `DELETE` HTTP method with the record ID in the URL path.
- Some services use `PATCH` or `POST` for archiving instead of hard deletion. Use the appropriate method.
- Return a confirmation object with the deleted record's ID.
- Handle 404 (already deleted) gracefully.

### DELETE Perform Code Pseudo Code:
```
async (context) => {
  try {
    // Step 1: Read the record ID
    const parentResourceId = context.inputData.<parent_key>;
    const recordId = context.inputData.<record_id_key>;

    // Step 2: Make DELETE request
    const response = await axios({
      url: `<api_base_url>/<resource>/${parentResourceId}/<records>/${recordId}`,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Step 3: Return confirmation
    return response.data || { id: recordId, deleted: true };

  } catch (error) {
    throw error;
  }
}
```

# Special Note:

## Special Note - API Request Error Handling:

- Use try-catch blocks to handle errors gracefully.
- Provide meaningful error messages to the user.
- Always in catch block, catch the error and throw it. Do not return the error.
- Some of the services return error with response 200. Those need to be thrown in the -try block of the perform code and caught there and thrown. This is to avoid the false error in the viaSocket UI for the user.
- viaSocket will identify the error based on the final response code return.
- Don't modify the error message in the catch block. Just throw the error. Let the viaSocket handle the error message.

## Special Note - Success Code Handling:

- Return the data as it is. Don't modify it.
- Don't add any additional fields to the response. Just return the data.
- The actual data of the response is in the `data` property of the response object. Which looks like `{ data: { ... } }`. So, return `response.data`.

## Special Note - Final Code Review:
- Don't use any console.log() in the perform code.
- Don't modify the error response. Just throw the error.
- No need to use the authentication configuration in the perform code. It will be handled by viaSocket. The authentication can be passed through header, query parameter or body, these are aleady configured in backend while the API call is made. Can include the additional header/query parameter/body if needed for the API call.
- **Required Field Validation**: Always throw an error before the API call if a required input field is missing. Do not silently pass `undefined` or `null` to the API for required fields.

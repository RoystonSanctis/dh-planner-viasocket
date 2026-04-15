# Perform Code Knowledge Base

This document contains knowledge, snippets, and best practices for writing robust JavaScript perform code for viaSocket plug actions.

# Trigger

## Trigger Code Generation Rules:

## Instant Trigger

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
        const response = await httpRequest(requestConfig);

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
        const response = await httpRequest(requestConfig);

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
        const res = await httpRequest({
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
        const res = await httpRequest({
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

#### Schedule Trigger Sample Pseudo Code:

```javascript

```
#### Schedule Trigger Sample Example Code:
```javascript

```

## Manual Trigger

# Actions
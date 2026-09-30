// mock.mjs — node mock.mjs <snippet.js> [input.json] [response.json] [components.js = mapped function_code] → requests + return
import { readFileSync } from 'node:fs'
const [snippet, input, response, components] = process.argv.slice(2)
const read = (f, fallback) => (f ? readFileSync(f, 'utf8') : fallback)
const calls = []
const axios = async (config) => (calls.push(config), { status: 200, data: JSON.parse(read(response, '{}')) })
for (const m of ['get', 'delete']) axios[m] = (url, config) => axios({ ...config, method: m, url })
for (const m of ['post', 'put', 'patch']) axios[m] = (url, data, config) => axios({ ...config, method: m, url, data })
axios.request = axios
const context = { inputData: JSON.parse(read(input, '{}')), authData: {}, paginateData: {}, paginationData: null, req: { body: {} } }
const errorComponent = async (error) => { throw error }
const source = `${read(components, '')}\n${read(snippet)}`
const run = new (async () => {}).constructor('context', 'axios', 'errorComponent', '__searchText', '__executionStartTime__', source)
const result = await run(context, axios, errorComponent, '', new Date().toISOString()).catch((e) => ({ THREW: e?.message || e }))
console.log(JSON.stringify({ calls, result }, null, 2))

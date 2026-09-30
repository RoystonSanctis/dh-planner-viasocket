// dh.mjs — Developer Hub REST client. Config: .dh-run/config.json { apiBase, orgId, token } (written once per run).
// CLI: node dh.mjs METHOD 'path?query' ['{json}' | @body.json] · module: import { dh, config } from './dh.mjs'
import { readFileSync, appendFileSync, mkdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export const config = JSON.parse(readFileSync('.dh-run/config.json', 'utf8'))
const headers = { proxy_auth_token: config.token, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' }

// path is relative to <apiBase>/developers/<orgId>/ unless it starts with '/', then relative to <apiBase>
export async function dh(method, path, body) {
  const url = path.startsWith('/') ? `${config.apiBase}${path}` : `${config.apiBase}/developers/${config.orgId}/${path}`
  const payload = body === undefined || typeof body === 'string' ? body : JSON.stringify(body)
  const res = await fetch(url, { method, headers, body: payload })
  const text = await res.text()
  mkdirSync('.dh-run', { recursive: true })
  appendFileSync('.dh-run/log.jsonl', `${JSON.stringify({ time: new Date().toISOString(), method, path, status: res.status })}\n`)
  let json
  try { json = JSON.parse(text) } catch {}
  if (!res.ok || json?.success === false) throw new Error(`${method} ${path} → ${res.status} ${text.slice(0, 800)}`)
  return json ?? text
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [method, path, raw] = process.argv.slice(2)
  try {
    console.log(JSON.stringify(await dh(method, path, raw?.startsWith('@') ? readFileSync(raw.slice(1), 'utf8') : raw)))
  } catch (error) {
    console.log(error.message)
    process.exit(1)
  }
}

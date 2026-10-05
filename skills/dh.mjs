// dh.mjs — Developer Hub REST client + GitHub KB reader shared by skills/SKILL-*.md.
// Setup: download next to .dh-run/config.json { apiBase, orgId, token, skill, kbRepo?, kbRef? }.
//   node dh.mjs GET '<path>' [key,key]                   read; only those keys of each row; retried once (network / 5xx)
//   node dh.mjs POST|PUT|PATCH '<path>' '{json}'|@file   write (syntax-checks code first; create/* adds aiLogs)
//   node dh.mjs MERGE 'update/<plugins|actions>?identifier=<id>&filter=…' '{changes}'   keep metadata, deep-merge aiContext, append aiLogs
//   node dh.mjs COPY 'get/<oauth_details|action_version>?identifier=<parentId>&filter=<f>' '{"rowid":"<id>",…changes}'
//   node dh.mjs batch @ops.json                          [{ label, method, path, body?, keys? }], 4 in parallel
//   node dh.mjs kb [file] ["Heading"… | '*']             knowledge-base/ files · headings · sections · whole file
// Paths are relative to <apiBase>/developers/<orgId>/; a leading / is relative to <apiBase>.
import { readFileSync, appendFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'

const cfg = JSON.parse(readFileSync('.dh-run/config.json', 'utf8'))
const headers = { proxy_auth_token: cfg.token, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' }
const now = () => new Date().toISOString()
const entry = (by, note) => ({ by, time: now(), skill: cfg.skill, ...(note ? { note } : {}) })
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
const deep = (a, b) => (isObj(a) && isObj(b) ? Object.fromEntries([...new Set([...Object.keys(a), ...Object.keys(b)])].map((k) => [k, k in b ? deep(a[k], b[k]) : a[k]])) : b)
const obj = (v) => (typeof v === 'string' ? JSON.parse(v || '{}') : v || {})
const src = (v) => (v && typeof v === 'object' ? v.source : typeof v === 'string' && v.trim().startsWith('{') ? JSON.parse(v).source : v) ?? null
const CODE = ['perform', 'performlist', 'performsubscribe', 'performunsubscribe', 'modifytriggerdata', 'transferoption', 'code']
const AUTH = ['testcode', 'accesstokencode', 'refreshtokencode', 'revokeapicode']
const GEN = ['optionsGenerator', 'fieldsGenerator', 'source', 'suggestionGenerator']
const GET_BY_ID = { plugins: 'getPluginDetails', actions: 'getActionDetails' }
const AsyncFunction = (async () => {}).constructor
const DROP = ['rowid', 'autonumber', 'createdat', 'updatedat', 'createdby', 'updatedby', 'created_by', 'updated_by', 'metadata']
const COPY = {
  oauth_details: { ver: 'authversion', drop: ['pluginname', 'pluginiconurl', 'domain', 'isencrypted', 'clientsecret'] },
  action_version: { ver: 'version', drop: ['version', 'versionid', 'status', 'isdeleted', 'actionversionrecordid', 'publishdescription'], add: (actionid) => ({ actionid, status: 'drafted' }) },
}

async function call(method, path, body, retry = method === 'GET') {
  const url = path.startsWith('/') ? cfg.apiBase + path : `${cfg.apiBase}/developers/${cfg.orgId}/${path}`
  let res, text
  try {
    res = await fetch(url, { method, headers, body: body === undefined || typeof body === 'string' ? body : JSON.stringify(body) })
    text = await res.text()
  } catch (e) {
    if (retry) return call(method, path, body, false)
    throw { error: `${e?.message || e}` }
  }
  mkdirSync('.dh-run', { recursive: true })
  appendFileSync('.dh-run/log.jsonl', `${JSON.stringify({ time: now(), method, path, status: res.status })}\n`)
  if (retry && res.status >= 500) return call(method, path, body, false)
  let json
  try { json = JSON.parse(text) } catch {}
  if (!res.ok || json?.success === false) {
    const msg = json?.message || json?.error || (typeof json === 'object' ? JSON.stringify(json) : text.slice(0, 600))
    throw { error: `${method} ${path} → ${res.status}: ${msg}` }
  }
  return json?.data !== undefined ? json.data : (json ?? text)
}

function compile(b) {
  const check = (where, code, Fn = AsyncFunction) => {
    if (typeof code !== 'string' || !code.trim()) return
    try { new Fn('context', 'axios', code) } catch (e) { throw { error: `syntax error in ${where}: ${e?.message || e}` } }
  }
  CODE.forEach((k) => check(k, b[k]))
  AUTH.forEach((k) => check(k, src(b[k])))
  const walk = (fields) => (fields || []).forEach((f) => (GEN.forEach((g) => check(`${f.key}.${g}`, f[g])), walk(f.fields)))
  walk(b.inputjson?.inputFields)
  const ap = b.authenticationpaths || {}
  for (const p of [...(ap.headers || []), ...(ap.queryParams || []), ...(ap.body || [])]) {
    if (!/\breturn\b/.test(p?.value || '')) throw { error: `authenticationpaths ${p?.name}: value must be a function body that returns` }
    try { check(`authenticationpaths ${p.name}`, p.value, Function) } catch (e) { throw { error: `${e?.message || e}` } }
  }
}

async function run({ method, path, body, keys }) {
  try {
    if (!/^(GET|POST|PUT|PATCH|MERGE|COPY)$/.test(method || '')) throw new Error(`unknown method "${method}"`)
    if (!path) throw new Error(`${method}: missing '<path>'`)
    if (method === 'GET') {
      if (typeof keys === 'string' && /^\s*[{[]/.test(keys)) throw new Error('GET takes a comma-separated key list, not a body')
      const ks = (typeof keys === 'string' ? keys.split(',') : keys || []).map((k) => String(k).trim()).filter(Boolean)
      const r = await call('GET', path)
      const rows = Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : Array.isArray(r?.rows) ? r.rows : Array.isArray(r?.data?.rows) ? r.data.rows : null
      return ks.length && rows ? rows.map((row) => Object.fromEntries(ks.map((k) => [k, row?.[k]]))) : r
    }
    if (method === 'MERGE') {
      const [, table, id] = path.match(/^update\/(\w+)\?identifier=([^&]+)/) || []
      if (!GET_BY_ID[table]) throw new Error('MERGE supports update/plugins and update/actions')
      const res = await call('GET', `get/${table}?identifier=${id}&filter=${GET_BY_ID[table]}`)
      const current = (Array.isArray(res) ? res[0] : res?.data?.[0] || res) || {}
      const meta = obj(current.metadata)
      const { note, by, metadata, ...changes } = body || {}
      const aiContext = metadata?.aiContext ? { aiContext: { ...deep(meta.aiContext || {}, metadata.aiContext), updatedAt: now() } } : {}
      return call('PUT', path, { ...changes, metadata: { ...meta, ...metadata, ...aiContext, aiLogs: [...(meta.aiLogs || []), entry(by || 'UPDATED_BY_SKILL_AI', note)] } })
    }
    if (method === 'COPY') {
      const [, table, parent] = path.match(/^get\/(\w+)\?identifier=([^&]+)/) || []
      const spec = COPY[table]
      if (!spec) throw new Error(`COPY supports get/${Object.keys(COPY).join(', get/')}`)
      const { rowid, ...changes } = body || {}
      const res = await call('GET', path)
      const list = Array.isArray(res) ? res : res?.data || []
      const source = list.find((r) => r?.rowid === rowid)
      if (!source) throw new Error(`COPY: no ${table} row ${rowid} in ${path}`)
      const copy = Object.fromEntries(Object.entries(source).filter(([k]) => !DROP.includes(k) && !spec.drop.includes(k)))
      return run({ method: 'POST', path: `create/${table}`, body: { ...copy, ...spec.add?.(parent), ...changes, metadata: { ...changes.metadata, duplicatedfrom: { rowid, [spec.ver]: source[spec.ver] } } } })
    }
    if (body && typeof body === 'object') {
      compile(body)
      if (path.includes('oauth_details')) {
        AUTH.forEach((k) => { if (k in body) body[k] = JSON.stringify({ source: src(body[k]) || null }) })
        if (body.queryparams && typeof body.queryparams === 'object') body.queryparams = JSON.stringify(body.queryparams)
      }
      if (method === 'POST' && path.startsWith('create/') && !path.includes('component_table')) {
        const m = (body.metadata = obj(body.metadata))
        m.aiLogs = [...(m.aiLogs || []), entry('CREATED_BY_SKILL_AI')]
        if (path.startsWith('create/plugins')) m.createdBy ??= { type: 'AI', agent: 'ai', skill: cfg.skill, orgId: cfg.orgId, time: now() }
      }
    }
    const r = await call(method, path, body)
    const row = r?.actionData?.[0] || r?.data?.actionData?.[0] || (Array.isArray(r) ? r[0] : r?.data?.[0] || (r?.rowid ? r : null))
    if (method === 'POST' && path.startsWith('create/actions')) {
      const actionVerData = r?.actionVersionData?.data?.[0] || r?.data?.actionVersionData?.data?.[0] || r?.actionVersionData?.[0]
      const ids = { actionId: row?.rowid, versionId: actionVerData?.rowid }
      if (!ids.actionId || !ids.versionId) throw new Error(`created but no ids returned — check getAllActions before retrying: ${JSON.stringify(r).slice(0, 300)}`)
      try {
        await run({ method: 'MERGE', path: `update/actions?identifier=${ids.actionId}&filter=updateActionDetails`, body: { isaiaction: true, aiorgid: cfg.orgId, by: 'CREATED_BY_SKILL_AI', note: 'isaiaction set' } })
      } catch (e) {
        ids.warning = `created; isaiaction not set — rerun only that MERGE: ${e?.error || e?.message || String(e).slice(0, 200)}`
      }
      return ids
    }
    return row?.rowid ? { id: row.rowid, ...(row.authversion ? { authversion: row.authversion } : {}) } : (r?.data !== undefined ? r.data : r)
  } catch (e) {
    throw { error: `${e?.error || e?.message || e}` }
  }
}

// GitHub KB: kb → files · kb <file> → headings · kb <file> "Heading"… → sections · kb <file> '*' → whole file
const REPO = cfg.kbRepo || 'RoystonSanctis/dh-planner-viasocket'
const REF = cfg.kbRef || 'dev'
async function fetchText(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
    return await res.text()
  } catch (e) {
    throw { error: `${e?.error || e?.message || e}` }
  }
}
async function kb(file, queries) {
  try {
    if (!file) return [...new Set([...(await fetchText(`https://github.com/${REPO}/tree/${REF}/knowledge-base`)).matchAll(/knowledge-base\/([\w.-]+\.md)/g)].map((m) => m[1]))].join('\n')
    const p = `.dh-kb/${file}`
    if (!existsSync(p)) {
      const text = await fetchText(`https://raw.githubusercontent.com/${REPO}/refs/heads/${REF}/knowledge-base/${file}`)
      mkdirSync('.dh-kb', { recursive: true })
      writeFileSync(p, text)
    }
    const md = readFileSync(p, 'utf8')
    if (queries[0] === '*') return md
    const lines = md.replace(/^---\s*[\r\n]+[\s\S]*?[\r\n]+---/, '').trim().split('\n')
    const heads = []
    let fence = false
    lines.forEach((line, start) => {
      if (/^\s*(```|~~~)/.test(line)) fence = !fence
      const m = !fence && line.match(/^(?:\*\*)?(#{1,6})\s+(.*?)(?:\*\*)?\s*$/)
      if (m) heads.push({ level: m[1].length, head: m[2].trim(), start })
    })
    if (!queries.length) return heads.map((h) => `${'  '.repeat(h.level - 1)}- ${h.head}`).join('\n')
    const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/^(\d+ )+/, '')
    return queries.map((q) => {
      const hit = heads.find((h) => h.head.toLowerCase() === q.toLowerCase()) || heads.find((h) => norm(h.head) === norm(q)) || heads.find((h) => norm(h.head).includes(norm(q)))
      if (!hit) {
        const qw = norm(q).split(' ')
        const near = heads.map((h) => ({ h, s: qw.filter((w) => norm(h.head).includes(w)).length })).filter((x) => x.s).sort((x, y) => y.s - x.s)
        return `<!-- ${file}: no heading "${q}" — closest: ${near.slice(0, 12).map((x) => `"${x.h.head}"`).join(', ') || `none; run: node dh.mjs kb ${file}`} -->`
      }
      const after = heads.filter((n) => n.start > hit.start)
      const end = after.find((n) => n.level <= hit.level)?.start ?? lines.length
      const children = after.filter((n) => n.start < end && n.level === hit.level + 1)
      const text = lines.slice(hit.start, end).join('\n').trim()
      const body = text.length > 24000 && children.length
        ? `${lines.slice(hit.start, after[0].start).join('\n').trim()}\n\n> Long section — ask for a sub-section: ${children.map((n) => n.head).join(' | ')}`
        : text
      return `<!-- ${file} § ${hit.head} -->\n${body}`
    }).join('\n\n')
  } catch (e) {
    throw { error: `${e?.error || e?.message || e}` }
  }
}

const [cmd, a, ...rest] = process.argv.slice(2)
const read = (v) => (v?.startsWith('@') ? readFileSync(v.slice(1), 'utf8') : v)
try {
  if (cmd === 'kb') console.log(await kb(a, rest))
  else if (cmd === 'batch') {
    const ops = JSON.parse(read(a))
    if (!Array.isArray(ops) || !ops.length) throw new Error('batch file must be a non-empty JSON array of { label, method, path, body?, keys? }')
    const out = []
    let i = 0
    await Promise.all(Array.from({ length: Math.min(4, ops.length) }, async () => {
      while (i < ops.length) {
        const k = i++
        try { out[k] = { label: ops[k].label, ok: true, result: await run(ops[k]) } } catch (e) { out[k] = { label: ops[k].label, ok: false, error: e?.error || e?.message || String(e) } }
      }
    }))
    console.log(JSON.stringify(out))
    if (out.some((o) => !o.ok)) process.exitCode = 1
  } else {
    const x = read(rest[0])
    console.log(JSON.stringify(await run(cmd === 'GET' ? { method: cmd, path: a, keys: x } : { method: cmd, path: a, body: x === undefined ? undefined : JSON.parse(x) })))
  }
} catch (e) {
  console.log(JSON.stringify(e?.error ? e : { error: `${e?.message || e}` }))
  process.exitCode = 1
}

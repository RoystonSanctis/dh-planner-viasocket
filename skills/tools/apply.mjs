// apply.mjs — node apply.mjs [--check] [--concurrency=4]   (reads .dh-run/plan.json · resumes via .dh-run/state.json)
// Levels (parallel inside, ids between): 0 plug → 1 connection + plug details → 2 components → 3 items → 4 mappings
// → read-back → 5 final plug PUT (preferedauthversion, whitelist, aiContext). Every key of plan.json is optional.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dh, config } from './dh.mjs'

const args = process.argv.slice(2)
const concurrency = Number(args.find((a) => a.startsWith('--concurrency='))?.split('=')[1] || 4)
const plan = JSON.parse(readFileSync('.dh-run/plan.json', 'utf8'))
const { kb = '', skill = 'viasocket-developer-hub-plug' } = plan
const orgId = config.orgId
plan.components ||= []
plan.items ||= []
const STATE = '.dh-run/state.json'
const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : {}
state.items ||= {}
const save = () => writeFileSync(STATE, JSON.stringify(state, null, 2))
const entry = (by, note) => ({ by, time: new Date().toISOString(), skill, kb, ...(note ? { note } : {}) })
const rows = (r) => (Array.isArray(r?.data) ? r.data : [])
const obj = (v) => (typeof v === 'string' ? JSON.parse(v || '{}') : v || {})
const hash = (o) => createHash('sha1').update(JSON.stringify(o)).digest('hex')
const keyOf = (name) => name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
const merged = (metadata, by, note) => {
  const m = obj(metadata)
  return { ...m, aiLogs: [...(Array.isArray(m.aiLogs) ? m.aiLogs : []), entry(by, note)] }
}
const CODE = ['perform', 'performlist', 'performsubscribe', 'performunsubscribe', 'modifytriggerdata', 'transferoption']
const BLOCKS = { hook: CODE.slice(1), polling: ['perform', 'performlist', 'transferoption'], manual_webhook: ['performlist', 'modifytriggerdata'] }
const GEN = ['optionsGenerator', 'fieldsGenerator', 'source', 'suggestionGenerator']
const AUTH_CODE = ['testcode', 'accesstokencode', 'refreshtokencode', 'revokeapicode']
const SERVER_KEYS = ['rowid', 'autonumber', 'createdat', 'updatedat', 'created_at', 'updated_at', 'createdby', 'updatedby', 'metadata', 'status', 'isdeleted', 'actionversionrecordid', 'publishdescription', 'version', 'versionid', 'pluginname', 'pluginiconurl', 'isencrypted']
const AsyncFunction = (async () => {}).constructor
const host = config.apiBase
const dhBaseUrl = plan.dhBaseUrl || (/localhost|127\.0\.0\.1/.test(host) ? 'http://localhost:3000/' : /dev|test/.test(host) ? 'https://dev-flow.viasocket.com/' : 'https://flow.viasocket.com/')
const fieldsOf = (list, out = []) => {
  for (const f of list || []) (out.push(f), Array.isArray(f.fields) && fieldsOf(f.fields, out))
  return out
}
const gens = (f) => GEN.filter((g) => typeof f[g] === 'string' && f[g].trim())
const snippets = (it) => [
  ...CODE.filter((k) => it.version[k]).map((k) => [k, it.version[k]]),
  ...fieldsOf(it.version.inputjson?.inputFields).flatMap((f) => gens(f).map((g) => [f.key, f[g]]))
]
const sourceOf = (v) => (typeof v === 'string' && v.trim().startsWith('{') ? JSON.parse(v).source : v) ?? null
async function pool(list, n, fn) {
  const out = []
  let i = 0
  await Promise.all(Array.from({ length: Math.min(n, list.length) }, async () => { while (i < list.length) { const k = i++; out[k] = await fn(list[k]) } }))
  return out
}

// ── format + check (local, no network) ─────────────────────────────────────────────────────────────
async function format() {
  let prettier
  try { prettier = await import('prettier') } catch { return 'not formatted (npm i prettier@3)' }
  const opts = { parser: 'babel', semi: false, singleQuote: true, trailingComma: 'none', printWidth: 100 }
  const fmt = async (code) => {
    if (typeof code !== 'string' || !code.trim()) return code
    try {
      const out = await prettier.format(`async function __plug__() {\n${code}\n}\n`, opts)
      return out.trimEnd().split('\n').slice(1, -1).map((l) => l.replace(/^ {2}/, '')).join('\n')
    } catch { return code } // check() reports the syntax error
  }
  for (const c of plan.components) c.code = await fmt(c.code)
  for (const it of plan.items) {
    for (const k of CODE) if (it.version?.[k]) it.version[k] = await fmt(it.version[k])
    for (const f of fieldsOf(it.version?.inputjson?.inputFields)) for (const g of gens(f)) f[g] = await fmt(f[g])
  }
  const p = plan.connection?.payload
  if (p) for (const k of AUTH_CODE) if (typeof p[k] === 'string' && !p[k].trim().startsWith('{')) p[k] = await fmt(p[k])
  return 'formatted'
}

const RUNTIME = [
  [/(^|[^\w.])(new\s+)?URL\s*\(/, 'URL is not available (use URLSearchParams / string building)'],
  [/\bbtoa\s*\(/, 'btoa is not available (use Buffer.from(x).toString("base64"))'],
  [/\b(structuredClone|TextEncoder|setInterval|clearTimeout|AbortController|Blob)\b/, 'global not available in the VM'],
  [/\brequire\s*\(|\bprocess\.|^\s*import\s/m, 'require/process/import not available'],
  [/console\.(log|warn|info|debug)/, 'no console output in saved code'],
  [/\b(const|let|var)\s+(context|axios|fetch|console|authData|fieldsChanges|__stepId)\b/, 'reserved name redeclared'],
  [/\b(context|response|res)\.[A-Za-z_]/, 'optional chaining (?.) required'],
  [/authData\?*\.[\w?.]*(api_?key|access_?token|secret|password)/i, 'auth in code (use authenticationpaths)']
]

function check() {
  const errs = []
  const compile = (where, code, fn = AsyncFunction) => { try { new fn('context', 'axios', code) } catch (e) { errs.push(`${where}: ${e.message}`) } }
  const lint = (where, code) => RUNTIME.forEach(([re, msg]) => re.test(code) && errs.push(`${where}: ${msg}`))
  const compNames = plan.components.map((c) => c.function_name)
  for (const c of plan.components) {
    compile(`component ${c.function_name}`, c.code)
    lint(`component ${c.function_name}`, c.code)
    for (const other of compNames) if (other !== c.function_name && new RegExp(`\\b${other}\\s*\\(`).test(c.code)) errs.push(`component ${c.function_name}: calls component ${other} — components must be standalone`)
  }
  const conn = plan.connection
  if (conn) {
    const p = (conn.payload ||= {})
    if (!['create', 'update', 'clone'].includes(conn.mode)) errs.push('connection.mode must be create | update | clone')
    if (conn.mode !== 'create' && !conn.authId) errs.push(`connection.authId required for ${conn.mode}`)
    for (const k of AUTH_CODE) { const src = sourceOf(p[k]); if (src) compile(`connection.${k}`, src) }
    const ap = p.authenticationpaths
    if (ap) {
      for (const part of ['headers', 'queryParams', 'body']) if (!Array.isArray(ap[part])) errs.push(`connection.authenticationpaths.${part} must be an array`)
      for (const e of [...(ap.headers || []), ...(ap.queryParams || []), ...(ap.body || [])]) {
        if (!e?.name || typeof e.value !== 'string') errs.push('connection.authenticationpaths entries must be { name, value: "<function body>" }')
        else if (!/\breturn\b/.test(e.value)) errs.push(`connection.authenticationpaths ${e.name}: value must return`)
        else compile(`connection.authenticationpaths ${e.name}`, e.value, Function)
      }
    }
    if ('scopeseperatedby' in p && ![null, 'space', 'comma'].includes(p.scopeseperatedby)) errs.push('connection.scopeseperatedby must be "space" | "comma" | null')
    if (p.authfields && !Array.isArray(p.authfields?.authentication?.fields)) errs.push('connection.authfields.authentication.fields must be an array')
    if (conn.mode === 'create') {
      if (!p.connectionlabelkey || !p.connectionlabelvalue) errs.push('connection: connectionlabelkey + connectionlabelvalue required on create')
      if (!ap) errs.push('connection: authenticationpaths required on create')
      if (!p.type) errs.push('connection: type required on create')
    }
  }
  const itemKeys = new Set()
  for (const it of plan.items) {
    const at = it.name || it.target?.actionId
    const v = (it.version ||= {})
    if (!it.target) {
      it.key ||= keyOf(it.name)
      if (itemKeys.has(it.key)) errs.push(`${at}: duplicate key ${it.key}`)
      itemKeys.add(it.key)
      if (!['action', 'trigger'].includes(it.type)) errs.push(`${at}: type must be action | trigger`)
    } else if (!it.target.actionId || !(it.target.versionId || it.target.cloneFrom)) errs.push(`${at}: target needs actionId + versionId (edit confirmed draft) or cloneFrom (new draft)`)
    if (!(it.target && !v.inputjson) && !Array.isArray(v.inputjson?.inputFields)) errs.push(`${at}: version.inputjson.inputFields must be an array`)
    if (it.type === 'trigger' || v.triggertype) {
      if (!BLOCKS[v.triggertype]) errs.push(`${at}: triggertype must be hook | polling | manual_webhook`)
      else BLOCKS[v.triggertype].forEach((k) => (v[k] ??= ''))
      if (it.category || it.sub_category) errs.push(`${at}: triggers need category and sub_category ""`)
    }
    const keys = new Set()
    for (const f of fieldsOf(v.inputjson?.inputFields)) {
      if (keys.has(f.key)) errs.push(`${at}: duplicate field key ${f.key}`)
      keys.add(f.key)
      if ((it.type === 'trigger' || v.triggertype) && f.type === 'aifield') errs.push(`${at} › ${f.key}: aifield not allowed in triggers`)
      if ('defaultValue' in f) errs.push(`${at} › ${f.key}: no defaultValue (state it in help, apply in code)`)
      for (const p of ['placeholder', 'customPlaceholder']) if (p in f && typeof f[p] !== 'string') errs.push(`${at} › ${f.key}: ${p} must be a string`)
      if (['dropdown', 'multiselect', 'boolean'].includes(f.type) && !(f.customInputLabel && f.customHelp && f.customPlaceholder)) errs.push(`${at} › ${f.key}: customInputLabel/customHelp/customPlaceholder required`)
      if (f.type === 'multiselect' && (f.canPaginate || f.enableSearchApi)) errs.push(`${at} › ${f.key}: multiselect cannot use canPaginate/enableSearchApi`)
    }
    for (const [where, code] of snippets(it)) {
      compile(`${at} › ${where}`, code)
      lint(`${at} › ${where}`, code)
      for (const m of code.matchAll(/inputData\?\.(\w+)/g)) if (!keys.has(m[1]) && !['hookUrl', 'performsubscribe', 'scheduledTime', 'transferOption'].includes(m[1])) errs.push(`${at} › ${where}: reads inputData.${m[1]} but no such field`)
    }
  }
  return errs
}

const note = await format()
const errs = check()
if (errs.length) (console.log(`CHECK FAILED (${errs.length})\n${errs.join('\n')}`), process.exit(1))
console.log(`check ok · ${plan.items.length} items · ${plan.components.length} components${plan.connection ? ` · connection ${plan.connection.mode}` : ''}${plan.plugin ? ' · plug' : ''} · ${note}`)
if (args.includes('--check')) process.exit(0)

const report = { plug: {}, connection: {}, components: [], items: [], warnings: [] }
const fail = (msg) => (console.log(`FAILED ${msg}`), save(), process.exit(1))

// ── level 0: plug ─────────────────────────────────────────────────────────────────────────────────
let pluginId = plan.pluginId || state.pluginId
if (!pluginId && plan.plugin) {
  const found = rows(await dh('GET', `get/plugins?identifier=${orgId}&filter=getAllPlugins`)).find((p) => p.domain === plan.plugin.domain && p.status !== 'deleted')
  if (found) pluginId = found.rowid
  else {
    const time = new Date().toISOString()
    const r = await dh('POST', 'create/plugins', {
      name: plan.plugin.name, orgid: orgId, domain: plan.plugin.domain, whitelistdomains: plan.plugin.whitelistdomains || [plan.plugin.domain],
      metadata: { createdBy: { type: 'AI', agent: 'ai', skill, orgId, time }, aiLogs: [entry('CREATED_BY_AI')] }
    })
    pluginId = r?.data?.actionData?.[0]?.rowid
    state.pluginCreated = true
  }
  if (!pluginId) fail('plug: no PLUGIN_ID')
  state.pluginId = pluginId
  save()
}
if (!pluginId) fail('pluginId or plugin required')
const getPlug = async () => rows(await dh('GET', `get/plugins?identifier=${pluginId}&filter=getPluginDetails`))[0] || {}
report.plug = { pluginId, created: !!state.pluginCreated }

// ── level 1: connection ∥ plug details ─────────────────────────────────────────────────────────────
let authId = plan.authId || state.authId
const connectionWrite = async () => {
  const c = plan.connection
  if (!c) return
  const p = { ...c.payload }
  for (const k of AUTH_CODE) if (k in p) p[k] = JSON.stringify({ source: sourceOf(p[k]) })
  if (p.queryparams && typeof p.queryparams !== 'string') p.queryparams = JSON.stringify(p.queryparams)
  if (c.mode === 'update') {
    if (state.connectionHash !== hash(p)) {
      await dh('PUT', `update/oauth_details?identifier=${c.authId}&filter=updateAuthDetails`, { ...p, pluginrecordid: pluginId })
      state.connectionHash = hash(p)
    }
    authId = c.authId
    report.connection = { authId, branch: 'updated in place', keys: Object.keys(p) }
  } else if (!state.authId) {
    const existing = rows(await dh('GET', `get/oauth_details?identifier=${pluginId}&filter=getAuthDetails`))
    let body = { authversion: 'V1', ...p }
    if (c.mode === 'create' && existing.length) fail(`connection: ${existing.length} exist (${existing.map((e) => `${e.authversion}:${e.rowid}`).join(', ')}) — use mode update or clone`)
    if (c.mode === 'clone') {
      const src = existing.find((e) => e.rowid === c.authId)
      if (!src) fail(`connection: source ${c.authId} not found`)
      const copy = Object.fromEntries(Object.entries(src).filter(([k]) => !SERVER_KEYS.includes(k)))
      if (String(src.isencrypted) === 'true') (copy.clientsecret = null), report.warnings.push('clientsecret was encrypted — not copied; developer must re-enter it in DH')
      const next = Math.max(0, ...existing.map((e) => Number(String(e.authversion).replace(/\D/g, '')) || 0)) + 1
      body = { ...copy, ...p, authversion: `V${next}`, metadata: { duplicatedfrom: { rowid: src.rowid, authversion: src.authversion } } }
    }
    const r = await dh('POST', 'create/oauth_details', { ...body, pluginrecordid: pluginId, metadata: { ...body.metadata, aiLogs: [entry('CREATED_BY_AI')] } })
    state.authId = r?.data?.actionData?.[0]?.rowid
    if (!state.authId) fail('connection: create returned no id')
    state.authVersion = body.authversion
    authId = state.authId
    report.connection = { authId, authversion: body.authversion, branch: c.mode === 'clone' ? `cloned from ${c.authId}` : 'created' }
  } else (authId = state.authId), (report.connection = { authId, authversion: state.authVersion, branch: 'created (earlier run)' })
  save()
}
const plugDetails = async () => {
  if (!plan.plugin || state.plugDetailsHash === hash(plan.plugin)) return
  const { brandDetails, ...details } = plan.plugin
  if (brandDetails) await dh('POST', '/openai/dh/getBrandDetails', { pluginDomain: details.domain, pluginName: details.name, pluginId }).catch((e) => report.warnings.push(`getBrandDetails: ${e.message.slice(0, 120)}`))
  const current = await getPlug()
  const fill = brandDetails ? Object.fromEntries(['description', 'iconurl', 'brandcolor', 'tags', 'category'].filter((k) => details[k] === undefined && current[k] != null).map((k) => [k, current[k]])) : {}
  const defaults = state.pluginCreated ? { audience: 'Private', havestaticip: false } : {}
  await dh('PUT', `update/plugins?identifier=${pluginId}&filter=updatePluginDetails`, { ...defaults, ...fill, ...details, metadata: merged(current.metadata, 'UPDATED_BY_AI', 'plug details') })
  state.plugDetailsHash = hash(plan.plugin)
  save()
}
await Promise.all([connectionWrite(), plugDetails()])
if (!authId && plan.items.some((it) => !it.target && it.version?.triggertype !== 'manual_webhook')) {
  const plug = await getPlug()
  authId = plug.preferedauthversion || rows(await dh('GET', `get/oauth_details?identifier=${pluginId}&filter=getAuthDetails`))[0]?.rowid
  if (!authId) fail('no connection: add plan.connection or create one first')
}

// ── level 2: components (never silently change existing ones — not versioned) ───────────────────────
const listComponents = async () => rows(await dh('GET', `get/reusable_components?identifier=${pluginId}&filter=dhGetReusableComponentDetails`))
let comps = await listComponents()
const missing = plan.components.filter((c) => !comps.some((e) => e.function_name === c.function_name))
plan.components.filter((c) => comps.some((e) => e.function_name === c.function_name && e.code !== c.code)).forEach((c) => report.warnings.push(`component ${c.function_name} exists with different code — left unchanged`))
await pool(missing, concurrency, (c) => dh('POST', 'create/reusable_components', {
  pluginrecordid: pluginId, orgid: orgId, function_name: c.function_name, params: c.params, code: c.code, description: c.description,
  function_code: `async function ${c.function_name}(${c.params.map((p) => p.name).join(', ')}) {\n${c.code.split('\n').map((l) => (l ? `  ${l}` : l)).join('\n')}\n}`,
  componentgenerationsource: 'userGenerated', metadata: { aiLogs: [entry('CREATED_BY_AI')] }
}))
if (missing.length) comps = await listComponents()
const compId = Object.fromEntries(comps.map((c) => [c.function_name, c.rowid]))
report.components = plan.components.map((c) => ({ function_name: c.function_name, id: compId[c.function_name], created: missing.includes(c) }))

// ── level 3: items — new (create) or target (edit confirmed draft / clone to new draft) ──────────────
const existing = plan.items.some((it) => !it.target) ? rows(await dh('GET', `get/actions?identifier=${pluginId}&filter=getAllActions`)).filter((a) => a.status !== 'deleted') : []
const authOf = (it) => (it.version.triggertype === 'manual_webhook' ? undefined : it.authid ?? authId)
const results = await pool(plan.items, concurrency, async (it) => {
  const sk = it.target ? `target:${it.target.actionId}` : it.key
  const st = (state.items[sk] ||= {})
  try {
    if (it.target) {
      st.actionId = it.target.actionId
      const versions = rows(await dh('GET', `get/action_version?identifier=${st.actionId}&filter=getActionVersions`))
      if (!st.versionId && it.target.cloneFrom) {
        const src = versions.find((v) => v.rowid === it.target.cloneFrom)
        if (!src) throw new Error(`clone source ${it.target.cloneFrom} not found`)
        const copy = Object.fromEntries(Object.entries(src).filter(([k]) => !SERVER_KEYS.includes(k)))
        const r = await dh('POST', 'create/action_version', { ...copy, actionid: st.actionId, status: 'drafted', metadata: { duplicatedfrom: { rowid: src.rowid, version: src.version ?? src.versionid }, aiLogs: [entry('CREATED_BY_AI', 'new draft version')] } })
        st.versionId = r?.data?.actionData?.[0]?.rowid
        if (!st.versionId) throw new Error('clone returned no version id')
        st.cloned = true
        save()
      }
      st.versionId ||= it.target.versionId
      const target = versions.find((v) => v.rowid === st.versionId)
      if (target && target.status && target.status !== 'drafted') throw new Error(`version ${st.versionId} is ${target.status} — never edit it; use cloneFrom`)
      if (!st.flagged) {
        const current = rows(await dh('GET', `get/actions?identifier=${st.actionId}&filter=getActionDetails`))[0] || {}
        st.type = current.type
        st.name = it.name || current.name
        const rename = Object.fromEntries(['name', 'description'].filter((k) => it[k] && it[k] !== current[k]).map((k) => [k, it[k]]))
        await dh('PUT', `update/actions?identifier=${st.actionId}&filter=updateActionDetails`, { ...rename, isaiaction: true, aiorgid: orgId, metadata: merged(current.metadata, 'UPDATED_BY_AI', st.cloned ? 'new draft version' : 'draft updated') })
        st.flagged = true
        save()
      }
    } else if (!st.actionId) {
      const clash = existing.find((a) => a.key === it.key || a.name?.toLowerCase() === it.name.toLowerCase())
      if (clash) return { it, st, status: `SKIPPED: exists as ${clash.rowid} — update it with a target` }
      const r = await dh('POST', 'create/actions', {
        name: it.name, description: it.description, key: it.key, pluginrecordid: pluginId, type: it.type, authid: authOf(it),
        isvisible: it.isvisible ?? true, category: it.category ?? '', sub_category: it.sub_category ?? '',
        preferred_step_name: it.preferred_step_name ?? (it.type === 'trigger' ? '' : it.name), ignoreuniversalsampledata: false,
        metadata: { aiLogs: [entry('CREATED_BY_AI')] }
      })
      st.actionId = r?.data?.actionData?.[0]?.rowid
      st.versionId = r?.data?.actionVersionData?.data?.[0]?.rowid
      if (!st.actionId || !st.versionId) throw new Error(`create returned no ids: ${JSON.stringify(r).slice(0, 300)}`)
      save()
    }
    if (!it.target && !st.flagged) {
      const current = rows(await dh('GET', `get/actions?identifier=${st.actionId}&filter=getActionDetails`))[0]
      await dh('PUT', `update/actions?identifier=${st.actionId}&filter=updateActionDetails`, { isaiaction: true, aiorgid: orgId, metadata: merged(current?.metadata, 'CREATED_BY_AI', 'isaiaction set') })
      st.flagged = true
      save()
    }
    const body = { ...it.version, ...(it.description ? { description: it.description } : {}), authid: authOf(it), ...('category' in it ? { category: it.category, sub_category: it.sub_category ?? '' } : {}) }
    if (st.hash !== hash(body)) {
      await dh('PUT', `update/action_version?identifier=${st.versionId}&filter=updateActionVersionDetails`, body)
      st.hash = hash(body)
      save()
    }
    it.type ||= st.type
    it.name ||= st.name
    return { it, st, status: 'ok' }
  } catch (e) {
    return { it, st, status: `FAILED: ${e.message}` }
  }
})

// ── level 4: mappings — derived from which code calls which component; read-back ──────────────────────
const newRows = []
await pool(results.filter((r) => r.status === 'ok'), concurrency, async (r) => {
  const current = rows(await dh('GET', `get/action_version_component_table?identifier=${r.st.versionId}&filter=dhGetUsedComponentInActionVersionDetails`))
  const deps = {}
  for (const [where, code] of snippets(r.it)) for (const n of Object.keys(compId)) if (new RegExp(`\\b${n}\\s*\\(`).test(code)) (deps[n] ||= {})[where] = true
  for (const [name, dep] of Object.entries(deps)) {
    const row = current.find((m) => m.component_id === compId[name])
    const had = obj(row?.metadata).componentdependson || {}
    if (!row) newRows.push({ action_version_id: r.st.versionId, component_id: compId[name], action_id: r.st.actionId, pluginrecordid: pluginId, orgid: orgId, metadata: { componentdependson: dep } })
    else if (Object.keys(dep).some((k) => !had[k])) await dh('PUT', `update/action_version_component_table?identifier=${row.rowid}&filter=dhUpdateReusableComponentDetails`, { metadata: { ...obj(row.metadata), componentdependson: { ...had, ...dep } } })
  }
})
await pool(newRows, concurrency, (row) => dh('POST', 'create/action_version_component_table', row))
await pool(results.filter((r) => r.status === 'ok'), concurrency, async (r) => {
  const v = rows(await dh('GET', `get/action_version?identifier=${r.st.actionId}&filter=getActionVersions`)).find((x) => x.rowid === r.st.versionId)
  const blocks = obj(obj(v?.inputjson).blocks)
  const lost = (r.it.version.inputjson?.inputFields || []).map((f) => f.key).filter((k) => !(k in blocks))
  if (!v) r.status = 'CHECK: version not found on read-back'
  else if (lost.length) r.status = `CHECK: fields missing from blocks: ${lost.join(', ')}`
})

// ── level 5: final plug PUT — preferred connection, whitelist union, aiContext (also clears the VM auth cache) ──
if (plan.plugin || plan.connection || plan.aiContext) {
  const current = await getPlug()
  const hosts = [...new Set([...(current.whitelistdomains || []), ...(plan.plugin?.whitelistdomains || []), ...(plan.connection?.payload?.whitelistdomains || [])])]
  const metadata = merged(current.metadata, 'UPDATED_BY_AI', 'run complete')
  if (plan.aiContext) metadata.aiContext = { ...obj(current.metadata).aiContext, ...plan.aiContext, v: 1, updatedAt: new Date().toISOString(), kb }
  const setPreferred = state.authId && (plan.connection?.setPreferred ?? (plan.connection?.mode === 'create' || !current.preferedauthversion))
  const finalHash = hash({ hosts, aiContext: plan.aiContext, setPreferred, authId: state.authId, connection: state.connectionHash })
  if (state.finalHash !== finalHash) {
    await dh('PUT', `update/plugins?identifier=${pluginId}&filter=updatePluginDetails`, { whitelistdomains: hosts, metadata, ...(setPreferred ? { preferedauthversion: state.authId } : {}) })
    state.finalHash = finalHash
    save()
  }
  report.plug.preferedauthversion = setPreferred ? state.authId : current.preferedauthversion
  report.plug.whitelistdomains = hosts
}

// ── report ───────────────────────────────────────────────────────────────────────────────────────
const base = `${dhBaseUrl}developer/${orgId}/plugin/${pluginId}`
report.plug.url = `${base}/analytics`
if (report.connection.authId) report.connection.url = `${base}/auth/${report.connection.authId}`
report.items = results.map((r) => ({ name: r.it.name || r.it.target?.actionId, type: r.it.type, status: r.status, actionId: r.st?.actionId, versionId: r.st?.versionId, url: r.st?.actionId && r.st?.versionId ? `${base}/${r.it.type || 'action'}/${r.st.actionId}?versionId=${r.st.versionId}` : report.plug.url }))
writeFileSync('.dh-run/report.json', JSON.stringify(report, null, 2))
for (const w of report.warnings) console.log(`WARN ${w}`)
console.log(`plug ${pluginId}${report.plug.created ? ' (created)' : ''} · ${report.plug.url}`)
if (report.connection.authId) console.log(`connection ${report.connection.authId} · ${report.connection.branch} · ${report.connection.url}`)
for (const i of report.items) console.log(`${i.status.padEnd(4)} · ${i.type || 'item'} · ${i.name} · ${i.url}`)
console.log(`mapped ${newRows.length} new component rows · .dh-run/report.json`)
if (report.items.some((i) => !i.status.startsWith('ok'))) process.exit(1)

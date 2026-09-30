// kb.mjs — vectorless RAG over knowledge-base/*.md, files discovered at run time (port of code/vectorless-search-rag.js)
// node kb.mjs sync | index [kb|module] | get <kb|module> ["Heading" ...] [--partial] [--flat] [--max=N]
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync, rmSync } from 'node:fs'
import { execSync } from 'node:child_process'

const REPO = 'RoystonSanctis/dh-planner-viasocket'
const DIR = '.dh-kb'
const MANIFEST = `${DIR}/manifest.json`
const CORE = ['dh-knowledgebase', 'dh-connection-kb'] // prefetched in full; excluded from module RAG
const { KB_SRC, KB_REF = 'dev' } = process.env
const [cmd, target, ...rest] = process.argv.slice(2)
const flags = Object.fromEntries(rest.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')))
const queries = rest.filter((a) => !a.startsWith('--'))
const sh = (c) => execSync(c, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
const mdIn = (dir) => readdirSync(dir).filter((f) => f.endsWith('.md'))

async function sync() {
  rmSync(DIR, { recursive: true, force: true })
  mkdirSync(DIR, { recursive: true })
  let sha = null
  let files = []
  if (KB_SRC) {
    sha = `local:${KB_SRC}`
    files = mdIn(`${KB_SRC}/knowledge-base`)
    files.forEach((f) => copyFileSync(`${KB_SRC}/knowledge-base/${f}`, `${DIR}/${f}`))
  } else {
    try {
      sh(`git clone -q --depth 1 --branch ${KB_REF} https://github.com/${REPO} ${DIR}/.repo`)
      sha = sh(`git -C ${DIR}/.repo rev-parse HEAD`)
      files = mdIn(`${DIR}/.repo/knowledge-base`)
      files.forEach((f) => copyFileSync(`${DIR}/.repo/knowledge-base/${f}`, `${DIR}/${f}`))
      rmSync(`${DIR}/.repo`, { recursive: true, force: true })
    } catch {
      const list = await (await fetch(`https://api.github.com/repos/${REPO}/contents/knowledge-base?ref=${KB_REF}`)).json().catch(() => null)
      files = Array.isArray(list) ? list.map((f) => f.name) : [] // API rate-limited → read the folder page
      if (!files.length) {
        const page = await (await fetch(`https://github.com/${REPO}/tree/${KB_REF}/knowledge-base`)).text()
        files = [...page.matchAll(/knowledge-base\/([\w.-]+\.md)/g)].map((m) => m[1])
      }
      files = [...new Set(files.filter((f) => f.endsWith('.md')))]
      if (!files.length) throw new Error('cannot list knowledge-base (no git, API and folder page failed)')
      for (const f of files) {
        const res = await fetch(`https://raw.githubusercontent.com/${REPO}/refs/heads/${KB_REF}/knowledge-base/${f}`)
        if (res.ok) writeFileSync(`${DIR}/${f}`, await res.text())
      }
    }
  }
  const kbs = files.map((f) => f.replace(/\.md$/, ''))
  writeFileSync(MANIFEST, JSON.stringify({ repo: REPO, ref: KB_REF, sha, fetchedAt: new Date().toISOString(), kbs }, null, 2))
  console.log(`KB ${sha || KB_REF}: ${kbs.length} files\n${modules().map(([m, k]) => `  ${m}: ${k.join(', ')}`).join('\n')}`)
}

function manifest() {
  if (!existsSync(MANIFEST)) throw new Error('KB not synced — run: node kb.mjs sync')
  return JSON.parse(readFileSync(MANIFEST, 'utf8'))
}

function modules() {
  const detailed = manifest().kbs.filter((k) => !CORE.includes(k))
  const connection = detailed.filter((k) => /connection/i.test(k))
  return [
    ['dh_action_trigger', detailed.filter((k) => !connection.includes(k))],
    ['dh_connection', connection],
    ['dh_plug', detailed]
  ]
}

const kbsOf = (t) => Object.fromEntries(modules())[t] || String(t || 'dh_plug').split(',').filter((k) => manifest().kbs.includes(k))

function sections(kb) {
  const lines = readFileSync(`${DIR}/${kb}.md`, 'utf8').replace(/^---\s*[\r\n]+[\s\S]*?[\r\n]+---/, '').trim().split('\n')
  const heads = []
  let fence = false
  lines.forEach((line, start) => {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence
    const m = !fence && line.match(/^(?:\*\*)?(#{1,6})\s+(.*?)(?:\*\*)?\s*$/)
    if (m) heads.push({ level: m[1].length, head: m[2].trim(), start })
  })
  return heads.map((h, i) => {
    const after = heads.slice(i + 1)
    const end = after.find((n) => n.level <= h.level)?.start ?? lines.length
    const children = after.filter((n) => n.start < end && n.level === h.level + 1).map((n) => n.head)
    return { ...h, children, flat: lines.slice(h.start, after[0]?.start ?? lines.length).join('\n').trim(), tree: lines.slice(h.start, end).join('\n').trim() }
  })
}

const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/^(\d+ )+/, '')
const sha = () => String(manifest().sha || '').slice(0, 7)

function index() {
  for (const kb of kbsOf(target)) {
    const heads = sections(kb)
    const pageIndex = heads.find((h) => norm(h.head) === 'page index')
    const tree = heads.map((h) => `${'  '.repeat(h.level - 1)}- ${h.head}`).join('\n')
    console.log(`\n## ${kb}\n${pageIndex ? pageIndex.flat.split('\n').slice(1).join('\n').trim() : tree}`)
  }
}

function get() {
  const max = Number(flags.max || 24000)
  const isModule = modules().some(([m]) => m === target)
  for (const kb of kbsOf(target)) {
    const heads = sections(kb)
    if (!queries.length) {
      console.log(`<!-- kb:${kb} (full) @${sha()} -->\n${heads.map((h) => h.flat).join('\n\n')}\n`)
      continue
    }
    const seen = new Set()
    for (const q of queries) {
      let hits = heads.filter((h) => h.head.toLowerCase() === q.trim().toLowerCase())
      if (!hits.length) hits = heads.filter((h) => norm(h.head) === norm(q))
      if (!hits.length && 'partial' in flags) hits = heads.filter((h) => norm(h.head).includes(norm(q)))
      for (const h of hits.filter((x) => !seen.has(x.start))) {
        seen.add(h.start)
        let text = 'flat' in flags ? h.flat : h.tree
        if (text.length > max) text = `${h.flat}\n\n> Truncated (${h.tree.length} chars). Query children: ${h.children.join(' | ')}`
        console.log(`<!-- kb:${kb} § ${h.head} @${sha()} -->\n${text}\n`)
      }
    }
    if (!seen.size && !isModule) console.log(`<!-- kb:${kb}: no match — run: node kb.mjs index ${kb} -->`)
  }
}

if (cmd === 'sync') await sync()
else if (cmd === 'index') index()
else if (cmd === 'get') get()
else console.log('usage: node kb.mjs sync | index [kb|module] | get <kb|module> ["Heading" ...] [--partial] [--flat] [--max=N]')

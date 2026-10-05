import * as esbuild from 'esbuild-wasm/esm/browser.js'
import wasmURL from 'esbuild-wasm/esbuild.wasm?url'
import type { Problem } from '../types'
import { readTailwindConfig } from './config'
import { isImageFile, resolveImport } from './files'
import { isDataUrl, textToSvgDataUrl } from './media'
import { buildPreviewDocument, escapeScript, escapeStyle } from './preview'
import { getTailwind, type TailwindApi } from './tailwindService'
import { WORKSPACES, type WorkspaceId, type WorkspaceInfo } from './workspace'

const VIRTUAL_ENTRY = '__entry.tsx'
let compiler: Promise<void> | null = null
let compilerReady = false
let appliedConfig = ''

export function ensureCompiler() {
  if (compilerReady) return Promise.resolve()
  if (!compiler) {
    compiler = (async () => {
      try {
        await esbuild.initialize({ wasmURL, worker: true })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (!/already/i.test(message)) {
          try {
            await esbuild.initialize({ wasmURL, worker: false })
          } catch (second) {
            const secondMessage = second instanceof Error ? second.message : String(second)
            if (!/already/i.test(secondMessage)) throw second
          }
        }
      }
      compilerReady = true
    })().catch((error) => {
      compiler = null
      throw error
    })
  }
  return compiler
}

function externalOf(spec: string) {
  if (spec === 'react' || spec.startsWith('react/') || spec === 'react-dom' || spec.startsWith('react-dom/')) {
    if (spec === 'react' || spec === 'react/jsx-runtime' || spec === 'react/jsx-dev-runtime' || spec === 'react-dom' || spec === 'react-dom/client') {
      return spec
    }
    if (spec.startsWith('react/')) return `https://esm.sh/react@19.1.1/${spec.slice('react/'.length)}`
    return `https://esm.sh/react-dom@19.1.1/${spec.slice('react-dom/'.length)}?external=react`
  }
  if (/^https?:/i.test(spec)) return spec
  return `https://esm.sh/${spec}?external=react,react-dom`
}

function importerOf(importer: string, files: Record<string, string>) {
  const slash = importer.replace(/\\/g, '/').replace(/^\/+/, '')
  if (slash in files) return slash
  const match = Object.keys(files)
    .sort((a, b) => b.length - a.length)
    .find((key) => slash.endsWith(`/${key}`) || slash.endsWith(key))
  return match ?? slash
}

function virtualPlugin(files: Record<string, string>): esbuild.Plugin {
  return {
    name: 'playground-files',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.kind === 'entry-point') return { path: args.path, namespace: 'play' }
        if (args.path.startsWith('.') || args.path.startsWith('/')) {
          const importer = importerOf(args.importer, files)
          const spec = args.path.startsWith('/') ? `.${args.path}` : args.path
          const resolved = resolveImport(importer, spec, (path) => path in files)
          if (!resolved) {
            return {
              path: args.path,
              namespace: 'play',
              errors: [{ text: `Cannot find '${args.path}' imported from '${importer || 'entry'}'` }],
            }
          }
          return { path: resolved, namespace: 'play' }
        }
        return { path: externalOf(args.path), external: true }
      })

      build.onLoad({ filter: /.*/, namespace: 'play' }, (args) => {
        const contents = files[args.path]
        if (contents == null) {
          return { contents: '', errors: [{ text: `Missing file '${args.path}'` }] }
        }
        if (args.path.endsWith('.css')) return { contents: 'export {}', loader: 'js' }
        if (args.path.endsWith('.json')) return { contents, loader: 'json' }
        if (args.path.endsWith('.tsx')) return { contents, loader: 'tsx' }
        if (args.path.endsWith('.ts')) return { contents, loader: 'ts' }
        if (args.path.endsWith('.jsx') || args.path.endsWith('.js')) return { contents, loader: 'jsx' }
        return { contents, loader: 'text' }
      })
    },
  }
}

function pickEntry(files: Record<string, string>) {
  for (const dir of ['', 'src/']) {
    for (const name of ['main.tsx', 'main.jsx', 'main.ts', 'main.js']) {
      if (`${dir}${name}` in files) return { entry: `${dir}${name}`, files }
    }
  }
  for (const dir of ['', 'src/']) {
    for (const name of ['App.tsx', 'App.jsx', 'App.ts', 'App.js']) {
      if (!(`${dir}${name}` in files)) continue
      const stem = `${dir}${name.replace(/\.[^.]+$/, '')}`
      return {
        entry: VIRTUAL_ENTRY,
        files: {
          ...files,
          [VIRTUAL_ENTRY]: `import { StrictMode } from 'react'\nimport { createRoot } from 'react-dom/client'\nimport App from './${stem}'\nconst el = document.getElementById('root')\nif (el) createRoot(el).render(<StrictMode><App /></StrictMode>)\n`,
        },
      }
    }
  }
  return null
}

function locate(file: string | undefined, files: Record<string, string>) {
  if (!file || file.startsWith('<')) return undefined
  return importerOf(file, files)
}

function toProblems(messages: esbuild.Message[], severity: 'error' | 'warning', files: Record<string, string>): Problem[] {
  return messages.map((message) => {
    const file = locate(message.location?.file, files)
    return {
      id: `${severity}:${file ?? 'build'}:${message.location?.line ?? 0}:${message.text}`,
      severity,
      message: message.location?.lineText ? `${message.text}` : message.text,
      file,
      line: message.location?.line,
      column: message.location?.column,
      source: 'build',
    }
  })
}

async function bundle(entry: string, files: Record<string, string>) {
  return esbuild.build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    outfile: 'app.js',
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    jsx: 'automatic',
    jsxImportSource: 'react',
    sourcemap: 'inline',
    sourcesContent: true,
    legalComments: 'none',
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [virtualPlugin(files)],
  })
}

async function bundleSafe(entry: string, files: Record<string, string>) {
  try {
    const result = await bundle(entry, files)
    const js = result.outputFiles.map((file) => file.text).join('\n')
    return { js, problems: toProblems(result.warnings, 'warning', files) }
  } catch (error) {
    const failure = error as { errors?: esbuild.Message[]; warnings?: esbuild.Message[]; message?: string }
    if (failure.errors?.length) {
      return {
        js: '',
        problems: [...toProblems(failure.errors, 'error', files), ...toProblems(failure.warnings ?? [], 'warning', files)],
      }
    }
    return {
      js: '',
      problems: [
        {
          id: `build:${entry}:${failure.message ?? 'failed'}`,
          severity: 'error' as const,
          message: failure.message ?? 'Build failed',
          source: 'build',
        },
      ],
    }
  }
}

function userStyles(files: Record<string, string>) {
  return Object.keys(files)
    .filter((name) => name.endsWith('.css'))
    .sort((a, b) => (a === 'styles.css' ? -1 : b === 'styles.css' ? 1 : a.localeCompare(b)))
    .map((name) => files[name])
    .join('\n\n')
}

async function compileCss(files: Record<string, string>, api: TailwindApi | null, userCss = userStyles(files)) {
  const content = Object.entries(files)
    .filter(([name]) => !name.endsWith('.css') && name !== 'tailwind.config.js')
    .map(([, value]) => value)
  const configResult = readTailwindConfig(files['tailwind.config.js'])
  const problems: Problem[] = []
  if (configResult.error) {
    problems.push({
      id: 'tailwind-config',
      severity: 'error',
      message: configResult.error,
      file: 'tailwind.config.js',
      line: 1,
      column: 1,
      source: 'tailwind',
    })
  } else if (configResult.warning) {
    problems.push({
      id: 'tailwind-plugins',
      severity: 'warning',
      message: configResult.warning,
      file: 'tailwind.config.js',
      line: 1,
      column: 1,
      source: 'tailwind',
    })
  }

  if (!api) {
    return { css: userCss, useCdn: true, problems }
  }

  const json = JSON.stringify(configResult.config)
  if (json !== appliedConfig) {
    appliedConfig = json
    api.setTailwindConfig(configResult.config)
    await new Promise((resolve) => setTimeout(resolve, 40))
  }

  const header = /@tailwind\s+base\b/.test(userCss) ? '' : '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n'
  const describe = (error: unknown) => (error instanceof Error ? error.message : String(error))
  const within = <T,>(promise: Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('Tailwind worker timed out')), 12000)
      promise.then(
        (value) => {
          window.clearTimeout(timer)
          resolve(value)
        },
        (error) => {
          window.clearTimeout(timer)
          reject(error)
        },
      )
    })
  try {
    const css = await within(api.generateStylesFromContent(`${header}${userCss}`, content))
    return { css, useCdn: false, problems }
  } catch (error) {
    try {
      const base = await within(api.generateStylesFromContent('@tailwind base;\n@tailwind components;\n@tailwind utilities;\n', content))
      problems.push({
        id: 'tailwind-css',
        severity: 'error',
        message: describe(error),
        file: 'styles.css',
        line: 1,
        column: 1,
        source: 'tailwind',
      })
      return { css: `${base}\n${userCss}`, useCdn: false, problems }
    } catch (fallbackError) {
      problems.push({
        id: 'tailwind-cdn',
        severity: 'warning',
        message: `Tailwind compile failed (${describe(fallbackError)}). Using the browser runtime for this preview.`,
        source: 'tailwind',
      })
      return { css: userCss, useCdn: true, problems }
    }
  }
}

const TAG_ATTR = (attrs: string, name: string) => new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i').exec(attrs)?.[2]
const HAS_ATTR = (attrs: string, name: string) => new RegExp(`(^|\\s)${name}(\\s|=|$)`, 'i').test(attrs)

function localPath(url: string | undefined, files: Record<string, string>) {
  if (!url || /^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(url)) return undefined
  const clean = url.split(/[?#]/)[0].replace(/^\/+/, '')
  return { url, path: resolveImport('index.html', clean.startsWith('.') ? clean : `./${clean}`, (path) => path in files) }
}

function assetUrl(url: string | undefined, files: Record<string, string>) {
  const target = localPath(url, files)
  if (!target?.path) return undefined
  const content = files[target.path]
  if (isImageFile(target.path) && isDataUrl(content)) return content
  if (target.path.endsWith('.svg')) return textToSvgDataUrl(content)
  return undefined
}

function inlineAssets(html: string, files: Record<string, string>) {
  let next = html.replace(/\b(src|poster)\s*=\s*(["'])([^"']*)\2/gi, (_full, attr: string, quote: string, url: string) => `${attr}=${quote}${assetUrl(url, files) ?? url}${quote}`)
  next = next.replace(/\bsrcset\s*=\s*(["'])([^"']*)\1/gi, (_full, quote: string, list: string) => {
    const parts = list.split(',').map((part) => {
      const segment = part.trim()
      if (!segment) return segment
      const [url, ...descriptors] = segment.split(/\s+/)
      return [assetUrl(url, files) ?? url, ...descriptors].join(' ')
    })
    return `srcset=${quote}${parts.join(', ')}${quote}`
  })
  return next
}

function inlineCssUrls(css: string, files: Record<string, string>) {
  return css.replace(/\burl\(\s*(['"]?)([^'")]+)\1\s*\)/g, (_full, _quote: string, url: string) => `url("${assetUrl(url.trim(), files) ?? url}")`)
}

function lineAt(text: string, index: number) {
  return text.slice(0, index).split('\n').length
}

function sourceLabel(path: string) {
  return path.replace(/[^\w./-]/g, '_')
}

async function classicScript(path: string, code: string, problems: Problem[], files: Record<string, string>) {
  const loader = path.endsWith('.tsx') ? 'tsx' : path.endsWith('.ts') ? 'ts' : path.endsWith('.jsx') ? 'jsx' : 'js'
  try {
    const result = await esbuild.transform(code, { loader, sourcefile: path, target: 'es2022', jsx: 'transform' })
    problems.push(...toProblems(result.warnings, 'warning', files))
    return loader === 'js' ? code : result.code
  } catch (error) {
    const failure = error as { errors?: esbuild.Message[] }
    problems.push(...toProblems((failure.errors ?? []).map((message) => ({ ...message, location: message.location && { ...message.location, file: path } })), 'error', files))
    return ''
  }
}

async function compileWeb(files: Record<string, string>) {
  const problems: Problem[] = []
  const source = files['index.html'] ?? ''
  const missing = (url: string, index: number) =>
    problems.push({
      id: `missing:${url}`,
      severity: 'warning',
      message: `index.html links '${url}', but there is no such file.`,
      file: 'index.html',
      line: lineAt(source, index),
      column: 1,
      source: 'build',
    })
  const tailwind = 'tailwind.config.js' in files
  const linkedCss: string[] = []
  let html = source.replace(/<link\b([^>]*)>/gi, (tag, attrs: string, index: number) => {
    if (!/stylesheet/i.test(TAG_ATTR(attrs, 'rel') ?? '')) return tag
    const target = localPath(TAG_ATTR(attrs, 'href'), files)
    if (!target) return tag
    if (!target.path) {
      missing(target.url, index)
      return ''
    }
    if (tailwind) {
      linkedCss.push(files[target.path])
      return ''
    }
    return `<style data-file="${target.path}">${escapeStyle(files[target.path])}\n/*# sourceURL=${sourceLabel(target.path)} */</style>`
  })

  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  const deferred: string[] = []
  let output = ''
  let cursor = 0
  for (const match of scripts) {
    const [tag, attrs] = match
    const index = match.index ?? 0
    output += html.slice(cursor, index)
    cursor = index + tag.length
    const target = localPath(TAG_ATTR(attrs, 'src'), files)
    if (!target) {
      output += tag
      continue
    }
    if (!target.path) {
      missing(target.url, source.indexOf(target.url))
      continue
    }
    const module = (TAG_ATTR(attrs, 'type') ?? '').toLowerCase() === 'module'
    if (module) {
      const built = await bundleSafe(target.path, files)
      problems.push(...built.problems)
      if (built.js) output += `<script type="module" data-file="${target.path}">${escapeScript(built.js)}</script>`
      continue
    }
    const code = await classicScript(target.path, files[target.path], problems, files)
    if (!code) continue
    const inline = `<script data-file="${target.path}">${escapeScript(code)}\n//# sourceURL=${sourceLabel(target.path)}</script>`
    if (HAS_ATTR(attrs, 'defer')) deferred.push(inline)
    else output += inline
  }
  html = output + html.slice(cursor)
  if (deferred.length) html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${deferred.join('\n')}\n</body>`) : `${html}\n${deferred.join('\n')}`

  const api = tailwind ? await getTailwind(6000) : null
  const css = tailwind ? await compileCss(files, api, linkedCss.join('\n\n')) : { css: '', useCdn: false, problems: [] }
  problems.push(...css.problems)
  const document = buildPreviewDocument({ html: inlineAssets(html, files), css: inlineCssUrls(css.css, files), appJs: '', vanillaJs: '', useCdn: css.useCdn, plain: true })
  const ok = !problems.some((problem) => problem.severity === 'error' && problem.source === 'build')
  return { html: document, problems, ok, useCdn: css.useCdn }
}

const htmlEsc = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** A terminal-style preview page: a program-output window fed by 'pg:line'/'pg:clear' postMessages from the parent. */
function consolePage(title: string, entry: string, hint: string) {
  return `<header class="pg-head"><span class="pg-dot" style="background:#f87171"></span><span class="pg-dot" style="background:#fbbf24"></span><span class="pg-dot" style="background:#34d399"></span><span class="pg-title">${htmlEsc(entry)}</span><span class="pg-kind">${htmlEsc(title)}</span></header>
<div id="pg-out"><div class="pg-line pg-system pg-hint">${htmlEsc(hint)}</div></div>
<script>
(() => {
  const out = document.getElementById('pg-out')
  const kinds = { log: 'out', debug: 'out', info: 'info', result: 'info', warn: 'warn', error: 'error', system: 'system', input: 'input' }
  window.addEventListener('message', (event) => {
    const data = event.data || {}
    if (data.channel !== 'rp') return
    if (data.type === 'pg:clear') { out.textContent = ''; return }
    if (data.type === 'pg:line' && typeof data.text === 'string') {
      const hint = out.querySelector('.pg-hint')
      if (hint) hint.remove()
      const line = document.createElement('div')
      line.className = 'pg-line pg-' + (kinds[data.level] || 'out')
      line.textContent = data.text
      out.appendChild(line)
      out.scrollTop = out.scrollHeight
    }
  })
})()
</script>`
}

const CONSOLE_PAGE_CSS = `:root { color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; display: flex; flex-direction: column; background: #0b1020; color: #e8eaef; font-family: Inter, system-ui, sans-serif; }
.pg-head { display: flex; align-items: center; gap: 6px; padding: 9px 14px; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); }
.pg-dot { width: 10px; height: 10px; border-radius: 50%; }
.pg-title { margin-left: 8px; font: 600 12px ui-monospace, 'Cascadia Mono', monospace; color: #cbd5e1; }
.pg-kind { margin-left: auto; font-size: 11px; color: #64748b; }
#pg-out { flex: 1; padding: 12px 14px; overflow: auto; font: 13px/1.7 ui-monospace, 'Cascadia Mono', 'Cascadia Code', Consolas, monospace; white-space: pre-wrap; word-break: break-word; }
.pg-line { margin: 0; }
.pg-error { color: #f87171; }
.pg-warn { color: #fbbf24; }
.pg-info { color: #7dd3fc; }
.pg-input { color: #a78bfa; }
.pg-system { color: #64748b; font-style: italic; }
`

async function compileScript(files: Record<string, string>, info: WorkspaceInfo) {
  const problems: Problem[] = []
  const entry = info.entry in files ? info.entry : Object.keys(files).filter((name) => /\.tsx?$/.test(name)).sort()[0]
  let js = ''
  if (entry) {
    const built = await bundleSafe(entry, files)
    js = built.js
    problems.push(...built.problems)
  }
  const blocking = problems.some((problem) => problem.severity === 'error' && problem.source === 'build')
  const html = buildPreviewDocument({ html: consolePage('TypeScript', info.entry, 'Output lands here and in the Output tab (Ctrl+J). In the Terminal, node main.ts runs a file on its own.'), css: CONSOLE_PAGE_CSS, appJs: '', vanillaJs: blocking ? '' : js, useCdn: false, plain: true })
  return { html, problems, ok: !blocking, useCdn: false }
}

async function compilePython(info: WorkspaceInfo) {
  const html = buildPreviewDocument({ html: consolePage('Python · Pyodide', info.entry, 'Your Python runs on save — output lands here and in the Output tab (Ctrl+J). The first run downloads the Pyodide runtime from a CDN.'), css: CONSOLE_PAGE_CSS, appJs: '', vanillaJs: '', useCdn: false, plain: true })
  return { html, problems: [] as Problem[], ok: true, useCdn: false }
}

async function compileLang(info: WorkspaceInfo) {
  const html = buildPreviewDocument({ html: consolePage(info.label, info.entry, 'Press Ctrl+Enter or Run to execute on the Wandbox runner — output lands here and in the Output tab (Ctrl+J).'), css: CONSOLE_PAGE_CSS, appJs: '', vanillaJs: '', useCdn: false, plain: true })
  return { html, problems: [] as Problem[], ok: true, useCdn: false }
}

export async function compileProject(files: Record<string, string>, workspace: WorkspaceId) {
  const kind = WORKSPACES[workspace].kind
  if (kind === 'python') return compilePython(WORKSPACES[workspace])
  if (kind === 'lang') return compileLang(WORKSPACES[workspace])
  await ensureCompiler()
  if (kind === 'web') return compileWeb(files)
  if (kind === 'script') return compileScript(files, WORKSPACES[workspace])
  const problems: Problem[] = []
  const picked = pickEntry(files)
  let appJs = ''
  if (picked) {
    const built = await bundleSafe(picked.entry, picked.files)
    appJs = built.js
    problems.push(...built.problems)
  }
  let vanillaJs = ''
  if (files['script.js']?.trim()) {
    const built = await bundleSafe('script.js', files)
    vanillaJs = built.js
    problems.push(...built.problems)
  }
  const api = await getTailwind(picked || files['script.js'] ? 6000 : 1500)
  const css = await compileCss(files, api)
  problems.push(...css.problems)
  const blocking = problems.some((problem) => problem.severity === 'error' && problem.source === 'build')
  const html = buildPreviewDocument({
    html: inlineAssets(files['index.html'] ?? '<div id="root"></div>', files),
    css: inlineCssUrls(css.css, files),
    appJs: blocking ? '' : appJs,
    vanillaJs: problems.some((problem) => problem.severity === 'error' && problem.file === 'script.js') ? '' : vanillaJs,
    useCdn: css.useCdn,
  })
  return { html, problems, ok: !blocking, useCdn: css.useCdn }
}

export async function bundleScript(entry: string, files: Record<string, string>) {
  await ensureCompiler()
  try {
    const result = await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      write: false,
      outfile: 'script.js',
      format: 'esm',
      platform: 'neutral',
      target: 'es2022',
      jsx: 'automatic',
      jsxImportSource: 'react',
      legalComments: 'none',
      logLevel: 'silent',
      plugins: [virtualPlugin(files)],
    })
    return { js: result.outputFiles.map((file) => file.text).join('\n'), errors: [] as string[] }
  } catch (error) {
    const failure = error as { errors?: esbuild.Message[]; message?: string }
    const errors = failure.errors?.length
      ? failure.errors.map((message) => {
          const at = message.location ? `${locate(message.location.file, files) ?? entry}:${message.location.line}:${message.location.column + 1}: ` : ''
          return `${at}${message.text}`
        })
      : [failure.message ?? 'The script could not be compiled.']
    return { js: '', errors }
  }
}

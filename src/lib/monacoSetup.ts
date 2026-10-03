import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.js'
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution'
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution'
import 'monaco-editor/esm/vs/basic-languages/csharp/csharp.contribution'
import 'monaco-editor/esm/vs/basic-languages/go/go.contribution'
import 'monaco-editor/esm/vs/basic-languages/graphql/graphql.contribution'
import 'monaco-editor/esm/vs/basic-languages/java/java.contribution'
import 'monaco-editor/esm/vs/basic-languages/less/less.contribution'
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution'
import 'monaco-editor/esm/vs/basic-languages/php/php.contribution'
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution'
import 'monaco-editor/esm/vs/basic-languages/ruby/ruby.contribution'
import 'monaco-editor/esm/vs/basic-languages/rust/rust.contribution'
import 'monaco-editor/esm/vs/basic-languages/scss/scss.contribution'
import 'monaco-editor/esm/vs/basic-languages/shell/shell.contribution'
import 'monaco-editor/esm/vs/basic-languages/sql/sql.contribution'
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution'
import 'monaco-editor/esm/vs/basic-languages/html/html.contribution'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution'
import 'monaco-editor/esm/vs/language/css/monaco.contribution'
import 'monaco-editor/esm/vs/language/html/monaco.contribution'
import 'monaco-editor/esm/vs/language/json/monaco.contribution'
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution'
import { configureMonacoTailwindcss, tailwindcssData } from 'monaco-tailwindcss'
import { DEFAULT_FILES } from '../defaults'
import { readTailwindConfig } from './config'
import { REACT_TYPES } from './reactTypes'
import { registerProjectIntellisense } from './intellisense'
import { registerTagRename } from './tagRename'
import { registerTailwind } from './tailwindService'
import { monacoThemeData, THEMES } from './themes'
import { emmetCSS, emmetHTML, emmetJSX } from 'emmet-monaco-es'
import { settingsStore } from './settings'
import { registerReactSnippets } from './snippets'

const globalScope = self as typeof self & {
  MonacoEnvironment?: { getWorker: (moduleId: string, label: string) => Worker }
}

globalScope.MonacoEnvironment = {
  getWorker(_moduleId, label) {
    switch (label) {
      case 'json':
        return new jsonWorker()
      case 'css':
      case 'less':
      case 'scss':
        return new cssWorker()
      case 'html':
      case 'handlebars':
      case 'razor':
        return new htmlWorker()
      case 'typescript':
      case 'javascript':
        return new tsWorker()
      case 'tailwindcss':
        return new Worker(`${import.meta.env.BASE_URL}tailwind.worker.js`, { type: 'module', name: 'tailwindcss' })
      default:
        return new editorWorker()
    }
  },
}

// editor.api's createWebWorker does not read MonacoEnvironment. The language
// bundles do that handshake themselves; monaco-tailwindcss does not.
const createWebWorker = monaco.editor.createWebWorker.bind(monaco.editor)
monaco.editor.createWebWorker = ((options: {
  worker?: Worker | Promise<Worker>
  host?: object
  keepIdleModels?: boolean
  label?: string
  moduleId?: string
  createData?: unknown
}) => {
  if (options.worker) {
    return createWebWorker({
      worker: options.worker,
      host: options.host,
      keepIdleModels: options.keepIdleModels,
    } as unknown as Parameters<typeof createWebWorker>[0])
  }
  const worker = Promise.resolve(
    globalScope.MonacoEnvironment!.getWorker(options.moduleId ?? 'workerMain.js', options.label ?? 'monaco-editor-worker'),
  ).then((instance) => {
    instance.postMessage('ignore')
    instance.postMessage(options.createData)
    return instance
  })
  return createWebWorker({
    worker,
    host: options.host,
    keepIdleModels: options.keepIdleModels,
  } as unknown as Parameters<typeof createWebWorker>[0])
}) as typeof monaco.editor.createWebWorker

const WORD_PATTERN = /(-?\d*\.\d\w*)|([^`~!@#%^&*()=+[{}\]\\|;:'",.<>/?\s]+)/g

export async function applyWordPattern() {
  const [typescript, javascript] = await Promise.all([
    import('monaco-editor/esm/vs/basic-languages/typescript/typescript.js'),
    import('monaco-editor/esm/vs/basic-languages/javascript/javascript.js'),
  ])
  monaco.languages.setLanguageConfiguration('typescript', { ...typescript.conf, wordPattern: WORD_PATTERN })
  monaco.languages.setLanguageConfiguration('javascript', { ...javascript.conf, wordPattern: WORD_PATTERN })
}

let configured = false

export function setupMonaco() {
  if (configured) return
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason instanceof Error && event.reason.name === 'Canceled') event.preventDefault()
  })
  configured = true

  for (const theme of THEMES) monaco.editor.defineTheme(`pg-${theme.id}`, monacoThemeData(theme))

  const compilerOptions = {
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    allowJs: true,
    allowNonTsExtensions: true,
    allowImportingTsExtensions: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    strict: false,
    skipLibCheck: true,
    noEmit: true,
    isolatedModules: true,
    resolveJsonModule: true,
    lib: ['esnext', 'dom', 'dom.iterable'],
  } as monaco.languages.typescript.CompilerOptions
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions)
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({ ...compilerOptions, allowJs: true, checkJs: false })
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: false,
    diagnosticCodesToIgnore: [2307, 7016, 2792, ...SUGGESTION_NOISE],
  })
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: false,
    diagnosticCodesToIgnore: SUGGESTION_NOISE,
  })
  monaco.languages.typescript.typescriptDefaults.addExtraLib(REACT_TYPES, 'file:///node_modules/@types/react/index.d.ts')
  monaco.languages.typescript.javascriptDefaults.addExtraLib(REACT_TYPES, 'file:///node_modules/@types/react/index.d.ts')
  monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true)
  monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true)
  const inlay = {
    includeInlayParameterNameHints: 'none' as const,
    includeInlayFunctionLikeReturnTypeHints: true,
    includeInlayVariableTypeHints: false,
    includeInlayPropertyDeclarationTypeHints: true,
    includeInlayEnumMemberValueHints: true,
  }
  monaco.languages.typescript.typescriptDefaults.setInlayHintsOptions(inlay)
  monaco.languages.typescript.javascriptDefaults.setInlayHintsOptions({
    includeInlayParameterNameHints: 'none',
    includeInlayFunctionLikeReturnTypeHints: false,
    includeInlayVariableTypeHints: false,
    includeInlayPropertyDeclarationTypeHints: false,
    includeInlayEnumMemberValueHints: false,
  })

  monaco.languages.css.cssDefaults.setOptions({
    data: { dataProviders: { tailwindcssData } },
    validate: true,
  })

  const initial = readTailwindConfig(DEFAULT_FILES['tailwind.config.js']).config
  const api = configureMonacoTailwindcss(monaco, {
    languageSelector: ['css', 'javascript', 'html', 'typescript'],
    tailwindConfig: initial,
  })
  registerProjectIntellisense(monaco)
  registerTagRename(monaco)
  registerReactSnippets(monaco)
  syncEmmet()
  settingsStore.subscribe(syncEmmet)
  registerTailwind({
    setTailwindConfig(config) {
      api.setTailwindConfig(config as typeof initial)
    },
    generateStylesFromContent(css, content) {
      return api.generateStylesFromContent(css, content)
    },
  })
}

const SUGGESTION_NOISE = [80001, 80002, 80004, 80005, 80006, 80007, 80008, 7043, 7044, 7045, 7046, 7047, 7048, 7049, 7050]

let emmetDisposers: Array<() => void> | null = null

type TokenizedModel = { tokenization?: { forceTokenization?: (lineNumber: number) => void } }

function guardedMonaco(accepts: (model: monaco.editor.ITextModel) => boolean): typeof monaco {
  const register = monaco.languages.registerCompletionItemProvider
  return {
    ...monaco,
    languages: {
      ...monaco.languages,
      registerCompletionItemProvider: (selector, provider) =>
        register(selector, {
          ...provider,
          provideCompletionItems(model, position, context, token) {
            if (!accepts(model)) return undefined
            try {
              ;(model as unknown as TokenizedModel).tokenization?.forceTokenization?.(position.lineNumber)
              return provider.provideCompletionItems(model, position, context, token)
            } catch {
              return undefined
            }
          },
        }),
    },
  }
}

function syncEmmet() {
  const enabled = settingsStore.get().emmet
  if (enabled && !emmetDisposers) {
    const all = guardedMonaco(() => true)
    const jsx = guardedMonaco((model) => /\.(tsx|jsx)$/.test(model.uri.path))
    emmetDisposers = [emmetHTML(all, ['html']), emmetCSS(all, ['css']), emmetJSX(jsx, ['javascript', 'typescript'])]
  } else if (!enabled && emmetDisposers) {
    emmetDisposers.forEach((dispose) => dispose())
    emmetDisposers = null
  }
}

const crossLibs = new Map<string, { content: string; lib: monaco.IDisposable }>()

export function syncCrossLanguageLibs(files: Record<string, string>) {
  const wanted = new Map<string, string>()
  for (const [path, content] of Object.entries(files)) {
    if (/\.(jsx?|mjs|cjs)$/.test(path)) wanted.set(`ts:${path}`, content)
    else if (/\.(tsx?|mts|cts)$/.test(path)) wanted.set(`js:${path}`, content)
  }
  for (const [key, entry] of crossLibs) {
    if (wanted.has(key)) continue
    entry.lib.dispose()
    crossLibs.delete(key)
  }
  for (const [key, content] of wanted) {
    const current = crossLibs.get(key)
    if (current?.content === content) continue
    current?.lib.dispose()
    const defaults = key.startsWith('ts:') ? monaco.languages.typescript.typescriptDefaults : monaco.languages.typescript.javascriptDefaults
    crossLibs.set(key, { content, lib: defaults.addExtraLib(content, `file:///${key.slice(3)}`) })
  }
}

export function monacoUri(path: string) {
  return monaco.Uri.parse(`file:///${path}`)
}

export function pathFromMonaco(uri: { path: string }) {
  return decodeURIComponent(uri.path.replace(/^\//, ''))
}

export { monaco }

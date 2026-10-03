import type * as Monaco from 'monaco-editor'
import { componentName } from './files'
import { settingsStore } from './settings'

type Snippet = { prefix: string; label: string; body: (file: string) => string }

const SNIPPETS: Snippet[] = [
  { prefix: 'rfc', label: 'React function component', body: (file) => `export function \${1:${file}}() {\n  return (\n    <div>\n      $0\n    </div>\n  )\n}\n` },
  { prefix: 'rfce', label: 'React function component (default export)', body: (file) => `export default function \${1:${file}}() {\n  return (\n    <div>\n      $0\n    </div>\n  )\n}\n` },
  { prefix: 'rafce', label: 'React arrow component (default export)', body: (file) => `const \${1:${file}} = () => {\n  return (\n    <div>\n      $0\n    </div>\n  )\n}\n\nexport default \${1:${file}}\n` },
  { prefix: 'rfcp', label: 'React component with typed props', body: (file) => `type \${1:${file}}Props = {\n  \${2:title}: \${3:string}\n}\n\nexport function \${1:${file}}({ \${2:title} }: \${1:${file}}Props) {\n  return (\n    <div>\n      {\${2:title}}$0\n    </div>\n  )\n}\n` },
  { prefix: 'us', label: 'useState', body: () => 'const [${1:value}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initial})$0' },
  { prefix: 'ue', label: 'useEffect', body: () => 'useEffect(() => {\n  $0\n}, [${1}])' },
  { prefix: 'uec', label: 'useEffect with cleanup', body: () => 'useEffect(() => {\n  $0\n  return () => {\n    ${2}\n  }\n}, [${1}])' },
  { prefix: 'ur', label: 'useRef', body: () => 'const ${1:ref} = useRef<${2:HTMLDivElement}>(null)$0' },
  { prefix: 'um', label: 'useMemo', body: () => 'const ${1:value} = useMemo(() => ${2:compute()}, [${3}])$0' },
  { prefix: 'ucb', label: 'useCallback', body: () => 'const ${1:handler} = useCallback(() => {\n  $0\n}, [${2}])' },
  { prefix: 'imr', label: 'import React hooks', body: () => "import { ${1:useState} } from 'react'$0" },
  { prefix: 'imc', label: 'import component', body: () => "import { ${1:Component} } from './${2:components/${1:Component}}'$0" },
  { prefix: 'clg', label: 'console.log', body: () => 'console.log(${1:value})$0' },
  { prefix: 'jmap', label: 'JSX list map', body: () => '{${1:items}.map((${2:item}) => (\n  <${3:li} key={${2:item}.${4:id}}>{${2:item}.${5:name}}</${3:li}>\n))}$0' },
  { prefix: 'jcond', label: 'JSX conditional', body: () => '{${1:condition} && (\n  $0\n)}' },
  { prefix: 'jtern', label: 'JSX ternary', body: () => '{${1:condition} ? (\n  ${2}\n) : (\n  ${3}\n)}$0' },
  { prefix: 'hclick', label: 'onClick handler', body: () => 'onClick={() => ${1:setOpen((open) => !open)}}$0' },
]

export function registerReactSnippets(monaco: typeof Monaco) {
  const provider: Monaco.languages.CompletionItemProvider = {
    provideCompletionItems(model, position) {
      if (!settingsStore.get().reactSnippets) return { suggestions: [] }
      const word = model.getWordUntilPosition(position)
      const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn)
      const file = componentName(model.uri.path.replace(/^\//, ''))
      return {
        suggestions: SNIPPETS.map((snippet) => ({
          label: { label: snippet.prefix, description: snippet.label },
          kind: monaco.languages.CompletionItemKind.Snippet,
          detail: `React snippet · ${snippet.label}`,
          insertText: snippet.body(file),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: snippet.body(file).replace(/\$\{\d+:?([^}]*)\}/g, '$1').replace(/\$\d/g, ''),
          sortText: `0${snippet.prefix}`,
          range,
        })),
      }
    },
  }
  monaco.languages.registerCompletionItemProvider('typescript', provider)
  monaco.languages.registerCompletionItemProvider('javascript', provider)
}

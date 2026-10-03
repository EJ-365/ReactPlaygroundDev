import { settingsStore } from './settings'

type Parser = 'typescript' | 'babel' | 'css' | 'html'

function parserFor(path: string): Parser | null {
  if (/\.(tsx|ts|mts)$/.test(path)) return 'typescript'
  if (/\.(jsx|js|mjs|cjs)$/.test(path)) return 'babel'
  if (path.endsWith('.css')) return 'css'
  if (path.endsWith('.html')) return 'html'
  return null
}

export function canFormat(path: string) {
  return parserFor(path) !== null
}

export async function formatSource(path: string, source: string) {
  const parser = parserFor(path)
  if (!parser) return source
  const [prettier, babel, estree, typescript, postcss, html] = await Promise.all([
    import('prettier/standalone'),
    import('prettier/plugins/babel'),
    import('prettier/plugins/estree'),
    import('prettier/plugins/typescript'),
    import('prettier/plugins/postcss'),
    import('prettier/plugins/html'),
  ])
  const settings = settingsStore.get()
  return prettier.format(source, {
    parser,
    filepath: path,
    plugins: [babel, estree, typescript, postcss, html],
    tabWidth: settings.tabSize,
    semi: settings.formatSemicolons,
    singleQuote: settings.formatSingleQuote,
    jsxSingleQuote: false,
    trailingComma: 'all',
    printWidth: settings.formatPrintWidth,
    bracketSameLine: false,
    arrowParens: 'always',
  })
}

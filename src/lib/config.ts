export function readTailwindConfig(source: string | undefined): { config: Record<string, unknown>; error?: string; warning?: string } {
  if (!source?.trim()) return { config: { content: [], plugins: [] } }
  try {
    const code = source.replace(/export\s+default\s+/, 'module.exports = ')
    const moduleRef = { exports: {} as Record<string, unknown> }
    const produced = new Function(
      'module',
      'exports',
      'require',
      `${code}\nreturn module.exports && Object.keys(module.exports).length ? module.exports : exports`,
    )(moduleRef, moduleRef.exports, () => ({})) as Record<string, unknown>
    const config = produced && typeof produced === 'object' && !Array.isArray(produced) ? produced : {}
    let warning: string | undefined
    if (Array.isArray(config.plugins) && config.plugins.length > 0) {
      warning = 'Tailwind plugins are skipped in the browser. Theme values still apply.'
    }
    const plain = JSON.parse(JSON.stringify(config)) as Record<string, unknown>
    plain.content = []
    plain.plugins = []
    return { config: plain, warning }
  } catch (error) {
    return {
      config: { content: [], plugins: [] },
      error: error instanceof Error ? error.message : 'Could not read tailwind.config.js',
    }
  }
}

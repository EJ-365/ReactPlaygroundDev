export const PREVIEW_CHANNEL = 'rp'
export const REACT_VERSION = '19.1.1'

const REACT_BASE = `https://esm.sh/react@${REACT_VERSION}`
const REACT_DOM_BASE = `https://esm.sh/react-dom@${REACT_VERSION}`

const ANY_SCRIPT = /<script\b[^>]*>[\s\S]*?<\/script>/gi

export function escapeScript(code: string) {
  return code.replace(/<\/script/gi, '<\\/script')
}

export function escapeStyle(code: string) {
  return code.replace(/<\/style/gi, '<\\/style')
}

export function splitDocument(source: string) {
  const html = source.trim()
  if (!/<html[\s>]/i.test(html) && !/<body[\s>]/i.test(html) && !/<head[\s>]/i.test(html)) {
    return { head: '', body: source }
  }
  const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? ''
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const body = bodyMatch
    ? bodyMatch[1]
    : html.replace(/<\/?html[^>]*>/gi, '').replace(/<head[^>]*>[\s\S]*?<\/head>/i, '')
  return { head, body }
}

function bridgeScript() {
  const code = bridgeSource()
  const map = {
    version: 3,
    sources: ['playground-console-bridge.js'],
    names: [],
    mappings: `AAAA${';AACA'.repeat(code.split('\n').length - 1)}`,
    x_google_ignoreList: [0],
  }
  return `${code}\n//# sourceMappingURL=data:application/json;base64,${btoa(JSON.stringify(map))}`
}

function bridgeSource() {
  return `(() => {
    const CHANNEL = ${JSON.stringify(PREVIEW_CHANNEL)};
    const send = (payload) => parent.postMessage(Object.assign({ channel: CHANNEL }, payload), '*');
    const seen = new WeakSet();
    const ser = (value, depth) => {
      if (value === null) return { t: 'null' };
      if (value === undefined) return { t: 'undefined' };
      const kind = typeof value;
      if (kind === 'string') return { t: 'string', v: value.length > 4000 ? value.slice(0, 4000) + '…' : value };
      if (kind === 'number') return { t: 'number', v: Object.is(value, -0) ? '-0' : String(value) };
      if (kind === 'boolean') return { t: 'boolean', v: value };
      if (kind === 'bigint') return { t: 'bigint', v: value.toString() + 'n' };
      if (kind === 'symbol') return { t: 'symbol', v: String(value) };
      if (kind === 'function') return { t: 'function', v: value.name ? 'ƒ ' + value.name : 'ƒ' };
      if (depth > 4) return { t: 'max' };
      if (typeof Element !== 'undefined' && value instanceof Element) {
        const id = value.id ? '#' + value.id : '';
        const cls = typeof value.className === 'string' && value.className
          ? '.' + value.className.trim().split(/\\s+/).slice(0, 2).join('.')
          : '';
        return { t: 'element', v: value.tagName.toLowerCase() + id + cls };
      }
      if (value instanceof Error) return { t: 'error', name: value.name || 'Error', message: value.message || '', stack: value.stack || '' };
      if (seen.has(value)) return { t: 'circular' };
      seen.add(value);
      try {
        if (Array.isArray(value)) {
          return { t: 'array', length: value.length, v: value.slice(0, 40).map((item) => ser(item, depth + 1)) };
        }
        const name = value.constructor && value.constructor.name && value.constructor.name !== 'Object' ? value.constructor.name : 'Object';
        return {
          t: 'object',
          name,
          v: Object.keys(value).slice(0, 40).map((key) => ({ k: key, v: ser(value[key], depth + 1) }))
        };
      } catch (error) {
        return { t: 'string', v: String(error) };
      } finally {
        seen.delete(value);
      }
    };
    ['log', 'info', 'warn', 'error', 'debug'].forEach((level) => {
      const original = console[level].bind(console);
      console[level] = (...args) => {
        send({ type: 'console', level, args: args.map((item) => ser(item, 0)) });
        original(...args);
      };
    });
    const paint = (text) => {
      let node = document.getElementById('__pg_err');
      if (!node) {
        node = document.createElement('pre');
        node.id = '__pg_err';
        node.style.cssText = 'position:fixed;z-index:2147483646;left:12px;right:12px;bottom:12px;margin:0;padding:12px 14px;border-radius:14px;background:#3b1720;color:#ffe4e6;font:12px/1.45 ui-monospace,monospace;white-space:pre-wrap;box-shadow:0 16px 40px rgba(0,0,0,.35)';
        (document.body || document.documentElement).appendChild(node);
      }
      node.textContent = text;
    };
    window.addEventListener('error', (event) => {
      const text = (event.error && (event.error.stack || event.error.message)) || event.message || 'Script error';
      send({ type: 'console', level: 'error', args: [ser(event.error || new Error(text), 0)] });
      paint(String(text));
    });
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      send({ type: 'console', level: 'error', args: [ser(reason, 0)] });
      paint(reason.stack || reason.message);
    });
    window.addEventListener('message', async (event) => {
      const data = event.data;
      if (!data || data.channel !== CHANNEL || data.type !== 'eval') return;
      try {
        const value = await (0, eval)(data.code);
        send({ type: 'eval-result', id: data.id, ok: true, value: ser(value, 0) });
      } catch (error) {
        send({ type: 'eval-result', id: data.id, ok: false, value: ser(error, 0) });
      }
    });
    document.addEventListener('click', (event) => {
      const anchor = event.target && event.target.closest ? event.target.closest('a') : null;
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';
      if (!href || href.startsWith('#')) return;
      event.preventDefault();
      window.open(anchor.href, '_blank', 'noopener');
    });
  })();`
}

export function buildPreviewDocument(input: {
  html: string
  css: string
  appJs: string
  vanillaJs: string
  useCdn: boolean
  plain?: boolean
}) {
  const split = splitDocument(input.html)
  const head = split.head
  const body = input.plain ? split.body : split.body.replace(ANY_SCRIPT, '')
  const viewport = /name=["']viewport["']/i.test(head)
    ? ''
    : '<meta name="viewport" content="width=device-width, initial-scale=1" />'
  const importMap = {
    imports: {
      react: REACT_BASE,
      'react/jsx-runtime': `${REACT_BASE}/jsx-runtime`,
      'react/jsx-dev-runtime': `${REACT_BASE}/jsx-dev-runtime`,
      'react-dom': `${REACT_DOM_BASE}?external=react`,
      'react-dom/client': `${REACT_DOM_BASE}/client?external=react`,
    },
  }
  const module = `${input.appJs}
await new Promise((resolve) => setTimeout(resolve, 0));
await new Promise((resolve) => requestAnimationFrame(resolve));
const __vanilla = ${JSON.stringify(input.vanillaJs)};
if (__vanilla.trim()) {
  const __url = URL.createObjectURL(new Blob([__vanilla], { type: 'text/javascript' }));
  try { await import(__url); }
  finally { URL.revokeObjectURL(__url); }
}
`
  const hasModule = Boolean(input.appJs.trim() || input.vanillaJs.trim())
  const styles = input.css.trim() || !input.plain ? `<style id="__pg_css">${escapeStyle(input.css)}</style>` : ''
  return `<!doctype html>
<html lang="en"${input.plain ? '' : ' class="dark"'}>
<head>
<meta charset="utf-8" />
${viewport}
<script type="importmap">${JSON.stringify(importMap)}</script>
<script>${bridgeScript()}</script>
${input.useCdn ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
${input.plain ? styles : ''}
${head}
${input.plain ? '' : `<style>html,body{margin:0;min-height:100%;background:#090b10;color:#e8eaef}</style>\n${styles}`}
</head>
<body>
${body}
${hasModule ? `<script type="module">${escapeScript(module)}</script>` : ''}
</body>
</html>`
}

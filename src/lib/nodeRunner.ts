export type Stream = 'out' | 'err'

export type RunHandle = {
  stop: () => void
  done: Promise<number>
}

const PRELUDE = String.raw`(() => {
  const post = (message) => self.postMessage(message);
  const tag = (value) => Object.prototype.toString.call(value).slice(8, -1);
  const quote = (text) => "'" + String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
  const keyOf = (key) => (/^[A-Za-z_$][\w$]*$/.test(key) ? key : quote(key));
  const errorText = (error) => (error && typeof error === 'object' && 'message' in error ? (error.name || 'Error') + ': ' + error.message : String(error));
  const wrap = (open, items, close, indent) => {
    if (!items.length) return open.trim() + close.trim();
    const flat = open + ' ' + items.join(', ') + ' ' + close;
    if (flat.length <= 72 && !flat.includes('\n')) return flat;
    const pad = '  '.repeat(indent + 1);
    return open + '\n' + items.map((item) => pad + item).join(',\n') + '\n' + '  '.repeat(indent) + close;
  };
  const inspect = (value, depth, seen, top) => {
    if (typeof value === 'string') return top ? value : quote(value);
    if (typeof value === 'bigint') return value + 'n';
    if (typeof value === 'symbol') return value.toString();
    if (typeof value === 'function') {
      const source = Function.prototype.toString.call(value);
      if (/^class\b/.test(source)) return '[class ' + (value.name || '(anonymous)') + ']';
      return '[Function: ' + (value.name || '(anonymous)') + ']';
    }
    if (value === null || typeof value !== 'object') return String(value);
    if (seen.has(value)) return '[Circular]';
    if (value instanceof Error) return value.stack && /^\w*Error/.test(value.stack) ? errorText(value) : errorText(value);
    if (value instanceof Date) return isNaN(value) ? 'Invalid Date' : value.toISOString();
    if (value instanceof RegExp) return String(value);
    if (value instanceof Promise) return 'Promise { <pending> }';
    if (value instanceof WeakMap || value instanceof WeakSet) return tag(value) + ' { <items unknown> }';
    const name = value.constructor && value.constructor.name;
    if (depth > 2) return Array.isArray(value) ? '[Array]' : '[' + (name || 'Object') + ']';
    seen.add(value);
    let out;
    if (Array.isArray(value)) {
      const items = value.slice(0, 100).map((item) => inspect(item, depth + 1, seen, false));
      if (value.length > 100) items.push('... ' + (value.length - 100) + ' more items');
      out = wrap('[', items, ']', depth);
    } else if (value instanceof Map) {
      out = wrap('Map(' + value.size + ') {', [...value].map(([k, v]) => inspect(k, depth + 1, seen, false) + ' => ' + inspect(v, depth + 1, seen, false)), '}', depth);
    } else if (value instanceof Set) {
      out = wrap('Set(' + value.size + ') {', [...value].map((v) => inspect(v, depth + 1, seen, false)), '}', depth);
    } else if (ArrayBuffer.isView(value)) {
      out = wrap(tag(value) + '(' + value.length + ') [', Array.from(value).slice(0, 100).map(String), ']', depth);
    } else {
      const items = Object.keys(value).map((key) => keyOf(key) + ': ' + inspect(value[key], depth + 1, seen, false));
      const prefix = name && name !== 'Object' ? name + ' ' : !name ? '[Object: null prototype] ' : '';
      out = prefix + wrap('{', items, '}', depth);
    }
    seen.delete(value);
    return out;
  };
  const format = (args) => {
    let rest = args;
    let head = '';
    if (typeof args[0] === 'string' && /%[sdifoOjc%]/.test(args[0])) {
      let index = 1;
      head = args[0].replace(/%([sdifoOjc%])/g, (match, kind) => {
        if (kind === '%') return '%';
        if (index >= args.length) return match;
        const arg = args[index++];
        if (kind === 's') return typeof arg === 'string' ? arg : inspect(arg, 1, new Set(), false);
        if (kind === 'd' || kind === 'i') return String(kind === 'i' ? parseInt(arg) : Number(arg));
        if (kind === 'f') return String(parseFloat(arg));
        if (kind === 'c') return '';
        return inspect(arg, 0, new Set(), false);
      });
      rest = args.slice(index);
      return [head, ...rest.map((arg) => inspect(arg, 0, new Set(), true))].join(' ');
    }
    return rest.map((arg) => inspect(arg, 0, new Set(), true)).join(' ');
  };
  let indent = '';
  const print = (stream, args) => {
    const text = format(args);
    post({ type: 'out', stream, text: indent ? text.split('\n').map((line) => indent + line).join('\n') : text });
  };
  const counts = new Map();
  const times = new Map();
  const make = (stream) => (...args) => print(stream, args);
  self.console = {
    ...console,
    log: make('out'), info: make('out'), debug: make('out'), dir: make('out'), table: make('out'), trace: make('err'),
    warn: make('err'), error: make('err'),
    assert: (ok, ...args) => { if (!ok) print('err', ['Assertion failed' + (args.length ? ':' : ''), ...args]); },
    clear: () => post({ type: 'clear' }),
    count: (label = 'default') => { const next = (counts.get(label) || 0) + 1; counts.set(label, next); print('out', [label + ': ' + next]); },
    countReset: (label = 'default') => counts.delete(label),
    time: (label = 'default') => times.set(label, performance.now()),
    timeLog: (label = 'default', ...args) => times.has(label) && print('out', [label + ': ' + (performance.now() - times.get(label)).toFixed(3) + 'ms', ...args]),
    timeEnd: (label = 'default') => { if (times.has(label)) { print('out', [label + ': ' + (performance.now() - times.get(label)).toFixed(3) + 'ms']); times.delete(label); } },
    group: (...args) => { if (args.length) print('out', args); indent += '  '; },
    groupCollapsed: (...args) => { if (args.length) print('out', args); indent += '  '; },
    groupEnd: () => { indent = indent.slice(2); },
  };
  const timers = new Set();
  const intervals = new Set();
  let pending = 0;
  let ended = false;
  let exited = false;
  const setT = self.setTimeout.bind(self);
  const clearT = self.clearTimeout.bind(self);
  const setI = self.setInterval.bind(self);
  const clearI = self.clearInterval.bind(self);
  const exit = (code) => { if (exited) return; exited = true; post({ type: 'exit', code }); };
  const check = () => {
    if (!ended || exited) return;
    setT(() => { if (!timers.size && !intervals.size && !pending) exit(0); }, 0);
  };
  self.setTimeout = (fn, ms, ...args) => {
    const id = setT(() => { timers.delete(id); try { if (typeof fn === 'function') fn(...args); } finally { check(); } }, ms);
    timers.add(id);
    return id;
  };
  self.clearTimeout = (id) => { timers.delete(id); clearT(id); check(); };
  self.setInterval = (fn, ms, ...args) => { const id = setI(fn, ms, ...args); intervals.add(id); return id; };
  self.clearInterval = (id) => { intervals.delete(id); clearI(id); check(); };
  if (self.fetch) {
    const fetchRaw = self.fetch.bind(self);
    self.fetch = (...args) => { pending += 1; return fetchRaw(...args).finally(() => { pending -= 1; check(); }); };
  }
  self.process = { argv: ['node'], env: { NODE_ENV: 'development' }, platform: 'browser', version: 'v22.0.0', versions: { node: '22.0.0' }, exit: (code = 0) => { exit(code); self.close(); }, cwd: () => '/' };
  self.addEventListener('error', (event) => {
    event.preventDefault();
    post({ type: 'out', stream: 'err', text: 'Uncaught ' + errorText(event.error ?? event.message) });
    exit(1);
  });
  self.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    post({ type: 'out', stream: 'err', text: 'Uncaught (in promise) ' + errorText(event.reason) });
    exit(1);
  });
  self.__pgEnd = () => { ended = true; check(); };
})();
`

export function runScript(js: string, onOutput: (stream: Stream, text: string) => void, onClear: () => void): RunHandle {
  const url = URL.createObjectURL(new Blob([`${PRELUDE}\n${js}\n;globalThis.__pgEnd();\n`], { type: 'text/javascript' }))
  const worker = new Worker(url, { type: 'module', name: 'node' })
  let settle: (code: number) => void = () => {}
  const done = new Promise<number>((resolve) => {
    let finished = false
    settle = (code) => {
      if (finished) return
      finished = true
      worker.terminate()
      URL.revokeObjectURL(url)
      resolve(code)
    }
  })
  worker.onmessage = (event: MessageEvent<{ type: string; stream?: Stream; text?: string; code?: number }>) => {
    const data = event.data
    if (data.type === 'out' && data.stream && data.text != null) onOutput(data.stream, data.text)
    else if (data.type === 'clear') onClear()
    else if (data.type === 'exit') settle(data.code ?? 0)
  }
  worker.onerror = (event) => {
    event.preventDefault()
    onOutput('err', event.message || 'The script could not start. Check imports from packages and your network connection.')
    settle(1)
  }
  return { stop: () => settle(130), done }
}

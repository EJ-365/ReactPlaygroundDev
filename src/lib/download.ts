import { DEFAULT_FILES } from '../defaults'
import { zipStore } from './zip'

function viteIndex(userHtml: string, includeScript: boolean) {
  const hasDocument = /<html[\s>]/i.test(userHtml)
  let html = hasDocument
    ? userHtml
    : `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + Tailwind</title>
  </head>
  <body>
${userHtml}
  </body>
</html>`
  if (!html.includes('/src/main.tsx')) {
    html = html.replace(/<\/body>/i, '    <script type="module" src="/src/main.tsx"></script>\n  </body>')
  }
  if (includeScript && !html.includes('/src/script.js')) {
    html = html.replace(/<\/body>/i, '    <script type="module" src="/src/script.js"></script>\n  </body>')
  }
  return html
}

export function downloadProject(files: Record<string, string>) {
  const includeScript = Boolean(files['script.js']?.trim())
  const packed: { name: string; text: string }[] = [
    { name: 'react-playground/package.json', text: packageJson },
    { name: 'react-playground/vite.config.ts', text: viteConfig },
    { name: 'react-playground/tsconfig.json', text: tsconfig },
    { name: 'react-playground/tsconfig.app.json', text: tsconfigApp },
    { name: 'react-playground/postcss.config.js', text: postcssConfig },
    { name: 'react-playground/tailwind.config.js', text: files['tailwind.config.js'] || DEFAULT_FILES['tailwind.config.js'] },
    { name: 'react-playground/index.html', text: viteIndex(files['index.html'] || DEFAULT_FILES['index.html'], includeScript) },
    { name: 'react-playground/src/vite-env.d.ts', text: `/// <reference types="vite/client" />\n` },
    { name: 'react-playground/.gitignore', text: `node_modules\ndist\n.DS_Store\n` },
    { name: 'react-playground/README.md', text: readme },
  ]
  for (const [path, text] of Object.entries(files)) {
    if (path === 'index.html' || path === 'tailwind.config.js') continue
    packed.push({ name: `react-playground/src/${path}`, text })
  }
  saveBlob(zipStore(packed), 'react-playground.zip')
}

export function downloadWebProject(files: Record<string, string>) {
  const packed = Object.entries(files).map(([path, text]) => ({ name: `web-project/${path}`, text: path === 'index.html' ? webIndex(text, files) : text }))
  saveBlob(zipStore(packed), 'web-project.zip')
}

function webIndex(userHtml: string, files: Record<string, string>) {
  let html = /<html[\s>]/i.test(userHtml)
    ? userHtml
    : `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Web project</title>
  </head>
  <body>
${userHtml}
  </body>
</html>
`
  if ('tailwind.config.js' in files && !html.includes('cdn.tailwindcss.com')) {
    html = html.replace(/<\/head>/i, '    <script src="https://cdn.tailwindcss.com"></script>\n  </head>')
  }
  return html
}

export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function downloadFile(path: string, text: string) {
  saveBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), path.split('/').pop() || 'file.txt')
}

export function downloadFiles(files: Record<string, string>, folder = '') {
  const prefix = folder ? `${folder}/` : ''
  const root = folder ? folder.split('/').pop()! : 'playground-files'
  const packed = Object.entries(files)
    .filter(([path]) => !prefix || path.startsWith(prefix))
    .map(([path, text]) => ({ name: `${root}/${path.slice(prefix.length)}`, text }))
  saveBlob(zipStore(packed), `${root}.zip`)
  return packed.length
}

const packageJson = `{
  "name": "react-playground",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.app.json --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1"
  },
  "devDependencies": {
    "@types/react": "^19.1.13",
    "@types/react-dom": "^19.1.9",
    "@vitejs/plugin-react": "^5.0.3",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.9.2",
    "vite": "^7.1.7"
  }
}
`

const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`

const tsconfig = `{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }]
}
`

const tsconfigApp = `{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["src"]
}
`

const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`

const readme = `# React playground

This folder is a Vite + React + Tailwind app exported from the playground.

\`\`\`bash
npm install
npm run dev
\`\`\`

Open the URL Vite prints. \`src/main.tsx\` mounts the app into \`#root\`.
`

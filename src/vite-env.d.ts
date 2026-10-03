/// <reference types="vite/client" />

declare module 'esbuild-wasm/esm/browser.js' {
  export * from 'esbuild-wasm'
}

declare module 'monaco-editor/esm/vs/basic-languages/typescript/typescript.js' {
  import type { languages } from 'monaco-editor'
  export const conf: languages.LanguageConfiguration
  export const language: languages.IMonarchLanguage
}

declare module 'monaco-editor/esm/vs/basic-languages/javascript/javascript.js' {
  import type { languages } from 'monaco-editor'
  export const conf: languages.LanguageConfiguration
  export const language: languages.IMonarchLanguage
}
